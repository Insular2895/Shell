/**
 * lib/runner.ts
 *
 * Pont Shell ↔ Engine.
 *
 * Modes (résolus dans cet ordre) :
 *   1. site_config.engine_mode === 'mock' → mock (override low-cost)
 *   2. site_config.engine_mode === 'maintenance' → erreur 503
 *   3. ENV ENGINE_MODE === 'docker' | 'http' | 'mock'
 *
 * Patterns appliqués (system-design-101) :
 *   - Circuit breaker pour mode HTTP (closed/open/half-open)
 *   - Exponential backoff + jitter sur les retries
 *   - Idempotency-Key = job_id pour permettre safe retries côté engine
 *   - Timeout dur côté Shell (60s) — l'engine peut tourner plus longtemps
 *
 * Cette fonction est appelée par le worker externe, PAS par /api/jobs/create.
 * Voir scripts/dev-worker.ts pour un worker local minimal.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { RunResult } from '@/config/result.schema';
import {
  withBreaker,
  retryWithBackoff,
  CircuitBreakerOpenError,
} from './circuitBreaker';
import { createServiceRoleClient } from './supabase/server';

type RunPayload = {
  user_id: string;
  job_id: string;
  product_id: string;
  input: Record<string, unknown>;
};

const ENGINE_MODE = process.env.ENGINE_MODE || 'mock';

/**
 * Lit site_config pour permettre le bascule global vers mock/maintenance.
 * Cache 30s pour ne pas spammer la DB depuis le worker.
 */
let _cfgCache: { mode: string; expiresAt: number } | null = null;
async function getEffectiveMode(): Promise<'live' | 'mock' | 'maintenance'> {
  if (_cfgCache && _cfgCache.expiresAt > Date.now()) {
    return _cfgCache.mode as 'live' | 'mock' | 'maintenance';
  }
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('site_config')
      .select('engine_mode')
      .eq('id', true)
      .maybeSingle();
    const mode = (data?.engine_mode ?? 'live') as 'live' | 'mock' | 'maintenance';
    _cfgCache = { mode, expiresAt: Date.now() + 30_000 };
    return mode;
  } catch {
    return 'live'; // fail-open : si DB indispo, on tente quand même
  }
}

export async function runEngine(payload: RunPayload): Promise<RunResult> {
  const effective = await getEffectiveMode();

  if (effective === 'maintenance') {
    return {
      status: 'error',
      error: 'maintenance',
      blocks: [
        {
          type: 'warning',
          title: 'Service en maintenance',
          message:
            "Le service est temporairement en maintenance. Réessaye dans quelques minutes.",
          severity: 'info',
        },
      ],
    };
  }

  // Force mock si auto-degrade activé OU si mode env = mock
  if (effective === 'mock' || ENGINE_MODE === 'mock') {
    return runMock();
  }

  switch (ENGINE_MODE) {
    case 'docker':
      return runDocker(payload);
    case 'http':
      return runHttp(payload);
    default:
      throw new Error(`Unknown ENGINE_MODE: ${ENGINE_MODE}`);
  }
}

export async function runMockEngine(): Promise<RunResult> {
  return runMock();
}

// ----------------------------------------------------------------------------
// Mode docker (dev local avec moteur réel)
// ----------------------------------------------------------------------------
async function runDocker(payload: RunPayload): Promise<RunResult> {
  const tmpDir = await fs.mkdtemp(path.join('/tmp', `job-${payload.job_id}-`));
  const inputPath = path.join(tmpDir, 'input.json');
  const outputPath = path.join(tmpDir, 'output.json');

  await fs.writeFile(inputPath, JSON.stringify(payload), 'utf-8');

  const image = process.env.ENGINE_IMAGE || 'engine:local';
  const timeoutMs = Number(process.env.ENGINE_TIMEOUT_MS || 900_000); // 15 min

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'docker',
      [
        'run',
        '--rm',
        '--read-only',
        '--tmpfs',
        '/tmp:rw,size=100m',
        '--network',
        'bridge',
        '-v',
        `${tmpDir}:/data`,
        '-e',
        `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
        '-e',
        `SHELL_INTERNAL_URL=${process.env.SHELL_INTERNAL_URL || ''}`,
        '-e',
        `SHELL_SERVICE_TOKEN=${process.env.SHELL_SERVICE_TOKEN || ''}`,
        image,
        '--input',
        '/data/input.json',
        '--output',
        '/data/output.json',
      ],
      { stdio: 'inherit' },
    );

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('engine_timeout'));
    }, timeoutMs);

    proc.on('exit', (code) => {
      clearTimeout(timer);
      // 0 = success, 2 = engine returned status:error proprement
      if (code === 0 || code === 2) resolve();
      else reject(new Error(`engine_exit_${code}`));
    });
  });

  const raw = await fs.readFile(outputPath, 'utf-8');
  return JSON.parse(raw) as RunResult;
}

// ----------------------------------------------------------------------------
// Mode HTTP avec circuit breaker + retry+backoff
// ----------------------------------------------------------------------------
async function runHttp(payload: RunPayload): Promise<RunResult> {
  const url = process.env.ENGINE_URL;
  if (!url) throw new Error('ENGINE_URL is required when ENGINE_MODE=http');

  const breakerKey = `engine:${new URL(url).host}`;

  try {
    return await withBreaker(breakerKey, () =>
      retryWithBackoff(
        async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60_000);
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ENGINE_TOKEN || ''}`,
                // Idempotency-Key permet à l'engine de dédupliquer les retries Shell
                'Idempotency-Key': payload.job_id,
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });

            // 5xx → retryable, throw pour déclencher backoff
            if (res.status >= 500) throw new Error(`engine_5xx_${res.status}`);
            // 4xx → erreur métier, pas retry
            if (!res.ok) {
              return {
                status: 'error' as const,
                error: `engine_http_${res.status}`,
                blocks: [],
              };
            }
            return (await res.json()) as RunResult;
          } finally {
            clearTimeout(timeout);
          }
        },
        { maxAttempts: 3, baseMs: 1000, maxMs: 10_000 },
      ),
    );
  } catch (err) {
    if (err instanceof CircuitBreakerOpenError) {
      // Circuit open : l'engine est en panne, on retourne un block warning user-friendly
      return {
        status: 'error',
        error: 'engine_unavailable',
        blocks: [
          {
            type: 'warning',
            title: 'Service temporairement indisponible',
            message:
              "Le moteur de traitement est en surcharge. Réessaye dans quelques minutes — ton crédit n'a pas été consommé.",
            severity: 'warning',
          },
        ],
      };
    }
    throw err;
  }
}

// ----------------------------------------------------------------------------
// Mode mock (dev / auto-degrade)
// ----------------------------------------------------------------------------
async function runMock(): Promise<RunResult> {
  await new Promise((r) => setTimeout(r, 1500));
  const examplePath = path.join(process.cwd(), 'engine', 'output.example.json');
  const raw = await fs.readFile(examplePath, 'utf-8');
  return JSON.parse(raw) as RunResult;
}

/**
 * scripts/dev-worker.ts
 *
 * Worker LOCAL pour le développement. Tu lances `npm run dev:worker` en
 * parallèle de `npm run dev`, et il poll /api/jobs/worker/claim pour traiter
 * les jobs comme un vrai worker Fly/Modal.
 *
 * Engine : appelle `python engine/run_engine.py` directement (mode local).
 * En prod, le worker tourne sur Fly avec Docker, voir worker/Dockerfile.
 *
 * Variables d'env requises (.env.local) :
 *   - WORKER_API_TOKEN    : doit matcher celui dans Vercel env
 *   - SHELL_URL           : http://localhost:3000 par défaut
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SHELL_URL = process.env.SHELL_URL ?? 'http://localhost:3000';
const TOKEN = process.env.WORKER_API_TOKEN;
const WORKER_ID = `dev-${os.hostname()}-${process.pid}`;
const POLL_MS = 3000;
const LEASE_S = 600;

if (!TOKEN) {
  console.error('[dev-worker] WORKER_API_TOKEN required in .env.local');
  process.exit(1);
}

type Job = {
  id: string;
  user_id: string;
  product_id: string;
  input: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

async function claim(): Promise<Job | null> {
  const res = await fetch(`${SHELL_URL}/api/jobs/worker/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ worker_id: WORKER_ID, lease_seconds: LEASE_S }),
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    console.error(`[dev-worker] claim ${res.status}`);
    return null;
  }
  const json = (await res.json()) as { job: Job };
  return json.job;
}

async function complete(
  jobId: string,
  status: 'success' | 'error',
  result: unknown,
  error: string | null,
  durationMs: number,
  retryable: boolean,
) {
  await fetch(`${SHELL_URL}/api/jobs/worker/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      job_id: jobId,
      worker_id: WORKER_ID,
      status,
      result,
      error,
      duration_ms: durationMs,
      retryable,
    }),
  });
}

async function runEngine(job: Job): Promise<{ status: string; result: unknown; error: string | null; ms: number }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `job-${job.id}-`));
  const inputPath = path.join(tmpDir, 'input.json');
  const outputPath = path.join(tmpDir, 'output.json');

  await fs.writeFile(
    inputPath,
    JSON.stringify({
      user_id: job.user_id,
      job_id: job.id,
      product_id: job.product_id,
      input: job.input,
    }),
  );

  const started = Date.now();
  return new Promise((resolve) => {
    const proc = spawn(
      'python3',
      ['engine/run_engine.py', '--input', inputPath, '--output', outputPath],
      { stdio: 'inherit' },
    );
    const timer = setTimeout(() => proc.kill('SIGKILL'), (LEASE_S - 30) * 1000);
    proc.on('exit', async (code) => {
      clearTimeout(timer);
      const ms = Date.now() - started;
      if (code === 0) {
        const out = JSON.parse(await fs.readFile(outputPath, 'utf-8'));
        resolve({ status: 'success', result: out, error: null, ms });
      } else if (code === 2) {
        const out = JSON.parse(await fs.readFile(outputPath, 'utf-8'));
        resolve({
          status: 'error',
          result: out,
          error: out.error || 'engine_status_error',
          ms,
        });
      } else {
        resolve({ status: 'error', result: null, error: `engine_exit_${code}`, ms });
      }
    });
  });
}

async function main() {
  console.log(`[dev-worker] starting ${WORKER_ID} polling ${SHELL_URL}`);
  for (;;) {
    try {
      const job = await claim();
      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }
      console.log(`[dev-worker] claimed ${job.id}`);
      const out = await runEngine(job);
      const retryable = out.status === 'error' && job.attempts < job.max_attempts;
      await complete(
        job.id,
        out.status as 'success' | 'error',
        out.result,
        out.error,
        out.ms,
        retryable,
      );
      console.log(`[dev-worker] done ${job.id} ${out.status} ${out.ms}ms`);
    } catch (err) {
      const t = err instanceof Error ? err.constructor.name : 'Unknown';
      console.error(`[dev-worker] loop error: ${t}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main();

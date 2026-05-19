/**
 * /api/jobs/create
 *
 * Crée un job. Deux comportements :
 *
 *   - site_config.engine_mode === 'mock' (auto-degrade ou démo) :
 *     Crée le job ET le complète en synchrone avec output.example.json,
 *     en moins de 2s. Pas de worker requis. Coût engine = 0€.
 *
 *   - mode 'live' (production normale) :
 *     Crée le job en `pending` et retourne 202. Un worker externe
 *     (Fly/Railway/Modal) le ramasse via /api/jobs/worker/claim.
 *     Le client poll /api/jobs/{id} pour voir le résultat.
 *
 * Pourquoi NE PAS lancer l'engine ici en serverless :
 *   La v1 utilisait `void (async () => runEngine())()` après la réponse HTTP.
 *   Sur Vercel serverless, l'invocation peut être tuée dès que la réponse
 *   part. Résultat : jobs bloqués en `pending` indéfiniment.
 *
 * Garde-fous (corrections v2) :
 *   - Rate limit 10 jobs / min / user (anti-bill-shock)
 *   - Validation Ajv stricte de body.input (refuse keys non déclarées)
 *   - Quota atomique
 *   - site_config.engine_mode='maintenance' → 503
 */

import { NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { createJob, createJobWithQuota, updateJobStatus } from '@/lib/jobs';
import { checkQuota } from '@/lib/quota';
import { rateLimit } from '@/lib/rateLimit';
import { validateRunInput } from '@/lib/runSchemaValidator';
import { runEngine } from '@/lib/runner';
import { createServiceRoleClient } from '@/lib/supabase/server';
import productConfig from '@/config/product.config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30; // assez pour le mock synchrone

export async function POST(req: Request) {
  // 1. Auth
  const { user, response } = await requireUserOr401();
  if (response) return response;

  // 2. Lis le mode global
  const supabase = createServiceRoleClient();
  const { data: cfg } = await supabase
    .from('site_config')
    .select('engine_mode, reason')
    .eq('id', true)
    .maybeSingle();

  const mode = cfg?.engine_mode ?? 'live';

  if (mode === 'maintenance') {
    return NextResponse.json(
      { error: 'maintenance', reason: cfg?.reason ?? 'temporarily unavailable' },
      { status: 503, headers: { 'Retry-After': '300' } },
    );
  }

  // 3. Rate limit anti-spam (anti-bill-shock)
  const rl = rateLimit(`jobs.create:${user!.id}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAt: rl.resetAt },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.resetAt),
        },
      },
    );
  }

  // 4. Quota du plan
  const quota = await checkQuota(user!.id);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason || 'quota_exceeded' },
      { status: 402 },
    );
  }

  // 5. Parse body
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 256 * 1024) {
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 6. Validation stricte (FIX v2 — bug v1: aucune validation serveur)
  const inputCandidate = (body as { input?: unknown })?.input ?? {};
  const validation = validateRunInput(inputCandidate);
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'invalid_input', details: validation.errors.slice(0, 5) },
      { status: 400 },
    );
  }

  // 7. Création du job. Pour les plans bornés, création + quota sont atomiques
  // dans Postgres pour éviter les dépassements par requêtes concurrentes.
  const job =
    quota.runsLimit === 'unlimited'
      ? await createJob({
          userId: user!.id,
          productId: productConfig.id,
          input: validation.value,
        })
      : await createJobWithQuota({
          userId: user!.id,
          productId: productConfig.id,
          input: validation.value,
          periodStart: quota.periodStart!,
          periodEnd: quota.periodEnd!,
          limit: quota.runsLimit!,
        });

  if (!job) {
    return NextResponse.json(
      { error: 'quota_exceeded' },
      { status: 402 },
    );
  }

  // 8. Mode mock → complétion synchrone (pas de worker)
  // Mode live → on retourne 202 et on laisse le worker bosser
  if (mode === 'mock' || process.env.ENGINE_MODE === 'mock') {
    try {
      const result = await runEngine({
        user_id: user!.id,
        job_id: job.id,
        product_id: productConfig.id,
        input: validation.value,
      });
      await updateJobStatus(
        job.id,
        result.status === 'success' ? 'success' : 'error',
        { result, error: result.error || null },
      );
      return NextResponse.json({
        jobId: job.id,
        status: result.status,
        result,
      });
    } catch (err) {
      const errType = err instanceof Error ? err.constructor.name : 'UnknownError';
      console.error(`[jobs.create] mock failed job=${job.id}: ${errType}`);
      await updateJobStatus(job.id, 'error', {
        error: `${errType}: mock_failed`,
      });
      return NextResponse.json(
        { jobId: job.id, status: 'error', error: 'mock_failed' },
        { status: 500 },
      );
    }
  }

  // Mode live : queue, worker pickup
  return NextResponse.json(
    {
      jobId: job.id,
      status: 'pending',
      message: 'Job queued. Poll /api/jobs/{id} for status.',
    },
    { status: 202 },
  );
}

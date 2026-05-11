/**
 * /api/jobs/worker/complete
 *
 * Le worker appelle ce endpoint pour signaler la fin d'un job (success ou
 * error). On enregistre dans `jobs` ET on logue une ligne dans `job_attempts`
 * (audit/debug).
 *
 * En cas d'erreur retryable (status='error' ET attempts < max_attempts),
 * on remet le job en 'pending' pour qu'un worker (peut-être le même) le
 * reprenne avec backoff. Sinon on le passe en 'error' définitif.
 *
 * Body JSON :
 * {
 *   "job_id": "uuid",
 *   "worker_id": "fly-machine-abc123",
 *   "status": "success" | "error",
 *   "result": { ... }    // requis si success
 *   "error": "string"    // requis si error
 *   "duration_ms": 4521  // optionnel
 *   "retryable": false   // si false, on ne retry pas même si attempts < max
 * }
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

type CompleteBody = {
  job_id?: string;
  worker_id?: string;
  status?: 'success' | 'error';
  result?: unknown;
  error?: string;
  duration_ms?: number;
  retryable?: boolean;
};

export async function POST(req: Request) {
  // Auth worker token
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${process.env.WORKER_API_TOKEN ?? ''}`;
  if (!process.env.WORKER_API_TOKEN || auth !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as CompleteBody;
  const { job_id, worker_id, status, result, error: errMsg, duration_ms, retryable } = body;

  if (!job_id || !worker_id || (status !== 'success' && status !== 'error')) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Vérifier que ce worker possède bien le lease (anti-stale-completion)
  const { data: job, error: fetchErr } = await supabase
    .from('jobs')
    .select('id, attempts, max_attempts, worker_id, status, lease_until')
    .eq('id', job_id)
    .maybeSingle();

  if (fetchErr || !job) {
    return NextResponse.json({ error: 'job_not_found' }, { status: 404 });
  }

  if (job.worker_id !== worker_id) {
    // Lease pris par un autre worker entre temps (lease expiré)
    return NextResponse.json({ error: 'lease_lost' }, { status: 409 });
  }

  // Log l'attempt (audit)
  await supabase.from('job_attempts').insert({
    job_id,
    attempt_number: job.attempts,
    worker_id,
    status,
    error: status === 'error' ? (errMsg ?? 'unknown') : null,
    duration_ms: duration_ms ?? null,
    finished_at: new Date().toISOString(),
  });

  // Décision : success / retry / final error
  let newStatus: 'success' | 'pending' | 'error';
  let updateData: Record<string, unknown> = {
    finished_at: new Date().toISOString(),
    lease_until: null,
    locked_at: null,
    worker_id: null,
  };

  if (status === 'success') {
    newStatus = 'success';
    updateData = {
      ...updateData,
      status: 'success',
      result,
      error: null,
      failed_reason: null,
    };
  } else {
    // error
    const canRetry = retryable !== false && job.attempts < job.max_attempts;
    if (canRetry) {
      // Remet en pending, un worker reprendra (backoff côté worker)
      newStatus = 'pending';
      updateData = {
        ...updateData,
        status: 'pending',
        failed_reason: errMsg ?? 'unknown',
      };
    } else {
      newStatus = 'error';
      updateData = {
        ...updateData,
        status: 'error',
        error: errMsg ?? 'unknown',
        failed_reason: errMsg ?? 'unknown',
      };
    }
  }

  const { error: updateErr } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', job_id);

  if (updateErr) {
    console.error(`[worker-complete] update error: ${updateErr.code}`);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, new_status: newStatus });
}

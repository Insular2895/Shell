/**
 * /api/jobs/worker/claim
 *
 * Endpoint appelé par un worker externe (Fly/Railway/Modal/cron) pour récupérer
 * le prochain job à traiter. Pattern PostgreSQL "SKIP LOCKED" via la fonction
 * SQL `claim_next_job(worker_id, lease_seconds)` qui garantit qu'un job n'est
 * jamais leasé 2x par 2 workers concurrents.
 *
 * Auth : header `Authorization: Bearer ${WORKER_API_TOKEN}`.
 * Le worker token est différent du token user — généré au déploiement, stocké
 * en var d'env Vercel ET côté worker.
 *
 * Réponse :
 *   - 200 + job  → job leasé, le worker doit le traiter avant lease_until
 *   - 204        → pas de job en attente, le worker peut sleep
 *   - 401        → token invalide
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${process.env.WORKER_API_TOKEN ?? ''}`;
  if (!process.env.WORKER_API_TOKEN || auth !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    worker_id?: string;
    lease_seconds?: number;
    product_id?: string;
  };

  const workerId = body.worker_id ?? `unknown-${Date.now()}`;
  const leaseSec = Math.min(body.lease_seconds ?? 900, 3600); // max 1h
  const productId = body.product_id ?? null;

  const supabase = createServiceRoleClient();

  // Atomic claim via PG function (SKIP LOCKED — pas de race entre workers)
  const { data, error } = await supabase.rpc('claim_next_job', {
    p_worker_id: workerId,
    p_lease_seconds: leaseSec,
    p_product_id: productId,
  });

  if (error) {
    console.error(`[worker-claim] db error: ${error.code}`);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // pas de job en attente
  if (!data) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({ job: data });
}

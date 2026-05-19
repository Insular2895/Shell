/**
 * /api/cron/auto-degrade
 *
 * MODE LOW-COST AUTOMATIQUE — appelé toutes les heures par Vercel Cron.
 *
 * Principe : le billing est la source de vérité du coût.
 *   - aucun abonnement actif/trialing payant -> engine_mode='mock'
 *   - au moins un abonnement actif/trialing payant -> engine_mode='live'
 *
 * Si WORKER_PROVIDER=fly est configuré, ce cron démarre/arrête aussi les
 * Machines Fly via l'API. Stripe fait la même synchro en temps réel, ce cron
 * sert de filet de sécurité.
 *
 * Variables d'env :
 *   - AUTO_DEGRADE_ENABLED : '1' pour activer (défaut '1')
 *
 * Idempotent : peut être appelé 100x, ne fait rien si rien à changer.
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { syncEngineModeFromBilling } from '@/lib/workerLifecycle';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Vérif cron token
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get('authorization') === `Bearer ${secret}` ||
    new URL(req.url).searchParams.get('secret') === secret;

  if (!secret || !provided) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (process.env.AUTO_DEGRADE_ENABLED === '0') {
    return NextResponse.json({ skipped: 'AUTO_DEGRADE_ENABLED=0' });
  }

  const supabase = createServiceRoleClient();

  const synced = await syncEngineModeFromBilling(supabase, 'cron:auto-degrade');

  return NextResponse.json({
    action: synced.previousMode === synced.mode ? 'no_change' : 'switched',
    from: synced.previousMode,
    to: synced.mode,
    paid_subscriptions: synced.paidSubscriptions,
    worker_runtime: synced.runtime,
  });
}

/**
 * /api/cron/auto-degrade
 *
 * MODE LOW-COST AUTOMATIQUE — appelé toutes les heures par Vercel Cron.
 *
 * Principe : si aucun utilisateur actif depuis N jours, on bascule
 * site_config.engine_mode='mock'. Le runner serveur (lib/runner.ts) lit
 * cette config et renvoie l'output.example.json au lieu d'appeler l'engine
 * Docker/HTTP. Effet : l'engine peut être éteint (Fly scale 0, Railway sleep,
 * Modal idle) → coût engine = 0€.
 *
 * Réveil automatique : dès qu'un signup ou un job est créé, un autre cron
 * (ou simplement une vérif côté /api/jobs/create) repasse en 'live'.
 *
 * Variables d'env :
 *   - AUTO_DEGRADE_DAYS    : seuil d'inactivité en jours (défaut 7)
 *   - AUTO_DEGRADE_ENABLED : '1' pour activer (défaut '1')
 *
 * Idempotent : peut être appelé 100x, ne fait rien si rien à changer.
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

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

  const days = Number(process.env.AUTO_DEGRADE_DAYS ?? '7');
  const supabase = createServiceRoleClient();

  // 1. Y a-t-il eu un job dans les N derniers jours ?
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { count: recentJobs } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);

  // 2. Y a-t-il un abonné payant actif ?
  // Si oui, on NE BASCULE PAS en mock (le client paye, on doit servir).
  const { count: paidSubs } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'trialing'])
    .neq('plan_id', 'free');

  const { data: cfg } = await supabase
    .from('site_config')
    .select('engine_mode')
    .eq('id', true)
    .maybeSingle();

  const currentMode = cfg?.engine_mode ?? 'live';
  const hasPaidSubs = (paidSubs ?? 0) > 0;
  const hasRecentActivity = (recentJobs ?? 0) > 0;

  // Logique :
  //   - paid subs présents ou activité récente → mode 'live'
  //   - aucun des deux → mode 'mock'
  const desiredMode: 'live' | 'mock' =
    hasPaidSubs || hasRecentActivity ? 'live' : 'mock';

  if (desiredMode === currentMode) {
    return NextResponse.json({
      action: 'no_change',
      mode: currentMode,
      paid_subs: paidSubs ?? 0,
      recent_jobs: recentJobs ?? 0,
    });
  }

  // Bascule
  const reason =
    desiredMode === 'mock'
      ? `auto-degrade: no activity since ${since}`
      : 'auto-restore: activity detected';

  await supabase
    .from('site_config')
    .update({
      engine_mode: desiredMode,
      reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true);

  return NextResponse.json({
    action: 'switched',
    from: currentMode,
    to: desiredMode,
    reason,
    paid_subs: paidSubs ?? 0,
    recent_jobs: recentJobs ?? 0,
  });
}

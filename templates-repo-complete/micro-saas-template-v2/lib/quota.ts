/**
 * lib/quota.ts
 *
 * Vérifie si l'utilisateur a encore des runs disponibles selon son plan.
 * Lit productConfig.pricing.plans + la table `subscriptions`.
 *
 * Statuts Stripe pris en compte :
 *   - active, trialing → plan payant accordé
 *   - past_due, unpaid → plan rétrogradé en 'free' (paiement bloqué)
 *   - cancelled, incomplete, incomplete_expired, paused → 'free'
 *   - inactive (ligne créée mais jamais payée) → 'free'
 *
 * Note race condition : entre le check et le INSERT du job, un user peut en
 * théorie créer 2 jobs simultanés et passer le quota de 1. Le rate limit
 * (10 jobs/min/user dans /api/jobs/create) rend ce cas négligeable. Pour
 * du strict, utiliser la fonction SQL `try_consume_quota` (migration 0003).
 */

import { createServerClient } from './supabase/server';
import productConfig from '@/config/product.config';

const PAYING_STATUSES = new Set(['active', 'trialing']);

export type QuotaResult = {
  allowed: boolean;
  reason?: string;
  runsRemaining?: number | 'unlimited';
  planId?: string;
};

export async function checkQuota(userId: string): Promise<QuotaResult> {
  const supabase = await createServerClient();

  // Récupère le plan actif
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id, status, current_period_start, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  const isPaying = sub && PAYING_STATUSES.has(sub.status);
  const planId = isPaying ? sub.plan_id : 'free';

  const plan =
    productConfig.pricing.plans.find((p) => p.id === planId) ??
    productConfig.pricing.plans[0]; // fallback first plan = free

  // Plan illimité
  if (plan.runsPerMonth === 'unlimited') {
    return { allowed: true, runsRemaining: 'unlimited', planId: plan.id };
  }

  // Période de calcul des runs : période de subscription Stripe pour les
  // payants, mois calendaire pour les free (pas de current_period_start).
  const periodStart = isPaying && sub?.current_period_start
    ? new Date(sub.current_period_start)
    : new Date(new Date().setDate(1));

  const periodEnd = isPaying && sub?.current_period_end
    ? new Date(sub.current_period_end)
    : new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);

  // Compte les runs facturables dans la période.
  // On exclut 'cancelled' (l'user a annulé avant lancement) et 'error' avec
  // attempts épuisés (sinon les retries comptent N fois).
  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lt('created_at', periodEnd.toISOString())
    .in('status', ['pending', 'running', 'success']);

  const used = count ?? 0;
  const remaining = plan.runsPerMonth - used;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      runsRemaining: 0,
      planId: plan.id,
    };
  }

  return {
    allowed: true,
    runsRemaining: remaining,
    planId: plan.id,
  };
}

/**
 * /api/stripe/webhook
 *
 * Pattern OFFICIEL Stripe + Next.js App Router :
 *   - On lit le body en TEXTE (await req.text()) — JSON.parse() casse la signature
 *   - On vérifie la signature avec stripe.webhooks.constructEvent
 *   - On répond 200 RAPIDEMENT — Stripe a un timeout de ~10s ; sinon retry
 *   - On gère l'IDEMPOTENCE en stockant event.id avec un STATUT explicite
 *   - Cette route est exclue du middleware d'auth (pas de cookie côté Stripe)
 *
 * Pattern d'idempotence (corrigé v2 — bug v1) :
 *   1. Vérifier la signature (sinon 400)
 *   2. UPSERT stripe_events avec status='processing'
 *      - Si status='processed' déjà → 200 immédiat (idempotent)
 *      - Sinon on traite
 *   3. UPDATE status='processed' OU 'failed' avec error à la fin
 *
 * Réf : https://docs.stripe.com/webhooks/signature
 *       systemdesignschool.io/problems/webhook (verify→enqueue→ACK)
 */

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/billing';
import { createServiceRoleClient } from '@/lib/supabase/server';
import productConfig from '@/config/product.config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // ----- IDEMPOTENCE robuste -----
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id, status')
    .eq('id', event.id)
    .maybeSingle();

  if (existing?.status === 'processed') {
    return NextResponse.json({ received: true, idempotent: true });
  }

  // UPSERT atomique avec status processing
  const { error: insertErr } = await supabase
    .from('stripe_events')
    .upsert(
      { id: event.id, type: event.type, status: 'processing', error: null },
      { onConflict: 'id', ignoreDuplicates: false },
    );

  if (insertErr) {
    return NextResponse.json({ error: 'db_insert_failed' }, { status: 500 });
  }

  // ----- HANDLERS -----
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.user_id as string | undefined) ??
          (session.client_reference_id as string | null) ??
          undefined;
        if (!userId) break;

        const subId = session.subscription as string | null;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(supabase, userId, sub);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string | undefined) ?? null;
        if (!userId) break;
        await upsertSubscription(supabase, userId, sub);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            plan_id: 'free',
            stripe_price_id: null,
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Stripe v21+ : invoice.subscription est désormais dans
        // invoice.parent.subscription_details.subscription. On accepte les
        // deux pour rester compatible (plusieurs versions API live coexistent
        // dans les webhooks selon quand l'endpoint a été créé).
        const subId =
          (invoice.parent?.subscription_details?.subscription as string | undefined) ??
          ((invoice as unknown as { subscription?: string | null }).subscription ?? null);
        if (subId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }

      default:
        break;
    }

    // Marquer processed
    await supabase
      .from('stripe_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', event.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    // ⚠️ Jamais log err.stack/err.message complets — peut contenir du payload.
    const errType = err instanceof Error ? err.constructor.name : 'UnknownError';
    console.error(`[stripe-webhook] handler failed event=${event.id} type=${event.type} err=${errType}`);

    // Marquer failed pour permettre le retry au prochain webhook Stripe
    await supabase
      .from('stripe_events')
      .update({ status: 'failed', error: errType })
      .eq('id', event.id);

    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Mapping priceId → planId (FIX v2)
// ---------------------------------------------------------------------------
// BUG v1 : `plan_id = priceId` (price_xxx). Mais checkQuota cherche
// productConfig.pricing.plans[].id ('starter', 'pro'). Résultat : abonné
// payant retombait silencieusement en plan 'free'.
function priceIdToPlanId(priceId: string | null): string {
  if (!priceId) return 'free';
  const plan = productConfig.pricing.plans.find((p) => p.stripePriceId === priceId);
  if (!plan) {
    console.warn(`[stripe-webhook] unknown price_id=${priceId} — falling back to 'free'`);
    return 'free';
  }
  return plan.id;
}

async function upsertSubscription(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  sub: Stripe.Subscription,
) {
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const planId = priceIdToPlanId(priceId);

  // Stripe v21+ : current_period_start/end sont sur SubscriptionItem,
  // pas sur Subscription. On lit les deux pour rester compatible avec les
  // anciens payloads (webhook envoyé avec une version d'API plus vieille).
  const subAny = sub as unknown as {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };
  const periodStart =
    item?.current_period_start ?? subAny.current_period_start ?? null;
  const periodEnd =
    item?.current_period_end ?? subAny.current_period_end ?? null;

  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      plan_id: planId,
      stripe_price_id: priceId,
      status: sub.status,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    },
    { onConflict: 'user_id' },
  );
}

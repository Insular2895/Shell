/**
 * lib/billing.ts
 *
 * Helpers Stripe pour Checkout + Customer Portal.
 *
 * Note sur apiVersion :
 *   stripe-node v12+ pin l'API version au moment de sa release.
 *   On NE met pas `apiVersion: '...'` en dur — ça force une version qui
 *   peut diverger des types TypeScript et casse les futures upgrades.
 */

import Stripe from 'stripe';

/**
 * Lazy init — important pour le `next build` qui collecte les pages SANS
 * env vars définies. Si on faisait `new Stripe(process.env.STRIPE_SECRET_KEY!)`
 * au top-level, l'import du module crashait pendant le build (cf bug v1).
 *
 * À l'usage : `stripe.checkout.sessions.create(...)` continue de fonctionner
 * grâce au Proxy ci-dessous qui forward les calls au client réel.
 */
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY env var is required at runtime');
  }
  _stripe = new Stripe(key, {
    // Pas d'apiVersion en dur : on suit celle pinned par le SDK.
    appInfo: { name: 'micro-saas-template', version: '0.2.0' },
  });
  return _stripe;
}

// Proxy : `stripe.foo.bar(...)` lit `getStripe().foo.bar(...)` à chaque accès.
// Ça garde l'API publique inchangée tout en différant l'init.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.email,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    metadata: { user_id: params.userId },
    // Lie l'abonnement créé à l'user_id (utile dans le webhook)
    subscription_data: {
      metadata: { user_id: params.userId },
    },
    // Permet au customer de gérer son abonnement après checkout
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

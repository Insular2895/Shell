/**
 * /api/stripe/checkout
 * Crée une session de checkout pour l'user authentifié et le redirige.
 */
import { NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/billing';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const { priceId } = await req.json();
  if (!priceId) {
    return NextResponse.json({ error: 'priceId required' }, { status: 400 });
  }

  // Si l'user a déjà un Stripe customer, on le réutilise (évite les doublons)
  const supabase = await createServerClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user!.id)
    .maybeSingle();

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!;
  const session = await createCheckoutSession({
    userId: user!.id,
    email: user!.email!,
    priceId,
    customerId: sub?.stripe_customer_id || undefined,
    successUrl: `${origin}/billing?success=1`,
    cancelUrl: `${origin}/billing?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}

/**
 * /api/stripe/portal
 * Crée une session du Customer Portal Stripe pour gérer son abonnement.
 */
import { NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { createPortalSession } from '@/lib/billing';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const supabase = await createServerClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user!.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_subscription' }, { status: 404 });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!;
  const portal = await createPortalSession(sub.stripe_customer_id, `${origin}/billing`);
  return NextResponse.json({ url: portal.url });
}

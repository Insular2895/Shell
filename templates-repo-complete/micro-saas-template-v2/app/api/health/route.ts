/**
 * /api/health
 *
 * Endpoint de health check pour uptime monitors (UptimeRobot, BetterStack…)
 * et CI/CD smoke tests.
 *
 * Retourne 200 si DB joignable, 503 sinon. Pas d'info sensible exposée.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const startedAt = Date.now();
  try {
    const supabase = await createServerClient();
    // Ping DB : count(*) sur une table publique (RLS empêche fuite)
    const { error } = await supabase
      .from('stripe_events')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json({ status: 'degraded' }, { status: 503 });
  }
}

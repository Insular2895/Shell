/**
 * GET /api/pnl?site_id=...&period=current_month
 * Retourne le P&L consolidé pour un site sur une période.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get('site_id');
  if (!siteId) return NextResponse.json({ error: 'site_id required' }, { status: 400 });

  // TODO phase 4: SELECT * FROM mart_pnl_by_site WHERE site_id = $1
  return NextResponse.json({
    stub: true,
    site_id: siteId,
    period: 'current_month',
    revenue_eur: 0,
    direct_cost_eur: 0,
    margin_eur: 0,
    by_source: {},
    by_category: {},
  });
}

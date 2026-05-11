/**
 * GET /api/data-products?site_id=...
 * Liste les data products vendables pour un site (résumé, sans PII).
 *
 * Lit mart_sellable_leads agrégé + lead_delivery_log historique.
 */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get('site_id');
  // TODO phase 4 + 6
  return NextResponse.json({
    stub: true,
    site_id: siteId,
    products: [],
    summary: { total_sellable: 0, sold_this_month: 0, blocked_export_count: 0 },
  });
}

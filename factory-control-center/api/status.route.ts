/**
 * GET /api/status?site_id=...
 * Renvoie le site_status (mode, disabled_features, fallback_blocks).
 *
 * Lu par chaque app au boot pour décider quoi afficher.
 * Auth : aucune (status est public — c'est un bandeau "maintenance").
 */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get('site_id');
  if (!siteId) return NextResponse.json({ error: 'site_id required' }, { status: 400 });

  // TODO phase 4: SELECT * FROM site_status WHERE site_id = $1
  return NextResponse.json({
    stub: true,
    site_id: siteId,
    mode: 'normal',
    disabled_features: [],
    fallback_blocks: [],
  });
}

export async function PATCH(req: Request) {
  // Admin uniquement — toggle mode
  const body = await req.json();
  // TODO: vérifier auth admin + valider via approval-policy
  return NextResponse.json({ stub: true, updated: body });
}

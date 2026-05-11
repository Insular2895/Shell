/**
 * GET /api/sites
 * Liste les sites avec leur statut courant + KPIs résumés.
 *
 * Auth : admin uniquement.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // TODO phase 4: Wire real Supabase client + admin auth check
  // const supabase = createServiceRoleClient();
  // const { data, error } = await supabase.from('sites').select('*, site_status(*)');
  return NextResponse.json({
    stub: true,
    message: 'Phase 4 implementation pending. Schema is ready in factory-control-center/database/schema.sql.',
    expected_response_shape: {
      sites: [
        {
          site_id: 'document-extractor',
          name: 'Document Extractor',
          mode: 'normal',
          monthly_revenue_eur: 0,
          monthly_cost_eur: 0,
          open_incidents: 0,
        },
      ],
    },
  });
}

import { NextResponse } from 'next/server';
import { requireFactoryAdmin } from '@/lib/admin-auth';
import { dbError } from '@/lib/api';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { response } = await requireFactoryAdmin();
  if (response) return response;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('sites')
    .select('*, site_status(*), revenues(amount_eur, occurred_at), expenses(amount_eur, occurred_at), incidents(id, status)')
    .order('created_at', { ascending: false });

  if (error) return dbError('sites', error);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const sites = (data ?? []).map((site) => {
    const revenues = site.revenues ?? [];
    const expenses = site.expenses ?? [];
    const monthlyRevenue = revenues
      .filter((r: { occurred_at: string }) => new Date(r.occurred_at) >= monthStart)
      .reduce((sum: number, r: { amount_eur: number }) => sum + Number(r.amount_eur), 0);
    const monthlyCost = expenses
      .filter((e: { occurred_at: string }) => new Date(e.occurred_at) >= monthStart)
      .reduce((sum: number, e: { amount_eur: number }) => sum + Number(e.amount_eur), 0);
    const openIncidents = (site.incidents ?? []).filter(
      (i: { status: string }) => !['resolved', 'closed'].includes(i.status),
    ).length;

    return {
      site_id: site.site_id,
      name: site.name,
      production_url: site.production_url,
      mode: site.site_status?.mode ?? 'normal',
      legal_status: site.legal_status,
      monthly_revenue_eur: monthlyRevenue,
      monthly_cost_eur: monthlyCost,
      open_incidents: openIncidents,
    };
  });

  return NextResponse.json({ sites });
}

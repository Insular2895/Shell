import { NextResponse } from 'next/server';
import { requireFactoryAdmin } from '@/lib/admin-auth';
import { dbError } from '@/lib/api';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { response } = await requireFactoryAdmin();
  if (response) return response;

  const { data, error } = await createServiceRoleClient()
    .from('decision_queue')
    .select('id, site_id, decision_type, status, proposed_at, payload')
    .eq('decision_type', 'export_data')
    .order('proposed_at', { ascending: false })
    .limit(100);

  if (error) return dbError('data-products', error);
  return NextResponse.json({ data_products: data ?? [] });
}

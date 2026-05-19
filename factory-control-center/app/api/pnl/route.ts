import { NextResponse } from 'next/server';
import { requireFactoryAdmin } from '@/lib/admin-auth';
import { dbError } from '@/lib/api';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { response } = await requireFactoryAdmin();
  if (response) return response;

  const siteId = new URL(req.url).searchParams.get('site_id');
  let query = createServiceRoleClient().from('mart_pnl_by_site').select('*');
  if (siteId) query = query.eq('site_id', siteId);

  const { data, error } = await query;
  if (error) return dbError('pnl', error);
  return NextResponse.json({ pnl: data ?? [] });
}

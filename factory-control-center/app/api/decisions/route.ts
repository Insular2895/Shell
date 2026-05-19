import { NextResponse } from 'next/server';
import { requireFactoryAdmin } from '@/lib/admin-auth';
import { dbError } from '@/lib/api';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { response } = await requireFactoryAdmin();
  if (response) return response;

  const status = new URL(req.url).searchParams.get('status') ?? 'pending';
  const { data, error } = await createServiceRoleClient()
    .from('decision_queue')
    .select('*')
    .eq('status', status)
    .order('proposed_at', { ascending: false });

  if (error) return dbError('decisions', error);
  return NextResponse.json({ decisions: data ?? [] });
}

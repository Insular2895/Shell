import { NextResponse } from 'next/server';
import { requireFactoryAdmin } from '@/lib/admin-auth';
import { dbError } from '@/lib/api';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SEVERITIES = new Set(['P0', 'P1', 'P2', 'P3', 'info']);
const STATUSES = new Set(['open', 'investigating', 'mitigated', 'resolved', 'closed']);

export async function GET(req: Request) {
  const { response } = await requireFactoryAdmin();
  if (response) return response;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const siteId = url.searchParams.get('site_id');

  let query = createServiceRoleClient()
    .from('incidents')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  if (siteId) query = query.eq('site_id', siteId);

  const { data, error } = await query;
  if (error) return dbError('incidents.get', error);
  return NextResponse.json({ incidents: data ?? [] });
}

export async function POST(req: Request) {
  const { user, response } = await requireFactoryAdmin();
  if (response) return response;

  const body = (await req.json().catch(() => null)) as {
    site_id?: string;
    severity?: string;
    title?: string;
    description?: string;
    status?: string;
  } | null;

  if (!body?.title || !body.severity || !SEVERITIES.has(body.severity)) {
    return NextResponse.json({ error: 'invalid_incident' }, { status: 400 });
  }

  const status = body.status ?? 'open';
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const { data, error } = await createServiceRoleClient()
    .from('incidents')
    .insert({
      site_id: body.site_id ?? null,
      severity: body.severity,
      status,
      title: body.title,
      description: body.description ?? null,
      detected_by: user!.email ?? user!.id,
    })
    .select()
    .single();

  if (error) return dbError('incidents.post', error);
  return NextResponse.json({ incident: data }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { requireFactoryAdmin } from '@/lib/admin-auth';
import { dbError } from '@/lib/api';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MODES = new Set(['normal', 'degraded', 'maintenance', 'fallback', 'paused']);

export async function GET(req: Request) {
  const siteId = new URL(req.url).searchParams.get('site_id');
  if (!siteId) return NextResponse.json({ error: 'site_id required' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('site_status')
    .select('*')
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) return dbError('status.get', error);
  return NextResponse.json(
    data ?? {
      site_id: siteId,
      mode: 'normal',
      disabled_features: [],
      fallback_blocks: [],
      changed_by: 'default',
    },
  );
}

export async function PATCH(req: Request) {
  const { user, response } = await requireFactoryAdmin();
  if (response) return response;

  const body = (await req.json().catch(() => null)) as {
    site_id?: string;
    mode?: string;
    message?: string;
    disabled_features?: string[];
    fallback_blocks?: string[];
    reason?: string;
  } | null;

  if (!body?.site_id || !body.mode || !MODES.has(body.mode)) {
    return NextResponse.json({ error: 'invalid_status_update' }, { status: 400 });
  }

  const update = {
    site_id: body.site_id,
    mode: body.mode,
    message: body.message ?? null,
    disabled_features: body.disabled_features ?? [],
    fallback_blocks: body.fallback_blocks ?? [],
    reason: body.reason ?? null,
    changed_at: new Date().toISOString(),
    changed_by: user!.email ?? user!.id,
  };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('site_status')
    .upsert(update, { onConflict: 'site_id' })
    .select()
    .single();

  if (error) return dbError('status.patch', error);
  return NextResponse.json({ status: data });
}

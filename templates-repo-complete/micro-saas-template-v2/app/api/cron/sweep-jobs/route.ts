/**
 * /api/cron/sweep-jobs
 *
 * Appelé par Vercel Cron toutes les 5 min (cf vercel.json).
 * Marque comme `timed_out` ou remet en `pending` les jobs dont le lease a
 * expiré (worker mort, machine killée, etc.).
 *
 * Sécurité : Vercel envoie le header `x-vercel-cron-signature` ; on vérifie
 * un token simple `CRON_SECRET` injecté en query/header pour les autres
 * providers (Cloudflare, etc.).
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Vérif token cron — Vercel set un header CRON_SECRET via env
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get('authorization') === `Bearer ${secret}` ||
    new URL(req.url).searchParams.get('secret') === secret;

  if (!secret || !provided) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('mark_timed_out_jobs');
  if (error) {
    console.error(`[cron-sweep] db error: ${error.code}`);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ swept: data ?? 0 });
}

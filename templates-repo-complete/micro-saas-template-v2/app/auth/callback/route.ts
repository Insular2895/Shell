/**
 * /auth/callback
 *
 * Échange le `code` reçu de Supabase Auth (OAuth, email magic link)
 * contre une session active. Cette route DOIT être exclue du matcher
 * du middleware (déjà fait) car elle pose les cookies de session pour
 * la première fois.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

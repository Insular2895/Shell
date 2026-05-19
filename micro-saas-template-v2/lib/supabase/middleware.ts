/**
 * lib/supabase/middleware.ts
 *
 * Pattern OFFICIEL Supabase pour Next.js 15+ (App Router).
 * Réf : https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Rôle : refresh le token d'auth à chaque requête (les Server Components
 * ne peuvent pas écrire de cookies, donc cette responsabilité est ici).
 *
 * ⚠️ NE PAS modifier sans relire la doc Supabase.
 * Le code entre `createServerClient` et `getUser()` doit rester INCHANGÉ —
 * une simple variable ajoutée entre les deux peut désynchroniser les sessions.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/run', '/results', '/billing', '/settings'];

export async function updateSession(request: NextRequest) {
  // 1. Crée une réponse de base. La référence est mutée plus bas si Supabase
  //    écrit des cookies (refresh token).
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Pendant la transition Supabase, ANON_KEY et PUBLISHABLE_KEY sont
    // interchangeables. On accepte les deux.
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Étape 1 : reflète les cookies sur la requête (utilisable downstream
          // par les Server Components dans le même cycle).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Étape 2 : recrée la réponse pour propager les nouveaux cookies.
          supabaseResponse = NextResponse.next({ request });
          // Étape 3 : attache les cookies signés à la réponse pour le navigateur.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ⚠️ NE RIEN AJOUTER ENTRE createServerClient ET getUser().
  //    Une variable, un log, n'importe quoi peut casser le refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirection si route protégée et pas d'user
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ⚠️ Renvoie supabaseResponse tel quel. Si tu construis ta propre NextResponse,
  // tu DOIS recopier les cookies de supabaseResponse dessus, sinon le navigateur
  // perd la session refresh et les utilisateurs sont déconnectés aléatoirement.
  return supabaseResponse;
}

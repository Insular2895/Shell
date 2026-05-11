/**
 * middleware.ts (à la racine)
 *
 * Délègue à `updateSession()` qui contient le pattern officiel Supabase.
 * Ne modifie pas ce fichier — touche `lib/supabase/middleware.ts` à la place.
 *
 * IMPORTANT : le matcher EXCLUT explicitement les webhooks Stripe et autres
 * endpoints qui n'ont pas de cookie d'auth (sinon → 401 et Stripe retry).
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     *   - _next/static, _next/image (assets statiques Next.js)
     *   - favicon.ico, fichiers d'images publics (svg/png/jpg/jpeg/gif/webp)
     *   - api/stripe/webhook  → Stripe envoie sans cookie, signature vérifiée séparément
     *   - api/upload          → engine→Shell, vérifié par SHELL_SERVICE_TOKEN
     *   - auth/callback       → exchange du code OAuth/email, ne doit pas être redirigé
     */
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|api/upload|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

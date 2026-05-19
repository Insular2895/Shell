/**
 * proxy.ts
 *
 * Remplace l'ancienne convention middleware.ts depuis Next 16.
 * Délègue à `updateSession()` qui contient le pattern officiel Supabase.
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
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

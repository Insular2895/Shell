/**
 * lib/supabase/server.ts
 *
 * Client Supabase pour Server Components, Server Actions, Route Handlers.
 * Pattern OFFICIEL : https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * - cookies() est ASYNC depuis Next.js 15 → on await
 * - getAll/setAll est le seul pattern correct (n'utilise PAS get/set/remove
 *   qui sont dépréciés et cassent le refresh)
 * - Le try/catch dans setAll gère le cas Server Components (qui ne peuvent
 *   pas écrire de cookies — le middleware s'en charge)
 */

import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : ignorer.
            // Le middleware persiste les cookies à la place.
          }
        },
      },
    },
  );
}

/**
 * Service-role client (bypass RLS). À utiliser UNIQUEMENT côté serveur,
 * pour les webhooks Stripe et l'API upload qui agissent au nom du système.
 *
 * ⚠️ Ne jamais l'exposer côté navigateur. SUPABASE_SERVICE_ROLE_KEY est
 * un secret absolu.
 */
export function createServiceRoleClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

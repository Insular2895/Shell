'use client';

/**
 * lib/supabase/client.ts
 *
 * Client Supabase pour les Client Components (browser).
 * Utilisé uniquement dans les composants 'use client'.
 *
 * Pattern OFFICIEL : https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

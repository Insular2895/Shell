/**
 * lib/auth.ts
 *
 * Helpers d'authentification basés sur Supabase Auth.
 *
 * Règles d'or (de la doc Supabase 2025/2026) :
 *   - Toujours utiliser getUser() côté serveur (revalide le token).
 *   - JAMAIS getSession() côté serveur (peut être spoofé via cookie).
 *   - getClaims() est une optimisation (pas de round-trip) — disponible si
 *     nécessaire mais getUser() reste le défaut sûr et simple.
 */

import { createServerClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * À utiliser dans les Route Handlers où on veut un statut HTTP propre,
 * pas une redirection.
 */
export async function requireUserOr401() {
  const user = await getUser();
  if (!user) {
    return {
      user: null,
      response: new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user, response: null };
}

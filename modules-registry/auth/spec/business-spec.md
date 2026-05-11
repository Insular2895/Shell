# auth

Authentification standard via Supabase Auth :
- email + password ou magic link
- OAuth providers (Google, GitHub, etc. selon template)
- MFA via TOTP optionnel (recommandé pour admin)
- session management automatique via @supabase/ssr

## Pattern de référence
micro-saas-template-v2 utilise déjà Supabase Auth — voir lib/supabase/, middleware.ts, app/login/, app/signup/.

## Statut
Spec only. Implémentation à coder phase 2-3.

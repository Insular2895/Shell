# Previous errors

> Erreurs faites précédemment. Pour ne pas les refaire.

## v1 → v2 migration (mai 2026)

- ❌ `void async()` après réponse HTTP serverless (jobs perdus)
  → ✅ Queue Postgres + worker externe
- ❌ `subscriptions.plan_id = stripe_priceId` (tous les payants en plan free)
  → ✅ Séparation `plan_id` (logique) et `stripe_price_id` (Stripe)
- ❌ INSERT `stripe_events.id` AVANT traitement (data perdue si crash)
  → ✅ Status processing/processed/failed
- ❌ Pas de validation serveur de body.input (bypass via curl)
  → ✅ Ajv compilé du run.schema.json
- ❌ Pas de retry/timeout/lease (jobs zombies)
  → ✅ Lease + sweep cron + max_attempts

## Patterns évités intentionnellement

- ❌ MongoDB / NoSQL pour data métier critique (joins galère, pas de transactions ACID)
- ❌ FastAPI dans le Shell (Next.js suffit, FastAPI ok pour engine séparé)
- ❌ n8n dans le coeur produit (orchestrer ok, exécuter logique métier non)
- ❌ Material-UI / Chakra / Mantine (multiplie les stacks UI, on garde shadcn)

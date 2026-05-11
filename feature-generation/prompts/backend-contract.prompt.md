# Prompt : backend contract generation

À partir d'un feature-blueprint, génère le `backend-contract.json`.

Pour chaque endpoint :
- Méthode + path
- Auth requise
- Schémas request/response (Zod ou JSON Schema)
- Rate limit
- Idempotency (true si POST avec création de ressource — utiliser Idempotency-Key header)

Pour les changements DB :
- migration_file path (ex: `supabase/migrations/0004_<feature>.sql`)
- Toujours append-only sur consent_ledger / lead_delivery_log

External calls :
- Si LLM : `via_ai_privacy_gateway: true` obligatoire
- Si Stripe : passer par lib/billing avec lazy init

Sortie : conforme à `schemas/backend-contract.schema.json`.

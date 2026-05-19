# Validated choices

> Choix techniques validés par l'usage. Si un agent IA propose autre chose,
> il doit avoir une RAISON FORTE (ADR requis).

## Stack

- Frontend : Next.js 16 + React 19 + Tailwind + shadcn/ui
- Backend : Supabase (Postgres + Auth + Storage + RLS)
- Jobs : Postgres SKIP LOCKED + worker externe (Fly Machines) piloté par Stripe
- LLM gateway : Presidio (ai-privacy-gateway)
- Identity resolution : Splink
- Monitoring : Uptime Kuma + Sentry + OpenObserve
- Backups : Restic vers R2 Cloudflare
- Automation : n8n self-hosted

## Patterns

- Validation defense-in-depth (Ajv côté Shell + Pydantic côté worker)
- Webhook idempotency : status processing/processed/failed
- Auto-degrade quand aucun abonnement payant actif
- Append-only sur audit tables (DB triggers)
- consent_ledger comme preuve légale
- mart_sellable_leads comme seul gate d'export
- Cleanroom pipeline pour features inspirées concurrents

## Si on change : ADR obligatoire

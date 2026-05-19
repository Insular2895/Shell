# ADR-0001 — Choix du backend pack par défaut

## Status
Accepted (2026-05-09)

## Context
Plusieurs options pour le pattern backend de la factory :
- Supabase + Trigger.dev managed
- Supabase + worker custom
- Postgres + BullMQ Redis
- NestJS + Prisma + Postgres dédié

## Decision
**Pattern par défaut = Supabase + queue Postgres SKIP LOCKED + worker externe Fly Machines, gated par Stripe.**

## Consequences
- ✅ Démarrage 0€ (Supabase free + Vercel free)
- ✅ Pas de coût worker avant client actif (`engine_mode='mock'`)
- ✅ Fallback automatique si le client arrête de payer (Stripe → mock + stop worker)
- ✅ Fly Machines start/stop via API + worker qui sort proprement en idle
- ✅ Pattern testé et stable (v2)
- ⚠️ Limite ~10k jobs/jour avant besoin Redis/BullMQ
- ⚠️ Vercel Hobby = personnel only, passer Pro pour clients

## Alternatives considered
- Trigger.dev managed : payant, moins flexible
- Render background worker : simple, mais worker continu donc moins adapté au zéro coût
- BullMQ Redis : overkill MVP
- NestJS : overkill MVP

## Review
À revoir si volume > 10k jobs/jour.

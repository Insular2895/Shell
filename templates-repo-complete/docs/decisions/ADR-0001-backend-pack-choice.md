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
**Pattern par défaut = Supabase + queue Postgres SKIP LOCKED + worker externe (Fly Machines).**

## Consequences
- ✅ Démarrage 0€ (Supabase free + Vercel free)
- ✅ Scale-to-0 (auto-degrade + Fly auto-stop)
- ✅ Pattern testé et stable (v2)
- ⚠️ Limite ~10k jobs/jour avant besoin Redis/BullMQ
- ⚠️ Vercel Hobby = personnel only, passer Pro pour clients

## Alternatives considered
- Trigger.dev managed : payant, moins flexible
- BullMQ Redis : overkill MVP
- NestJS : overkill MVP

## Review
À revoir si volume > 10k jobs/jour.

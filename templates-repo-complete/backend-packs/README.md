# backend-packs/

> Backend patterns prévalidés, **jamais d'improvisation**.

## Règle

Pour chaque feature qui a besoin de backend :
1. Identifier le pattern (CRUD, upload, long job, admin, scheduled, real-time)
2. Choisir un pack dans la table ci-dessous
3. **Ne pas inventer**. Si aucun pack ne correspond, proposer un nouveau pack via PR.

## Packs disponibles

| Pack | Pattern | Stack |
|------|---------|-------|
| `supabase-basic/` | CRUD simple, RLS | Supabase Postgres + Storage |
| `supabase-trigger/` | Long jobs avec queue + worker | Supabase + Trigger.dev |
| `nextjs-prisma/` | Backend Next.js avec Prisma ORM | Next.js + Prisma + Postgres |
| `drizzle-postgres/` | Backend léger avec Drizzle | Drizzle + Postgres |
| `bullmq-redis/` | Queue self-hosted | BullMQ + Redis + Worker Node |
| `inngest/` | Event-driven workflows | Inngest |
| `triggerdev/` | Long jobs managed | Trigger.dev |
| `directus-admin/` | Admin rapide | Directus headless |
| `fastapi-worker/` | Backend Python séparé | FastAPI + Postgres |
| `nestjs-prisma/` | Enterprise TypeScript backend | NestJS + Prisma |

## Pack MVP recommandé pour la factory

```
Supabase + Trigger.dev + Zod + OpenAPI
```

C'est ce que `supabase-trigger/` propose. C'est aussi ce que
`micro-saas-template-v2/` utilise (variante : worker Python externe).

## Ce qu'un pack contient

```
<pack>/
  pack.yaml              # déclaration, version, requirements
  README.md              # quand l'utiliser
  database/              # schemas SQL ou ORM
  api/                   # routes API patterns
  workers/               # jobs / consumers
  contracts/             # input.schema.ts, output.schema.ts
  security-rules.md      # règles spécifiques au pack
```

## Règle non négociable

**Aucun traitement lourd dans une requête HTTP.**
Toute tâche > 10s passe par : job DB → queue → worker → retry → timeout → status → fallback.
Cf `supabase-trigger/` pour le pattern complet.

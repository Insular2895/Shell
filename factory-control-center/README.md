# factory-control-center/

> Cockpit Next.js multi-sites pour piloter la factory.

## Statut

- ✅ Schéma DB complet (`database/schema.sql`)
- ✅ Routes App Router réelles (`app/api/*/route.ts`)
- ✅ Auth admin Supabase allowlist via `FACTORY_ADMIN_EMAILS`
- ✅ Headers sécurité dans `next.config.mjs`
- ✅ Composants React de base (`components/*.tsx`)
- 🟡 Pages cockpit minimalistes, prêtes à enrichir

## Structure

```
factory-control-center/
├── app/
│   ├── page.tsx              ← cockpit overview
│   ├── sites/page.tsx        ← liste des sites
│   └── api/*/route.ts        ← routes cockpit
├── components/
│   ├── SiteStatusCard.tsx    ← carte statut par site
│   ├── PnlCard.tsx           ← P&L card
│   ├── IncidentTable.tsx     ← table d'incidents
│   ├── QuotaWidget.tsx       ← jauges de quotas
│   ├── SecurityAlerts.tsx    ← alertes sécurité
│   ├── DecisionQueue.tsx     ← queue de décisions à valider
│   └── DataProductCard.tsx   ← carte data product
├── lib/
│   ├── admin-auth.ts         ← allowlist Supabase Auth
│   └── supabase.ts           ← clients SSR/service-role
└── database/
    └── schema.sql            ← tables sites/revenues/expenses/incidents/etc.
```

## Setup

```bash
# Le cockpit est un Next.js standard
cd factory-control-center
cp .env.example .env.local
# Wire avec la même Supabase que les sites (ou une dédiée 'cockpit')
# Ajout des migrations database/schema.sql via npx supabase db push
```

## Auth

Admin uniquement. Les routes admin vérifient une session Supabase valide et
exigent que `user.email` soit présent dans `FACTORY_ADMIN_EMAILS`.

## Données

Les API routes lisent les tables de `database/schema.sql`.

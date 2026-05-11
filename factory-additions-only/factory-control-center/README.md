# factory-control-center/

> Cockpit Next.js multi-sites pour piloter la factory.

## Statut

- ✅ Schéma DB complet (`database/schema.sql`)
- ✅ API stubs typés (`api/*.route.ts`) avec shape de réponse documentée
- ✅ Composants React de base (`components/*.tsx`)
- 🟡 Pages : root + sites (placeholders)
- ⏳ Phase 4 : wire vraie auth admin + Supabase + dashboards complets

## Structure

```
factory-control-center/
├── app/
│   ├── page.tsx              ← cockpit overview
│   └── sites/page.tsx        ← liste des sites
├── components/
│   ├── SiteStatusCard.tsx    ← carte statut par site
│   ├── PnlCard.tsx           ← P&L card
│   ├── IncidentTable.tsx     ← table d'incidents
│   ├── QuotaWidget.tsx       ← jauges de quotas
│   ├── SecurityAlerts.tsx    ← alertes sécurité
│   ├── DecisionQueue.tsx     ← queue de décisions à valider
│   └── DataProductCard.tsx   ← carte data product
├── api/
│   └── *.route.ts            ← API routes (stubs typés)
└── database/
    └── schema.sql            ← tables sites/revenues/expenses/incidents/etc.
```

## Setup phase 4

```bash
# Le cockpit est un Next.js standard
cd factory-control-center
# Wire avec la même Supabase que les sites (ou une dédiée 'cockpit')
# Ajout des migrations database/schema.sql via npx supabase db push
```

## Auth

Admin uniquement. À implémenter via custom claim Supabase JWT :
```sql
-- Migration : add admin role
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where id = '<your-user-id>';
```

Puis dans middleware Next.js : vérifier `user.app_metadata.role === 'admin'`.

## Données

Les API routes lisent les tables de `database/schema.sql`. Implémentation phase 4.

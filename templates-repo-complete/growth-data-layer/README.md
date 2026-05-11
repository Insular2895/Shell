# growth-data-layer/

> **Couche data unifiée multi-sites** : collecte, consentement, qualité,
> identité, scoring, datasets vendables.

## Les 4 couches data

```
┌──────────────────────────────────────────────────────┐
│ raw                                                  │
│   raw_events, raw_forms, raw_consent_logs           │
│   → données brutes, jamais vendues                  │
└──────────────────────────────────────────────────────┘
                        │  dbt clean
                        ▼
┌──────────────────────────────────────────────────────┐
│ staging                                              │
│   stg_contacts, stg_companies, stg_events           │
│   → données nettoyées/normalisées, usage interne    │
└──────────────────────────────────────────────────────┘
                        │  dbt unify + identity-resolution
                        ▼
┌──────────────────────────────────────────────────────┐
│ master                                               │
│   master_contacts, master_companies, master_leads   │
│   → vue unifiée interne                             │
└──────────────────────────────────────────────────────┘
                        │  compliance + scoring
                        ▼
┌──────────────────────────────────────────────────────┐
│ marts (data products)                                │
│   mart_sellable_leads ← SEUL gate de vente          │
│   mart_ad_audiences                                  │
│   mart_buyer_exports                                 │
│   mart_pnl_by_site                                   │
└──────────────────────────────────────────────────────┘
```

## Champ critique : `sellable_status`

Calculé par dbt + règles compliance. Un lead n'est **jamais** vendable si
`sellable_status != 'eligible'`. Voir `storage/master-schema.sql` pour la
liste des valeurs et `exports/export-policy.md` pour le gate complet.

## Lis ces fichiers en premier

1. `storage/master-schema.sql` — tables principales (master_contacts, master_companies, master_leads)
2. `consent/consent-ledger.sql` — registre append-only des consentements (preuve légale)
3. `identity-resolution/identities-schema.sql` — identity graph + clusters + merge reviews
4. `exports/export-policy.md` — règles strictes de vente externe
5. `exports/lead-delivery-log.sql` — audit trail des livraisons
6. `data-products/sellable-leads.md` — produits commerciaux possibles
7. `compliance/data-minimization-policy.md` — règles RGPD

## Ce que cette couche garantit

- **Aucun export sans consentement valide** (gate via `mart_sellable_leads`)
- **Preuve immutable** de chaque consentement (`consent_ledger` append-only)
- **Preuve immutable** de chaque livraison (`lead_delivery_log` append-only)
- **Identité unifiée** cross-sites (Splink → identity_clusters)
- **Quotas de fraîcheur** (`data_freshness_days <= 90` par défaut)
- **Rétention contractuelle** (`retention_expires_at` calé sur la base légale)

## Outils MVP / Phase 2

| Couche | MVP | Phase 2+ |
|--------|-----|----------|
| Tracking client | `client-tracker.ts` minimal | PostHog ou Segment |
| Tracking serveur | `server-tracker.ts` direct DB | Snowplow self-hosted |
| Storage | Postgres (Supabase) | + DuckDB pour analytics |
| dbt | dbt-core sur Postgres | dbt Cloud si besoin |
| Identity resolution | **Splink** | + Dedupe avec validation humaine |
| PII detection | **Presidio** (cf `ai-privacy-gateway/`) | + Cloud DLP optionnel |
| Activation publicitaire | Manuel | Hightouch ou Census si volume |

## Workflow d'un lead

```
visiteur arrive sur le site (visitor_id cookie)
  → consent banner : grant/deny pour analytics, ads, prospection, partners
  → INSERT consent_ledger (1 ligne par type)
  → visite, pages vues : raw_events
  → soumet formulaire : raw_forms
  → dbt unifie en stg_contacts
  → identity-resolution match (email/phone hash) → master_contacts
  → enrichissement entreprise (SIREN si France) → master_companies
  → master_leads créé avec snapshot consent + retention_expires_at
  → scoring (lead_quality, intent, buyer_fit)
  → sellable_status calculé
  → si eligible : visible dans mart_sellable_leads
  → exportable via gateExport()
```

## Tests obligatoires

Voir `quality/dbt-tests.md` :

- aucun lead sans `consent_version`
- aucun lead avec `sellable_status='eligible'` ET `opt_out=true` (incohérence)
- aucun lead avec `retention_expires_at <= now()` ET `sellable_status='eligible'`
- aucun email/phone en clair stocké dans `master_contacts`
- aucun consent avec status='granted' ET legal_basis='consent' ET method='opt_out_link' (incohérence)

Si un de ces tests échoue : **alerte critique**, on coupe les exports le temps de
résoudre (cf `ops-autopilot/actions/block-data-export.ts`).

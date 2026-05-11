# growth-data-layer/storage/

Schemas SQL des 4 couches data : raw → staging → master → marts.

## Fichiers MVP

- `master-schema.sql` ✅ (master_contacts, master_companies, master_leads + mart_sellable_leads)

## À créer phase 6

- `raw-schema.sql` (raw_events, raw_forms, raw_consent_logs)
- `staging-schema.sql` (stg_contacts, stg_companies, stg_events) — généré par dbt
- `marts-schema.sql` (mart_ad_audiences, mart_buyer_exports, mart_pnl_by_site déjà dans factory-control-center)
- `contacts.sql`, `identities.sql`, etc. — séparation par sujet

## Règle

Toute migration sur `master_*` ou `mart_*` :
- semver bump
- review humaine obligatoire (cf approval-policy.yml: change_database_schema)
- backward-compat où possible (ne pas dropper de colonnes utilisées par le cockpit)

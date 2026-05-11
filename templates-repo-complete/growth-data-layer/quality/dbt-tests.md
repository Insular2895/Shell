# DBT tests à implémenter (phase 6)

## Tests par modèle

### `stg_contacts`
- `not_null` : email_hash OR phone_hash (au moins un identifiant)
- `unique` : (site_id, email_hash) — un email par site est unique en staging
- `accepted_values` : verification_level dans la liste autorisée

### `master_contacts`
- `not_null` : verification_level
- `relationships` : primary_company_id → master_companies (si non null)
- `not_null` : opt_out (booléen, jamais null)

### `master_leads`
- `not_null` : consent_version, consent_collected_at, retention_expires_at
- `accepted_values` : sellable_status dans la liste enum
- `expression_is_true` : retention_expires_at > collected_at
- Custom : voir `data-quality-rules.yml`

### `mart_sellable_leads` (vue)
- `expression_is_true` : sellable_status = 'eligible' (par construction de la vue)
- `expression_is_true` : data_freshness_days <= 90

## Test de non-régression

Avant chaque déploiement dbt :
- Snapshot mart_sellable_leads (count + sample)
- Compare avec après-déploiement
- Si delta > 5% sans explication : bloque le merge

## Outils

- `dbt test` (built-in)
- `dbt-expectations` package (tests avancés)
- Custom Python pour les règles `data-quality-rules.yml`

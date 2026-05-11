# Database scaling

## Postgres (Supabase)

- Free tier : 500MB
- Pro : 8GB → 256GB selon plan
- Read replicas : Pro+ uniquement

## Quand split

- Site_config / sites / users : main DB
- Logs lourds : OpenObserve / Loki (pas la DB principale)
- Analytics : DuckDB ou Clickhouse séparé si volume

## Cockpit DB séparée ?

- 1-2 sites : même DB que le site (schema séparé `cockpit_*`)
- 3+ sites : DB dédiée pour le cockpit (peut être petite)

# Dashboards OpenObserve

## Dashboards recommandés (1 par site)

### 1. Health overview
- Uptime % (24h, 7j, 30j)
- Latency p50/p95/p99 par endpoint
- Erreurs par endpoint
- Jobs : succès/error/timeout %

### 2. Cost
- Coût IA cumulé du mois (depuis usage_events)
- Top users par coût (anonymisé)
- Coût par feature

### 3. Security
- Pattern de requêtes anormaux (404 ratio, RLS errors)
- Tentatives auth échouées
- Rate-limit hits

### 4. Data quality (sites avec growth-data-layer)
- Leads collectés/jour
- % consent_partners
- % sellable_status='eligible'
- Exports bloqués (raisons)

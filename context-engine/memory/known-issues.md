# Known issues

> Issues connues qu'on n'adresse pas encore (par choix priorité ou contrainte).

## Issues actives

| ID | Description | Priority | Workaround |
|----|-------------|----------|------------|
| ISS-001 | Le rate limiter `lib/rateLimit.ts` est in-memory — ne fonctionne pas correctement multi-instance Vercel | medium | OK pour < 5 instances. Phase 2 : migrer Upstash Redis. |
| ISS-002 | n8n self-hosted nécessite Postgres séparé — coût supplémentaire | low | Acceptable, on l'isole proprement |
| ISS-003 | Pas de SLA défini pour les demandes RGPD | medium | Procédure manuelle 30j max, ticket par demande |

## Issues résolues

(à compléter au fil du temps)

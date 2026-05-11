# finance-ledger/policies/cost-attribution-policy.md

## Règle générale

Chaque coût a un `site_id` quand c'est possible. Quand ce n'est pas possible
(ex: facture mensuelle Vercel pour 5 sites), on flag `is_shared=true` et
on alloue selon la policy ci-dessous.

## Allocation des coûts partagés

Méthode par défaut : **proportionnelle à l'usage observé**.

Pour chaque coût `is_shared=true`, on calcule la part par site selon :

```
share[site_id] = usage_events_count[site_id, period] / sum(usage_events_count[*, period])
allocated[site_id] = cost.amount_eur * share[site_id]
```

Si `usage_events` est vide pour la période : allocation égale entre sites
actifs.

## Catégories qui restent globales (pas alloués)

- `security_audit` (un audit benefit la factory entière)
- `tooling` (outils internes : GitHub, monitoring base, etc.)
- `human_time` non attribué directement

Ces catégories sont reportées dans un P&L "factory" séparé,
pas alloués aux sites.

## Cron de calcul

Un job mensuel `/api/cron/allocate-shared-costs` (à coder phase 4) :
1. Lit les expenses `is_shared=true` du mois précédent
2. Calcule les parts par site
3. Insère des lignes dérivées (avec `is_shared=false`, `metadata.source_shared_id`)

Ces lignes dérivées sont **identifiables** (non comptées 2x dans P&L) grâce à
`metadata.source_shared_id`.

## Audit

Le rapport mensuel `reports/finance/YYYY-MM.md` doit montrer pour chaque
site :
- Revenus par source
- Coûts directs
- Coûts partagés alloués (avec détail)
- Marge brute
- Marge nette estimée (après coûts factory)

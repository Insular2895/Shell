# reports/

Outputs de la factory : audits, scans sécurité, postmortems, rapports P&L,
rapports compliance.

## Layout

```
reports/
├── repo-audit/     # outputs de `factory repo:audit`
├── site-analysis/  # outputs de `factory site:analyze` (cleanroom)
├── security/       # outputs de tools/scanners/run-all.sh
├── incidents/      # postmortems
├── backup-tests/   # restore tests annuels
├── pnl/            # rapports P&L quotidiens (workflow n8n)
└── data-products/  # audits compliance mensuels
```

## Règles

- Sortie auto-générée par workflows / CLI factory
- Versionné git pour audit trail (les rapports sont eux-mêmes une preuve)
- Pas de PII dans les rapports (ai-privacy-gateway/redact si nécessaire)

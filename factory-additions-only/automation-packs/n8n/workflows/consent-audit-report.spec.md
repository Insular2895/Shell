# Workflow : consent-audit-report

## Trigger
- Schedule : 1er du mois 4am UTC

## Steps

1. **Aggregate consent_ledger du mois écoulé** :
   - Total grants/revokes par type
   - % consent_partners=true sur leads collectés
   - Sources avec faible taux consent (audit pour fix)
2. **Aggregate master_leads du mois** :
   - Total leads collectés
   - Par sellable_status
   - Par site_id
3. **Aggregate lead_delivery_log** :
   - Total exports
   - CA généré (jointure avec revenues)
   - Top buyers
4. **Aggregate exports bloqués** (decision_queue rejected ou gateExport failures) :
   - Top raisons de blocage
5. **Generate report** : `reports/data-products/YYYY-MM-audit.md`
6. **Send to DPO** + admin par email

## Format

Markdown structuré. Sample sections :
- Volume
- Compliance metrics
- Anomalies
- Action items

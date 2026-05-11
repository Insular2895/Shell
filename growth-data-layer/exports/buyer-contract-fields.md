# Buyer Contract — champs minimum

> Tout buyer signe un contrat AVANT première délivrance.

## Champs obligatoires

```yaml
buyer_legal_info:
  legal_name: "..."
  vat_number: "..."
  address: "..."
  signing_authority: "..."

allowed_usages:
  - cold_email | phone_call | crm_import | remarketing | lookalike_audience | enrichment_only

retention_limit_months: 12       # max conservation côté buyer

resale_allowed: false             # interdiction stricte de revente

opt_out_propagation: required     # buyer doit propager opt-outs reçus

retention_audit_clause: "client may request retention proof at any time"

breach_clause:
  notification_window_hours: 72
  fine_per_record_eur: 50

dispute_jurisdiction: "Tribunal de commerce de Paris"

rgpd_compliance_attestation: required

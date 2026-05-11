# Delivery Dataset (après achat)

## Format livré (post-paiement, post-gateExport())

```json
{
  "lead_id": "uuid",
  "company": {
    "name": "Acme SAS",
    "website": "acme.example.com",
    "industry": "ecommerce",
    "size_range": "11-50",
    "country": "FR"
  },
  "contact": {
    "display_name": "Jean Dupont",
    "email": "jean@acme.example.com",
    "phone": "+33612345678"
  },
  "need": "Audit SEO de notre boutique e-commerce",
  "budget_range": "5-20k",
  "timing": "1-3m",
  "source_site_id": "audit-pilot",
  "allowed_usage": "cold_email",
  "allowed_channels": ["email"],
  "retention_limit_for_buyer": "12 months",
  "consent_version_at_delivery": "v2026-01-CGU-FR",
  "delivered_at": "2026-05-09T18:00:00Z"
}
```

## Format livraison

- CSV (chiffré + zip si volume)
- API webhook vers buyer
- Push CRM (HubSpot, Salesforce, Pipedrive)

## Audit

Chaque livraison ⇒ INSERT lead_delivery_log avec snapshot complet (cf export-policy.md).

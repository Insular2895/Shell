# Intent Signals — produit data agrégé

## Définition

Signal d'intention agrégé NIVEAU ENTREPRISE (pas individuel). Pas de PII.

## Format

```json
{
  "company_id": "opaque-uuid",
  "company_domain": "acme.example.com",
  "signal_category": "audit-seo",
  "signal_strength": 75,
  "signal_observed_in_last_n_days": 14,
  "signal_count": 3
}
```

## Pricing

- Par signal : 0.01-0.50€
- Package mensuel : 50-500€ par catégorie
- Abonnement API : 200-2000€/mois

## RGPD

OK car niveau entreprise, pas individuel. Le buyer peut matcher sur son CRM via `company_domain`. Aucune PII traverse.

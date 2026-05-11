# Ad audiences — produit data

## Définition

Segment activable pour ad targeting (lookalike, retargeting). PAS de PII brute.

## Format livré

```json
{
  "segment_id": "ecommerce_active_buyers_fr",
  "size": 12500,
  "attributes": {
    "industries": ["ecommerce"],
    "countries": ["FR"],
    "size_ranges": ["11-50", "51-200"]
  },
  "hashed_emails_for_match": ["a1b2...", "c3d4..."]  // sha256 (format Meta CAPI)
}
```

## Conditions

- consent_ads = true sur chaque lead
- email hashé sha256 (format compatible Meta/Google)
- Pas de matching identitaire renvoyé au buyer (juste le hash)

## Pricing

Abonnement 500-5000€/mois selon volume + niche.

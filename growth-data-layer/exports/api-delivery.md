# API Delivery

## Pattern

```
Buyer souscrit à API access plan
  → Reçoit un API token (cf modules-registry/api-keys)
  → POST https://api.factory.com/v1/leads/match
       headers: Authorization: Bearer xxx
       body: { criteria: {industry: 'saas', country: 'FR', ...} }
  → Returns up to N leads matching, INSERT lead_delivery_log par lead
  → Buyer paye à l'usage (consommé sur wallet ou facturation mensuelle)
```

## Limite

- 100 leads / minute / buyer (rate limit anti-abuse)
- 10000 leads / mois max sans contrat ad-hoc

## Format

JSON conforme à `delivery-dataset.md`.

## Retries / idempotency

Idempotency-Key requis. Buyer peut retry sans risque double-delivery (et double-billing).

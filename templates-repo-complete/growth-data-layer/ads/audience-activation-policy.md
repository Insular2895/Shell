# Audience activation policy

## Règles

1. **consent_ads requis**
2. **consent_audience_activation** distinct si partage avec ad-tech tiers
3. Hashes uniquement (jamais email/phone en clair vers Meta/Google)
4. Format : sha256(email lowercased trimmed) — convention Meta/Google

## Workflow

```
Contacts qualifiés (consent_ads + consent_audience_activation)
  → mart marts.ad_audiences (hashes)
  → push Meta Audience API ou Google Customer Match
```

## Limites
- Pas de partage en clair
- Audience size minimum (Meta : 1000+)
- Suppression sur opt-out propagée

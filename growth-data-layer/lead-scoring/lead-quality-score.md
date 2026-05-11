# Lead quality score (composite)

```
quality_score = blend(intent, fit, verification, freshness)
```

## Formule

```
base = 0.5 * intent_score + 0.5 * buyer_fit_score

verification_multiplier:
  unverified:        0.7
  email_verified:    1.0
  phone_verified:    1.2
  form_submitted:    1.0
  meeting_booked:    1.3
  paying_customer:   1.5

freshness_decay:
  data_freshness_days <= 30:  1.0
  data_freshness_days <= 60:  0.8
  data_freshness_days <= 90:  0.6
  > 90:                        0.4

quality_score = clamp(base * verification_multiplier * freshness_decay, 0, 100)
```

## Utilisation

- `quality_score >= 80` → tier "premium" (pricing top)
- `quality_score 50-79` → tier "standard"
- `quality_score 30-49` → tier "basic"
- `quality_score < 30` → ne pas vendre (mart_sellable_leads exclut)

## Recalcul

Cron quotidien `/api/cron/recalc-scores` à coder phase 6.

# Tracking plan

## Events standards (toutes apps)

| Event | Type | Quand |
|-------|------|-------|
| `page_view` | client | À chaque navigation |
| `signup_completed` | server | Après confirmation email |
| `subscription_started` | server | Webhook Stripe checkout.completed |
| `subscription_cancelled` | server | Webhook Stripe |
| `job_created` | server | POST /api/jobs/create |
| `job_completed` | server | Worker complete |
| `feature_used:<name>` | client | Action métier (variable selon site) |
| `lead_submitted` | server | POST /api/leads/submit |
| `consent_granted:<type>` | client/server | Consent banner |
| `consent_revoked:<type>` | client/server | Désabonnement |
| `opt_out` | server | Toute action opt-out |

## Props standards

```typescript
{
  site_id: string,
  visitor_id: uuid,
  user_id_hash: string | null,
  session_id: uuid,
  utm_source, utm_medium, utm_campaign, ...
  custom_props: { ... }
}
```

## Pas dans les props

- ❌ Email en clair
- ❌ Phone en clair
- ❌ Nom complet
- ❌ Adresse complète
- ❌ Texte libre du user (peut contenir PII)

Si besoin, redact AVANT tracking.

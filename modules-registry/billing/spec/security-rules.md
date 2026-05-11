# billing — Security rules

- Lazy init Stripe client (build-safe)
- Webhook signature verification obligatoire
- Body brut (req.text()) requis
- Idempotency via stripe_events status (pas juste 'présent')
- priceId → plan_id via productConfig.pricing.plans
- Logs : type d'erreur, jamais le message (peut leak)
- Customer portal : permet annulation, change de plan, télécharge factures


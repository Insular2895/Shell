# billing — Technical spec

## Frontend
- Components : PricingTable, CheckoutButton, ManageSubscriptionButton
- Lit productConfig.pricing.plans

## Backend
- POST /api/stripe/checkout → session
- POST /api/stripe/portal → customer portal session
- POST /api/stripe/webhook → handler avec idempotency

## Storage
- Tables : subscriptions, stripe_events
- stripe_events.status processing/processed/failed (cf v2 fix)
- subscriptions.plan_id != stripe_price_id (cf v2 fix)


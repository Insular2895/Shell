# Workflow : quota-watcher

## Trigger
- Schedule cron : */15 * * * * (every 15 min)

## Steps

For each provider (Supabase, Cloudflare, Sentry, Stripe, AI Gateway, Storage) :

1. **Fetch usage** via provider API
2. **Compute used %** vs limit
3. **Apply thresholds** :
   - 60% → log warning
   - 75% → notif owner (email)
   - 85% → trigger ops-autopilot (degraded mode pour features non-critiques)
   - 95% → P1 incident + emergency escalation

## Providers wiring

| Provider | API | Frequency |
|----------|-----|-----------|
| Supabase | Management API → projects/{id}/usage | every 15 min |
| Cloudflare | API → workers analytics | every 1h |
| Sentry | API → events count | every 1h |
| Stripe | (no quota — surveiller volume payments) | daily |
| AI Gateway | usage_events table | every 5 min |
| Storage | Supabase Storage list buckets | daily |

## Output
- Update `factory-control-center.usage_events` (snapshots)
- Send notif si threshold atteint
- Update site_status si action requise

# Workflow : incident-auto-degrade

## Trigger
- HTTP webhook POST /webhook/incident (depuis Sentry alert ou Uptime Kuma)
- OU schedule every 5 min (poll alerts API)

## Steps

1. **Receive alert** : payload {site_id, severity, source, message}
2. **Check policy** : table `ops-autopilot/decision-engine/severity_to_action`
3. **If severity=P0/P1** :
   - PATCH `/api/sites/{site_id}/status` → mode='degraded' avec disabled_features
   - INSERT incidents row
   - Send Slack alert to #alerts
   - Send email to site owner
4. **If P2/P3** : just create ticket in Plane
5. **Always** : log to OpenObserve

## Auth
- n8n vers cockpit API : Bearer token (env COCKPIT_API_TOKEN)
- Cockpit valide : approval-policy auto_allowed pour `set_feature_degraded`

## Failure modes
- Webhook fails → Sentry retry 3x
- Cockpit API down → log to fallback (file) + retry next 5 min cron

## Cf
- ops-autopilot/decision-engine/action-policy.yml
- factory-control-center/api/incidents.route.ts
- factory-control-center/api/status.route.ts

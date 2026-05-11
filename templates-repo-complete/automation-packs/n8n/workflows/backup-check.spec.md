# Workflow : backup-check

## Trigger
- Schedule cron : 0 5 * * * (daily 5am UTC)

## Steps

1. **For each site** with `backup` dans son `ops/services/*.yml` :
   - SSH check : `restic snapshots --last 1 --json`
   - Vérifier date du dernier snapshot
   - Vérifier size cohérent (pas 0, pas 100x normal)
2. **If snapshot < 24h ago AND size OK** : log success
3. **If anomaly** :
   - Slack alert
   - Email owner
   - Create ticket P2

## Output
- Log dans OpenObserve
- Si OK 7j d'affilée : badge "backup healthy"
- Si KO : alert + ticket

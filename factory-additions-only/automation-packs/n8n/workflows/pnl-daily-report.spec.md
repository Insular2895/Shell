# Workflow : pnl-daily-report

## Trigger
- Schedule cron : 0 8 * * * (every day 8am UTC)

## Steps

1. **For each site** in `ops/services/*.yml` :
   - GET `/api/pnl?site_id={id}&period=yesterday`
   - GET `/api/pnl?site_id={id}&period=current_month`
   - Aggregate
2. **Generate markdown report** : `reports/pnl/YYYY-MM-DD.md`
3. **Send to Slack** : top 3 sites par revenue + flag sites en perte
4. **Email owner** : si un site dépasse 80% de son monthly_budget_eur

## Data sources

- Stripe API (revenues détaillés via Stripe events)
- factory-control-center.expenses (saisis par autres workflows)
- AI Gateway logs (usage_events)

## Output
- Markdown saved to `reports/pnl/`
- Slack message
- Email digest

## Frequency / cost
- 1x/day
- ~5 API calls par site
- Coût : négligeable (< 0.01€/jour)

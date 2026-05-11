# automation-packs/n8n/

> n8n orchestre. Le backend exécute. GitHub versionne. Supabase/Postgres stocke.

## Setup

```bash
cd automation-packs/n8n
docker compose up -d
# n8n disponible sur http://localhost:5678
```

## Workflows livrés

Cf `workflows/` pour les JSON exportés et `template-bank/` pour les workflows
importés depuis awesome-n8n-templates et qu'on a vetté.

| Workflow | Trigger | Action | Status |
|----------|---------|--------|--------|
| `incident-auto-degrade` | Sentry/Uptime alert | site_status → degraded + ticket | spec |
| `pnl-daily-report` | cron daily | Calcule P&L + email | spec |
| `quota-watcher` | cron hourly | Check Supabase/Cloudflare/Sentry quotas | spec |
| `security-scan-dispatch` | GitHub action | Tickets sur findings HIGH | spec |
| `backup-check` | cron daily | Verify last backup OK | spec |
| `weekly-maintenance-report` | cron weekly | Résumé bugs/coûts/incidents | spec |
| `feature-analysis-trigger` | manual | site:analyze pipeline | spec |
| `lead-export-approval` | webhook | Bloque export non conforme | spec |
| `consent-audit-report` | cron monthly | Audit RGPD consent | spec |

## Vetting

Workflow imported depuis le wild (awesome-n8n-templates) :
1. Va dans `template-bank/imported/`
2. Review (cf `docs/vetting-checklist.md`) — credentials, scope, sécurité
3. Si OK → `template-bank/reviewed/`
4. Approuvé par owner → `template-bank/approved/`
5. Production → `workflows/`

## Règles

Cf `policies/automation-policy.yml` :
- n8n ne touche jamais la DB directement
- Toute action data passe par notre API qui applique approval-policy
- Credentials via références n8n, jamais en clair dans les exports JSON

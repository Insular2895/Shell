# Alerting policy — Uptime Kuma

## Channels

| Severity | Channel | Audience |
|----------|---------|----------|
| Down (P1) | email + Slack #alerts | owner + on-call |
| Slow (P2) | Slack #alerts | on-call |
| Cert expiry < 14d | email | owner |
| Maintenance scheduled | Slack #ops-info | équipe |

## Escalation

```
Down détecté
  → wait 2 retries (= ~2 min)
  → notif #alerts + email owner
  → si pas ACK en 15 min : SMS via Twilio (optionnel)
  → si pas résolu en 1h : escalation manager
```

## Anti-fatigue

- Pas de notif pour flap < 30s
- Maintenance window : silence pendant la fenêtre déclarée
- Dependency : si Supabase down, ne flood pas les notifs sites individuels

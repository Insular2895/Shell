# Sentry pour un projet Next.js (template v2)

## Setup

```bash
npx @sentry/wizard@latest -i nextjs
```

## Configuration recommandée

`sentry.client.config.ts` :
- tracesSampleRate : 0.1 (10% des transactions)
- replaysSessionSampleRate : 0.0 (off — RGPD risk)
- replaysOnErrorSampleRate : 0.1 (replay seulement sur erreurs, encore risqué — désactiver si data sensibles)
- beforeSend : strip PII (email, IP via Sentry config)

`sentry.server.config.ts` :
- tracesSampleRate : 0.05
- ignoreErrors : ["NEXT_NOT_FOUND", "NEXT_REDIRECT"]

## RGPD

- Désactiver session replay si site collecte data sensibles
- Configurer `Sentry.beforeSend` pour strip emails/phones/PII des breadcrumbs
- Utiliser ai-privacy-gateway/redact() sur les contextes uploadés à Sentry
- DPA Sentry signé avec Anthropic ? Non, **avec Sentry Inc.** — vérifier accord DPA

## Alertes

- Spike : > 100 erreurs / 5 min sur même fingerprint → email
- New issue : email immédiat
- Performance : p95 > 3s → Slack

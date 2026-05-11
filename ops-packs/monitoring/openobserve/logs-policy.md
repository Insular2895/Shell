# Logs policy

## Stack recommandée

- **OpenObserve** self-hosted (s3-compatible storage, Grafana-like UI) — recommandé MVP
- Alternative : Grafana Loki

## Retention

- Application logs (info/warn/error) : 30 jours
- Security logs (gitleaks finds, RLS violations) : 1 an
- Access logs : 90 jours
- Logs business (P&L, exports) : table DB séparée, pas dans OpenObserve

## Format

JSON structuré obligatoire :
```json
{"ts":"2026-05-09T18:00:00Z","level":"info","service":"app","site_id":"document-extractor","msg":"job_completed","job_id":"...","duration_ms":4521}
```

## Anti-leak

- JAMAIS d'email/phone/IP en clair (passer via redact())
- Erreur d'auth : log USER_ID hashé, pas l'email
- Stripe : log `event.id`, pas `event.data.object` complet
- Webhook : log `signature_valid`, pas le payload

## Alertes

- > 50 erreurs/min même service → P2 ticket
- > 200 erreurs/min → P1 + degraded mode
- Pattern "RLS violation" même user → P1 (signe d'attaque)

# status-service

Service centralisé qui répond :
- GET /api/status/{site_id} → site_status row (mode, message, disabled_features)
- GET /api/flags/{site_id} → feature_flags actifs

Lu par chaque app au boot pour adapter son comportement (degraded, maintenance, etc.).
Cf ops-autopilot/status-service/site-status.schema.json.

## Statut
Spec only. Implémentation à coder phase 2-3.

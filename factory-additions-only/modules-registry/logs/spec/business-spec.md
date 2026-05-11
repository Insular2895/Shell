# logs

Pour les apps qui ont besoin de loguer côté user (jobs, API calls) :
- Vue tabulaire avec filtres (date, severity, type)
- Détail expanded
- Export CSV
- Pas de PII en clair (utilise ai-privacy-gateway/redact si nécessaire)

Backend : table logs (avec index sur (user_id, created_at desc, severity)).

## Statut
Spec only. Implémentation à coder phase 2-3.

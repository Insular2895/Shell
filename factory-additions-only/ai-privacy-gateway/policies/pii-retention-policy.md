# PII retention policy

## Mappings (pseudonymize)

- TTL Redis : **24h max** par défaut
- Override : configurable par appel via `MAPPING_TTL_SECONDS`
- Pas de persistance disque (volatile uniquement)
- Si Redis crash : mapping perdu, demander à l'user de re-essayer
- **Jamais de backup des mappings**

## Logs Presidio analyzer

- Logs niveau : INFO
- **Aucun input texte logué** (peut contenir PII)
- Métriques agrégées seulement : count par entity_type

## Audit

- Chaque appel `redact()` ou `anonymize()` → 1 ligne audit (sans le texte)
- Format : `{timestamp, site_id, mode, entity_types_detected, count}`
- Retention 1 an

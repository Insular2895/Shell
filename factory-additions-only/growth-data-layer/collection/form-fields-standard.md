# Form fields standards

> Vocabulaire commun pour les formulaires de la factory.
> Cohérence cross-sites = data layer cohérent + dédoublonnage facilité.

## Champs canoniques

| Field name | Type | PII level | Required |
|-----------|------|-----------|----------|
| `email` | email | N3 | typique |
| `phone` | phone E.164 | N3 | optionnel |
| `first_name` | string | N3 | optionnel |
| `last_name` | string | N3 | optionnel |
| `display_name` | string | N3 | optionnel (préférer à first/last) |
| `company_name` | string | N1 | optionnel |
| `company_website` | url | N1 | optionnel |
| `job_title` | string | N2 | optionnel |
| `country` | iso2 | N1 | optionnel |
| `need` | text | N2 | optionnel (ne pas obliger ce qui peut contenir PII) |
| `budget_range` | enum | N1 | optionnel |
| `timing` | enum | N1 | optionnel |
| `consent_prospection` | bool | — | typique |
| `consent_partners` | bool | — | typique si vente data |
| `utm_*` | string | — | auto-collected |

## Règles

- **Préférer `display_name`** plutôt que `first_name + last_name` (cf awesome-falsehood)
- **Pas de pre-checked** sur consent_*
- **Honeypot** field caché obligatoire pour anti-bot
- **CSRF token** obligatoire (Next.js le gère via Server Actions)

## Si un nouveau champ est nécessaire

1. Le justifier dans business-spec du module concerné
2. Vérifier `data-minimization-policy.md` (est-ce vraiment nécessaire ?)
3. Le classer en N1-N5
4. Si N3+ : ajouter au pipeline redact / pseudonymize
5. Mettre à jour ce fichier

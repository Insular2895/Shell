# Event taxonomy

## Naming convention

`<domain>:<action>` ou `<domain>:<action>:<variant>`

Exemples :
- `auth:signup`
- `auth:login`
- `subscription:started`
- `subscription:cancelled`
- `feature:document-extraction:initiated`
- `feature:document-extraction:completed`
- `lead:submitted:audit-form`

## Catégories

| Catégorie | Préfixes |
|-----------|----------|
| Auth | `auth:*` |
| Billing | `subscription:*`, `payment:*` |
| Feature usage | `feature:*` |
| Lead capture | `lead:*` |
| Consent | `consent:*` |
| Engagement | `engagement:*` (scroll, time on page) |

## Règles

- snake_case
- Pas de PII dans le nom de l'event
- Documenter chaque event dans ce fichier avant de le tracker

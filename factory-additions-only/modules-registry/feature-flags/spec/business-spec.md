# feature-flags

Feature flags simples :
- on/off global
- on/off par user (whitelist)
- % rollout (déterministe par hash user_id)
- A/B test simple (variant assignation persistée)

Pas de plateforme externe (LaunchDarkly etc.) en MVP. Table feature_flags + user_overrides.
Lecture serveur uniquement (pas via JS pour éviter flash).

## Statut
Spec only. Implémentation à coder phase 2-3.

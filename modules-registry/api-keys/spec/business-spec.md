# api-keys

Pour les apps qui exposent une API publique aux users :
- Création de clé (label + scopes)
- Affichage UNE FOIS au create (puis hashé en DB)
- Liste avec dernière utilisation, jamais la clé
- Rotation = créer nouvelle + désactiver ancienne
- Scopes par endpoint (read, write, admin)

Sécurité : hash stocké, pas la clé en clair (cf data-selling-policy).

## Statut
Spec only. Implémentation à coder phase 2-3.

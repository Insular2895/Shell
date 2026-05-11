# Attribution policy

## Obligations légales

| Licence | Attribution requise | Où |
|---------|---------------------|-----|
| MIT | Oui | NOTICE ou about page |
| Apache-2.0 | Oui + NOTICE | NOTICE file inclus dans le binaire |
| BSD-3 | Oui (et nom auteurs) | NOTICE |
| ISC | Oui | NOTICE |
| Creative Commons (BY) | Oui | Page de crédits |
| CC0 / Unlicense | Pas requis | — mais c'est élégant de le faire |

## Implémentation

Pour chaque produit, fichier `app/legal/credits/page.tsx` qui liste :
- Nom dépendance
- Licence
- Lien vers le repo
- Note (si modification du code)

Génération automatique (à coder phase 2) : `factory legal:generate-credits ./template`.

## Polices et icônes

- Polices Google Fonts → attribution dans CSS comment OK
- Icônes Lucide / Heroicons → MIT, attribution dans credits page
- Pas d'icônes "trouvées sur Pinterest" (statut licence inconnu = interdit)

## Photos / illustrations

- Stock photos achetées : selon licence achetée
- Unsplash : OK gratuit avec mention recommandée (pas obligatoire)
- Illustrations IA-générées : OK (mais cf "no AI slop" dans `docs/design/`)
- Illustrations humaines : licence explicite obligatoire

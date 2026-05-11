# DESIGN.md — Design system de la factory

## Principes

1. **Pas d'AI slop** : pas d'icônes générées qui n'ont rien à voir, pas de hero "robot avec circuits", pas de gradients arc-en-ciel par défaut.
2. **Cohérence > originalité** : tous les sites suivent le même DS de base, brandés par site (couleurs primaires + logo).
3. **Composants depuis modules-registry** : pas de re-création par site.

## Stack

- **Tailwind** + **shadcn/ui** comme socle
- Tokens CSS variables centralisés dans `modules-registry/<module>/frontend/tokens.css`
- Pas de Material-UI, Chakra, Mantine (multipliication des stacks)

## States obligatoires par feature

```
idle
loading
validating
processing
completed
failed
empty
degraded
```

Toute feature doit avoir un screenshot ou storybook par état (cf
`feature-generation/` qui génère ces états).

## Anti-patterns

❌ Mélanger 3 design systems sur un même produit
❌ Oublier le state `empty` (= page blanche déprimante)
❌ Oublier le state `degraded` (= site cassé sans message clair)
❌ Animations gratuites partout (charge la page, distrait)
❌ Couleurs sémantiques aléatoires (rouge = erreur, vert = succès, point)
❌ "AI slop" : illustrations d'IA hallucinées sans cohérence visuelle

## Plus de détail

À écrire en phase 2 : `components-rules.md`, `layout-rules.md`, `no-ai-slop.md`.

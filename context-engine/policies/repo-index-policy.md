# Repo index policy

## Quand régénérer le graph

- À chaque PR mergée sur `main` (GitHub Actions)
- Manuellement : `factory repo:index .`

## Que contient le graph

- Liste des modules et leurs imports
- Liste des routes API et leurs handlers
- Liste des composants React et leurs imports
- Map "where is X used" pour rapidement trouver les call-sites

## Stockage

- `context-engine/repo-graph/graph.json` (committé)
- Taille typique : 100-500 KB pour un template
- Si > 1MB : signe que le repo a grossi → split en sub-graphs

## Outils MVP

- Tree-sitter pour AST
- `factory repo:audit` comme signal MVP, puis graph spécialisé quand Graphify est disponible
- Phase 2 : Graphify si accès dispo

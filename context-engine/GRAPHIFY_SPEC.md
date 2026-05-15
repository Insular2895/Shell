# GRAPHIFY_SPEC.md — Spec d'intégration Graphify

> **Statut : à construire.** Ce fichier est la spec complète.
> Ne pas coder avant d'avoir validé cette spec.
> Repo de référence : https://github.com/safishamsi/graphify

---

## Problème à résoudre

Sans carte du repo, un agent doit explorer des fichiers pour comprendre la structure.

```
Exploration non guidée :
  agent ouvre README → ouvre src/lib → ouvre app/ → ouvre engine/ → ...
  résultat : 15-20 fichiers lus = ~8-12k tokens consommés AVANT de commencer la tâche

Avec Graphify :
  agent lit graphify-out/GRAPH_REPORT.md (pré-généré)
  résultat : structure complète = ~1-2k tokens → tâche commence immédiatement
```

**Économie estimée : 80% des tokens d'exploration sur chaque nouvelle session.**

---

## Ce que Graphify produit

```
graphify-out/
├── GRAPH_REPORT.md    ← résumé lisible par un agent (Markdown)
├── graph.json         ← données structurées (imports, exports, routes, tables)
└── graph.html         ← visualisation interactive (pour toi, pas pour l'agent)
```

`GRAPH_REPORT.md` contient :
- Liste des fichiers clés avec leurs exports
- Map des routes API
- Dépendances entre modules
- Tables SQL détectées
- Points d'entrée principaux

---

## Quand régénérer

| Événement | Régénérer ? |
|-----------|-------------|
| Ajout/suppression d'un fichier `.ts`, `.py`, `.sql` | Oui |
| Modification d'une fonction exportée | Oui |
| Modification d'un doc `.md` seulement | Non |
| Ajout d'une migration Supabase | Oui |
| Avant de démarrer une nouvelle phase | Oui (systématique) |

**Ne pas committer `graphify-out/` à chaque petite modif.** Régénérer en batch avant chaque phase ou session longue.

---

## Commandes (à exécuter quand on implémente)

```bash
# Installation (une seule fois)
pip install graphify           # ou npm install -g graphify selon le runtime final

# Génération du graph (depuis la racine du repo)
graphify .

# Intégration plateforme (selon l'outil utilisé)
graphify install --platform codex
graphify install --platform gemini
# Pour Claude Code : graphify-out/GRAPH_REPORT.md est lu manuellement par l'agent

# Output → graphify-out/ (à la racine)
```

---

## Intégration avec AGENTS.md

Une fois `graphify-out/GRAPH_REPORT.md` généré, AGENTS.md doit contenir :

```markdown
## Carte du repo
Avant d'explorer des fichiers, lis `graphify-out/GRAPH_REPORT.md`.
~1-2k tokens. Remplace toute exploration manuelle.
Si le fichier n'existe pas : régénère avec `graphify .`
```

Ce bloc est déjà réservé dans AGENTS.md (section "# Carte du repo — à activer").

---

## Relation avec l'existant dans ce repo

| Existant | Rôle | Devient |
|----------|------|---------|
| `context-engine/graphify/graphify-config.yml` | Config de filtrage des paths à analyser | Input pour `graphify .` (à adapter au format Graphify réel) |
| `context-engine/repo-graph/graph.json` | Graph custom (script non codé) | Remplacé par `graphify-out/graph.json` |
| `context-engine/graphify/build-graph.md` | Commande manuelle custom | Remplacée par `graphify .` |

Le dossier `context-engine/repo-graph/` devient inutile une fois Graphify actif.
Garder `context-engine/graphify/graphify-config.yml` et l'adapter.

---

## Chemins à analyser (depuis graphify-config.yml existant)

```yaml
# context-engine/graphify/graphify-config.yml — à mettre à jour lors de l'implémentation
input:
  paths:
    - "micro-saas-template-v2/app/"
    - "micro-saas-template-v2/lib/"
    - "micro-saas-template-v2/components/"
    - "micro-saas-template-v2/engine/"
    - "micro-saas-template-v2/supabase/migrations/"
    - "modules-registry/"
    - "backend-packs/"
  exclude:
    - "node_modules/"
    - ".next/"
    - "dist/"
    - "tsconfig.tsbuildinfo"
    - "*.test.ts"
    - "*.spec.ts"

output:
  path: graphify-out/    # racine du repo, pas dans context-engine/
```

---

## .gitignore

`graphify-out/` doit être **commité** (pas ignoré).
C'est une artefact de build utile aux agents, pas un cache jetable.

Ajouter dans `.gitignore` seulement `graphify-out/graph.html` si la taille devient un problème.

---

## Ordre d'implémentation (quand on code)

1. Vérifier que `graphify` (safishamsi/graphify) fonctionne sur Python 3.12
2. Adapter `context-engine/graphify/graphify-config.yml` au format Graphify réel
3. Lancer `graphify .` depuis la racine
4. Vérifier `graphify-out/GRAPH_REPORT.md` — lisible et utile pour un agent ?
5. Décommenter le bloc "Carte du repo" dans `AGENTS.md`
6. Committer `graphify-out/` (sans `graph.html` si trop lourd)
7. Supprimer `context-engine/repo-graph/` (remplacé)
8. Documenter la commande de régénération dans `CURRENT_STATUS.md`

# agent-quality-system/runtime/minimal-context-policy.md

## Règle d'or

> **Pour chaque tâche : charger le strict minimum.**

## Budget par tâche (ordre de grandeur)

| Catégorie | Cible |
|-----------|-------|
| Pages doc chargées | 5-10 max |
| Lignes de code lues | < 2 000 |
| Skills chargés | 1-3 |
| Fichiers réellement modifiés | 1-8 |
| Conversations passées | **0** sauf si explicitement référencées |

Si tu dépasses : **STOP, découper la tâche**, ne pas pousser plus loin.

## Ce qui est gratuit (à toujours avoir)

- `/AGENT_RULES.md`
- `/agent-quality-system/AGENT_RULES.md`
- `/agent-quality-system/router/skill-router.md`
- Le brief de la tâche

## Ce qui est conditionnel (charger SEULEMENT si pertinent)

| Si la tâche touche... | Charge |
|------------------------|--------|
| `auth/billing/data export` | `agent-quality-system/policies/approval-policy.yml` |
| Une feature visuelle | `docs/design/DESIGN.md`, `docs/design/no-ai-slop.md` |
| Un module de la registry | `module.yaml` + spec/ du module concerné |
| Un backend pack | `pack.yaml` + `contracts/` du pack concerné |
| Le moteur d'un template SaaS | `<template>/CLAUDE.md` + `<template>/RUN_FLOW.md` |
| Du data export | `growth-data-layer/exports/export-policy.md` + `legal/data-selling-policy.md` |
| Un workflow n8n | `automation-packs/n8n/policies/automation-policy.yml` |
| Du LLM/IA | `ai-privacy-gateway/policies/ai-data-policy.yml` |

## Ce qui est INTERDIT à charger

- Toute la `reference-library/` (ce sont des notes, pas des règles runtime)
- `repo-graph/graph.json` complet (utiliser une requête ciblée seulement)
- Les conversations Claude/Codex précédentes
- Les fichiers `node_modules/`, `.next/`, `dist/`
- Les fichiers > 5 000 lignes (sauf nécessité absolue, alors lire par chunks)
- Les outputs `reports/` historiques (sauf le dernier seulement si pertinent)

## Cache de session

Pendant une session de travail, l'agent peut mémoriser :

- La structure du repo (déjà lue)
- Les imports/exports d'un module qu'il a lu
- Les types TypeScript du contexte
- Les choix d'architecture validés (cf `context-engine/memory/decisions-log.md`)

Mais il **ne re-charge pas** ces choses à chaque message — il s'y réfère.

## Stratégie de "search before load"

Au lieu de charger un gros fichier pour trouver une info :

1. `grep` le mot-clé pour localiser
2. lire **uniquement** le bloc autour (ex: 50 lignes avant/après)
3. si besoin de plus, élargir la fenêtre, pas charger le tout

## Token proxy

À terme, un proxy peut compter les tokens consommés par tâche et alerter
si on dépasse le budget. Cf `runtime/token-proxy-policy.md` (à coder phase 3).

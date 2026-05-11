# Stale context policy

## Problème

Un repo évolue. Un graph.json généré il y a 2 mois ne reflète plus le repo
actuel. Si un agent travaille sur un context obsolète, il peut casser des
choses qui ont été refactor entre temps.

## Règles

- `graph.json` est régénéré à chaque PR mergée (via GitHub Actions)
- Si `graph.json` n'a pas été regénéré depuis > 7j, le context-engine refuse
  de générer un packet (bloque dev-orchestrator)
- Si un agent commence une tâche puis attend > 24h pour push : invalider le
  packet et forcer une re-génération

## Détection

Hook PreToolUse vérifie `graph.json.generated_at` < 7j avant chaque tâche.

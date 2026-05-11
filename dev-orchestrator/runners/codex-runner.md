# Codex runner

> Exécute une tâche assignée par dev-orchestrator dans un environnement Codex.

## Inputs requis

- task : objet conforme à `task-queue/dev-tasks.schema.json`
- context_packet : pack de contexte préparé par context-engine
- branch : nom de la branche worktree

## Workflow

1. Codex reçoit la tâche + le context packet
2. Lit AGENT_RULES.md + skills mappés
3. Exécute la tâche (édition fichiers, tests)
4. Tools/scanners/run-all.sh sur le diff
5. Si OK : push la branche, ouvre PR draft

## Limites

- Max 8 fichiers modifiés
- Max 45 min d'exécution
- Max 2 retries en cas d'échec test
- Pas d'action `ask_before` sans escalade humaine

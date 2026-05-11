# context-engine/

> Anti-token-burn : ne charge JAMAIS plus que nécessaire pour une tâche.

## Layout

```
context-engine/
├── repo-graph/
│   └── graph.json            # carte du repo (Graphify output)
├── packets/
│   └── TASK-XXXX-context.md  # 1 packet par tâche, généré par dev-orchestrator
├── memory/
│   ├── decisions-log.md
│   ├── known-issues.md
│   ├── validated-choices.md
│   └── previous-errors.md
├── policies/
│   ├── minimal-context-policy.md   # cf agent-quality-system/runtime/
│   ├── stale-context-policy.md
│   └── repo-index-policy.md
└── graphify/
    └── graphify-config.yml
```

## Workflow

```
1. Dev-orchestrator détecte une tâche (TODO, failing test, etc.)
2. classify-task → quels skills + risk_level
3. context-engine génère un PACKET pour cette tâche :
   - Lit graph.json pour identifier les fichiers du périmètre
   - Inclut UNIQUEMENT ce périmètre + les skills mappés + AGENT_RULES
   - Output : packets/TASK-XXXX-context.md
4. Agent (Claude/Codex) reçoit ce packet seul (pas tout le repo)
5. Agent exécute, produit PR
```

## Anti-charge

Cf `agent-quality-system/runtime/minimal-context-policy.md` (source de vérité).

Règles courtes :
- Max 8 fichiers cibles par tâche
- Max 1-3 skills chargés
- 0 conversation passée
- 0 reference-library/ (notes, pas runtime)

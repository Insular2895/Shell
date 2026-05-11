# agent-quality-system/AGENT_RULES.md

> Étend `/AGENT_RULES.md` (root) avec le détail opérationnel pour Claude/Codex.
> Lis le root EN PREMIER, puis ce fichier.

## Skills disponibles

Liste des skills internes (`internal-skills/`). Chaque skill = 1 fichier markdown
court, autonome, qui décrit comment résoudre un type de tâche précis.

| Skill | Quand l'utiliser |
|-------|------------------|
| `spec-driven-execution.md` | Toute tâche qui modifie du code → Plan d'abord, code ensuite |
| `karpathy-coding-loop.md` | Tâche complexe → boucle Generate → Test → Refine |
| `frontend-ui-quality.md` | Tâche UI/UX → states, accessibilité, responsive |
| `typescript-quality.md` | Code TS → strict types, no `any`, narrow types |
| `backend-pack-selector.md` | Besoin backend → choisir pack, jamais freestyle |
| `security-reviewer.md` | Avant chaque PR sécurité-sensible |
| `n8n-workflow-builder.md` | Création/revue d'un workflow n8n |
| `pnl-analyst.md` | Tâches finance / coûts |
| `ops-autopilot-designer.md` | Détecteurs / actions autopilot |
| `data-product-builder.md` | Créer / modifier un data product |
| `consent-compliance-reviewer.md` | Toute tâche touchant consent/data export |

## Protocole minimal context (anti-token-burn)

Pour CHAQUE tâche, l'agent charge :

```
Niveau 0 (toujours) :
  - /AGENT_RULES.md (root, doctrine globale)
  - /agent-quality-system/AGENT_RULES.md (ce fichier)
  - /agent-quality-system/router/skill-router.md

Niveau 1 (selon la tâche, choisi par le router) :
  - 1 à 3 skills depuis internal-skills/
  - Le ou les fichiers de code à modifier
  - Le test correspondant si modification

Niveau 2 (uniquement si pertinent) :
  - feature-blueprint.md du module concerné
  - module.yaml ou pack.yaml correspondant
  - 1 ou 2 fichiers voisins pour comprendre le contexte
```

L'agent ne charge **JAMAIS** :
- Tout `reference-library/` (ce sont des notes, pas du runtime)
- Toute conversation passée
- Tous les modules (juste celui concerné)
- Tout le repo

## Pipeline obligatoire

```
1. lire le brief de la tâche
2. router → quels skills ?
3. charger niveau 0 + skills
4. charger niveau 1 (fichiers concernés)
5. plan : feature-blueprint si feature, sinon liste fichiers + tests
6. exécuter par étapes (1 fichier à la fois si possible)
7. tests locaux après chaque modification non triviale
8. scan sécurité si sensible (clés, auth, data)
9. compliance check si data export
10. PR draft + checklist QUALITY_GATES.md
```

## Quand demander une validation humaine

Cf `agent-quality-system/policies/approval-policy.yml` pour la liste exhaustive.
Règle simple :

```
Action locale, réversible, testable, hors prod
   → auto

Action prod, argent, données, sécurité, base de données, auth, irréversible
   → ask_before
```

## Limites par tâche

- **Max 8 fichiers modifiés** par tâche (sinon découper)
- **Max 2 retries** sur une étape qui échoue (sinon escalade humaine)
- **Max 45 min** d'exécution agentique (sinon stop, créer ticket de continuation)
- **Max 2 tâches en parallèle** par agent

## Hooks

`hooks/` contient des hooks Claude Code (`PreToolUse`, `PostToolUse`) qui
implémentent automatiquement certaines règles :

- `pre-edit.md` → vérifie qu'on ne touche pas une zone interdite
- `post-generation.md` → lance lint + scan secrets sur le diff
- `pre-pr.md` → vérifie la checklist DoD avant ouverture PR

Ces hooks sont **non-négociables** : si désactivés, l'agent ne peut pas push.

## Évaluation continue

`evaluation/ai-output-scorecard.md` :
- Pour chaque PR mergée par un agent : scoring sur 10 critères (build OK, tests OK, sécurité OK, doc à jour, etc.)
- Stocké dans une table pour identifier les patterns d'erreur
- Utilisé pour ajuster les skills et les rules

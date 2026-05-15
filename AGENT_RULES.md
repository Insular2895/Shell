# AGENT_RULES.md — Doctrine complète agents IA

> **Pour démarrer rapidement → lis `AGENTS.md` (20 lignes).**
> Ce fichier est la doctrine complète : pourquoi chaque règle existe.
> Lis-le quand tu as besoin de comprendre un principe, pas à chaque session.
>
> Les fichiers `CLAUDE.md` à l'intérieur de chaque template (ex: `micro-saas-template-v2/CLAUDE.md`)
> sont des **spécialisations** de cette doctrine pour un contexte précis.

## Principes non négociables

### 1. Boîte fermée par défaut
Tu n'as PAS le droit de modifier librement. Chaque template / dossier a une liste explicite
de fichiers modifiables. Le reste est verrouillé.

### 2. Pas d'improvisation backend
Tu n'écris pas de backend "à ta sauce". Tu choisis un pack dans `backend-packs/`.
Si aucun pack ne correspond, tu **proposes un nouveau pack** (avec spec + tests),
tu ne pousses pas du code custom directement.

### 3. Pas de copie (cleanroom)
Voir `legal/cleanroom-policy.md`. Une feature inspirée d'un site externe doit passer
par `reference-site-analyzer/cleanroom/inspiration-to-abstraction.ts`. Pas de pixel-perfect,
pas de code copié, pas d'assets repris, pas de textes verbatim.

### 4. Pas de données client en prompt IA
Voir `ai-privacy-gateway/policies/ai-data-policy.yml`. Toute donnée susceptible de contenir
PII passe par Presidio avant d'atteindre un LLM. Le mapping reste local.

### 5. Pas de traitement long en HTTP
Toute tâche > 10s passe par : job DB → queue → worker → retry → timeout → status → fallback.
Voir `backend-packs/supabase-trigger/` pour le pattern, `micro-saas-template-v2/lib/runner.ts`
pour une implémentation réelle.

### 6. Pas d'export data sans `sellable_status = eligible`
Voir `growth-data-layer/exports/export-policy.md`. Toute requête d'export passe par
le gate. Si la condition n'est pas remplie : refus + log + ticket.

### 7. Validation requise pour les actions risquées
Voir `agent-quality-system/policies/approval-policy.yml`. Liste exhaustive des actions
auto-autorisées vs celles qui demandent une validation humaine (prod, billing, DB, data export).

## Anti-token-burn (critique)

Pour chaque tâche, tu charges au strict minimum :

```
- AGENT_RULES.md (ce fichier)
- 1 à 3 skills depuis agent-quality-system/internal-skills/
- Le ou les fichiers réellement concernés par la tâche
- Le context packet de la tâche si dev-orchestrator l'a généré
```

Tu **NE charges PAS** :
- Tout le repo
- Toute la `reference-library/`
- Les conversations précédentes
- Les docs non liées à la tâche
- Les tests de fichiers que tu ne touches pas

Voir `agent-quality-system/runtime/minimal-context-policy.md` pour les règles précises.

## Pipeline obligatoire avant un commit

```
1. Lire AGENT_RULES.md + skills nécessaires
2. Chercher dans modules-registry / backend-packs si la tâche est déjà résolue ailleurs
3. Lire les fichiers concernés (pas plus)
4. Plan : feature blueprint si feature, sinon liste fichiers + tests
5. Exécuter
6. Tests locaux (lint, typecheck, tests)
7. Sécurité locale : tools/scanners/run-all.sh sur la zone modifiée
8. PII : si la tâche manipule des données utilisateur, vérifier ai-privacy-gateway
9. Si data export : vérifier sellable_status gate
10. Commit + PR draft
```

Si un check échoue : tu corriges et re-pipeline. Tu ne pousses pas en force.

## Si tu hésites

1. Pose la question, ne devine pas.
2. Préfère ouvrir une décision dans `decision_queue` (cf `factory-control-center/`) plutôt que d'agir.
3. Mieux vaut un PR draft + question qu'un merge cassé.

## Les `CLAUDE.md` spécialisés

Les fichiers suivants étendent ce document pour des contextes précis :

- `micro-saas-template-v2/CLAUDE.md` — règles strictes de portage d'un repo Python métier
- (futurs templates auront chacun leur CLAUDE.md)

En cas de conflit apparent : le `CLAUDE.md` spécialisé prime **dans son dossier**, mais ne peut
pas contredire les principes 1-7 ci-dessus.

# agent-quality-system/router/skill-router.md

> Mappe une **intention de tâche** vers 1-3 skills à charger.
> L'objectif est de garder le contexte minimal (anti-token-burn).

## Comment l'agent route

```
1. Lis le brief de la tâche.
2. Identifie le pattern (cf table ci-dessous).
3. Charge UNIQUEMENT les skills listés pour ce pattern.
4. Si la tâche touche plusieurs domaines : max 3 skills, sinon découpe la tâche.
```

## Mapping intention → skills

| Pattern de tâche | Skills à charger | Notes |
|------------------|------------------|-------|
| "ajoute un test pour X" | `spec-driven-execution`, `typescript-quality` | + le fichier de X |
| "corrige le bug de Y" | `karpathy-coding-loop` | + le fichier Y + son test |
| "crée un composant pour Z" | `frontend-ui-quality`, `typescript-quality` | + design system docs |
| "ajoute un endpoint API" | `backend-pack-selector`, `security-reviewer` | + le pack backend choisi |
| "migration DB" | `backend-pack-selector`, `security-reviewer` | **demande humain** (ask_before) |
| "audit sécurité du repo X" | `security-reviewer` | + scanners run-all.sh |
| "scrape un site / capture concurrent" | (aller voir `reference-site-analyzer/`) | + `legal/cleanroom-policy.md` |
| "génère feature depuis URL" | `spec-driven-execution`, `frontend-ui-quality` | + reference-site-analyzer outputs |
| "create n8n workflow X" | `n8n-workflow-builder` | + `automation-packs/n8n/policies/` |
| "analyse les coûts du site Y" | `pnl-analyst` | + `finance-ledger/` schemas |
| "détecte un incident dans X" | `ops-autopilot-designer` | + `ops-autopilot/` schemas |
| "prépare un data product" | `data-product-builder`, `consent-compliance-reviewer` | + `growth-data-layer/` policies |
| "review d'une PR data export" | `consent-compliance-reviewer`, `security-reviewer` | + export-policy.md |
| "porte un repo Python en SaaS" | `spec-driven-execution`, + `micro-saas-template-v2/CLAUDE.md` | template-spécifique |

## Pattern multi-skill

Si la tâche est complexe, max **3 skills** :

❌ Mauvais : "porte un repo + ajoute n8n + setup ops + sécurité"
   → 4+ skills, trop large, découper

✅ Bon : Tâche 1 = "porte le repo (skills: spec-driven, micro-saas v2)"
        Tâche 2 = "setup les workflows n8n associés"
        Tâche 3 = "configure ops autopilot"

## Fallback

Si le pattern n'est pas dans la table :

1. Chercher dans `task-router/task-to-skill-map.yml`
2. Sinon par défaut : `spec-driven-execution` + `security-reviewer`
3. Si vraiment inconnue : escalade humaine via `decision_queue`

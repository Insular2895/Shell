# CURRENT_STATUS.md — État réel du repo aujourd'hui

> Lis ce fichier avant tout autre. Il dit ce qui marche, ce qui est mock,
> ce qui est scaffold, et quelle est la prochaine action exacte.

---

## Ce qui marche aujourd'hui (✅ utilisable tel quel)

| Brique | Ce que tu peux faire concrètement |
|--------|----------------------------------|
| `micro-saas-template-v2/` | Cloner, installer, lancer en mode mock en 5 min. Le build, le typecheck et les tests passent. |
| `AGENT_RULES.md` | Doctrine agents IA opérationnelle — Claude la respecte à chaque session. |
| `QUALITY_GATES.md` | Checks PR bloquants définis et lisibles. |
| `RUN_SCHEMA.md` | Contrat input/output engine universel — utilisé par le template. |
| `growth-data-layer/` | Schémas SQL + politiques de consentement + sellable_status prêts à migrer dans Supabase. |
| `legal/` | Policies cleanroom, data-selling et licences rédigées et utilisables. |
| `agent-quality-system/` | Rules + approval policy + skills core définis. |
| `security-packs/` | Doctrine sécurité + configs minimales Semgrep/Gitleaks. |
| `finance-ledger/` | Schémas P&L + policies par site_id prêts à migrer. |

---

## Ce qui est en mode mock (simulation, pas de moteur réel)

| Brique | Ce qui est mocké | Impact |
|--------|-----------------|--------|
| `micro-saas-template-v2/engine/adapter.py` | La fonction `run()` retourne `output.example.json` si `ENGINE_MODE=mock` | Aucun code métier n'est exécuté, le résultat est statique |
| Worker Fly | Pas déployé en mode démo | Les jobs sont traités en mémoire, sans queue async |
| Stripe | Clés `test` uniquement — aucun vrai paiement | Billing fonctionnel mais non connecté à un compte live |

**Quand sortir du mock ?** Quand tu as un premier utilisateur réel ou un code métier Python à brancher. Voir `HAPPY_PATH.md`.

---

## Ce qui est scaffold (structure + README, code non écrit)

Ces dossiers ont une architecture claire, des policies, et parfois des schémas,
mais le code exécutable n'est pas encore écrit.

| Dossier | Ce qui existe | Ce qui manque |
|---------|--------------|---------------|
| `repo-factory-shell/` | Structure + package.json + README | CLI `audit`, `normalize`, `connect`, `scan` |
| `reference-site-analyzer/` | README + politique cleanroom | Intégrations Playwright / Firecrawl |
| `feature-generation/` | README + structure | Générateurs blueprint UI/API/worker |
| `modules-registry/` | README + structure | Modules versionnés réutilisables |
| `ai-privacy-gateway/` | Policy YAML + structure | Recognizers Presidio FR à activer |
| `backend-packs/` | 1 pack supabase-trigger + README | Packs FastAPI, NestJS, BullMQ |
| `ops-packs/` | README + structure | Configs Coolify, Uptime Kuma, Sentry, Renovate |
| `ops-autopilot/` | Schéma status + action policy | Service de détection d'incidents + blocage exports |
| `automation-packs/` | Policy + template-bank README | Workflows n8n versionnés |
| `factory-control-center/` | Schéma DB | Next.js cockpit multi-sites |
| `context-engine/` | README | Graphify anti-token-burn |
| `dev-orchestrator/` | README | Tâches IA bornées async |

---

## Ce qui n'est pas encore codé du tout

- Cockpit Next.js multi-sites (`factory-control-center/`)
- CLI factory complète (`repo-factory-shell/`)
- Pipeline Playwright/Firecrawl pour analyser des URLs concurrentes (`reference-site-analyzer/`)
- Génération automatique de feature blueprints (`feature-generation/`)
- Modules versionnés réutilisables (`modules-registry/`)
- Intégration Presidio anonymisation PII avant LLM (`ai-privacy-gateway/`)

---

## Prochaine action exacte

**Objectif V1 : brancher un premier repo Python métier sur le template.**

1. Cloner `micro-saas-template-v2/` → renommer en `mon-produit/`
2. Lancer en mode mock pour valider le Shell (voir `HAPPY_PATH.md`)
3. Écrire `engine/adapter.py` pour importer ton code Python (`from mon_core import run`)
4. Tester en local avec `ENGINE_MODE=local` (`python engine/run_engine.py engine/input.example.json`)
5. Vérifier que le résultat apparaît dans le dashboard via `AutoResultRenderer`
6. Déployer niveau 0 (Vercel + Supabase free, ~5 min) — voir `micro-saas-template-v2/DEPLOYMENT.md`

**Phase suivante (après V1 validé) :**
Activer `ai-privacy-gateway/` si l'adapter fait des appels LLM, puis `repo-factory-shell/` pour automatiser le portage d'autres repos.

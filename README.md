# Shell

**Shell est une factory SaaS modulaire pour transformer des repos métiers en micro-SaaS.**

---

## Ce que contient ce repo

| Brique | Description |
|--------|-------------|
| `micro-saas-template-v2` | Template Next.js / Supabase / Stripe — prêt à déployer |
| `repo-factory-shell` | Factory CLI pour scaffolder de nouveaux projets |
| `agent-quality-system` | Système d'agents, router, approval policy, hooks |
| `dev-orchestrator` | Détecteurs de tâches, classifieur, runners |
| `backend-packs` | 10 packs backend documentés (auth, billing, storage…) |
| `security-packs` | Scanners shell, Semgrep, Trivy, Gitleaks, GitHub Actions |
| `ops-packs` | Coolify, Uptime Kuma, Sentry, Renovate, Restic |
| `growth-data-layer` | SQL : consent, identity resolution, lead scoring, compliance |
| `legal` | Policies : cleanroom, data-selling, consent, attribution |
| `automation-packs` | 9 specs n8n + docker-compose |
| `factory-control-center` | Cockpit Next.js : DB schema + API routes + composants |
| `context-engine` | Memory, graphify, policies de contexte |
| `ai-privacy-gateway` | Presidio FR + redaction TS + docker-compose |
| `docs` | Architecture, sécurité, design, ops, ADRs |
| `modules-registry` | 18 modules specs (upload, consent, billing…) |

---

## Stack

```
Next.js 14 · Supabase · Stripe · TypeScript · Tailwind
```

---

## RUN Schema

Chaque tâche factory suit un contrat structuré défini dans [`RUN_SCHEMA.md`](RUN_SCHEMA.md).  
Les agents opèrent selon [`AGENT_RULES.md`](AGENT_RULES.md) et sont validés par [`QUALITY_GATES.md`](QUALITY_GATES.md).

---

## Démarrage rapide

```bash
# 1. Cloner le template v2
cp -r micro-saas-template-v2 mon-projet
cd mon-projet

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env.local

# 4. Lancer les scanners
./tools/scanners/run-all.sh .
```

---

## Phases de finalisation

| Phase | Brique | Statut |
|-------|--------|--------|
| 1 | CLI factory — commandes complètes | 🔧 En cours |
| 2 | Extracteurs Playwright / feature generators | 📋 Spécifié |
| 3 | Modules registry — composants UI | 📋 Spécifié |
| 4 | Cockpit UI — polish complet | 📋 Spécifié |
| 5 | n8n workflows JSON complets | 📋 Spécifié |
| 6 | Pipeline Splink / dbt | 📋 Spécifié |

Les contrats, schémas et policies sont en place — le code suit ces contrats.

---

> Voir [`README_FACTORY.md`](README_FACTORY.md) pour le plan détaillé des phases.

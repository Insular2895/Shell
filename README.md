# Shell

**Shell est une factory SaaS modulaire pour transformer des repos métiers en micro-SaaS déployables.**

Tu pars d'un repo Python (ou d'une idée, d'un screenshot, d'une URL) — tu ressors avec un SaaS complet : auth, billing, worker, monitoring, sécurité, data.

---

## Table des matières

1. [Le concept central](#1-le-concept-central)
2. [Architecture Shell / Engine](#2-architecture-shell--engine)
3. [Créer un produit de A à Z](#3-créer-un-produit-de-a-à-z)
4. [Le pipeline RUN en détail](#4-le-pipeline-run-en-détail)
5. [Déployer un produit](#5-déployer-un-produit)
6. [Le pipeline screenshot → module](#6-le-pipeline-screenshot--module)
7. [Les 18 briques de la factory](#7-les-18-briques-de-la-factory)
8. [Les règles qui gouvernent tout](#8-les-règles-qui-gouvernent-tout)
9. [Ce que les agents peuvent faire](#9-ce-que-les-agents-peuvent-faire)
10. [Phases de finalisation](#10-phases-de-finalisation)

---

## 1. Le concept central

Le système repose sur une séparation stricte entre **le Shell** et **le moteur**.

```
┌─────────────────────────────────────┐   ┌─────────────────────┐
│             SHELL (fixe)            │   │    ENGINE (change)   │
│                                     │   │                      │
│  Next.js + Supabase + Stripe        │   │  repo Python métier  │
│  auth · billing · jobs · UI         │   │  adapter.py          │
│  run.schema.json → formulaire auto  │   │  run_engine.py       │
│  ResultBlocks → rendu auto          │   │  Dockerfile          │
│                                     │   │                      │
│  NE CHANGE PAS entre produits       │   │  CHANGE par produit  │
└─────────────────────────────────────┘   └─────────────────────┘
```

**Le Shell est verrouillé.** Il gère tout ce qui ne change pas : connexion utilisateur, paiement, création de jobs, polling, rendu des résultats.

**Le moteur est variable.** C'est le repo Python qui contient la logique métier — CV scoring, résumé YouTube, OCR facture, analyse PDF, n'importe quoi.

Le contrat entre les deux est immuable et défini dans [`RUN_SCHEMA.md`](RUN_SCHEMA.md).

---

## 2. Architecture Shell / Engine

### La structure du template v2

```
micro-saas-template-v2/
├── config/
│   ├── product.config.ts     ← branding, pricing, landing (tu modifies ça)
│   └── run.schema.json       ← inputs du formulaire (tu modifies ça)
│
├── engine/
│   ├── manifest.yaml         ← ressources, limites, env requis (tu modifies ça)
│   ├── adapter.py            ← pont Shell ↔ repo métier (tu modifies ça)
│   ├── run_engine.py         ← orchestrateur (rarement modifié)
│   └── Dockerfile
│
├── app/                      ← verrouillé — ne pas toucher
├── components/               ← verrouillé
├── lib/                      ← verrouillé
└── supabase/migrations/      ← verrouillé
```

### Les 5 niveaux de configuration

| Niveau | Fichier | Vu par | Tu le modifies quand |
|--------|---------|--------|----------------------|
| 1 | `config/run.schema.json` | L'utilisateur (formulaire) | Tu changes les inputs du produit |
| 2 | `config/product.config.ts` | L'utilisateur (landing, branding) | Tu changes le nom, prix, couleurs |
| 3 | `engine/manifest.yaml` | Le runner | Tu changes les ressources ou secrets requis |
| 4 | `.env.local` / Vercel | Le Shell Next.js | Au déploiement |
| 5 | Docker runtime env | Le moteur Python | Au déploiement, déclaré dans manifest |

### Le contrat input / output

```json
// Input (Shell → Engine)
{
  "user_id": "uuid",
  "job_id": "uuid",
  "product_id": "string",
  "input": { ... selon run.schema.json ... }
}

// Output (Engine → Shell)
{
  "status": "success" | "error",
  "blocks": [ ... ],
  "error": "string optionnel",
  "metadata": { "durationMs": 1234 }
}
```

**9 types de blocks et pas un de plus** : `text`, `score`, `table`, `list`, `file`, `chart`, `json`, `warning`, `recommendation`. Si l'engine invente un type, le frontend ne sait pas le rendre. Utilise `json` pour de l'arbitraire.

---

## 3. Créer un produit de A à Z

Exemple : transformer un repo Python de scoring de CV en SaaS.

### Étape 1 — Copier le template

```bash
cp -r micro-saas-template-v2 resumeforge
cd resumeforge
pnpm install
```

### Étape 2 — Configurer le produit (`config/product.config.ts`)

```typescript
export const productConfig = {
  id: "resumeforge",
  name: "ResumeForge",
  domain: "resumeforge.com",
  theme: { primaryColor: "#6366f1" },
  landing: {
    heroTitle: "Score ton CV en 30 secondes",
    heroSubtitle: "IA entraînée sur 10 000 CV acceptés",
  },
  pricing: {
    freeRuns: 1,
    plans: [{ id: "pro", stripePriceId: "price_xxx", runsPerMonth: 50 }]
  }
}
```

### Étape 3 — Définir le formulaire (`config/run.schema.json`)

```json
{
  "title": "Analyser mon CV",
  "submitLabel": "Lancer l'analyse",
  "estimatedRuntime": "30 secondes",
  "inputs": [
    {
      "key": "cv_url",
      "type": "file",
      "label": "Ton CV (PDF)",
      "required": true
    },
    {
      "key": "target_job",
      "type": "text",
      "label": "Poste visé",
      "required": true
    }
  ]
}
```

Le formulaire `/run` est généré automatiquement à partir de ce fichier.

### Étape 4 — Écrire l'adapter (`engine/adapter.py`)

```python
# C'est LE seul vrai code que tu écris
import sys
sys.path.insert(0, "/opt/engine/vendor")
from resumeforge_core import score_cv   # ton repo métier

def run(payload: dict) -> dict:
    user_input = payload["input"]
    result = score_cv(
        cv_url=user_input["cv_url"],
        job_title=user_input["target_job"]
    )
    return {
        "status": "success",
        "blocks": [
            {"type": "score", "label": "Score global", "value": result.score},
            {"type": "list",  "title": "Points forts", "items": result.strengths},
            {"type": "list",  "title": "À améliorer",  "items": result.weaknesses},
            {"type": "recommendation", "title": "Conseil principal", "body": result.tip}
        ]
    }
```

### Étape 5 — Déclarer les ressources (`engine/manifest.yaml`)

```yaml
mode: job
runtime:
  type: docker
  image: ghcr.io/insular2895/resumeforge-engine:latest
  entrypoint: ['python', 'run_engine.py']
resources:
  needs_llm: true
  needs_storage: true
limits:
  max_runtime_seconds: 60
  max_input_mb: 5
env:
  required: [OPENAI_API_KEY]
```

### Étape 6 — Tester en local

```bash
# Mode mock (sans moteur)
ENGINE_MODE=mock npm run dev

# Mode docker (avec moteur réel)
ENGINE_MODE=docker npm run dev
python engine/run_engine.py --input engine/input.example.json --output /tmp/out.json
```

Le produit est prêt à déployer.

---

## 4. Le pipeline RUN en détail

Ce qui se passe exactement quand un utilisateur clique sur "Lancer" :

```
┌──────┐         ┌──────────────────────────────┐         ┌──────────┐
│ USER │         │        SHELL (Next.js)        │         │  ENGINE  │
└──┬───┘         └──────────────────────────────┘         └────┬─────┘
   │                                                            │
   │  1. GET /run                                               │
   │  ← formulaire généré depuis run.schema.json                │
   │                                                            │
   │  2. POST /api/jobs/create { input: {...} }                 │
   │         │                                                  │
   │         ├─ requireUser()      → vérif Supabase auth        │
   │         ├─ checkQuota()       → quota mensuel plan Stripe  │
   │         ├─ validate(Ajv)      → run.schema.json            │
   │         ├─ INSERT jobs        → status='pending'           │
   │         ├─ runEngine() async ─────────────────────────────►│
   │  ← 202 { jobId }             │                             │
   │                               │     validate (Pydantic)    │
   │  3. GET /results/[jobId]      │     adapter.run(payload)   │
   │         │                     │     → core logic           │
   │  ← status: 'running'          │     → output.json          │
   │                               │◄────────────────────────── │
   │         updateJob(success, result)                         │
   │                                                            │
   │  4. GET /api/jobs/[jobId]                                  │
   │  ← { status: 'success', result: { blocks: [...] } }        │
   │                                                            │
   │  5. AutoResultRenderer → rend les blocks                   │
```

### Les fichiers traversés par un paramètre

Suivons `cv_url` du formulaire jusqu'à l'engine :

```
run.schema.json       → "key": "cv_url", "type": "file"
AutoRunForm.tsx       → upload → signed URL Supabase Storage
/api/jobs/create      → { input: { cv_url: "https://...signed..." } }
jobs (Postgres)       → stocké en jsonb
lib/runner.ts         → écrit input.json, docker run
engine/run_engine.py  → json.load('/data/input.json')
engine/adapter.py     → payload["input"]["cv_url"]     ← même clé
resumeforge_core      → requests.get(cv_url)           ← arrivée finale
```

**Les fichiers ne voyagent jamais en JSON.** Ils sont uploadés via `POST /api/upload` vers Supabase Storage et transmis comme URLs signées.

### Les modes du runner

| Mode | Usage | Coût |
|------|-------|------|
| `mock` | Dev front sans moteur, démo waitlist | 0 |
| `docker` | Dev local avec moteur réel | CPU local |
| `http` | Engine déployé (Fly.io, Railway, Modal) | $/mois |

### Validation double (defense-in-depth)

```
Shell côté → Ajv valide run.schema.json
Engine côté → Pydantic valide le même payload
```

Si un champ manque ou est malformé, les deux couches le rejettent indépendamment.

### Sécurité des erreurs

```python
# ❌ INTERDIT — peut leaker des secrets dans les logs
return {"status": "error", "error": traceback.format_exc()}

# ✅ CORRECT
return {
    "status": "error",
    "error": f"adapter_{type(e).__name__}",
    "blocks": [{"type": "warning", "title": "Erreur", "message": "Une erreur est survenue."}]
}
```

### Mode mock obligatoire

Tout template doit fonctionner en `ENGINE_MODE=mock`. Cela retourne `output.example.json` sans appeler le moteur — utile pour les demos, la waitlist, et les tests frontend.

---

## 5. Déployer un produit

### Niveau 0 — Démo (0€, 5 min)

```bash
# 1. Supabase : créer un projet + exécuter les migrations
supabase/migrations/0001_initial.sql
supabase/migrations/0002_storage.sql
supabase/migrations/0003_jobs_queue_and_stripe_v2.sql

# 2. Vercel : ajouter les variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ENGINE_MODE          # "mock"
vercel env add CRON_SECRET          # openssl rand -hex 32
vercel env add WORKER_API_TOKEN     # openssl rand -hex 32

vercel deploy --prod
```

→ Site en ligne avec formulaire fonctionnel, résultats mockés, waitlist possible.

### Niveau 1 — Live avec vrais utilisateurs (0–20€/mois)

Ajouter à Niveau 0 :

```bash
# Stripe (billing réel)
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET

# Engine réel (Fly.io auto-stop)
vercel env add ENGINE_MODE=http
vercel env add ENGINE_URL=https://resumeforge-engine.fly.dev
vercel env add ENGINE_TOKEN=...
```

```bash
# Déployer le worker engine sur Fly
fly launch --dockerfile engine/Dockerfile
fly secrets set OPENAI_API_KEY=sk-...
fly deploy
```

### Niveau 2 — Pro / B2B (4–20€/mois fixes)

VPS Hetzner + Coolify + Postgres dédié + Redis. Déclenché uniquement si un client B2B exige des données on-premise ou si le volume le justifie. Voir `ops-packs/coolify/`.

---

## 6. Le pipeline screenshot → module

Quand tu t'inspires d'une app existante pour créer une feature :

### Étape A — Inspiration

```
Sources autorisées :
  screenshot d'un SaaS concurrent · template Webflow · maquette Figma
  app open source · landing concurrente · dashboard existant
```

La règle cleanroom (`legal/cleanroom-policy.md`) interdit : copier du code, des assets, du branding, des textes verbatim, du pixel-perfect. Elle impose de transformer l'inspiration en besoin métier abstrait avant toute implémentation.

### Étape B — Brouillon

```
screenshot → abi/screenshot-to-code → React/Tailwind brut
```

Ce code **n'est pas mergé**. Il sert à extraire : sections, composants, états UI, formulaires, interactions, hiérarchie visuelle.

### Étape C — Abstraction

```
Ce que le brouillon montre :          Ce que tu gardes :
  Zone drag and drop                    Function: upload-drag-drop
  Bouton "Upload file"                  Besoin : importer un fichier,
  Animation de progression               voir la progression,
                                         gérer les erreurs,
                                         envoyer au moteur RUN.
```

### Étape D — Function Book

```
docs/function-book/upload-drag-drop.md
```

```markdown
# upload-drag-drop

## Cas d'usage
analyse PDF · CV parser · transcript · facture OCR · import CSV

## États UI obligatoires
idle · dragging · uploading · processing · completed · failed · empty · degraded

## Sécurité
taille max · extensions autorisées · URL signées · bucket privé · antivirus · suppression auto

## Activation
modules.upload = true
```

### Étape E — Module registry

```
modules-registry/upload/
  module.yaml · spec/ · frontend/ · backend/ · workers/ · tests/
```

### Étape F — Activation produit

```typescript
export const productConfig = {
  modules: {
    upload: true,
    dashboard: true,
    billing: true,
  }
}
```

### Étape G — Intégration Shell

```
Fichier uploadé
  → POST /api/upload → URL signée Supabase Storage
  → POST /api/jobs/create { input: { file_url: "..." } }
  → validate (Ajv + Pydantic)
  → INSERT job pending
  → engine adapter.run()
  → output blocks
  → AutoResultRenderer
```

### Étape H — Quality check

```
design states ✓ · security rules ✓ · cleanroom check ✓ · tests ✓
```

### Version finale visée

```bash
factory feature:from-screenshot ./upload-screen.png
```

→ génère automatiquement : function-book, module-registry, specs, cleanroom report, design states, security rules, PR draft.

Aujourd'hui ce pipeline est manuel (phases 2–3).

---

## 7. Les 18 briques de la factory

```
Idée / URL / Screenshot
        │
        ▼
[reference-site-analyzer]  → cleanroom : analyse sans copier
        │
        ▼
[feature-generation]       → feature blueprint UI/API/worker/sécurité
        │
        ▼
[modules-registry]         → composants réutilisables versionnés
        │
        ▼
[backend-packs]            → patterns backend prévalidés
        │
        ▼
App déployée
        ├─ [ops-packs]               monitoring · backups · incidents
        ├─ [ops-autopilot]           fallback · quotas · auto-degrade
        ├─ [automation-packs]        workflows n8n versionnés
        ├─ [factory-control-center]  cockpit multi-sites P&L
        ├─ [finance-ledger]          revenus · coûts · P&L par site
        ├─ [growth-data-layer]       collecte · consentement · datasets
        ├─ [ai-privacy-gateway]      anonymisation avant LLM (Presidio)
        └─ [security-packs]          scans à chaque PR
```

| Brique | Rôle | Statut |
|--------|------|--------|
| `micro-saas-template-v2` | Template Next.js / Supabase / Stripe — Shell + engine pattern | MVP complet |
| `repo-factory-shell` | CLI : audit, normalize, connect, scaffold, scan | Skeleton phase 1 |
| `reference-site-analyzer` | URL/screenshot → feature spec cleanroom | Skeleton phase 2 |
| `feature-generation` | Idée → blueprint UI/API/worker/tests | Skeleton phase 2 |
| `modules-registry` | Composants versionnés réutilisables (18 modules specs) | Skeleton phase 2 |
| `backend-packs` | Patterns backend prévalidés (Supabase, Trigger.dev, BullMQ, FastAPI) | Scaffold |
| `agent-quality-system` | Skills, router, approval-policy, hooks pour Claude/Codex | MVP complet |
| `dev-orchestrator` | Tâches IA bornées async — détecteurs, classifieur, runners | Scaffold |
| `context-engine` | Graphify : mémoire des décisions, évite le token-burn | Scaffold |
| `security-packs` | Semgrep, Gitleaks, OSV, Trivy, CodeQL, ZAP — configs et scanners | Scaffold |
| `ai-privacy-gateway` | Presidio FR : détection + redaction PII avant tout appel LLM | Scaffold phase 1 |
| `growth-data-layer` | SQL : consent, identity resolution, lead scoring, datasets vendables | MVP complet |
| `ops-packs` | Coolify, Uptime Kuma, Sentry, Renovate, Restic | Scaffold |
| `ops-autopilot` | Fallback moteur, quotas, modes site, blocage exports | Scaffold phase 4 |
| `automation-packs` | 9 workflows n8n + docker-compose | Scaffold |
| `factory-control-center` | Cockpit Next.js multi-sites : P&L, incidents, sécurité | Scaffold phase 4 |
| `finance-ledger` | Revenus, coûts, P&L par site_id | MVP complet |
| `legal` | Cleanroom, data-selling, consent, attribution, licences | MVP complet |

---

## 8. Les règles qui gouvernent tout

### AGENT_RULES — 7 principes non négociables

Tout agent (Claude, Codex, dev-orchestrator) lit [`AGENT_RULES.md`](AGENT_RULES.md) en premier.

| Règle | Ce que ça interdit |
|-------|-------------------|
| Boîte fermée | Modifier hors des fichiers listés dans chaque template |
| Pas d'improvisation backend | Écrire du backend custom — on choisit un pack dans `backend-packs/` |
| Cleanroom | Copier du code, assets, textes, pixel-perfect d'un site externe |
| Pas de PII en prompt | Envoyer des données utilisateur à un LLM sans passer par Presidio |
| Pas de traitement long en HTTP | Toute tâche > 10s → job DB → queue → worker → retry → status |
| Pas d'export sans gate | Exporter de la data si `sellable_status != eligible` |
| Validation avant action risquée | Toute action sensible (prod, billing, DB) déclenche `ask_before` |

### QUALITY_GATES — Checks bloquants par PR

```
Code          lint · typecheck · tests · build
Sécurité      Gitleaks (secrets) · Semgrep (SAST) · OSV/Trivy (dépendances)
Data          pas de PII dans fixtures · consent vérifié · sellable_status gate
Modules       version bumped · module.yaml valide · CHANGELOG à jour
Workflow      pas de push direct main · PR description non vide
```

```bash
# Tout en local avant push
./tools/scanners/run-all.sh ./micro-saas-template-v2

# Tests du template
cd micro-saas-template-v2 && npm run ci
```

### La chaîne data (règle absolue)

```
collecte
  → consentement enregistré (consent_ledger — append-only)
  → identification contact (identity-resolution)
  → enrichissement contrôlé
  → sellable_status calculé

Aucune donnée ne sort si :
  opt_out = true · consent_partners = false
  sellable_status != eligible · retention_expires_at dépassé
```

Défini dans `growth-data-layer/exports/export-policy.md` et `legal/data-selling-policy.md`.

### Hiérarchie des règles

```
/AGENT_RULES.md                              (doctrine root — tous les agents)
        ↓ étend
/agent-quality-system/AGENT_RULES.md         (skills, policies, hooks)
        ↓ spécialise
/micro-saas-template-v2/CLAUDE.md            (règles strictes de portage v2)
```

En cas de conflit : `CLAUDE.md` prime dans son dossier, mais ne peut pas contredire les 7 principes root.

---

## 9. Ce que les agents peuvent faire

Défini dans [`agent-quality-system/policies/approval-policy.yml`](agent-quality-system/policies/approval-policy.yml).

### Auto-autorisé (sans demander)

```
lire des fichiers · chercher dans le repo · lancer les tests · lancer lint
créer une feature spec · générer des docs · corriger une erreur TypeScript
créer une branche locale · ouvrir une PR draft
bloquer un export data invalide · créer un ticket
```

### Review après (fait, puis review humaine)

```
modifier un composant · modifier une API route · créer un contrat backend
générer un draft de migration SQL (ne l'applique pas) · bumper une version mineure
```

### Demander avant (confirmation explicite requise)

```
changer la logique auth · changer la logique billing · modifier le schema DB
appliquer une migration en prod · déployer en production
changer des secrets · toucher lib/ ou middleware.ts d'un template
exporter un dataset vendable · signer un contrat buyer
```

### Impossible sans action humaine

```
supprimer des données client · exposer des secrets · désactiver les scans sécurité
désactiver le consent gate · pusher directement sur main · merger avec des checks en échec
vendre de la data sans consentement valide · bypasser la cleanroom policy
modifier les rows consent_ledger (append-only au niveau DB)
```

### Pipeline obligatoire avant commit

```
1. Lire AGENT_RULES.md + les skills nécessaires
2. Vérifier modules-registry / backend-packs : la tâche est peut-être déjà résolue
3. Lire uniquement les fichiers concernés (anti-token-burn)
4. Plan : feature blueprint si feature, sinon liste fichiers + tests
5. Exécuter
6. Tests locaux (lint, typecheck, tests)
7. tools/scanners/run-all.sh sur la zone modifiée
8. Si données utilisateur → vérifier ai-privacy-gateway
9. Si export → vérifier sellable_status gate
10. Commit + PR draft
```

---

## 10. Phases de finalisation

| Phase | Briques | Statut |
|-------|---------|--------|
| **1 — Foundation** | CLI factory complet · Presidio recognizers FR · scanners aggregate | 🔧 En cours |
| **2 — App generation** | reference-site-analyzer · feature-generation · modules-registry · design system | 📋 Spécifié |
| **3 — Agents / contexte** | context-engine wiring · dev-orchestrator runtime · approval-policy CI | 📋 Spécifié |
| **4 — Ops multi-sites** | factory-control-center · ops-autopilot detectors · cockpit UI complet | 📋 Spécifié |
| **5 — Automation** | n8n workflows JSON complets · automation-packs delivery | 📋 Spécifié |
| **6 — Data & monétisation** | growth-data-layer pipeline · Splink · dbt · delivery log complet | 📋 Spécifié |
| **7 — Gouvernance** | ADRs systématiques · module versioning · AI output scorecard | 📋 Spécifié |

Les contrats, schémas et policies de toutes les phases sont en place. Le code d'exécution suit ces contrats phase par phase.

---

## Fichiers à lire en premier

```
README.md                                          (ce fichier)
README_FACTORY.md                                  plan détaillé des 7 phases
AGENT_RULES.md                                     doctrine agents (Claude/Codex)
QUALITY_GATES.md                                   checks PR obligatoires
RUN_SCHEMA.md                                      contrat universel input/output
legal/data-selling-policy.md                       règle data vendable
legal/cleanroom-policy.md                          règle anti-copie
agent-quality-system/policies/approval-policy.yml  auto vs ask_before vs bloqué
micro-saas-template-v2/RUN_FLOW.md                 pipeline RUN paramètre par paramètre
micro-saas-template-v2/DEPLOYMENT.md               déploiement niveau 0/1/2
```

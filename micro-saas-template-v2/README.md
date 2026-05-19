# Micro-SaaS Template — v2.0 (verrouillé)

> **Une factory pour transformer des repos GitHub métier en produits SaaS déployables.**
>
> Ce template est verrouillé. Tu construis le Shell une fois ; pour chaque
> nouveau produit, tu changes uniquement la partie RUN (config + schema + adapter).

> 🆕 **v2** : queue async (worker externe), billing gate pour ne pas payer de
> worker sans client actif, validation Ajv+Pydantic defense-in-depth, hooks Claude
> Code, slash commands `/security-review` et `/cso`. Voir
> [`CHANGELOG.md`](CHANGELOG.md) pour les 5 bugs critiques corrigés vs v1.

---

## Lis ces fichiers, dans cet ordre

| # | Fichier | Pour quoi |
|---|---|---|
| 1 | [`README.md`](README.md) | Vue d'ensemble (tu y es) |
| 2 | [`DEPLOYMENT.md`](DEPLOYMENT.md) | Setup Vercel + Supabase + Stripe + worker Fly |
| 3 | [`SECURITY.md`](SECURITY.md) | Threat model, CVEs défendus, audit checklist |
| 4 | [`RUN_FLOW.md`](RUN_FLOW.md) | Le pipeline RUN expliqué, paramètre par paramètre |
| 5 | [`SOURCE_REPO_SPEC.md`](SOURCE_REPO_SPEC.md) | Comment structurer un repo Python métier |
| 6 | [`CLAUDE.md`](CLAUDE.md) | Les règles strictes pour Claude lors d'un portage |

Et garde [`PORTING_CHECKLIST.md`](PORTING_CHECKLIST.md) sous la main pour chaque
nouveau produit. [`CHANGELOG.md`](CHANGELOG.md) liste tous les correctifs.

### Workflow Claude Code (gstack-inspired)

- `.claude/commands/security-review.md` → `/security-review` audit du diff courant
- `.claude/commands/cso.md` → `/cso` audit OWASP+STRIDE complet
- `.claude/commands/review.md` → `/review` staff engineer code review
- `.claude/commands/qa.md` → `/qa` tests E2E + IDOR
- `.claude/commands/ship.md` → `/ship` release engineer pre-flight
- `.claude/hooks/` → bloque rm -rf, secrets, modifs middleware

---

## Le modèle, en une image

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  ton-engine-core            │         │  ton-saas-template          │
│  (repo métier Python)       │         │  (clone de ce template)     │
│                             │         │                             │
│  - logique pure             │         │  - Shell Next.js 16         │
│  - pip-installable          │  imports│  - Auth Supabase            │
│  - testable avec pytest     │◄────────┤  - Billing Stripe           │
│  - aucune dep au SaaS       │         │  - Dashboard, run, results  │
│                             │         │                             │
│  expose: run(input) → dict  │         │  engine/adapter.py importe  │
└─────────────────────────────┘         └─────────────────────────────┘
```

**Deux repos par produit, jamais un seul.** Le repo métier est réutilisable hors
SaaS (CLI, notebook, autre framework). Le Shell est verrouillé : Claude ne le
modifie jamais.

---

## Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind | SSR natif, déploiement gratuit Vercel, écosystème mature |
| Auth + DB + Storage | Supabase (Postgres + RLS + Storage) | Tout en un service, free tier 0 €, RLS multi-tenant gratuit |
| Billing | Stripe (Checkout + Customer Portal + Webhooks) | Standard de l'industrie, pas de mensuel |
| Engine runtime | Docker (Python par convention, mais agnostique) | N'importe quel repo qui peut être conteneurisé |
| Hosting Shell | Vercel | Free Hobby tier suffit jusqu'aux 1ers clients |
| Hosting Engine | Fly Machines par défaut | Démarrage/arrêt via billing Stripe + Machines API |

**Coût avant clients : 0 €/mois** (sauf domaine, ~10 €/an).

Runtime par défaut :
- Sans abonnement `active`/`trialing` non-free : `engine_mode='mock'`, pas de worker.
- Avec abonnement actif : `engine_mode='live'`, jobs en queue, worker Fly démarré à la demande.
- Si le client arrête de payer : webhook Stripe + cron repassent en `mock` et stoppent le worker.

---

## Arborescence

```
micro-saas-template/
│
├── 📚 DOCS (à lire)
│   ├── README.md
│   ├── DEPLOYMENT.md           ← guide Vercel+Supabase+Stripe step-by-step
│   ├── RUN_FLOW.md             ← le pipeline expliqué
│   ├── SOURCE_REPO_SPEC.md     ← structure du repo Python métier
│   ├── PORTING_CHECKLIST.md    ← procédure de portage par produit
│   ├── CLAUDE.md               ← règles strictes pour Claude
│   └── CHANGELOG.md            ← v0 → v1, sources officielles
│
├── 🔧 ÉDITABLE PAR PRODUIT (les 4 fichiers à toucher)
│   ├── config/
│   │   ├── product.config.ts   ← branding, copy, pricing
│   │   └── run.schema.json     ← inputs du formulaire (génère l'UX)
│   └── engine/
│       ├── manifest.yaml       ← mode + ressources + limites
│       ├── adapter.py          ← LE SEUL VRAI CODE MÉTIER
│       ├── Dockerfile
│       ├── requirements.txt
│       └── input/output.example.json
│
├── 🔒 SHELL (figé, ne change JAMAIS par produit)
│   ├── app/
│   │   ├── (auth)/login + signup       ← Server Actions
│   │   ├── auth/callback               ← OAuth/email exchange
│   │   ├── dashboard                   ← liste des runs
│   │   ├── run                         ← AutoRunForm universel
│   │   ├── results/[jobId]             ← AutoResultRenderer universel
│   │   ├── billing                     ← Stripe Checkout
│   │   ├── settings
│   │   ├── page.tsx                    ← landing générée depuis config
│   │   └── api/
│   │       ├── jobs/create             ← crée un job + lance l'engine
│   │       ├── jobs/[id]               ← polling
│   │       ├── upload                  ← double rôle: user upload + engine callback
│   │       └── stripe/
│   │           ├── checkout            ← crée une checkout session
│   │           ├── portal              ← ouvre le Customer Portal
│   │           └── webhook             ← idempotent, vérifie signature
│   │
│   ├── components/
│   │   ├── run/AutoRunForm.tsx         ← form généré depuis run.schema.json
│   │   └── results/
│   │       ├── AutoResultRenderer.tsx
│   │       └── blocks/                 ← 9 types de blocks (text, score, table, list, file, chart, json, warning, recommendation)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               ← Browser client
│   │   │   ├── server.ts               ← Server client + service-role
│   │   │   └── middleware.ts           ← updateSession (pattern officiel)
│   │   ├── auth.ts                     ← getUser, requireUser, requireUserOr401
│   │   ├── billing.ts                  ← Stripe Checkout + Portal
│   │   ├── jobs.ts                     ← CRUD jobs DB
│   │   ├── quota.ts                    ← vérifie runs restants
│   │   ├── runner.ts                   ← Shell→Engine (mock/docker/http)
│   │   └── storage.ts                  ← uploads user + engine, signed URLs
│   │
│   ├── supabase/migrations/
│   │   ├── 0001_initial.sql            ← jobs + subscriptions + stripe_events + usage_events + RLS
│   │   └── 0002_storage.sql            ← buckets + RLS storage.objects
│   │
│   ├── proxy.ts                        ← délègue à updateSession, exclut webhooks
│   ├── config/result.schema.ts         ← types de blocks (figé)
│   │
│   ├── package.json                    ← Next 16, React 19, Stripe v21, Supabase ssr 0.7
│   ├── vercel.json                     ← maxDuration par route critique
│   ├── tsconfig.json, tailwind.config.ts, next.config.mjs, postcss.config.mjs
│   └── .env.example
│
└── 🛠 OUTILLAGE
    └── scripts/new-product.sh          ← duplique le template pour un nouveau produit
```

---

## Démarrage

```bash
# 1. Cloner ce template
git clone <ce-repo> mon-saas
cd mon-saas
npm install

# 2. Configurer
cp .env.example .env.local
# → remplir : Supabase URL + key, Stripe keys, ENGINE_MODE=mock

# 3. Pousser le schéma DB (depuis Supabase SQL Editor ou CLI)
npx supabase db push   # ou copier-coller les .sql dans le dashboard

# 4. Lancer
npm run dev
```

Suite détaillée dans **[`DEPLOYMENT.md`](DEPLOYMENT.md)**.

---

## Créer un nouveau produit

```bash
./scripts/new-product.sh
```

Le script demande nom, domaine, couleur, mode engine, repo source. Il duplique
le template et patche les fichiers de config.

Ensuite, suis [`PORTING_CHECKLIST.md`](PORTING_CHECKLIST.md) pour brancher le
métier (= éditer **uniquement** les 4 fichiers autorisés par
[`CLAUDE.md`](CLAUDE.md)).

---

## Le contrat universel

Tout produit, peu importe le métier, suit ce flux :

```
input utilisateur (validé par run.schema.json)
    ↓
job créé en DB (table jobs, RLS user_id = auth.uid())
    ↓
runner.ts lance l'engine (Docker exec ou HTTP)
    ↓
engine retourne { status, blocks: [...] }
    ↓
AutoResultRenderer.tsx rend les blocks (générique)
```

**Format de sortie obligatoire** :

```json
{
  "status": "success",
  "blocks": [
    { "type": "text|score|table|list|file|chart|json|warning|recommendation", ... }
  ]
}
```

C'est ce qui rend le Shell réutilisable à 90%.

---

## Mantra

> Le site ne change presque jamais.
> Claude adapte uniquement le RUN.
> Le branding donne l'impression d'un produit différent.
> Le moteur donne la vraie valeur métier.

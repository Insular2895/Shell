# RUN_FLOW.md — Comment marche le pipeline RUN, paramètre par paramètre

> Ce doc trace **tout** ce qui se passe quand un utilisateur clique sur "Lancer".
> Si tu comprends ça, tu comprends le système.

## Vue d'ensemble

```
┌──────┐     ┌─────────────────────────────────────────┐     ┌────────────┐
│ USER │     │              SHELL (Next.js)            │     │   ENGINE   │
│      │     │                                         │     │  (Docker)  │
└──┬───┘     └─────────────────────────────────────────┘     └─────┬──────┘
   │                                                                │
   │ 1. Charge /run                                                 │
   ├───────────────────────────►                                    │
   │   AutoRunForm lit run.schema.json                              │
   │◄────────────────────── form rendu                              │
   │                                                                │
   │ 2. Remplit le form, click "Lancer"                             │
   ├──────────► POST /api/jobs/create { input: {...} }              │
   │                │                                               │
   │                ├─ requireUser() → Supabase auth                │
   │                ├─ checkQuota() → SELECT count FROM jobs        │
   │                ├─ createJob() → INSERT INTO jobs (pending)     │
   │                ├─ runEngine() ── async ──┐                     │
   │                │                         │                     │
   │  ◄─────── { jobId } ◄───────────────────┤                     │
   │                                          │                     │
   │ 3. Redirect /results/[jobId]             ├─ ENGINE_MODE=docker │
   │                                          │  → docker run ...   │
   │                                          ├─────────────────────►
   │ 4. Polling toutes les 2s                 │                     │
   ├──────────► GET /api/jobs/[id]            │       run_engine.py │
   │                                          │       ↓             │
   │  ◄─── { status: 'running' } ─────────────┤       adapter.run() │
   │                                          │       ↓             │
   │  (boucle...)                             │       core_run()    │
   │                                          │       (métier pur)  │
   │                                          │       ↓             │
   │                                          │       /data/output  │
   │                                          │◄────────────────────┤
   │                                          │                     │
   │                            updateJobStatus(success, result)    │
   │                                                                │
   │  ◄─── { status: 'success', result: {blocks: [...]} }           │
   │                                                                │
   │ 5. AutoResultRenderer rend les blocks                          │
   │                                                                │
```

## Les 5 niveaux de paramètres

Il y a 5 endroits différents où tu configures des choses. Bien les distinguer
évite la confusion.

### Niveau 1 — Le formulaire utilisateur (`config/run.schema.json`)

**Qui le définit ?** Toi, pour chaque produit.
**Qui le voit ?** L'utilisateur final (formulaire généré).
**Qui le consomme ?** Le moteur via `payload.input`.

```json
{
  "title": "Résumer une playlist YouTube",
  "submitLabel": "Lancer le résumé",
  "estimatedRuntime": "2 à 5 minutes",
  "inputs": [
    {
      "key": "playlist_url",          ← DOIT matcher payload.input.playlist_url
      "type": "url",                  ← détermine le composant rendu
      "label": "URL de la playlist",  ← affiché à l'utilisateur
      "required": true,
      "validation": {
        "pattern": "^https?://...",   ← validé côté client
        "errorMessage": "..."
      }
    },
    {
      "key": "summary_depth",
      "type": "select",
      "default": "rapide",            ← valeur initiale
      "options": [
        { "value": "rapide", "label": "Rapide..." }
      ]
    }
  ]
}
```

**Types de champs supportés** par AutoRunForm :
`text`, `textarea`, `url`, `email`, `number`, `select`, `multiselect`, `boolean`, `file`.

### Niveau 2 — La config produit (`config/product.config.ts`)

**Qui le définit ?** Toi, pour chaque produit.
**Qui le consomme ?** Le Shell (landing, méta SEO, theme, billing).
**Pas vu par le moteur.**

```ts
{
  id: "playlistbrief",        ← doit matcher manifest.yaml.id
  name: "PlaylistBrief",
  domain: "playlistbrief.com",
  theme: { primaryColor: "#FF0033", logo: "/logo.svg", ... },
  landing: { heroTitle, heroSubtitle, features, ... },
  pricing: {
    freeRuns: 1,
    plans: [
      { id: "starter", stripePriceId: "price_xxx", runsPerMonth: 20 }
    ]
  },
}
```

### Niveau 3 — Le manifest moteur (`engine/manifest.yaml`)

**Qui le définit ?** Toi, pour chaque produit.
**Qui le consomme ?** Le runner (`lib/runner.ts`) au moment du déploiement.
**Pas vu par l'utilisateur.**

```yaml
mode: job              # job (one-shot) ou service (long-running)
runtime:
  type: docker
  image: ghcr.io/insular2895/playlistbrief-engine:latest
  entrypoint: ['python', 'run_engine.py']
resources:
  needs_llm: true       # → l'orchestrateur injecte OPENAI_API_KEY au container
  needs_storage: true   # → le bucket job-outputs est accessible à l'engine
  needs_redis: false    # → pas de Redis provisionné (économise infra)
limits:
  max_runtime_seconds: 900    # tué après 15 min
  max_input_mb: 10
env:
  required: [OPENAI_API_KEY]
  optional: [YOUTUBE_API_KEY]
```

### Niveau 4 — Les variables d'environnement Shell (`.env.local` / Vercel)

**Qui le définit ?** Toi, au déploiement.
**Qui le consomme ?** Le Shell (Next.js).

```bash
# Auth + DB + Storage
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Billing
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Comment le Shell lance le moteur :
ENGINE_MODE=mock|docker|http
ENGINE_IMAGE=ghcr.io/.../engine:latest    # si mode=docker
ENGINE_URL=https://engine.fly.dev          # si mode=http
ENGINE_TOKEN=...                           # auth pour le service distant

# Token interne pour les appels engine→Shell (uploads de fichiers)
SHELL_SERVICE_TOKEN=...
```

### Niveau 5 — Les variables d'environnement Engine (Docker runtime)

**Qui le définit ?** Toi, au déploiement, déclarées dans `manifest.yaml`.
**Qui le consomme ?** Le moteur (le code Python du repo métier).

```bash
# Lus par le repo métier (resumeforge_core)
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...

# Lus par engine/adapter.py pour callback uploads
SHELL_INTERNAL_URL=http://host.docker.internal:3000  # dev
SHELL_SERVICE_TOKEN=...
```

L'orchestrateur (Vercel + Docker en prod, ou docker run en dev) injecte
uniquement les vars listées dans `manifest.env.required` et `manifest.env.optional`.

## Trace complète d'un paramètre

Suivons `playlist_url` depuis le formulaire jusqu'à l'engine :

```
1. config/run.schema.json
   {
     "key": "playlist_url",                         ← le nom canonique
     "type": "url",
     "required": true
   }

2. AutoRunForm.tsx
   const [values, setValues] = useState({})
   <input onChange={(e) => setField('playlist_url', e.target.value)} />

3. /run/page.tsx
   await fetch('/api/jobs/create', {
     method: 'POST',
     body: JSON.stringify({ input: values })       ← { playlist_url: "https://..." }
   })

4. /api/jobs/create/route.ts
   const job = await createJob({
     userId: user.id,
     productId: productConfig.id,
     input: body.input                              ← stocké en jsonb dans la table jobs
   })
   await runEngine({
     user_id: user.id,
     job_id: job.id,
     product_id: productConfig.id,
     input: body.input                              ← { playlist_url: "..." }
   })

5. lib/runner.ts (mode docker)
   fs.writeFile('/tmp/.../input.json', JSON.stringify(payload))
   docker run ... mounts /tmp/.../ → /data
                                                     ← Docker volume

6. engine/run_engine.py
   payload = json.load(open('/data/input.json'))
   result = adapter.run(payload)

7. engine/adapter.py
   user_input = payload["input"]
   playlist_url = user_input["playlist_url"]        ← MÊME clé qu'à l'étape 1
   result = core_run({ "playlist_url": playlist_url, ... })

8. resumeforge_core/pipeline.py (le repo métier)
   def run(input: RunInput, *, work_dir):
       url = input["playlist_url"]                   ← arrivée finale
       ...
```

**Cohérence des clés** : la même clé (`playlist_url`) est utilisée partout. Si tu
la renommes dans `run.schema.json`, tu DOIS la renommer dans `adapter.py` aussi.
Sinon le moteur reçoit `KeyError`.

## Le cas des fichiers (upload de CV, image, etc.)

Les fichiers ne voyagent **jamais** dans le payload JSON. Ils suivent un flow
en 2 étapes :

```
┌─ User pick file ──┐
│                   ▼
│   POST /api/upload (multipart)
│         │
│         ├─ Supabase Storage upload
│         │   bucket: job-uploads
│         │   path: <user_id>/<uuid>.pdf
│         │
│         └─ retourne signed URL (7 jours)
│
└─ form value devient cette URL au lieu du File brut
       │
       ▼
   POST /api/jobs/create
   { input: { cv_url: "https://...signed-url..." } }
       │
       ▼
   Le moteur télécharge avec requests.get()
   dans son work_dir, puis traite localement.
```

Implication : un input `type: "file"` dans `run.schema.json` est en réalité
**un URL** au moment où il atteint l'engine. AutoRunForm doit gérer le upload
intermédiaire — c'est un TODO dans le scaffold actuel (à compléter au moment
de brancher ton premier vrai produit avec fichiers).

## Le contrat à chaque frontière

Les contrats sont **figés** aux frontières. C'est ce qui rend le système robuste
même quand Claude touche au moteur.

| Frontière | Contrat |
|---|---|
| Form → API Shell | `{ input: <selon run.schema.json> }` |
| API Shell → DB | `INSERT INTO jobs (user_id, product_id, input, status='pending')` |
| Shell → Engine | `payload = { user_id, job_id, product_id, input }` |
| Engine → Shell | `{ status: 'success'\|'error', blocks: [...], error?: string }` |
| DB → Frontend | `Job` row, polled via GET /api/jobs/[id] |
| Frontend rendering | `result.blocks[]` → AutoResultRenderer dispatch par type |

## Modes du runner

`lib/runner.ts` lit `process.env.ENGINE_MODE` et choisit comment lancer le moteur :

| Mode | Quand l'utiliser | Coût |
|---|---|---|
| `mock` | Dev front-only, pas de vrai moteur | 0 |
| `docker` | Dev local avec moteur réel, ou worker Vercel/Fly | CPU local |
| `http` | Engine déployé en service (Fly.io, Railway, Modal, AWS ECS) | $/mois fixe |

Stratégie recommandée :
- **Dev** : `mock` puis `docker`
- **Pré-prod / petits volumes** : `docker` lancé par une Vercel cron ou Fly Machines à la demande
- **Prod / gros volumes** : `http` vers un service permanent + queue Redis

## Modes du moteur (`mode` dans manifest.yaml)

| Mode | Cas d'usage | Comportement |
|---|---|---|
| `job` | one-shot (CV scoring, résumé YouTube) | container démarre, traite, meurt. Le job a un état final. |
| `service` | long-running (proxy IP, monitoring) | container reste up, le Shell appelle des endpoints (start/stop/status). |

Le runner gère les deux. Aujourd'hui le scaffold implémente surtout `job` ;
`service` nécessitera un état additionnel dans `jobs` (ex: `external_session_id`).
À implémenter quand tu auras un vrai cas d'usage `service`.

## TL;DR — où vont les paramètres

```
run.schema.json   →   formulaire UX                 (vu par l'user)
product.config.ts →   landing/branding/pricing     (vu par l'user)
manifest.yaml     →   ressources & limites moteur  (lu par le runner)
.env Shell        →   secrets côté Next.js         (Vercel)
.env Engine       →   secrets côté Docker          (déclarés dans manifest)
payload.input     →   données utilisateur du run   (form → API → engine)
result.blocks     →   réponse du moteur            (engine → frontend)
```

Tu touches **les 3 premiers** par produit. Tu touches **les 2 derniers**
seulement si tu changes le moteur.

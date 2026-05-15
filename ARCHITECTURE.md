# ARCHITECTURE.md — Flux techniques

> Vue synthétique. Détails dans `docs/architecture/`.

---

## 1. Séparation Shell / Engine

```
repo-metier/          (Python, logique pure, pip-installable)
  └── run(input) → dict

mon-produit/          (clone de micro-saas-template-v2)
  ├── Shell           Next.js · Auth · Billing · Jobs · Dashboard
  └── engine/
        ├── adapter.py        ← le seul fichier qui importe repo-metier
        ├── run_engine.py     ← point d'entrée Docker
        └── manifest.yaml     ← runtime, limites, secrets requis
```

**Règle :** deux repos par produit. Le Shell ne change pas. Seul l'Engine change.

---

## 2. Pipeline RUN (utilisateur → résultat)

```
/run (formulaire généré par run.schema.json)
  │
  ▼ POST /api/jobs/create
  ├── requireUser()       auth Supabase
  ├── checkQuota()        quota mensuel (cache Redis si actif, sinon Supabase)
  ├── createJob()         INSERT jobs (pending)
  └── runEngine() async ──┐
                           │
       ENGINE_MODE=mock    │ → retourne output.example.json (~1.5s)
       ENGINE_MODE=docker  │ → docker run → adapter.py → core_run()
       ENGINE_MODE=http    │ → POST worker externe (Fly / Railway / Modal)
                           │
                    updateJobStatus(success | error)
                           │
/results/[jobId] ←─────────┘
  └── AutoResultRenderer lit les blocks → rendu sans code UI
```

**Contrat output fixe :**
```json
{ "status": "success", "blocks": [...], "metadata": { "durationMs": 0 } }
```

---

## 3. Niveaux de déploiement

| Niveau | Stack | Coût | Quand |
|--------|-------|------|-------|
| **0 — Démo** | Vercel + Supabase free · ENGINE_MODE=mock | ~0 €/mois | Waitlist, test produit |
| **1 — Live** | Niveau 0 + worker Fly auto-stop + Stripe live | 0-20 €/mois | Premier client payant |
| **2 — Pro** | VPS Hetzner + Coolify + Postgres dédié + Redis | 4-20 €/mois fixe | Client B2B, données sensibles |

Démarrer au niveau 0. Monter uniquement si le business le justifie.

---

## 4. Cache (mémoire → Redis)

Par défaut : `CACHE_PROVIDER=memory` (in-memory, zéro dépendance).

Passer à Redis (`CACHE_PROVIDER=redis`) dès que :
- Déploiement multi-instance Vercel (rate limit non partagé sinon)
- > 100 jobs/jour (quota Supabase coûteux)
- Engine LLM coûteux (cache sur hash de l'input)

Voir `docs/architecture/cache-layer.md` pour les clés, TTL et fournisseurs (Upstash serverless ou Redis standard).

---

## 5. Sécurité (invariants)

- Auth → Supabase RLS (Row Level Security activé sur toutes les tables)
- Secrets → variables d'env injectées au runtime, jamais dans le code
- Webhooks → pattern `verify → enqueue → ACK 200` (Stripe idempotency)
- PII → passe par `ai-privacy-gateway/` avant tout appel LLM
- Exports data → bloqués si `sellable_status != eligible` (voir `growth-data-layer/`)

---

## 6. Fichiers de référence

| Question | Fichier |
|----------|---------|
| Règles agents (opérationnel) | `AGENTS.md` |
| Doctrine agents (complète) | `AGENT_RULES.md` |
| Contrat input/output engine | `RUN_SCHEMA.md` |
| Pipeline RUN détaillé | `micro-saas-template-v2/RUN_FLOW.md` |
| Déploiement pas à pas | `micro-saas-template-v2/DEPLOYMENT.md` |
| Cache Redis / Upstash | `docs/architecture/cache-layer.md` |
| Scalabilité | `docs/architecture/scalability-principles.md` |
| Patterns simples | `docs/architecture/simple-system-patterns.md` |

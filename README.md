# Shell

> **Transformer des repos métiers en micro-SaaS déployables — template d'abord, automation ensuite.**

---

L'objectif n'est pas de construire toute la factory automatique dès le départ.

```
Template-first, automation later.

  1. Stabiliser un Shell fixe.
  2. Créer un template produit réutilisable.
  3. Brancher un premier repo pilote à la main.
  4. Comprendre ce qui revient à chaque fois.
  5. Transformer ces répétitions en modules.
  6. Automatiser seulement après plusieurs cas réels.
```

> On ne construit pas directement une méga-usine abstraite.
> On construit d'abord un moule propre, on le teste sur un vrai repo,
> puis on améliore ce moule produit après produit.

---

## Table des matières

1. [Vision](#1-vision)
2. [Stratégie actuelle : template-first](#2-stratégie-actuelle--template-first)
3. [Architecture Shell / Engine](#3-architecture-shell--engine)
4. [Ce qui est fixe vs ce qui change](#4-ce-qui-est-fixe-vs-ce-qui-change)
5. [Créer un produit à partir d'un repo](#5-créer-un-produit-à-partir-dun-repo)
6. [Contrat universel RUN](#6-contrat-universel-run)
7. [Premier objectif concret](#7-premier-objectif-concret)
8. [Pipeline screenshot → module](#8-pipeline-screenshot--module)
9. [Statut réel des briques](#9-statut-réel-des-briques)
10. [Règles agents et sécurité](#10-règles-agents-et-sécurité)
11. [Roadmap de construction](#11-roadmap-de-construction)
12. [Fichiers à lire en premier](#12-fichiers-à-lire-en-premier)

---

## 1. Vision

Shell sert à créer des **micro-SaaS à partir de repos métiers existants**.

Exemples de repos métiers :

- repo Python d'analyse de CV
- repo d'audit GitHub
- repo d'analyse PDF
- repo OCR facture
- repo résumé vidéo
- repo scoring SEO
- repo data cleaning CSV
- repo forecast / supply chain

Le but est de **ne pas reconstruire à chaque fois** :

| Brique fixe | Description |
|---|---|
| Auth | Authentification utilisateur |
| Billing | Paiement + quotas |
| Upload | Gestion fichiers |
| Jobs | Queue asynchrone |
| Worker | Exécution engine |
| Dashboard | Interface résultats |
| Logs | Monitoring |
| Sécurité | Règles + scanners |
| Déploiement | CI/CD standardisé |

Ces éléments deviennent le **Shell fixe**.
Le repo métier devient l'**Engine variable**.

---

## 2. Stratégie actuelle : template-first

La priorité n'est pas encore d'automatiser toute la factory.

La priorité est de prouver une chaîne simple :

```
un repo existant
  → branché au Shell
  → input utilisateur
  → job lancé
  → engine exécuté
  → résultat retourné
  → résultat affiché
  → démo déployable
```

**La méthode validée :**

1. Créer les parties fixes du Shell
2. Créer un template produit propre
3. Prendre un premier repo pilote
4. Le paramétrer pour le Shell
5. Documenter ce qui a été modifié
6. Répéter avec 2 ou 3 autres repos
7. Automatiser seulement les étapes qui reviennent toujours

Ce repo n'est donc **pas encore une factory magique**.

C'est d'abord :
- un template fiable
- une méthode de portage
- des règles strictes
- une future factory automatisée

---

## 3. Architecture Shell / Engine

Le système repose sur une **séparation stricte** :

```
┌─────────────────────────────────────┐      ┌────────────────────────────┐
│ SHELL FIXE                          │      │ ENGINE VARIABLE             │
│                                     │      │                            │
│  Next.js / Supabase / Stripe        │      │  Repo métier Python         │
│  Auth                               │      │  adapter.py                 │
│  Billing                            │      │  run_engine.py              │
│  Jobs                               │      │  manifest.yaml              │
│  Upload                             │      │  requirements.txt           │
│  Dashboard                          │      │  Dockerfile                 │
│  AutoRunForm                        │      │                            │
│  AutoResultRenderer                 │      │  Logique métier réelle      │
│                                     │      │                            │
│  Ne change presque jamais           │      │  Change à chaque produit    │
└─────────────────────────────────────┘      └────────────────────────────┘
```

**Le Shell sait gérer :** utilisateur · paiement · quota · création de job · upload · polling · rendu des outputs · historique · logs · erreurs · sécurité

**L'Engine sait faire :** traitement métier · analyse · calcul · scoring · génération · classification · extraction · recommandation

---

## 4. Ce qui est fixe vs ce qui change

### Fichiers fixes

Ces fichiers **ne doivent pas être modifiés** à chaque nouveau produit :

```
app/
components/
lib/
middleware.ts
supabase/migrations/
config/result.schema.ts
```

### Fichiers modifiables par produit

Pour créer un nouveau produit, on modifie principalement :

```
config/product.config.ts
config/run.schema.json
engine/manifest.yaml
engine/adapter.py
```

| Fichier | Rôle |
|---|---|
| `product.config.ts` | Nom, branding, landing, pricing, modules activés |
| `run.schema.json` | Inputs utilisateur, formulaire auto-généré |
| `manifest.yaml` | Runtime, limites, ressources, secrets requis |
| `adapter.py` | Pont entre le Shell et le repo métier |

---

## 5. Créer un produit à partir d'un repo

Exemple : transformer un repo Python d'audit GitHub en SaaS.

### Étape 1 — Choisir un repo pilote

Le premier repo doit être simple. Critères :

- entrée claire
- sortie claire
- commande exécutable
- peu de dépendances
- résultat affichable en blocks

**Produit pilote recommandé : GitHub Repo Audit**

Pourquoi :
- cohérent avec la mission du repo
- facile à comprendre
- sortie facile à rendre : score, table, recommandations
- bon exemple de produit B2B

### Étape 2 — Copier le template

```bash
cp -r micro-saas-template-v2 github-audit-saas
cd github-audit-saas
pnpm install
```

### Étape 3 — Configurer le produit

Modifier `config/product.config.ts` :

```ts
export const productConfig = {
  id: "github-audit",
  name: "GitHub Audit",
  domain: "github-audit.com",

  theme: {
    primaryColor: "#111827"
  },

  landing: {
    heroTitle: "Audit a GitHub repo in minutes",
    heroSubtitle: "Structure, documentation, security and execution readiness."
  },

  pricing: {
    freeRuns: 3,
    plans: [
      { id: "pro", name: "Pro", stripePriceId: "price_xxx", runsPerMonth: 100 }
    ]
  },

  modules: {
    upload: false,
    dashboard: true,
    billing: true,
    exports: true
  }
}
```

### Étape 4 — Définir les inputs utilisateur

Modifier `config/run.schema.json` :

```json
{
  "title": "Audit GitHub repo",
  "submitLabel": "Run audit",
  "estimatedRuntime": "30-60 seconds",
  "inputs": [
    {
      "key": "repo_url",
      "type": "text",
      "label": "GitHub repository URL",
      "placeholder": "https://github.com/user/repo",
      "required": true
    },
    {
      "key": "audit_depth",
      "type": "select",
      "label": "Audit depth",
      "required": true,
      "options": [
        { "label": "Quick", "value": "quick" },
        { "label": "Standard", "value": "standard" },
        { "label": "Deep", "value": "deep" }
      ]
    }
  ]
}
```

Ce fichier génère automatiquement le formulaire `/run`.

### Étape 5 — Brancher le repo métier

Modifier `engine/adapter.py` :

```python
import sys
sys.path.insert(0, "/opt/engine/vendor")

from github_audit_core import audit_repo

def run(payload: dict) -> dict:
    user_input = payload["input"]

    result = audit_repo(
        repo_url=user_input["repo_url"],
        depth=user_input["audit_depth"]
    )

    return {
        "status": "success",
        "blocks": [
            { "type": "score",  "label": "Global repo score", "value": result["score"] },
            { "type": "table",  "title": "Audit summary", "columns": ["Area", "Status", "Comment"], "rows": result["summary_rows"] },
            { "type": "list",   "title": "Priority fixes", "items": result["priority_fixes"] },
            { "type": "recommendation", "title": "Next best action", "body": result["main_recommendation"] }
        ],
        "metadata": { "durationMs": result.get("duration_ms") }
    }
```

### Étape 6 — Déclarer le runtime

Modifier `engine/manifest.yaml` :

```yaml
mode: job

runtime:
  type: docker
  image: ghcr.io/insular2895/github-audit-engine:latest
  entrypoint: ["python", "run_engine.py"]

resources:
  needs_llm: false
  needs_storage: false

limits:
  max_runtime_seconds: 60
  max_input_mb: 1

env:
  required: []
```

### Étape 7 — Tester en mock

```bash
ENGINE_MODE=mock pnpm dev
```

Objectif : formulaire visible · job créé · résultat exemple affiché · aucun engine réel appelé

### Étape 8 — Tester l'Engine réel

```bash
python engine/run_engine.py \
  --input engine/input.example.json \
  --output /tmp/output.json
```

Vérifier : `status = success` · `blocks` = array · types autorisés · pas de secret dans les outputs

### Étape 9 — Tester le Shell complet

```bash
pnpm lint && pnpm typecheck && pnpm build
./tools/scanners/run-all.sh ./github-audit-saas
```

---

## 6. Contrat universel RUN

Le contrat Shell → Engine est **fixe**.

**Input**
```json
{
  "user_id": "uuid",
  "job_id": "uuid",
  "product_id": "string",
  "input": {
    "repo_url": "https://github.com/user/repo",
    "audit_depth": "standard"
  }
}
```

**Output**
```json
{
  "status": "success",
  "blocks": [
    { "type": "score", "label": "Global score", "value": 82 }
  ],
  "metadata": { "durationMs": 1234 }
}
```

**Types de blocks autorisés**

| Type | Usage |
|---|---|
| `text` | Texte libre |
| `score` | Valeur numérique ou % |
| `table` | Données tabulaires |
| `list` | Liste d'items |
| `file` | Fichier téléchargeable |
| `chart` | Graphique |
| `json` | Données brutes |
| `warning` | Alerte |
| `recommendation` | Action recommandée |

> L'Engine ne doit pas inventer de nouveau type. Si un résultat ne rentre pas dans un type existant, utiliser `json` ou `file`.

---

## 7. Premier objectif concret

**Ce n'est pas :**
- tout automatiser
- générer une app complète depuis un screenshot
- connecter 18 briques
- faire un cockpit multi-sites complet

**C'est :**

```
1 repo réel  +  1 template propre  +  1 adapter
→ 1 formulaire  →  1 job  →  1 output  →  1 rendu  →  1 README clair
```

**Définition du succès V1 :**

- [ ] Le template démarre en local
- [ ] Le mode mock fonctionne
- [ ] Le repo métier peut être appelé via `adapter.py`
- [ ] Les résultats sont rendus avec `AutoResultRenderer`
- [ ] Les checks de base passent
- [ ] Le portage est documenté

> Tant que cette chaîne n'est pas stable, il ne faut pas complexifier.

---

## 8. Pipeline screenshot → module

Le screenshot-to-code sert **uniquement de brouillon d'analyse**, pas de code final.

```
screenshot / URL / template Webflow
  → brouillon UI
  → extraction des fonctions utiles
  → abstraction cleanroom
  → function book
  → module registry
  → intégration Shell
```

**Ce qu'on garde :** structure générale · besoin fonctionnel · états UI · interactions · patterns UX

**Ce qu'on ne garde pas :** code copié · branding · assets · textes exacts · classes générées sans contrôle

### Exemple de Function Book

`docs/function-book/upload-drag-drop.md`

```markdown
# upload-drag-drop

## Cas d'usage
- analyse PDF, CV parser, OCR facture, import CSV, transcript analyzer

## États UI
idle · dragging · uploading · processing · completed · failed · empty · degraded

## Sécurité
taille max · extensions autorisées · URL signées · bucket privé · suppression auto

## Activation
modules.upload = true
```

> Aujourd'hui, ce pipeline doit rester **manuel**. L'automatisation viendra après plusieurs modules validés.

---

## 9. Statut réel des briques

| Brique | Rôle | Statut | Priorité |
|---|---|---|---|
| `micro-saas-template-v2` | Template produit Shell + Engine | MVP / à stabiliser | **Haute** |
| `RUN_SCHEMA.md` | Contrat input/output | Défini | **Haute** |
| `AGENT_RULES.md` | Règles globales agents | Défini | **Haute** |
| `QUALITY_GATES.md` | Checks PR / sécurité | Défini / à rendre exécutable | **Haute** |
| `tools/scanners` | Scans sécurité locaux | Partiel | **Haute** |
| `legal/` | Cleanroom / data / licences | MVP | **Haute** |
| `security-packs` | Configs sécurité | Scaffold | **Haute** |
| `repo-factory-shell` | CLI audit/scaffold/connect | Skeleton | Moyenne |
| `modules-registry` | Modules réutilisables | Skeleton | Moyenne |
| `backend-packs` | Patterns backend validés | Scaffold | Moyenne |
| `ai-privacy-gateway` | Redaction PII avant LLM | Scaffold | Moyenne |
| `reference-site-analyzer` | URL/screenshot → spec cleanroom | Skeleton | Plus tard |
| `feature-generation` | Génération blueprint feature | Skeleton | Plus tard |
| `growth-data-layer` | Consentement / datasets | MVP doctrine + SQL | Plus tard |
| `finance-ledger` | P&L par site | MVP doctrine + SQL | Plus tard |
| `factory-control-center` | Cockpit multi-sites | Scaffold | Plus tard |
| `ops-packs` | Monitoring / backups / infra | Scaffold | Plus tard |
| `automation-packs` | Workflows n8n | Scaffold | Plus tard |

---

## 10. Règles agents et sécurité

Tout agent IA qui modifie ce repo doit lire :

```
AGENT_RULES.md
QUALITY_GATES.md
RUN_SCHEMA.md
micro-saas-template-v2/CLAUDE.md
```

**Règles non négociables :**

1. Ne pas modifier le Shell fixe sans raison explicite
2. Ne pas écrire de backend freestyle si un pack existe
3. Ne pas copier du code ou du design depuis un concurrent
4. Ne pas envoyer de PII dans un prompt LLM
5. Ne pas mettre de traitement long dans une route HTTP
6. Ne pas exporter de data sans consentement valide
7. Ne pas bypasser les checks sécurité
8. Ne pas push directement sur `main`

**Avant chaque commit :**

```bash
pnpm lint
pnpm typecheck
# tests si disponibles
pnpm build
# scan secrets + dépendances + sécurité
# vérification contrat output
```

---

## 11. Roadmap de construction

### Phase 0 — Nettoyage repo

> Rendre le repo crédible à l'ouverture.

- [ ] Supprimer les dossiers générés par erreur
- [ ] Corriger les fichiers mal formatés
- [ ] Vérifier les README par dossier
- [ ] Ajouter `CURRENT_STATUS.md`
- [ ] Ajouter `HAPPY_PATH.md`

### Phase 1 — Template produit stable

> Avoir un moule propre.

- [ ] Stabiliser `micro-saas-template-v2`
- [ ] Vérifier `pnpm install` · `lint` · `typecheck` · `build`
- [ ] Vérifier `ENGINE_MODE=mock`
- [ ] Vérifier `AutoRunForm` + `AutoResultRenderer`

### Phase 2 — Premier repo pilote

> Brancher un vrai repo métier.

- [ ] Choisir un repo simple
- [ ] Définir `input.example.json` + `output.example.json`
- [ ] Écrire `adapter.py` · `run.schema.json` · `manifest.yaml`
- [ ] Documenter le portage

**Produit pilote recommandé : GitHub Repo Audit SaaS**

### Phase 3 — Deuxième et troisième repos

> Détecter les répétitions.

- [ ] Porter 2 autres repos (PDF analyzer · CSV cleaner · SEO audit)
- [ ] Noter les étapes identiques et les points bloquants
- [ ] Identifier les modules réutilisables

### Phase 4 — Modules fixes

> Créer les premiers modules vraiment réutilisables.

Priorité : `upload-drag-drop` · `dashboard-kpi-cards` · `result-table-export` · `auth-wall` · `billing-paywall` · `job-history`

Chaque module doit avoir : `README.md` · `module.yaml` · `frontend/` · `backend/` · `states.md` · `security.md` · `tests/`

### Phase 5 — Automatisation légère

> Automatiser ce qui est répétitif, pas ce qui est encore flou.

```bash
factory scaffold my-product
factory validate ./my-product
factory scan ./my-product
factory contract:validate ./engine/output.example.json
```

> Ne pas commencer par là. Le CLI vient après le template et les premiers portages.

### Phase 6 — Factory avancée

> Aller vers la factory complète.

`reference-site-analyzer` · `feature-generation` · `modules-registry complet` · `factory-control-center` · `ops-autopilot` · `automation-packs` · `growth-data-layer complet`

---

## 12. Fichiers à lire en premier

```
1.  README.md                              ← vous êtes ici
2.  CURRENT_STATUS.md
3.  HAPPY_PATH.md
4.  RUN_SCHEMA.md
5.  AGENT_RULES.md
6.  QUALITY_GATES.md
7.  README_FACTORY.md
8.  micro-saas-template-v2/README.md
9.  micro-saas-template-v2/RUN_FLOW.md
10. micro-saas-template-v2/PORTING_CHECKLIST.md
11. legal/cleanroom-policy.md
```

---

## Mantra

```
Le Shell ne change presque jamais.
Le produit change par configuration.
L'Engine porte la vraie valeur métier.
Le premier repo pilote valide la méthode.
L'automatisation arrive seulement après répétition.
```

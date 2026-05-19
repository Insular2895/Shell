# RECONCILIATION.md — Comment tout s'emboîte

> Ce repo (`Insular2895/Shell`) contient à la fois des **briques factory**
> (les ~18 dossiers ajoutés en v2) et des **templates SaaS concrets**
> (`micro-saas-template-v2/`). Ce fichier explique qui dépend de qui, et
> comment éviter la confusion.

## Diagramme

```
                           ┌─────────────────────────────┐
                           │  Doctrine root (immuable)   │
                           │                             │
                           │  AGENT_RULES.md             │
                           │  QUALITY_GATES.md           │
                           │  RUN_SCHEMA.md              │
                           │  README_FACTORY.md          │
                           └──────────┬──────────────────┘
                                      │ étendue par
                ┌─────────────────────┼─────────────────────┐
                ▼                                            ▼
   ┌──────────────────────┐               ┌─────────────────────────────┐
   │  Briques factory     │               │  Templates SaaS              │
   │                      │               │                              │
   │  agent-quality-      │ utilisé par   │  micro-saas-template-v2/    │
   │   system/            │──────────────▶│   - Shell Next.js           │
   │  growth-data-layer/  │               │   - Engine Python           │
   │  ai-privacy-gateway/ │               │   - Worker Fly              │
   │  backend-packs/      │               │   - Stripe + Supabase       │
   │  security-packs/     │               │                              │
   │  ops-packs/          │               │  CLAUDE.md → étend          │
   │  ops-autopilot/      │               │   AGENT_RULES.md root       │
   │  factory-control-    │               │                              │
   │   center/            │               │  INTEGRATION_NOTES.md →     │
   │  ...                 │               │   liste les ponts factory   │
   │                      │               │                              │
   │  legal/              │               │  (futurs templates ici :    │
   │  modules-registry/   │               │   docs-saas-template,       │
   │  feature-generation/ │               │   ats-template, etc.)       │
   │  reference-site-     │               │                              │
   │   analyzer/          │               └─────────────────────────────┘
   │  repo-factory-shell/ │
   └──────────────────────┘
```

## Règles de coexistence

### 1. La factory **n'est pas obligatoire** pour utiliser un template seul

Tu peux cloner `micro-saas-template-v2/` standalone et le déployer (5 min
niveau 0 mock — cf `micro-saas-template-v2/DEPLOYMENT.md`). Pas besoin de
toucher aux autres dossiers tant que tu n'as pas plusieurs sites OU besoin
de vendre de la data.

### 2. Le template **respecte** les contrats factory

Même standalone, v2 implémente les patterns factory (queue, idempotency,
auto-degrade, validation defense-in-depth). Si tu actives la factory plus
tard, l'intégration est straightforward (cf `INTEGRATION_NOTES.md` de v2).

### 3. Les briques factory **n'ont pas leur propre app**

`agent-quality-system/`, `growth-data-layer/`, etc. ne sont **pas** des apps
déployables. Ce sont :
- Des doctrines (markdown)
- Des schémas SQL à appliquer dans une Supabase
- Des configs YAML lues par l'autopilot / le cockpit
- Des hooks Claude Code

Le **cockpit** (`factory-control-center/`) sera la seule app de la factory
elle-même, à coder en phase 4.

### 4. Quoi vit où

| Question | Réponse |
|----------|---------|
| Doctrine globale | `/AGENT_RULES.md`, `/QUALITY_GATES.md`, `/RUN_SCHEMA.md` |
| Règles agents IA | `/agent-quality-system/` |
| Pattern backend | `/backend-packs/` |
| Tests sécurité | `/security-packs/` |
| Anonymisation IA | `/ai-privacy-gateway/` |
| Schemas data + consent | `/growth-data-layer/` |
| Monitoring/maintenance | `/ops-packs/` |
| Mode site (live/mock/maintenance) | `/ops-autopilot/status-service/` + impl dans v2 (`site_config` table) |
| Cockpit multi-sites | `/factory-control-center/` |
| Workflows back-office | `/automation-packs/n8n/` |
| Coûts/revenus/P&L | `/finance-ledger/` (schema vit dans factory-control-center DB) |
| Légal | `/legal/` |
| Sites en prod | `/ops/services/<site>.yml` |
| **Implémentations concrètes** | `/micro-saas-template-v2/` (et futurs templates) |

## Anti-patterns à éviter

❌ **Dupliquer les schémas SQL** : la table `master_leads` est définie une fois
   dans `/growth-data-layer/storage/master-schema.sql`. Pas de copie dans v2.
   v2 a sa propre `auth.users` Supabase. Si v2 collecte des leads pour la
   factory globale, il **émet** des events que l'ETL pousse dans la growth DB.

❌ **Mélanger les `CLAUDE.md`** : le root `AGENT_RULES.md` contient les règles
   GLOBALES. v2/CLAUDE.md ne fait que les spécialiser. Pas de contradiction.

❌ **Hard-coder les emails / org / brand dans les briques factory** : ces
   briques sont neutres. Le branding va dans les templates ou les sites.

❌ **Mettre du runtime dans `agent-quality-system/reference-library/`** :
   ces fichiers sont des notes pour humains, pas du code que les agents lisent
   par défaut. Cf `runtime/minimal-context-policy.md`.

## Ordre de lecture pour un nouveau venu

1. `README.md` (du repo) — point d'entrée
2. `README_FACTORY.md` — vue d'ensemble factory
3. `AGENT_RULES.md` — règles agents
4. `RUN_SCHEMA.md` — contrat input/output
5. `legal/data-selling-policy.md` — règle data critique
6. `micro-saas-template-v2/README.md` — template concret le plus avancé
7. `micro-saas-template-v2/INTEGRATION_NOTES.md` — comment v2 fit dans la factory
8. (selon besoin) une brique factory précise

## En cas d'évolution

Toute évolution structurelle (nouveau dossier factory, nouveau template,
nouveau contrat) DOIT :

1. Faire l'objet d'un ADR dans `/docs/decisions/`
2. Mettre à jour ce fichier `RECONCILIATION.md`
3. Mettre à jour `README_FACTORY.md` au root
4. Si touche v2 : mettre à jour `INTEGRATION_NOTES.md` de v2

Sans ça, le repo dérive et personne ne sait plus où trouver quoi.

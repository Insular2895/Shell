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

## Le fonctionnement complet

### 1. Tu pars d'un screenshot ou d'un template

Tu vois une app avec un bon pattern UI — un drag and drop upload, un onboarding propre, un dashboard métier.

Sources possibles :
- screenshot d'un SaaS concurrent
- template Webflow ou Figma
- app open source
- landing concurrente
- dashboard existant

**On ne copie pas.** Le repo a une règle cleanroom : reproduire la fonction, pas la forme. Elle interdit de copier code, assets, branding, textes ou pixel-perfect — et impose de transformer l'inspiration en besoin métier abstrait avant toute implémentation.

---

### 2. Tu utilises screenshot-to-code comme brouillon

Tu convertis le screenshot en code brut avec [abi/screenshot-to-code](https://github.com/abi/screenshot-to-code) — sorties possibles : HTML/Tailwind, React/Tailwind, Vue, Bootstrap, SVG.

```
screenshot → screenshot-to-code → brouillon React/Tailwind
```

Ce code **n'est pas mergé directement**. Il sert uniquement à extraire :
- les sections et la hiérarchie visuelle
- les composants et états UI
- les formulaires, boutons, interactions principales

---

### 3. Tu transformes le brouillon en fonction abstraite

Ce que tu vois dans le brouillon :

```
Zone drag and drop au centre
Bouton bleu "Upload file"
Animation de progression
```

Ce que tu gardes :

```
Function: upload-drag-drop

Besoin métier :
Permettre à un utilisateur d'importer un fichier,
voir la progression, gérer les erreurs,
puis envoyer le fichier au moteur RUN.
```

C'est la logique cleanroom : capture → extraction → abstraction → reconstruction avec le design system et les modules Shell.

---

### 4. Tu ajoutes une fiche dans le Function Book

```
docs/function-book/upload-drag-drop.md
```

```markdown
# upload-drag-drop

## Fonction
Permettre à l'utilisateur d'uploader un fichier.

## Cas d'usage
- analyse PDF · CV parser · transcript upload · facture OCR · import CSV

## États UI obligatoires
idle · dragging · uploading · processing · completed · failed · empty · degraded

## Sécurité
taille max · extensions autorisées · URL signées · bucket privé · antivirus · suppression auto

## Activation produit
modules.upload = true
```

---

### 5. Tu transformes la fiche en module réutilisable

```
modules-registry/upload/
  module.yaml
  spec/          business-spec.md · technical-spec.md · security-rules.md
  frontend/      components/ · states.md
  backend/       endpoints.md · schemas.ts · migrations/
  workers/       jobs.md
  tests/         test-plan.md
```

Le screenshot ne devient pas "un écran copié". Il devient un module propre, documenté, versionné, activable.

---

### 6. Tu actives le module dans un produit

```typescript
export const productConfig = {
  productName: "PDF Analyzer",
  modules: {
    upload: true,
    dashboard: true,
    resultsRenderer: true,
    exportPdf: true,
    consentManager: true,
    billing: true,
  }
}
```

**SaaS PDF** → `upload + document-extraction + resultsRenderer + exportPdf + billing`  
**SaaS transcript YouTube** → `urlInput + resultsRenderer + exportMarkdown + billing`

C'est ça la vraie logique "drag and drop" : pas du drag and drop visuel dans Webflow, mais l'activation de modules fonctionnels.

---

### 7. Le module se branche au RUN du Shell

```
Fichier uploadé
  → URL signée Supabase Storage
  → input validé par run.schema.json (Ajv + Pydantic)
  → job créé
  → worker
  → moteur métier
  → output blocks
  → résultat affiché
```

Le module upload ne fait pas tout — il prépare l'input propre pour le moteur. Le contrat complet est dans [`RUN_SCHEMA.md`](RUN_SCHEMA.md).

---

### Vue d'ensemble du pipeline

```
Étape A  Inspiration       screenshot d'une app concurrente
Étape B  Brouillon         abi/screenshot-to-code → React/Tailwind brut
Étape C  Abstraction        "créer un module upload-drag-drop"
Étape D  Function Book      docs/function-book/upload-drag-drop.md
Étape E  Module registry    modules-registry/upload/
Étape F  Activation         modules: { upload: true }
Étape G  Intégration Shell  component + API + storage + run.schema + worker + blocks
Étape H  Quality check      design states · security · cleanroom · tests
```

---

### Version finale visée

```bash
factory feature:from-screenshot ./upload-screen.png
```

La factory génère automatiquement :
- `docs/function-book/upload-drag-drop.md`
- `modules-registry/upload/`
- feature spec + cleanroom report + design states + security rules + PR prête à review

Aujourd'hui ce pipeline est manuel. C'est l'objet des phases 2–3 de finalisation.

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

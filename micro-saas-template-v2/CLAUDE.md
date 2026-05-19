# CLAUDE.md — Règles de portage (v2.0)


> **CONTEXTE FACTORY** — Ce template vit dans le repo `Insular2895/Shell`
> aux côtés des autres briques de la factory (`backend-packs/`, `growth-data-layer/`, etc.).
> Avant de commencer, lis :
> 1. `/AGENT_RULES.md` (root du repo) — doctrine globale agents
> 2. `/agent-quality-system/policies/approval-policy.yml` — quoi est auto vs ask_before
> 3. `/RUN_SCHEMA.md` (root) — contrat universel input/output
> Ce CLAUDE.md spécialise ces règles pour le portage d'un repo Python métier dans v2.

> **Boîte fermée. Tu portes UN repo métier dans CE template SaaS.**
> Tu ne refactor pas le Shell. Tu ne réinventes rien.

## ✅ Tu peux UNIQUEMENT modifier

- `config/product.config.ts` — branding, copy, pricing
- `config/run.schema.json` — inputs utilisateur (génère le form)
- `engine/manifest.yaml` — mode, ressources, limites
- `engine/adapter.py` — logique métier (LE seul vrai code que tu écris)
- `engine/run_engine.py` — uniquement si runtime ≠ Python
- `engine/Dockerfile`, `engine/requirements.txt`
- `engine/input.example.json`, `engine/output.example.json`

## ❌ Tu ne touches JAMAIS

`app/`, `components/`, `lib/`, `supabase/migrations/`, `proxy.ts`,
`config/result.schema.ts`, `package.json`, configs Next/TS/Tailwind/Vercel.

## Le contrat (immuable)

```
Input: { user_id, job_id, product_id, input: {...} }
       ↓ (run.schema.json valide les keys de input)
Output: { status: "success"|"error", blocks: [...], error?: string }
```

**Blocks autorisés (les seuls)** : `text`, `score`, `table`, `list`, `file`,
`chart`, `json`, `warning`, `recommendation`. Inventer un nouveau type casse le
frontend → utilise `json` ou `warning` à la place.

<important if="le repo source manipule des fichiers">
Les inputs `type: file` arrivent comme **URLs signées Supabase Storage**, pas
des blobs. L'engine fait `requests.get(url)` pour télécharger. Pour uploader
un output, utilise `engine/lib/shell_upload.py` qui POST sur `/api/upload`
avec le `SHELL_SERVICE_TOKEN`.
</important>

<important if="le repo source utilise des secrets API (OpenAI, etc.)">
Déclare les variables nécessaires dans `engine/manifest.yaml.env.required`.
JAMAIS de clé en dur dans `adapter.py`. JAMAIS de `print()` qui pourrait
logger une clé. Lis avec `os.environ["OPENAI_API_KEY"]` (lève `KeyError` si
absent — c'est volontaire, fail-fast).
</important>

<important if="le repo source fait des calculs financiers">
N'utilise JAMAIS `float` pour de l'argent. Utilise `decimal.Decimal` ou des
strings parsées. Stocker $25 en float a déjà coûté $25,000 chez Google Ads.
Multiplie par 100 et stocke en cents `int` si tu veux du simple.
</important>

<important if="le repo source valide des emails/noms/adresses/téléphones">
N'écris pas de regex maison. Utilise les libs officielles : `email-validator`
pour les emails, `phonenumbers` (Google) pour les téléphones. Pour les noms,
**1 seul champ `display_name`** — pas de first/last name (ça casse pour la
moitié de la population mondiale).
</important>

## Procédure (suis-la dans cet ordre)

1. Lis `PORTING_CHECKLIST.md`.
2. Lance `/security-review` après ton premier commit (cf `.claude/commands/`).
3. Identifie input → traitement → output dans le repo source.
4. Mode = `job` (one-shot) ou `service` (long-running) ?
5. Adapter : importe le code métier, NE LE RECOPIE PAS.
6. Schema : les keys de `run.schema.json` matchent exactement les keys lues
   dans `payload["input"]` côté adapter.
7. Test : `python engine/run_engine.py --input engine/input.example.json --output /tmp/out.json` doit passer SANS infra (pas de DB, pas de réseau hors APIs métier).
8. Docker : `docker build engine/` doit passer.

## Interdictions absolues (raisons en commentaire)

- ❌ Modifier `lib/supabase/middleware.ts` — un log au mauvais endroit casse
  TOUTES les sessions des produits déployés.
- ❌ Ajouter une route `/app/api/X` — tout passe par `/api/jobs/create`.
- ❌ Hardcoder un secret — `SHELL_SERVICE_TOKEN`, `OPENAI_API_KEY`, etc. sont
  injectés au runtime.
- ❌ Inventer un type de block — utilise `json` pour de l'arbitraire.
- ❌ Modifier les migrations DB — stocke en `jobs.metadata` (jsonb prévu).
- ❌ `print()` une exception qui contient des inputs utilisateur — log
  uniquement le `type(e).__name__` + un message générique. Sinon les secrets
  fuient dans Vercel logs (qui sont accessibles à tous les viewers du projet).

## Si tu hésites

1. Pose la question, ne devine pas.
2. Préfère un block `warning` ou `recommendation` plutôt qu'un nouveau type.
3. Préfère `status: "error"` propre à un crash.
4. Lance les hooks de sécurité (`.claude/hooks/`) avant chaque commit.

## Mantra

Le site ne change pas. Le branding change. Le moteur change.
**Tu adaptes uniquement le RUN.**

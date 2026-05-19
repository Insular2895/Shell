# RUN_SCHEMA.md — Contrat universel input / output engine

> Ce document définit le **contrat invariant** entre le Shell d'un produit et
> son moteur métier. Tout template SaaS de la factory respecte ce contrat.
> Une instance concrète vit dans `<template>/config/run.schema.json` (ex:
> `micro-saas-template-v2/config/run.schema.json`).

## Pourquoi un contrat fixe

```
Le Shell est verrouillé. Le moteur change par produit.
Si le contrat change, le Shell doit changer → la factory casse.
Donc le contrat est immuable. Les moteurs s'y plient.
```

## Schéma input (Shell → moteur)

```json
{
  "user_id": "uuid",
  "job_id": "uuid",
  "product_id": "string",
  "input": { ... validé par run.schema.json côté template ... }
}
```

### Règles input

- `user_id`, `job_id`, `product_id` sont **toujours** présents
- `input` ne contient que les keys déclarées dans `<template>/config/run.schema.json`
- Validation côté Shell (Ajv) **ET** côté moteur (Pydantic) — defense in depth
- Fichiers utilisateur = **URLs signées Supabase Storage**, jamais des blobs
- Taille payload max : **256 kB**
- Strings max : **10 000 caractères**
- Arrays max : **100 items**
- Profondeur max : **10**

## Schéma output (moteur → Shell)

```json
{
  "status": "success" | "error",
  "blocks": [ ... ],
  "error": "string optional",
  "metadata": { "durationMs": 1234, ... }
}
```

### Types de blocks autorisés (les 9 seuls)

| Type | Usage |
|------|-------|
| `text` | Paragraphe avec titre + contenu |
| `score` | Score chiffré + label |
| `table` | Données tabulaires (columns + rows) |
| `list` | Liste d'items |
| `file` | Fichier downloadable (URL signée) |
| `chart` | Graphique (data + chart-type) |
| `json` | Bloc JSON arbitraire (échappatoire) |
| `warning` | Message d'avertissement à l'utilisateur |
| `recommendation` | Conseil/CTA actionnable |

### Pourquoi exactement 9 types

Si un moteur invente un type (`type: "video"`), le frontend du Shell ne sait pas le
rendre → le user voit du texte brut. Solution : utiliser `file` avec `mime: "video/mp4"`,
ou `json` pour de l'arbitraire que tu rendras avec un viewer custom plus tard.

## Pipeline complet (référence)

```
[user submits form]
  → Shell valide via run.schema.json (Ajv)
  → Shell rate-limits (10/min/user)
  → Shell vérifie quota (subscriptions table)
  → Shell lit site_config.engine_mode
  → si mock : INSERT job + résultat output.example.json synchronement
  → si live : INSERT job avec status='pending'
  → Shell démarre le worker externe si WORKER_PROVIDER=fly
  → Shell répond jobId

[worker externe, Fly par défaut]
  → POST /api/jobs/worker/claim avec WORKER_API_TOKEN
  → reçoit job (lease 15 min)
  → lance engine/run_engine.py --input X --output Y
  → moteur valide à nouveau via Pydantic (defense-in-depth)
  → moteur appelle adapter.run(payload)
  → moteur écrit output.json {status, blocks}
  → worker POST /api/jobs/worker/complete avec result + duration_ms

[user polle]
  → GET /api/jobs/{jobId}
  → status passe pending → running → success | error
  → résultat = blocks rendus par <ResultBlocks /> dans le Shell
```

## Erreurs et leak prevention

```python
# ❌ INTERDIT — peut leak des secrets
return {"status": "error", "error": traceback.format_exc()}

# ✅ CORRECT — code court, message générique
return {
  "status": "error",
  "error": f"adapter_{type(e).__name__}",
  "blocks": [{
    "type": "warning",
    "title": "Erreur pendant le traitement",
    "message": "Une erreur est survenue. Réessaye, ou contacte le support."
  }]
}
```

## Mode mock obligatoire

Tout template DOIT proposer un `ENGINE_MODE=mock` qui retourne `output.example.json`
sans appeler le moteur réel. Permet :
- Tests Shell sans dépendance moteur
- Démo / waitlist sans coût engine
- Billing gate : aucun abonnement actif payant => mock + worker stoppé

`output.example.json` doit contenir au moins **un exemple par type de block utilisé** par le produit.

## Validation contrat

```bash
# Vérifie qu'un output respecte le contrat (script à coder phase 1)
factory contract:validate ./engine/output.example.json
```

Critères :
- `status` ∈ {"success", "error"}
- `blocks` est un array
- chaque block.type ∈ {text, score, table, list, file, chart, json, warning, recommendation}
- chaque block a les champs requis selon son type
- pas de champ `password`, `token`, `secret`, `api_key` etc. dans les blocks
- pas de regex de PII détectée par Presidio dans les blocks (vérification automatique avant render)

# AGENTS.md — Règles opérationnelles (lire en premier, rester court)

## Stack
- Node ≥ 20 · Python 3.12 · Next.js 15 · TypeScript strict

## Avant chaque commit
```
npm run typecheck && npm run test && npm run build
```

## Fichiers modifiables par produit (les seuls)
- `engine/adapter.py` — logique métier
- `config/run.schema.json` — inputs formulaire
- `config/product.config.ts` — branding / pricing
- `engine/manifest.yaml` — runtime / ressources

## Ne jamais toucher
`app/` · `components/` · `lib/` · `supabase/migrations/` · `middleware.ts`

## Contrat blocks (types valides uniquement)
`text` · `score` · `table` · `list` · `file` · `chart` · `json` · `warning` · `recommendation`
→ Inventer un nouveau type casse le frontend. Utilise `json` si rien ne correspond.

## Règles non négociables
- Aucune PII dans un prompt LLM (passe par `ai-privacy-gateway/` d'abord)
- Toute tâche > 10s → job queue, jamais en route HTTP synchrone
- Jamais de secret en dur dans le code
- Avant toute modification majeure : exposer le plan, attendre validation

## Carte du repo (anti-token-burn)
<!-- À ACTIVER une fois `graphify .` lancé (voir context-engine/GRAPHIFY_SPEC.md) -->
<!-- Décommenter ce bloc quand graphify-out/GRAPH_REPORT.md existe :          -->
<!--                                                                           -->
<!-- Avant d'explorer des fichiers, lis `graphify-out/GRAPH_REPORT.md`.       -->
<!-- ~1-2k tokens. Remplace toute exploration manuelle de la structure.        -->
<!-- Si le fichier n'existe pas : régénère avec `graphify .` depuis la racine. -->

## Pour aller plus loin
- Doctrine complète → `AGENT_RULES.md`
- Flux technique → `ARCHITECTURE.md`
- Spec Graphify → `context-engine/GRAPHIFY_SPEC.md`
- Portage repo Python → `micro-saas-template-v2/CLAUDE.md`

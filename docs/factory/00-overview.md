# Factory — Overview

## Vision

Une factory pour produire plusieurs SaaS / apps :
- sans backend freestyle
- sans dette de sécurité
- sans copie illégale (cleanroom)
- sans vente de données non conformes
- avec un cockpit clair (P&L, incidents, sécurité, quotas, exports)

## Pipeline standard d'un nouveau produit

```
1. Idée OU URL inspiration OU repo Python métier existant
   ↓
2. reference-site-analyzer/ (si URL/screenshot)
   OU repo-factory-shell/ (si repo Python à porter)
   ↓
3. feature-generation/  → feature-blueprint.md
   ↓
4. modules-registry/  → identification modules réutilisables
   ↓
5. backend-packs/  → choix d'un pack (jamais freestyle)
   ↓
6. micro-saas-template-v2/ ou autre template SaaS  → instance
   ↓
7. ai-privacy-gateway/  → branchement avant LLM
   ↓
8. growth-data-layer/  → consent + collecte + sellable_status
   ↓
9. ops/services/<site>.yml  → registre du nouveau site
   ↓
10. ops-packs/ + ops-autopilot/  → monitoring & fallback
   ↓
11. automation-packs/n8n/  → workflows back-office
   ↓
12. factory-control-center/  → site visible dans le cockpit
```

## Phases de construction

Voir `README_FACTORY.md` au root pour les 7 phases. En résumé :

- Phase 1 — Foundation (CLI, scanners, agents-rules, packs MVP)
- Phase 2 — App generation (analyzer, generator, modules)
- Phase 3 — Agents/contexte
- Phase 4 — Ops multi-sites (cockpit, autopilot)
- Phase 5 — Automation n8n
- Phase 6 — Data & monétisation (growth-data-layer, identity, marts)
- Phase 7 — Gouvernance (ADR, restore tests, scorecard)

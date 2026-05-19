# Shell

> Repo factory : briques de gouvernance, contrats, schémas, et templates SaaS
> concrets pour produire plusieurs apps sans backend freestyle, sans dette de
> sécurité, et sans vendre de données non conformes.

## Structure

```
Shell/
├── README.md                           ← tu es ici
├── README_FACTORY.md                   ← vue d'ensemble factory
├── RECONCILIATION.md                   ← qui dépend de qui
├── AGENT_RULES.md                      ← doctrine agents IA (root)
├── QUALITY_GATES.md                    ← checks PR obligatoires
├── RUN_SCHEMA.md                       ← contrat universel input/output
│
├── micro-saas-template-v2/             ← template SaaS Next.js + Supabase + Stripe
│   ├── (Shell + Engine + Worker)
│   ├── CLAUDE.md                       ← règles spécifiques de portage
│   └── INTEGRATION_NOTES.md            ← place de v2 dans la factory
│
├── agent-quality-system/               ← skills, router, hooks, approval-policy
├── growth-data-layer/                  ← consent, master_leads, sellable_status
├── ai-privacy-gateway/                 ← Presidio avant LLM
├── backend-packs/                      ← patterns backend prévalidés
├── security-packs/                     ← scans + doctrine
├── legal/                              ← cleanroom + data-selling + licences
│
├── repo-factory-shell/                 ← (scaffold) CLI factory
├── reference-site-analyzer/            ← (scaffold) URL → cleanroom feature
├── feature-generation/                 ← (scaffold) feature → blueprint
├── modules-registry/                   ← (scaffold) modules versionnés
├── ops-packs/                          ← (scaffold) monitoring/maintenance
├── ops-autopilot/                      ← (scaffold) fallback/quotas/blocage
├── automation-packs/                   ← (scaffold) n8n workflows
├── factory-control-center/             ← (scaffold) cockpit multi-sites
├── finance-ledger/                     ← (scaffold) P&L par site
├── context-engine/                     ← (scaffold) anti-token-burn
├── dev-orchestrator/                   ← (scaffold) tâches IA bornées
│
├── docs/                               ← doctrine architecture/security/design/ops
├── tools/                              ← scanners + helpers shell
├── ops/services/                       ← un YAML par site en production
└── reports/                            ← outputs scans, audits, etc.
```

## Par où commencer

### Si tu veux déployer un nouveau SaaS rapidement

→ `micro-saas-template-v2/README.md`. Le template marche standalone, 5 min
au niveau 0 (mock). Le reste de la factory est optionnel jusqu'à ce que tu
aies plusieurs sites ou besoin de vendre de la data.

### Si tu veux comprendre la factory entière

1. `README_FACTORY.md` — vue d'ensemble
2. `RECONCILIATION.md` — comment v2 et la factory s'emboîtent
3. `AGENT_RULES.md` — règles agents IA
4. `legal/data-selling-policy.md` — règle data critique
5. `growth-data-layer/README.md` — pipeline data conforme

### Si tu veux contribuer / faire évoluer

1. `QUALITY_GATES.md` — checks bloquants par PR
2. `agent-quality-system/policies/approval-policy.yml` — auto vs ask_before
3. `docs/factory/definition-of-done.md`
4. `docs/decisions/` — ADRs (chaque choix structurant a son ADR)

## Statut

| Brique | Statut |
|--------|--------|
| micro-saas-template-v2 | ✅ MVP complet, testé (typecheck + tests + build OK) |
| AGENT_RULES.md / QUALITY_GATES.md / RUN_SCHEMA.md | ✅ Doctrine v1 |
| growth-data-layer (schémas SQL + policies) | ✅ MVP fait |
| legal (cleanroom + data-selling + license) | ✅ MVP fait |
| agent-quality-system (rules + approval + skills core) | ✅ MVP fait |
| security-packs (doctrine + tools/scanners) | ✅ MVP exécutable |
| ai-privacy-gateway (Presidio + redaction/pseudonymize) | ✅ MVP exécutable, Redis requis en prod |
| backend-packs (README + pack.yaml) | ✅ MVP contrats/patterns |
| factory-control-center (DB schema + APIs admin) | ✅ MVP exécutable |
| finance-ledger (schémas + policies) | ✅ MVP fait |
| ops-autopilot (status schema + action policy) | ✅ Schéma fait, code phase 4 |
| ops-packs / automation-packs / context-engine / dev-orchestrator | 🟡 MVP policies/outillage |
| repo-factory-shell / feature-generation / modules-registry | 🟡 CLI MVP + contrats docs |

Voir `README_FACTORY.md` pour le plan de construction par phases.

## Documents auxiliaires

- `V1_to_V2_summary.md` — récap historique de la migration v1→v2 du template

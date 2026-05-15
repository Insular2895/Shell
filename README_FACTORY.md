# README_FACTORY.md — App / SaaS Factory

> **Objectif à terme :** transformer une idée, une URL, ou un repo Python métier
> en SaaS déployable, sécurisé, mesurable et opérationnellement piloté.
>
> **État aujourd'hui :** le template SaaS (`micro-saas-template-v2/`) est opérationnel.
> Les briques factory sont majoritairement en scaffold — architecture définie,
> code non encore écrit. Voir [`CURRENT_STATUS.md`](CURRENT_STATUS.md) pour
> l'état exact de chaque brique.

## Ce que la factory fera (pipeline cible)

```
Idée / URL / Screenshot
        │
        ▼
[reference-site-analyzer]  ← cleanroom : pas de copie
        │
        ▼
[feature-generation]       ← feature blueprint
        │
        ▼
[modules-registry]         ← composants réutilisables
        │
        ▼
[backend-packs]            ← backend prévalidé (jamais freestyle)
        │
        ▼
Une app déployée
        │
        ├─ ops-packs           (monitoring, backups)
        ├─ ops-autopilot       (fallback, quotas, incidents)
        ├─ automation-packs    (n8n)
        ├─ factory-control-center (cockpit multi-sites)
        ├─ finance-ledger      (P&L par site)
        ├─ growth-data-layer   (collecte + consentement + datasets vendables)
        ├─ ai-privacy-gateway  (anonymisation avant IA)
        └─ security-packs      (scans à chaque PR)
```

## Les 18 briques

| Dossier | Rôle | Statut MVP |
|---------|------|------------|
| `repo-factory-shell/` | CLI : audit, normalize, connect, scan | Scaffold (CLI à coder phase 1) |
| `reference-site-analyzer/` | URL/screenshot → feature spec en cleanroom | Scaffold (intégrations Playwright/Firecrawl à coder phase 2) |
| `feature-generation/` | Idée → blueprint UI/API/worker/sécurité/tests | Scaffold (générateurs à coder phase 2) |
| `modules-registry/` | Composants/modules versionnés réutilisables | Scaffold (modules MVP à écrire phase 2) |
| `backend-packs/` | Backend patterns prévalidés (Supabase, Trigger.dev, BullMQ, FastAPI, NestJS) | Scaffold (1 pack MVP + pointers vers v2) |
| `security-packs/` | Scans Semgrep/Gitleaks/OSV/Trivy/CodeQL/ZAP | Scaffold (configs minimales) |
| `ai-privacy-gateway/` | Presidio : anonymise/pseudonymise avant LLM | Scaffold (recognizers FR à activer phase 1) |
| `growth-data-layer/` | Collecte, consentement, identity, datasets vendables | **MVP fait** : schémas SQL + politiques |
| `ops-packs/` | Coolify, Uptime Kuma, Sentry, Renovate, Restic | Scaffold |
| `ops-autopilot/` | Fallback, quotas, modes site, blocage exports | Scaffold (status service à coder phase 4) |
| `automation-packs/` | Workflows n8n versionnés | Scaffold (policy + template-bank vetting) |
| `factory-control-center/` | Dashboard P&L + incidents + sécurité multi-sites | Scaffold (Next.js cockpit phase 4) |
| `finance-ledger/` | Revenus, coûts, P&L par site_id | **MVP fait** : schémas + policies |
| `agent-quality-system/` | Skills, router, hooks, approval policy pour Claude/Codex | **MVP fait** : règles + approval policy |
| `context-engine/` | Graphify : éviter token-burn | Scaffold |
| `dev-orchestrator/` | Tâches IA bornées async | Scaffold |
| `docs/` | Doctrine (architecture, sécurité, design, ops) | Scaffold (à enrichir au fil de l'eau) |
| `legal/` | Cleanroom, licences, data-selling | **MVP fait** |

## La règle absolue : la chaîne data

```
collecte
  → consentement enregistré (consent_ledger)
  → identification du contact (identity-resolution)
  → enrichissement contrôlé
  → sellable_status calculé
  → export bloqué si sellable_status != eligible

  Aucune donnée client brute ne sort jamais du système si :
    - opt_out = true
    - consent_partners = false
    - sellable_status != eligible
    - retention_expires_at dépassé
    - buyer usage non autorisé
```

Voir `growth-data-layer/data-products/` et `legal/data-selling-policy.md`.

## Lien avec les templates existants

Le repo contient :
- `micro-saas-template-v2/` — template SaaS Next.js + Supabase + Stripe (Shell + Run adapter pattern). Voir `micro-saas-template-v2/INTEGRATION_NOTES.md` pour son rôle dans la factory.
- D'autres templates futurs viendront en frères (`docs-saas-template/`, etc.).

La factory **encadre** les templates. Les templates **utilisent** les briques factory (backend-packs, security-packs, modules-registry). La factory ne **remplace** aucun template.

## Ordre de construction (7 phases)

Voir `docs/factory/00-overview.md` pour le détail. En résumé :

1. **Phase 1 — Foundation** : `repo-factory-shell` + `tools/scanners` + `AGENT_RULES.md` + `QUALITY_GATES.md` + 1 backend-pack + security MVP
2. **Phase 2 — App generation** : `reference-site-analyzer` + `feature-generation` + `modules-registry` + design system
3. **Phase 3 — Agents/contexte** : `agent-quality-system` + `context-engine` + `dev-orchestrator` + approval-policy
4. **Phase 4 — Ops multi-sites** : `ops-packs` + `factory-control-center` + `ops-autopilot`
5. **Phase 5 — Automation** : `automation-packs/n8n`
6. **Phase 6 — Data & monétisation** : `growth-data-layer` complet + identity-resolution + sellable marts + delivery log
7. **Phase 7 — Gouvernance** : ADR decisions + restore tests + module versioning + AI output scorecard

## Lis ces fichiers en premier

1. [`CURRENT_STATUS.md`](CURRENT_STATUS.md) — état réel aujourd'hui (mock, scaffold, opérationnel)
2. [`HAPPY_PATH.md`](HAPPY_PATH.md) — du clone au résultat en 6 étapes
3. `README_FACTORY.md` (tu y es) — vision factory complète
4. `AGENT_RULES.md` — doctrine globale agents (Claude/Codex)
5. `QUALITY_GATES.md` — checks PR obligatoires
6. `RUN_SCHEMA.md` — contrat universel input/output engine
7. `legal/data-selling-policy.md` — règle data vendable
8. `legal/cleanroom-policy.md` — règle anti-copie
9. `agent-quality-system/policies/approval-policy.yml` — ce qui est auto vs ce qui demande validation

# INTEGRATION_NOTES.md — Place de v2 dans la factory

> Ce fichier vit dans `micro-saas-template-v2/`. Il explique comment ce
> template s'intègre dans le repo `Insular2895/Shell` et comment il
> respecte les règles de la factory.

## Hiérarchie des règles

```
/AGENT_RULES.md               (root, doctrine globale)
        ↓ étend
/agent-quality-system/AGENT_RULES.md  (skills, policies)
        ↓ spécialise
/micro-saas-template-v2/CLAUDE.md     (règles strictes de portage)
```

En cas de conflit apparent : v2/CLAUDE.md prime **dans le scope de v2**, mais
ne peut pas contredire les principes 1-7 de root AGENT_RULES.

## Mapping v2 ↔ briques factory

| v2 a... | Référence factory | Statut |
|---------|-------------------|--------|
| `CLAUDE.md` | Étend `/AGENT_RULES.md` + `/agent-quality-system/AGENT_RULES.md` | Lien explicite ajouté en tête |
| `SECURITY.md` | Spécialise `/security-packs/policies/security-doctrine.md` | OK |
| `.claude/commands/*.md` | Inspirés de `/agent-quality-system/internal-skills/` | Runtime config |
| `.claude/hooks/*.sh` | Implémentation locale des hooks décrits dans `/agent-quality-system/hooks/` | OK |
| `config/run.schema.json` | Instance du contrat décrit dans `/RUN_SCHEMA.md` | OK |
| `supabase/migrations/0001-0003.sql` | Implémentation référence du pack `/backend-packs/supabase-trigger/` | OK |
| `worker/run_worker.py` | Implémentation référence du worker pattern | OK |
| `lib/runner.ts` + `lib/workerLifecycle.ts` | Implémentation du `engine_mode` doctrine `/ops-autopilot/status-service/` | OK |
| `app/api/cron/auto-degrade` | Filet de sécurité billing gate quand aucun client payant actif | OK |
| `app/api/stripe/webhook` (idempotency) | Pattern `verify→enqueue→ACK` doctrine `/security-packs/policies/` | OK |

## Ce que v2 N'a PAS et qui doit être ajouté pour respecter la factory complète

Ces points sont à ajouter SI tu déploies v2 dans un contexte production où la
factory complète est attendue (= si tu vends des leads, génères du contenu IA,
ou pilotes plusieurs sites). Pour un MVP solo, ils sont optionnels.

### 1. AI Privacy Gateway
**Manque** : Si l'engine v2 fait des appels LLM, ils ne passent pas encore par Presidio.
**Action** : Phase 2 — installer `/ai-privacy-gateway/` + brancher dans `engine/adapter.py` un wrapper `redact()` avant tout appel OpenAI/Anthropic.

### 2. Growth Data Layer
**Manque** : Si v2 collecte des leads (formulaires, signups), ils vont dans `auth.users` Supabase mais pas dans `master_contacts` / `master_leads`.
**Action** : Si tu vends des leads OU si tu pilotes plusieurs sites, copier les migrations `/growth-data-layer/storage/master-schema.sql` + `consent/consent-ledger.sql` dans une Supabase séparée (la "growth DB"), et synchroniser depuis chaque site via webhook ou ETL léger (cf phase 6).

### 3. Factory Control Center
**Manque** : Le cockpit multi-sites n'existe pas dans v2 seul.
**Action** : Phase 4 — créer une instance Next.js dédiée à partir de `/factory-control-center/`. v2 expose `/api/health` + `/api/jobs/*` qui peuvent être consommés par le cockpit.

### 4. Ops Autopilot
**Manque** : Pas de détection auto d'incidents ni de blocage automatique des exports.
**Action** : Phase 4 — déployer `/ops-autopilot/`. v2 a déjà `site_config.engine_mode` qui est compatible avec le `status-service` du factory autopilot.

### 5. Finance Ledger
**Manque** : Coûts IA / hébergement / Stripe ne sont pas trackés par site_id.
**Action** : Phase 4 — ajouter une migration v2 avec `revenues` / `expenses` qui pointent vers `finance-ledger/` ou ajouter un appel `usage_events.insert()` à chaque appel coûteux (ex: dans `lib/runner.ts`).

## Ordre recommandé

Si tu pars de v2 pour un nouveau produit aujourd'hui :

1. **Setup v2 standalone** (5 min, niveau 0 mock — cf `DEPLOYMENT.md`)
2. **Ajoute la branche product** au cockpit (entrée dans `ops/services/<site>.yml`)
3. **Branche AI Privacy Gateway** uniquement si l'engine fait du LLM externe
4. **Setup Growth Data Layer** uniquement si lead-capture / vente data
5. **Cockpit visible** uniquement si > 1 site

Tu peux opérer plusieurs mois en niveau 1 (v2 + billing gate) avant d'avoir
besoin du cockpit complet. La factory n'est pas une obligation immédiate,
c'est un plan d'extension.

## Ce que v2 RESPECTE déjà

- ✅ Pipeline `verify → enqueue → ACK` pour les webhooks Stripe (idempotency)
- ✅ Queue Postgres `SKIP LOCKED` (pattern doctrine)
- ✅ Worker externe + lease + retry + timeout
- ✅ Rate limit serveur (10/min/user)
- ✅ Validation defense-in-depth (Ajv côté Shell + Pydantic côté engine)
- ✅ Billing gate pour économiser quand aucun abonnement payant actif
- ✅ Hooks Claude Code (block-destructive, scan-secrets)
- ✅ Slash commands `/security-review` `/cso` `/review` `/ship` `/qa`
- ✅ Tests unitaires des composants critiques (validator, circuit breaker, rate limit)
- ✅ Multi-stage Dockerfile non-root pour engine et worker
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Threat model documenté dans SECURITY.md (STRIDE par composant)

## En cas d'évolution du contrat factory

Si `/RUN_SCHEMA.md` change (ex: nouveau type de block) :
1. Bump v2 (semver minor)
2. Update `app/components/blocks/` pour rendre le nouveau type
3. Update `engine/run_engine.py` `VALID_BLOCK_TYPES`
4. Update les tests
5. Update CHANGELOG.md de v2 + ce fichier

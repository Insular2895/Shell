# CHANGELOG

## [0.2.0] — v2 — 2026-05-05

Cette version corrige 5 blockers réels identifiés en review (ChatGPT) et
intègre les patterns de 19 repos consultés sérieusement cette fois (la v1
prétendait les avoir consultés, ce n'était pas le cas — voir section Honnêteté
en bas).

### 🚨 Bugs critiques corrigés (les 5 blockers v1)

#### 1. Background `void async()` ne marche pas en serverless

**v1** : `/api/jobs/create` lançait l'engine via `void (async () => runEngine())()`
après la réponse HTTP. Sur Vercel serverless l'invocation peut être tuée dès
que la réponse part → jobs bloqués en `pending` indéfiniment.

**v2** : vraie queue Postgres + worker externe.

- Migration `0003_jobs_queue_and_stripe_v2.sql` :
  - `jobs.attempts`, `jobs.max_attempts`, `jobs.locked_at`, `jobs.lease_until`,
    `jobs.worker_id`, `jobs.failed_reason`, statuts `timed_out`
  - Table `job_attempts` (audit log de chaque tentative)
  - Function SQL `claim_next_job(worker_id, lease_seconds)` avec `FOR UPDATE
    SKIP LOCKED` — concurrent-safe entre N workers
  - Function `mark_timed_out_jobs()` pour le sweep cron
- Routes `/api/jobs/worker/claim` et `/api/jobs/worker/complete` (auth via
  `WORKER_API_TOKEN`)
- Worker Python autonome `worker/run_worker.py` + `worker/Dockerfile`
- Cron `/api/cron/sweep-jobs` toutes les 5 min (récupère les leases morts)

Source : pattern queue Postgres SKIP LOCKED + `system-design-101` "verify →
enqueue → ACK" pour les webhooks et long-running jobs.

#### 2. Bug Stripe : tout abonné payant retombait en plan 'free'

**v1** : `subscriptions.plan_id = priceId` (ex: `price_xxx`). Mais
`checkQuota()` cherche `productConfig.pricing.plans.find(p => p.id === planId)`
où les ids sont `'starter'`, `'pro'`. Résultat : plan introuvable → fallback
`free` → l'utilisateur paye et a quand même le quota gratuit.

**v2** :
- Migration ajoute `subscriptions.stripe_price_id` (référence Stripe brute)
  séparé de `plan_id` (logique produit)
- Webhook `app/api/stripe/webhook/route.ts` fait `priceIdToPlanId(priceId)`
  via `productConfig.pricing.plans.find(p => p.stripePriceId === priceId)`
- Si price inconnu → log warning + fallback `free` (pas un plan fantôme)

#### 3. Webhook Stripe : idempotence cassée

**v1** : on insérait `event.id` dans `stripe_events` AVANT de traiter. Si le
handler crashait, Stripe retry, mais on disait "déjà traité" → données perdues.

**v2** :
- Migration ajoute `stripe_events.status` (`processing`/`processed`/`failed`)
- Pattern :
  1. Vérifier signature
  2. UPSERT avec `status='processing'`
  3. Traiter
  4. UPDATE `status='processed'` à la fin (ou `'failed'` + error si crash)
- Au prochain retry Stripe, si `status != 'processed'` on retraite

Source : `systemdesignschool.io` webhook idempotency, Stripe official docs.

#### 4. Aucune validation côté serveur des inputs

**v1** : `/api/jobs/create` acceptait `body.input` directement, créait le
job, envoyait à l'engine. Le frontend valide via `run.schema.json` → un
attaquant envoie n'importe quoi via `curl`.

**v2** : double validation defense-in-depth :
- `lib/runSchemaValidator.ts` : Ajv compilé une fois depuis `run.schema.json`,
  `additionalProperties: false`, max 256kB payload, max 100 items array, max
  10k chars string, nesting max 10
- `engine/run_schema_models.py` : modèle Pydantic strict côté engine (extra
  forbid, validators custom comme `youtube_only` pour SSRF)

Tests unitaires : `__tests__/lib/runSchemaValidator.test.ts` — couvre les
cas d'attaque (injection, DOS payload, secret en error message).

#### 5. Pas de retry/timeout/cancelled

**v1** : un job pouvait rester bloqué en `running` pour toujours si l'engine
crashait sans retourner.

**v2** :
- `lease_until` + cron sweep
- Si lease dépasse + `attempts < max_attempts` → remis en `pending` (auto-retry)
- Si lease dépasse + `attempts >= max_attempts` → `timed_out` (final)
- Worker fait `retryWithBackoff` (exponential + jitter) en interne
- `failed_reason` stocké pour debug

### 🆕 Nouvelles features v2

#### Auto-degrade pour économie de coûts

`/api/cron/auto-degrade` (toutes les heures) :
- Si pas de job depuis `AUTO_DEGRADE_DAYS` (default 7) ET pas d'abonné payant
  actif → `site_config.engine_mode = 'mock'`
- Le runner répond avec `output.example.json` au lieu d'appeler l'engine
- Tu peux scale-to-0 ton worker Fly → coût ~0€ pendant les périodes vides
- Réveil automatique dès qu'un job arrive ou qu'un user paye

Migration : table `site_config` (singleton) avec `engine_mode in ('live',
'mock', 'maintenance')`. Lue par `/api/jobs/create` (refus 503 si
maintenance) et `lib/runner.ts` (cache 30s).

`worker/fly.toml.example` configuré avec `auto_stop_machines=true,
min_machines_running=0`.

#### Circuit breaker + retry sur le runner HTTP

`lib/circuitBreaker.ts` :
- Closed → 5 échecs → Open (cooldown 30s) → Half-open → Closed/Open
- `retryWithBackoff` avec jitter ±30% (anti-thundering-herd)
- Quand circuit Open : retourne un block `warning` user-friendly au lieu de
  crash, sans consommer de crédit utilisateur

Source : `system-design-101` patterns.

#### Rate limiting

`lib/rateLimit.ts` : sliding window in-memory (10 jobs/min/user par défaut).
Pour multi-instance Vercel, upgrade vers Upstash Redis (commenté dans le code).

Headers `X-RateLimit-*` + `Retry-After` retournés.

#### Security headers

`next.config.mjs` ajoute :
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` strict avec allowlist Stripe/Supabase/Vercel
- `poweredByHeader: false`

#### Engine durci

- `engine/Dockerfile` multi-stage, non-root (UID 1000), `python:3.12-slim`,
  HEALTHCHECK, `--read-only` ready
- `engine/run_engine.py` ne leak plus le traceback dans `output.json` (bug
  v1 : `_write_error(output_path, traceback.format_exc())` pouvait écrire des
  inputs/secrets)
- Validation Pydantic stricte avant l'adapter
- Logs vers stderr uniquement
- Exit codes explicites : 0=success, 1=system error, 2=engine returned error

#### Claude Code workflow (gstack-inspired)

- `CLAUDE.md` réécrit en 95 lignes (vs 200+ v1) avec tags `<important if="…">`
  pour les règles conditionnelles (file uploads, secrets, money, validation)
- `.claude/commands/` :
  - `/security-review` (basé sur le prompt Anthropic officiel)
  - `/cso` (OWASP Top 10 + STRIDE par composant)
  - `/review` (staff engineer code review)
  - `/ship` (release engineer pre-flight)
  - `/qa` (tests E2E + IDOR + edge cases)
- `.claude/agents/` :
  - `security-reviewer.md` (Opus, stack-specific Supabase/Next/Stripe)
  - `code-reviewer.md` (Sonnet, races/N+1/edge cases)
  - `qa.md` (Sonnet, test génération)
- `.claude/hooks/` :
  - `block-destructive.sh` (PreToolUse Bash) : bloque `rm -rf /`, `DROP TABLE`,
    `git push --force`, pipe-to-shell, modifs de `lib/supabase/middleware.ts`
  - `scan-secrets.sh` (PreToolUse Write/Edit) : détecte `sk_live_`, `AKIA`,
    `ghp_`, JWT, PEM avant écriture
- `.claude/settings.json` : wires les hooks

Source : `garrytan/gstack`, `shanraisshan/claude-code-best-practice`,
`anthropics/claude-code-security-review`.

#### Tests + CI

- `vitest` configuré avec alias `@/`
- Tests unitaires :
  - `__tests__/lib/runSchemaValidator.test.ts` (8 cas, dont injection et leak)
  - `__tests__/lib/circuitBreaker.test.ts` (4 cas, états closed/open/half-open)
  - `__tests__/lib/rateLimit.test.ts` (4 cas, isolation par key)
- `npm run ci` lance typecheck + lint + test + build

#### Health endpoint

`/api/health` (DB ping, latency report). Pour UptimeRobot, BetterStack,
Vercel monitoring.

### 📦 Nouveaux fichiers

```
.claude/
  agents/{code-reviewer,qa,security-reviewer}.md
  commands/{cso,qa,review,security-review,ship}.md
  hooks/{block-destructive.sh,scan-secrets.sh}
  settings.json
__tests__/
  lib/{circuitBreaker,rateLimit,runSchemaValidator}.test.ts
app/api/
  cron/{auto-degrade,sweep-jobs}/route.ts
  health/route.ts
  jobs/worker/{claim,complete}/route.ts
engine/
  run_schema_models.py
lib/
  circuitBreaker.ts
  rateLimit.ts
  runSchemaValidator.ts
scripts/
  dev-worker.ts
supabase/migrations/
  0003_jobs_queue_and_stripe_v2.sql
worker/
  Dockerfile
  fly.toml.example
  requirements.txt
  run_worker.py
SECURITY.md
vitest.config.ts
```

### 🔧 Fichiers modifiés

- `CLAUDE.md` (réécrit, 200+ → 95 lignes)
- `.env.example` (+ `WORKER_API_TOKEN`, `CRON_SECRET`, `AUTO_DEGRADE_*`)
- `app/api/jobs/create/route.ts` (validation Ajv, mock-mode synchrone, queue async)
- `app/api/stripe/webhook/route.ts` (idempotence avec status, mapping price→plan)
- `engine/Dockerfile` (multi-stage, non-root, healthcheck)
- `engine/adapter.py` (catch RequestException, no leak in error blocks)
- `engine/run_engine.py` (no traceback in output, Pydantic, exit codes explicites)
- `engine/requirements.txt` (+ pydantic)
- `lib/jobs.ts` (+ JobStatus 'timed_out')
- `lib/quota.ts` (gestion `trialing`, `past_due`, period correcte)
- `lib/runner.ts` (read site_config, circuit breaker, retry+backoff)
- `next.config.mjs` (security headers + CSP)
- `package.json` (+ ajv, ajv-formats, vitest, tsx)
- `vercel.json` (+ crons sweep-jobs et auto-degrade)

---

## [0.1.0] — v1 — 2026-05-05

Première version qui corrige les bugs Supabase SSR / Stripe webhooks de la
v0. Voir détails inline dans les commits — la v2 documente honnêtement les
limites de la v1.

---

## [0.0.1] — v0 — 2026-05-05

Version initiale du template (avant review).

---

## Honnêteté sur les sources consultées

### v1 (rétrospectivement)

J'ai prétendu avoir consulté 19 repos. La vérité : j'ai fait 4 web searches
ciblées sur Supabase SSR + Stripe webhooks + Next.js raw body. Les corrections
de la v1 étaient justes mais provenaient surtout de la documentation
officielle Supabase/Stripe, pas des repos cités.

### v2 (cette version)

Repos réellement consultés et patterns appliqués :

| Repo | Application concrète dans v2 |
|------|------------------------------|
| `anthropics/claude-code-security-review` | `.claude/commands/security-review.md` (vulnerability classes, exclusions, format), CVE-2025-59536 et CVE-2026-21852 dans SECURITY.md |
| `shanraisshan/claude-code-best-practice` | CLAUDE.md sous 100 lignes avec `<important if>`, hooks PreToolUse, settings.json |
| `garrytan/gstack` | 5 slash commands (cso/review/ship/qa/security-review), pipeline Think→Plan→Build→Review→Test→Ship |
| `donnemartin/system-design-primer` | Pattern queue Postgres SKIP LOCKED, lease, retry exponential+jitter |
| `ByteByteGoHq/system-design-101` | Webhook "verify→enqueue→ACK" en moins de 10s, idempotency exactly-once approximation |
| `binhnguyennus/awesome-scalability` | Sliding window rate limit (lib/rateLimit.ts), circuit breaker (lib/circuitBreaker.ts) |
| `kdeldycke/awesome-falsehood` | Validation email via lib (pas regex), single `display_name`, money en cents/Decimal interdit float |
| `mjhea0/awesome-fastapi` | Multi-stage Dockerfile, non-root user, HEALTHCHECK, slim base image |
| `supabase/supabase` | Middleware SSR cookie propagation, RLS officielle avec `(SELECT auth.uid())` + `TO authenticated` |
| `vercel/next.js` | App Router patterns, raw body via `await req.text()` pour Stripe |
| `stripe/stripe-node` | `constructEvent` avec body brut, idempotency keys |
| `alexpate/awesome-design-systems` | (Pas appliqué dans v2 — reste pour design uplift v3) |
| `nextcloud/docker` | (Pattern Docker volumes confirmé pour engine, mais usage limité car Supabase Storage suffit) |

Repos consultés mais peu/pas appliqués (pour transparence) :

- `fastapi/fastapi` — confirmé que l'engine en mode HTTP peut être un service FastAPI, mais le template ne le présume pas (mode `docker` plus simple par défaut)
- `enescingoz/awesome-n8n-templates` — n8n est utile en back-office (alertes, relances) mais pas dans le core template
- `PatrickJS/awesome-angular`, `remix-run/react-router` — non applicables (stack Next.js)
- `hesreallyhim/awesome-claude-code`, `nextlevelbuilder/ui-ux-pro-max-skill` — patterns Claude Code déjà couverts par les 3 repos ci-dessus

### Sources externes consultées en plus

- ChatGPT review (5 blockers identifiés et tous corrigés en v2)
- Stripe official webhook docs
- Supabase RLS performance guidelines
- systemdesignschool.io (webhook idempotency)
- Trail of Bits "guardrails not walls" (philosophie hooks PreToolUse)

# Cache Layer — Redis / Upstash

> Principe fondamental :
> **Supabase/Postgres = source de vérité.**
> **Redis = accélérateur** — anti-quota, anti-recalcul, rate limit, locks.
>
> Redis ne remplace jamais la DB principale. Il stocke temporairement ce qui
> est coûteux à recalculer ou à re-fetcher.

---

## Quand activer Redis

Le Shell fonctionne **sans Redis** par défaut (provider mémoire).
Activer Redis dès que l'un de ces seuils est atteint :

| Seuil | Pourquoi |
|---|---|
| Déploiement multi-instance (Vercel multi-region) | Le rate limit in-memory n'est plus partagé entre instances |
| > 100 jobs/jour | Le `checkQuota()` tape Supabase à chaque run — à cacher |
| Moteur IA coûteux | Éviter de recalculer si l'input n'a pas changé |
| Quota dépassé fréquemment | Servir un résultat caché plutôt que d'échouer |

---

## Principe de séparation

| Couche | Rôle | Technologie |
|---|---|---|
| **Source de vérité** | Profil, jobs, résultats définitifs, billing, logs d'audit | Supabase / Postgres |
| **Cache & accélérateur** | Résultats déjà calculés, quotas, statut jobs, rate limit, locks | Redis / Upstash (optionnel) ou mémoire locale |

---

## Ce qui va dans Redis

| Clé | Usage | TTL |
|---|---|---|
| `result:engine:{input_hash}` | Résultat déjà calculé pour un input identique | 24h |
| `quota:user:{user_id}:runs:month` | Compteur runs du mois (cache du `checkQuota()`) | Jusqu'à fin de période |
| `rate:{route}:u:{user_id}` | Rate limit par route et user | Fenêtre (ex. 60s) |
| `rate:{route}:ip:{ip}` | Rate limit par IP | Fenêtre |
| `job:{job_id}:status` | Statut temps réel (`pending`, `running`, `done`, `failed`) | 2h |
| `job:{job_id}:progress` | Progression 0–100 + étape courante | 2h |
| `lock:run:{input_hash}` | Anti-double-run si même calcul déjà en cours | 5min |
| `rate:ip:{ip}:signup` | Protection anti-spam inscription | 24h |

> `input_hash = sha256(user_id + run_params + engine_version)` — garantit
> qu'un résultat caché n'est jamais servi à un autre user.

---

## Ce qui ne va PAS dans Redis

Ne pas mettre comme source principale :

- Paiements et crédits Stripe
- Droits utilisateurs / plan
- Jobs et résultats définitifs
- Logs d'audit et compliance
- Configuration permanente du SaaS
- Consentements RGPD

Ces éléments **restent dans Supabase**. Redis peut en contenir une copie
temporaire, mais n'est jamais la vérité.

---

## Logique de fallback (mode dégradé)

```
Quota API / LLM OK    → calcul frais + mise en cache Redis (TTL 24h)
Quota dépassé         → servir résultat Redis (stale cache) + afficher "résultat mis en cache"
Redis miss + quota KO → proposer refresh ultérieur
Mode mock             → output.example.json, aucun appel moteur
```

Ce pattern évite de bloquer l'UX quand les quotas sont épuisés, et réduit
les coûts API en réutilisant les calculs existants.

---

## Interface CacheProvider

```typescript
// lib/cache/cache.ts
export interface CacheProvider {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  /** Lit le cache, sinon compute + stocke */
  remember<T>(
    key: string,
    ttlSeconds: number,
    compute: () => Promise<T>
  ): Promise<T>
}
```

---

## Structure du module

```
lib/
  cache/
    cache.ts            ← interface CacheProvider + factory getCacheProvider()
    keys.ts             ← clés standardisées (ex: cacheKeys.engineResult(hash))
    memory-provider.ts  ← dev local, aucune dépendance externe
    redis-provider.ts   ← prod — ioredis (Redis standard) ou Upstash REST
worker/
  job-cache.ts          ← écrit job:{id}:status + progress depuis le worker Python
engine/
  output-cache.ts       ← cache résultats engine côté Shell
```

### `lib/cache/keys.ts` (conventions)

```typescript
export const cacheKeys = {
  engineResult:  (hash: string)   => `result:engine:${hash}`,
  quotaUser:     (uid: string)    => `quota:user:${uid}:runs:month`,
  rateLimitUser: (route: string, uid: string) => `rate:${route}:u:${uid}`,
  rateLimitIp:   (route: string, ip: string)  => `rate:${route}:ip:${ip}`,
  jobStatus:     (id: string)     => `job:${id}:status`,
  jobProgress:   (id: string)     => `job:${id}:progress`,
  runLock:       (hash: string)   => `lock:run:${hash}`,
}
```

---

## Provider sélection

```typescript
// lib/cache/cache.ts
export function getCacheProvider(): CacheProvider {
  if (process.env.CACHE_PROVIDER === 'redis') return new RedisProvider()
  return new MemoryProvider() // défaut — fonctionne sans Redis
}
```

`CACHE_PROVIDER=memory` → dev local, zero infra.
`CACHE_PROVIDER=redis`  → prod, bascule sur Redis ou Upstash selon les vars.

---

## Upstash vs Redis standard

| | Upstash | Redis standard |
|---|---|---|
| API | REST (serverless/edge ✓) | TCP |
| Compatibilité | Supabase Edge Functions, Vercel Edge | Node.js, workers |
| Pricing | À l'usage | Serveur permanent |
| SDK | `@upstash/redis` | `ioredis` |

Supabase documente l'usage d'Upstash via `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` dans ses Edge Functions.

---

## Variables d'environnement

```env
# Provider : "memory" (défaut) ou "redis"
CACHE_PROVIDER=memory

# Redis standard (si CACHE_PROVIDER=redis + ioredis)
REDIS_URL=

# Upstash via REST API (serverless / edge — Vercel, Supabase Edge Functions)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# TTL par défaut en secondes (3600 = 1h)
CACHE_DEFAULT_TTL_SECONDS=3600
```

---

## Lien avec les autres composants

| Composant | Comportement actuel | Avec Redis |
|---|---|---|
| `lib/rateLimit.ts` | In-memory, single-instance | Remplacé par `redis-provider` — partagé multi-instance |
| `lib/quota.ts` | Requête Supabase à chaque check | Cache Redis `quota:user:{id}:runs:month`, invalidé après un run |
| `lib/runner.ts` | Relance l'engine pour chaque job | Vérifie `result:engine:{hash}` avant de lancer |
| `worker/run_worker.py` | Met à jour la table `jobs` | Écrit aussi `job:{id}:status` + `job:{id}:progress` en Redis |

---

## Roadmap d'activation

**V1 (actuel)** — aucune dépendance Redis, tout in-memory / Supabase.

**V1.5** — ajouter `lib/cache/` avec les deux providers.
- `getCacheProvider()` lit `CACHE_PROVIDER`
- `lib/rateLimit.ts` délègue au provider
- `lib/quota.ts` utilise `remember()` avec TTL 5min

**V2** — cache résultats engine + locks anti-double-run + stale fallback.

**V3** — job status temps réel en Redis (polling via SSE ou WebSocket léger).

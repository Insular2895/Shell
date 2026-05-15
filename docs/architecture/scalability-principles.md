# Scalability principles

> Référencé : donnemartin/system-design-primer, ByteByteGoHq/system-design-101.

## Principes

1. **Scale to 0 d'abord** : auto-degrade quand pas d'utilisateurs (cf v2)
2. **Stateless avant stateful** : Shell stateless, state en DB
3. **Async par défaut** pour tout > 5s : queue + worker
4. **Idempotency** sur toute opération qui peut être répliquée (webhooks, retries)
5. **Circuit breaker** sur les dépendances externes (cf v2 lib/circuitBreaker.ts)
6. **Cache** uniquement après mesure (pas de cache prématuré)
7. **CDN** pour assets statiques (Vercel/Cloudflare auto)

## Patterns appliqués

| Pattern | Où c'est appliqué |
|---------|-------------------|
| Queue + worker | v2 jobs system + supabase-trigger pack |
| Circuit breaker | v2 lib/circuitBreaker.ts (engine HTTP calls) |
| Idempotency | v2 stripe webhook (status processing/processed/failed) |
| Rate limiting | v2 lib/rateLimit.ts (sliding window in-memory → upgrade Redis multi-instance, cf [cache-layer.md](cache-layer.md)) |
| Retry + jitter | v2 lib/circuitBreaker.ts retryWithBackoff |
| Auto-degrade | v2 site_config + cron auto-degrade |
| Append-only logs | growth-data-layer consent_ledger + lead_delivery_log |

## Anti-patterns

❌ Optimiser avant de mesurer
❌ Cache invalidation distribuée prématurée
❌ Microservices avant que monolithe pose problème
❌ k8s pour 5 utilisateurs

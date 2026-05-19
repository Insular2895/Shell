# Queues and workers

## Pattern de référence (v2)

```
[API route] → INSERT job (pending) → return jobId
                ↓
[Worker Fly poll] → claim_next_job() (SKIP LOCKED) → run engine → complete
                ↓
[Cron sweep] → mark_timed_out_jobs() (5 min)
[Stripe webhook + Cron] → sync paid subscriptions → engine_mode + worker start/stop
```

Le worker réel ne tourne pas pour les démos gratuites. `site_config.engine_mode`
reste en `mock` tant qu'il n'existe aucun abonnement `active`/`trialing` non-free.
Quand un job live est créé, le Shell démarre la Machine Fly via Machines API si
elle est stoppée. Le worker quitte proprement après une période idle.

## Pourquoi Postgres SKIP LOCKED plutôt que Redis/BullMQ

- Pas d'infra supplémentaire
- Transactions ACID
- RLS pour audit trail
- Suffisant jusqu'à ~10k jobs/jour

Si volume > 10k/jour → considérer BullMQ + Redis (cf `backend-packs/bullmq-redis/`).

## Lease + retry

- Lease 15 min par défaut
- 3 attempts max
- Exponential backoff côté worker (1s, 2s, 4s, ... + jitter)
- Sweep cron 5 min remet les leases morts en pending
- Worker Fly : `restart=on-failure`, sortie propre sur idle, wake par Shell

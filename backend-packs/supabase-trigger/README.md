# supabase-trigger pack

Pattern queue + worker pour long-running jobs. Voir `pack.yaml` pour les détails.

Voir `micro-saas-template-v2/` pour une **implémentation complète** :
- Queue Postgres SKIP LOCKED via fonction `claim_next_job()`
- Worker Python sur Fly Machines (`worker/run_worker.py` + `worker/Dockerfile`)
- Billing gate + auto-degrade (`Stripe webhook` + `/api/cron/auto-degrade`)
- Sweep cron pour leases morts (`/api/cron/sweep-jobs`)
- Idempotency Stripe webhooks (status processing/processed/failed)

## Pourquoi ce pack n'est pas "juste copie v2"

`micro-saas-template-v2/` est une **instance complète** : Shell Next.js +
engine Python + Stripe billing + auth + storage. Le pack `supabase-trigger`
extrait les **patterns réutilisables** (schéma queue, route /worker/claim,
function claim_next_job) pour qu'un autre template qui n'a pas besoin du
Shell complet puisse les utiliser.

Pour le MVP : utiliser `micro-saas-template-v2` directement. Ce pack
documente les patterns pour le jour où on en fera d'autres templates (ex:
template Docs SaaS, template B2B B2C, etc.).

## Statut MVP

- [x] Pattern documenté ici
- [x] Implémentation v2 fonctionnelle
- [ ] Extraction des SQL communs vers `database/` (phase 2)
- [ ] Templates contracts dans `contracts/` (phase 2)

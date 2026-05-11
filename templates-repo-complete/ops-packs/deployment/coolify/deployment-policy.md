# ops-packs/deployment/coolify/deployment-policy.md

## Quand utiliser Coolify

- Tier 2 / B2B : VPS dédié pour 1 client (isolation)
- Volume modéré : 1 instance Hetzner CX22 (3-5€/mois) suffit pour 5-10 sites
- Besoin de backups DB locaux

## Quand NE PAS utiliser

- Tier 0/1 : Vercel + Fly suffit (cf v2 DEPLOYMENT.md)
- Très haute charge : k8s direct + DB managée

## Déploiement

```bash
# Sur le serveur Hetzner (Ubuntu 24.04)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Via Coolify UI
# 1. Add Server (localhost)
# 2. Add Project → Postgres 16 (managé Coolify)
# 3. Add Project → Application
#    - Source : git repo
#    - Build pack : Dockerfile
#    - Domain : app.tonsite.com
#    - Env vars : voir .env.example
#    - Healthcheck : /api/health
```

## Backups

Coolify fait des backups Postgres automatiques. Vérifier que :
- Schedule : daily
- Retention : 7 quotidiens + 4 hebdo + 3 mensuels
- Storage : S3-compatible (R2 Cloudflare gratuit egress)
- Test de restore : 1x/an minimum (cf ops-packs/maintenance/backups/restic-policy.md)

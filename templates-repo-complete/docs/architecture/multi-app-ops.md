# Multi-app ops

## Comment opérer N sites avec une équipe small

1. **Un cockpit central** (`factory-control-center/`)
2. **Un fichier par site** (`ops/services/<site>.yml`)
3. **Auto-degrade** sur chaque site (économie coût)
4. **Workflows n8n centraux** (incident, P&L, quotas, backups)
5. **CI partagé** (GitHub Actions du repo factory)
6. **Approval policy** unique (`agent-quality-system/policies/approval-policy.yml`)

## Limites pratiques

- 1-3 sites : un dev gère
- 4-10 sites : besoin de cockpit + autopilot
- 10+ sites : besoin d'équipe ops dédiée

## Pas de magie

Plus de sites = plus de surface d'attaque = plus de cost monitoring.
Auto-degrade aide MAIS la complexité humaine reste.

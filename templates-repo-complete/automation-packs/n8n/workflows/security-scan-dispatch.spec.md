# Workflow : security-scan-dispatch

## Trigger
- GitHub webhook : pull_request opened/synchronize sur le repo factory ou un template
- Schedule weekly : full scan baseline (sundays 4am)

## Steps

1. **GitHub webhook reçu** : extrait owner/repo + PR number
2. **Trigger GitHub Actions** : `tools/scanners/run-all.sh` workflow
3. **Wait for results** (poll PR check runs)
4. **Parse `final-score.json`**
5. **If severity_max ≥ HIGH** :
   - Comment PR : "Security findings : N HIGH, M CRITICAL — voir final-score.md"
   - Create ticket Plane : `[security] PR #N`
   - Notify owner
6. **If clean** : add label `security-cleared`

## Edge cases
- Workflow Actions failed (infra issue) : retry 1x, sinon ticket P2 ops
- Token expiré : alert immediate

## Cost
- 0 (GitHub Actions free tier sur public repos, limité sur private)

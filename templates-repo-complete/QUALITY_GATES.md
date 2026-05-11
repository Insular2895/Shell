# QUALITY_GATES.md — Checks bloquants par PR

> Ce document définit les checks que **toute** PR doit passer avant merge.
> Les checks sont exécutés par GitHub Actions (`.github/workflows/`) ET par
> `tools/scanners/run-all.sh` en local.

## Checks par catégorie

### Code

| Check | Outil | Bloquant |
|-------|-------|----------|
| Lint | ESLint / ruff selon stack | ✅ |
| TypeCheck | tsc --noEmit | ✅ |
| Tests unitaires | vitest / pytest | ✅ |
| Build | next build / docker build | ✅ |

### Sécurité

| Check | Outil | Bloquant |
|-------|-------|----------|
| Secrets | Gitleaks | ✅ HIGH/CRITICAL bloquant |
| Code SAST | Semgrep + (CodeQL phase 2) | ✅ HIGH/CRITICAL bloquant |
| Deps vulnérables | OSV-Scanner + Trivy | ✅ HIGH/CRITICAL bloquant |
| SBOM | Syft (phase 3) | Non bloquant, archivé |
| Posture repo | Scorecard (phase 2) | Non bloquant, score archivé |
| Infra/Config | Checkov (phase 2) | Non bloquant pour MVP |
| App scanning | ZAP/Nuclei staging (phase 2) | Sur staging seulement |

### Data & confidentialité

| Check | Bloquant |
|-------|----------|
| Aucune donnée client réelle dans `fixtures/` | ✅ |
| Migrations DB validées (review obligatoire) | ✅ |
| Export data : `sellable_status = eligible` requis | ✅ |
| `consent_version` non null sur nouveau lead | ✅ |
| PII détectée dans logs/prompts → Presidio appliqué | ✅ |

### Modules & contrats

| Check | Bloquant |
|-------|----------|
| Module touché → version bumped (semver) | ✅ |
| `module.yaml` valide vs schema | ✅ |
| Backend pack touché → `pack.yaml` valide | ✅ |
| Feature contract (`feature-blueprint.md`) à jour | ✅ |

### Workflow

| Check | Bloquant |
|-------|----------|
| Pas de push direct sur `main` | ✅ |
| PR description non vide | ✅ |
| Liste fichiers modifiés cohérente avec scope | ✅ |
| Approval-policy respectée (cf `agent-quality-system/policies/approval-policy.yml`) | ✅ |

## Définition de "fini" (DoD)

Une tâche est finie SEULEMENT si :

```
☐ feature spec créée ou mise à jour
☐ fichiers modifiés listés en description PR
☐ tests ajoutés ou adaptés (nouveau code = nouveau test)
☐ lint / typecheck / build passés
☐ scan sécurité OK (ou risques documentés en commentaire PR avec mitigations)
☐ pas de secret exposé
☐ pas de PII dans les fixtures de test
☐ impact coût estimé si l'IA, une API payante ou de l'infra est touchée
☐ rollback possible documenté
☐ PR description claire (1 ligne pourquoi, 3 lignes quoi, fichiers touchés)
☐ si data : consentement, traçabilité, sellable_status vérifiés
☐ si module/pack : version bumped + CHANGELOG.md à jour
```

## Commandes utiles

```bash
# Tout en local avant push
./tools/scanners/run-all.sh ./<sub-target-dir>

# Sécurité ciblée
./tools/scanners/gitleaks.sh
./tools/scanners/semgrep.sh
./tools/scanners/osv.sh
./tools/scanners/trivy.sh

# Tests d'un template spécifique
cd micro-saas-template-v2 && npm run ci
```

## Rapport agrégé

```
reports/security/
  gitleaks.json
  semgrep.json
  osv.json
  trivy.json
  scorecard.json (phase 2)
  final-score.md
  final-score.json
```

`final-score.md` doit être archivé sur chaque PR via GitHub Actions et lié dans
le commentaire de la PR. Si `final-score.json.severity_max >= HIGH`, la PR est
bloquée jusqu'à mitigation documentée.

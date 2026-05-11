# security-packs/

> Outils et politiques de scan continu sur tout le code.

## Pipeline (ordre d'exécution)

```
1. Gitleaks             secrets exposés
2. Semgrep + CodeQL     vulnérabilités code (SAST)
3. OSV + Trivy + Grype  dépendances vulnérables
4. Syft                 SBOM
5. Checkov + Conftest   infra-as-code
6. Scorecard            posture repo (open source)
7. ZAP / Nuclei         scan app sur staging seulement
8. Presidio             cf ai-privacy-gateway/
```

## Niveaux

### MVP (phase 1)
- Gitleaks
- Semgrep
- OSV-Scanner
- Trivy
- Presidio (via ai-privacy-gateway)

### Phase 2
- CodeQL
- OpenSSF Scorecard
- Checkov
- OWASP ZAP (sur staging)

### Phase 3
- Syft (SBOM)
- Grype (CVE détaillé)
- Dependency-Track (gestion centralisée)
- Nuclei (scan templates app)
- Conftest (policies OPA)

## Commandes

```bash
factory security:scan ./app
factory security:scan-app https://staging.example.com
```

Implémentés dans `tools/scanners/run-all.sh`.

## Doctrine

Cf `policies/security-doctrine.md` pour les règles de base (gestion secrets,
upload, dépendances, pentest autorisé).

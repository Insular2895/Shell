# tools/

Scripts shell, scanners, helpers.

## Layout

```
tools/
├── scanners/
│   ├── run-all.sh         # lance tous les scans (gitleaks, semgrep, osv, trivy)
│   ├── gitleaks.sh        # secrets
│   ├── semgrep.sh         # SAST
│   ├── osv.sh             # dépendances
│   ├── trivy.sh           # filesystem/container deps
│   └── aggregate-score.sh # rapport final
└── configs/
    ├── semgrep/           # règles Semgrep custom (à enrichir)
    ├── gitleaks/gitleaks.toml
    ├── trivy/trivy.yaml
    └── osv/osv-scanner.toml
```

## Usage

```bash
./tools/scanners/run-all.sh ./<target>
```

Sortie dans `reports/security/`. La PR est bloquée si HIGH/CRITICAL non documenté.

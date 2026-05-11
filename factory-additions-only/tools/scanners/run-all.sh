#!/usr/bin/env bash
# tools/scanners/run-all.sh
# Run all security scanners on a target directory.
# Usage: ./tools/scanners/run-all.sh ./target-repo

set -euo pipefail

TARGET="${1:-.}"
REPORT_DIR="${REPORT_DIR:-reports/security}"
mkdir -p "$REPORT_DIR"

echo "=== Running security scanners on $TARGET ==="
echo "Reports → $REPORT_DIR"
echo ""

# 1. Gitleaks (secrets)
echo "[1/5] gitleaks..."
if command -v gitleaks > /dev/null; then
  gitleaks detect --source "$TARGET" \
    --config tools/configs/gitleaks/gitleaks.toml \
    --report-format json \
    --report-path "$REPORT_DIR/gitleaks.json" \
    --no-banner --exit-code 0 || true
else
  echo "  (gitleaks not installed, skipping — install: https://github.com/gitleaks/gitleaks)"
fi

# 2. Semgrep (SAST)
echo "[2/5] semgrep..."
if command -v semgrep > /dev/null; then
  semgrep scan "$TARGET" \
    --config tools/configs/semgrep/ \
    --json \
    --output "$REPORT_DIR/semgrep.json" || true
else
  echo "  (semgrep not installed, skipping — install: pip install semgrep)"
fi

# 3. OSV-Scanner (deps)
echo "[3/5] osv-scanner..."
if command -v osv-scanner > /dev/null; then
  osv-scanner --recursive "$TARGET" \
    --format json --output "$REPORT_DIR/osv.json" || true
else
  echo "  (osv-scanner not installed — install: https://google.github.io/osv-scanner/installation/)"
fi

# 4. Trivy (filesystem + Docker)
echo "[4/5] trivy..."
if command -v trivy > /dev/null; then
  trivy fs "$TARGET" \
    --severity HIGH,CRITICAL \
    --format json --output "$REPORT_DIR/trivy.json" || true
else
  echo "  (trivy not installed — install: https://aquasecurity.github.io/trivy/)"
fi

# 5. Aggregated score
echo "[5/5] aggregating..."
if [ -f tools/scanners/aggregate-score.sh ]; then
  bash tools/scanners/aggregate-score.sh "$REPORT_DIR" > "$REPORT_DIR/final-score.md"
else
  echo "  (aggregate-score.sh not yet implemented — phase 1 task)"
  echo "# Security scan ($(date))" > "$REPORT_DIR/final-score.md"
  echo "" >> "$REPORT_DIR/final-score.md"
  echo "Reports : $REPORT_DIR/*.json" >> "$REPORT_DIR/final-score.md"
fi

echo ""
echo "=== Done. Reports in $REPORT_DIR ==="

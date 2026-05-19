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

STATUS=0

echo "[1/5] gitleaks..."
bash tools/scanners/gitleaks.sh "$TARGET" || STATUS=1

echo "[2/5] semgrep..."
bash tools/scanners/semgrep.sh "$TARGET" || STATUS=1

echo "[3/5] osv-scanner..."
bash tools/scanners/osv.sh "$TARGET" || STATUS=1

echo "[4/5] trivy..."
bash tools/scanners/trivy.sh "$TARGET" || STATUS=1

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
exit "$STATUS"

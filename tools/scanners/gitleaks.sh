#!/usr/bin/env bash
# tools/scanners/gitleaks.sh
set -euo pipefail
TARGET="${1:-.}"
OUT="${REPORT_DIR:-reports/security}/gitleaks.json"
mkdir -p "$(dirname "$OUT")"

if ! command -v gitleaks > /dev/null; then
  echo "gitleaks not installed. Install: https://github.com/gitleaks/gitleaks"
  exit 1
fi

gitleaks detect \
  --source "$TARGET" \
  --config tools/configs/gitleaks/gitleaks.toml \
  --report-format json \
  --report-path "$OUT" \
  --no-banner --exit-code 0

LEAKS=$(jq 'length' "$OUT" 2>/dev/null || echo 0)
echo "Gitleaks: $LEAKS findings → $OUT"
[ "$LEAKS" -gt 0 ] && exit 1 || exit 0

#!/usr/bin/env bash
# tools/scanners/trivy.sh
set -euo pipefail
TARGET="${1:-.}"
OUT="${REPORT_DIR:-reports/security}/trivy.json"
mkdir -p "$(dirname "$OUT")"

if ! command -v trivy > /dev/null; then
  echo "trivy not installed. Install: https://aquasecurity.github.io/trivy/"
  exit 1
fi

trivy fs "$TARGET" \
  --severity HIGH,CRITICAL \
  --format json \
  --output "$OUT" \
  --quiet

VULNS=$(jq '[.Results[]?.Vulnerabilities // [] | .[]] | length' "$OUT" 2>/dev/null || echo 0)
echo "Trivy: $VULNS HIGH/CRITICAL → $OUT"
[ "$VULNS" -gt 0 ] && exit 1 || exit 0

#!/usr/bin/env bash
# tools/scanners/osv.sh
set -euo pipefail
TARGET="${1:-.}"
OUT="${REPORT_DIR:-reports/security}/osv.json"
mkdir -p "$(dirname "$OUT")"

if ! command -v osv-scanner > /dev/null; then
  echo "osv-scanner not installed. Install: https://google.github.io/osv-scanner/installation/"
  exit 1
fi

osv-scanner --recursive "$TARGET" \
  --format json \
  --output "$OUT" \
  --config tools/configs/osv/osv-scanner.toml || true

VULNS=$(jq '[.results[].packages[].vulnerabilities[]] | length' "$OUT" 2>/dev/null || echo 0)
echo "OSV: $VULNS vulnerabilities → $OUT"
[ "$VULNS" -gt 0 ] && exit 1 || exit 0

#!/usr/bin/env bash
# tools/scanners/semgrep.sh
set -euo pipefail
TARGET="${1:-.}"
OUT="${REPORT_DIR:-reports/security}/semgrep.json"
mkdir -p "$(dirname "$OUT")"

if ! command -v semgrep > /dev/null; then
  echo "semgrep not installed. Install: pip install semgrep"
  exit 1
fi

semgrep scan "$TARGET" \
  --config p/owasp-top-ten \
  --config p/typescript \
  --config p/python \
  --config tools/configs/semgrep/ \
  --json --output "$OUT" \
  --severity ERROR --severity WARNING \
  --quiet

HIGH=$(jq '[.results[] | select(.extra.severity == "ERROR")] | length' "$OUT" 2>/dev/null || echo 0)
echo "Semgrep: $HIGH ERRORs → $OUT"
[ "$HIGH" -gt 0 ] && exit 1 || exit 0

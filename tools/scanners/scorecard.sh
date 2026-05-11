#!/usr/bin/env bash
# tools/scanners/scorecard.sh — OpenSSF Scorecard
# Phase 2 — scaffold only.
set -euo pipefail
TARGET="${1:-.}"
OUT="${REPORT_DIR:-reports/security}/scorecard.json"
mkdir -p "$(dirname "$OUT")"

if ! command -v scorecard > /dev/null; then
  echo "scorecard not installed. Install: go install github.com/ossf/scorecard/v4@latest"
  exit 1
fi

# Scorecard requires a remote URL, not local path
echo "Scorecard requires a GitHub URL — not implemented for local. Skipping."
echo '{"skipped": true, "reason": "scorecard requires remote GitHub URL"}' > "$OUT"

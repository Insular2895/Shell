#!/usr/bin/env bash
# tools/scanners/aggregate-score.sh
# Aggregate all reports/security/*.json into a markdown summary.
set -euo pipefail

REPORT_DIR="${1:-reports/security}"
OUT="$REPORT_DIR/final-score.md"
JSON_OUT="$REPORT_DIR/final-score.json"

[ -d "$REPORT_DIR" ] || { echo "Reports dir $REPORT_DIR not found"; exit 1; }

# Counts
GITLEAKS=$(jq 'length' "$REPORT_DIR/gitleaks.json" 2>/dev/null || echo 0)
SEMGREP_ERR=$(jq '[.results[]? | select(.extra.severity=="ERROR")] | length' "$REPORT_DIR/semgrep.json" 2>/dev/null || echo 0)
SEMGREP_WARN=$(jq '[.results[]? | select(.extra.severity=="WARNING")] | length' "$REPORT_DIR/semgrep.json" 2>/dev/null || echo 0)
OSV=$(jq '[.results[]?.packages[]?.vulnerabilities[]?] | length' "$REPORT_DIR/osv.json" 2>/dev/null || echo 0)
TRIVY=$(jq '[.Results[]?.Vulnerabilities[]?] | length' "$REPORT_DIR/trivy.json" 2>/dev/null || echo 0)

# Severity max
SEVERITY_MAX="LOW"
[ "$GITLEAKS" -gt 0 ] && SEVERITY_MAX="CRITICAL"
[ "$SEMGREP_ERR" -gt 0 ] && [ "$SEVERITY_MAX" != "CRITICAL" ] && SEVERITY_MAX="HIGH"
[ "$OSV" -gt 0 ] && [ "$SEVERITY_MAX" != "CRITICAL" ] && SEVERITY_MAX="HIGH"
[ "$TRIVY" -gt 0 ] && [ "$SEVERITY_MAX" != "CRITICAL" ] && SEVERITY_MAX="HIGH"
[ "$SEMGREP_WARN" -gt 0 ] && [ "$SEVERITY_MAX" = "LOW" ] && SEVERITY_MAX="MEDIUM"

# Markdown
cat > "$OUT" << MARKDOWN
# Security scan — $(date -u +"%Y-%m-%d %H:%M UTC")

## Summary

| Tool | Findings |
|------|----------|
| Gitleaks (secrets) | $GITLEAKS |
| Semgrep (errors) | $SEMGREP_ERR |
| Semgrep (warnings) | $SEMGREP_WARN |
| OSV (vulnerable deps) | $OSV |
| Trivy (HIGH/CRITICAL) | $TRIVY |

**Severity max** : \`$SEVERITY_MAX\`

## Reports

- [\`gitleaks.json\`]($REPORT_DIR/gitleaks.json)
- [\`semgrep.json\`]($REPORT_DIR/semgrep.json)
- [\`osv.json\`]($REPORT_DIR/osv.json)
- [\`trivy.json\`]($REPORT_DIR/trivy.json)

## Verdict

$([ "$SEVERITY_MAX" = "CRITICAL" ] || [ "$SEVERITY_MAX" = "HIGH" ] \
  && echo "❌ **PR blocked** — résoudre les findings HIGH/CRITICAL ou documenter la mitigation." \
  || echo "✅ Pass.")
MARKDOWN

# JSON
cat > "$JSON_OUT" << JSONEOF
{
  "timestamp": "$(date -u +%FT%TZ)",
  "severity_max": "$SEVERITY_MAX",
  "counts": {
    "gitleaks": $GITLEAKS,
    "semgrep_error": $SEMGREP_ERR,
    "semgrep_warning": $SEMGREP_WARN,
    "osv": $OSV,
    "trivy": $TRIVY
  }
}
JSONEOF

cat "$OUT"

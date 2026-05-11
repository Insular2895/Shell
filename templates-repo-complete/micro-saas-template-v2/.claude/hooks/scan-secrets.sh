#!/usr/bin/env bash
#
# .claude/hooks/scan-secrets.sh
# Hook PreToolUse pour Write/Edit/str_replace — bloque l'écriture de secrets.

INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_str // .tool_input.file_text // ""')
PATH_=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Skip si .env.example, .gitignore, README, doc
if [[ "$PATH_" == *.env.example ]] || [[ "$PATH_" == *.gitignore ]] || [[ "$PATH_" == *.md ]]; then
  echo '{}'; exit 0
fi

SECRETS_PATTERNS=(
  "sk_live_[a-zA-Z0-9]{20,}"          # Stripe live secret
  "sk-[a-zA-Z0-9]{32,}"               # OpenAI / Anthropic
  "AIza[0-9A-Za-z\\-_]{35}"           # Google API
  "AKIA[0-9A-Z]{16}"                  # AWS access key
  "ghp_[a-zA-Z0-9]{36}"               # GitHub Personal Access Token
  "eyJhbGciOi[A-Za-z0-9_=]+\\.[A-Za-z0-9_=]+\\.[A-Za-z0-9_\\-=]+"  # JWT
  "-----BEGIN [A-Z]+ PRIVATE KEY-----"
  "supabase_service_role_key.*=.*['\"][a-zA-Z0-9]"
)

for pattern in "${SECRETS_PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qE "$pattern"; then
    cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "BLOCKED: secret-like pattern detected matching '$pattern'. Use env variables, never commit secrets. If false positive, regenerate the key first then proceed."
  }
}
JSON
    exit 0
  fi
done

echo '{}'
exit 0

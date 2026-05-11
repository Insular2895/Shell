#!/usr/bin/env bash
#
# .claude/hooks/block-destructive.sh
# Hook PreToolUse — bloque les commandes destructives évidentes.
# Pattern-matching, pas une frontière de sécurité, mais arrête les accidents.
#
# Référence : Anthropic recommendation, Trail of Bits "guardrails not walls"
# Lis stdin (JSON Claude Code), exit 1 + reason JSON pour bloquer.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Patterns dangereux
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf \$HOME"
  "rm -rf ~"
  "rm -rf \\*"
  ":(){ :|:& };:"     # fork bomb
  "dd if=/dev/zero"
  "mkfs\."
  "> /dev/sda"
  "DROP TABLE"
  "DROP DATABASE"
  "TRUNCATE TABLE"
  "git push --force-with-lease origin main"
  "git push -f origin main"
  "git reset --hard origin/main"
  "curl.*\\| (sh|bash|zsh)"   # pipe-to-shell exfil pattern
  "wget.*\\| (sh|bash|zsh)"
  "eval.*\\\$\\("
  "chmod -R 777"
  "chmod 777 /"
  "supabase db reset --linked"  # nuke prod DB
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked by .claude/hooks/block-destructive.sh: command matches dangerous pattern '$pattern'. If intentional, run manually outside Claude Code."
  }
}
JSON
    exit 0
  fi
done

# Detect credential exfiltration patterns
if echo "$COMMAND" | grep -qiE "(curl|wget|nc|netcat).*\.env"; then
  cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Network call referencing .env detected. Confirm this is not credential exfiltration."
  }
}
JSON
  exit 0
fi

# Detect writes to lib/supabase/middleware.ts (sacred)
WRITE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
if [[ "$WRITE_PATH" == *"lib/supabase/middleware.ts"* ]] || [[ "$WRITE_PATH" == *"middleware.ts" && "$WRITE_PATH" != *"lib/"* ]]; then
  cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked: middleware files are sacred (cf CLAUDE.md). A misplaced log between createServerClient and getUser breaks ALL deployed products' sessions."
  }
}
JSON
  exit 0
fi

# All clear
echo '{}'
exit 0

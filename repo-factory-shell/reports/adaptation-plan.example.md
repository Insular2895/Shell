# Adaptation plan — <repo> → factory

## Required changes
1. Add `INTEGRATION_NOTES.md` linking to root AGENT_RULES.md
2. Update CLAUDE.md to reference root doctrine
3. Migrate worker pattern to supabase-trigger (if not already)
4. Add `ops/services/<site>.yml` to register the site

## Optional improvements
- AI Privacy Gateway integration (if LLM used)
- Growth Data Layer integration (if leads collected)

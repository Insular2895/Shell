# agent-quality-system/

> Cadrage de Claude / Codex / agents IA sur ce repo.

## Architecture

```
AGENT_RULES.md (ce fichier de cadrage interne)
├── reference-library/   notes externes (lectures pas runtime)
├── internal-skills/     skills réutilisables (1-3 par tâche)
├── router/              skill-router : intention → skills
├── runtime/             policies runtime (token, output, hooks)
├── hooks/               hooks Claude Code (pre/post)
├── policies/            approval-policy.yml (gouvernance)
└── evaluation/          scorecards qualité
```

## Lis dans cet ordre

1. `AGENT_RULES.md` (étend `/AGENT_RULES.md` root)
2. `policies/approval-policy.yml`
3. `router/skill-router.md`
4. `runtime/minimal-context-policy.md`
5. Les skills concernés par ta tâche

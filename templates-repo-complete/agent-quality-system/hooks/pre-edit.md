# Hook PreToolUse Edit / Write

Référence dans le template (implementation shell) :
- `micro-saas-template-v2/.claude/hooks/block-destructive.sh`
- `micro-saas-template-v2/.claude/settings.json`

## Patterns bloqués (par défaut)

```
rm -rf /
rm -rf $HOME
DROP TABLE
TRUNCATE
git push --force
git push -f
curl ... | bash
wget ... | sh
modification de lib/supabase/middleware.ts
modification de middleware.ts
modification de package.json (sauf via npm install)
modification de supabase/migrations/* déjà committés
```

## Override

Pour bypasser un hook : entrée dans `decision_queue` avec rationale, puis
override via PR humain qui modifie temporairement `settings.json`.
Ne JAMAIS désactiver un hook silencieusement en commit.

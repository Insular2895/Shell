# agent-quality-system/hooks/hooks-policy.md

> Hooks Claude Code (`PreToolUse`, `PostToolUse`) qui implémentent
> automatiquement certaines règles. Non-négociables : si désactivés,
> l'agent ne peut pas push.

## Hooks de référence

Implémentations concrètes vivent dans les templates (ex:
`micro-saas-template-v2/.claude/hooks/`). Les fichiers ci-dessous sont la
doctrine.

### pre-edit.md (PreToolUse Edit/Write)

Avant toute modification de fichier :

1. Vérifier que le path n'est pas dans une zone interdite (`lib/`, `middleware.ts`,
   `supabase/migrations/` du template selon CLAUDE.md spécialisé)
2. Vérifier que le fichier n'est pas un consent_ledger / lead_delivery_log SQL (append-only)
3. Vérifier `agent-quality-system/policies/approval-policy.yml` :
   l'action est-elle `auto_allowed` ou `ask_before` ?
4. Si `ask_before` : refuser et émettre une demande de validation

### post-generation.md (PostToolUse Edit/Write)

Après génération :

1. Lancer un scan secrets sur le diff (`gitleaks` rapide)
2. Lancer lint + typecheck si fichier code
3. Si secret détecté : revert + alerte
4. Si lint fail : tenter auto-fix une fois sinon revert

### pre-pr.md (avant ouverture PR)

Avant d'ouvrir une PR :

1. Vérifier la checklist DoD (`docs/factory/definition-of-done.md`)
2. Vérifier qu'aucune action `ask_before` n'a été contournée
3. Si data export touché : vérifier que `gateExport()` est appelé
4. Si LLM touché : vérifier que `aiPrivacyGateway.redact()` est appelé
5. Générer le résumé PR avec liste fichiers + tests + impact coût

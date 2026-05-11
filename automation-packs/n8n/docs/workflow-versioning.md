# Workflow versioning

## Règle

Chaque workflow vit en deux endroits :
1. `workflows/<name>.spec.md` — la SPEC, source de vérité, versionnée git
2. `workflows/<name>.json` — l'export n8n, versionné git aussi

Quand tu modifies un workflow dans n8n UI :
1. Export JSON depuis n8n
2. Commit le JSON dans git
3. Update la spec MD si comportement change
4. Bump version dans le commit message

## Naming

`<domain>-<action>` : ex `incident-auto-degrade`, `pnl-daily-report`.

## Vetting

Tout workflow nouveau passe par `template-bank/imported/` →
`reviewed/` → `approved/` (cf `policies/automation-policy.yml`).

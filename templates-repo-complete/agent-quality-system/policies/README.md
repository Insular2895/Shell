# agent-quality-system/policies/

- `approval-policy.yml` — quoi est auto vs ask_before vs blocked
- (futur) `data-handling-policy.yml`
- (futur) `release-policy.yml`

Ces policies sont **opposables** :
- Lues par les hooks Claude Code
- Lues par GitHub Actions
- Lues par tools/scanners/policy-check.sh
- Lues par ops-autopilot/decision-engine/

L'agent ne peut pas modifier ces fichiers seul (cf approval-policy lui-même).

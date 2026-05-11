# Example context packet — TASK-0042

> Auto-généré par dev-orchestrator + context-engine.
> Ce packet est livré à l'agent comme SEUL contexte initial.

## Task brief

**ID** : TASK-0042
**Type** : add_loading_state
**Title** : "Add loading state to UploadDropzone in document-extraction"
**Risk level** : low
**Approval required** : false

## Skills loaded

- `agent-quality-system/internal-skills/spec-driven-execution.md`
- `agent-quality-system/internal-skills/frontend-ui-quality.md` (à créer phase 3)

## Files in scope (max 8)

- `modules-registry/upload/frontend/components/UploadDropzone.md` (spec)
- `micro-saas-template-v2/components/UploadDropzone.tsx` (impl)
- `micro-saas-template-v2/__tests__/components/UploadDropzone.test.tsx` (test)

## Always-loaded references

- `/AGENT_RULES.md`
- `/QUALITY_GATES.md`
- `/agent-quality-system/policies/approval-policy.yml` (pour vérifier auto vs ask_before)

## NOT loaded

- `reference-library/` (notes, hors scope runtime)
- `growth-data-layer/` (pas concerné par UI upload)
- Conversations passées
- Autres modules (auth, billing, etc.)

## Acceptance criteria

- [ ] UploadDropzone affiche un spinner pendant l'upload
- [ ] L'utilisateur ne peut pas re-drop pendant un upload en cours
- [ ] Test added : "shows spinner while uploading"
- [ ] No regression sur tests existants
- [ ] Lint + typecheck pass

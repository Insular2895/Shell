# Vetting checklist (pour ajouter un workflow externe)

Quand on importe un workflow depuis [enescingoz/awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates) ou similaire :

## Checklist

- [ ] Les credentials sont des **références** n8n (pas en dur dans les nodes)
- [ ] Aucun secret en clair dans le JSON
- [ ] Les URLs sont via env vars (pas hardcoded)
- [ ] Pas d'action `ask_before` exécutée sans validation (cf `policies/automation-policy.yml`)
- [ ] Pas d'`Execute Command` qui exécute du shell arbitraire
- [ ] Pas de `Function` node avec eval / Function constructor
- [ ] Tests : exécuter en mode "manual" 1x pour valider le flow
- [ ] Documenté dans `<workflow>.spec.md`

## Si OK

→ déplacer vers `template-bank/approved/` avec semver tag (ex: `lead-import-1.0.0.json`)

## Si KO

→ rejeter dans `template-bank/rejected/` avec note

## Quand republier

Si le workflow change de comportement :
- Bump version (semver)
- Diff visible en revue PR
- Update spec MD

# Prompt : screenshot analysis (cleanroom)

Tu reçois un screenshot d'un site/app/feature.

Tu produis :
1. Une liste des composants UI visibles, par CATÉGORIE (cf `ui-components.schema.json`)
2. Le user flow déduit (ordre logique des actions)
3. Les états visibles dans le screenshot (idle, loading, completed, error...)

⚠️ Tu ne dois PAS :
- Décrire les couleurs précises ou typos exactes
- Reproduire les textes verbatim
- Suggérer un design pixel-perfect

Tu PEUX :
- Identifier qu'il y a "un dropzone + un bouton CTA + un panneau résultat"
- Identifier le pattern (form, dashboard, kanban, etc.)
- Suggérer des composants équivalents dans NOTRE design system

Sortie : `ui-components.json` + `user-flow.md` (en français, abstrait).

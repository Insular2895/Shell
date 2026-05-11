# Prompt : cleanroom abstraction

Tu reçois un feature-map brut (sortie de site-analysis ou screenshot-analysis).

Tu produis une VERSION ABSTRAITE qui peut servir d'input à `feature-generation/`
pour reconstruire la feature DEPUIS ZÉRO avec NOTRE design system.

Règles :
1. Strip tous les noms commerciaux du site source
2. Strip tous les textes spécifiques (slogans, headlines)
3. Garde uniquement : pattern UI, user value, backend pattern, états
4. Si une feature est trop spécifique pour être abstraite proprement (ex: copie d'un Notion-like complet) → flag `requires_human_review: true`

Sortie : `cleanroom-feature-spec.json` qui suit `feature-blueprint.schema.json`
avec `source.cleanroom_validated: true`.

Si une fraction de l'output ressemble trop à du verbatim (>20 mots identiques
au source) : ALERTE et stop. Ne push pas.

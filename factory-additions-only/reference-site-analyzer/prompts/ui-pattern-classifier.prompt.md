# Prompt : UI pattern classifier

Étant donnés des composants UI extraits, classe-les dans nos patterns standards :

- `form` (avec sous-types : login, signup, contact, multi-step-wizard, settings)
- `list` (avec sous-types : table, cards-grid, kanban, timeline)
- `dashboard` (avec sous-types : metrics-overview, drill-down, real-time)
- `dropzone` (upload simple, multi-fichier, batch)
- `chart` (line, bar, pie, area, sankey, scatter)
- `editor` (text, code, rich, markdown, canvas)

Sortie : pour chaque composant détecté, le pattern le plus proche dans
modules-registry/.

Si aucun module existant ne couvre, suggère un nouveau module à créer.

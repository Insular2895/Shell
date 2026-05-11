# Prompt : UI contract generation

À partir d'un feature-blueprint, génère le `ui-contract.json` détaillé.

Pour chaque composant :
- Référence le module existant (ex: `upload@1.0.0/UploadDropzone`)
- Liste les props nécessaires
- Liste les events émis

Pour chaque état UI :
- Quel trigger fait passer dans cet état
- Quels changements visuels (skeleton, message, blur, etc.)

Inclus accessibility : niveau WCAG, navigation clavier, screen reader.

Sortie : conforme à `schemas/ui-contract.schema.json`.

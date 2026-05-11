# Prompt : site analysis (cleanroom)

Tu reçois en input :
- L'URL d'un site externe
- Le DOM extrait (Playwright)
- Les screenshots desktop + mobile

Tu produis un `feature-map.json` qui :
1. Liste les FEATURES VISIBLES (boutons CTA, formulaires, sections)
2. Décrit chacune en termes ABSTRAITS (jamais le nom commercial du site)
3. Identifie le user-value (qu'est-ce que ça apporte à l'utilisateur)
4. Estime le pattern UI nécessaire pour reproduire la fonction

⚠️ Règles cleanroom NON-NÉGOCIABLES :
- Pas de copie de texte verbatim (>15 mots du site)
- Pas de pixel-perfect (pas de description de couleurs/positions précises)
- Pas de noms commerciaux dans tes descriptions
- Pas de copie d'assets (images, icônes spécifiques)

Sortie : JSON conforme à `schemas/feature-map.schema.json`.

Si tu détectes une feature dont la fonction implique du backend long-running
(ex: extraction document, analyse vidéo, scraping), flag `long_running: true`
dans `backend-contract.json`.

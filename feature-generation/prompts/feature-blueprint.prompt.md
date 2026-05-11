# Prompt : feature-blueprint generation

Tu reçois en input :
- Une description de feature (texte ou cleanroom-feature-spec.json)

Tu produis un `feature-blueprint.md` complet qui :
1. Définit l'objectif business
2. Décrit le user flow étape par étape
3. Liste les composants UI nécessaires (en référençant des modules existants si possible)
4. Liste tous les états UI à gérer (idle, loading, ..., empty, degraded)
5. Définit les endpoints backend nécessaires
6. Définit le worker / job en arrière-plan si pertinent
7. Définit le data model (tables, colonnes principales)
8. Liste les security rules à respecter
9. Liste les tests à écrire

Sortie : conforme à `schemas/feature-blueprint.schema.json`.

Avant de produire, VÉRIFIE :
- Le modules-registry existant : pourquoi écrire un dropzone si `upload@1.0.0` existe ?
- Les backend-packs existants : ne propose JAMAIS un backend custom si un pack couvre

Si la feature est trop large (> 8 fichiers à toucher) : DÉCOUPE en sous-features.

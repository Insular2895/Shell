# ops/

Registre opérationnel des sites en production.

## services/

Un fichier YAML par site (cf `services/document-extractor.yml` exemple).
Schéma : `ops-packs/service-catalog/service.schema.json`.

Le cockpit (`factory-control-center/`) lit ce dossier pour afficher la liste
des sites et leurs configs.

## Ajouter un nouveau site

1. Créer `services/<site_id>.yml` selon le schéma
2. Valider via `ajv -s ops-packs/service-catalog/service.schema.json -d services/<site_id>.yml`
3. Commit
4. Le cockpit le détecte automatiquement

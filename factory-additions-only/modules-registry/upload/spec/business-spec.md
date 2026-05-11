# upload — Business spec

## Objectif
Permettre à un utilisateur authentifié d'uploader un fichier (PDF, image, doc)
ou de fournir une URL publique, qui sera ensuite traité par un job backend.

## User flow
1. Drag-drop fichier OU collage URL
2. Validation côté client (type, taille)
3. Upload vers Supabase Storage avec signed URL OU enregistrement de l'URL
4. Retour : storage_path ou external_url + metadata


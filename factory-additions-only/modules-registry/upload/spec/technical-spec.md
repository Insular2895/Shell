# upload — Technical spec

## Frontend
- Composants : UploadDropzone, FilePreview, UploadProgress, WebLinkInput
- Variantes : basic-dropzone, uppy-dashboard, url-and-file-upload
- États : idle, dragging, selected, validating, uploading, completed, failed

## Backend
- POST /api/upload/initiate → signed URL pour upload direct (PUT vers Supabase)
- POST /api/upload/finalize → metadata enregistrée + retour storage_path
- POST /api/upload/from-url → enregistre external_url (pas de download)

## Storage
- Bucket : 'uploads' (privé)
- Path : {user_id}/{uuid}/{filename}
- Signed URL TTL : 1h pour download, 5 min pour upload

## Limits
- Max size : 100 MB par défaut, configurable par template
- Allowed mimes : configurable (défaut : pdf, doc, image)


# document-extraction — Technical spec

## Frontend
- Components : ExtractionCard, UploadDropzone (réutilise upload@1.0.0), ProcessingStatus, ResultPreview, ExportButtons

## Backend
- Reuse du pattern v2 : POST /api/jobs/create + polling /api/jobs/{id}
- Engine : Python adapter qui lit fichier, retourne {status, blocks}

## Worker
- Pattern : /api/jobs/worker/claim + /api/jobs/worker/complete
- Lease 15 min, retry 3x


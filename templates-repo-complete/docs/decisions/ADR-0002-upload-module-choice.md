# ADR-0002 — Upload module : Supabase Storage signed URLs

## Status
Accepted (2026-05-09)

## Context
Upload de fichiers : 3 options
- Supabase Storage signed URLs
- Uppy + Tus
- Direct AWS S3 (presigned)

## Decision
**Supabase Storage signed URLs** par défaut. Uppy en variante pour UI dashboard riche.

## Consequences
- ✅ RLS Postgres native (signed URLs respectent RLS)
- ✅ Pas d'AWS account requis
- ✅ Storage gratuit jusqu'à 1GB
- ⚠️ Vendor lock Supabase (pas grave : migration possible)

## Review
Si on dépasse 100GB → considérer Cloudflare R2 (égalité Supabase + 0$ egress).

# Simple system patterns

> Préférer la simplicité tant que ça scale.

## Patterns simples qu'on garde longtemps

- Postgres comme queue (SKIP LOCKED)
- HTTP entre services (pas gRPC tant que pas justifié)
- Container par service, pas microservices fragmentés
- Auth via Supabase / Stack Auth (pas Keycloak custom)
- Backups Restic + R2 (pas S3 + KMS + ...)

## Quand complexifier

- Postgres ne suffit plus comme queue : > 10k jobs/jour
- HTTP latence trop élevée : > 100ms par hop, plusieurs hops
- Container monolithe trop gros : > 30s build, > 1GB image
- Auth custom requis : règles SSO, SCIM, etc.

# Restic policy

## Stack

- **Restic** pour backups DB Postgres + storage
- Storage : S3-compatible (R2 Cloudflare = 0$ egress, recommandé)
- Encryption : Restic encrypte par défaut avec password

## Schedule

```
DB Postgres : daily 2am UTC
Storage uploads : daily 2:30am UTC
Logs critiques : daily 3am UTC
```

## Retention (forget policy)

```
--keep-daily 7
--keep-weekly 4
--keep-monthly 6
--keep-yearly 2
```

## Test de restore

**Obligatoire 1x par an minimum.** Procédure :

1. Provisionner un Postgres temporaire
2. `restic restore <snapshot> --target /tmp/restore`
3. Charger le dump dans le Postgres temp
4. Vérifier 3-5 requêtes test (count rows, view qui marche, etc.)
5. Compare avec prod (sample) — pas d'écart > 1%
6. Documenter dans `reports/backup-tests/YYYY-restore-test.md`

Si test échoue : P0 incident, fix avant prochain backup.

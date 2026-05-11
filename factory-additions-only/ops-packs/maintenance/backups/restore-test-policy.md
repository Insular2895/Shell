# Restore test policy

> Un backup non testé = pas un backup.

## Fréquence

- **Annuel obligatoire** : restore complet, vérification intégrité
- **Trimestriel recommandé** : sample restore (1 table) + vérification cohérence
- **Mensuel automatique** : intégrité du repository (`restic check`)

## Procédure annuelle

Documentée dans `restic-policy.md`. Sortie : `reports/backup-tests/YYYY-restore-test.md`.

## Si le test échoue

- P0 incident
- Suspendre les exports data le temps de comprendre
- Re-créer une stratégie de backup
- ADR documentant le retour d'expérience

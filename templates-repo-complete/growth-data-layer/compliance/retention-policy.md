# Retention policy (résumé)

Cf `data-minimization-policy.md` pour la table complète.

## Implémentation

Cron quotidien `/api/cron/retention-cleanup` :
- Pour chaque lead avec `retention_expires_at <= now()` → marquer `sellable_status='expired'`
- Après 6 mois supplémentaires sans réactivation → DELETE master_contacts CASCADE
- consent_ledger conservé 5 ans (preuve audit), même après contact deleted

## Override

Un contact peut prolonger sa retention en :
- Se reconnectant (page "mon compte")
- Confirmant un email annuel (double opt-in renewal)

Ces actions resettent `retention_expires_at = now() + 3 years`.

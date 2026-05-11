# Merge Review Dashboard (UI à coder phase 6)

## Vue admin

Pour chaque ligne de `merge_reviews` avec `status='pending'` :

```
┌─────────────────────────────────────────────────┐
│ Suggested merge — score 0.83                   │
│                                                  │
│ Contact A                Contact B               │
│ ─────────                ─────────               │
│ email: [HASH]           email: [HASH]           │
│ name: J. Dupont         name: Jean Dupont        │
│ company: ACME           company: ACME SAS        │
│ first_seen: 2025-01     first_seen: 2025-03      │
│                                                  │
│ Same person?                                     │
│ [ Approve ]  [ Reject ]  [ Defer ]               │
└─────────────────────────────────────────────────┘
```

## Logique merge

Si Approve :
1. UPDATE master_leads SET contact_id = a.contact_id WHERE contact_id = b.contact_id
2. UPDATE master_contacts SET identity_cluster_id = a.cluster_id WHERE contact_id = b.contact_id
3. b est marqué orphelin (pas supprimé — preuve audit)
4. INSERT identity_clusters cluster_id = ..., resolution_method='manual_review'
5. consent_ledger : merge des consentements (intersection)

## Réf

- Schema : `growth-data-layer/identity-resolution/identities-schema.sql`
- Splink job : `splink/run-resolution.py`

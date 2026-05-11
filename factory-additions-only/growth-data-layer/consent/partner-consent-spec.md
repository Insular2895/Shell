# Partner consent spec

Lors d'un formulaire avec `consent_partners` checkbox :

## Frontend

- Checkbox **non pré-cochée**
- Texte clair : "J'accepte que mes coordonnées soient partagées avec des partenaires sélectionnés (cf liste)"
- Lien vers la liste des catégories de partenaires (ex: "/partners-list")
- Si décoché : on enregistre quand même un consent_ledger (status='denied') pour audit

## Backend

```typescript
// /api/leads/submit
const consentResult = await db.consent_ledger.insert({
  contact_id,
  site_id,
  consent_type: 'partners',
  status: data.consent_partners ? 'granted' : 'denied',
  legal_text_version: 'v2026-01-CGU-FR',
  legal_basis: 'consent',
  collection_method: 'opt_in_unchecked_box',
  collection_page: req.headers.referer,
  ip_hash, user_agent_hash,
});
```

## Sellable status calculé

Si `consent_partners='granted'` ET reste OK → `sellable_status='unverified'` (en attendant email_verified) puis `'eligible'`.
Sinon → `'internal_only'`.

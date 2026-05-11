# Opt-out policy

## Canaux d'opt-out

1. **Footer email** "Se désabonner" : ouvre /unsubscribe, INSERT consent_ledger status='revoked' pour 'prospection'
2. **Footer site** "Cookie settings" : reopen banner, granular revoke
3. **Email direct** vers `privacy@<domain>` : traité manuellement sous 30j (RGPD art 12)
4. **API** `POST /api/consent/revoke` avec auth user

## Effets en cascade

Quand `opt_out=true` est set sur un contact :
- `consent_ledger` : INSERT lignes status='revoked' pour TOUS les types granted
- `master_contacts.opt_out=true`
- `master_leads.opt_out=true` pour tous les leads de ce contact
- `mart_sellable_leads` exclut automatiquement (conditions de la vue)
- Webhook envoyé aux buyers ayant reçu ce lead (best-effort, retention contractuelle)

## Audit

Email de confirmation envoyé au contact "votre opt-out a bien été enregistré".
1 ligne dans `audit_log` (qui, quand, source).

# Opt-out policy

## Comment un user peut opt-out

1. **Via lien désabonnement** dans tout email envoyé (obligatoire LCEN)
2. **Via formulaire dédié** sur le site (`/opt-out` page)
3. **Via API** `/api/consent/revoke` avec auth user
4. **Via demande email** au support → traitement manuel < 30j

## Effet d'un opt-out

```
1. INSERT consent_ledger (status='revoked', method='opt_out_link')
2. UPDATE master_contacts SET opt_out=true, opt_out_at=now()
3. UPDATE master_leads SET opt_out=true (cascade tous les leads du contact)
4. Recalc sellable_status → 'opt_out' pour tous les leads concernés
5. Émettre webhook_buyer_revoke pour CHAQUE buyer ayant reçu ce lead
```

## Propagation aux acheteurs

Pour chaque entrée dans `lead_delivery_log` du contact :
- Webhook POST vers `buyer.webhook_url` avec payload {lead_id, action: 'opt_out'}
- Si pas de webhook : email manuel au buyer.contact_email

## SLA

- Côté nous : < 24h pour propager opt-out
- Côté acheteur (clause contrat) : < 7j pour purger côté CRM

## Audit

Logué dans `consent_ledger` avec method='opt_out_link' (ou 'api_revocation', etc.).
Rapport mensuel : combien d'opt-outs reçus, par site, par source.

# Consent and partner sharing policy

> Détail des conditions de partage avec acheteurs/partenaires.

## Niveaux de partage

| Type | Description | Conditions |
|------|-------------|------------|
| **Aucun partage** | Donnée 100% interne | Default |
| **Partage anonymisé** | Stats agrégées sans PII | OK avec consent_analytics |
| **Partage pseudonymisé** | Hash email pour matching ad | consent_ads obligatoire |
| **Partage nominatif limité** | Email/phone à 1 buyer specifique | consent_partners + contrat buyer |
| **Partage multi-acheteurs** | Vente non-exclusive | consent_partners + chaque buyer respecté |

## Workflow consent

```
visiteur arrive
  → consent banner : choix granulaire par finalité
  → INSERT consent_ledger (1 ligne par finalité)

formulaire submit
  → re-display consent_partners spécifique
  → INSERT consent_ledger update
  → calcul sellable_status

opt-out reçu (lien email, page settings)
  → INSERT consent_ledger status='revoked'
  → contact.opt_out=true
  → propagation aux buyers ayant reçu ce lead (webhook/email)
  → mart_sellable_leads : lead disparaît de la vue (auto)
```

## Engagement aux buyers

Tout buyer doit pouvoir :
- Recevoir une notification d'opt-out dans 24h via webhook
- Recevoir une procédure manuelle si webhook indisponible

Sans propagation opt-out : breach contractuel (cf data-selling-policy).

# Enrichment policy

> Règles d'enrichissement d'un contact via APIs externes.

## Principe

Enrichir = ajouter des infos qu'on n'a PAS collectées du contact.
Ex : "j'ai un email pro, je veux trouver le SIREN de l'entreprise".

## Sources autorisées

- **Données publiques** : INSEE entreprises, sirene.fr, registre du commerce — OK
- **APIs commerciales légitimes** : Clearbit, FullContact, Hunter.io — OK avec :
  - Contrat actif
  - Vérification que la source respecte RGPD (DPA signé)
  - Logging de chaque enrichissement (preuve audit)
- **Scraping LinkedIn** : ❌ INTERDIT (TOS LinkedIn + RGPD risque)

## Base légale

- Si on enrichit un contact qui a `consent_partners=true` → consent
- Sinon → legitimate_interest avec test mise-en-balance documenté
- Test : intérêt commercial vs. attente raisonnable du contact
- Verdict : enrichissement de l'entreprise OK ; enrichissement profil personnel = consent obligatoire

## Limitation

- Pas d'enrichissement de mineurs
- Pas d'enrichissement de profils sensibles (santé, religion, etc.)
- Si l'enrichissement révèle une info sensible : drop, ne pas stocker

## Logging

```sql
CREATE TABLE enrichment_log (
  id UUID PRIMARY KEY,
  contact_id UUID,
  source TEXT,             -- 'clearbit', 'sirene', etc.
  fields_added TEXT[],     -- ['siren', 'industry', 'size_range']
  legal_basis TEXT,
  enriched_at TIMESTAMPTZ
);
```

## Si le contact demande effacement

DELETE master_contacts CASCADE → toutes les données enrichies disparaissent.
enrichment_log conservé (preuve audit, pas de PII).

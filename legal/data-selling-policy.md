# legal/data-selling-policy.md

## Principe absolu

> **La vente / partage / monétisation de données personnelles n'est possible
> QUE si chaque condition légale et opérationnelle est satisfaite.**
>
> Toute exception doit faire l'objet d'une décision explicite documentée
> dans `decision_queue` (cf `factory-control-center/`).

## Conditions cumulatives obligatoires

Pour qu'un lead soit livrable à un acheteur externe :

```
1. Preuve de consentement valide
   → consent_ledger contient une ligne status='granted', consent_type='partners'
   → legal_text_version != null
   → legal_basis ∈ {consent, contract} (pas legitimate_interest pour la prospection commerciale tierce)

2. Pas d'opposition active
   → contact.opt_out = false
   → lead.opt_out = false

3. Vérification minimale
   → verification_level ∈ {email_verified, phone_verified, form_submitted, meeting_booked, paying_customer}

4. Fraîcheur respectée
   → data_freshness_days ≤ 90 (par défaut)

5. Rétention non dépassée
   → retention_expires_at > now()

6. Catégorie d'acheteur autorisée
   → buyer.allowed_categories ∩ lead.allowed_partner_categories ≠ ∅

7. Usage demandé autorisé
   → buyer.allowed_usages ∩ lead.allowed_channels ≠ ∅

8. Pas d'exclusivité conflictuelle
   → si exclusivité demandée : aucune livraison antérieure
   → si non-exclusif : compatible avec exclusivités passées (semi-exclusif: catégories disjointes)

9. Statut système
   → sellable_status = 'eligible'
   → buyer.status = 'active'
   → site.legal_status (à créer) = 'compliant'
```

Si **une seule** condition échoue → blocage. Voir `growth-data-layer/exports/export-policy.md` pour le code du gate.

## Bases légales acceptées par finalité

| Finalité | Base légale acceptée | Notes |
|----------|---------------------|-------|
| Email transactionnel (confirmation, mot de passe) | contract | Pas de consent requis |
| Prospection email B2C nouvelle | consent | Opt-in obligatoire (LCEN art L.34-5) |
| Prospection email B2B vers email pro générique | legitimate_interest possible | Sujet doit être lié à l'activité pro du destinataire (CNIL — règles soft opt-in B2B) |
| Prospection téléphonique B2C | consent ou opt-out registre Bloctel | Vérifier inscription Bloctel obligatoire |
| Vente du contact à un tiers (notre cas) | **consent explicite (consent_partners)** | Pas d'autre base acceptable |
| Enrichissement via API tierces | legitimate_interest possible | À documenter dans le test mise-en-balance |
| Audience activation publicitaire | consent (consent_ads) | Opt-in granulaire |
| Analytics | consent (consent_analytics) | Selon les directives CNIL/ePrivacy |
| Conservation pour obligation comptable | legal_obligation | 5-10 ans selon facture |

⚠️ La base `legitimate_interest` n'est valide qu'après un test de mise en balance documenté
(intérêts du responsable vs droits/libertés des personnes). Pour la **vente à un tiers**,
ce test échoue presque toujours → **consent obligatoire**.

## Catégories de données par niveau de risque

| Niveau | Données | Vendable si consent_partners ? |
|--------|---------|-------------------------------|
| Bas | Données entreprise (SIREN, secteur, taille, site) | ✅ oui |
| Bas | Comportement agrégé / anonymisé | ✅ oui |
| Moyen | Email pro + nom + entreprise | ✅ avec consent_partners |
| Moyen | Téléphone pro | ✅ avec consent_partners + Bloctel B2C |
| Moyen | Email perso | ⚠️ uniquement consent strict + B2C |
| Haut | Adresse postale | ⚠️ rarement justifié |
| **Très haut** | Données sensibles (santé, religion, opinion, orientation) | ❌ **JAMAIS** |
| **Très haut** | Données mineurs (< 16 ans UE) | ❌ **JAMAIS** |
| **Très haut** | Données financières détaillées | ❌ jamais sans cas explicite |

## Audit & traçabilité

Tout export doit laisser :

- 1 ligne dans `lead_delivery_log` avec snapshot des conditions
- 1 ligne (ou plus) dans `consent_ledger` justifiant le consentement
- 1 entrée P&L dans `finance-ledger.revenues`
- Si > X € : 1 entrée dans `decision_queue` pour validation manuelle

## En cas de demande RGPD du contact

Si un contact demande effacement (art 17) :

1. DELETE master_contacts CASCADE → master_leads supprimés (CASCADE)
2. Note : `consent_ledger` et `lead_delivery_log` sont **conservés** (preuve audit), mais le contact_id devient orphelin
3. Pour chaque buyer ayant reçu ce lead : envoyer un `webhook_buyer_revoke` (ou email manuel) demandant la suppression côté buyer
4. Marquer la demande dans `rgpd_requests` (à créer phase 2)
5. Réponse au demandeur sous 30 jours

## En cas de breach data

Procédure incident niveau P0 :

1. Couper les exports (`site_config.engine_mode = 'maintenance'` + `block-data-export`)
2. Identifier la portée : combien de contacts, quelles données
3. Évaluer le risque utilisateur (mots de passe ? cartes ? données sensibles ?)
4. **Notification CNIL sous 72h** si risque pour les personnes (art 33 RGPD)
5. **Notification utilisateurs** si risque élevé (art 34)
6. Postmortem dans `reports/incidents/`
7. Plan d'action préventif

## Protection contractuelle vis-à-vis des acheteurs

Tout contrat acheteur (`buyer.contract_pdf_url` requis avant délivery) inclut :

- Liste exhaustive des `allowed_usages`
- Interdiction de **revente**
- Obligation de **propager les opt-outs** reçus du contact (webhook ou email)
- Rétention max côté acheteur (12-24 mois typiquement)
- **Suppression** sur demande de notre part (procédure RGPD reverse)
- Frais en cas de breach contractuel
- Compétence juridique (FR par défaut)
- Conformité RGPD réciproque

## Liste des choses qu'on ne fera JAMAIS

❌ Vendre des leads collectés sans consent_partners
❌ Vendre des leads d'un site sans bandeau cookie/consent valide
❌ Vendre les mêmes leads à plus d'acheteurs que ce que le contact accepte
❌ Vendre à un acheteur dont l'usage déclaré est interdit pour ce lead
❌ Pousser des données vers des serveurs hors UE sans clauses contractuelles types (SCC) ou pays adéquat
❌ Vendre des données de mineurs
❌ Vendre des données scrappées sans base légale
❌ Permettre à des agents IA de bypasser le gate `mart_sellable_leads` (cf approval-policy)

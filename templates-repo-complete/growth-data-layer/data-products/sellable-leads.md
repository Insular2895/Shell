# growth-data-layer/data-products/sellable-leads.md

## Définition

Un **lead vendable** est un contact + besoin commercial qui satisfait
**toutes** ces conditions :

```
sellable_status = 'eligible'
opt_out = false (sur contact ET sur lead)
consent_partners = true
verification_level ∈ {email_verified, phone_verified, form_submitted, meeting_booked, paying_customer}
data_freshness_days ≤ 90
retention_expires_at > now()
allowed_partner_categories ∩ buyer.allowed_categories ≠ ∅
allowed_channels ∩ buyer.allowed_usages ≠ ∅
consent_version not null
```

## Variantes commerciales

### 1. Lead e-commerce scoré
Pour acheteurs : agences de conversion, SaaS e-commerce, fournisseurs Shopify.

Champs :
```
company.name, company.website, company.industry, company.size_range
contact.email (déchiffré à la livraison), contact.phone (idem)
intent_score, lead_quality_score
need_category = 'ecommerce-optimization' | 'shopify-app' | ...
detected_stack (ex: ['shopify', 'klaviyo'])
```

Pricing indicatif : 30-150 € selon vérification.

### 2. Lead audit demandé
Lead qui a explicitement rempli un formulaire d'audit (besoin clair).

Champs additionnels :
```
need (texte libre)
budget_range
timing
audit_focus (ex: ['seo', 'paid-ads', 'cro'])
```

Pricing indicatif : 150-500 €.

### 3. Lead premium ads
E-commerce avec ad spend estimé > N €/mois.

Champs additionnels :
```
ad_spend_estimate ('low', 'medium', 'high')
ads_platforms (ex: ['meta', 'google', 'tiktok'])
recently_active_campaigns (vu dans Meta Ads Library)
```

Pricing indicatif : 200-500 €.

### 4. Audience activable (anonymisée)
Segment pseudonymisé pour ad targeting (lookalike). Pas de PII brute.

Champs :
```
segment_id
segment_size (count)
attribute_summary (industries, countries, size ranges)
hashed_emails_for_match (sha256, format Meta/Google)
```

Pricing indicatif : abonnement 500-5 000 €/mois.

### 5. Signal d'intention
Indication agrégée d'intérêt récent pour une catégorie.

Pas de PII. Niveau entreprise uniquement.

```
company_id (opaque, mappable côté acheteur via siren/domain)
signal_category
signal_strength (0-100)
signal_observed_in_last_n_days
```

Pricing indicatif : 0,01-0,50 € par signal, ou package mensuel.

### 6. Dataset public enrichi
Cf `public-data-products/`. DVF, Meta Ads Library, etc. Pas de PII non
publique.

## Contraintes contractuelles

Tout buyer signe un contrat avant délivery (cf `exports/buyer-contract-fields.md`) :

- Liste des `allowed_usages`
- Retention max côté buyer
- Interdiction de revente
- Obligation de respecter opt-outs propagés
- Obligation de répondre à `webhook_buyer_revoke` dans les 24h
- Compliance RGPD si EU
- Frais en cas de breach (clause)

## Anti-patterns à éviter

❌ Vendre "une base de données" — on vend des **produits** segmentés et qualifiés
❌ Vendre des emails sans contexte besoin — qualité minable, prix qui s'effondre
❌ Vendre des leads non vérifiés — taux de bounce détruit la réputation buyer
❌ Vendre les mêmes leads à plusieurs acheteurs sans clauses claires d'exclusivité
❌ Vendre sans auditer la fraîcheur — leads de 6 mois = leads pourris
❌ Vendre depuis des sites scrappés sans consent valide — risque légal majeur
❌ Stocker email/phone en clair dans master_contacts — chiffré ou hashé seulement

## Métriques à suivre

```
Volume mensuel par produit
Prix moyen par produit
Taux de conversion preview → achat
Taux de blocage gateExport()
% leads avec consent_partners=true vs total
Délai moyen collecte → vente
Marge brute par produit (revenu - coût acquisition - coût enrichissement)
```

Toutes dans `factory-control-center/api/data-products.route.ts` et `finance-ledger/`.

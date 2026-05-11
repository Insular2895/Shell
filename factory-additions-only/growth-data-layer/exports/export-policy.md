# growth-data-layer/exports/export-policy.md

## Règle d'or

> **Aucune donnée client n'est exportée vers un acheteur externe sans
> passer par le gate `mart_sellable_leads` ET être loggée dans
> `lead_delivery_log`.**

## Gate d'export (5 vérifications obligatoires)

Tout export passe par cette fonction (à coder dans `factory-control-center/api/exports.route.ts`) :

```typescript
async function gateExport(leadId: string, buyer: Buyer, deliveryType: string) {
  // 1. Le lead figure-t-il dans la vue mart_sellable_leads ?
  const sellable = await db.queryOne(
    'SELECT * FROM mart_sellable_leads WHERE lead_id = $1',
    [leadId]
  );
  if (!sellable) {
    throw new ExportBlockedError('not_sellable', { leadId });
  }

  // 2. L'acheteur a-t-il un contrat actif ?
  if (buyer.status !== 'active') {
    throw new ExportBlockedError('buyer_inactive', { buyerId: buyer.buyer_id });
  }

  // 3. L'usage demandé est-il autorisé pour cet acheteur ET ce lead ?
  if (!buyer.allowed_usages.includes(deliveryType) ||
      !sellable.allowed_channels.some(ch => buyer.allowed_usages.includes(ch))) {
    throw new ExportBlockedError('usage_not_allowed', { deliveryType });
  }

  // 4. Si le lead est déjà sous exclusivité, refuser
  const hasExclusivity = await db.queryOne(
    'SELECT lead_has_active_exclusivity($1) as r', [leadId]
  );
  if (hasExclusivity.r) {
    throw new ExportBlockedError('exclusivity_violation', { leadId });
  }

  // 5. Catégories d'acheteur autorisées par le contact ?
  const intersect = sellable.allowed_partner_categories.filter(c =>
    buyer.allowed_categories.includes(c)
  );
  if (intersect.length === 0) {
    throw new ExportBlockedError('category_not_allowed', { leadId });
  }

  return sellable;
}
```

## Conditions de blocage

```
Si sellable_status != 'eligible' → BLOQUÉ
Si opt_out = true (sur contact ou lead) → BLOQUÉ
Si consent_partners = false → BLOQUÉ
Si verification_level = 'unverified' → BLOQUÉ
Si data_freshness_days > 90 → BLOQUÉ
Si retention_expires_at <= now() → BLOQUÉ
Si buyer.status != 'active' → BLOQUÉ
Si buyer manque allowed_usages requis → BLOQUÉ
Si lead a déjà une exclusivité active → BLOQUÉ
Si legal_text_version est null → BLOQUÉ
```

Pour chaque blocage : une ligne dans une table `export_blocks_log` avec la raison,
et un ticket dans `decision_queue` (cf `factory-control-center/`) si le pattern se répète
(ex: 10+ blocks pour un même buyer = problème commercial à résoudre).

## Preview avant achat (acceptable)

Un acheteur peut voir un PREVIEW d'un dataset avant achat — limité à :

```
lead_id (uuid opaque, pas réutilisable hors plateforme)
sector
company_size_range
country
intent_score
need_category
freshness (range, pas la date exacte)
price_tier (ex: "tier_2")
exclusivity_available (true/false)
```

**Pas d'email**, **pas de phone**, **pas de nom**, même partiels. Les hash
ne sortent pas non plus du système.

## Delivery après contrat + paiement

Une fois la transaction validée (Stripe ou facture), le payload livré peut contenir :

```
lead_id
company.name
company.website
company.industry
contact.first_name (optionnel)
contact.last_name (optionnel)
contact.display_name (recommandé : 1 seul champ)
contact.email (déchiffré uniquement à la livraison)
contact.phone (déchiffré uniquement à la livraison)
need
budget_range
timing
source_site_id
allowed_usage (rappel des limitations)
allowed_channels
retention_limit_for_buyer (ex: "doit être supprimé après 12 mois")
```

Avant tout délivery : insertion dans `lead_delivery_log` avec snapshot des
conditions du moment.

## Modèles commerciaux

Implémentés dans `factory-control-center/api/buyers.route.ts` :

| Modèle | Description | Pricing indicatif |
|--------|-------------|---------------------|
| CPL simple | Prix par lead, non exclusif | 5-30 € (B2B basique vérifié) |
| Lead vérifié | Avec besoin clair, budget, timing | 30-150 € |
| Lead premium | Audit demandé + budget + timing | 150-500 € |
| Lead exclusif | Vendu à 1 seul acheteur | 2x à 5x non-exclusif |
| Abonnement | Volume mensuel, niche/secteur | 500-5 000 €/mois |
| API access | Livraison auto vers CRM acheteur | 200-2 000 €/mois |
| Crédits wallet | Acheteur recharge, décompte par lead | Variable |
| Prestation data | Audit, scoring, intelligence marché | Sur devis |

⚠️ **Ces prix sont indicatifs**, à tester commercialement, non garantis.

Implémentation paiement : Stripe Checkout, Stripe Billing, facture manuelle,
ou wallet géré dans `factory-control-center/api/wallet.route.ts`.

## Pipeline complet de delivery

```
Buyer auth (Stripe ou login)
  → Browse mart_sellable_leads (preview only, sans PII)
  → Add to cart (preview reservation, max 24h)
  → Sign contract (PDF généré, signé via DocuSign / signature simple)
  → Pay (Stripe Checkout / facture)
  → Backend : gateExport() pour CHAQUE lead du panier
  → Si OK : decrypt + INSERT lead_delivery_log + emit webhook buyer
  → Si KO : refund prorata + email buyer + ticket interne
  → P&L : update finance-ledger.revenues
```

## Rétention côté buyer

Chaque payload livré inclut un `retention_limit_for_buyer` (ex: 12 mois).
Le contrat acheteur exige la suppression après ce délai. Pour vérification :

- l'acheteur peut être audité sur sa retention via une clause contractuelle
- pour les acheteurs API : on peut envoyer un webhook de "retention expired"
  qui invalide les leads expirés côté CRM acheteur (best-effort, pas garanti)

## Ce qui n'est JAMAIS vendu

- `consent_ledger` (preuves de consentement → confidentielles)
- `lead_delivery_log` (audit interne)
- `master_contacts.email`, `phone` en clair sans contrat valide
- Tout dataset où sellable_status != 'eligible' pour la totalité des leads
- Toute donnée venant d'un site sans bandeau cookie/consent valide
- Toute donnée d'un mineur (< 16 ans en UE)

## Audit & rapport mensuel

Un cron `/api/cron/consent-audit` (à coder dans `automation-packs/n8n/`) génère
chaque mois :

- Leads collectés ce mois
- % avec consent_partners=true
- % sellable_status=eligible
- Volume vendu
- CA généré
- Blocages d'export (raisons aggregées)
- Opt-outs reçus
- Demandes RGPD reçues / traitées

Le rapport est stocké dans `reports/data-products/YYYY-MM-audit.md` et envoyé au DPO/responsable légal.

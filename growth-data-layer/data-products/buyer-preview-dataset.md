# Buyer Preview Dataset

## Avant achat — preview SANS PII

L'acheteur peut consulter cette preview pour décider d'acheter :

```json
{
  "lead_id": "uuid-opaque",
  "sector": "ecommerce",
  "company_size_range": "11-50",
  "country": "FR",
  "intent_score": 78,
  "need_category": "audit-seo",
  "freshness_range": "0-30 days",
  "price_tier": "tier_2",
  "exclusivity_available": true
}
```

## Pas dans la preview

- Email (même partiel)
- Phone (même partiel)
- Nom prénom
- Domaine entreprise précis
- URL source
- Date exacte de collecte

## Limite

Une preview peut être réservée 24h max sans achat (pour éviter qu'un buyer pré-réserve tous les leads et n'achète jamais). Au-delà : retour au pool.

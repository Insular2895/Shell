# Data sharing policy

> Quand on partage des données avec un tiers (acheteur de leads, fournisseur,
> sous-traitant), quelles règles ?

## Règles

### Avec un acheteur de leads
- Contrat signé (cf legal/data-selling-policy.md + buyer-contract-fields.md)
- Filtrage strict via `gateExport()` (cf exports/export-policy.md)
- Logging dans lead_delivery_log
- Notification à l'acheteur si opt-out reçu post-livraison (webhook ou email)

### Avec un fournisseur (Supabase, Stripe, OpenAI, etc.)
- DPA signé en amont
- Données minimales transmises (data minimization)
- Si OpenAI/Anthropic : passage par ai-privacy-gateway (PII redact AVANT)
- Pas de transfert hors UE sans clauses contractuelles types (SCC) ou pays adéquat

### Avec un sous-traitant tiers
- DPA signé
- Liste publique sur le site (page "sous-traitants")
- Audit annuel

### Avec un partenaire commercial
- Mêmes règles qu'acheteur de leads (consent_partners requis)

## Pas de partage si
- consent_partners = false sur le contact
- Le tiers n'a pas signé de DPA
- L'usage déclaré dépasse `allowed_usages` du contact
- Le tiers est hors UE sans clause SCC ni pays adéquat

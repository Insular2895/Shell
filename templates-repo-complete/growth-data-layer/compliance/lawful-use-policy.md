# Lawful use policy

> Quels usages d'un lead sont autorisés selon la base légale invoquée.

## Mapping base légale → usage permis

| Base légale | Usages permis | Usages interdits |
|-------------|---------------|------------------|
| `consent` (général) | Limité aux finalités explicitement consenties | Toute autre finalité |
| `contract` | Tout ce qui est nécessaire à l'exécution du contrat | Marketing tiers, vente |
| `legal_obligation` | Conservation comptable / fiscale | Toute exploitation commerciale |
| `legitimate_interest` | Prospection B2B email simple (sous conditions) | Vente à un tiers, profilage |
| `vital_interest` | Cas urgent vital (rare) | Tout usage commercial |
| `public_interest` | Mission de service public (rare) | Usage privé/commercial |

## Validation par usage

Un export `cold_email` :
- Si `consent_partners=true` → OK
- Si `legitimate_interest B2B email pro` → OK avec mention claire dans le contrat buyer
- Sinon → REFUSÉ

Un export `phone_call` :
- B2C → consent obligatoire + vérification Bloctel
- B2B → soft opt-in OK si numéro pro générique

Un export `lookalike_audience` :
- consent_ads obligatoire
- Hash uniquement (pas d'email brut envoyé à Meta/Google)

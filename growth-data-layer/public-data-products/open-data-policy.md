# Open data policy

> Règles pour l'utilisation de datasets publics dans nos produits.

## Datasets utilisables (avec respect TOS/licence)

| Dataset | Licence | Usage OK | Usage interdit |
|---------|---------|----------|----------------|
| DVF | Etalab Open License 2.0 | Estimations, comparables | Réidentification propriétaire |
| Meta Ads Library | Meta API TOS | Intelligence concurrentielle | Reconstituer audience Meta |
| Shodan | Shodan TOS | Audit propres assets | Exploitation, scan agressif |
| INSEE entreprises | Etalab | Enrichissement company | (rien d'interdit majeur) |
| OpenStreetMap | ODbL | Géocoding, cartes | Nécessite share-alike si dérivé public |
| OpenCorporates | CC-BY-SA | Vérification entreprise | Revente brute interdite |

## Règles transverses

1. **Citation source obligatoire** dans tout rapport produit
2. **Pas de réidentification** de personnes physiques (RGPD)
3. **Respect rate limits** des APIs publiques
4. **Pas de scraping** non autorisé (TOS du site, robots.txt)
5. **Cache local** uniquement le strict nécessaire (pas de copie complète)
6. **Si licence share-alike** (CC-BY-SA, ODbL) : produits dérivés sous même licence ou inutilisables en SaaS fermé

## Tracking

`legal/datasets-provenance-tracker.md` (à créer phase 7) liste tous les datasets
utilisés avec licence + dernière vérif.

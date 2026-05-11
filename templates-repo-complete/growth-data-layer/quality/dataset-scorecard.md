# Dataset scorecard

Pour chaque dataset (mart) vendable, on tient un scorecard mis à jour
mensuellement. Sortie : `reports/data-products/<dataset>-scorecard.md`.

## Critères

| Critère | Score | Notes |
|---------|-------|-------|
| Volume | nombre de lignes | |
| Fraîcheur médiane | médiane de data_freshness_days | < 30 = excellent |
| % vérifiés (email_verified ou +) | % | viser > 80% |
| % avec consent_partners | % | viser 100% pour mart_sellable |
| Taux d'opt-out cumulé | % | viser < 5% |
| Taux de blocage export | % | viser < 10% |
| Plaintes RGPD reçues | count | viser 0 |
| Délai moyen collecte → export | jours | |

## Trigger d'action

- Si fraîcheur médiane > 60j : promotion / réactivation campaigns
- Si % vérifiés < 70% : revoir le pipeline de vérification
- Si taux blocage > 20% : revoir critères collecte
- Si plaintes > 0 : audit immédiat

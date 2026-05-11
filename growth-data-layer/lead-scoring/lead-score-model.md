# Lead Score Model

## Composantes (chaque score 0-100)

### 1. lead_quality_score
Combien la donnée est-elle complète et propre ?
- email vérifié : +30
- phone vérifié : +20
- entreprise identifiée (siren ou domain) : +15
- besoin exprimé : +20
- budget indiqué : +10
- timing indiqué : +5

### 2. intent_score
Combien le contact montre-t-il d'intention d'achat ?
- soumission formulaire audit/contact : +40
- 3+ pages vues : +20
- demande de devis : +30
- pricing page visitée : +10

### 3. buyer_fit_score
À quel point ce lead matche-t-il un buyer profile ?
- secteur cible : +30
- taille entreprise cible : +20
- pays : +15
- stack tech compatible : +20
- budget compatible : +15

## Calcul

dbt model dans `growth-data-layer/lead-scoring/`. Recompute quotidien sur master_leads.

## Seuils

```
intent_score < 30      → cold lead (pas de prospection)
30-60                  → warm
60-80                  → hot
> 80                   → very hot (priorité top)

buyer_fit_score > 70 + lead_quality > 60 + intent > 60
                        → premium lead (pricing 5-10x)
```

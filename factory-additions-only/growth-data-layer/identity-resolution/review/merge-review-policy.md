# Merge review policy

## Workflow

1. Splink détecte un match score 0.70-0.90 → INSERT merge_reviews (status='pending')
2. Admin via cockpit voit la queue
3. Approve → INSERT identity_clusters + UPDATE master_contacts (set identity_cluster_id)
4. Reject → status='rejected', mais on note pour ne pas re-suggérer
5. Defer → status='deferred', re-soumis à la prochaine run avec plus de signaux

## SLA

- Pas de SLA strict, mais > 30 jours en pending → alerte (faut purger ou auditer)

## Risque

Une fusion erronée mélange deux personnes différentes — RGPD breach potentiel.
Donc toujours **review humaine** entre 0.70 et 0.90.

Si jamais on doit "défusionner" : pas trivial. Mieux vaut ne pas fusionner que défusionner.

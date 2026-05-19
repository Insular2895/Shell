# ops-autopilot/

> Détecte incidents et applique fallback/quotas/blocage exports automatiquement.

Cf `README_FACTORY.md` au root pour le contexte global.
Cf `AGENT_RULES.md` pour les règles agents.

## Statut

MVP policy pack. `decision-engine/action-policy.yml` définit les actions
autorisées, les actions avec approbation et les actions interdites sans humain.
L'exécution opérationnelle passe par le Factory Control Center et les workflows
CI jusqu'à l'ajout de detectors dédiés.

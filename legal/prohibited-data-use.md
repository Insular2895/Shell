# Prohibited data use

> Liste exhaustive des choses qu'on NE FAIT JAMAIS.

## Données

❌ Vente de données de mineurs (< 16 ans en UE)
❌ Vente de données sensibles (santé, religion, orientation, biométrie)
❌ Vente de données scrapées sans base légale
❌ Vente de données sans consent_partners
❌ Vente à un buyer dont l'usage déclaré est interdit pour ce lead
❌ Vente sans contrat buyer signé
❌ Cross-selling à un buyer dont le contrat est résilié
❌ Push de PII vers un serveur hors UE sans SCC ou pays adéquat
❌ Stockage d'email/phone en clair dans master_contacts
❌ Réidentification via croisement de datasets publics

## Pratiques

❌ Bypass du gate `mart_sellable_leads`
❌ Modification de `consent_ledger` (append-only DB-level)
❌ Modification de `lead_delivery_log` (append-only DB-level)
❌ Désactivation des CI/CD security checks "temporairement"
❌ Push direct sur `main`
❌ Force-push sur des branches partagées
❌ Acceptation d'un PR avec gitleaks HIGH non documenté
❌ Soumission d'inputs PII en clair à un LLM externe
❌ Logging d'email/phone en clair dans Sentry/OpenObserve
❌ Test de restore qui n'est pas exécuté annuellement

## Si tu es tenté

Stop. Ouvre une décision dans `decision_queue`. Discute avant d'agir.
Aucun gain commercial ne justifie l'exposition légale ou réputationnelle.

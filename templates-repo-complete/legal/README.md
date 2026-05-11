# legal/

Doctrine légale de la factory. Lis tout dans l'ordre :

1. `cleanroom-policy.md` — règle anti-copie (concurrents, repos, contenu)
2. `data-selling-policy.md` — règle data vendable (consent, base légale, breach)
3. `license-policy.md` — licences acceptables vs interdites
4. `attribution-policy.md` — comment créditer le code/assets utilisés
5. `third-party-code-policy.md` — règles pour intégrer du code externe
6. `consent-and-partner-sharing-policy.md` — détails partage avec acheteurs
7. `prohibited-data-use.md` — liste exhaustive des usages interdits

Ces documents sont **opposables** en interne : un PR qui les viole est rejeté
automatiquement par CI ou bloqué par approval-policy.

En cas d'évolution réglementaire (nouvelles directives CNIL, jurisprudence) :
mettre à jour le doc, bumper la version sémantique, et ajouter une entrée ADR.

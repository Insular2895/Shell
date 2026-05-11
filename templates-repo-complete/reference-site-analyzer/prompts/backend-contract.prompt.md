# Prompt : backend contract inference

Étant donné les comportements observés (réseau onglet network DevTools, latence
des actions, présence de polling, etc.), infère :

1. Les endpoints probables (méthode, path abstrait)
2. Le pattern : sync (CRUD < 1s), long-job (> 5s avec polling), real-time (websocket)
3. Le pack backend factory recommandé (cf `backend-packs/`)

⚠️ Tu n'as accès qu'aux comportements PUBLICS visibles. Pas de tentative de
reverse-engineering du backend privé.

Sortie : `backend-contract.json` qui suit `schemas/backend-contract.schema.json`.

# spec-driven-execution

> Avant de modifier du code, écrire la spec. Avant de commit, vérifier que la spec est respectée.

## Quand utiliser
Toute tâche qui modifie ou crée du code non-trivial (>20 lignes ou >1 fichier).

## Procédure

1. **Lis le brief**, puis écris en 5-10 lignes :
   - Objectif
   - Contraintes
   - Critères d'acceptation (testables)
2. **Liste les fichiers à toucher** AVANT d'éditer.
3. **Vérifie l'approval-policy** : est-ce auto / review_after / ask_before ?
4. **Si ask_before** : ouvre une question, ne code pas.
5. **Sinon** : code par étapes, 1 fichier à la fois, test après chaque étape.
6. **Avant le commit** : relis la spec → tous les critères sont-ils OK ?

## Anti-pattern

❌ Code d'abord, doc ensuite (ou jamais)
❌ Toucher 12 fichiers d'un coup
❌ Skip les tests "parce que c'est simple"

## Sortie attendue

Une PR avec :
- Description = la spec écrite à l'étape 1
- Liste des fichiers
- Tests
- Mention "approval-policy: auto / review_after / ask_before"

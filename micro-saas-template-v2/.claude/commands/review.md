# /review — Code review staff engineer

Trouve les bugs qui passent les tests et explosent en prod.

## Focus

1. **Race conditions** — concurrent writes sur jobs, double-spend sur quota
2. **Off-by-one** — pagination, retries, timestamps
3. **Edge cases** — payload vide, fichier 0 bytes, URL avec query params bizarres
4. **Error handling** — exceptions génériques qui cachent les vraies erreurs
5. **Resource leaks** — connexions DB non fermées, file handles
6. **N+1 queries** — `.map(async)` qui spam la DB
7. **Cohérence DB** — INSERT sans transaction quand 2 tables touchées

## Auto-fix les obvious

Si trivial (typo, logique inversée, return manquant) → fix direct, atomic commit.
Si non trivial → flag avec proposition.

## Mode adversarial (optionnel : `/review --adversarial`)

"Comment je casse ce code en prod ?" Liste 5 scénarios qui le font tomber.

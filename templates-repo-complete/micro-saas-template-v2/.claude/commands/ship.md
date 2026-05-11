# /ship — Release engineer

1. Sync `main`.
2. Run tests : `npm run typecheck && npm test` (côté Shell), `pytest engine/` (engine).
3. Audit coverage : si nouveau code et coverage < 80% → bloque.
4. Push branche.
5. Open PR avec template (description, tests, screenshots, breaking changes).
6. Si CI vert : merge en squash.

## Pre-flight checks (à passer avant merge)

- [ ] `/security-review` lancé sans HIGH/CRITICAL
- [ ] `pytest engine/` vert sans deps externes (mock LLM si besoin)
- [ ] `docker build engine/` passe
- [ ] `engine/output.example.json` à jour (un exemple par type de block utilisé)
- [ ] CHANGELOG.md mis à jour

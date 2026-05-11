# docs/

Doctrine globale de la factory, séparée des READMEs opérationnels (qui sont
dans chaque dossier de brique).

```
docs/
├── factory/        vision, definition-of-done, app-feature-generation
├── architecture/   patterns scalability, queues, DB, multi-app
├── security/       security-doctrine.md (pointe sur security-packs/policies/)
├── design/         DESIGN.md, components-rules.md, no-ai-slop.md
├── ops/            production-ai-patterns.md, incidents, backup
└── decisions/      ADRs (Architecture Decision Records)
```

Lis dans cet ordre :
1. `factory/00-overview.md`
2. `factory/definition-of-done.md`
3. `architecture/scalability-principles.md`
4. `design/DESIGN.md`

Les ADRs (`decisions/ADR-XXXX-*.md`) tracent les choix structurants. Aucun
choix structurant ne devrait exister sans ADR.

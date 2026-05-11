# repo-factory-shell

> CLI central de la factory.

## Status

**Skeleton** — la structure est en place, les commandes sont des stubs qui
documentent l'intention. Implémentation par phases.

## Setup

```bash
cd repo-factory-shell
npm install
npm run build
npm link  # pour utiliser `factory` globalement
```

## Commandes (extrait)

```bash
factory repo:clone owner/repo
factory repo:audit ./repo
factory repo:normalize ./repo
factory repo:connect ./app
factory repo:scan ./app

factory site:analyze https://example.com
factory feature:from-url https://example.com
factory feature:from-screenshot ./screen.png
factory product:create document-extractor
factory product:port ./features/document-extraction ./micro-saas-template-v2

factory security:scan ./app
factory privacy:redact ./sample.json

factory dev:triage
factory dev:queue
factory dev:run-next
```

## Architecture

```
src/
├── cli.ts                  # entry point (commander)
├── commands/               # 1 file per command (stubs)
├── github/                 # GitHub CLI wrappers (à coder)
├── scanners/               # wrappers vers tools/scanners/* (à coder)
├── code-intelligence/      # tree-sitter, route detection (à coder)
└── reports/                # report writers (à coder)
```

## Outils intégrés (à brancher phase 1)

- GitHub CLI (`gh`)
- Repomix (export du repo en context unique)
- Tree-sitter (parsing AST)
- Graphify / Grapiphy
- Semgrep, Gitleaks, OSV-Scanner, Trivy, Scorecard, CodeQL

## Test du skeleton

```bash
npm run dev -- repo:audit ./
# Affiche : "[stub] repoAuditCmd called with [...]"
# C'est OK — l'implémentation arrive en phase 1.
```

## Roadmap

- [ ] Phase 1 : `repo:audit`, `repo:scan`, `security:scan`, `privacy:redact`
- [ ] Phase 2 : `site:analyze`, `feature:generate`, `feature:from-url`
- [ ] Phase 3 : `product:create`, `product:port`
- [ ] Phase 3 : `dev:triage`, `dev:queue`, `dev:run-next`

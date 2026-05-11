# modules-registry/

> Bibliothèque de **modules réutilisables** versionnés. Chaque module est
> autonome et peut être consommé par un template SaaS.

## Catalogue (scaffold)

```
auth/             login, signup, password-reset, OAuth
billing/          Stripe checkout, customer portal, plans
upload/           dropzone, signed URLs, multipart, antivirus
document-extraction/   extract → blocks (table, text, file)
dashboard/        layout + widgets standards
admin-panel/      CRUD admin générique
onboarding/       wizard multi-step
project-settings/ settings UI + storage
api-keys/         génération + rotation + scopes
user-management/  liste users + actions admin
logs/             affichage logs structurés
notifications/    in-app + email
analytics/        tracking propre + dashboards
lead-capture/     formulaires + consent + storage
consent-manager/  banner + ledger
pnl-dashboard/    visualisation revenu/coût/marge
status-service/   site_status + feature flags
feature-flags/    toggles + targeting
```

## Anatomie d'un module

```
<module>/
├── module.yaml             # version, deps, compat
├── MODULE_VERSION.md       # ce que cette version apporte
├── CHANGELOG.md
├── compatibility.md        # avec quels templates / versions
├── migration-notes.md      # comment passer de N à N+1
│
├── spec/
│   ├── business-spec.md
│   ├── technical-spec.md
│   └── security-rules.md
│
├── frontend/
│   ├── components/         # JSX/TSX
│   └── states.md           # tous les états UI
│
├── backend/
│   ├── endpoints.md
│   ├── schemas.ts
│   └── migrations/
│
├── workers/
│   └── jobs.md
│
└── tests/
    └── test-plan.md
```

## Versionnage

Semver strict : `MAJOR.MINOR.PATCH`.
- Major : breaking change → nécessite migration template
- Minor : ajout de feature → backward compatible
- Patch : fix bug

## MVP (à faire phase 2)

Modules prioritaires pour la factory :
1. `upload@1.0.0` (dropzone + signed URLs)
2. `consent-manager@1.0.0` (banner + ledger ↔ growth-data-layer)
3. `lead-capture@1.0.0` (formulaires + consent + sellable check)
4. `document-extraction@1.0.0` (engine pattern)
5. `pnl-dashboard@1.0.0` (cockpit widgets)

Les autres viennent au fil des besoins.

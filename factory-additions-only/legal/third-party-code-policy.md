# Third-party code policy

## Avant d'ajouter une dépendance

Checklist :

- [ ] Licence vérifiée (cf `license-policy.md`, liste blanche)
- [ ] Repo actif (commits dans les 6 derniers mois)
- [ ] Mainteners identifiés (pas anonyme)
- [ ] Star count > 100 (heuristique, pas absolu)
- [ ] Dernière version stable (pas alpha/beta sauf justification)
- [ ] Pas de CVE ouvert HIGH/CRITICAL (vérifier OSV)
- [ ] Bundle size raisonnable (si frontend)
- [ ] Alternatives évaluées (justifier le choix vs déjà installé)

## Dependency tree

- Audit annuel : `npm audit`, `pip-audit`
- Renovate auto-merge patch (cf `ops-packs/maintenance/renovate/`)
- Major bump = ADR + tests E2E

## Si on FORK

Si on doit forker une dep (bug critique pas patché upstream) :
1. Documenter dans `legal/forks-tracker.md`
2. Pousser le PR upstream en parallèle
3. Sunset date pour migrer back vers upstream

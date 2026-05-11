# Dependency policy

## Règles

1. **Pin exact** pour les libs critiques (Stripe, Supabase, Next, React)
2. **Patch automerge** pour le reste sauf libs critiques
3. **Major bump** : review humaine + ADR si breaking
4. **Pas d'install ad-hoc** : toute nouvelle dep passe par PR avec :
   - Justification (pourquoi pas une alternative déjà installée ?)
   - Vérification licence (cf legal/license-policy.md)
   - Vérification activité (commits récents, mainteners, GitHub stars > 100)
   - npm/pip audit OK

## Liste blanche licences (auto)

MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, Unlicense

## Exceptions à documenter dans `legal/license-exceptions.md`

Toute dep avec autre licence (LGPL, MPL, etc.) nécessite ADR.

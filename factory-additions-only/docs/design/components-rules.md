# Components rules

## Règles

1. **Un composant par fichier** (sauf très petits helpers internes)
2. **Props typées strictement** (pas de `any`, pas de `Record<string, any>`)
3. **States obligatoires** : loading, error, empty, success (cf DESIGN.md)
4. **Pas de fetch inline** : data via props (server) ou hook custom
5. **Accessibilité** : tabIndex, aria-label, focus visible
6. **Tests** : 1 test par état UI minimum

## Anti-patterns

- ❌ `any` dans props
- ❌ Fetch dans le render
- ❌ Inline styles (tout via Tailwind)
- ❌ Composant > 200 lignes (split)

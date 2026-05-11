# Cleanroom Rules (référence opérationnelle)

> Source de vérité légale : `/legal/cleanroom-policy.md` (root).
> Ce fichier est l'opérationalisation pour les agents qui passent par
> `reference-site-analyzer/`.

## Pipeline obligatoire

```
URL / screenshot
   ↓
[capture/]   Playwright neutre (pas de cookies, pas d'auth)
   ↓
[extraction/]   DOM → fonctions visibles (boutons, formulaires, états)
   ↓
[cleanroom/inspiration-to-abstraction.ts]
   ↓
abstraction métier (PAS le visuel précis)
   ↓
[feature-generation/]   reconstruction depuis NOTRE design system
   ↓
[cleanroom/competitor-risk-check.ts]   anti-copie scan
   ↓
PR avec preuve cleanroom annexée
```

## Ce que l'extraction CAPTURE

- Le **flow utilisateur** (étapes, ordre)
- Les **types d'éléments** (dropzone, formulaire, bouton CTA, table, etc.)
- Les **états visibles** (idle, loading, error, success)
- Les **catégories de copy** ("CTA", "headline", "sub-headline") sans le texte exact

## Ce que l'extraction NE CAPTURE PAS

- Pas de capture **pixel-perfect**
- Pas de **screenshots** dans nos assets
- Pas de **textes verbatim** longs (>15 mots du concurrent)
- Pas de **noms de classes CSS** spécifiques au concurrent
- Pas de **noms de produit / brand**
- Pas de **fichiers binaires** copiés

## Output type

```typescript
type CleanroomFeatureSpec = {
  // Métier abstrait
  business_objective: string;          // "extraire du texte d'un PDF"
  user_flow_steps: string[];           // ["upload PDF", "wait", "see result"]

  // Fonctions UI (abstraites, pas le concurrent)
  ui_components: ComponentType[];      // ['dropzone', 'progress_bar', 'result_table']
  ui_states: UiState[];                // ['idle', 'loading', 'error', 'success']

  // Backend implicite
  backend_capability: string;          // "long-running document processing"
  estimated_runtime: 'short' | 'medium' | 'long';

  // Audit cleanroom
  cleanroom: {
    source_url: string;
    captured_at: string;
    abstraction_validated_by?: string;  // qui a validé que c'est bien abstrait
    risk_check_passed: boolean;
  };
};
```

## En cas de doute

Si l'agent hésite "est-ce que c'est inspiration ou copie" :
- Stop, ouvrir un ticket dans `decision_queue`
- Ne pas pousser
- Mieux vaut perdre 2j à valider qu'avoir un cease-and-desist

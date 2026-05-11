# Cookie banner spec

Composant : `modules-registry/consent-manager/`.

## Comportement requis

| Étape | Comportement |
|-------|-------------|
| Premier visit | Affiche banner. Aucun cookie analytics/ads avant choix. |
| Choix "essentials only" | Pas d'INSERT dans consent_ledger autre que essentials. |
| Choix "accept all" | INSERT consent_ledger 5 lignes (1 par finalité), status='granted'. |
| Choix "customize" | Modal granular, INSERT par toggle. |
| Re-visit, banner non vu | Lit cookie `consent_v_<version>`. Pas de re-affichage. |
| Re-visit, version changée | Affiche banner avec mention "nos pratiques ont évolué". |
| Footer link "Cookie settings" | Réouvre le modal customize, possible de revoke. |

## Test E2E

`__tests__/e2e/consent-banner.test.ts` :
- New visitor → banner affiché
- Click "essentials" → cookie set, pas de tracking analytics
- Click "accept all" → 5 inserts dans consent_ledger
- Revoke ads → INSERT status='revoked' pour 'ads'

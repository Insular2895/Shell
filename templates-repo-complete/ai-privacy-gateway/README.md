# ai-privacy-gateway/

> **Interception entre l'app et tout LLM externe** : aucune PII brute ne quitte notre infra.

## Pourquoi

```
Sans gateway :
  app → prompt avec "Jean Dupont, CEO chez Acme Corp" → OpenAI

Avec gateway :
  app → ai-privacy-gateway → "<PERSON_1>, CEO chez <COMPANY_1>" → OpenAI
                              ↓
                          mapping local chiffré
                          (PERSON_1=Jean Dupont, COMPANY_1=Acme Corp)
                              ↓
  réponse OpenAI : "Bonjour <PERSON_1>..."
                              ↓
  ai-privacy-gateway de-anonymize : "Bonjour Jean Dupont..."
```

## Outils

- **Microsoft Presidio** (détection PII + recognizers)
  - Recognizers FR custom : phone, SIREN, SIRET, VAT, IBAN
  - Cf `presidio/recognizers/` pour les définitions YAML

## Modes

| Mode | Réversible | Usage |
|------|-----------|-------|
| `redact` | Non | Logs, analytics, prompts IA non perso |
| `pseudonymize` | Oui (mapping local) | CRM, emails perso générés par IA |
| `hash` | Non | Matching cross-system |

## Lis dans cet ordre

1. `policies/ai-data-policy.yml` — règles par champ
2. `presidio/recognizers/` — recognizers custom
3. `src/detect-pii.ts` (à coder phase 1)
4. `src/redact.ts` (à coder phase 1)
5. `src/anonymize.ts` (à coder phase 2)
6. `tests/` — tests unitaires (couverture des cas frontaliers)

## Test obligatoire

`tests/prompt-leak.test.ts` : envoie un input "Jean Dupont, jean@dupont.fr,
0612345678" → vérifie qu'aucun de ces tokens n'apparaît dans l'appel OpenAI
mocké.

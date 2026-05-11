# Presidio redaction (intégration ai-privacy-gateway)

Voir `ai-privacy-gateway/README.md` pour le détail.

Côté growth-data-layer, on utilise Presidio à 3 endroits :

## 1. Pre-LLM (toute analyse IA)
- Avant tout call OpenAI/Anthropic, le prompt passe par `ai-privacy-gateway/redact()`
- Ex: enrichissement lead par GPT, scoring intent, génération message perso

## 2. Logs
- Avant log INFO/WARN/ERROR, redact() sur les valeurs

## 3. Reports/exports internes
- Avant générer un rapport CSV interne (pas vente), redact si distribution interne large

## Recognizers FR custom

- `presidio/recognizers/french_phone.yml`
- `presidio/recognizers/french_siret.yml`
- `presidio/recognizers/french_siren.yml`
- `presidio/recognizers/iban.yml`
- `presidio/recognizers/email.yml`
- `presidio/recognizers/vat_number.yml`
- `presidio/recognizers/company_names.yml`

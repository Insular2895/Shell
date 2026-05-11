# Prompt : security rules generation

À partir d'un feature-blueprint, génère les security-rules.json.

Checklist obligatoire :
- [ ] auth required (sauf endpoint public motivé)
- [ ] RLS si table user-scoped
- [ ] input validation client (Zod) ET serveur (Ajv/Pydantic)
- [ ] rate limit par user (10/min default, ajuster selon coût)
- [ ] upload : MIME server-side, taille, antivirus si > 10MB
- [ ] PII redact dans logs si données users
- [ ] PII redact AVANT LLM si LLM utilisé
- [ ] consent vérifié si feature = lead-capture / data-export
- [ ] env vars listées (juste les noms, pas les valeurs)

Si la feature touche data export → security_rules DOIT contenir une référence à
`growth-data-layer/exports/export-policy.md`.

Sortie : conforme à `schemas/security-rules.schema.json`.

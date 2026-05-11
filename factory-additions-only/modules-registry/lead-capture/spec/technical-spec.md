# lead-capture — Technical spec

## Frontend
- Components : LeadForm, FieldGroup, ConsentCheckbox, SubmitButton
- États : idle, validating, submitting, completed, failed
- Validation côté client (Zod) + retry serveur

## Backend
- POST /api/leads/submit → validation + insert + trigger
- Validation : Ajv côté Shell + Pydantic côté worker

## Storage
- Inserts dans master_contacts (cf growth-data-layer/storage/master-schema.sql)
- Insert master_leads avec sellable_status calculé
- Insert consent_ledger (1 ligne par type accepté)

## Calcul initial sellable_status
- Si consent_partners=true ET email_verified pending → 'unverified' (envoie email verif)
- Sinon → 'internal_only'
- Cron quotidien re-calcule selon vérifications + opt-out


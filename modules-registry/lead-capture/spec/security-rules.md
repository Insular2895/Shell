# lead-capture — Security rules

- Validation stricte (cf RUN_SCHEMA root)
- Honeypot field caché anti-bot
- Rate limit : 3 submissions / IP / 10 min
- Pas de pre-fill de consent_partners
- Champs minimum : email seul. Tout autre champ optionnel sauf justification métier (data minimization)
- Confirmation email avant marquer email_verified (double opt-in)
- IP hashée + UA hashé dans consent_ledger
- Référer logué pour anti-fraud (sites tiers qui submettent sans consent)


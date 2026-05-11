# Prompt : worker contract generation

À partir d'un feature-blueprint avec `background_job`, génère le worker-contract.

Pattern obligatoire (référence v2) :
- trigger : `job_queue` (Postgres SKIP LOCKED) ou `cron`
- lease_seconds : 900 par défaut (15 min)
- max_attempts : 3 par défaut
- retry_strategy : exponential_backoff
- timeout_seconds : adapté à la tâche

Si la tâche peut leak des secrets (calls externes, manipulation de données users) :
- redact obligatoire dans logs (cf ai-privacy-gateway)
- pas de stdout autre que progress

Sortie : conforme à `schemas/worker-contract.schema.json`.

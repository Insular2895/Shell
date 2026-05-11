# Production AI patterns

> Comment utiliser des LLMs en prod sans se ruiner ni leak de PII.

## Règles

1. **Toujours via ai-privacy-gateway** (PII redact AVANT)
2. **Coût loggé** dans usage_events
3. **Budget par site** (`monthly_budget_eur` dans ops/services/<site>.yml)
4. **Auto-degrade vers modèle moins cher** si > 85% budget
5. **Idempotence** : Idempotency-Key sur tout call (anti retries → multi-billing)
6. **Caching** : pour les prompts répétitifs avec mêmes inputs (déterministe)

## Modèles par tier

- Default : Claude Sonnet OU Mistral Small
- Cheap fallback : Mistral Tiny / Haiku (< 0.10€/M tokens)
- Reserved high-quality : Claude Opus, GPT-4 (uniquement si budget > 50€/mois sur le site)

## Anti-pattern

❌ "Toujours le meilleur modèle" → bill shock
❌ Prompt user direct dans le LLM sans redact → PII leak
❌ Pas de timeout → request infinie possible
❌ Pas de logs coût → impossible à mesurer

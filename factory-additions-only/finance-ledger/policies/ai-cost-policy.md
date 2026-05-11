# finance-ledger/policies/ai-cost-policy.md

## Principe

Toute consommation IA (OpenAI, Anthropic, Mistral, etc.) DOIT être :

1. **Loggée** par appel : `usage_events` avec `event_type='ai_call'` + `cost_estimate_eur`
2. **Attribuée** à un `site_id`
3. **Plafonnée** par site (`site.monthly_budget_eur`)

Sans gateway / log, on ne peut ni mesurer ni facturer.

## Implémentation

Tout appel LLM passe par un wrapper centralisé :

```typescript
// pseudo-code
async function callLLM({ site_id, model, prompt, ...opts }) {
  const cost_estimate = estimateCost(model, prompt.length);

  // Check budget restant
  const used_this_month = await getUsageThisMonth(site_id);
  const budget = await getSiteBudget(site_id);
  if (used_this_month + cost_estimate > budget) {
    throw new BudgetExceededError(site_id, used_this_month, budget);
  }

  // Anonymise via ai-privacy-gateway
  const safePrompt = await aiPrivacyGateway.redact(prompt);

  // Appel
  const result = await provider.complete(safePrompt, model, opts);

  // Log
  await db.usage_events.insert({
    site_id,
    event_type: 'ai_call',
    cost_estimate_eur: actualCost(result),
    metadata: { model, tokens_in: result.tokens_in, tokens_out: result.tokens_out }
  });

  return result;
}
```

## Alertes

- 60% budget mensuel → notif owner
- 75% → notif + log incident P3
- 85% → degraded mode (`ops-autopilot/actions/reduce-ai-model.ts`) bascule vers modèle moins cher
- 95% → désactivation des features IA non-critiques
- 100% → arrêt total des appels IA jusqu'à reset (1er du mois)

## Choix de modèle par défaut

Document `finance-ledger/policies/ai-model-selection.md` (à créer phase 2)
listera les modèles autorisés par site et le fallback "cheap mode".

Recommandation MVP :
- Default : Claude Sonnet ou Mistral Small
- Cheap fallback : Mistral Tiny / Haiku
- Reserved (haute qualité) : Claude Opus, GPT-4

# Workflow : feature-analysis-trigger

## Trigger
- HTTP webhook depuis cockpit (admin clique "analyze a competitor URL")

## Steps

1. **Receive URL + name**
2. **Trigger `factory site:analyze <url> --name <name>`** via SSH/API
3. **Wait for completion** (poll output)
4. **If success** :
   - Notify admin que le report est dispo dans `reports/site-analysis/<name>/`
5. **If cleanroom violation flagged** :
   - Alerte HIGH
   - Bloque pour review humaine

## Cost
- ~5min runtime (Playwright + Firecrawl + LLM analysis)
- Budget LLM via ai-privacy-gateway : ~0.50€ par analyse

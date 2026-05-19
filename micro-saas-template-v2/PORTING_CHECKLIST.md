# PORTING_CHECKLIST.md — Porter un repo GitHub vers le template

Cette checklist transforme un repo métier brut en moteur compatible avec le Shell.
Suis-la dans l'ordre. Ne saute aucune étape.

---

## Phase 1 — Stabiliser le repo source

Avant tout portage, le repo doit être propre **en local**.

- [ ] `git clone` réussi
- [ ] Installation propre (`pip install -r requirements.txt` ou `npm install`)
- [ ] Au moins un exemple d'utilisation fonctionne sans crash
- [ ] Pas de chemins en dur (`/Users/toto/...`) dans le code
- [ ] Pas de secrets dans le code (clés API, tokens) — déplace vers env vars
- [ ] Les dépendances sont déclarées proprement (`requirements.txt` ou `package.json`)
- [ ] Le code principal est identifiable (pas 50 scripts dispersés)

**Si le repo n'est pas stable, stabilise-le d'abord. Ne porte rien sur du sable.**

---

## Phase 2 — Identifier le cœur métier

Réponds à ces questions par écrit avant de coder :

| Question | Réponse |
|---|---|
| Quel est l'input utilisateur ? | ex: URL de playlist + niveau de résumé |
| Quel est le traitement principal ? | ex: download transcripts → LLM summarize |
| Quel est l'output final ? | ex: résumé global + table par vidéo + markdown |
| Mode du moteur ? | `job` (one-shot) ou `service` (continu) |
| Le moteur a-t-il besoin d'un LLM ? | oui/non → `requires_llm` dans manifest |
| Storage de fichiers généré ? | oui/non → `needs_storage` |
| Vector DB ? | oui/non → `needs_qdrant` |

---

## Phase 3 — Écrire `engine/adapter.py`

L'adapter **importe** le code du repo. Il ne le **réécrit pas**.

```python
# engine/adapter.py
from original_repo.main_module import process_something

def run(payload: dict) -> dict:
    user_input = payload["input"]

    try:
        # Validation minimale (run.schema.json valide déjà côté front)
        if "playlist_url" not in user_input:
            return {"status": "error", "error": "Missing playlist_url", "blocks": []}

        # Appel du code métier existant
        result = process_something(
            url=user_input["playlist_url"],
            depth=user_input.get("summary_depth", "rapide"),
        )

        # Mise en blocks
        return {
            "status": "success",
            "blocks": [
                {"type": "text", "title": "Synthèse globale",
                 "content": result["summary"]},
                {"type": "table", "title": "Résumé par vidéo",
                 "columns": ["Vidéo", "Durée", "Idées clés"],
                 "rows": result["video_rows"]},
                {"type": "file", "title": "Export Markdown",
                 "url": result["markdown_url"]},
            ],
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "blocks": []}
```

- [ ] L'adapter importe le code du repo, ne le copie pas
- [ ] La fonction `run(payload)` existe et retourne le contrat
- [ ] Tous les retours respectent `{status, blocks}`
- [ ] Les erreurs sont catch et retournées en `status: "error"`

---

## Phase 4 — Mettre à jour `config/run.schema.json`

Le schema décrit les inputs. Le frontend en génère le formulaire automatiquement.

Champs supportés : `text`, `textarea`, `url`, `email`, `number`, `select`, `multiselect`, `file`, `boolean`.

- [ ] Toutes les clés du schema correspondent à ce que `adapter.py` lit dans `payload["input"]`
- [ ] Les `required: true` sont cohérents avec les validations dans l'adapter
- [ ] Les `select` ont des `options` non-vides
- [ ] Les `file` ont un `accept` (ex: `application/pdf`, `image/*`)

---

## Phase 5 — Mettre à jour `config/product.config.ts`

- [ ] `id` unique (kebab-case)
- [ ] `name` court et mémorisable
- [ ] `domain` réservé (ou en cours de réservation)
- [ ] `theme.primaryColor` choisi
- [ ] `landing.heroTitle` clair (1 phrase)
- [ ] `landing.heroSubtitle` (sous-titre value-prop)
- [ ] `landing.features` (3 à 5 bénéfices)
- [ ] `pricing.starterPriceId` créé dans Stripe
- [ ] `pricing.proPriceId` créé dans Stripe (si plan Pro)
- [ ] `pricing.freeRuns` choisi (typiquement 1 ou 3)

---

## Phase 6 — Mettre à jour `engine/manifest.yaml`

- [ ] `id` correspond à `product.config.ts.id`
- [ ] `mode` correct (`job` ou `service`)
- [ ] `runtime.image` pointe vers GHCR (sera créé au push)
- [ ] `resources` déclare uniquement le nécessaire (chaque flag à `true` coûte de l'infra)
- [ ] `limits.max_runtime_seconds` cohérent avec le traitement réel
- [ ] `limits.max_input_mb` cohérent avec les fichiers attendus

---

## Phase 7 — Dockeriser

- [ ] `engine/Dockerfile` build sans erreur : `docker build -t test-engine engine/`
- [ ] `engine/requirements.txt` complet
- [ ] Test local : `docker run -v $(pwd)/engine:/data test-engine python run_engine.py --input /data/input.example.json --output /tmp/out.json`
- [ ] La sortie respecte le contrat `{status, blocks}`

---

## Phase 8 — Tests fixtures

- [ ] `engine/input.example.json` représente un input réaliste
- [ ] `engine/output.example.json` représente la sortie attendue (un de chaque type de block utilisé)
- [ ] Le couple input/output passe en local

---

## Phase 9 — Push & déploiement

- [ ] Image Docker push sur GHCR : `docker push ghcr.io/<user>/<product>-engine:latest`
- [ ] Front déployé sur Vercel
- [ ] Variables d'env Stripe + Supabase configurées sur Vercel
- [ ] Un test end-to-end depuis l'UI passe (création de compte → run → résultat)

---

## Phase 8 (v2) — Hardening avant la release

À faire AVANT le premier déploiement public, pas après.

### Sécurité

- [ ] `engine/run_schema_models.py` réécrit avec un modèle Pydantic strict matchant `config/run.schema.json`. `extra='forbid'` partout.
- [ ] Si l'engine fait des requêtes HTTP user-provided : ajouter un validateur `field_validator` qui restreint les hosts autorisés (anti-SSRF). Voir l'exemple `youtube_only` dans le template.
- [ ] Lancer `/security-review` (cf `.claude/commands/security-review.md`) — corriger tous les findings HIGH/CRITICAL.
- [ ] Lancer `/cso` pour audit OWASP Top 10 + STRIDE complet.
- [ ] Vérifier `npm audit --audit-level=high` — 0 vulnérabilité.
- [ ] Vérifier `pip-audit -r engine/requirements.txt` — 0 CVE.
- [ ] Lancer les hooks Claude Code : `.claude/hooks/scan-secrets.sh` et `block-destructive.sh` doivent être executable et testés.

### Tests

- [ ] `npm run test` passe (vitest)
- [ ] `npm run typecheck` passe
- [ ] `npm run build` passe
- [ ] `pytest engine/` passe (si tu as ajouté des tests métier)
- [ ] Test manuel IDOR : login user A, essayer d'accéder à un job de user B via `/api/jobs/<id>` → doit retourner 404
- [ ] Test manuel rate limit : 11 jobs en moins d'1 min → le 11e doit retourner 429

### Auto-degrade et coûts

- [ ] `CRON_SECRET` configuré côté Vercel (cf `.env.example`)
- [ ] `WORKER_API_TOKEN` identique côté Vercel et côté Fly
- [ ] Sans client payant : `WORKER_PROVIDER=none` et `site_config.engine_mode='mock'`
- [ ] Premier client payant : `WORKER_PROVIDER=fly`, `FLY_APP_NAME` et `FLY_API_TOKEN` configurés côté Vercel
- [ ] Vérifier sur Vercel Dashboard que les 2 crons sont actifs (`/api/cron/sweep-jobs` toutes les 5 min, `/api/cron/auto-degrade` toutes les heures)
- [ ] Ne désactive `AUTO_DEGRADE_ENABLED=0` que si tu pilotes manuellement le worker
- [ ] Worker Fly : vérifier `EXIT_WHEN_IDLE_SECONDS` et `restart=on-failure` dans `fly.toml`
- [ ] Test fallback : passer une subscription Stripe en `past_due`/`cancelled` → `site_config.engine_mode='mock'`

### Monitoring

- [ ] Setup UptimeRobot ou BetterStack sur `/api/health` (alertes email/Slack)
- [ ] Vérifier les Vercel logs : pas de PII/secrets loggés
- [ ] Vérifier les Fly logs (`fly logs`) : worker poll toutes les 5s, traite les jobs, puis sort proprement en idle

### Documentation produit

- [ ] `config/product.config.ts` à jour (legal.contactEmail = un email lu)
- [ ] `engine/manifest.yaml` à jour (mode, env required)
- [ ] `engine/output.example.json` à jour avec un exemple par type de block utilisé (sert au mode mock)
- [ ] `SECURITY.md` à jour si tu as ajouté des protections produit-spécifiques

---

## Anti-patterns à éviter

| ❌ Mauvais | ✅ Bon |
|---|---|
| Copier-coller le code du repo dans `adapter.py` | Importer depuis le code du repo |
| Inventer un nouveau type de block (`type: "video"`) | Utiliser `file` avec `mime: "video/mp4"` |
| Modifier `lib/jobs.ts` pour ajouter un champ custom | Mettre la donnée dans un block `json` |
| Ajouter une route `/app/api/youtube/...` | Tout passer par `/app/api/jobs/create` |
| Hardcoder une clé OpenAI dans `adapter.py` | Lire `os.environ["OPENAI_API_KEY"]` |
| Modifier les migrations SQL | Stocker dans `jobs.metadata` (champ JSONB déjà prévu) |

---

## Quand tu as fini

Réponds OUI à ces 4 questions :

1. Le Shell est-il intact ? (aucun fichier hors de la liste autorisée modifié)
2. L'output respecte-t-il toujours `{status, blocks}` ?
3. Le Dockerfile build-il ?
4. Un run end-to-end depuis l'UI marche-t-il ?

Si oui aux 4 → tu peux merger. Sinon, retour case 1.

# DEPLOYMENT.md — Déploiement v2

Ce document explique comment passer du repo au site en ligne avec billing et
moteur fonctionnels. Trois niveaux de déploiement selon ton stade.

## Doctrine coûts

La règle Shell est simple :

- **Aucun client payant actif** → `site_config.engine_mode='mock'`, pas de
  worker requis, résultat de démo via `engine/output.example.json`.
- **Au moins un abonnement Stripe `active` ou `trialing` non-free** →
  `site_config.engine_mode='live'`, les jobs partent en queue et le worker Fly
  est démarré si `WORKER_PROVIDER=fly`.
- **Client annulé, impayé, past_due, unpaid ou paused** → retour en `mock` au
  prochain webhook Stripe, puis filet de sécurité via cron horaire.

Le billing est donc la source de vérité du runtime. L'activité gratuite ne
réveille jamais le moteur réel.

## TL;DR — Les 3 niveaux

| Niveau | Quoi | Coût/mois | Quand |
|--------|------|-----------|-------|
| **0 — Démo / no-client** | Vercel + Supabase free, `engine_mode=mock`, `WORKER_PROVIDER=none` | ~0€ (domaine seul) | Tester, waitlist, produit sans revenu |
| **1 — Live paid** | Niveau 0 + Stripe live + Fly Machines démarrées à la demande | ~0€ hors job, quelques € selon usage | Premier client payant |
| **2 — Pro/B2B** | VPS Hetzner + Coolify + Postgres dédié + Redis | 4-20€/mois fixes | Clients exigeants, données sensibles |

Tu commences au **niveau 0**. Tu passes au **niveau 1** quand Stripe a un
abonnement réel. Tu passes au **niveau 2** uniquement si un client B2B demande
isolation, conformité ou infra dédiée.

---

## Niveau 0 — Démo low-cost (5 min)

### 1. Crée le projet Supabase

1. https://supabase.com → New Project (free tier)
2. Note l'URL + les clés (`Settings → API`)
3. SQL Editor → exécute en ordre :
   - `supabase/migrations/0001_initial.sql`
   - `supabase/migrations/0002_storage.sql`
   - `supabase/migrations/0003_jobs_queue_and_stripe_v2.sql`

### 2. Crée le projet Vercel

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add ENGINE_MODE          # "mock" pour démo
vercel env add CRON_SECRET           # openssl rand -hex 32
vercel env add WORKER_API_TOKEN      # openssl rand -hex 32 (pas utilisé en mock mais requis)
vercel deploy --prod
```

### 3. Stripe en test (optionnel pour démo)

Skip si tu veux juste une waitlist. Sinon :

```bash
vercel env add STRIPE_SECRET_KEY        # sk_test_…
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET    # whsec_… après création du webhook
```

Crée le webhook : `Stripe Dashboard → Developers → Webhooks → Add endpoint`
URL: `https://ton-app.vercel.app/api/stripe/webhook`
Events: `checkout.session.completed`, `customer.subscription.*`,
`invoice.payment_failed`.

### 4. Verification

- Visite `https://ton-app.vercel.app/api/health` → doit répondre 200
- Crée un compte → doit pouvoir login
- Soumets un job → reçoit `output.example.json` après ~1.5s (mock)

**Coût**: 0€ (juste le domaine si tu en achètes un).

---

## Niveau 1 — Live avec worker Fly à la demande (20 min)

À faire quand tu as ton premier client payant ou que tu veux tester un paiement
end-to-end en Stripe live.

### 1. Build et push l'image engine

```bash
# Build
docker build -t ghcr.io/<user>/<product>-engine:latest engine/

# Login GHCR (token avec scope write:packages)
echo $GHCR_TOKEN | docker login ghcr.io -u <user> --password-stdin

# Push
docker push ghcr.io/<user>/<product>-engine:latest
```

### 2. Déploie le worker sur Fly

```bash
# Setup Fly CLI : https://fly.io/docs/hands-on/install-flyctl/
fly auth login

# Depuis la racine micro-saas-template-v2/
# Le contexte Docker doit inclure worker/ ET engine/.
cp worker/fly.toml.example fly.toml
# Édite : remplace 'app = "worker-CHANGE_ME"' par ton nom

fly launch --no-deploy --copy-config --name worker-<product>
fly secrets set SHELL_URL=https://ton-app.vercel.app
fly secrets set WORKER_API_TOKEN=<même que côté Vercel>
fly secrets set OPENAI_API_KEY=sk-…       # si l'engine en a besoin
fly secrets set SHELL_SERVICE_TOKEN=<openssl rand -hex 32>
fly deploy
```

Le worker poll `/api/jobs/worker/claim`, traite les jobs, puis quitte
proprement après `EXIT_WHEN_IDLE_SECONDS` sans job. Le `fly.toml.example`
utilise `restart=on-failure` : une sortie propre laisse la Machine stoppée,
un crash est redémarré.

### 3. Autorise Vercel à piloter Fly

```bash
vercel env add WORKER_PROVIDER          # "fly"
vercel env add FLY_APP_NAME             # worker-<product>
vercel env add FLY_API_TOKEN            # token Fly limité au worker
vercel env add FLY_MACHINE_ID           # optionnel, si tu veux cibler 1 machine
vercel env add SHELL_SERVICE_TOKEN      # même valeur que côté Fly, si uploads engine
vercel deploy --prod
```

Laisse `ENGINE_MODE=mock` côté Vercel. En prod, le Shell ne lance jamais le
moteur réel dans une route serverless : en `live`, il crée un job `pending`,
appelle la Fly Machines API pour démarrer le worker si besoin, puis retourne
`202`.

Pour forcer un test live manuellement :

```sql
update site_config set engine_mode = 'live' where id = true;
```

Si aucun abonnement actif n'existe, le prochain webhook/cron remettra `mock`.
Pour un test prolongé sans paiement réel, désactive temporairement le cron ou
utilise un abonnement Stripe test `active`.

### 4. Active les crons Vercel

`vercel.json` les déclare déjà :
- `/api/cron/sweep-jobs` toutes les 5 min (récupère leases morts)
- `/api/cron/auto-degrade` toutes les heures (resynchronise billing → runtime)

Vérifie sur Vercel Dashboard → ton projet → Crons que les 2 sont actifs.

### 5. Monitoring

Health checks externes (gratuit) :
- **UptimeRobot** : 50 monitors free, 5 min interval
  - URL: `https://ton-app.vercel.app/api/health`
  - Alert: email/Slack/Discord
- **BetterStack** : 10 monitors free, 30s interval
- **Vercel Analytics** : intégré, gratuit (pageviews + Core Web Vitals)

Logs :
- Vercel logs : intégré, 1 jour de rétention sur Hobby, illimité sur Pro
- Fly logs : `fly logs` ou web UI
- Supabase logs : Dashboard → Logs (Postgres + Auth + Storage)

Pour scaler les logs : Logtail (gratuit < 1GB/mois), Axiom (gratuit < 0.5TB/mois).

### 6. Costs management — Billing gate

Le billing gate est **activé par défaut** (`AUTO_DEGRADE_ENABLED=1`).

Comportement :
- aucun abonnement `active`/`trialing` non-free → `engine_mode='mock'`
- abonnement `active`/`trialing` non-free → `engine_mode='live'`
- webhook Stripe fait la bascule immédiatement après checkout/update/delete
- cron horaire refait la même synchro si un webhook a été manqué
- job `live` → Shell démarre le worker Fly via Machines API, si stoppé
- worker idle → sortie propre après `EXIT_WHEN_IDLE_SECONDS`

Override manuel via SQL :

```sql
-- Forcer live (engine actif tout le temps)
update site_config set engine_mode = 'live' where id = true;

-- Forcer maintenance (refus 503 sur /api/jobs/create)
update site_config set engine_mode = 'maintenance', reason = 'planned upgrade' where id = true;

-- Désactiver la synchro cron (à éviter en prod)
-- Vercel env AUTO_DEGRADE_ENABLED=0
```

**Coût mensuel niveau 1 (estimation) :**

| Composant | Inactif (auto-degrade) | Actif (1k jobs/mois) |
|-----------|------------------------|----------------------|
| Vercel Hobby | 0€ | 0€ (sous limites) |
| Supabase free | 0€ | 0€ (sous 500MB DB) |
| Fly worker | 0€ compute si Machine stoppée | quelques € selon durée CPU/RAM |
| Stripe | 0€ | 1.4% + 0.25€/transac (pas un fixe) |
| Domaine | ~10€/an | ~10€/an |
| **Total mensuel** | **~1€** | **5-10€** |

⚠️ Vercel Hobby est limité à un usage personnel/non-commercial. Quand tu as
des clients payants, passe en Pro (20$/mois) ou migre vers Cloudflare Pages.

---

## Niveau 2 — VPS Hetzner pour B2B (1h)

Quand un client demande instance dédiée, Postgres isolé, données sensibles.

### Stack

```
Hetzner CX22 (3€/mois, 2vCPU, 4GB)
├── Coolify (gestion containers)
├── Postgres dédié (Coolify ou Docker compose)
├── Shell Next.js (build + run)
├── Worker Python (build + run)
├── Engine Docker (build + run)
└── Caddy reverse proxy (HTTPS auto)
```

### Setup express

```bash
# 1. Créer le serveur Hetzner CX22 (Ubuntu 24.04)
# 2. Installer Coolify : https://coolify.io/docs/installation
ssh root@<ip>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 3. Via Coolify UI :
# - Add Server (localhost)
# - Add Project → Add Resource → Postgres 16
# - Add Resource → Application → Git repo → Build Pack: Dockerfile
#   - Domain: app.<client>.com
#   - Health URL: /api/health
#   - Add env vars (cf .env.example)
```

### Avantages niveau 2

- Postgres isolé (pas de "noisy neighbor" Supabase free)
- Storage local ou S3-compatible (R2 Cloudflare = 0€ egress)
- Pas de limite Vercel
- HTTPS auto via Caddy
- Backup quotidien via Coolify

### Coûts niveau 2

- Hetzner CX22 : 3.79€/mois
- Domaine : ~10€/an
- (Optionnel) Cloudflare R2 : 0.015$/GB stockage, 0$ egress
- **Total : ~5€/mois fixes**

Tu peux héberger 5-10 clients sur le même CX22 si la charge est modeste, ou
1 par CX22 pour isolation totale.

---

## Migrations DB

Les fichiers `supabase/migrations/000X_*.sql` sont à exécuter dans l'ordre
numérique. Pour la v2, exécute `0003_jobs_queue_and_stripe_v2.sql` après
`0001` et `0002`.

Pour les déploiements futurs, utilise la CLI Supabase :

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

---

## Rotation des secrets

| Secret | Quand rotater | Comment |
|--------|---------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Tous les 6 mois OU fuite | Supabase Dashboard → Settings → API → Reset |
| `STRIPE_WEBHOOK_SECRET` | Tous les 12 mois OU fuite | Stripe Dashboard → recreate webhook |
| `WORKER_API_TOKEN` | Tous les 6 mois | `openssl rand -hex 32` + update Vercel + Fly secrets |
| `FLY_API_TOKEN` | Tous les 6 mois OU départ d'un admin | Fly Dashboard/CLI → nouveau token scoped + update Vercel |
| `CRON_SECRET` | Tous les 6 mois | `openssl rand -hex 32` + update Vercel |
| `SHELL_SERVICE_TOKEN` | Tous les 6 mois | `openssl rand -hex 32` + update Vercel + Fly |

Pour rotation worker token sans downtime :
1. Génère un nouveau token, ajoute-le côté Vercel comme `WORKER_API_TOKEN_NEXT`
2. Modifie le code pour accepter les deux pendant la transition
3. Update Fly avec le nouveau token
4. Retire l'ancien après 24h

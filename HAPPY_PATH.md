# HAPPY_PATH.md — Du repo au résultat en ligne droite

> Un seul chemin. Chaque étape se vérifie avant de passer à la suivante.
> Aucune décision d'architecture à prendre ici.

---

## Étape 0 — Prérequis (2 min)

```bash
node --version   # >= 20
python --version # >= 3.11
docker --version # pour tester l'engine en local (optionnel en mock)
```

Comptes à créer si pas encore fait : [Supabase](https://supabase.com) (free), [Vercel](https://vercel.com) (free).

---

## Étape 1 — Cloner et installer (3 min)

```bash
# Clone le template dans un nouveau dossier produit
git clone https://github.com/Insular2895/Shell.git
cp -r Shell/micro-saas-template-v2 mon-produit
cd mon-produit

# Installe les dépendances JS
npm install

# Installe les dépendances Python de l'engine
pip install -r engine/requirements.txt
```

**Vérification :**
```bash
npm run typecheck   # doit terminer sans erreur
npm run test        # doit passer
```

---

## Étape 2 — Lancer en mode mock (2 min)

Crée un fichier `.env.local` à la racine du dossier produit :

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...  # clé Supabase locale ou fake pour mock pur
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENGINE_MODE=mock
CRON_SECRET=dev-secret-local
WORKER_API_TOKEN=dev-token-local
```

> En mode mock, Supabase n'est pas obligatoire pour voir le rendu UI.
> Pour un test complet avec auth et jobs, lance Supabase local :
> `npx supabase start` puis applique les migrations `supabase/migrations/*.sql`.

Lance le serveur :

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

**Vérification :** La page d'accueil s'affiche. `/api/health` répond 200.

---

## Étape 3 — Créer un produit (configurer le formulaire)

Édite `config/run.schema.json` pour définir les champs de ton produit :

```json
{
  "title": "Mon outil",
  "submitLabel": "Lancer",
  "estimatedRuntime": "< 1 minute",
  "inputs": [
    {
      "key": "url",
      "type": "url",
      "label": "URL à analyser",
      "required": true
    }
  ]
}
```

Recharge [http://localhost:3000/run](http://localhost:3000/run) — le formulaire se génère automatiquement depuis ce schéma.

**Vérification :** Le formulaire affiche le bon champ. En mode mock, soumettre affiche `output.example.json` comme résultat.

---

## Étape 4 — Brancher ton adapter (code métier)

Ouvre `engine/adapter.py`. C'est le seul fichier que tu modifies par produit.

```python
# Exemple : importer ton code Python métier
from mon_core.analyzer import analyze   # pip install mon-core

def run(payload: dict) -> dict:
    input_data = payload["input"]
    result = analyze(input_data["url"])   # ton code métier pur
    return {
        "status": "success",
        "blocks": [
            {"type": "text", "content": result["summary"]},
            {"type": "metric", "label": "Score", "value": result["score"]}
        ]
    }
```

Teste l'adapter en isolation (sans le Shell) :

```bash
ENGINE_MODE=local python engine/run_engine.py engine/input.example.json
```

**Vérification :** La commande termine avec `{"status": "success", "blocks": [...]}` dans le terminal.

---

## Étape 5 — Voir le résultat dans le dashboard

Assure-toi que Supabase local tourne (`npx supabase start`) et que les migrations sont appliquées.

Lance `npm run dev`, crée un compte, soumet un job depuis `/run`.

L'`AutoResultRenderer` lit les `blocks` retournés par l'adapter et les rend automatiquement :

| Type de block | Rendu |
|--------------|-------|
| `text` | Paragraphe |
| `metric` | Carte avec label + valeur |
| `list` | Liste à puces |
| `file` | Lien de téléchargement |
| `image` | Image avec caption |

**Vérification :** Le résultat s'affiche dans `/results/[jobId]` sans aucun code UI à écrire.

---

## Étape 6 — Déployer (5 min, coût : 0€)

Voir `DEPLOYMENT.md` → section "Niveau 0 — Démo low-cost".

En résumé :
1. Crée un projet Supabase (free) → applique les migrations
2. `vercel deploy --prod` avec les variables d'env (`ENGINE_MODE=mock` pour commencer)
3. Visite `https://ton-app.vercel.app/api/health` → doit répondre 200

**Pour passer au moteur réel :** Change `ENGINE_MODE=docker` et déploie le worker sur Fly (`DEPLOYMENT.md` → Niveau 1).

---

## En cas de blocage

| Symptôme | Où chercher |
|----------|-------------|
| Formulaire vide ou erreur schema | `config/run.schema.json` mal formé — valide avec `npx ajv validate` |
| Job reste en `pending` | `ENGINE_MODE` non défini → l'engine ne se lance pas |
| Résultat vide | `adapter.py` retourne un dict sans `blocks` |
| Auth cassée | Migrations Supabase non appliquées |
| Build Vercel échoue | Typecheck — lance `npm run typecheck` en local d'abord |

Voir aussi `RUN_FLOW.md` pour le pipeline complet paramètre par paramètre.

# n8n setup

## Self-hosted (recommandé)

```bash
cd automation-packs/n8n
cp env.example .env
# Fill in real values
docker-compose up -d
```

Premier login : http://localhost:5678 (créer admin user).

## Reverse proxy

Caddy + HTTPS auto :
```
n8n.example.com {
  reverse_proxy localhost:5678
}
```

## Secrets

n8n stocke ses credentials chiffrés via `N8N_ENCRYPTION_KEY`.
Les workflows référencent les credentials par nom, pas en dur.

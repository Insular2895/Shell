# security-packs/policies/security-doctrine.md

## Principes

1. **Defense-in-depth** : pas de point de défaillance unique.
2. **Fail-safe** : si un check échoue, refuse plutôt que d'accepter.
3. **Least privilege** : minimal permissions partout (DB, API, infra).
4. **Audit trail** : tout ce qui touche prod laisse une trace.
5. **Pas de secret en code** : 100% via env vars + secrets manager.

## Catégories

### Secrets
- Aucun secret en clair dans le code (Gitleaks bloque)
- `.env.example` avec valeurs fictives uniquement
- Secrets prod : Vercel env / Fly secrets / GitHub Actions secrets
- Rotation : chaque 6-12 mois (cf v2 DEPLOYMENT.md)
- Détection en CI : gitleaks sur chaque PR

### Authentification
- Mots de passe : bcrypt (Supabase le gère)
- Sessions : JWT signés, expiration courte, refresh
- MFA : disponible via Supabase, recommandé pour admin
- Lockout : après N tentatives (Supabase auto)

### Autorisation
- RLS Postgres sur **toutes** les tables sensibles
- Vérification server-side de chaque requête (jamais "trust the client")
- IDOR : tester systématiquement (cf v2 .claude/agents/qa.md)

### Inputs
- Validation côté serveur **toujours** (Ajv, Zod, Pydantic)
- Pas de regex maison pour email/phone (cf awesome-falsehood)
- Limites de taille (256kB payload, 10k chars string, 100 items array)
- Pas de `eval`, `pickle`, `yaml.load` non-safe

### Uploads
- Type/size check côté API
- Stocker hors webroot
- Servir via signed URLs avec expiration courte
- Scanner antivirus si > 10MB ou binaires (ClamAV)
- Pas d'inférence de type basée sur l'extension seule (vérifier MIME)

### Dépendances
- `npm audit --audit-level=high` en CI (bloquant)
- `pip-audit` en CI (bloquant)
- Trivy sur les images Docker (bloquant si HIGH/CRITICAL)
- Renovate pour PRs auto de mise à jour
- Pas de dep "drive-by" (jamais `npm install <random>` sans review licence + popularity)

### Infra
- HTTPS partout
- HSTS, CSP, X-Frame-Options, etc. (cf v2 next.config.mjs)
- Container : non-root, read-only, multi-stage
- Pas de port exposé inutilement
- Backups testés (restore drill 1x/an minimum)

### Pentest
- Pentest interne autorisé sur **nos propres** infrastructures uniquement
- Outils OK : ZAP, Nuclei, Burp Community, Nmap (sur ses propres targets)
- Pentest tiers : seulement avec contrat écrit
- Shodan : OK pour audit nos propres assets, **interdit** pour exploitation

### Données utilisateur
Cf `legal/data-selling-policy.md`, `growth-data-layer/`, `ai-privacy-gateway/`.

## Réponse à incident
Cf `ops-packs/incidents/`. Procédure 4 étapes : détecter → contenir → éradiquer → leçons.
Pour breach data : notification CNIL sous 72h (art 33 RGPD).

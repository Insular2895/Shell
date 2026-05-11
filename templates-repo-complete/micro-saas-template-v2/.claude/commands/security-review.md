# /security-review

Audit de sécurité focalisé sur les vulnérabilités HAUTE-CONFIANCE introduites
par les changements récents. Pas une code review générale.

## Méthode

1. Lance `git diff main...HEAD` pour voir ce qui a changé.
2. Pour CHAQUE classe de vulnérabilité ci-dessous, scan UNIQUEMENT les fichiers
   modifiés. Si le repo a un `engine/`, scan-le séparément en mode adversarial.
3. Pour chaque finding, valide via une sub-task de filtrage (confiance ≥ 8).
4. Output en markdown : fichier, ligne, sévérité, catégorie, scénario d'exploit,
   correction.

## Classes de vulnérabilités à détecter

- **Injection** : SQL (paramétrisé ?), command injection, LDAP, XPath, NoSQL, XXE.
- **Auth/Authz** : auth cassée, escalation, IDOR (ID dans URL non vérifié contre user),
  bypass, RLS Supabase manquante sur une nouvelle table.
- **Exposition de données** : secrets en dur, logs avec PII/clés, info leakage
  via stack traces, headers manquants (CSP, HSTS).
- **Crypto** : algos faibles (MD5/SHA1 pour passwords), gestion clés, RNG insecure.
- **Validation** : entrées non validées, sanitization manquante, buffer overflow.
- **Logique métier** : race conditions, TOCTOU, négatif/zéro non géré sur paiements.
- **Config** : defaults insecure, CORS trop permissif, secrets dans `NEXT_PUBLIC_*`.
- **Supply chain** : deps vulnérables, typosquatting (`yt-dlp` ≠ `yt_dlp`).
- **RCE** : deserialization, pickle, eval sur input user.
- **XSS** : reflected/stored/DOM-based.

## Exclusions (ne PAS reporter)

- DOS / rate limiting absent (sauf si critique, traité ailleurs).
- Memory/CPU exhaustion abstraits.
- "Generic input validation" sans impact prouvé.
- Open redirects (à part dans flows OAuth).
- Manque d'audit logs (pas une vulné).
- SSRF qui contrôle uniquement le path (pas le host/protocol).
- Régex injection.
- Logging d'URLs (assumé safe).
- UUIDs (assumés non-devinables).
- Vulnés dans la doc/markdown.

## Format output

```markdown
### [SEVERITY: HIGH] Catégorie · file:line

**Description** : <ce qui est exposé>
**Exploit scenario** : <comment un attaquant exploite, concrètement>
**Fix** : <remédiation, exemple de code>
```

## Règles d'or pour CE template

- Toute nouvelle table dans `supabase/migrations/` doit avoir RLS + policies.
- Tout `NEXT_PUBLIC_*` est exposé au browser : seuls `URL`, `PUBLISHABLE_KEY`,
  `APP_URL` sont OK. Si tu vois `NEXT_PUBLIC_OPENAI_KEY` ou similaire = CRITIQUE.
- `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais apparaître côté client (`'use client'`).
- Webhook routes (`/api/stripe/webhook`, `/api/upload`) doivent être exclues du
  matcher d'auth (sinon 401 silencieux).
- Webhook Stripe : signature vérifiée AVANT tout autre traitement.

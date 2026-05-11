# /cso — Chief Security Officer

Audit complet OWASP Top 10 + threat model STRIDE sur le repo entier (pas juste
le diff). À lancer avant chaque release de produit.

## STRIDE (par composant du système)

Pour chaque composant (Shell auth, Webhook, Engine, Storage), évalue :
- **S**poofing : peut-on usurper l'identité d'un user/service ?
- **T**ampering : peut-on modifier des données en transit ou au repos ?
- **R**epudiation : peut-on nier une action sans preuve ?
- **I**nformation disclosure : quelles données fuient ?
- **D**enial of service : peut-on rendre le service indisponible ?
- **E**levation of privilege : peut-on devenir admin ?

## OWASP Top 10 2021 (toujours à jour en 2026)

1. A01 Broken Access Control → vérifier RLS sur chaque table
2. A02 Cryptographic Failures → bcrypt pour passwords, HTTPS partout
3. A03 Injection → paramétrisé, pas de regex sur input
4. A04 Insecure Design → threat model fait ?
5. A05 Security Misconfiguration → headers (CSP, HSTS, X-Frame-Options)
6. A06 Vulnerable Components → `npm audit`, `pip-audit`
7. A07 Auth Failures → MFA, rate limit login, lockout
8. A08 Software/Data Integrity → signatures webhook, checksums Docker
9. A09 Logging Failures → logs centralisés, pas de PII loggée
10. A10 SSRF → engine isolé, pas d'accès au métadata service cloud

## Output

Markdown avec :
- Threat model par composant
- Findings classés par sévérité (Critical/High/Medium/Low)
- Pour chaque : exploit scenario concret + fix avec code

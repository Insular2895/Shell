# growth-data-layer/compliance/data-minimization-policy.md

## Principe

> Ne collecter, conserver, et traiter que **le strict nécessaire** pour la
> finalité déclarée. Tout champ qui n'est pas indispensable à un usage
> documenté est supprimé du formulaire / de la collecte.

## Règles

### Collecte

- Aucun champ "facultatif" sans finalité claire et documentée
- Aucun champ "date de naissance" sauf si l'âge légal est requis
- Aucun "numéro de sécurité sociale", "numéro de carte", "donnée santé" hors usage métier explicite
- Pas de tracking cross-domain sans consent ads
- Pas de fingerprinting navigateur sans consent analytics

### Stockage

- Champs PII identifiants (email, phone) : **hashé** ou **chiffré** dans `master_*`
- Le déchiffrement n'a lieu **qu'au moment de la livraison** vers un acheteur autorisé
- Les logs Vercel/Fly ne contiennent **jamais** d'email/phone en clair
- Les exports CSV en local sont chiffrés (zip + password) avant envoi

### Rétention

| Catégorie | Durée par défaut | Base légale |
|-----------|------------------|-------------|
| Lead non converti, pas de consent prospection | 90 jours max | légitimate_interest |
| Lead avec consent prospection | 3 ans après dernier contact | consent |
| Lead avec consent partenaires (vendable) | 3 ans après dernier contact | consent |
| Lead client converti | Durée contrat + 5 ans (obligation comptable) | legal_obligation |
| Logs techniques | 1 an | legitimate_interest |
| `consent_ledger` | 5 ans (preuve audit) | legitimate_interest |
| `lead_delivery_log` | 5 ans (preuve commerciale) | legitimate_interest |
| Données mineurs | **Interdit** sans accord parental documenté | — |

`retention_expires_at` est calé à la collecte selon ces règles. Au-delà :

- Lead → `sellable_status = 'expired'` automatique (cron quotidien)
- Email/phone hash → effacés du master après 6 mois supplémentaires si pas de réactivation

### Droits RGPD

| Droit | Implémentation |
|-------|----------------|
| Accès (art 15) | Endpoint `/api/rgpd/access` (pas dans MVP — manuel) |
| Rectification (art 16) | Endpoint `/api/rgpd/rectify` ou ticket support |
| Effacement (art 17) | DELETE master_contacts CASCADE → leads supprimés. consent_ledger conservé (preuve) |
| Limitation (art 18) | Flag `processing_restricted = true` sur master_contacts |
| Portabilité (art 20) | Export JSON via endpoint dédié |
| Opposition (art 21) | `opt_out = true` + suppression des `consent_*` actifs |
| Pas de décision automatisée individuelle (art 22) | Pas concerné MVP |

Les demandes RGPD sont tracées dans une table `rgpd_requests` (à créer phase 2)
et doivent être traitées en **30 jours max**.

### Données particulières

- **Mineurs** : pas de collecte intentionnelle. Si détectée a posteriori → suppression.
- **Données sensibles** (santé, religion, opinion, orientation, biométrie, génétique) : **interdit** sauf cas d'usage explicite avec base légale renforcée.
- **Salariés** : si on collecte des données salariés (ex: lead_capture B2B), respecter convention employeur si applicable.

## Audit annuel

Une fois par an, le DPO (ou responsable légal) reçoit :

- Liste des finalités actives
- Liste des champs collectés par site (cartographie)
- Liste des sous-traitants destinataires
- Volume de demandes RGPD reçues / traitées
- Liste des incidents data
- Validation que `data-minimization-policy.md` est appliqué dans le code (audit du schema vs cette doc)

Sortie : rapport `reports/compliance/YYYY-annual-audit.md`.

## En cas de doute

> S'il faut hésiter à collecter un champ, NE PAS le collecter.
> S'il faut hésiter à le vendre, NE PAS le vendre.
> Le coût d'un incident RGPD dépasse 100x les revenus marginaux d'un champ supplémentaire.

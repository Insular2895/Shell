# PII classification

> Catégorisation des champs par sensibilité, pour décider du traitement
> (chiffrement, hashage, redact AI gateway, etc.).

## Niveaux

### N1 — Public ou peu sensible
Stocké en clair OK.
- Nom d'entreprise (publique si SIRET enregistré)
- Site web
- Industry/sector
- Country/city (sans adresse précise)
- LinkedIn URL public

### N2 — Identifiant indirect
Hashé en master_*. Déchiffré uniquement à l'usage final.
- Email (normalisé puis sha256)
- Phone (E.164 puis sha256)
- IP (sha256 pour analytics)
- User-Agent (sha256)
- Adresse postale partielle (ville/CP gardés, rue/numéro supprimés)

### N3 — Donnée d'identification directe
Chiffrée en master_*. Mapping local pour réversibilité (Presidio).
- Email en clair (uniquement à la livraison vers buyer autorisé)
- Phone en clair (idem)
- Nom complet
- Date de naissance
- Numéro de pièce identité

### N4 — Donnée sensible (art 9 RGPD)
**Pas collectée**. Si collectée par erreur → effacement immédiat.
- Santé
- Religion
- Orientation sexuelle
- Opinion politique
- Données biométriques
- Origine ethnique

### N5 — Donnée critique
**Jamais stockée**.
- Numéro de carte bancaire complet (CVV jamais)
- IBAN complet (sauf cas business explicite)
- Mot de passe en clair
- Token d'API utilisateur en clair

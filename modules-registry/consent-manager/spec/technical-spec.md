# consent-manager — Technical spec

## Frontend
- Components : ConsentBanner, ConsentPreferencesModal, CookieSettings
- Stocke choix dans cookie + appel API
- Re-displayed si legal_text_version diffère

## Backend
- POST /api/consent/grant → insert consent_ledger
- POST /api/consent/revoke → insert consent_ledger status=revoked
- GET /api/consent/current → retourne current_consents view

## Storage
- Table : consent_ledger (cf growth-data-layer/consent/consent-ledger.sql)
- View : current_consents (last-write-wins)
- Append-only enforcé au niveau triggers DB

## Integration
- visitor_id (cookie) lié à contact_id (auth.users) au signup
- consent_ledger.contact_id mis à jour pour fusionner


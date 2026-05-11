# consent-manager — Security rules

- Triggers DB bloquent UPDATE/DELETE sur consent_ledger
- IP/User-Agent hashés (sha256), jamais stockés en clair
- legal_text_version doit exister dans une table 'legal_texts' (versions archivées)
- Pas de pre-checked checkbox pour finalités opt-in (RGPD invalide)
- Audit trail : 5 ans minimum (preuve CNIL)
- Banner : conforme directives ePrivacy (refuser aussi facile que accepter)
- Pas de cookie analytics avant consent


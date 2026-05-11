# Consent policy

## Principes

1. **Granular** : 1 consent par finalité (analytics, ads, prospection, partners, data_enrichment, audience_activation)
2. **Pré-coché interdit** sur opt-in (RGPD invalide)
3. **Refuser aussi facile que accepter** (ePrivacy)
4. **Versioned** : chaque changement de texte légal → nouveau `legal_text_version`
5. **Append-only** : on n'écrase jamais un consent, on en ajoute un nouveau (revoked)
6. **Double opt-in** recommandé pour `consent_prospection` et `consent_partners`

## Banner UX

```
[Essential cookies only]   [Customize]   [Accept all]
                                          (mêmes tailles, mêmes couleurs)
```

Le banner est :
- Affiché dès la première visite (cookie `consent_seen=false`)
- Re-affiché si `legal_text_version` change
- Pas bloquant pour les pages légales (privacy, terms, contact)

## Customize modal

Granularity par finalité :
```
☐ Analytics (statistiques de visite anonymes)
☐ Advertising (mesure de campagnes pub)
☐ Prospection (recevoir des emails commerciaux de notre part)
☐ Partners (partager mes coordonnées avec des partenaires sélectionnés)
☐ Audience activation (utiliser mes données pour des audiences pub similaires)
```

## Storage

- Banner choice → cookie `consent_v_<version>` (1 an)
- Détail → POST /api/consent/grant → `consent_ledger`

# consent-manager — Business spec

## Objectif
Recueillir un consentement valide par finalité (analytics, ads, prospection,
partners) et le stocker de manière immutable avec preuve.

## User flow
1. Premier visit : banner s'affiche (visitor_id cookie)
2. User choisit : accept all / reject all / customize
3. Pour chaque type : insertion consent_ledger
4. Banner re-affiché si legal_text_version change
5. User connecté : merge visitor_id → contact_id


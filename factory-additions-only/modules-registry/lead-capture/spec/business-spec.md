# lead-capture — Business spec

## Objectif
Capturer un lead via formulaire (audit, contact, demo) en respectant la
chaîne consent → sellable_status. Le lead est immédiatement scoré et sa
vendabilité calculée.

## User flow
1. Form display avec consent_partners en option
2. User submit → validation
3. Insertion dans master_contacts + master_leads
4. Calcul initial sellable_status
5. Trigger workflow n8n (notif owner, enrichissement async)


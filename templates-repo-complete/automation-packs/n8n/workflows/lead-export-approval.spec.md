# Workflow : lead-export-approval

## Trigger
- Webhook depuis cockpit : "buyer X demande dataset Y"

## Steps

1. **Receive request** : {buyer_id, dataset_definition, allowed_usages}
2. **Pre-check via gateExport()** sur sample :
   - Buyer status='active' ? Contract signed ?
   - Catégories autorisées par les leads ?
   - Pas d'exclusivité conflictuelle ?
3. **If pre-check OK** :
   - Insert decision_queue (status='pending', decision_type='export_data')
   - Slack alert admin avec lien cockpit
   - **STOP** — admin doit approve manuellement (cf approval-policy.yml ask_before)
4. **If admin approves** (callback webhook) :
   - Run gateExport() pour CHAQUE lead du dataset
   - Generate CSV / API push
   - INSERT lead_delivery_log pour chaque
   - Send to buyer
5. **If admin rejects** : refund + email buyer

## Bloque automatiquement si
- Buyer.status != 'active'
- Aucun lead ne passe gateExport()
- Plus de N leads (seuil configurable, ex: 1000) sans validation explicite

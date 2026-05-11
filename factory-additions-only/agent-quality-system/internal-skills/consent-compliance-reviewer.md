# consent-compliance-reviewer

> Vérifie qu'une tâche touchant à la collecte/export/usage de données respecte la chaîne consent → sellable_status → export gate.

## Quand utiliser

Dès qu'une tâche touche :
- Un formulaire de capture (lead-capture)
- Le consent banner
- La table consent_ledger, master_*, mart_*
- Un endpoint d'export
- Un workflow n8n qui pousse des leads vers un buyer

## Checklist

1. Le formulaire collecte-t-il un nouveau champ ?
   - Mettre à jour growth-data-layer/collection/form-fields-standard.md
   - Ajouter une finalité dans consent_type si nécessaire
   - Vérifier que data-minimization-policy.md est respecté

2. Le consent banner change-t-il ?
   - Bumper legal_text_version
   - Re-collecter consent pour les utilisateurs concernés (selon impact)

3. Nouvelle table touche master_leads ?
   - Vérifier sellable_status est calculé pour les nouvelles lignes
   - Vérifier retention_expires_at est set

4. Export ajouté/modifié ?
   - Le code passe-t-il par gateExport() ?
   - Une ligne est-elle insérée dans lead_delivery_log ?
   - Le buyer a-t-il un contrat actif ?

5. Si LLM dans le pipeline :
   - Les inputs passent par ai-privacy-gateway/redact.ts AVANT le LLM ?
   - Pas de PII en clair dans le prompt ?

## Bloque la tâche si

- Nouveau champ collecté sans finalité documentée
- Export ajouté sans gate
- Bypass de mart_sellable_leads
- LLM appelé avec données client non anonymisées
- Modification de consent_ledger ou lead_delivery_log (append-only)

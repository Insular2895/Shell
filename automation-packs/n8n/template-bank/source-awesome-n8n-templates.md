# Source : awesome-n8n-templates

[github.com/enescingoz/awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates)

Source d'inspiration pour des workflows n8n. **Ne JAMAIS importer directement**.
Pipeline :
1. Import → `template-bank/imported/`
2. Vetting (cf `docs/vetting-checklist.md`)
3. Si OK → `reviewed/`
4. Test sur staging
5. Si OK → `approved/` avec semver

Risques sources externes :
- Credentials hardcodés
- URLs externes hardcodées
- Function nodes avec eval
- Pas conforme à notre policy automation

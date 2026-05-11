# user-management

Pour admin :
- Liste des users avec filtres (status, plan, last login)
- Actions : suspend, unsuspend, change role, force-logout, delete
- Audit log des actions admin (qui a fait quoi quand)

Action = INSERT dans audit_log_admin.
Pour delete : confirmation + délai + email user.

## Statut
Spec only. Implémentation à coder phase 2-3.

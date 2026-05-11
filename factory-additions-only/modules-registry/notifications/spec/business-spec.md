# notifications

Système notif :
- in-app via Supabase Realtime (badge counter, popover)
- email via Resend ou SES
- preferences user (granular par type)

Tables : notifications, notification_preferences.
Pas de notif système qui contournerait notification_preferences (RGPD).

## Statut
Spec only. Implémentation à coder phase 2-3.

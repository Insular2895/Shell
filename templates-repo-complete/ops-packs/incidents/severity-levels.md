# Severity levels

| Niveau | Définition | Réaction |
|--------|------------|----------|
| **P0** | Site totalement down OU breach data en cours OU perte data en cours | Tout le monde stop, fix immédiat, com publique |
| **P1** | Feature majeure cassée OU sécurité (sans breach actif) | On-call répond < 30 min, fix < 4h |
| **P2** | Feature mineure cassée OU dégradation perf | Fix < 24h |
| **P3** | Bug visuel OU edge-case | Backlog normal |
| **info** | Notification sans action urgente | Noté, pas escaladé |

## Auto-escalade

- P0 non ACK en 15 min → escalade manager
- P1 non résolu en 4h → escalade
- P2 non résolu en 48h → escalade

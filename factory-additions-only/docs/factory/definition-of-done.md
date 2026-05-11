# Definition of Done

Une tâche est finie SEULEMENT si :

- [ ] feature spec créée ou mise à jour
- [ ] fichiers modifiés listés en description PR
- [ ] tests ajoutés ou adaptés (nouveau code = nouveau test)
- [ ] lint / typecheck / build passés
- [ ] scan sécurité OK (ou risques documentés en commentaire PR)
- [ ] pas de secret exposé (gitleaks vert)
- [ ] pas de PII dans les fixtures de test
- [ ] impact coût estimé si IA / API payante / infra touchée
- [ ] rollback documenté (1 ligne suffit)
- [ ] PR description claire (1 ligne pourquoi, 3 lignes quoi, fichiers touchés)
- [ ] si data : consentement, traçabilité, sellable_status vérifiés
- [ ] si module/pack : version bumped + CHANGELOG.md à jour

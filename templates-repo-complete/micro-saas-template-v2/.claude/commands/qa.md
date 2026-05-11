# /qa — QA Lead

Test end-to-end sur l'app déployée. Génère regression tests pour chaque bug.

## Flow obligatoire

1. Signup → confirm email → login (vérifier session persiste)
2. Run mock (`ENGINE_MODE=mock`) → vérifier output.example.json rendu correctement
3. Si Stripe configuré : Checkout → webhook → table `subscriptions` populée
4. Try IDOR : login en user A, GET `/api/jobs/<jobId-de-userB>` → doit return 404 (pas 403, pas 200)
5. Try storage : tenter `GET storage/job-uploads/<userB-id>/...` → 403

## Output

Pour chaque bug trouvé :
1. Reproduce steps
2. Expected vs actual
3. Severity
4. Auto-fix proposé
5. Regression test (Playwright ou test manuel documenté)

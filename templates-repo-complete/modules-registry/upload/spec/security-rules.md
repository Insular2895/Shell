# upload — Security rules

- Type MIME vérifié serveur-side (pas seulement extension)
- Taille vérifiée à la signature ET au callback finalize
- Antivirus : ClamAV si > 10 MB ou si binaires acceptés
- RLS : user ne voit que ses propres fichiers
- Signed URLs : courtes (1h max), single-use où possible
- URL externe : domaines whitelistés selon contexte (ex: youtube_only pour PlaylistBrief)
- Pas d'execution : JAMAIS exécuter le contenu uploadé
- Path traversal : sanitize filename (no '..', no '/')


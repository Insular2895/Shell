# Upload security

(Référence transverse — implémentations dans modules-registry/upload + security-packs/policies)

## Règles obligatoires

1. **Type MIME vérifié serveur-side** (pas extension seule)
2. **Taille max** déclarée + vérifiée à chaque étape
3. **Antivirus** si > 10MB ou si binaires acceptés (ClamAV)
4. **Path traversal** : sanitize `../`, `..\\`, paths absolus
5. **Pas d'exécution** : jamais execute le contenu uploadé
6. **Stocker hors webroot** (Supabase Storage = OK, jamais `public/`)
7. **Signed URLs** pour servir : TTL court (1h), single-use où possible
8. **Quota par user** (anti-DOS storage)

## Magic bytes vs extension

```typescript
// ❌ Faux
if (file.name.endsWith('.pdf')) accept = true;

// ✅ Vrai
const buf = await file.arrayBuffer();
const head = new Uint8Array(buf.slice(0, 4));
const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
```

# Mapping policy

## Règles

1. Le mapping pseudonyme→original NE QUITTE JAMAIS notre infra
2. Stocké en Redis local chiffré, TTL 24h par défaut
3. Une seule app instance accède à un mapping (pas de partage cross-app)
4. Si l'app crash entre anonymize et deanonymize : mapping perdu, on retry l'user
5. Audit : 1 ligne par création de mapping (sans contenu)

## Pourquoi 24h max

- Limite la surface d'attaque (si Redis compromis, peu de mappings actifs)
- Force l'app à ne pas garder des contextes "ouverts" trop longtemps
- Aligne avec la durée d'une session utilisateur typique

## Override pour cas spécifiques

Si un workflow long nécessite > 24h (ex: génération de rapport multi-étapes) :
- ADR documentant le besoin
- Override via `MAPPING_TTL_SECONDS` pour le worker concerné
- Audit reinforcé (toutes les opérations sur ce mapping loguées)

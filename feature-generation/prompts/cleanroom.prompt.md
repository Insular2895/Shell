# Prompt : cleanroom check pre-PR

Avant de finaliser une feature inspirée d'un site externe, vérifie :

1. Le code généré n'a aucune ressemblance verbatim avec le source (>15 mots
   identiques sur des sections "marketing copy", >5 mots sur du code).
2. Aucun nom de classe CSS spécifique au concurrent.
3. Aucun nom de produit du concurrent dans les commentaires.
4. Aucune image/icône binaire copiée.
5. Le design system utilisé est BIEN celui de la factory (Tailwind tokens centralisés),
   pas une copie du design du concurrent.

Si OK : signe `cleanroom_check: passed` dans le PR.
Si KO : ALERTE, STOP, ne pas merger. Reformule.

Réf : `legal/cleanroom-policy.md`.

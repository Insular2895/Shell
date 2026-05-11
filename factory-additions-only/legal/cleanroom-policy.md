# legal/cleanroom-policy.md

## Principe

> Quand on s'inspire d'un site/feature concurrent, on ne **copie rien**.
> On reproduit la **fonction**, pas la **forme**.

## Règles non négociables

```
1. Ne jamais copier le code source.
2. Ne jamais copier les assets (images, vidéos, icônes propriétaires).
3. Ne jamais copier le branding (logo, couleurs spécifiques, typographie payante).
4. Ne jamais copier les textes exacts (slogans, headlines, microcopy).
5. Ne jamais refaire du pixel-perfect (interface visuellement identique).
6. Extraire UNIQUEMENT les fonctions visibles publiquement.
7. Transformer en besoin métier abstrait avant implémentation.
8. Reconstruire une version originale qui suit notre design system.
```

## Pipeline cleanroom obligatoire

Toute feature inspirée d'un site externe DOIT passer par ce pipeline :

```
URL / screenshot publique
   ↓
[reference-site-analyzer/capture/]
Capture neutre (Playwright + Firecrawl)
   ↓
[reference-site-analyzer/extraction/]
Extraction des FONCTIONS visibles :
  - quels boutons existent
  - quels formulaires
  - quels états (loading, success, error)
  - quel flow utilisateur
   ↓
[reference-site-analyzer/cleanroom/inspiration-to-abstraction.ts]
Abstraction :
  - "il y a un upload + bouton 'extract'" devient
    "feature: extraction document avec dropzone + CTA"
  - PAS "il y a un bouton bleu qui dit 'Extract Now'"
   ↓
[feature-generation/]
Reconstruction depuis le besoin métier abstrait :
  - notre design system
  - nos composants modules-registry
  - nos backend-packs
  - notre copy
   ↓
[security-packs/policies/competitor-risk-check.ts]
Check anti-copie :
  - aucun nom de classe CSS du concurrent dans notre code
  - aucune chaîne de caractères longue identique
  - aucun nom de fichier identique au concurrent
  - aucune image binaire identique
   ↓
PR créée avec les outputs cleanroom en annexe (preuve de reformulation)
```

## Ce qui EST autorisé

✅ S'inspirer d'un flow utilisateur (upload → process → result)
✅ Reproduire un type de feature (un dashboard de revenus mensuel)
✅ Reproduire des conventions UI standards (mais pas du concurrent spécifique)
✅ Lire des articles publics expliquant un pattern produit
✅ Étudier les évaluations utilisateurs publiques

## Ce qui EST interdit

❌ Faire du reverse-engineering du JS minifié
❌ Copier des screenshots dans le produit
❌ Réutiliser un logo, une icône, une illustration
❌ Reprendre les noms de produit ("comme X mais avec Y")
❌ Reprendre les noms de plans ("Starter, Pro, Enterprise" du concurrent — utiliser nos noms)
❌ Reprendre des textes même reformulés à 80%
❌ Cloner un nom de domaine (typo squatting)

## Cas particuliers

### Repos open-source

- **MIT, Apache-2.0, BSD-3** : utilisable en intégrant le crédit (cf `legal/attribution-policy.md`)
- **GPL, AGPL** : interdit dans produit fermé sans validation explicite (contagion virale)
- **Pas de licence** : interdit, considéré "all rights reserved"
- **CC-BY** sur du contenu (texte, images) : utilisable avec attribution claire

### Datasets publics

- Cf `growth-data-layer/public-data-products/` :
  - Meta Ads Library : OK pour intelligence concurrentielle, **pas** pour reconstituer des audiences privées
  - DVF immobilier : OK, pas de réidentification abusive
  - Shodan : OK pour scoring/audit autorisé, **interdit** d'exploiter des vulnérabilités
- Toujours respecter les TOS de l'API

### Code IA-généré inspiré d'un repo public

Si un agent IA produit du code après avoir lu un repo concurrent : risque que
des fragments soient verbatim. Mitigation :
- Le scanner `competitor-risk-check.ts` compare nos fichiers avec un index de
  signatures de repos concurrents identifiés
- Si match > seuil, le code est rejeté

## Sanction interne

Une PR qui violerait cette policy est :
1. Bloquée au merge automatiquement (CI check)
2. Documentée dans `decision_queue` avec sévérité high
3. Discutée avant toute réintroduction du code

## En cas de doute

Si tu hésites entre "inspiration" et "copie" : **demande**. Mieux vaut perdre
2 jours à valider qu'avoir un cease-and-desist + procès.

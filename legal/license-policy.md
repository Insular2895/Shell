# legal/license-policy.md

## Matrice des licences

| Licence | Usage produit fermé | Usage interne | Note |
|---------|---------------------|---------------|------|
| MIT | ✅ avec attribution | ✅ | Standard |
| Apache-2.0 | ✅ avec attribution + NOTICE | ✅ | Standard |
| BSD-3-Clause | ✅ avec attribution | ✅ | Standard |
| ISC | ✅ avec attribution | ✅ | |
| MPL-2.0 | ⚠️ fichiers MPL doivent rester open source si modifiés | ✅ | OK avec discipline |
| LGPL-2.1 / LGPL-3 | ⚠️ link only, pas de fork modifié dans le binaire | ✅ | Compliqué |
| GPL-2.0 / GPL-3.0 | ❌ contagion du code | ⚠️ usage interne OK | À éviter dans le produit |
| AGPL-3.0 | ❌ contagion étendue au SaaS | ⚠️ usage interne possible | Très problématique en SaaS |
| CC-BY | ✅ avec attribution (contenu, pas code) | ✅ | Pour assets/textes |
| CC-BY-SA | ⚠️ partage sous même licence | ✅ | Souvent incompatible avec produit |
| CC-BY-NC | ❌ usage commercial interdit | ⚠️ | Pas pour produit |
| CC0 / Unlicense | ✅ domaine public | ✅ | Idéal |
| Aucune licence | ❌ "all rights reserved" | ❌ | Considéré non-utilisable |
| Licence proprio | À étudier au cas par cas | À étudier | |

## Règle d'or

> **Si un repo n'a pas de fichier LICENSE, on ne l'utilise pas.**
> "Code public sur GitHub" ≠ "code librement utilisable".

## Validation avant intégration

Pour ajouter une dépendance :

1. Vérifier le `package.json` → `license` ou le fichier `LICENSE` à la racine
2. Vérifier dans la matrice ci-dessus
3. Si verte : OK, ajouter à `legal/attribution-policy.md` si requis (Apache, BSD, MIT)
4. Si jaune : décision documentée + ADR dans `docs/decisions/`
5. Si rouge : refusée, chercher une alternative

Un script CI vérifie les licences :

```bash
# tools/scanners/check-licenses.sh
license-checker --production --excludePackages "..."
```

Liste blanche autorisée : MIT, Apache-2.0, BSD-3-Clause, BSD-2-Clause, ISC, CC0-1.0, Unlicense.

Tout autre nécessite une exception manuelle (entrée dans `legal/license-exceptions.md`).

## Cas spécial : modèles IA (poids)

Les poids de modèles ML/LLM ont leurs propres licences :

- **Llama 2/3** : licence Meta — acceptable jusqu'à un certain seuil utilisateurs
- **Mistral / Mixtral** : Apache-2.0 (modèles ouverts) ou licences commerciales
- **GPT-4 / Claude** : pas de poids — usage via API, soumis aux TOS du provider
- **Stable Diffusion** : CreativeML Open RAIL-M — attention aux restrictions d'usage

Documenter chaque modèle utilisé dans `legal/ai-models-license-tracker.md`.

## Cas spécial : datasets pour entraînement

Si on entraîne quoi que ce soit (fine-tuning, RAG indexation) :

- Vérifier la licence de chaque dataset
- **Pas de scraping non autorisé** (TOS sites, robots.txt)
- **Pas de données personnelles** sans base légale (cf data-selling-policy)
- Tracer l'origine de chaque dataset dans `legal/datasets-provenance-tracker.md`

## Si on libère du code de la factory

Si on open-source un module :

- Choisir **MIT** par défaut (compatible large)
- Pour les briques "factory" infra (CLI, scanners), **Apache-2.0** (clauses brevet)
- Documenter dans `LICENSE` racine du repo libéré
- Vérifier qu'aucune dépendance interne n'est sous licence incompatible

# SOURCE_REPO_SPEC.md — Structure d'un repo métier Python portable

> Tu écris le code métier dans **son propre repo GitHub**, séparé du SaaS template.
> Ce fichier décrit la structure que ce repo doit avoir pour être branchable
> directement dans le template via `engine/adapter.py`.

## Principe central

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  ton-engine-core            │         │  ton-saas-template          │
│  (repo métier autonome)     │         │  (le Shell)                 │
│                             │         │                             │
│  - logique pure             │         │  - landing, auth, billing   │
│  - aucune dep au SaaS       │         │  - dashboard, run, results  │
│  - testable en isolation    │  imports│                             │
│  - pip-installable          │◄────────┤  engine/adapter.py          │
│                             │         │     ↓                       │
│  expose: run(input) → dict  │         │     run(payload)            │
└─────────────────────────────┘         └─────────────────────────────┘
```

**Règle d'or** : le repo métier ne sait **rien** du SaaS. Il ne connaît ni Supabase,
ni Stripe, ni HTTP, ni auth, ni quota. Il est **pur**. Tu pourrais l'utiliser dans
un script CLI, un notebook Jupyter, ou un autre SaaS — peu importe.

C'est exactement ce qui te permet d'avoir le même moteur réutilisable.

## Structure type

```
resumeforge-core/                     ← repo GitHub indépendant
├── pyproject.toml                    ← packaging moderne (pip-installable)
├── README.md
├── .env.example                      ← variables d'env nécessaires
├── .gitignore
│
├── src/
│   └── resumeforge_core/             ← le package importable
│       ├── __init__.py               ← exporte run() et les types
│       ├── types.py                  ← TypedDict des Input et Output
│       ├── pipeline.py               ← le run() public
│       │
│       ├── parser.py                 ← modules internes
│       ├── scorer.py                 ← (libres, c'est ton métier)
│       ├── rewriter.py
│       └── exporter.py
│
├── tests/
│   ├── test_pipeline.py              ← test end-to-end avec fixtures
│   ├── test_scorer.py                ← tests unitaires des modules
│   └── fixtures/
│       ├── sample_cv.pdf
│       └── sample_offer.txt
│
└── examples/
    ├── input.json                    ← input réaliste (= contrat)
    └── output.json                   ← output attendu (= contrat)
```

## Le contrat `run()` (le seul vraiment important)

Dans `src/<package>/__init__.py` :

```python
from .pipeline import run
from .types import RunInput, RunOutput

__all__ = ["run", "RunInput", "RunOutput"]
__version__ = "0.1.0"
```

Dans `src/<package>/types.py` :

```python
from typing import TypedDict, Literal, NotRequired

class RunInput(TypedDict):
    """Tous les paramètres possibles. NotRequired = optionnel."""
    cv_url: str                         # URL signée vers le PDF du CV
    job_description: str
    language: Literal["fr", "en"]
    target_score: NotRequired[int]      # défaut: 80

class MissingSkill(TypedDict):
    name: str
    importance: Literal["low", "medium", "high"]

class RunOutput(TypedDict):
    """Format natif retourné par la logique métier.
    Le mapping vers les `blocks` du SaaS se fait dans engine/adapter.py."""
    ats_score: int                      # 0-100
    rewritten_cv_path: str              # chemin local du DOCX généré
    missing_skills: list[MissingSkill]
    matched_keywords: list[str]
    summary: str
```

Dans `src/<package>/pipeline.py` :

```python
from pathlib import Path
import requests
from .types import RunInput, RunOutput
from .parser import parse_pdf
from .scorer import compute_ats_score
from .rewriter import rewrite_cv
from .exporter import export_docx

def run(input: RunInput, *, work_dir: Path | None = None) -> RunOutput:
    """
    Point d'entrée unique. Pure logique métier.

    Args:
        input: paramètres typés (voir RunInput)
        work_dir: dossier où écrire les fichiers temporaires.
                  Si None, utilise un tempfile.mkdtemp().

    Returns:
        RunOutput avec score, fichier généré, skills manquants.

    Raises:
        ValueError: input invalide
        RuntimeError: échec d'une étape métier
    """
    work_dir = work_dir or Path("/tmp")
    work_dir.mkdir(parents=True, exist_ok=True)

    # 1. Récupère le PDF (le repo métier accepte une URL et la télécharge)
    cv_pdf = work_dir / "input_cv.pdf"
    cv_pdf.write_bytes(requests.get(input["cv_url"], timeout=30).content)

    # 2. Logique métier pure
    parsed = parse_pdf(cv_pdf)
    score = compute_ats_score(parsed, input["job_description"])
    rewritten = rewrite_cv(parsed, input["job_description"], input["language"])
    docx_path = export_docx(rewritten, work_dir / "rewritten.docx")

    return {
        "ats_score": score.value,
        "rewritten_cv_path": str(docx_path),
        "missing_skills": score.missing,
        "matched_keywords": score.matched,
        "summary": score.summary,
    }
```

## Pourquoi cette séparation est cruciale

| Si tu fusionnes métier + SaaS | Si tu sépares (cette spec) |
|---|---|
| Chaque produit devient un projet artisanal | Tu réutilises le moteur partout |
| Tester le métier nécessite tout le SaaS | `pytest` direct, sans infra |
| Changer de stack front oblige à tout réécrire | Tu réécris 1 adapter, le moteur tient |
| Vendre le moteur en standalone est impossible | Tu peux licencier le core |
| Claude voit 200k lignes de code et se perd | Claude voit ~2k lignes ciblées |

## Les 7 règles d'un repo métier portable

1. **Une seule fonction publique** : `run(input) → output`. Tout le reste est privé.
2. **Aucun I/O global** : pas de connexion DB ou de lecture de fichier au niveau module (ne charge pas un modèle ML dans `__init__.py`).
3. **Config via params ou env vars** : jamais de chemin codé en dur, jamais de clé API en dur.
4. **Inputs typés** : `TypedDict` (ou Pydantic) pour `RunInput`. Claude voit le contrat sans deviner.
5. **Outputs typés** : `RunOutput` natif au métier. Le mapping vers `blocks` reste dans le SaaS.
6. **Files via URL ou path** : le moteur reçoit une URL et télécharge, ou reçoit un `work_dir`. Il ne reçoit jamais directement un upload HTTP.
7. **Testable sans infra** : `pytest` doit passer sans Supabase, sans Stripe, sans Docker.

## `pyproject.toml` minimal

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "resumeforge-core"
version = "0.1.0"
description = "ATS scoring and CV rewriting engine"
requires-python = ">=3.11"
dependencies = [
    "openai>=1.40.0",
    "pypdf>=4.0.0",
    "python-docx>=1.1.0",
    "requests>=2.31.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "ruff>=0.6"]

[tool.hatch.build.targets.wheel]
packages = ["src/resumeforge_core"]
```

## Comment le SaaS template installe ce repo

Dans `engine/requirements.txt` du template :

```txt
# Option A : depuis GitHub (recommandé pendant le dev)
git+https://github.com/insular2895/resumeforge-core@v0.1.0

# Option B : depuis PyPI (si tu publies)
# resumeforge-core==0.1.0

# Option C : depuis un chemin local (dev rapide)
# -e ../resumeforge-core
```

Puis dans `engine/adapter.py` :

```python
from resumeforge_core import run as core_run, RunInput
from pathlib import Path

def run(payload: dict) -> dict:
    user_input = payload["input"]
    work_dir = Path(f"/tmp/job_{payload['job_id']}")

    # Cast (ou validation Pydantic) vers le type attendu par le core
    core_input: RunInput = {
        "cv_url": user_input["cv_url"],
        "job_description": user_input["job_description"],
        "language": user_input.get("language", "fr"),
    }

    # Appel pur métier
    result = core_run(core_input, work_dir=work_dir)

    # Mapping métier → blocks UI (UNIQUEMENT ici)
    return {
        "status": "success",
        "blocks": [
            {"type": "score", "title": "Score ATS", "value": result["ats_score"]},
            {"type": "list", "title": "Compétences manquantes",
             "items": [s["name"] for s in result["missing_skills"]]},
            {"type": "file", "title": "CV optimisé",
             "url": _upload_to_storage(result["rewritten_cv_path"], payload["job_id"])},
        ],
    }
```

L'adapter est **fin** : il fait le casting des paramètres et le mapping de sortie.
**Tout le reste est dans le repo métier.**

## Tests dans le repo métier

```python
# tests/test_pipeline.py
from pathlib import Path
from resumeforge_core import run

def test_pipeline_e2e(tmp_path):
    result = run({
        "cv_url": "file://" + str(Path("tests/fixtures/sample_cv.pdf").absolute()),
        "job_description": "Senior Python developer with FastAPI experience",
        "language": "fr",
    }, work_dir=tmp_path)

    assert 0 <= result["ats_score"] <= 100
    assert Path(result["rewritten_cv_path"]).exists()
    assert isinstance(result["missing_skills"], list)
```

`pytest` passe sans Docker, sans Vercel, sans rien. C'est le test que Claude doit
faire passer **avant** de toucher au SaaS template.

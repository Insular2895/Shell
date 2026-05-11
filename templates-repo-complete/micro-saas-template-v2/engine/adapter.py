"""
engine/adapter.py

LE SEUL FICHIER MÉTIER. Tu adaptes UNIQUEMENT ici par produit.

Contrat strict :
    Input  : payload dict { user_id, job_id, product_id, input: {...validated...} }
             - input a déjà été validé par run_schema_models.py côté run_engine.py
             - tu peux supposer la présence des keys requises
    Output : dict { status: "success"|"error", blocks: [...], error?: str }

⚠️ Règles non-négociables :
   - Toute exception métier devient un status: error propre + block warning
   - JAMAIS de print() ou de log avec des inputs/secrets/PII complets
   - JAMAIS d'import de app/, components/, lib/ — l'adapter est isolé
   - Pour upload un fichier : utilise upload_file() (passe par /api/upload)
   - Pour des données sensibles : ne les retourne pas dans blocks, log uniquement
     un identifiant abstrait
"""

from __future__ import annotations
import logging
import os
from typing import Any

import requests

log = logging.getLogger("adapter")

# ----------------------------------------------------------------------------
# IMPORTS DU CODE MÉTIER (depuis le repo source pip-installé)
# Tu importes ici. Tu NE recopies PAS le code.
# ----------------------------------------------------------------------------
# from playlistbrief_core.summarizer import summarize_playlist


# ----------------------------------------------------------------------------
# HELPER : upload de fichier généré
# ----------------------------------------------------------------------------
def upload_file(local_path: str, filename: str, job_id: str) -> str:
    """
    Upload un fichier local et retourne son URL signée Supabase Storage.
    À utiliser dans les blocks `file`.

    Variables d'env requises :
      - SHELL_INTERNAL_URL  : URL interne du Shell (ou https://app.example.com)
      - SHELL_SERVICE_TOKEN : token partagé Shell↔Engine
    """
    shell_url = os.environ.get("SHELL_INTERNAL_URL", "http://host.docker.internal:3000")
    service_token = os.environ.get("SHELL_SERVICE_TOKEN")
    if not service_token:
        raise RuntimeError("SHELL_SERVICE_TOKEN env var required for upload_file")

    with open(local_path, "rb") as f:
        response = requests.post(
            f"{shell_url}/api/upload",
            headers={"Authorization": f"Bearer {service_token}"},
            files={"file": (filename, f)},
            data={"job_id": job_id},
            timeout=60,
        )
    response.raise_for_status()
    return response.json()["url"]


# ----------------------------------------------------------------------------
# LA SEULE FONCTION QUE LE WORKER APPELLE
# ----------------------------------------------------------------------------
def run(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Point d'entrée unique du moteur.
    Le payload est déjà validé côté run_engine.py via run_schema_models.py.
    """
    user_input = payload["input"]  # safe (validé)
    job_id = payload["job_id"]

    try:
        # === REMPLACE LE STUB CI-DESSOUS PAR L'IMPORT RÉEL ===
        # result = summarize_playlist(
        #     url=str(user_input["playlist_url"]),
        #     depth=user_input.get("summary_depth", "rapide"),
        #     language=user_input.get("language", "fr"),
        #     include_timestamps=user_input.get("include_timestamps", True),
        # )

        # Stub de démonstration
        result = {
            "global_summary": "Résumé d'exemple. Branche `summarize_playlist` ici.",
            "video_rows": [
                ["Vidéo 1", "12:34", "Idée A, idée B"],
                ["Vidéo 2", "08:21", "Idée C"],
            ],
            "markdown_path": None,  # ex: /tmp/summary.md à uploader
        }

        # Construction des blocks de sortie
        blocks: list[dict[str, Any]] = [
            {
                "type": "text",
                "title": "Synthèse globale",
                "content": result["global_summary"],
            },
            {
                "type": "table",
                "title": "Résumé par vidéo",
                "columns": ["Vidéo", "Durée", "Idées clés"],
                "rows": result["video_rows"],
            },
        ]

        # Upload conditionnel
        if result.get("markdown_path"):
            url = upload_file(result["markdown_path"], "summary.md", job_id)
            blocks.append({
                "type": "file",
                "title": "Export Markdown",
                "url": url,
                "mime": "text/markdown",
                "filename": "summary.md",
            })

        return {"status": "success", "blocks": blocks}

    except requests.RequestException as e:
        # Erreur réseau (souvent retryable côté worker)
        log.warning("network error: %s", type(e).__name__)
        return {
            "status": "error",
            "error": "network_error",
            "blocks": [
                {
                    "type": "warning",
                    "title": "Erreur réseau",
                    "message": "Le service externe est temporairement indisponible. Réessaye dans quelques minutes.",
                    "severity": "warning",
                }
            ],
        }
    except Exception as e:
        # ⚠️ NE PAS mettre str(e) dans le block — peut leak des données
        log.exception("unexpected error: %s", type(e).__name__)
        return {
            "status": "error",
            "error": f"adapter_{type(e).__name__}",
            "blocks": [
                {
                    "type": "warning",
                    "title": "Erreur pendant le traitement",
                    "message": "Une erreur inattendue est survenue. Notre équipe a été notifiée.",
                    "severity": "critical",
                }
            ],
        }

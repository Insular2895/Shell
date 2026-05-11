"""
engine/run_schema_models.py

Modèle Pydantic pour valider STRICTEMENT les inputs côté engine.

⚠️ DOIT être maintenu en cohérence avec config/run.schema.json côté Shell.
Le Shell valide une première fois (Ajv), l'engine valide une deuxième fois
(Pydantic). Defense-in-depth : si le validateur du Shell est bypassé (bug,
direct access à l'engine), Pydantic refuse les inputs malformés ici.

Pour chaque produit, tu ré-écris ce fichier en partant de run.schema.json.
Exemple ci-dessous = PlaylistBrief (résumé YouTube).
"""

from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field, HttpUrl, field_validator, ConfigDict


# Garde-fous globaux contre DOS/abuse
MAX_STRING_LEN = 10_000


class RunInput(BaseModel):
    """Modèle d'input PlaylistBrief — adapte par produit."""

    model_config = ConfigDict(
        # Refuse les keys non déclarées (équivalent additionalProperties: false)
        extra="forbid",
        # Strip les whitespace
        str_strip_whitespace=True,
    )

    playlist_url: HttpUrl = Field(
        description="URL de la playlist YouTube",
    )
    summary_depth: Literal["rapide", "détaillé", "expert"] = Field(
        default="rapide",
        description="Profondeur du résumé",
    )
    language: Literal["fr", "en", "es"] = Field(
        default="fr",
        description="Langue du résumé",
    )
    include_timestamps: bool = Field(
        default=True,
        description="Inclure les timestamps",
    )

    @field_validator("playlist_url")
    @classmethod
    def youtube_only(cls, v: HttpUrl) -> HttpUrl:
        """Restriction au domaine youtube.com — empêche SSRF vers d'autres hosts."""
        host = v.host or ""
        if not (host == "youtube.com" or host.endswith(".youtube.com") or host == "youtu.be"):
            raise ValueError("URL must be a YouTube URL")
        return v


def validate_input(raw: Any) -> dict[str, Any]:
    """
    Point d'entrée appelé par run_engine.py.
    Retourne le dict normalisé, lève ValidationError si invalide.
    """
    if not isinstance(raw, dict):
        raise ValueError("input must be a dict")

    # Garde-fou sur taille avant de parser (anti-DOS)
    serialized = str(raw)
    if len(serialized) > 256 * 1024:
        raise ValueError("input too large")

    parsed = RunInput.model_validate(raw)
    return parsed.model_dump(mode="json")

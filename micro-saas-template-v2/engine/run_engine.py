"""
engine/run_engine.py

CLI universel. Le Shell ne connaît que cette commande :

    python run_engine.py --input /data/input.json --output /data/output.json

⚠️ Ce fichier ne devrait PAS être modifié par produit.
   Adapte uniquement adapter.py + run_schema_models.py (modèle Pydantic des inputs).

Améliorations v2 :
   - Validation Pydantic stricte des entrées (anti injection / DOS)
   - Validation stricte des sorties (status, blocks types)
   - PAS de traceback dans le output JSON (peut leak inputs/secrets)
   - Logs vers stderr uniquement, jamais dans le résultat
   - Exit codes explicites :
       0 = success
       1 = system error (mauvais args, fichier manquant)
       2 = engine returned status:error (succès du contrat, échec métier)
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("engine")


VALID_BLOCK_TYPES = {
    "text", "score", "table", "list", "file", "chart", "json", "warning", "recommendation"
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Universal engine entrypoint")
    parser.add_argument("--input", required=True, help="Path to input JSON")
    parser.add_argument("--output", required=True, help="Path to output JSON")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        log.error("input file not found")
        _write_error(output_path, "input_not_found")
        return 1

    # 1. Load input
    try:
        with input_path.open("r", encoding="utf-8") as f:
            payload = json.load(f)
    except json.JSONDecodeError:
        log.error("invalid input JSON")
        _write_error(output_path, "invalid_json")
        return 1

    # 2. Validate top-level shape
    if not isinstance(payload, dict):
        _write_error(output_path, "invalid_payload_shape")
        return 1

    for required_key in ("user_id", "job_id", "product_id", "input"):
        if required_key not in payload:
            _write_error(output_path, f"missing_{required_key}")
            return 1

    # 3. Validate input via Pydantic (defined per product in run_schema_models.py)
    try:
        from run_schema_models import validate_input  # type: ignore
        validated_input = validate_input(payload["input"])
    except ImportError:
        # Si le produit n'a pas (encore) défini ses modèles Pydantic, on continue
        # avec validation basique. À corriger pour la prod.
        log.warning("run_schema_models.py not found — running without strict validation")
        validated_input = payload["input"]
    except Exception as e:
        # ⚠️ ne JAMAIS écrire str(e) dans output.json (peut leak les inputs)
        log.error("input validation failed: %s", type(e).__name__)
        _write_error(output_path, f"validation_failed_{type(e).__name__}")
        return 1

    # Replace input by validated version (Pydantic peut avoir coerce/normalisé)
    payload["input"] = validated_input if isinstance(validated_input, dict) else (
        validated_input.model_dump() if hasattr(validated_input, "model_dump") else payload["input"]
    )

    # 4. Run adapter
    started = time.time()
    try:
        from adapter import run  # type: ignore
        result = run(payload)
    except Exception as e:
        # ⚠️ Pas de traceback dans output.json — peut contenir secrets/PII
        log.exception("adapter crashed: %s", type(e).__name__)
        _write_error(output_path, f"adapter_{type(e).__name__}")
        return 1

    duration_ms = int((time.time() - started) * 1000)

    # 5. Validate output contract
    if not isinstance(result, dict):
        log.error("adapter returned non-dict")
        _write_error(output_path, "invalid_adapter_return")
        return 1

    status = result.get("status")
    if status not in ("success", "error"):
        log.error("invalid status: %s", status)
        _write_error(output_path, "invalid_status")
        return 1

    blocks = result.get("blocks", [])
    if not isinstance(blocks, list):
        log.error("blocks must be a list")
        _write_error(output_path, "invalid_blocks")
        return 1

    for i, block in enumerate(blocks):
        if not isinstance(block, dict) or block.get("type") not in VALID_BLOCK_TYPES:
            log.error("block %d has invalid type", i)
            _write_error(output_path, f"invalid_block_type_at_{i}")
            return 1

    # 6. Add metadata
    result.setdefault("metadata", {})
    result["metadata"]["durationMs"] = duration_ms

    # 7. Write output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    log.info("done status=%s duration=%dms blocks=%d", status, duration_ms, len(blocks))
    return 0 if status == "success" else 2


def _write_error(output_path: Path, code: str) -> None:
    """
    Écrit une erreur SANS leak — uniquement un code court, pas de stack trace,
    pas d'inputs.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "status": "error",
                "error": code,
                "blocks": [
                    {
                        "type": "warning",
                        "title": "Erreur pendant le traitement",
                        "message": "Une erreur est survenue. Réessaye, ou contacte le support si ça persiste.",
                        "severity": "warning",
                    }
                ],
            },
            f,
            ensure_ascii=False,
            indent=2,
        )


if __name__ == "__main__":
    sys.exit(main())

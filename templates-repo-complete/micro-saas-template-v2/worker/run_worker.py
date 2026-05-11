"""
worker/run_worker.py

Worker EXTERNE qui consomme la queue de jobs.

Tu déploies ce script sur Fly Machines / Railway / Modal / un VPS Hetzner
avec Coolify. Il fait une boucle :

  1. POST /api/jobs/worker/claim  → reçoit un job (ou 204 = sleep)
  2. Lance engine/run_engine.py --input X --output Y
  3. POST /api/jobs/worker/complete avec le résultat

Variables d'env requises :
  - SHELL_URL                  : URL du Shell (https://app.tonproduit.com)
  - WORKER_API_TOKEN           : même token que côté Vercel env
  - WORKER_ID                  : identifiant unique (ex: hostname)
  - PRODUCT_ID                 : optionnel, pour worker mono-produit
  - LEASE_SECONDS              : default 900 (15 min)
  - POLL_INTERVAL_SECONDS      : default 5

Lancement local pour dev :
  cd worker && python run_worker.py
"""

import json
import logging
import os
import socket
import subprocess
import sys
import time
import uuid
from typing import Any, Optional

import requests

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("worker")

SHELL_URL = os.environ["SHELL_URL"].rstrip("/")
WORKER_TOKEN = os.environ["WORKER_API_TOKEN"]
WORKER_ID = os.environ.get("WORKER_ID", f"{socket.gethostname()}-{uuid.uuid4().hex[:6]}")
PRODUCT_ID = os.environ.get("PRODUCT_ID")  # None = tous les produits
LEASE_SECONDS = int(os.environ.get("LEASE_SECONDS", "900"))
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "5"))
ENGINE_PATH = os.environ.get("ENGINE_PATH", "/app/engine/run_engine.py")


def claim_job() -> Optional[dict[str, Any]]:
    """Demande un job au Shell. Retourne None si pas de job."""
    payload = {
        "worker_id": WORKER_ID,
        "lease_seconds": LEASE_SECONDS,
    }
    if PRODUCT_ID:
        payload["product_id"] = PRODUCT_ID

    r = requests.post(
        f"{SHELL_URL}/api/jobs/worker/claim",
        headers={"Authorization": f"Bearer {WORKER_TOKEN}"},
        json=payload,
        timeout=10,
    )
    if r.status_code == 204:
        return None
    if r.status_code == 401:
        log.error("invalid WORKER_API_TOKEN — exiting")
        sys.exit(1)
    r.raise_for_status()
    return r.json().get("job")


def complete_job(
    job_id: str,
    status: str,
    result: Optional[dict] = None,
    error: Optional[str] = None,
    duration_ms: Optional[int] = None,
    retryable: bool = True,
) -> None:
    """Renvoie le résultat au Shell."""
    body = {
        "job_id": job_id,
        "worker_id": WORKER_ID,
        "status": status,
        "duration_ms": duration_ms,
        "retryable": retryable,
    }
    if result is not None:
        body["result"] = result
    if error is not None:
        # On tronque l'erreur pour ne pas leak des données dans la DB
        body["error"] = (error[:500] + "...") if len(error) > 500 else error

    r = requests.post(
        f"{SHELL_URL}/api/jobs/worker/complete",
        headers={"Authorization": f"Bearer {WORKER_TOKEN}"},
        json=body,
        timeout=10,
    )
    if r.status_code == 409:
        log.warning(f"job {job_id} lease lost (probably timed out)")
        return
    r.raise_for_status()


def run_engine(job: dict[str, Any]) -> tuple[str, Optional[dict], Optional[str], int]:
    """Exécute engine/run_engine.py avec le payload. Returns (status, result, error, duration_ms)."""
    job_id = job["id"]
    payload = {
        "user_id": job["user_id"],
        "job_id": job_id,
        "product_id": job["product_id"],
        "input": job["input"],
    }

    # On écrit dans /tmp pour rester compatible read-only Docker
    work_dir = f"/tmp/job-{job_id}"
    os.makedirs(work_dir, exist_ok=True)
    input_path = f"{work_dir}/input.json"
    output_path = f"{work_dir}/output.json"

    with open(input_path, "w", encoding="utf-8") as f:
        json.dump(payload, f)

    started = time.monotonic()
    try:
        # Timeout enforcement (lease - 60s margin pour faire le complete)
        proc_timeout = max(LEASE_SECONDS - 60, 60)
        result = subprocess.run(
            [sys.executable, ENGINE_PATH, "--input", input_path, "--output", output_path],
            capture_output=True,
            text=True,
            timeout=proc_timeout,
            check=False,
        )
        duration_ms = int((time.monotonic() - started) * 1000)

        if result.returncode == 0:
            with open(output_path, "r", encoding="utf-8") as f:
                output = json.load(f)
            # Convention : exit 0 + status='success' OU exit 2 + status='error'
            if output.get("status") == "success":
                return ("success", output, None, duration_ms)
            else:
                return (
                    "error",
                    output,  # on remonte quand même les blocks (warning, etc.)
                    output.get("error", "engine_returned_error"),
                    duration_ms,
                )
        else:
            # Crash de l'engine — on logue stderr en local mais on ne le remonte
            # pas (peut contenir des secrets/PII)
            log.error(
                f"engine crashed exit={result.returncode} stderr={result.stderr[:200]}"
            )
            return (
                "error",
                None,
                f"engine_exit_{result.returncode}",
                duration_ms,
            )
    except subprocess.TimeoutExpired:
        duration_ms = int((time.monotonic() - started) * 1000)
        return ("error", None, "engine_timeout", duration_ms)
    except Exception as e:
        duration_ms = int((time.monotonic() - started) * 1000)
        # Ne pas log e directement (peut leak du payload)
        log.exception(f"unexpected worker error: {type(e).__name__}")
        return ("error", None, f"worker_{type(e).__name__}", duration_ms)


def main() -> None:
    log.info(f"worker {WORKER_ID} starting, lease={LEASE_SECONDS}s, poll={POLL_INTERVAL}s")
    consecutive_empty = 0

    while True:
        try:
            job = claim_job()
        except requests.RequestException as e:
            log.error(f"claim failed: {type(e).__name__}")
            time.sleep(min(60, POLL_INTERVAL * 2))
            continue

        if job is None:
            consecutive_empty += 1
            # Backoff progressif si rien à faire (économie réseau/CPU)
            sleep_for = min(POLL_INTERVAL * (1 + consecutive_empty // 5), 60)
            time.sleep(sleep_for)
            continue

        consecutive_empty = 0
        job_id = job["id"]
        log.info(f"claimed job={job_id} attempt={job['attempts']}")

        status, result, error, duration_ms = run_engine(job)
        log.info(f"completed job={job_id} status={status} duration={duration_ms}ms")

        try:
            # Si error_attempts >= max, on dit "non retryable" pour final-fail
            retryable = (job["attempts"] < job["max_attempts"]) and status == "error"
            complete_job(
                job_id=job_id,
                status=status,
                result=result,
                error=error,
                duration_ms=duration_ms,
                retryable=retryable,
            )
        except requests.RequestException as e:
            log.error(f"complete failed for job={job_id}: {type(e).__name__}")
            # Le lease va expirer côté Shell, le sweep cron remettra en pending


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("worker shutting down")

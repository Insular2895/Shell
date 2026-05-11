# =============================================================================
# Worker Dockerfile — multi-stage, non-root, healthcheck
#
# Build:  docker build -f worker/Dockerfile -t worker:local .
# Run :   docker run --rm \
#           -e SHELL_URL=https://app.tonproduit.com \
#           -e WORKER_API_TOKEN=xxx \
#           worker:local
#
# Le worker contient le module engine/ ET la logique de poll. C'est ce qui
# tourne sur Fly Machines / Railway / Modal pour les jobs longs.
# =============================================================================

# ---------- Stage 1 : builder ----------
FROM python:3.12-slim AS builder

WORKDIR /build

# Système : gcc seulement pour le build (pas dans final image)
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

# Wheels worker + engine
COPY worker/requirements.txt /build/worker-requirements.txt
COPY engine/requirements.txt /build/engine-requirements.txt

RUN pip install --user --no-cache-dir \
      -r /build/worker-requirements.txt \
      -r /build/engine-requirements.txt

# ---------- Stage 2 : runtime ----------
FROM python:3.12-slim

# User non-root (pas dans le shell, pas de password)
RUN groupadd -r worker && useradd -r -g worker -u 1000 -s /sbin/nologin worker

WORKDIR /app

# Copy installed packages depuis builder
COPY --from=builder /root/.local /home/worker/.local

# Copy code
COPY worker/run_worker.py /app/worker/run_worker.py
COPY engine/ /app/engine/

# Permissions
RUN chown -R worker:worker /app /home/worker

USER worker
ENV PATH="/home/worker/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENGINE_PATH=/app/engine/run_engine.py

# Healthcheck : le worker doit pouvoir parler au Shell
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import os, requests; requests.get(os.environ['SHELL_URL']+'/api/health', timeout=5).raise_for_status()" || exit 1

CMD ["python", "/app/worker/run_worker.py"]

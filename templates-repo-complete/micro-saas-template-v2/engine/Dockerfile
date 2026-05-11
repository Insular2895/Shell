# =============================================================================
# engine/Dockerfile — multi-stage, non-root, minimal
#
# Build:  docker build -t engine:local engine/
# Run:    docker run --rm --read-only \
#           -v /tmp/job-xxx:/data \
#           -e OPENAI_API_KEY=$OPENAI_API_KEY \
#           engine:local --input /data/input.json --output /data/output.json
#
# Sécurité (référence : awesome-fastapi production patterns) :
#   - Multi-stage : build deps absentes du runtime
#   - User non-root (no shell, no password, fixed UID)
#   - Slim base (python:3.12-slim, ~50MB vs ~900MB pour la full)
#   - PYTHONDONTWRITEBYTECODE pour éviter .pyc en /app (read-only friendly)
#   - HEALTHCHECK pour les orchestrateurs (Fly, Modal, k8s)
# =============================================================================

# ---------- Stage 1 : builder ----------
FROM python:3.12-slim AS builder

WORKDIR /build

# Build deps (gcc nécessaire pour pydantic-core, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dans /root/.local pour copy facile
RUN pip install --user --no-cache-dir --upgrade pip \
    && pip install --user --no-cache-dir -r requirements.txt


# ---------- Stage 2 : runtime ----------
FROM python:3.12-slim

# User non-root (pas de shell, UID fixe)
RUN groupadd -r runner && useradd -r -g runner -u 1000 -s /sbin/nologin runner

WORKDIR /app

# Copy site-packages depuis builder
COPY --from=builder /root/.local /home/runner/.local

# Code engine
COPY adapter.py run_engine.py run_schema_models.py ./

# Permissions
RUN chown -R runner:runner /app /home/runner

USER runner
ENV PATH="/home/runner/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

VOLUME ["/data"]

# Healthcheck : Python lance, syntax OK
HEALTHCHECK --interval=60s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import adapter, run_engine, run_schema_models" || exit 1

ENTRYPOINT ["python", "run_engine.py"]
CMD ["--input", "/data/input.json", "--output", "/data/output.json"]

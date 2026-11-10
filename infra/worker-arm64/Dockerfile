# Native linux/arm64 (Oracle OCI Ampere A1) & multi-arch Celery Worker / Beat
FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY packages/ ./packages/
COPY services/ ./services/

CMD ["celery", "-A", "services.worker.celery_app", "worker", "--loglevel=INFO", "--concurrency=2"]

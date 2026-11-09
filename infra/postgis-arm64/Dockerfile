# Native linux/arm64 (Oracle OCI Ampere A1) & linux/amd64 PostgreSQL 16 + PostGIS 3
FROM postgres:16-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-16-postgis-3 \
    postgresql-16-postgis-3-scripts \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

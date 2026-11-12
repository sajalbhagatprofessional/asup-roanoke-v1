# Operations, Infrastructure & VPS Deployment Guide
**Argus (v1.0) — Autonomous Asset Intelligence, Sourcing & Underwriting Platform**

---

## 1. Production Architecture Overview

The production deployment runs as a containerized native **linux/arm64** multi-service stack on an **Oracle Cloud Infrastructure (OCI) Always-Free 12 GB RAM / 4 OCPU Ampere ARM64 Ubuntu 24.04 LTS VPS**.

```mermaid
graph TD
    Client["Client Browser / AI Agent"] -->|HTTPS 443 / HTTP 80| Caddy["Caddy Auto-HTTPS Reverse Proxy"]
    Caddy -->|Reverse Proxy :3000| Web["Next.js 15 Web Container (Node 20)"]
    Caddy -->|Reverse Proxy /v1, /mcp| API["FastAPI Backend Container (Python 3.11)"]
    API -->|Port 5432| DB["PostgreSQL 16 + PostGIS Container"]
    API -->|Port 6379| Redis["Redis 7 Alpine Cache & Rate-Limiter"]
    API -->|Port 8000 MCP| MCP["MCP SSE & JSON-RPC Gateway"]
```

---

## 2. Docker Compose Production Specification (`docker-compose.prod.yml`)

The production stack is declared in [`docker-compose.prod.yml`](file:///C:/Users/sajal/OneDrive/Desktop/Project%20Asset%20Aggregator/docker-compose.prod.yml):

| Service | Container Image / Dockerfile | Platform | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`caddy`** | `caddy:2.8-alpine` | `linux/arm64` | `80:80`, `443:443` | Reverse proxy, automatic Let's Encrypt TLS, HSTS, and CSP headers. |
| **`web`** | `apps/web/Dockerfile` | `linux/arm64` | `3000` (internal) | Next.js 15 production standalone build. |
| **`api`** | Python 3.11 Bookworm | `linux/arm64` | `8000` (internal) | FastAPI server with Uvicorn workers and MCP SSE gateway. |
| **`db`** | `infra/postgis-arm64/Dockerfile` | `linux/arm64` | `5432` (internal) | PostgreSQL 16 with PostGIS 3.4 extensions and encrypted volumes. |
| **`redis`** | `redis:7-alpine` | `linux/arm64` | `6379` (internal) | Rate-limiting token bucket and circuit breaker state cache. |

---

## 3. One-Time VPS Setup on Oracle OCI ARM64

### 1. Provision Instance
- Shape: `VM.Standard.A1.Flex` (4 OCPU, 12 GB RAM, 100 GB Boot Volume).
- OS: Ubuntu 24.04 LTS (AArch64).
- Networking: Open ports `80` and `443` in the OCI Security List.

### 2. Execute Bootstrap Script
Connect via SSH and execute the automated provisioner:
```bash
# Clone the repository
git clone https://github.com/your-org/asup-roanoke-v1.git /opt/asup-roanoke-v1
cd /opt/asup-roanoke-v1

# Make script executable and run setup
chmod +x scripts/provision_oci_arm64_vps.sh
./scripts/provision_oci_arm64_vps.sh
```

### What `provision_oci_arm64_vps.sh` Does:
1. Installs Docker CE (AArch64), `docker-compose-plugin`, Python 3.11, and build essentials.
2. Configures `ufw` firewall rules (permits SSH `22`, HTTP `80`, HTTPS `443`, blocks raw database ports `5432` and `6379` from public internet).
3. Creates persistent data volumes: `/var/lib/asup/postgres`, `/var/lib/asup/redis`, `/var/lib/asup/caddy_data`.
4. Copies `.env.prod.example` to `.env.prod` with auto-generated 64-character cryptographic secrets for `JWT_SECRET_KEY` and `PII_AES_KEY`.
5. Starts the production stack via `docker compose -f docker-compose.prod.yml up -d --build`.
6. Executes database migrations in `services/api/migrations/001_initial_schema_rls.sql`.

---

## 4. CI/CD Deployment Pipeline (`.github/workflows/ci-deploy.yml`)

The GitHub Actions workflow executes on every push to `main`:
1. **Stage 1 (Air-Gap AST Check)**: Verifies `tests/unit/test_ast_airgap.py` (0 floats, 0 unapproved network imports).
2. **Stage 2 (Unit & Statutory Verification)**: Verifies SBA SOP 50 10 8.1, Va. Code § 55.1-321, and add-back auditor.
3. **Stage 3 (Integration & Security)**: Executes all 16 Milestone integration suites.
4. **Stage 4 (Roanoke Golden Suite Backtest)**: Verifies 50/50 golden deals (0 false positives, >= 95% kill rate).
5. **Stage 5 (SSH Deploy to OCI VPS)**: Connects to VPS via SSH deploy key, pulls new container images or rebuilds natively, runs migrations, and checks `GET /v1/health`.

---

## 5. Rollback Procedures (< 60 Seconds)

If any production anomaly or test regression occurs on the live VPS:

```bash
# Execute rapid rollback script to previous Git commit SHA
cd /opt/asup-roanoke-v1
./scripts/rollback_vps.sh <TARGET_COMMIT_SHA>
```

### What `rollback_vps.sh` Does:
1. Validates that the target commit SHA passes all unit tests.
2. Checks out the target SHA.
3. Performs a zero-downtime rolling container rebuild and restart.
4. Verifies `GET /v1/health` returns `{"status":"healthy"}`.
5. If health check fails within 30 seconds, automatically reverts to the starting SHA.

---

## 6. Daily Operational Procedures & Maintenance

### 1. Ingestion Pollers (Daily `06:00 EST`)
Ingestion pollers run daily at `06:00 EST` via cron or Celery worker:
```bash
python -m services.ingestion.roanoke_docket_pollers
```
- Hard-capped PACER spend: Max `$3.00/day`.
- Ingested candidates are filtered through `packages/mandate_filter/mandate_engine.py`.

### 2. Upstream Dependency Check
Check for upstream open-source releases weekly or via CLI:
```bash
python scripts/sync_upstream_dependencies.py --discover --check
```
- If updates are found, run `python scripts/sync_upstream_dependencies.py --verify-tests` before merging.

### 3. Database Backup
Automated daily PostgreSQL dump:
```bash
docker exec -t asup-db pg_dump -U asup_admin asup_db | gzip > /opt/backups/asup_db_$(date +%Y%m%d).sql.gz
```

---

## 7. Verified Production VPS Environment & Staging Holding Policy

### 1. Host Specification & Access Configuration
- **Host / IP**: `150.136.103.204`
- **Hostname**: `free-instance`
- **Operating System**: Ubuntu 24.04.5 LTS (AArch64 / Linux arm64)
- **SSH User**: `ubuntu`
- **SSH Port**: `22` (default)
- **Authentication**: SSH key only (no password login).
- **SSH Key Path (Local)**: `"C:\Users\sajal\OneDrive\Desktop\Work\Funnel Bridge\Oracle OCI\ssh-key-2026-09-02.key"`
- **Verified Host Key Fingerprint**:
  ```text
  150.136.103.204 ED25519 SHA256:ECtuMNJ4kgoOKfhADUfToly6YIOJzPWvB68UoeC6Im4
  ```
- **Control Plane**: **Coolify v4.7.5** (`http://150.136.103.204:8000`), supported by PostgreSQL 15, Redis 7, Sentinel, and Traefik v3.6.
- **Root Filesystem**: 200 GiB volume (`/dev/sda1` 193 GiB total, ~54 GiB used, ~140 GiB free, ~28% capacity).

### 2. User Preference & Deployment Policy
> [!IMPORTANT]
> **STRICT DEPLOYMENT HOLDING POLICY**:
> This VPS is designated as the **target production hosting environment** for Argus (v1.0). However, per the user's explicit instructions:
> - **DO NOT deploy or copy Argus to this VPS yet.**
> - **DO NOT create, start, or modify any containers on the VPS.**
> - **DO NOT reconfigure Coolify or Traefik proxy on the VPS.**
> - **Deployment is on HOLD until the user explicitly signals that the product is 100% complete.**

### 3. Coexisting Services Protection Invariants
When deployment is eventually authorized by the user, the following isolation boundaries must be strictly observed:
1. **LIVE MONEY PATH IS OFF-LIMITS**: Never touch `dip-ladder-orders` or `dip-ladder-state` (real-money automated trading workflows).
2. **LIVE DEMOS & WORKFLOWS**: Never stop or restart `Blackline` (`frontend`, `api`, `searxng`), `n8n` automation, `gather-store`, `vault-api`, `Hermes`, or the 14-container `Supabase` stack.
3. **OpenClaw**: Must remain disabled.
4. **Coolify-First**: Deploy Argus cleanly within Coolify as a containerized stack without introducing competing reverse proxies or interfering with Traefik (ports 80/443).

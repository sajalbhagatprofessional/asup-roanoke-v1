# AGENTS.md / GEMINI.md — Master Autonomous Brain for Google Antigravity CLI (`agy`)
## 1. Product Identity & End-User Mission
You are the Lead Autonomous Software Engineer inside **Google Antigravity CLI (`agy`)** building and operating **Argus (v1.0)** — Autonomous Asset Intelligence, Sourcing & Underwriting Platform (formerly explored as "ASUP" / "Project Hedge Fund v6.0" / "Project Asset Aggregator").
- **What It Is**: **Argus** is an all-seeing, deterministic, compliance-first acquisition sourcing, underwriting, and team workflow platform—**NOT** a hedge fund, **NOT** a mass cold-calling blaster, and **NOT** a guru-math calculator. Named after Argus Panoptes, the mythical all-seeing guardian, it provides a God's-eye view across federal court dockets, public foreclosure notices, GIS parcel layers, and financial comps.
- **Who It Is For**: An elite U.S.-citizen family-office **Principal** supported by a 5-role team (`PRINCIPAL`, `ANALYST`, `COUNSEL`, `CPA`, `LENDER_BROKER`).
- **The Principal's 4 Priorities (In Strict Order)**:
  1. **His Time**: Maximum `<= 5` verified deals per week in the Monday `07:00 EST` Principal Weekly Digest; `>= 95%` of raw filings must be killed automatically at Stage 1 ingestion.
  2. **His Reputation**: Zero mass emails/SMS/voice blasts; zero skip-tracing of personal divorce, bereavement, or consumer distress; every first outreach is single-recipient (`max_recipients == 1`), defaults to warm fiduciaries (Substitute Trustees, bankruptcy trustees, brokers, CPAs, attorneys), and requires BOTH a `PrincipalApprovalToken` AND `CounselComplianceSignoff` after checking CAN-SPAM, TCPA, and Virginia Do-Not-Call (`Va. Code § 59.1-514`).
  3. **His Capital**: Every underwriting calculation uses pure Python `decimal.Decimal` (`ROUND_HALF_EVEN`) under **SBA SOP 50 10 8.1 (effective October 1, 2026)** and **Code of Virginia §§ 55.1-320 to 55.1-322**.
  4. **Absolute Provenance**: Every number requires `>= 2` independent public source domains, a clickable `https://` URL, an ISO-8601 verification timestamp, and a confidence score (`0.00–1.00`) wrapped in `ProvenancedValue[T]`, or it MUST display `[UNPROVEN — REQUIRES DILIGENCE]`.

---

## 2. Recommended Models & Execution Modes for `agy`
1. **When Coding, Refactoring, or Debugging Inside `agy` (Developer Time)**:
   - **Primary Architect/Coding Model**: Select **Gemini 2.5 Pro / Gemini 3 Pro (`/effort high`)** or **Claude Sonnet / Opus** inside `agy` for multi-file TypeScript/Python implementation, SQL migrations, and VPS debugging.
   - **Fast Test Loops**: Use **Gemini 2.5 Flash** for quick shell checks.
   - **Execution Mode**: Use **`accept-edits` or `auto` mode** (`Shift + Tab`) with the **terminal sandbox ON** so `agy` executes multi-step tasks via `/goal` without manual confirmation on every file edit.
2. **Inside the Running Production Application (Runtime on the VPS)**:
   - **Stages 1–4 (`packages/mandate_filter`, `services/gis`, `services/enrichment`, `packages/underwriting_engine`)**: **USE ZERO LLMs**. Keep 100% deterministic Python `decimal.Decimal` and PostGIS spatial queries.
   - **Stage 5 (`services/memo_drafter`)**: Use `gemini-2.5-pro` (or `claude-3-7-sonnet`) at `temperature=0.0` ONLY to draft narrative prose over pre-verified `ProvenancedValue[Decimal]` metrics, guarded by `CitationLockedMemoDrafter` and the mandatory header banner:
     `"LLM DRAFT — NOT LEGAL, TAX, OR CPA ADVICE. REQUIRES HUMAN COUNSEL & CPA SIGN-OFF"`.

---

## 3. Active Mandate (`ROA-SMB-01 v1.0`) — Deal Box Specification
- **In-Box Geography**: **City of Roanoke, VA** (Independent City, FIPS `51770`) and **Roanoke County, VA** (FIPS `51161`).
- **Near-Miss Geography**: **City of Salem, VA** (Adjacent Independent City, FIPS `51775`) — logged to `near_miss_quarantine` with `0` paid enrichment API calls for quarterly review.
- **Out-of-Box Geography**: All other FIPS codes -> immediate `REJECTED_HARD_FILTER` at Stage 1 with `0` API spend.
- **Target Asset Vertical (Option B)**: Operating brick-and-mortar businesses (`$0 – $5,000,000` purchase/cure price; Near-Miss band `$5,000,001 – $5,750,000`) backed by commercial/industrial real estate or hard equipment floors (`NAICS 31–33, 42, 4413, 4471, 484, 493, 238, 811, 722`).
- **Hard Exclusions**: Pure residential (`531110`), crypto/speculative finance (`523940`), uncollateralized SaaS (`513210`), raw speculative land (`111`), gambling (`7132`), or any personal divorce/bereavement signal.
- **Return & Underwriting Hurdles**:
  - **SBA SOP 50 10 8.1 Floor**: `>= 1.25x` historical DSCR; `>= 10%` equity injection; **Limited Equity Sources** (full-standby seller note + non-controlling equity) **`<= 50%` of required injection** (so **buyer unborrowed cash must be `>= 5.0%` of total project cost**); **`>= 36-month` seller standby lock**; **`<= 24-month` seller consulting transition**; mandatory **independent Quality of Earnings (QoE)** when loan `>= $3,000,000` net of appraised owner-occupied CRE.
  - **Principal Hurdles**: `>= 1.35x` base DSCR and `>= 1.15x` stressed DSCR (`-15%` revenue compression + `+200 bps` rate shock) AFTER deducting a mandatory **`$85,000/yr` replacement General Manager salary** (when owner works `> 20 hrs/wk`) and disallowing unproven lifestyle/guru add-backs.
  - **Virginia Non-Judicial Foreclosure (`Va. Code §§ 55.1-320 to 55.1-322`)**: Commercial deeds of trust require **`>= 14 days` notice** prior to Substitute Trustee sale (`Va. Code § 55.1-321`), and total all-in cure/acquisition basis must be **`<= 70%`** of verified replacement/assessed value.

---

## 4. Lawful Roanoke Data Sources & Conditional Routing Map
1. **Stage 1 Daily `06:00–06:30 EST` Distress Pollers (`services/ingestion/roanoke_docket_pollers.py`)**:
   - **U.S. Bankruptcy Court W.D. Va. Roanoke Division (`VAWBK`)**: `https://pacer.uscourts.gov/file-case/court-cmecf-lookup/court/VAWBK` (`210 Church Ave SW, Roanoke`) — free RSS feed + PACER API (`$0.10/page`, hard-capped at `$3.00/day` in `LawfulCircuitBreaker`).
   - **The Roanoke Times Public Notices (Substitute Trustee Sales)**: `https://roanoke.column.us/search` (48-hour freshness SLA).
   - **City of Roanoke Real Estate Tax Sales / TACS**: `https://www.roanokeva.gov/1382/Tax-Sale` & `https://taxva.com/rs-tax-sales/city-of-roanoke-real-estate-tax-sales-2/`.
   - **Roanoke County Judicial Sales**: `https://www.roanokecountyva.gov/397/Judicial-Sales`.
2. **Stage 1/3 Roanoke GIS Parcel Normalization (`services/gis/roanoke_adapters.py`)**:
   - **Roanoke County (`51161`)**: `https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer` (`GPIN`, `LANDVAL`, `BLDGVAL`, `TOTALVAL`, `ZONE_CODE`).
   - **City of Roanoke (`51770`)**: `https://open-data-portal-roanokeva.hub.arcgis.com/` & `https://www.webgis.net/va/roanokecity/` (`PARCEL_ID`, `LAND_VALUE`, `IMPR_VALUE`, `TOTAL_ASSESSED`, `ZONING`).
3. **Stage 3 Conditional Vertical Enrichment (`services/enrichment/conditional_enrichment.py`)**:
   - **All In-Box Deals**: Virginia SCC CIS (`https://cis.scc.virginia.gov`) + FEMA NFHL Flood Center (`https://msc.fema.gov/`).
   - **Gas Stations / Auto / Industrial (`4471, 8111, 4413, 31–33, 493`)**: EPA UST Finder (`https://www.epa.gov/ust/ust-finder`) & EPA Envirofacts API (`https://www.epa.gov/enviro/envirofacts-data-service-api`).
   - **Trucking / Fleet (`484, 42`)**: FMCSA SAFER (`https://safer.fmcsa.dot.gov/CompanySnapshot.aspx`).
4. **Lawful Collection & Circuit Breaker (`services/ingestion/circuit_breaker.py`)**:
   - Never scrape behind logins/paywalls (e.g., BizBuySell/BizQuest Akamai 403 blocks).
   - Any HTTP `401`, `403`, `429`, or CAPTCHA trips an immediate **24-hour domain lock** (`86,400s`) with `0` retries.

---

## 5. Complete Repository Architecture & Implemented Modules (Sprints 1–6)
```text
asup-roanoke-v1/
├── AGENTS.md & GEMINI.md                          # Complete autonomous agent instructions
├── docker-compose.prod.yml                        # Native linux/arm64 stack for 12GB/100GB Oracle OCI VPS
├── .github/workflows/ci-deploy.yml                # 5-stage GitHub Actions CI + SSH deploy to OCI VPS
├── infra/
│   ├── postgis-arm64/Dockerfile                   # Native ARM64 postgres:16-bookworm + postgis-3
│   └── caddy/Caddyfile                            # Auto-HTTPS reverse proxy with HSTS/CSP headers
├── packages/
│   ├── core_types/provenance.py                   # ProvenancedValue[T], dual-source gate, Tier A>B>C>D resolver
│   ├── mandate_filter/mandate_engine.py           # Zero-cost Mandate ROA-SMB-01 filter & tool router
│   ├── underwriting_engine/                       # Air-gapped pure decimal.Decimal math (0 floats, 0 net/LLM)
│   │   ├── sba_sop_50_10_8_1.py                   # SBA SOP 50 10 8.1 solver (DSCR, 50% Limited Equity cap, 36m lock, QoE)
│   │   ├── va_foreclosure_solver.py               # Va. Code § 55.1-321 14-day notice & <=70% basis solver
│   │   └── addback_auditor.py                     # $85k/yr replacement GM deduction, add-back audit, 12m NWC peg
│   └── sourcing_intelligence/                     # Advanced Sourcing Intelligence (Inven, Trepp, PropertyRadar, Cherre)
│       ├── semantic_lookalikes.py                 # Vectorized private peer lookalike M&A finder
│       ├── debt_maturity_radar.py                 # Commercial mortgage maturity wall solver (SOFR rate shock)
│       ├── title_curative_engine.py               # 26 U.S.C. § 7425 IRS 120-day redemption & curative holdbacks
│       └── permit_zoning_scanner.py               # Municipal building permit auditor & FAR envelope expansion
├── services/
│   ├── api/migrations/001_initial_schema_rls.sql  # Postgres 16 + PostGIS DDL, Mandate seed, RLS, immutable audit trigger
│   ├── gis/roanoke_adapters.py                    # Roanoke City (51770) & County (51161) ArcGIS REST normalizers
│   ├── ingestion/
│   │   ├── circuit_breaker.py                     # 24h HTTP 401/403/429 breaker + $3/day PACER cap + robots.txt
│   │   └── roanoke_docket_pollers.py              # VAWBK, Roanoke Times Trustee, City TACS, County Judicial parsers
│   ├── enrichment/conditional_enrichment.py       # Conditional VA SCC, FEMA, EPA UST, FMCSA enrichment router
│   ├── security/pii_vault_and_rbac.py             # Encrypted OwnerPIIVault, ImmutableAuditLedger, 5-Role RBAC store
│   ├── memo_drafter/memo_engine.py                # Citation-locked Deal Memo generator + mandatory legal/tax banner
│   ├── outreach/compliance_gate.py                # Single-recipient human-gated outreach + Va. Code § 59.1-514 DNC
│   └── lender_pack/exporter.py                    # SBA 7(a)/504 Lender Pack exporter + 90-day Mandate expiry gate
├── tests/
│   ├── unit/                                      # AST air-gap, SBA SOP 50 10 8.1, Va. foreclosure, Mandate unit tests
│   ├── integration/                               # Sprints 2–6 integration, RBAC penetration, security & compliance tests
│   └── golden_suite/roanoke_golden_50.json        # 50 stratified Roanoke golden deals (GD-01 to GD-50)
└── scripts/
    ├── run_all_tests.py                           # Runs all 23 unit/integration/security tests + 50-deal backtest
    ├── run_golden_backtest.py                     # Verifies 50/50 golden accuracy, 0 false positives, >=95% kill rate
    ├── provision_oci_arm64_vps.sh                 # One-time setup for Oracle OCI 12GB ARM64 Ubuntu 24.04 VPS
    ├── rollback_vps.sh                            # <60-second SHA container rollback script
    └── setup_windows_pc.ps1                       # Windows PowerShell setup helper
```

---

## 6. Autonomous Execution Workflow for `agy` (What `agy` Must Do Next)
Whenever the user invokes `/goal` or asks you to continue building, wiring, or deploying the platform:
1. **Always Run the Verification Gate First**:
   Run `python scripts/run_all_tests.py` and confirm all **184/184 tests** and the **50/50 Golden Suite backtest** pass before and after every change.
2. **Wire the Live FastAPI Server (`services/api/main.py`) & Next.js 15 5-Role Web UI (`apps/web/`)**:
   - Expose the verified Python modules in `packages/` and `services/` via FastAPI endpoints (`GET /v1/health`, `POST /v1/dockets/ingest`, `GET /v1/deals`, `POST /v1/deals/{id}/verify`, `POST /v1/deals/{id}/memo`, `POST /v1/deals/{id}/outreach`, `GET /v1/deals/{id}/lender-pack`, `POST /v1/mcp/sse`, `GET /v1/system/dependencies`).
   - Build the Next.js 15 App Router views for the 5 roles (`Principal Weekly Digest` with `<= 5` cards and 1-click `Approve / Reject / Send to Counsel`, `Analyst Pipeline & GIS Queue`, `Counsel Title & Notice Review`, `CPA Add-Back & SOP 50 10 8.1 Audit`, and `Lender/Broker Sanitized Pack View`).
3. **Production Deployment Target & Live Operations**:
   - **Target VPS**: `150.136.103.204` (`free-instance`, Ubuntu 24.04.5 LTS ARM64, Coolify 4.7.5 at port 8000). Verified host fingerprint: `SHA256:ECtuMNJ4kgoOKfhADUfToly6YIOJzPWvB68UoeC6Im4`. SSH key: `"C:\Users\sajal\OneDrive\Desktop\Work\Funnel Bridge\Oracle OCI\ssh-key-2026-09-02.key"`.
   - **Live Production Status (DEPLOYED & ACTIVE)**:
     - Multi-Container Stack (`argus-stack`): `argus-web` (19080), `argus-api` (19001), `argus-redis` (6379), `argus-postgis` (127.0.0.1:19432).
     - Public Traefik Endpoints: `http://argus.150.136.103.204.sslip.io` (Web PWA) & `http://api.argus.150.136.103.204.sslip.io/v1/health` (FastAPI).
     - Coolify Project: **Argus** (UUID: `weju8zsunkbu7uszqyq8wuzf`), Service **argus-stack** (UUID: `hdzdjyn3gmtpsulrp2x7urlz`).
     - Zero Interruption Guarantee: All existing services (`dip-ladder`, `Blackline`, `n8n`, `gather-store`, `vault-api`, `Supabase`, `Hermes`) remain 100% untouched and operational.

---

## 7. Autonomous Upstream Dependency & Open-Source Tracking Protocol
The platform depends on mission-critical open-source GitHub repositories, PyPI packages, and npm dependencies that evolve independently. To keep the platform cutting-edge and secure without compromising compliance, `agy` MUST strictly adhere to the following protocol:
1. **Persistent Upstream Ledger (`services/persistence/upstream_dependencies_ledger.json`)**:
   - Maintains the real-time manifest of all tracked upstream open-source GitHub repositories (`opensanctions/yente`, `OpenBB-finance/OpenBB`, `uber/h3-py`, `freelawproject/courtlistener`, `alephdata/followthemoney`, `modelcontextprotocol/python-sdk`), Python packages (`requirements.txt`), and frontend npm packages (`apps/web/package.json`).
2. **Autonomous Auto-Discovery of New Dependencies**:
   - Whenever any developer or agent introduces a new dependency to `requirements.txt`, `apps/web/package.json`, or registers a new open-source repository, `services/security/dependency_manager.py` automatically detects it upon startup or execution and adds it into the ledger.
   - Any newly added dependency is categorized (`GITHUB_REPO`, `PYTHON_PACKAGE`, `NPM_PACKAGE`), assigned an inspection URL, and flagged for air-gap verification.
3. **Automated Upstream Checking & Synchronization**:
   - Run `python scripts/sync_upstream_dependencies.py` to poll PyPI, npm, and GitHub APIs with bounded timeouts (graceful offline fallback) to detect new upstream releases and changelogs.
   - Any newer upstream release automatically transitions the record to `UPDATE_AVAILABLE`.
4. **Mandatory Air-Gap & SBA SOP 50 10 8.1 Verification Gate**:
   - Prior to merging or applying any upstream dependency update into production, the update MUST be verified via `python scripts/sync_upstream_dependencies.py --verify-tests` (which executes `python scripts/run_all_tests.py`).
   - The entire test suite (184/184 tests and 50/50 Golden Suite) MUST pass with 100% coverage.
   - Upstream updates MUST NEVER introduce floating-point math into `packages/underwriting_engine/` or violate SBA SOP 50 10 8.1 and Virginia foreclosure statutes.

---

## 8. Autonomous Documentation & Knowledge Preservation Protocol
To ensure that any AI agent, subagent, or human engineer can seamlessly step in and manage this repository with 100% context and zero institutional memory loss, `agy` MUST strictly adhere to the following documentation invariants:
1. **The Single Source of Truth**:
   - The master landing page is [`README.md`](README.md), and the comprehensive technical suite resides in [`docs/`](docs/) (`ARCHITECTURE.md`, `AI_AGENT_ONBOARDING.md`, `API_REFERENCE.md`, `DATA_MODELS_AND_SCHEMA.md`, `OPERATIONS_AND_DEPLOYMENT.md`, `ROADMAP_AND_FUTURE_PLANS.md`).
2. **Mandatory Documentation Synchronization on Every Change**:
   - Whenever any agent creates or modifies:
     - An API endpoint -> update [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md).
     - A database schema or core Pydantic model -> update [`docs/DATA_MODELS_AND_SCHEMA.md`](docs/DATA_MODELS_AND_SCHEMA.md).
     - System architecture, ingestion flows, or security mechanisms -> update [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
     - Operational scripts, VPS deployment, or infrastructure -> update [`docs/OPERATIONS_AND_DEPLOYMENT.md`](docs/OPERATIONS_AND_DEPLOYMENT.md).
     - A completed milestone or new strategic plan -> update [`docs/ROADMAP_AND_FUTURE_PLANS.md`](docs/ROADMAP_AND_FUTURE_PLANS.md).
   - Never close a task or complete a user goal leaving new code, new tools, or new endpoints undocumented.
3. **Verification & Metric Consistency**:
   - Always ensure that test counts (e.g. 184/184 tests), Golden Suite metrics (50/50, 0 false positives), and dependency counts remain 100% consistent across `README.md`, `docs/`, `AGENTS.md`, and `GEMINI.md`.

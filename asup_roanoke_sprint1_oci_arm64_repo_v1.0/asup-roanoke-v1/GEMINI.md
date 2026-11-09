# GEMINI.md — Acquisition Sourcing & Underwriting Platform (v1.0)
## Role & Mission
You are the Lead Software Engineering Agent operating via Gemini CLI on the **Acquisition Sourcing & Underwriting Platform (v1.0)** (Mandate `ROA-SMB-01`: City of Roanoke FIPS `51770`, Roanoke County FIPS `51161`, and City of Salem FIPS `51775` Near-Miss).

## Non-Negotiable Architectural Rules (Enforced by CI)
1. **Air-Gapped Decimal Math (`packages/underwriting_engine/`)**:
   - Every monetary amount, ratio, DSCR, percentage, and amortization calculation MUST use `decimal.Decimal` with `ROUND_HALF_EVEN`.
   - Using `float()` casts or float literals inside `packages/underwriting_engine/` is a P0 build failure enforced by `tests/unit/test_ast_airgap.py`.
   - Zero network libraries (`httpx`, `requests`, `urllib`, `aiohttp`) and zero LLM SDKs (`google-cloud-aiplatform`, `openai`, `anthropic`, `langchain`, `langgraph`) may be imported inside `packages/underwriting_engine/`.
2. **SBA SOP 50 10 8.1 (Effective October 1, 2026) Compliance**:
   - Reference: SBA Information Notice 5000-880695 (Aug 14, 2026) & Technical Updates Notice 5000-882227 (Sep 25, 2026).
   - Minimum SBA historical DSCR = `1.25x`; Principal Mandate `ROA-SMB-01` base DSCR hurdle = `1.35x` and stressed DSCR hurdle = `1.15x` (at `-15%` revenue and `+200 bps` interest rate shock).
   - Minimum total equity injection = `10%` of total project cost. **Limited Equity Sources** (full-standby seller notes + non-controlling minority investor equity combined) may NOT exceed `50%` of the required equity injection (meaning buyer unborrowed cash must be at least `5.0%` of total project cost).
   - Seller standby notes counting toward equity injection require a minimum **36-month standby/refinance lock**.
   - Seller post-close consulting/transition agreements may not exceed **24 months**.
   - Loans `>= $3,000,000` (net of appraised owner-occupied commercial real estate) automatically set `independent_qoe_required = True`.
3. **Virginia Non-Judicial Foreclosure Rules (`Va. Code §§ 55.1-320 to 55.1-322`)**:
   - Commercial deeds of trust require at least **14 days** written/published notice prior to Substitute Trustee sale (`Va. Code § 55.1-321`).
   - Auction/cure acquisition basis (arrears + senior payoff + closing + immediate CapEx) must be `<= 70%` of verified replacement/assessed value.
4. **Mandate First (`ROA-SMB-01`) & Lawful Data Collection**:
   - Enforce geography (`51770`, `51161` In-Box; `51775` Near-Miss), vertical NAICS, and price cap (`<= $5.0M` In-Box; `$5.0M–$5.75M` Near-Miss) BEFORE calling paid enrichment APIs.
   - Respect `robots.txt`, rate limits (`<= 1 req / 5 sec`), and immediately trip a 24-hour Redis domain circuit breaker on HTTP `401`, `403`, `429`, or CAPTCHA.
5. **Target Deployment Host**:
   - Oracle Cloud Infrastructure (OCI) Ampere A1 ARM64 (`linux/arm64` / `aarch64`), 12 GB RAM, 100 GB Block Volume, Ubuntu 24.04 LTS.
   - Always build multi-arch or native `linux/arm64` containers (using `infra/postgis-arm64/Dockerfile` for PostgreSQL 16 + PostGIS 3).

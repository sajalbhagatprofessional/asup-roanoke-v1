# REST API & Model Context Protocol (MCP) Reference
**Argus (v1.0) — Autonomous Asset Intelligence, Sourcing & Underwriting Platform**

---

## 1. Overview & Authentication

- **Platform Name**: Argus Platform API
- **Base URL**: `http://127.0.0.1:8000` (Local) / `https://argus.internal` (Production VPS)
- **Content-Type**: `application/json`
- **Authentication**:
  - **User Endpoints**: Bearer JWT token in `Authorization: Bearer <token>` header (or mock development bypass).
  - **Developer & AI Agent Gateway (MCP)**: `X-API-Key: <key>` header or query parameter `?api_key=<key>`.
- **5-Role RBAC Model**:
  - `PRINCIPAL`: Strategic review, approval tokens, executive digest access.
  - `ANALYST`: Pipeline management, raw distress filing ingestion, parcel inspection.
  - `COUNSEL`: Title examination, non-judicial foreclosure notice audit, legal outreach sign-off.
  - `CPA`: Add-back audit, replacement GM salary verification, SBA SOP 50 10 8.1 calculation audit.
  - `LENDER_BROKER`: Sanitized deal packages, debt-service coverage verification (PII redacted).

---

## 2. Health & System Status

### `GET /v1/health`
Returns system uptime, active mandate info, circuit breaker lock count, and database health.
- **Request**: No parameters.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-11-12T16:00:00Z",
  "active_mandate": "ROA-SMB-01",
  "circuit_breaker_locks": 0,
  "database": "connected"
}
```

---

## 3. Core Sourcing, Underwriting & Deal Pipeline

### `POST /v1/dockets/ingest`
Ingests raw court filings, tax auction listings, or trustee notices into the zero-cost mandate gate.
- **Role Required**: `ANALYST` or `PRINCIPAL`.
- **Request Body**:
```json
{
  "court_or_source_id": "VAWBK",
  "case_number": "7:26-bk-01422",
  "filing_date": "2026-11-10",
  "debtor_or_owner_name": "Star City Machine & Tool Works LLC",
  "fips_code": "51770",
  "raw_address": "1420 3rd St SE, Roanoke, VA 24013",
  "naics_code": "332710",
  "estimated_claim_or_tax_due": 450000.00,
  "estimated_collateral_value": 1850000.00
}
```
- **Response `200 OK`**:
```json
{
  "filing_id": "filing-7-26-bk-01422",
  "mandate_decision": "PASS",
  "fips_status": "IN_BOX_ROANOKE_CITY",
  "naics_status": "TARGET_MANUFACTURING",
  "deal_candidate_id": "deal-roa-332710-001"
}
```

### `GET /v1/deals`
Retrieves deal candidates filtered by role, stage, geography, NAICS, DSCR, and basis ratio.
- **Query Parameters**:
  - `role` (default: `ANALYST`): Current user role.
  - `stage`: Filter by pipeline stage (`ALL`, `INGESTED`, `ENRICHED`, `UNDERWRITTEN`, `APPROVED`, `OUTREACHED`).
  - `fips_code`: Filter by FIPS (e.g. `51770`, `51161`).
  - `naics_prefix`: Filter by 2-4 digit NAICS (e.g. `33`, `4471`, `811`).
  - `min_base_dscr`: Minimum base debt-service coverage ratio (e.g. `1.25`, `1.35`).
  - `max_basis_ratio`: Maximum cure basis / replacement value ratio (e.g. `0.70`).
  - `has_cre`: Boolean flag for commercial real estate backing (`true`/`false`).
  - `q`: Full-text search string.
  - `sort_by`: Sort field (`dscr_desc`, `basis_asc`, `date_desc`, `price_asc`).
- **Response `200 OK`**: Array of `Deal` objects.

### `POST /v1/deals/{id}/verify`
Executes dual-source provenance verification on a candidate deal, validating against county GIS and Virginia SCC CIS.
- **Response `200 OK`**:
```json
{
  "deal_id": "deal-roa-332710-001",
  "is_dual_source_verified": true,
  "source_domains": ["arcgis.roanokeva.gov", "cis.scc.virginia.gov"],
  "provenance_confidence": 0.95
}
```

### `POST /v1/deals/{id}/memo`
Generates a citation-locked deal memo via LLM (`temperature=0.0`) strictly bound to verified metrics.
- **Response `200 OK`**:
```json
{
  "deal_id": "deal-roa-332710-001",
  "memo_markdown": "# DEAL MEMO: Star City Machine & Tool Works LLC\n\n> [!CAUTION]\n> LLM DRAFT — NOT LEGAL, TAX, OR CPA ADVICE. REQUIRES HUMAN COUNSEL & CPA SIGN-OFF...",
  "generated_at": "2026-11-12T16:05:00Z",
  "citations": [
    {"metric": "Historical DSCR", "value": "1.38x", "url": "https://arcgis.roanokeva.gov/..."}
  ]
}
```

### `POST /v1/deals/{id}/outreach`
Dispatches a single-recipient outreach draft to a warm fiduciary after validating compliance tokens and DNC rules.
- **Request Body**:
```json
{
  "fiduciary_recipient": "Substitute Trustee John Doe, Esq.",
  "recipient_email": "jdoe@roanokelegal.com",
  "principal_approval_token": "pat_20261112_01",
  "counsel_compliance_signoff": "ccs_20261112_01"
}
```
- **Response `200 OK`**: Outreach dispatched or queued in compliance ledger.

### `GET /v1/deals/{id}/lender-pack`
Generates an SBA 7(a)/504 lender package bundle with debt-service coverage schedules and collateral exhibits.
- **Response `200 OK`**: Complete lender package JSON bundle.

---

## 4. Aladdin Institutional Analytics Endpoints

### `POST /v1/deals/{id}/waterfall`
Solves a multi-tier private equity institutional cash-flow waterfall (LP Preferred Return, GP Catch-Up, Tier 1/2 Splits).
- **Request Body**:
```json
{
  "unlevered_cash_flows": [500000, 650000, 750000, 850000, 4200000],
  "lp_equity_injection": 1000000,
  "gp_equity_injection": 100000,
  "preferred_return_pct": 8.0,
  "catchup_pct": 50.0,
  "tier1_split_lp": 80.0,
  "tier1_split_gp": 20.0
}
```
- **Response `200 OK`**: LP/GP cash flow distributions, net IRR, and MOIC multiples.

### `GET /v1/deals/{id}/liquidation-floor`
Calculates Forced Liquidation Value (FLV) and Orderly Liquidation Value (OLV) floor under distressed fire-sale conditions.
- **Response `200 OK`**:
```json
{
  "deal_id": "deal-roa-332710-001",
  "orderly_liquidation_value_usd": 1295000.00,
  "forced_liquidation_value_usd": 925000.00,
  "purchase_price_usd": 650000.00,
  "flv_coverage_ratio": 1.42,
  "is_fully_covered_by_floor": true
}
```

### `GET /v1/deals/{id}/roll-up-clusters`
Resolves regional density of complementary NAICS businesses for add-on tuck-in acquisitions using Uber H3 hexagonal indexing.
- **Response `200 OK`**: Cluster density, centroid H3 hexes, and synergistic valuation multiple arbitrage.

### `GET /v1/deals/{id}/institutional-scorecard`
Generates a 100-point institutional scoring matrix spanning Financial Health, Collateral Margin, Regulatory Risk, and Aladdin Risk Score.
- **Response `200 OK`**: Total score (0-100), risk band, and approval recommendation.

---

## 5. Universal Multi-Asset & OSINT Engine

- `GET /v1/assets/search`: Search universal multi-asset registry (SMBs, Real Estate, Heavy Equipment, Non-Performing Notes).
- `GET /v1/assets/{id}/dossier`: Comprehensive 360-degree intelligence dossier for an asset.
- `POST /v1/assets/{id}/stage`: Update asset CRM pipeline stage (`NEW_DISCOVERY`, `PRELIMINARY_DILIGENCE`, `UNDERWRITING`, `LOI_ISSUED`, `UNDER_CONTRACT`, `CLOSED`).
- `POST /v1/assets/{id}/osint`: Run autonomous agentic open-source intelligence investigation.
- `POST /v1/assets/{id}/outreach-playbook`: Generate tailored fiduciary outreach playbooks for attorneys, trustees, or brokers.
- `GET /v1/user/preferences` & `POST /v1/user/preferences`: Retrieve and save user-customized search and investment criteria.

---

## 6. Nationwide Sovereign Scrapers

- `GET /v1/scrapers/status`: Status of 94 Federal CM/ECF bankruptcy district scrapers, 50-state press portals, and national auction platforms.
- `POST /v1/scrapers/scan`: Triggers a polite, rate-limited harvesting run across sovereign feeds.

---

## 7. Model Context Protocol (MCP) AI Agent Gateway

The platform exposes an Anthropic Model Context Protocol (MCP 2024-11-05) gateway allowing Claude Desktop, Hermes, OpenClaw, or Copilot agents to inspect and underwrite deals autonomously.

- **SSE Endpoint**: `GET /mcp/sse`
- **JSON-RPC Message Endpoint**: `POST /mcp/messages`
- **Claude Desktop Configuration**: `GET /v1/developer/mcp/config`
- **API Keys**: `GET /v1/developer/api-keys`, `POST /v1/developer/api-keys`, `DELETE /v1/developer/api-keys/{id}`

### Supported MCP Tools:
1. `search_deals_and_assets`: Queries nationwide operating businesses, CRE, tax liens, and equipment fleets.
2. `get_asset_dossier`: Retrieves full 360-degree institutional intelligence dossier and downside floor.
3. `get_spatial_digital_twin`: Retrieves God's Eye 3D extruded parcel boundary, rooftop HVAC, and FEMA elevation clearance.
4. `underwrite_sba_sop_50_10_8_1`: Executes air-gapped deterministic SBA SOP 50 10 8.1 solver (1.25x DSCR, 50% cap, 36m lock, QoE).
5. `audit_addbacks_and_qoe`: Deducts mandatory $85k/yr GM salary and disallows unproven lifestyle add-backs.
6. `evaluate_sec_edgar_arbitrage`: Calculates multiple expansion arbitrage against public SEC comps.
7. `screen_yente_aml_kyc`: Screens entities and beneficial owners against global sanctions and PEP databases.
8. `run_openbb_macro_sofr_stress`: Evaluates multi-scenario SOFR interest rate shock matrices.
9. `parse_unstructured_tax_return`: OCR parser for IRS Form 1040 Schedule C / Form 1120-S with automatic add-back audit.
10. `generate_fiduciary_outreach_playbook`: Compliant single-recipient correspondence for succession buyouts.
11. `manage_kanban_crm_stage`: Updates deal progression in the institutional Kanban pipeline.
12. `evaluate_asset_physical_health`: Augury-inspired 5-engine physical asset health solver (0-100 score, Physical Risk Grade A-F).
13. `parse_equipment_schedule_docling`: Docling table parser for yellow-iron machinery, hours, and failure risks.
14. `run_aerial_facility_sentinel`: TorchGeo satellite sentinel for roof albedo, replacement cost, and yard fleet occupancy.
15. `predict_machinery_capex_reserve`: Darts time-series model forecasting Year 1-3 capex and testing SBA 1.25x DSCR stress breach.
16. `audit_maintenance_ledger_cleanlab`: Cleanlab data-centric audit flagging personal commingled expenses and phantom write-offs.

---

## 8. Upstream Dependency Management & Air-Gap Sentinel

- `GET /v1/system/dependencies`: Retrieves high-level breakdown and real-time ledger of all 34 tracked open-source repositories and packages.
- `POST /v1/system/dependencies/check-updates`: Triggers auto-discovery and polls PyPI, npm, and GitHub APIs for new upstream releases.
- `POST /v1/system/dependencies/verify-tests`: Executes `python scripts/run_all_tests.py` and returns pass/fail metrics, guaranteeing zero float drift.

---

## 9. User Authentication & Identity Management

- `POST /v1/auth/signup`: User registration with email verification token dispatch.
- `POST /v1/auth/signin`: Password authentication returning JWT access token.
- `POST /v1/auth/verify-email`: Activates user account with verification token.
- `POST /v1/auth/forgot-password`: Generates secure password reset token.
- `POST /v1/auth/reset-password`: Resets user password.
- `GET /v1/auth/me`: Retrieves currently authenticated user profile and permissions.
- `GET /v1/auth/oauth-providers`: Returns configuration for Google and Microsoft OAuth2 providers.

---

## 10. Augury-Inspired Physical AssetHealth™ Intelligence

- `GET /v1/assets/{asset_id}/health-score`: Computes composite physical health score (0-100), Physical Risk Grade (`GRADE_A` through `GRADE_F`), deferred capex, and recommended seller escrow holdback.
- `POST /v1/assets/{asset_id}/parse-equipment-schedule`: Docling-inspired table parser converting PDF/markdown equipment lists into structured records with RUL % and failure risks.
- `POST /v1/assets/{asset_id}/aerial-facility-scan`: TorchGeo-inspired aerial sentinel analyzing satellite roof condition, surface area, and yard logistics occupancy.
- `POST /v1/assets/{asset_id}/predict-capex-reserve`: Darts-inspired time-series machinery degradation model computing Year 1-3 mandatory capex and testing SBA 1.25x DSCR stress breach.
- `POST /v1/assets/{asset_id}/audit-maintenance-ledger`: Cleanlab-inspired data-centric audit flagging personal commingled expenses (boats, golf carts, luxury travel) and phantom tooling write-offs.

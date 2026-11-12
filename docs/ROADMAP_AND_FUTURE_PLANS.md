# Product Roadmap, Historical Milestones & Strategic Evolution
**Argus (v1.0) — Autonomous Asset Intelligence, Sourcing & Underwriting Platform**

---

## 1. Executive Summary & Delivery Trajectory

**Argus** has evolved through 16 rigorous engineering milestones, transforming from a localized distress tracker into an institutional-grade, multi-asset acquisition and underwriting engine.

```mermaid
timeline
    title Platform Engineering Milestones (1-16)
    section Sprints 1-4 : Core Engine & Compliance
        Milestone 1 : AST Air-Gap Math & SBA SOP 50 10 8.1
        Milestone 2 : Virginia Foreclosure & Docket Ingestion
        Milestone 3 : AES-256 PII Vault & Merkle Audit
        Milestone 4 : Citation-Locked Memo Drafter
    section Sprints 5-8 : Pipeline, GIS & Aladdin
        Milestone 5 : Regional Expansion & ApiAnything
        Milestone 6 : Multi-Faceted Deal Filtering
        Milestone 7 : Nationwide Mandate Wizard
        Milestone 8 : Source Connectivity Tracker
    section Sprints 9-12 : Multi-Asset & Scrapers
        Milestone 9 : Aladdin Institutional Waterfall & FLV Floor
        Milestone 10 : Universal Multi-Asset Aggregator & OSINT
        Milestone 11 : User Auth & Identity Management
        Milestone 12 : Nationwide Sovereign Scrapers
    section Sprints 13-16 : AI Agents & Upstream Sentinel
        Milestone 13 : RECAP CourtListener & 3D Spatial Twin
        Milestone 14 : Five Aladdin Institutional Engines
        Milestone 15 : Anthropic Model Context Protocol (MCP)
        Milestone 16 : Upstream Dependency Sentinel & Apple HIG
```

---

## 2. Completed Milestones (Ledger of Record)

### Milestone 1: Pure Decimal Underwriting & AST Air-Gap
- **Delivered**: `packages/underwriting_engine/sba_sop_50_10_8_1.py` and `tests/unit/test_ast_airgap.py`.
- **Key Features**: Pure Python `decimal.Decimal` calculations (`ROUND_HALF_EVEN`), zero floating-point math, 1.25x DSCR floor, 10% equity injection, 50% limited equity cap, 36-month standby lock, <=24-month consulting transition, $3M QoE trigger.

### Milestone 2: Virginia Non-Judicial Foreclosure & Docket Ingestion
- **Delivered**: `packages/underwriting_engine/va_foreclosure_solver.py` and `services/ingestion/roanoke_docket_pollers.py`.
- **Key Features**: Code of Virginia §§ 55.1-320 to 55.1-322 compliance, >=14 days notice, <=70% basis cap, connectors for VAWBK, The Roanoke Times Column.us, Roanoke City TACS, and County Judicial sales.

### Milestone 3: AES-256 PII Vault, Merkle Audit & 5-Role RBAC
- **Delivered**: `services/security/pii_vault_and_rbac.py`.
- **Key Features**: AES-256 GCM encrypted `OwnerPIIVault`, immutable SHA-256 `MerkleAuditLedger`, 5-role RBAC (`PRINCIPAL`, `ANALYST`, `COUNSEL`, `CPA`, `LENDER_BROKER`).

### Milestone 4: Citation-Locked Memo Drafter & Fiduciary Outreach
- **Delivered**: `services/memo_drafter/` and `services/outreach/`.
- **Key Features**: Zero-temperature LLM memo generator with mandatory legal/tax disclaimer banner, single-recipient outreach with dual approval tokens (`PrincipalApprovalToken` + `CounselComplianceSignoff`) and Virginia DNC validation (`Va. Code § 59.1-514`).

### Milestone 5: Regional Expansion & ApiAnything Dynamic Scraper
- **Delivered**: `services/ingestion/api_anything_adapter.py`.
- **Key Features**: Flexible JSON/HTML web scraping adapter with circuit breaker integration, expanding target box across Virginia counties.

### Milestone 6: Multi-Faceted Deal Filtering & Sorting Engine
- **Delivered**: Advanced 10-parameter filtering engine (`GET /v1/deals`) supporting DSCR ranges, basis ratios, NAICS codes, FIPS jurisdictions, price bounds, full-text search, and multi-field sorting.

### Milestone 7: Nationwide Mandate Wizard
- **Delivered**: Interactive mandate wizard supporting dynamic asset class selection (Operating SMBs, CRE, Heavy Equipment, Notes), investment thresholds, geographic radii, and metro area presets.

### Milestone 8: Location-Specific Resource & Connectivity Tracker
- **Delivered**: Real-time diagnostic tracker monitoring ArcGIS MapServers, court RSS feeds, and tax assessor portals with automatic circuit-breaker lockout tracking.

### Milestone 9: Institutional Aladdin Waterfall & Liquidation Floor
- **Delivered**: Multi-tier private equity distribution solver (LP Preferred Return, GP Catch-Up, IRR/MOIC splits), Orderly/Forced Liquidation Value (OLV/FLV) fire-sale solvers, and 100-point institutional scorecard.

### Milestone 10: Universal Multi-Asset Aggregator & OSINT Engine
- **Delivered**: Unified ingestion for 4 distinct asset classes, automated agentic OSINT research, CRM pipeline tracking, and fiduciary outreach playbooks.

### Milestone 11: Autonomous User Authentication & Identity Management
- **Delivered**: Secure JWT authentication, password hashing, email verification token workflows, password reset flows, and Google/Microsoft OAuth2 integration.

### Milestone 12: Nationwide Sovereign Scrapers
- **Delivered**: Self-hosted scrapers indexing 94 Federal CM/ECF bankruptcy districts, 50-state press portals, and national auction platforms (GovDeals, RealAuction, Bid4Assets, PublicSurplus).

### Milestone 13: CourtListener/RECAP & 3D Spatial Digital Twin
- **Delivered**: Streaming RECAP bankruptcy dockets and Ch. 11 § 363 motions, FollowTheMoney corporate ownership graph resolution, and 3D parcel polygon digital twins.

### Milestone 14: Five Aladdin Institutional Engines
- **Delivered**: Discrete Uber H3 hexagonal spatial clustering, SEC EDGAR public comps & multiple arbitrage, OpenSanctions/Yente KYC/AML compliance certificates, unstructured financial tax document parser (Form 1040 Schedule C, 1120-S, 1065), and OpenBB macro SOFR yield curve stress matrix.

### Milestone 15: Model Context Protocol (MCP) AI Agent Gateway
- **Delivered**: Anthropic Model Context Protocol (MCP 2024-11-05) SSE and stdio gateway exposing 8 institutional tools, resources, and prompt templates to Claude Desktop, Hermes, OpenClaw, and Copilot.

### Milestone 16: Upstream Dependency Sentinel & Apple Glass HIG Redesign
- **Delivered**: Autonomous upstream dependency auto-discovery, persistent ledger synchronization, PyPI/npm/GitHub polling, air-gap verification gate, and Next.js 15 Apple HIG redesign (Dynamic Glass Island, Spotlight search bar, high-density asset cards).

### Milestone 17: Augury Industrial AssetHealth™ Physical AI Suite
- **Delivered**: `packages/asset_health/` and `tests/integration/test_augury_asset_health_engines.py`.
- **Key Features**:
  1. `DS4SD/docling`: Equipment schedule, yellow-iron appraisal, and bankruptcy Schedule A/B table parser.
  2. `microsoft/torchgeo`: Aerial facility roof condition, thermal reflection, and fleet yard utilization sentinel.
  3. `unit8co/darts`: Machinery Remaining Useful Life (RUL), failure forecasting, and Year 1–3 predictive capex reserve solver with SBA 1.25x DSCR stress testing.
  4. `SeldonIO/alibi-detect`: Operational drift and disguised operational distress detection against NAICS regional benchmarks.
  5. `cleanlab/cleanlab`: Data-centric maintenance ledger audit flagging personal commingling (boats, personal vehicles, golf clubs) and phantom tooling write-offs disallowed from seller EBITDA add-backs.
  6. 5 new REST endpoints (`/v1/assets/{id}/health-score`, etc.), 5 new MCP tools, and Next.js 15 AssetHealth™ inspection interface.

---

## 3. Future Strategic Roadmap (Milestones 18–21)

Any future AI agent or engineer continuing this project should tackle the following milestones in strict sequence:

### Milestone 18: Autonomous Court PDF OCR & Docket Document Parser
- **Objective**: Parse scanned Ch. 11 disclosure statements, bankruptcy schedules (Schedule A/B assets and Schedule D/E/F claims), and substitute trustee notices of sale.
- **Implementation Strategy**:
  - Integrate a self-hostable OCR pipeline (e.g. Tesseract / PyMuPDF) inside `services/ingestion/court_pdf_parser.py`.
  - Extract exact debt figures, secured lender payoff demands, and property legal descriptions directly from raw court PDFs.
  - Wrap extracted numbers in `ProvenancedValue` with PDF page references and bounding coordinates.

### Milestone 19: Secondary Loan Syndication Packaging Engine
- **Objective**: Automate the generation of standardized SBA 7(a) / 504 loan syndication memo bundles for community bank loan committees.
- **Implementation Strategy**:
  - Partner with regional community lenders in Western Virginia (e.g., Atlantic Union Bank, Carter Bank & Trust, Freedom First Credit Union).
  - Build automated PDF export of Lender Packages conforming to RMA (Risk Management Association) credit memo formats.
  - Add interactive debt amortizer and debt yield stress scenarios.

### Milestone 20: Automated Virginia Tax Sale Bidding Assistant
- **Objective**: Provide a real-time auction bidding decision engine for City of Roanoke and Roanoke County delinquent tax sales.
- **Implementation Strategy**:
  - Ingest tax sale catalogs 30 days prior to auction.
  - Automatically query county land records for superior liens, federal tax liens (which have a 120-day IRS right of redemption under 26 U.S.C. § 7425), and municipal utility charges.
  - Compute maximum allowable bid (MAB) ensuring the purchase price remains `<= 70%` of verified assessed value.

### Milestone 21: Multi-State Regional Expansion Wizard
- **Objective**: Expand sourcing from Western Virginia into adjacent high-potential Appalachian and Mid-Atlantic industrial corridors (Greensboro/Winston-Salem NC, Johnson City TN, Charleston WV).
- **Implementation Strategy**:
  - Add FIPS codes and state-specific foreclosure statutes (e.g., North Carolina General Statutes Chapter 45, Tennessee Code Title 35).
  - Crawl state GIS REST MapServers for parcel boundaries.
  - Retain zero-cost hard kill filters for out-of-box jurisdictions.

---

## 4. Instructions for Successor AI Agents

When implementing any future milestone:
1. **Never Compromise Underwriting Determinism**: Never replace pure `decimal.Decimal` math with floating-point arithmetic or LLM approximations.
2. **Never Break Test Suite**: Run `python scripts/run_all_tests.py` and confirm all 110+ tests and the 50/50 Golden Suite pass.
3. **Always Update Documentation**: Record your architectural decisions in `docs/ARCHITECTURE.md`, API changes in `docs/API_REFERENCE.md`, and data structures in `docs/DATA_MODELS_AND_SCHEMA.md`.

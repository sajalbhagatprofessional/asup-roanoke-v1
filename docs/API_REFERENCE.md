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
17. `get_gotham_knowledge_graph`: Palantir Gotham multi-relational knowledge graph, betweenness centrality, and shortest fiduciary path.
18. `resolve_entity_splink`: Splink Fellegi-Sunter probabilistic record linkage (Jaro-Winkler + statutory tax ID match tiers).
19. `query_contour_micro_olap`: Foundry Contour in-process vectorized columnar micro-OLAP aggregations over distressed parcels.
20. `fuse_gaia_spatial_boundaries`: Gaia topological boundary fusion computing setback encroachments and FEMA floodway overlap.
21. `validate_aip_statutory_guardrails`: AIP structured schema guardrails deterministically enforcing SBA SOP 50 10 8.1 and Virginia notice statutes.
22. `find_semantic_lookalikes`: Inven-grade semantic M&A lookalike engine discovering unlisted private peers and operational clones.
23. `evaluate_debt_maturity_wall`: Reonomy/Trepp commercial debt wall solver computing post-refi DSCR under SOFR spread shocks and cliff scores.
24. `audit_title_curative_redemption`: PropertyRadar title curative screener enforcing 26 U.S.C. § 7425 IRS 120-day redemption clocks and holdbacks.
25. `scan_permits_and_zoning_envelope`: Cherre/Bowery municipal building permit auditor and Floor Area Ratio (FAR) expansion calculator.

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

### 11. Palantir Foundry, Gotham, Gaia, Contour & AIP Endpoints
- `GET /v1/ontology/graph/{asset_id}`: Palantir Gotham link analysis returning multi-relational knowledge graph (semantic nodes, directed legal/debt edges), betweenness centrality leverage hub, cross-collateralization cycle detection, and shortest fiduciary workout path.
- `POST /v1/ontology/resolve-entity`: Splink-inspired probabilistic record linkage (Fellegi-Sunter model) computing Jaro-Winkler name similarity, address token overlap, statutory tax ID linkage, match tier (`CERTAIN`, `HIGH_PROBABILITY`, `POSSIBLE_ASSOCIATION`, `DISTINCT`), and canonical entity ID.
- `POST /v1/ontology/contour-query`: Foundry Contour in-process vectorized columnar micro-OLAP engine (DuckDB-inspired) executing sub-50ms multi-dimensional aggregations over distressed dockets, parcels, EBITDA, and cure prices.
- `POST /v1/ontology/spatial-fusion`: Palantir Gaia topological parcel fusion engine (Shapely/GeoPandas) computing setback encroachments, FEMA 100-year floodway intersection sqft, flood coverage percentage, and rail spur corridor proximity.
- `POST /v1/ontology/aip-validate`: Palantir AIP structured schema guardrails deterministically enforcing statutory SBA SOP 50 10 8.1 minimum equity (>= 10%), baseline DSCR (>= 1.25x), Va. Code § 55.1-321 notice (>= 14 days), and mandatory $85,000/yr replacement GM deduction.

---

## 12. Advanced Sourcing Intelligence & Debt Radar (Inven / Reonomy / PropertyRadar / Cherre)

- `POST /v1/sourcing/semantic-lookalikes`: Inven-grade semantic M&A lookalikes. Discovers unlisted private peers and competitors matching an exemplary acquisition target or natural language operational thesis with geographic radius, NAICS filter, and fiduciary routing.
- `POST /v1/sourcing/debt-maturity-radar`: Reonomy/Trepp-grade commercial mortgage maturity wall radar. Scans maturing commercial mortgages within <= 24 months, projects debt service expansion under benchmark SOFR + 275 bps coupons, computes post-refi DSCR, and ranks Refinance Cliff Scores (0-100).
- `POST /v1/sourcing/title-curative-audit`: PropertyRadar/TaxSaleResources title curative screener. Audits recorded deeds of trust, tax liens, and mechanic's claims, enforces 26 U.S.C. § 7425 IRS 120-day statutory redemption rights, and calculates required curative escrow holdbacks.
- `POST /v1/sourcing/permit-zoning-scan`: Cherre/Bowery municipal building permit and zoning scanner. Audits recorded municipal permits, flags unpermitted alteration risks, and quantifies Floor Area Ratio (FAR) expansion potential and unused envelope square footage.

---

## 13. Institutional Titan Systems (Goldman Sachs / BlackRock / Vanguard / Jane Street / Bridgewater)

- `POST /v1/titan/reactive-dag/evaluate`: Goldman Sachs SecDB / J.P. Morgan Athena reactive underwriting directed acyclic graph. Evaluates financial metrics with fine-grained dependency tracking, forward incremental invalidation, and sub-50μs caching efficiency.
- `POST /v1/titan/capital-allocator/waterfall`: BlackRock eFront-grade private capital distribution waterfall solver. Computes 4 tiers (Return of Capital, 8% Preferred Return, GP 80/20 Catch-Up, Carried Interest), LP/GP MOIC, and annualized ROI.
- `POST /v1/titan/capital-allocator/concentration-audit`: Citadel-grade multi-mandate portfolio factor neutrality and concentration gate. Enforces strict limits: NAICS sector <= 25%, County FIPS <= 40%, Lender counterparty <= 30%, and dry powder liquidity pacing.
- `POST /v1/titan/tax-alpha/1031-exchange`: Vanguard & CPA-Grade 26 U.S.C. § 1031 like-kind exchange engine. Audits statutory 45-day identification and 180-day closing deadlines and calculates capital gains tax deferral.
- `POST /v1/titan/tax-alpha/cost-segregation`: CPA-grade MACRS cost segregation and bonus depreciation solver. Decomposes real estate basis into 5-year tangible property (60% bonus), 15-year land improvements (60% bonus), and 39-year building straight-line, calculating Year 1 cash tax savings.
- `POST /v1/titan/event-stream/replay`: Jane Street-grade deterministic canonical state machine replication (SMR) event stream replay. Reconstructs byte-for-byte pipeline state from cryptographic SHA-256 hash chains.
- `POST /v1/titan/macro-regime/stress-test`: Bridgewater Associates 4-Quadrant macro economic regime stress-tester (Ray Dalio model). Simulates Reflation, Productivity Expansion, Stagflation, and Deflationary Deleveraging, generating composite All-Weather Resilience Scores (0–100) and hedging strategies.

---

## 14. Palantir Operational Supremacy & Deal Execution Suite

- `POST /v1/operations/war-room/simulate`: Palantir War Room™ Multi-Variate Crisis & Stress Simulator. Simulates 5 simultaneous operational shocks (customer churn %, COGS inflation %, unplanned machine capex, key technician loss premium, insurance shock). Solves Crisis DSCR, 12-month gross burn, and generates contractual defensive covenants ($150k customer retention holdback, equipment warranty, seller note subordination) to protect principal capital.
- `POST /v1/operations/negotiation/stakeholder-matrix`: Stakeholder Game Theory & Negotiation Posture Engine. Solves 5-party Nash equilibrium across Substitute Trustee, Senior Special Servicer, Retiring Owner, Junior Creditors, and Title Underwriter. Determines optimal transaction structure (`DIRECT_NOTE_PURCHASE`, `SECTION_363_STALKING_HORSE`, `DEED_IN_LIEU_FRIENDLY`, `COURTHOUSE_STEP_FORECLOSURE`), counterparty BATNAs, and opening offer anchors.
- `POST /v1/operations/value-creation/100-day-blueprint`: 100-Day Warp Speed™ Post-Acquisition Operating Blueprint. Generates chronological 14-week operational modernization roadmap (Phases 1–4) and quantified EBITDA expansion bridge (+3.5% pricing, 5% vendor sourcing, 8% predictive telemetry overtime reduction, commercial utility audit) expanding baseline to pro-forma EBITDA.
- `GET /v1/operations/closing/checklist/{deal_id}`: Autonomous Closing Command Center. Audits 38 statutory pre-closing milestones across Corporate & Authority, Real Estate & Title, Lender & Regulatory (SBA SOP 50 10 8.1), and Tax & Operations (VA Form R-1 Certificate of No Tax Due). Solves `closing_readiness_score_pct` and guards fund disbursement.
- `POST /v1/operations/closing/checklist/{deal_id}/audit`: Autonomous Closing Command Center custom audit with statutory parameter overrides and critical path blocker enforcement.

---

## 15. Argus Asset Flip & Capital Velocity Engine (40-Year Veteran Sourcing Suite)

- `POST /v1/flipper/sale-leaseback`: Sale-Leaseback (SLB) Capital Arbitrage Solver. Models corporate sale-leaseback monetization of commercial/industrial real estate at institutional cap rates (e.g. 7.25%), computes net cash recouped, remaining OpCo basis, and triggers the "house money" infinite return flag when net proceeds exceed total acquisition cost.
- `POST /v1/flipper/flip-strategy-matrix`: 4-Way Flip Strategy Matrix & Breakup Optimizer. Evaluates and ranks 4 distinct exit strategies (`SALE_LEASEBACK_OPERATING_HOLD`, `WHOLESALE_CONTRACT_ASSIGNMENT`, `ORDERLY_LIQUIDATION_BREAKUP`, `RAPID_OPERATIONAL_TURNAROUND_FLIP`) using Capital Velocity Index, annualized ROIC %, and <90-day payback tags.
- `POST /v1/flipper/contract-assignment`: Wholesaling Contract Paper Flip & Double-Closing Escrow Gate. Calculates assignment spread, EMD cash-on-cash yield, triggers simultaneous double-closing alerts (when fee > $100k or > 10% deal value), and provides Virginia Code § 55.1-320 assignability contract clauses.
- `GET /v1/flipper/tear-sheet/{deal_id}`: 1-Click Executive Flip Tear-Sheet & IC Memo Generator for stored deals. Generates dense 1-page Investment Committee deal brief.
- `POST /v1/flipper/tear-sheet`: 1-Click Executive Flip Tear-Sheet generator with custom parameters and financial overrides.

---

## 16. Model Context Protocol (MCP 2024-11-05) Agent Gateway (40 Tools Catalog)

Argus exposes 40 deterministic tools over SSE (`POST /v1/mcp/sse`) and JSON-RPC:
1. `filter_deal_by_mandate`: Stage 2 zero-cost mandate evaluation.
2. `solve_sba_sop_50_10_8_1`: Stage 4 pure decimal SBA underwriting solver.
3. `solve_va_foreclosure_compliance`: Virginia Code § 55.1-321 14-day notice & basis solver.
4. `audit_owner_addbacks`: $85,000 replacement GM deduction and addback audit.
5. `ingest_roanoke_dockets`: Stage 1 docket ingestion across VAWBK, The Roanoke Times, TACS, Judicial.
6. `normalize_roanoke_gis`: Roanoke City & County GIS parcel normalization.
7. `route_conditional_enrichment`: SCC CIS, FEMA, EPA UST, and FMCSA enrichment router.
8. `generate_citation_locked_memo`: Stage 5 memo generation with citation verification.
9. `dispatch_human_gated_outreach`: Single-recipient fiduciary outreach gate with DNC validation.
10. `export_sba_lender_pack`: SBA 7(a)/504 lender package generation.
11. `evaluate_merkle_audit_chain`: Merkle tree integrity verification.
12. `generate_sensitivity_matrix`: Aladdin 2D revenue compression vs SOFR rate shock matrix.
13. `audit_upstream_dependencies`: Open-source dependency manifest and air-gap verification.
14. `calculate_asset_health_score`: Augury composite asset health and physical holdback solver.
15. `parse_equipment_schedule`: Docling equipment schedule and table parser.
16. `scan_aerial_facility`: TorchGeo roof condition and yard logistics sentinel.
17. `predict_capex_reserve`: Darts time-series machinery degradation model.
18. `audit_maintenance_ledger`: Cleanlab maintenance ledger and add-back audit.
19. `get_ontology_knowledge_graph`: Palantir Gotham link graph and cross-collateralization cycle detection.
20. `resolve_entity_splink`: Splink Fellegi-Sunter probabilistic record linkage.
21. `query_contour_micro_olap`: Foundry Contour sub-50ms columnar micro-OLAP aggregator.
22. `fuse_gaia_spatial_twin`: Palantir Gaia setback encroachment and floodway intersection engine.
23. `find_semantic_lookalikes`: Inven private peer M&A lookalike finder.
24. `scan_debt_maturity_radar`: Reonomy/Trepp commercial debt wall and refi cliff scanner.
25. `audit_title_curative`: PropertyRadar 26 U.S.C. § 7425 title curative and IRS 120-day screener.
26. `evaluate_reactive_dag`: Goldman SecDB / Athena reactive underwriting DAG (<50μs latency).
27. `calculate_pe_waterfall`: BlackRock eFront 4-tier private capital distribution waterfall solver.
28. `audit_portfolio_concentration`: Citadel multi-mandate portfolio factor neutrality and allocation gate.
29. `audit_1031_exchange_and_cost_seg`: Vanguard & CPA § 1031 statutory countdown and MACRS cost seg solver.
30. `simulate_macro_regimes`: Bridgewater Associates 4-Quadrant macro economic regime stress-tester.
31. `run_war_room_crisis_simulation`: Palantir War Room™ multi-variate crisis & defensive covenants simulator.
32. `solve_stakeholder_game_theory`: 5-party Nash equilibrium stakeholder game theory & BATNA solver.
33. `generate_100day_value_creation_blueprint`: 100-Day Warp Speed™ post-acquisition operational roadmap & EBITDA bridge.
34. `audit_statutory_closing_checklist`: Autonomous Closing Command Center 38 statutory milestone gate auditor.
35. `evaluate_sale_leaseback_arbitrage`: Sale-Leaseback capital arbitrage, NNN rent, broker fees, and infinite return solver.
36. `optimize_flip_exit_strategies`: 4-way flip strategy matrix, capital velocity index, and <90-day payback ranker.
37. `calculate_contract_assignment_fee`: Wholesale contract paper flip, EMD yield, double-closing gate, and assignment clause.
38. `generate_executive_flip_tearsheet`: 1-click executive flip tear-sheet & IC memo generator.
39. `get_user_settings`: Retrieve persistent user preferences (theme, density, PWA auto-update mode, notifications, underwriting defaults).
40. `update_user_settings`: Mutate and persist cross-device user configuration with ACID durability.

---

## 17. User Settings & PWA Auto-Update Engine (Milestone 33)

### `GET /v1/pwa/version`
Returns the active PWA application release metadata, cache manifest tag, feature release notes, and mandatory update flag.
- **Request**: No parameters.
- **Response `200 OK`**:
```json
{
  "app_name": "Argus Intelligence",
  "version": "1.1.0",
  "cache_name": "asup-argus-v1.1.0",
  "release_timestamp": "2026-11-13T02:30:00Z",
  "features": [
    "Auto-Update PWA Service Worker Engine",
    "Persistent Cross-Device User Settings & Preferences",
    "5-Theme Engine (Dark, Light, Midnight OLED, Bloomberg Navy)",
    "Asset Flipper Terminal & Capital Velocity Engine"
  ],
  "mandatory_update": false
}
```

### `GET /v1/user/settings`
Retrieves durable user configuration across all devices and sessions. Supports Bearer token resolution or optional `user_id` query parameter (defaults to authenticated principal).
- **Request**: `GET /v1/user/settings?user_id=default_investor`
- **Response `200 OK`**: Returns full `UserSettings` JSON payload including theme, display density, sound effects, statutory alerts, PWA auto-update preferences, and default underwriting hurdles.

### `POST /v1/user/settings`
Updates and commits user preferences with write-through ACID durability to PostgreSQL 16 (or local SQLite WAL store).
- **Request Body**: Partial or full `UserSettings` object.
- **Response `200 OK`**:
```json
{
  "status": "success",
  "user_id": "default_investor",
  "settings": { ... },
  "updated_at": "2026-11-13T02:40:00Z"
}
```





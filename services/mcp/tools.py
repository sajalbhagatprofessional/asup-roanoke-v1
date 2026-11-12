"""
Anthropic Model Context Protocol (MCP) Tool Registry & Execution Engine.
Exposes all deterministic underwriting, spatial analysis, compliance screening,
and sourcing capabilities of ASUP to external AI agents (Claude, Hermes, OpenClaw, Copilot).
"""

from decimal import Decimal
import json
import logging
from typing import Any, Callable, Dict, List, Optional

from packages.underwriting_engine import (
    AddBackItem,
    EdgarCompsEngine,
    MacroSofrEngine,
    QualityOfEarningsInput,
    SBACapitalStructureInput,
    TaxDocumentParser,
    audit_ebitda_and_working_capital,
    calculate_annual_debt_service,
    evaluate_sba_sop_50_10_8_1,
)
from services.asset_aggregator.catalog import AssetAggregatorService
from services.asset_aggregator.models import AssetClass, PipelineStage
from services.gis.spatial_resolver import UniversalSpatialResolver
from services.security.yente_screening_engine import YenteScreeningService
from .protocol import McpTool

logger = logging.getLogger("asup.mcp.tools")


# =========================================================================
# MCP TOOLS CATALOG (JSON SCHEMA DEFINITIONS)
# =========================================================================

MCP_TOOLS_CATALOG: List[McpTool] = [
    McpTool(
        name="search_deals_and_assets",
        description=(
            "Queries nationwide deals, operating businesses, commercial real estate, tax liens, and equipment fleets. "
            "Supports filtering by state (e.g. PA, VA), NAICS sector, price ceiling, baby boomer succession, and macro crime index."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "state": {"type": "string", "description": "2-letter US state code (e.g. 'PA', 'VA', 'NC')"},
                "query": {"type": "string", "description": "Full-text search query across title, city, county"},
                "asset_class": {
                    "type": "string",
                    "enum": ["BUSINESS_ACQUISITION", "REAL_ESTATE", "TAX_LIEN_MUNICIPAL", "EQUIPMENT_FLEET"],
                    "description": "Target asset vertical",
                },
                "min_price_usd": {"type": "string", "description": "Minimum valuation floor in USD"},
                "max_price_usd": {"type": "string", "description": "Maximum asking/cure budget in USD"},
                "baby_boomer_only": {"type": "boolean", "description": "Filter strictly for founders retiring / 20+ yr tenure"},
                "max_crime_index": {"type": "integer", "description": "Maximum allowable neighborhood crime score (0-100)"},
            },
        },
    ),
    McpTool(
        name="get_asset_dossier",
        description="Retrieves the full 360-degree institutional intelligence dossier, valuation, downside floor, and contacts for a specific asset ID.",
        inputSchema={
            "type": "object",
            "required": ["asset_id"],
            "properties": {
                "asset_id": {"type": "string", "description": "Unique asset identifier (e.g. 'ASSET-PA-ACC-01')"},
            },
        },
    ),
    McpTool(
        name="get_spatial_digital_twin",
        description=(
            "Retrieves God's Eye 3D Spatial Digital Twin for an asset: 3D extruded parcel boundary coordinates, "
            "rooftop HVAC inspection units, loading dock counts, and 3D FEMA floodplain elevation clearance delta."
        ),
        inputSchema={
            "type": "object",
            "required": ["asset_id"],
            "properties": {
                "asset_id": {"type": "string", "description": "Unique asset identifier"},
            },
        },
    ),
    McpTool(
        name="underwrite_sba_sop_50_10_8_1",
        description=(
            "Executes an air-gapped deterministic SBA SOP 50 10 8.1 underwriting evaluation. "
            "Tests 1.25x DSCR statutory floor, 10% equity injection, 50% Limited Equity Sources cap, "
            "mandatory 36-month seller standby lock, <=24m consulting cap, and $3M Quality of Earnings trigger."
        ),
        inputSchema={
            "type": "object",
            "required": [
                "purchase_price_usd",
                "buyer_cash_injection_usd",
                "seller_note_full_standby_usd",
                "historical_ebitda_usd",
            ],
            "properties": {
                "purchase_price_usd": {"type": "string", "description": "Total purchase / project cost in USD"},
                "buyer_cash_injection_usd": {"type": "string", "description": "Unborrowed cash injected by buyer in USD"},
                "seller_note_full_standby_usd": {"type": "string", "description": "Seller debt placed on full standby"},
                "historical_ebitda_usd": {"type": "string", "description": "Trailing 12-month normalized EBITDA in USD"},
                "loan_interest_rate_pct": {"type": "string", "default": "0.1125", "description": "Annual interest rate (e.g. '0.1125')"},
                "seller_standby_months": {"type": "integer", "default": 36, "description": "Months seller note is locked on standby"},
                "seller_consulting_months": {"type": "integer", "default": 12, "description": "Months seller is contracted for transition"},
                "is_partner_buyout": {"type": "boolean", "default": False, "description": "Whether transaction is a partner buyout"},
            },
        },
    ),
    McpTool(
        name="audit_addbacks_and_qoe",
        description=(
            "Audits seller add-backs and computes normalized post-GM EBITDA and 12-month net working capital (NWC) peg. "
            "Automatically deducts mandatory $85,000/yr replacement General Manager salary when owner works >20 hrs/week, "
            "and disallows unproven lifestyle or guru synergy claims."
        ),
        inputSchema={
            "type": "object",
            "required": ["reported_net_income_usd", "interest_expense_usd", "depreciation_amortization_usd"],
            "properties": {
                "reported_net_income_usd": {"type": "string", "description": "Reported bottom line net income in USD"},
                "interest_expense_usd": {"type": "string", "description": "Interest expense on books in USD"},
                "tax_expense_usd": {"type": "string", "default": "0.00", "description": "Income tax expense in USD"},
                "depreciation_amortization_usd": {"type": "string", "description": "Depreciation and amortization in USD"},
                "owner_compensation_usd": {"type": "string", "default": "0.00", "description": "Total owner W2 / distributions in USD"},
                "owner_hours_per_week": {"type": "integer", "default": 45, "description": "Average owner hours per week"},
                "proposed_addbacks": {
                    "type": "array",
                    "description": "List of proposed add-back line items",
                    "items": {
                        "type": "object",
                        "required": ["category", "amount_usd", "has_proof"],
                        "properties": {
                            "category": {"type": "string"},
                            "amount_usd": {"type": "string"},
                            "has_proof": {"type": "boolean"},
                            "is_guru_synergy": {"type": "boolean", "default": False},
                        },
                    },
                },
            },
        },
    ),
    McpTool(
        name="evaluate_sec_edgar_arbitrage",
        description=(
            "Compares private acquisition purchase multiple against live SEC EDGAR XBRL public sector comps (EV/EBITDA, P/E, FCF). "
            "Calculates immediate multiple expansion spread and dollar arbitrage gain upon private equity roll-up consolidation."
        ),
        inputSchema={
            "type": "object",
            "required": ["purchase_ev_usd", "normalized_ebitda_usd", "naics_code"],
            "properties": {
                "purchase_ev_usd": {"type": "string", "description": "Enterprise purchase price in USD"},
                "normalized_ebitda_usd": {"type": "string", "description": "Audited normalized EBITDA in USD"},
                "naics_code": {"type": "string", "description": "4-digit NAICS code (e.g. '5412', '2382', '4413')"},
            },
        },
    ),
    McpTool(
        name="screen_yente_aml_kyc",
        description=(
            "Executes institutional AML, KYC, and Sanctions screening via OpenSanctions/Yente across OFAC SDN, "
            "BIS Entity List, EU Financial Sanctions, UN Security Council, and PEP databases. "
            "Issues a cryptographically signed YenteComplianceCertificate with SHA-256 digest."
        ),
        inputSchema={
            "type": "object",
            "required": ["entity_name"],
            "properties": {
                "entity_name": {"type": "string", "description": "Target corporate entity name"},
                "jurisdiction": {"type": "string", "default": "US-VA", "description": "State or ISO jurisdiction code"},
                "beneficial_owners": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of natural person owners (>25% equity)",
                },
                "screener_role": {"type": "string", "default": "COUNSEL", "description": "Role performing screening"},
            },
        },
    ),
    McpTool(
        name="run_openbb_macro_sofr_stress",
        description=(
            "Simulates 5 dynamic macroeconomic interest rate shock scenarios (+100 bps, +200 bps, +300 bps, stagflation) "
            "against active SOFR, 10Y Treasury, and Prime rate curves. Computes stressed DSCR, annual debt service increase, and covenant headroom."
        ),
        inputSchema={
            "type": "object",
            "required": ["loan_principal_usd", "baseline_annual_ebitda_usd"],
            "properties": {
                "loan_principal_usd": {"type": "string", "description": "Total senior debt loan principal in USD"},
                "baseline_annual_ebitda_usd": {"type": "string", "description": "Trailing 12m verified EBITDA in USD"},
                "amortization_years": {"type": "integer", "default": 10, "description": "Loan amortization period in years"},
                "asset_title": {"type": "string", "default": "Target Acquisition", "description": "Asset or entity name"},
            },
        },
    ),
    McpTool(
        name="parse_unstructured_tax_return",
        description=(
            "Parses unstructured text or OCR extraction of IRS Form 1040 Schedule C or Form 1120-S. "
            "Extracts line items (Gross Receipts, COGS, Depreciation, Interest, Net Income), flags personal lifestyle deductions, "
            "and executes deterministic Quality of Earnings audit."
        ),
        inputSchema={
            "type": "object",
            "required": ["document_text"],
            "properties": {
                "document_text": {"type": "string", "description": "Raw OCR or tabular text of the IRS tax return"},
                "document_type": {
                    "type": "string",
                    "enum": ["IRS_1040_SCHED_C", "IRS_1120_S"],
                    "default": "IRS_1040_SCHED_C",
                },
                "tax_year": {"type": "integer", "default": 2025},
                "taxpayer_name": {"type": "string", "default": "Acquisition Target"},
                "owner_hours_per_week": {"type": "integer", "default": 45},
            },
        },
    ),
    McpTool(
        name="generate_fiduciary_outreach_playbook",
        description=(
            "Synthesizes a compliant, single-recipient fiduciary outreach correspondence honoring founder legacy. "
            "Produces non-predatory, institutional correspondence for either succession retirement buyout or AI workflow modernization."
        ),
        inputSchema={
            "type": "object",
            "required": ["asset_id"],
            "properties": {
                "asset_id": {"type": "string", "description": "Target asset identifier"},
                "playbook_type": {
                    "type": "string",
                    "enum": ["SUCCESSION_BUYOUT", "AI_MODERNIZATION"],
                    "default": "SUCCESSION_BUYOUT",
                },
            },
        },
    ),
    McpTool(
        name="manage_kanban_crm_stage",
        description="Advances or updates an asset's stage in the Kanban CRM pipeline.",
        inputSchema={
            "type": "object",
            "required": ["asset_id", "stage"],
            "properties": {
                "asset_id": {"type": "string", "description": "Target asset identifier"},
                "stage": {
                    "type": "string",
                    "enum": ["SAVED", "OUTREACH_PENDING", "IN_COMMUNICATION", "UNDER_DILIGENCE", "LOI_ISSUED", "CLOSED", "PASSED"],
                },
            },
        },
    ),
    McpTool(
        name="evaluate_asset_physical_health",
        description=(
            "Executes Augury-inspired 5-engine physical asset health solver: computes composite health score (0-100), "
            "Physical Risk Grade (A-F), TorchGeo aerial roof score, Darts 3-year predictive capex reserve, "
            "Alibi-detect operational drift vs NAICS benchmarks, and Cleanlab maintenance ledger audit."
        ),
        inputSchema={
            "type": "object",
            "required": ["asset_id"],
            "properties": {
                "asset_id": {"type": "string", "description": "Target asset identifier"},
                "naics_code": {"type": "string", "description": "6-digit NAICS industry classification (e.g. '332710', '484110')", "default": "332710"},
                "parcel_id": {"type": "string", "description": "County GIS parcel ID for aerial scan", "default": "4011902"},
                "annual_ebitda_usd": {"type": "string", "description": "Annual normalized EBITDA in USD", "default": "480000.00"},
                "annual_debt_service_usd": {"type": "string", "description": "Annual senior debt service in USD", "default": "285000.00"},
            },
        },
    ),
    McpTool(
        name="parse_equipment_schedule_docling",
        description=(
            "Docling-inspired table parser: extracts structured yellow-iron machinery, serial numbers, "
            "operating hours, rated life, condition tiers, and failure risk scores from bankruptcy Schedule A/B exhibits or markdown tables."
        ),
        inputSchema={
            "type": "object",
            "required": ["raw_schedule_text"],
            "properties": {
                "raw_schedule_text": {"type": "string", "description": "Raw markdown or OCR text containing equipment lists"},
                "replacement_multiplier": {"type": "string", "description": "Inflation multiplier for replacement costs (default 1.25)", "default": "1.25"},
            },
        },
    ),
    McpTool(
        name="run_aerial_facility_sentinel",
        description=(
            "TorchGeo-inspired aerial sentinel: calculates satellite roof condition score (0-100), "
            "estimated roof replacement cost, yard fleet occupancy, and outdoor scrap/environmental hazard detection."
        ),
        inputSchema={
            "type": "object",
            "required": ["parcel_id"],
            "properties": {
                "parcel_id": {"type": "string", "description": "Target GIS parcel identifier"},
                "latitude": {"type": "number", "description": "Latitude coordinate", "default": 37.2709},
                "longitude": {"type": "number", "description": "Longitude coordinate", "default": -79.9414},
                "building_footprint_sqft": {"type": "number", "description": "Building footprint in square feet", "default": 24500.0},
            },
        },
    ),
    McpTool(
        name="predict_machinery_capex_reserve",
        description=(
            "Darts-inspired time-series machinery degradation model: calculates Year 1, Year 2, and Year 3 mandatory capex curves, "
            "tests SBA 1.25x DSCR stress breach, and recommends seller escrow holdback amount."
        ),
        inputSchema={
            "type": "object",
            "required": ["annual_ebitda_usd", "annual_debt_service_usd"],
            "properties": {
                "annual_ebitda_usd": {"type": "string", "description": "Annual normalized EBITDA in USD"},
                "annual_debt_service_usd": {"type": "string", "description": "Annual senior debt service in USD"},
            },
        },
    ),
    McpTool(
        name="audit_maintenance_ledger_cleanlab",
        description=(
            "Cleanlab-inspired data-centric audit: detects fraudulent owner add-backs, "
            "commingled personal maintenance expenses, and phantom equipment repair write-offs in maintenance ledgers."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "invoices": {
                    "type": "array",
                    "description": "Optional list of invoice dictionaries ({invoice_id, vendor, amount_usd, description, equipment_id})",
                    "items": {"type": "object"},
                },
            },
        },
    ),
    McpTool(
        name="generate_gotham_knowledge_graph",
        description=(
            "Palantir Gotham link analysis: constructs multi-relational knowledge graph of corporate entities, "
            "parcels, deeds of trust, substitute trustees, and lenders. Computes betweenness leverage hub, "
            "detects cross-collateralization cycles, and identifies shortest fiduciary workout path."
        ),
        inputSchema={
            "type": "object",
            "required": ["asset_id"],
            "properties": {
                "asset_id": {"type": "string", "description": "Target distressed asset or company identifier (e.g. 'ROA-GD-01')"},
            },
        },
    ),
    McpTool(
        name="resolve_entity_splink",
        description=(
            "Splink-inspired probabilistic record linkage (Fellegi-Sunter model): resolves true beneficial ownership "
            "and entity matching across court dockets, Virginia SCC corporate records, and county GIS tax rolls."
        ),
        inputSchema={
            "type": "object",
            "required": ["source_record", "candidate_record"],
            "properties": {
                "source_record": {"type": "object", "description": "Source record {id, name, address, tax_id}"},
                "candidate_record": {"type": "object", "description": "Candidate record {id, name, address, tax_id}"},
            },
        },
    ),
    McpTool(
        name="query_contour_micro_olap",
        description=(
            "Palantir Foundry Contour in-process vectorized micro-OLAP analytical engine: executes sub-50ms multi-dimensional "
            "aggregations across distressed dockets and parcels (filtering by NAICS, cure basis, DSCR, and notice days)."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "naics_prefix": {"type": "string", "description": "NAICS prefix filter (e.g. '484', '332', '493')"},
                "max_cure_basis_usd": {"type": "string", "description": "Maximum cure basis in USD"},
                "min_dscr": {"type": "string", "description": "Minimum baseline DSCR floor"},
                "min_notice_days": {"type": "integer", "description": "Minimum statutory foreclosure notice days"},
                "jurisdiction": {"type": "string", "description": "Jurisdiction filter (e.g. 'Roanoke City')"},
            },
        },
    ),
    McpTool(
        name="fuse_gaia_spatial_twin",
        description=(
            "Palantir Gaia topological parcel fusion engine: analyzes GIS boundaries, building footprints, "
            "property setback encroachments, FEMA 100-year flood zone overlap, and Norfolk Southern rail adjacency."
        ),
        inputSchema={
            "type": "object",
            "required": ["parcel_id"],
            "properties": {
                "parcel_id": {"type": "string", "description": "Target county GIS parcel GPIN"},
                "flood_hazard_zone": {"type": "string", "default": "X", "description": "FEMA flood zone (e.g. 'X', 'A', 'AE')"},
                "distance_to_boundary_ft": {"type": "number", "description": "Distance from building to parcel boundary in feet"},
                "distance_to_rail_ft": {"type": "number", "description": "Distance from parcel to rail corridor in feet"},
            },
        },
    ),
    McpTool(
        name="validate_aip_guardrails",
        description=(
            "Palantir AIP structured schema guardrails: strictly enforces SBA SOP 50 10 8.1 minimum equity (10%) and DSCR (1.25x), "
            "Va. Code § 55.1-321 14-day notice, and mandatory $85,000 replacement GM salary deductions."
        ),
        inputSchema={
            "type": "object",
            "required": ["raw_proposal"],
            "properties": {
                "raw_proposal": {"type": "object", "description": "Raw acquisition proposal dictionary"},
            },
        },
    ),
]


# =========================================================================
# TOOL EXECUTION DISPATCHER
# =========================================================================

def execute_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes an MCP tool deterministically and returns JSON-serializable results.
    """
    try:
        if tool_name == "search_deals_and_assets":
            assets = AssetAggregatorService.search_assets(
                state=arguments.get("state"),
                query=arguments.get("query"),
                asset_class=AssetClass(arguments["asset_class"]) if arguments.get("asset_class") else None,
                min_price=Decimal(str(arguments["min_price_usd"])) if arguments.get("min_price_usd") else None,
                max_price=Decimal(str(arguments["max_price_usd"])) if arguments.get("max_price_usd") else None,
                baby_boomer_only=arguments.get("baby_boomer_only", False),
                max_crime_index=arguments.get("max_crime_index"),
            )
            return {
                "total_matched": len(assets),
                "assets": [a.model_dump() if hasattr(a, "model_dump") else a.dict() for a in assets],
            }

        elif tool_name == "get_asset_dossier":
            asset_id = arguments["asset_id"]
            asset = AssetAggregatorService.get_asset_by_id(asset_id)
            if not asset:
                return {"error": f"Asset {asset_id} not found."}
            return {"asset": asset.model_dump() if hasattr(asset, "model_dump") else asset.dict()}

        elif tool_name == "get_spatial_digital_twin":
            asset_id = arguments["asset_id"]
            asset = AssetAggregatorService.get_asset_by_id(asset_id)
            if not asset:
                return {"error": f"Asset {asset_id} not found."}
            fips_map = {"PA": "42077", "VA": "51770", "NC": "37183", "TX": "48453", "IL": "17031", "FL": "12086"}
            twin = UniversalSpatialResolver.resolve_parcel_spatial_twin(
                fips_code=fips_map.get(asset.state, "42077"),
                parcel_id=f"PARCEL-{asset.asset_id}",
                street_address=f"{asset.title}, {asset.city}, {asset.state}",
                building_sqft=asset.building_sqft or 24000,
                lot_acreage=2.5,
            )
            return {"spatial_twin": twin.to_dict()}

        elif tool_name == "underwrite_sba_sop_50_10_8_1":
            p_price = Decimal(str(arguments["purchase_price_usd"]))
            b_cash = Decimal(str(arguments["buyer_cash_injection_usd"]))
            s_note = Decimal(str(arguments["seller_note_full_standby_usd"]))
            ebitda = Decimal(str(arguments["historical_ebitda_usd"]))
            rate = Decimal(str(arguments.get("loan_interest_rate_pct", "0.1125")))
            standby_m = int(arguments.get("seller_standby_months", 36))
            consult_m = int(arguments.get("seller_consulting_months", 12))

            # Standard 7(a) senior loan = Purchase - Buyer Cash - Standby Seller Note
            loan_amt = p_price - b_cash - s_note

            inp = SBACapitalStructureInput(
                total_project_cost_usd=p_price,
                appraised_owner_occupied_cre_usd=Decimal("0.00"),
                sba_7a_loan_usd=loan_amt,
                sba_annual_interest_rate=rate,
                sba_amortization_months=120,
                buyer_cash_equity_usd=b_cash,
                seller_standby_note_usd=s_note,
                seller_standby_lock_months=standby_m,
                non_controlling_investor_equity_usd=Decimal("0.00"),
                seller_non_standby_note_usd=Decimal("0.00"),
                seller_non_standby_rate=Decimal("0.00"),
                seller_non_standby_amort_months=0,
                seller_consulting_months=consult_m,
                adjusted_ebitda_post_gm_usd=ebitda,
                annual_maintenance_capex_usd=Decimal("0.00"),
                annual_cash_taxes_usd=Decimal("0.00"),
            )
            res = evaluate_sba_sop_50_10_8_1(inp)
            return {
                "is_sba_compliant": res.is_sba_compliant,
                "base_dscr": str(res.base_dscr),
                "stress_dscr": str(res.stress_dscr),
                "statutory_floor_met_1_25x": res.base_dscr >= Decimal("1.25"),
                "total_equity_injection_pct": str(res.total_equity_injection_pct),
                "limited_equity_share_of_required_pct": str(res.limited_equity_share_of_required_pct),
                "standby_lock_compliant_36m": standby_m >= 36,
                "consulting_transition_compliant_24m": consult_m <= 24,
                "independent_qoe_required": res.independent_qoe_required,
                "violation_codes": res.violation_codes,
            }

        elif tool_name == "audit_addbacks_and_qoe":
            net_inc = Decimal(arguments["reported_net_income_usd"])
            interest = Decimal(arguments["interest_expense_usd"])
            tax = Decimal(arguments.get("tax_expense_usd", "0.00"))
            deprec = Decimal(arguments["depreciation_amortization_usd"])
            owner_comp = Decimal(arguments.get("owner_compensation_usd", "0.00"))
            hours = arguments.get("owner_hours_per_week", 45)

            raw_addbacks = arguments.get("proposed_addbacks", [])
            addbacks: List[AddBackItem] = []
            for item in raw_addbacks:
                addbacks.append(
                    AddBackItem(
                        category=item["category"],
                        amount_usd=Decimal(item["amount_usd"]),
                        has_cpa_or_tax_return_proof=item["has_proof"],
                        is_guru_synergy_claim=item.get("is_guru_synergy", False),
                    )
                )

            nwc_12m = [Decimal("50000.00")] * 12
            inp = QualityOfEarningsInput(
                reported_net_income_usd=net_inc,
                interest_expense_usd=interest,
                tax_expense_usd=tax,
                depreciation_amortization_usd=deprec,
                owner_compensation_on_books_usd=owner_comp,
                owner_hours_per_week=hours,
                proposed_addbacks=addbacks,
                trailing_12m_nwc_balances_usd=nwc_12m,
            )
            qoe_res = audit_ebitda_and_working_capital(inp)
            return {
                "reported_sde_usd": str(qoe_res.reported_sde_usd),
                "verified_addbacks_usd": str(qoe_res.verified_addbacks_usd),
                "disallowed_unproven_addbacks_usd": str(qoe_res.disallowed_unproven_addbacks_usd),
                "replacement_gm_deduction_usd": str(qoe_res.replacement_gm_deduction_usd),
                "adjusted_ebitda_post_gm_usd": str(qoe_res.adjusted_ebitda_post_gm_usd),
                "working_capital_peg_12m_avg_usd": str(qoe_res.working_capital_peg_12m_avg_usd),
                "audit_flags": qoe_res.audit_flags,
            }

        elif tool_name == "evaluate_sec_edgar_arbitrage":
            ev = Decimal(arguments["purchase_ev_usd"])
            ebitda = Decimal(arguments["normalized_ebitda_usd"])
            naics = arguments["naics_code"]
            arb = EdgarCompsEngine.calculate_valuation_arbitrage(ev, ebitda, naics)
            return {"arbitrage": arb.to_dict()}

        elif tool_name == "screen_yente_aml_kyc":
            cert = YenteScreeningService.screen_entity_and_owners(
                entity_name=arguments["entity_name"],
                jurisdiction=arguments.get("jurisdiction", "US-VA"),
                screener_role=arguments.get("screener_role", "COUNSEL"),
                beneficial_owners=arguments.get("beneficial_owners"),
            )
            return {"certificate": cert.to_dict()}

        elif tool_name == "run_openbb_macro_sofr_stress":
            p = Decimal(arguments["loan_principal_usd"])
            ebitda = Decimal(arguments["baseline_annual_ebitda_usd"])
            years = arguments.get("amortization_years", 10)
            title = arguments.get("asset_title", "Target Acquisition")
            matrix = MacroSofrEngine.evaluate_rate_shock_matrix(p, ebitda, years, asset_title=title)
            return {"matrix_report": matrix.to_dict()}

        elif tool_name == "parse_unstructured_tax_return":
            text = arguments["document_text"]
            doc_type = arguments.get("document_type", "IRS_1040_SCHED_C")
            name = arguments.get("taxpayer_name", "Acquisition Target")
            year = arguments.get("tax_year", 2025)
            hours = arguments.get("owner_hours_per_week", 45)

            if "1120" in doc_type:
                rep = TaxDocumentParser.parse_form_1120_s(text, year, name, hours)
            else:
                rep = TaxDocumentParser.parse_schedule_c(text, year, name, hours)
            return {"parsed_tax_report": rep.to_dict()}

        elif tool_name == "generate_fiduciary_outreach_playbook":
            aid = arguments["asset_id"]
            ptype = arguments.get("playbook_type", "SUCCESSION_BUYOUT")
            pb = AssetAggregatorService.generate_outreach_playbook(aid, ptype)
            return {"outreach_playbook": pb}

        elif tool_name == "manage_kanban_crm_stage":
            aid = arguments["asset_id"]
            stage = PipelineStage(arguments["stage"])
            updated = AssetAggregatorService.update_pipeline_stage(aid, stage)
            if not updated:
                return {"error": f"Asset {aid} not found."}
            return {"asset": updated.model_dump() if hasattr(updated, "model_dump") else updated.dict()}

        elif tool_name == "evaluate_asset_physical_health":
            from packages.asset_health import asset_health_solver
            aid = arguments["asset_id"]
            naics = arguments.get("naics_code", "332710")
            parcel_id = arguments.get("parcel_id", "4011902")
            annual_ebitda = Decimal(str(arguments.get("annual_ebitda_usd", "480000.00")))
            annual_debt_service = Decimal(str(arguments.get("annual_debt_service_usd", "285000.00")))
            health_report = asset_health_solver.evaluate_composite_asset_health(
                asset_id=aid,
                naics_code=naics,
                parcel_id=parcel_id,
                annual_ebitda=annual_ebitda,
                annual_debt_service=annual_debt_service,
            )
            return {"physical_health": health_report.to_dict()}

        elif tool_name == "parse_equipment_schedule_docling":
            from packages.asset_health import EquipmentScheduleParser
            parser = EquipmentScheduleParser()
            text = arguments["raw_schedule_text"]
            mult = Decimal(str(arguments.get("replacement_multiplier", "1.25")))
            items = parser.parse_text_or_markdown_tables(text, default_replacement_ratio=mult)
            return {
                "parsed_items_count": len(items),
                "items": [it.to_dict() for it in items],
            }

        elif tool_name == "run_aerial_facility_sentinel":
            from packages.asset_health import AerialFacilitySentinel
            sentinel = AerialFacilitySentinel()
            parcel_id = arguments["parcel_id"]
            lat = Decimal(str(arguments.get("latitude", 37.2709)))
            lon = Decimal(str(arguments.get("longitude", -79.9414)))
            sqft = Decimal(str(arguments.get("building_footprint_sqft", 24500.0)))
            aerial_report = sentinel.analyze_parcel_aerial_condition(
                parcel_id=parcel_id,
                latitude=lat,
                longitude=lon,
                building_footprint_sqft=sqft,
            )
            return {"aerial_report": aerial_report.to_dict()}

        elif tool_name == "predict_machinery_capex_reserve":
            from packages.asset_health import EquipmentScheduleParser, PredictiveCapexEngine
            parser = EquipmentScheduleParser()
            default_eq = parser._generate_industry_defaults()
            engine = PredictiveCapexEngine()
            ebitda = Decimal(str(arguments["annual_ebitda_usd"]))
            debt_service = Decimal(str(arguments["annual_debt_service_usd"]))
            capex_res = engine.calculate_capex_reserve_and_dscr_impact(
                equipment_list=default_eq,
                annual_historical_ebitda=ebitda,
                annual_debt_service=debt_service,
            )
            return {"predictive_capex": capex_res.to_dict()}

        elif tool_name == "audit_maintenance_ledger_cleanlab":
            from packages.asset_health import MaintenanceAuditor
            auditor = MaintenanceAuditor()
            invs = arguments.get("invoices")
            audit_res = auditor.audit_maintenance_invoices(invs)
            return {"maintenance_audit": audit_res.to_dict()}

        elif tool_name == "generate_gotham_knowledge_graph":
            from packages.ontology_engine import GothamLinkGraphEngine
            aid = arguments["asset_id"]
            report = GothamLinkGraphEngine.generate_roanoke_dossier_graph(asset_id=aid)
            return {"ontology_graph": report.to_dict()}

        elif tool_name == "resolve_entity_splink":
            from packages.ontology_engine import SplinkEntityResolver
            src = arguments["source_record"]
            cand = arguments["candidate_record"]
            match_res = SplinkEntityResolver.resolve_entity(src, cand)
            return {"entity_resolution": match_res.to_dict()}

        elif tool_name == "query_contour_micro_olap":
            from packages.ontology_engine import ContourEngineDuckDB
            engine = ContourEngineDuckDB()
            cure_dec = Decimal(str(arguments["max_cure_basis_usd"])) if arguments.get("max_cure_basis_usd") else None
            dscr_dec = Decimal(str(arguments["min_dscr"])) if arguments.get("min_dscr") else None
            res = engine.execute_contour_query(
                naics_prefix=arguments.get("naics_prefix"),
                max_cure_basis_usd=cure_dec,
                min_dscr=dscr_dec,
                min_notice_days=arguments.get("min_notice_days"),
                jurisdiction=arguments.get("jurisdiction"),
            )
            return {"contour_query_result": res.to_dict()}

        elif tool_name == "fuse_gaia_spatial_twin":
            from packages.ontology_engine import GaiaSpatialFusionEngine
            pid = arguments["parcel_id"]
            fzone = arguments.get("flood_hazard_zone", "X")
            dist_bound = Decimal(str(arguments["distance_to_boundary_ft"])) if arguments.get("distance_to_boundary_ft") is not None else None
            dist_rail = Decimal(str(arguments["distance_to_rail_ft"])) if arguments.get("distance_to_rail_ft") is not None else None
            report = GaiaSpatialFusionEngine.fuse_parcel_spatial_twin(
                parcel_id=pid,
                flood_hazard_zone=fzone,
                distance_to_boundary_ft=dist_bound,
                distance_to_rail_ft=dist_rail,
            )
            return {"spatial_fusion": report.to_dict()}

        elif tool_name == "validate_aip_guardrails":
            from packages.ontology_engine import AIPGuardrailsInstructor
            raw = arguments["raw_proposal"]
            guardrail_res = AIPGuardrailsInstructor.validate_deal_proposal(raw)
            return {"guardrail_validation": guardrail_res.to_dict()}

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        logger.error(f"Error executing MCP tool {tool_name}: {e}", exc_info=True)
        return {"error": str(e)}

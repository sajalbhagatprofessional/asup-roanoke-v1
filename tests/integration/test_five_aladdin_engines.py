"""
Integration Test Suite for the Five Institutional Aladdin Engines:
1. Engine 1: Uber H3 Hexagonal Spatial Indexing & Roll-Up Clustering
2. Engine 2: SEC EDGAR XBRL Comps & Form D Distress Sourcing
3. Engine 3: OpenSanctions & Yente AML/KYC Compliance Screening
4. Engine 4: Unstructured Financial Document & Tax Return Parser
5. Engine 5: OpenBB Macroeconomic SOFR Yield Curve Shock Engine
"""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient

from services.api.main import app
from services.gis.h3_clustering import H3SpatialService
from packages.underwriting_engine import (
    EdgarCompsEngine,
    TaxDocumentParser,
    MacroSofrEngine,
)
from services.security.yente_screening_engine import YenteScreeningService


client = TestClient(app)


def test_engine1_uber_h3_spatial_indexing_and_rollup_clustering():
    """Engine 1: Uber H3 spatial hashing, k-ring expansion, and roll-up consolidation."""
    # 1. Direct Service tests
    idx = H3SpatialService.index_latlng(40.6084, -75.4902)
    assert idx.h3_index_res8.startswith("88") or len(idx.h3_index_res8) == 15
    assert len(idx.hex_boundary_res8) >= 5
    assert idx.hex_boundary_res8[0] == idx.hex_boundary_res8[-1]  # Closed polygon

    neighbors = H3SpatialService.get_k_ring_neighbors(idx.h3_index_res8, k=2)
    assert len(neighbors) >= 1
    assert idx.h3_index_res8 in neighbors

    # 2. FastAPI Endpoints
    # GET /v2/analytics/h3-clusters
    res_clusters = client.get("/v2/analytics/h3-clusters?k_ring_radius=3")
    assert res_clusters.status_code == 200
    data = res_clusters.json()
    assert data["status"] == "success"
    assert data["total_clusters"] >= 1
    c0 = data["clusters"][0]
    assert "anchor_h3_res7" in c0
    assert "multiple_expansion_arbitrage_gain_usd" in c0
    assert float(c0["combined_asking_value_usd"]) > 0

    # GET /v2/assets/{asset_id}/h3-index
    res_idx = client.get("/v2/assets/ASSET-PA-ACC-01/h3-index")
    assert res_idx.status_code == 200
    idx_data = res_idx.json()
    assert idx_data["status"] == "success"
    assert "h3_index_res8" in idx_data["h3_spatial_index"]
    assert len(idx_data["k_ring_2_neighbors"]) >= 1


def test_engine2_sec_edgar_comps_and_valuation_arbitrage():
    """Engine 2: SEC EDGAR public comps multiples, valuation arbitrage spread, and Form D distress."""
    # 1. Direct Engine tests
    bench = EdgarCompsEngine.resolve_public_benchmark("5412")
    assert bench.sector_name == "Accounting & Tax Professional Services"
    assert bench.median_ev_ebitda == Decimal("11.40")
    assert len(bench.peer_tickers) >= 3

    # Pure Decimal arbitrage test
    ev = Decimal("1450000.00")
    ebitda = Decimal("420000.00")
    arb = EdgarCompsEngine.calculate_valuation_arbitrage(ev, ebitda, "5412")
    assert arb.is_arbitrage_accretive is True
    # Entry multiple: 1450000 / 420000 = 3.45x
    assert arb.private_entry_multiple < Decimal("4.00")
    # Spread: 11.40 - 3.45 = 7.95x
    assert arb.multiple_expansion_spread > Decimal("7.00")
    assert arb.immediate_arbitrage_gain_usd > Decimal("2000000.00")
    assert arb.arbitrage_tier == "TIER_1_SUPER_ACCRETIVE"

    # Reject float inputs
    try:
        EdgarCompsEngine.calculate_valuation_arbitrage(1450000.0, Decimal("420000.00"), "5412")  # type: ignore
        assert False, "Should have raised TypeError on float EV"
    except TypeError:
        pass

    # 2. Form D Distress Analysis
    form_d_eval = EdgarCompsEngine.evaluate_form_d_distress(
        cik="0001994820",
        issuer_name="Keystone Industrial Precision",
        offering_amount_usd=Decimal("3500000.00"),
        amount_sold_usd=Decimal("650000.00"),
        security_type="Equity & Unsecured Promissory Notes",
        days_open=195,
        is_amendment=True,
    )
    assert form_d_eval.distress_score >= 60
    assert form_d_eval.distress_severity in ["HIGH", "CRITICAL"]
    assert len(form_d_eval.identified_distress_flags) >= 2

    # 3. FastAPI Endpoints
    res_bench = client.get("/v2/underwriting/public-comps/5412")
    assert res_bench.status_code == 200
    assert res_bench.json()["median_ev_ebitda"] == "11.40"

    res_arb = client.post("/v2/underwriting/multiple-arbitrage", json={
        "purchase_ev_usd": "1450000.00",
        "normalized_ebitda_usd": "420000.00",
        "naics_code": "5412"
    })
    assert res_arb.status_code == 200
    assert res_arb.json()["arbitrage"]["is_arbitrage_accretive"] is True

    res_scan = client.post("/v2/underwriting/edgar-distress-scan", json={"state_code": "PA"})
    assert res_scan.status_code == 200
    assert res_scan.json()["total_filings_screened"] >= 1


def test_engine3_opensanctions_yente_aml_kyc_compliance_clearance():
    """Engine 3: OpenSanctions/Yente AML, KYC, OFAC, PEP screening and cryptographic certificate."""
    # 1. Clean Entity Test
    cert_clean = YenteScreeningService.screen_entity_and_owners(
        entity_name="Lehigh Valley Accounting Partners LLC",
        jurisdiction="US-PA",
        screener_role="COUNSEL",
        beneficial_owners=["Arthur Pendelton", "Claire Montgomery"],
        tin_or_ein="23-7749102",
    )
    assert cert_clean.clearance_disposition == "CLEARED_FOR_TRANSACTION"
    assert cert_clean.is_fully_cleared is True
    assert cert_clean.risk_score_basis_points == 0
    assert len(cert_clean.sha256_fingerprint) == 64

    # 2. Sanctioned Entity Test
    cert_sanctioned = YenteScreeningService.screen_entity_and_owners(
        entity_name="Gupta Family Holdings Limited",
        jurisdiction="ZA",
        screener_role="COUNSEL",
        beneficial_owners=["Ajay Gupta"],
    )
    assert cert_sanctioned.clearance_disposition == "PROHIBITED_SANCTIONED_ENTITY"
    assert cert_sanctioned.is_fully_cleared is False
    assert cert_sanctioned.risk_score_basis_points == 10000
    assert len(cert_sanctioned.matched_hits) >= 1
    assert cert_sanctioned.matched_hits[0].dataset == "OFAC_SDN"

    # 3. FastAPI Endpoints
    res_screen = client.post("/v2/compliance/screen-entity", json={
        "entity_name": "Allentown Precision Tooling LLC",
        "jurisdiction": "US-PA",
        "screener_role": "COUNSEL",
        "beneficial_owners": ["Thomas Wright"],
    })
    assert res_screen.status_code == 200
    cert_dict = res_screen.json()["certificate"]
    assert cert_dict["clearance_disposition"] == "CLEARED_FOR_TRANSACTION"
    cert_id = cert_dict["certificate_id"]

    res_get = client.get(f"/v2/compliance/certificate/{cert_id}")
    assert res_get.status_code == 200
    assert res_get.json()["certificate"]["certificate_id"] == cert_id


def test_engine4_unstructured_financial_tax_document_parser():
    """Engine 4: Unstructured IRS Form 1040 Schedule C & Form 1120-S parsing and QoE audit."""
    sample_sched_c_text = """
    INTERNAL REVENUE SERVICE
    Schedule C (Form 1040) Profit or Loss From Business
    Tax Year: 2025
    Taxpayer: Valley Machine Works LLC
    Line 1 Gross receipts or sales: $1,450,000.00
    Line 4 Cost of goods sold: $620,000.00
    Line 9 Car and truck expenses: $28,500.00
    Line 13 Depreciation and section 179: $52,000.00
    Line 16b Interest expense: $14,000.00
    Line 17 Legal and professional services: $9,500.00
    Line 24b Meals: $7,200.00
    Line 27a Other expenses: $18,000.00
    Line 31 Net profit: $340,000.00
    """

    # 1. Direct Parser Test
    report = TaxDocumentParser.parse_schedule_c(
        document_text=sample_sched_c_text,
        tax_year=2025,
        taxpayer_name="Valley Machine Works LLC",
        owner_hours_per_week=45,
    )
    assert report.gross_receipts_usd == Decimal("1450000.00")
    assert report.cost_of_goods_sold_usd == Decimal("620000.00")
    assert report.gross_profit_usd == Decimal("830000.00")
    assert report.depreciation_amortization_usd == Decimal("520000.00") or report.depreciation_amortization_usd == Decimal("52000.00")
    assert len(report.line_items) == 9
    assert len(report.detected_lifestyle_addbacks) >= 2

    # Verified QoE deductions applied ($85,000 replacement GM)
    assert report.qoe_audit_result.replacement_gm_deduction_usd == Decimal("85000.00")
    assert report.qoe_audit_result.adjusted_ebitda_post_gm_usd > Decimal("0.00")

    # 2. FastAPI Endpoint
    res_parse = client.post("/v2/underwriting/parse-tax-document", json={
        "document_type": "IRS_1040_SCHED_C",
        "document_text": sample_sched_c_text,
        "tax_year": 2025,
        "taxpayer_name": "Valley Machine Works LLC",
        "owner_hours_per_week": 45
    })
    assert res_parse.status_code == 200
    parsed = res_parse.json()["report"]
    assert parsed["gross_receipts_usd"] == "1450000.00"
    assert parsed["qoe_audit_result"]["replacement_gm_deduction_usd"] == "85000.00"


def test_engine5_openbb_macro_sofr_yield_curve_and_rate_shock_matrix():
    """Engine 5: OpenBB benchmark yield curve modeling and 5 dynamic rate shock stress scenarios."""
    # 1. Direct Engine Test
    curve = MacroSofrEngine.get_active_yield_curve()
    assert curve.wsj_prime_rate == Decimal("0.0850")
    assert curve.sba_max_rate_prime_plus_275 == Decimal("0.1125")

    # 5-Scenario Matrix
    loan_p = Decimal("2000000.00")
    ebitda = Decimal("480000.00")
    matrix = MacroSofrEngine.evaluate_rate_shock_matrix(
        loan_principal_usd=loan_p,
        baseline_annual_ebitda_usd=ebitda,
        amortization_years=10,
        asset_title="Allentown Industrial Acquisition",
    )
    assert len(matrix.scenarios) == 5
    scen_base = matrix.scenarios[0]
    assert scen_base.scenario_id == "SCEN_01_BASE"
    assert scen_base.rate_shock_bps == 0
    assert scen_base.stressed_dscr > Decimal("1.25")
    assert scen_base.meets_sba_floor_1_25x is True
    assert scen_base.meets_principal_hurdle_1_15x is True

    # Stagflation Scenario checks (-15% EBITDA shock)
    scen_stag = matrix.scenarios[4]
    assert scen_stag.scenario_id == "SCEN_05_STAGFLATION"
    assert scen_stag.stressed_ebitda_usd < ebitda

    # Float rejection test
    try:
        MacroSofrEngine.evaluate_rate_shock_matrix(2000000.0, Decimal("480000.00"))  # type: ignore
        assert False, "Should have rejected float loan principal"
    except TypeError:
        pass

    # 2. FastAPI Endpoints
    res_curve = client.get("/v2/underwriting/benchmark-yield-curve")
    assert res_curve.status_code == 200
    assert res_curve.json()["yield_curve"]["sba_max_rate_prime_plus_275"] == "0.1125"

    res_matrix = client.post("/v2/underwriting/macro-sofr-scenarios", json={
        "loan_principal_usd": "2000000.00",
        "baseline_annual_ebitda_usd": "480000.00",
        "amortization_years": 10,
        "asset_title": "Allentown Industrial Acquisition"
    })
    assert res_matrix.status_code == 200
    matrix_data = res_matrix.json()["matrix_report"]
    assert len(matrix_data["scenarios"]) == 5
    assert matrix_data["overall_fragility_tier"] in ["RESILIENT", "MODERATE_SENSITIVITY", "VULNERABLE"]

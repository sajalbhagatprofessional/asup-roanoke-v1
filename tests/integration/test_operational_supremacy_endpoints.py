"""
Integration test suite for Palantir Operational Supremacy Engines:
1. Palantir War Room™ Multi-Variate Crisis & Stress Simulator
2. Stakeholder Game Theory & Negotiation Posture Engine
3. 100-Day Warp Speed™ Post-Acquisition Operating Blueprint
4. Autonomous Closing Command Center & 38-Statute Gate Tracker
5. FastAPI REST Server Endpoints under /v1/operations/*
6. Model Context Protocol (MCP 2024-11-05) AI Agent Tools
"""

from decimal import Decimal
from fastapi.testclient import TestClient

from services.api.main import app

client = TestClient(app)


def test_api_war_room_simulate():
    payload = {
        "deal_id": "DEAL-INT-WARROOM",
        "asset_name": "Roanoke Industrial Stamping",
        "naics_code": "332119",
        "base_annual_revenue_usd": 2400000.0,
        "base_annual_ebitda_usd": 380000.0,
        "annual_senior_debt_service_usd": 120000.0,
        "customer_churn_pct": 0.15,
        "cogs_inflation_pct": 0.08,
        "unplanned_capex_usd": 35000.0,
        "key_person_recruiting_premium_usd": 25000.0,
        "insurance_cost_shock_pct": 0.25,
        "baseline_insurance_expense_usd": 18000.0,
        "existing_liquid_cash_reserves_usd": 150000.0,
    }
    res = client.post("/v1/operations/war-room/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    report = data["crisis_report"]
    assert report["deal_id"] == "DEAL-INT-WARROOM"
    assert "crisis_dscr" in report
    assert "solvency_status" in report
    assert "defensive_covenants" in report
    assert len(report["defensive_covenants"]) >= 1


def test_api_negotiation_stakeholder_matrix():
    payload = {
        "deal_id": "DEAL-INT-NEG",
        "asset_name": "Salem Metal Coatings",
        "senior_defaulted_principal_usd": 1400000.0,
        "accrued_default_interest_and_fees_usd": 45000.0,
        "junior_encumbrances_usd": 180000.0,
        "verified_assessed_real_estate_usd": 2200000.0,
        "estimated_going_concern_ebitda_usd": 340000.0,
        "irs_tax_lien_present": False,
        "notice_lead_days": 21,
        "owner_personal_guarantee_active": True,
        "competing_bidders_count": 1,
    }
    res = client.post("/v1/operations/negotiation/stakeholder-matrix", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    report = data["negotiation_report"]
    assert report["optimal_transaction_structure"] == "DIRECT_NOTE_PURCHASE"
    assert len(report["stakeholder_matrix"]) == 5
    assert "recommended_opening_offer_usd" in report


def test_api_100day_blueprint():
    payload = {
        "deal_id": "DEAL-INT-BLUEPRINT",
        "asset_name": "Valley Cold Chain Logistics",
        "naics_code": "493120",
        "purchase_price_usd": 2800000.0,
        "baseline_annual_revenue_usd": 3600000.0,
        "baseline_annual_ebitda_usd": 480000.0,
        "exit_multiple_ev_ebitda": 6.5,
    }
    res = client.post("/v1/operations/value-creation/100-day-blueprint", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    report = data["blueprint_report"]
    assert len(report["milestone_schedule"]) == 9
    assert len(report["ebitda_bridge_breakdown"]) == 4
    assert Decimal(report["total_ebitda_expansion_usd"]) > Decimal("0.00")


def test_api_closing_checklist_get_and_audit():
    # 1. GET default checklist
    res_get = client.get("/v1/operations/closing/checklist/DEAL-INT-CLOSE")
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert data_get["status"] == "success"
    rep_get = data_get["closing_report"]
    assert rep_get["total_statutory_milestones_count"] == 38
    assert rep_get["is_funding_authorized"] is True

    # 2. POST custom checklist with blocker
    payload_blocked = {
        "asset_name": "Blocked Acquisition",
        "total_purchase_price_usd": 1900000.0,
        "total_escrow_holdback_required_usd": 120000.0,
        "irs_redemption_active": True,
        "open_lust_or_flood_issue": False,
        "principal_approval_token_present": False,
        "counsel_signoff_present": True,
    }
    res_post = client.post("/v1/operations/closing/checklist/DEAL-INT-CLOSE/audit", json=payload_blocked)
    assert res_post.status_code == 200
    data_post = res_post.json()
    rep_post = data_post["closing_report"]
    assert rep_post["is_funding_authorized"] is False
    assert rep_post["critical_path_blockers_count"] >= 1


def test_mcp_operational_supremacy_tools():
    from services.mcp.tools import execute_mcp_tool

    # 1. run_war_room_crisis_simulation
    res1 = execute_mcp_tool(
        "run_war_room_crisis_simulation",
        {
            "deal_id": "DEAL-MCP-01",
            "base_annual_revenue_usd": 2500000.0,
            "base_annual_ebitda_usd": 400000.0,
            "annual_senior_debt_service_usd": 130000.0,
            "customer_churn_pct": 0.12,
            "cogs_inflation_pct": 0.06,
        },
    )
    assert "crisis_report" in res1
    assert res1["crisis_report"]["deal_id"] == "DEAL-MCP-01"

    # 2. solve_stakeholder_game_theory
    res2 = execute_mcp_tool(
        "solve_stakeholder_game_theory",
        {
            "deal_id": "DEAL-MCP-02",
            "senior_defaulted_principal_usd": 1500000.0,
            "verified_assessed_real_estate_usd": 2500000.0,
            "estimated_going_concern_ebitda_usd": 380000.0,
        },
    )
    assert "negotiation_report" in res2
    assert "optimal_transaction_structure" in res2["negotiation_report"]

    # 3. generate_100day_value_creation_blueprint
    res3 = execute_mcp_tool(
        "generate_100day_value_creation_blueprint",
        {
            "deal_id": "DEAL-MCP-03",
            "purchase_price_usd": 2200000.0,
            "baseline_annual_revenue_usd": 3200000.0,
            "baseline_annual_ebitda_usd": 420000.0,
        },
    )
    assert "blueprint_report" in res3
    assert len(res3["blueprint_report"]["milestone_schedule"]) == 9

    # 4. audit_statutory_closing_checklist
    res4 = execute_mcp_tool(
        "audit_statutory_closing_checklist",
        {
            "deal_id": "DEAL-MCP-04",
            "total_purchase_price_usd": 2600000.0,
            "principal_approval_token_present": True,
            "counsel_signoff_present": True,
        },
    )
    assert "closing_report" in res4
    assert res4["closing_report"]["total_statutory_milestones_count"] == 38

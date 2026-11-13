"""
Integration Test Suite: Argus Asset Flip & Capital Velocity Engine (Milestone 32).
Tests REST endpoints (/v1/flipper/*) and MCP tools for:
1. Sale-Leaseback Capital Arbitrage Solver
2. 4-Way Flip Strategy Matrix Optimizer
3. Wholesaling Contract Assignment & Proof-of-Funds Gate
4. 1-Click Executive Flip Tear-Sheet Generator
"""

from decimal import Decimal
import json
from fastapi.testclient import TestClient

from services.api.main import app
from services.mcp.tools import execute_mcp_tool

client = TestClient(app)


def test_flipper_sale_leaseback_endpoint():
    payload = {
        "deal_id": "DEAL-ROA-FLIP-01",
        "asset_name": "Roanoke Industrial Metal Works",
        "total_acquisition_cost_usd": 2500000.0,
        "facility_sqft": 25000.0,
        "market_nnn_rent_per_sqft_usd": 9.0,
        "investor_exit_cap_rate": 0.0725,
        "transaction_broker_fee_pct": 0.04,
        "baseline_annual_ebitda_usd": 450000.0,
    }
    response = client.post("/v1/flipper/sale-leaseback", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    report = data["sale_leaseback_report"]
    assert report["deal_id"] == "DEAL-ROA-FLIP-01"
    assert float(report["gross_slb_sale_proceeds_usd"]) > 0.0
    assert float(report["annual_nnn_rent_usd"]) == 225000.0
    assert float(report["net_slb_cash_recouped_usd"]) > 0.0
    assert report["is_slb_viable"] is True


def test_flipper_flip_strategy_matrix_endpoint():
    payload = {
        "deal_id": "DEAL-ROA-FLIP-02",
        "asset_name": "Star City Fabrication",
        "purchase_price_usd": 2200000.0,
        "cre_market_assessed_value_usd": 1900000.0,
        "equipment_liquidation_floor_usd": 350000.0,
        "current_annual_ebitda_usd": 420000.0,
        "facility_sqft": 20000.0,
        "market_nnn_rent_per_sqft_usd": 9.0,
        "exit_cap_rate": 0.0725,
        "wholesaling_assignment_fee_usd": 85000.0,
    }
    response = client.post("/v1/flipper/flip-strategy-matrix", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    report = data["flip_strategy_report"]
    assert report["deal_id"] == "DEAL-ROA-FLIP-02"
    assert len(report["routes"]) == 4
    route_types = {s["route_type"] for s in report["routes"]}
    assert route_types == {
        "SALE_LEASEBACK_OPERATING_HOLD",
        "WHOLESALE_CONTRACT_ASSIGNMENT",
        "ORDERLY_LIQUIDATION_BREAKUP",
        "RAPID_OPERATIONAL_TURNAROUND_FLIP",
    }
    assert report["recommended_primary_route"] in route_types
    assert float(report["capital_velocity_index_score"]) > 0.0


def test_flipper_contract_assignment_endpoint():
    payload = {
        "deal_id": "DEAL-ROA-FLIP-03",
        "asset_name": "Salem Commercial Depot",
        "contract_purchase_price_usd": 750000.0,
        "end_buyer_takeout_price_usd": 900000.0,
        "earnest_money_deposit_usd": 25000.0,
        "inspection_contingency_days": 14,
        "closing_deadline_days": 30,
        "title_and_legal_costs_usd": 3500.0,
    }
    response = client.post("/v1/flipper/contract-assignment", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    report = data["contract_assignment_report"]
    assert report["deal_id"] == "DEAL-ROA-FLIP-03"
    assert float(report["gross_assignment_fee_usd"]) == 150000.0
    assert float(report["net_assignment_profit_usd"]) == 146500.0
    assert report["is_double_close_recommended"] is True
    assert float(report["cash_on_cash_return_pct"]) == 586.0
    assert "notice of assignment" in report["enforceable_assignment_clause"].lower()


def test_flipper_tear_sheet_endpoints():
    # 1. GET tear-sheet by deal_id
    response_get = client.get("/v1/flipper/tear-sheet/DEAL-001")
    assert response_get.status_code == 200
    data_get = response_get.json()
    assert data_get["status"] == "success"
    assert "ARGUS EXECUTIVE FLIP TEAR-SHEET" in data_get["tear_sheet_text"]
    assert "1. VALUATION & CAPITAL SPREAD" in data_get["tear_sheet_text"]
    assert "2. FOUR-WAY FLIP EXIT PATHWAYS" in data_get["tear_sheet_text"]

    # 2. POST custom tear-sheet
    payload = {
        "deal_id": "DEAL-CUSTOM-99",
        "asset_name": "Roanoke Valley Tool Works",
        "naics_code": "332710",
        "jurisdiction_fips": "51770",
        "asking_or_cure_price_usd": 2000000.0,
        "cre_market_assessed_usd": 1800000.0,
        "machinery_floor_usd": 400000.0,
        "total_liquidation_floor_usd": 2200000.0,
        "cushion_spread_usd": 200000.0,
        "cushion_spread_pct": 10.0,
        "current_annual_ebitda_usd": 380000.0,
        "slb_net_cash_recouped_usd": 1700000.0,
        "slb_net_remaining_basis_usd": 300000.0,
        "wholesale_assignment_fee_usd": 125000.0,
        "turnaround_18m_ev_usd": 2900000.0,
        "va_statutory_notice_days": 18,
        "sba_baseline_dscr": 1.40,
        "recommended_action": "EXECUTE SALE-LEASEBACK (85% Cash Recouped)",
    }
    response_post = client.post("/v1/flipper/tear-sheet", json=payload)
    assert response_post.status_code == 200
    data_post = response_post.json()
    assert data_post["status"] == "success"
    assert "ROANOKE VALLEY TOOL WORKS" in data_post["tear_sheet_text"]
    assert "EXECUTE SALE-LEASEBACK" in data_post["tear_sheet_text"]


def test_flipper_mcp_tools_dispatch():
    # 1. MCP Tool: evaluate_sale_leaseback_arbitrage
    res_slb = execute_mcp_tool(
        "evaluate_sale_leaseback_arbitrage",
        {
            "deal_id": "MCP-DEAL-01",
            "asset_name": "MCP Industrial",
            "total_acquisition_cost_usd": 2000000.0,
            "facility_sqft": 20000.0,
        },
    )
    assert "error" not in res_slb, f"MCP SLB error: {res_slb}"
    assert "sale_leaseback_report" in res_slb
    assert res_slb["sale_leaseback_report"]["deal_id"] == "MCP-DEAL-01"

    # 2. MCP Tool: optimize_flip_exit_strategies
    res_matrix = execute_mcp_tool(
        "optimize_flip_exit_strategies",
        {
            "deal_id": "MCP-DEAL-02",
            "asset_name": "MCP Tool Co",
            "purchase_price_usd": 1800000.0,
            "cre_market_assessed_value_usd": 1500000.0,
            "equipment_liquidation_floor_usd": 300000.0,
            "current_annual_ebitda_usd": 320000.0,
        },
    )
    assert "error" not in res_matrix, f"MCP Matrix error: {res_matrix}"
    assert "flip_strategy_report" in res_matrix
    assert len(res_matrix["flip_strategy_report"]["routes"]) == 4

    # 3. MCP Tool: calculate_contract_assignment_fee
    res_assign = execute_mcp_tool(
        "calculate_contract_assignment_fee",
        {
            "deal_id": "MCP-DEAL-03",
            "asset_name": "MCP Lot",
            "contract_purchase_price_usd": 500000.0,
            "end_buyer_takeout_price_usd": 625000.0,
        },
    )
    assert "error" not in res_assign, f"MCP Assign error: {res_assign}"
    assert "contract_assignment_report" in res_assign
    assert float(res_assign["contract_assignment_report"]["gross_assignment_fee_usd"]) == 125000.0

    # 4. MCP Tool: generate_executive_flip_tearsheet
    res_sheet = execute_mcp_tool(
        "generate_executive_flip_tearsheet",
        {
            "deal_id": "MCP-DEAL-04",
            "asset_name": "MCP Precision Machining",
            "asking_or_cure_price_usd": 2100000.0,
        },
    )
    assert "error" not in res_sheet, f"MCP Sheet error: {res_sheet}"
    assert "tear_sheet_text" in res_sheet
    assert "ARGUS EXECUTIVE FLIP TEAR-SHEET" in res_sheet["tear_sheet_text"]

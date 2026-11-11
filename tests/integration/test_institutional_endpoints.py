import os
import sys
from decimal import Decimal
from fastapi.testclient import TestClient

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from services.api.main import app


def test_fastapi_institutional_waterfall_endpoint():
    client = TestClient(app)
    payload = {
        "purchase_price_usd": "2000000.00",
        "working_capital_required_usd": "200000.00",
        "closing_costs_usd": "50000.00",
        "historical_normalized_ebitda_usd": "520000.00",
        "senior_debt_share_pct": "0.75",
        "senior_interest_rate_pct": "0.105",
        "senior_amortization_years": 10,
        "seller_note_share_pct": "0.10",
        "seller_note_interest_rate_pct": "0.06",
        "seller_note_standby_years": 3,
        "preferred_equity_share_pct": "0.05",
        "preferred_hurdle_rate_pct": "0.08",
        "buyer_common_equity_usd": "225000.00",
    }
    res = client.post("/v1/underwriting/institutional-waterfall", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_project_cost_usd"] == "2250000.00"
    assert data["senior_debt_amount_usd"] == "1687500.00"
    assert len(data["stress_scenarios"]) == 3
    assert len(data["returns_matrix"]) == 12


def test_fastapi_liquidation_floor_endpoint():
    client = TestClient(app)
    payload = {
        "purchase_or_cure_price_usd": "1650000.00",
        "real_estate_assessed_usd": "2400000.00",
        "equipment_floor_assessed_usd": "600000.00",
        "re_flv_factor": "0.65",
        "re_olv_factor": "0.80",
        "equipment_flv_factor": "0.45",
        "equipment_olv_factor": "0.65",
    }
    res = client.post("/v1/underwriting/liquidation-floor", json=payload)
    assert res.status_code == 200
    data = res.json()
    # RE FLV = 2.4M * 0.65 = 1,560,000; Equip FLV = 600k * 0.45 = 270,000; Total FLV = 1,830,000
    assert data["total_forced_liquidation_usd"] == "1830000.00"
    # Basis 1,650,000 <= 1,830,000 -> 100% Protected
    assert data["is_100pct_principal_protected"] is True
    assert data["principal_at_risk_flv_usd"] == "0.00"


def test_fastapi_roll_up_clusters_endpoint():
    client = TestClient(app)
    res = client.get("/v1/analytics/roll-up-clusters")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "total_clusters_identified" in data
    assert isinstance(data["clusters"], list)


def test_fastapi_deal_institutional_scorecard():
    client = TestClient(app)
    res = client.get("/v1/deals/ROA-GD-01/institutional-scorecard")
    assert res.status_code == 200
    data = res.json()
    assert data["deal_id"] == "ROA-GD-01"
    assert "composite_safety_score" in data
    assert "key_man_score" in data
    assert "customer_concentration_score" in data
    assert "recommendation_tier" in data


def test_fastapi_shadow_pipeline_endpoint():
    client = TestClient(app)
    res = client.get("/v1/dockets/shadow-pipeline")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_shadow_opportunities"] >= 1
    assert isinstance(data["opportunities"], list)
    first = data["opportunities"][0]
    assert "opportunity_id" in first
    assert "maturity_tier" in first
    assert "primary_signal" in first

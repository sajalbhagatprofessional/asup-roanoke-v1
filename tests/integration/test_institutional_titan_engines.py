"""
Comprehensive integration test suite for Institutional Titan Systems:
1. Goldman Sachs SecDB / J.P. Morgan Athena Reactive Underwriting DAG
2. BlackRock eFront & Citadel Private Capital Allocator & Waterfalls
3. Vanguard & CPA-Grade IRC § 1031 Exchange & Cost Segregation Tax Alpha
4. Jane Street Deterministic Canonical SMR Event Stream & Replay
5. Bridgewater Associates 4-Quadrant Macro Economic Regime Stress-Tester
6. FastAPI REST Server Endpoints
7. Anthropic MCP Tools
"""

from decimal import Decimal
from fastapi.testclient import TestClient

from packages.reactive_underwriting_dag import (
    ReactiveUnderwritingDAG,
    DAGUnderwritingInputs,
)
from packages.capital_allocator import (
    PEWaterfallSolver,
    PortfolioConcentrationEngine,
    WaterfallStructure,
)
from packages.tax_alpha_engine import (
    Section1031ExchangeSolver,
    CostSegregationSolver,
)
from packages.deterministic_event_stream import (
    CanonicalEventSequencer,
    CanonicalEventType,
)
from packages.macro_regime import (
    BridgewaterMacroRegimeEngine,
    MacroEconomicQuadrant,
)
from services.api.main import app

client = TestClient(app)


# =========================================================================
# 1. GOLDMAN SECDB / JPM ATHENA REACTIVE UNDERWRITING DAG
# =========================================================================

def test_goldman_secdb_reactive_underwriting_dag():
    inputs = DAGUnderwritingInputs(
        purchase_price_usd=Decimal("1500000.00"),
        buyer_equity_pct=Decimal("0.1000"),
        sofr_benchmark_rate=Decimal("0.0530"),
        bank_spread_bps=Decimal("275"),
        historical_ebitda_usd=Decimal("380000.00"),
        replacement_gm_salary_usd=Decimal("85000.00"),
        assessed_cre_value_usd=Decimal("2200000.00"),
        seller_standby_note_usd=Decimal("0.00"),
        seller_consulting_months=12,
        loan_term_years=25,
    )
    dag = ReactiveUnderwritingDAG(initial_inputs=inputs)
    rep1 = dag.evaluate(force_all=True)

    assert rep1.is_sba_compliant is True
    assert rep1.is_va_foreclosure_compliant is True
    assert rep1.is_principal_hurdle_passed is True
    assert Decimal(rep1.computed_formulas["dscr"]) > Decimal("1.3500")
    assert rep1.execution_time_microseconds > 0

    # Incremental update: SOFR rate shock (+200 bps to 7.30%)
    rep2 = dag.update_input("sofr_benchmark_rate", Decimal("0.0730"))
    # Only dependent downstream nodes recalculated (caching efficiency > 50%)
    assert rep2.dirty_nodes_recalculated_count < rep2.total_dag_nodes_count
    assert Decimal(rep2.incremental_efficiency_pct) > Decimal("50.0")
    # Verify DSCR compressed under higher interest rate
    assert Decimal(rep2.computed_formulas["dscr"]) < Decimal(rep1.computed_formulas["dscr"])


# =========================================================================
# 2. BLACKROCK EFRONT & CITADEL CAPITAL ALLOCATOR & WATERFALLS
# =========================================================================

def test_blackrock_efront_private_capital_waterfall():
    # $3.5M exit proceeds on $1.0M LP equity + $0 GP equity, 8% preferred return, 3 years, 20% carry
    report = PEWaterfallSolver.calculate_waterfall(
        deal_id="DEAL-001",
        total_distributable_proceeds_usd=Decimal("3500000.00"),
        lp_equity_contributed_usd=Decimal("1000000.00"),
        gp_equity_contributed_usd=Decimal("0.00"),
        preferred_return_rate_pct=Decimal("8.00"),
        holding_period_years=Decimal("3.00"),
        carried_interest_pct=Decimal("20.00"),
        waterfall_structure=WaterfallStructure.EUROPEAN_WHOLE_FUND,
    )

    lp_tot = Decimal(report.lp_total_received_usd)
    gp_tot = Decimal(report.gp_total_received_usd)

    # Invariant: Conservation of capital (LP + GP == Total Distributable)
    assert lp_tot + gp_tot == Decimal("3500000.00")
    # LP received full capital ($1.0M) + 8% pref ($240k) + 80% of residual profit ($1.76M) = $3.0M
    assert lp_tot == Decimal("3000000.00")
    assert report.lp_moic == "3.0000"
    # GP received catch-up ($60k) + 20% residual ($440k) = $500k Carried Interest
    assert gp_tot == Decimal("500000.00")
    assert len(report.tier_breakdown) == 4


def test_citadel_portfolio_concentration_limits():
    report = PortfolioConcentrationEngine.audit_portfolio(
        total_committed_capital_usd=Decimal("10000000.00")
    )
    assert Decimal(report.dry_powder_liquidity_usd) > Decimal("0.00")
    assert len(report.concentration_rules) >= 3
    assert report.is_all_concentration_limits_compliant is True
    assert len(report.capital_call_schedule) >= 3


# =========================================================================
# 3. VANGUARD & CPA-GRADE IRC § 1031 EXCHANGE & COST SEGREGATION
# =========================================================================

def test_vanguard_cpa_1031_exchange_and_cost_segregation():
    # 1. Test 1031 Exchange Solver
    ex_report = Section1031ExchangeSolver.audit_1031_exchange(
        exchange_id="EX-001",
        relinquished_property_name="Roanoke Distribution Center",
        sale_closing_date_iso="2026-10-15T00:00:00+00:00",
        sale_price_usd=Decimal("2800000.00"),
        adjusted_cost_basis_usd=Decimal("1200000.00"),
        existing_mortgage_payoff_usd=Decimal("800000.00"),
        as_of_date_iso="2026-11-12T00:00:00+00:00",
    )
    assert ex_report.days_remaining_45d_id > 0
    assert ex_report.days_remaining_180d_close > 0
    assert ex_report.is_id_window_active is True
    assert Decimal(ex_report.projected_tax_deferral_usd) == Decimal("472800.00")

    # 2. Test Cost Segregation Solver
    cs_report = CostSegregationSolver.calculate_cost_segregation(
        parcel_id="51161-ROA-001",
        deal_id="DEAL-001",
        total_acquisition_basis_usd=Decimal("2500000.00"),
    )
    assert Decimal(cs_report.year_1_accelerated_deduction_usd) > Decimal(cs_report.year_1_straight_line_deduction_usd)
    assert Decimal(cs_report.year_1_cash_tax_savings_usd) > Decimal("100000.00")
    assert len(cs_report.class_allocations) == 3


# =========================================================================
# 4. JANE STREET DETERMINISTIC EVENT STREAM & REPLAY
# =========================================================================

def test_jane_street_deterministic_canonical_event_stream():
    seq = CanonicalEventSequencer()
    deal_id = "DEAL-ROA-001"
    seq.seed_standard_deal_trajectory(deal_id=deal_id)

    assert seq.total_events == 7
    # Cryptographic hash chain verification
    assert seq.verify_hash_chain() is True

    # Replay full state
    rep = seq.replay_state(aggregate_id=deal_id)
    assert rep.is_hash_chain_valid is True
    assert rep.reconstructed_state["current_stage"] == "OUTREACH_ACTIVE"
    assert rep.reconstructed_state["counsel_signed"] is True
    assert rep.reconstructed_state["principal_approved"] is True
    assert rep.reconstructed_state["outreach_dispatched"] is True


# =========================================================================
# 5. BRIDGEWATER ASSOCIATES 4-QUADRANT MACRO REGIME STRESS
# =========================================================================

def test_bridgewater_4_quadrant_macro_regime_stress():
    report = BridgewaterMacroRegimeEngine.simulate_4_quadrants(
        deal_id="DEAL-001",
        entity_name="Blue Ridge Precision Machining",
        naics_code="332710",
        base_annual_revenue_usd=Decimal("2800000.00"),
        base_normalized_ebitda_usd=Decimal("420000.00"),
        base_annual_debt_service_usd=Decimal("210000.00"),
    )

    assert len(report.quadrant_results) == 4
    assert int(report.composite_resilience_score) in range(0, 101)
    # Verify Quadrant 3 is flagged as severe threat due to stagflation
    assert "Quadrant 3" in report.most_severe_threat_quadrant or "Stagflation" in report.most_severe_threat_quadrant
    assert len(report.recommended_hedging_strategy) > 0


# =========================================================================
# 6. FASTAPI REST SERVER ENDPOINTS
# =========================================================================

def test_fastapi_institutional_titan_endpoints():
    # 1. Reactive DAG endpoint
    res1 = client.post("/v1/titan/reactive-dag/evaluate", json={"purchase_price_usd": 1500000.0})
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"
    assert "dag_report" in res1.json()

    # 2. PE Waterfall endpoint
    res2 = client.post(
        "/v1/titan/capital-allocator/waterfall",
        json={"total_distributable_proceeds_usd": 3500000.0, "lp_equity_contributed_usd": 1000000.0},
    )
    assert res2.status_code == 200
    assert res2.json()["waterfall_report"]["lp_moic"] == "3.0000"

    # 3. Portfolio Concentration endpoint
    res3 = client.post("/v1/titan/capital-allocator/concentration-audit", json={})
    assert res3.status_code == 200
    assert "concentration_report" in res3.json()

    # 4. 1031 Exchange endpoint
    res4 = client.post(
        "/v1/titan/tax-alpha/1031-exchange",
        json={"sale_price_usd": 2800000.0, "adjusted_cost_basis_usd": 1200000.0},
    )
    assert res4.status_code == 200
    assert "exchange_report" in res4.json()

    # 5. Cost Segregation endpoint
    res5 = client.post(
        "/v1/titan/tax-alpha/cost-segregation",
        json={"parcel_id": "51161-ROA-001", "total_acquisition_basis_usd": 2500000.0},
    )
    assert res5.status_code == 200
    assert "cost_segregation_report" in res5.json()

    # 6. Event Replay endpoint
    res6 = client.post("/v1/titan/event-stream/replay", json={"aggregate_id": "DEAL-ROA-001"})
    assert res6.status_code == 200
    assert res6.json()["replay_report"]["is_hash_chain_valid"] is True

    # 7. Macro Regime Stress endpoint
    res7 = client.post(
        "/v1/titan/macro-regime/stress-test",
        json={
            "base_annual_revenue_usd": 2800000.0,
            "base_normalized_ebitda_usd": 420000.0,
            "base_annual_debt_service_usd": 210000.0,
        },
    )
    assert res7.status_code == 200
    assert "macro_regime_report" in res7.json()


# =========================================================================
# 7. ANTHROPIC MCP TOOLS
# =========================================================================

def test_mcp_institutional_titan_tools():
    from services.mcp.tools import execute_mcp_tool

    # 1. evaluate_reactive_dag
    res1 = execute_mcp_tool("evaluate_reactive_dag", {"purchase_price_usd": 1600000.0})
    assert "dag_report" in res1

    # 2. calculate_pe_waterfall
    res2 = execute_mcp_tool(
        "calculate_pe_waterfall",
        {"total_distributable_proceeds_usd": 2500000.0, "lp_equity_contributed_usd": 800000.0},
    )
    assert "waterfall_report" in res2

    # 3. audit_portfolio_concentration
    res3 = execute_mcp_tool("audit_portfolio_concentration", {})
    assert "concentration_report" in res3

    # 4. audit_1031_exchange_and_cost_seg
    res4 = execute_mcp_tool(
        "audit_1031_exchange_and_cost_seg",
        {"sale_price_usd": 2000000.0, "adjusted_cost_basis_usd": 1000000.0},
    )
    assert "section_1031_report" in res4
    assert "cost_segregation_report" in res4

    # 5. simulate_macro_regimes
    res5 = execute_mcp_tool(
        "simulate_macro_regimes",
        {
            "base_annual_revenue_usd": 3000000.0,
            "base_normalized_ebitda_usd": 450000.0,
            "base_annual_debt_service_usd": 220000.0,
        },
    )
    assert "macro_regime_report" in res5

from decimal import Decimal

from packages.war_room_simulator import (
    CrisisSolvencyStatus,
    OperationalShockInput,
    CrisisSimulationResult,
    simulate_operational_crisis,
)


def test_war_room_crisis_simulation_healthy_resilient():
    inp = OperationalShockInput(
        deal_id="DEAL-TEST-01",
        asset_name="Roanoke Precision CNC",
        naics_code="332710",
        base_annual_revenue_usd=Decimal("2500000.00"),
        base_annual_ebitda_usd=Decimal("450000.00"),
        annual_senior_debt_service_usd=Decimal("120000.00"),
        customer_churn_pct=Decimal("0.1000"),
        cogs_inflation_pct=Decimal("0.0500"),
        unplanned_capex_usd=Decimal("25000.00"),
        key_person_recruiting_premium_usd=Decimal("30000.00"),
        insurance_cost_shock_pct=Decimal("0.2000"),
        baseline_insurance_expense_usd=Decimal("20000.00"),
        existing_liquid_cash_reserves_usd=Decimal("200000.00"),
    )
    res = simulate_operational_crisis(inp)
    assert isinstance(res, CrisisSimulationResult)
    assert res.base_dscr == Decimal("3.7500")
    assert res.crisis_dscr > Decimal("1.2500")
    assert res.solvency_status == CrisisSolvencyStatus.ROBUST_RESILIENT
    assert res.is_capital_call_required is False
    assert len(res.defensive_covenants) >= 0


def test_war_room_crisis_simulation_severe_distress_triggers_capital_call():
    inp = OperationalShockInput(
        deal_id="DEAL-TEST-DISTRESS",
        asset_name="Struggling Auto Parts Mfg",
        naics_code="336390",
        base_annual_revenue_usd=Decimal("1500000.00"),
        base_annual_ebitda_usd=Decimal("180000.00"),
        annual_senior_debt_service_usd=Decimal("160000.00"),
        customer_churn_pct=Decimal("0.3500"),  # 35% customer flight
        cogs_inflation_pct=Decimal("0.2000"),  # 20% COGS surge
        unplanned_capex_usd=Decimal("85000.00"),
        key_person_recruiting_premium_usd=Decimal("50000.00"),
        insurance_cost_shock_pct=Decimal("0.4000"),
        baseline_insurance_expense_usd=Decimal("30000.00"),
        existing_liquid_cash_reserves_usd=Decimal("30000.00"),
    )
    res = simulate_operational_crisis(inp)
    assert res.crisis_dscr < Decimal("1.0000")
    assert res.solvency_status == CrisisSolvencyStatus.INSOLVENT_DISTRESS
    assert res.is_capital_call_required is True
    assert res.capital_call_shortfall_usd > Decimal("0.00")
    assert len(res.defensive_covenants) >= 2


def test_war_room_ast_and_zero_float_compliance():
    import ast
    with open("packages/war_room_simulator/crisis_simulator.py", "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, float):
            raise AssertionError(f"Found forbidden float literal in war_room_simulator: {node.value}")

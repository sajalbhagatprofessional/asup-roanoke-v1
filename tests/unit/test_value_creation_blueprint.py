from decimal import Decimal

from packages.value_creation_blueprint import (
    ExecutionPhase,
    BlueprintInput,
    HundredDayBlueprintReport,
    generate_hundred_day_blueprint,
)


def test_hundred_day_blueprint_expansion_and_bridge():
    inp = BlueprintInput(
        deal_id="DEAL-BLUEPRINT-01",
        asset_name="Star City Fabrication",
        naics_code="332312",
        purchase_price_usd=Decimal("2000000.00"),
        baseline_annual_revenue_usd=Decimal("3000000.00"),
        baseline_annual_ebitda_usd=Decimal("400000.00"),
        exit_multiple_ev_ebitda=Decimal("6.50"),
    )
    res = generate_hundred_day_blueprint(inp)
    assert isinstance(res, HundredDayBlueprintReport)
    assert res.pro_forma_annual_ebitda_usd > res.baseline_annual_ebitda_usd
    assert res.total_ebitda_expansion_usd > Decimal("100000.00")
    assert res.ebitda_expansion_percentage_pct >= Decimal("20.00")
    assert res.projected_equity_value_creation_usd > Decimal("0.00")
    assert len(res.ebitda_bridge_breakdown) == 4
    assert len(res.milestone_schedule) == 9

    # Verify chronological order
    for idx, m in enumerate(res.milestone_schedule):
        if idx > 0:
            assert m.week_number >= res.milestone_schedule[idx - 1].week_number


def test_value_creation_ast_and_zero_float_compliance():
    import ast
    with open("packages/value_creation_blueprint/hundred_day_engine.py", "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, float):
            raise AssertionError(f"Found forbidden float literal in hundred_day_engine: {node.value}")

from decimal import Decimal
from packages.underwriting_engine import (
    InstitutionalCapitalStackInput,
    InstitutionalWaterfallResult,
    evaluate_institutional_waterfall,
)


def test_rejects_float_input():
    try:
        evaluate_institutional_waterfall(
            InstitutionalCapitalStackInput(
                purchase_price_usd=2000000.0,  # FLOAT VIOLATION
                working_capital_required_usd=Decimal("200000.00"),
                closing_costs_usd=Decimal("50000.00"),
                historical_normalized_ebitda_usd=Decimal("500000.00"),
                senior_debt_share_pct=Decimal("0.75"),
                senior_interest_rate_pct=Decimal("0.105"),
                senior_amortization_years=10,
                seller_note_share_pct=Decimal("0.10"),
                seller_note_interest_rate_pct=Decimal("0.06"),
                seller_note_standby_years=3,
                preferred_equity_share_pct=Decimal("0.05"),
                preferred_hurdle_rate_pct=Decimal("0.08"),
                buyer_common_equity_usd=Decimal("225000.00"),
            )
        )
        assert False, "Should have raised TypeError on float input"
    except TypeError:
        pass


def test_institutional_waterfall_and_sofr_scenarios():
    inp = InstitutionalCapitalStackInput(
        purchase_price_usd=Decimal("2000000.00"),
        working_capital_required_usd=Decimal("200000.00"),
        closing_costs_usd=Decimal("50000.00"),
        historical_normalized_ebitda_usd=Decimal("500000.00"),
        senior_debt_share_pct=Decimal("0.75"),
        senior_interest_rate_pct=Decimal("0.105"),
        senior_amortization_years=10,
        seller_note_share_pct=Decimal("0.10"),
        seller_note_interest_rate_pct=Decimal("0.06"),
        seller_note_standby_years=3,
        preferred_equity_share_pct=Decimal("0.05"),
        preferred_hurdle_rate_pct=Decimal("0.08"),
        buyer_common_equity_usd=Decimal("225000.00"),
    )

    res = evaluate_institutional_waterfall(inp)

    assert isinstance(res, InstitutionalWaterfallResult)
    assert res.total_project_cost_usd == Decimal("2250000.00")
    assert res.senior_debt_amount_usd == Decimal("1687500.00")
    assert res.seller_note_amount_usd == Decimal("225000.00")
    assert res.preferred_equity_amount_usd == Decimal("112500.00")
    assert res.sponsor_common_equity_usd == Decimal("225000.00")

    # Base DSCR check
    assert res.base_dscr >= Decimal("1.3500")

    # SOFR Scenarios check
    assert len(res.stress_scenarios) == 3
    baseline = res.stress_scenarios[0]
    stagflation = res.stress_scenarios[1]
    recession = res.stress_scenarios[2]

    assert baseline.scenario_name == "BASELINE"
    assert baseline.is_solvent is True

    assert stagflation.rate_shock_bps == 350
    assert stagflation.annual_debt_service_usd > baseline.annual_debt_service_usd
    assert stagflation.stressed_ebitda_usd < baseline.stressed_ebitda_usd

    assert recession.ebitda_shock_pct == Decimal("-0.28")

    # Returns Matrix check: 3 exit years x 4 multiples = 12 cells
    assert len(res.returns_matrix) == 12

    # Exit Year 5 at 5.5x multiple
    cell_5yr_5x = next(c for c in res.returns_matrix if c.exit_year == 5 and c.exit_multiple == Decimal("5.50"))
    assert cell_5yr_5x.exit_enterprise_value_usd == Decimal("2750000.00")
    assert cell_5yr_5x.moic > Decimal("1.0000")
    assert cell_5yr_5x.annualized_irr_pct > Decimal("0.00")

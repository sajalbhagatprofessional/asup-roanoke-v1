from decimal import Decimal
from packages.underwriting_engine import (
    SBACapitalStructureInput,
    evaluate_sba_sop_50_10_8_1,
)


def make_valid_roanoke_sba_deal(**overrides) -> SBACapitalStructureInput:
    defaults = dict(
        total_project_cost_usd=Decimal("2500000.00"),
        appraised_owner_occupied_cre_usd=Decimal("1200000.00"),
        sba_7a_loan_usd=Decimal("2250000.00"),
        sba_annual_interest_rate=Decimal("0.0850"),
        sba_amortization_months=180,
        buyer_cash_equity_usd=Decimal("125000.00"),          # 5.0% buyer cash
        seller_standby_note_usd=Decimal("125000.00"),        # 5.0% standby note (50% of 10% injection)
        seller_standby_lock_months=36,                       # 36-month lock per SOP 50 10 8.1
        non_controlling_investor_equity_usd=Decimal("0.00"),
        seller_non_standby_note_usd=Decimal("0.00"),
        seller_non_standby_rate=Decimal("0.0600"),
        seller_non_standby_amort_months=60,
        seller_consulting_months=12,                         # <= 24 months per SOP 50 10 8.1
        adjusted_ebitda_post_gm_usd=Decimal("520000.00"),
        annual_maintenance_capex_usd=Decimal("40000.00"),
        annual_cash_taxes_usd=Decimal("65000.00"),
    )
    defaults.update(overrides)
    return SBACapitalStructureInput(**defaults)


def test_sba_sop_50_10_8_1_compliant_deal_passes():
    inp = make_valid_roanoke_sba_deal()
    res = evaluate_sba_sop_50_10_8_1(inp)
    assert res.is_sba_compliant is True
    assert res.is_mandate_compliant is True
    assert res.base_dscr >= Decimal("1.3500")
    assert res.stress_dscr >= Decimal("1.1500")
    assert res.buyer_cash_pct_of_project == Decimal("0.0500")
    assert res.limited_equity_share_of_required_pct == Decimal("0.5000")
    assert res.independent_qoe_required is False
    assert res.independent_valuation_required is True
    assert res.violation_codes == []


def test_sba_sop_50_10_8_1_limited_equity_exceeding_50pct_fails():
    # Buyer tries 4% cash ($100k) + 6% seller standby ($150k) -> violates SOP 50 10 8.1 50% Limited Equity cap
    inp = make_valid_roanoke_sba_deal(
        buyer_cash_equity_usd=Decimal("100000.00"),
        seller_standby_note_usd=Decimal("150000.00"),
    )
    res = evaluate_sba_sop_50_10_8_1(inp)
    assert res.is_sba_compliant is False
    assert any("SBA_LIMITED_EQUITY_CAP_BREACH" in c for c in res.violation_codes)


def test_sba_sop_50_10_8_1_standby_lock_under_36_months_fails():
    inp = make_valid_roanoke_sba_deal(seller_standby_lock_months=24)
    res = evaluate_sba_sop_50_10_8_1(inp)
    assert res.is_sba_compliant is False
    assert "SBA_STANDBY_LOCK_LT_36_MONTHS:24" in res.violation_codes


def test_sba_sop_50_10_8_1_consulting_over_24_months_fails():
    inp = make_valid_roanoke_sba_deal(seller_consulting_months=30)
    res = evaluate_sba_sop_50_10_8_1(inp)
    assert res.is_sba_compliant is False
    assert "SBA_SELLER_CONSULTING_GT_24_MONTHS:30" in res.violation_codes


def test_sba_sop_50_10_8_1_mandatory_qoe_trigger_at_3m_ex_cre():
    # Total loan $4.1M with $1.0M appraised owner-occupied CRE -> $3.1M net (>=$3.0M triggers QoE)
    inp = make_valid_roanoke_sba_deal(
        total_project_cost_usd=Decimal("4600000.00"),
        appraised_owner_occupied_cre_usd=Decimal("1000000.00"),
        sba_7a_loan_usd=Decimal("4140000.00"),
        buyer_cash_equity_usd=Decimal("230000.00"),
        seller_standby_note_usd=Decimal("230000.00"),
        adjusted_ebitda_post_gm_usd=Decimal("950000.00"),
    )
    res = evaluate_sba_sop_50_10_8_1(inp)
    assert res.independent_qoe_required is True


def test_rejects_python_float_input():
    try:
        inp = make_valid_roanoke_sba_deal(total_project_cost_usd=2500000.00)  # type: ignore
        evaluate_sba_sop_50_10_8_1(inp)
        raise AssertionError("Expected TypeError on float input")
    except TypeError:
        pass

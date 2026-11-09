from datetime import date
from decimal import Decimal
from packages.underwriting_engine import (
    VirginiaForeclosureInput,
    evaluate_va_foreclosure_basis,
    AddBackItem,
    QualityOfEarningsInput,
    audit_ebitda_and_working_capital,
)


def test_va_code_55_1_321_notice_and_basis_pass():
    inp = VirginiaForeclosureInput(
        notice_published_date=date(2026, 11, 1),
        scheduled_sale_date=date(2026, 11, 18),  # 17 days (>= 14 days required)
        senior_deed_of_trust_payoff_usd=Decimal("1100000.00"),
        delinquent_real_estate_tax_usd=Decimal("45000.00"),
        trustee_and_legal_fees_usd=Decimal("25000.00"),
        immediate_stabilization_capex_usd=Decimal("130000.00"),
        verified_assessed_or_replacement_usd=Decimal("2000000.00"),  # $1.30M / $2.00M = 65.0% (<=70%)
    )
    res = evaluate_va_foreclosure_basis(inp)
    assert res.is_statutorily_valid is True
    assert res.is_mandate_basis_compliant is True
    assert res.basis_to_replacement_ratio == Decimal("0.6500")
    assert res.defect_and_risk_codes == []


def test_va_code_55_1_321_short_notice_and_high_basis_fail():
    inp = VirginiaForeclosureInput(
        notice_published_date=date(2026, 11, 1),
        scheduled_sale_date=date(2026, 11, 11),  # 10 days (< 14 days statutory minimum!)
        senior_deed_of_trust_payoff_usd=Decimal("1500000.00"),
        delinquent_real_estate_tax_usd=Decimal("50000.00"),
        trustee_and_legal_fees_usd=Decimal("25000.00"),
        immediate_stabilization_capex_usd=Decimal("0.00"),
        verified_assessed_or_replacement_usd=Decimal("2000000.00"),  # 78.75% (> 70% cap)
        has_environmental_lust_violation=True,
    )
    res = evaluate_va_foreclosure_basis(inp)
    assert res.is_statutorily_valid is False
    assert res.is_mandate_basis_compliant is False
    assert "STATUTORY_NOTICE_DEFECT_VA_55_1_321_LT_14_DAYS:10" in res.defect_and_risk_codes
    assert "FAIL_EXCEEDS_70PCT_BASIS_CEILING:0.7875" in res.defect_and_risk_codes
    assert "ENV_RISK_OPEN_EPA_LUST_VIOLATION" in res.defect_and_risk_codes


def test_addback_auditor_disallows_unproven_and_deducts_85k_gm():
    inp = QualityOfEarningsInput(
        reported_net_income_usd=Decimal("210000.00"),
        interest_expense_usd=Decimal("35000.00"),
        tax_expense_usd=Decimal("25000.00"),
        depreciation_amortization_usd=Decimal("40000.00"),
        owner_compensation_on_books_usd=Decimal("110000.00"),
        owner_hours_per_week=50,
        proposed_addbacks=[
            AddBackItem("One-time roof repair (CPA invoice verified)", Decimal("25000.00"), True, False),
            AddBackItem("Personal travel & country club (no receipts)", Decimal("45000.00"), False, False),
            AddBackItem("Guru 2x pricing synergy in 90 days", Decimal("120000.00"), False, True),
        ],
        trailing_12m_nwc_balances_usd=[Decimal("180000.00")] * 12,
    )
    res = audit_ebitda_and_working_capital(inp)
    # Base EBITDA = 210k + 35k + 25k + 40k = 310k
    # + Owner comp 110k + Verified addback 25k - Replacement GM 85k = $360,000.00
    assert res.verified_addbacks_usd == Decimal("25000.00")
    assert res.disallowed_unproven_addbacks_usd == Decimal("165000.00")
    assert res.replacement_gm_deduction_usd == Decimal("85000.00")
    assert res.adjusted_ebitda_post_gm_usd == Decimal("360000.00")
    assert res.working_capital_peg_12m_avg_usd == Decimal("180000.00")
    assert len(res.audit_flags) == 2

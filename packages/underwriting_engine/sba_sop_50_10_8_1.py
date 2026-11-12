from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import List

CENT = Decimal("0.01")
FOUR_DEC = Decimal("0.0001")

# SBA SOP 50 10 8.1 (Effective October 1, 2026) Statutory Constants
SBA_MIN_HISTORICAL_DSCR = Decimal("1.2500")
PRINCIPAL_MIN_BASE_DSCR = Decimal("1.3500")
PRINCIPAL_MIN_STRESS_DSCR = Decimal("1.1500")
SBA_MIN_EQUITY_INJECTION_PCT = Decimal("0.1000")
SBA_MAX_LIMITED_EQUITY_SHARE = Decimal("0.5000")  # Seller standby + non-controlling equity <= 50% of required injection
SBA_MIN_BUYER_CASH_PCT = Decimal("0.0500")        # Buyer unborrowed cash >= 5% of total project cost
SBA_MIN_SELLER_STANDBY_MONTHS = 36                # Increased from 24 to 36 months under SOP 50 10 8.1
SBA_MAX_SELLER_CONSULTING_MONTHS = 24             # Capped at 24 months under SOP 50 10 8.1
SBA_MANDATORY_QOE_EX_CRE_USD = Decimal("3000000.00")


def _ensure_decimal(val: object, name: str) -> Decimal:
    if not isinstance(val, Decimal):
        raise TypeError(f"{name} must be a decimal.Decimal, got {type(val).__name__}")
    return val


def calculate_annual_debt_service(
    principal_usd: Decimal,
    annual_interest_rate: Decimal,
    amortization_months: int,
) -> Decimal:
    """
    Deterministic monthly-compounded loan payment multiplied by 12 using pure Decimal arithmetic.
    Formula: M = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
    """
    _ensure_decimal(principal_usd, "principal_usd")
    _ensure_decimal(annual_interest_rate, "annual_interest_rate")
    if amortization_months <= 0:
        raise ValueError("amortization_months must be > 0")
    if principal_usd == Decimal("0.00"):
        return Decimal("0.00")
    if annual_interest_rate == Decimal("0.00"):
        monthly = (principal_usd / Decimal(amortization_months)).quantize(CENT, rounding=ROUND_HALF_EVEN)
        return (monthly * Decimal(12)).quantize(CENT, rounding=ROUND_HALF_EVEN)

    monthly_rate = annual_interest_rate / Decimal(12)
    compound = (Decimal(1) + monthly_rate) ** amortization_months
    monthly_payment = (principal_usd * (monthly_rate * compound) / (compound - Decimal(1))).quantize(
        CENT, rounding=ROUND_HALF_EVEN
    )
    return (monthly_payment * Decimal(12)).quantize(CENT, rounding=ROUND_HALF_EVEN)


@dataclass(frozen=True)
class SBACapitalStructureInput:
    total_project_cost_usd: Decimal
    appraised_owner_occupied_cre_usd: Decimal
    sba_7a_loan_usd: Decimal
    sba_annual_interest_rate: Decimal
    sba_amortization_months: int
    buyer_cash_equity_usd: Decimal
    seller_standby_note_usd: Decimal
    seller_standby_lock_months: int
    non_controlling_investor_equity_usd: Decimal
    seller_non_standby_note_usd: Decimal
    seller_non_standby_rate: Decimal
    seller_non_standby_amort_months: int
    seller_consulting_months: int
    adjusted_ebitda_post_gm_usd: Decimal
    annual_maintenance_capex_usd: Decimal
    annual_cash_taxes_usd: Decimal


@dataclass(frozen=True)
class SBAUnderwritingResult:
    is_sba_compliant: bool
    is_mandate_compliant: bool
    base_dscr: Decimal
    stress_dscr: Decimal
    cash_on_cash_return_pct: Decimal
    total_annual_debt_service_usd: Decimal
    stressed_annual_debt_service_usd: Decimal
    net_cash_flow_for_debt_service_usd: Decimal
    stressed_net_cash_flow_usd: Decimal
    total_equity_injection_pct: Decimal
    limited_equity_share_of_required_pct: Decimal
    buyer_cash_pct_of_project: Decimal
    independent_qoe_required: bool
    independent_valuation_required: bool
    violation_codes: List[str]


def evaluate_sba_sop_50_10_8_1(inp: SBACapitalStructureInput) -> SBAUnderwritingResult:
    """
    Deterministic SBA SOP 50 10 8.1 (effective October 1, 2026) & Mandate ROA-SMB-01 Underwriter.
    """
    for field_name in (
        "total_project_cost_usd",
        "appraised_owner_occupied_cre_usd",
        "sba_7a_loan_usd",
        "sba_annual_interest_rate",
        "buyer_cash_equity_usd",
        "seller_standby_note_usd",
        "non_controlling_investor_equity_usd",
        "seller_non_standby_note_usd",
        "seller_non_standby_rate",
        "adjusted_ebitda_post_gm_usd",
        "annual_maintenance_capex_usd",
        "annual_cash_taxes_usd",
    ):
        _ensure_decimal(getattr(inp, field_name), field_name)

    if inp.total_project_cost_usd <= Decimal("0.00"):
        raise ValueError("total_project_cost_usd must be > 0")

    violations: List[str] = []

    # 1. Sources == Uses Verification (to the exact cent)
    total_sources = (
        inp.sba_7a_loan_usd
        + inp.buyer_cash_equity_usd
        + inp.seller_standby_note_usd
        + inp.non_controlling_investor_equity_usd
        + inp.seller_non_standby_note_usd
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)
    expected_uses = inp.total_project_cost_usd.quantize(CENT, rounding=ROUND_HALF_EVEN)
    if total_sources != expected_uses:
        violations.append(f"SOURCES_USES_IMBALANCE:{total_sources}!={expected_uses}")

    # 2. Equity Injection & Limited Equity Sources 50% Cap (SBA SOP 50 10 8.1)
    required_injection_usd = (inp.total_project_cost_usd * SBA_MIN_EQUITY_INJECTION_PCT).quantize(
        CENT, rounding=ROUND_HALF_EVEN
    )
    limited_equity_usd = inp.seller_standby_note_usd + inp.non_controlling_investor_equity_usd
    total_qualifying_equity_usd = inp.buyer_cash_equity_usd + limited_equity_usd

    total_equity_pct = (total_qualifying_equity_usd / inp.total_project_cost_usd).quantize(
        FOUR_DEC, rounding=ROUND_HALF_EVEN
    )
    buyer_cash_pct = (inp.buyer_cash_equity_usd / inp.total_project_cost_usd).quantize(
        FOUR_DEC, rounding=ROUND_HALF_EVEN
    )
    # Under SOP 50 10 8.1, Limited Equity Sources countable toward the required 10% injection
    # cannot exceed 50% of the required 10% injection.
    limited_share_of_required = (
        (limited_equity_usd / required_injection_usd).quantize(FOUR_DEC, rounding=ROUND_HALF_EVEN)
        if required_injection_usd > Decimal("0.00")
        else Decimal("0.0000")
    )

    if total_equity_pct < SBA_MIN_EQUITY_INJECTION_PCT:
        violations.append(f"SBA_EQUITY_INJECTION_BELOW_10PCT:{total_equity_pct}")
    if buyer_cash_pct < SBA_MIN_BUYER_CASH_PCT:
        violations.append(f"SBA_LIMITED_EQUITY_CAP_BREACH_BUYER_CASH_LT_5PCT:{buyer_cash_pct}")
    if inp.seller_standby_note_usd > Decimal("0.00") and inp.seller_standby_lock_months < SBA_MIN_SELLER_STANDBY_MONTHS:
        violations.append(f"SBA_STANDBY_LOCK_LT_36_MONTHS:{inp.seller_standby_lock_months}")

    # 3. Seller Consulting Transition Cap (<= 24 Months under SOP 50 10 8.1)
    if inp.seller_consulting_months > SBA_MAX_SELLER_CONSULTING_MONTHS:
        violations.append(f"SBA_SELLER_CONSULTING_GT_24_MONTHS:{inp.seller_consulting_months}")

    # 4. Mandatory QoE Check (>= $3,000,000 net of appraised owner-occupied CRE)
    loan_net_of_cre = max(Decimal("0.00"), inp.sba_7a_loan_usd - inp.appraised_owner_occupied_cre_usd)
    independent_qoe_required = loan_net_of_cre >= SBA_MANDATORY_QOE_EX_CRE_USD
    independent_valuation_required = True  # Mandatory on every change-of-ownership loan under SOP 50 10 8.1

    # 5. Base & Stressed Debt Service & DSCR Calculations
    sba_debt_service = calculate_annual_debt_service(
        inp.sba_7a_loan_usd, inp.sba_annual_interest_rate, inp.sba_amortization_months
    )
    non_standby_debt_service = (
        calculate_annual_debt_service(
            inp.seller_non_standby_note_usd, inp.seller_non_standby_rate, inp.seller_non_standby_amort_months
        )
        if inp.seller_non_standby_note_usd > Decimal("0.00")
        else Decimal("0.00")
    )
    # Note: Full-standby seller note has $0.00 P&I payment during the 36-month standby window
    total_debt_service = (sba_debt_service + non_standby_debt_service).quantize(CENT, rounding=ROUND_HALF_EVEN)

    # Stress Scenario: -15% revenue/EBITDA compression AND +200 bps (+0.0200) interest rate shock on SBA loan
    stressed_sba_rate = inp.sba_annual_interest_rate + Decimal("0.0200")
    stressed_sba_debt_service = calculate_annual_debt_service(
        inp.sba_7a_loan_usd, stressed_sba_rate, inp.sba_amortization_months
    )
    stressed_total_debt_service = (stressed_sba_debt_service + non_standby_debt_service).quantize(
        CENT, rounding=ROUND_HALF_EVEN
    )

    net_cash_flow = (
        inp.adjusted_ebitda_post_gm_usd - inp.annual_maintenance_capex_usd - inp.annual_cash_taxes_usd
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)
    stressed_ebitda = (inp.adjusted_ebitda_post_gm_usd * Decimal("0.8500")).quantize(
        CENT, rounding=ROUND_HALF_EVEN
    )
    stressed_taxes = (inp.annual_cash_taxes_usd * Decimal("0.8500")).quantize(CENT, rounding=ROUND_HALF_EVEN)
    stressed_net_cash_flow = (
        stressed_ebitda - inp.annual_maintenance_capex_usd - stressed_taxes
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)

    if total_debt_service <= Decimal("0.00"):
        violations.append("SBA_TOTAL_DEBT_SERVICE_ZERO_OR_NEGATIVE")
        base_dscr = Decimal("0.0000")
        stress_dscr = Decimal("0.0000")
    else:
        base_dscr = (net_cash_flow / total_debt_service).quantize(FOUR_DEC, rounding=ROUND_HALF_EVEN)
        stress_dscr = (
            (stressed_net_cash_flow / stressed_total_debt_service).quantize(
                FOUR_DEC, rounding=ROUND_HALF_EVEN
            )
            if stressed_total_debt_service > Decimal("0.00")
            else Decimal("0.0000")
        )

    if base_dscr < SBA_MIN_HISTORICAL_DSCR:
        violations.append(f"SBA_DSCR_BELOW_1_25X:{base_dscr}")
    if base_dscr < PRINCIPAL_MIN_BASE_DSCR:
        violations.append(f"MANDATE_BASE_DSCR_BELOW_1_35X:{base_dscr}")
    if stress_dscr < PRINCIPAL_MIN_STRESS_DSCR:
        violations.append(f"MANDATE_STRESS_DSCR_BELOW_1_15X:{stress_dscr}")

    # 6. Cash-on-Cash Return on Buyer Cash Equity
    free_cash_flow_after_debt = (net_cash_flow - total_debt_service).quantize(CENT, rounding=ROUND_HALF_EVEN)
    cash_on_cash = (
        (free_cash_flow_after_debt / inp.buyer_cash_equity_usd).quantize(FOUR_DEC, rounding=ROUND_HALF_EVEN)
        if inp.buyer_cash_equity_usd > Decimal("0.00")
        else Decimal("0.0000")
    )

    sba_violations = [v for v in violations if v.startswith("SBA_") or v.startswith("SOURCES_")]
    return SBAUnderwritingResult(
        is_sba_compliant=(len(sba_violations) == 0),
        is_mandate_compliant=(len(violations) == 0),
        base_dscr=base_dscr,
        stress_dscr=stress_dscr,
        cash_on_cash_return_pct=cash_on_cash,
        total_annual_debt_service_usd=total_debt_service,
        stressed_annual_debt_service_usd=stressed_total_debt_service,
        net_cash_flow_for_debt_service_usd=net_cash_flow,
        stressed_net_cash_flow_usd=stressed_net_cash_flow,
        total_equity_injection_pct=total_equity_pct,
        limited_equity_share_of_required_pct=limited_share_of_required,
        buyer_cash_pct_of_project=buyer_cash_pct,
        independent_qoe_required=independent_qoe_required,
        independent_valuation_required=independent_valuation_required,
        violation_codes=violations,
    )

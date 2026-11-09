from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import List

CENT = Decimal("0.01")
ROANOKE_REPLACEMENT_GM_SALARY_USD = Decimal("85000.00")


@dataclass(frozen=True)
class AddBackItem:
    category: str
    amount_usd: Decimal
    has_cpa_or_tax_return_proof: bool
    is_guru_synergy_claim: bool = False


@dataclass(frozen=True)
class QualityOfEarningsInput:
    reported_net_income_usd: Decimal
    interest_expense_usd: Decimal
    tax_expense_usd: Decimal
    depreciation_amortization_usd: Decimal
    owner_compensation_on_books_usd: Decimal
    owner_hours_per_week: int
    proposed_addbacks: List[AddBackItem]
    trailing_12m_nwc_balances_usd: List[Decimal]


@dataclass(frozen=True)
class QualityOfEarningsResult:
    reported_sde_usd: Decimal
    verified_addbacks_usd: Decimal
    disallowed_unproven_addbacks_usd: Decimal
    replacement_gm_deduction_usd: Decimal
    adjusted_ebitda_post_gm_usd: Decimal
    working_capital_peg_12m_avg_usd: Decimal
    audit_flags: List[str]


def audit_ebitda_and_working_capital(inp: QualityOfEarningsInput) -> QualityOfEarningsResult:
    """
    Deterministic Add-Back Auditor & 12-Month Net Working Capital Peg Calculator.
    Disallows unproven lifestyle add-backs and guru synergy claims, and deducts a mandatory
    $85,000/yr replacement General Manager salary when owner works >20 hours/week.
    """
    base_ebitda = (
        inp.reported_net_income_usd
        + inp.interest_expense_usd
        + inp.tax_expense_usd
        + inp.depreciation_amortization_usd
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)

    verified_addbacks = Decimal("0.00")
    disallowed_addbacks = Decimal("0.00")
    flags: List[str] = []

    for item in inp.proposed_addbacks:
        if not isinstance(item.amount_usd, Decimal):
            raise TypeError("AddBackItem.amount_usd must be a decimal.Decimal")
        if item.is_guru_synergy_claim:
            disallowed_addbacks += item.amount_usd
            flags.append(f"DISALLOWED_GURU_SYNERGY_CLAIM:{item.category}:{item.amount_usd}")
        elif not item.has_cpa_or_tax_return_proof:
            disallowed_addbacks += item.amount_usd
            flags.append(f"UNPROVEN_ADDBACK_DISALLOWED:{item.category}:{item.amount_usd}")
        else:
            verified_addbacks += item.amount_usd

    reported_sde = (
        base_ebitda + inp.owner_compensation_on_books_usd + verified_addbacks + disallowed_addbacks
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)

    # Mandatory Replacement GM Salary Deduction for Roanoke ($85,000/yr if owner works >20 hrs/wk)
    gm_deduction = (
        ROANOKE_REPLACEMENT_GM_SALARY_USD if inp.owner_hours_per_week > 20 else Decimal("0.00")
    )

    adjusted_ebitda = (
        base_ebitda + inp.owner_compensation_on_books_usd + verified_addbacks - gm_deduction
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)

    if not inp.trailing_12m_nwc_balances_usd or len(inp.trailing_12m_nwc_balances_usd) != 12:
        raise ValueError("trailing_12m_nwc_balances_usd must contain exactly 12 monthly Decimal balances")

    nwc_sum = sum(inp.trailing_12m_nwc_balances_usd, Decimal("0.00"))
    nwc_peg = (nwc_sum / Decimal(12)).quantize(CENT, rounding=ROUND_HALF_EVEN)

    return QualityOfEarningsResult(
        reported_sde_usd=reported_sde,
        verified_addbacks_usd=verified_addbacks.quantize(CENT, rounding=ROUND_HALF_EVEN),
        disallowed_unproven_addbacks_usd=disallowed_addbacks.quantize(CENT, rounding=ROUND_HALF_EVEN),
        replacement_gm_deduction_usd=gm_deduction,
        adjusted_ebitda_post_gm_usd=adjusted_ebitda,
        working_capital_peg_12m_avg_usd=nwc_peg,
        audit_flags=flags,
    )

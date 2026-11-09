from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_EVEN
from typing import List

CENT = Decimal("0.01")
FOUR_DEC = Decimal("0.0001")

# Code of Virginia § 55.1-321 Minimum Commercial Notice Window (14 Calendar Days)
VA_MIN_COMMERCIAL_NOTICE_DAYS = 14
MANDATE_MAX_BASIS_TO_REPLACEMENT = Decimal("0.7000")


@dataclass(frozen=True)
class VirginiaForeclosureInput:
    notice_published_date: date
    scheduled_sale_date: date
    senior_deed_of_trust_payoff_usd: Decimal
    delinquent_real_estate_tax_usd: Decimal
    trustee_and_legal_fees_usd: Decimal
    immediate_stabilization_capex_usd: Decimal
    verified_assessed_or_replacement_usd: Decimal
    has_environmental_lust_violation: bool = False
    is_in_uninsured_fema_floodway: bool = False


@dataclass(frozen=True)
class VirginiaForeclosureResult:
    is_statutorily_valid: bool
    is_mandate_basis_compliant: bool
    notice_lead_days: int
    total_all_in_cure_basis_usd: Decimal
    basis_to_replacement_ratio: Decimal
    equity_cushion_pct: Decimal
    defect_and_risk_codes: List[str]


def evaluate_va_foreclosure_basis(inp: VirginiaForeclosureInput) -> VirginiaForeclosureResult:
    """
    Deterministic Virginia Non-Judicial Substitute Trustee & Tax Sale Underwriter
    (Va. Code §§ 55.1-320 to 55.1-322).
    """
    for name in (
        "senior_deed_of_trust_payoff_usd",
        "delinquent_real_estate_tax_usd",
        "trustee_and_legal_fees_usd",
        "immediate_stabilization_capex_usd",
        "verified_assessed_or_replacement_usd",
    ):
        val = getattr(inp, name)
        if not isinstance(val, Decimal):
            raise TypeError(f"{name} must be a decimal.Decimal")

    if inp.verified_assessed_or_replacement_usd <= Decimal("0.00"):
        raise ValueError("verified_assessed_or_replacement_usd must be > 0")

    defects: List[str] = []

    # 1. Va. Code § 55.1-321 14-Day Commercial Notice Check
    lead_days = (inp.scheduled_sale_date - inp.notice_published_date).days
    if lead_days < VA_MIN_COMMERCIAL_NOTICE_DAYS:
        defects.append(f"STATUTORY_NOTICE_DEFECT_VA_55_1_321_LT_14_DAYS:{lead_days}")

    # 2. All-In Cure / Acquisition Basis vs. Verified Assessed/Replacement Value
    all_in_basis = (
        inp.senior_deed_of_trust_payoff_usd
        + inp.delinquent_real_estate_tax_usd
        + inp.trustee_and_legal_fees_usd
        + inp.immediate_stabilization_capex_usd
    ).quantize(CENT, rounding=ROUND_HALF_EVEN)

    basis_ratio = (all_in_basis / inp.verified_assessed_or_replacement_usd).quantize(
        FOUR_DEC, rounding=ROUND_HALF_EVEN
    )
    equity_cushion = (Decimal("1.0000") - basis_ratio).quantize(FOUR_DEC, rounding=ROUND_HALF_EVEN)

    if basis_ratio > MANDATE_MAX_BASIS_TO_REPLACEMENT:
        defects.append(f"FAIL_EXCEEDS_70PCT_BASIS_CEILING:{basis_ratio}")

    # 3. Hard Environmental / Floodway Kill Checks
    if inp.has_environmental_lust_violation:
        defects.append("ENV_RISK_OPEN_EPA_LUST_VIOLATION")
    if inp.is_in_uninsured_fema_floodway:
        defects.append("FLOOD_RISK_UNINSURED_FEMA_FLOODWAY")

    statutory_ok = lead_days >= VA_MIN_COMMERCIAL_NOTICE_DAYS
    mandate_ok = len(defects) == 0
    return VirginiaForeclosureResult(
        is_statutorily_valid=statutory_ok,
        is_mandate_basis_compliant=mandate_ok,
        notice_lead_days=lead_days,
        total_all_in_cure_basis_usd=all_in_basis,
        basis_to_replacement_ratio=basis_ratio,
        equity_cushion_pct=equity_cushion,
        defect_and_risk_codes=defects,
    )

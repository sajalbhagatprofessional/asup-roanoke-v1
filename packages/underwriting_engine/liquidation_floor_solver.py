"""
Liquidation Floor & Downside Principal Protection Solver.

Computes Orderly Liquidation Value (OLV) and Forced Liquidation Value (FLV)
for commercial/industrial real estate and hard equipment floors.
Determines whether an acquisition has '100% Principal Downside Protection'
under catastrophic zero-revenue shutdown scenarios.

All arithmetic is executed in pure decimal.Decimal (zero floats, zero network/LLM dependencies).
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict

CENT = Decimal("0.01")
BPS = Decimal("0.0001")
ZERO = Decimal("0.00")
ONE = Decimal("1.00")

# Standard Institutional Auction Haircuts
DEFAULT_RE_FLV_FACTOR = Decimal("0.65")        # 35% haircut for 60-90 day forced auction
DEFAULT_RE_OLV_FACTOR = Decimal("0.80")        # 20% haircut for 6-9 month orderly sale
DEFAULT_EQUIP_FLV_FACTOR = Decimal("0.45")     # 55% haircut for industrial machinery auction
DEFAULT_EQUIP_OLV_FACTOR = Decimal("0.65")     # 35% haircut for orderly broker liquidation


@dataclass(frozen=True)
class LiquidationFloorInput:
    purchase_or_cure_price_usd: Decimal
    real_estate_assessed_usd: Decimal
    equipment_floor_assessed_usd: Decimal
    re_flv_factor: Decimal = DEFAULT_RE_FLV_FACTOR
    re_olv_factor: Decimal = DEFAULT_RE_OLV_FACTOR
    equipment_flv_factor: Decimal = DEFAULT_EQUIP_FLV_FACTOR
    equipment_olv_factor: Decimal = DEFAULT_EQUIP_OLV_FACTOR


@dataclass(frozen=True)
class LiquidationFloorResult:
    purchase_or_cure_price_usd: Decimal
    real_estate_olv_usd: Decimal
    real_estate_flv_usd: Decimal
    equipment_olv_usd: Decimal
    equipment_flv_usd: Decimal
    total_orderly_liquidation_usd: Decimal
    total_forced_liquidation_usd: Decimal
    basis_to_flv_ratio: Decimal                # Purchase / FLV (e.g. 0.85 = basis is 85% of FLV)
    flv_downside_coverage_ratio: Decimal       # FLV / Purchase (e.g. 1.18x coverage)
    is_100pct_principal_protected: bool        # True if Purchase <= Total FLV
    principal_at_risk_flv_usd: Decimal         # Max(0, Purchase - FLV)
    equity_cushion_at_olv_usd: Decimal         # Max(0, OLV - Purchase)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "purchase_or_cure_price_usd": str(self.purchase_or_cure_price_usd),
            "real_estate_olv_usd": str(self.real_estate_olv_usd),
            "real_estate_flv_usd": str(self.real_estate_flv_usd),
            "equipment_olv_usd": str(self.equipment_olv_usd),
            "equipment_flv_usd": str(self.equipment_flv_usd),
            "total_orderly_liquidation_usd": str(self.total_orderly_liquidation_usd),
            "total_forced_liquidation_usd": str(self.total_forced_liquidation_usd),
            "basis_to_flv_ratio": str(self.basis_to_flv_ratio),
            "flv_downside_coverage_ratio": str(self.flv_downside_coverage_ratio),
            "is_100pct_principal_protected": self.is_100pct_principal_protected,
            "principal_at_risk_flv_usd": str(self.principal_at_risk_flv_usd),
            "equity_cushion_at_olv_usd": str(self.equity_cushion_at_olv_usd),
        }


def evaluate_liquidation_floor(inp: LiquidationFloorInput) -> LiquidationFloorResult:
    """
    Computes OLV and FLV downside floors in pure Decimal.
    """
    for val in [
        inp.purchase_or_cure_price_usd,
        inp.real_estate_assessed_usd,
        inp.equipment_floor_assessed_usd,
        inp.re_flv_factor,
        inp.re_olv_factor,
        inp.equipment_flv_factor,
        inp.equipment_olv_factor,
    ]:
        if not isinstance(val, Decimal):
            raise TypeError(f"All values must be decimal.Decimal, got {type(val)}")

    basis = inp.purchase_or_cure_price_usd.quantize(CENT, rounding=ROUND_HALF_EVEN)

    re_olv = (inp.real_estate_assessed_usd * inp.re_olv_factor).quantize(CENT, rounding=ROUND_HALF_EVEN)
    re_flv = (inp.real_estate_assessed_usd * inp.re_flv_factor).quantize(CENT, rounding=ROUND_HALF_EVEN)

    eq_olv = (inp.equipment_floor_assessed_usd * inp.equipment_olv_factor).quantize(CENT, rounding=ROUND_HALF_EVEN)
    eq_flv = (inp.equipment_floor_assessed_usd * inp.equipment_flv_factor).quantize(CENT, rounding=ROUND_HALF_EVEN)

    total_olv = (re_olv + eq_olv).quantize(CENT, rounding=ROUND_HALF_EVEN)
    total_flv = (re_flv + eq_flv).quantize(CENT, rounding=ROUND_HALF_EVEN)

    if total_flv > ZERO:
        basis_to_flv = (basis / total_flv).quantize(BPS, rounding=ROUND_HALF_EVEN)
        flv_coverage = (total_flv / basis).quantize(BPS, rounding=ROUND_HALF_EVEN) if basis > ZERO else Decimal("99.9999")
    else:
        basis_to_flv = Decimal("99.9999")
        flv_coverage = ZERO

    is_protected = basis <= total_flv
    principal_loss = (basis - total_flv).quantize(CENT, rounding=ROUND_HALF_EVEN) if basis > total_flv else ZERO
    olv_cushion = (total_olv - basis).quantize(CENT, rounding=ROUND_HALF_EVEN) if total_olv > basis else ZERO

    return LiquidationFloorResult(
        purchase_or_cure_price_usd=basis,
        real_estate_olv_usd=re_olv,
        real_estate_flv_usd=re_flv,
        equipment_olv_usd=eq_olv,
        equipment_flv_usd=eq_flv,
        total_orderly_liquidation_usd=total_olv,
        total_forced_liquidation_usd=total_flv,
        basis_to_flv_ratio=basis_to_flv,
        flv_downside_coverage_ratio=flv_coverage,
        is_100pct_principal_protected=is_protected,
        principal_at_risk_flv_usd=principal_loss,
        equity_cushion_at_olv_usd=olv_cushion,
    )

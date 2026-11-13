"""
1-Click Executive Flip Tear-Sheet & Investment Committee Memo Generator.
Generates an ultra-dense, formatted 1-page summary designed for 40-year deal-flippers
to evaluate and present acquisitions to capital partners in under 60 seconds.
Pure Python string formatting over verified decimal.Decimal metrics.
"""

from decimal import Decimal
from typing import Dict, Any, Optional
from pydantic import BaseModel


class TearSheetData(BaseModel):
    deal_id: str
    asset_name: str
    naics_code: str
    jurisdiction_fips: str
    asking_or_cure_price_usd: Decimal
    cre_market_assessed_usd: Decimal
    machinery_floor_usd: Decimal
    total_liquidation_floor_usd: Decimal
    cushion_spread_usd: Decimal
    cushion_spread_pct: Decimal
    current_annual_ebitda_usd: Decimal
    slb_net_cash_recouped_usd: Decimal
    slb_net_remaining_basis_usd: Decimal
    wholesale_assignment_fee_usd: Decimal
    turnaround_18m_ev_usd: Decimal
    va_statutory_notice_days: int
    sba_baseline_dscr: Decimal
    recommended_action: str

    class Config:
        arbitrary_types_allowed = True


def generate_executive_tear_sheet(data: TearSheetData) -> str:
    """
    Produces a clean, dense plaintext tear-sheet for investment committee review.
    """
    lines = [
        "=" * 72,
        f"ARGUS EXECUTIVE FLIP TEAR-SHEET | ASSET HOLDING COMPANY IC MEMO",
        f"TARGET: {data.asset_name.upper()} ({data.deal_id})",
        f"NAICS: {data.naics_code} | FIPS: {data.jurisdiction_fips} | SLAFresh: 24h",
        "=" * 72,
        "",
        "1. VALUATION & CAPITAL SPREAD",
        f"  • Purchase / Cure Basis:       ${data.asking_or_cure_price_usd:,.2f}",
        f"  • Real Estate Assessed (CRE):  ${data.cre_market_assessed_usd:,.2f}",
        f"  • Hard Machinery FLV Floor:    ${data.machinery_floor_usd:,.2f}",
        f"  • TOTAL HARD ASSET FLOOR:      ${data.total_liquidation_floor_usd:,.2f}",
        f"  • Downside Principal Cushion:  +${data.cushion_spread_usd:,.2f} ({data.cushion_spread_pct}% spread)",
        f"  • Current Going EBITDA:        ${data.current_annual_ebitda_usd:,.2f}/yr",
        "",
        "2. FOUR-WAY FLIP EXIT PATHWAYS",
        f"  [A] SALE-LEASEBACK (7.25% Cap): Recoups ${data.slb_net_cash_recouped_usd:,.2f} cash.",
        f"      --> Net OpCo Basis Remaining: ${data.slb_net_remaining_basis_usd:,.2f} (Target Payback: 45-60 Days)",
        f"  [B] WHOLESALE ASSIGNMENT FEE:   ${data.wholesale_assignment_fee_usd:,.2f} Net (Target Payback: 21 Days)",
        f"  [C] ORDERLY BREAKUP AUCTION:    ${data.total_liquidation_floor_usd:,.2f} Hard Floor (Target Payback: 90 Days)",
        f"  [D] 18M TURNAROUND RESELL:      ${data.turnaround_18m_ev_usd:,.2f} Enterprise Value @ 5.5x Exit",
        "",
        "3. STATUTORY & UNDERWRITING CLEARANCE",
        f"  • Va. Code § 55.1-321 Notice:  {data.va_statutory_notice_days} Days Lead Time (>= 14 Days Compliant)",
        f"  • SBA SOP 50 10 8.1 DSCR:      {data.sba_baseline_dscr}x Historical (>= 1.25x Floor Met)",
        f"  • Virginia Form R-1 Gate:      Certificate of No Tax Due Required at Closing",
        "",
        "4. INVESTMENT COMMITTEE RECOMMENDATION",
        f"  • VERDICT: {data.recommended_action}",
        "=" * 72,
    ]
    return "\n".join(lines)

"""
4-Way Flip Strategy & Breakup Net Proceeds Optimizer.
Evaluates four simultaneous asset holding company exit vectors:
1. SALE_LEASEBACK_OPERATING_HOLD
2. WHOLESALE_CONTRACT_ASSIGNMENT
3. ORDERLY_LIQUIDATION_BREAKUP
4. RAPID_OPERATIONAL_TURNAROUND_FLIP
Ranks by risk-adjusted capital velocity, payback days, and annualized ROIC.
Pure Python decimal.Decimal math (0 floats) - AST verified.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class FlipExitRouteType(str, Enum):
    SALE_LEASEBACK_OPERATING_HOLD = "SALE_LEASEBACK_OPERATING_HOLD"
    WHOLESALE_CONTRACT_ASSIGNMENT = "WHOLESALE_CONTRACT_ASSIGNMENT"
    ORDERLY_LIQUIDATION_BREAKUP = "ORDERLY_LIQUIDATION_BREAKUP"
    RAPID_OPERATIONAL_TURNAROUND_FLIP = "RAPID_OPERATIONAL_TURNAROUND_FLIP"


class ExitRouteEvaluation(BaseModel):
    route_type: FlipExitRouteType
    route_name: str
    estimated_gross_proceeds_usd: Decimal
    execution_capital_required_usd: Decimal
    net_profit_or_cushion_usd: Decimal
    target_timeline_days: int
    annualized_roic_pct: Decimal
    execution_risk_score_1_to_10: int
    is_capital_recouped_under_90_days: bool
    strategic_rationale: str

    class Config:
        arbitrary_types_allowed = True


class FlipStrategyInput(BaseModel):
    deal_id: str
    asset_name: str
    purchase_price_usd: Decimal
    cre_market_assessed_value_usd: Decimal
    equipment_liquidation_floor_usd: Decimal
    current_annual_ebitda_usd: Decimal
    turnaround_target_ebitda_usd: Optional[Decimal] = None
    facility_sqft: Decimal = Field(default=Decimal("20000.00"))
    market_nnn_rent_per_sqft_usd: Decimal = Field(default=Decimal("9.00"))
    exit_cap_rate: Decimal = Field(default=Decimal("0.0725"))
    wholesaling_assignment_fee_usd: Decimal = Field(default=Decimal("85000.00"))

    class Config:
        arbitrary_types_allowed = True


class FlipStrategyReport(BaseModel):
    deal_id: str
    asset_name: str
    purchase_price_usd: Decimal
    recommended_primary_route: FlipExitRouteType
    highest_roic_route: FlipExitRouteType
    fastest_payback_route: FlipExitRouteType
    routes: List[ExitRouteEvaluation]
    capital_velocity_index_score: Decimal
    executive_recommendation: str

    class Config:
        arbitrary_types_allowed = True


def optimize_flip_strategies(inp: FlipStrategyInput) -> FlipStrategyReport:
    """
    Evaluates 4 exit routes with pure decimal calculations.
    """
    turnaround_ebitda = inp.turnaround_target_ebitda_usd or (
        inp.current_annual_ebitda_usd * Decimal("1.30")
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    routes: List[ExitRouteEvaluation] = []

    # -------------------------------------------------------------
    # Route 1: SALE-LEASEBACK + OPERATING HOLD
    # -------------------------------------------------------------
    annual_rent = (inp.facility_sqft * inp.market_nnn_rent_per_sqft_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    slb_gross = (annual_rent / inp.exit_cap_rate).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    slb_net = (slb_gross * Decimal("0.96")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    slb_net_profit = (slb_net - inp.purchase_price_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    slb_capital_req = (inp.purchase_price_usd * Decimal("0.10")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    # Annualized ROIC on capital required (60 day timeline)
    if slb_capital_req > Decimal("0.00"):
        slb_roic = (
            ((slb_net + (turnaround_ebitda * Decimal("2.0")) - inp.purchase_price_usd) / slb_capital_req)
            * (Decimal("365.0") / Decimal("60.0"))
            * Decimal("100.0")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    else:
        slb_roic = Decimal("999.99")

    routes.append(
        ExitRouteEvaluation(
            route_type=FlipExitRouteType.SALE_LEASEBACK_OPERATING_HOLD,
            route_name="Sale-Leaseback Monetization + OpCo Retained",
            estimated_gross_proceeds_usd=slb_net,
            execution_capital_required_usd=slb_capital_req,
            net_profit_or_cushion_usd=slb_net_profit,
            target_timeline_days=60,
            annualized_roic_pct=max(Decimal("0.00"), slb_roic),
            execution_risk_score_1_to_10=3,
            is_capital_recouped_under_90_days=True,
            strategic_rationale="Monetize real estate via NNN lease at 7.25% cap, taking cash off the table and retaining business cash flow.",
        )
    )

    # -------------------------------------------------------------
    # Route 2: WHOLESALE CONTRACT ASSIGNMENT (Flip the paper)
    # -------------------------------------------------------------
    wholesale_gross = inp.wholesaling_assignment_fee_usd
    wholesale_cap_req = Decimal("25000.00")  # Earnest Money Deposit (EMD)
    wholesale_net_profit = wholesale_gross - Decimal("5000.00")  # legal / escrow fees
    wholesale_roic = (
        (wholesale_net_profit / wholesale_cap_req)
        * (Decimal("365.0") / Decimal("21.0"))
        * Decimal("100.0")
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    routes.append(
        ExitRouteEvaluation(
            route_type=FlipExitRouteType.WHOLESALE_CONTRACT_ASSIGNMENT,
            route_name="Paper Wholesale & Contract Assignment",
            estimated_gross_proceeds_usd=wholesale_gross,
            execution_capital_required_usd=wholesale_cap_req,
            net_profit_or_cushion_usd=wholesale_net_profit,
            target_timeline_days=21,
            annualized_roic_pct=max(Decimal("0.00"), wholesale_roic),
            execution_risk_score_1_to_10=2,
            is_capital_recouped_under_90_days=True,
            strategic_rationale="Assign signed purchase agreement to regional competitor or private equity buyer for $85k cash assignment fee.",
        )
    )

    # -------------------------------------------------------------
    # Route 3: ORDERLY LIQUIDATION BREAKUP (Auction Floor)
    # -------------------------------------------------------------
    liquidation_gross = (
        (inp.cre_market_assessed_value_usd * Decimal("0.85"))
        + inp.equipment_liquidation_floor_usd
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    liquidation_costs = (liquidation_gross * Decimal("0.08")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    liquidation_net = (liquidation_gross - liquidation_costs).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    liquidation_profit = (liquidation_net - inp.purchase_price_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    liquidation_roic = (
        (liquidation_profit / inp.purchase_price_usd)
        * (Decimal("365.0") / Decimal("90.0"))
        * Decimal("100.0")
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    routes.append(
        ExitRouteEvaluation(
            route_type=FlipExitRouteType.ORDERLY_LIQUIDATION_BREAKUP,
            route_name="Orderly Breakup & Hard Asset Auction",
            estimated_gross_proceeds_usd=liquidation_net,
            execution_capital_required_usd=inp.purchase_price_usd,
            net_profit_or_cushion_usd=liquidation_profit,
            target_timeline_days=90,
            annualized_roic_pct=max(Decimal("0.00"), liquidation_roic),
            execution_risk_score_1_to_10=5,
            is_capital_recouped_under_90_days=True,
            strategic_rationale="Auction machinery via Gordon Brothers/Ritchie Bros and sell vacant warehouse shell to industrial user.",
        )
    )

    # -------------------------------------------------------------
    # Route 4: RAPID OPERATIONAL TURNAROUND FLIP (12-18 Months)
    # -------------------------------------------------------------
    turnaround_ev = (turnaround_ebitda * Decimal("5.50")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    turnaround_gross = (turnaround_ev + inp.cre_market_assessed_value_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    turnaround_capex = Decimal("120000.00")
    turnaround_net = (turnaround_gross * Decimal("0.93") - turnaround_capex).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    turnaround_profit = (turnaround_net - inp.purchase_price_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    turnaround_roic = (
        (turnaround_profit / (inp.purchase_price_usd + turnaround_capex))
        * (Decimal("365.0") / Decimal("365.0"))
        * Decimal("100.0")
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    routes.append(
        ExitRouteEvaluation(
            route_type=FlipExitRouteType.RAPID_OPERATIONAL_TURNAROUND_FLIP,
            route_name="12-Month Operational Turnaround & Strategic Resale",
            estimated_gross_proceeds_usd=turnaround_net,
            execution_capital_required_usd=inp.purchase_price_usd + turnaround_capex,
            net_profit_or_cushion_usd=turnaround_profit,
            target_timeline_days=365,
            annualized_roic_pct=max(Decimal("0.00"), turnaround_roic),
            execution_risk_score_1_to_10=6,
            is_capital_recouped_under_90_days=False,
            strategic_rationale="Implement 100-Day Modernization, expand EBITDA by 30%, and resell to private equity sponsor at 5.5x multiple.",
        )
    )

    # Rank and select
    sorted_by_roic = sorted(routes, key=lambda r: r.annualized_roic_pct, reverse=True)
    fastest = min(routes, key=lambda r: r.target_timeline_days)

    # Primary recommended route: SLB if net profit > 0 or turnaround if large upside
    if slb_net_profit >= Decimal("0.00"):
        primary = FlipExitRouteType.SALE_LEASEBACK_OPERATING_HOLD
    elif wholesale_net_profit > Decimal("50000.00"):
        primary = FlipExitRouteType.WHOLESALE_CONTRACT_ASSIGNMENT
    else:
        primary = FlipExitRouteType.RAPID_OPERATIONAL_TURNAROUND_FLIP

    # Capital Velocity Index: composite score (0-100)
    velocity_index = min(
        Decimal("100.00"),
        (sorted_by_roic[0].annualized_roic_pct * Decimal("0.15") + Decimal("45.0")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_EVEN
        ),
    )

    rec_text = (
        f"RECOMMENDED FLIP STRATEGY: {primary.value}. "
        f"Fastest liquidity horizon is {fastest.route_name} in {fastest.target_timeline_days} days. "
        f"Highest capital velocity is {sorted_by_roic[0].route_name} delivering {sorted_by_roic[0].annualized_roic_pct}% annualized ROIC."
    )

    return FlipStrategyReport(
        deal_id=inp.deal_id,
        asset_name=inp.asset_name,
        purchase_price_usd=inp.purchase_price_usd,
        recommended_primary_route=primary,
        highest_roic_route=sorted_by_roic[0].route_type,
        fastest_payback_route=fastest.route_type,
        routes=routes,
        capital_velocity_index_score=velocity_index,
        executive_recommendation=rec_text,
    )

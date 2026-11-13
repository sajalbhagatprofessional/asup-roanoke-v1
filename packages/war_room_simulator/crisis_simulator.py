"""
Palantir War Room™ Multi-Variate Crisis & Stress Simulator
Air-Gapped Pure Python Decimal Solvers (0 Floats, 0 Network, 0 LLM)
Simulates concurrent operational catastrophes and calculates defensive contract covenants.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CrisisSolvencyStatus(str, Enum):
    ROBUST_RESILIENT = "ROBUST_RESILIENT"        # Crisis DSCR >= 1.25x
    MARGINAL_SURVIVOR = "MARGINAL_SURVIVOR"      # 1.00x <= Crisis DSCR < 1.25x
    INSOLVENT_DISTRESS = "INSOLVENT_DISTRESS"    # Crisis DSCR < 1.00x


class DefensiveCovenantProposal(BaseModel):
    covenant_id: str
    covenant_title: str
    trigger_risk: str
    statutory_contract_language: str
    recommended_escrow_holdback_usd: Decimal
    required_signoff_role: str


class OperationalShockInput(BaseModel):
    deal_id: str
    asset_name: str
    naics_code: str
    base_annual_revenue_usd: Decimal = Field(..., ge=Decimal("0.01"))
    base_annual_ebitda_usd: Decimal = Field(..., ge=Decimal("0.01"))
    annual_senior_debt_service_usd: Decimal = Field(..., ge=Decimal("0.01"))
    
    # 5 Concurrent Crisis Shocks (Defaults represent a severe multi-variate test)
    customer_churn_pct: Decimal = Field(default=Decimal("0.1800"), ge=Decimal("0.00"), le=Decimal("0.90"))
    cogs_inflation_pct: Decimal = Field(default=Decimal("0.1200"), ge=Decimal("0.00"), le=Decimal("0.90"))
    unplanned_capex_usd: Decimal = Field(default=Decimal("65000.00"), ge=Decimal("0.00"))
    key_person_recruiting_premium_usd: Decimal = Field(default=Decimal("45000.00"), ge=Decimal("0.00"))
    insurance_cost_shock_pct: Decimal = Field(default=Decimal("0.3500"), ge=Decimal("0.00"), le=Decimal("2.00"))
    baseline_insurance_expense_usd: Decimal = Field(default=Decimal("28000.00"), ge=Decimal("0.00"))
    existing_liquid_cash_reserves_usd: Decimal = Field(default=Decimal("120000.00"), ge=Decimal("0.00"))


class CrisisSimulationResult(BaseModel):
    deal_id: str
    asset_name: str
    base_dscr: Decimal
    crisis_dscr: Decimal
    dscr_compression_pct: Decimal
    stressed_revenue_usd: Decimal
    stressed_ebitda_usd: Decimal
    stressed_annual_debt_service_usd: Decimal
    net_operating_cash_drain_usd: Decimal
    twelve_month_total_burn_usd: Decimal
    recommended_emergency_reserve_usd: Decimal
    is_capital_call_required: bool
    capital_call_shortfall_usd: Decimal
    solvency_status: CrisisSolvencyStatus
    stress_breakdown: Dict[str, Decimal]
    defensive_covenants: List[DefensiveCovenantProposal]
    executive_battle_plan: str


def simulate_operational_crisis(inp: OperationalShockInput) -> CrisisSimulationResult:
    """
    Executes an air-gapped multi-variate crisis simulation using pure decimal arithmetic.
    Applies simultaneous customer concentration flight, direct cost inflation, machine breakdown,
    key person loss, and insurance shock to test cash solvency.
    """
    # 1. Base DSCR
    base_dscr = (inp.base_annual_ebitda_usd / inp.annual_senior_debt_service_usd).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_EVEN
    )

    # 2. Revenue shock from customer churn
    revenue_loss = (inp.base_annual_revenue_usd * inp.customer_churn_pct).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    stressed_revenue = inp.base_annual_revenue_usd - revenue_loss

    # 3. Direct cost surge (COGS shock impacts EBITDA margin)
    # Estimate baseline COGS at 60% of baseline revenue
    estimated_baseline_cogs = (inp.base_annual_revenue_usd * Decimal("0.6000")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    cogs_inflation_drag = (estimated_baseline_cogs * inp.cogs_inflation_pct).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    # 4. Insurance shock
    insurance_drag = (inp.baseline_insurance_expense_usd * inp.insurance_cost_shock_pct).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    # 5. Fixed operational shocks
    key_person_drag = inp.key_person_recruiting_premium_usd
    unplanned_capex = inp.unplanned_capex_usd

    # 6. Compound EBITDA Contraction
    total_ebitda_contraction = (
        (revenue_loss * Decimal("0.4000"))  # Lost gross margin on churned revenue
        + cogs_inflation_drag
        + insurance_drag
        + key_person_drag
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    raw_stressed_ebitda = inp.base_annual_ebitda_usd - total_ebitda_contraction
    stressed_ebitda = max(Decimal("0.00"), raw_stressed_ebitda)

    # 7. Crisis DSCR
    crisis_dscr = (stressed_ebitda / inp.annual_senior_debt_service_usd).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_EVEN
    )

    # 8. DSCR compression percentage
    if base_dscr > Decimal("0.00"):
        dscr_compression_pct = (((base_dscr - crisis_dscr) / base_dscr) * Decimal("100.00")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_EVEN
        )
    else:
        dscr_compression_pct = Decimal("100.00")

    # 9. 12-Month Liquidity Drain & Emergency Reserve
    # Annual cash available for debt service after capex
    operating_cash_after_capex = stressed_ebitda - unplanned_capex
    annual_cash_balance_after_debt = operating_cash_after_capex - inp.annual_senior_debt_service_usd

    if annual_cash_balance_after_debt < Decimal("0.00"):
        twelve_month_total_burn = abs(annual_cash_balance_after_debt)
        net_operating_cash_drain = abs(annual_cash_balance_after_debt)
    else:
        twelve_month_total_burn = Decimal("0.00")
        net_operating_cash_drain = Decimal("0.00")

    # Minimum recommended reserve = 6 months debt service + unplanned capex + key person buffer
    recommended_emergency_reserve = (
        (inp.annual_senior_debt_service_usd * Decimal("0.5000"))
        + unplanned_capex
        + (key_person_drag * Decimal("0.5000"))
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    # Capital call shortfall
    if inp.existing_liquid_cash_reserves_usd < (twelve_month_total_burn + (recommended_emergency_reserve * Decimal("0.5000"))):
        is_capital_call_required = True
        capital_call_shortfall = (
            (twelve_month_total_burn + recommended_emergency_reserve) - inp.existing_liquid_cash_reserves_usd
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    else:
        is_capital_call_required = False
        capital_call_shortfall = Decimal("0.00")

    # 10. Solvency Classification
    if crisis_dscr >= Decimal("1.2500"):
        solvency_status = CrisisSolvencyStatus.ROBUST_RESILIENT
    elif crisis_dscr >= Decimal("1.0000"):
        solvency_status = CrisisSolvencyStatus.MARGINAL_SURVIVOR
    else:
        solvency_status = CrisisSolvencyStatus.INSOLVENT_DISTRESS

    # 11. Defensive Contract Covenants
    defensive_covenants: List[DefensiveCovenantProposal] = []

    if inp.customer_churn_pct >= Decimal("0.1500"):
        holdback_val = (inp.base_annual_ebitda_usd * Decimal("0.2500")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_EVEN
        )
        defensive_covenants.append(
            DefensiveCovenantProposal(
                covenant_id="COV-CUST-RETENTION",
                covenant_title="Key Account Retention Indemnity Escrow",
                trigger_risk=f"Customer concentration churn simulated at {(inp.customer_churn_pct * 100).quantize(Decimal('0.1'))}%",
                statutory_contract_language=(
                    "Seller agrees that $150,000 shall be deposited into third-party escrow for eighteen (18) months post-closing, "
                    "releasable solely upon verification that the top three accounts generate >=85% of baseline trailing revenue."
                ),
                recommended_escrow_holdback_usd=holdback_val,
                required_signoff_role="COUNSEL",
            )
        )

    if inp.unplanned_capex_usd >= Decimal("30000.00"):
        defensive_covenants.append(
            DefensiveCovenantProposal(
                covenant_id="COV-CAPEX-WARRANTY",
                covenant_title="Machinery Operational Warranty & Working Capital Holdback",
                trigger_risk=f"Unplanned immediate machinery replacement risk of ${inp.unplanned_capex_usd:,.2f}",
                statutory_contract_language=(
                    "Seller warrants that all critical machinery is operating in good mechanical order. A $75,000 escrow "
                    "holdback shall be retained for 180 days to cure any latent mechanical failure exceeding $10,000."
                ),
                recommended_escrow_holdback_usd=inp.unplanned_capex_usd,
                required_signoff_role="ANALYST",
            )
        )

    if inp.cogs_inflation_pct >= Decimal("0.1000"):
        defensive_covenants.append(
            DefensiveCovenantProposal(
                covenant_id="COV-SELLER-NOTE-SUBORDINATION",
                covenant_title="Seller Note Performance Subordination & Standby Offset",
                trigger_risk=f"Direct material cost inflation of {(inp.cogs_inflation_pct * 100).quantize(Decimal('0.1'))}%",
                statutory_contract_language=(
                    "In the event trailing twelve-month DSCR falls below 1.15x due to verified material price increases, "
                    "all principal and interest payments on the Seller Note shall immediately pause and convert to non-cumulative standby."
                ),
                recommended_escrow_holdback_usd=Decimal("0.00"),
                required_signoff_role="CPA",
            )
        )

    # 12. Synthesized Executive Battle Plan
    executive_battle_plan = (
        f"WAR ROOM CONCLUSION: Under concurrent operational shocks ({(inp.customer_churn_pct * 100).quantize(Decimal('0.1'))}% customer churn, "
        f"{(inp.cogs_inflation_pct * 100).quantize(Decimal('0.1'))}% inflation, and ${inp.unplanned_capex_usd:,.0f} machinery failure), "
        f"DSCR compresses from {base_dscr}x to {crisis_dscr}x ({dscr_compression_pct}% reduction). "
        f"Status: {solvency_status.value}. "
        f"Total 12-month crisis burn is ${twelve_month_total_burn:,.2f}. "
        f"{'A capital call of $' + f'{capital_call_shortfall:,.2f}' + ' is triggered unless holdbacks are enacted.' if is_capital_call_required else 'Existing reserves cover burn without capital call.'} "
        f"Recommended defensive escrow holdbacks total ${sum(c.recommended_escrow_holdback_usd for c in defensive_covenants):,.2f} across {len(defensive_covenants)} contractual covenants."
    )

    stress_breakdown = {
        "revenue_loss_usd": revenue_loss,
        "cogs_inflation_drag_usd": cogs_inflation_drag,
        "insurance_drag_usd": insurance_drag,
        "key_person_drag_usd": key_person_drag,
        "unplanned_capex_usd": unplanned_capex,
        "total_ebitda_contraction_usd": total_ebitda_contraction,
    }

    return CrisisSimulationResult(
        deal_id=inp.deal_id,
        asset_name=inp.asset_name,
        base_dscr=base_dscr,
        crisis_dscr=crisis_dscr,
        dscr_compression_pct=dscr_compression_pct,
        stressed_revenue_usd=stressed_revenue,
        stressed_ebitda_usd=stressed_ebitda,
        stressed_annual_debt_service_usd=inp.annual_senior_debt_service_usd,
        net_operating_cash_drain_usd=net_operating_cash_drain,
        twelve_month_total_burn_usd=twelve_month_total_burn,
        recommended_emergency_reserve_usd=recommended_emergency_reserve,
        is_capital_call_required=is_capital_call_required,
        capital_call_shortfall_usd=capital_call_shortfall,
        solvency_status=solvency_status,
        stress_breakdown=stress_breakdown,
        defensive_covenants=defensive_covenants,
        executive_battle_plan=executive_battle_plan,
    )

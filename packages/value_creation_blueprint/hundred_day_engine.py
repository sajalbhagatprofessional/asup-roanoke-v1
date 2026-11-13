"""
100-Day Warp Speed™ Post-Acquisition Operating Blueprint
Air-Gapped Pure Python Decimal Solvers (0 Floats, 0 Network, 0 LLM)
Generates chronological week-by-week modernization roadmaps and quantified EBITDA expansion bridges.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ExecutionPhase(str, Enum):
    PHASE_1_STABILIZATION = "PHASE_1_STABILIZATION"        # Weeks 1–2: Custody & Treasury
    PHASE_2_FINANCIAL_TELEMETRY = "PHASE_2_FINANCIAL_TELEMETRY"  # Weeks 3–4: Cloud GL & 13w Cash
    PHASE_3_OPERATIONAL_EFFICIENCY = "PHASE_3_OPERATIONAL_EFFICIENCY"  # Weeks 5–8: Sensors & Retention
    PHASE_4_EXPANSION_SCALE = "PHASE_4_EXPANSION_SCALE"    # Weeks 9–14: Pricing & Multiple Expansion


class WeeklyMilestone(BaseModel):
    week_number: int
    phase: ExecutionPhase
    milestone_title: str
    detailed_action_protocol: str
    responsible_team_role: str
    risk_if_delayed: str
    target_completion_day: int


class EbitdaBridgeComponent(BaseModel):
    lever_name: str
    description: str
    annual_dollar_impact_usd: Decimal
    percentage_of_total_gain_pct: Decimal
    implementation_week: int


class BlueprintInput(BaseModel):
    deal_id: str
    asset_name: str
    naics_code: str
    purchase_price_usd: Decimal = Field(..., ge=Decimal("0.01"))
    baseline_annual_revenue_usd: Decimal = Field(..., ge=Decimal("0.01"))
    baseline_annual_ebitda_usd: Decimal = Field(..., ge=Decimal("0.01"))
    exit_multiple_ev_ebitda: Decimal = Field(default=Decimal("6.50"), ge=Decimal("1.00"))


class HundredDayBlueprintReport(BaseModel):
    deal_id: str
    asset_name: str
    baseline_annual_ebitda_usd: Decimal
    pro_forma_annual_ebitda_usd: Decimal
    total_ebitda_expansion_usd: Decimal
    ebitda_expansion_percentage_pct: Decimal
    initial_enterprise_value_usd: Decimal
    pro_forma_enterprise_value_usd: Decimal
    projected_equity_value_creation_usd: Decimal
    ebitda_bridge_breakdown: List[EbitdaBridgeComponent]
    milestone_schedule: List[WeeklyMilestone]
    executive_execution_thesis: str


def generate_hundred_day_blueprint(inp: BlueprintInput) -> HundredDayBlueprintReport:
    """
    Solves a deterministic 100-day operational blueprint and quantified EBITDA expansion bridge
    using pure Python Decimal arithmetic.
    """
    # 1. EBITDA Expansion Levers
    # Lever A: Pricing Optimization (+3.5% on revenue with zero volume loss)
    pricing_gain = (inp.baseline_annual_revenue_usd * Decimal("0.0350")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    # Lever B: COGS & Vendor Renegotiation (5% savings on estimated 60% COGS)
    estimated_cogs = (inp.baseline_annual_revenue_usd * Decimal("0.6000")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    cogs_gain = (estimated_cogs * Decimal("0.0500")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    # Lever C: Labor & Telemetry Automation (Augury IoT sensor predictive maintenance & overtime reduction)
    labor_gain = (inp.baseline_annual_ebitda_usd * Decimal("0.0800")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    # Lever D: Utility, Solar & Insurance Optimization
    utility_gain = (inp.baseline_annual_ebitda_usd * Decimal("0.0350")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    total_ebitda_gain = pricing_gain + cogs_gain + labor_gain + utility_gain
    pro_forma_ebitda = inp.baseline_annual_ebitda_usd + total_ebitda_gain

    ebitda_expansion_pct = ((total_ebitda_gain / inp.baseline_annual_ebitda_usd) * Decimal("100.00")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    # 2. Valuation Expansion
    initial_ev = inp.purchase_price_usd
    pro_forma_ev = (pro_forma_ebitda * inp.exit_multiple_ev_ebitda).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    projected_equity_creation = pro_forma_ev - initial_ev

    # 3. EBITDA Bridge Components
    bridge_components: List[EbitdaBridgeComponent] = [
        EbitdaBridgeComponent(
            lever_name="Pricing Optimization (+3.5%)",
            description="Eliminate legacy owner handshake discounts and re-index billable shop rates to regional median.",
            annual_dollar_impact_usd=pricing_gain,
            percentage_of_total_gain_pct=((pricing_gain / total_ebitda_gain) * Decimal("100.00")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            ),
            implementation_week=10,
        ),
        EbitdaBridgeComponent(
            lever_name="Direct Vendor & COGS Sourcing (5%)",
            description="Consolidate raw material suppliers, capture 2/10 net 30 payment discounts, and audit scrap rates.",
            annual_dollar_impact_usd=cogs_gain,
            percentage_of_total_gain_pct=((cogs_gain / total_ebitda_gain) * Decimal("100.00")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            ),
            implementation_week=4,
        ),
        EbitdaBridgeComponent(
            lever_name="Predictive Maintenance & Overtime (-8%)",
            description="Install Augury acoustic sensors on critical CNC spindles/compressors to eliminate unscheduled downtime.",
            annual_dollar_impact_usd=labor_gain,
            percentage_of_total_gain_pct=((labor_gain / total_ebitda_gain) * Decimal("100.00")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            ),
            implementation_week=7,
        ),
        EbitdaBridgeComponent(
            lever_name="Commercial Energy & Insurance Audit",
            description="Re-bid property casualty policy and execute LED/variable-speed drive mechanical utility retrofit.",
            annual_dollar_impact_usd=utility_gain,
            percentage_of_total_gain_pct=((utility_gain / total_ebitda_gain) * Decimal("100.00")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            ),
            implementation_week=12,
        ),
    ]

    # 4. 14-Week Chronological Milestone Schedule
    milestones: List[WeeklyMilestone] = [
        WeeklyMilestone(
            week_number=1,
            phase=ExecutionPhase.PHASE_1_STABILIZATION,
            milestone_title="Treasury Custody & Banking Signatory Transition",
            detailed_action_protocol="Transfer operational operating accounts to Atlantic Union Bank. Revoke previous owner wire authority. Implement dual-authorization controls for payouts >$5,000.",
            responsible_team_role="PRINCIPAL",
            risk_if_delayed="Unauthorized post-closing cash disbursements by outgoing owner.",
            target_completion_day=7,
        ),
        WeeklyMilestone(
            week_number=2,
            phase=ExecutionPhase.PHASE_1_STABILIZATION,
            milestone_title="All-Hands Retention Meeting & Key Employee Reassurance",
            detailed_action_protocol="Conduct individual interviews with lead shop technicians. Execute 12-month retention bonus agreements with 50% paid at Month 6 and 50% at Month 12.",
            responsible_team_role="ANALYST",
            risk_if_delayed="Immediate technician turnover to local competitors.",
            target_completion_day=14,
        ),
        WeeklyMilestone(
            week_number=3,
            phase=ExecutionPhase.PHASE_2_FINANCIAL_TELEMETRY,
            milestone_title="Cloud GL Migration & 13-Week Cash Forecast",
            detailed_action_protocol="Migrate legacy QuickBooks Desktop to QuickBooks Online/NetSuite. Implement rolling 13-week cash receipts and disbursement telemetry with Monday morning flash reports.",
            responsible_team_role="CPA",
            risk_if_delayed="Blind operational spending and overdraft default.",
            target_completion_day=21,
        ),
        WeeklyMilestone(
            week_number=4,
            phase=ExecutionPhase.PHASE_2_FINANCIAL_TELEMETRY,
            milestone_title="Top 20 Supplier Invoice Audit & Vendor Terms",
            detailed_action_protocol="Audit trailing 24 months of vendor pricing. Negotiate 30-day payment terms and 2% early payment discounts across top 5 parts suppliers.",
            responsible_team_role="CPA",
            risk_if_delayed="Continued margin leakage to unmonitored supplier price increases.",
            target_completion_day=28,
        ),
        WeeklyMilestone(
            week_number=6,
            phase=ExecutionPhase.PHASE_3_OPERATIONAL_EFFICIENCY,
            milestone_title="Augury IoT Sensor Deployment on Core Equipment",
            detailed_action_protocol="Deploy 8 magnetic vibration and ultrasonic sensors across primary drive motors and air compressors. Establish baseline acoustic telemetry in asset health dashboard.",
            responsible_team_role="ANALYST",
            risk_if_delayed="Catastrophic unmonitored motor burnout causing $40k emergency replacement.",
            target_completion_day=42,
        ),
        WeeklyMilestone(
            week_number=8,
            phase=ExecutionPhase.PHASE_3_OPERATIONAL_EFFICIENCY,
            milestone_title="Slow-Moving & Dead Stock Inventory Liquidation",
            detailed_action_protocol="Identify inventory aged >180 days. Execute scrap or discount liquidation to liberate cash into operating reserves under NWC peg agreement.",
            responsible_team_role="ANALYST",
            risk_if_delayed="Working capital trapped in obsolete metal inventory.",
            target_completion_day=56,
        ),
        WeeklyMilestone(
            week_number=10,
            phase=ExecutionPhase.PHASE_4_EXPANSION_SCALE,
            milestone_title="Dynamic Pricing Optimization Rollout (+3.5%)",
            detailed_action_protocol="Audit legacy pricing tiers. Re-price lowest 20% margin SKUs and introduce standard expediting surcharge (+25%) for same-week emergency jobs.",
            responsible_team_role="PRINCIPAL",
            risk_if_delayed="Subsidizing low-margin customers at expense of shop capacity.",
            target_completion_day=70,
        ),
        WeeklyMilestone(
            week_number=12,
            phase=ExecutionPhase.PHASE_4_EXPANSION_SCALE,
            milestone_title="B2B Digital Quoting & Workflow Portal Launch",
            detailed_action_protocol="Launch modern digital portal allowing commercial accounts to submit CAD files and view order fulfillment status in real time.",
            responsible_team_role="ANALYST",
            risk_if_delayed="Lost high-margin regional defense and aerospace contract opportunities.",
            target_completion_day=84,
        ),
        WeeklyMilestone(
            week_number=14,
            phase=ExecutionPhase.PHASE_4_EXPANSION_SCALE,
            milestone_title="100-Day Executive Governance Review & Multiple Expansion",
            detailed_action_protocol="Present pro-forma financial statement to Family Office Investment Committee. Confirm trailing EBITDA expansion rate and establish Year 2 tuck-in M&A mandate.",
            responsible_team_role="PRINCIPAL",
            risk_if_delayed="Loss of strategic acquisition momentum.",
            target_completion_day=100,
        ),
    ]

    thesis = (
        f"100-DAY VALUE BLUEPRINT: Modernization levers expand baseline EBITDA from ${inp.baseline_annual_ebitda_usd:,.2f} "
        f"to ${pro_forma_ebitda:,.2f} (+${total_ebitda_gain:,.2f} or +{ebitda_expansion_pct}%), driven by ${pricing_gain:,.2f} pricing capture, "
        f"${cogs_gain:,.2f} vendor sourcing, and ${labor_gain:,.2f} IoT telemetry efficiency. "
        f"At a {inp.exit_multiple_ev_ebitda}x multiple, Enterprise Value increases from ${initial_ev:,.2f} to ${pro_forma_ev:,.2f}, "
        f"unlocking ${projected_equity_creation:,.2f} in net equity creation across 9 structured milestones."
    )

    return HundredDayBlueprintReport(
        deal_id=inp.deal_id,
        asset_name=inp.asset_name,
        baseline_annual_ebitda_usd=inp.baseline_annual_ebitda_usd,
        pro_forma_annual_ebitda_usd=pro_forma_ebitda,
        total_ebitda_expansion_usd=total_ebitda_gain,
        ebitda_expansion_percentage_pct=ebitda_expansion_pct,
        initial_enterprise_value_usd=initial_ev,
        pro_forma_enterprise_value_usd=pro_forma_ev,
        projected_equity_value_creation_usd=projected_equity_creation,
        ebitda_bridge_breakdown=bridge_components,
        milestone_schedule=milestones,
        executive_execution_thesis=thesis,
    )

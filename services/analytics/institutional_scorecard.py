"""
Institutional 5-Vector Red Flag Matrix & Investment Committee (IC) Scorecard.

Evaluates acquisition opportunities using BlackRock Aladdin Private Markets criteria:
1. Key Man & Governance Risk (Owner dependence vs. dedicated GM)
2. Customer Concentration Risk (Top 3 accounts revenue share)
3. Environmental & Asset Obsolescence (EPA UST, brownfield, flood zone)
4. Title & UCC Subordination (Lien stack, MCA filings, foreclosure notice compliance)
5. Working Capital Health (NWC peg variance, DSO trade credit health)
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


@dataclass(frozen=True)
class InstitutionalScorecardInput:
    deal_id: str
    entity_name: str
    naics_code: str
    asking_price_usd: Decimal
    assessed_replacement_usd: Decimal
    base_dscr: Decimal
    stress_dscr: Decimal
    owner_weekly_hours: int = 15                  # <= 20 hrs/wk is institutional ideal
    has_dedicated_general_manager: bool = True
    top_3_customers_revenue_pct: Decimal = Decimal("0.24")  # 24% (under 30% is prime)
    has_active_lust_or_superfund_risk: bool = False
    is_in_fema_special_flood_area: bool = False
    has_mca_blanket_lien_stacking: bool = False
    has_irs_federal_tax_lien: bool = False
    statutory_foreclosure_notice_days: int = 21   # >= 14 days under Va. Code § 55.1-321
    days_sales_outstanding: int = 38             # <= 45 days is healthy


@dataclass(frozen=True)
class InstitutionalScorecardResult:
    deal_id: str
    entity_name: str
    composite_safety_score: int                   # 0 to 100
    recommendation_tier: str                      # TIER_A_PRIME, TIER_B_SELECT, TIER_C_DEFENSIVE, REJECT
    key_man_score: int                            # 0 to 100
    customer_concentration_score: int             # 0 to 100
    environmental_score: int                      # 0 to 100
    title_subordination_score: int                # 0 to 100
    working_capital_score: int                    # 0 to 100
    red_flag_notes: List[str]
    investment_thesis_bullets: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "deal_id": self.deal_id,
            "entity_name": self.entity_name,
            "composite_safety_score": self.composite_safety_score,
            "recommendation_tier": self.recommendation_tier,
            "key_man_score": self.key_man_score,
            "customer_concentration_score": self.customer_concentration_score,
            "environmental_score": self.environmental_score,
            "title_subordination_score": self.title_subordination_score,
            "working_capital_score": self.working_capital_score,
            "red_flag_notes": self.red_flag_notes,
            "investment_thesis_bullets": self.investment_thesis_bullets,
        }


def evaluate_institutional_scorecard(inp: InstitutionalScorecardInput) -> InstitutionalScorecardResult:
    red_flags: List[str] = []
    theses: List[str] = []

    # 1. Key Man & Governance (Weight: 20%)
    km_score = 100
    if not inp.has_dedicated_general_manager:
        km_score -= 35
        red_flags.append("KEY_MAN_DEFECT: No dedicated GM in place; business relies on owner operations.")
    else:
        theses.append("Autonomous management layer in place with experienced General Manager.")

    if inp.owner_weekly_hours > 35:
        km_score -= 30
        red_flags.append(f"HIGH_OWNER_HOURS: Owner currently works {inp.owner_weekly_hours} hrs/wk; high transition friction.")
    elif inp.owner_weekly_hours > 20:
        km_score -= 15

    km_score = max(0, km_score)

    # 2. Customer Concentration (Weight: 20%)
    cc_score = 100
    if inp.top_3_customers_revenue_pct > Decimal("0.45"):
        cc_score -= 40
        red_flags.append(f"CUSTOMER_CONCENTRATION: Top 3 customers represent {inp.top_3_customers_revenue_pct * Decimal('100.0')}% of revenue (>45% danger threshold).")
    elif inp.top_3_customers_revenue_pct > Decimal("0.30"):
        cc_score -= 20
        red_flags.append(f"MODERATE_CONCENTRATION: Top 3 customers represent {inp.top_3_customers_revenue_pct * Decimal('100.0')}% of revenue.")
    else:
        theses.append("Diversified customer roster; top 3 accounts represent under 30% of aggregate revenue.")

    cc_score = max(0, cc_score)

    # 3. Environmental & Asset Obsolescence (Weight: 20%)
    env_score = 100
    if inp.has_active_lust_or_superfund_risk:
        env_score -= 50
        red_flags.append("ENVIRONMENTAL_CONTAMINATION: Active Leaking Underground Storage Tank (LUST) or EPA Superfund flag.")
    if inp.is_in_fema_special_flood_area:
        env_score -= 25
        red_flags.append("FLOOD_HAZARD: Property is situated in FEMA Special Flood Hazard Area (SFHA Zone A/AE).")

    if not inp.has_active_lust_or_superfund_risk and not inp.is_in_fema_special_flood_area:
        theses.append("Clean Phase I environmental profile outside FEMA 100-year flood zone.")

    env_score = max(0, env_score)

    # 4. Title & UCC Subordination (Weight: 20%)
    title_score = 100
    if inp.has_mca_blanket_lien_stacking:
        title_score -= 40
        red_flags.append("MCA_LIEN_STACK: Staged Merchant Cash Advance blanket liens identified on UCC index.")
    if inp.has_irs_federal_tax_lien:
        title_score -= 35
        red_flags.append("FEDERAL_TAX_LIEN: Active IRS Form 668(Y) payroll tax lien docketed against entity.")
    if inp.statutory_foreclosure_notice_days < 14:
        title_score -= 30
        red_flags.append(f"STATUTORY_NOTICE_DEFECT: Foreclosure notice ({inp.statutory_foreclosure_notice_days} days) violates Va. Code § 55.1-321 14-day minimum.")
    else:
        theses.append(f"Notice requirements met under state foreclosure code ({inp.statutory_foreclosure_notice_days} days provided).")

    title_score = max(0, title_score)

    # 5. Working Capital & Trade Health (Weight: 20%)
    wc_score = 100
    if inp.days_sales_outstanding > 65:
        wc_score -= 35
        red_flags.append(f"DSO_STRETCH: Days Sales Outstanding ({inp.days_sales_outstanding} days) exceeds 65-day risk ceiling.")
    elif inp.days_sales_outstanding > 45:
        wc_score -= 15

    if inp.base_dscr >= Decimal("1.3500"):
        theses.append(f"Strong cash-flow coverage: {inp.base_dscr}x Base DSCR supports debt amortization.")
    else:
        wc_score -= 20
        red_flags.append(f"TIGHT_DSCR: Base DSCR of {inp.base_dscr}x is below 1.35x target hurdle.")

    wc_score = max(0, wc_score)

    # Composite Score (Equal 20% weighting)
    composite = int(
        (Decimal(km_score) * Decimal("0.20"))
        + (Decimal(cc_score) * Decimal("0.20"))
        + (Decimal(env_score) * Decimal("0.20"))
        + (Decimal(title_score) * Decimal("0.20"))
        + (Decimal(wc_score) * Decimal("0.20"))
    )

    if composite >= 80 and not red_flags:
        tier = "TIER_A_PRIME_INSTITUTIONAL"
    elif composite >= 65:
        tier = "TIER_B_SELECT_UNDERWRITE"
    elif composite >= 50:
        tier = "TIER_C_DEFENSIVE_CURE_ONLY"
    else:
        tier = "REJECT_EXCESSIVE_RISK"

    return InstitutionalScorecardResult(
        deal_id=inp.deal_id,
        entity_name=inp.entity_name,
        composite_safety_score=composite,
        recommendation_tier=tier,
        key_man_score=km_score,
        customer_concentration_score=cc_score,
        environmental_score=env_score,
        title_subordination_score=title_score,
        working_capital_score=wc_score,
        red_flag_notes=red_flags,
        investment_thesis_bullets=theses,
    )

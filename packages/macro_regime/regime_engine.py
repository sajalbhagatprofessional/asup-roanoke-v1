"""
Bridgewater Associates 4-Quadrant Macro Economic Regime Stress-Tester.
Simulates Ray Dalio's 4 economic regimes: Reflation, Productivity Expansion,
Stagflation, and Deflationary Deleveraging across pure decimal cash flow models.
100% Pure Python decimal.Decimal (ROUND_HALF_EVEN) with zero floats.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional, Tuple

from packages.macro_regime.models import (
    MacroEconomicQuadrant,
    QuadrantStressResult,
    BridgewaterMacroRegimeReport,
)


class BridgewaterMacroRegimeEngine:
    """
    Quantitative Macro Stress-Testing Engine modeled on Ray Dalio's Economic Machine.
    Evaluates operating companies across the 4 fundamental growth and inflation regimes.
    """

    @staticmethod
    def simulate_4_quadrants(
        deal_id: str,
        entity_name: str,
        naics_code: str,
        base_annual_revenue_usd: Decimal,
        base_normalized_ebitda_usd: Decimal,
        base_annual_debt_service_usd: Decimal,
        base_interest_rate_pct: Decimal = Decimal("8.0500"),
    ) -> BridgewaterMacroRegimeReport:
        """
        Executes multi-quadrant macro stress testing.
        Calculates post-stress EBITDA, debt service, and DSCR under pure decimal arithmetic.
        """
        base_opex = max(Decimal("0.00"), base_annual_revenue_usd - base_normalized_ebitda_usd)
        base_dscr = (
            (base_normalized_ebitda_usd / base_annual_debt_service_usd).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_EVEN
            )
            if base_annual_debt_service_usd > Decimal("0.00")
            else Decimal("99.9999")
        )

        results: List[QuadrantStressResult] = []
        total_points = 0
        min_dscr = Decimal("999.0")
        worst_quadrant = ""

        # REGIME DEFINITIONS
        regimes: List[Dict[str, Any]] = [
            {
                "quadrant": MacroEconomicQuadrant.QUADRANT_1_REFLATION,
                "name": "Quadrant 1: Reflation / Cyclical Expansion",
                "growth": "RISING",
                "inflation": "RISING",
                "rev_shock": Decimal("0.1200"),    # +12% revenue growth
                "opex_shock": Decimal("0.0800"),   # +8% cost inflation
                "rate_shock_bps": Decimal("150"),  # +150 bps rate hike
            },
            {
                "quadrant": MacroEconomicQuadrant.QUADRANT_2_PRODUCTIVITY_BOOM,
                "name": "Quadrant 2: Goldilocks Productivity Expansion",
                "growth": "RISING",
                "inflation": "FALLING",
                "rev_shock": Decimal("0.1000"),    # +10% revenue growth
                "opex_shock": Decimal("-0.0200"),  # -2% efficiency gain
                "rate_shock_bps": Decimal("0"),    # 0 bps rate change
            },
            {
                "quadrant": MacroEconomicQuadrant.QUADRANT_3_STAGFLATION_SHOCK,
                "name": "Quadrant 3: Stagflation Crisis (Dalio Stress Floor)",
                "growth": "FALLING",
                "inflation": "RISING",
                "rev_shock": Decimal("-0.1500"),   # -15% demand contraction
                "opex_shock": Decimal("0.1200"),   # +12% cost inflation (wages, energy, inputs)
                "rate_shock_bps": Decimal("250"),  # +250 bps central bank rate shock
            },
            {
                "quadrant": MacroEconomicQuadrant.QUADRANT_4_DEFLATIONARY_DELEVERAGING,
                "name": "Quadrant 4: Deflationary Deleveraging Contraction",
                "growth": "FALLING",
                "inflation": "FALLING",
                "rev_shock": Decimal("-0.2500"),   # -25% severe liquidity contraction
                "opex_shock": Decimal("-0.0800"),  # -8% sticky opex drop (costs lag sales)
                "rate_shock_bps": Decimal("-100"), # -100 bps policy cuts (credit spread widen)
            },
        ]

        for reg in regimes:
            # 1. Stressed Revenue
            stressed_rev = (base_annual_revenue_usd * (Decimal("1.0000") + reg["rev_shock"])).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            )
            # 2. Stressed Opex
            stressed_opex = (base_opex * (Decimal("1.0000") + reg["opex_shock"])).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            )
            # 3. Stressed EBITDA
            stressed_ebitda = max(Decimal("0.00"), stressed_rev - stressed_opex)

            # 4. Stressed Debt Service
            # Floating rate sensitivity: delta ADS ~= principal * (rate_shock_bps / 10000)
            rate_delta = (reg["rate_shock_bps"] / Decimal("10000.00")).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_EVEN
            )
            rate_multiplier = Decimal("1.0000") + (rate_delta / (base_interest_rate_pct / Decimal("100.00")))
            stressed_ads = (base_annual_debt_service_usd * rate_multiplier).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            )

            # 5. Stressed DSCR
            if stressed_ads > Decimal("0.00"):
                s_dscr = (stressed_ebitda / stressed_ads).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)
            else:
                s_dscr = Decimal("99.9999")

            # 6. Solvency Status & Scoring
            if s_dscr >= Decimal("1.2500"):
                status = "ROBUST_SOLVENT"
                points = 25
            elif s_dscr >= Decimal("1.0000"):
                status = "MARGINAL_STRESS"
                points = 15
            else:
                status = "INSOLVENT_DEFAULT"
                points = 0

            total_points += points
            if s_dscr < min_dscr:
                min_dscr = s_dscr
                worst_quadrant = reg["name"]

            results.append(
                QuadrantStressResult(
                    quadrant=reg["quadrant"],
                    regime_name=reg["name"],
                    growth_trend=reg["growth"],
                    inflation_trend=reg["inflation"],
                    revenue_shock_pct=str((reg["rev_shock"] * Decimal("100.0")).quantize(Decimal("0.1"))),
                    input_cost_inflation_pct=str((reg["opex_shock"] * Decimal("100.0")).quantize(Decimal("0.1"))),
                    rate_shock_bps=str(reg["rate_shock_bps"]),
                    stressed_revenue_usd=str(stressed_rev),
                    stressed_ebitda_usd=str(stressed_ebitda),
                    stressed_annual_debt_service_usd=str(stressed_ads),
                    stressed_dscr=str(s_dscr),
                    solvency_status=status,
                    resilience_points=points,
                )
            )

        # Composite Grade
        if total_points >= 90:
            grade = "ALL_WEATHER_AAA"
        elif total_points >= 75:
            grade = "ROBUST_A"
        elif total_points >= 50:
            grade = "VULNERABLE_B"
        else:
            grade = "FRAGILE_F"

        # Recommended Hedging Strategy
        if min_dscr < Decimal("1.0000"):
            hedging = (
                "CRITICAL: Purchase 3-Year SOFR Interest Rate Cap collar at 7.50% strike "
                "and structure 36-month seller standby note to defer interest during stagflation."
            )
        elif min_dscr < Decimal("1.2500"):
            hedging = "RECOMMENDED: Maintain 6-month debt service liquidity reserve ($140k) in Treasury bills."
        else:
            hedging = "OPTIONAL: Target exhibits exceptional pricing power; unhedged floating debt acceptable."

        synthesis = (
            f"Ray Dalio 4-Quadrant Economic Machine stress simulation for {entity_name} (NAICS {naics_code}). "
            f"Base DSCR: {base_dscr}x. Composite All-Weather Resilience: {total_points}/100 ({grade}). "
            f"Most severe vulnerability in '{worst_quadrant}' with stressed DSCR of {min_dscr}x. "
            f"{hedging}"
        )

        return BridgewaterMacroRegimeReport(
            deal_id=deal_id,
            entity_name=entity_name,
            naics_code=naics_code,
            base_revenue_usd=str(base_annual_revenue_usd),
            base_ebitda_usd=str(base_normalized_ebitda_usd),
            base_annual_debt_service_usd=str(base_annual_debt_service_usd),
            base_dscr=str(base_dscr),
            composite_resilience_score=str(total_points),
            all_weather_grade=grade,
            quadrant_results=results,
            most_severe_threat_quadrant=worst_quadrant,
            recommended_hedging_strategy=hedging,
            dalio_macro_synthesis=synthesis,
        )

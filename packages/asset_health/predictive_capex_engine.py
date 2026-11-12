"""
Predictive Capex Reserve & Equipment Life Engine.
Inspired by unit8co/darts (Industrial Time-Series & Failure Forecasting).
Models machinery degradation curves, Remaining Useful Life (RUL),
and calculates mandatory Year 1-3 capex holdbacks in pure Python decimal.Decimal.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from typing import List

from .models import EquipmentItemRecord, PhysicalConditionTier, PredictiveCapexResult


class PredictiveCapexEngine:
    """
    Computes Year 1, Year 2, and Year 3 machinery capital expenditure curves.
    Evaluates whether uncapitalized machine decay will breach the SBA 1.25x DSCR floor.
    """

    def calculate_capex_reserve_and_dscr_impact(
        self,
        equipment_list: List[EquipmentItemRecord],
        annual_historical_ebitda: Decimal,
        annual_debt_service: Decimal,
    ) -> PredictiveCapexResult:
        """
        Projects mandatory capital expenditure spikes over 36 months based on
        individual equipment remaining useful life (RUL) and condition tiers.
        """
        total_equipment_value = Decimal("0.00")
        year1_capex = Decimal("0.00")
        year2_capex = Decimal("0.00")
        year3_capex = Decimal("0.00")

        for item in equipment_list:
            total_equipment_value += item.original_cost_usd

            # Equipment in CRITICAL condition must be overhauled or replaced in Year 1
            if item.condition_tier == PhysicalConditionTier.CRITICAL:
                # 70% of replacement cost needed Year 1
                year1_capex += item.estimated_replacement_cost_usd * Decimal("0.70")
            elif item.condition_tier == PhysicalConditionTier.POOR:
                # 40% Year 1, 40% Year 2
                year1_capex += item.estimated_replacement_cost_usd * Decimal("0.40")
                year2_capex += item.estimated_replacement_cost_usd * Decimal("0.40")
            elif item.condition_tier == PhysicalConditionTier.FAIR:
                # 20% Year 2, 40% Year 3
                year2_capex += item.estimated_replacement_cost_usd * Decimal("0.20")
                year3_capex += item.estimated_replacement_cost_usd * Decimal("0.40")
            elif item.condition_tier == PhysicalConditionTier.GOOD:
                # Standard 5% ongoing maintenance per year
                year1_capex += item.original_cost_usd * Decimal("0.05")
                year2_capex += item.original_cost_usd * Decimal("0.05")
                year3_capex += item.original_cost_usd * Decimal("0.05")
            elif item.condition_tier == PhysicalConditionTier.EXCELLENT:
                # Minimal 2% maintenance
                year1_capex += item.original_cost_usd * Decimal("0.02")

        year1_capex = year1_capex.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        year2_capex = year2_capex.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        year3_capex = year3_capex.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        total_3year = (year1_capex + year2_capex + year3_capex).quantize(Decimal("0.01"))

        # Base DSCR
        if annual_debt_service > Decimal("0"):
            base_dscr = (annual_historical_ebitda / annual_debt_service).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_EVEN
            )
        else:
            base_dscr = Decimal("99.99")

        # Stressed DSCR deducting annualized 3-year capex reserve: (EBITDA - (Total Capex / 3)) / Debt Service
        annualized_capex = (total_3year / Decimal("3")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        adjusted_ebitda = annual_historical_ebitda - annualized_capex
        if adjusted_ebitda < Decimal("0"):
            adjusted_ebitda = Decimal("0")

        if annual_debt_service > Decimal("0"):
            capex_dscr = (adjusted_ebitda / annual_debt_service).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_EVEN
            )
        else:
            capex_dscr = Decimal("99.99")

        # Check breach of SBA 1.25x floor
        is_breached = capex_dscr < Decimal("1.2500")

        # Recommended Seller Escrow Holdback: 100% of Year 1 Capex if DSCR breached, or 50% if unbreached
        if is_breached:
            holdback = year1_capex + (year2_capex * Decimal("0.50"))
        else:
            holdback = year1_capex * Decimal("0.50")
        holdback = holdback.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

        return PredictiveCapexResult(
            total_equipment_value_usd=total_equipment_value,
            year1_mandatory_capex_usd=year1_capex,
            year2_mandatory_capex_usd=year2_capex,
            year3_mandatory_capex_usd=year3_capex,
            total_3year_capex_reserve_usd=total_3year,
            baseline_annual_dscr=base_dscr,
            capex_adjusted_dscr=capex_dscr,
            is_dscr_breached_by_capex=is_breached,
            recommended_seller_escrow_holdback_usd=holdback,
        )

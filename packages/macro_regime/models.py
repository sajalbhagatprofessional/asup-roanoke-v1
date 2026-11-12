"""
Data contracts for Bridgewater Associates 4-Quadrant Macro Economic Regime Stress-Tester.
"""

from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MacroEconomicQuadrant(str, Enum):
    QUADRANT_1_REFLATION = "QUADRANT_1_REFLATION"
    QUADRANT_2_PRODUCTIVITY_BOOM = "QUADRANT_2_PRODUCTIVITY_BOOM"
    QUADRANT_3_STAGFLATION_SHOCK = "QUADRANT_3_STAGFLATION_SHOCK"
    QUADRANT_4_DEFLATIONARY_DELEVERAGING = "QUADRANT_4_DEFLATIONARY_DELEVERAGING"


class QuadrantStressResult(BaseModel):
    quadrant: MacroEconomicQuadrant
    regime_name: str
    growth_trend: str
    inflation_trend: str
    revenue_shock_pct: str
    input_cost_inflation_pct: str
    rate_shock_bps: str
    stressed_revenue_usd: str
    stressed_ebitda_usd: str
    stressed_annual_debt_service_usd: str
    stressed_dscr: str
    solvency_status: str  # ROBUST_SOLVENT | MARGINAL_STRESS | INSOLVENT_DEFAULT
    resilience_points: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "quadrant": self.quadrant.value,
            "regime_name": self.regime_name,
            "growth_trend": self.growth_trend,
            "inflation_trend": self.inflation_trend,
            "revenue_shock_pct": self.revenue_shock_pct,
            "input_cost_inflation_pct": self.input_cost_inflation_pct,
            "rate_shock_bps": self.rate_shock_bps,
            "stressed_revenue_usd": self.stressed_revenue_usd,
            "stressed_ebitda_usd": self.stressed_ebitda_usd,
            "stressed_annual_debt_service_usd": self.stressed_annual_debt_service_usd,
            "stressed_dscr": self.stressed_dscr,
            "solvency_status": self.solvency_status,
            "resilience_points": self.resilience_points,
        }


class BridgewaterMacroRegimeReport(BaseModel):
    deal_id: str
    entity_name: str
    naics_code: str
    base_revenue_usd: str
    base_ebitda_usd: str
    base_annual_debt_service_usd: str
    base_dscr: str
    composite_resilience_score: str
    all_weather_grade: str  # ALL_WEATHER_AAA | ROBUST_A | VULNERABLE_B | FRAGILE_F
    quadrant_results: List[QuadrantStressResult]
    most_severe_threat_quadrant: str
    recommended_hedging_strategy: str
    dalio_macro_synthesis: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "deal_id": self.deal_id,
            "entity_name": self.entity_name,
            "naics_code": self.naics_code,
            "base_revenue_usd": self.base_revenue_usd,
            "base_ebitda_usd": self.base_ebitda_usd,
            "base_annual_debt_service_usd": self.base_annual_debt_service_usd,
            "base_dscr": self.base_dscr,
            "composite_resilience_score": self.composite_resilience_score,
            "all_weather_grade": self.all_weather_grade,
            "quadrant_results": [q.to_dict() for q in self.quadrant_results],
            "most_severe_threat_quadrant": self.most_severe_threat_quadrant,
            "recommended_hedging_strategy": self.recommended_hedging_strategy,
            "dalio_macro_synthesis": self.dalio_macro_synthesis,
        }

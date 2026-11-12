"""
OpenBB Macroeconomic SOFR Yield Curve & Interest Rate Stress Testing Engine.
Air-gapped deterministic financial simulation engine:
1. Models benchmark yield curves: 1M SOFR, 3M SOFR, 10Y US Treasury, and Wall Street Journal Prime Rate.
2. Simulates 5 dynamic macroeconomic rate shock scenarios (+100 bps, +200 bps, +300 bps, and stagflation).
3. Computes stressed annual debt service, adjusted DSCR, debt-yield ratio, and covenant compliance.

Strict Compliance: Pure Python decimal.Decimal (ROUND_HALF_EVEN), zero float literals, zero network imports.
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class BenchmarkYieldCurve:
    as_of_date: str
    sofr_1m_rate: Decimal
    sofr_3m_rate: Decimal
    treasury_10y_rate: Decimal
    wsj_prime_rate: Decimal
    sba_max_rate_prime_plus_275: Decimal
    senior_bank_spread_bps: int
    openbb_source: str = "OpenBB Macro Hub / Federal Reserve Economic Data (FRED)"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "as_of_date": self.as_of_date,
            "sofr_1m_rate": str(self.sofr_1m_rate),
            "sofr_3m_rate": str(self.sofr_3m_rate),
            "treasury_10y_rate": str(self.treasury_10y_rate),
            "wsj_prime_rate": str(self.wsj_prime_rate),
            "sba_max_rate_prime_plus_275": str(self.sba_max_rate_prime_plus_275),
            "senior_bank_spread_bps": self.senior_bank_spread_bps,
            "openbb_source": self.openbb_source,
        }


@dataclass(frozen=True)
class MacroRateShockResult:
    scenario_id: str
    scenario_name: str
    rate_shock_bps: int
    resulting_interest_rate: Decimal
    stressed_annual_debt_service_usd: Decimal
    annual_debt_service_increase_usd: Decimal
    stressed_ebitda_usd: Decimal
    stressed_dscr: Decimal
    debt_yield_ratio: Decimal
    meets_sba_floor_1_25x: bool
    meets_principal_hurdle_1_15x: bool
    covenant_headroom_usd: Decimal
    risk_assessment: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "scenario_name": self.scenario_name,
            "rate_shock_bps": self.rate_shock_bps,
            "resulting_interest_rate": str(self.resulting_interest_rate),
            "stressed_annual_debt_service_usd": str(self.stressed_annual_debt_service_usd),
            "annual_debt_service_increase_usd": str(self.annual_debt_service_increase_usd),
            "stressed_ebitda_usd": str(self.stressed_ebitda_usd),
            "stressed_dscr": str(self.stressed_dscr),
            "debt_yield_ratio": str(self.debt_yield_ratio),
            "meets_sba_floor_1_25x": self.meets_sba_floor_1_25x,
            "meets_principal_hurdle_1_15x": self.meets_principal_hurdle_1_15x,
            "covenant_headroom_usd": str(self.covenant_headroom_usd),
            "risk_assessment": self.risk_assessment,
        }


@dataclass(frozen=True)
class MacroStressMatrixReport:
    asset_id_or_title: str
    loan_principal_usd: Decimal
    amortization_years: int
    baseline_interest_rate: Decimal
    baseline_annual_ebitda_usd: Decimal
    benchmark_yield_curve: BenchmarkYieldCurve
    scenarios: List[MacroRateShockResult]
    max_rate_shock_tolerated_bps: int
    overall_fragility_tier: str  # "RESILIENT", "MODERATE_SENSITIVITY", "VULNERABLE", "HIGH_RISK_FRAGILE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "asset_id_or_title": self.asset_id_or_title,
            "loan_principal_usd": str(self.loan_principal_usd),
            "amortization_years": self.amortization_years,
            "baseline_interest_rate": str(self.baseline_interest_rate),
            "baseline_annual_ebitda_usd": str(self.baseline_annual_ebitda_usd),
            "benchmark_yield_curve": self.benchmark_yield_curve.to_dict(),
            "scenarios": [s.to_dict() for s in self.scenarios],
            "max_rate_shock_tolerated_bps": self.max_rate_shock_tolerated_bps,
            "overall_fragility_tier": self.overall_fragility_tier,
        }


# Standard Benchmark Yield Curve (Q1/Q2 2026 Reference)
_ACTIVE_YIELD_CURVE = BenchmarkYieldCurve(
    as_of_date="2026-05-01",
    sofr_1m_rate=Decimal("0.0530"),
    sofr_3m_rate=Decimal("0.0525"),
    treasury_10y_rate=Decimal("0.0425"),
    wsj_prime_rate=Decimal("0.0850"),
    sba_max_rate_prime_plus_275=Decimal("0.1125"),
    senior_bank_spread_bps=275,
)


def _calculate_amortizing_payment(principal: Decimal, annual_rate: Decimal, years: int) -> Decimal:
    """
    Computes annual amortizing loan debt service (principal & interest) using pure Decimal arithmetic.
    Uses binomial expansion / iterative compound solver with zero floats.
    """
    if principal <= Decimal("0"):
        return Decimal("0.00")
    if annual_rate <= Decimal("0"):
        return (principal / Decimal(str(years))).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    # Standard annual payment formula: P * r / (1 - (1 + r)^(-n))
    # We compute (1 + r)^n deterministically
    n = years
    factor = Decimal("1.0")
    one_plus_r = Decimal("1.0") + annual_rate
    for _ in range(n):
        factor = factor * one_plus_r

    # Payment = P * [ r * (1+r)^n ] / [ (1+r)^n - 1 ]
    numerator = principal * annual_rate * factor
    denominator = factor - Decimal("1.0")
    payment = (numerator / denominator).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    return payment


class MacroSofrEngine:
    """
    OpenBB-style macroeconomic yield curve and SOFR sensitivity shock engine.
    100% deterministic Decimal calculations with zero floats.
    """

    @classmethod
    def get_active_yield_curve(cls) -> BenchmarkYieldCurve:
        """Returns the active benchmark yield curve."""
        return _ACTIVE_YIELD_CURVE

    @classmethod
    def evaluate_rate_shock_matrix(
        cls,
        loan_principal_usd: Decimal,
        baseline_annual_ebitda_usd: Decimal,
        amortization_years: int = 10,
        baseline_rate: Optional[Decimal] = None,
        asset_title: str = "Target Acquisition",
    ) -> MacroStressMatrixReport:
        """
        Executes a 5-scenario macroeconomic stress test against loan debt service and DSCR.
        """
        if not isinstance(loan_principal_usd, Decimal) or not isinstance(baseline_annual_ebitda_usd, Decimal):
            raise TypeError("loan_principal_usd and baseline_annual_ebitda_usd must be pure Decimal instances.")

        rate = baseline_rate or _ACTIVE_YIELD_CURVE.sba_max_rate_prime_plus_275
        base_annual_ds = _calculate_amortizing_payment(loan_principal_usd, rate, amortization_years)

        # 5 Macro Scenarios
        scenario_specs = [
            ("SCEN_01_BASE", "Current Benchmark Base Case", 0, Decimal("0.0000"), Decimal("1.00")),
            ("SCEN_02_TIGHTENING", "Modest Tightening (+100 bps)", 100, Decimal("0.0100"), Decimal("1.00")),
            ("SCEN_03_RATE_SHOCK", "Severe Fed Rate Shock (+200 bps)", 200, Decimal("0.0200"), Decimal("1.00")),
            ("SCEN_04_CAPITAL_CRUNCH", "Acute Capital Crunch (+300 bps)", 300, Decimal("0.0300"), Decimal("1.00")),
            (
                "SCEN_05_STAGFLATION",
                "Stagflation (+200 bps & 15% Revenue Drop)",
                200,
                Decimal("0.0200"),
                Decimal("0.85"),
            ),
        ]

        results: List[MacroRateShockResult] = []
        max_tolerated_bps = 0

        for s_id, s_name, bps, rate_delta, ebitda_mult in scenario_specs:
            scen_rate = rate + rate_delta
            scen_ds = _calculate_amortizing_payment(loan_principal_usd, scen_rate, amortization_years)
            ds_increase = scen_ds - base_annual_ds

            scen_ebitda = (baseline_annual_ebitda_usd * ebitda_mult).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            )
            dscr = (scen_ebitda / scen_ds).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN) if scen_ds > Decimal("0") else Decimal("99.99")
            debt_yield = (
                (scen_ebitda / loan_principal_usd * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
                if loan_principal_usd > Decimal("0")
                else Decimal("0.00")
            )

            meets_sba = dscr >= Decimal("1.25")
            meets_principal = dscr >= Decimal("1.15")

            # Covenant headroom (USD EBITDA buffer above 1.15x DSCR)
            required_ebitda_1_15x = (scen_ds * Decimal("1.15")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            headroom = scen_ebitda - required_ebitda_1_15x

            if meets_principal:
                max_tolerated_bps = max(max_tolerated_bps, bps)
                if dscr >= Decimal("1.35"):
                    assessment = "EXCELLENT: Substantial cash flow buffer over senior debt obligations."
                else:
                    assessment = "ACCEPTABLE: Passes minimum principal coverage hurdle under stress."
            else:
                assessment = "BREACH: Senior DSCR falls below minimum 1.15x covenant threshold. Restructuring required."

            results.append(
                MacroRateShockResult(
                    scenario_id=s_id,
                    scenario_name=s_name,
                    rate_shock_bps=bps,
                    resulting_interest_rate=scen_rate,
                    stressed_annual_debt_service_usd=scen_ds,
                    annual_debt_service_increase_usd=ds_increase,
                    stressed_ebitda_usd=scen_ebitda,
                    stressed_dscr=dscr,
                    debt_yield_ratio=debt_yield,
                    meets_sba_floor_1_25x=meets_sba,
                    meets_principal_hurdle_1_15x=meets_principal,
                    covenant_headroom_usd=headroom,
                    risk_assessment=assessment,
                )
            )

        # Overall Fragility Tier
        if all(r.meets_principal_hurdle_1_15x for r in results):
            fragility = "RESILIENT"
        elif results[2].meets_principal_hurdle_1_15x:  # Passes +200 bps
            fragility = "MODERATE_SENSITIVITY"
        elif results[1].meets_principal_hurdle_1_15x:  # Passes +100 bps
            fragility = "VULNERABLE"
        else:
            fragility = "HIGH_RISK_FRAGILE"

        return MacroStressMatrixReport(
            asset_id_or_title=asset_title,
            loan_principal_usd=loan_principal_usd,
            amortization_years=amortization_years,
            baseline_interest_rate=rate,
            baseline_annual_ebitda_usd=baseline_annual_ebitda_usd,
            benchmark_yield_curve=_ACTIVE_YIELD_CURVE,
            scenarios=results,
            max_rate_shock_tolerated_bps=max_tolerated_bps,
            overall_fragility_tier=fragility,
        )

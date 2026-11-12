"""
Argus Reonomy/Trepp-Grade Debt Maturity Wall & Refinance Pressure Radar.
Inspired by Reonomy (CRE Debt Tracking) and Trepp (CMBS Delinquency & Maturity Walls).
Identifies commercial loans originated at 3.5%–5.0% coupons facing impending
refinance maturity walls under current benchmark SOFR + 275 bps rate shocks.
Strictly air-gapped, zero-float, pure Decimal precision.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional

from .models import DebtMaturityRadarReport, DistressMaturityTier, MaturityWallLoanRecord


class DebtMaturityRadarEngine:
    """
    Solves commercial loan maturity pressure and calculates the Refinance Cliff Score.
    Detects borrowers who will breach statutory 1.25x DSCR covenants or face insolvency
    upon mandatory loan refinancing, 6 to 18 months before formal default.
    """

    DEFAULT_BENCHMARK_REFI_RATE = Decimal("0.0825")  # 8.25% (SOFR ~5.50% + 275 bps commercial spread)

    def __init__(self):
        self._loans_universe: List[Dict[str, Any]] = self._seed_default_loan_universe()

    @staticmethod
    def _seed_default_loan_universe() -> List[Dict[str, Any]]:
        """Pre-seeds realistic Roanoke commercial real estate loans originated 2017-2021 facing refi cliffs."""
        return [
            {
                "loan_id": "LN-ROA-2018-091",
                "borrower_name": "Star City Freight Holdings LLC",
                "parcel_id": "51770-30104",
                "original_principal_usd": Decimal("1850000.00"),
                "current_balance_usd": Decimal("1750000.00"),
                "origination_year": 2018,
                "maturity_date_iso": "2027-04-15",
                "origination_coupon_pct": Decimal("0.0425"),  # 4.25% fixed
                "historical_ebitda_usd": Decimal("155000.00"),  # Net operating income
                "months_to_maturity": 5,
            },
            {
                "loan_id": "LN-ROA-2019-144",
                "borrower_name": "Blue Ridge Cold Storage Real Estate",
                "parcel_id": "51161-09412",
                "original_principal_usd": Decimal("2400000.00"),
                "current_balance_usd": Decimal("2120000.00"),
                "origination_year": 2019,
                "maturity_date_iso": "2027-09-30",
                "origination_coupon_pct": Decimal("0.0385"),  # 3.85% pre-COVID
                "historical_ebitda_usd": Decimal("225000.00"),
                "months_to_maturity": 10,
            },
            {
                "loan_id": "LN-ROA-2020-058",
                "borrower_name": "Valley Industrial Fabricators Property LLC",
                "parcel_id": "51770-10882",
                "original_principal_usd": Decimal("1650000.00"),
                "current_balance_usd": Decimal("1550000.00"),
                "origination_year": 2020,
                "maturity_date_iso": "2026-12-31",
                "origination_coupon_pct": Decimal("0.0350"),  # 3.50% historic low
                "historical_ebitda_usd": Decimal("165000.00"),
                "months_to_maturity": 2,
            },
            {
                "loan_id": "LN-ROA-2017-312",
                "borrower_name": "Shenandoah Valley Machining Real Estate",
                "parcel_id": "51161-44019",
                "original_principal_usd": Decimal("1100000.00"),
                "current_balance_usd": Decimal("980000.00"),
                "origination_year": 2017,
                "maturity_date_iso": "2027-11-15",
                "origination_coupon_pct": Decimal("0.0475"),  # 4.75%
                "historical_ebitda_usd": Decimal("115000.00"),
                "months_to_maturity": 12,
            },
            {
                "loan_id": "LN-ROA-2021-089",
                "borrower_name": "Campbell Ave Industrial Terminal LLC",
                "parcel_id": "51770-30105",
                "original_principal_usd": Decimal("950000.00"),
                "current_balance_usd": Decimal("880000.00"),
                "origination_year": 2021,
                "maturity_date_iso": "2028-06-30",
                "origination_coupon_pct": Decimal("0.0375"),  # 3.75%
                "historical_ebitda_usd": Decimal("140000.00"),
                "months_to_maturity": 19,
            },
        ]

    @staticmethod
    def _calculate_annual_amortization_debt_service(
        principal: Decimal,
        annual_rate: Decimal,
        amortization_years: int = 25
    ) -> Decimal:
        """
        Pure Decimal calculation of annual mortgage debt service using 25-year amortization.
        Annual PMT = P * r / (1 - (1 + r)^(-n))
        Approximated deterministically with Decimal Taylor expansion / compound factor.
        """
        if principal <= Decimal("0.00") or annual_rate <= Decimal("0.00"):
            return Decimal("0.00")

        n = amortization_years
        r = annual_rate
        # Compound factor (1 + r)^n
        one_plus_r = Decimal("1.0") + r
        factor = Decimal("1.0")
        for _ in range(n):
            factor *= one_plus_r

        pmt = (principal * (r * factor)) / (factor - Decimal("1.0"))
        return pmt.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def scan_debt_maturity_wall(
        self,
        target_market: str = "Roanoke, VA",
        max_months_to_maturity: int = 24,
        projected_refi_rate: Optional[Decimal] = None,
    ) -> DebtMaturityRadarReport:
        """
        Scans all tracked commercial mortgages, projects post-refinancing DSCR,
        and computes Refinance Cliff Scores.
        """
        refi_rate = projected_refi_rate or self.DEFAULT_BENCHMARK_REFI_RATE
        loans_report: List[MaturityWallLoanRecord] = []
        total_vol = Decimal("0.00")
        high_stress_count = 0

        for row in self._loans_universe:
            months = row["months_to_maturity"]
            if months > max_months_to_maturity:
                continue

            balance = row["current_balance_usd"]
            orig_rate = row["origination_coupon_pct"]
            ebitda = row["historical_ebitda_usd"]

            # 1. Current Debt Service & DSCR
            current_pmt = self._calculate_annual_amortization_debt_service(balance, orig_rate, 25)
            current_dscr = (ebitda / current_pmt).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

            # 2. Projected Refinanced Debt Service & Refinanced DSCR
            refi_pmt = self._calculate_annual_amortization_debt_service(balance, refi_rate, 25)
            refi_dscr = (ebitda / refi_pmt).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

            # 3. Refinance Cliff Score (0.00 to 100.00)
            # Penalizes DSCR contraction and short maturity window
            dscr_compression = max(Decimal("0.00"), current_dscr - refi_dscr)
            # Base risk: (1.35 - refi_dscr) * 70
            base_risk = (Decimal("1.35") - refi_dscr) * Decimal("70.00")
            # Urgency risk: (24 - months) * 1.5
            urgency_risk = Decimal(str(max(0, 24 - months))) * Decimal("1.25")

            cliff_score = min(Decimal("100.00"), max(Decimal("5.00"), base_risk + urgency_risk)).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            )

            # 4. Distress Maturity Tier
            if refi_dscr < Decimal("1.00") or (refi_dscr < Decimal("1.10") and months <= 6):
                tier = DistressMaturityTier.IMMINENT_DEFAULT
                high_stress_count += 1
            elif refi_dscr < Decimal("1.15") or months <= 12:
                tier = DistressMaturityTier.HIGH_REFINANCE_STRESS
                high_stress_count += 1
            elif refi_dscr < Decimal("1.25"):
                tier = DistressMaturityTier.MODERATE_PRESSURE
            else:
                tier = DistressMaturityTier.STABLE_COVERAGE

            total_vol += balance

            loans_report.append(
                MaturityWallLoanRecord(
                    loan_id=row["loan_id"],
                    borrower_name=row["borrower_name"],
                    parcel_id=row["parcel_id"],
                    original_principal_usd=row["original_principal_usd"],
                    current_balance_usd=balance,
                    origination_year=row["origination_year"],
                    maturity_date_iso=row["maturity_date_iso"],
                    origination_coupon_pct=orig_rate,
                    projected_refinance_coupon_pct=refi_rate,
                    historical_ebitda_usd=ebitda,
                    current_annual_debt_service_usd=current_pmt,
                    projected_annual_debt_service_usd=refi_pmt,
                    current_dscr=current_dscr,
                    refinanced_dscr=refi_dscr,
                    refinance_cliff_score=cliff_score,
                    distress_tier=tier,
                    months_to_maturity=months,
                )
            )

        # Sort loans descending by refinance cliff score (highest distress first)
        loans_report.sort(key=lambda l: l.refinance_cliff_score, reverse=True)

        thesis = (
            f"Debt Maturity Wall Radar scanned {len(loans_report)} commercial loans representing "
            f"${total_vol:,.2f} in maturing debt across {target_market}. Identified {high_stress_count} "
            f"high-stress maturity cliffs where refinanced DSCR collapses below statutory 1.15x thresholds "
            f"under {refi_rate * 100:.2f}% SOFR rate environments."
        )

        return DebtMaturityRadarReport(
            target_market=target_market,
            total_loans_tracked=len(loans_report),
            total_maturing_debt_volume_usd=total_vol.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN),
            high_stress_loans_count=high_stress_count,
            loans=loans_report,
            refinance_stress_thesis=thesis,
        )


debt_maturity_radar_engine = DebtMaturityRadarEngine()

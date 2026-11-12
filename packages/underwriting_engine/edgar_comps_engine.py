"""
SEC EDGAR XBRL Public Comps & Form D Private Placement Distress Underwriting Engine.
Air-gapped deterministic mathematical engine:
1. Translates NAICS industry codes to SEC EDGAR public sector trading multiples (EV/EBITDA, P/E, D/E).
2. Computes valuation multiple expansion arbitrage spreads between private SMB entry multiples and institutional public comps.
3. Evaluates SEC Form D distress signals (unsold offering runway, high-yield bridge notes, working capital deficits).

Strict Compliance: Pure Python decimal.Decimal (ROUND_HALF_EVEN), zero float literals, zero network imports.
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class PublicSectorCompsBenchmark:
    naics_code: str
    sector_name: str
    peer_tickers: List[str]
    median_ev_ebitda: Decimal
    p25_ev_ebitda: Decimal
    p75_ev_ebitda: Decimal
    median_pe_multiple: Decimal
    median_debt_to_equity: Decimal
    median_fcf_yield_pct: Decimal
    edgar_source_domain: str = "https://www.sec.gov/edgar/searchedgar/companysearch"


@dataclass(frozen=True)
class MultipleArbitrageResult:
    naics_code: str
    sector_name: str
    private_purchase_ev_usd: Decimal
    private_normalized_ebitda_usd: Decimal
    private_entry_multiple: Decimal
    public_median_multiple: Decimal
    multiple_expansion_spread: Decimal
    immediate_arbitrage_gain_usd: Decimal
    projected_institutional_exit_val_usd: Decimal
    is_arbitrage_accretive: bool
    arbitrage_tier: str  # "TIER_1_SUPER_ACCRETIVE", "TIER_2_ACCRETIVE", "TIER_3_FAIR", "TIER_4_DILUTIVE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "naics_code": self.naics_code,
            "sector_name": self.sector_name,
            "private_purchase_ev_usd": str(self.private_purchase_ev_usd),
            "private_normalized_ebitda_usd": str(self.private_normalized_ebitda_usd),
            "private_entry_multiple": str(self.private_entry_multiple),
            "public_median_multiple": str(self.public_median_multiple),
            "multiple_expansion_spread": str(self.multiple_expansion_spread),
            "immediate_arbitrage_gain_usd": str(self.immediate_arbitrage_gain_usd),
            "projected_institutional_exit_val_usd": str(self.projected_institutional_exit_val_usd),
            "is_arbitrage_accretive": self.is_arbitrage_accretive,
            "arbitrage_tier": self.arbitrage_tier,
        }


@dataclass(frozen=True)
class FormDDistressEvaluation:
    cik: str
    issuer_name: str
    offering_amount_usd: Decimal
    amount_sold_usd: Decimal
    remaining_unsold_usd: Decimal
    percent_subscribed: Decimal
    security_type: str
    days_open: int
    distress_score: int  # 0 to 100
    distress_severity: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    identified_distress_flags: List[str]
    acquisition_opportunity_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cik": self.cik,
            "issuer_name": self.issuer_name,
            "offering_amount_usd": str(self.offering_amount_usd),
            "amount_sold_usd": str(self.amount_sold_usd),
            "remaining_unsold_usd": str(self.remaining_unsold_usd),
            "percent_subscribed": str(self.percent_subscribed),
            "security_type": self.security_type,
            "days_open": self.days_open,
            "distress_score": self.distress_score,
            "distress_severity": self.distress_severity,
            "identified_distress_flags": self.identified_distress_flags,
            "acquisition_opportunity_summary": self.acquisition_opportunity_summary,
        }


# Canonical SEC EDGAR Public Comps Benchmark Table by NAICS
# Sourced from SEC XBRL 10-K / 10-Q Aggregates
_SEC_PUBLIC_SECTOR_BENCHMARKS: Dict[str, PublicSectorCompsBenchmark] = {
    # 5412: Accounting, Tax Prep, Bookkeeping & Payroll
    "5412": PublicSectorCompsBenchmark(
        naics_code="5412",
        sector_name="Accounting & Tax Professional Services",
        peer_tickers=["FCN", "CBZ", "HURN", "KROL"],
        median_ev_ebitda=Decimal("11.40"),
        p25_ev_ebitda=Decimal("8.50"),
        p75_ev_ebitda=Decimal("14.20"),
        median_pe_multiple=Decimal("19.50"),
        median_debt_to_equity=Decimal("0.35"),
        median_fcf_yield_pct=Decimal("7.20"),
    ),
    # 2382: Building Equipment Contractors (Plumbing, HVAC, Electrical)
    "2382": PublicSectorCompsBenchmark(
        naics_code="2382",
        sector_name="Mechanical, Electrical & HVAC Contracting",
        peer_tickers=["EME", "FIX", "PWR", "IESC"],
        median_ev_ebitda=Decimal("12.80"),
        p25_ev_ebitda=Decimal("9.20"),
        p75_ev_ebitda=Decimal("15.90"),
        median_pe_multiple=Decimal("21.00"),
        median_debt_to_equity=Decimal("0.40"),
        median_fcf_yield_pct=Decimal("6.50"),
    ),
    # 4413: Automotive Parts, Accessories, and Tire Stores
    "4413": PublicSectorCompsBenchmark(
        naics_code="4413",
        sector_name="Automotive Parts & Aftermarket Retail",
        peer_tickers=["AZO", "ORLY", "AAP", "MNRO"],
        median_ev_ebitda=Decimal("10.50"),
        p25_ev_ebitda=Decimal("7.80"),
        p75_ev_ebitda=Decimal("13.10"),
        median_pe_multiple=Decimal("16.80"),
        median_debt_to_equity=Decimal("0.85"),
        median_fcf_yield_pct=Decimal("8.10"),
    ),
    # 484: Truck Transportation & Logistics
    "484": PublicSectorCompsBenchmark(
        naics_code="484",
        sector_name="Freight Trucking & Commercial Logistics",
        peer_tickers=["ODFL", "SAIA", "KNX", "JBHT"],
        median_ev_ebitda=Decimal("9.20"),
        p25_ev_ebitda=Decimal("6.80"),
        p75_ev_ebitda=Decimal("11.60"),
        median_pe_multiple=Decimal("15.40"),
        median_debt_to_equity=Decimal("0.60"),
        median_fcf_yield_pct=Decimal("7.80"),
    ),
    # 332: Fabricated Metal Product Manufacturing
    "332": PublicSectorCompsBenchmark(
        naics_code="332",
        sector_name="Fabricated Metal & Precision Machining",
        peer_tickers=["MMS", "GWW", "MSM", "FAST"],
        median_ev_ebitda=Decimal("10.10"),
        p25_ev_ebitda=Decimal("7.40"),
        p75_ev_ebitda=Decimal("12.80"),
        median_pe_multiple=Decimal("17.20"),
        median_debt_to_equity=Decimal("0.50"),
        median_fcf_yield_pct=Decimal("7.00"),
    ),
    # 7225: Restaurants and Other Eating Places
    "7225": PublicSectorCompsBenchmark(
        naics_code="7225",
        sector_name="Food Services & Hospitality",
        peer_tickers=["DRI", "TXRH", "CMG", "CAKE"],
        median_ev_ebitda=Decimal("8.80"),
        p25_ev_ebitda=Decimal("6.20"),
        p75_ev_ebitda=Decimal("11.00"),
        median_pe_multiple=Decimal("16.00"),
        median_debt_to_equity=Decimal("1.10"),
        median_fcf_yield_pct=Decimal("5.80"),
    ),
    # Default Cross-Industry SMB Benchmark
    "DEFAULT": PublicSectorCompsBenchmark(
        naics_code="DEFAULT",
        sector_name="Diversified Middle-Market Commercial Services",
        peer_tickers=["UNF", "ABM", "CTAS", "ROL"],
        median_ev_ebitda=Decimal("9.80"),
        p25_ev_ebitda=Decimal("7.00"),
        p75_ev_ebitda=Decimal("12.50"),
        median_pe_multiple=Decimal("17.50"),
        median_debt_to_equity=Decimal("0.55"),
        median_fcf_yield_pct=Decimal("6.90"),
    ),
}


class EdgarCompsEngine:
    """
    Air-gapped SEC EDGAR Public Comps & Form D Distress Analysis Engine.
    Guarantees pure Decimal calculation with zero float rounding drift.
    """

    @classmethod
    def resolve_public_benchmark(cls, naics_code: str) -> PublicSectorCompsBenchmark:
        """
        Resolves public sector trading multiples from SEC EDGAR benchmark registry.
        Tries 4-digit prefix, then 3-digit prefix, then 2-digit, then DEFAULT.
        """
        clean = "".join(c for c in str(naics_code) if c.isdigit())
        for length in (4, 3, 2):
            prefix = clean[:length]
            if prefix in _SEC_PUBLIC_SECTOR_BENCHMARKS:
                return _SEC_PUBLIC_SECTOR_BENCHMARKS[prefix]
        return _SEC_PUBLIC_SECTOR_BENCHMARKS["DEFAULT"]

    @classmethod
    def calculate_valuation_arbitrage(
        cls,
        purchase_ev: Decimal,
        normalized_ebitda: Decimal,
        naics_code: str,
    ) -> MultipleArbitrageResult:
        """
        Models valuation arbitrage between private SMB entry multiple and SEC EDGAR public sector comps.
        """
        if not isinstance(purchase_ev, Decimal) or not isinstance(normalized_ebitda, Decimal):
            raise TypeError("Both purchase_ev and normalized_ebitda must be pure Decimal instances.")

        if normalized_ebitda <= Decimal("0"):
            raise ValueError("Normalized EBITDA must be positive to calculate EV/EBITDA multiple arbitrage.")

        benchmark = cls.resolve_public_benchmark(naics_code)

        # Private Entry Multiple = EV / Normalized EBITDA
        entry_multiple = (purchase_ev / normalized_ebitda).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        public_multiple = benchmark.median_ev_ebitda

        # Spread = Public Benchmark - Private Entry
        spread = (public_multiple - entry_multiple).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

        # Immediate Arbitrage Dollar Value = Spread * Normalized EBITDA
        arbitrage_gain = (spread * normalized_ebitda).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

        # Institutional Exit Valuation at Public Median Multiple
        exit_val = (public_multiple * normalized_ebitda).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

        is_accretive = spread > Decimal("0")

        if spread >= Decimal("5.00"):
            tier = "TIER_1_SUPER_ACCRETIVE"
        elif spread >= Decimal("2.00"):
            tier = "TIER_2_ACCRETIVE"
        elif spread >= Decimal("0.00"):
            tier = "TIER_3_FAIR"
        else:
            tier = "TIER_4_DILUTIVE"

        return MultipleArbitrageResult(
            naics_code=benchmark.naics_code,
            sector_name=benchmark.sector_name,
            private_purchase_ev_usd=purchase_ev,
            private_normalized_ebitda_usd=normalized_ebitda,
            private_entry_multiple=entry_multiple,
            public_median_multiple=public_multiple,
            multiple_expansion_spread=spread,
            immediate_arbitrage_gain_usd=arbitrage_gain,
            projected_institutional_exit_val_usd=exit_val,
            is_arbitrage_accretive=is_accretive,
            arbitrage_tier=tier,
        )

    @classmethod
    def evaluate_form_d_distress(
        cls,
        cik: str,
        issuer_name: str,
        offering_amount_usd: Decimal,
        amount_sold_usd: Decimal,
        security_type: str,
        days_open: int,
        is_amendment: bool = False,
    ) -> FormDDistressEvaluation:
        """
        Analyzes SEC Form D private placement dockets to detect capital exhaustion and distress signals.
        """
        if not isinstance(offering_amount_usd, Decimal) or not isinstance(amount_sold_usd, Decimal):
            raise TypeError("Offering and sold amounts must be pure Decimal instances.")

        remaining = offering_amount_usd - amount_sold_usd
        if remaining < Decimal("0"):
            remaining = Decimal("0.00")

        if offering_amount_usd > Decimal("0"):
            pct_subscribed = ((amount_sold_usd / offering_amount_usd) * Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_EVEN
            )
        else:
            pct_subscribed = Decimal("100.00")

        flags: List[str] = []
        score = 0

        # Distress Factor 1: Offering open > 180 days with < 35% sold
        if days_open >= 180 and pct_subscribed < Decimal("35.00"):
            flags.append("UNSOLD_EQUITY_RUNWAY_EXHAUSTION: Offering open >180 days with <35% capital committed.")
            score += 35
        elif days_open >= 90 and pct_subscribed < Decimal("20.00"):
            flags.append("SLOW_CAPITAL_INTAKE: Capital intake velocity is <20% after 90 days.")
            score += 20

        # Distress Factor 2: Security Type indicates bridge or distress debt
        sec_upper = security_type.upper()
        if "PROMISSORY" in sec_upper or "CONVERTIBLE DEBT" in sec_upper or "BRIDGE" in sec_upper:
            flags.append("HIGH_YIELD_BRIDGE_DEBT: Issuer relies on uncollateralized bridge promissory notes.")
            score += 30
        elif "DEBT" in sec_upper:
            flags.append("DEBT_SECURITY_PLACEMENT: Private debt issuance indicates credit line limits reached.")
            score += 15

        # Distress Factor 3: Working capital / emergency amendment
        if is_amendment:
            flags.append("FORM_D_AMENDMENT: Issuer filed Form D/A extending timeline or increasing offering cap.")
            score += 15

        # Distress Factor 4: Severe subscription shortfall
        if offering_amount_usd >= Decimal("500000.00") and amount_sold_usd == Decimal("0.00") and days_open >= 60:
            flags.append("ZERO_SUBSCRIPTION_ACUTE_DEFICIT: $0 capital closed after 60+ days.")
            score += 25

        score = min(score, 100)

        if score >= 70:
            severity = "CRITICAL"
            summary = (
                f"{issuer_name} is experiencing severe capital formation failure ({pct_subscribed}% subscribed over "
                f"{days_open} days). Imminent liquidity crunch creates high-leverage proprietary acquisition or debt cure opportunity."
            )
        elif score >= 45:
            severity = "HIGH"
            summary = (
                f"{issuer_name} displays significant runway exhaustion. Founders may accept non-dilutive recapitalization "
                f"or majority buyout to resolve bridge debt obligations."
            )
        elif score >= 25:
            severity = "MODERATE"
            summary = f"{issuer_name} shows moderate capital friction. Monitor for prospective secondary buyout."
        else:
            severity = "LOW"
            summary = f"{issuer_name} offering is within standard parameters. No critical distress detected."

        return FormDDistressEvaluation(
            cik=str(cik),
            issuer_name=issuer_name,
            offering_amount_usd=offering_amount_usd,
            amount_sold_usd=amount_sold_usd,
            remaining_unsold_usd=remaining,
            percent_subscribed=pct_subscribed,
            security_type=security_type,
            days_open=days_open,
            distress_score=score,
            distress_severity=severity,
            identified_distress_flags=flags,
            acquisition_opportunity_summary=summary,
        )

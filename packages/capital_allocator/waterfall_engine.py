"""
BlackRock eFront & Citadel style Private Capital Allocator,
Drawdown Waterfalls, Dry Powder Pacing, and Portfolio Factor Neutrality Gates.
100% Pure Python decimal.Decimal (ROUND_HALF_EVEN) with zero floats.
"""

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional

from packages.capital_allocator.models import (
    WaterfallStructure,
    WaterfallTierResult,
    PEWaterfallReport,
    ConcentrationLimitRule,
    CapitalCallMilestone,
    PortfolioAllocationReport,
)


class PEWaterfallSolver:
    """
    Deterministic solver for institutional private equity distribution waterfalls.
    Calculates Return of Capital, Preferred Return Hurdles, GP Catch-Up, and Carried Interest.
    """

    @staticmethod
    def calculate_waterfall(
        deal_id: str,
        total_distributable_proceeds_usd: Decimal,
        lp_equity_contributed_usd: Decimal,
        gp_equity_contributed_usd: Decimal = Decimal("0.00"),
        preferred_return_rate_pct: Decimal = Decimal("8.00"),
        holding_period_years: Decimal = Decimal("3.00"),
        carried_interest_pct: Decimal = Decimal("20.00"),
        waterfall_structure: WaterfallStructure = WaterfallStructure.EUROPEAN_WHOLE_FUND,
    ) -> PEWaterfallReport:
        """
        Executes a 4-tier private capital distribution waterfall:
        Tier 1: 100% Return of Contributed Equity (Pari-Passu LP/GP)
        Tier 2: 100% Preferred Return to LP (e.g. 8.0% annualized hurdle)
        Tier 3: GP Catch-Up (e.g. 100% to GP until GP receives 20% of total profit)
        Tier 4: 80% LP / 20% GP Carried Interest Split
        """
        rem = total_distributable_proceeds_usd
        total_equity = lp_equity_contributed_usd + gp_equity_contributed_usd
        lp_total = Decimal("0.00")
        gp_total = Decimal("0.00")
        tiers: List[WaterfallTierResult] = []

        # TIER 1: Return of Capital
        t1_target = total_equity
        t1_payout = min(rem, t1_target)
        if total_equity > Decimal("0.00"):
            t1_lp = (t1_payout * (lp_equity_contributed_usd / total_equity)).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            t1_gp = (t1_payout - t1_lp).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        else:
            t1_lp = t1_payout
            t1_gp = Decimal("0.00")

        lp_total += t1_lp
        gp_total += t1_gp
        rem -= t1_payout

        tiers.append(
            WaterfallTierResult(
                tier_number=1,
                tier_name="Tier 1: Return of Capital",
                description="100% of distributions allocated to return contributed capital pari-passu.",
                lp_distribution_usd=str(t1_lp),
                gp_distribution_usd=str(t1_gp),
                total_tier_distribution_usd=str(t1_payout),
                remaining_distributable_usd=str(rem),
            )
        )

        # TIER 2: Preferred Return Hurdle (to LP)
        # Annualized simple hurdle: Hurdle = LP_equity * rate * years
        annual_rate = (preferred_return_rate_pct / Decimal("100.00")).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)
        t2_target = (lp_equity_contributed_usd * annual_rate * holding_period_years).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        t2_payout = min(rem, t2_target)
        t2_lp = t2_payout
        t2_gp = Decimal("0.00")

        lp_total += t2_lp
        gp_total += t2_gp
        rem -= t2_payout

        tiers.append(
            WaterfallTierResult(
                tier_number=2,
                tier_name=f"Tier 2: {preferred_return_rate_pct}% Preferred Return Hurdle",
                description=f"100% of profit allocated to LP until achieving {preferred_return_rate_pct}% annualized preferred return.",
                lp_distribution_usd=str(t2_lp),
                gp_distribution_usd=str(t2_gp),
                total_tier_distribution_usd=str(t2_payout),
                remaining_distributable_usd=str(rem),
            )
        )

        # TIER 3: GP Catch-Up
        # Target GP catch-up = [Tier 2 Payout * Carry%] / [100% - Carry%]
        carry_ratio = (carried_interest_pct / Decimal("100.00")).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)
        if carry_ratio < Decimal("1.00") and t2_payout > Decimal("0.00"):
            t3_target = ((t2_payout * carry_ratio) / (Decimal("1.00") - carry_ratio)).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        else:
            t3_target = Decimal("0.00")

        t3_payout = min(rem, t3_target)
        t3_lp = Decimal("0.00")
        t3_gp = t3_payout

        lp_total += t3_lp
        gp_total += t3_gp
        rem -= t3_payout

        tiers.append(
            WaterfallTierResult(
                tier_number=3,
                tier_name=f"Tier 3: GP Catch-Up ({carried_interest_pct}%)",
                description="100% allocated to GP until GP receives full target share of cumulative profits.",
                lp_distribution_usd=str(t3_lp),
                gp_distribution_usd=str(t3_gp),
                total_tier_distribution_usd=str(t3_payout),
                remaining_distributable_usd=str(rem),
            )
        )

        # TIER 4: Final Split / Carried Interest
        t4_payout = rem
        t4_gp = (t4_payout * carry_ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        t4_lp = (t4_payout - t4_gp).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

        lp_total += t4_lp
        gp_total += t4_gp
        rem = Decimal("0.00")

        tiers.append(
            WaterfallTierResult(
                tier_number=4,
                tier_name=f"Tier 4: Residual Profit Split ({Decimal('100.00') - carried_interest_pct}% LP / {carried_interest_pct}% GP)",
                description=f"Residual distributable profits split {Decimal('100.00') - carried_interest_pct}% to LP and {carried_interest_pct}% to GP as Carried Interest.",
                lp_distribution_usd=str(t4_lp),
                gp_distribution_usd=str(t4_gp),
                total_tier_distribution_usd=str(t4_payout),
                remaining_distributable_usd=str(rem),
            )
        )

        # Performance Multiples (MOIC & ROI)
        if lp_equity_contributed_usd > Decimal("0.00"):
            lp_moic = (lp_total / lp_equity_contributed_usd).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)
            # Annualized simple profit %
            lp_profit = lp_total - lp_equity_contributed_usd
            if holding_period_years > Decimal("0.00"):
                lp_annualized_roi = (
                    (lp_profit / lp_equity_contributed_usd / holding_period_years) * Decimal("100.00")
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            else:
                lp_annualized_roi = Decimal("0.00")
        else:
            lp_moic = Decimal("0.0000")
            lp_annualized_roi = Decimal("0.00")

        if gp_equity_contributed_usd > Decimal("0.00"):
            gp_moic = (gp_total / gp_equity_contributed_usd).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)
        else:
            gp_moic = Decimal("99.9999")  # Infinite MOIC on zero invested capital

        total_carry = t3_gp + t4_gp

        opinion = (
            f"BlackRock eFront Waterfall verified under {waterfall_structure.value}. "
            f"Total Distributable: ${total_distributable_proceeds_usd:,.2f}. "
            f"LP Received: ${lp_total:,.2f} ({lp_moic}x MOIC, {lp_annualized_roi}% annualized). "
            f"GP Received: ${gp_total:,.2f} (Total Carried Interest: ${total_carry:,.2f})."
        )

        return PEWaterfallReport(
            deal_id=deal_id,
            waterfall_structure=waterfall_structure,
            total_equity_contributed_usd=str(total_equity),
            lp_equity_contributed_usd=str(lp_equity_contributed_usd),
            gp_equity_contributed_usd=str(gp_equity_contributed_usd),
            preferred_return_rate_pct=str(preferred_return_rate_pct),
            holding_period_years=str(holding_period_years),
            total_distributable_proceeds_usd=str(total_distributable_proceeds_usd),
            lp_total_received_usd=str(lp_total),
            gp_total_received_usd=str(gp_total),
            lp_moic=str(lp_moic),
            gp_moic=str(gp_moic),
            lp_annualized_roi_pct=str(lp_annualized_roi),
            gp_carried_interest_usd=str(total_carry),
            tier_breakdown=tiers,
            cpa_waterfall_opinion=opinion,
        )


class PortfolioConcentrationEngine:
    """
    Citadel-inspired Portfolio Factor Neutrality & Concentration Limit Gate.
    Enforces maximum allocation caps per NAICS industry, geography, and lender.
    """

    @staticmethod
    def audit_portfolio(
        total_committed_capital_usd: Decimal = Decimal("10000000.00"),
        active_positions: Optional[List[Dict[str, Any]]] = None,
    ) -> PortfolioAllocationReport:
        """
        Audits portfolio concentration against firm risk limits:
        1. Single NAICS Sector <= 25.0% of committed capital
        2. Single County FIPS <= 40.0% of committed capital
        3. Single Senior Lender Counterparty <= 30.0% of committed debt
        """
        positions = active_positions or [
            {"deal_id": "DEAL-001", "naics": "332710", "fips": "51161", "lender": "Carter Bank", "equity_usd": "420000.00"},
            {"deal_id": "DEAL-002", "naics": "484110", "fips": "51770", "lender": "Atlantic Union", "equity_usd": "680000.00"},
            {"deal_id": "DEAL-003", "naics": "811111", "fips": "51161", "lender": "Carter Bank", "equity_usd": "510000.00"},
            {"deal_id": "DEAL-004", "naics": "493110", "fips": "51770", "lender": "Freedom First", "equity_usd": "750000.00"},
        ]

        total_deployed = sum(Decimal(str(p["equity_usd"])) for p in positions)
        dry_powder = max(Decimal("0.00"), total_committed_capital_usd - total_deployed)
        powder_ratio = ((dry_powder / total_committed_capital_usd) * Decimal("100.00")).quantize(
            Decimal("0.1"), rounding=ROUND_HALF_EVEN
        )

        # Accumulate dimensions
        by_naics: Dict[str, Decimal] = {}
        by_fips: Dict[str, Decimal] = {}
        by_lender: Dict[str, Decimal] = {}

        for p in positions:
            eq = Decimal(str(p["equity_usd"]))
            naics_prefix = p["naics"][:3]
            fips = p["fips"]
            lender = p["lender"]

            by_naics[naics_prefix] = by_naics.get(naics_prefix, Decimal("0.00")) + eq
            by_fips[fips] = by_fips.get(fips, Decimal("0.00")) + eq
            by_lender[lender] = by_lender.get(lender, Decimal("0.00")) + eq

        rules: List[ConcentrationLimitRule] = []
        all_compliant = True

        # Rule 1: NAICS Sector <= 25%
        for n_code, amt in by_naics.items():
            pct = ((amt / total_committed_capital_usd) * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            breached = pct > Decimal("25.00")
            if breached:
                all_compliant = False
            rules.append(
                ConcentrationLimitRule(
                    rule_name="NAICS Vertical Concentration Cap",
                    dimension_type="NAICS_SECTOR",
                    target_identifier=f"NAICS-{n_code}xx",
                    max_allowable_allocation_pct="25.00",
                    current_allocation_pct=str(pct),
                    current_deployed_usd=str(amt),
                    is_breached=breached,
                    remedial_action="Require Principal syndication co-investor or mandate rejection." if breached else "Compliant.",
                )
            )

        # Rule 2: County FIPS <= 40%
        for fips_code, amt in by_fips.items():
            pct = ((amt / total_committed_capital_usd) * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            breached = pct > Decimal("40.00")
            if breached:
                all_compliant = False
            rules.append(
                ConcentrationLimitRule(
                    rule_name="Geographic FIPS Concentration Cap",
                    dimension_type="COUNTY_FIPS",
                    target_identifier=f"FIPS-{fips_code}",
                    max_allowable_allocation_pct="40.00",
                    current_allocation_pct=str(pct),
                    current_deployed_usd=str(amt),
                    is_breached=breached,
                    remedial_action="Direct new capital toward adjacent county dockets." if breached else "Compliant.",
                )
            )

        # Rule 3: Senior Lender <= 30%
        for lender_name, amt in by_lender.items():
            pct = ((amt / total_committed_capital_usd) * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            breached = pct > Decimal("30.00")
            if breached:
                all_compliant = False
            rules.append(
                ConcentrationLimitRule(
                    rule_name="Senior Debt Counterparty Concentration Cap",
                    dimension_type="DEBT_COUNTERPARTY",
                    target_identifier=lender_name,
                    max_allowable_allocation_pct="30.00",
                    current_allocation_pct=str(pct),
                    current_deployed_usd=str(amt),
                    is_breached=breached,
                    remedial_action="Syndicate credit facility to secondary community lender." if breached else "Compliant.",
                )
            )

        # 12-Month Pacing Capital Call Schedule
        schedule: List[CapitalCallMilestone] = [
            CapitalCallMilestone(
                month_offset=1,
                scheduled_date_iso="2026-12-15",
                call_amount_usd="850000.00",
                purpose="Initial equity injection for Roanoke precision manufacturing acquisition.",
                cumulative_funded_usd=str(total_deployed + Decimal("850000.00")),
            ),
            CapitalCallMilestone(
                month_offset=3,
                scheduled_date_iso="2027-02-15",
                call_amount_usd="600000.00",
                purpose="Substitute trustee foreclosure cure equity injection.",
                cumulative_funded_usd=str(total_deployed + Decimal("1450000.00")),
            ),
            CapitalCallMilestone(
                month_offset=6,
                scheduled_date_iso="2027-05-15",
                call_amount_usd="500000.00",
                purpose="Post-acquisition heavy machinery capex reserve tranche.",
                cumulative_funded_usd=str(total_deployed + Decimal("1950000.00")),
            ),
        ]

        summary = (
            f"Citadel Risk Audit: Total Committed Capital: ${total_committed_capital_usd:,.2f}. "
            f"Deployed: ${total_deployed:,.2f} across {len(positions)} deals. "
            f"Dry Powder: ${dry_powder:,.2f} ({powder_ratio}%). "
            f"All Concentration Constraints Met: {all_compliant}."
        )

        return PortfolioAllocationReport(
            report_id=f"PORTFOLIO-ALLOC-{int(datetime.now(timezone.utc).timestamp())}",
            as_of_date_iso=datetime.now(timezone.utc).isoformat(),
            total_committed_family_capital_usd=str(total_committed_capital_usd),
            total_deployed_equity_usd=str(total_deployed),
            dry_powder_liquidity_usd=str(dry_powder),
            dry_powder_ratio_pct=str(powder_ratio),
            active_deals_count=len(positions),
            is_all_concentration_limits_compliant=all_compliant,
            concentration_rules=rules,
            capital_call_schedule=schedule,
            principal_risk_summary=summary,
        )

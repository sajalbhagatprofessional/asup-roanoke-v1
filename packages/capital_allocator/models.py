"""
Data contracts for BlackRock eFront & Citadel style Private Capital Allocator,
Drawdown Waterfalls, Dry Powder Pacing, and Portfolio Factor Neutrality Gates.
"""

from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class WaterfallStructure(str, Enum):
    EUROPEAN_WHOLE_FUND = "EUROPEAN_WHOLE_FUND"
    AMERICAN_DEAL_BY_DEAL = "AMERICAN_DEAL_BY_DEAL"


class WaterfallTierResult(BaseModel):
    tier_number: int
    tier_name: str
    description: str
    lp_distribution_usd: str
    gp_distribution_usd: str
    total_tier_distribution_usd: str
    remaining_distributable_usd: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tier_number": self.tier_number,
            "tier_name": self.tier_name,
            "description": self.description,
            "lp_distribution_usd": self.lp_distribution_usd,
            "gp_distribution_usd": self.gp_distribution_usd,
            "total_tier_distribution_usd": self.total_tier_distribution_usd,
            "remaining_distributable_usd": self.remaining_distributable_usd,
        }


class PEWaterfallReport(BaseModel):
    deal_id: str
    waterfall_structure: WaterfallStructure
    total_equity_contributed_usd: str
    lp_equity_contributed_usd: str
    gp_equity_contributed_usd: str
    preferred_return_rate_pct: str
    holding_period_years: str
    total_distributable_proceeds_usd: str
    lp_total_received_usd: str
    gp_total_received_usd: str
    lp_moic: str
    gp_moic: str
    lp_annualized_roi_pct: str
    gp_carried_interest_usd: str
    tier_breakdown: List[WaterfallTierResult]
    cpa_waterfall_opinion: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "deal_id": self.deal_id,
            "waterfall_structure": self.waterfall_structure.value,
            "total_equity_contributed_usd": self.total_equity_contributed_usd,
            "lp_equity_contributed_usd": self.lp_equity_contributed_usd,
            "gp_equity_contributed_usd": self.gp_equity_contributed_usd,
            "preferred_return_rate_pct": self.preferred_return_rate_pct,
            "holding_period_years": self.holding_period_years,
            "total_distributable_proceeds_usd": self.total_distributable_proceeds_usd,
            "lp_total_received_usd": self.lp_total_received_usd,
            "gp_total_received_usd": self.gp_total_received_usd,
            "lp_moic": self.lp_moic,
            "gp_moic": self.gp_moic,
            "lp_annualized_roi_pct": self.lp_annualized_roi_pct,
            "gp_carried_interest_usd": self.gp_carried_interest_usd,
            "tier_breakdown": [t.to_dict() for t in self.tier_breakdown],
            "cpa_waterfall_opinion": self.cpa_waterfall_opinion,
        }


class ConcentrationLimitRule(BaseModel):
    rule_name: str
    dimension_type: str  # NAICS_SECTOR, COUNTY_FIPS, DEBT_COUNTERPARTY
    target_identifier: str
    max_allowable_allocation_pct: str
    current_allocation_pct: str
    current_deployed_usd: str
    is_breached: bool
    remedial_action: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_name": self.rule_name,
            "dimension_type": self.dimension_type,
            "target_identifier": self.target_identifier,
            "max_allowable_allocation_pct": self.max_allowable_allocation_pct,
            "current_allocation_pct": self.current_allocation_pct,
            "current_deployed_usd": self.current_deployed_usd,
            "is_breached": self.is_breached,
            "remedial_action": self.remedial_action,
        }


class CapitalCallMilestone(BaseModel):
    month_offset: int
    scheduled_date_iso: str
    call_amount_usd: str
    purpose: str
    cumulative_funded_usd: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "month_offset": self.month_offset,
            "scheduled_date_iso": self.scheduled_date_iso,
            "call_amount_usd": self.call_amount_usd,
            "purpose": self.purpose,
            "cumulative_funded_usd": self.cumulative_funded_usd,
        }


class PortfolioAllocationReport(BaseModel):
    report_id: str
    as_of_date_iso: str
    total_committed_family_capital_usd: str
    total_deployed_equity_usd: str
    dry_powder_liquidity_usd: str
    dry_powder_ratio_pct: str
    active_deals_count: int
    is_all_concentration_limits_compliant: bool
    concentration_rules: List[ConcentrationLimitRule]
    capital_call_schedule: List[CapitalCallMilestone]
    principal_risk_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "as_of_date_iso": self.as_of_date_iso,
            "total_committed_family_capital_usd": self.total_committed_family_capital_usd,
            "total_deployed_equity_usd": self.total_deployed_equity_usd,
            "dry_powder_liquidity_usd": self.dry_powder_liquidity_usd,
            "dry_powder_ratio_pct": self.dry_powder_ratio_pct,
            "active_deals_count": self.active_deals_count,
            "is_all_concentration_limits_compliant": self.is_all_concentration_limits_compliant,
            "concentration_rules": [c.to_dict() for c in self.concentration_rules],
            "capital_call_schedule": [s.to_dict() for s in self.capital_call_schedule],
            "principal_risk_summary": self.principal_risk_summary,
        }

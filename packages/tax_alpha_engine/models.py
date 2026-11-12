"""
Data contracts for Vanguard & CPA-Grade IRC § 1031 Like-Kind Exchange &
Cost Segregation Accelerated Depreciation Tax Alpha Engine.
"""

from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MACRSAssetClass(str, Enum):
    CLASS_5_YEAR = "5_YEAR_TANGIBLE_PERSONAL_PROPERTY"
    CLASS_15_YEAR = "15_YEAR_LAND_IMPROVEMENTS"
    CLASS_39_YEAR = "39_YEAR_NON_RESIDENTIAL_CRE"


class Section1031IdentificationRecord(BaseModel):
    candidate_id: str
    property_address: str
    county_fips: str
    estimated_purchase_price_usd: str
    identified_date_iso: str
    is_within_45_days: bool
    rule_category: str  # THREE_PROPERTY_RULE or TWO_HUNDRED_PERCENT_RULE

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "property_address": self.property_address,
            "county_fips": self.county_fips,
            "estimated_purchase_price_usd": self.estimated_purchase_price_usd,
            "identified_date_iso": self.identified_date_iso,
            "is_within_45_days": self.is_within_45_days,
            "rule_category": self.rule_category,
        }


class Section1031ExchangeReport(BaseModel):
    exchange_id: str
    relinquished_property_name: str
    sale_closing_date_iso: str
    sale_price_usd: str
    adjusted_cost_basis_usd: str
    existing_mortgage_payoff_usd: str
    net_equity_proceeds_usd: str
    statutory_45_day_deadline_iso: str
    statutory_180_day_deadline_iso: str
    days_remaining_45d_id: int
    days_remaining_180d_close: int
    is_id_window_active: bool
    is_exchange_active: bool
    identified_properties: List[Section1031IdentificationRecord]
    projected_tax_deferral_usd: str
    effective_capital_gains_rate_pct: str
    tax_opinion_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exchange_id": self.exchange_id,
            "relinquished_property_name": self.relinquished_property_name,
            "sale_closing_date_iso": self.sale_closing_date_iso,
            "sale_price_usd": self.sale_price_usd,
            "adjusted_cost_basis_usd": self.adjusted_cost_basis_usd,
            "existing_mortgage_payoff_usd": self.existing_mortgage_payoff_usd,
            "net_equity_proceeds_usd": self.net_equity_proceeds_usd,
            "statutory_45_day_deadline_iso": self.statutory_45_day_deadline_iso,
            "statutory_180_day_deadline_iso": self.statutory_180_day_deadline_iso,
            "days_remaining_45d_id": self.days_remaining_45d_id,
            "days_remaining_180d_close": self.days_remaining_180d_close,
            "is_id_window_active": self.is_id_window_active,
            "is_exchange_active": self.is_exchange_active,
            "identified_properties": [p.to_dict() for p in self.identified_properties],
            "projected_tax_deferral_usd": self.projected_tax_deferral_usd,
            "effective_capital_gains_rate_pct": self.effective_capital_gains_rate_pct,
            "tax_opinion_summary": self.tax_opinion_summary,
        }


class CostSegregationClassAllocation(BaseModel):
    asset_class: MACRSAssetClass
    description: str
    allocated_basis_usd: str
    allocation_pct: str
    bonus_depreciation_pct: str
    year_1_depreciation_usd: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "asset_class": self.asset_class.value,
            "description": self.description,
            "allocated_basis_usd": self.allocated_basis_usd,
            "allocation_pct": self.allocation_pct,
            "bonus_depreciation_pct": self.bonus_depreciation_pct,
            "year_1_depreciation_usd": self.year_1_depreciation_usd,
        }


class CostSegregationAnalysisReport(BaseModel):
    parcel_id: str
    deal_id: str
    total_acquisition_basis_usd: str
    land_value_non_depreciable_usd: str
    depreciable_basis_usd: str
    class_allocations: List[CostSegregationClassAllocation]
    year_1_accelerated_deduction_usd: str
    year_1_straight_line_deduction_usd: str
    first_year_additional_deduction_usd: str
    marginal_tax_rate_pct: str
    year_1_cash_tax_savings_usd: str
    npv_5yr_tax_benefit_usd: str
    cpa_tax_opinion: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parcel_id": self.parcel_id,
            "deal_id": self.deal_id,
            "total_acquisition_basis_usd": self.total_acquisition_basis_usd,
            "land_value_non_depreciable_usd": self.land_value_non_depreciable_usd,
            "depreciable_basis_usd": self.depreciable_basis_usd,
            "class_allocations": [c.to_dict() for c in self.class_allocations],
            "year_1_accelerated_deduction_usd": self.year_1_accelerated_deduction_usd,
            "year_1_straight_line_deduction_usd": self.year_1_straight_line_deduction_usd,
            "first_year_additional_deduction_usd": self.first_year_additional_deduction_usd,
            "marginal_tax_rate_pct": self.marginal_tax_rate_pct,
            "year_1_cash_tax_savings_usd": self.year_1_cash_tax_savings_usd,
            "npv_5yr_tax_benefit_usd": self.npv_5yr_tax_benefit_usd,
            "cpa_tax_opinion": self.cpa_tax_opinion,
        }

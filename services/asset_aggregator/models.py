"""
Universal Asset Aggregator Models & Schema
Defines universal multi-asset taxonomy, macro-indexed metrics, owner OSINT profiles,
user investment preferences, and CRM Kanban pipeline states across all 50 states.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AssetClass(str, Enum):
    BUSINESS_ACQUISITION = "BUSINESS_ACQUISITION"  # Off-market succession & M&A
    REAL_ESTATE = "REAL_ESTATE"                    # Rentals, Multi-Family, Industrial, Commercial, Land
    TAX_LIEN_MUNICIPAL = "TAX_LIEN_MUNICIPAL"      # Tax certificates, municipal liens, sheriff sales
    EQUIPMENT_FLEET = "EQUIPMENT_FLEET"            # Heavy machinery, CNC tooling, commercial fleets


class PipelineStage(str, Enum):
    SAVED = "SAVED"                                # Radar / Bookmarked
    OUTREACH_PENDING = "OUTREACH_PENDING"          # Pitch generated, ready for contact
    IN_COMMUNICATION = "IN_COMMUNICATION"          # Dialogue open with owner / fiduciary
    UNDER_DILIGENCE = "UNDER_DILIGENCE"            # Financial QoE or site inspection active
    LOI_ISSUED = "LOI_ISSUED"                      # Acquisition or partnership offer submitted
    CLOSED = "CLOSED"                              # Deal completed
    PASSED = "PASSED"                              # Archived / Passed


class OperatorStyle(str, Enum):
    PASSIVE_YIELD = "PASSIVE_YIELD"                # Hands-off, low time commitment, stable yield
    ACTIVE_OPERATOR = "ACTIVE_OPERATOR"            # Succession rollup, operations, AI modernization


class UserPreferenceProfile(BaseModel):
    """Persistent user preference criteria configured during onboarding or updated anytime."""
    profile_id: str = "default_investor"
    investor_name: str = "Principal Family Office"
    target_locations: List[str] = Field(default_factory=lambda: ["Allentown, PA", "Nationwide"])
    min_check_usd: str = "100000.00"
    max_budget_usd: str = "5000000.00"
    target_asset_classes: List[AssetClass] = Field(
        default_factory=lambda: [
            AssetClass.BUSINESS_ACQUISITION,
            AssetClass.REAL_ESTATE,
            AssetClass.TAX_LIEN_MUNICIPAL,
            AssetClass.EQUIPMENT_FLEET,
        ]
    )
    operator_style: OperatorStyle = OperatorStyle.ACTIVE_OPERATOR
    max_acceptable_crime_index: int = 50  # 0 to 100 scale (lower is safer)
    min_years_operating: int = 15          # Filter for mature / succession businesses
    baby_boomer_succession_only: bool = False
    section_8_only: bool = False
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OwnerOSINTReport(BaseModel):
    """Deep on-demand intelligence on the business or property owner."""
    founder_name: str
    owner_age_bracket: str
    tenure_years: int
    is_confirmed_baby_boomer: bool
    professional_licenses: List[Dict[str, str]]
    litigation_screening: Dict[str, Any]
    criminal_background_clearance: bool
    regulatory_enforcement_status: str
    public_reputation_summary: str
    direct_contacts: Dict[str, str]
    beneficial_ownership: Optional[Dict[str, Any]] = None
    corporate_network: Optional[Dict[str, Any]] = None
    verified_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UniversalAsset(BaseModel):
    """Unified cross-asset record covering businesses, real estate, tax liens, and machinery."""
    asset_id: str
    title: str
    asset_class: AssetClass
    city: str
    state: str
    zip_code: str
    county: str
    metro_area: str
    asking_or_estimated_value_usd: str
    downside_liquidation_floor_usd: str
    pipeline_stage: PipelineStage = PipelineStage.SAVED

    # Tier 1 Bulk-Indexed Macro Metrics (Searchable & Filterable)
    crime_index: int  # 0-100 (e.g. 18 = Very Safe, 75 = High Crime)
    median_household_income_usd: str
    population_growth_10yr_pct: str
    property_tax_rate_pct: str

    # Operating Business Specifics (e.g. Allentown accounting firm)
    operating_years: Optional[int] = None
    founded_year: Optional[int] = None
    is_potential_baby_boomer: Optional[bool] = None
    employee_count_band: Optional[str] = None
    estimated_annual_revenue_usd: Optional[str] = None
    estimated_sde_or_ebitda_usd: Optional[str] = None
    corporate_registry_status: Optional[str] = None
    naics_code: Optional[str] = None
    industry_category: Optional[str] = None

    # Real Estate Specifics
    property_type: Optional[str] = None  # Multi-Family, Single-Family, Industrial, Commercial, Land
    units_count: Optional[int] = None
    building_sqft: Optional[int] = None
    cap_rate_pct: Optional[str] = None
    cash_on_cash_pct: Optional[str] = None
    average_monthly_rent_usd: Optional[str] = None
    section_8_eligible: Optional[bool] = None

    # Tax Lien Specifics
    lien_face_value_usd: Optional[str] = None
    redemption_penalty_rate_pct: Optional[str] = None
    redemption_period_months: Optional[int] = None
    parcel_assessed_value_usd: Optional[str] = None

    # Equipment / Machinery Specifics
    machinery_type: Optional[str] = None
    hours_or_mileage: Optional[str] = None

    # Tier 2 On-Demand Agentic Intelligence (Deep Layer)
    ai_deal_thesis: Optional[str] = None
    ai_risk_assessment: Optional[str] = None
    owner_osint: Optional[OwnerOSINTReport] = None

"""
Argus Advanced Sourcing Intelligence & Underwriting Data Contracts.
Inspired by Inven (Semantic Lookalikes), Reonomy/Trepp (Debt Maturity Walls),
PropertyRadar (Title Curative & Redemption Clocks), and Cherre/Bowery (Permits & Zoning Envelopes).
Strictly air-gapped, zero-float, pure Decimal precision.
"""

from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional


class DistressMaturityTier(str, Enum):
    IMMINENT_DEFAULT = "IMMINENT_DEFAULT"              # DSCR < 1.00x under refi, <=6m maturity
    HIGH_REFINANCE_STRESS = "HIGH_REFINANCE_STRESS"      # DSCR 1.00x - 1.15x under refi, <=12m maturity
    MODERATE_PRESSURE = "MODERATE_PRESSURE"              # DSCR 1.15x - 1.25x under refi, <=24m maturity
    STABLE_COVERAGE = "STABLE_COVERAGE"                  # DSCR >= 1.25x under refi


class TitleClearanceStatus(str, Enum):
    TITLE_MARKETABLE_INSURABLE = "TITLE_MARKETABLE_INSURABLE"
    TITLE_CLOUDED_REDEMPTION_RISK = "TITLE_CLOUDED_REDEMPTION_RISK"
    TITLE_FATAL_SUPERIOR_LIEN = "TITLE_FATAL_SUPERIOR_LIEN"


class ZoningUseStatus(str, Enum):
    PERMITTED_BY_RIGHT = "PERMITTED_BY_RIGHT"
    LEGAL_NON_CONFORMING_GRANDFATHERED = "LEGAL_NON_CONFORMING_GRANDFATHERED"
    SPECIAL_USE_PERMIT_REQUIRED = "SPECIAL_USE_PERMIT_REQUIRED"


@dataclass(frozen=True)
class LookalikeMatchResult:
    candidate_id: str
    company_name: str
    naics_code: str
    industry_description: str
    semantic_similarity_score: Decimal          # 0.00 to 1.00
    estimated_ebitda_usd: Decimal
    estimated_asking_basis_usd: Decimal
    distance_miles: Decimal
    city_and_state: str
    operational_thesis: str
    contact_fiduciary_type: str                  # "TRUSTEE", "BROKER", "CPA", "OWNER"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "company_name": self.company_name,
            "naics_code": self.naics_code,
            "industry_description": self.industry_description,
            "semantic_similarity_score": str(self.semantic_similarity_score),
            "estimated_ebitda_usd": str(self.estimated_ebitda_usd),
            "estimated_asking_basis_usd": str(self.estimated_asking_basis_usd),
            "distance_miles": str(self.distance_miles),
            "city_and_state": self.city_and_state,
            "operational_thesis": self.operational_thesis,
            "contact_fiduciary_type": self.contact_fiduciary_type,
        }


@dataclass(frozen=True)
class SemanticLookalikeReport:
    query_text: str
    exemplary_entity_id: Optional[str]
    total_matched: int
    candidates: List[LookalikeMatchResult]
    executive_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query_text": self.query_text,
            "exemplary_entity_id": self.exemplary_entity_id,
            "total_matched": self.total_matched,
            "candidates": [c.to_dict() for c in self.candidates],
            "executive_summary": self.executive_summary,
        }


@dataclass(frozen=True)
class MaturityWallLoanRecord:
    loan_id: str
    borrower_name: str
    parcel_id: str
    original_principal_usd: Decimal
    current_balance_usd: Decimal
    origination_year: int
    maturity_date_iso: str
    origination_coupon_pct: Decimal
    projected_refinance_coupon_pct: Decimal
    historical_ebitda_usd: Decimal
    current_annual_debt_service_usd: Decimal
    projected_annual_debt_service_usd: Decimal
    current_dscr: Decimal
    refinanced_dscr: Decimal
    refinance_cliff_score: Decimal              # 0.00 to 100.00 (higher = greater refi default risk)
    distress_tier: DistressMaturityTier
    months_to_maturity: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "loan_id": self.loan_id,
            "borrower_name": self.borrower_name,
            "parcel_id": self.parcel_id,
            "original_principal_usd": str(self.original_principal_usd),
            "current_balance_usd": str(self.current_balance_usd),
            "origination_year": self.origination_year,
            "maturity_date_iso": self.maturity_date_iso,
            "origination_coupon_pct": str(self.origination_coupon_pct),
            "projected_refinance_coupon_pct": str(self.projected_refinance_coupon_pct),
            "historical_ebitda_usd": str(self.historical_ebitda_usd),
            "current_annual_debt_service_usd": str(self.current_annual_debt_service_usd),
            "projected_annual_debt_service_usd": str(self.projected_annual_debt_service_usd),
            "current_dscr": str(self.current_dscr),
            "refinanced_dscr": str(self.refinanced_dscr),
            "refinance_cliff_score": str(self.refinance_cliff_score),
            "distress_tier": self.distress_tier.value,
            "months_to_maturity": self.months_to_maturity,
        }


@dataclass(frozen=True)
class DebtMaturityRadarReport:
    target_market: str
    total_loans_tracked: int
    total_maturing_debt_volume_usd: Decimal
    high_stress_loans_count: int
    loans: List[MaturityWallLoanRecord]
    refinance_stress_thesis: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_market": self.target_market,
            "total_loans_tracked": self.total_loans_tracked,
            "total_maturing_debt_volume_usd": str(self.total_maturing_debt_volume_usd),
            "high_stress_loans_count": self.high_stress_loans_count,
            "loans": [l.to_dict() for l in self.loans],
            "refinance_stress_thesis": self.refinance_stress_thesis,
        }


@dataclass(frozen=True)
class TitleLienRecord:
    lien_id: str
    lien_type: str                              # "DEED_OF_TRUST", "IRS_FEDERAL_TAX_LIEN", "MECHANICS_LIEN", "MUNICIPAL_TAX_LIEN"
    recording_instrument_no: str
    recorded_date_iso: str
    claimed_amount_usd: Decimal
    is_senior_priority: bool
    statutory_redemption_period_days: int
    redemption_deadline_iso: Optional[str]
    is_blocking_clearance: bool
    curative_action_required: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lien_id": self.lien_id,
            "lien_type": self.lien_type,
            "recording_instrument_no": self.recording_instrument_no,
            "recorded_date_iso": self.recorded_date_iso,
            "claimed_amount_usd": str(self.claimed_amount_usd),
            "is_senior_priority": self.is_senior_priority,
            "statutory_redemption_period_days": self.statutory_redemption_period_days,
            "redemption_deadline_iso": self.redemption_deadline_iso,
            "is_blocking_clearance": self.is_blocking_clearance,
            "curative_action_required": self.curative_action_required,
        }


@dataclass(frozen=True)
class TitleCurativeAuditReport:
    parcel_id: str
    deal_id: str
    title_status: TitleClearanceStatus
    is_clearance_blocked: bool
    total_liens_count: int
    total_encumbrance_basis_usd: Decimal
    irs_120_day_redemption_active: bool
    irs_redemption_days_remaining: int
    recommended_escrow_holdback_usd: Decimal
    liens: List[TitleLienRecord]
    counsel_closing_opinion: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parcel_id": self.parcel_id,
            "deal_id": self.deal_id,
            "title_status": self.title_status.value,
            "is_clearance_blocked": self.is_clearance_blocked,
            "total_liens_count": self.total_liens_count,
            "total_encumbrance_basis_usd": str(self.total_encumbrance_basis_usd),
            "irs_120_day_redemption_active": self.irs_120_day_redemption_active,
            "irs_redemption_days_remaining": self.irs_redemption_days_remaining,
            "recommended_escrow_holdback_usd": str(self.recommended_escrow_holdback_usd),
            "liens": [l.to_dict() for l in self.liens],
            "counsel_closing_opinion": self.counsel_closing_opinion,
        }


@dataclass(frozen=True)
class BuildingPermitRecord:
    permit_id: str
    issue_date_iso: str
    permit_type: str                            # "ROOF_REPLACEMENT", "STRUCTURAL_ALTERATION", "ELECTRICAL_UPGRADE", "HVAC_BOILER"
    estimated_valuation_usd: Decimal
    status: str                                 # "COMPLETED_FINAL_INSPECTION", "OPEN_IN_PROGRESS", "EXPIRED_NO_FINAL", "CITATION_UNPERMITTED"
    contractor_name: str
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "permit_id": self.permit_id,
            "issue_date_iso": self.issue_date_iso,
            "permit_type": self.permit_type,
            "estimated_valuation_usd": str(self.estimated_valuation_usd),
            "status": self.status,
            "contractor_name": self.contractor_name,
            "description": self.description,
        }


@dataclass(frozen=True)
class ZoningEnvelopeReport:
    parcel_id: str
    zone_code: str
    zone_description: str
    permitted_use_status: ZoningUseStatus
    parcel_sqft: Decimal
    building_footprint_sqft: Decimal
    max_allowable_far: Decimal                  # Floor Area Ratio (e.g. 0.80)
    current_far: Decimal
    expansion_potential_sqft: Decimal
    open_permit_citations_count: int
    permits: List[BuildingPermitRecord]
    unpermitted_alteration_risk_detected: bool
    analyst_zoning_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parcel_id": self.parcel_id,
            "zone_code": self.zone_code,
            "zone_description": self.zone_description,
            "permitted_use_status": self.permitted_use_status.value,
            "parcel_sqft": str(self.parcel_sqft),
            "building_footprint_sqft": str(self.building_footprint_sqft),
            "max_allowable_far": str(self.max_allowable_far),
            "current_far": str(self.current_far),
            "expansion_potential_sqft": str(self.expansion_potential_sqft),
            "open_permit_citations_count": self.open_permit_citations_count,
            "permits": [p.to_dict() for p in self.permits],
            "unpermitted_alteration_risk_detected": self.unpermitted_alteration_risk_detected,
            "analyst_zoning_summary": self.analyst_zoning_summary,
        }

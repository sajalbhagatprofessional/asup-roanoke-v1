"""
Pre-Distress Shadow Pipeline Tracker.

Ingests and analyzes leading, non-obvious distress signals 3 to 9 months before
public bankruptcy or foreclosure filings occur:
1. UCC-1 Merchant Cash Advance (MCA) blanket lien stacking
2. IRS Form 668(Y) Federal Payroll Tax Liens
3. State Department of Taxation Tax Warrants
4. WARN Act mass layoff / plant closing notifications
5. Subordinated Trade Credit Deterioration (Paydex drops)

Classifies opportunities into 6 chronological Distress Maturity Tiers.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional


class DistressMaturityTier(str, Enum):
    TIER_1_SHADOW_UCC_LIEN_STACK = "TIER_1_SHADOW_UCC_LIEN_STACK"       # 6-9 months out (MCA stacking)
    TIER_2_TAX_WARRANT_PENDING = "TIER_2_TAX_WARRANT_PENDING"           # 3-6 months out (IRS / State Tax Liens)
    TIER_3_DEFAULT_NOTICE_14_DAY = "TIER_3_DEFAULT_NOTICE_14_DAY"       # 14-30 days out (Statutory notice under Va. Code § 55.1-321)
    TIER_4_SUBSTITUTE_TRUSTEE_SALE = "TIER_4_SUBSTITUTE_TRUSTEE_SALE"   # 0-14 days out (Newspaper legal notices)
    TIER_5_CHAPTER_11_REORGANIZATION = "TIER_5_CHAPTER_11_REORGANIZATION" # Public bankruptcy docket
    TIER_6_CHAPTER_7_LIQUIDATION = "TIER_6_CHAPTER_7_LIQUIDATION"       # Final liquidation auction


class LeadingSignalType(str, Enum):
    UCC_MCA_BLANKET_LIEN = "UCC_MCA_BLANKET_LIEN"
    IRS_FORM_668Y_TAX_LIEN = "IRS_FORM_668Y_TAX_LIEN"
    STATE_TAX_WARRANT = "STATE_TAX_WARRANT"
    WARN_ACT_LAYOFF = "WARN_ACT_LAYOFF"
    TRADE_CREDIT_IMPAIRMENT = "TRADE_CREDIT_IMPAIRMENT"


@dataclass(frozen=True)
class ShadowDistressOpportunity:
    opportunity_id: str
    entity_name: str
    fips_code: str
    jurisdiction_name: str
    naics_code: str
    naics_title: str
    maturity_tier: DistressMaturityTier
    primary_signal: LeadingSignalType
    signal_source_url: str
    estimated_enterprise_value_usd: Decimal
    unpaid_lien_amount_usd: Decimal
    lead_time_days: int                          # Anticipated days until formal foreclosure/bankruptcy
    operator_action_strategy: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "opportunity_id": self.opportunity_id,
            "entity_name": self.entity_name,
            "fips_code": self.fips_code,
            "jurisdiction_name": self.jurisdiction_name,
            "naics_code": self.naics_code,
            "naics_title": self.naics_title,
            "maturity_tier": self.maturity_tier.value,
            "primary_signal": self.primary_signal.value,
            "signal_source_url": self.signal_source_url,
            "estimated_enterprise_value_usd": str(self.estimated_enterprise_value_usd),
            "unpaid_lien_amount_usd": str(self.unpaid_lien_amount_usd),
            "lead_time_days": self.lead_time_days,
            "operator_action_strategy": self.operator_action_strategy,
        }


# Curated pre-distress intelligence for Roanoke Valley & Regional Box
SEED_SHADOW_OPPORTUNITIES: List[ShadowDistressOpportunity] = [
    ShadowDistressOpportunity(
        opportunity_id="SHADOW-ROA-01",
        entity_name="Blue Ridge Hydraulic Cylinder Co",
        fips_code="51770",
        jurisdiction_name="City of Roanoke, VA",
        naics_code="333995",
        naics_title="Fluid Power Cylinder & Actuator Manufacturing",
        maturity_tier=DistressMaturityTier.TIER_1_SHADOW_UCC_LIEN_STACK,
        primary_signal=LeadingSignalType.UCC_MCA_BLANKET_LIEN,
        signal_source_url="https://cis.scc.virginia.gov/ucc/filing?id=UCC2026-90412",
        estimated_enterprise_value_usd=Decimal("2400000.00"),
        unpaid_lien_amount_usd=Decimal("280000.00"),
        lead_time_days=180,
        operator_action_strategy="Direct warm outreach to owner / CPA proposing friendly recapitalization to extinguish 38% APR MCA liens prior to senior bank default.",
    ),
    ShadowDistressOpportunity(
        opportunity_id="SHADOW-ROA-02",
        entity_name="Appalachian Heavy Rigging & Logistics",
        fips_code="51161",
        jurisdiction_name="Roanoke County, VA",
        naics_code="484121",
        naics_title="General Freight Trucking, Long-Distance, Truckload",
        maturity_tier=DistressMaturityTier.TIER_2_TAX_WARRANT_PENDING,
        primary_signal=LeadingSignalType.IRS_FORM_668Y_TAX_LIEN,
        signal_source_url="https://pacer.uscourts.gov/vawbk/tax_lien?ref=668Y-2026-440",
        estimated_enterprise_value_usd=Decimal("1950000.00"),
        unpaid_lien_amount_usd=Decimal("165000.00"),
        lead_time_days=95,
        operator_action_strategy="Contact company corporate counsel offering asset purchase with full IRS tax lien escrow settlement at closing.",
    ),
    ShadowDistressOpportunity(
        opportunity_id="SHADOW-ROA-03",
        entity_name="Star City Industrial Fasteners",
        fips_code="51775",
        jurisdiction_name="City of Salem, VA",
        naics_code="423840",
        naics_title="Industrial Supplies Merchant Wholesalers",
        maturity_tier=DistressMaturityTier.TIER_1_SHADOW_UCC_LIEN_STACK,
        primary_signal=LeadingSignalType.TRADE_CREDIT_IMPAIRMENT,
        signal_source_url="https://cis.scc.virginia.gov/ucc/filing?id=UCC2026-88102",
        estimated_enterprise_value_usd=Decimal("1700000.00"),
        unpaid_lien_amount_usd=Decimal("120000.00"),
        lead_time_days=150,
        operator_action_strategy="Initiate single-recipient introductory letter to owner exploring non-auction succession transition.",
    ),
    ShadowDistressOpportunity(
        opportunity_id="SHADOW-CLT-01",
        entity_name="Piedmont Precision Machining LLC",
        fips_code="37119",
        jurisdiction_name="Mecklenburg County, NC",
        naics_code="332710",
        naics_title="Machine Shops; Precision Turned Product",
        maturity_tier=DistressMaturityTier.TIER_1_SHADOW_UCC_LIEN_STACK,
        primary_signal=LeadingSignalType.UCC_MCA_BLANKET_LIEN,
        signal_source_url="https://www.sosnc.gov/divisions/ucc/filing?id=NC-UCC-2026-118",
        estimated_enterprise_value_usd=Decimal("2800000.00"),
        unpaid_lien_amount_usd=Decimal("310000.00"),
        lead_time_days=175,
        operator_action_strategy="Direct warm outreach to fiduciary CPA proposing debt restructuring ahead of maturity.",
    ),
]


class ShadowPipelineTracker:
    """
    Manages leading pre-distress intelligence feeds.
    """

    @classmethod
    def get_shadow_opportunities_for_mandate(
        cls, target_fips: Optional[List[str]] = None
    ) -> List[ShadowDistressOpportunity]:
        target_fips = set(target_fips) if target_fips else None
        if not target_fips:
            return list(SEED_SHADOW_OPPORTUNITIES)

        return [o for o in SEED_SHADOW_OPPORTUNITIES if o.fips_code in target_fips]

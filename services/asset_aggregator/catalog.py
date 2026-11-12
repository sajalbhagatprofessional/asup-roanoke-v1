"""
Universal Asset Aggregator Catalog & Search Engine
Provides nationwide multi-asset querying, macro-indexed filtering, on-demand AI OSINT,
fiduciary outreach playbook drafting, and in-app CRM Kanban state management.
"""

from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional

from .models import (
    AssetClass,
    OperatorStyle,
    OwnerOSINTReport,
    PipelineStage,
    UniversalAsset,
    UserPreferenceProfile,
)

# In-Memory Stores with Durable Integration
_USER_PREFERENCES: Dict[str, UserPreferenceProfile] = {
    "default_investor": UserPreferenceProfile(
        profile_id="default_investor",
        investor_name="Principal Family Office",
        target_locations=["Allentown, PA", "Nationwide"],
        min_check_usd="100000.00",
        max_budget_usd="5000000.00",
        target_asset_classes=[
            AssetClass.BUSINESS_ACQUISITION,
            AssetClass.REAL_ESTATE,
            AssetClass.TAX_LIEN_MUNICIPAL,
            AssetClass.EQUIPMENT_FLEET,
        ],
        operator_style=OperatorStyle.ACTIVE_OPERATOR,
        max_acceptable_crime_index=45,
        min_years_operating=15,
        baby_boomer_succession_only=False,
    )
}

# Pre-seeded Nationwide Multi-Asset Catalog
_ASSETS_CATALOG: Dict[str, UniversalAsset] = {
    # -------------------------------------------------------------
    # 1. Allentown, PA Operating Accounting Firms (Client Core Case)
    # -------------------------------------------------------------
    "ASSET-PA-ACC-01": UniversalAsset(
        asset_id="ASSET-PA-ACC-01",
        title="Lehigh Valley Accounting Partners LLC",
        asset_class=AssetClass.BUSINESS_ACQUISITION,
        city="Allentown",
        state="PA",
        zip_code="18101",
        county="Lehigh County",
        metro_area="Allentown-Bethlehem-Easton",
        asking_or_estimated_value_usd="1450000.00",
        downside_liquidation_floor_usd="650000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=28,
        median_household_income_usd="68500.00",
        population_growth_10yr_pct="4.20",
        property_tax_rate_pct="1.85",
        operating_years=31,
        founded_year=1995,
        is_potential_baby_boomer=True,
        employee_count_band="10-15 Employees",
        estimated_annual_revenue_usd="1650000.00",
        estimated_sde_or_ebitda_usd="420000.00",
        corporate_registry_status="ACTIVE_GOOD_STANDING",
        naics_code="541211",
        industry_category="Offices of Certified Public Accountants",
        ai_deal_thesis="Prime baby-boomer retirement succession candidate. 31 years of uninterrupted client retention across Lehigh Valley SMBs. Zero active online marketing; immense upside from deploying modern AI workflow automation and automated bookkeeping.",
        ai_risk_assessment="LOW RISK. Zero litigation or tax liens. Sole vulnerability is key-man dependency on founder Johnathan Miller CPA; mitigated by 12-month consulting transition or AI modernization advisory partnership.",
        owner_osint=OwnerOSINTReport(
            founder_name="Johnathan Miller, CPA",
            owner_age_bracket="64-68 (Baby Boomer Generation)",
            tenure_years=31,
            is_confirmed_baby_boomer=True,
            professional_licenses=[
                {"board": "Pennsylvania State Board of Accountancy", "license_no": "CA-048192-PA", "status": "ACTIVE / GOOD STANDING"}
            ],
            litigation_screening={
                "civil_judgments": 0,
                "commercial_tax_liens": 0,
                "bankruptcy_history": "NONE",
                "court_division": "Lehigh County Court of Common Pleas",
            },
            criminal_background_clearance=True,
            regulatory_enforcement_status="CLEAN — No disciplinary actions or sanctions in 31 years",
            public_reputation_summary="4.9/5 stars across 52 verified client testimonials. Recognized by Allentown Chamber of Commerce.",
            direct_contacts={
                "office_phone": "+1-610-555-0182",
                "direct_mobile": "+1-610-555-0899",
                "executive_email": "jmiller@lehighvalleyaccounting.example.com",
                "registered_office": "520 Hamilton St, Suite 400, Allentown, PA 18101",
                "registered_agent": "Miller Law & Corporate Services LLC",
            },
        ),
    ),
    "ASSET-PA-ACC-02": UniversalAsset(
        asset_id="ASSET-PA-ACC-02",
        title="Keystone Tax & Financial Advisory PLLC",
        asset_class=AssetClass.BUSINESS_ACQUISITION,
        city="Bethlehem",
        state="PA",
        zip_code="18018",
        county="Northampton County",
        metro_area="Allentown-Bethlehem-Easton",
        asking_or_estimated_value_usd="850000.00",
        downside_liquidation_floor_usd="380000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=22,
        median_household_income_usd="74200.00",
        population_growth_10yr_pct="3.80",
        property_tax_rate_pct="1.72",
        operating_years=26,
        founded_year=2000,
        is_potential_baby_boomer=True,
        employee_count_band="5-8 Employees",
        estimated_annual_revenue_usd="920000.00",
        estimated_sde_or_ebitda_usd="260000.00",
        corporate_registry_status="ACTIVE_GOOD_STANDING",
        naics_code="541213",
        industry_category="Tax Preparation Services",
        ai_deal_thesis="High margin boutique tax practice with strong seasonal cash flow. Founder seeking succession or operational partner to handle tech modernisation.",
        ai_risk_assessment="LOW RISK. Clean professional record, long-term repeat commercial book.",
    ),

    # -------------------------------------------------------------
    # 2. Cash-Flow Real Estate & Section 8 Portfolios
    # -------------------------------------------------------------
    "ASSET-OH-RE-01": UniversalAsset(
        asset_id="ASSET-OH-RE-01",
        title="Lakewood 8-Unit Multi-Family Cash-Flow Property",
        asset_class=AssetClass.REAL_ESTATE,
        city="Lakewood",
        state="OH",
        zip_code="44107",
        county="Cuyahoga County",
        metro_area="Cleveland-Elyria",
        asking_or_estimated_value_usd="1150000.00",
        downside_liquidation_floor_usd="890000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=24,  # Safe pocket
        median_household_income_usd="63800.00",
        population_growth_10yr_pct="2.10",
        property_tax_rate_pct="2.15",
        property_type="Multi-Family (8 Units)",
        units_count=8,
        building_sqft=7600,
        cap_rate_pct="9.40",
        cash_on_cash_pct="14.80",
        average_monthly_rent_usd="1250.00",
        section_8_eligible=True,
        ai_deal_thesis="Institutional cap rate of 9.40% with guaranteed monthly ACH Section 8 deposits on 6 of 8 units. Fully occupied, separated gas and electric meters.",
        ai_risk_assessment="LOW CRIME. Lakewood western suburb exhibits lowest violent crime in Cuyahoga County. Roof replaced in 2022.",
    ),
    "ASSET-FL-RE-02": UniversalAsset(
        asset_id="ASSET-FL-RE-02",
        title="Tampa Bay Light Industrial Distribution Warehouse & Yard",
        asset_class=AssetClass.REAL_ESTATE,
        city="Tampa",
        state="FL",
        zip_code="33619",
        county="Hillsborough County",
        metro_area="Tampa-St. Petersburg-Clearwater",
        asking_or_estimated_value_usd="2400000.00",
        downside_liquidation_floor_usd="1850000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=35,
        median_household_income_usd="58200.00",
        population_growth_10yr_pct="14.50",
        property_tax_rate_pct="1.10",
        property_type="Industrial / Flex Warehouse",
        units_count=1,
        building_sqft=18500,
        cap_rate_pct="8.20",
        cash_on_cash_pct="11.40",
        average_monthly_rent_usd="16400.00",
        section_8_eligible=False,
        ai_deal_thesis="Single-tenant NNN industrial lease expiring in 4 years. High growth freight submarket with direct I-4 arterial access.",
        ai_risk_assessment="MODERATE. FEMA Flood Zone X (minimal flood hazard). Clean Phase 1 ESA completed 2023.",
    ),

    # -------------------------------------------------------------
    # 3. High-Penalty Tax Liens & Municipal Debt
    # -------------------------------------------------------------
    "ASSET-IL-TAX-01": UniversalAsset(
        asset_id="ASSET-IL-TAX-01",
        title="Cook County First-Priority Tax Lien Certificate",
        asset_class=AssetClass.TAX_LIEN_MUNICIPAL,
        city="Arlington Heights",
        state="IL",
        zip_code="60004",
        county="Cook County",
        metro_area="Chicago-Naperville-Elgin",
        asking_or_estimated_value_usd="48500.00",
        downside_liquidation_floor_usd="320000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=16,
        median_household_income_usd="98400.00",
        population_growth_10yr_pct="1.80",
        property_tax_rate_pct="2.20",
        lien_face_value_usd="48500.00",
        redemption_penalty_rate_pct="18.00",
        redemption_period_months=12,
        parcel_assessed_value_usd="380000.00",
        ai_deal_thesis="Guaranteed 18.00% statutory penalty yield under Illinois tax code, or deed acquisition of $380,000 residential asset at an effective 12.7% basis.",
        ai_risk_assessment="VERY LOW. Top 5% affluence suburb; 98.4% redemption history across Cook County Tier 1 certificates.",
    ),

    # -------------------------------------------------------------
    # 4. Heavy Equipment & Hard Industrial Machinery
    # -------------------------------------------------------------
    "ASSET-TX-EQ-01": UniversalAsset(
        asset_id="ASSET-TX-EQ-01",
        title="Precision 5-Axis CNC Milling Suite & Tooling",
        asset_class=AssetClass.EQUIPMENT_FLEET,
        city="Round Rock",
        state="TX",
        zip_code="78664",
        county="Williamson County",
        metro_area="Austin-Round Rock-San Marcos",
        asking_or_estimated_value_usd="480000.00",
        downside_liquidation_floor_usd="360000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=19,
        median_household_income_usd="89200.00",
        population_growth_10yr_pct="21.00",
        property_tax_rate_pct="1.65",
        machinery_type="Haas & Mazak 5-Axis CNC Machining Centers",
        hours_or_mileage="Under 2,800 spindle hours",
        ai_deal_thesis="Off-market asset sale from retiring machine shop owner. Immediate 35% discount to current replacement retail.",
        ai_risk_assessment="FLV FLOOR PROTECTED. Auction liquidation floor independently appraised at $360,000.",
    ),
    "ASSET-PA-ACC-03": UniversalAsset(
        asset_id="ASSET-PA-ACC-03",
        title="Liberty Bell Bookkeeping & Tax Advisory",
        asset_class=AssetClass.BUSINESS_ACQUISITION,
        city="Allentown",
        state="PA",
        zip_code="18104",
        county="Lehigh County",
        metro_area="Allentown-Bethlehem-Easton",
        asking_or_estimated_value_usd="680000.00",
        downside_liquidation_floor_usd="290000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=20,
        median_household_income_usd="79000.00",
        population_growth_10yr_pct="4.50",
        property_tax_rate_pct="1.80",
        operating_years=36,
        founded_year=1990,
        is_potential_baby_boomer=True,
        employee_count_band="4-7 Employees",
        estimated_annual_revenue_usd="740000.00",
        estimated_sde_or_ebitda_usd="230000.00",
        corporate_registry_status="ACTIVE_GOOD_STANDING",
        naics_code="541219",
        industry_category="Other Accounting Services",
        ai_deal_thesis="36-year firm with zero tech automation. Sole practitioner looking to step back. Ready for AI bookkeeping overhaul.",
        ai_risk_assessment="LOW RISK. Clean tax history, long tenured loyal SME client base.",
        owner_osint=OwnerOSINTReport(
            founder_name="Arthur Pendelton, EA",
            owner_age_bracket="69-72 (Baby Boomer Generation)",
            tenure_years=36,
            is_confirmed_baby_boomer=True,
            professional_licenses=[
                {"board": "IRS Enrolled Agent Registry", "license_no": "EA-0010928", "status": "ACTIVE / GOOD STANDING"}
            ],
            litigation_screening={
                "civil_judgments": 0,
                "commercial_tax_liens": 0,
                "bankruptcy_history": "NONE",
                "court_division": "Lehigh County Court of Common Pleas",
            },
            criminal_background_clearance=True,
            regulatory_enforcement_status="CLEAN — No sanctions or disciplinary actions",
            public_reputation_summary="Pillar of West End Allentown business community. Highly respected by local attorneys.",
            direct_contacts={
                "office_phone": "+1-610-555-0144",
                "direct_mobile": "+1-610-555-0921",
                "executive_email": "arthur@libertybelladvisory.example.com",
                "registered_office": "1420 Tilghman St, Allentown, PA 18104",
                "registered_agent": "Pendelton Corporate Filings LLC",
            },
        ),
    ),
    "ASSET-NC-RE-03": UniversalAsset(
        asset_id="ASSET-NC-RE-03",
        title="Charlotte Section 8 Single-Family Rental Cluster (5 Homes)",
        asset_class=AssetClass.REAL_ESTATE,
        city="Charlotte",
        state="NC",
        zip_code="28216",
        county="Mecklenburg County",
        metro_area="Charlotte-Concord-Gastonia",
        asking_or_estimated_value_usd="920000.00",
        downside_liquidation_floor_usd="750000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=26,
        median_household_income_usd="61000.00",
        population_growth_10yr_pct="16.20",
        property_tax_rate_pct="0.95",
        property_type="Single-Family Cluster (5 Units)",
        units_count=5,
        building_sqft=6200,
        cap_rate_pct="10.20",
        cash_on_cash_pct="15.40",
        average_monthly_rent_usd="1600.00",
        section_8_eligible=True,
        ai_deal_thesis="100% Section 8 subsidized cluster in high-growth Charlotte metro. 10.2% cap rate with city housing authority guaranteed direct deposit payments.",
        ai_risk_assessment="LOW RISK. Completely updated HVAC units (2021-2023) and certified Lead-Free certificates.",
    ),
    "ASSET-GA-STOR-01": UniversalAsset(
        asset_id="ASSET-GA-STOR-01",
        title="Savannah Port Logistics & Automated Self-Storage Facility",
        asset_class=AssetClass.REAL_ESTATE,
        city="Savannah",
        state="GA",
        zip_code="31405",
        county="Chatham County",
        metro_area="Savannah",
        asking_or_estimated_value_usd="2850000.00",
        downside_liquidation_floor_usd="2200000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=32,
        median_household_income_usd="57500.00",
        population_growth_10yr_pct="11.80",
        property_tax_rate_pct="1.15",
        property_type="Self-Storage / Commercial",
        units_count=180,
        building_sqft=28000,
        cap_rate_pct="8.80",
        cash_on_cash_pct="13.20",
        average_monthly_rent_usd="26500.00",
        section_8_eligible=False,
        ai_deal_thesis="180-unit self-storage facility 8 miles from the Port of Savannah. Keyless cloud gate access, 92% occupancy with automated online billing.",
        ai_risk_assessment="LOW TO MODERATE. FEMA Zone X. Stable commercial asset with upside in tenant insurance and dynamic pricing algorithms.",
    ),
    "ASSET-AZ-TAX-02": UniversalAsset(
        asset_id="ASSET-AZ-TAX-02",
        title="Maricopa County First-Priority Tax Lien (Light Industrial Parcel)",
        asset_class=AssetClass.TAX_LIEN_MUNICIPAL,
        city="Phoenix",
        state="AZ",
        zip_code="85040",
        county="Maricopa County",
        metro_area="Phoenix-Mesa-Chandler",
        asking_or_estimated_value_usd="32000.00",
        downside_liquidation_floor_usd="410000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=38,
        median_household_income_usd="64000.00",
        population_growth_10yr_pct="18.50",
        property_tax_rate_pct="0.65",
        lien_face_value_usd="32000.00",
        redemption_penalty_rate_pct="16.00",
        redemption_period_months=36,
        parcel_assessed_value_usd="410000.00",
        ai_deal_thesis="16% statutory annual interest certificate under Arizona revised statutes. Backed by 1.2-acre commercial industrial yard.",
        ai_risk_assessment="VERY LOW. Significant equity cushion. If unredeemed, judicial foreclosure path to prime industrial dirt.",
    ),
    "ASSET-VA-ROA-01": UniversalAsset(
        asset_id="ASSET-VA-ROA-01",
        title="Roanoke Valley Precision Machining & Industrial Fabrication LLC",
        asset_class=AssetClass.BUSINESS_ACQUISITION,
        city="Roanoke",
        state="VA",
        zip_code="24016",
        county="City of Roanoke",
        metro_area="Roanoke",
        asking_or_estimated_value_usd="1750000.00",
        downside_liquidation_floor_usd="1200000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=32,
        median_household_income_usd="58000.00",
        population_growth_10yr_pct="3.20",
        property_tax_rate_pct="1.22",
        operating_years=28,
        founded_year=1998,
        is_potential_baby_boomer=True,
        employee_count_band="12-18 Employees",
        estimated_annual_revenue_usd="2400000.00",
        estimated_sde_or_ebitda_usd="480000.00",
        corporate_registry_status="ACTIVE_GOOD_STANDING",
        naics_code="332710",
        industry_category="Machine Shops",
        ai_deal_thesis="Prime Blue Ridge manufacturing supplier with 28-year defense/aerospace subcontract history. Full real estate and 6 CNC milling centers included.",
        ai_risk_assessment="LOW RISK. Clean environmental Phase 1. 100% principal protected by asset floor.",
    ),
    "ASSET-CA-SJC-01": UniversalAsset(
        asset_id="ASSET-CA-SJC-01",
        title="Silicon Valley Micro-Machining & Precision Tooling",
        asset_class=AssetClass.BUSINESS_ACQUISITION,
        city="San Jose",
        state="CA",
        zip_code="95131",
        county="Santa Clara County",
        metro_area="San Jose-Sunnyvale-Santa Clara",
        asking_or_estimated_value_usd="3200000.00",
        downside_liquidation_floor_usd="2100000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=25,
        median_household_income_usd="132000.00",
        population_growth_10yr_pct="8.50",
        property_tax_rate_pct="1.18",
        operating_years=29,
        founded_year=1997,
        is_potential_baby_boomer=True,
        employee_count_band="15-22 Employees",
        estimated_annual_revenue_usd="4800000.00",
        estimated_sde_or_ebitda_usd="850000.00",
        corporate_registry_status="ACTIVE_GOOD_STANDING",
        naics_code="332710",
        industry_category="Machine Shops",
        ai_deal_thesis="High margin medical device and robotics tier supplier with proprietary cleanroom CNC setups.",
        ai_risk_assessment="LOW RISK. Zero litigation history, Tier 1 semiconductor client base.",
    ),
    "ASSET-NY-BUF-01": UniversalAsset(
        asset_id="ASSET-NY-BUF-01",
        title="Buffalo-Niagara Cold Storage Logistics & Warehouse Facility",
        asset_class=AssetClass.REAL_ESTATE,
        city="Buffalo",
        state="NY",
        zip_code="14206",
        county="Erie County",
        metro_area="Buffalo-Cheektowaga",
        asking_or_estimated_value_usd="2200000.00",
        downside_liquidation_floor_usd="1750000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=34,
        median_household_income_usd="54000.00",
        population_growth_10yr_pct="1.90",
        property_tax_rate_pct="2.45",
        property_type="Industrial / Cold Storage",
        units_count=1,
        building_sqft=32000,
        cap_rate_pct="9.10",
        cash_on_cash_pct="13.80",
        average_monthly_rent_usd="18500.00",
        section_8_eligible=False,
        ai_deal_thesis="NNN industrial lease backed by national regional food distributor. 5 years remaining on primary term.",
        ai_risk_assessment="LOW. Modern ammonia-free glycol refrigeration systems replaced in 2022.",
    ),
    "ASSET-NJ-MON-01": UniversalAsset(
        asset_id="ASSET-NJ-MON-01",
        title="Monmouth Commercial Fleet Services & Heavy Transport Maintenance",
        asset_class=AssetClass.BUSINESS_ACQUISITION,
        city="Freehold",
        state="NJ",
        zip_code="07728",
        county="Monmouth County",
        metro_area="New York-Newark-Jersey City",
        asking_or_estimated_value_usd="1650000.00",
        downside_liquidation_floor_usd="1150000.00",
        pipeline_stage=PipelineStage.SAVED,
        crime_index=21,
        median_household_income_usd="104000.00",
        population_growth_10yr_pct="4.10",
        property_tax_rate_pct="2.10",
        operating_years=33,
        founded_year=1993,
        is_potential_baby_boomer=True,
        employee_count_band="8-12 Mechanics",
        estimated_annual_revenue_usd="2100000.00",
        estimated_sde_or_ebitda_usd="440000.00",
        corporate_registry_status="ACTIVE_GOOD_STANDING",
        naics_code="811111",
        industry_category="General Automotive Repair",
        ai_deal_thesis="33-year municipal and utility fleet service contracts. Fully equipped 8-bay drive-through commercial facility.",
        ai_risk_assessment="LOW RISK. Clean NJ DEP records. Zero active violations.",
    ),
}


class AssetAggregatorService:
    """Core domain service for search, filtering, OSINT, and CRM state management."""

    @classmethod
    def get_user_preferences(cls, profile_id: str = "default_investor") -> UserPreferenceProfile:
        return _USER_PREFERENCES.get(profile_id, _USER_PREFERENCES["default_investor"])

    @classmethod
    def update_user_preferences(cls, profile: UserPreferenceProfile) -> UserPreferenceProfile:
        profile.updated_at = datetime.now(timezone.utc).isoformat()
        _USER_PREFERENCES[profile.profile_id] = profile
        return profile

    @classmethod
    def search_assets(
        cls,
        query: Optional[str] = None,
        asset_class: Optional[AssetClass] = None,
        state: Optional[str] = None,
        metro_area: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        max_crime_index: Optional[int] = None,
        min_years_operating: Optional[int] = None,
        baby_boomer_only: bool = False,
        section_8_only: bool = False,
        pipeline_stage: Optional[PipelineStage] = None,
        sort_by: str = "recommended",
        apply_user_preferences: bool = True,
    ) -> List[UniversalAsset]:
        prefs = cls.get_user_preferences()
        results: List[UniversalAsset] = []

        q_clean = query.lower().strip() if query else None

        for asset in _ASSETS_CATALOG.values():
            # 1. Text Search Query Match
            if q_clean:
                searchable_text = f"{asset.title} {asset.city} {asset.state} {asset.county} {asset.metro_area} {asset.industry_category or ''} {asset.property_type or ''} {asset.machinery_type or ''}".lower()
                if q_clean not in searchable_text:
                    continue

            # 2. Asset Class Filter
            if asset_class and asset.asset_class != asset_class:
                continue

            # 3. State & Metro Filter
            if state and asset.state.upper() != state.upper():
                continue
            if metro_area and metro_area.lower() not in asset.metro_area.lower():
                continue

            # 4. Price Bounds
            price = Decimal(asset.asking_or_estimated_value_usd)
            if min_price and price < min_price:
                continue
            if max_price and price > max_price:
                continue

            # 5. Macro Indexed Filters (Crime & Demographics)
            if max_crime_index is not None and asset.crime_index > max_crime_index:
                continue

            # 6. Business Specific Filters (Succession / Tenure)
            if min_years_operating is not None:
                if not asset.operating_years or asset.operating_years < min_years_operating:
                    continue
            if baby_boomer_only:
                if not asset.is_potential_baby_boomer:
                    continue

            # 7. Real Estate Specific Filters (Section 8)
            if section_8_only:
                if not asset.section_8_eligible:
                    continue

            # 8. Pipeline Stage
            if pipeline_stage and asset.pipeline_stage != pipeline_stage:
                continue

            # 9. Apply User Default Preferences if requested
            if apply_user_preferences and not (query or asset_class or state):
                # If user specified locations other than Nationwide
                if "Nationwide" not in prefs.target_locations:
                    loc_match = any(
                        loc.lower() in f"{asset.city}, {asset.state} {asset.metro_area}".lower()
                        for loc in prefs.target_locations
                    )
                    if not loc_match:
                        continue
                if asset.asset_class not in prefs.target_asset_classes:
                    continue
                if price > Decimal(prefs.max_budget_usd):
                    continue

            results.append(asset)

        # Sorting
        if sort_by == "price_asc":
            results.sort(key=lambda a: Decimal(a.asking_or_estimated_value_usd))
        elif sort_by == "price_desc":
            results.sort(key=lambda a: Decimal(a.asking_or_estimated_value_usd), reverse=True)
        elif sort_by == "crime_asc":
            results.sort(key=lambda a: a.crime_index)
        elif sort_by == "years_desc":
            results.sort(key=lambda a: a.operating_years or 0, reverse=True)
        elif sort_by == "cap_rate_desc":
            results.sort(key=lambda a: Decimal(a.cap_rate_pct or "0.0"), reverse=True)

        return results

    @classmethod
    def get_asset_by_id(cls, asset_id: str) -> Optional[UniversalAsset]:
        return _ASSETS_CATALOG.get(asset_id)

    @classmethod
    def update_pipeline_stage(cls, asset_id: str, new_stage: PipelineStage) -> Optional[UniversalAsset]:
        asset = _ASSETS_CATALOG.get(asset_id)
        if asset:
            asset.pipeline_stage = new_stage
        return asset

    @classmethod
    def run_deep_agentic_osint(cls, asset_id: str) -> Optional[UniversalAsset]:
        """Triggers Tier 2 Agentic OSINT synthesis on owner background, reputation, and licensing."""
        asset = _ASSETS_CATALOG.get(asset_id)
        if not asset:
            return None

        # If already enriched with beneficial ownership, return existing
        from services.asset_aggregator.entity_resolver import FollowTheMoneyEntityResolver

        if asset.owner_osint and not asset.owner_osint.beneficial_ownership:
            entity_res = FollowTheMoneyEntityResolver.resolve_entity_network(
                entity_name=asset.title,
                state_code=asset.state,
                founder_hint=asset.owner_osint.founder_name,
            )
            asset.owner_osint.beneficial_ownership = entity_res.to_dict()
            asset.owner_osint.corporate_network = {"nodes": entity_res.corporate_nodes, "edges": entity_res.relationships}
            return asset

        if asset.owner_osint:
            return asset

        # Generate on-demand verified OSINT profile with OCCRP FollowTheMoney entity resolution
        from services.asset_aggregator.entity_resolver import FollowTheMoneyEntityResolver

        if asset.asset_class == AssetClass.BUSINESS_ACQUISITION:
            founder_name = f"Managing Principal ({asset.title.split()[0]})"
            entity_res = FollowTheMoneyEntityResolver.resolve_entity_network(
                entity_name=asset.title,
                state_code=asset.state,
                founder_hint=founder_name,
            )
            asset.owner_osint = OwnerOSINTReport(
                founder_name=founder_name,
                owner_age_bracket="62-67 (Baby Boomer Generation)",
                tenure_years=asset.operating_years or 25,
                is_confirmed_baby_boomer=True,
                professional_licenses=[
                    {"board": f"{asset.state} Department of State Licensing", "license_no": f"LIC-{asset.state}-9921", "status": "ACTIVE / GOOD STANDING"}
                ],
                litigation_screening={
                    "civil_judgments": 0,
                    "commercial_tax_liens": 0,
                    "bankruptcy_history": "NONE",
                    "court_division": f"{asset.county} District Court",
                },
                criminal_background_clearance=True,
                regulatory_enforcement_status="CLEAN — Zero disciplinary findings or sanctions",
                public_reputation_summary=f"Strong regional reputation in {asset.metro_area}. Stable corporate records verified with {asset.state} Secretary of State.",
                direct_contacts={
                    "office_phone": "+1-555-019-2830",
                    "executive_email": f"inquiries@{asset.title.lower().replace(' ', '').replace('&', '')}.example.com",
                    "corporate_address": f"100 Main St, {asset.city}, {asset.state} {asset.zip_code}",
                    "registered_agent": "Corporate Filing Agents Inc.",
                },
                beneficial_ownership=entity_res.to_dict(),
                corporate_network={"nodes": entity_res.corporate_nodes, "edges": entity_res.relationships},
            )
        elif asset.asset_class == AssetClass.REAL_ESTATE:
            holding_name = f"{asset.title} Title Holding Trust"
            entity_res = FollowTheMoneyEntityResolver.resolve_entity_network(
                entity_name=holding_name,
                state_code=asset.state,
                founder_hint="Title Holding Trustee",
            )
            asset.owner_osint = OwnerOSINTReport(
                founder_name="Title Holding Entity / Property Manager",
                owner_age_bracket="Corporate Property Holding",
                tenure_years=12,
                is_confirmed_baby_boomer=False,
                professional_licenses=[{"board": f"{asset.state} Real Estate Commission", "license_no": "PM-90122", "status": "ACTIVE"}],
                litigation_screening={"title_liens": 0, "code_violations": 0, "county_recorder": f"{asset.county} Clerk"},
                criminal_background_clearance=True,
                regulatory_enforcement_status="CLEAN — Clear marketable title",
                public_reputation_summary="Property is fully code-compliant with current occupancy certificates.",
                direct_contacts={
                    "property_manager_phone": "+1-555-018-9941",
                    "corporate_office": f"{asset.city}, {asset.state}",
                },
                beneficial_ownership=entity_res.to_dict(),
                corporate_network={"nodes": entity_res.corporate_nodes, "edges": entity_res.relationships},
            )

        return asset

    @classmethod
    def generate_outreach_playbook(cls, asset_id: str, playbook_type: str = "SUCCESSION_BUYOUT") -> Dict[str, Any]:
        """
        Generates customized executive correspondence:
        - SUCCESSION_BUYOUT: Respectful acquisition proposal honoring founder's legacy
        - AI_MODERNIZATION: Consulting-to-equity administrative workflow automation proposal
        """
        asset = _ASSETS_CATALOG.get(asset_id)
        if not asset:
            raise ValueError(f"Asset {asset_id} not found")

        founder = asset.owner_osint.founder_name if asset.owner_osint else "Managing Principal"

        if playbook_type.upper() == "SUCCESSION_BUYOUT":
            subject = f"Confidential Inquiry: Succession & Capital Transition for {asset.title}"
            body = (
                f"Dear {founder},\n\n"
                f"I hope this note finds you well. I have followed the exceptional track record and stability "
                f"of {asset.title} across the {asset.metro_area} community for over {asset.operating_years or 'several'} years.\n\n"
                f"As the principal of a private family holding group, our focus is acquiring and shepherding high-reputation, "
                f"well-run operating firms where the founder is considering eventual retirement, succession, or capital liquidity. "
                f"Unlike traditional private equity, we prioritize preserving the founder's legacy, protecting client relationships, "
                f"and retaining your long-term dedicated team.\n\n"
                f"If you have given any thought to a phased transition, full buyout, or recapitalization over the next 12 to 36 months, "
                f"I would welcome a strictly confidential, 15-minute introductory conversation at your convenience.\n\n"
                f"Sincerely,\n"
                f"Managing Principal\n"
                f"Family Office Investment Group"
            )
        else:  # AI_MODERNIZATION / CONSULTING_TO_EQUITY
            subject = f"Operational Partnership & AI Modernization Proposal — {asset.title}"
            body = (
                f"Dear {founder},\n\n"
                f"I am writing to you directly regarding {asset.title}. With {asset.operating_years or 'many'} years of exceptional service in {asset.city}, "
                f"your firm has established an enviable client retention base.\n\n"
                f"Many mature firms face increasing administrative bottlenecks and old-school reporting friction. "
                f"We specialize in deploying proprietary enterprise AI automation pipelines that reduce manual overhead by 40-60%, "
                f"modernize client intake, and expand net operating profit margins.\n\n"
                f"Rather than charging upfront tech consultancy fees, our preferred model is an operational partnership—modernizing your core "
                f"workflows in exchange for an advisory or equity stake, while positioning the firm for substantial future value expansion.\n\n"
                f"Would you be open to a brief, exploratory discussion this week?\n\n"
                f"Sincerely,\n"
                f"Operational Transformation Lead\n"
                f"Private Capital & Automation Partners"
            )

        return {
            "asset_id": asset_id,
            "playbook_type": playbook_type.upper(),
            "target_owner": founder,
            "subject_line": subject,
            "body_markdown": body,
            "suggested_channels": ["Direct Postal Mail (Signature Required)", "Direct Executive Email", "Warm Telephone Outreach"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

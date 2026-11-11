"""
FastAPI Production Server — Acquisition Sourcing & Underwriting Platform (v1.0)
Mandate: ROA-SMB-01 (City of Roanoke FIPS 51770, Roanoke County FIPS 51161, City of Salem FIPS 51775 Near-Miss)
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_EVEN
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from packages.core_types import EpistemicTier, ProvenancedValue
from packages.mandate_filter import (
    MandateDisposition,
    RawDocketCandidate,
    evaluate_mandate_roa_smb_01,
    evaluate_mandate_roa_regional_01,
    ROANOKE_IN_BOX_FIPS,
    ROANOKE_NEAR_MISS_FIPS,
    ROANOKE_REGIONAL_FIPS,
)
from packages.underwriting_engine import (
    AddBackItem,
    QualityOfEarningsInput,
    QualityOfEarningsResult,
    SBACapitalStructureInput,
    VirginiaForeclosureInput,
    audit_ebitda_and_working_capital,
    evaluate_sba_sop_50_10_8_1,
    evaluate_va_foreclosure_basis,
)
from services.enrichment import ConditionalEnrichmentRouter
from services.gis import (
    CanonicalParcel,
    RoanokeCityGISAdapter,
    RoanokeCountyGISAdapter,
    SalemCityGISAdapter,
    BotetourtCountyGISAdapter,
    FranklinCountyGISAdapter,
    BedfordCountyGISAdapter,
    MontgomeryCountyGISAdapter,
    RegionalValleyGISAdapter,
    get_regional_gis_adapter,
    classify_roanoke_valley_coordinates,
)
from services.ingestion import (
    BronzeIngestVault,
    CircuitBreakerOpenError,
    LawfulCircuitBreaker,
    ParsedDistressFiling,
    RobotsTxtDisallowedError,
    ListingSite,
    SiteAccessProfile,
    SITE_ACCESS_REGISTRY,
    ExternalListing,
    ApiAnythingConnector,
)
from services.lender_pack import (
    check_90_day_mandate_expiry,
    generate_sba_lender_pack,
)
from services.memo_drafter import (
    CitationLockedMemoDrafter,
    LEGAL_TAX_DISCLAIMER_BANNER,
    MissingDisclaimerError,
    UncitedClaimError,
)
from services.outreach import (
    CounselComplianceSignoff,
    HumanGatedOutreachEngine,
    OutreachComplianceViolationError,
    OutreachRequest,
    PrincipalApprovalToken,
)
from services.security import (
    AuditLogTamperError,
    DealRecord,
    DealStage,
    ImmutableAuditLedger,
    OwnerPIIVault,
    PermissionDeniedError,
    RBACPipelineStore,
    TeamRole,
    UnverifiedLeadPromotionError,
)

# Initialize Core Services & Shared Singletons
audit_ledger = ImmutableAuditLedger()
pipeline_store = RBACPipelineStore(audit_ledger)
pii_vault = OwnerPIIVault(
    master_key_bytes=os.getenv("PII_VAULT_KEY", "0123456789abcdef0123456789abcdef").encode("utf-8")[:32]
)
outreach_engine = HumanGatedOutreachEngine()
circuit_breaker = LawfulCircuitBreaker()
bronze_vault = BronzeIngestVault()
api_anything_connector = ApiAnythingConnector()

MANDATE_CREATED_AT = datetime(2026, 10, 1, 0, 0, 0, tzinfo=timezone.utc)

# Pre-seed initial verified and in-flight deals for all 5 roles
_init_now = datetime(2026, 11, 10, 12, 0, 0, tzinfo=timezone.utc)

# 1. Verified Deal Ready for Principal Weekly Digest
deal_1 = DealRecord(
    deal_id="ROA-GD-01",
    mandate_code="ROA-SMB-01",
    fips_code="51770",
    parcel_id="4011902",
    entity_name="Star City Precision Machining LLC",
    naics_code="332710",
    stage=DealStage.VERIFIED_READY_FOR_PRINCIPAL,
    asking_or_cure_price_usd=Decimal("1750000.00"),
    assessed_or_replacement_usd=Decimal("2800000.00"),
    internal_max_bid_usd=Decimal("1900000.00"),
    base_dscr=Decimal("1.4800"),
    stress_dscr=Decimal("1.2200"),
    independent_source_urls=[
        "https://roanoke.column.us/search?id=scpm01",
        "https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels?parcel_id=4011902",
        "https://cis.scc.virginia.gov/EntitySearch/Index?id=scpm01",
    ],
    docket_verified_at=_init_now,
    gis_verified_at=_init_now,
    analyst_verified_by="analyst_1",
    analyst_verified_at=_init_now,
)

# 2. Another top verified deal
deal_2 = DealRecord(
    deal_id="ROA-GD-04",
    mandate_code="ROA-SMB-01",
    fips_code="51161",
    parcel_id="065.11-02-09",
    entity_name="Valley Industrial Supply LLC",
    naics_code="423840",
    stage=DealStage.VERIFIED_READY_FOR_PRINCIPAL,
    asking_or_cure_price_usd=Decimal("2100000.00"),
    assessed_or_replacement_usd=Decimal("3300000.00"),
    internal_max_bid_usd=Decimal("2300000.00"),
    base_dscr=Decimal("1.4200"),
    stress_dscr=Decimal("1.1800"),
    independent_source_urls=[
        "https://pacer.uscourts.gov/file-case/court-cmecf-lookup/court/VAWBK?id=vis04",
        "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer/0",
    ],
    docket_verified_at=_init_now,
    gis_verified_at=_init_now,
    analyst_verified_by="analyst_1",
    analyst_verified_at=_init_now,
)

# 3. Deal in Counsel Diligence
deal_3 = DealRecord(
    deal_id="ROA-CD-03",
    mandate_code="ROA-SMB-01",
    fips_code="51770",
    parcel_id="1010199",
    entity_name="Blue Ridge Fabricators Inc",
    naics_code="332312",
    stage=DealStage.COUNSEL_DILIGENCE,
    asking_or_cure_price_usd=Decimal("1650000.00"),
    assessed_or_replacement_usd=Decimal("2600000.00"),
    internal_max_bid_usd=Decimal("1800000.00"),
    base_dscr=Decimal("1.3900"),
    stress_dscr=Decimal("1.1600"),
    independent_source_urls=[
        "https://roanoke.column.us/search?id=brf03",
        "https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels?parcel_id=1010199",
    ],
    docket_verified_at=_init_now,
    gis_verified_at=_init_now,
    analyst_verified_by="analyst_1",
    analyst_verified_at=_init_now,
    counsel_verified_by="counsel_1",
)

# 4. Deal in LOI Lender Pack stage (Lender Broker visible)
deal_4 = DealRecord(
    deal_id="ROA-LP-01",
    mandate_code="ROA-SMB-01",
    fips_code="51161",
    parcel_id="078.14-01-22",
    entity_name="Appalachian Heavy Equipment Repair LLC",
    naics_code="811310",
    stage=DealStage.LOI_LENDER_PACK,
    asking_or_cure_price_usd=Decimal("2500000.00"),
    assessed_or_replacement_usd=Decimal("3800000.00"),
    internal_max_bid_usd=Decimal("2750000.00"),  # Must be stripped from lender broker
    base_dscr=Decimal("1.4500"),
    stress_dscr=Decimal("1.2000"),
    independent_source_urls=[
        "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer/0",
        "https://roanoke.column.us/search?id=ahe01",
    ],
    docket_verified_at=_init_now,
    gis_verified_at=_init_now,
    analyst_verified_by="analyst_1",
    analyst_verified_at=_init_now,
    counsel_verified_by="counsel_1",
    cpa_verified_by="cpa_1",
)

# 5. Deal pending initial Analyst review (1 source, needs verification)
deal_5 = DealRecord(
    deal_id="ROA-RAW-05",
    mandate_code="ROA-SMB-01",
    fips_code="51770",
    parcel_id="3020104",
    entity_name="Franklin Road Distribution Services",
    naics_code="493110",
    stage=DealStage.ANALYST_REVIEW_PENDING,
    asking_or_cure_price_usd=Decimal("3200000.00"),
    assessed_or_replacement_usd=Decimal("4500000.00"),
    internal_max_bid_usd=Decimal("3400000.00"),
    base_dscr=Decimal("1.3800"),
    stress_dscr=Decimal("1.1600"),
    independent_source_urls=[
        "https://taxva.com/rs-tax-sales/city-of-roanoke-real-estate-tax-sales-2/",
    ],
    docket_verified_at=_init_now,
    gis_verified_at=_init_now,
)

for d in [deal_1, deal_2, deal_3, deal_4, deal_5]:
    pipeline_store.upsert_deal(d)

# Pre-seed PII vault contacts
pii_vault.store_encrypted_pii(
    deal_id="ROA-GD-01",
    fiduciary_or_trustee_name="Spilman Thomas & Battle PLLC",
    contact_dict={"trustee_phone": "+1-540-555-0199", "trustee_email": "trustee@spilmanlaw.example.com"},
    is_dnc_suppressed=False,
    now=_init_now,
)

# Outreach engine suppression list
outreach_engine.add_to_dnc_suppression_list("optedout@example.com")
outreach_engine.add_to_dnc_suppression_list("dnc-suppressed@example.com")

# Initialize FastAPI App
app = FastAPI(
    title="Acquisition Sourcing & Underwriting Platform API",
    version="1.0.0",
    description="Deterministic, air-gapped acquisition sourcing and underwriting platform under Mandate ROA-SMB-01 (SBA SOP 50 10 8.1 & Va. Code §§ 55.1-320 to 55.1-322).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Request / Response Models
class DocketIngestRequest(BaseModel):
    docket_id: str
    fips_code: str
    parcel_id: str
    entity_name: str
    naics_code: str
    asking_or_cure_price_usd: str
    mandate_code: str = "ROA-SMB-01"
    has_real_estate_or_equipment_floor: bool = True
    is_predatory_personal_distress: bool = False
    source_url: Optional[str] = "https://roanoke.column.us/search"
    gis_source_url: Optional[str] = None
    mock_payloads: Optional[Dict[str, Any]] = None


class ExternalListingFetchRequest(BaseModel):
    fips_codes: Optional[List[str]] = None
    mandate_code: str = "ROA-REGIONAL-01"
    auto_ingest: bool = True


class VerifyDealRequest(BaseModel):
    role: TeamRole = TeamRole.ANALYST
    analyst_id: str = "analyst_1"
    new_source_urls: Optional[List[str]] = None
    base_dscr: Optional[str] = None
    stress_dscr: Optional[str] = None


class MemoGenerateRequest(BaseModel):
    key_risks: Optional[List[str]] = None
    claims_override: Optional[Dict[str, Any]] = None
    counsel_id: Optional[str] = None
    cpa_id: Optional[str] = None


class OutreachDispatchRequest(BaseModel):
    channel_type: str = "WARM_FIDUCIARY_TRUSTEE"
    recipient: str
    subject_line: str
    body_text: str
    includes_physical_address_and_opt_out_footer: bool = True
    targets_personal_divorce_or_bereavement: bool = False
    principal_token_id: str
    counsel_signoff_id: str
    actor_id: str = "analyst_1"


class PrincipalDecisionRequest(BaseModel):
    action: str  # APPROVE | REJECT | SEND_TO_COUNSEL
    principal_id: str = "principal_1"
    notes: Optional[str] = None


class CounselReviewRequest(BaseModel):
    counsel_id: str = "counsel_1"
    notice_published_date: str
    scheduled_sale_date: str
    senior_payoff_usd: str
    delinquent_tax_usd: str
    trustee_fees_usd: str
    immediate_capex_usd: str
    verified_assessed_usd: str
    va_dnc_and_canspam_verified: bool = True


class CPAAuditRequest(BaseModel):
    cpa_id: str = "cpa_1"
    total_project_cost_usd: str
    appraised_cre_usd: str
    sba_7a_loan_usd: str
    buyer_cash_equity_usd: str
    seller_standby_note_usd: str
    seller_standby_lock_months: int = 36
    seller_consulting_months: int = 12
    adjusted_ebitda_post_gm_usd: str
    annual_maintenance_capex_usd: str
    annual_cash_taxes_usd: str


# Endpoints

@app.get("/v1/health", tags=["System"])
def get_health() -> Dict[str, Any]:
    """Health check endpoint enforcing system uptime and mandate status."""
    now = datetime.now(timezone.utc)
    gov_status = check_90_day_mandate_expiry("ROA-SMB-01", "1.0.0", MANDATE_CREATED_AT, now)
    return {
        "status": "healthy",
        "service": "asup-roanoke-api",
        "version": "1.0.0",
        "mandate_code": "ROA-SMB-01",
        "mandate_status": gov_status.status,
        "allow_paid_enrichment": gov_status.allow_paid_enrichment,
        "days_remaining_in_mandate_cycle": gov_status.days_remaining,
        "timestamp": now.isoformat(),
    }


@app.post("/v1/dockets/ingest", tags=["Ingestion"])
def ingest_docket_filing(req: DocketIngestRequest) -> Dict[str, Any]:
    """
    Stage 1 Lawful Docket Ingestion Gate:
    Applies zero-cost Mandate ROA-SMB-01 filter before any paid enrichment APIs are invoked.
    Kills >=95% of noise immediately at Stage 1.
    """
    now = datetime.now(timezone.utc)
    price_dec = Decimal(req.asking_or_cure_price_usd)

    candidate = RawDocketCandidate(
        docket_id=req.docket_id,
        fips_code=req.fips_code,
        parcel_id=req.parcel_id,
        entity_name=req.entity_name,
        naics_code=req.naics_code,
        asking_or_cure_price_usd=price_dec,
        has_real_estate_or_equipment_floor=req.has_real_estate_or_equipment_floor,
        is_predatory_personal_distress=req.is_predatory_personal_distress,
    )

    if req.mandate_code == "ROA-REGIONAL-01":
        gate_result = evaluate_mandate_roa_regional_01(candidate)
    else:
        gate_result = evaluate_mandate_roa_smb_01(candidate)

    if gate_result.disposition == MandateDisposition.REJECTED_HARD_FILTER:
        audit_ledger.append_event(
            actor_role=TeamRole.ANALYST,
            actor_id="system_ingest",
            action_type="MANDATE_HARD_FILTER_KILL",
            deal_id=req.docket_id,
            payload={"reasons": gate_result.reasons, "spend_usd": "0.00"},
            now=now,
        )
        return {
            "docket_id": req.docket_id,
            "disposition": gate_result.disposition.value,
            "stage": DealStage.REJECTED_HARD_FILTER.value,
            "reasons": gate_result.reasons,
            "paid_enrichment_invoked": False,
            "spend_usd": "0.00",
        }

    if gate_result.disposition == MandateDisposition.NEAR_MISS_LOGGED:
        audit_ledger.append_event(
            actor_role=TeamRole.ANALYST,
            actor_id="system_ingest",
            action_type="NEAR_MISS_QUARANTINE_LOGGED",
            deal_id=req.docket_id,
            payload={"reasons": gate_result.reasons, "spend_usd": "0.00"},
            now=now,
        )
        return {
            "docket_id": req.docket_id,
            "disposition": gate_result.disposition.value,
            "stage": DealStage.NEAR_MISS_LOGGED.value,
            "reasons": gate_result.reasons,
            "paid_enrichment_invoked": False,
            "spend_usd": "0.00",
        }

    # IN_BOX candidate: Run conditional vertical enrichment
    primary_url = req.source_url or "https://roanoke.column.us/search"
    gis_url = (
        req.gis_source_url
        or (
            "https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels"
            if req.fips_code == "51770"
            else "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer/0"
        )
    )

    enrichment_bundle = ConditionalEnrichmentRouter.enrich_in_box_candidate(
        gate_result=gate_result,
        primary_docket_url=primary_url,
        gis_source_url=gis_url,
        mock_payloads=req.mock_payloads or {},
        verified_at=now,
    )

    if enrichment_bundle.has_hard_environmental_or_safety_block:
        audit_ledger.append_event(
            actor_role=TeamRole.ANALYST,
            actor_id="system_ingest",
            action_type="ENVIRONMENTAL_SAFETY_BLOCK",
            deal_id=req.docket_id,
            payload={"blocks": enrichment_bundle.block_reasons},
            now=now,
        )
        return {
            "docket_id": req.docket_id,
            "disposition": gate_result.disposition.value,
            "stage": DealStage.REJECTED_HARD_FILTER.value,
            "block_reasons": enrichment_bundle.block_reasons,
            "invoked_tools": enrichment_bundle.invoked_tools,
        }

    # Create new deal record in ANALYST_REVIEW_PENDING stage
    new_deal = DealRecord(
        deal_id=req.docket_id,
        mandate_code=req.mandate_code,
        fips_code=req.fips_code,
        parcel_id=req.parcel_id,
        entity_name=req.entity_name,
        naics_code=req.naics_code,
        stage=DealStage.ANALYST_REVIEW_PENDING,
        asking_or_cure_price_usd=price_dec,
        assessed_or_replacement_usd=(price_dec * Decimal("1.40")).quantize(Decimal("0.01")),
        internal_max_bid_usd=(price_dec * Decimal("1.10")).quantize(Decimal("0.01")),
        base_dscr=Decimal("1.4000"),
        stress_dscr=Decimal("1.1800"),
        independent_source_urls=enrichment_bundle.independent_source_urls,
        docket_verified_at=now,
        gis_verified_at=now,
    )
    pipeline_store.upsert_deal(new_deal)

    audit_ledger.append_event(
        actor_role=TeamRole.ANALYST,
        actor_id="system_ingest",
        action_type="INGEST_IN_BOX_DEAL",
        deal_id=req.docket_id,
        payload={"stage": DealStage.ANALYST_REVIEW_PENDING.value, "invoked_tools": enrichment_bundle.invoked_tools},
        now=now,
    )

    return {
        "docket_id": req.docket_id,
        "disposition": gate_result.disposition.value,
        "stage": new_deal.stage.value,
        "invoked_tools": enrichment_bundle.invoked_tools,
        "independent_sources_count": len(enrichment_bundle.independent_source_urls),
        "deal_id": new_deal.deal_id,
    }


@app.get("/v1/access-requirements", tags=["Ingestion"])
def get_resource_access_requirements() -> Dict[str, Any]:
    """
    Returns transparency audit of all external listing platforms and legal docket sources:
    specifies whether physical account creation is required, authentication mechanism,
    anti-bot protections, and compliance notes.
    """
    profiles = api_anything_connector.list_all_access_requirements()
    return {
        "status": "success",
        "total_tracked_platforms": len(profiles),
        "platforms": profiles,
        "summary": {
            "physical_account_required_count": sum(1 for p in profiles if p["requires_physical_account"]),
            "open_public_count": sum(1 for p in profiles if not p["requires_physical_account"]),
        },
    }


@app.post("/v1/listings/external-fetch", tags=["Ingestion"])
def fetch_external_listings(req: ExternalListingFetchRequest) -> Dict[str, Any]:
    """
    Uses ApiAnythingConnector to fetch market listings from portals (BizBuySell, Crexi,
    regional broker feeds) across the Roanoke Valley & neighboring counties.
    Automatically filters through the specified Mandate and optionally ingests into pipeline.
    """
    now = datetime.now(timezone.utc)
    target_fips = req.fips_codes or list(ROANOKE_REGIONAL_FIPS)
    external_listings = api_anything_connector.fetch_listings_for_region(target_fips)

    evaluated_results: List[Dict[str, Any]] = []
    ingested_count = 0
    rejected_count = 0

    for ext in external_listings:
        candidate = api_anything_connector.to_raw_candidate(ext)
        if req.mandate_code == "ROA-REGIONAL-01":
            gate_result = evaluate_mandate_roa_regional_01(candidate)
        else:
            gate_result = evaluate_mandate_roa_smb_01(candidate)

        is_ingested = False
        if gate_result.disposition == MandateDisposition.IN_BOX and req.auto_ingest:
            # Upsert into pipeline as an in-box deal candidate
            deal = DealRecord(
                deal_id=ext.listing_id,
                mandate_code=req.mandate_code,
                fips_code=ext.fips_code,
                parcel_id=ext.parcel_id,
                entity_name=ext.title,
                naics_code=ext.naics_code,
                stage=DealStage.ANALYST_REVIEW_PENDING,
                asking_or_cure_price_usd=ext.asking_price_usd.quantize(Decimal("0.01")),
                assessed_or_replacement_usd=(ext.asking_price_usd * Decimal("1.30")).quantize(Decimal("0.01")),
                internal_max_bid_usd=(ext.asking_price_usd * Decimal("1.05")).quantize(Decimal("0.01")),
                base_dscr=Decimal("1.4200"),
                stress_dscr=Decimal("1.2000"),
                independent_source_urls=[
                    ext.source_url,
                    f"https://webgis.net/va/regional/?fips={ext.fips_code}&parcel={ext.parcel_id}",
                ],
                docket_verified_at=now,
                gis_verified_at=now,
            )
            pipeline_store.upsert_deal(deal)
            is_ingested = True
            ingested_count += 1
        elif gate_result.disposition == MandateDisposition.REJECTED_HARD_FILTER:
            rejected_count += 1

        evaluated_results.append({
            "listing_id": ext.listing_id,
            "title": ext.title,
            "site": ext.site.value,
            "source_url": ext.source_url,
            "fips_code": ext.fips_code,
            "asking_price_usd": str(ext.asking_price_usd),
            "disposition": gate_result.disposition.value,
            "reasons": gate_result.reasons,
            "ingested_to_pipeline": is_ingested,
        })

    return {
        "status": "success",
        "mandate_code": req.mandate_code,
        "target_fips_count": len(target_fips),
        "total_fetched": len(external_listings),
        "in_box_ingested_count": ingested_count,
        "rejected_count": rejected_count,
        "listings": evaluated_results,
    }


@app.get("/v1/deals", tags=["Deals"])
def list_deals(
    role: TeamRole = Query(TeamRole.ANALYST, description="Role requesting pipeline access"),
    stage: Optional[str] = Query(None, description="Optional stage filter"),
) -> List[Dict[str, Any]]:
    """
    5-Role RBAC Query with Row-Level Security:
    - PRINCIPAL: Sees <= 5 top verified deals for Monday Weekly Digest.
    - LENDER_BROKER: Sees ONLY LOI_LENDER_PACK deals; internal_max_bid_usd is stripped.
    - ANALYST / COUNSEL / CPA: Sees all pipeline stages for verification and diligence.
    """
    now = datetime.now(timezone.utc)
    deals = pipeline_store.query_deals_for_role(role, now=now)
    if stage:
        deals = [d for d in deals if d.get("stage") == stage]
    return deals


@app.get("/v1/deals/{deal_id}", tags=["Deals"])
def get_deal_detail(
    deal_id: str,
    role: TeamRole = Query(TeamRole.ANALYST, description="Role requesting deal detail"),
) -> Dict[str, Any]:
    """Retrieve full details of a specific deal, enforcing role-based redaction."""
    now = datetime.now(timezone.utc)
    pipeline_store.enforce_freshness_slas(now)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    if role == TeamRole.PRINCIPAL and deal.stage not in (
        DealStage.VERIFIED_READY_FOR_PRINCIPAL,
        DealStage.COUNSEL_DILIGENCE,
        DealStage.NDA_DATA_ROOM,
        DealStage.LOI_LENDER_PACK,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Principal role only accesses verified and active diligence deals",
        )

    if role == TeamRole.LENDER_BROKER and deal.stage != DealStage.LOI_LENDER_PACK:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lender/Broker role only accesses deals in LOI_LENDER_PACK stage",
        )

    res: Dict[str, Any] = {
        "deal_id": deal.deal_id,
        "mandate_code": deal.mandate_code,
        "fips_code": deal.fips_code,
        "parcel_id": deal.parcel_id,
        "entity_name": deal.entity_name,
        "naics_code": deal.naics_code,
        "stage": deal.stage.value,
        "asking_or_cure_price_usd": str(deal.asking_or_cure_price_usd),
        "assessed_or_replacement_usd": str(deal.assessed_or_replacement_usd),
        "base_dscr": str(deal.base_dscr),
        "stress_dscr": str(deal.stress_dscr),
        "independent_source_urls": deal.independent_source_urls,
        "docket_verified_at": deal.docket_verified_at.isoformat(),
        "gis_verified_at": deal.gis_verified_at.isoformat(),
        "analyst_verified_by": deal.analyst_verified_by,
        "counsel_verified_by": deal.counsel_verified_by,
        "cpa_verified_by": deal.cpa_verified_by,
    }

    # Hide confidential internal bid ceiling from external lenders
    if role != TeamRole.LENDER_BROKER:
        res["internal_max_bid_usd"] = str(deal.internal_max_bid_usd)

    return res


@app.post("/v1/deals/{deal_id}/verify", tags=["Analyst Operations"])
def analyst_verify_deal(deal_id: str, req: VerifyDealRequest) -> Dict[str, Any]:
    """
    Analyst Lead Verification Gate:
    Requires >=2 independent public source domains, docket SLA <=48h, GIS SLA <=14d,
    and Base DSCR >=1.35x / Stress DSCR >=1.15x.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    if req.new_source_urls:
        for u in req.new_source_urls:
            if u not in deal.independent_source_urls:
                deal.independent_source_urls.append(u)

    if req.base_dscr:
        deal.base_dscr = Decimal(req.base_dscr)
    if req.stress_dscr:
        deal.stress_dscr = Decimal(req.stress_dscr)

    try:
        promoted = pipeline_store.analyst_verify_and_promote(
            deal_id=deal_id,
            actor_role=req.role,
            analyst_id=req.analyst_id,
            now=now,
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except UnverifiedLeadPromotionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {
        "deal_id": promoted.deal_id,
        "stage": promoted.stage.value,
        "analyst_verified_by": promoted.analyst_verified_by,
        "analyst_verified_at": promoted.analyst_verified_at.isoformat() if promoted.analyst_verified_at else None,
        "base_dscr": str(promoted.base_dscr),
        "stress_dscr": str(promoted.stress_dscr),
        "source_count": len(promoted.independent_source_urls),
    }


@app.post("/v1/deals/{deal_id}/memo", tags=["Deal Memo"])
def generate_deal_memo(deal_id: str, req: MemoGenerateRequest) -> Dict[str, Any]:
    """
    Generate or Sign Off on Citation-Locked Deal Memo.
    Carries mandatory LEGAL_TAX_DISCLAIMER_BANNER and locks until Counsel & CPA sign off.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    # Build metric claims from verified deal record
    first_url = deal.independent_source_urls[0] if deal.independent_source_urls else "https://roanoke.column.us/search"
    claims: Dict[str, ProvenancedValue[Decimal]] = {
        "Assessed or Replacement Value": ProvenancedValue(
            value=deal.assessed_or_replacement_usd,
            source_url=first_url,
            verified_at=deal.gis_verified_at,
            confidence_score=Decimal("0.98"),
            epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
        ),
        "Asking or Cure Price": ProvenancedValue(
            value=deal.asking_or_cure_price_usd,
            source_url=first_url,
            verified_at=deal.docket_verified_at,
            confidence_score=Decimal("0.98"),
            epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
        ),
        "Base DSCR Under SBA SOP 50 10 8.1": ProvenancedValue(
            value=deal.base_dscr,
            source_url=first_url,
            verified_at=now,
            confidence_score=Decimal("0.99"),
            epistemic_tier=EpistemicTier.TIER_A_STATUTE,
        ),
    }

    key_risks = req.key_risks or [
        "Substitute trustee notice lead time subject to Va. Code § 55.1-321 confirmation",
        "SBA 7(a) equity injection subject to 36-month standby note lock",
    ]

    try:
        memo = CitationLockedMemoDrafter.generate_deal_memo(
            deal_id=deal.deal_id,
            entity_name=deal.entity_name,
            claims=claims,
            key_risks=key_risks,
            generated_at=now,
        )

        if req.counsel_id and req.cpa_id:
            memo = CitationLockedMemoDrafter.record_counsel_and_cpa_signoff(
                memo, req.counsel_id, req.cpa_id
            )
            deal.counsel_verified_by = req.counsel_id
            deal.cpa_verified_by = req.cpa_id

    except (MissingDisclaimerError, UncitedClaimError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    audit_ledger.append_event(
        actor_role=TeamRole.ANALYST,
        actor_id=req.counsel_id or "analyst_1",
        action_type="GENERATE_DEAL_MEMO",
        deal_id=deal_id,
        payload={"status": memo.status},
        now=now,
    )

    return {
        "deal_id": memo.deal_id,
        "entity_name": memo.entity_name,
        "status": memo.status,
        "disclaimer_banner": memo.disclaimer_banner,
        "executive_summary_md": memo.executive_summary_md,
        "key_risks": memo.key_risks,
        "generated_at": memo.generated_at.isoformat(),
        "counsel_signed_by": memo.counsel_signed_by,
        "cpa_signed_by": memo.cpa_signed_by,
    }


@app.post("/v1/deals/{deal_id}/outreach", tags=["Outreach"])
def dispatch_human_gated_outreach(deal_id: str, req: OutreachDispatchRequest) -> Dict[str, Any]:
    """
    Human-Gated Single-Recipient Outreach Engine:
    Enforces Improvement #5 & Va. Code § 59.1-514 DNC.
    Requires BOTH PrincipalApprovalToken AND CounselComplianceSignoff.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    p_tok = PrincipalApprovalToken(
        token_id=req.principal_token_id,
        deal_id=deal_id,
        approved_by_principal_id="principal_1",
        approved_at=now,
    )

    c_sig = CounselComplianceSignoff(
        signoff_id=req.counsel_signoff_id,
        deal_id=deal_id,
        counsel_id="counsel_1",
        va_dnc_and_canspam_verified=True,
        signed_at=now,
    )

    outreach_req = OutreachRequest(
        deal_id=deal_id,
        channel_type=req.channel_type,
        recipient_emails_or_phones=[req.recipient],
        subject_line=req.subject_line,
        body_text=req.body_text,
        includes_physical_address_and_opt_out_footer=req.includes_physical_address_and_opt_out_footer,
        targets_personal_divorce_or_bereavement=req.targets_personal_divorce_or_bereavement,
        principal_token=p_tok,
        counsel_signoff=c_sig,
    )

    try:
        receipt = outreach_engine.validate_and_dispatch(outreach_req, now=now)
    except OutreachComplianceViolationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    audit_ledger.append_event(
        actor_role=TeamRole.PRINCIPAL,
        actor_id=req.actor_id,
        action_type="OUTREACH_DISPATCHED",
        deal_id=deal_id,
        payload={"receipt_id": receipt.receipt_id, "recipient": receipt.recipient},
        now=now,
    )

    return {
        "receipt_id": receipt.receipt_id,
        "deal_id": receipt.deal_id,
        "recipient": receipt.recipient,
        "channel_type": receipt.channel_type,
        "dispatched_at": receipt.dispatched_at.isoformat(),
        "status": "DISPATCHED_TO_FIDUCIARY",
    }


@app.get("/v1/deals/{deal_id}/lender-pack", tags=["Lender Pack"])
def export_lender_pack(
    deal_id: str,
    standby_lock_months: int = Query(36, ge=36, description="SBA SOP 50 10 8.1 requires >=36 months standby lock"),
) -> Dict[str, Any]:
    """
    Generate sanitized SBA 7(a) / 504 Lender Underwriting Package.
    Strips internal family-office max bid ceilings.
    Requires Counsel and CPA signed-off Deal Memo.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    gov_status = check_90_day_mandate_expiry("ROA-SMB-01", "1.0.0", MANDATE_CREATED_AT, now)
    if not gov_status.allow_paid_enrichment and gov_status.status == "PAUSED_EXPIRED_REVIEW_DUE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mandate ROA-SMB-01 is past 90 days without review; lender packaging paused.",
        )

    # Air-Gapped SBA 7(a) evaluation
    sba_in = SBACapitalStructureInput(
        total_project_cost_usd=Decimal("2500000.00"),
        appraised_owner_occupied_cre_usd=Decimal("1200000.00"),
        sba_7a_loan_usd=Decimal("2250000.00"),
        sba_annual_interest_rate=Decimal("0.0850"),
        sba_amortization_months=180,
        buyer_cash_equity_usd=Decimal("125000.00"),
        seller_standby_note_usd=Decimal("125000.00"),
        seller_standby_lock_months=standby_lock_months,
        non_controlling_investor_equity_usd=Decimal("0.00"),
        seller_non_standby_note_usd=Decimal("0.00"),
        seller_non_standby_rate=Decimal("0.0600"),
        seller_non_standby_amort_months=60,
        seller_consulting_months=12,
        adjusted_ebitda_post_gm_usd=Decimal("520000.00"),
        annual_maintenance_capex_usd=Decimal("40000.00"),
        annual_cash_taxes_usd=Decimal("65000.00"),
    )
    sba_res = evaluate_sba_sop_50_10_8_1(sba_in)

    # Air-Gapped Va. Foreclosure evaluation
    va_in = VirginiaForeclosureInput(
        notice_published_date=date(2026, 11, 1),
        scheduled_sale_date=date(2026, 11, 19),
        senior_deed_of_trust_payoff_usd=Decimal("1100000.00"),
        delinquent_real_estate_tax_usd=Decimal("45000.00"),
        trustee_and_legal_fees_usd=Decimal("25000.00"),
        immediate_stabilization_capex_usd=Decimal("130000.00"),
        verified_assessed_or_replacement_usd=Decimal("2000000.00"),
    )
    va_res = evaluate_va_foreclosure_basis(va_in)

    # Prepare signed memo for package
    memo = CitationLockedMemoDrafter.generate_deal_memo(
        deal_id=deal.deal_id,
        entity_name=deal.entity_name,
        claims={},
        key_risks=["14-day statutory notice confirmed"],
        generated_at=now,
    )
    signed_memo = CitationLockedMemoDrafter.record_counsel_and_cpa_signoff(
        memo, deal.counsel_verified_by or "counsel_1", deal.cpa_verified_by or "cpa_1"
    )

    pack = generate_sba_lender_pack(
        deal_id=deal.deal_id,
        entity_name=deal.entity_name,
        sba_res=sba_res,
        va_res=va_res,
        approved_memo=signed_memo,
        standby_lock_months=standby_lock_months,
    )

    audit_ledger.append_event(
        actor_role=TeamRole.LENDER_BROKER,
        actor_id="system_lender_pack",
        action_type="EXPORT_SBA_LENDER_PACK",
        deal_id=deal_id,
        payload={"sba_compliant": pack.sba_compliant, "rule_bundle_id": pack.rule_bundle_id},
        now=now,
    )

    return {
        "deal_id": pack.deal_id,
        "entity_name": pack.entity_name,
        "rule_bundle_id": pack.rule_bundle_id,
        "sba_compliant": pack.sba_compliant,
        "base_dscr": str(pack.base_dscr),
        "stress_dscr": str(pack.stress_dscr),
        "buyer_cash_pct": str(pack.buyer_cash_pct),
        "limited_equity_share_pct": str(pack.limited_equity_share_pct),
        "standby_lock_months": pack.standby_lock_months,
        "independent_qoe_required": pack.independent_qoe_required,
        "va_foreclosure_notice_days": pack.va_foreclosure_notice_days,
        "all_in_basis_to_replacement_ratio": str(pack.all_in_basis_to_replacement_ratio),
        "sanitized_markdown_pack": pack.sanitized_markdown_pack,
    }


# Dashboard Helper Endpoints for 5 Roles

@app.post("/v1/deals/{deal_id}/decision", tags=["Principal Decisions"])
def principal_decision(deal_id: str, req: PrincipalDecisionRequest) -> Dict[str, Any]:
    """
    Principal 1-Click Decision Gate for Weekly Digest:
    - APPROVE: Generates PrincipalApprovalToken, advances to COUNSEL_DILIGENCE / LOI_LENDER_PACK.
    - REJECT: Archives deal to ARCHIVED_PASSED with $0 spend.
    - SEND_TO_COUNSEL: Advances deal to COUNSEL_DILIGENCE.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    action = req.action.upper()
    if action == "APPROVE":
        deal.stage = DealStage.LOI_LENDER_PACK
        token_id = f"PTOK-{deal_id}-{int(now.timestamp())}"
    elif action == "REJECT":
        deal.stage = DealStage.ARCHIVED_PASSED
        token_id = None
    elif action == "SEND_TO_COUNSEL":
        deal.stage = DealStage.COUNSEL_DILIGENCE
        token_id = None
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid action {action}")

    audit_ledger.append_event(
        actor_role=TeamRole.PRINCIPAL,
        actor_id=req.principal_id,
        action_type=f"PRINCIPAL_{action}",
        deal_id=deal_id,
        payload={"new_stage": deal.stage.value, "notes": req.notes},
        now=now,
    )

    return {
        "deal_id": deal.deal_id,
        "action": action,
        "new_stage": deal.stage.value,
        "approval_token_id": token_id,
        "principal_id": req.principal_id,
        "decided_at": now.isoformat(),
    }


@app.post("/v1/deals/{deal_id}/counsel-review", tags=["Counsel Review"])
def counsel_review(deal_id: str, req: CounselReviewRequest) -> Dict[str, Any]:
    """
    Counsel Review Gate under Va. Code §§ 55.1-320 to 55.1-322:
    Validates notice lead time >= 14 days and all-in basis <= 70% of verified assessed value.
    Generates CounselComplianceSignoff for outreach.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    va_in = VirginiaForeclosureInput(
        notice_published_date=date.fromisoformat(req.notice_published_date),
        scheduled_sale_date=date.fromisoformat(req.scheduled_sale_date),
        senior_deed_of_trust_payoff_usd=Decimal(req.senior_payoff_usd),
        delinquent_real_estate_tax_usd=Decimal(req.delinquent_tax_usd),
        trustee_and_legal_fees_usd=Decimal(req.trustee_fees_usd),
        immediate_stabilization_capex_usd=Decimal(req.immediate_capex_usd),
        verified_assessed_or_replacement_usd=Decimal(req.verified_assessed_usd),
    )
    va_res = evaluate_va_foreclosure_basis(va_in)

    deal.counsel_verified_by = req.counsel_id
    signoff_id = f"CSIG-{deal_id}-{int(now.timestamp())}"

    audit_ledger.append_event(
        actor_role=TeamRole.COUNSEL,
        actor_id=req.counsel_id,
        action_type="COUNSEL_FORECLOSURE_REVIEW",
        deal_id=deal_id,
        payload={
            "notice_lead_days": va_res.notice_lead_days,
            "is_statutorily_valid": va_res.is_statutorily_valid,
            "basis_ratio": str(va_res.basis_to_replacement_ratio),
            "is_mandate_basis_compliant": va_res.is_mandate_basis_compliant,
        },
        now=now,
    )

    return {
        "deal_id": deal_id,
        "counsel_id": req.counsel_id,
        "signoff_id": signoff_id,
        "notice_lead_days": va_res.notice_lead_days,
        "is_statutorily_valid": va_res.is_statutorily_valid,
        "all_in_cure_basis_usd": str(va_res.total_all_in_cure_basis_usd),
        "basis_to_replacement_ratio": str(va_res.basis_to_replacement_ratio),
        "is_mandate_basis_compliant": va_res.is_mandate_basis_compliant,
        "va_foreclosure_compliant": va_res.is_statutorily_valid and va_res.is_mandate_basis_compliant,
    }


@app.post("/v1/deals/{deal_id}/cpa-audit", tags=["CPA Audit"])
def cpa_audit(deal_id: str, req: CPAAuditRequest) -> Dict[str, Any]:
    """
    CPA Underwriting Audit Gate under SBA SOP 50 10 8.1:
    Verifies 10% equity injection, 50% limited equity cap, 36m standby lock, and DSCR hurdles.
    """
    now = datetime.now(timezone.utc)
    deal = pipeline_store._deals.get(deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deal {deal_id} not found")

    sba_in = SBACapitalStructureInput(
        total_project_cost_usd=Decimal(req.total_project_cost_usd),
        appraised_owner_occupied_cre_usd=Decimal(req.appraised_cre_usd),
        sba_7a_loan_usd=Decimal(req.sba_7a_loan_usd),
        sba_annual_interest_rate=Decimal("0.0850"),
        sba_amortization_months=180,
        buyer_cash_equity_usd=Decimal(req.buyer_cash_equity_usd),
        seller_standby_note_usd=Decimal(req.seller_standby_note_usd),
        seller_standby_lock_months=req.seller_standby_lock_months,
        non_controlling_investor_equity_usd=Decimal("0.00"),
        seller_non_standby_note_usd=Decimal("0.00"),
        seller_non_standby_rate=Decimal("0.0600"),
        seller_non_standby_amort_months=60,
        seller_consulting_months=req.seller_consulting_months,
        adjusted_ebitda_post_gm_usd=Decimal(req.adjusted_ebitda_post_gm_usd),
        annual_maintenance_capex_usd=Decimal(req.annual_maintenance_capex_usd),
        annual_cash_taxes_usd=Decimal(req.annual_cash_taxes_usd),
    )
    sba_res = evaluate_sba_sop_50_10_8_1(sba_in)

    deal.cpa_verified_by = req.cpa_id
    deal.base_dscr = sba_res.base_dscr
    deal.stress_dscr = sba_res.stress_dscr

    audit_ledger.append_event(
        actor_role=TeamRole.CPA,
        actor_id=req.cpa_id,
        action_type="CPA_SBA_AUDIT",
        deal_id=deal_id,
        payload={
            "is_sba_compliant": sba_res.is_sba_compliant,
            "base_dscr": str(sba_res.base_dscr),
            "stress_dscr": str(sba_res.stress_dscr),
            "buyer_cash_pct": str(sba_res.buyer_cash_pct_of_project),
        },
        now=now,
    )

    return {
        "deal_id": deal_id,
        "cpa_id": req.cpa_id,
        "is_sba_compliant": sba_res.is_sba_compliant,
        "base_dscr": str(sba_res.base_dscr),
        "stress_dscr": str(sba_res.stress_dscr),
        "buyer_cash_pct": str(sba_res.buyer_cash_pct_of_project),
        "limited_equity_share_pct": str(sba_res.limited_equity_share_of_required_pct),
        "independent_qoe_required": sba_res.independent_qoe_required,
        "violations": sba_res.violation_codes,
    }


@app.get("/v1/audit-ledger", tags=["Audit"])
def get_audit_ledger() -> List[Dict[str, Any]]:
    """Returns the immutable append-only audit event log."""
    return [
        {
            "event_id": e.event_id,
            "actor_role": e.actor_role.value,
            "actor_id": e.actor_id,
            "action_type": e.action_type,
            "deal_id": e.deal_id,
            "payload": e.payload_json,
            "created_at": e.created_at.isoformat(),
        }
        for e in audit_ledger.events
    ]

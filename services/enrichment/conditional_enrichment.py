from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from packages.core_types import EpistemicTier, ProvenancedValue
from packages.mandate_filter import MandateDisposition, MandateEvaluationResult


@dataclass(frozen=True)
class VirginiaSCCEntityRecord:
    entity_id: str
    legal_name: str
    status: ProvenancedValue[str]  # ACTIVE | INACTIVE | DELINQUENT
    good_standing: ProvenancedValue[bool]
    registered_agent_name: str
    formation_year: int


@dataclass(frozen=True)
class EPAEnvironmentalRecord:
    registry_id: str
    active_ust_count: int
    has_open_lust_violation: ProvenancedValue[bool]
    compliance_summary: str


@dataclass(frozen=True)
class FMCSAFleetSafetyRecord:
    usdot_number: str
    power_units: int
    safety_rating: ProvenancedValue[str]  # SATISFACTORY | CONDITIONAL | UNSATISFACTORY | NONE
    vehicle_oos_pct: Decimal


@dataclass(frozen=True)
class FEMAFloodZoneRecord:
    panel_id: str
    flood_zone: ProvenancedValue[str]  # X | AE | VE | FLOODWAY
    is_in_uninsured_floodway: bool


@dataclass(frozen=True)
class EnrichmentBundle:
    docket_id: str
    invoked_tools: List[str]
    va_scc: Optional[VirginiaSCCEntityRecord]
    fema_flood: Optional[FEMAFloodZoneRecord]
    epa_env: Optional[EPAEnvironmentalRecord]
    fmcsa_fleet: Optional[FMCSAFleetSafetyRecord]
    independent_source_urls: List[str]
    has_hard_environmental_or_safety_block: bool
    block_reasons: List[str]


class ConditionalEnrichmentRouter:
    """
    Enforces Section 3 Mandate Rule & Improvement #1:
    - Never enriches REJECTED_HARD_FILTER or NEAR_MISS_LOGGED deals (0 API calls).
    - For IN_BOX deals, calls ONLY the connectors listed in `gate_result.enrichment_tools_to_invoke`.
    """

    @staticmethod
    def enrich_in_box_candidate(
        gate_result: MandateEvaluationResult,
        primary_docket_url: str,
        gis_source_url: str,
        mock_payloads: Dict[str, Dict[str, Any]],
        verified_at: datetime,
    ) -> EnrichmentBundle:
        if gate_result.disposition != MandateDisposition.IN_BOX:
            return EnrichmentBundle(
                docket_id=gate_result.docket_id,
                invoked_tools=[],
                va_scc=None,
                fema_flood=None,
                epa_env=None,
                fmcsa_fleet=None,
                independent_source_urls=[],
                has_hard_environmental_or_safety_block=False,
                block_reasons=["SKIPPED_NOT_IN_BOX"],
            )

        tools = list(gate_result.enrichment_tools_to_invoke)
        urls: List[str] = [primary_docket_url, gis_source_url]
        blocks: List[str] = []

        va_scc: Optional[VirginiaSCCEntityRecord] = None
        fema_rec: Optional[FEMAFloodZoneRecord] = None
        epa_rec: Optional[EPAEnvironmentalRecord] = None
        fmcsa_rec: Optional[FMCSAFleetSafetyRecord] = None

        if "VA_SCC_CIS_ENTITY_CHECK" in tools:
            raw_scc = mock_payloads.get("VA_SCC_CIS_ENTITY_CHECK", {})
            scc_url = raw_scc.get(
                "source_url", "https://cis.scc.virginia.gov/EntitySearch/Index"
            )
            urls.append(scc_url)
            va_scc = VirginiaSCCEntityRecord(
                entity_id=str(raw_scc.get("entity_id", "SCC-VA-001")),
                legal_name=str(raw_scc.get("legal_name", "ROANOKE OPERATING LLC")),
                status=ProvenancedValue(
                    value=str(raw_scc.get("status", "ACTIVE")),
                    source_url=scc_url,
                    verified_at=verified_at,
                    confidence_score=Decimal("0.99"),
                    epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
                ),
                good_standing=ProvenancedValue(
                    value=bool(raw_scc.get("good_standing", True)),
                    source_url=scc_url,
                    verified_at=verified_at,
                    confidence_score=Decimal("0.99"),
                    epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
                ),
                registered_agent_name=str(raw_scc.get("registered_agent", "Woods Rogers Vandeventer Black PLC")),
                formation_year=int(raw_scc.get("formation_year", 2004)),
            )

        if "FEMA_NFHL_FLOOD_CHECK" in tools:
            raw_fema = mock_payloads.get("FEMA_NFHL_FLOOD_CHECK", {})
            fema_url = raw_fema.get("source_url", "https://msc.fema.gov/portal/search")
            urls.append(fema_url)
            zone = str(raw_fema.get("flood_zone", "X"))
            uninsured_fw = bool(raw_fema.get("is_in_uninsured_floodway", False))
            if uninsured_fw:
                blocks.append("HARD_BLOCK_UNINSURED_FEMA_FLOODWAY")
            fema_rec = FEMAFloodZoneRecord(
                panel_id=str(raw_fema.get("panel_id", "51161C0145G")),
                flood_zone=ProvenancedValue(
                    value=zone,
                    source_url=fema_url,
                    verified_at=verified_at,
                    confidence_score=Decimal("0.99"),
                    epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
                ),
                is_in_uninsured_floodway=uninsured_fw,
            )

        if "EPA_UST_AND_ENVIROFACTS" in tools:
            raw_epa = mock_payloads.get("EPA_UST_AND_ENVIROFACTS", {})
            epa_url = raw_epa.get("source_url", "https://www.epa.gov/ust/ust-finder")
            urls.append(epa_url)
            has_lust = bool(raw_epa.get("has_open_lust_violation", False))
            if has_lust:
                blocks.append("HARD_BLOCK_OPEN_EPA_LUST_VIOLATION")
            epa_rec = EPAEnvironmentalRecord(
                registry_id=str(raw_epa.get("registry_id", "EPA-VA-11000")),
                active_ust_count=int(raw_epa.get("active_ust_count", 0)),
                has_open_lust_violation=ProvenancedValue(
                    value=has_lust,
                    source_url=epa_url,
                    verified_at=verified_at,
                    confidence_score=Decimal("0.97"),
                    epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
                ),
                compliance_summary=str(raw_epa.get("compliance_summary", "No open violations")),
            )

        if "FMCSA_SAFER_FLEET_CHECK" in tools:
            raw_fmcsa = mock_payloads.get("FMCSA_SAFER_FLEET_CHECK", {})
            fmcsa_url = raw_fmcsa.get(
                "source_url", "https://safer.fmcsa.dot.gov/CompanySnapshot.aspx"
            )
            urls.append(fmcsa_url)
            rating = str(raw_fmcsa.get("safety_rating", "SATISFACTORY"))
            if rating == "UNSATISFACTORY":
                blocks.append("HARD_BLOCK_FMCSA_UNSATISFACTORY_SAFETY_RATING")
            fmcsa_rec = FMCSAFleetSafetyRecord(
                usdot_number=str(raw_fmcsa.get("usdot_number", "USDOT-884120")),
                power_units=int(raw_fmcsa.get("power_units", 14)),
                safety_rating=ProvenancedValue(
                    value=rating,
                    source_url=fmcsa_url,
                    verified_at=verified_at,
                    confidence_score=Decimal("0.98"),
                    epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
                ),
                vehicle_oos_pct=Decimal(str(raw_fmcsa.get("vehicle_oos_pct", "8.50"))),
            )

        return EnrichmentBundle(
            docket_id=gate_result.docket_id,
            invoked_tools=tools,
            va_scc=va_scc,
            fema_flood=fema_rec,
            epa_env=epa_rec,
            fmcsa_fleet=fmcsa_rec,
            independent_source_urls=urls,
            has_hard_environmental_or_safety_block=(len(blocks) > 0),
            block_reasons=blocks,
        )

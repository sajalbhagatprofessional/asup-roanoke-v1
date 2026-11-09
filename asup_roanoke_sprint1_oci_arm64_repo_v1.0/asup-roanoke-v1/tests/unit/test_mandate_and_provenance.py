from datetime import datetime, timezone
from decimal import Decimal
from packages.mandate_filter import (
    MandateDisposition,
    RawDocketCandidate,
    evaluate_mandate_roa_smb_01,
)
from packages.core_types import (
    EpistemicTier,
    ProvenancedValue,
    RuleCandidate,
    resolve_epistemic_conflict,
)
from packages.core_types.provenance import verify_dual_independent_sources


def test_mandate_roa_smb_01_routing_and_zero_cost_kill():
    # 1. Roanoke City (51770) industrial machine shop ($3.2M) -> IN_BOX
    c_in = RawDocketCandidate(
        docket_id="ROA-001",
        fips_code="51770",
        parcel_id="101-02-04",
        entity_name="Star City Precision Machining LLC",
        naics_code="332710",
        asking_or_cure_price_usd=Decimal("3200000.00"),
        has_real_estate_or_equipment_floor=True,
    )
    r_in = evaluate_mandate_roa_smb_01(c_in)
    assert r_in.disposition == MandateDisposition.IN_BOX
    assert "EPA_UST_AND_ENVIROFACTS" in r_in.enrichment_tools_to_invoke
    assert "FMCSA_SAFER_FLEET_CHECK" not in r_in.enrichment_tools_to_invoke

    # 2. City of Salem (51775) adjacent deal -> NEAR_MISS_LOGGED with 0 API calls
    c_nm = RawDocketCandidate(
        docket_id="SAL-002",
        fips_code="51775",
        parcel_id="SAL-88-1",
        entity_name="Salem Cold Storage Inc",
        naics_code="493120",
        asking_or_cure_price_usd=Decimal("4100000.00"),
        has_real_estate_or_equipment_floor=True,
    )
    r_nm = evaluate_mandate_roa_smb_01(c_nm)
    assert r_nm.disposition == MandateDisposition.NEAR_MISS_LOGGED
    assert r_nm.estimated_enrichment_api_calls == 0

    # 3. Out-of-box county (Montgomery 51121) -> REJECTED_HARD_FILTER with 0 API calls
    c_kill = RawDocketCandidate(
        docket_id="MNT-003",
        fips_code="51121",
        parcel_id="M-19",
        entity_name="Blacksburg Crypto Holdings",
        naics_code="523940",
        asking_or_cure_price_usd=Decimal("1500000.00"),
        has_real_estate_or_equipment_floor=False,
    )
    r_kill = evaluate_mandate_roa_smb_01(c_kill)
    assert r_kill.disposition == MandateDisposition.REJECTED_HARD_FILTER
    assert r_kill.estimated_enrichment_api_calls == 0


def test_epistemic_hierarchy_tier_a_statute_overrides_tier_c_guru():
    # Guru claims 0% buyer cash (100% seller financing) is allowed; SBA SOP 50 10 8.1 requires >=5% buyer cash
    tier_c_guru = RuleCandidate(
        rule_id="GURU-ZERO-DOWN",
        parameter_name="min_buyer_cash_pct",
        value=Decimal("0.0000"),
        tier=EpistemicTier.TIER_C_PRACTITIONER,
        source_url="https://example.com/guru-blog",
    )
    tier_a_sba = RuleCandidate(
        rule_id="SBA-SOP-50-10-8.1",
        parameter_name="min_buyer_cash_pct",
        value=Decimal("0.0500"),
        tier=EpistemicTier.TIER_A_STATUTE,
        source_url="https://legacy.sba.gov/document/information-notice-5000-880695-issuance-sop-50-10-81",
    )
    winner = resolve_epistemic_conflict([tier_c_guru, tier_a_sba], Decimal("2500000.00"))
    assert winner.rule_id == "SBA-SOP-50-10-8.1"
    assert winner.value == Decimal("0.0500")


def test_provenanced_value_badge_and_dual_source_gate():
    unproven = ProvenancedValue(
        value=None,
        source_url=None,
        verified_at=None,
        confidence_score=Decimal("0.00"),
        epistemic_tier=EpistemicTier.TIER_C_PRACTITIONER,
        is_unproven=True,
        unproven_reason="Seller verbal claim without tax return",
    )
    assert "[UNPROVEN — REQUIRES DILIGENCE" in unproven.format_badge()

    # Two URLs on the same domain = 1 source (fails dual-source gate)
    assert verify_dual_independent_sources([
        "https://roanoke.column.us/search?id=1",
        "https://roanoke.column.us/search?id=2",
    ]) is False

    # Two independent public domains = passes dual-source gate
    assert verify_dual_independent_sources([
        "https://roanoke.column.us/search?id=1",
        "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer",
    ]) is True

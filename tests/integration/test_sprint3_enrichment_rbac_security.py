from datetime import datetime, timedelta, timezone
from decimal import Decimal
from packages.mandate_filter import RawDocketCandidate, evaluate_mandate_roa_smb_01
from services.enrichment import ConditionalEnrichmentRouter
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


def test_conditional_enrichment_routes_by_naics_and_blocks_lust():
    now = datetime(2026, 11, 9, 12, 0, 0, tzinfo=timezone.utc)

    # 1. Gas station (447110) in Roanoke County (51161) -> calls EPA UST, skips FMCSA
    cand_gas = RawDocketCandidate(
        docket_id="ROA-GAS-01",
        fips_code="51161",
        parcel_id="065.11-02-09",
        entity_name="Peters Creek Fuel & Mart LLC",
        naics_code="447110",
        asking_or_cure_price_usd=Decimal("1850000.00"),
        has_real_estate_or_equipment_floor=True,
    )
    gate_gas = evaluate_mandate_roa_smb_01(cand_gas)
    bundle_gas = ConditionalEnrichmentRouter.enrich_in_box_candidate(
        gate_result=gate_gas,
        primary_docket_url="https://roanoke.column.us/search?id=gas01",
        gis_source_url="https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer/0",
        mock_payloads={
            "EPA_UST_AND_ENVIROFACTS": {"has_open_lust_violation": True, "active_ust_count": 4}
        },
        verified_at=now,
    )
    assert "EPA_UST_AND_ENVIROFACTS" in bundle_gas.invoked_tools
    assert "FMCSA_SAFER_FLEET_CHECK" not in bundle_gas.invoked_tools
    assert bundle_gas.has_hard_environmental_or_safety_block is True
    assert "HARD_BLOCK_OPEN_EPA_LUST_VIOLATION" in bundle_gas.block_reasons

    # 2. Trucking fleet (484121) in Roanoke City (51770) -> calls FMCSA, skips EPA UST
    cand_truck = RawDocketCandidate(
        docket_id="ROA-TRK-02",
        fips_code="51770",
        parcel_id="4011902",
        entity_name="Blue Ridge Regional Freight Inc",
        naics_code="484121",
        asking_or_cure_price_usd=Decimal("2900000.00"),
        has_real_estate_or_equipment_floor=True,
    )
    gate_truck = evaluate_mandate_roa_smb_01(cand_truck)
    bundle_truck = ConditionalEnrichmentRouter.enrich_in_box_candidate(
        gate_result=gate_truck,
        primary_docket_url="https://pacer.uscourts.gov/file-case/court-cmecf-lookup/court/VAWBK",
        gis_source_url="https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels",
        mock_payloads={
            "FMCSA_SAFER_FLEET_CHECK": {"safety_rating": "SATISFACTORY", "power_units": 18}
        },
        verified_at=now,
    )
    assert "FMCSA_SAFER_FLEET_CHECK" in bundle_truck.invoked_tools
    assert "EPA_UST_AND_ENVIROFACTS" not in bundle_truck.invoked_tools
    assert bundle_truck.has_hard_environmental_or_safety_block is False


def test_5_role_rbac_isolation_freshness_sla_and_dual_source_gate():
    ledger = ImmutableAuditLedger()
    store = RBACPipelineStore(ledger)
    now = datetime(2026, 11, 9, 12, 0, 0, tzinfo=timezone.utc)

    # Insert 1 unverified deal and 1 candidate with >=2 independent sources
    d_unverified = DealRecord(
        deal_id="DEAL-UNVERIFIED-01",
        mandate_code="ROA-SMB-01",
        fips_code="51770",
        parcel_id="10101",
        entity_name="Unverified Shop LLC",
        naics_code="332710",
        stage=DealStage.ANALYST_REVIEW_PENDING,
        asking_or_cure_price_usd=Decimal("1500000.00"),
        assessed_or_replacement_usd=Decimal("2400000.00"),
        internal_max_bid_usd=Decimal("1600000.00"),
        base_dscr=Decimal("1.4500"),
        stress_dscr=Decimal("1.2000"),
        independent_source_urls=["https://roanoke.column.us/search?id=1"],  # Only 1 source!
        docket_verified_at=now,
        gis_verified_at=now,
    )
    store.upsert_deal(d_unverified)

    # Principal query MUST return 0 deals before verification
    assert store.query_deals_for_role(TeamRole.PRINCIPAL, now=now) == []

    # Analyst attempting to promote a 1-source deal MUST fail with UnverifiedLeadPromotionError
    try:
        store.analyst_verify_and_promote("DEAL-UNVERIFIED-01", TeamRole.ANALYST, "analyst_1", now=now)
        raise AssertionError("Expected UnverifiedLeadPromotionError when <2 sources exist")
    except UnverifiedLeadPromotionError:
        pass

    # Add second independent source domain -> Analyst promotion succeeds
    d_unverified.independent_source_urls.append(
        "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer"
    )
    store.analyst_verify_and_promote("DEAL-UNVERIFIED-01", TeamRole.ANALYST, "analyst_1", now=now)

    # Now Principal sees the verified deal!
    principal_view = store.query_deals_for_role(TeamRole.PRINCIPAL, now=now)
    assert len(principal_view) == 1
    assert principal_view[0]["deal_id"] == "DEAL-UNVERIFIED-01"

    # Advance clock by 50 hours (> 48-hour active docket SLA) -> Principal query auto-downgrades stale deal!
    future_50h = now + timedelta(hours=50)
    assert store.query_deals_for_role(TeamRole.PRINCIPAL, now=future_50h) == []
    assert store._deals["DEAL-UNVERIFIED-01"].stage == DealStage.STALE_REVERIFICATION_REQUIRED

    # Verify LENDER_BROKER cannot see internal_max_bid_usd even on LOI_LENDER_PACK deals
    store._deals["DEAL-UNVERIFIED-01"].stage = DealStage.LOI_LENDER_PACK
    broker_view = store.query_deals_for_role(TeamRole.LENDER_BROKER, now=future_50h)
    assert len(broker_view) == 1
    assert "internal_max_bid_usd" not in broker_view[0]


def test_pii_vault_encryption_and_immutable_audit_log_tamper_block():
    key = b"0123456789abcdef0123456789abcdef"
    vault = OwnerPIIVault(key)
    contact = {
        "trustee_phone": "+1-540-555-0199",
        "trustee_email": "trustee@spilmanlaw.example.com",
    }
    enc_rec = vault.store_encrypted_pii(
        deal_id="ROA-001",
        fiduciary_or_trustee_name="Spilman Thomas & Battle PLLC",
        contact_dict=contact,
        is_dnc_suppressed=False,
    )
    # Raw ciphertext bytes must not contain plaintext phone or email
    assert b"540-555-0199" not in enc_rec.ciphertext_bytes
    assert b"spilmanlaw" not in enc_rec.ciphertext_bytes

    # Authorized role (COUNSEL) decrypts cleanly
    dec = vault.decrypt_pii("ROA-001", TeamRole.COUNSEL)
    assert dec["trustee_phone"] == "+1-540-555-0199"

    # LENDER_BROKER role is blocked from decrypting PII vault
    try:
        vault.decrypt_pii("ROA-001", TeamRole.LENDER_BROKER)
        raise AssertionError("Expected PermissionDeniedError for LENDER_BROKER")
    except PermissionDeniedError:
        pass

    # Immutable Audit Log must block UPDATE and DELETE
    ledger = ImmutableAuditLedger()
    evt = ledger.append_event(TeamRole.PRINCIPAL, "principal_1", "APPROVE_DEAL", "ROA-001", {"ok": True})
    try:
        ledger.update_event(evt.event_id, {"ok": False})
        raise AssertionError("Expected AuditLogTamperError on update")
    except AuditLogTamperError:
        pass
    try:
        ledger.delete_event(evt.event_id)
        raise AssertionError("Expected AuditLogTamperError on delete")
    except AuditLogTamperError:
        pass

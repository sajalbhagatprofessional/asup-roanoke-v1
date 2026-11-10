from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from packages.core_types import EpistemicTier, ProvenancedValue
from packages.underwriting_engine import (
    SBACapitalStructureInput,
    VirginiaForeclosureInput,
    evaluate_sba_sop_50_10_8_1,
    evaluate_va_foreclosure_basis,
)
from services.lender_pack import check_90_day_mandate_expiry, generate_sba_lender_pack
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


def test_citation_locked_memo_drafter_enforces_urls_and_disclaimer():
    now = datetime(2026, 11, 10, 12, 0, 0, tzinfo=timezone.utc)
    claims = {
        "Assessed Value (Roanoke County TaxView)": ProvenancedValue(
            value=Decimal("2500000.00"),
            source_url="https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer/0",
            verified_at=now,
            confidence_score=Decimal("0.98"),
            epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
        ),
        "Seller Claimed Off-Book Cash": ProvenancedValue(
            value=None,
            source_url=None,
            verified_at=None,
            confidence_score=Decimal("0.00"),
            epistemic_tier=EpistemicTier.TIER_C_PRACTITIONER,
            is_unproven=True,
            unproven_reason="No CPA tax return support",
        ),
    }

    memo = CitationLockedMemoDrafter.generate_deal_memo(
        deal_id="ROA-MEMO-01",
        entity_name="Valley Precision Fabrication LLC",
        claims=claims,
        key_risks=["14-day Va. Code § 55.1-321 auction window closes Nov 18, 2026"],
        generated_at=now,
    )
    assert LEGAL_TAX_DISCLAIMER_BANNER in memo.executive_summary_md
    assert "[UNPROVEN — REQUIRES DILIGENCE: No CPA tax return support]" in memo.executive_summary_md
    assert memo.status == "DRAFT_PENDING_REVIEW"

    # Attempting to alter or remove the legal/tax disclaimer banner MUST fail
    try:
        CitationLockedMemoDrafter.generate_deal_memo(
            deal_id="ROA-MEMO-01",
            entity_name="Valley Precision Fabrication LLC",
            claims=claims,
            key_risks=[],
            generated_at=now,
            custom_disclaimer="Approved Legal Advice",
        )
        raise AssertionError("Expected MissingDisclaimerError")
    except MissingDisclaimerError:
        pass


def test_human_gated_outreach_blocks_blasts_dnc_predatory_and_missing_tokens():
    now = datetime(2026, 11, 10, 12, 0, 0, tzinfo=timezone.utc)
    engine = HumanGatedOutreachEngine()
    engine.add_to_dnc_suppression_list("optedout@example.com")

    p_tok = PrincipalApprovalToken("PTOK-1", "ROA-01", "principal_1", now)
    c_sig = CounselComplianceSignoff("CSIG-1", "ROA-01", "counsel_1", True, now)

    # 1. Mass blast (>1 recipient) -> Blocked
    try:
        engine.validate_and_dispatch(
            OutreachRequest(
                deal_id="ROA-01",
                channel_type="WARM_FIDUCIARY_TRUSTEE",
                recipient_emails_or_phones=["a@example.com", "b@example.com"],
                subject_line="Inquiry",
                body_text="Hello",
                includes_physical_address_and_opt_out_footer=True,
                targets_personal_divorce_or_bereavement=False,
                principal_token=p_tok,
                counsel_signoff=c_sig,
            ),
            now=now,
        )
        raise AssertionError("Expected anti-blast violation")
    except OutreachComplianceViolationError:
        pass

    # 2. DNC Suppressed recipient -> Blocked under Va. Code § 59.1-514
    try:
        engine.validate_and_dispatch(
            OutreachRequest(
                deal_id="ROA-01",
                channel_type="WARM_FIDUCIARY_TRUSTEE",
                recipient_emails_or_phones=["optedout@example.com"],
                subject_line="Inquiry",
                body_text="Hello",
                includes_physical_address_and_opt_out_footer=True,
                targets_personal_divorce_or_bereavement=False,
                principal_token=p_tok,
                counsel_signoff=c_sig,
            ),
            now=now,
        )
        raise AssertionError("Expected DNC suppression block")
    except OutreachComplianceViolationError:
        pass

    # 3. Predatory divorce/bereavement targeting -> Blocked
    try:
        engine.validate_and_dispatch(
            OutreachRequest(
                deal_id="ROA-01",
                channel_type="DIRECT_OWNER_LAST_RESORT",
                recipient_emails_or_phones=["owner@example.com"],
                subject_line="Inquiry",
                body_text="Hello",
                includes_physical_address_and_opt_out_footer=True,
                targets_personal_divorce_or_bereavement=True,
                principal_token=p_tok,
                counsel_signoff=c_sig,
            ),
            now=now,
        )
        raise AssertionError("Expected predatory signal block")
    except OutreachComplianceViolationError:
        pass

    # 4. Valid warm fiduciary outreach with Principal + Counsel tokens -> Succeeds
    receipt = engine.validate_and_dispatch(
        OutreachRequest(
            deal_id="ROA-01",
            channel_type="WARM_FIDUCIARY_TRUSTEE",
            recipient_emails_or_phones=["trustee@spilmanlaw.example.com"],
            subject_line="Acquisition Inquiry — Parcel 065.14-01-22",
            body_text="Dear Substitute Trustee...",
            includes_physical_address_and_opt_out_footer=True,
            targets_personal_divorce_or_bereavement=False,
            principal_token=p_tok,
            counsel_signoff=c_sig,
        ),
        now=now,
    )
    assert receipt.deal_id == "ROA-01"


def test_sba_lender_pack_exporter_and_90_day_mandate_expiry_gate():
    now = datetime(2026, 11, 10, 12, 0, 0, tzinfo=timezone.utc)
    sba_in = SBACapitalStructureInput(
        total_project_cost_usd=Decimal("2500000.00"),
        appraised_owner_occupied_cre_usd=Decimal("1200000.00"),
        sba_7a_loan_usd=Decimal("2250000.00"),
        sba_annual_interest_rate=Decimal("0.0850"),
        sba_amortization_months=180,
        buyer_cash_equity_usd=Decimal("125000.00"),
        seller_standby_note_usd=Decimal("125000.00"),
        seller_standby_lock_months=36,
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

    memo = CitationLockedMemoDrafter.generate_deal_memo(
        deal_id="ROA-LP-01",
        entity_name="Star City Precision Machining LLC",
        claims={},
        key_risks=["None"],
        generated_at=now,
    )
    signed_memo = CitationLockedMemoDrafter.record_counsel_and_cpa_signoff(memo, "counsel_1", "cpa_1")
    pack = generate_sba_lender_pack("ROA-LP-01", "Star City Precision Machining LLC", sba_res, va_res, signed_memo, 36)
    assert pack.sba_compliant is True
    assert "SBA SOP 50 10 8.1" in pack.sanitized_markdown_pack

    # 90-Day Mandate Expiry Gate
    active_status = check_90_day_mandate_expiry("ROA-SMB-01", "1.0.0", now, now + timedelta(days=30))
    assert active_status.status == "ACTIVE"
    assert active_status.allow_paid_enrichment is True

    expired_status = check_90_day_mandate_expiry("ROA-SMB-01", "1.0.0", now, now + timedelta(days=91))
    assert expired_status.status == "PAUSED_EXPIRED_REVIEW_DUE"
    assert expired_status.allow_paid_enrichment is False

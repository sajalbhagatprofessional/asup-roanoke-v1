from decimal import Decimal
from fastapi.testclient import TestClient

from services.api.main import app
from services.security import TeamRole


client = TestClient(app)


def test_fastapi_health_endpoint():
    res = client.get("/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "asup-roanoke-api"
    assert data["mandate_code"] == "ROA-SMB-01"
    assert data["mandate_status"] == "ACTIVE"
    assert data["allow_paid_enrichment"] is True


def test_fastapi_dockets_ingest_mandate_gate_and_zero_cost_kill():
    # 1. Out-of-box geography (e.g. Richmond FIPS 51760) -> Killed immediately at $0 spend
    res_oob = client.post(
        "/v1/dockets/ingest",
        json={
            "docket_id": "DOCK-OOB-01",
            "fips_code": "51760",
            "parcel_id": "P-9999",
            "entity_name": "Richmond Distribution Corp",
            "naics_code": "493110",
            "asking_or_cure_price_usd": "2500000.00",
            "has_real_estate_or_equipment_floor": True,
        },
    )
    assert res_oob.status_code == 200
    d_oob = res_oob.json()
    assert d_oob["disposition"] == "REJECTED_HARD_FILTER"
    assert d_oob["paid_enrichment_invoked"] is False
    assert d_oob["spend_usd"] == "0.00"
    assert len(d_oob["reasons"]) >= 1

    # 2. Near-miss geography (City of Salem FIPS 51775) -> Logged to near-miss quarantine
    res_nm = client.post(
        "/v1/dockets/ingest",
        json={
            "docket_id": "DOCK-SALEM-02",
            "fips_code": "51775",
            "parcel_id": "SALEM-012",
            "entity_name": "Salem Metal Finishing LLC",
            "naics_code": "332813",
            "asking_or_cure_price_usd": "1800000.00",
            "has_real_estate_or_equipment_floor": True,
        },
    )
    assert res_nm.status_code == 200
    d_nm = res_nm.json()
    assert d_nm["disposition"] == "NEAR_MISS_LOGGED"
    assert d_nm["paid_enrichment_invoked"] is False
    assert len(d_nm["reasons"]) >= 1

    # 3. In-box eligible (City of Roanoke FIPS 51770) -> Enriched and created in ANALYST_REVIEW_PENDING
    res_in = client.post(
        "/v1/dockets/ingest",
        json={
            "docket_id": "DOCK-ROA-03",
            "fips_code": "51770",
            "parcel_id": "4019999",
            "entity_name": "Star City CNC Works LLC",
            "naics_code": "332710",
            "asking_or_cure_price_usd": "1950000.00",
            "has_real_estate_or_equipment_floor": True,
        },
    )
    assert res_in.status_code == 200
    d_in = res_in.json()
    assert d_in["disposition"] == "IN_BOX"
    assert d_in["stage"] == "ANALYST_REVIEW_PENDING"
    assert len(d_in["invoked_tools"]) >= 1

    # 4. In-box gas station with open LUST violation -> Environmental Hard Block
    res_lust = client.post(
        "/v1/dockets/ingest",
        json={
            "docket_id": "DOCK-ROA-GAS-04",
            "fips_code": "51161",
            "parcel_id": "065.11-02-19",
            "entity_name": "Contaminated Gas LLC",
            "naics_code": "447110",
            "asking_or_cure_price_usd": "1400000.00",
            "has_real_estate_or_equipment_floor": True,
            "mock_payloads": {
                "EPA_UST_AND_ENVIROFACTS": {"has_open_lust_violation": True, "active_ust_count": 3}
            },
        },
    )
    assert res_lust.status_code == 200
    d_lust = res_lust.json()
    assert d_lust["stage"] == "REJECTED_HARD_FILTER"
    assert "HARD_BLOCK_OPEN_EPA_LUST_VIOLATION" in d_lust["block_reasons"]


def test_fastapi_deals_rbac_and_row_level_security():
    # 1. Principal query returns <= 5 verified deals
    res_principal = client.get("/v1/deals?role=PRINCIPAL")
    assert res_principal.status_code == 200
    p_deals = res_principal.json()
    assert len(p_deals) <= 5
    for d in p_deals:
        assert d["stage"] in (
            "VERIFIED_READY_FOR_PRINCIPAL",
            "COUNSEL_DILIGENCE",
            "NDA_DATA_ROOM",
            "LOI_LENDER_PACK",
        )

    # 2. Lender Broker query sees ONLY LOI_LENDER_PACK deals and NEVER sees internal_max_bid_usd
    res_broker = client.get("/v1/deals?role=LENDER_BROKER")
    assert res_broker.status_code == 200
    b_deals = res_broker.json()
    for d in b_deals:
        assert d["stage"] == "LOI_LENDER_PACK"
        assert "internal_max_bid_usd" not in d

    # 3. Analyst sees full pipeline
    res_analyst = client.get("/v1/deals?role=ANALYST")
    assert res_analyst.status_code == 200
    a_deals = res_analyst.json()
    stages = {d["stage"] for d in a_deals}
    assert "ANALYST_REVIEW_PENDING" in stages or "VERIFIED_READY_FOR_PRINCIPAL" in stages


def test_fastapi_deal_verify_memo_outreach_and_lender_pack():
    # 1. Promote raw deal ROA-RAW-05: fails when <2 sources exist
    res_v_fail = client.post(
        "/v1/deals/ROA-RAW-05/verify",
        json={"role": "ANALYST", "analyst_id": "analyst_1"},
    )
    assert res_v_fail.status_code == 400

    # Supply second independent public domain -> Promotion succeeds
    res_v_ok = client.post(
        "/v1/deals/ROA-RAW-05/verify",
        json={
            "role": "ANALYST",
            "analyst_id": "analyst_1",
            "new_source_urls": ["https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels"],
        },
    )
    assert res_v_ok.status_code == 200
    assert res_v_ok.json()["stage"] == "VERIFIED_READY_FOR_PRINCIPAL"

    # 2. Deal Memo generation carries disclaimer
    res_memo = client.post(
        "/v1/deals/ROA-GD-01/memo",
        json={
            "counsel_id": "counsel_1",
            "cpa_id": "cpa_1",
            "key_risks": ["14-day statutory foreclosure notice period"],
        },
    )
    assert res_memo.status_code == 200
    memo_data = res_memo.json()
    assert "LLM DRAFT" in memo_data["disclaimer_banner"]
    assert memo_data["status"] == "APPROVED_BY_COUNSEL_AND_CPA"

    # 3. Outreach endpoint blocks mass blasts and DNC recipients
    res_blast = client.post(
        "/v1/deals/ROA-GD-01/outreach",
        json={
            "recipient": "optedout@example.com",  # On DNC list
            "subject_line": "Notice Inquiry",
            "body_text": "Fiduciary inquiry regarding parcel 4011902...",
            "principal_token_id": "PTOK-ROA-GD-01",
            "counsel_signoff_id": "CSIG-ROA-GD-01",
        },
    )
    assert res_blast.status_code == 400

    # Valid warm fiduciary outreach succeeds
    res_outreach = client.post(
        "/v1/deals/ROA-GD-01/outreach",
        json={
            "recipient": "trustee@spilmanlaw.example.com",
            "subject_line": "Acquisition Inquiry — Star City Precision Machining LLC",
            "body_text": "Dear Substitute Trustee: On behalf of our principal, we confirm interest...",
            "principal_token_id": "PTOK-ROA-GD-01",
            "counsel_signoff_id": "CSIG-ROA-GD-01",
        },
    )
    assert res_outreach.status_code == 200
    assert res_outreach.json()["status"] == "DISPATCHED_TO_FIDUCIARY"

    # 4. Lender Pack Export
    res_pack = client.get("/v1/deals/ROA-LP-01/lender-pack?standby_lock_months=36")
    assert res_pack.status_code == 200
    pack_data = res_pack.json()
    assert pack_data["sba_compliant"] is True
    assert pack_data["standby_lock_months"] == 36
    assert "SBA SOP 50 10 8.1" in pack_data["sanitized_markdown_pack"]


def test_fastapi_principal_decision_counsel_review_and_cpa_audit():
    # 1. Principal 1-click decision (Send to Counsel)
    res_dec = client.post(
        "/v1/deals/ROA-GD-01/decision",
        json={"action": "SEND_TO_COUNSEL", "principal_id": "principal_1", "notes": "Approved for diligence"},
    )
    assert res_dec.status_code == 200
    assert res_dec.json()["new_stage"] == "COUNSEL_DILIGENCE"

    # 2. Counsel review (14-day notice check)
    res_counsel = client.post(
        "/v1/deals/ROA-GD-01/counsel-review",
        json={
            "counsel_id": "counsel_1",
            "notice_published_date": "2026-11-01",
            "scheduled_sale_date": "2026-11-19",  # 18 days >= 14 days
            "senior_payoff_usd": "950000.00",
            "delinquent_tax_usd": "25000.00",
            "trustee_fees_usd": "15000.00",
            "immediate_capex_usd": "80000.00",
            "verified_assessed_usd": "1800000.00",
        },
    )
    assert res_counsel.status_code == 200
    assert res_counsel.json()["va_foreclosure_compliant"] is True

    # 3. CPA Audit under SBA SOP 50 10 8.1
    res_cpa = client.post(
        "/v1/deals/ROA-GD-01/cpa-audit",
        json={
            "cpa_id": "cpa_1",
            "total_project_cost_usd": "2000000.00",
            "appraised_cre_usd": "1000000.00",
            "sba_7a_loan_usd": "1800000.00",
            "buyer_cash_equity_usd": "100000.00",
            "seller_standby_note_usd": "100000.00",
            "seller_standby_lock_months": 36,
            "seller_consulting_months": 12,
            "adjusted_ebitda_post_gm_usd": "450000.00",
            "annual_maintenance_capex_usd": "30000.00",
            "annual_cash_taxes_usd": "50000.00",
        },
    )
    assert res_cpa.status_code == 200
    assert res_cpa.json()["is_sba_compliant"] is True

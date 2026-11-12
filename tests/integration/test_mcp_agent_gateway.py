"""
Integration Test Suite for Anthropic Model Context Protocol (MCP) & Developer Agent Gateway.
Validates end-to-end functionality of JSON-RPC 2.0 (2024-11-05 Specification) for
external AI agents: Claude Desktop, Claude Code, Hermes, OpenClaw, and GitHub Copilot.
"""

from decimal import Decimal
import json
from fastapi.testclient import TestClient

from services.api.main import app
from services.mcp.server import dispatch_jsonrpc, generate_claude_desktop_config
from services.security.api_key_store import api_key_store

client = TestClient(app)
MASTER_TEST_KEY = "asup_live_anthropic_mcp_master_key_2026"


# =========================================================================
# 1. DEVELOPER API KEY LIFECYCLE & SECURITY TESTS
# =========================================================================

def test_developer_api_key_lifecycle_and_auth():
    # 1. List keys - master key should be present
    res = client.get("/v1/developer/keys")
    assert res.status_code == 200
    keys = res.json()["keys"]
    assert len(keys) >= 1
    assert any(k["key_id"] == "KEY-DEV-001" for k in keys)

    # 2. No Auth fails with 401
    unauth_res = client.post("/mcp/messages", json={"jsonrpc": "2.0", "id": 1, "method": "initialize"})
    assert unauth_res.status_code == 401

    # 3. Bad Auth fails with 401
    bad_res = client.post(
        "/mcp/messages",
        headers={"Authorization": "Bearer asup_invalid_token_12345"},
        json={"jsonrpc": "2.0", "id": 1, "method": "initialize"},
    )
    assert bad_res.status_code == 401

    # 4. Generate dynamic key
    create_res = client.post(
        "/v1/developer/keys",
        json={"name": "Hermes CI/CD Agent", "role": "ANALYST"},
    )
    assert create_res.status_code == 200
    new_key_data = create_res.json()
    assert "raw_api_key" in new_key_data
    assert new_key_data["raw_api_key"].startswith("asup_live_")
    new_token = new_key_data["raw_api_key"]
    new_id = new_key_data["key_id"]

    # 5. Access with new key succeeds
    auth_res = client.post(
        "/mcp/messages",
        headers={"X-API-Key": new_token},
        json={"jsonrpc": "2.0", "id": 1, "method": "ping"},
    )
    assert auth_res.status_code == 200
    assert auth_res.json() == {"jsonrpc": "2.0", "id": 1, "result": {}}

    # 6. Revoke key
    del_res = client.delete(f"/v1/developer/keys/{new_id}")
    assert del_res.status_code == 200

    # 7. Access with revoked key fails with 401
    revoked_res = client.post(
        "/mcp/messages",
        headers={"X-API-Key": new_token},
        json={"jsonrpc": "2.0", "id": 1, "method": "ping"},
    )
    assert revoked_res.status_code == 401


# =========================================================================
# 2. MCP PROTOCOL INITIALIZE & CORE HANDSHAKE
# =========================================================================

def test_mcp_initialize_and_notifications():
    # Test initialize method
    init_payload = {
        "jsonrpc": "2.0",
        "id": "init-001",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "clientInfo": {"name": "claude-desktop", "version": "0.1.0"},
        },
    }
    res = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=init_payload,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["jsonrpc"] == "2.0"
    assert data["id"] == "init-001"
    assert data["result"]["protocolVersion"] == "2024-11-05"
    assert "tools" in data["result"]["capabilities"]
    assert "resources" in data["result"]["capabilities"]
    assert "prompts" in data["result"]["capabilities"]
    assert data["result"]["serverInfo"]["name"] == "asup-mcp-server"

    # Test client notification (no id)
    notif_payload = {
        "jsonrpc": "2.0",
        "method": "notifications/initialized",
    }
    res_notif = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=notif_payload,
    )
    assert res_notif.status_code == 200
    assert res_notif.json() == {"status": "ok"}

    # Test unknown method returns -32601
    unknown_payload = {
        "jsonrpc": "2.0",
        "id": 999,
        "method": "non_existent_method",
    }
    res_unknown = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=unknown_payload,
    )
    assert res_unknown.status_code == 200
    assert res_unknown.json()["error"]["code"] == -32601


# =========================================================================
# 3. MCP TOOLS CATALOG & CALL EXECUTION (ALL 11 TOOLS)
# =========================================================================

def test_mcp_tools_list():
    res = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json={"jsonrpc": "2.0", "id": "tools-1", "method": "tools/list"},
    )
    assert res.status_code == 200
    tools = res.json()["result"]["tools"]
    assert len(tools) == 30
    tool_names = {t["name"] for t in tools}
    expected = {
        "search_deals_and_assets",
        "get_asset_dossier",
        "get_spatial_digital_twin",
        "underwrite_sba_sop_50_10_8_1",
        "audit_addbacks_and_qoe",
        "evaluate_sec_edgar_arbitrage",
        "screen_yente_aml_kyc",
        "run_openbb_macro_sofr_stress",
        "parse_unstructured_tax_return",
        "generate_fiduciary_outreach_playbook",
        "manage_kanban_crm_stage",
        "evaluate_asset_physical_health",
        "parse_equipment_schedule_docling",
        "run_aerial_facility_sentinel",
        "predict_machinery_capex_reserve",
        "audit_maintenance_ledger_cleanlab",
        "generate_gotham_knowledge_graph",
        "resolve_entity_splink",
        "query_contour_micro_olap",
        "fuse_gaia_spatial_twin",
        "validate_aip_guardrails",
        "find_semantic_lookalikes",
        "evaluate_debt_maturity_wall",
        "audit_title_curative_redemption",
        "scan_permits_and_zoning_envelope",
        "evaluate_reactive_dag",
        "calculate_pe_waterfall",
        "audit_portfolio_concentration",
        "audit_1031_exchange_and_cost_seg",
        "simulate_macro_regimes",
    }
    assert len(tools) == 30
    assert tool_names == expected


def test_mcp_tools_call_asset_health():
    # 1. Test evaluate_asset_physical_health MCP tool call
    health_call = {
        "jsonrpc": "2.0",
        "id": "call-health",
        "method": "tools/call",
        "params": {
            "name": "evaluate_asset_physical_health",
            "arguments": {
                "asset_id": "ASSET-PA-ACC-01",
                "naics_code": "332710",
                "parcel_id": "4011902",
                "annual_ebitda_usd": "500000.00",
                "annual_debt_service_usd": "280000.00",
            },
        },
    }
    res = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=health_call,
    )
    assert res.status_code == 200
    res_data = res.json()["result"]
    assert res_data["isError"] is False
    content = json.loads(res_data["content"][0]["text"])
    assert "physical_health" in content
    health = content["physical_health"]
    assert "overall_health_score" in health
    assert "physical_risk_grade" in health
    assert "predictive_capex" in health
    assert "aerial_report" in health

    # 2. Test audit_maintenance_ledger_cleanlab MCP tool call
    cleanlab_call = {
        "jsonrpc": "2.0",
        "id": "call-cleanlab",
        "method": "tools/call",
        "params": {
            "name": "audit_maintenance_ledger_cleanlab",
            "arguments": {
                "invoices": [
                    {
                        "invoice_id": "INV-TEST-01",
                        "vendor": "Country Club Golf Cart Repairs",
                        "amount_usd": "4200.00",
                        "description": "Annual service on personal golf cart",
                        "equipment_id": "CNC-001",
                    }
                ]
            },
        },
    }
    res_cleanlab = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=cleanlab_call,
    )
    assert res_cleanlab.status_code == 200
    cleanlab_content = json.loads(res_cleanlab.json()["result"]["content"][0]["text"])
    assert "maintenance_audit" in cleanlab_content
    audit = cleanlab_content["maintenance_audit"]
    assert audit["total_invoices_audited"] == 1
    assert audit["suspicious_invoices_count"] == 1
    assert Decimal(audit["disallowed_unproven_maintenance_usd"]) == Decimal("4200.00")


def test_mcp_tools_call_sba_and_audit():
    # 1. Underwrite SBA SOP 50 10 8.1 tool call
    sba_call = {
        "jsonrpc": "2.0",
        "id": "call-sba",
        "method": "tools/call",
        "params": {
            "name": "underwrite_sba_sop_50_10_8_1",
            "arguments": {
                "purchase_price_usd": "2400000.00",
                "buyer_cash_injection_usd": "240000.00",
                "seller_note_full_standby_usd": "240000.00",
                "historical_ebitda_usd": "650000.00",
                "loan_interest_rate_pct": "0.1125",
                "seller_standby_months": 36,
            },
        },
    }
    res = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=sba_call,
    )
    assert res.status_code == 200
    res_data = res.json()["result"]
    assert res_data["isError"] is False
    content_text = json.loads(res_data["content"][0]["text"])
    assert content_text["is_sba_compliant"] is True
    assert content_text["statutory_floor_met_1_25x"] is True
    assert content_text["standby_lock_compliant_36m"] is True

    # 2. Addback & QoE audit tool call
    audit_call = {
        "jsonrpc": "2.0",
        "id": "call-qoe",
        "method": "tools/call",
        "params": {
            "name": "audit_addbacks_and_qoe",
            "arguments": {
                "reported_net_income_usd": "350000.00",
                "interest_expense_usd": "45000.00",
                "tax_expense_usd": "25000.00",
                "depreciation_amortization_usd": "60000.00",
                "owner_compensation_usd": "120000.00",
                "owner_hours_per_week": 45,
                "proposed_addbacks": [
                    {"category": "Non-recurring legal fees", "amount_usd": "25000.00", "has_proof": True},
                    {"category": "Guru unproven synergy", "amount_usd": "50000.00", "has_proof": False, "is_guru_synergy": True},
                ],
            },
        },
    }
    res_audit = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=audit_call,
    )
    assert res_audit.status_code == 200
    audit_content = json.loads(res_audit.json()["result"]["content"][0]["text"])
    assert audit_content["verified_addbacks_usd"] == "25000.00"
    assert audit_content["disallowed_unproven_addbacks_usd"] == "50000.00"
    assert audit_content["replacement_gm_deduction_usd"] == "85000.00"


def test_mcp_tools_call_sec_edgar_and_yente():
    # 1. SEC EDGAR multiple expansion arbitrage
    edgar_call = {
        "jsonrpc": "2.0",
        "id": "call-edgar",
        "method": "tools/call",
        "params": {
            "name": "evaluate_sec_edgar_arbitrage",
            "arguments": {
                "purchase_ev_usd": "2400000",
                "normalized_ebitda_usd": "650000",
                "naics_code": "541211",
            },
        },
    }
    res = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=edgar_call,
    )
    assert res.status_code == 200
    edgar_out = json.loads(res.json()["result"]["content"][0]["text"])["arbitrage"]
    assert edgar_out["is_arbitrage_accretive"] is True
    assert Decimal(edgar_out["multiple_expansion_spread"]) > 0

    # 2. OpenSanctions / Yente AML/KYC screening
    yente_call = {
        "jsonrpc": "2.0",
        "id": "call-yente",
        "method": "tools/call",
        "params": {
            "name": "screen_yente_aml_kyc",
            "arguments": {
                "entity_name": "Apex Precision Machining LLC",
                "jurisdiction": "US-VA",
                "screener_role": "COUNSEL",
            },
        },
    }
    res_yente = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json=yente_call,
    )
    assert res_yente.status_code == 200
    cert = json.loads(res_yente.json()["result"]["content"][0]["text"])["certificate"]
    assert cert["is_fully_cleared"] is True
    assert len(cert["sha256_fingerprint"]) == 64


# =========================================================================
# 4. MCP RESOURCES & PROMPTS RETRIEVAL
# =========================================================================

def test_mcp_resources_and_prompts():
    # 1. Resources List
    res_list = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json={"jsonrpc": "2.0", "id": "res-list", "method": "resources/list"},
    )
    assert res_list.status_code == 200
    resources = res_list.json()["result"]["resources"]
    assert len(resources) >= 4
    uris = {r["uri"] for r in resources}
    assert "asup://deals/active-mandate" in uris
    assert "asup://analytics/sofr-yield-curve" in uris

    # 2. Resource Read
    res_read = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json={"jsonrpc": "2.0", "id": "res-read", "method": "resources/read", "params": {"uri": "asup://deals/active-mandate"}},
    )
    assert res_read.status_code == 200
    mandate_data = json.loads(res_read.json()["result"]["contents"][0]["text"])
    assert mandate_data["mandate_id"] == "ROA-SMB-01"

    # 3. Prompts List
    p_list = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json={"jsonrpc": "2.0", "id": "prompts-list", "method": "prompts/list"},
    )
    assert p_list.status_code == 200
    prompts = p_list.json()["result"]["prompts"]
    assert len(prompts) == 3

    # 4. Prompt Get
    p_get = client.post(
        "/mcp/messages",
        headers={"Authorization": f"Bearer {MASTER_TEST_KEY}"},
        json={
            "jsonrpc": "2.0",
            "id": "prompt-get",
            "method": "prompts/get",
            "params": {"name": "underwrite-deal-for-principal", "arguments": {"asset_id": "ASSET-PA-ACC-01"}},
        },
    )
    assert p_get.status_code == 200
    p_data = p_get.json()["result"]
    assert len(p_data["messages"]) >= 1
    assert "ASSET-PA-ACC-01" in p_data["messages"][0]["content"]["text"]


# =========================================================================
# 5. CLAUDE DESKTOP CONFIG & SSE STREAMING
# =========================================================================

def test_claude_desktop_config_and_sse():
    # Test config endpoint
    config_res = client.get("/v1/developer/mcp/config")
    assert config_res.status_code == 200
    cfg = config_res.json()["config"]
    assert "mcpServers" in cfg
    assert "asup-platform" in cfg["mcpServers"]
    assert "command" in cfg["mcpServers"]["asup-platform"]
    assert "--stdio" in cfg["mcpServers"]["asup-platform"]["args"]

    # Test SSE handshake with query token
    sse_res = client.get(f"/mcp/sse?token={MASTER_TEST_KEY}&max_pings=0")
    assert sse_res.status_code == 200
    assert "text/event-stream" in sse_res.headers["content-type"]
    assert "event: endpoint" in sse_res.text

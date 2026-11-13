"""
Integration Tests for Argus Persistent User Settings & PWA Auto-Update Endpoints.
Verifies cross-device ACID persistence in DurablePipelineStore and MCP tool execution.
"""

import uuid
from fastapi.testclient import TestClient
from services.api.main import app, pipeline_store
from services.mcp.tools import execute_mcp_tool

client = TestClient(app)


def test_pwa_version_endpoint():
    res = client.get("/v1/pwa/version")
    assert res.status_code == 200
    data = res.json()
    assert data["app_name"] == "Argus Intelligence"
    assert data["version"] == "1.1.0"
    assert "asup-argus-v" in data["cache_name"]
    assert len(data["features"]) >= 3


def test_user_settings_get_and_post_persistence():
    user_id = f"usr_test_{uuid.uuid4().hex[:8]}"

    # 1. Initial GET on new user generates default settings
    res_get1 = client.get(f"/v1/user/settings?user_id={user_id}")
    assert res_get1.status_code == 200
    s1 = res_get1.json()
    assert s1["user_id"] == user_id
    assert s1["theme"] == "DARK"
    assert s1["auto_update_enabled"] is True

    # 2. Update settings via POST
    updated_payload = {
        **s1,
        "display_name": "Executive Managing Director",
        "theme": "MIDNIGHT_OLED",
        "density": "COMPACT",
        "high_contrast": True,
        "auto_update_prompt_mode": "SILENT_AUTO_RELOAD",
        "default_target_cap_rate_pct": "0.0825",
    }
    res_post = client.post("/v1/user/settings", json=updated_payload)
    assert res_post.status_code == 200
    s2 = res_post.json()
    assert s2["display_name"] == "Executive Managing Director"
    assert s2["theme"] == "MIDNIGHT_OLED"
    assert s2["density"] == "COMPACT"
    assert s2["auto_update_prompt_mode"] == "SILENT_AUTO_RELOAD"
    assert s2["default_target_cap_rate_pct"] == "0.0825"

    # 3. Subsequent GET must retrieve the updated persistent settings
    res_get2 = client.get(f"/v1/user/settings?user_id={user_id}")
    assert res_get2.status_code == 200
    s3 = res_get2.json()
    assert s3["display_name"] == "Executive Managing Director"
    assert s3["theme"] == "MIDNIGHT_OLED"
    assert s3["density"] == "COMPACT"


def test_user_settings_mcp_tools():
    user_id = f"usr_mcp_{uuid.uuid4().hex[:8]}"

    # 1. MCP get_user_settings tool
    res_get = execute_mcp_tool("get_user_settings", {"user_id": user_id})
    assert "user_settings" in res_get
    assert res_get["user_settings"]["user_id"] == user_id

    # 2. MCP update_user_settings tool
    res_up = execute_mcp_tool(
        "update_user_settings",
        {
            "user_id": user_id,
            "display_name": "Chief Risk Officer",
            "theme": "BLOOMBERG_NAVY",
            "density": "COMPACT",
        },
    )
    assert "user_settings" in res_up
    assert res_up["status"] == "SAVED_PERSISTENT"
    assert res_up["user_settings"]["display_name"] == "Chief Risk Officer"
    assert res_up["user_settings"]["theme"] == "BLOOMBERG_NAVY"

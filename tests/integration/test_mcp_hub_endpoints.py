"""
Integration tests for MCP Connect Hub endpoints in FastAPI (services/api/main.py).
Tests /v1/mcp/hub, /v1/mcp/prompt, /v1/mcp/install.ps1, /v1/mcp/install.sh,
/v1/mcp/download/{client_type}, and Tool #42 (get_mcp_connect_config).
"""

from fastapi.testclient import TestClient
import json

from services.api.main import app
from services.mcp.tools import execute_mcp_tool

client = TestClient(app)


def test_get_mcp_hub_endpoint():
    resp = client.get("/v1/mcp/hub")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "configs" in data
    assert "claude_desktop" in data["configs"]
    assert "cursor" in data["configs"]
    assert "cline" in data["configs"]
    assert "universal_prompt" in data
    assert data["tool_count"] >= 41


def test_get_mcp_prompt_endpoint_text_and_json():
    resp_text = client.get("/v1/mcp/prompt")
    assert resp_text.status_code == 200
    assert "ARGUS PANOPTES (v1.0)" in resp_text.text

    resp_json = client.get("/v1/mcp/prompt?format=json")
    assert resp_json.status_code == 200
    data = resp_json.json()
    assert data["status"] == "success"
    assert "prompt" in data


def test_mcp_install_scripts_endpoints():
    resp_ps1 = client.get("/v1/mcp/install.ps1")
    assert resp_ps1.status_code == 200
    assert "claude_desktop_config.json" in resp_ps1.text
    assert "attachment; filename=install_argus_mcp.ps1" in resp_ps1.headers["content-disposition"]

    resp_sh = client.get("/v1/mcp/install.sh")
    assert resp_sh.status_code == 200
    assert "claude_desktop_config.json" in resp_sh.text
    assert "attachment; filename=install_argus_mcp.sh" in resp_sh.headers["content-disposition"]


def test_mcp_download_configs_endpoints():
    for ctype, expected_file in [
        ("claude-desktop", "claude_desktop_config.json"),
        ("cursor", "mcp.json"),
        ("cline", "cline_mcp_settings.json"),
        ("windsurf", "mcp_config.json"),
        ("openapi", "argus_openapi.json"),
    ]:
        resp = client.get(f"/v1/mcp/download/{ctype}")
        assert resp.status_code == 200
        assert expected_file in resp.headers["content-disposition"]
        payload = json.loads(resp.text)
        assert isinstance(payload, dict)

    # Bad client type
    bad_resp = client.get("/v1/mcp/download/invalid-type")
    assert bad_resp.status_code == 400


def test_mcp_tool_42_get_mcp_connect_config():
    res = execute_mcp_tool("get_mcp_connect_config", {"client": "all"})
    assert "status" in res and res["status"] == "success"
    assert "configs" in res

    res_prompt = execute_mcp_tool("get_mcp_connect_config", {"client": "prompt"})
    assert "prompt" in res_prompt
    assert "ARGUS PANOPTES" in res_prompt["prompt"]

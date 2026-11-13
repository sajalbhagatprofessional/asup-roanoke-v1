"""
Unit tests for the MCP Connect Hub engine (services/mcp/connect_hub.py).
Verifies 1-click configs, prompts, and shell script generators.
"""

import json
from services.mcp.connect_hub import (
    get_claude_desktop_json,
    get_cursor_mcp_json,
    get_cline_mcp_json,
    get_windsurf_mcp_json,
    get_universal_agent_prompt,
    generate_powershell_installer_script,
    generate_bash_installer_script,
    generate_custom_gpt_openapi_schema,
    get_mcp_hub_manifest,
)


def test_claude_desktop_config_remote_and_stdio():
    remote_cfg = get_claude_desktop_json(base_url="http://test.api", token="test_token_123", mode="remote")
    assert "mcpServers" in remote_cfg
    assert "argus" in remote_cfg["mcpServers"]
    server = remote_cfg["mcpServers"]["argus"]
    assert "sse" in server["url"]
    assert "test_token_123" in server["url"]

    stdio_cfg = get_claude_desktop_json(mode="stdio", python_path="/usr/bin/python3")
    stdio_server = stdio_cfg["mcpServers"]["argus"]
    assert stdio_server["command"] == "/usr/bin/python3"
    assert "--stdio" in stdio_server["args"]


def test_cursor_and_cline_and_windsurf_configs():
    cursor_cfg = get_cursor_mcp_json(base_url="http://test.api", token="tok_abc")
    assert "argus" in cursor_cfg["mcpServers"]
    assert "http://test.api/mcp/sse?token=tok_abc" == cursor_cfg["mcpServers"]["argus"]["url"]

    cline_cfg = get_cline_mcp_json(base_url="http://test.api", token="tok_abc")
    assert cline_cfg["mcpServers"]["argus"]["disabled"] is False
    assert len(cline_cfg["mcpServers"]["argus"]["autoApprove"]) >= 5

    windsurf_cfg = get_windsurf_mcp_json(base_url="http://test.api", token="tok_abc")
    assert "serverUrl" in windsurf_cfg["mcpServers"]["argus"]


def test_universal_agent_prompt_content():
    prompt = get_universal_agent_prompt(base_url="http://api.argus.live", token="tok_xyz")
    assert "ARGUS PANOPTES (v1.0)" in prompt
    assert "http://api.argus.live/mcp/messages?token=tok_xyz" in prompt
    assert "SBA SOP 50 10 8.1" in prompt
    assert "Va. Code § 55.1-321" in prompt
    assert "ROA-SMB-01" in prompt
    assert "$85,000/yr" in prompt


def test_shell_installers_safe_merge():
    ps1 = generate_powershell_installer_script(base_url="http://api.argus.live", token="tok_xyz")
    assert "$configFile" in ps1
    assert "mcpServers" in ps1
    assert "http://api.argus.live/mcp/sse?token=tok_xyz" in ps1

    bash = generate_bash_installer_script(base_url="http://api.argus.live", token="tok_xyz")
    assert "CONFIG_FILE" in bash
    assert "mcpServers" in bash
    assert "http://api.argus.live/mcp/sse?token=tok_xyz" in bash


def test_custom_gpt_openapi_schema():
    schema = generate_custom_gpt_openapi_schema(base_url="http://api.argus.live")
    assert schema["openapi"] == "3.1.0"
    assert "/v1/deals" in schema["paths"]
    assert "/v1/research/links" in schema["paths"]
    assert "/v1/assets/{asset_id}/dossier" in schema["paths"]


def test_mcp_hub_manifest():
    manifest = get_mcp_hub_manifest(base_url="http://api.argus.live", token="tok_xyz")
    assert manifest["status"] == "success"
    assert manifest["tool_count"] >= 41
    assert "configs" in manifest
    assert "universal_prompt" in manifest
    assert len(manifest["quick_test_prompts"]) >= 5

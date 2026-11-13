"""
Argus (v1.0) — Model Context Protocol (MCP) Frictionless Connect Hub Engine.
Generates 1-click configurations, copy-paste AI agent prompts, automated shell installers,
and OpenAPI action schemas for Claude Desktop, Cursor, VS Code (Cline/Roo), Windsurf, and Web LLMs.
"""

import json
from typing import Any, Dict, List, Optional

DEFAULT_VPS_API_URL = "http://api.argus.150.136.103.204.sslip.io"
DEFAULT_MCP_TOKEN = "asup_live_anthropic_mcp_master_key_2026"


def get_claude_desktop_json(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
    mode: str = "remote",
    python_path: str = "python",
) -> Dict[str, Any]:
    """
    Returns ready-to-use configuration for Claude Desktop (claude_desktop_config.json).
    Supports:
    - 'remote': Zero-install HTTP/SSE via mcp-remote or direct SSE.
    - 'stdio': Local python process execution.
    """
    if mode == "stdio":
        server_entry = {
            "command": python_path,
            "args": ["-m", "services.mcp.server", "--stdio"],
            "env": {
                "PYTHONPATH": ".",
                "ARGUS_ENV": "production",
            },
        }
    else:
        # Remote cloud SSE ingress (requires no local Python setup)
        sse_url = f"{base_url.rstrip('/')}/mcp/sse?token={token}"
        server_entry = {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-everything", sse_url],
            "url": sse_url,
            "headers": {
                "Authorization": f"Bearer {token}",
            },
        }

    return {
        "mcpServers": {
            "argus": server_entry,
        }
    }


def get_cursor_mcp_json(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> Dict[str, Any]:
    """
    Returns Cursor IDE MCP configuration (.cursor/mcp.json).
    """
    sse_url = f"{base_url.rstrip('/')}/mcp/sse?token={token}"
    return {
        "mcpServers": {
            "argus": {
                "url": sse_url,
                "headers": {
                    "Authorization": f"Bearer {token}",
                },
            }
        }
    }


def get_cline_mcp_json(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> Dict[str, Any]:
    """
    Returns VS Code Cline / Roo Code configuration (cline_mcp_settings.json).
    """
    sse_url = f"{base_url.rstrip('/')}/mcp/sse?token={token}"
    return {
        "mcpServers": {
            "argus": {
                "url": sse_url,
                "disabled": False,
                "autoApprove": [
                    "get_asset_research_links",
                    "evaluate_sba_sop_50_10_8_1",
                    "get_asset_dossier",
                    "search_universal_assets",
                    "query_roanoke_gis_parcel",
                ],
            }
        }
    }


def get_windsurf_mcp_json(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> Dict[str, Any]:
    """
    Returns Windsurf IDE MCP configuration.
    """
    sse_url = f"{base_url.rstrip('/')}/mcp/sse?token={token}"
    return {
        "mcpServers": {
            "argus": {
                "serverUrl": sse_url,
            }
        }
    }


def get_universal_agent_prompt(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> str:
    """
    Generates a zero-setup, self-contained Universal System Prompt for ChatGPT,
    Claude.ai Projects, Gemini Advanced, Perplexity, DeepSeek, or any web LLM.
    """
    clean_url = base_url.rstrip("/")
    return f"""# SYSTEM INSTRUCTION: ARGUS PANOPTES (v1.0) SOVEREIGN ASSET INTELLIGENCE AGENT

You are connected to **Argus (v1.0)** — the institutional off-market acquisition sourcing, statutory underwriting, and physical asset intelligence engine for a U.S. Family Office Principal.

## 1. LIVE PRODUCTION API ACCESS
You have direct read/write access to the live production platform via HTTP endpoints:
- Base URL: `{clean_url}`
- MCP Messages Endpoint: `{clean_url}/mcp/messages?token={token}`
- Active Mandate: `ROA-SMB-01` (City of Roanoke FIPS 51770, Roanoke County FIPS 51161, City of Salem FIPS 51775 Near-Miss)
- Authentication Token: `{token}` (Pass via `Authorization: Bearer {token}` or `?token={token}`)

## 2. CORE REST ENDPOINTS (READY FOR DIRECT QUERY)
1. **List Verified Deals**:
   `GET {clean_url}/v1/deals`
   Query parameters: `stage`, `min_dscr`, `max_price`, `fips_code`, `naics_code`, `q`
2. **System & Mandate Health**:
   `GET {clean_url}/v1/health`
3. **1-Click Deep Asset Research Links**:
   `GET {clean_url}/v1/research/links?address=<address>&city=<city>&state=<state>&zip_code=<zip>&entity_name=<name>`
   Returns instant clickable links to Google Maps, Satellite Aerial, Street View, Apple Maps, Virginia SCC CIS, CourtListener, Census NAICS, and EPA UST Finder.
4. **Universal Asset Search & Dossiers**:
   `GET {clean_url}/v1/assets`
   `GET {clean_url}/v1/assets/{{asset_id}}/dossier`
5. **Interactive Underwriting Calculation**:
   `POST {clean_url}/v1/underwriting/sba-sop-50-10-8-1`
   `POST {clean_url}/v1/underwriting/va-foreclosure`

## 3. AIR-GAPPED UNDERWRITING STATUTES & RULES OF ENGAGEMENT
Whenever analyzing or underwrite an asset, you MUST enforce:
- **Pure Decimal Arithmetic**: Zero floating-point math. Rounding uses round-half-even.
- **SBA SOP 50 10 8.1 (Effective October 1, 2026)**:
  - Base DSCR must be >= 1.25x.
  - Required Equity Injection >= 10.0%.
  - Limited Equity Sources (seller standby note + non-controlling equity) capped at <= 50.0% of injection.
  - Seller Standby Note requires >= 36-month full standby lock.
  - Seller consulting transition capped at <= 24 months.
  - Independent Quality of Earnings (QoE) mandatory when loan >= $3,000,000 net of owner-occupied CRE.
- **Virginia Non-Judicial Foreclosure (Va. Code §§ 55.1-320 to 55.1-322)**:
  - Minimum 14 days formal notice prior to Substitute Trustee sale (Va. Code § 55.1-321).
  - Maximum cure/acquisition basis <= 70% of verified replacement value.
- **Principal's Replacement General Manager Deduction**:
  - Always deduct a mandatory $85,000/yr replacement GM salary if the owner works > 20 hours/week.
  - Disallow all unproven lifestyle, guru, or speculative add-backs.
- **Fiduciary Outreach**: Single-recipient only (`max_recipients == 1`), zero mass blasts, requires dual human approval (`PrincipalApprovalToken` + `CounselComplianceSignoff`), and checks Virginia Do-Not-Call (Va. Code § 59.1-514).

## 4. MCP JSON-RPC 2.0 PROTOCOL INVOCATION
To invoke any of the 41 native tools, send a `POST` request to `{clean_url}/mcp/messages?token={token}`:
```json
{{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {{
    "name": "get_asset_research_links",
    "arguments": {{
      "full_address": "1552 Commerce Parkway, Roanoke, VA 24552",
      "entity_name": "Star City Precision Machining LLC"
    }}
  }}
}}
```

## 5. EXAMPLE INSTRUCTIONS TO EXECUTE
- "Analyze deal ROA-GD-01: pull the dossier, check SBA SOP 50 10 8.1 DSCR compliance, evaluate downside liquidation floor, and draft an executive CIO decision."
- "Find all trustee foreclosure sales in Roanoke County with asking price under $3M and CRE backing."
- "Generate 1-click research and aerial satellite links for 1569 Logistics Court, Roanoke, VA."
"""


def generate_powershell_installer_script(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> str:
    """
    Generates a safe, non-destructive PowerShell script for Windows that
    detects Claude Desktop configuration, preserves existing servers, and
    injects or updates Argus MCP.
    """
    sse_url = f"{base_url.rstrip('/')}/mcp/sse?token={token}"
    return f"""# Argus (v1.0) — Claude Desktop Automated MCP Installer (Windows)
# Safe, non-destructive JSON merge script. Preserves all existing MCP servers.
$ErrorActionPreference = 'Stop'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Argus (v1.0) - Claude Desktop MCP Auto-Installer" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$claudeDir = [System.IO.Path]::Combine($env:APPDATA, 'Claude')
$configFile = [System.IO.Path]::Combine($claudeDir, 'claude_desktop_config.json')

if (-not (Test-Path $claudeDir)) {{
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    Write-Host "[+] Created Claude Desktop directory: $claudeDir" -ForegroundColor Green
}}

$config = @{{ "mcpServers" = @{{}} }}
if (Test-Path $configFile) {{
    try {{
        $raw = Get-Content -Path $configFile -Raw -Encoding UTF8
        $existing = $raw | ConvertFrom-Json -AsHashtable
        if ($existing -and $existing.ContainsKey('mcpServers')) {{
            $config = $existing
            Write-Host "[i] Found existing Claude Desktop config with $(@($config.mcpServers.Keys).Count) server(s)." -ForegroundColor Yellow
        }}
    }} catch {{
        Write-Host "[!] Notice: Existing config was unparseable. Backing up to claude_desktop_config.json.bak" -ForegroundColor DarkYellow
        Copy-Item -Path $configFile -Destination "$configFile.bak" -Force
    }}
}}

# Inject Argus MCP Server definition
$config.mcpServers['argus'] = @{{
    'command' = 'npx'
    'args'    = @('-y', '@modelcontextprotocol/server-everything', '{sse_url}')
    'url'     = '{sse_url}'
    'headers' = @{{
        'Authorization' = 'Bearer {token}'
    }}
}}

# Write formatted UTF-8 JSON
$jsonOutput = $config | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($configFile, $jsonOutput, [System.Text.Encoding]::UTF8)

Write-Host "[SUCCESS] Argus MCP Server successfully registered for Claude Desktop!" -ForegroundColor Green
Write-Host "Config Path: $configFile" -ForegroundColor Gray
Write-Host "SSE Endpoint: {sse_url}" -ForegroundColor Gray
Write-Host "`nPlease restart Claude Desktop to activate the 41 Argus Sovereign Tools.`n" -ForegroundColor Cyan
"""


def generate_bash_installer_script(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> str:
    """
    Generates a safe, non-destructive Bash script for macOS / Linux that
    detects Claude Desktop configuration, preserves existing servers, and
    injects Argus MCP.
    """
    sse_url = f"{base_url.rstrip('/')}/mcp/sse?token={token}"
    return f"""#!/usr/bin/env bash
# Argus (v1.0) — Claude Desktop Automated MCP Installer (macOS / Linux)
# Safe, non-destructive JSON merge script. Preserves all existing MCP servers.
set -euo pipefail

echo -e "\\033[0;36m==========================================================\\033[0m"
echo -e "\\033[0;36m  Argus (v1.0) - Claude Desktop MCP Auto-Installer\\033[0m"
echo -e "\\033[0;36m==========================================================\\033[0m"

# macOS default path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
else
    CONFIG_DIR="$HOME/.config/Claude"
fi
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

mkdir -p "$CONFIG_DIR"

if command -v python3 >/dev/null 2>&1; then
    python3 - "$CONFIG_FILE" << 'PYEOF'
import json, os, sys

config_file = os.path.expanduser(sys.argv[1])
config = {{"mcpServers": {{}}}}

if os.path.exists(config_file):
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
            if 'mcpServers' not in config:
                config['mcpServers'] = {{}}
    except Exception:
        pass

config['mcpServers']['argus'] = {{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-everything", "{sse_url}"],
    "url": "{sse_url}",
    "headers": {{
        "Authorization": "Bearer {token}"
    }}
}}

with open(config_file, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2)

print("\\033[0;32m[SUCCESS] Argus MCP Server successfully registered for Claude Desktop!\\033[0m")
print(f"Config Path: {{config_file}}")
print(f"SSE Endpoint: {sse_url}")
PYEOF
else
    cat << EOF > "$CONFIG_FILE"
{{
  "mcpServers": {{
    "argus": {{
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything", "{sse_url}"],
      "url": "{sse_url}",
      "headers": {{
        "Authorization": "Bearer {token}"
      }}
    }}
  }}
}}
EOF
    echo -e "\\033[0;32m[SUCCESS] Created new Claude Desktop configuration with Argus MCP.\\033[0m"
fi

echo -e "\\033[0;36mPlease restart Claude Desktop to activate the 41 Argus Sovereign Tools.\\033[0m"
"""


def generate_custom_gpt_openapi_schema(
    base_url: str = DEFAULT_VPS_API_URL,
) -> Dict[str, Any]:
    """
    Returns an optimized OpenAPI 3.1 action specification ready to be pasted
    directly into ChatGPT Custom GPT Actions, Microsoft Copilot Studio, or LangChain.
    """
    clean_url = base_url.rstrip("/")
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Argus Sovereign Asset Intelligence & Underwriting API",
            "description": "Institutional asset intelligence, SBA SOP 50 10 8.1 underwriting, and 1-click GIS/court docket research.",
            "version": "1.0.0",
        },
        "servers": [
            {
                "url": clean_url,
                "description": "Argus Production VPS Server",
            }
        ],
        "paths": {
            "/v1/health": {
                "get": {
                    "summary": "Check Platform & Mandate Health",
                    "operationId": "getHealth",
                    "responses": {
                        "200": {"description": "Platform status and days remaining in mandate cycle"}
                    },
                }
            },
            "/v1/deals": {
                "get": {
                    "summary": "List Verified Acquisition Opportunities",
                    "operationId": "listDeals",
                    "parameters": [
                        {"name": "stage", "in": "query", "schema": {"type": "string"}},
                        {"name": "min_dscr", "in": "query", "schema": {"type": "number"}},
                        {"name": "max_price", "in": "query", "schema": {"type": "number"}},
                        {"name": "fips_code", "in": "query", "schema": {"type": "string"}},
                        {"name": "q", "in": "query", "schema": {"type": "string"}},
                    ],
                    "responses": {
                        "200": {"description": "List of provenanced, compliance-verified deals"}
                    },
                }
            },
            "/v1/research/links": {
                "get": {
                    "summary": "Generate 1-Click Asset Deep-Dive & Mapping Links",
                    "operationId": "getResearchLinks",
                    "parameters": [
                        {"name": "address", "in": "query", "required": True, "schema": {"type": "string"}},
                        {"name": "city", "in": "query", "schema": {"type": "string"}},
                        {"name": "state", "in": "query", "schema": {"type": "string"}},
                        {"name": "zip_code", "in": "query", "schema": {"type": "string"}},
                        {"name": "entity_name", "in": "query", "schema": {"type": "string"}},
                    ],
                    "responses": {
                        "200": {"description": "Categorized research links (Google Maps, Aerial, Street View, SCC, CourtListener)"}
                    },
                }
            },
            "/v1/assets": {
                "get": {
                    "summary": "Search Universal Asset Pipeline",
                    "operationId": "searchAssets",
                    "parameters": [
                        {"name": "q", "in": "query", "schema": {"type": "string"}},
                        {"name": "stage", "in": "query", "schema": {"type": "string"}},
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 50}},
                    ],
                    "responses": {
                        "200": {"description": "List of multi-vertical asset records"}
                    },
                }
            },
            "/v1/assets/{asset_id}/dossier": {
                "get": {
                    "summary": "Get Comprehensive Asset Dossier",
                    "operationId": "getAssetDossier",
                    "parameters": [
                        {"name": "asset_id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {"description": "Complete institutional dossier with valuation, FLV floor, and diligence checks"}
                    },
                }
            },
        },
    }


def get_mcp_hub_manifest(
    base_url: str = DEFAULT_VPS_API_URL,
    token: str = DEFAULT_MCP_TOKEN,
) -> Dict[str, Any]:
    """
    Assembles the complete master manifest for the MCP Connect Hub.
    """
    from services.mcp.tools import MCP_TOOLS_CATALOG

    tool_categories = {}
    for t in MCP_TOOLS_CATALOG:
        cat = "Underwriting & Analytics"
        if "gis" in t.name or "parcel" in t.name or "spatial" in t.name:
            cat = "Geospatial & Digital Twins"
        elif "docket" in t.name or "court" in t.name or "foreclosure" in t.name or "yente" in t.name:
            cat = "Legal, Dockets & Sanctions"
        elif "asset" in t.name or "research" in t.name or "flip" in t.name or "tear_sheet" in t.name:
            cat = "Sourcing & Capital Velocity"
        elif "war_room" in t.name or "negotiation" in t.name or "closing" in t.name:
            cat = "Palantir Operations & Closing"
        tool_categories.setdefault(cat, []).append({
            "name": t.name,
            "description": t.description,
        })

    return {
        "status": "success",
        "platform": "Argus (v1.0)",
        "base_url": base_url,
        "token": token,
        "sse_endpoint": f"{base_url.rstrip('/')}/mcp/sse?token={token}",
        "messages_endpoint": f"{base_url.rstrip('/')}/mcp/messages?token={token}",
        "tool_count": len(MCP_TOOLS_CATALOG),
        "tool_categories": tool_categories,
        "configs": {
            "claude_desktop": get_claude_desktop_json(base_url, token, mode="remote"),
            "claude_desktop_local": get_claude_desktop_json(base_url, token, mode="stdio"),
            "cursor": get_cursor_mcp_json(base_url, token),
            "cline": get_cline_mcp_json(base_url, token),
            "windsurf": get_windsurf_mcp_json(base_url, token),
        },
        "install_commands": {
            "powershell": f"irm {base_url.rstrip('/')}/v1/mcp/install.ps1 | iex",
            "bash": f"curl -fsSL {base_url.rstrip('/')}/v1/mcp/install.sh | bash",
        },
        "quick_test_prompts": [
            "What are the top 3 verified acquisition opportunities in the Roanoke Valley with Base DSCR >= 1.35x?",
            "Run a full underwriting review on deal ROA-GD-01 under SBA SOP 50 10 8.1 and Virginia foreclosure statutes.",
            "Generate 1-click aerial satellite, GIS, and SCC corporate research links for 1552 Commerce Parkway, Roanoke.",
            "Screen Appalachian Heavy Equipment Repair LLC against OFAC SDN and BIS sanctions.",
            "Simulate a severe stagflation crisis (+200 bps SOFR rate shock, -15% EBITDA) on the industrial portfolio.",
        ],
        "universal_prompt": get_universal_agent_prompt(base_url, token),
    }

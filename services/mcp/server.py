"""
Anthropic Model Context Protocol (MCP) Server Implementation (2024-11-05 Specification).
Provides dual-transport capabilities:
1. stdio Transport: Standard input/output for local AI agents (Claude Desktop, Claude Code, Goose).
2. HTTP / SSE Transport: Dispatches JSON-RPC 2.0 payloads for remote AI agents (Hermes, OpenClaw, AutoGen, CrewAI).
"""

import argparse
import json
import logging
import sys
from typing import Any, Dict, Optional, Union

from .protocol import JsonRpcResponse, McpErrorCode
from .prompts import MCP_PROMPTS_CATALOG, get_mcp_prompt_messages
from .resources import MCP_RESOURCES_CATALOG, read_mcp_resource
from .tools import MCP_TOOLS_CATALOG, execute_mcp_tool

# Setup stderr logger so stdio stdout is reserved purely for JSON-RPC 2.0 wire messages
logger = logging.getLogger("asup.mcp.server")
handler = logging.StreamHandler(sys.stderr)
handler.setFormatter(logging.Formatter("[MCP Server] %(levelname)s: %(message)s"))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

PROTOCOL_VERSION = "2024-11-05"
SERVER_NAME = "asup-mcp-server"
SERVER_VERSION = "1.0.0"


def dispatch_jsonrpc(request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Central JSON-RPC 2.0 dispatcher for all MCP methods.
    Supports initialize, ping, notifications, tools/list, tools/call, resources/list,
    resources/read, prompts/list, and prompts/get.
    """
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params") or {}

    # Handle notifications (requests with no ID)
    is_notification = "id" not in request or req_id is None

    try:
        if method == "initialize":
            result = {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"subscribe": False, "listChanged": False},
                    "prompts": {"listChanged": False},
                },
                "serverInfo": {
                    "name": SERVER_NAME,
                    "version": SERVER_VERSION,
                },
                "instructions": (
                    "Argus Institutional Acquisition & Underwriting Platform MCP Server. "
                    "Provides air-gapped SBA SOP 50 10 8.1 underwriting, add-back forensic auditing, "
                    "SEC EDGAR public comps multiple expansion arbitrage, OpenSanctions/Yente AML/KYC screening, "
                    "OpenBB macro SOFR stress testing, IRS Form 1040/1120-S OCR parsing, God's Eye 3D digital twins, "
                    "Augury-inspired AssetHealth™ (Docling equipment parser, TorchGeo aerial roof scan, "
                    "Darts 3-year predictive capex reserve, Alibi-detect operational drift, Cleanlab maintenance ledger audit), "
                    "and Palantir Foundry & Gotham Operational Ontology (Splink entity resolution, Gotham multi-relational link graph, "
                    "Contour sub-50ms micro-OLAP analytics, Gaia topological parcel fusion, and AIP schema guardrails)."
                ),
            }
            return JsonRpcResponse(id=req_id, result=result).to_dict()

        elif method == "notifications/initialized":
            # Client acknowledging initialization; no response for JSON-RPC notification
            return None

        elif method == "ping":
            return JsonRpcResponse(id=req_id, result={}).to_dict()

        # Tools
        elif method == "tools/list":
            tools_list = [t.to_dict() for t in MCP_TOOLS_CATALOG]
            return JsonRpcResponse(id=req_id, result={"tools": tools_list}).to_dict()

        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments") or {}

            if not tool_name:
                return JsonRpcResponse(
                    id=req_id,
                    error={"code": McpErrorCode.INVALID_PARAMS.value, "message": "Missing 'name' in tools/call parameters."},
                ).to_dict()

            res = execute_mcp_tool(tool_name, tool_args)
            is_error = "error" in res

            # MCP standard format for tool call results
            return JsonRpcResponse(
                id=req_id,
                result={
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(res, indent=2, default=str),
                        }
                    ],
                    "isError": is_error,
                },
            ).to_dict()

        # Resources
        elif method == "resources/list":
            resources_list = [r.to_dict() for r in MCP_RESOURCES_CATALOG]
            return JsonRpcResponse(id=req_id, result={"resources": resources_list}).to_dict()

        elif method == "resources/read":
            uri = params.get("uri")
            if not uri:
                return JsonRpcResponse(
                    id=req_id,
                    error={"code": McpErrorCode.INVALID_PARAMS.value, "message": "Missing 'uri' in resources/read parameters."},
                ).to_dict()

            resource_content = read_mcp_resource(uri)
            is_error = "error" in resource_content

            return JsonRpcResponse(
                id=req_id,
                result={
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(resource_content, indent=2, default=str),
                        }
                    ],
                    "isError": is_error,
                },
            ).to_dict()

        # Prompts
        elif method == "prompts/list":
            prompts_list = [p.to_dict() for p in MCP_PROMPTS_CATALOG]
            return JsonRpcResponse(id=req_id, result={"prompts": prompts_list}).to_dict()

        elif method == "prompts/get":
            prompt_name = params.get("name")
            prompt_args = params.get("arguments") or {}

            if not prompt_name:
                return JsonRpcResponse(
                    id=req_id,
                    error={"code": McpErrorCode.INVALID_PARAMS.value, "message": "Missing 'name' in prompts/get parameters."},
                ).to_dict()

            prompt_res = get_mcp_prompt_messages(prompt_name, prompt_args)
            if "error" in prompt_res:
                return JsonRpcResponse(
                    id=req_id,
                    error={"code": McpErrorCode.INVALID_PARAMS.value, "message": prompt_res["error"]},
                ).to_dict()

            return JsonRpcResponse(
                id=req_id,
                result=prompt_res,
            ).to_dict()

        else:
            return JsonRpcResponse(
                id=req_id,
                error={
                    "code": McpErrorCode.METHOD_NOT_FOUND.value,
                    "message": f"Method '{method}' not recognized by ASUP MCP server.",
                },
            ).to_dict()

    except Exception as e:
        logger.error(f"Error handling MCP method '{method}': {e}", exc_info=True)
        return JsonRpcResponse(
            id=req_id,
            error={
                "code": McpErrorCode.INTERNAL_ERROR.value,
                "message": f"Internal MCP server error: {str(e)}",
            },
        ).to_dict()


def run_stdio_server():
    """
    Runs MCP stdio transport loop. Reads JSON-RPC line-by-line from sys.stdin,
    dispatches, and writes JSON-RPC responses to sys.stdout.
    """
    logger.info(f"Starting {SERVER_NAME} v{SERVER_VERSION} on stdio transport...")
    for line in sys.stdin:
        raw = line.strip()
        if not raw:
            continue
        try:
            req_data = json.loads(raw)
            resp = dispatch_jsonrpc(req_data)
            if resp is not None:
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
        except json.JSONDecodeError as err:
            err_resp = JsonRpcResponse(
                id=None,
                error={"code": McpErrorCode.PARSE_ERROR.value, "message": f"Invalid JSON payload: {str(err)}"},
            ).to_dict()
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = JsonRpcResponse(
                id=None,
                error={"code": McpErrorCode.INTERNAL_ERROR.value, "message": f"Unexpected error: {str(e)}"},
            ).to_dict()
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()


def generate_claude_desktop_config(python_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates standard claude_desktop_config.json configuration block
    for 1-click agent registration in Claude Desktop / Claude Code.
    """
    py_exec = python_path or sys.executable
    server_entry = {
        "command": py_exec,
        "args": [
            "-m",
            "services.mcp.server",
            "--stdio",
        ],
        "env": {
            "PYTHONPATH": ".",
            "ARGUS_ENV": "production",
        },
    }
    return {
        "mcpServers": {
            "argus-platform": server_entry,
            "asup-platform": server_entry,
        }
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Argus Model Context Protocol (MCP) Server")
    parser.add_argument("--stdio", action="store_true", help="Run stdio JSON-RPC transport")
    parser.add_argument("--config", action="store_true", help="Print Claude Desktop JSON configuration")
    args = parser.parse_args()

    if args.config:
        print(json.dumps(generate_claude_desktop_config(), indent=2))
    elif args.stdio or not sys.stdin.isatty():
        run_stdio_server()
    else:
        print("Argus Model Context Protocol (MCP) Server")
        print("Usage:")
        print("  python -m services.mcp.server --stdio    # Run stdio transport for Claude Desktop / AI Agents")
        print("  python -m services.mcp.server --config   # Output claude_desktop_config.json snippet")

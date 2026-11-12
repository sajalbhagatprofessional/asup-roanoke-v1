"""
Model Context Protocol (MCP) Prompt Registry for ASUP.
Pre-packages institutional agentic evaluation workflows for Claude, Hermes, OpenClaw, and Copilot.
"""

from typing import Any, Dict, List, Optional
from .protocol import McpPrompt, McpPromptArgument

MCP_PROMPTS_CATALOG: List[McpPrompt] = [
    McpPrompt(
        name="underwrite-deal-for-principal",
        description="Comprehensive CIO institutional underwriting workflow evaluating a deal against the Principal's 4 priorities.",
        arguments=[
            McpPromptArgument(name="asset_id", description="The ID of the target asset to analyze", required=True),
        ],
    ),
    McpPrompt(
        name="audit-target-finances-cpa",
        description="Forensic CPA Quality of Earnings & Add-Back audit workflow under SBA SOP 50 10 8.1.",
        arguments=[
            McpPromptArgument(name="asset_id", description="Target asset ID", required=True),
        ],
    ),
    McpPrompt(
        name="compliance-clearance-counsel",
        description="Legal title, 14-day statutory notice, and OpenSanctions KYC compliance clearance review.",
        arguments=[
            McpPromptArgument(name="asset_id", description="Target asset ID", required=True),
        ],
    ),
]


def get_mcp_prompt_messages(prompt_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Renders structured messages for an MCP prompt.
    """
    asset_id = arguments.get("asset_id", "ASSET-PA-ACC-01")

    if prompt_name == "underwrite-deal-for-principal":
        return {
            "description": f"Principal Underwriting Workflow for {asset_id}",
            "messages": [
                {
                    "role": "user",
                    "content": {
                        "type": "text",
                        "text": (
                            f"You are the Chief Investment Officer for a U.S. family office evaluating target asset '{asset_id}'.\n\n"
                            f"Please execute the following institutional protocol:\n"
                            f"1. Call `get_asset_dossier` for '{asset_id}' to retrieve asking price, EBITDA, and down-side liquidation floor.\n"
                            f"2. Call `get_spatial_digital_twin` to inspect building envelope, rooftop HVAC units, and FEMA flood clearance.\n"
                            f"3. Call `underwrite_sba_sop_50_10_8_1` to verify statutory DSCR (>=1.25x), 10% equity injection, and 50% limited equity cap.\n"
                            f"4. Call `evaluate_sec_edgar_arbitrage` to evaluate multiple expansion upside upon consolidation.\n"
                            f"5. Call `run_openbb_macro_sofr_stress` to stress-test DSCR under +200 bps rate shock and stagflation.\n"
                            f"6. Deliver a concise Executive Memorandum with a definitive GO / NO-GO recommendation."
                        ),
                    },
                }
            ],
        }

    elif prompt_name == "audit-target-finances-cpa":
        return {
            "description": f"Forensic CPA Audit for {asset_id}",
            "messages": [
                {
                    "role": "user",
                    "content": {
                        "type": "text",
                        "text": (
                            f"You are the Lead CPA performing a Quality of Earnings audit on target asset '{asset_id}'.\n\n"
                            f"Protocol:\n"
                            f"1. Call `get_asset_dossier` for '{asset_id}'.\n"
                            f"2. Audit reported add-backs with `audit_addbacks_and_qoe`. Verify that the mandatory $85,000/yr replacement GM salary is deducted if the owner works >20 hrs/week.\n"
                            f"3. Verify that all guru synergy claims and personal lifestyle expenses are disallowed.\n"
                            f"4. Summarize the true Normalized EBITDA and the 12-month Net Working Capital (NWC) peg."
                        ),
                    },
                }
            ],
        }

    elif prompt_name == "compliance-clearance-counsel":
        return {
            "description": f"Legal & KYC Compliance Review for {asset_id}",
            "messages": [
                {
                    "role": "user",
                    "content": {
                        "type": "text",
                        "text": (
                            f"You are General Counsel executing pre-transaction diligence on asset '{asset_id}'.\n\n"
                            f"Protocol:\n"
                            f"1. Call `get_asset_dossier` for '{asset_id}' to identify corporate entity and founder.\n"
                            f"2. Call `screen_yente_aml_kyc` to run OFAC SDN, PEP, and BIS sanctions clearance.\n"
                            f"3. Verify that the clearance certificate contains a valid SHA-256 cryptographic digest.\n"
                            f"4. Report whether the asset is CLEARED FOR TRANSACTION or requires enhanced diligence."
                        ),
                    },
                }
            ],
        }

    else:
        return {"error": f"Unknown prompt: {prompt_name}"}

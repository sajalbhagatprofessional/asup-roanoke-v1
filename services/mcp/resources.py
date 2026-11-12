"""
Model Context Protocol (MCP) Resource Provider for ASUP.
Allows AI agents (Claude, Hermes, OpenClaw) to inspect live platform resources directly
via standard URIs: `asup://deals/...` and `asup://analytics/...`.
"""

from decimal import Decimal
import json
import logging
from typing import Any, Dict, List, Optional

from packages.underwriting_engine import MacroSofrEngine
from services.asset_aggregator.catalog import AssetAggregatorService
from services.gis.h3_clustering import H3SpatialService
from .protocol import McpResource

logger = logging.getLogger("asup.mcp.resources")

MCP_RESOURCES_CATALOG: List[McpResource] = [
    McpResource(
        uri="asup://deals/active-mandate",
        name="Active Investment Mandate Specification",
        description="Active geography box, target NAICS verticals, and SBA SOP 50 10 8.1 / Principal return hurdles.",
        mimeType="application/json",
    ),
    McpResource(
        uri="asup://deals/principal-weekly-digest",
        name="Principal Weekly Verified Deals Digest",
        description="The strictly capped <=5 verified deals ready for the Principal Monday 07:00 EST decision.",
        mimeType="application/json",
    ),
    McpResource(
        uri="asup://analytics/sofr-yield-curve",
        name="Benchmark SOFR & Treasury Yield Curve",
        description="Current 1M SOFR, 3M SOFR, 10Y Treasury, and WSJ Prime reference rates.",
        mimeType="application/json",
    ),
    McpResource(
        uri="asup://analytics/h3-clusters",
        name="Uber H3 Private Equity Roll-Up Consolidation Platforms",
        description="Regional multi-asset clusters grouped by NAICS prefix and Uber H3 hexagonal neighborhood contiguity.",
        mimeType="application/json",
    ),
]


def read_mcp_resource(uri: str) -> Dict[str, Any]:
    """
    Resolves and reads live platform resource by URI.
    """
    try:
        if uri == "asup://deals/active-mandate":
            return {
                "mandate_id": "ROA-SMB-01",
                "mandate_name": "Roanoke Valley Operating SMB & Industrial Mandate",
                "target_states": ["VA", "PA"],
                "target_fips": ["51770", "51161", "51775", "42077"],
                "target_sectors": ["Operating Brick-and-Mortar SMBs", "Industrial / CRE Floors", "Accounting / Professional Services"],
                "price_bounds_usd": {"min": "100000.00", "max": "5000000.00"},
                "underwriting_hurdles": {
                    "sba_sop_50_10_8_1_dscr_floor": "1.25x",
                    "principal_dscr_hurdle": "1.35x",
                    "replacement_gm_salary_deduction": "$85,000/yr (owner > 20 hrs/wk)",
                    "max_foreclosure_basis_ratio": "70.0% of assessed/replacement value",
                    "foreclosure_notice_min_days": "14 days (Va. Code § 55.1-321)",
                },
                "provenance_standard": ">= 2 independent public source domains required",
            }

        elif uri == "asup://deals/principal-weekly-digest":
            assets = AssetAggregatorService.search_assets()
            top_verified = assets[:5]
            return {
                "digest_timestamp": "2026-11-12T07:00:00Z",
                "deal_count": len(top_verified),
                "deals": [a.model_dump() if hasattr(a, "model_dump") else a.dict() for a in top_verified],
            }

        elif uri == "asup://analytics/sofr-yield-curve":
            curve = MacroSofrEngine.get_active_yield_curve()
            return {"benchmark_yield_curve": curve.to_dict()}

        elif uri == "asup://analytics/h3-clusters":
            assets = AssetAggregatorService.search_assets()
            asset_dicts = [a.model_dump() if hasattr(a, "model_dump") else a.dict() for a in assets]
            clusters = H3SpatialService.synthesize_rollup_clusters(asset_dicts, k_ring_radius=3)
            return {
                "total_clusters": len(clusters),
                "clusters": [c.to_dict() for c in clusters],
            }

        else:
            return {"error": f"Resource not found: {uri}"}

    except Exception as e:
        logger.error(f"Error reading MCP resource {uri}: {e}", exc_info=True)
        return {"error": str(e)}

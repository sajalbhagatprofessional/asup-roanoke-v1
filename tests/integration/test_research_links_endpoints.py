"""
Integration tests for FastAPI /v1/research/links endpoint and MCP tool get_asset_research_links.
"""

from fastapi.testclient import TestClient
from services.api.main import app
from services.mcp.tools import execute_mcp_tool

client = TestClient(app)


def test_fastapi_research_links_endpoint():
    res = client.get(
        "/v1/research/links",
        params={
            "entity_name": "Valley Industrial Machining Inc",
            "street_address": "2200 Shenandoah Ave NW",
            "city": "Roanoke",
            "state": "VA",
            "zip_code": "24017",
            "fips_code": "51770",
            "parcel_id": "P-554433",
            "naics_code": "332710",
            "docket_id": "7:26-bk-09911",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "categories" in data
    assert "quick_links" in data
    assert "google_maps" in data["quick_links"]
    assert "courtlistener" in data["quick_links"]
    assert "va_scc_cis" in data["quick_links"]
    assert "webgis.net/va/roanokecity" in data["quick_links"]["gis_portal"]


def test_mcp_get_asset_research_links_tool():
    tool_result = execute_mcp_tool(
        "get_asset_research_links",
        {
            "entity_name": "Star City Cold Storage LLC",
            "street_address": "1500 Orange Ave NE",
            "city": "Roanoke",
            "state": "VA",
            "fips_code": "51770",
            "naics_code": "493120",
        },
    )
    assert "error" not in tool_result
    assert tool_result["status"] == "success"
    assert "quick_links" in tool_result
    assert "google_maps" in tool_result["quick_links"]
    assert "493120" in tool_result["quick_links"]["census_naics"]

"""
Integration Tests for Nationwide Court Directory, Location & Budget First Mandate Configuration,
and Targeted On-Demand Sourcing Router.
"""

from decimal import Decimal
import pathlib
import sys
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from fastapi.testclient import TestClient

from services.api.main import app
from services.ingestion import (
    NATIONWIDE_STATE_DIRECTORY,
    list_available_states,
    get_counties_for_state,
    get_metro_presets,
    resolve_bankruptcy_court_feed_url,
)

client = TestClient(app)


def test_nationwide_court_directory_coverage():
    """Verifies that the court directory covers major states, FIPS prefixes, and bankruptcy district feeds."""
    states = list_available_states()
    assert len(states) >= 10
    state_codes = [s["state_code"] for s in states]
    assert "VA" in state_codes
    assert "NC" in state_codes
    assert "TX" in state_codes
    assert "FL" in state_codes

    # Check that bankruptcy feed URL resolves cleanly
    nc_feed = resolve_bankruptcy_court_feed_url("ncwbk")
    assert nc_feed == "https://ecf.ncwbk.uscourts.gov/cgi-bin/rss_outside.pl"

    # Check metro presets
    presets = get_metro_presets()
    preset_ids = [p["preset_id"] for p in presets]
    assert "PRESET_ROANOKE_VALLEY" in preset_ids
    assert "PRESET_CHARLOTTE_METRO" in preset_ids
    assert "PRESET_DFW_METROPLEX" in preset_ids


def test_fastapi_geo_endpoints():
    """Verifies GET /v1/geo/states and GET /v1/geo/counties endpoints."""
    res_states = client.get("/v1/geo/states")
    assert res_states.status_code == 200
    data_states = res_states.json()
    assert "states" in data_states
    assert "metro_presets" in data_states
    assert len(data_states["states"]) >= 10

    # Query counties for North Carolina
    res_nc = client.get("/v1/geo/counties?state=NC")
    assert res_nc.status_code == 200
    data_nc = res_nc.json()
    assert data_nc["state_code"] == "NC"
    fips_list = [c["fips_code"] for c in data_nc["counties"]]
    assert "37119" in fips_list  # Mecklenburg County (Charlotte)


def test_mandate_active_and_configure():
    """Verifies GET /v1/mandates/active and POST /v1/mandates/configure."""
    # 1. Get default active mandate
    res_get = client.get("/v1/mandates/active")
    assert res_get.status_code == 200
    active = res_get.json()
    assert "mandate_id" in active
    assert "target_fips" in active

    # 2. Configure a new targeted mandate (e.g. Charlotte Metro $1M - $3.5M)
    new_mandate = {
        "mandate_id": "MANDATE-NC-CHARLOTTE-01",
        "mandate_name": "Charlotte Metro Industrial SMB Box",
        "target_states": ["NC"],
        "target_fips": ["37119", "37179", "37025", "37071"],
        "min_price_usd": "1000000.00",
        "max_price_usd": "3500000.00",
        "near_miss_max_price_usd": "4025000.00",
        "min_base_dscr": "1.3500",
        "approved_naics_prefixes": ["332", "238", "811", "42"],
        "has_cre_required": True,
        "active_metro_preset": "PRESET_CHARLOTTE_METRO",
    }
    res_conf = client.post("/v1/mandates/configure", json=new_mandate)
    assert res_conf.status_code == 200
    conf_data = res_conf.json()
    assert conf_data["status"] == "success"
    assert conf_data["profile"]["mandate_id"] == "MANDATE-NC-CHARLOTTE-01"

    # 3. Verify active mandate matches updated profile
    res_verify = client.get("/v1/mandates/active")
    assert res_verify.status_code == 200
    assert res_verify.json()["mandate_id"] == "MANDATE-NC-CHARLOTTE-01"


def test_targeted_fetch_sourcing_router():
    """Verifies POST /v1/listings/targeted-fetch uses active mandate parameters."""
    res_fetch = client.post("/v1/listings/targeted-fetch", json={"auto_ingest": True})
    assert res_fetch.status_code == 200
    data = res_fetch.json()
    assert data["status"] == "success"
    assert "total_scanned_in_target_box" in data
    assert "in_box_ingested_count" in data


if __name__ == "__main__":
    test_nationwide_court_directory_coverage()
    test_fastapi_geo_endpoints()
    test_mandate_active_and_configure()
    test_targeted_fetch_sourcing_router()
    print("All Nationwide Mandate Wizard Integration Tests Passed!")

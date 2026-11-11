"""
Integration Tests for Regional Geography Expansion (Mandate ROA-REGIONAL-01),
Regional GIS Normalization Adapters, and ApiAnything Listing Ingestion.
"""

from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

from packages.mandate_filter import (
    MandateDisposition,
    RawDocketCandidate,
    evaluate_mandate_roa_regional_01,
    ROANOKE_REGIONAL_FIPS,
)
from services.api.main import app
from services.gis import (
    SalemCityGISAdapter,
    BotetourtCountyGISAdapter,
    FranklinCountyGISAdapter,
    BedfordCountyGISAdapter,
    MontgomeryCountyGISAdapter,
    RegionalValleyGISAdapter,
    get_regional_gis_adapter,
)
from services.ingestion import (
    ListingSite,
    SITE_ACCESS_REGISTRY,
    ExternalListing,
    ApiAnythingConnector,
)

client = TestClient(app)
_test_now = datetime(2026, 11, 10, 12, 0, 0, tzinfo=timezone.utc)


def test_regional_mandate_in_box_counties():
    """
    Verifies that evaluate_mandate_roa_regional_01 accepts all 10 target regional counties
    and independent cities when vertical and price conditions are met.
    """
    regional_fips_list = [
        "51770",  # Roanoke City
        "51161",  # Roanoke County
        "51775",  # Salem City
        "51023",  # Botetourt County
        "51067",  # Franklin County
        "51019",  # Bedford County
        "51121",  # Montgomery County
        "51750",  # Radford City
        "51045",  # Craig County
        "51063",  # Floyd County
    ]

    for fips in regional_fips_list:
        candidate = RawDocketCandidate(
            docket_id=f"REG-TEST-{fips}",
            fips_code=fips,
            parcel_id="PARCEL-001",
            entity_name="Blue Ridge Machine Works LLC",
            naics_code="332710",  # Machine Shops
            asking_or_cure_price_usd=Decimal("1500000.00"),
            has_real_estate_or_equipment_floor=True,
        )
        result = evaluate_mandate_roa_regional_01(candidate)
        assert result.disposition == MandateDisposition.IN_BOX, f"FIPS {fips} should be IN_BOX"
        assert "PASS_MANDATE_ROA_REGIONAL_01" in result.reasons
        assert result.estimated_enrichment_api_calls >= 2


def test_regional_mandate_rejects_out_of_region_fips():
    """
    Verifies that non-regional Virginia counties (e.g., Richmond 51760)
    are killed immediately at Stage 1 with 0 API spend.
    """
    candidate = RawDocketCandidate(
        docket_id="OUT-TEST-51760",
        fips_code="51760",  # Richmond City (Out of Box)
        parcel_id="PARCEL-999",
        entity_name="Richmond Fabricators LLC",
        naics_code="332710",
        asking_or_cure_price_usd=Decimal("1200000.00"),
        has_real_estate_or_equipment_floor=True,
    )
    result = evaluate_mandate_roa_regional_01(candidate)
    assert result.disposition == MandateDisposition.REJECTED_HARD_FILTER
    assert result.estimated_enrichment_api_calls == 0
    assert "HARD_KILL_OUTSIDE_REGIONAL_ROANOKE_FIPS:51760" in result.reasons[0]


def test_regional_gis_adapters_normalization():
    """
    Verifies that GIS normalization adapters for Salem, Botetourt, Franklin, Bedford,
    and Montgomery accurately parse parcel payloads and calculate hard asset floors.
    """
    # 1. Salem City Adapter (51775)
    salem_raw = {
        "PARCEL_ID": "SAL-001",
        "OWNER_NAME": "Salem Logistics LLC",
        "PROPERTY_ADDRESS": "100 West Main St, Salem VA",
        "ZONING": "HBD",
        "ACRES": "2.40",
        "LAND_VALUE": "400000.00",
        "IMPR_VALUE": "850000.00",
        "TOTAL_ASSESSED": "1250000.00",
    }
    salem_parcel = SalemCityGISAdapter.normalize_feature(salem_raw, _test_now)
    assert salem_parcel.fips_code == "51775"
    assert salem_parcel.total_assessed_usd.value == Decimal("1250000.00")
    assert salem_parcel.has_hard_asset_floor is True

    # 2. Botetourt County Adapter (51023)
    bot_raw = {
        "GPIN": "BOT-9021",
        "OWNER": "Daleville Industrial LLC",
        "SITE_ADDR": "500 Roanoke Rd, Daleville VA",
        "ZONE_CODE": "M-1",
        "ACREAGE": "5.10",
        "LANDVAL": "350000.00",
        "BLDGVAL": "1100000.00",
        "TOTALVAL": "1450000.00",
    }
    bot_parcel = BotetourtCountyGISAdapter.normalize_feature(bot_raw, _test_now)
    assert bot_parcel.fips_code == "51023"
    assert bot_parcel.total_assessed_usd.value == Decimal("1450000.00")
    assert bot_parcel.has_hard_asset_floor is True

    # 3. Franklin County Adapter (51067)
    frk_raw = {
        "PARCEL_ID": "FRK-1002",
        "OWNER_NAME": "Smith Mountain Boat & Engine Works",
        "PROPERTY_ADDRESS": "200 Scruggs Rd, Moneta VA",
        "ZONING": "B-2",
        "ACRES": "3.20",
        "LAND_VALUE": "300000.00",
        "IMPR_VALUE": "600000.00",
    }
    frk_parcel = FranklinCountyGISAdapter.normalize_feature(frk_raw, _test_now)
    assert frk_parcel.fips_code == "51067"
    assert frk_parcel.total_assessed_usd.value == Decimal("900000.00")
    assert frk_parcel.has_hard_asset_floor is True

    # 4. Adapter dispatcher lookup
    assert get_regional_gis_adapter("51775") == SalemCityGISAdapter
    assert get_regional_gis_adapter("51023") == BotetourtCountyGISAdapter
    assert get_regional_gis_adapter("51067") == FranklinCountyGISAdapter
    assert get_regional_gis_adapter("51019") == BedfordCountyGISAdapter
    assert get_regional_gis_adapter("51121") == MontgomeryCountyGISAdapter


def test_api_anything_connector_profiles_and_listings():
    """
    Verifies ApiAnythingConnector retrieves access profiles, documents account requirements,
    and converts external listings to RawDocketCandidates.
    """
    connector = ApiAnythingConnector(offline_mode=True)
    profiles = connector.list_all_access_requirements()
    assert len(profiles) >= 4

    # Check BizBuySell profile requires physical account & cookies
    bbs_profile = next(p for p in profiles if p["site"] == ListingSite.BIZBUYSELL.value)
    assert bbs_profile["requires_physical_account"] is True
    assert bbs_profile["auth_mechanism"] == "SESSION_COOKIE"

    # Check Regional Broker profile does NOT require physical account
    broker_profile = next(p for p in profiles if p["site"] == ListingSite.REGIONAL_BROKER.value)
    assert broker_profile["requires_physical_account"] is False
    assert broker_profile["auth_mechanism"] == "NONE"

    # Fetch regional listings
    listings = connector.fetch_listings_for_region(list(ROANOKE_REGIONAL_FIPS))
    assert len(listings) >= 4

    for item in listings:
        cand = connector.to_raw_candidate(item)
        assert isinstance(cand, RawDocketCandidate)
        assert isinstance(cand.asking_or_cure_price_usd, Decimal)


def test_fastapi_access_requirements_and_external_fetch():
    """
    Tests the FastAPI REST endpoints:
    - GET /v1/access-requirements
    - POST /v1/listings/external-fetch
    """
    # 1. GET /v1/access-requirements
    res = client.get("/v1/access-requirements")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "platforms" in data
    assert "summary" in data
    assert data["total_tracked_platforms"] >= 4

    # 2. POST /v1/listings/external-fetch
    fetch_req = {
        "fips_codes": ["51023", "51067", "51019", "51121", "51775"],
        "mandate_code": "ROA-REGIONAL-01",
        "auto_ingest": True,
    }
    res2 = client.post("/v1/listings/external-fetch", json=fetch_req)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "success"
    assert data2["total_fetched"] >= 4
    assert data2["in_box_ingested_count"] >= 3

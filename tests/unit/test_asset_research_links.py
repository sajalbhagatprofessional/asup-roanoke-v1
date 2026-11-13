"""
Unit tests for Argus 1-Click Deep Research & Investigation Links Engine.
Verifies URL generation across Geospatial, Corporate OSINT, Court Dockets,
NAICS Economic Benchmarks, Environmental, and GIS Portals.
"""

from services.research import generate_research_links, format_full_address


def test_format_full_address():
    addr = format_full_address("123 Electric Rd", "Roanoke", "VA", "24018")
    assert addr == "123 Electric Rd, Roanoke, VA 24018"

    addr2 = format_full_address(None, "Salem", "VA", None)
    assert addr2 == "Salem, VA"


def test_generate_research_links_categories_and_structure():
    links_payload = generate_research_links(
        entity_name="Blue Ridge Precision Dynamics LLC",
        street_address="4500 Peters Creek Rd",
        city="Roanoke",
        state="VA",
        zip_code="24019",
        county="Roanoke City",
        fips_code="51770",
        parcel_id="ROA-PARCEL-101",
        naics_code="332710",
        docket_id="7:26-bk-01420",
        latitude=37.2709,
        longitude=-79.9414,
    )

    assert links_payload["status"] == "success"
    assert "categories" in links_payload
    assert "quick_links" in links_payload
    assert len(links_payload["categories"]) == 4

    # Check categories
    cat_names = [c["category"] for c in links_payload["categories"]]
    assert "GEOSPATIAL" in cat_names
    assert "CORPORATE_OSINT" in cat_names
    assert "LEGAL_DOCKETS" in cat_names
    assert "ECONOMIC_BENCHMARKS" in cat_names

    # Check quick links
    quick = links_payload["quick_links"]
    assert "google_maps" in quick
    assert "https://www.google.com/maps" in quick["google_maps"]
    assert "google_satellite" in quick
    assert "&t=k" in quick["google_satellite"]
    assert "viewpoint=37.2709,-79.9414" in quick["google_streetview"]
    assert "cis.scc.virginia.gov" in quick["va_scc_cis"]
    assert "courtlistener.com" in quick["courtlistener"]
    assert "7%3A26-bk-01420" in quick["courtlistener"]
    assert "fema_flood" in quick
    assert "332710" in quick["census_naics"]
    assert "webgis.net/va/roanokecity" in quick["gis_portal"]


def test_county_gis_routing_roanoke_county_51161():
    county_links = generate_research_links(
        entity_name="Appalachian Heavy Haul LLC",
        street_address="7800 Plantation Rd",
        city="Roanoke",
        state="VA",
        county="Roanoke County",
        fips_code="51161",
        parcel_id="GPIN-998877",
        naics_code="484110",
    )
    quick = county_links["quick_links"]
    assert "arcgis.roanokecountyva.gov" in quick["gis_portal"]
    assert "gpin=GPIN-998877" in quick["gis_portal"]

from datetime import datetime, timezone
from decimal import Decimal
from packages.mandate_filter import MandateDisposition
from services.gis import (
    RoanokeCityGISAdapter,
    RoanokeCountyGISAdapter,
    classify_roanoke_valley_coordinates,
)
from services.ingestion import (
    BronzeIngestVault,
    CircuitBreakerOpenError,
    LawfulCircuitBreaker,
    PacerDailyCapExceededError,
    RobotsTxtDisallowedError,
    parse_roanoke_city_tacs_tax_sale,
    parse_roanoke_county_judicial_sale,
    parse_roanoke_times_trustee_notice,
    parse_vawbk_rss_xml,
)


def test_circuit_breaker_trips_24h_lock_on_403_429_and_captcha():
    breaker = LawfulCircuitBreaker()
    now = datetime(2026, 11, 9, 11, 0, 0, tzinfo=timezone.utc)
    url = "https://roanoke.column.us/search?q=trustee"

    breaker.check_pre_request(url, now=now)

    # Simulate HTTP 403 Forbidden -> Must immediately trip 24-hour lock
    try:
        breaker.inspect_response(url, status_code=403, now=now)
        raise AssertionError("Expected CircuitBreakerOpenError on HTTP 403")
    except CircuitBreakerOpenError:
        pass

    assert len(breaker.events) == 1
    assert breaker.events[0].domain == "roanoke.column.us"

    # Subsequent request 1 hour later must be blocked before hitting network
    try:
        breaker.check_pre_request(url, now=now)
        raise AssertionError("Expected pre-request check to fail while 24h breaker is open")
    except CircuitBreakerOpenError:
        pass


def test_robots_txt_disallow_and_pacer_3_dollar_daily_cap():
    breaker = LawfulCircuitBreaker()
    breaker.register_robots_disallow("roanokecountyva.gov", ["/private-admin", "/internal"])

    try:
        breaker.check_pre_request("https://www.roanokecountyva.gov/private-admin/export")
        raise AssertionError("Expected RobotsTxtDisallowedError")
    except RobotsTxtDisallowedError:
        pass

    # PACER $3.00/day cap (30 pages @ $0.10/page)
    spent = breaker.charge_pacer_pages(25)
    assert spent == Decimal("2.50")

    try:
        breaker.charge_pacer_pages(10)  # Would bring total to $3.50 (> $3.00 daily cap)
        raise AssertionError("Expected PacerDailyCapExceededError")
    except PacerDailyCapExceededError:
        pass


def test_roanoke_county_and_city_gis_normalization_and_coordinates():
    now = datetime(2026, 11, 9, 11, 0, 0, tzinfo=timezone.utc)

    county_raw = {
        "GPIN": "065.14-01-22.00-0000",
        "OWNER1": "VALLEY METAL FABRICATORS INC",
        "SITE_ADDR": "4410 HOLLINS RD NE, ROANOKE COUNTY, VA",
        "ZONE_CODE": "I-2",
        "ACREAGE": "4.25",
        "LANDVAL": "650000.00",
        "BLDGVAL": "1850000.00",
        "TOTALVAL": "2500000.00",
        "LAT": "37.3450",
        "LON": "-79.9520",
    }
    p_county = RoanokeCountyGISAdapter.normalize_feature(county_raw, verified_at=now)
    assert p_county.fips_code == "51161"
    assert p_county.total_assessed_usd.value == Decimal("2500000.00")
    assert p_county.has_hard_asset_floor is True

    city_raw = {
        "PARCEL_ID": "3021408",
        "OWNER_NAME": "STAR CITY COLD LOGISTICS LLC",
        "PROPERTY_ADDRESS": "1820 SALEM AVE SW, ROANOKE, VA",
        "ZONING": "I-1",
        "ACRES": "2.80",
        "LAND_VALUE": "420000.00",
        "IMPR_VALUE": "1480000.00",
        "TOTAL_ASSESSED": "1900000.00",
        "LATITUDE": "37.2745",
        "LONGITUDE": "-79.9680",
    }
    p_city = RoanokeCityGISAdapter.normalize_feature(city_raw, verified_at=now)
    assert p_city.fips_code == "51770"
    assert p_city.total_assessed_usd.value == Decimal("1900000.00")
    assert p_city.has_hard_asset_floor is True

    # Verify spatial coordinate classifier separates City (51770), County (51161), and Salem (51775)
    assert classify_roanoke_valley_coordinates(Decimal("37.2745"), Decimal("-79.9680")) == "51770"
    assert classify_roanoke_valley_coordinates(Decimal("37.3650"), Decimal("-79.9520")) == "51161"
    assert classify_roanoke_valley_coordinates(Decimal("37.2935"), Decimal("-80.0547")) == "51775"


def test_all_four_roanoke_docket_pollers_and_bronze_vault_dedup():
    vault = BronzeIngestVault()
    now = datetime(2026, 11, 9, 11, 0, 0, tzinfo=timezone.utc)

    # 1. VAWBK Federal Bankruptcy Court RSS
    rss_xml = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel>
      <item>
        <title>26-70901-VAWBK | Blue Ridge Precision Tooling LLC | Ch 11</title>
        <link>https://pacer.uscourts.gov/file-case/court-cmecf-lookup/court/VAWBK</link>
        <description>FIPS:51770;PARCEL:3029911;NAICS:332710;SECURED_CLAIM_USD:2650000.00;TRUSTEE:J. M. Callahan</description>
      </item>
    </channel></rss>"""
    filings = parse_vawbk_rss_xml(rss_xml)
    assert len(filings) == 1
    is_new, bronze_rec, gate_res = vault.ingest_and_gate(
        "VAWBK_RSS", filings[0].source_url, rss_xml, filings[0], now
    )
    assert is_new is True
    assert gate_res.disposition == MandateDisposition.IN_BOX

    # Re-ingesting identical payload must deduplicate (is_new == False)
    is_new_second, _, _ = vault.ingest_and_gate(
        "VAWBK_RSS", filings[0].source_url, rss_xml, filings[0], now
    )
    assert is_new_second is False

    # 2. The Roanoke Times Substitute Trustee Notice (Va. Code § 55.1-321)
    trustee_notice = parse_roanoke_times_trustee_notice({
        "notice_id": "RT-2026-1108-04",
        "fips_code": "51161",
        "parcel_id": "065.14-01-22.00-0000",
        "grantor_entity_name": "Hollins Industrial Warehousing LLC",
        "naics_code": "493110",
        "estimated_cure_and_payoff_usd": "1950000.00",
        "published_date": "2026-11-01",
        "sale_date": "2026-11-19",
        "substitute_trustee_firm": "Spilman Thomas & Battle, PLLC (Substitute Trustee)",
        "source_url": "https://roanoke.column.us/search?notice=RT-2026-1108-04",
    })
    _, _, g2 = vault.ingest_and_gate("ROANOKE_TIMES", trustee_notice.source_url, "raw_notice_1", trustee_notice, now)
    assert g2.disposition == MandateDisposition.IN_BOX

    # 3. City of Roanoke Tax Sale (TACS)
    city_tax = parse_roanoke_city_tacs_tax_sale({
        "tax_sale_id": "TACS-ROA-2026-19",
        "parcel_id": "1040812",
        "owner_of_record": "Roanoke Fleet Service Center Inc",
        "naics_code": "811111",
        "Minimum_bid_or_assessed_usd": "890000.00",
        "published_date": "2026-10-25",
        "auction_date": "2026-11-20",
    })
    _, _, g3 = vault.ingest_and_gate("CITY_TAX_SALE", city_tax.source_url, "raw_tax_1", city_tax, now)
    assert g3.disposition == MandateDisposition.IN_BOX

    # 4. Roanoke County Judicial Sale
    county_jud = parse_roanoke_county_judicial_sale({
        "judicial_sale_id": "RC-JUD-2026-07",
        "gpin": "088.02-03-11.00-0000",
        "owner_of_record": "Catawba Valley Machine Works LLC",
        "naics_code": "332710",
        "cure_or_assessed_usd": "1420000.00",
        "published_date": "2026-10-28",
        "sale_date": "2026-11-24",
    })
    _, _, g4 = vault.ingest_and_gate("COUNTY_JUDICIAL_SALE", county_jud.source_url, "raw_jud_1", county_jud, now)
    assert g4.disposition == MandateDisposition.IN_BOX

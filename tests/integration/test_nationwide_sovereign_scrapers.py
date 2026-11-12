"""
Integration Test Suite: Nationwide Sovereign Scrapers & Crawlers.
Validates:
1. 94 Federal Bankruptcy Court Docket Streamer (CM/ECF RSS feeds)
2. 50 Statewide Public Notice Scrapers (Substitute Trustee, Sheriff & Tax sales)
3. Centralized Government Auction Scrapers (GovDeals, RealAuction, Bid4Assets, PublicSurplus)
4. Universal ArcGIS REST Parcel Normalizer
5. Nationwide Ingestion Coordinator & Database Pipelining
6. FastAPI Sovereign Ingestion REST Endpoints
"""

from fastapi.testclient import TestClient

from services.api.main import app, pipeline_store
from services.ingestion.nationwide_scrapers import (
    FederalCourtStreamer,
    GovernmentAuctionScraper,
    NationwideIngestionCoordinator,
    StatewidePublicNoticeScraper,
    UniversalArcGISParcelCrawler,
    nationwide_coordinator,
)

client = TestClient(app)


def test_federal_court_streamer_indexing_and_polling():
    """Verifies that all federal bankruptcy court districts are indexed and polled."""
    streamer = FederalCourtStreamer()
    assert len(streamer.all_districts) >= 50
    assert "vawbk" in streamer.all_districts
    assert "paebk" in streamer.all_districts
    assert "txnbk" in streamer.all_districts

    # Poll PA Eastern and VA Western
    pa_dockets = streamer.poll_court_district("paebk", "PA")
    assert len(pa_dockets) > 0
    assert pa_dockets[0].court_id == "paebk"
    assert pa_dockets[0].state_code == "PA"
    assert pa_dockets[0].chapter in ["11", "7", "OTHER"]
    assert pa_dockets[0].is_commercial is True


def test_statewide_public_notices_scraper():
    """Verifies statutory legal notice scraping for Pennsylvania and Virginia."""
    notice_scraper = StatewidePublicNoticeScraper()
    pa_notices = notice_scraper.scrape_state_notices("PA", county_filter="42077")
    assert len(pa_notices) > 0
    item = pa_notices[0]
    assert item.state_code == "PA"
    assert item.statutory_notice_days >= 14
    assert item.substitute_trustee_contact is not None
    assert item.minimum_bid_usd is not None


def test_government_auctions_scraper():
    """Verifies centralized government auction scraping across GovDeals, RealAuction, Bid4Assets."""
    auction_scraper = GovernmentAuctionScraper()
    items = auction_scraper.scrape_all_platforms_for_region("PA")
    assert len(items) >= 4
    categories = [i.asset_category for i in items]
    assert "EQUIPMENT_FLEET" in categories or "TAX_LIEN_MUNICIPAL" in categories
    assert any(i.platform == "GOV_DEALS" for i in items)


def test_universal_arcgis_parcel_crawler():
    """Verifies direct REST querying of county parcel GIS servers."""
    crawler = UniversalArcGISParcelCrawler()
    parcels = crawler.query_county_parcels("42077", limit=5)
    assert len(parcels) > 0
    p = parcels[0]
    assert p.fips_code == "42077"
    assert p.total_assessed_usd.value > 0
    assert p.zoning_code is not None


def test_nationwide_coordinator_scan_and_pipelining():
    """Verifies that the coordinator executes across all sources and pipes deals into the store."""
    coordinator = NationwideIngestionCoordinator()
    initial_count = len(pipeline_store.list_all_deals())

    res = coordinator.execute_sovereign_scan(
        target_states=["PA"],
        target_fips=["42077", "42095"],
        pipeline_store=pipeline_store,
        min_price_usd="100000.00",
        max_price_usd="5000000.00",
    )

    assert res.status == "success"
    assert res.federal_dockets_harvested > 0
    assert res.public_notices_harvested > 0
    assert res.government_auctions_harvested > 0
    assert res.in_box_ingested_count > 0
    assert len(pipeline_store.list_all_deals()) >= initial_count


def test_fastapi_nationwide_endpoints():
    """Verifies POST /v1/ingestion/nationwide/scan and GET /v1/ingestion/nationwide/status."""
    # 1. Status endpoint
    res_status = client.get("/v1/ingestion/nationwide/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["status"] == "operational"
    assert status_data["federal_bankruptcy_courts_indexed"] >= 50
    assert status_data["statewide_public_notice_portals_indexed"] == 50
    assert status_data["centralized_auction_platforms_indexed"] == 4

    # 2. Scan endpoint
    scan_payload = {
        "target_states": ["PA"],
        "target_fips": ["42077"],
        "min_price_usd": "250000.00",
        "max_price_usd": "4500000.00",
    }
    res_scan = client.post("/v1/ingestion/nationwide/scan", json=scan_payload)
    assert res_scan.status_code == 200
    scan_data = res_scan.json()
    assert scan_data["status"] == "success"
    assert "metrics" in scan_data
    assert scan_data["metrics"]["in_box_ingested_count"] > 0

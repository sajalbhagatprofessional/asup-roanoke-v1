import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi.testclient import TestClient

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from services.api.main import app
from services.ingestion.circuit_breaker import LawfulCircuitBreaker
from services.ingestion.source_tracker import (
    LocationConnectivityReport,
    SourceCategory,
    SourceConnectivityTracker,
    SourceStatus,
    TrackedSourceConnection,
)


def test_source_tracker_for_roanoke_valley():
    tracker = SourceConnectivityTracker()
    report = tracker.evaluate_mandate_connectivity(
        mandate_id="ROA-SMB-01",
        mandate_name="Roanoke Valley SMB Mandate",
        target_states=["VA"],
        target_fips=["51770", "51161", "51775"],
    )

    assert isinstance(report, LocationConnectivityReport)
    assert report.mandate_id == "ROA-SMB-01"
    assert report.total_sources_evaluated >= 9
    assert report.connected_count >= 6
    assert report.coverage_score_pct >= 60.0

    # Verify Federal Bankruptcy Court
    court_sources = [s for s in report.sources if s.category == SourceCategory.BANKRUPTCY_COURT]
    assert len(court_sources) == 1
    assert "VAWBK" in court_sources[0].source_name
    assert court_sources[0].status == SourceStatus.CONNECTED

    # Verify Specialized GIS adapters
    gis_sources = [s for s in report.sources if s.category == SourceCategory.COUNTY_GIS]
    assert len(gis_sources) == 3
    for s in gis_sources:
        assert s.status == SourceStatus.CONNECTED

    # Verify Commercial Brokers (without cookies, must require auth)
    broker_sources = {s.source_id: s for s in report.sources if s.category == SourceCategory.COMMERCIAL_BROKER}
    assert "broker_bizbuysell" in broker_sources
    assert broker_sources["broker_bizbuysell"].status == SourceStatus.AUTH_REQUIRED
    assert broker_sources["broker_bizbuysell"].requires_physical_account is True
    assert "Akamai Bot Manager" in (broker_sources["broker_bizbuysell"].access_barrier_reason or "")


def test_source_tracker_for_out_of_state_location():
    tracker = SourceConnectivityTracker()
    report = tracker.evaluate_mandate_connectivity(
        mandate_id="MANDATE-NC-CHARLOTTE",
        mandate_name="Charlotte Metro Expansion",
        target_states=["NC"],
        target_fips=["37119", "37071"],
    )

    assert report.total_sources_evaluated >= 7
    # Court should be NCWBK
    court_source = next(s for s in report.sources if s.category == SourceCategory.BANKRUPTCY_COURT)
    assert "NCWBK" in court_source.source_name
    assert "ncwbk" in court_source.endpoint_url

    # FIPS 37119 (Mecklenburg) is specialized, FIPS 37071 (Gaston) is fallback
    gis_37119 = next(s for s in report.sources if s.source_id == "gis_fips_37119")
    assert gis_37119.status == SourceStatus.CONNECTED

    gis_37071 = next(s for s in report.sources if s.source_id == "gis_fips_37071")
    assert gis_37071.status == SourceStatus.FALLBACK_GENERIC
    assert "generic" in (gis_37071.access_barrier_reason or "").lower()


def test_circuit_breaker_lock_reflection():
    breaker = LawfulCircuitBreaker()
    now = datetime.now(timezone.utc)
    # Simulate a 403 Akamai block locking bizbuysell.com for 24h
    breaker._domain_locks["bizbuysell.com"] = now + timedelta(hours=23)

    tracker = SourceConnectivityTracker(circuit_breaker=breaker)
    report = tracker.evaluate_mandate_connectivity(
        mandate_id="ROA-SMB-01",
        mandate_name="Roanoke Valley SMB Mandate",
        target_states=["VA"],
        target_fips=["51770"],
        now=now,
    )

    biz_source = next(s for s in report.sources if s.source_id == "broker_bizbuysell")
    assert biz_source.status == SourceStatus.CIRCUIT_BREAKER_LOCKED
    assert biz_source.is_accessible is False
    assert "Locked by 24h circuit breaker" in (biz_source.access_barrier_reason or "")
    assert report.blocked_or_locked_count >= 1


def test_fastapi_sources_health_and_refresh_endpoints():
    client = TestClient(app)

    # 1. GET /v1/sources/health
    res = client.get("/v1/sources/health")
    assert res.status_code == 200
    data = res.json()
    assert "mandate_id" in data
    assert "coverage_score_pct" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)
    assert len(data["sources"]) > 0

    # Verify first source structure
    first_source = data["sources"][0]
    assert "source_id" in first_source
    assert "source_name" in first_source
    assert "category" in first_source
    assert "status" in first_source
    assert "is_accessible" in first_source

    # 2. POST /v1/sources/refresh
    refresh_res = client.post("/v1/sources/refresh")
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    assert refresh_data["status"] == "success"
    assert "report" in refresh_data
    assert refresh_data["report"]["total_sources_evaluated"] > 0

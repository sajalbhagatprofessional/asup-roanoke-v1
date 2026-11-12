"""
Integration test suite for Advanced Institutional Features:
1. Free Law Project CourtListener & RECAP Zero-Cost Bankruptcy Docket Ingestion
2. OCCRP FollowTheMoney Entity Resolution & Beneficial Ownership (UBO) Graph
3. OpenAddresses & Universal Spatial Coordinates & 3D Parcel Boundary Extrusion
4. 3D Spatial Digital Twin & Site Flyover FastAPI Endpoint
"""

import unittest
from fastapi.testclient import TestClient

from services.api.main import app
from services.asset_aggregator.entity_resolver import (
    FollowTheMoneyEntityResolver,
    RelationType,
)
from services.gis.spatial_resolver import UniversalSpatialResolver
from services.ingestion.nationwide_scrapers.courtlistener_recap_adapter import (
    CourtListenerRecapAdapter,
)
from services.ingestion.nationwide_scrapers.federal_court_streamer import (
    FederalCourtStreamer,
)


class TestAdvancedInstitutionalFeatures(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_courtlistener_recap_adapter_search_and_documents(self):
        """Verifies CourtListener RECAP search for Chapter 11 § 363 sales and free documents."""
        adapter = CourtListenerRecapAdapter()
        items = adapter.search_recap_363_sales("vawbk", "VA", limit=3)
        self.assertGreaterEqual(len(items), 1)
        first = items[0]
        self.assertIn("CL-RECAP", first.docket_id)
        self.assertIn("courtlistener.com", first.source_url)
        self.assertTrue(first.is_commercial)

        # Test document retrieval (free PDFs without PACER fees)
        docs = adapter.fetch_free_recap_documents("vawbk", "26-10492")
        self.assertGreaterEqual(len(docs), 2)
        self.assertTrue(any("§ 363" in d.description for d in docs))
        self.assertTrue(all(d.is_available_on_recap for d in docs))

    def test_federal_court_streamer_incorporates_recap_archive(self):
        """Verifies that FederalCourtStreamer polls include CourtListener RECAP dockets."""
        streamer = FederalCourtStreamer()
        dockets = streamer.poll_court_district("vawbk", "VA")
        self.assertGreaterEqual(len(dockets), 1)
        has_recap = any("courtlistener" in d.source_url or "CL-RECAP" in d.docket_id for d in dockets)
        self.assertTrue(has_recap)

    def test_followthemoney_entity_resolver_and_corporate_graph(self):
        """Verifies OCCRP FollowTheMoney entity unwrapping and beneficial ownership resolution."""
        res = FollowTheMoneyEntityResolver.resolve_entity_network(
            entity_name="Kesterson & Associates Accounting P.C.",
            state_code="PA",
            founder_hint="Harold Kesterson, CPA",
        )
        self.assertEqual(res.primary_ubo, "Harold Kesterson, CPA")
        self.assertEqual(res.ubo_ownership_pct, 100.0)
        self.assertTrue(res.is_confirmed_natural_person)
        self.assertTrue(res.sanctions_screening_clean)
        self.assertLessEqual(res.entity_risk_score, 15)  # Institutional grade clean

        # Verify corporate graph structure
        relations = [r["relation"] for r in res.relationships]
        self.assertIn(RelationType.BENEFICIAL_OWNER.value, relations)
        self.assertIn(RelationType.SUBSIDIARY.value, relations)
        self.assertIn(RelationType.PROPERTY_OWNER.value, relations)

    def test_universal_spatial_resolver_parcel_polygon_and_elevation(self):
        """Verifies OpenAddresses rooftop geocoding, 3D boundary polygon, and FEMA flood clearance."""
        twin = UniversalSpatialResolver.resolve_parcel_spatial_twin(
            fips_code="42077",
            parcel_id="PARCEL-LEHIGH-001",
            street_address="500 Hamilton Blvd, Allentown, PA",
            building_sqft=32000,
            lot_acreage=3.5,
        )
        self.assertAlmostEqual(twin.center_lat, 40.6084, delta=0.05)
        self.assertAlmostEqual(twin.center_lng, -75.4902, delta=0.05)
        self.assertGreater(twin.ground_elevation_ft, 0)
        self.assertGreater(len(twin.polygon_vertices), 4)  # Closed ring polygon
        self.assertGreater(twin.loading_dock_bays, 0)
        self.assertGreater(twin.rooftop_hvac_units, 0)
        self.assertGreater(twin.flood_clearance_delta_ft, 0)  # Safe above 100-yr BFE

    def test_fastapi_asset_spatial_twin_endpoint(self):
        """Verifies GET /v2/assets/{asset_id}/spatial-twin returns 3D digital twin payload."""
        response = self.client.get("/v2/assets/ASSET-PA-ACC-01/spatial-twin")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["asset_id"], "ASSET-PA-ACC-01")
        self.assertIn("spatial_twin", data)
        st = data["spatial_twin"]
        self.assertIn("polygon_vertices", st)
        self.assertIn("ground_elevation_ft", st)
        self.assertIn("fema_bfe_elevation_ft", st)
        self.assertIn("rooftop_hvac_units", st)
        self.assertIn("loading_dock_bays", st)
        self.assertIn("camera_preset", data)


if __name__ == "__main__":
    unittest.main()

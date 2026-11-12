"""
Milestone 19-22 Integration Test Suite:
Advanced Sourcing Intelligence & Underwriting Radar.
Synthesizes best-in-class features from 11 market leaders:
1. Inven / Grata: Semantic Lookalike Private Market Sourcing
2. Reonomy / Trepp: Commercial Debt Maturity Wall & Refi Pressure Radar
3. PropertyRadar / TaxSaleResources: Title Curative Screener & 26 U.S.C. § 7425 IRS Redemption Clock
4. Cherre / Bowery Valuation: Municipal Building Permits & FAR Zoning Envelopes
5. FastAPI Production REST Endpoints
6. MCP Agent Gateway Tools
"""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient

from services.api.main import app
from packages.sourcing_intelligence import (
    SemanticLookalikeEngine,
    DebtMaturityRadarEngine,
    TitleCurativeEngine,
    PermitZoningScanner,
    TitleClearanceStatus,
    DistressMaturityTier,
    ZoningUseStatus,
)
from services.mcp.tools import execute_mcp_tool


class TestAdvancedSourcingIntelligence(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_inven_semantic_lookalikes(self):
        """Tests Inven-grade semantic lookalike discovery across private companies."""
        engine = SemanticLookalikeEngine()
        report = engine.find_lookalikes(
            query="cold-chain refrigerated freight trucking and logistics",
            min_similarity=Decimal("0.25"),
        )
        self.assertGreaterEqual(report.total_matched, 1)
        top = report.candidates[0]
        self.assertGreaterEqual(top.semantic_similarity_score, Decimal("0.25"))
        self.assertGreater(top.estimated_ebitda_usd, Decimal("0.00"))
        self.assertGreater(top.distance_miles, Decimal("0.0"))
        self.assertIn("Roanoke", top.city_and_state)
        self.assertIn(top.contact_fiduciary_type, ["TRUSTEE", "BROKER", "CPA", "OWNER"])

        # Test with exemplary entity ID
        report_cloned = engine.find_lookalikes(
            query="precision aerospace manufacturing",
            exemplary_entity_id="PEER-ROA-02",
        )
        self.assertGreaterEqual(report_cloned.total_matched, 1)

    def test_reonomy_trepp_debt_maturity_radar(self):
        """Tests Reonomy/Trepp commercial debt maturity wall and refinance cliff solver."""
        engine = DebtMaturityRadarEngine()
        report = engine.scan_debt_maturity_wall(
            target_market="Roanoke, VA",
            max_months_to_maturity=24,
            projected_refi_rate=Decimal("0.0825"),
        )
        self.assertGreaterEqual(report.total_loans_tracked, 4)
        self.assertGreater(report.total_maturing_debt_volume_usd, Decimal("1000000.00"))
        self.assertGreaterEqual(report.high_stress_loans_count, 1)

        # Inspect top distressed loan
        top_stressed = report.loans[0]
        self.assertGreaterEqual(top_stressed.refinance_cliff_score, Decimal("40.00"))
        self.assertLess(top_stressed.refinanced_dscr, top_stressed.current_dscr)
        self.assertIn(top_stressed.distress_tier, [DistressMaturityTier.IMMINENT_DEFAULT, DistressMaturityTier.HIGH_REFINANCE_STRESS])
        self.assertGreater(top_stressed.projected_annual_debt_service_usd, top_stressed.current_annual_debt_service_usd)

    def test_propertyradar_taxsaleresources_title_curative(self):
        """Tests PropertyRadar-grade title curative audit and IRS 120-day redemption clock."""
        # 1. Marketable Title Parcel
        clean_rep = TitleCurativeEngine.audit_parcel_title(parcel_id="51770-30104", deal_id="DEAL-ROA-01")
        self.assertEqual(clean_rep.title_status, TitleClearanceStatus.TITLE_MARKETABLE_INSURABLE)
        self.assertFalse(clean_rep.is_clearance_blocked)
        self.assertFalse(clean_rep.irs_120_day_redemption_active)
        self.assertEqual(clean_rep.total_liens_count, 2)
        self.assertGreater(clean_rep.recommended_escrow_holdback_usd, Decimal("0.00"))

        # 2. Clouded Parcel with Active IRS 120-Day Redemption Right
        cloud_rep = TitleCurativeEngine.audit_parcel_title(
            parcel_id="51770-CLOUD-IRS-01",
            deal_id="DEAL-ROA-02",
            foreclosure_sale_date_iso="2026-10-15",
        )
        self.assertEqual(cloud_rep.title_status, TitleClearanceStatus.TITLE_CLOUDED_REDEMPTION_RISK)
        self.assertTrue(cloud_rep.is_clearance_blocked)
        self.assertTrue(cloud_rep.irs_120_day_redemption_active)
        self.assertGreater(cloud_rep.irs_redemption_days_remaining, 0)
        self.assertIn("26 U.S.C. § 7425", cloud_rep.counsel_closing_opinion)

    def test_cherre_bowery_permit_and_zoning_scanner(self):
        """Tests Cherre/Bowery municipal building permit and FAR zoning envelope scanner."""
        # Standard industrial facility with clean permits
        clean_zone = PermitZoningScanner.scan_parcel_zoning_and_permits(
            parcel_id="51770-30104",
            parcel_area_acres=Decimal("3.85"),
            building_footprint_sqft=Decimal("48500.00"),
            zoning_code="I-2",
        )
        self.assertEqual(clean_zone.permitted_use_status, ZoningUseStatus.PERMITTED_BY_RIGHT)
        self.assertEqual(clean_zone.max_allowable_far, Decimal("0.80"))
        self.assertLess(clean_zone.current_far, clean_zone.max_allowable_far)
        self.assertGreater(clean_zone.expansion_potential_sqft, Decimal("50000.00"))
        self.assertFalse(clean_zone.unpermitted_alteration_risk_detected)
        self.assertGreaterEqual(len(clean_zone.permits), 2)

        # Facility with open citation / unpermitted additions
        citation_zone = PermitZoningScanner.scan_parcel_zoning_and_permits(
            parcel_id="51770-CITATION-01",
            parcel_area_acres=Decimal("2.10"),
            building_footprint_sqft=Decimal("32000.00"),
            zoning_code="I-1",
        )
        self.assertTrue(citation_zone.unpermitted_alteration_risk_detected)
        self.assertGreater(citation_zone.open_permit_citations_count, 0)

    def test_fastapi_sourcing_intelligence_endpoints(self):
        """Tests FastAPI REST endpoints for advanced sourcing intelligence."""
        # 1. POST /v1/sourcing/semantic-lookalikes
        resp_look = self.client.post("/v1/sourcing/semantic-lookalikes", json={
            "query": "precision CNC tooling and aerospace machining",
            "min_similarity": 0.20,
        })
        self.assertEqual(resp_look.status_code, 200)
        data_look = resp_look.json()
        self.assertEqual(data_look["status"], "success")
        self.assertIn("lookalike_report", data_look)

        # 2. POST /v1/sourcing/debt-maturity-radar
        resp_debt = self.client.post("/v1/sourcing/debt-maturity-radar", json={
            "target_market": "Roanoke, VA",
            "max_months_to_maturity": 24,
        })
        self.assertEqual(resp_debt.status_code, 200)
        data_debt = resp_debt.json()
        self.assertEqual(data_debt["status"], "success")
        self.assertIn("maturity_radar", data_debt)

        # 3. POST /v1/sourcing/title-curative-audit
        resp_title = self.client.post("/v1/sourcing/title-curative-audit", json={
            "parcel_id": "51770-30104",
            "deal_id": "DEAL-001",
        })
        self.assertEqual(resp_title.status_code, 200)
        data_title = resp_title.json()
        self.assertEqual(data_title["status"], "success")
        self.assertIn("title_curative_audit", data_title)

        # 4. POST /v1/sourcing/permit-zoning-scan
        resp_zone = self.client.post("/v1/sourcing/permit-zoning-scan", json={
            "parcel_id": "51770-30104",
            "parcel_area_acres": 3.85,
            "building_footprint_sqft": 48500.0,
            "zoning_code": "I-2",
        })
        self.assertEqual(resp_zone.status_code, 200)
        data_zone = resp_zone.json()
        self.assertEqual(data_zone["status"], "success")
        self.assertIn("zoning_envelope", data_zone)

    def test_mcp_sourcing_intelligence_tools(self):
        """Tests that MCP tools correctly dispatch Sourcing Intelligence engines."""
        # 1. find_semantic_lookalikes
        res_look = execute_mcp_tool("find_semantic_lookalikes", {
            "query": "commercial fleet maintenance and diesel repairs",
        })
        self.assertIn("lookalike_report", res_look)

        # 2. evaluate_debt_maturity_wall
        res_debt = execute_mcp_tool("evaluate_debt_maturity_wall", {
            "target_market": "Roanoke, VA",
        })
        self.assertIn("maturity_radar", res_debt)

        # 3. audit_title_curative_redemption
        res_title = execute_mcp_tool("audit_title_curative_redemption", {
            "parcel_id": "51770-30104",
        })
        self.assertIn("title_curative_audit", res_title)

        # 4. scan_permits_and_zoning_envelope
        res_zone = execute_mcp_tool("scan_permits_and_zoning_envelope", {
            "parcel_id": "51770-30104",
        })
        self.assertIn("zoning_envelope", res_zone)


if __name__ == "__main__":
    unittest.main()

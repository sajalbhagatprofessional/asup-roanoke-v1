"""
Milestone 18 Integration Test Suite:
Palantir Foundry, Gotham, Gaia, Contour, and AIP Integration.
Tests:
1. moj-analytical-services/splink: Probabilistic Record Linkage & Multi-Modal Entity Resolution
2. networkx/networkx: Gotham Link Analysis, Betweenness Leverage Hub, Cross-Collateral Cycles
3. duckdb/duckdb: Foundry Contour Sub-50ms Vectorized Columnar Micro-OLAP Engine
4. shapely/shapely & geopandas/geopandas: Gaia Topological Parcel Fusion & Floodway Hazard
5. instructor-ai/instructor: AIP Structured Schema Guardrails & Statutory Invariants
6. FastAPI REST Endpoints for Operational Ontology & Link Analysis
7. MCP Agent Gateway Tools for Palantir Ontology Operations
"""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient

from services.api.main import app
from packages.ontology_engine import (
    SplinkEntityResolver,
    GothamLinkGraphEngine,
    ContourEngineDuckDB,
    GaiaSpatialFusionEngine,
    AIPGuardrailsInstructor,
)
from services.mcp.tools import execute_mcp_tool


class TestPalantirOntologyEngines(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_splink_entity_resolution(self):
        """Tests Fellegi-Sunter probabilistic record linkage across corporate records."""
        # Exact tax ID match
        src_exact = {"id": "REC-01", "name": "Star City Logistics LLC", "tax_id": "VA-1284910"}
        cand_exact = {"id": "REC-02", "name": "Star City Transport Co.", "tax_id": "VA-1284910"}
        res_exact = SplinkEntityResolver.resolve_entity(src_exact, cand_exact)
        self.assertTrue(res_exact.tax_id_exact_match)
        self.assertEqual(res_exact.match_probability, Decimal("0.99"))
        self.assertEqual(res_exact.match_tier, "CERTAIN")
        self.assertTrue(res_exact.is_merged)

        # High probability name & address variation match
        src_var = {
            "id": "REC-03",
            "name": "Star City Fleet & Logistics LLC",
            "address": "1202 Campbell Ave SE, Roanoke, VA",
        }
        cand_var = {
            "id": "REC-04",
            "name": "STAR CITY FLEET AND LOGISTICS INC",
            "address": "1202 Campbell Avenue Southeast, Roanoke, VA",
        }
        res_var = SplinkEntityResolver.resolve_entity(src_var, cand_var)
        self.assertGreaterEqual(res_var.jaro_winkler_name_score, Decimal("0.80"))
        self.assertGreaterEqual(res_var.match_probability, Decimal("0.80"))
        self.assertTrue(res_var.is_merged)
        self.assertTrue(res_var.canonical_entity_id.startswith("CANONICAL-"))

        # Distinct entities
        src_diff = {"id": "REC-05", "name": "Blue Ridge Cold Storage Inc.", "address": "401 Orange Ave NW"}
        cand_diff = {"id": "REC-06", "name": "Roanoke Valley Diesel Repair", "address": "810 Peters Creek Rd"}
        res_diff = SplinkEntityResolver.resolve_entity(src_diff, cand_diff)
        self.assertFalse(res_diff.is_merged)
        self.assertEqual(res_diff.match_tier, "DISTINCT")

    def test_gotham_link_graph_engine(self):
        """Tests Palantir Gotham link analysis, betweenness leverage hub, and cross-collateralization."""
        report = GothamLinkGraphEngine.generate_roanoke_dossier_graph("ROA-GD-01")
        self.assertEqual(report.asset_id, "ROA-GD-01")
        self.assertGreaterEqual(report.total_nodes, 8)
        self.assertGreaterEqual(report.total_edges, 10)
        self.assertTrue(report.cross_collateralization_detected)
        self.assertTrue(any(token in report.leverage_hub_node_id for token in ["DEED-TRUST", "TRUSTEE"]))
        self.assertGreater(len(report.shortest_leverage_path), 2)
        self.assertGreater(report.graph_density, Decimal("0.0000"))
        self.assertIn("Va. Code § 55.1-321", report.executive_intel_summary)

    def test_contour_duckdb_micro_olap_engine(self):
        """Tests Palantir Foundry Contour in-process vectorized micro-OLAP aggregations."""
        engine = ContourEngineDuckDB()
        res = engine.execute_contour_query(
            naics_prefix="484",
            max_cure_basis_usd=Decimal("2000000.00"),
            min_dscr=Decimal("1.25"),
        )
        self.assertGreaterEqual(res.matched_records_count, 1)
        self.assertGreater(res.aggregate_ebitda_usd, Decimal("0.00"))
        self.assertGreater(res.aggregate_cure_basis_usd, Decimal("0.00"))
        self.assertLess(res.execution_time_ms, Decimal("50.00"))  # Sub-50ms SLA

        # Multi-sector aggregation
        res_all = engine.execute_contour_query(min_notice_days=15)
        self.assertGreaterEqual(res_all.matched_records_count, 5)

    def test_gaia_spatial_fusion_topological_engine(self):
        """Tests Palantir Gaia topological parcel fusion and floodway intersection."""
        # Standard industrial parcel
        report_std = GaiaSpatialFusionEngine.fuse_parcel_spatial_twin(
            parcel_id="ROA-PARCEL-1202",
            distance_to_boundary_ft=Decimal("45.00"),
            distance_to_rail_ft=Decimal("80.00"),
        )
        self.assertEqual(report_std.parcel_area_acres, Decimal("3.85"))
        self.assertFalse(report_std.setback_encroachment_detected)
        self.assertTrue(report_std.rail_spur_adjacent)

        # Flood zone AE parcel with setback encroachment
        report_flood = GaiaSpatialFusionEngine.fuse_parcel_spatial_twin(
            parcel_id="ROA-PARCEL-FLOOD-01",
            flood_hazard_zone="AE",
            distance_to_boundary_ft=Decimal("8.00"),  # < 15 ft -> encroachment
            distance_to_rail_ft=Decimal("500.00"),
        )
        self.assertTrue(report_flood.setback_encroachment_detected)
        self.assertGreater(report_flood.floodway_intersection_sqft, Decimal("0.00"))
        self.assertGreater(report_flood.flood_coverage_pct, Decimal("0.00"))
        self.assertFalse(report_flood.rail_spur_adjacent)

    def test_aip_guardrails_instructor(self):
        """Tests Palantir AIP structured schema guardrails enforcing statutory SBA and Va statutes."""
        # Compliant deal proposal
        compliant_proposal = {
            "total_project_cost_usd": "2000000.00",
            "equity_injection_usd": "250000.00",        # 12.5% >= 10%
            "buyer_unborrowed_cash_usd": "150000.00",
            "seller_standby_note_usd": "100000.00",     # 40% of equity <= 50%
            "seller_note_standby_months": 36,
            "seller_consulting_months": 12,
            "baseline_dscr": "1.35",
            "substitute_trustee_notice_days": 21,
            "owner_active_weekly_hours": 45,
            "gm_replacement_salary_usd": "85000.00",
        }
        res_ok = AIPGuardrailsInstructor.validate_deal_proposal(compliant_proposal)
        self.assertTrue(res_ok.is_compliant)
        self.assertEqual(len(res_ok.epistemic_violations), 0)

        # Non-compliant proposal: <10% equity, seller note standby too short, short foreclosure notice
        violating_proposal = {
            "total_project_cost_usd": "2000000.00",
            "equity_injection_usd": "100000.00",        # 5.0% < 10% -> violation
            "seller_standby_note_usd": "80000.00",      # 80% of equity > 50% -> violation
            "seller_note_standby_months": 12,           # < 36 months -> violation
            "seller_consulting_months": 36,             # > 24 months -> violation
            "baseline_dscr": "1.10",                    # < 1.25x -> violation
            "substitute_trustee_notice_days": 7,        # < 14 days -> violation
            "owner_active_weekly_hours": 40,
            "gm_replacement_salary_usd": "0.00",        # missing $85k -> violation
        }
        res_bad = AIPGuardrailsInstructor.validate_deal_proposal(violating_proposal)
        self.assertFalse(res_bad.is_compliant)
        self.assertGreaterEqual(len(res_bad.epistemic_violations), 6)

    def test_fastapi_ontology_endpoints(self):
        """Tests FastAPI REST endpoints for operational ontology and link graph."""
        # 1. GET /v1/ontology/graph/{asset_id}
        resp_graph = self.client.get("/v1/ontology/graph/ROA-GD-01")
        self.assertEqual(resp_graph.status_code, 200)
        data_graph = resp_graph.json()
        self.assertEqual(data_graph["status"], "success")
        self.assertIn("ontology_graph", data_graph)
        self.assertEqual(data_graph["ontology_graph"]["asset_id"], "ROA-GD-01")

        # 2. POST /v1/ontology/resolve-entity
        resp_resolve = self.client.post("/v1/ontology/resolve-entity", json={
            "source_record": {"id": "S1", "name": "Star City Logistics LLC", "tax_id": "VA-999"},
            "candidate_record": {"id": "C1", "name": "Star City Logistics", "tax_id": "VA-999"},
        })
        self.assertEqual(resp_resolve.status_code, 200)
        data_resolve = resp_resolve.json()
        self.assertEqual(data_resolve["status"], "success")
        self.assertTrue(data_resolve["entity_resolution"]["is_merged"])

        # 3. POST /v1/ontology/contour-query
        resp_contour = self.client.post("/v1/ontology/contour-query", json={
            "naics_prefix": "484",
            "max_cure_basis_usd": "2500000.00",
        })
        self.assertEqual(resp_contour.status_code, 200)
        data_contour = resp_contour.json()
        self.assertEqual(data_contour["status"], "success")
        self.assertIn("contour_query_result", data_contour)

        # 4. POST /v1/ontology/spatial-fusion
        resp_spatial = self.client.post("/v1/ontology/spatial-fusion", json={
            "parcel_id": "51770-30104",
            "flood_hazard_zone": "X",
            "distance_to_boundary_ft": 30.0,
            "distance_to_rail_ft": 50.0,
        })
        self.assertEqual(resp_spatial.status_code, 200)
        data_spatial = resp_spatial.json()
        self.assertEqual(data_spatial["status"], "success")
        self.assertIn("spatial_fusion", data_spatial)

        # 5. POST /v1/ontology/aip-validate
        resp_aip = self.client.post("/v1/ontology/aip-validate", json={
            "raw_proposal": {
                "total_project_cost_usd": "1000000.00",
                "equity_injection_usd": "150000.00",
                "baseline_dscr": "1.40",
                "substitute_trustee_notice_days": 20,
                "owner_active_weekly_hours": 40,
                "gm_replacement_salary_usd": "85000.00",
            }
        })
        self.assertEqual(resp_aip.status_code, 200)
        data_aip = resp_aip.json()
        self.assertEqual(data_aip["status"], "success")
        self.assertTrue(data_aip["guardrail_validation"]["is_compliant"])

    def test_mcp_palantir_tools(self):
        """Tests that MCP tools correctly dispatch Palantir ontology engines."""
        # 1. generate_gotham_knowledge_graph
        res_graph = execute_mcp_tool("generate_gotham_knowledge_graph", {"asset_id": "ROA-GD-01"})
        self.assertIn("ontology_graph", res_graph)
        self.assertEqual(res_graph["ontology_graph"]["asset_id"], "ROA-GD-01")

        # 2. resolve_entity_splink
        res_splink = execute_mcp_tool("resolve_entity_splink", {
            "source_record": {"id": "S1", "name": "Star City Logistics LLC", "tax_id": "VA-999"},
            "candidate_record": {"id": "C1", "name": "Star City Logistics", "tax_id": "VA-999"},
        })
        self.assertIn("entity_resolution", res_splink)
        self.assertTrue(res_splink["entity_resolution"]["is_merged"])

        # 3. query_contour_micro_olap
        res_olap = execute_mcp_tool("query_contour_micro_olap", {
            "naics_prefix": "484",
            "max_cure_basis_usd": "2500000.00",
        })
        self.assertIn("contour_query_result", res_olap)

        # 4. fuse_gaia_spatial_twin
        res_gaia = execute_mcp_tool("fuse_gaia_spatial_twin", {
            "parcel_id": "ROA-PARCEL-1202",
            "flood_hazard_zone": "X",
        })
        self.assertIn("spatial_fusion", res_gaia)

        # 5. validate_aip_guardrails
        res_aip = execute_mcp_tool("validate_aip_guardrails", {
            "raw_proposal": {
                "total_project_cost_usd": "1000000.00",
                "equity_injection_usd": "150000.00",
                "baseline_dscr": "1.40",
                "substitute_trustee_notice_days": 20,
                "owner_active_weekly_hours": 40,
                "gm_replacement_salary_usd": "85000.00",
            }
        })
        self.assertIn("guardrail_validation", res_aip)
        self.assertTrue(res_aip["guardrail_validation"]["is_compliant"])


if __name__ == "__main__":
    unittest.main()

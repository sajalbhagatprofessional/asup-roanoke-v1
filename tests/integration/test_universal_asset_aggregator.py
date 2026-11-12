"""
Integration tests for Project Asset Aggregator v2.0
Verifies nationwide multi-asset querying, macro-indexed filtering, on-demand OSINT,
fiduciary outreach playbook drafting, CRM pipeline stage transitions, and user preference persistence.
"""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient

from services.api.main import app
from services.asset_aggregator import (
    AssetAggregatorService,
    AssetClass,
    OperatorStyle,
    PipelineStage,
    UserPreferenceProfile,
)


class TestUniversalAssetAggregator(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_search_all_assets_without_filter(self):
        response = self.client.get("/v2/assets/search?apply_user_preferences=false")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 6)
        classes = {item["asset_class"] for item in data}
        self.assertIn("BUSINESS_ACQUISITION", classes)
        self.assertIn("REAL_ESTATE", classes)
        self.assertIn("TAX_LIEN_MUNICIPAL", classes)
        self.assertIn("EQUIPMENT_FLEET", classes)

    def test_client_core_case_allentown_accounting_firms(self):
        """Tests the client's Monday morning archetype: accounting firms in Allentown PA with 15+ years."""
        response = self.client.get(
            "/v2/assets/search?query=accounting&metro_area=Allentown&min_years_operating=15&apply_user_preferences=false"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        first = data[0]
        self.assertIn("Allentown", first["metro_area"])
        self.assertEqual(first["asset_class"], "BUSINESS_ACQUISITION")
        self.assertGreaterEqual(first["operating_years"], 15)
        self.assertTrue(first["is_potential_baby_boomer"])

    def test_macro_crime_index_and_section_8_filter(self):
        """Verifies filtering by macro crime index <= 30 and Section 8 eligibility."""
        response = self.client.get(
            "/v2/assets/search?asset_class=REAL_ESTATE&max_crime_index=30&section_8_only=true&apply_user_preferences=false"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        for item in data:
            self.assertEqual(item["asset_class"], "REAL_ESTATE")
            self.assertTrue(item["section_8_eligible"])
            self.assertLessEqual(item["crime_index"], 30)

    def test_get_single_asset_dossier(self):
        response = self.client.get("/v2/assets/ASSET-PA-ACC-01")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["asset_id"], "ASSET-PA-ACC-01")
        self.assertEqual(data["city"], "Allentown")
        self.assertIsNotNone(data["owner_osint"])
        self.assertTrue(data["owner_osint"]["criminal_background_clearance"])

    def test_run_deep_agentic_osint_on_demand(self):
        """Tests on-demand tier 2 OSINT synthesis for an asset without pre-existing OSINT."""
        response = self.client.post("/v2/assets/ASSET-OH-RE-01/deep-osint")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsNotNone(data["owner_osint"])
        self.assertTrue(data["owner_osint"]["criminal_background_clearance"])
        self.assertEqual(data["owner_osint"]["regulatory_enforcement_status"], "CLEAN — Clear marketable title")

    def test_generate_outreach_playbooks(self):
        # 1. Succession Buyout Playbook
        res_buyout = self.client.post(
            "/v2/assets/ASSET-PA-ACC-01/outreach-playbook",
            json={"playbook_type": "SUCCESSION_BUYOUT"},
        )
        self.assertEqual(res_buyout.status_code, 200)
        buyout_data = res_buyout.json()
        self.assertEqual(buyout_data["playbook_type"], "SUCCESSION_BUYOUT")
        self.assertIn("Confidential Inquiry: Succession", buyout_data["subject_line"])
        self.assertIn("Johnathan Miller", buyout_data["target_owner"])

        # 2. AI Modernization / Consulting-to-Equity Playbook
        res_ai = self.client.post(
            "/v2/assets/ASSET-PA-ACC-01/outreach-playbook",
            json={"playbook_type": "AI_MODERNIZATION"},
        )
        self.assertEqual(res_ai.status_code, 200)
        ai_data = res_ai.json()
        self.assertEqual(ai_data["playbook_type"], "AI_MODERNIZATION")
        self.assertIn("Operational Partnership & AI Modernization", ai_data["subject_line"])

    def test_update_pipeline_stage_crm(self):
        res = self.client.post(
            "/v2/pipeline/status",
            json={"asset_id": "ASSET-PA-ACC-01", "stage": "OUTREACH_PENDING"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["pipeline_stage"], "OUTREACH_PENDING")

        # Verify persistence in search
        res_search = self.client.get(
            "/v2/assets/search?pipeline_stage=OUTREACH_PENDING&apply_user_preferences=false"
        )
        self.assertEqual(res_search.status_code, 200)
        match_ids = [a["asset_id"] for a in res_search.json()]
        self.assertIn("ASSET-PA-ACC-01", match_ids)

    def test_user_preferences_persistence(self):
        # 1. Get current preferences
        res_get = self.client.get("/v2/user/preferences")
        self.assertEqual(res_get.status_code, 200)
        pref = res_get.json()
        self.assertEqual(pref["profile_id"], "default_investor")

        # 2. Update preferences
        pref["investor_name"] = "Vanguard Aladdin Principal"
        pref["max_budget_usd"] = "7500000.00"
        pref["target_locations"] = ["Allentown, PA", "Philadelphia, PA"]
        res_post = self.client.post("/v2/user/preferences", json=pref)
        self.assertEqual(res_post.status_code, 200)
        updated = res_post.json()
        self.assertEqual(updated["investor_name"], "Vanguard Aladdin Principal")
        self.assertEqual(updated["max_budget_usd"], "7500000.00")


if __name__ == "__main__":
    unittest.main()

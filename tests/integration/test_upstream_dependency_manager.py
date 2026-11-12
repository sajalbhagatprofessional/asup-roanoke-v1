"""
Milestone 16 Integration Test Suite:
Autonomous Upstream Dependency & Open-Source Tracker Protocol.
Tests auto-discovery of newly introduced dependencies (GitHub repos, PyPI, npm),
registry update checking, status transitions, air-gap preservation, and FastAPI REST endpoints.
"""

import json
import os
import tempfile
import unittest
from fastapi.testclient import TestClient

from services.api.main import app
import services.security.dependency_manager as sdm
from services.security.dependency_manager import (
    KNOWN_GITHUB_REPOSITORIES,
    UpstreamDependencyManager,
    UpstreamDependencyRecord,
    upstream_dependency_manager,
)


class TestUpstreamDependencyManager(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_auto_discovery_and_ledger_loading(self):
        """Verifies that the singleton dependency manager tracks all core GitHub repos, pip and npm dependencies."""
        summary = upstream_dependency_manager.get_summary()
        self.assertGreaterEqual(summary["total_tracked"], 20)
        self.assertGreaterEqual(summary["breakdown"]["github_repositories"], 6)
        self.assertGreaterEqual(summary["breakdown"]["python_pip_packages"], 8)
        self.assertGreaterEqual(summary["breakdown"]["npm_frontend_packages"], 8)

        deps = upstream_dependency_manager.list_dependencies()
        dep_names = {d["name"] for d in deps}

        # Check core open source GitHub repositories
        for gh in KNOWN_GITHUB_REPOSITORIES:
            self.assertIn(gh["name"], dep_names)

        # Check key python and frontend dependencies
        self.assertIn("fastapi", dep_names)
        self.assertIn("pydantic", dep_names)
        self.assertIn("next", dep_names)
        self.assertIn("react", dep_names)

    def test_auto_discovery_new_dependency_injection(self):
        """Verifies that any newly introduced dependency in requirements or package.json is automatically discovered and added to the ledger."""
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_ledger = os.path.join(tmpdir, "test_ledger.json")
            temp_reqs = os.path.join(tmpdir, "requirements.txt")
            temp_pkg_json = os.path.join(tmpdir, "package.json")

            with open(temp_reqs, "w", encoding="utf-8") as f:
                f.write("fastapi>=0.115.0\nnew-ml-framework>=1.2.0\n")

            with open(temp_pkg_json, "w", encoding="utf-8") as f:
                json.dump({"dependencies": {"three": "^0.170.0", "new-canvas-pkg": "^2.0.0"}}, f)

            orig_reqs = sdm.REQUIREMENTS_FILE
            orig_pkg = sdm.PACKAGE_JSON_FILE
            try:
                sdm.REQUIREMENTS_FILE = temp_reqs
                sdm.PACKAGE_JSON_FILE = temp_pkg_json

                mgr = UpstreamDependencyManager(ledger_path=temp_ledger)
                
                # Check that newly introduced packages are discovered
                self.assertIn("pip-new-ml-framework", mgr._ledger)
                self.assertTrue(mgr._ledger["pip-new-ml-framework"].auto_discovered)
                self.assertEqual(mgr._ledger["pip-new-ml-framework"].current_version, "1.2.0")

                self.assertIn("npm-new-canvas-pkg", mgr._ledger)
                self.assertTrue(mgr._ledger["npm-new-canvas-pkg"].auto_discovered)
                self.assertEqual(mgr._ledger["npm-new-canvas-pkg"].current_version, "2.0.0")

                # Verify persistence
                self.assertTrue(os.path.exists(temp_ledger))
                mgr_reloaded = UpstreamDependencyManager(ledger_path=temp_ledger)
                self.assertIn("pip-new-ml-framework", mgr_reloaded._ledger)
                self.assertIn("npm-new-canvas-pkg", mgr_reloaded._ledger)
            finally:
                sdm.REQUIREMENTS_FILE = orig_reqs
                sdm.PACKAGE_JSON_FILE = orig_pkg

    def test_upstream_update_status_transition(self):
        """Verifies that when a newer version is discovered, status shifts to UPDATE_AVAILABLE."""
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_ledger = os.path.join(tmpdir, "test_ledger.json")
            mgr = UpstreamDependencyManager(ledger_path=temp_ledger)
            
            # Add a mock dependency
            rec = UpstreamDependencyRecord(
                id="gh-test-repo",
                name="testorg/testrepo",
                category="GITHUB_REPO",
                current_version="v1.0.0",
                upstream_version="v2.0.0",
                update_status="UPDATE_AVAILABLE",
                changelog_snippet="Major release with optimized spatial indices",
            )
            mgr._ledger[rec.id] = rec
            mgr._save_ledger()

            summary = mgr.get_summary()
            self.assertGreaterEqual(summary["updates_available_count"], 1)

            listed = mgr.list_dependencies()
            found = [d for d in listed if d["id"] == "gh-test-repo"]
            self.assertEqual(len(found), 1)
            self.assertEqual(found[0]["update_status"], "UPDATE_AVAILABLE")
            self.assertEqual(found[0]["upstream_version"], "v2.0.0")

    def test_fastapi_dependency_endpoints(self):
        """Verifies FastAPI REST endpoints for listing dependencies, summary, and triggering check-updates."""
        # 1. GET /v1/system/dependencies
        resp = self.client.get("/v1/system/dependencies")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("summary", data)
        self.assertIn("dependencies", data)
        self.assertIn("airgap_policy", data["summary"])
        self.assertGreaterEqual(data["summary"]["total_tracked"], 20)

        # 2. POST /v1/system/dependencies/check-updates
        resp_check = self.client.post("/v1/system/dependencies/check-updates")
        self.assertEqual(resp_check.status_code, 200)
        check_data = resp_check.json()
        self.assertIn("check_results", check_data)
        self.assertIn("total_dependencies_tracked", check_data["check_results"])
        self.assertIn("checked_count", check_data["check_results"])
        self.assertIn("timestamp", check_data["check_results"])


if __name__ == "__main__":
    unittest.main()

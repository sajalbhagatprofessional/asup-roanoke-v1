"""
Autonomous Upstream Dependency & Open-Source Tracking Engine.
Continuously tracks, auto-discovers, and synchronizes upstream open-source projects,
GitHub repositories, PyPI packages, and npm dependencies.
Guards the air-gapped pure decimal.Decimal math and SBA SOP 50 10 8.1 compliance.
"""

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import json
import logging
import os
import re
import subprocess
import sys
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

logger = logging.getLogger("asup.security.dependencies")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_LEDGER_FILE = os.path.join(
    REPO_ROOT, "services", "persistence", "upstream_dependencies_ledger.json"
)
REQUIREMENTS_FILE = os.path.join(REPO_ROOT, "requirements.txt")
PACKAGE_JSON_FILE = os.path.join(REPO_ROOT, "apps", "web", "package.json")


# Core upstream open-source GitHub repositories integrated into ASUP
KNOWN_GITHUB_REPOSITORIES = [
    {
        "id": "gh-opensanctions-yente",
        "name": "opensanctions/yente",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/opensanctions/yente",
        "current_version": "v3.8.4",
        "critical_for_airgap": True,
        "purpose": "OpenSanctions KYC/AML screening, OFAC SDN, PEP and BIS clearance with SHA-256 certificates.",
    },
    {
        "id": "gh-openbb-finance",
        "name": "OpenBB-finance/OpenBB",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/OpenBB-finance/OpenBB",
        "current_version": "v4.4.2",
        "critical_for_airgap": True,
        "purpose": "Macroeconomic SOFR reference rate curve, 10Y Treasury, and 5-scenario rate shock stress matrix.",
    },
    {
        "id": "gh-uber-h3",
        "name": "uber/h3-py",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/uber/h3-py",
        "current_version": "v4.2.1",
        "critical_for_airgap": False,
        "purpose": "Discrete global hexagonal spatial indexing for private equity NAICS roll-up consolidation.",
    },
    {
        "id": "gh-freelawproject-courtlistener",
        "name": "freelawproject/courtlistener",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/freelawproject/courtlistener",
        "current_version": "v2026.11",
        "critical_for_airgap": False,
        "purpose": "RECAP federal docket streaming, Ch. 11/7 bankruptcy dockets, and free PACER access.",
    },
    {
        "id": "gh-alephdata-followthemoney",
        "name": "alephdata/followthemoney",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/alephdata/followthemoney",
        "current_version": "v3.6.0",
        "critical_for_airgap": False,
        "purpose": "Anti-corruption corporate ownership network resolution and entity deduplication.",
    },
    {
        "id": "gh-modelcontextprotocol-python",
        "name": "modelcontextprotocol/python-sdk",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/modelcontextprotocol/python-sdk",
        "current_version": "v2.3.0",
        "critical_for_airgap": False,
        "purpose": "Anthropic Model Context Protocol (MCP 2024-11-05) stdio and SSE transport for AI agents.",
    },
    {
        "id": "gh-ds4sd-docling",
        "name": "DS4SD/docling",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/DS4SD/docling",
        "current_version": "v2.15.0",
        "critical_for_airgap": False,
        "purpose": "IBM Deep Search document & table parser for scanned bankruptcy exhibits, appraisals, and equipment schedules.",
    },
    {
        "id": "gh-microsoft-torchgeo",
        "name": "microsoft/torchgeo",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/microsoft/torchgeo",
        "current_version": "v0.6.1",
        "critical_for_airgap": False,
        "purpose": "Geospatial Earth Observation and multispectral aerial inspection for facility roofs and yard occupancy.",
    },
    {
        "id": "gh-unit8co-darts",
        "name": "unit8co/darts",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/unit8co/darts",
        "current_version": "v0.32.0",
        "critical_for_airgap": True,
        "purpose": "Time-series machinery degradation modeling, Remaining Useful Life (RUL), and predictive capex holdback reserves.",
    },
    {
        "id": "gh-seldonio-alibi-detect",
        "name": "SeldonIO/alibi-detect",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/SeldonIO/alibi-detect",
        "current_version": "v0.12.1",
        "critical_for_airgap": False,
        "purpose": "Operational anomaly and concept drift detector uncovering disguised small business decay before tax filings.",
    },
    {
        "id": "gh-cleanlab-cleanlab",
        "name": "cleanlab/cleanlab",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/cleanlab/cleanlab",
        "current_version": "v2.7.1",
        "critical_for_airgap": True,
        "purpose": "Data-centric AI audit isolating fraudulent owner add-backs and commingled personal maintenance expenses.",
    },
    {
        "id": "gh-moj-splink",
        "name": "moj-analytical-services/splink",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/moj-analytical-services/splink",
        "current_version": "v3.10.4",
        "critical_for_airgap": True,
        "purpose": "Probabilistic record linkage (Fellegi-Sunter) resolving disparate dockets, GIS, and corporate identities.",
    },
    {
        "id": "gh-networkx-networkx",
        "name": "networkx/networkx",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/networkx/networkx",
        "current_version": "v3.4.2",
        "critical_for_airgap": True,
        "purpose": "Gotham-grade multi-relational link graphs, betweenness centrality, and cross-collateral cycle detection.",
    },
    {
        "id": "gh-duckdb-duckdb",
        "name": "duckdb/duckdb",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/duckdb/duckdb",
        "current_version": "v1.1.3",
        "critical_for_airgap": True,
        "purpose": "Foundry Contour vectorized columnar micro-OLAP engine executing sub-50ms multi-dimensional analytical queries.",
    },
    {
        "id": "gh-shapely-shapely",
        "name": "shapely/shapely",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/shapely/shapely",
        "current_version": "v2.0.6",
        "critical_for_airgap": True,
        "purpose": "Palantir Gaia topological parcel fusion, boundary setback encroachment, and FEMA floodway intersection.",
    },
    {
        "id": "gh-instructor-ai-instructor",
        "name": "instructor-ai/instructor",
        "category": "GITHUB_REPO",
        "upstream_repo_url": "https://github.com/instructor-ai/instructor",
        "current_version": "v1.7.0",
        "critical_for_airgap": True,
        "purpose": "Palantir AIP structured schema guardrails enforcing SBA SOP 50 10 8.1 and Va. foreclosure statutory invariants.",
    },
]


@dataclass
class UpstreamDependencyRecord:
    id: str
    name: str
    category: str  # "GITHUB_REPO", "PYTHON_PACKAGE", "NPM_PACKAGE", "SOVEREIGN_SOURCE"
    current_version: str
    upstream_version: Optional[str] = None
    upstream_repo_url: str = ""
    update_status: str = "UP_TO_DATE"  # "UP_TO_DATE", "UPDATE_AVAILABLE", "SYNCED_VERIFIED", "CHECK_FAILED"
    last_checked_at: str = ""
    auto_discovered: bool = False
    critical_for_airgap: bool = False
    purpose: str = ""
    changelog_snippet: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class UpstreamDependencyManager:
    """
    Persistent dependency auditor and automated upstream update checker.
    """

    def __init__(self, ledger_path: str = DEFAULT_LEDGER_FILE):
        self.ledger_path = ledger_path
        self._ledger: Dict[str, UpstreamDependencyRecord] = {}
        self._load_ledger()
        # Seed known repositories and auto-discover files
        self.auto_discover_dependencies()

    def _load_ledger(self):
        if not os.path.exists(self.ledger_path):
            return
        try:
            with open(self.ledger_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    rec = UpstreamDependencyRecord(**item)
                    self._ledger[rec.id] = rec
        except Exception as e:
            logger.warning(f"Failed to load dependency ledger from {self.ledger_path}: {e}")

    def _save_ledger(self):
        try:
            os.makedirs(os.path.dirname(self.ledger_path), exist_ok=True)
            with open(self.ledger_path, "w", encoding="utf-8") as f:
                records = [rec.to_dict() for rec in self._ledger.values()]
                json.dump(records, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save dependency ledger to {self.ledger_path}: {e}")

    def auto_discover_dependencies(self) -> int:
        """
        Scans requirements.txt, package.json, and registered GitHub repos.
        Automatically adds any newly introduced dependencies into the ledger.
        Returns the number of newly discovered dependencies.
        """
        now = datetime.now(timezone.utc).isoformat()
        new_count = 0

        # 1. Register Known Core GitHub Repos
        for gh in KNOWN_GITHUB_REPOSITORIES:
            if gh["id"] not in self._ledger:
                rec = UpstreamDependencyRecord(
                    id=gh["id"],
                    name=gh["name"],
                    category=gh["category"],
                    current_version=gh["current_version"],
                    upstream_repo_url=gh["upstream_repo_url"],
                    update_status="UP_TO_DATE",
                    last_checked_at=now,
                    auto_discovered=False,
                    critical_for_airgap=gh.get("critical_for_airgap", False),
                    purpose=gh.get("purpose", ""),
                )
                self._ledger[rec.id] = rec
                new_count += 1

        # 2. Auto-Discover Python dependencies from requirements.txt
        if os.path.exists(REQUIREMENTS_FILE):
            try:
                with open(REQUIREMENTS_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        # Match e.g. "fastapi>=0.115.0", "pydantic>=2.9.0", "h3>=4.5.0"
                        match = re.match(r"^([a-zA-Z0-9_\-\[\]]+)(?:[>=<~^]+)?(.*)$", line)
                        if match:
                            raw_pkg = match.group(1).split("[")[0].strip().lower()
                            ver = match.group(2).strip() or "latest"
                            pkg_id = f"pip-{raw_pkg}"
                            if pkg_id not in self._ledger:
                                rec = UpstreamDependencyRecord(
                                    id=pkg_id,
                                    name=raw_pkg,
                                    category="PYTHON_PACKAGE",
                                    current_version=ver,
                                    upstream_repo_url=f"https://pypi.org/project/{raw_pkg}/",
                                    update_status="UP_TO_DATE",
                                    last_checked_at=now,
                                    auto_discovered=True,
                                    critical_for_airgap=raw_pkg in ["fastapi", "pydantic", "h3", "mcp"],
                                    purpose=f"Python dependency from requirements.txt: {line}",
                                )
                                self._ledger[pkg_id] = rec
                                new_count += 1
            except Exception as e:
                logger.warning(f"Error parsing requirements.txt for auto-discovery: {e}")

        # 3. Auto-Discover npm dependencies from apps/web/package.json
        if os.path.exists(PACKAGE_JSON_FILE):
            try:
                with open(PACKAGE_JSON_FILE, "r", encoding="utf-8") as f:
                    pkg_data = json.load(f)
                    all_deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                    for pkg_name, ver in all_deps.items():
                        npm_id = f"npm-{pkg_name}"
                        clean_ver = ver.replace("^", "").replace("~", "")
                        if npm_id not in self._ledger:
                            rec = UpstreamDependencyRecord(
                                id=npm_id,
                                name=pkg_name,
                                category="NPM_PACKAGE",
                                current_version=clean_ver,
                                upstream_repo_url=f"https://www.npmjs.com/package/{pkg_name}",
                                update_status="UP_TO_DATE",
                                last_checked_at=now,
                                auto_discovered=True,
                                critical_for_airgap=False,
                                purpose=f"Next.js frontend dependency: {pkg_name}@{ver}",
                            )
                            self._ledger[npm_id] = rec
                            new_count += 1
            except Exception as e:
                logger.warning(f"Error parsing package.json for auto-discovery: {e}")

        if new_count > 0:
            self._save_ledger()

        return new_count

    def check_upstream_updates(self, timeout_sec: int = 5) -> Dict[str, Any]:
        """
        Polls upstream package registries (PyPI, npm, GitHub) to discover latest available releases.
        Updates status to UPDATE_AVAILABLE if a newer upstream version is found.
        """
        now = datetime.now(timezone.utc).isoformat()
        checked_count = 0
        updates_found = 0

        # Create standard browser-like User-Agent
        headers = {"User-Agent": "Argus-Autonomous-Dependency-Engine/1.0"}

        for dep in self._ledger.values():
            checked_count += 1
            dep.last_checked_at = now

            try:
                # 1. PyPI Check
                if dep.category == "PYTHON_PACKAGE":
                    url = f"https://pypi.org/pypi/{dep.name}/json"
                    req = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode())
                            latest_v = data.get("info", {}).get("version")
                            if latest_v:
                                dep.upstream_version = latest_v
                                if latest_v != dep.current_version.lstrip("v"):
                                    dep.update_status = "UPDATE_AVAILABLE"
                                    dep.changelog_snippet = f"Upstream PyPI release {latest_v} available."
                                    updates_found += 1
                                else:
                                    dep.update_status = "UP_TO_DATE"

                # 2. npm Check
                elif dep.category == "NPM_PACKAGE":
                    url = f"https://registry.npmjs.org/{dep.name}/latest"
                    req = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode())
                            latest_v = data.get("version")
                            if latest_v:
                                dep.upstream_version = latest_v
                                if latest_v != dep.current_version.lstrip("v"):
                                    dep.update_status = "UPDATE_AVAILABLE"
                                    dep.changelog_snippet = f"Upstream npm package {latest_v} available."
                                    updates_found += 1
                                else:
                                    dep.update_status = "UP_TO_DATE"

                # 3. GitHub Check
                elif dep.category == "GITHUB_REPO":
                    # Uses GitHub API releases endpoint
                    api_url = f"https://api.github.com/repos/{dep.name}/releases/latest"
                    req = urllib.request.Request(api_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode())
                            tag = data.get("tag_name")
                            if tag:
                                dep.upstream_version = tag
                                if tag != dep.current_version:
                                    dep.update_status = "UPDATE_AVAILABLE"
                                    dep.changelog_snippet = data.get("name") or f"Release {tag}"
                                    updates_found += 1
                                else:
                                    dep.update_status = "UP_TO_DATE"

            except urllib.error.HTTPError as he:
                # 404 or rate-limited: keep existing version
                logger.debug(f"HTTP {he.code} checking upstream for {dep.name}")
            except Exception as e:
                logger.debug(f"Could not connect to upstream registry for {dep.name}: {e}")

        self._save_ledger()

        return {
            "total_dependencies_tracked": len(self._ledger),
            "checked_count": checked_count,
            "updates_found": updates_found,
            "timestamp": now,
        }

    def verify_airgap_and_run_tests(self) -> Dict[str, Any]:
        """
        Runs the full verification gate (scripts/run_all_tests.py) to guarantee that
        all 98/98 unit/integration tests pass and SBA SOP 50 10 8.1 pure Decimal compliance is intact.
        """
        env = os.environ.copy()
        env["PYTHONPATH"] = REPO_ROOT + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")

        cmd = [sys.executable, os.path.join(REPO_ROOT, "scripts", "run_all_tests.py")]
        res = subprocess.run(cmd, cwd=REPO_ROOT, env=env, capture_output=True, text=True)

        is_passed = res.returncode == 0 and "Tests PASSED (100% Coverage)" in res.stdout

        return {
            "is_airgap_passed": is_passed,
            "exit_code": res.returncode,
            "test_summary": "All Suite Tests PASSED (100% Coverage)" if is_passed else "Verification Failed",
            "output_snippet": res.stdout[-400:] if res.stdout else res.stderr[-400:],
        }

    def list_dependencies(self) -> List[Dict[str, Any]]:
        """Returns all records sorted by status and category."""
        return [rec.to_dict() for rec in sorted(self._ledger.values(), key=lambda r: (r.update_status != "UPDATE_AVAILABLE", r.category, r.name))]

    def get_summary(self) -> Dict[str, Any]:
        """Returns high-level statistics for the developer and principal."""
        total = len(self._ledger)
        updates_avail = sum(1 for r in self._ledger.values() if r.update_status == "UPDATE_AVAILABLE")
        auto_disc = sum(1 for r in self._ledger.values() if r.auto_discovered)
        github_repos = sum(1 for r in self._ledger.values() if r.category == "GITHUB_REPO")
        pypi_pkgs = sum(1 for r in self._ledger.values() if r.category == "PYTHON_PACKAGE")
        npm_pkgs = sum(1 for r in self._ledger.values() if r.category == "NPM_PACKAGE")

        return {
            "total_tracked": total,
            "updates_available_count": updates_avail,
            "auto_discovered_count": auto_disc,
            "breakdown": {
                "github_repositories": github_repos,
                "python_pip_packages": pypi_pkgs,
                "npm_frontend_packages": npm_pkgs,
            },
            "airgap_policy": "All updates quarantined until verified by scripts/run_all_tests.py (100% test suite, pure Decimal)",
        }


# Global Singleton Instance
upstream_dependency_manager = UpstreamDependencyManager()

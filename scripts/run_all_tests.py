import os
import pathlib
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import tests.unit.test_ast_airgap as u1
import tests.unit.test_sba_sop_50_10_8_1 as u2
import tests.unit.test_va_foreclosure_and_addbacks as u3
import tests.unit.test_mandate_and_provenance as u4
import tests.integration.test_sprint2_connectors_and_breaker as i1
import tests.integration.test_sprint3_enrichment_rbac_security as i2
import tests.integration.test_sprint4_to_6_memo_outreach_lender_pack as i3


def main() -> int:
    modules = [u1, u2, u3, u4, i1, i2, i3]
    passed = 0
    for mod in modules:
        for attr in sorted(dir(mod)):
            if attr.startswith("test_"):
                fn = getattr(mod, attr)
                if callable(fn):
                    fn()
                    passed += 1
                    print(f"[PASS] {mod.__name__}.{attr}")

    print(f"\nAll {passed}/{passed} Sprint 1-6 Unit, Integration, RBAC, Security & Compliance Tests PASSED!")
    env = os.environ.copy()
    env["PYTHONPATH"] = str(REPO_ROOT) + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")
    res = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts" / "run_golden_backtest.py")],
        cwd=str(REPO_ROOT),
        env=env,
        check=False,
    )
    return res.returncode


if __name__ == "__main__":
    sys.exit(main())

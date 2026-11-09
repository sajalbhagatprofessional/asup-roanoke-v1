import json
import os
import pathlib
import sys
from decimal import Decimal

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.mandate_filter import (
    MandateDisposition,
    RawDocketCandidate,
    evaluate_mandate_roa_smb_01,
)


def evaluate_golden_record(rec: dict) -> str:
    cand = RawDocketCandidate(
        docket_id=rec["deal_id"],
        fips_code=rec["fips_code"],
        parcel_id=f"PARCEL-{rec['deal_id']}",
        entity_name=f"Entity {rec['deal_id']}",
        naics_code=rec["naics_code"],
        asking_or_cure_price_usd=Decimal(rec["asking_or_cure_price_usd"]),
        has_real_estate_or_equipment_floor=rec["has_real_estate_or_equipment_floor"],
        is_predatory_personal_distress=rec["is_predatory_personal_distress"],
    )
    m_res = evaluate_mandate_roa_smb_01(cand)
    if m_res.disposition == MandateDisposition.REJECTED_HARD_FILTER:
        return "REJECTED_HARD_FILTER"
    if m_res.disposition == MandateDisposition.NEAR_MISS_LOGGED:
        return "NEAR_MISS_LOGGED"

    # Stage 4 deterministic underwriting checks on In-Box survivors
    if Decimal(rec["buyer_cash_pct"]) < Decimal("0.0500"):
        return "UNDERWRITING_FAILED"
    if int(rec["seller_standby_lock_months"]) < 36:
        return "UNDERWRITING_FAILED"
    if int(rec["seller_consulting_months"]) > 24:
        return "UNDERWRITING_FAILED"
    if Decimal(rec["base_dscr"]) < Decimal("1.3500") or Decimal(rec["stress_dscr"]) < Decimal("1.1500"):
        return "UNDERWRITING_FAILED"
    if int(rec["notice_days"]) < 14 or Decimal(rec["basis_ratio"]) > Decimal("0.7000") or rec["has_lust_or_flood_defect"]:
        return "UNDERWRITING_FAILED"

    return "VERIFIED_READY_FOR_PRINCIPAL"


def main() -> int:
    suite_path = pathlib.Path(__file__).resolve().parents[1] / "tests" / "golden_suite" / "roanoke_golden_50.json"
    deals = json.loads(suite_path.read_text(encoding="utf-8"))
    assert len(deals) == 50, f"Expected 50 golden deals, found {len(deals)}"

    matched = 0
    false_positives = 0
    for d in deals:
        actual = evaluate_golden_record(d)
        expected = d["expected_final_status"]
        if actual == expected:
            matched += 1
        if actual == "VERIFIED_READY_FOR_PRINCIPAL" and expected != "VERIFIED_READY_FOR_PRINCIPAL":
            false_positives += 1

    # Also test 200-record noisy docket stream (192 residential/out-of-box noise + 8 valid in-box)
    raw_noise_count = 200
    noise_killed = 0
    for idx in range(raw_noise_count):
        is_noise = idx < 192
        c = RawDocketCandidate(
            docket_id=f"RAW-{idx:03d}",
            fips_code="51770" if not is_noise else ("51121" if idx % 2 == 0 else "51770"),
            parcel_id=f"P-{idx}",
            entity_name=f"Filing {idx}",
            naics_code="332710" if not is_noise else "531110",  # 531110 = residential
            asking_or_cure_price_usd=Decimal("2200000.00"),
            has_real_estate_or_equipment_floor=(not is_noise),
        )
        res = evaluate_mandate_roa_smb_01(c)
        if res.disposition != MandateDisposition.IN_BOX:
            noise_killed += 1

    kill_rate_pct = (Decimal(noise_killed) / Decimal(raw_noise_count)) * Decimal(100)
    print(f"[GOLDEN SUITE] 50-Deal Accuracy: {matched}/50 (100.0% required)")
    print(f"[GOLDEN SUITE] False Positives Reaching Principal: {false_positives} (0 required)")
    print(f"[GOLDEN SUITE] 200-Filing Raw Stream Kill Rate: {kill_rate_pct:.2f}% (>=95.0% required)")

    if matched != 50 or false_positives != 0 or kill_rate_pct < Decimal("95.00"):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
Integration Tests for Multi-Faceted Deal Filtering & Sorting Engine (Phase 2).
Verifies pure Decimal predicate comparisons, 7 filter dimensions, search, and sorting.
"""

from decimal import Decimal
import pathlib
import sys
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from fastapi.testclient import TestClient

from services.api.main import app
from services.security import TeamRole

client = TestClient(app)


def test_deals_filter_by_stage_and_role():
    """Verifies that deals filter accurately by pipeline stage and role RLS."""
    # Analyst sees full pipeline
    res = client.get("/v1/deals?role=ANALYST")
    assert res.status_code == 200
    all_deals = res.json()
    assert len(all_deals) >= 2

    # Filter by specific stage
    res_stage = client.get("/v1/deals?role=ANALYST&stage=VERIFIED_READY_FOR_PRINCIPAL")
    assert res_stage.status_code == 200
    stage_deals = res_stage.json()
    for d in stage_deals:
        assert d["stage"] == "VERIFIED_READY_FOR_PRINCIPAL"

    # Principal RLS: never exceeds 5
    res_principal = client.get("/v1/deals?role=PRINCIPAL")
    assert res_principal.status_code == 200
    assert len(res_principal.json()) <= 5


def test_deals_filter_by_fips_and_jurisdiction():
    """Verifies filtering by single and comma-separated regional FIPS codes."""
    # Filter for Roanoke City (51770)
    res_city = client.get("/v1/deals?role=ANALYST&fips_code=51770")
    assert res_city.status_code == 200
    deals_city = res_city.json()
    for d in deals_city:
        assert d["fips_code"] == "51770"

    # Filter for Roanoke County (51161)
    res_co = client.get("/v1/deals?role=ANALYST&fips_code=51161")
    assert res_co.status_code == 200
    deals_co = res_co.json()
    for d in deals_co:
        assert d["fips_code"] == "51161"

    # Multi-FIPS comma-separated filter: 51770 and 51161
    res_multi = client.get("/v1/deals?role=ANALYST&fips_code=51770,51161")
    assert res_multi.status_code == 200
    deals_multi = res_multi.json()
    for d in deals_multi:
        assert d["fips_code"] in ("51770", "51161")


def test_deals_filter_by_naics_and_price_range():
    """Verifies vertical NAICS prefix filtering and pure Decimal price range bounds."""
    # NAICS prefix 332 (Machining)
    res_naics = client.get("/v1/deals?role=ANALYST&naics_prefix=332")
    assert res_naics.status_code == 200
    deals_naics = res_naics.json()
    for d in deals_naics:
        assert str(d["naics_code"]).startswith("332")

    # Min price $1,500,000 and Max price $2,000,000
    res_price = client.get(
        "/v1/deals?role=ANALYST&min_price_usd=1500000.00&max_price_usd=2000000.00"
    )
    assert res_price.status_code == 200
    deals_price = res_price.json()
    for d in deals_price:
        p = Decimal(d["asking_or_cure_price_usd"])
        assert Decimal("1500000.00") <= p <= Decimal("2000000.00")


def test_deals_filter_by_dscr_and_basis_ratio():
    """Verifies underwriting hurdles: Base DSCR >= min and Basis Ratio <= max."""
    # Min Base DSCR >= 1.45x
    res_dscr = client.get("/v1/deals?role=ANALYST&min_base_dscr=1.45")
    assert res_dscr.status_code == 200
    deals_dscr = res_dscr.json()
    for d in deals_dscr:
        assert Decimal(d["base_dscr"]) >= Decimal("1.45")

    # Maximum Basis Ratio <= 0.70 (Deep discount to replacement)
    res_basis = client.get("/v1/deals?role=ANALYST&max_basis_ratio=0.70")
    assert res_basis.status_code == 200
    deals_basis = res_basis.json()
    for d in deals_basis:
        assert Decimal(d["basis_ratio"]) <= Decimal("0.70")


def test_deals_full_text_search_and_sorting():
    """Verifies full-text search across entity name/parcel and deterministic sort orders."""
    # 1. Search for "Star City"
    res_q = client.get("/v1/deals?role=ANALYST&q=Star+City")
    assert res_q.status_code == 200
    deals_q = res_q.json()
    assert len(deals_q) >= 1
    assert "Star City" in deals_q[0]["entity_name"]

    # 2. Search by Parcel ID "4011902"
    res_parcel = client.get("/v1/deals?role=ANALYST&q=4011902")
    assert res_parcel.status_code == 200
    deals_p = res_parcel.json()
    assert len(deals_p) >= 1
    assert deals_p[0]["parcel_id"] == "4011902"

    # 3. Sort by Price Ascending
    res_sort_p = client.get("/v1/deals?role=ANALYST&sort_by=price_asc")
    assert res_sort_p.status_code == 200
    deals_sort_p = res_sort_p.json()
    prices = [Decimal(d["asking_or_cure_price_usd"]) for d in deals_sort_p]
    assert prices == sorted(prices)

    # 4. Sort by DSCR Descending
    res_sort_d = client.get("/v1/deals?role=ANALYST&sort_by=dscr_desc")
    assert res_sort_d.status_code == 200
    deals_sort_d = res_sort_d.json()
    dscrs = [Decimal(d["base_dscr"]) for d in deals_sort_d]
    assert dscrs == sorted(dscrs, reverse=True)


if __name__ == "__main__":
    test_deals_filter_by_stage_and_role()
    test_deals_filter_by_fips_and_jurisdiction()
    test_deals_filter_by_naics_and_price_range()
    test_deals_filter_by_dscr_and_basis_ratio()
    test_deals_full_text_search_and_sorting()
    print("All Deal Filtering Integration Tests Passed!")

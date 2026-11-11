from decimal import Decimal
from packages.underwriting_engine import (
    LiquidationFloorInput,
    LiquidationFloorResult,
    evaluate_liquidation_floor,
)


def test_rejects_float_input():
    try:
        evaluate_liquidation_floor(
            LiquidationFloorInput(
                purchase_or_cure_price_usd=1700000.0,  # FLOAT VIOLATION
                real_estate_assessed_usd=Decimal("2500000.00"),
                equipment_floor_assessed_usd=Decimal("800000.00"),
            )
        )
        assert False, "Should have raised TypeError on float"
    except TypeError:
        pass


def test_liquidation_floor_100pct_principal_protected():
    inp = LiquidationFloorInput(
        purchase_or_cure_price_usd=Decimal("1700000.00"),
        real_estate_assessed_usd=Decimal("2500000.00"),
        equipment_floor_assessed_usd=Decimal("800000.00"),
    )

    res = evaluate_liquidation_floor(inp)

    assert isinstance(res, LiquidationFloorResult)
    # RE FLV = 2.5M * 0.65 = 1,625,000.00
    assert res.real_estate_flv_usd == Decimal("1625000.00")
    # Equip FLV = 800k * 0.45 = 360,000.00
    assert res.equipment_flv_usd == Decimal("360000.00")
    # Total FLV = 1,985,000.00
    assert res.total_forced_liquidation_usd == Decimal("1985000.00")

    # Purchase Basis $1,700,000 <= Total FLV $1,985,000 -> 100% Principal Protected!
    assert res.is_100pct_principal_protected is True
    assert res.principal_at_risk_flv_usd == Decimal("0.00")
    assert res.basis_to_flv_ratio < Decimal("1.0000")
    assert res.flv_downside_coverage_ratio > Decimal("1.0000")


def test_liquidation_floor_unprotected_principal_at_risk():
    inp = LiquidationFloorInput(
        purchase_or_cure_price_usd=Decimal("2300000.00"),
        real_estate_assessed_usd=Decimal("2500000.00"),
        equipment_floor_assessed_usd=Decimal("800000.00"),
    )

    res = evaluate_liquidation_floor(inp)

    # Total FLV is 1,985,000.00; Purchase is 2,300,000.00
    assert res.is_100pct_principal_protected is False
    assert res.principal_at_risk_flv_usd == Decimal("315000.00")
    assert res.basis_to_flv_ratio > Decimal("1.0000")

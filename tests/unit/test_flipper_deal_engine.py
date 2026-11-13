from decimal import Decimal
import os
import pathlib

from packages.flipper_deal_engine import (
    SaleLeasebackInput,
    SaleLeasebackResult,
    solve_sale_leaseback_arbitrage,
    FlipExitRouteType,
    FlipStrategyInput,
    FlipStrategyReport,
    optimize_flip_strategies,
    ContractAssignmentInput,
    ContractAssignmentReport,
    calculate_contract_assignment,
    TearSheetData,
    generate_executive_tear_sheet,
)


def test_sale_leaseback_arbitrage_solver():
    inp = SaleLeasebackInput(
        deal_id="DEAL-SLB-01",
        asset_name="Roanoke Industrial Stamping Hub",
        total_acquisition_cost_usd=Decimal("1800000.00"),
        facility_sqft=Decimal("22000.00"),
        market_nnn_rent_per_sqft_usd=Decimal("9.50"),
        investor_exit_cap_rate=Decimal("0.0725"),
        transaction_broker_fee_pct=Decimal("0.0400"),
        baseline_annual_ebitda_usd=Decimal("450000.00"),
    )
    res = solve_sale_leaseback_arbitrage(inp)
    assert isinstance(res, SaleLeasebackResult)
    assert res.annual_nnn_rent_usd == Decimal("209000.00")
    assert res.gross_slb_sale_proceeds_usd > Decimal("2800000.00")
    assert res.net_slb_cash_recouped_usd > inp.total_acquisition_cost_usd
    assert res.is_infinite_return is True
    assert res.net_remaining_equity_basis_usd < Decimal("0.00")
    assert res.is_slb_viable is True
    assert res.rent_coverage_ratio >= Decimal("2.0000")


def test_flip_strategy_optimizer_ranking():
    inp = FlipStrategyInput(
        deal_id="DEAL-STRAT-01",
        asset_name="Valley Cold Storage Facility",
        purchase_price_usd=Decimal("2200000.00"),
        cre_market_assessed_value_usd=Decimal("2800000.00"),
        equipment_liquidation_floor_usd=Decimal("450000.00"),
        current_annual_ebitda_usd=Decimal("380000.00"),
        facility_sqft=Decimal("25000.00"),
        market_nnn_rent_per_sqft_usd=Decimal("8.50"),
        exit_cap_rate=Decimal("0.0750"),
        wholesaling_assignment_fee_usd=Decimal("95000.00"),
    )
    res = optimize_flip_strategies(inp)
    assert isinstance(res, FlipStrategyReport)
    assert len(res.routes) == 4
    assert res.fastest_payback_route == FlipExitRouteType.WHOLESALE_CONTRACT_ASSIGNMENT

    # Check that Wholesale has 21 days
    wholesale = next(r for r in res.routes if r.route_type == FlipExitRouteType.WHOLESALE_CONTRACT_ASSIGNMENT)
    assert wholesale.target_timeline_days == 21
    assert wholesale.net_profit_or_cushion_usd == Decimal("90000.00")

    # Check SLB route exists
    slb = next(r for r in res.routes if r.route_type == FlipExitRouteType.SALE_LEASEBACK_OPERATING_HOLD)
    assert slb.target_timeline_days == 60
    assert slb.is_capital_recouped_under_90_days is True


def test_contract_assignment_engine():
    inp = ContractAssignmentInput(
        deal_id="DEAL-PAPER-01",
        asset_name="Salem CNC Precision",
        contract_purchase_price_usd=Decimal("1200000.00"),
        end_buyer_takeout_price_usd=Decimal("1325000.00"),
        earnest_money_deposit_usd=Decimal("25000.00"),
        closing_deadline_days=30,
        title_and_legal_costs_usd=Decimal("3500.00"),
    )
    res = calculate_contract_assignment(inp)
    assert isinstance(res, ContractAssignmentReport)
    assert res.gross_assignment_fee_usd == Decimal("125000.00")
    assert res.net_assignment_profit_usd == Decimal("121500.00")
    assert res.is_assignment_viable is True
    assert res.is_double_close_recommended is True
    assert res.cash_on_cash_return_pct >= Decimal("400.00")
    assert "ASSIGNABILITY CLAUSE" in res.enforceable_assignment_clause


def test_tear_sheet_generator():
    data = TearSheetData(
        deal_id="DEAL-TEAR-01",
        asset_name="Blue Ridge Fabrication",
        naics_code="332312",
        jurisdiction_fips="51770",
        asking_or_cure_price_usd=Decimal("1600000.00"),
        cre_market_assessed_usd=Decimal("2100000.00"),
        machinery_floor_usd=Decimal("400000.00"),
        total_liquidation_floor_usd=Decimal("2500000.00"),
        cushion_spread_usd=Decimal("900000.00"),
        cushion_spread_pct=Decimal("56.25"),
        current_annual_ebitda_usd=Decimal("350000.00"),
        slb_net_cash_recouped_usd=Decimal("2200000.00"),
        slb_net_remaining_basis_usd=Decimal("-600000.00"),
        wholesale_assignment_fee_usd=Decimal("85000.00"),
        turnaround_18m_ev_usd=Decimal("2600000.00"),
        va_statutory_notice_days=18,
        sba_baseline_dscr=Decimal("1.42"),
        recommended_action="IMMEDIATE ACQUISITION & SALE-LEASEBACK EXECUTION",
    )
    sheet = generate_executive_tear_sheet(data)
    assert isinstance(sheet, str)
    assert "ARGUS EXECUTIVE FLIP TEAR-SHEET" in sheet
    assert "BLUE RIDGE FABRICATION" in sheet
    assert "$1,600,000.00" in sheet
    assert "SALE-LEASEBACK" in sheet


def test_flipper_engine_ast_and_zero_float_compliance():
    import ast
    pkg_dir = pathlib.Path("packages/flipper_deal_engine")
    for py_file in pkg_dir.glob("*.py"):
        with open(py_file, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read())
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, float):
                raise AssertionError(f"Found forbidden float literal in {py_file.name}: {node.value}")

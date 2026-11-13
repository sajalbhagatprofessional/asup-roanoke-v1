"""
Argus Asset Flip & Capital Velocity Engine.
Provides high-velocity deal-flipping tools for asset holding companies:
1. Sale-Leaseback (SLB) Capital Arbitrage Solver
2. 4-Way Flip Strategy & Breakup Net Proceeds Optimizer
3. Wholesaling Contract Assignment & Proof-of-Funds Gate
4. 1-Click Executive Flip Tear-Sheet Generator
Pure Python decimal.Decimal math (0 floats) - AST verified.
"""

from packages.flipper_deal_engine.sale_leaseback_solver import (
    SaleLeasebackInput,
    SaleLeasebackResult,
    solve_sale_leaseback_arbitrage,
)
from packages.flipper_deal_engine.flip_strategy_optimizer import (
    FlipExitRouteType,
    ExitRouteEvaluation,
    FlipStrategyInput,
    FlipStrategyReport,
    optimize_flip_strategies,
)
from packages.flipper_deal_engine.contract_assignment_engine import (
    ContractAssignmentInput,
    ContractAssignmentReport,
    calculate_contract_assignment,
)
from packages.flipper_deal_engine.tear_sheet_generator import (
    TearSheetData,
    generate_executive_tear_sheet,
)

__all__ = [
    "SaleLeasebackInput",
    "SaleLeasebackResult",
    "solve_sale_leaseback_arbitrage",
    "FlipExitRouteType",
    "ExitRouteEvaluation",
    "FlipStrategyInput",
    "FlipStrategyReport",
    "optimize_flip_strategies",
    "ContractAssignmentInput",
    "ContractAssignmentReport",
    "calculate_contract_assignment",
    "TearSheetData",
    "generate_executive_tear_sheet",
]

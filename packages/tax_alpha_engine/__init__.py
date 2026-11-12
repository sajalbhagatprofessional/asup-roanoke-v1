"""
Vanguard & CPA-Grade IRC § 1031 Like-Kind Exchange & Cost Segregation Tax Alpha Suite.
"""

from packages.tax_alpha_engine.models import (
    MACRSAssetClass,
    Section1031IdentificationRecord,
    Section1031ExchangeReport,
    CostSegregationClassAllocation,
    CostSegregationAnalysisReport,
)
from packages.tax_alpha_engine.tax_engine import (
    Section1031ExchangeSolver,
    CostSegregationSolver,
)

__all__ = [
    "MACRSAssetClass",
    "Section1031IdentificationRecord",
    "Section1031ExchangeReport",
    "CostSegregationClassAllocation",
    "CostSegregationAnalysisReport",
    "Section1031ExchangeSolver",
    "CostSegregationSolver",
]

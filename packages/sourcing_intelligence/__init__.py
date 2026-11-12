"""
Argus Advanced Sourcing Intelligence & Underwriting Package.
Synthesizes best-in-class capabilities from 11 market leaders:
1. Inven / Grata: Semantic Lookalike Private Market M&A Search
2. Reonomy / Trepp: Commercial Debt Maturity Wall & Refi Pressure Radar
3. PropertyRadar / TaxSaleResources: Title Curative Screener & 26 U.S.C. § 7425 IRS Redemption Clock
4. Cherre / Bowery Valuation: Municipal Building Permit & FAR Zoning Envelope Scanner
"""

from .models import (
    DistressMaturityTier,
    TitleClearanceStatus,
    ZoningUseStatus,
    LookalikeMatchResult,
    SemanticLookalikeReport,
    MaturityWallLoanRecord,
    DebtMaturityRadarReport,
    TitleLienRecord,
    TitleCurativeAuditReport,
    BuildingPermitRecord,
    ZoningEnvelopeReport,
)
from .semantic_lookalikes import SemanticLookalikeEngine, semantic_lookalike_engine
from .debt_maturity_radar import DebtMaturityRadarEngine, debt_maturity_radar_engine
from .title_curative_engine import TitleCurativeEngine, title_curative_engine
from .permit_zoning_scanner import PermitZoningScanner, permit_zoning_scanner

__all__ = [
    "DistressMaturityTier",
    "TitleClearanceStatus",
    "ZoningUseStatus",
    "LookalikeMatchResult",
    "SemanticLookalikeReport",
    "MaturityWallLoanRecord",
    "DebtMaturityRadarReport",
    "TitleLienRecord",
    "TitleCurativeAuditReport",
    "BuildingPermitRecord",
    "ZoningEnvelopeReport",
    "SemanticLookalikeEngine",
    "semantic_lookalike_engine",
    "DebtMaturityRadarEngine",
    "debt_maturity_radar_engine",
    "TitleCurativeEngine",
    "title_curative_engine",
    "PermitZoningScanner",
    "permit_zoning_scanner",
]

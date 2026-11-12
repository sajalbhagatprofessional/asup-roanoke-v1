"""
Argus AssetHealth™ Master Solver & Coordinator.
Synthesizes the 5 Augury-inspired physical intelligence engines:
1. Equipment Schedule Table Parser (Docling)
2. Aerial Facility & Roof Condition Sentinel (TorchGeo)
3. Predictive Machinery Degradation & Capex Reserve Solver (Darts)
4. Operational Efficiency & Disguised Distress Drift Detector (Alibi-Detect)
5. Maintenance Ledger & Add-Back Integrity Auditor (Cleanlab)
"""

from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional

from .models import (
    CompositeAssetHealthScore,
    PhysicalConditionTier,
    PhysicalRiskGrade,
)
from .equipment_schedule_parser import EquipmentScheduleParser
from .aerial_facility_sentinel import AerialFacilitySentinel
from .predictive_capex_engine import PredictiveCapexEngine
from .operational_drift_detector import OperationalDriftDetector
from .maintenance_auditor import MaintenanceAuditor


class AssetHealthSolver:
    """
    Master physical asset health intelligence engine.
    Produces high-signal 0-100 score and exact capex escrow holdback requirements.
    """

    def __init__(self):
        self.docling_parser = EquipmentScheduleParser()
        self.torchgeo_sentinel = AerialFacilitySentinel()
        self.darts_capex_engine = PredictiveCapexEngine()
        self.alibi_drift_detector = OperationalDriftDetector()
        self.cleanlab_auditor = MaintenanceAuditor()

    def evaluate_composite_asset_health(
        self,
        asset_id: str,
        naics_code: str,
        parcel_id: str = "4011902",
        latitude: Decimal = Decimal("37.2709"),
        longitude: Decimal = Decimal("-79.9414"),
        annual_ebitda: Decimal = Decimal("480000.00"),
        annual_debt_service: Decimal = Decimal("285000.00"),
        equipment_raw_text: Optional[str] = None,
        maintenance_invoices: Optional[List[Dict[str, Any]]] = None,
        observed_operational_metric: Optional[Decimal] = None,
    ) -> CompositeAssetHealthScore:
        """
        Executes all 5 engines and generates composite physical health rating.
        """
        # 1. Parse Equipment Schedule (Docling)
        equipment_list = self.docling_parser.parse_text_or_markdown_tables(equipment_raw_text or "")
        equipment_count = len(equipment_list)
        critical_count = sum(1 for eq in equipment_list if eq.condition_tier == PhysicalConditionTier.CRITICAL)

        # 2. Aerial Facility & Roof Condition (TorchGeo)
        aerial_report = self.torchgeo_sentinel.analyze_parcel_aerial_condition(
            parcel_id=parcel_id,
            latitude=latitude,
            longitude=longitude,
        )

        # 3. Predictive Machinery Degradation & Capex Curve (Darts)
        capex_result = self.darts_capex_engine.calculate_capex_reserve_and_dscr_impact(
            equipment_list=equipment_list,
            annual_historical_ebitda=annual_ebitda,
            annual_debt_service=annual_debt_service,
        )

        # 4. Operational Drift & Disguised Distress (Alibi-Detect)
        drift_result = self.alibi_drift_detector.evaluate_operational_drift(
            naics_code=naics_code,
            observed_metric_value=observed_operational_metric,
        )

        # 5. Maintenance Ledger & Add-Back Audit (Cleanlab)
        maint_result = self.cleanlab_auditor.audit_maintenance_invoices(maintenance_invoices)

        # Compute Composite AssetHealth Score (0 - 100)
        # Weights:
        # - Equipment RUL condition: 35%
        # - Roof condition & Yard health: 25%
        # - Capex impact on DSCR: 20%
        # - Operational drift: 10%
        # - Maintenance ledger integrity: 10%
        
        # Sub-score 1: Equipment Health (0 - 35)
        avg_rul = sum(eq.remaining_useful_life_pct for eq in equipment_list) / Decimal(str(max(1, equipment_count)))
        eq_subscore = (avg_rul * Decimal("0.35")).quantize(Decimal("0.01"))

        # Sub-score 2: Aerial & Roof (0 - 25)
        roof_subscore = (aerial_report.roof_condition_score * Decimal("0.25")).quantize(Decimal("0.01"))
        if aerial_report.outdoor_scrap_anomaly_detected:
            roof_subscore -= Decimal("5.00")

        # Sub-score 3: Capex Stress (0 - 20)
        if capex_result.is_dscr_breached_by_capex:
            capex_subscore = Decimal("4.00")
        elif capex_result.capex_adjusted_dscr >= Decimal("1.3500"):
            capex_subscore = Decimal("20.00")
        else:
            capex_subscore = Decimal("14.00")

        # Sub-score 4: Operational Drift (0 - 10)
        drift_subscore = Decimal("2.00") if drift_result.drift_detected else Decimal("10.00")

        # Sub-score 5: Maintenance Integrity (0 - 10)
        maint_subscore = Decimal("10.00") - Decimal(str(min(10, maint_result.suspicious_invoices_count * 3)))

        raw_score = int(eq_subscore + roof_subscore + capex_subscore + drift_subscore + maint_subscore)
        overall_score = max(5, min(99, raw_score))

        # Determine Physical Risk Grade
        if overall_score >= 88:
            grade = PhysicalRiskGrade.GRADE_A
            summary = "Pristine physical machinery and intact roof membrane. Negligible near-term capex risk."
        elif overall_score >= 74:
            grade = PhysicalRiskGrade.GRADE_B
            summary = "Normal industrial wear. Standard capex reserve adequate for Year 1-3 operations."
        elif overall_score >= 60:
            grade = PhysicalRiskGrade.GRADE_C
            summary = f"Deferred maintenance detected. Mandatory ${capex_result.recommended_seller_escrow_holdback_usd:,.0f} escrow holdback required."
        elif overall_score >= 40:
            grade = PhysicalRiskGrade.GRADE_D
            summary = "Severe machinery degradation and roof wear. Threatens debt service coverage."
        else:
            grade = PhysicalRiskGrade.GRADE_F
            summary = "Critical mechanical failure and uncapitalized decay. Deal recommendation: HARD KILL."

        return CompositeAssetHealthScore(
            overall_health_score=overall_score,
            physical_risk_grade=grade,
            equipment_items_count=equipment_count,
            critical_failure_items_count=critical_count,
            total_deferred_capex_usd=capex_result.total_3year_capex_reserve_usd,
            recommended_escrow_holdback_usd=capex_result.recommended_seller_escrow_holdback_usd,
            aerial_report=aerial_report,
            predictive_capex=capex_result,
            operational_drift=drift_result,
            maintenance_audit=maint_result,
            executive_summary=summary,
        )


# Global Singleton Instance
asset_health_solver = AssetHealthSolver()

"""
Argus AssetHealth™ Models & Data Contracts.
Inspired by Augury's industrial machine health AI.
Provides deterministic, epistemic data structures for physical equipment health,
aerial roof/yard condition, predictive capex curves, operational drift, and maintenance audits.
"""

from dataclasses import asdict, dataclass, field
from decimal import Decimal, ROUND_HALF_EVEN
from enum import Enum
from typing import Any, Dict, List, Optional


class PhysicalConditionTier(str, Enum):
    EXCELLENT = "EXCELLENT"  # Brand new, <= 20% rated life consumed
    GOOD = "GOOD"            # Well maintained, 21-50% rated life consumed
    FAIR = "FAIR"            # Operational with minor wear, 51-75% rated life consumed
    POOR = "POOR"            # Active degradation, 76-90% rated life consumed, capex imminent
    CRITICAL = "CRITICAL"    # End-of-life (>90% rated life), immediate failure risk


class PhysicalRiskGrade(str, Enum):
    GRADE_A = "GRADE_A"  # Health 90-100: Pristine machinery, < $25k Year 1-3 capex
    GRADE_B = "GRADE_B"  # Health 75-89: Normal industrial wear, standard capex reserve
    GRADE_C = "GRADE_C"  # Health 60-74: Deferred maintenance detected, mandatory escrow holdback
    GRADE_D = "GRADE_D"  # Health 40-59: Severe degradation, requires purchase price renegotiation
    GRADE_F = "GRADE_F"  # Health < 40: Critical physical failure imminent, kill deal


@dataclass(frozen=True)
class EquipmentItemRecord:
    item_id: str
    description: str
    serial_number: str
    make_model: str
    year_manufactured: int
    operating_hours: Decimal
    rated_life_hours: Decimal
    original_cost_usd: Decimal
    estimated_replacement_cost_usd: Decimal
    condition_tier: PhysicalConditionTier
    remaining_useful_life_pct: Decimal  # 0.00% to 100.00%
    failure_risk_score: Decimal         # 0.00 (none) to 1.00 (imminent)
    inspection_notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["condition_tier"] = self.condition_tier.value
        d["operating_hours"] = str(self.operating_hours)
        d["rated_life_hours"] = str(self.rated_life_hours)
        d["original_cost_usd"] = str(self.original_cost_usd)
        d["estimated_replacement_cost_usd"] = str(self.estimated_replacement_cost_usd)
        d["remaining_useful_life_pct"] = str(self.remaining_useful_life_pct)
        d["failure_risk_score"] = str(self.failure_risk_score)
        return d


@dataclass(frozen=True)
class AerialFacilityHealthReport:
    parcel_id: str
    roof_condition_score: Decimal          # 0.0 to 100.0 (TorchGeo spectral / NAIP reflection)
    roof_surface_area_sqft: Decimal
    estimated_roof_replacement_cost_usd: Decimal
    yard_truck_occupancy_pct: Decimal      # Fleet density / activity in logistics yards
    outdoor_scrap_anomaly_detected: bool   # Environmental hazard indicator
    imagery_timestamp_iso: str
    imagery_source: str                    # "USGS_NAIP_0.6M", "SENTINEL_2", "MAPBOX_SATELLITE"
    confidence_score: Decimal

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parcel_id": self.parcel_id,
            "roof_condition_score": str(self.roof_condition_score),
            "roof_surface_area_sqft": str(self.roof_surface_area_sqft),
            "estimated_roof_replacement_cost_usd": str(self.estimated_roof_replacement_cost_usd),
            "yard_truck_occupancy_pct": str(self.yard_truck_occupancy_pct),
            "outdoor_scrap_anomaly_detected": self.outdoor_scrap_anomaly_detected,
            "imagery_timestamp_iso": self.imagery_timestamp_iso,
            "imagery_source": self.imagery_source,
            "confidence_score": str(self.confidence_score),
        }


@dataclass(frozen=True)
class PredictiveCapexResult:
    total_equipment_value_usd: Decimal
    year1_mandatory_capex_usd: Decimal
    year2_mandatory_capex_usd: Decimal
    year3_mandatory_capex_usd: Decimal
    total_3year_capex_reserve_usd: Decimal
    baseline_annual_dscr: Decimal
    capex_adjusted_dscr: Decimal
    is_dscr_breached_by_capex: bool  # Adjusted DSCR falls below 1.25x SBA floor
    recommended_seller_escrow_holdback_usd: Decimal

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_equipment_value_usd": str(self.total_equipment_value_usd),
            "year1_mandatory_capex_usd": str(self.year1_mandatory_capex_usd),
            "year2_mandatory_capex_usd": str(self.year2_mandatory_capex_usd),
            "year3_mandatory_capex_usd": str(self.year3_mandatory_capex_usd),
            "total_3year_capex_reserve_usd": str(self.total_3year_capex_reserve_usd),
            "baseline_annual_dscr": str(self.baseline_annual_dscr),
            "capex_adjusted_dscr": str(self.capex_adjusted_dscr),
            "is_dscr_breached_by_capex": self.is_dscr_breached_by_capex,
            "recommended_seller_escrow_holdback_usd": str(self.recommended_seller_escrow_holdback_usd),
        }


@dataclass(frozen=True)
class OperationalDriftResult:
    drift_detected: bool
    drift_p_value: Decimal
    metric_name: str
    target_value: Decimal
    naics_benchmark_value: Decimal
    deviation_pct: Decimal
    disguised_distress_signal: bool
    diagnosis: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "drift_detected": self.drift_detected,
            "drift_p_value": str(self.drift_p_value),
            "metric_name": self.metric_name,
            "target_value": str(self.target_value),
            "naics_benchmark_value": str(self.naics_benchmark_value),
            "deviation_pct": str(self.deviation_pct),
            "disguised_distress_signal": self.disguised_distress_signal,
            "diagnosis": self.diagnosis,
        }


@dataclass(frozen=True)
class MaintenanceLedgerAuditResult:
    total_invoices_audited: int
    suspicious_invoices_count: int
    disallowed_unproven_maintenance_usd: Decimal
    phantom_tooling_detected: bool
    adjusted_ebitda_deduction_usd: Decimal
    audit_confidence: Decimal
    flagged_invoices: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_invoices_audited": self.total_invoices_audited,
            "suspicious_invoices_count": self.suspicious_invoices_count,
            "disallowed_unproven_maintenance_usd": str(self.disallowed_unproven_maintenance_usd),
            "phantom_tooling_detected": self.phantom_tooling_detected,
            "adjusted_ebitda_deduction_usd": str(self.adjusted_ebitda_deduction_usd),
            "audit_confidence": str(self.audit_confidence),
            "flagged_invoices": self.flagged_invoices,
        }


@dataclass(frozen=True)
class CompositeAssetHealthScore:
    overall_health_score: int              # 0 to 100
    physical_risk_grade: PhysicalRiskGrade # GRADE_A to GRADE_F
    equipment_items_count: int
    critical_failure_items_count: int
    total_deferred_capex_usd: Decimal
    recommended_escrow_holdback_usd: Decimal
    aerial_report: AerialFacilityHealthReport
    predictive_capex: PredictiveCapexResult
    operational_drift: OperationalDriftResult
    maintenance_audit: MaintenanceLedgerAuditResult
    executive_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_health_score": self.overall_health_score,
            "physical_risk_grade": self.physical_risk_grade.value,
            "equipment_items_count": self.equipment_items_count,
            "critical_failure_items_count": self.critical_failure_items_count,
            "total_deferred_capex_usd": str(self.total_deferred_capex_usd),
            "recommended_escrow_holdback_usd": str(self.recommended_escrow_holdback_usd),
            "aerial_report": self.aerial_report.to_dict(),
            "predictive_capex": self.predictive_capex.to_dict(),
            "operational_drift": self.operational_drift.to_dict(),
            "maintenance_audit": self.maintenance_audit.to_dict(),
            "executive_summary": self.executive_summary,
        }

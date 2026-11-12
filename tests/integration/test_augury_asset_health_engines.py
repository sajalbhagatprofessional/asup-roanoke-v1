"""
Milestone 17 Integration Test Suite: Augury-Inspired Industrial AssetHealth™ Engines.
Validates the 5 open-source physical asset health capabilities:
1. DS4SD/docling - Equipment schedule and bankruptcy table parser
2. microsoft/torchgeo - Aerial facility roof condition, albedo & yard fleet sentinel
3. unit8co/darts - Machinery failure forecasting, RUL, and Year 1-3 predictive capex
4. SeldonIO/alibi-detect - Operational drift & disguised industrial distress detector
5. cleanlab/cleanlab - Data-centric maintenance ledger audit for fraudulent add-backs
6. Master Composite Solver & FastAPI REST Endpoints
"""

from decimal import Decimal
import json
from fastapi.testclient import TestClient

from packages.asset_health import (
    AssetHealthSolver,
    asset_health_solver,
    EquipmentScheduleParser,
    AerialFacilitySentinel,
    PredictiveCapexEngine,
    OperationalDriftDetector,
    MaintenanceAuditor,
    PhysicalConditionTier,
    PhysicalRiskGrade,
    EquipmentItemRecord,
)
from services.api.main import app

client = TestClient(app)


def test_docling_equipment_schedule_parser():
    parser = EquipmentScheduleParser()
    sample_markdown = """
| Asset Tag | Description | Make/Model | Serial Number | Year | Hours | Original Cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CNC-101 | 5-Axis CNC Milling Center | Haas UMC-750 | HAAS-998231 | 2019 | 8200 | $165,000 |
| FLT-204 | 5,000 lb Pneumatic Forklift | Toyota 8FGU25 | TOY-55120 | 2017 | 14800 | $38,000 |
| CMP-301 | Rotary Screw Air Compressor | Ingersoll Rand R55n | IR-44819 | 2015 | 39500 | $42,000 |
    """
    records = parser.parse_text_or_markdown_tables(sample_markdown, default_replacement_ratio=Decimal("1.25"))
    assert len(records) == 3

    # CNC
    cnc = records[0]
    assert cnc.item_id == "CNC-101"
    assert cnc.condition_tier in [PhysicalConditionTier.GOOD, PhysicalConditionTier.FAIR]
    assert cnc.original_cost_usd == Decimal("165000.00")
    assert cnc.estimated_replacement_cost_usd == Decimal("206250.00")
    assert Decimal("0.00") <= cnc.remaining_useful_life_pct <= Decimal("100.00")

    # Compressor (high hours -> POOR or CRITICAL)
    cmp = records[2]
    assert cmp.item_id == "CMP-301"
    assert cmp.condition_tier in [PhysicalConditionTier.POOR, PhysicalConditionTier.CRITICAL]
    assert cmp.failure_risk_score >= Decimal("0.70")


def test_torchgeo_aerial_facility_sentinel():
    sentinel = AerialFacilitySentinel()
    report = sentinel.analyze_parcel_aerial_condition(
        parcel_id="51770-99414",
        latitude=Decimal("37.2709"),
        longitude=Decimal("-79.9414"),
        building_footprint_sqft=Decimal("35000.0"),
    )
    assert report.parcel_id == "51770-99414"
    assert Decimal("0.00") <= report.roof_condition_score <= Decimal("100.00")
    assert report.roof_surface_area_sqft == Decimal("35000.0")
    assert report.estimated_roof_replacement_cost_usd > Decimal("0.00")
    assert Decimal("0.00") <= report.yard_truck_occupancy_pct <= Decimal("100.00")
    assert isinstance(report.outdoor_scrap_anomaly_detected, bool)
    assert report.imagery_source in ["USGS_NAIP_0.6M_ORTHO", "SENTINEL_2", "MAPBOX_SATELLITE"]
    assert report.confidence_score >= Decimal("0.90")


def test_darts_predictive_capex_engine():
    engine = PredictiveCapexEngine()
    parser = EquipmentScheduleParser()
    sample_eq = parser._generate_industry_defaults()

    res = engine.calculate_capex_reserve_and_dscr_impact(
        equipment_list=sample_eq,
        annual_historical_ebitda=Decimal("450000.00"),
        annual_debt_service=Decimal("320000.00"),
    )
    assert res.total_equipment_value_usd > Decimal("0.00")
    assert res.year1_mandatory_capex_usd >= Decimal("0.00")
    assert res.year2_mandatory_capex_usd >= Decimal("0.00")
    assert res.year3_mandatory_capex_usd >= Decimal("0.00")
    assert res.total_3year_capex_reserve_usd == (
        res.year1_mandatory_capex_usd + res.year2_mandatory_capex_usd + res.year3_mandatory_capex_usd
    )
    assert res.baseline_annual_dscr.quantize(Decimal("0.01")) == Decimal("1.41")
    assert res.capex_adjusted_dscr <= res.baseline_annual_dscr
    assert isinstance(res.is_dscr_breached_by_capex, bool)
    assert res.recommended_seller_escrow_holdback_usd >= Decimal("0.00")


def test_alibi_detect_operational_drift_detector():
    detector = OperationalDriftDetector()
    drift = detector.evaluate_operational_drift(
        naics_code="332710",
        observed_metric_value=Decimal("4.50"),
    )
    assert drift.drift_detected is True
    assert drift.disguised_distress_signal is True
    assert "scrap rate" in drift.diagnosis.lower()


def test_cleanlab_maintenance_ledger_auditor():
    auditor = MaintenanceAuditor()
    invoices = [
        {"invoice_id": "INV-001", "vendor": "Industrial Machine Tool Inc", "amount_usd": "8500.00", "description": "Spindle bearing replacement", "equipment_id": "EQ-001"},
        {"invoice_id": "INV-002", "vendor": "Smith & Sons Luxury Marina", "amount_usd": "14200.00", "description": "Annual yacht maintenance and winterization", "equipment_id": "EQ-OWNER"},
        {"invoice_id": "INV-003", "vendor": "Valley Hydraulics LLC", "amount_usd": "3200.00", "description": "Hose and pump rebuild", "equipment_id": "EQ-002"},
        {"invoice_id": "INV-004", "vendor": "Augusta National Pro Shop", "amount_usd": "4800.00", "description": "Custom golf cart batteries & detailing", "equipment_id": "EQ-GOLF"},
    ]
    audit_res = auditor.audit_maintenance_invoices(invoices)
    assert audit_res.total_invoices_audited == 4
    assert audit_res.suspicious_invoices_count == 2
    assert audit_res.disallowed_unproven_maintenance_usd == Decimal("19000.00")  # 14200 + 4800
    assert audit_res.phantom_tooling_detected is True
    assert audit_res.audit_confidence >= Decimal("0.90")
    assert len(audit_res.flagged_invoices) == 2


def test_composite_asset_health_solver():
    solver = AssetHealthSolver()
    comp = solver.evaluate_composite_asset_health(
        asset_id="TEST-ASSET-001",
        naics_code="332710",
        parcel_id="4011902",
        latitude=Decimal("37.2709"),
        longitude=Decimal("-79.9414"),
        annual_ebitda=Decimal("520000.00"),
        annual_debt_service=Decimal("310000.00"),
    )
    assert 0 <= comp.overall_health_score <= 100
    assert isinstance(comp.physical_risk_grade, PhysicalRiskGrade)
    assert comp.equipment_items_count > 0
    assert comp.total_deferred_capex_usd >= Decimal("0.00")
    assert comp.recommended_escrow_holdback_usd >= Decimal("0.00")
    assert comp.aerial_report.roof_condition_score >= Decimal("0.00")
    assert len(comp.executive_summary) > 0
    d = comp.to_dict()
    assert d["overall_health_score"] == comp.overall_health_score
    assert d["physical_risk_grade"] == comp.physical_risk_grade.value


def test_fastapi_asset_health_endpoints():
    # 1. GET /v1/assets/{asset_id}/health-score
    res = client.get("/v1/assets/ASSET-ROA-001/health-score?naics_code=332710&annual_ebitda=500000.0&debt_service=290000.0")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["asset_id"] == "ASSET-ROA-001"
    assert "health" in data
    assert "overall_health_score" in data["health"]
    assert "physical_risk_grade" in data["health"]

    # 2. POST /v1/assets/{asset_id}/parse-equipment-schedule
    sched_payload = {
        "raw_schedule_text": "| Tag | Item | Hours | Cost |\n| CNC-1 | Milling Center | 6000 | $120,000 |",
        "replacement_multiplier": "1.25",
    }
    res_parse = client.post("/v1/assets/ASSET-ROA-001/parse-equipment-schedule", json=sched_payload)
    assert res_parse.status_code == 200
    pdata = res_parse.json()
    assert pdata["parsed_items_count"] >= 1
    assert pdata["items"][0]["item_id"] == "CNC-1"

    # 3. POST /v1/assets/{asset_id}/aerial-facility-scan
    aerial_payload = {
        "parcel_id": "4011902",
        "latitude": 37.2709,
        "longitude": -79.9414,
        "footprint_sqft": 28000.0,
    }
    res_aerial = client.post("/v1/assets/ASSET-ROA-001/aerial-facility-scan", json=aerial_payload)
    assert res_aerial.status_code == 200
    adata = res_aerial.json()
    assert "aerial_report" in adata
    assert Decimal(adata["aerial_report"]["roof_condition_score"]) > Decimal("0")

    # 4. POST /v1/assets/{asset_id}/predict-capex-reserve
    capex_payload = {
        "annual_ebitda_usd": "450000.00",
        "annual_debt_service_usd": "300000.00",
    }
    res_capex = client.post("/v1/assets/ASSET-ROA-001/predict-capex-reserve", json=capex_payload)
    assert res_capex.status_code == 200
    cdata = res_capex.json()
    assert "predictive_capex" in cdata
    assert Decimal(cdata["predictive_capex"]["total_3year_capex_reserve_usd"]) > Decimal("0")

    # 5. POST /v1/assets/{asset_id}/audit-maintenance-ledger
    ledger_payload = {
        "invoices": [
            {"invoice_id": "INV-P01", "vendor": "Personal Country Club", "amount_usd": "3500.00", "description": "Private golf cart repair"}
        ]
    }
    res_ledger = client.post("/v1/assets/ASSET-ROA-001/audit-maintenance-ledger", json=ledger_payload)
    assert res_ledger.status_code == 200
    mdata = res_ledger.json()
    assert "maintenance_audit" in mdata
    assert mdata["maintenance_audit"]["suspicious_invoices_count"] == 1

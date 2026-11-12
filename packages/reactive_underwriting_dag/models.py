"""
Data models and contracts for Goldman Sachs SecDB / J.P. Morgan Athena style
Reactive Underwriting Directed Acyclic Graph (DAG).
"""

from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field


class DAGNodeType(str, Enum):
    INPUT = "INPUT"
    FORMULA = "FORMULA"
    HURDLE = "HURDLE"


class DAGNodeState(BaseModel):
    node_id: str
    node_type: DAGNodeType
    label: str
    dependencies: List[str] = Field(default_factory=list)
    dependents: List[str] = Field(default_factory=list)
    cached_value: Optional[str] = None
    is_dirty: bool = True
    unit: str = "USD"
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "node_type": self.node_type.value,
            "label": self.label,
            "dependencies": self.dependencies,
            "dependents": self.dependents,
            "cached_value": self.cached_value,
            "is_dirty": self.is_dirty,
            "unit": self.unit,
            "description": self.description,
        }


class DAGUnderwritingInputs(BaseModel):
    purchase_price_usd: Decimal = Field(default=Decimal("1500000.00"))
    buyer_equity_pct: Decimal = Field(default=Decimal("0.1000"))
    sofr_benchmark_rate: Decimal = Field(default=Decimal("0.0530"))
    bank_spread_bps: Decimal = Field(default=Decimal("275"))
    historical_ebitda_usd: Decimal = Field(default=Decimal("380000.00"))
    replacement_gm_salary_usd: Decimal = Field(default=Decimal("85000.00"))
    assessed_cre_value_usd: Decimal = Field(default=Decimal("2200000.00"))
    seller_standby_note_usd: Decimal = Field(default=Decimal("0.00"))
    seller_consulting_months: int = Field(default=12)
    loan_term_years: int = Field(default=25)


class DAGEvaluationReport(BaseModel):
    evaluation_id: str
    timestamp_iso: str
    inputs: Dict[str, str]
    computed_formulas: Dict[str, str]
    hurdle_evaluations: Dict[str, bool]
    is_sba_compliant: bool
    is_va_foreclosure_compliant: bool
    is_principal_hurdle_passed: bool
    dirty_nodes_recalculated_count: int
    total_dag_nodes_count: int
    execution_time_microseconds: int
    incremental_efficiency_pct: str
    executive_synthesis: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evaluation_id": self.evaluation_id,
            "timestamp_iso": self.timestamp_iso,
            "inputs": self.inputs,
            "computed_formulas": self.computed_formulas,
            "hurdle_evaluations": self.hurdle_evaluations,
            "is_sba_compliant": self.is_sba_compliant,
            "is_va_foreclosure_compliant": self.is_va_foreclosure_compliant,
            "is_principal_hurdle_passed": self.is_principal_hurdle_passed,
            "dirty_nodes_recalculated_count": self.dirty_nodes_recalculated_count,
            "total_dag_nodes_count": self.total_dag_nodes_count,
            "execution_time_microseconds": self.execution_time_microseconds,
            "incremental_efficiency_pct": self.incremental_efficiency_pct,
            "executive_synthesis": self.executive_synthesis,
        }

"""
Goldman Sachs SecDB / J.P. Morgan Athena style Reactive Underwriting Directed Acyclic Graph (DAG).
Executes lazy and forward-propagating reactive calculation with incremental invalidation caching.
Pure Python decimal.Decimal (ROUND_HALF_EVEN) with zero floats and zero network dependencies.
"""

import time
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

from packages.reactive_underwriting_dag.models import (
    DAGNodeType,
    DAGNodeState,
    DAGUnderwritingInputs,
    DAGEvaluationReport,
)


class ReactiveUnderwritingDAG:
    """
    Reactive Dataflow Engine implementing Directed Acyclic Graph evaluation
    with fine-grained dependency tracking and incremental invalidation caching.
    """

    def __init__(self, initial_inputs: Optional[DAGUnderwritingInputs] = None):
        self._inputs = initial_inputs or DAGUnderwritingInputs()
        self._nodes: Dict[str, DAGNodeState] = {}
        self._formulas: Dict[str, Callable[[], Any]] = {}
        self._values: Dict[str, Any] = {}
        self._execution_counts: Dict[str, int] = {}
        self._build_graph()
        # Initialize graph by executing initial full evaluation
        self.evaluate(force_all=True)

    def _build_graph(self) -> None:
        """Constructs the dependency topology of nodes and edges."""
        # 1. INPUT NODES
        self._register_input("purchase_price_usd", "Acquisition Purchase / Cure Basis", "USD")
        self._register_input("buyer_equity_pct", "Buyer Total Equity Injection Ratio", "RATIO")
        self._register_input("sofr_benchmark_rate", "Benchmark SOFR 30D / 1Y Rate", "RATE")
        self._register_input("bank_spread_bps", "Senior Lender Margin / Spread", "BPS")
        self._register_input("historical_ebitda_usd", "Historical Reported EBITDA", "USD")
        self._register_input("replacement_gm_salary_usd", "Mandatory General Manager Replacement Salary", "USD")
        self._register_input("assessed_cre_value_usd", "Verified County Assessed CRE Replacement Value", "USD")
        self._register_input("seller_standby_note_usd", "Seller Standby Promissory Note Basis", "USD")
        self._register_input("seller_consulting_months", "Seller Consulting / Transition Period", "MONTHS")
        self._register_input("loan_term_years", "SBA Senior Loan Amortization Term", "YEARS")

        # 2. FORMULA NODES
        self._register_formula(
            "effective_interest_rate",
            "Effective Senior Loan Coupon (SOFR + Spread)",
            dependencies=["sofr_benchmark_rate", "bank_spread_bps"],
            unit="RATE",
            formula_fn=self._calc_effective_rate,
        )

        self._register_formula(
            "buyer_equity_usd",
            "Buyer Total Required Equity Injection USD",
            dependencies=["purchase_price_usd", "buyer_equity_pct"],
            unit="USD",
            formula_fn=self._calc_buyer_equity_usd,
        )

        self._register_formula(
            "sba_loan_principal_usd",
            "SBA Senior Funded Loan Principal",
            dependencies=["purchase_price_usd", "buyer_equity_usd"],
            unit="USD",
            formula_fn=self._calc_sba_loan_principal,
        )

        self._register_formula(
            "annual_debt_service_usd",
            "25-Year Annual Amortization Debt Service",
            dependencies=["sba_loan_principal_usd", "effective_interest_rate", "loan_term_years"],
            unit="USD",
            formula_fn=self._calc_annual_debt_service,
        )

        self._register_formula(
            "normalized_ebitda_usd",
            "Normalized Post-GM Underwriting Cash Flow",
            dependencies=["historical_ebitda_usd", "replacement_gm_salary_usd"],
            unit="USD",
            formula_fn=self._calc_normalized_ebitda,
        )

        self._register_formula(
            "dscr",
            "Base Debt Service Coverage Ratio (DSCR)",
            dependencies=["normalized_ebitda_usd", "annual_debt_service_usd"],
            unit="COVERAGE",
            formula_fn=self._calc_dscr,
        )

        self._register_formula(
            "cre_basis_ratio",
            "Purchase Basis to CRE Replacement Value Ratio",
            dependencies=["purchase_price_usd", "assessed_cre_value_usd"],
            unit="RATIO",
            formula_fn=self._calc_cre_basis_ratio,
        )

        self._register_formula(
            "max_seller_standby_allowed_usd",
            "SBA SOP 50 10 8.1 50% Cap on Limited Equity Seller Note",
            dependencies=["buyer_equity_usd"],
            unit="USD",
            formula_fn=self._calc_max_seller_standby_allowed,
        )

        self._register_formula(
            "buyer_unborrowed_cash_usd",
            "Buyer True Unborrowed Cash Injected",
            dependencies=["buyer_equity_usd", "seller_standby_note_usd"],
            unit="USD",
            formula_fn=self._calc_buyer_unborrowed_cash,
        )

        self._register_formula(
            "unborrowed_cash_ratio_of_project",
            "Unborrowed Cash Ratio of Total Project Cost",
            dependencies=["buyer_unborrowed_cash_usd", "purchase_price_usd"],
            unit="RATIO",
            formula_fn=self._calc_unborrowed_cash_ratio,
        )

        # 3. HURDLE NODES
        self._register_hurdle(
            "sba_dscr_floor_pass",
            "SBA SOP 50 10 8.1 Base DSCR Floor (>= 1.25x)",
            dependencies=["dscr"],
            formula_fn=lambda: self._values["dscr"] >= Decimal("1.2500"),
        )

        self._register_hurdle(
            "sba_equity_injection_pass",
            "SBA SOP 50 10 8.1 Total Equity Injection Floor (>= 10.0%)",
            dependencies=["buyer_equity_pct"],
            formula_fn=lambda: self._values["buyer_equity_pct"] >= Decimal("0.1000"),
        )

        self._register_hurdle(
            "sba_seller_standby_cap_pass",
            "SBA SOP 50 10 8.1 Standby Seller Note <= 50% of Required Injection",
            dependencies=["seller_standby_note_usd", "max_seller_standby_allowed_usd"],
            formula_fn=lambda: self._values["seller_standby_note_usd"] <= self._values["max_seller_standby_allowed_usd"],
        )

        self._register_hurdle(
            "sba_unborrowed_cash_floor_pass",
            "SBA SOP 50 10 8.1 Minimum Unborrowed Cash Floor (>= 5.0% of Project)",
            dependencies=["unborrowed_cash_ratio_of_project"],
            formula_fn=lambda: self._values["unborrowed_cash_ratio_of_project"] >= Decimal("0.0500"),
        )

        self._register_hurdle(
            "sba_consulting_cap_pass",
            "SBA SOP 50 10 8.1 Seller Transition Cap (<= 24 Months)",
            dependencies=["seller_consulting_months"],
            formula_fn=lambda: Decimal(str(self._values["seller_consulting_months"])) <= Decimal("24"),
        )

        self._register_hurdle(
            "va_foreclosure_basis_cap_pass",
            "Va. Code § 55.1-321 Basis Cushion Cap (<= 70.0% of Assessed Value)",
            dependencies=["cre_basis_ratio"],
            formula_fn=lambda: self._values["cre_basis_ratio"] <= Decimal("0.7000"),
        )

        self._register_hurdle(
            "principal_target_dscr_pass",
            "Principal Enhanced Hurdle DSCR (>= 1.35x)",
            dependencies=["dscr"],
            formula_fn=lambda: self._values["dscr"] >= Decimal("1.3500"),
        )

    # -------------------------------------------------------------------------
    # Node Registration Helpers
    # -------------------------------------------------------------------------

    def _register_input(self, node_id: str, label: str, unit: str) -> None:
        self._nodes[node_id] = DAGNodeState(
            node_id=node_id,
            node_type=DAGNodeType.INPUT,
            label=label,
            unit=unit,
            dependencies=[],
            dependents=[],
            is_dirty=True,
        )
        self._execution_counts[node_id] = 0

    def _register_formula(
        self,
        node_id: str,
        label: str,
        dependencies: List[str],
        unit: str,
        formula_fn: Callable[[], Any],
    ) -> None:
        self._nodes[node_id] = DAGNodeState(
            node_id=node_id,
            node_type=DAGNodeType.FORMULA,
            label=label,
            dependencies=dependencies,
            dependents=[],
            unit=unit,
            is_dirty=True,
        )
        self._formulas[node_id] = formula_fn
        self._execution_counts[node_id] = 0

        # Register forward dependent edges
        for dep in dependencies:
            if dep in self._nodes and node_id not in self._nodes[dep].dependents:
                self._nodes[dep].dependents.append(node_id)

    def _register_hurdle(
        self,
        node_id: str,
        label: str,
        dependencies: List[str],
        formula_fn: Callable[[], bool],
    ) -> None:
        self._nodes[node_id] = DAGNodeState(
            node_id=node_id,
            node_type=DAGNodeType.HURDLE,
            label=label,
            dependencies=dependencies,
            dependents=[],
            unit="BOOLEAN",
            is_dirty=True,
        )
        self._formulas[node_id] = formula_fn
        self._execution_counts[node_id] = 0

        for dep in dependencies:
            if dep in self._nodes and node_id not in self._nodes[dep].dependents:
                self._nodes[dep].dependents.append(node_id)

    # -------------------------------------------------------------------------
    # Reactive Propagation and Invalidation Logic
    # -------------------------------------------------------------------------

    def mark_dirty(self, input_node_id: str) -> Set[str]:
        """
        SecDB/Athena forward invalidation: Marks an input node and all its
        downstream topological dependents as dirty.
        Returns the set of all invalidated node IDs.
        """
        invalidated: Set[str] = set()
        queue = [input_node_id]

        while queue:
            curr = queue.pop(0)
            if curr in invalidated:
                continue
            invalidated.add(curr)
            if curr in self._nodes:
                self._nodes[curr].is_dirty = True
                for dep in self._nodes[curr].dependents:
                    if dep not in invalidated:
                        queue.append(dep)

        return invalidated

    def update_input(self, node_id: str, new_value: Any) -> DAGEvaluationReport:
        """
        Updates a single input value, invalidates the downstream sub-graph,
        and recomputes only the affected nodes.
        """
        return self.update_inputs({node_id: new_value})

    def update_inputs(self, new_inputs: Dict[str, Any]) -> DAGEvaluationReport:
        """
        Updates multiple inputs simultaneously, efficiently propagating invalidations
        and executing an incremental reactive recalculation.
        """
        invalidated_all: Set[str] = set()

        for k, v in new_inputs.items():
            if k in self._nodes and self._nodes[k].node_type == DAGNodeType.INPUT:
                # Update typed input value
                if isinstance(v, (int, str)) and not isinstance(v, bool):
                    if k in ["seller_consulting_months", "loan_term_years"]:
                        val: Any = int(v)
                    else:
                        val = Decimal(str(v))
                elif isinstance(v, Decimal):
                    val = v
                else:
                    val = v
                self._values[k] = val
                invalidated = self.mark_dirty(k)
                invalidated_all.update(invalidated)

        return self.evaluate(force_all=False)

    def evaluate(self, force_all: bool = False) -> DAGEvaluationReport:
        """
        Evaluates the DAG. If force_all=False, recomputes ONLY dirty nodes
        (Goldman Sachs incremental memoization).
        """
        start_ns = time.perf_counter_ns()
        recalculated_count = 0

        # Load values from inputs if empty
        if not self._values:
            self._values["purchase_price_usd"] = self._inputs.purchase_price_usd
            self._values["buyer_equity_pct"] = self._inputs.buyer_equity_pct
            self._values["sofr_benchmark_rate"] = self._inputs.sofr_benchmark_rate
            self._values["bank_spread_bps"] = self._inputs.bank_spread_bps
            self._values["historical_ebitda_usd"] = self._inputs.historical_ebitda_usd
            self._values["replacement_gm_salary_usd"] = self._inputs.replacement_gm_salary_usd
            self._values["assessed_cre_value_usd"] = self._inputs.assessed_cre_value_usd
            self._values["seller_standby_note_usd"] = self._inputs.seller_standby_note_usd
            self._values["seller_consulting_months"] = self._inputs.seller_consulting_months
            self._values["loan_term_years"] = self._inputs.loan_term_years

        # Topological execution order
        topo_order = self._topological_sort()

        for node_id in topo_order:
            node = self._nodes[node_id]
            if node.node_type == DAGNodeType.INPUT:
                node.cached_value = str(self._values.get(node_id, ""))
                node.is_dirty = False
                continue

            if force_all or node.is_dirty:
                compute_fn = self._formulas.get(node_id)
                if compute_fn:
                    res = compute_fn()
                    self._values[node_id] = res
                    node.cached_value = str(res)
                    node.is_dirty = False
                    self._execution_counts[node_id] = self._execution_counts.get(node_id, 0) + 1
                    recalculated_count += 1

        elapsed_us = max(1, (time.perf_counter_ns() - start_ns) // 1000)

        # Build output synthesis
        total_nodes = len(self._nodes)
        saved_nodes = total_nodes - recalculated_count
        efficiency = (Decimal(str(saved_nodes)) / Decimal(str(total_nodes)) * Decimal("100.0")).quantize(
            Decimal("0.1"), rounding=ROUND_HALF_EVEN
        )

        computed_formulas = {
            k: str(v)
            for k, v in self._values.items()
            if k in self._nodes and self._nodes[k].node_type == DAGNodeType.FORMULA
        }

        hurdle_evaluations = {
            k: bool(v)
            for k, v in self._values.items()
            if k in self._nodes and self._nodes[k].node_type == DAGNodeType.HURDLE
        }

        is_sba = (
            hurdle_evaluations.get("sba_dscr_floor_pass", False)
            and hurdle_evaluations.get("sba_equity_injection_pass", False)
            and hurdle_evaluations.get("sba_seller_standby_cap_pass", False)
            and hurdle_evaluations.get("sba_unborrowed_cash_floor_pass", False)
            and hurdle_evaluations.get("sba_consulting_cap_pass", False)
        )
        is_va = hurdle_evaluations.get("va_foreclosure_basis_cap_pass", False)
        is_principal = hurdle_evaluations.get("principal_target_dscr_pass", False) and is_va and is_sba

        synthesis = (
            f"SecDB Reactive DAG executed in {elapsed_us} μs. "
            f"Recalculated {recalculated_count}/{total_nodes} nodes ({efficiency}% incremental caching efficiency). "
            f"DSCR: {computed_formulas.get('dscr', 'N/A')}x, Basis Ratio: {computed_formulas.get('cre_basis_ratio', 'N/A')}. "
            f"SBA SOP 50 10 8.1 Compliant: {is_sba}, Principal Hurdle Passed: {is_principal}."
        )

        return DAGEvaluationReport(
            evaluation_id=f"DAG-EVAL-{int(time.time() * 1000)}",
            timestamp_iso=datetime.now(timezone.utc).isoformat(),
            inputs={
                k: str(v)
                for k, v in self._values.items()
                if k in self._nodes and self._nodes[k].node_type == DAGNodeType.INPUT
            },
            computed_formulas=computed_formulas,
            hurdle_evaluations=hurdle_evaluations,
            is_sba_compliant=is_sba,
            is_va_foreclosure_compliant=is_va,
            is_principal_hurdle_passed=is_principal,
            dirty_nodes_recalculated_count=recalculated_count,
            total_dag_nodes_count=total_nodes,
            execution_time_microseconds=elapsed_us,
            incremental_efficiency_pct=str(efficiency),
            executive_synthesis=synthesis,
        )

    def _topological_sort(self) -> List[str]:
        """Kahn's algorithm for deterministic topological order."""
        in_degree = {k: len(v.dependencies) for k, v in self._nodes.items()}
        queue = [k for k, d in in_degree.items() if d == 0]
        topo: List[str] = []

        while queue:
            curr = queue.pop(0)
            topo.append(curr)
            for dep in self._nodes[curr].dependents:
                in_degree[dep] -= 1
                if in_degree[dep] == 0:
                    queue.append(dep)

        return topo

    # -------------------------------------------------------------------------
    # Pure Decimal Mathematical Formula Implementations
    # -------------------------------------------------------------------------

    def _calc_effective_rate(self) -> Decimal:
        sofr = self._values["sofr_benchmark_rate"]
        spread_bps = self._values["bank_spread_bps"]
        spread_rate = (spread_bps / Decimal("10000.0")).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)
        return (sofr + spread_rate).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)

    def _calc_buyer_equity_usd(self) -> Decimal:
        price = self._values["purchase_price_usd"]
        ratio = self._values["buyer_equity_pct"]
        return (price * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def _calc_sba_loan_principal(self) -> Decimal:
        price = self._values["purchase_price_usd"]
        equity = self._values["buyer_equity_usd"]
        return (price - equity).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def _calc_annual_debt_service(self) -> Decimal:
        principal = self._values["sba_loan_principal_usd"]
        annual_rate = self._values["effective_interest_rate"]
        years = self._values["loan_term_years"]

        if principal <= Decimal("0.00") or annual_rate <= Decimal("0.00"):
            return Decimal("0.00")

        # Monthly amortization: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        monthly_rate = (annual_rate / Decimal("12.0")).quantize(Decimal("0.00000001"), rounding=ROUND_HALF_EVEN)
        n_months = int(years) * 12

        one_plus_r = Decimal("1.0") + monthly_rate
        # Pure decimal power
        compounded = one_plus_r**n_months
        numerator = monthly_rate * compounded
        denominator = compounded - Decimal("1.0")

        monthly_payment = (principal * (numerator / denominator)).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        return (monthly_payment * Decimal("12.0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def _calc_normalized_ebitda(self) -> Decimal:
        ebitda = self._values["historical_ebitda_usd"]
        gm_salary = self._values["replacement_gm_salary_usd"]
        return (ebitda - gm_salary).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def _calc_dscr(self) -> Decimal:
        ebitda = self._values["normalized_ebitda_usd"]
        ads = self._values["annual_debt_service_usd"]
        if ads <= Decimal("0.00"):
            return Decimal("99.9999")
        return (ebitda / ads).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)

    def _calc_cre_basis_ratio(self) -> Decimal:
        price = self._values["purchase_price_usd"]
        cre_val = self._values["assessed_cre_value_usd"]
        if cre_val <= Decimal("0.00"):
            return Decimal("99.9999")
        return (price / cre_val).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)

    def _calc_max_seller_standby_allowed(self) -> Decimal:
        equity = self._values["buyer_equity_usd"]
        return (equity * Decimal("0.50")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def _calc_buyer_unborrowed_cash(self) -> Decimal:
        equity = self._values["buyer_equity_usd"]
        note = self._values["seller_standby_note_usd"]
        return (equity - note).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    def _calc_unborrowed_cash_ratio(self) -> Decimal:
        unborrowed = self._values["buyer_unborrowed_cash_usd"]
        price = self._values["purchase_price_usd"]
        if price <= Decimal("0.00"):
            return Decimal("0.0000")
        return (unborrowed / price).quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)

    def get_node_states(self) -> List[DAGNodeState]:
        return list(self._nodes.values())

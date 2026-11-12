"""
Argus Palantir-Inspired Operational Ontology & Knowledge Graph Engine.
Integrates 5 Palantir Foundry, Gotham, Gaia, Contour, and AIP capabilities:
1. moj-analytical-services/splink: Probabilistic Record Linkage & Multi-Modal Entity Resolution
2. networkx/networkx: Gotham Link Analysis, Betweenness Centrality, Cross-Collateral Cycles
3. duckdb/duckdb: Foundry Contour Sub-50ms Vectorized Columnar Micro-OLAP
4. shapely/shapely & geopandas/geopandas: Gaia Topological Parcel Fusion & Floodway Hazard
5. instructor-ai/instructor: AIP Structured Schema Guardrails & Statutory Invariants
"""

from .models import (
    OntologyNodeType,
    OntologyEdgeType,
    OntologyNodeRecord,
    OntologyEdgeRecord,
    OntologyGraphReport,
    EntityResolutionMatchResult,
    TopologicalParcelFusionReport,
    ContourAnalyticalQueryResult,
)
from .entity_resolver_splink import SplinkEntityResolver, splink_entity_resolver
from .gotham_link_graph import GothamLinkGraphEngine, gotham_link_graph_engine
from .contour_engine_duckdb import ContourEngineDuckDB, contour_engine_duckdb
from .gaia_spatial_fusion import GaiaSpatialFusionEngine, gaia_spatial_fusion_engine
from .aip_guardrails_instructor import (
    AIPGuardrailValidationResult,
    AIPGuardrailsInstructor,
    aip_guardrails_instructor,
)

__all__ = [
    "OntologyNodeType",
    "OntologyEdgeType",
    "OntologyNodeRecord",
    "OntologyEdgeRecord",
    "OntologyGraphReport",
    "EntityResolutionMatchResult",
    "TopologicalParcelFusionReport",
    "ContourAnalyticalQueryResult",
    "SplinkEntityResolver",
    "splink_entity_resolver",
    "GothamLinkGraphEngine",
    "gotham_link_graph_engine",
    "ContourEngineDuckDB",
    "contour_engine_duckdb",
    "GaiaSpatialFusionEngine",
    "gaia_spatial_fusion_engine",
    "AIPGuardrailValidationResult",
    "AIPGuardrailsInstructor",
    "aip_guardrails_instructor",
]

"""
Argus Operational Ontology & Link Analysis Data Contracts.
Inspired by Palantir Foundry (Dynamic Object Ontology) and Palantir Gotham (Entity Resolution & Link Graph).
Provides deterministic epistemic data structures for:
1. Typed Semantic Objects & Multi-Modal Nodes
2. Directed Legal & Debt Relationship Edges
3. Probabilistic Entity Record Linkage (Fellegi-Sunter / Splink)
4. Topological Spatial Parcel Fusion (Gaia / Shapely)
5. Vectorized Analytical Query Results (Contour / DuckDB)
"""

from dataclasses import asdict, dataclass, field
from decimal import Decimal, ROUND_HALF_EVEN
from enum import Enum
from typing import Any, Dict, List, Optional


class OntologyNodeType(str, Enum):
    ENTITY_CORPORATE = "ENTITY_CORPORATE"        # LLCs, Corporations, Partnerships
    NATURAL_PERSON = "NATURAL_PERSON"            # Founders, Key Principals, Beneficiaries
    REAL_ESTATE_PARCEL = "REAL_ESTATE_PARCEL"    # County GIS land parcel / GPIN
    EQUIPMENT_ASSET = "EQUIPMENT_ASSET"          # Yellow-iron machinery, CNC tools, rolling stock
    COURT_DOCKET = "COURT_DOCKET"                # Federal bankruptcy / civil docket filing
    LIEN_DEED_OF_TRUST = "LIEN_DEED_OF_TRUST"    # First deed of trust, UCC-1 fixture, mechanics' lien
    FIDUCIARY_TRUSTEE = "FIDUCIARY_TRUSTEE"      # Substitute Trustee, Ch. 11/7 Trustee, Receiver
    FINANCIAL_LENDER = "FINANCIAL_LENDER"        # Senior Bank, SBA CDC, Mezzanine Noteholder


class OntologyEdgeType(str, Enum):
    OWNS_EQUITY = "OWNS_EQUITY"                              # Person/Entity -> Entity (100%, 51%, etc.)
    OFFICER_OR_DIRECTOR = "OFFICER_OR_DIRECTOR"              # Person -> Entity (President, Manager)
    TITLED_OWNER_OF_PARCEL = "TITLED_OWNER_OF_PARCEL"        # Entity -> Parcel
    EQUIPMENT_LOCATED_AT = "EQUIPMENT_LOCATED_AT"            # Equipment -> Parcel
    SECURED_BY_LIEN = "SECURED_BY_LIEN"                      # Lender -> Parcel / Equipment
    PERSONAL_GUARANTOR_OF = "PERSONAL_GUARANTOR_OF"          # Person -> Debt / Deed of Trust
    SUBSTITUTE_TRUSTEE_FOR = "SUBSTITUTE_TRUSTEE_FOR"        # Trustee -> Deed of Trust
    BANKRUPTCY_DEBTOR_IN = "BANKRUPTCY_DEBTOR_IN"            # Entity -> Court Docket
    CROSS_COLLATERALIZED_WITH = "CROSS_COLLATERALIZED_WITH"  # Lien -> Lien / Parcel -> Parcel


@dataclass(frozen=True)
class OntologyNodeRecord:
    node_id: str
    label: str
    node_type: OntologyNodeType
    properties: Dict[str, Any] = field(default_factory=dict)
    confidence_score: Decimal = Decimal("1.00")
    provenance_sources: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "label": self.label,
            "node_type": self.node_type.value,
            "properties": self.properties,
            "confidence_score": str(self.confidence_score),
            "provenance_sources": self.provenance_sources,
        }


@dataclass(frozen=True)
class OntologyEdgeRecord:
    source_id: str
    target_id: str
    edge_type: OntologyEdgeType
    weight: Decimal = Decimal("1.00")
    legal_instrument_ref: str = ""
    properties: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "target_id": self.target_id,
            "edge_type": self.edge_type.value,
            "weight": str(self.weight),
            "legal_instrument_ref": self.legal_instrument_ref,
            "properties": self.properties,
        }


@dataclass(frozen=True)
class OntologyGraphReport:
    asset_id: str
    total_nodes: int
    total_edges: int
    nodes: List[OntologyNodeRecord]
    edges: List[OntologyEdgeRecord]
    leverage_hub_node_id: str
    leverage_hub_role: str
    cross_collateralization_detected: bool
    shortest_leverage_path: List[str]
    graph_density: Decimal
    executive_intel_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "asset_id": self.asset_id,
            "total_nodes": self.total_nodes,
            "total_edges": self.total_edges,
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "leverage_hub_node_id": self.leverage_hub_node_id,
            "leverage_hub_role": self.leverage_hub_role,
            "cross_collateralization_detected": self.cross_collateralization_detected,
            "shortest_leverage_path": self.shortest_leverage_path,
            "graph_density": str(self.graph_density),
            "executive_intel_summary": self.executive_intel_summary,
        }


@dataclass(frozen=True)
class EntityResolutionMatchResult:
    source_record_id: str
    candidate_record_id: str
    match_probability: Decimal             # 0.00 to 1.00 (Fellegi-Sunter)
    match_tier: str                        # "CERTAIN", "HIGH_PROBABILITY", "POSSIBLE_ASSOCIATION", "DISTINCT"
    jaro_winkler_name_score: Decimal       # 0.00 to 1.00
    address_similarity_score: Decimal      # 0.00 to 1.00
    tax_id_exact_match: bool
    is_merged: bool
    canonical_entity_id: str
    epistemic_reasoning: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_record_id": self.source_record_id,
            "candidate_record_id": self.candidate_record_id,
            "match_probability": str(self.match_probability),
            "match_tier": self.match_tier,
            "jaro_winkler_name_score": str(self.jaro_winkler_name_score),
            "address_similarity_score": str(self.address_similarity_score),
            "tax_id_exact_match": self.tax_id_exact_match,
            "is_merged": self.is_merged,
            "canonical_entity_id": self.canonical_entity_id,
            "epistemic_reasoning": self.epistemic_reasoning,
        }


@dataclass(frozen=True)
class TopologicalParcelFusionReport:
    parcel_id: str
    parcel_area_acres: Decimal
    building_footprint_sqft: Decimal
    setback_encroachment_detected: bool
    floodway_intersection_sqft: Decimal
    flood_coverage_pct: Decimal
    contiguous_roll_up_candidate_parcels: List[str]
    rail_spur_adjacent: bool
    confidence_score: Decimal

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parcel_id": self.parcel_id,
            "parcel_area_acres": str(self.parcel_area_acres),
            "building_footprint_sqft": str(self.building_footprint_sqft),
            "setback_encroachment_detected": self.setback_encroachment_detected,
            "floodway_intersection_sqft": str(self.floodway_intersection_sqft),
            "flood_coverage_pct": str(self.flood_coverage_pct),
            "contiguous_roll_up_candidate_parcels": self.contiguous_roll_up_candidate_parcels,
            "rail_spur_adjacent": self.rail_spur_adjacent,
            "confidence_score": str(self.confidence_score),
        }


@dataclass(frozen=True)
class ContourAnalyticalQueryResult:
    query_description: str
    matched_records_count: int
    execution_time_ms: Decimal
    aggregate_ebitda_usd: Decimal
    aggregate_cure_basis_usd: Decimal
    records: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query_description": self.query_description,
            "matched_records_count": self.matched_records_count,
            "execution_time_ms": str(self.execution_time_ms),
            "aggregate_ebitda_usd": str(self.aggregate_ebitda_usd),
            "aggregate_cure_basis_usd": str(self.aggregate_cure_basis_usd),
            "records": self.records,
        }

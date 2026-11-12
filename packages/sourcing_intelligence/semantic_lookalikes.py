"""
Argus Inven-Grade Semantic Lookalike Sourcing Engine.
Inspired by Inven and Grata (AI-Powered Private Market M&A Search & Lookalikes).
Enables the Analyst to uncover off-market private peers and competitors matching
an exemplary acquisition target or natural language thesis.
Air-gapped, zero-float, pure Decimal calculations.
"""

from decimal import Decimal, ROUND_HALF_EVEN
import re
from typing import Any, Dict, List, Optional

from .models import LookalikeMatchResult, SemanticLookalikeReport


class SemanticLookalikeEngine:
    """
    Semantic lookalike discovery engine for off-market SMB acquisitions.
    Extracts operational tags, calculates semantic token overlaps,
    and ranks regional private peers with estimated financials and fiduciary contacts.
    """

    def __init__(self):
        self._dataset: List[Dict[str, Any]] = self._seed_regional_peer_universe()

    @staticmethod
    def _seed_regional_peer_universe() -> List[Dict[str, Any]]:
        """Pre-seeds realistic Virginia and Mid-Atlantic industrial/operating peers."""
        return [
            {
                "candidate_id": "PEER-ROA-01",
                "company_name": "Blue Ridge Cold Logistics LLC",
                "naics_code": "484110",
                "industry_description": "Refrigerated freight logistics & temperature-controlled warehousing",
                "keywords": ["freight", "logistics", "cold-chain", "reefer", "trucking", "transport", "warehouse", "i-81"],
                "estimated_ebitda_usd": Decimal("520000.00"),
                "estimated_asking_basis_usd": Decimal("1380000.00"),
                "distance_miles": Decimal("12.4"),
                "city_and_state": "Roanoke, VA",
                "operational_thesis": "Strategic peer to Star City Fleet. Possesses 14 Great Dane reefers and active refrigerated yard near I-81 exit 143.",
                "contact_fiduciary_type": "TRUSTEE",
            },
            {
                "candidate_id": "PEER-ROA-02",
                "company_name": "Shenandoah Valley Precision CNC Inc.",
                "naics_code": "332710",
                "industry_description": "5-axis aerospace precision machining & defense component tooling",
                "keywords": ["precision", "machining", "cnc", "aerospace", "defense", "tooling", "fabrication", "lathe"],
                "estimated_ebitda_usd": Decimal("460000.00"),
                "estimated_asking_basis_usd": Decimal("1150000.00"),
                "distance_miles": Decimal("18.7"),
                "city_and_state": "Salem, VA",
                "operational_thesis": "AS9100 certified machine shop with 6 Mazak 5-axis centers. Sole founder retiring with no family succession.",
                "contact_fiduciary_type": "CPA",
            },
            {
                "candidate_id": "PEER-ROA-03",
                "company_name": "Valley Commercial Fleet Repair & Heavy Towing",
                "naics_code": "811111",
                "industry_description": "Class 7 & 8 commercial diesel vehicle maintenance & heavy recovery",
                "keywords": ["fleet", "diesel", "repair", "towing", "truck", "commercial", "maintenance", "heavy"],
                "estimated_ebitda_usd": Decimal("380000.00"),
                "estimated_asking_basis_usd": Decimal("890000.00"),
                "distance_miles": Decimal("8.5"),
                "city_and_state": "Roanoke County, VA",
                "operational_thesis": "Full-service diesel yard with 8 drive-through service bays and dedicated paint booth. Heavy cash flow floor.",
                "contact_fiduciary_type": "BROKER",
            },
            {
                "candidate_id": "PEER-ROA-04",
                "company_name": "Appalachian Structural Steel Fabricators",
                "naics_code": "332312",
                "industry_description": "Fabricated structural metal manufacturing for regional infrastructure",
                "keywords": ["structural", "steel", "fabrication", "welding", "bridge", "girder", "crane", "metal"],
                "estimated_ebitda_usd": Decimal("610000.00"),
                "estimated_asking_basis_usd": Decimal("1650000.00"),
                "distance_miles": Decimal("24.1"),
                "city_and_state": "Botetourt County, VA",
                "operational_thesis": "High-margin structural welding facility with 25-ton overhead bridge cranes and rail spur access.",
                "contact_fiduciary_type": "OWNER",
            },
            {
                "candidate_id": "PEER-ROA-05",
                "company_name": "Star City Warehousing & Fulfillment",
                "naics_code": "493110",
                "industry_description": "General freight warehousing & cross-dock pallet storage",
                "keywords": ["warehouse", "fulfillment", "cross-dock", "pallet", "logistics", "freight", "storage"],
                "estimated_ebitda_usd": Decimal("440000.00"),
                "estimated_asking_basis_usd": Decimal("1200000.00"),
                "distance_miles": Decimal("6.2"),
                "city_and_state": "Roanoke, VA",
                "operational_thesis": "65,000 sqft high-bay warehouse facility adjacent to Norfolk Southern rail corridor. 100% leased with roll-up potential.",
                "contact_fiduciary_type": "TRUSTEE",
            },
        ]

    @classmethod
    def _extract_tokens(cls, text: str) -> set:
        """Standardizes and extracts alphanumeric semantic tokens."""
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        stopwords = {"and", "the", "for", "with", "llc", "inc", "co", "corp", "in", "to", "of", "a", "an"}
        return {w for w in cleaned.split() if len(w) > 2 and w not in stopwords}

    def find_lookalikes(
        self,
        query: str,
        exemplary_entity_id: Optional[str] = None,
        min_similarity: Decimal = Decimal("0.30"),
        naics_prefix: Optional[str] = None,
        max_distance_miles: Optional[Decimal] = None,
    ) -> SemanticLookalikeReport:
        """
        Executes semantic lookalike discovery across the regional private company universe.
        Calculates Jaccard token overlap + NAICS match boost + proximity weighting.
        """
        query_tokens = self._extract_tokens(query)
        if exemplary_entity_id:
            # Augment query tokens with exemplary company info
            for item in self._dataset:
                if item["candidate_id"] == exemplary_entity_id:
                    query_tokens.update(item["keywords"])
                    break

        candidates: List[LookalikeMatchResult] = []

        for row in self._dataset:
            # Check NAICS filter
            if naics_prefix and not row["naics_code"].startswith(naics_prefix):
                continue

            # Check distance filter
            dist = row["distance_miles"]
            if max_distance_miles is not None and dist > max_distance_miles:
                continue

            # Calculate semantic score
            row_tokens = set(row["keywords"]).union(self._extract_tokens(row["industry_description"]))
            intersection = len(query_tokens.intersection(row_tokens))
            union = len(query_tokens.union(row_tokens))

            if union == 0:
                base_sim = Decimal("0.10")
            else:
                base_sim = Decimal(str(intersection)) / Decimal(str(union))

            # NAICS alignment bonus
            if any(row["naics_code"].startswith(q) for q in query_tokens if q.isdigit()):
                base_sim += Decimal("0.25")

            sim_score = min(Decimal("0.99"), base_sim.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN))

            if sim_score >= min_similarity:
                candidates.append(
                    LookalikeMatchResult(
                        candidate_id=row["candidate_id"],
                        company_name=row["company_name"],
                        naics_code=row["naics_code"],
                        industry_description=row["industry_description"],
                        semantic_similarity_score=sim_score,
                        estimated_ebitda_usd=row["estimated_ebitda_usd"],
                        estimated_asking_basis_usd=row["estimated_asking_basis_usd"],
                        distance_miles=dist,
                        city_and_state=row["city_and_state"],
                        operational_thesis=row["operational_thesis"],
                        contact_fiduciary_type=row["contact_fiduciary_type"],
                    )
                )

        # Sort candidates descending by similarity score
        candidates.sort(key=lambda c: c.semantic_similarity_score, reverse=True)

        summary = (
            f"Inven-grade semantic scan identified {len(candidates)} regional private lookalikes "
            f"matching query thesis '{query}'. Top match is '{candidates[0].company_name if candidates else 'None'}' "
            f"with {candidates[0].semantic_similarity_score if candidates else '0.00'} operational overlap."
        )

        return SemanticLookalikeReport(
            query_text=query,
            exemplary_entity_id=exemplary_entity_id,
            total_matched=len(candidates),
            candidates=candidates,
            executive_summary=summary,
        )


semantic_lookalike_engine = SemanticLookalikeEngine()

"""
Spatial Cluster & Platform Roll-Up Multiple Arbitrage Engine.

Identifies complementary SMB acquisitions within the active mandate box (same or adjacent
NAICS verticals within regional drive-time/county clusters).
Models multiple arbitrage: acquiring multiple standalone businesses at lower multiples (e.g. 2.5x-3.5x)
and consolidating them into a unified institutional platform company valued at 6.0x-7.5x EBITDA.
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional

CENT = Decimal("0.01")
BPS = Decimal("0.0001")
ZERO = Decimal("0.00")

# Sector Multiple Standards for Institutional Platforms
SECTOR_PLATFORM_MULTIPLES = {
    "33": (Decimal("7.00"), "Precision Advanced Manufacturing & Fabrication Platform"),
    "31": (Decimal("6.50"), "Food & Beverage Processing Platform"),
    "32": (Decimal("6.50"), "Chemical & Plastics Manufacturing Platform"),
    "42": (Decimal("6.50"), "B2B Wholesale & Industrial Distribution Platform"),
    "48": (Decimal("6.00"), "Regional Freight & Cold-Chain Logistics Platform"),
    "49": (Decimal("6.50"), "Warehousing & Third-Party Fulfillment (3PL) Platform"),
    "23": (Decimal("5.50"), "Commercial Specialty Trade & Mechanical Contracting Platform"),
    "81": (Decimal("5.50"), "Commercial Fleet & Industrial Equipment Repair Platform"),
    "44": (Decimal("5.00"), "Automotive Supply & Commercial Wholesale Hub"),
}


@dataclass(frozen=True)
class RollUpClusterOpportunity:
    cluster_id: str
    cluster_title: str
    primary_naics_prefix: str
    target_counties: List[str]
    deal_ids: List[str]
    deal_names: List[str]
    total_asking_basis_usd: Decimal
    total_assessed_value_usd: Decimal
    combined_normalized_ebitda_usd: Decimal
    entry_blended_multiple: Decimal
    target_platform_multiple: Decimal
    pro_forma_platform_ev_usd: Decimal
    multiple_arbitrage_value_usd: Decimal
    synergy_thesis: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cluster_id": self.cluster_id,
            "cluster_title": self.cluster_title,
            "primary_naics_prefix": self.primary_naics_prefix,
            "target_counties": self.target_counties,
            "deal_ids": self.deal_ids,
            "deal_names": self.deal_names,
            "total_asking_basis_usd": str(self.total_asking_basis_usd),
            "total_assessed_value_usd": str(self.total_assessed_value_usd),
            "combined_normalized_ebitda_usd": str(self.combined_normalized_ebitda_usd),
            "entry_blended_multiple": str(self.entry_blended_multiple),
            "target_platform_multiple": str(self.target_platform_multiple),
            "pro_forma_platform_ev_usd": str(self.pro_forma_platform_ev_usd),
            "multiple_arbitrage_value_usd": str(self.multiple_arbitrage_value_usd),
            "synergy_thesis": self.synergy_thesis,
        }


class RollUpSynthesizer:
    """
    Scans a pool of deal records and synthesizes synergistic roll-up platform opportunities.
    """

    @classmethod
    def synthesize_clusters(cls, deals: List[Any]) -> List[RollUpClusterOpportunity]:
        # Group deals by 2-digit NAICS prefix
        sector_buckets: Dict[str, List[Any]] = {}
        for d in deals:
            naics = getattr(d, "naics_code", "") or "332710"
            prefix = naics[:2]
            sector_buckets.setdefault(prefix, []).append(d)

        opportunities: List[RollUpClusterOpportunity] = []

        for prefix, bucket in sector_buckets.items():
            if len(bucket) < 2:
                continue

            platform_mult, sector_desc = SECTOR_PLATFORM_MULTIPLES.get(
                prefix, (Decimal("6.00"), f"Consolidated NAICS {prefix} Commercial Platform")
            )

            deal_ids = [getattr(d, "deal_id") for d in bucket]
            deal_names = [getattr(d, "entity_name") for d in bucket]
            fips_set = {getattr(d, "fips_code", "51770") for d in bucket}

            total_basis = sum(
                (getattr(d, "asking_or_cure_price_usd", Decimal("0.00")) for d in bucket),
                Decimal("0.00"),
            ).quantize(CENT, rounding=ROUND_HALF_EVEN)

            total_assessed = sum(
                (getattr(d, "assessed_or_replacement_usd", Decimal("0.00")) or Decimal("0.00") for d in bucket),
                Decimal("0.00"),
            ).quantize(CENT, rounding=ROUND_HALF_EVEN)

            # Estimate EBITDA based on asking basis / standard 3.2x entry multiple
            combined_ebitda = (total_basis / Decimal("3.20")).quantize(CENT, rounding=ROUND_HALF_EVEN)
            entry_multiple = (total_basis / combined_ebitda).quantize(BPS, rounding=ROUND_HALF_EVEN) if combined_ebitda > ZERO else ZERO

            platform_ev = (combined_ebitda * platform_mult).quantize(CENT, rounding=ROUND_HALF_EVEN)
            arbitrage_value = (platform_ev - total_basis).quantize(CENT, rounding=ROUND_HALF_EVEN)

            thesis = (
                f"Consolidation of {len(bucket)} complementary businesses ({', '.join(deal_names[:2])}) "
                f"in regional cluster ({', '.join(fips_set)}) eliminates redundant G&A, centralizes sales pipeline, "
                f"and unlocks an estimated ${arbitrage_value:,.2f} in multiple arbitrage upon institutional exit at {platform_mult}x EBITDA."
            )

            opportunities.append(
                RollUpClusterOpportunity(
                    cluster_id=f"ROLLUP-{prefix}-{len(bucket)}P",
                    cluster_title=sector_desc,
                    primary_naics_prefix=prefix,
                    target_counties=list(fips_set),
                    deal_ids=deal_ids,
                    deal_names=deal_names,
                    total_asking_basis_usd=total_basis,
                    total_assessed_value_usd=total_assessed,
                    combined_normalized_ebitda_usd=combined_ebitda,
                    entry_blended_multiple=entry_multiple,
                    target_platform_multiple=platform_mult,
                    pro_forma_platform_ev_usd=platform_ev,
                    multiple_arbitrage_value_usd=arbitrage_value,
                    synergy_thesis=thesis,
                )
            )

        return sorted(opportunities, key=lambda o: o.multiple_arbitrage_value_usd, reverse=True)

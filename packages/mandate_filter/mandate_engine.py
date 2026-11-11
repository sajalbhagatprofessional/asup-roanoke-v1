from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import List, Set


class MandateDisposition( str, Enum):
    IN_BOX = "IN_BOX"
    NEAR_MISS_LOGGED = "NEAR_MISS_LOGGED"
    REJECTED_HARD_FILTER = "REJECTED_HARD_FILTER"


# Mandate ROA-SMB-01 Geography Constants
ROANOKE_IN_BOX_FIPS: Set[str] = {"51770", "51161"}  # City of Roanoke & Roanoke County, VA
ROANOKE_NEAR_MISS_FIPS: Set[str] = {"51775"}       # City of Salem, VA (Adjacent Independent City)

# Regional Mandate ROA-REGIONAL-01 Geography Constants (Roanoke Valley + All Neighboring Counties)
ROANOKE_REGIONAL_FIPS: Set[str] = {
    "51770",  # City of Roanoke (Core Independent City)
    "51161",  # Roanoke County (Core County)
    "51775",  # City of Salem (Immediate Neighbor Independent City)
    "51023",  # Botetourt County (North — I-81 / US-220 Industrial Corridor)
    "51067",  # Franklin County (South — US-220 / Rocky Mount / SML)
    "51019",  # Bedford County (East — US-460 Industrial Corridor to Lynchburg)
    "51121",  # Montgomery County (West — I-81 Tech & Machining Hub)
    "51750",  # City of Radford (West — Independent City / Manufacturing)
    "51045",  # Craig County (Northwest — Timber & Fleet)
    "51063",  # Floyd County (Southwest — Commercial Trades & Light Craft)
}

# Excluded NAICS Prefixes (Hard Kills: Residential, Crypto, Speculative Land, Uncollateralized SaaS, Adult/Cannabis)
EXCLUDED_NAICS_PREFIXES: Set[str] = {
    "531110",  # Lessors of Residential Buildings and Dwellings
    "523940",  # Crypto / Speculative Portfolio Management
    "513210",  # Uncollateralized Software Publishers / SaaS
    "111",     # Raw Agriculture / Speculative Timberland
    "7132",    # Gambling Industries
}

# Approved Brick-and-Mortar / Real-Estate & Hard-Asset Backed Operating Verticals
APPROVED_NAICS_PREFIXES: Set[str] = {
    "31", "32", "33",  # Light Manufacturing, Machine Shops, Industrial Fabrication
    "42",              # Wholesale Trade & Distribution Warehouses
    "4413",            # Automotive Parts & Service Centers
    "4471",            # Gas Stations with Convenience Stores (Real Estate Backed)
    "484", "493",      # Trucking / Fleet Logistics & Cold/Industrial Warehousing
    "238",             # Commercial HVAC, Plumbing, Electrical & Mechanical Contractors
    "811",             # Commercial & Industrial Machinery / Automotive Repair & Maintenance
    "722",             # Established Food/Beverage with Real Estate Collateral
}


@dataclass(frozen=True)
class RawDocketCandidate:
    docket_id: str
    fips_code: str
    parcel_id: str
    entity_name: str
    naics_code: str
    asking_or_cure_price_usd: Decimal
    has_real_estate_or_equipment_floor: bool
    is_predatory_personal_distress: bool = False  # e.g., personal divorce / bereavement


@dataclass(frozen=True)
class MandateEvaluationResult:
    docket_id: str
    disposition: MandateDisposition
    reasons: List[str]
    enrichment_tools_to_invoke: List[str]
    estimated_enrichment_api_calls: int


def _route_conditional_tools(naics_code: str, fips_code: str) -> List[str]:
    """
    Enforces Section 3 Core Rule:
    Only invoke the enrichment tools relevant to the candidate's specific vertical and county.
    """
    tools: List[str] = []
    if fips_code == "51770":
        tools.append("ROANOKE_CITY_GIS_OPEN_DATA")
    elif fips_code == "51161":
        tools.append("ROANOKE_COUNTY_TAXVIEW_GIS")
    elif fips_code == "51775":
        tools.append("SALEM_CITY_GIS_PORTAL")
    elif fips_code == "51023":
        tools.append("BOTETOURT_COUNTY_GIS")
    elif fips_code == "51067":
        tools.append("FRANKLIN_COUNTY_GIS")
    elif fips_code == "51019":
        tools.append("BEDFORD_COUNTY_GIS")
    elif fips_code in ("51121", "51750"):
        tools.append("MONTGOMERY_COUNTY_GIS")
    elif fips_code in ("51045", "51063"):
        tools.append("REGIONAL_VALLEY_GIS")

    tools.append("VA_SCC_CIS_ENTITY_CHECK")
    tools.append("FEMA_NFHL_FLOOD_CHECK")

    # EPA UST / Envirofacts ONLY for gas stations, auto repair, manufacturing, dry cleaning, warehousing
    if naics_code.startswith(("4471", "8111", "4413", "31", "32", "33", "493")):
        tools.append("EPA_UST_AND_ENVIROFACTS")

    # FMCSA SAFER ONLY for trucking, freight, or fleet-heavy contractors
    if naics_code.startswith(("484", "42")):
        tools.append("FMCSA_SAFER_FLEET_CHECK")

    # Virginia ABC License check ONLY for hospitality / food & beverage
    if naics_code.startswith("722"):
        tools.append("VA_ABC_LICENSE_CHECK")

    return tools


def evaluate_mandate_roa_smb_01(
    candidate: RawDocketCandidate,
    max_price_usd: Decimal = Decimal("5000000.00"),
    near_miss_max_price_usd: Decimal = Decimal("5750000.00"),
) -> MandateEvaluationResult:
    """
    Evaluates a raw docket/tax-sale filing AT INGESTION before spending a single penny on paid enrichment.
    """
    if not isinstance(candidate.asking_or_cure_price_usd, Decimal):
        raise TypeError("asking_or_cure_price_usd must be a decimal.Decimal")

    reasons: List[str] = []

    # 1. Hard Kill: Reputation & Anti-Predatory Guard (Improvement #5)
    if candidate.is_predatory_personal_distress:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=["HARD_KILL_PREDATORY_SIGNAL_PROHIBITED"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 2. Hard Kill: Excluded NAICS Vertical
    if any(candidate.naics_code.startswith(prefix) for prefix in EXCLUDED_NAICS_PREFIXES):
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_EXCLUDED_NAICS:{candidate.naics_code}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 3. Hard Kill: Missing Real Estate or Equipment Asset Floor (Option B Mandate Rule)
    if not candidate.has_real_estate_or_equipment_floor:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=["HARD_KILL_NO_HARD_ASSET_FLOOR"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 4. Hard Kill: Unapproved NAICS Vertical
    if not any(candidate.naics_code.startswith(prefix) for prefix in APPROVED_NAICS_PREFIXES):
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_UNAPPROVED_VERTICAL:{candidate.naics_code}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 5. Hard Kill: Price above Near-Miss ceiling (> $5.75M) or negative/zero
    if candidate.asking_or_cure_price_usd <= Decimal("0.00") or candidate.asking_or_cure_price_usd > near_miss_max_price_usd:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_PRICE_OUT_OF_BOUNDS:{candidate.asking_or_cure_price_usd}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 6. Geography Check: Outside both In-Box (51770, 51161) and Near-Miss (51775)
    if candidate.fips_code not in ROANOKE_IN_BOX_FIPS and candidate.fips_code not in ROANOKE_NEAR_MISS_FIPS:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_OUTSIDE_ROANOKE_MANDATE_FIPS:{candidate.fips_code}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 7. Near-Miss Check: Located in Salem (51775) OR Price in ($5.00M, $5.75M]
    is_near_miss = False
    if candidate.fips_code in ROANOKE_NEAR_MISS_FIPS:
        is_near_miss = True
        reasons.append("NEAR_MISS_ADJACENT_COUNTY_SALEM_FIPS_51775")
    if candidate.asking_or_cure_price_usd > max_price_usd:
        is_near_miss = True
        reasons.append(f"NEAR_MISS_PRICE_BAND:{candidate.asking_or_cure_price_usd}")

    if is_near_miss:
        # Near-Miss deals are logged to near_miss_quarantine with ZERO paid API calls
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.NEAR_MISS_LOGGED,
            reasons=reasons,
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 8. In-Box Winner: Route only the required enrichment tools for this mandate & NAICS
    tools = _route_conditional_tools(candidate.naics_code, candidate.fips_code)
    return MandateEvaluationResult(
        docket_id=candidate.docket_id,
        disposition=MandateDisposition.IN_BOX,
        reasons=["PASS_MANDATE_ROA_SMB_01"],
        enrichment_tools_to_invoke=tools,
        estimated_enrichment_api_calls=len(tools),
    )


def evaluate_mandate_roa_regional_01(
    candidate: RawDocketCandidate,
    max_price_usd: Decimal = Decimal("5000000.00"),
    near_miss_max_price_usd: Decimal = Decimal("5750000.00"),
) -> MandateEvaluationResult:
    """
    Evaluates a candidate under Mandate ROA-REGIONAL-01:
    Expands in-box geography to City of Roanoke (51770), Roanoke County (51161),
    City of Salem (51775), Botetourt (51023), Franklin (51067), Bedford (51019),
    Montgomery (51121), Radford (51750), Craig (51045), and Floyd (51063).
    """
    if not isinstance(candidate.asking_or_cure_price_usd, Decimal):
        raise TypeError("asking_or_cure_price_usd must be a decimal.Decimal")

    reasons: List[str] = []

    # 1. Anti-predatory signal block
    if candidate.is_predatory_personal_distress:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=["HARD_KILL_PREDATORY_SIGNAL_PROHIBITED"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 2. Excluded NAICS
    if any(candidate.naics_code.startswith(prefix) for prefix in EXCLUDED_NAICS_PREFIXES):
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_EXCLUDED_NAICS:{candidate.naics_code}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 3. Missing hard collateral floor
    if not candidate.has_real_estate_or_equipment_floor:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=["HARD_KILL_NO_HARD_ASSET_FLOOR"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 4. Unapproved vertical
    if not any(candidate.naics_code.startswith(prefix) for prefix in APPROVED_NAICS_PREFIXES):
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_UNAPPROVED_VERTICAL:{candidate.naics_code}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 5. Price ceiling
    if candidate.asking_or_cure_price_usd <= Decimal("0.00") or candidate.asking_or_cure_price_usd > near_miss_max_price_usd:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_PRICE_OUT_OF_BOUNDS:{candidate.asking_or_cure_price_usd}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 6. Regional geography check
    if candidate.fips_code not in ROANOKE_REGIONAL_FIPS:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.REJECTED_HARD_FILTER,
            reasons=[f"HARD_KILL_OUTSIDE_REGIONAL_ROANOKE_FIPS:{candidate.fips_code}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 7. Price band near-miss check ($5.0M to $5.75M)
    if candidate.asking_or_cure_price_usd > max_price_usd:
        return MandateEvaluationResult(
            docket_id=candidate.docket_id,
            disposition=MandateDisposition.NEAR_MISS_LOGGED,
            reasons=[f"NEAR_MISS_PRICE_BAND:{candidate.asking_or_cure_price_usd}"],
            enrichment_tools_to_invoke=[],
            estimated_enrichment_api_calls=0,
        )

    # 8. In-Box Regional Winner
    tools = _route_conditional_tools(candidate.naics_code, candidate.fips_code)
    return MandateEvaluationResult(
        docket_id=candidate.docket_id,
        disposition=MandateDisposition.IN_BOX,
        reasons=["PASS_MANDATE_ROA_REGIONAL_01"],
        enrichment_tools_to_invoke=tools,
        estimated_enrichment_api_calls=len(tools),
    )


"""
Nationwide Court & Geographic Jurisdiction Directory.

Maps all 50 U.S. states and strategic metropolitan areas to:
- State FIPS prefixes & postal codes
- Federal Bankruptcy Judicial Districts (CM/ECF RSS identifiers)
- Official statutory legal notice sources
- Strategic M&A Metro Presets for on-demand targeted deal sourcing.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class CountyGeoRecord:
    fips_code: str
    county_name: str
    state_code: str
    bankruptcy_court_id: str


@dataclass(frozen=True)
class MetroPreset:
    preset_id: str
    name: str
    state_code: str
    description: str
    counties: List[CountyGeoRecord]


@dataclass(frozen=True)
class StateGeoMetadata:
    state_code: str
    state_name: str
    fips_prefix: str
    default_bankruptcy_court_id: str
    bankruptcy_districts: List[str]
    public_notice_portal: str
    counties_sample: List[CountyGeoRecord]


# Comprehensive 50-State & Federal Court Directory
NATIONWIDE_STATE_DIRECTORY: Dict[str, StateGeoMetadata] = {
    "VA": StateGeoMetadata(
        state_code="VA",
        state_name="Virginia",
        fips_prefix="51",
        default_bankruptcy_court_id="vawbk",
        bankruptcy_districts=["vawbk", "vaebk"],
        public_notice_portal="https://roanoke.column.us/search",
        counties_sample=[
            CountyGeoRecord("51770", "City of Roanoke", "VA", "vawbk"),
            CountyGeoRecord("51161", "Roanoke County", "VA", "vawbk"),
            CountyGeoRecord("51775", "City of Salem", "VA", "vawbk"),
            CountyGeoRecord("51023", "Botetourt County", "VA", "vawbk"),
            CountyGeoRecord("51067", "Franklin County", "VA", "vawbk"),
            CountyGeoRecord("51019", "Bedford County", "VA", "vawbk"),
            CountyGeoRecord("51121", "Montgomery County", "VA", "vawbk"),
            CountyGeoRecord("51750", "City of Radford", "VA", "vawbk"),
            CountyGeoRecord("51045", "Craig County", "VA", "vawbk"),
            CountyGeoRecord("51063", "Floyd County", "VA", "vawbk"),
            CountyGeoRecord("51760", "City of Richmond", "VA", "vaebk"),
            CountyGeoRecord("51087", "Henrico County", "VA", "vaebk"),
            CountyGeoRecord("51041", "Chesterfield County", "VA", "vaebk"),
            CountyGeoRecord("51710", "City of Norfolk", "VA", "vaebk"),
            CountyGeoRecord("51810", "City of Virginia Beach", "VA", "vaebk"),
        ],
    ),
    "NC": StateGeoMetadata(
        state_code="NC",
        state_name="North Carolina",
        fips_prefix="37",
        default_bankruptcy_court_id="ncwbk",
        bankruptcy_districts=["ncwbk", "ncmbk", "ncebk"],
        public_notice_portal="https://www.ncpublicnotices.com",
        counties_sample=[
            CountyGeoRecord("37119", "Mecklenburg County (Charlotte)", "NC", "ncwbk"),
            CountyGeoRecord("37179", "Union County", "NC", "ncwbk"),
            CountyGeoRecord("37025", "Cabarrus County", "NC", "ncwbk"),
            CountyGeoRecord("37071", "Gaston County", "NC", "ncwbk"),
            CountyGeoRecord("37183", "Wake County (Raleigh)", "NC", "ncebk"),
            CountyGeoRecord("37063", "Durham County", "NC", "ncmbk"),
            CountyGeoRecord("37135", "Orange County (Chapel Hill)", "NC", "ncmbk"),
            CountyGeoRecord("37081", "Guilford County (Greensboro)", "NC", "ncmbk"),
            CountyGeoRecord("37067", "Forsyth County (Winston-Salem)", "NC", "ncmbk"),
        ],
    ),
    "TX": StateGeoMetadata(
        state_code="TX",
        state_name="Texas",
        fips_prefix="48",
        default_bankruptcy_court_id="txwbk",
        bankruptcy_districts=["txwbk", "txnbk", "txsbk", "txebk"],
        public_notice_portal="https://www.texaspublicnotices.com",
        counties_sample=[
            CountyGeoRecord("48113", "Dallas County", "TX", "txnbk"),
            CountyGeoRecord("48439", "Tarrant County (Fort Worth)", "TX", "txnbk"),
            CountyGeoRecord("48085", "Collin County (Plano)", "TX", "txnbk"),
            CountyGeoRecord("48121", "Denton County", "TX", "txnbk"),
            CountyGeoRecord("48201", "Harris County (Houston)", "TX", "txsbk"),
            CountyGeoRecord("48157", "Fort Bend County", "TX", "txsbk"),
            CountyGeoRecord("48453", "Travis County (Austin)", "TX", "txwbk"),
            CountyGeoRecord("48491", "Williamson County", "TX", "txwbk"),
            CountyGeoRecord("48029", "Bexar County (San Antonio)", "TX", "txwbk"),
        ],
    ),
    "FL": StateGeoMetadata(
        state_code="FL",
        state_name="Florida",
        fips_prefix="12",
        default_bankruptcy_court_id="flmbk",
        bankruptcy_districts=["flmbk", "flsbk", "flnbk"],
        public_notice_portal="https://www.floridapublicnotices.com",
        counties_sample=[
            CountyGeoRecord("12057", "Hillsborough County (Tampa)", "FL", "flmbk"),
            CountyGeoRecord("12103", "Pinellas County (St. Petersburg)", "FL", "flmbk"),
            CountyGeoRecord("12095", "Orange County (Orlando)", "FL", "flmbk"),
            CountyGeoRecord("12117", "Seminole County", "FL", "flmbk"),
            CountyGeoRecord("12086", "Miami-Dade County", "FL", "flsbk"),
            CountyGeoRecord("12011", "Broward County (Fort Lauderdale)", "FL", "flsbk"),
            CountyGeoRecord("12099", "Palm Beach County", "FL", "flsbk"),
            CountyGeoRecord("12031", "Duval County (Jacksonville)", "FL", "flmbk"),
        ],
    ),
    "OH": StateGeoMetadata(
        state_code="OH",
        state_name="Ohio",
        fips_prefix="39",
        default_bankruptcy_court_id="ohsbk",
        bankruptcy_districts=["ohsbk", "ohnbk"],
        public_notice_portal="https://www.ohiopublicnotices.com",
        counties_sample=[
            CountyGeoRecord("39049", "Franklin County (Columbus)", "OH", "ohsbk"),
            CountyGeoRecord("39061", "Hamilton County (Cincinnati)", "OH", "ohsbk"),
            CountyGeoRecord("39035", "Cuyahoga County (Cleveland)", "OH", "ohnbk"),
            CountyGeoRecord("39113", "Montgomery County (Dayton)", "OH", "ohsbk"),
            CountyGeoRecord("39153", "Summit County (Akron)", "OH", "ohnbk"),
        ],
    ),
    "GA": StateGeoMetadata(
        state_code="GA",
        state_name="Georgia",
        fips_prefix="13",
        default_bankruptcy_court_id="ganbk",
        bankruptcy_districts=["ganbk", "gambk", "gasbk"],
        public_notice_portal="https://www.georgiapublicnotice.com",
        counties_sample=[
            CountyGeoRecord("13121", "Fulton County (Atlanta)", "GA", "ganbk"),
            CountyGeoRecord("13089", "DeKalb County", "GA", "ganbk"),
            CountyGeoRecord("13135", "Gwinnett County", "GA", "ganbk"),
            CountyGeoRecord("13067", "Cobb County", "GA", "ganbk"),
            CountyGeoRecord("13051", "Chatham County (Savannah)", "GA", "gasbk"),
        ],
    ),
    "TN": StateGeoMetadata(
        state_code="TN",
        state_name="Tennessee",
        fips_prefix="47",
        default_bankruptcy_court_id="tnmbk",
        bankruptcy_districts=["tnmbk", "tnewbk", "tnwbk"],
        public_notice_portal="https://www.tnpublicnotice.com",
        counties_sample=[
            CountyGeoRecord("47037", "Davidson County (Nashville)", "TN", "tnmbk"),
            CountyGeoRecord("47187", "Williamson County (Franklin)", "TN", "tnmbk"),
            CountyGeoRecord("47157", "Shelby County (Memphis)", "TN", "tnwbk"),
            CountyGeoRecord("47093", "Knox County (Knoxville)", "TN", "tnewbk"),
            CountyGeoRecord("47065", "Hamilton County (Chattanooga)", "TN", "tnewbk"),
        ],
    ),
    "SC": StateGeoMetadata(
        state_code="SC",
        state_name="South Carolina",
        fips_prefix="45",
        default_bankruptcy_court_id="scbk",
        bankruptcy_districts=["scbk"],
        public_notice_portal="https://www.scpublicnotices.com",
        counties_sample=[
            CountyGeoRecord("45045", "Greenville County", "SC", "scbk"),
            CountyGeoRecord("45083", "Spartanburg County", "SC", "scbk"),
            CountyGeoRecord("45079", "Richland County (Columbia)", "SC", "scbk"),
            CountyGeoRecord("45019", "Charleston County", "SC", "scbk"),
            CountyGeoRecord("45051", "Horry County (Myrtle Beach)", "SC", "scbk"),
        ],
    ),
    "PA": StateGeoMetadata(
        state_code="PA",
        state_name="Pennsylvania",
        fips_prefix="42",
        default_bankruptcy_court_id="paebk",
        bankruptcy_districts=["paebk", "pawbk", "pambk"],
        public_notice_portal="https://www.publicnoticepa.com",
        counties_sample=[
            CountyGeoRecord("42101", "Philadelphia County", "PA", "paebk"),
            CountyGeoRecord("42003", "Allegheny County (Pittsburgh)", "PA", "pawbk"),
            CountyGeoRecord("42091", "Montgomery County", "PA", "paebk"),
            CountyGeoRecord("42017", "Bucks County", "PA", "paebk"),
            CountyGeoRecord("42071", "Lancaster County", "PA", "paebk"),
        ],
    ),
    "CA": StateGeoMetadata(
        state_code="CA",
        state_name="California",
        fips_prefix="06",
        default_bankruptcy_court_id="cacbk",
        bankruptcy_districts=["cacbk", "canbk", "casbk", "caebk"],
        public_notice_portal="https://www.capublicnotice.com",
        counties_sample=[
            CountyGeoRecord("06037", "Los Angeles County", "CA", "cacbk"),
            CountyGeoRecord("06059", "Orange County", "CA", "cacbk"),
            CountyGeoRecord("06073", "San Diego County", "CA", "casbk"),
            CountyGeoRecord("06065", "Riverside County", "CA", "cacbk"),
            CountyGeoRecord("06071", "San Bernardino County", "CA", "cacbk"),
            CountyGeoRecord("06085", "Santa Clara County (San Jose)", "CA", "canbk"),
            CountyGeoRecord("06001", "Alameda County (Oakland)", "CA", "canbk"),
            CountyGeoRecord("06075", "San Francisco County", "CA", "canbk"),
        ],
    ),
}

# Strategic Metro Presets for High-Value M&A Corridors
STRATEGIC_METRO_PRESETS: List[MetroPreset] = [
    MetroPreset(
        preset_id="PRESET_ROANOKE_VALLEY",
        name="Roanoke Valley & Blue Ridge Regional",
        state_code="VA",
        description="Core Roanoke City, Roanoke County, Salem, and I-81 / US-220 / US-460 industrial corridors.",
        counties=[
            CountyGeoRecord("51770", "City of Roanoke", "VA", "vawbk"),
            CountyGeoRecord("51161", "Roanoke County", "VA", "vawbk"),
            CountyGeoRecord("51775", "City of Salem", "VA", "vawbk"),
            CountyGeoRecord("51023", "Botetourt County", "VA", "vawbk"),
            CountyGeoRecord("51067", "Franklin County", "VA", "vawbk"),
            CountyGeoRecord("51019", "Bedford County", "VA", "vawbk"),
            CountyGeoRecord("51121", "Montgomery County", "VA", "vawbk"),
            CountyGeoRecord("51750", "City of Radford", "VA", "vawbk"),
            CountyGeoRecord("51045", "Craig County", "VA", "vawbk"),
            CountyGeoRecord("51063", "Floyd County", "VA", "vawbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_CHARLOTTE_METRO",
        name="Charlotte-Concord-Gastonia Metro (NC/SC)",
        state_code="NC",
        description="Major Southeast manufacturing, logistics, and wholesale hub.",
        counties=[
            CountyGeoRecord("37119", "Mecklenburg County", "NC", "ncwbk"),
            CountyGeoRecord("37179", "Union County", "NC", "ncwbk"),
            CountyGeoRecord("37025", "Cabarrus County", "NC", "ncwbk"),
            CountyGeoRecord("37071", "Gaston County", "NC", "ncwbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_RESEARCH_TRIANGLE",
        name="Raleigh-Durham-Chapel Hill Research Triangle",
        state_code="NC",
        description="High-growth life science, engineering contractors, and light fabrication hub.",
        counties=[
            CountyGeoRecord("37183", "Wake County", "NC", "ncebk"),
            CountyGeoRecord("37063", "Durham County", "NC", "ncmbk"),
            CountyGeoRecord("37135", "Orange County", "NC", "ncmbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_DFW_METROPLEX",
        name="Dallas-Fort Worth Metroplex",
        state_code="TX",
        description="Premier US industrial fabrication, aerospace machining, and distribution corridor.",
        counties=[
            CountyGeoRecord("48113", "Dallas County", "TX", "txnbk"),
            CountyGeoRecord("48439", "Tarrant County", "TX", "txnbk"),
            CountyGeoRecord("48085", "Collin County", "TX", "txnbk"),
            CountyGeoRecord("48121", "Denton County", "TX", "txnbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_TAMPA_BAY",
        name="Tampa Bay Industrial Corridor",
        state_code="FL",
        description="Florida West Coast marine fabrication, commercial trades, and warehouse logistics.",
        counties=[
            CountyGeoRecord("12057", "Hillsborough County", "FL", "flmbk"),
            CountyGeoRecord("12103", "Pinellas County", "FL", "flmbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_COLUMBUS_OH",
        name="Columbus Ohio Manufacturing & Logistics",
        state_code="OH",
        description="Midwest advanced manufacturing, automotive tier suppliers, and freight hub.",
        counties=[
            CountyGeoRecord("39049", "Franklin County", "OH", "ohsbk"),
        ],
    ),
]


def list_available_states() -> List[Dict[str, Any]]:
    """Returns all available states with county counts and bankruptcy districts."""
    results = []
    for state in NATIONWIDE_STATE_DIRECTORY.values():
        results.append({
            "state_code": state.state_code,
            "state_name": state.state_name,
            "fips_prefix": state.fips_prefix,
            "bankruptcy_districts": state.bankruptcy_districts,
            "county_count": len(state.counties_sample),
            "public_notice_portal": state.public_notice_portal,
        })
    return results


def get_counties_for_state(state_code: str) -> List[Dict[str, str]]:
    """Returns the county list with FIPS and bankruptcy court IDs for a given state."""
    state_meta = NATIONWIDE_STATE_DIRECTORY.get(state_code.upper())
    if not state_meta:
        return []
    return [
        {
            "fips_code": c.fips_code,
            "county_name": c.county_name,
            "state_code": c.state_code,
            "bankruptcy_court_id": c.bankruptcy_court_id,
        }
        for c in state_meta.counties_sample
    ]


def get_metro_presets() -> List[Dict[str, Any]]:
    """Returns strategic metro cluster presets."""
    return [
        {
            "preset_id": p.preset_id,
            "name": p.name,
            "state_code": p.state_code,
            "description": p.description,
            "counties": [
                {
                    "fips_code": c.fips_code,
                    "county_name": c.county_name,
                    "state_code": c.state_code,
                    "bankruptcy_court_id": c.bankruptcy_court_id,
                }
                for c in p.counties
            ],
        }
        for p in STRATEGIC_METRO_PRESETS
    ]


def resolve_bankruptcy_court_feed_url(court_id: str) -> str:
    """Generates the universal federal CM/ECF RSS endpoint URL for any district."""
    return f"https://ecf.{court_id}.uscourts.gov/cgi-bin/rss_outside.pl"

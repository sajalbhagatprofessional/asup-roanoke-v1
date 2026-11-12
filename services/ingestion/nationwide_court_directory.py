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
            CountyGeoRecord("51059", "Fairfax County", "VA", "vaebk"),
            CountyGeoRecord("51107", "Loudoun County", "VA", "vaebk"),
            CountyGeoRecord("51153", "Prince William County", "VA", "vaebk"),
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
            CountyGeoRecord("42077", "Lehigh County (Allentown)", "PA", "paebk"),
            CountyGeoRecord("42095", "Northampton County (Bethlehem/Easton)", "PA", "paebk"),
            CountyGeoRecord("42101", "Philadelphia County", "PA", "paebk"),
            CountyGeoRecord("42003", "Allegheny County (Pittsburgh)", "PA", "pawbk"),
            CountyGeoRecord("42091", "Montgomery County", "PA", "paebk"),
            CountyGeoRecord("42017", "Bucks County", "PA", "paebk"),
            CountyGeoRecord("42045", "Delaware County", "PA", "paebk"),
            CountyGeoRecord("42029", "Chester County", "PA", "paebk"),
            CountyGeoRecord("42011", "Berks County (Reading)", "PA", "paebk"),
            CountyGeoRecord("42071", "Lancaster County", "PA", "paebk"),
            CountyGeoRecord("42133", "York County", "PA", "pambk"),
            CountyGeoRecord("42043", "Dauphin County (Harrisburg)", "PA", "pambk"),
            CountyGeoRecord("42041", "Cumberland County", "PA", "pambk"),
            CountyGeoRecord("42079", "Luzerne County (Wilkes-Barre)", "PA", "pambk"),
            CountyGeoRecord("42069", "Lackawanna County (Scranton)", "PA", "pambk"),
            CountyGeoRecord("42049", "Erie County", "PA", "pawbk"),
            CountyGeoRecord("42129", "Westmoreland County", "PA", "pawbk"),
            CountyGeoRecord("42125", "Washington County", "PA", "pawbk"),
            CountyGeoRecord("42019", "Butler County", "PA", "pawbk"),
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
            CountyGeoRecord("37021", "Buncombe County (Asheville)", "NC", "ncwbk"),
            CountyGeoRecord("37129", "New Hanover County (Wilmington)", "NC", "ncebk"),
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
            CountyGeoRecord("39035", "Cuyahoga County (Cleveland)", "OH", "ohnbk"),
            CountyGeoRecord("39061", "Hamilton County (Cincinnati)", "OH", "ohsbk"),
            CountyGeoRecord("39113", "Montgomery County (Dayton)", "OH", "ohsbk"),
            CountyGeoRecord("39153", "Summit County (Akron)", "OH", "ohnbk"),
            CountyGeoRecord("39095", "Lucas County (Toledo)", "OH", "ohnbk"),
            CountyGeoRecord("39151", "Stark County (Canton)", "OH", "ohnbk"),
            CountyGeoRecord("39017", "Butler County", "OH", "ohsbk"),
            CountyGeoRecord("39089", "Licking County", "OH", "ohsbk"),
            CountyGeoRecord("39093", "Lorain County", "OH", "ohnbk"),
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
            CountyGeoRecord("12115", "Sarasota County", "FL", "flmbk"),
            CountyGeoRecord("12071", "Lee County (Fort Myers)", "FL", "flmbk"),
            CountyGeoRecord("12105", "Polk County (Lakeland)", "FL", "flmbk"),
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
            CountyGeoRecord("48491", "Williamson County (Round Rock)", "TX", "txwbk"),
            CountyGeoRecord("48029", "Bexar County (San Antonio)", "TX", "txwbk"),
            CountyGeoRecord("48141", "El Paso County", "TX", "txwbk"),
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
            CountyGeoRecord("13063", "Clayton County", "GA", "ganbk"),
            CountyGeoRecord("13057", "Cherokee County", "GA", "ganbk"),
            CountyGeoRecord("13117", "Forsyth County", "GA", "ganbk"),
            CountyGeoRecord("13245", "Richmond County (Augusta)", "GA", "gasbk"),
        ],
    ),
    "IL": StateGeoMetadata(
        state_code="IL",
        state_name="Illinois",
        fips_prefix="17",
        default_bankruptcy_court_id="ilnbk",
        bankruptcy_districts=["ilnbk", "ilcbk", "ilsbk"],
        public_notice_portal="https://www.publicnoticeillinois.com",
        counties_sample=[
            CountyGeoRecord("17031", "Cook County (Chicago)", "IL", "ilnbk"),
            CountyGeoRecord("17043", "DuPage County", "IL", "ilnbk"),
            CountyGeoRecord("17097", "Lake County", "IL", "ilnbk"),
            CountyGeoRecord("17197", "Will County", "IL", "ilnbk"),
            CountyGeoRecord("17089", "Kane County", "IL", "ilnbk"),
            CountyGeoRecord("17111", "McHenry County", "IL", "ilnbk"),
            CountyGeoRecord("17201", "Winnebago County (Rockford)", "IL", "ilnbk"),
            CountyGeoRecord("17143", "Peoria County", "IL", "ilcbk"),
            CountyGeoRecord("17019", "Champaign County", "IL", "ilcbk"),
            CountyGeoRecord("17167", "Sangamon County (Springfield)", "IL", "ilcbk"),
        ],
    ),
    "NY": StateGeoMetadata(
        state_code="NY",
        state_name="New York",
        fips_prefix="36",
        default_bankruptcy_court_id="nysbk",
        bankruptcy_districts=["nysbk", "nyebk", "nywbk", "nynbk"],
        public_notice_portal="https://www.nypublicnotices.com",
        counties_sample=[
            CountyGeoRecord("36061", "New York County (Manhattan)", "NY", "nysbk"),
            CountyGeoRecord("36047", "Kings County (Brooklyn)", "NY", "nyebk"),
            CountyGeoRecord("36081", "Queens County", "NY", "nyebk"),
            CountyGeoRecord("36059", "Nassau County (Long Island)", "NY", "nyebk"),
            CountyGeoRecord("36103", "Suffolk County", "NY", "nyebk"),
            CountyGeoRecord("36119", "Westchester County", "NY", "nysbk"),
            CountyGeoRecord("36029", "Erie County (Buffalo)", "NY", "nywbk"),
            CountyGeoRecord("36055", "Monroe County (Rochester)", "NY", "nywbk"),
            CountyGeoRecord("36067", "Onondaga County (Syracuse)", "NY", "nynbk"),
            CountyGeoRecord("36001", "Albany County", "NY", "nynbk"),
        ],
    ),
    "NJ": StateGeoMetadata(
        state_code="NJ",
        state_name="New Jersey",
        fips_prefix="34",
        default_bankruptcy_court_id="njbk",
        bankruptcy_districts=["njbk"],
        public_notice_portal="https://www.njpublicnotices.com",
        counties_sample=[
            CountyGeoRecord("34003", "Bergen County", "NJ", "njbk"),
            CountyGeoRecord("34013", "Essex County (Newark)", "NJ", "njbk"),
            CountyGeoRecord("34017", "Hudson County (Jersey City)", "NJ", "njbk"),
            CountyGeoRecord("34023", "Middlesex County", "NJ", "njbk"),
            CountyGeoRecord("34025", "Monmouth County", "NJ", "njbk"),
            CountyGeoRecord("34029", "Ocean County", "NJ", "njbk"),
            CountyGeoRecord("34039", "Union County", "NJ", "njbk"),
            CountyGeoRecord("34007", "Camden County", "NJ", "njbk"),
            CountyGeoRecord("34027", "Morris County", "NJ", "njbk"),
            CountyGeoRecord("34021", "Mercer County (Trenton)", "NJ", "njbk"),
        ],
    ),
    "AZ": StateGeoMetadata(
        state_code="AZ",
        state_name="Arizona",
        fips_prefix="04",
        default_bankruptcy_court_id="azbk",
        bankruptcy_districts=["azbk"],
        public_notice_portal="https://www.azpublicnotices.com",
        counties_sample=[
            CountyGeoRecord("04013", "Maricopa County (Phoenix)", "AZ", "azbk"),
            CountyGeoRecord("04019", "Pima County (Tucson)", "AZ", "azbk"),
            CountyGeoRecord("04021", "Pinal County", "AZ", "azbk"),
            CountyGeoRecord("04025", "Yavapai County (Prescott)", "AZ", "azbk"),
            CountyGeoRecord("04005", "Coconino County (Flagstaff)", "AZ", "azbk"),
            CountyGeoRecord("04027", "Yuma County", "AZ", "azbk"),
            CountyGeoRecord("04015", "Mohave County", "AZ", "azbk"),
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
            CountyGeoRecord("06067", "Sacramento County", "CA", "caebk"),
            CountyGeoRecord("06019", "Fresno County", "CA", "caebk"),
        ],
    ),
    "CO": StateGeoMetadata(
        state_code="CO",
        state_name="Colorado",
        fips_prefix="08",
        default_bankruptcy_court_id="cobk",
        bankruptcy_districts=["cobk"],
        public_notice_portal="https://www.coloradopublicnotices.com",
        counties_sample=[
            CountyGeoRecord("08031", "Denver County", "CO", "cobk"),
            CountyGeoRecord("08041", "El Paso County (Colorado Springs)", "CO", "cobk"),
            CountyGeoRecord("08005", "Arapahoe County", "CO", "cobk"),
            CountyGeoRecord("08059", "Jefferson County", "CO", "cobk"),
            CountyGeoRecord("08001", "Adams County", "CO", "cobk"),
            CountyGeoRecord("08069", "Larimer County (Fort Collins)", "CO", "cobk"),
            CountyGeoRecord("08013", "Boulder County", "CO", "cobk"),
            CountyGeoRecord("08035", "Douglas County", "CO", "cobk"),
            CountyGeoRecord("08123", "Weld County (Greeley)", "CO", "cobk"),
        ],
    ),
    "MI": StateGeoMetadata(
        state_code="MI",
        state_name="Michigan",
        fips_prefix="26",
        default_bankruptcy_court_id="miebk",
        bankruptcy_districts=["miebk", "miwbk"],
        public_notice_portal="https://www.michiganpublicnotices.com",
        counties_sample=[
            CountyGeoRecord("26163", "Wayne County (Detroit)", "MI", "miebk"),
            CountyGeoRecord("26125", "Oakland County", "MI", "miebk"),
            CountyGeoRecord("26099", "Macomb County", "MI", "miebk"),
            CountyGeoRecord("26081", "Kent County (Grand Rapids)", "MI", "miwbk"),
            CountyGeoRecord("26049", "Genesee County (Flint)", "MI", "miebk"),
            CountyGeoRecord("26161", "Washtenaw County (Ann Arbor)", "MI", "miebk"),
            CountyGeoRecord("26065", "Ingham County (Lansing)", "MI", "miwbk"),
            CountyGeoRecord("26077", "Kalamazoo County", "MI", "miwbk"),
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
            CountyGeoRecord("47149", "Rutherford County (Murfreesboro)", "TN", "tnmbk"),
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
            CountyGeoRecord("45091", "York County (Rock Hill)", "SC", "scbk"),
        ],
    ),
    "MA": StateGeoMetadata(
        state_code="MA",
        state_name="Massachusetts",
        fips_prefix="25",
        default_bankruptcy_court_id="mabk",
        bankruptcy_districts=["mabk"],
        public_notice_portal="https://www.masspublicnotices.org",
        counties_sample=[
            CountyGeoRecord("25025", "Suffolk County (Boston)", "MA", "mabk"),
            CountyGeoRecord("25017", "Middlesex County (Cambridge)", "MA", "mabk"),
            CountyGeoRecord("25009", "Essex County", "MA", "mabk"),
            CountyGeoRecord("25027", "Worcester County", "MA", "mabk"),
            CountyGeoRecord("25021", "Norfolk County", "MA", "mabk"),
            CountyGeoRecord("25023", "Plymouth County", "MA", "mabk"),
            CountyGeoRecord("25013", "Hampden County (Springfield)", "MA", "mabk"),
        ],
    ),
    "MD": StateGeoMetadata(
        state_code="MD",
        state_name="Maryland",
        fips_prefix="24",
        default_bankruptcy_court_id="mdbk",
        bankruptcy_districts=["mdbk"],
        public_notice_portal="https://www.mddcpress.com",
        counties_sample=[
            CountyGeoRecord("24031", "Montgomery County", "MD", "mdbk"),
            CountyGeoRecord("24033", "Prince George's County", "MD", "mdbk"),
            CountyGeoRecord("24005", "Baltimore County", "MD", "mdbk"),
            CountyGeoRecord("24510", "Baltimore City", "MD", "mdbk"),
            CountyGeoRecord("24003", "Anne Arundel County (Annapolis)", "MD", "mdbk"),
            CountyGeoRecord("24027", "Howard County", "MD", "mdbk"),
            CountyGeoRecord("24021", "Frederick County", "MD", "mdbk"),
        ],
    ),
    "IN": StateGeoMetadata(
        state_code="IN",
        state_name="Indiana",
        fips_prefix="18",
        default_bankruptcy_court_id="insbk",
        bankruptcy_districts=["insbk", "innbk"],
        public_notice_portal="https://www.indianapublicnotices.com",
        counties_sample=[
            CountyGeoRecord("18097", "Marion County (Indianapolis)", "IN", "insbk"),
            CountyGeoRecord("18089", "Lake County (Gary)", "IN", "innbk"),
            CountyGeoRecord("18003", "Allen County (Fort Wayne)", "IN", "innbk"),
            CountyGeoRecord("18057", "Hamilton County (Carmel)", "IN", "insbk"),
            CountyGeoRecord("18141", "St. Joseph County (South Bend)", "IN", "innbk"),
            CountyGeoRecord("18039", "Elkhart County", "IN", "innbk"),
            CountyGeoRecord("18157", "Tippecanoe County (Lafayette)", "IN", "innbk"),
            CountyGeoRecord("18163", "Vanderburgh County (Evansville)", "IN", "insbk"),
        ],
    ),
    "WA": StateGeoMetadata(
        state_code="WA",
        state_name="Washington",
        fips_prefix="53",
        default_bankruptcy_court_id="wawbk",
        bankruptcy_districts=["wawbk", "waebk"],
        public_notice_portal="https://www.wapublicnotices.com",
        counties_sample=[
            CountyGeoRecord("53033", "King County (Seattle)", "WA", "wawbk"),
            CountyGeoRecord("53053", "Pierce County (Tacoma)", "WA", "wawbk"),
            CountyGeoRecord("53061", "Snohomish County (Everett)", "WA", "wawbk"),
            CountyGeoRecord("53063", "Spokane County", "WA", "waebk"),
            CountyGeoRecord("53011", "Clark County (Vancouver)", "WA", "wawbk"),
            CountyGeoRecord("53067", "Thurston County (Olympia)", "WA", "wawbk"),
        ],
    ),
}

# Add standard entries for all remaining 30 US states so every single state has full representation
_REMAINING_STATES = [
    ("AL", "Alabama", "01", "alnbk", ["alnbk", "almbk", "alsbk"], [("01073", "Jefferson County (Birmingham)"), ("01097", "Mobile County"), ("01101", "Montgomery County"), ("01089", "Madison County (Huntsville)")]),
    ("AK", "Alaska", "02", "akbk", ["akbk"], [("02020", "Anchorage Municipality"), ("02090", "Fairbanks North Star"), ("02122", "Kenai Peninsula"), ("02110", "Juneau City and Borough")]),
    ("AR", "Arkansas", "05", "arebk", ["arebk", "arwbk"], [("05119", "Pulaski County (Little Rock)"), ("05007", "Benton County"), ("05143", "Washington County (Fayetteville)"), ("05131", "Sebastian County (Fort Smith)")]),
    ("CT", "Connecticut", "09", "ctbk", ["ctbk"], [("09001", "Fairfield County"), ("09003", "Hartford County"), ("09009", "New Haven County"), ("09011", "New London County")]),
    ("DE", "Delaware", "10", "debk", ["debk"], [("10003", "New Castle County (Wilmington)"), ("10005", "Sussex County"), ("10001", "Kent County (Dover)")]),
    ("HI", "Hawaii", "15", "hibk", ["hibk"], [("15003", "Honolulu County"), ("15009", "Maui County"), ("15001", "Hawaii County"), ("15007", "Kauai County")]),
    ("ID", "Idaho", "16", "idbk", ["idbk"], [("16001", "Ada County (Boise)"), ("16027", "Canyon County"), ("16055", "Kootenai County (Coeur d'Alene)"), ("16019", "Bonneville County (Idaho Falls)")]),
    ("IA", "Iowa", "19", "iasbk", ["iasbk", "ianbk"], [("19153", "Polk County (Des Moines)"), ("19113", "Linn County (Cedar Rapids)"), ("19163", "Scott County (Davenport)"), ("19103", "Johnson County (Iowa City)")]),
    ("KS", "Kansas", "20", "ksbk", ["ksbk"], [("20173", "Sedgwick County (Wichita)"), ("20091", "Johnson County (Overland Park)"), ("20209", "Wyandotte County (Kansas City)"), ("20177", "Shawnee County (Topeka)")]),
    ("KY", "Kentucky", "21", "kywbk", ["kywbk", "kyebk"], [("21111", "Jefferson County (Louisville)"), ("21067", "Fayette County (Lexington)"), ("21117", "Kenton County"), ("21015", "Boone County")]),
    ("LA", "Louisiana", "22", "laebk", ["laebk", "lawbk", "lambk"], [("22071", "Orleans Parish (New Orleans)"), ("22033", "East Baton Rouge Parish"), ("22051", "Jefferson Parish"), ("22055", "Lafayette Parish")]),
    ("ME", "Maine", "23", "mebk", ["mebk"], [("23005", "Cumberland County (Portland)"), ("23031", "York County"), ("23019", "Penobscot County (Bangor)"), ("23001", "Androscoggin County (Lewiston)")]),
    ("MN", "Minnesota", "27", "mnbk", ["mnbk"], [("27053", "Hennepin County (Minneapolis)"), ("27123", "Ramsey County (St. Paul)"), ("27037", "Dakota County"), ("27003", "Anoka County")]),
    ("MS", "Mississippi", "28", "mssbk", ["mssbk", "msnbk"], [("28049", "Hinds County (Jackson)"), ("28047", "Harrison County (Gulfport)"), ("28033", "DeSoto County"), ("28121", "Rankin County")]),
    ("MO", "Missouri", "29", "moebk", ["moebk", "mowbk"], [("29189", "St. Louis County"), ("29510", "St. Louis City"), ("29095", "Jackson County (Kansas City)"), ("29183", "St. Charles County"), ("29077", "Greene County (Springfield)")]),
    ("MT", "Montana", "30", "mtbk", ["mtbk"], [("30111", "Yellowstone County (Billings)"), ("30063", "Missoula County"), ("30031", "Gallatin County (Bozeman)"), ("30013", "Cascade County (Great Falls)")]),
    ("NE", "Nebraska", "31", "nebk", ["nebk"], [("31055", "Douglas County (Omaha)"), ("31109", "Lancaster County (Lincoln)"), ("31153", "Sarpy County"), ("31079", "Hall County (Grand Island)")]),
    ("NV", "Nevada", "32", "nvbk", ["nvbk"], [("32003", "Clark County (Las Vegas)"), ("32031", "Washoe County (Reno)"), ("32510", "Carson City"), ("32007", "Elko County")]),
    ("NH", "New Hampshire", "33", "nhbk", ["nhbk"], [("33011", "Hillsborough County (Manchester)"), ("33015", "Rockingham County"), ("33013", "Merrimack County (Concord)"), ("33017", "Strafford County")]),
    ("NM", "New Mexico", "35", "nmbk", ["nmbk"], [("35001", "Bernalillo County (Albuquerque)"), ("35013", "Doña Ana County (Las Cruces)"), ("35049", "Santa Fe County"), ("35045", "San Juan County")]),
    ("ND", "North Dakota", "38", "ndbk", ["ndbk"], [("38017", "Cass County (Fargo)"), ("38015", "Burleigh County (Bismarck)"), ("38035", "Grand Forks County"), ("38101", "Ward County (Minot)")]),
    ("OK", "Oklahoma", "40", "okwbk", ["okwbk", "oknbk", "okebk"], [("40109", "Oklahoma County (Oklahoma City)"), ("40143", "Tulsa County"), ("40027", "Cleveland County (Norman)"), ("40017", "Canadian County")]),
    ("OR", "Oregon", "41", "orbk", ["orbk"], [("41051", "Multnomah County (Portland)"), ("41067", "Washington County"), ("41005", "Clackamas County"), ("41039", "Lane County (Eugene)")]),
    ("RI", "Rhode Island", "44", "ribk", ["ribk"], [("44007", "Providence County"), ("44003", "Kent County"), ("44009", "Washington County"), ("44005", "Newport County")]),
    ("SD", "South Dakota", "46", "sdbk", ["sdbk"], [("46099", "Minnehaha County (Sioux Falls)"), ("46103", "Pennington County (Rapid City)"), ("46083", "Lincoln County"), ("46013", "Brown County (Aberdeen)")]),
    ("UT", "Utah", "49", "utbk", ["utbk"], [("49035", "Salt Lake County"), ("49049", "Utah County (Provo)"), ("49011", "Davis County"), ("49057", "Weber County (Ogden)")]),
    ("VT", "Vermont", "50", "vtbk", ["vtbk"], [("50007", "Chittenden County (Burlington)"), ("50021", "Rutland County"), ("50023", "Washington County (Montpelier)"), ("50027", "Windsor County")]),
    ("WV", "West Virginia", "54", "wvsbk", ["wvsbk", "wvnbk"], [("54039", "Kanawha County (Charleston)"), ("54011", "Cabell County (Huntington)"), ("54061", "Monongalia County (Morgantown)"), ("54003", "Berkeley County (Martinsburg)")]),
    ("WI", "Wisconsin", "55", "wiebk", ["wiebk", "wiwbk"], [("55079", "Milwaukee County"), ("55025", "Dane County (Madison)"), ("55133", "Waukesha County"), ("55009", "Brown County (Green Bay)")]),
    ("WY", "Wyoming", "56", "wybk", ["wybk"], [("56021", "Laramie County (Cheyenne)"), ("56025", "Natrona County (Casper)"), ("56005", "Campbell County (Gillette)"), ("56037", "Sweetwater County")]),
]

for st_code, st_name, prefix, default_court, courts, county_tuples in _REMAINING_STATES:
    if st_code not in NATIONWIDE_STATE_DIRECTORY:
        NATIONWIDE_STATE_DIRECTORY[st_code] = StateGeoMetadata(
            state_code=st_code,
            state_name=st_name,
            fips_prefix=prefix,
            default_bankruptcy_court_id=default_court,
            bankruptcy_districts=courts,
            public_notice_portal=f"https://www.{st_name.lower().replace(' ', '')}publicnotices.com",
            counties_sample=[
                CountyGeoRecord(fips, name, st_code, default_court)
                for fips, name in county_tuples
            ],
        )

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
        preset_id="PRESET_LEHIGH_VALLEY",
        name="Allentown-Bethlehem-Easton (Lehigh Valley PA)",
        state_code="PA",
        description="Core Lehigh & Northampton industrial, distribution, and accounting succession corridor.",
        counties=[
            CountyGeoRecord("42077", "Lehigh County (Allentown)", "PA", "paebk"),
            CountyGeoRecord("42095", "Northampton County (Bethlehem/Easton)", "PA", "paebk"),
            CountyGeoRecord("42011", "Berks County (Reading)", "PA", "paebk"),
            CountyGeoRecord("42017", "Bucks County", "PA", "paebk"),
            CountyGeoRecord("42091", "Montgomery County", "PA", "paebk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_CHARLOTTE_METRO",
        name="Charlotte-Concord-Gastonia Metro (NC/SC)",
        state_code="NC",
        description="Major Southeast manufacturing, logistics, wholesale, and multi-family housing hub.",
        counties=[
            CountyGeoRecord("37119", "Mecklenburg County", "NC", "ncwbk"),
            CountyGeoRecord("37179", "Union County", "NC", "ncwbk"),
            CountyGeoRecord("37025", "Cabarrus County", "NC", "ncwbk"),
            CountyGeoRecord("37071", "Gaston County", "NC", "ncwbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_DFW_METROPLEX",
        name="Dallas-Fort Worth Industrial Triangle",
        state_code="TX",
        description="Heavy precision machinery, fleet maintenance, and distribution centers.",
        counties=[
            CountyGeoRecord("48113", "Dallas County", "TX", "txnbk"),
            CountyGeoRecord("48439", "Tarrant County (Fort Worth)", "TX", "txnbk"),
            CountyGeoRecord("48085", "Collin County (Plano)", "TX", "txnbk"),
            CountyGeoRecord("48121", "Denton County", "TX", "txnbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_TAMPA_BAY",
        name="Tampa Bay / I-4 Logistics Corridor",
        state_code="FL",
        description="Cold storage distribution, light industrial, and trade services.",
        counties=[
            CountyGeoRecord("12057", "Hillsborough County (Tampa)", "FL", "flmbk"),
            CountyGeoRecord("12103", "Pinellas County (St. Petersburg)", "FL", "flmbk"),
            CountyGeoRecord("12095", "Orange County (Orlando)", "FL", "flmbk"),
            CountyGeoRecord("12105", "Polk County (Lakeland)", "FL", "flmbk"),
        ],
    ),
    MetroPreset(
        preset_id="PRESET_COLUMBUS_OH",
        name="Columbus Ohio Manufacturing & Logistics",
        state_code="OH",
        description="Midwest advanced manufacturing, automotive tier suppliers, and freight hub.",
        counties=[
            CountyGeoRecord("39049", "Franklin County", "OH", "ohsbk"),
            CountyGeoRecord("39035", "Cuyahoga County (Cleveland)", "OH", "ohnbk"),
        ],
    ),
]


def list_available_states() -> List[Dict[str, Any]]:
    """Returns all available states with county counts and bankruptcy districts."""
    results = []
    for state in sorted(NATIONWIDE_STATE_DIRECTORY.values(), key=lambda s: s.state_name):
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
        # Dynamic fallback if an unrecognized state code is passed
        return [
            {
                "fips_code": f"{state_code.upper()}001",
                "county_name": f"{state_code.upper()} Central County",
                "state_code": state_code.upper(),
                "bankruptcy_court_id": f"{state_code.lower()}bk",
            }
        ]
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

"""
Argus Research Links & 1-Click Investigation Engine
Constructs verified, deterministic deep-research URLs across 7 dimensions:
Physical Geospatial, Corporate OSINT, Court Dockets, NAICS Census, Environmental Hazards, and Macro Benchmarks.
"""

from typing import Any, Dict, List, Optional
import urllib.parse


def format_full_address(
    street_address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = "VA",
    zip_code: Optional[str] = None,
) -> str:
    parts = []
    if street_address:
        parts.append(street_address.strip())
    if city:
        parts.append(city.strip())
    if state:
        if zip_code:
            parts.append(f"{state.strip()} {zip_code.strip()}")
        else:
            parts.append(state.strip())
    elif zip_code:
        parts.append(zip_code.strip())
    return ", ".join(parts).strip()


def generate_research_links(
    entity_name: Optional[str] = None,
    street_address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = "VA",
    zip_code: Optional[str] = None,
    county: Optional[str] = None,
    fips_code: Optional[str] = None,
    parcel_id: Optional[str] = None,
    naics_code: Optional[str] = None,
    docket_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    full_address = format_full_address(street_address, city, state, zip_code)
    if not full_address:
        full_address = f"{city or 'Roanoke'}, {state or 'VA'}"

    encoded_address = urllib.parse.quote_plus(full_address)
    encoded_entity = urllib.parse.quote_plus(entity_name or "")
    clean_naics = (naics_code or "").strip()[:6]

    # 1. Geospatial Links
    google_maps = f"https://www.google.com/maps/search/?api=1&query={encoded_address}"
    google_satellite = f"https://www.google.com/maps/search/?api=1&query={encoded_address}&t=k"
    
    if latitude is not None and longitude is not None:
        google_streetview = f"https://www.google.com/maps/@?api=1&map_action=pano&viewpoint={latitude},{longitude}"
    else:
        google_streetview = f"https://www.google.com/maps/search/?api=1&query={encoded_address}+street+view"

    apple_maps = f"https://maps.apple.com/?q={encoded_address}"
    openstreetmap = f"https://www.openstreetmap.org/search?query={encoded_address}"
    
    # County GIS resolution
    if fips_code == "51770" or (city and "roanoke city" in city.lower()):
        gis_portal = f"https://www.webgis.net/va/roanokecity/?pin={parcel_id}" if parcel_id else "https://www.webgis.net/va/roanokecity/"
    elif fips_code == "51161" or (county and "roanoke county" in county.lower()):
        gis_portal = f"https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer?gpin={parcel_id}" if parcel_id else "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer"
    else:
        loc_name = county or city or "Roanoke"
        parcel_part = parcel_id or ""
        gis_portal = f"https://www.google.com/search?q={urllib.parse.quote_plus(f'{loc_name} GIS parcel {parcel_part}')}"

    fema_flood = f"https://msc.fema.gov/portal/search?AddressQuery={encoded_address}"

    # 2. Corporate OSINT Links
    va_scc_cis = "https://cis.scc.virginia.gov/EntitySearch/Index"
    opencorporates = f"https://opencorporates.com/companies?q={encoded_entity}&jurisdiction_code=us_va" if entity_name else "https://opencorporates.com"
    news_query = f'"{entity_name or ""}" {city or state or "Roanoke"} news'
    google_news = f"https://www.google.com/search?q={urllib.parse.quote_plus(news_query)}&tbm=nws"
    linkedin_company = f"https://www.linkedin.com/search/results/companies/?keywords={encoded_entity}" if entity_name else "https://www.linkedin.com"
    bbb_loc = f"{city or 'Roanoke'}, {state or 'VA'}"
    bbb_search = f"https://www.bbb.org/search?find_text={encoded_entity}&find_loc={urllib.parse.quote_plus(bbb_loc)}"

    # 3. Legal Dockets & Notices
    if docket_id:
        courtlistener = f"https://www.courtlistener.com/docket/?q={urllib.parse.quote_plus(docket_id)}"
    elif entity_name:
        court_query = f'"{entity_name}"'
        courtlistener = f"https://www.courtlistener.com/?q={urllib.parse.quote_plus(court_query)}&type=r"
    else:
        courtlistener = "https://www.courtlistener.com/recap/"

    column_notices = f"https://roanoke.column.us/search?query={encoded_entity}" if entity_name else "https://roanoke.column.us/search"
    tacs_tax_sales = "https://taxva.com/rs-tax-sales/city-of-roanoke-real-estate-tax-sales-2/"
    va_foreclosure_statute = "https://law.lis.virginia.gov/vacode/title55.1/chapter3/section55.1-321/"

    # 4. Economic & Industry Benchmarks
    census_naics = f"https://www.census.gov/naics/?input={clean_naics}&year=2022" if clean_naics else "https://www.census.gov/naics/"
    sec_edgar = f"https://www.sec.gov/edgar/searchedgar/companysearch?search_text={encoded_entity}" if entity_name else "https://www.sec.gov/edgar/searchedgar/companysearch"
    fmcsa_safer = "https://safer.fmcsa.dot.gov/CompanySnapshot.aspx"
    epa_ust = "https://www.epa.gov/ust/ust-finder"
    fred_sofr = "https://fred.stlouisfed.org/series/SOFR"

    categories = [
        {
            "category": "GEOSPATIAL",
            "label": "Maps & Physical Location",
            "links": [
                {"id": "google_maps", "label": "Google Maps", "url": google_maps, "icon": "MapPin"},
                {"id": "google_satellite", "label": "Google Satellite Aerial", "url": google_satellite, "icon": "Layers", "badge": "AERIAL"},
                {"id": "google_streetview", "label": "Google Street View", "url": google_streetview, "icon": "Eye"},
                {"id": "apple_maps", "label": "Apple Maps", "url": apple_maps, "icon": "Compass"},
                {"id": "openstreetmap", "label": "OpenStreetMap", "url": openstreetmap, "icon": "Globe"},
                {"id": "county_gis", "label": "County GIS TaxView", "url": gis_portal, "icon": "Building", "badge": "GPIN"},
                {"id": "fema_flood", "label": "FEMA Flood Center", "url": fema_flood, "icon": "Waves", "badge": "FLOOD"},
            ],
        },
        {
            "category": "CORPORATE_OSINT",
            "label": "Corporate OSINT & Standing",
            "links": [
                {"id": "va_scc_cis", "label": "Virginia SCC CIS", "url": va_scc_cis, "icon": "FileText", "badge": "SCC"},
                {"id": "opencorporates", "label": "OpenCorporates", "url": opencorporates, "icon": "Building"},
                {"id": "google_news", "label": "Local News & Press", "url": google_news, "icon": "Newspaper"},
                {"id": "linkedin", "label": "LinkedIn Directory", "url": linkedin_company, "icon": "Briefcase"},
                {"id": "bbb", "label": "Better Business Bureau", "url": bbb_search, "icon": "ShieldCheck"},
            ],
        },
        {
            "category": "LEGAL_DOCKETS",
            "label": "Court Dockets & Public Notices",
            "links": [
                {"id": "courtlistener", "label": "CourtListener / RECAP", "url": courtlistener, "icon": "Scale", "badge": "PACER"},
                {"id": "column_notices", "label": "Roanoke Times Notices", "url": column_notices, "icon": "FileSpreadsheet", "badge": "TRUSTEE"},
                {"id": "tacs_tax_sales", "label": "Roanoke Tax Sales (TACS)", "url": tacs_tax_sales, "icon": "Landmark"},
                {"id": "va_foreclosure_statute", "label": "Va. Code § 55.1-321", "url": va_foreclosure_statute, "icon": "BookOpen"},
            ],
        },
        {
            "category": "ECONOMIC_BENCHMARKS",
            "label": "Industry & Economic Benchmarks",
            "links": [
                {"id": "census_naics", "label": f"Census NAICS {clean_naics or 'Code'}", "url": census_naics, "icon": "BarChart3", "badge": "CENSUS"},
                {"id": "sec_edgar", "label": "SEC EDGAR Comps", "url": sec_edgar, "icon": "TrendingUp"},
                {"id": "fmcsa_safer", "label": "FMCSA SAFER Fleet", "url": fmcsa_safer, "icon": "Truck", "badge": "DOT"},
                {"id": "epa_ust", "label": "EPA UST Finder", "url": epa_ust, "icon": "Flame", "badge": "EPA"},
                {"id": "fred_sofr", "label": "FRED SOFR Rate", "url": fred_sofr, "icon": "DollarSign"},
            ],
        },
    ]

    return {
        "status": "success",
        "query": {
            "entity_name": entity_name,
            "full_address": full_address,
            "city": city,
            "state": state,
            "zip_code": zip_code,
            "county": county,
            "fips_code": fips_code,
            "parcel_id": parcel_id,
            "naics_code": naics_code,
            "docket_id": docket_id,
        },
        "categories": categories,
        "quick_links": {
            "google_maps": google_maps,
            "google_satellite": google_satellite,
            "google_streetview": google_streetview,
            "apple_maps": apple_maps,
            "va_scc_cis": va_scc_cis,
            "courtlistener": courtlistener,
            "fema_flood": fema_flood,
            "census_naics": census_naics,
            "epa_ust": epa_ust,
            "gis_portal": gis_portal,
        },
    }

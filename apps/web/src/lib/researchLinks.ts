/**
 * Argus Research Intelligence Links Engine
 * Generates verified, deterministic 1-click research and OSINT inspection URLs
 * across 7 dimensions: Physical Geospatial, Corporate OSINT, Court Dockets & Foreclosures,
 * NAICS Economic Census, Environmental & Flood Hazards, Macro Benchmarks, and Formatted Exports.
 */

export interface ResearchTargetParams {
  entityName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  fipsCode?: string;
  parcelId?: string;
  naicsCode?: string;
  docketId?: string;
  latitude?: number;
  longitude?: number;
  askingPrice?: string;
  assessedValue?: string;
  baseDscr?: string;
}

export interface ResearchLinkCategory {
  category: string;
  label: string;
  links: {
    id: string;
    label: string;
    url: string;
    icon: string;
    badge?: string;
    tooltip: string;
  }[];
}

/**
 * Builds the canonical full address string for geocoding and external mapping.
 */
export function formatFullAddress(params: ResearchTargetParams): string {
  const parts: string[] = [];
  if (params.streetAddress) parts.push(params.streetAddress);
  if (params.city) parts.push(params.city);
  if (params.state) {
    if (params.zipCode) {
      parts.push(`${params.state} ${params.zipCode}`);
    } else {
      parts.push(params.state);
    }
  } else if (params.zipCode) {
    parts.push(params.zipCode);
  }
  return parts.join(", ").trim();
}

/**
 * Formats a Google Maps search URL with encoded query.
 */
export function buildGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Formats a Google Satellite View URL.
 */
export function buildGoogleSatelliteUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}&t=k`;
}

/**
 * Formats a Google Street View URL (either by viewpoint coordinates or address query).
 */
export function buildGoogleStreetViewUrl(address: string, lat?: number, lng?: number): string {
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + " street view")}`;
}

/**
 * Formats an Apple Maps URL.
 */
export function buildAppleMapsUrl(address: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

/**
 * Formats an OpenStreetMap URL.
 */
export function buildOpenStreetMapUrl(address: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}

/**
 * Builds county or city GIS portal direct search URL.
 */
export function buildGisPortalUrl(params: ResearchTargetParams): string {
  const fips = params.fipsCode || "";
  const parcel = params.parcelId ? encodeURIComponent(params.parcelId) : "";
  const address = params.streetAddress ? encodeURIComponent(params.streetAddress) : "";

  // City of Roanoke (FIPS 51770)
  if (fips === "51770" || (params.city && params.city.toLowerCase().includes("roanoke city"))) {
    return parcel
      ? `https://www.webgis.net/va/roanokecity/?pin=${parcel}`
      : "https://www.webgis.net/va/roanokecity/";
  }

  // Roanoke County (FIPS 51161)
  if (fips === "51161" || (params.county && params.county.toLowerCase().includes("roanoke county"))) {
    return parcel
      ? `https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer?gpin=${parcel}`
      : "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer";
  }

  // General Virginia or National fallback: search county GIS
  const query = `${params.county || params.city || "Roanoke"} GIS parcel viewer ${params.parcelId || ""}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Formats FEMA National Flood Hazard Layer (NFHL) search URL.
 */
export function buildFemaFloodUrl(address: string): string {
  return `https://msc.fema.gov/portal/search?AddressQuery=${encodeURIComponent(address)}`;
}

/**
 * Formats Virginia State Corporation Commission (SCC CIS) Clerk's Information System URL.
 */
export function buildVaSccCisUrl(entityName?: string): string {
  if (!entityName) return "https://cis.scc.virginia.gov/EntitySearch/Index";
  return `https://cis.scc.virginia.gov/EntitySearch/Index`;
}

/**
 * Formats OpenCorporates entity search URL.
 */
export function buildOpenCorporatesUrl(entityName?: string): string {
  if (!entityName) return "https://opencorporates.com";
  return `https://opencorporates.com/companies?q=${encodeURIComponent(entityName)}&jurisdiction_code=us_va`;
}

/**
 * Formats Google News search URL for entity and jurisdiction.
 */
export function buildGoogleNewsUrl(entityName: string, city?: string, state?: string): string {
  const loc = city || state || "Roanoke VA";
  return `https://www.google.com/search?q=${encodeURIComponent(`"${entityName}" ${loc} news`)}&tbm=nws`;
}

/**
 * Formats LinkedIn Company Search URL.
 */
export function buildLinkedInCompanyUrl(entityName: string): string {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(entityName)}`;
}

/**
 * Formats Better Business Bureau (BBB) lookup URL.
 */
export function buildBbbSearchUrl(entityName: string, city?: string, state?: string): string {
  const location = `${city || "Roanoke"}, ${state || "VA"}`;
  return `https://www.bbb.org/search?find_text=${encodeURIComponent(entityName)}&find_loc=${encodeURIComponent(location)}`;
}

/**
 * Formats CourtListener / RECAP bankruptcy & federal court docket search URL.
 */
export function buildCourtListenerUrl(docketId?: string, entityName?: string): string {
  if (docketId) {
    return `https://www.courtlistener.com/docket/?q=${encodeURIComponent(docketId)}`;
  }
  if (entityName) {
    return `https://www.courtlistener.com/?q=${encodeURIComponent(`"${entityName}"`)}&type=r`;
  }
  return "https://www.courtlistener.com/recap/";
}

/**
 * Formats Column.us Public Notice search URL (The Roanoke Times / Substitute Trustee notices).
 */
export function buildColumnPublicNoticeUrl(entityName?: string): string {
  if (!entityName) return "https://roanoke.column.us/search";
  return `https://roanoke.column.us/search?query=${encodeURIComponent(entityName)}`;
}

/**
 * Formats City of Roanoke Tax Sale / TACS portal URL.
 */
export function buildTacsTaxSaleUrl(): string {
  return "https://taxva.com/rs-tax-sales/city-of-roanoke-real-estate-tax-sales-2/";
}

/**
 * Formats Virginia Non-Judicial Foreclosure Statute URL.
 */
export function buildVirginiaForeclosureStatuteUrl(): string {
  return "https://law.lis.virginia.gov/vacode/title55.1/chapter3/section55.1-321/";
}

/**
 * Formats U.S. Census Bureau NAICS 2022 definition URL.
 */
export function buildCensusNaicsUrl(naicsCode?: string): string {
  if (!naicsCode) return "https://www.census.gov/naics/";
  const code = naicsCode.slice(0, 6);
  return `https://www.census.gov/naics/?input=${encodeURIComponent(code)}&year=2022`;
}

/**
 * Formats FMCSA SAFER carrier snapshot URL.
 */
export function buildFmcsaSaferUrl(): string {
  return "https://safer.fmcsa.dot.gov/CompanySnapshot.aspx";
}

/**
 * Formats SEC EDGAR company search URL.
 */
export function buildSecEdgarUrl(entityName?: string): string {
  if (!entityName) return "https://www.sec.gov/edgar/searchedgar/companysearch";
  return `https://www.sec.gov/edgar/searchedgar/companysearch?search_text=${encodeURIComponent(entityName)}`;
}

/**
 * Formats EPA UST Finder URL.
 */
export function buildEpaUstUrl(): string {
  return "https://www.epa.gov/ust/ust-finder";
}

/**
 * Formats EPA Envirofacts URL.
 */
export function buildEpaEnvirofactsUrl(zipCode?: string, city?: string): string {
  if (zipCode) {
    return `https://enviro.epa.gov/facts/multisystem.html?zipcode=${encodeURIComponent(zipCode)}`;
  }
  if (city) {
    return `https://enviro.epa.gov/facts/multisystem.html?city=${encodeURIComponent(city)}&state=VA`;
  }
  return "https://enviro.epa.gov/facts/";
}

/**
 * Formats FRED St. Louis Fed SOFR Rate URL.
 */
export function buildFredSofrUrl(): string {
  return "https://fred.stlouisfed.org/series/SOFR";
}

/**
 * Compiles all categorized research links for a given target asset or deal.
 */
export function compileAllResearchLinks(params: ResearchTargetParams): ResearchLinkCategory[] {
  const address = formatFullAddress(params) || (params.city ? `${params.city}, ${params.state || "VA"}` : "Roanoke, VA");
  const entity = params.entityName || "Target Business";
  const naics = params.naicsCode || "";

  return [
    {
      category: "GEOSPATIAL",
      label: "Maps & Physical Location",
      links: [
        {
          id: "google_maps",
          label: "Google Maps",
          url: buildGoogleMapsUrl(address),
          icon: "MapPin",
          tooltip: "Open interactive address navigation in Google Maps",
        },
        {
          id: "google_satellite",
          label: "Satellite Imagery",
          url: buildGoogleSatelliteUrl(address),
          icon: "Layers",
          badge: "AERIAL",
          tooltip: "Inspect high-resolution roof condition and yard logistics",
        },
        {
          id: "google_streetview",
          label: "Google Street View",
          url: buildGoogleStreetViewUrl(address, params.latitude, params.longitude),
          icon: "Eye",
          tooltip: "360-degree ground-level curb condition and neighborhood view",
        },
        {
          id: "apple_maps",
          label: "Apple Maps",
          url: buildAppleMapsUrl(address),
          icon: "Compass",
          tooltip: "Open in Apple Maps on macOS and iOS",
        },
        {
          id: "osm",
          label: "OpenStreetMap",
          url: buildOpenStreetMapUrl(address),
          icon: "Globe",
          tooltip: "View open-source civic topology and building footprints",
        },
        {
          id: "county_gis",
          label: "County GIS TaxView",
          url: buildGisPortalUrl(params),
          icon: "Building",
          badge: "PARCEL",
          tooltip: "Access official county tax assessor and zoning parcel card",
        },
        {
          id: "fema_flood",
          label: "FEMA Flood Center",
          url: buildFemaFloodUrl(address),
          icon: "Waves",
          badge: "FLOOD",
          tooltip: "Verify FEMA 100-year flood zone and insurance requirements",
        },
      ],
    },
    {
      category: "CORPORATE_OSINT",
      label: "Corporate OSINT & Standing",
      links: [
        {
          id: "va_scc_cis",
          label: "Virginia SCC CIS",
          url: buildVaSccCisUrl(entity),
          icon: "FileText",
          badge: "SCC",
          tooltip: "Official Virginia State Corporation Commission corporate registry",
        },
        {
          id: "opencorporates",
          label: "OpenCorporates",
          url: buildOpenCorporatesUrl(entity),
          icon: "Building",
          tooltip: "Multi-state corporate filings, past officers, and sister entities",
        },
        {
          id: "google_news",
          label: "Local News & Press",
          url: buildGoogleNewsUrl(entity, params.city, params.state),
          icon: "Newspaper",
          tooltip: "Search recent regional business news, litigation, and press releases",
        },
        {
          id: "linkedin",
          label: "LinkedIn Directory",
          url: buildLinkedInCompanyUrl(entity),
          icon: "Briefcase",
          tooltip: "View current employee count, executive tenure, and organization chart",
        },
        {
          id: "bbb",
          label: "Better Business Bureau",
          url: buildBbbSearchUrl(entity, params.city, params.state),
          icon: "ShieldCheck",
          tooltip: "Review consumer complaints, business ratings, and operating history",
        },
      ],
    },
    {
      category: "LEGAL_DOCKETS",
      label: "Court Dockets & Public Notices",
      links: [
        {
          id: "courtlistener",
          label: "CourtListener / RECAP",
          url: buildCourtListenerUrl(params.docketId, entity),
          icon: "Scale",
          badge: "PACER",
          tooltip: "Search free federal court bankruptcy and district dockets",
        },
        {
          id: "column_notices",
          label: "Roanoke Times Notices",
          url: buildColumnPublicNoticeUrl(entity),
          icon: "FileSpreadsheet",
          badge: "TRUSTEE",
          tooltip: "Search published substitute trustee foreclosure and legal notices",
        },
        {
          id: "tacs_tax_sales",
          label: "Roanoke Tax Sales (TACS)",
          url: buildTacsTaxSaleUrl(),
          icon: "Landmark",
          tooltip: "Review City of Roanoke real estate judicial tax sale catalogs",
        },
        {
          id: "va_foreclosure_statute",
          label: "Va. Code § 55.1-321",
          url: buildVirginiaForeclosureStatuteUrl(),
          icon: "BookOpen",
          tooltip: "Read Virginia statutory 14-day notice requirement for trustee sales",
        },
      ],
    },
    {
      category: "ECONOMIC_BENCHMARKS",
      label: "Industry & Economic Benchmarks",
      links: [
        {
          id: "census_naics",
          label: `Census NAICS ${naics || "Code"}`,
          url: buildCensusNaicsUrl(naics),
          icon: "BarChart3",
          badge: "CENSUS",
          tooltip: "Official U.S. Census Bureau industry size and payroll statistics",
        },
        {
          id: "sec_edgar",
          label: "SEC EDGAR Comps",
          url: buildSecEdgarUrl(entity),
          icon: "TrendingUp",
          tooltip: "Public company peer 10-K filings and valuation multiples",
        },
        {
          id: "fmcsa_safer",
          label: "FMCSA SAFER Fleet",
          url: buildFmcsaSaferUrl(),
          icon: "Truck",
          badge: "DOT",
          tooltip: "USDOT fleet safety ratings, crash history, and vehicle counts",
        },
        {
          id: "epa_ust",
          label: "EPA UST Finder",
          url: buildEpaUstUrl(),
          icon: "Flame",
          badge: "EPA",
          tooltip: "Locate underground fuel storage tanks and hazardous sites",
        },
        {
          id: "fred_sofr",
          label: "FRED SOFR Rate",
          url: buildFredSofrUrl(),
          icon: "DollarSign",
          tooltip: "Live 30-Day SOFR benchmark rate from St. Louis Federal Reserve",
        },
      ],
    },
  ];
}

/**
 * Formats a clean, professional Markdown Deal Research Brief ready for 1-click clipboard copying.
 */
export function generateMarkdownResearchBrief(params: ResearchTargetParams): string {
  const address = formatFullAddress(params) || "Address Diligence Required";
  const entity = params.entityName || "Target Acquisition Candidate";
  const mapsUrl = buildGoogleMapsUrl(address);
  const sccUrl = buildVaSccCisUrl(entity);
  const docketUrl = buildCourtListenerUrl(params.docketId, entity);
  const censusUrl = buildCensusNaicsUrl(params.naicsCode);

  return [
    `# ARGUS INVESTMENT COMMITTEE RESEARCH BRIEF`,
    `**Target Entity**: ${entity}`,
    `**Location**: ${address} ([Open Google Maps](${mapsUrl}))`,
    `**Jurisdiction / FIPS**: ${params.county || params.city || "Roanoke"}, VA (FIPS: ${params.fipsCode || "51770"})`,
    params.parcelId ? `**GIS Parcel GPIN**: \`${params.parcelId}\`` : null,
    params.docketId ? `**Court Docket**: \`${params.docketId}\` ([View on CourtListener](${docketUrl}))` : null,
    params.naicsCode ? `**Industry NAICS**: \`${params.naicsCode}\` ([Census Benchmarks](${censusUrl}))` : null,
    ``,
    `### Key Underwriting Metrics`,
    `- **Asking / Cure Price**: ${params.askingPrice || "—"}`,
    `- **Assessed Real Estate Value**: ${params.assessedValue || "—"}`,
    `- **Base DSCR (post-$85k GM Ded.)**: ${params.baseDscr ? `${params.baseDscr}x` : "—"}`,
    ``,
    `### Verified Research Links`,
    `- 🗺️ **Satellite Imagery**: [Google Satellite](${buildGoogleSatelliteUrl(address)})`,
    `- 📸 **Street View**: [Ground-Level Pano](${buildGoogleStreetViewUrl(address, params.latitude, params.longitude)})`,
    `- 🏛️ **Corporate Standing**: [Virginia SCC CIS](${sccUrl}) | [OpenCorporates](${buildOpenCorporatesUrl(entity)})`,
    `- 💼 **Headcount & Execs**: [LinkedIn Directory](${buildLinkedInCompanyUrl(entity)})`,
    `- 🌊 **FEMA Flood Center**: [Check Flood Hazard](${buildFemaFloodUrl(address)})`,
    `- ⛽ **EPA UST Screener**: [EPA Underground Storage Tanks](${buildEpaUstUrl()})`,
    ``,
    `*Generated autonomously by Argus (v1.0) — Compliance-First Asset Intelligence*`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Generates and triggers an immediate client-side CSV download of the target deal/asset.
 */
export function downloadCsvUnderwritingModel(params: ResearchTargetParams): void {
  const address = formatFullAddress(params);
  const headers = [
    "Field",
    "Value",
    "Source Link",
  ];

  const rows = [
    ["Entity Name", params.entityName || "—", buildVaSccCisUrl(params.entityName)],
    ["Address", address || "—", buildGoogleMapsUrl(address)],
    ["City", params.city || "—", ""],
    ["State", params.state || "VA", ""],
    ["Zip Code", params.zipCode || "—", ""],
    ["County / FIPS", `${params.county || ""} (${params.fipsCode || ""})`, ""],
    ["Parcel GPIN", params.parcelId || "—", buildGisPortalUrl(params)],
    ["NAICS Code", params.naicsCode || "—", buildCensusNaicsUrl(params.naicsCode)],
    ["Court Docket ID", params.docketId || "—", buildCourtListenerUrl(params.docketId, params.entityName)],
    ["Asking / Cure Price USD", params.askingPrice || "—", ""],
    ["Assessed / Replacement USD", params.assessedValue || "—", ""],
    ["Base DSCR", params.baseDscr ? `${params.baseDscr}x` : "—", ""],
    ["Google Maps Link", buildGoogleMapsUrl(address), ""],
    ["Satellite Imagery Link", buildGoogleSatelliteUrl(address), ""],
    ["Virginia SCC CIS Link", buildVaSccCisUrl(params.entityName), ""],
    ["FEMA Flood Link", buildFemaFloodUrl(address), ""],
  ];

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const cleanName = (params.entityName || "argus_deal").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  link.setAttribute("download", `${cleanName}_research_model.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type TeamRole = "PRINCIPAL" | "ANALYST" | "COUNSEL" | "CPA" | "LENDER_BROKER";

export type DealStage =
  | "REJECTED_HARD_FILTER"
  | "NEAR_MISS_LOGGED"
  | "SILVER_ENRICHING"
  | "UNDERWRITING_FAILED"
  | "ANALYST_REVIEW_PENDING"
  | "VERIFIED_READY_FOR_PRINCIPAL"
  | "STALE_REVERIFICATION_REQUIRED"
  | "COUNSEL_DILIGENCE"
  | "NDA_DATA_ROOM"
  | "LOI_LENDER_PACK"
  | "ARCHIVED_PASSED";

export interface Deal {
  deal_id: string;
  docket_id?: string;
  mandate_code?: string;
  fips_code?: string;
  parcel_id?: string;
  entity_name: string;
  naics_code?: string;
  stage: DealStage;
  asking_or_cure_price_usd: string;
  assessed_or_replacement_usd?: string;
  internal_max_bid_usd?: string; // Stripped for LENDER_BROKER
  base_dscr: string;
  stress_dscr?: string;
  basis_ratio?: string;
  signal_type?: string;
  has_cre?: boolean;
  independent_source_count?: number;
  independent_source_urls?: string[];
  primary_source_url?: string;
  docket_verified_at?: string;
  gis_verified_at?: string;
  analyst_verified_by?: string;
  counsel_verified_by?: string;
  cpa_verified_by?: string;

  // Asset Analyst OSINT Intelligence Fields
  street_address?: string;
  city?: string;
  state_code?: string;
  county_name?: string;
  zip_code?: string;
  zoning_code?: string;
  building_sqft?: number;
  lot_acreage?: string;
  year_built?: number;
  land_assessed_usd?: string;
  improvement_assessed_usd?: string;
  total_assessed_usd?: string;
  discount_to_assessed_pct?: string;
  annual_revenue_usd?: string;
  historical_normalized_ebitda_usd?: string;
  replacement_gm_salary_deducted_usd?: string;
  adjusted_operating_cash_flow_usd?: string;
  sba_sop_50_10_8_1_status?: string;
  flv_real_estate_usd?: string;
  flv_machinery_floor_usd?: string;
  flv_total_liquidation_floor_usd?: string;
  flv_downside_coverage_ratio?: string;
  is_100pct_principal_protected?: boolean;
  epa_screening_status?: string;
  fema_flood_zone?: string;
  corporate_registry_status?: string;
  court_docket_number?: string;
  fiduciary_name?: string;
  fiduciary_firm?: string;
  fiduciary_phone?: string;
  fiduciary_email?: string;
  executive_summary?: string;
}

export interface DealFilterParams {
  role?: TeamRole;
  stage?: string;
  fips_code?: string;
  signal_type?: string;
  naics_prefix?: string;
  min_price_usd?: string;
  max_price_usd?: string;
  min_base_dscr?: string;
  max_basis_ratio?: string;
  has_cre?: boolean;
  q?: string;
  sort_by?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  mandate_code: string;
  mandate_status: string;
  allow_paid_enrichment: boolean;
  days_remaining_in_mandate_cycle: number;
  timestamp: string;
}

export interface DocketIngestRequest {
  docket_id: string;
  fips_code: string;
  parcel_id: string;
  entity_name: string;
  naics_code: string;
  asking_or_cure_price_usd: string;
  mandate_code?: string;
  has_real_estate_or_equipment_floor: boolean;
  is_predatory_personal_distress: boolean;
  source_url?: string;
}

export interface SiteAccessProfile {
  site: string;
  display_name: string;
  requires_physical_account: boolean;
  account_type_needed: string;
  auth_mechanism: string;
  target_domains: string[];
  compliance_notes: string;
}

export interface AccessRequirementsResponse {
  status: string;
  total_tracked_platforms: number;
  platforms: SiteAccessProfile[];
  summary: {
    physical_account_required_count: number;
    open_public_count: number;
  };
}

export interface ExternalListingResult {
  listing_id: string;
  title: string;
  site: string;
  source_url: string;
  fips_code: string;
  asking_price_usd: string;
  disposition: string;
  reasons: string[];
  ingested_to_pipeline: boolean;
}

export interface ExternalFetchResponse {
  status: string;
  mandate_code: string;
  target_fips_count: number;
  total_fetched: number;
  in_box_ingested_count: number;
  rejected_count: number;
  listings: ExternalListingResult[];
}

export interface DocketIngestResponse {
  docket_id: string;
  disposition: string;
  stage: string;
  reasons?: string[];
  block_reasons?: string[];
  paid_enrichment_invoked?: boolean;
  spend_usd?: string;
  invoked_tools?: string[];
  independent_sources_count?: number;
  deal_id?: string;
}

export interface SBALenderPackBundle {
  deal_id: string;
  entity_name: string;
  rule_bundle_id: string;
  sba_compliant: boolean;
  base_dscr: string;
  stress_dscr: string;
  buyer_cash_pct: string;
  limited_equity_share_pct: string;
  standby_lock_months: number;
  independent_qoe_required: boolean;
  va_foreclosure_notice_days: number;
  all_in_basis_to_replacement_ratio: string;
  sanitized_markdown_pack: string;
}

export interface DealMemo {
  deal_id: string;
  entity_name: string;
  status: string;
  disclaimer_banner: string;
  executive_summary_md: string;
  key_risks: string[];
  generated_at: string;
  counsel_signed_by?: string;
  cpa_signed_by?: string;
}

export interface MandateProfile {
  mandate_id: string;
  mandate_name: string;
  target_states: string[];
  target_fips: string[];
  min_price_usd: string;
  max_price_usd: string;
  near_miss_max_price_usd: string;
  min_base_dscr: string;
  approved_naics_prefixes: string[];
  has_cre_required: boolean;
  active_metro_preset?: string;
}

export interface StateGeoInfo {
  state_code: string;
  state_name: string;
  fips_prefix: string;
  bankruptcy_districts: string[];
  county_count: number;
  public_notice_portal: string;
}

export interface MetroPresetInfo {
  preset_id: string;
  name: string;
  state_code: string;
  description: string;
  counties: {
    fips_code: string;
    county_name: string;
    state_code: string;
    bankruptcy_court_id: string;
  }[];
}

export type SourceStatus =
  | "CONNECTED"
  | "AUTH_REQUIRED"
  | "CIRCUIT_BREAKER_LOCKED"
  | "RATE_LIMITED"
  | "FALLBACK_GENERIC"
  | "OFFLINE_ERROR";

export type SourceCategory =
  | "Federal Bankruptcy Court Dockets"
  | "Statutory Foreclosure & Trustee Notices"
  | "Municipal Tax Sales & Judicial Auctions"
  | "County & City GIS Tax Assessments"
  | "State Corporate & UCC Registry (SCC/SoS)"
  | "Federal Environmental (EPA UST & FEMA)"
  | "Commercial M&A & Private Brokers";

export interface TrackedSourceConnection {
  source_id: string;
  source_name: string;
  category: SourceCategory;
  target_jurisdictions: string[];
  target_fips: string[];
  endpoint_url: string;
  status: SourceStatus;
  is_accessible: boolean;
  requires_physical_account: boolean;
  account_instructions?: string;
  access_barrier_reason?: string;
  last_checked_at: string;
  latency_ms?: number;
  records_retrieved_count: number;
}

export interface LocationConnectivityReport {
  mandate_id: string;
  mandate_name: string;
  target_states: string[];
  target_fips: string[];
  total_sources_evaluated: number;
  connected_count: number;
  auth_required_count: number;
  blocked_or_locked_count: number;
  fallback_or_unmapped_count: number;
  coverage_score_pct: number;
  sources: TrackedSourceConnection[];
  summary_guidance: string[];
}

export interface MacroStressScenario {
  scenario_name: string;
  rate_shock_bps: number;
  ebitda_shock_pct: string;
  annual_debt_service_usd: string;
  stressed_ebitda_usd: string;
  stressed_dscr: string;
  unlevered_free_cash_flow_usd: string;
  is_solvent: boolean;
}

export interface ReturnSensitivityCell {
  exit_year: number;
  exit_multiple: string;
  exit_enterprise_value_usd: string;
  remaining_senior_debt_usd: string;
  remaining_seller_note_usd: string;
  preferred_equity_payoff_usd: string;
  common_equity_proceeds_usd: string;
  moic: string;
  annualized_irr_pct: string;
}

export interface InstitutionalWaterfallResult {
  total_project_cost_usd: string;
  senior_debt_amount_usd: string;
  seller_note_amount_usd: string;
  preferred_equity_amount_usd: string;
  sponsor_common_equity_usd: string;
  blended_cost_of_capital_pct: string;
  base_annual_debt_service_usd: string;
  base_dscr: string;
  stress_scenarios: MacroStressScenario[];
  returns_matrix: ReturnSensitivityCell[];
}

export interface LiquidationFloorResult {
  purchase_or_cure_price_usd: string;
  real_estate_olv_usd: string;
  real_estate_flv_usd: string;
  equipment_olv_usd: string;
  equipment_flv_usd: string;
  total_orderly_liquidation_usd: string;
  total_forced_liquidation_usd: string;
  basis_to_flv_ratio: string;
  flv_downside_coverage_ratio: string;
  is_100pct_principal_protected: boolean;
  principal_at_risk_flv_usd: string;
  equity_cushion_at_olv_usd: string;
}

export interface RollUpClusterOpportunity {
  cluster_id: string;
  cluster_title: string;
  primary_naics_prefix: string;
  target_counties: string[];
  deal_ids: string[];
  deal_names: string[];
  total_asking_basis_usd: string;
  total_assessed_value_usd: string;
  combined_normalized_ebitda_usd: string;
  entry_blended_multiple: string;
  target_platform_multiple: string;
  pro_forma_platform_ev_usd: string;
  multiple_arbitrage_value_usd: string;
  synergy_thesis: string;
}

export interface InstitutionalScorecardResult {
  deal_id: string;
  entity_name: string;
  composite_safety_score: number;
  recommendation_tier: string;
  key_man_score: number;
  customer_concentration_score: number;
  environmental_score: number;
  title_subordination_score: number;
  working_capital_score: number;
  red_flag_notes: string[];
  investment_thesis_bullets: string[];
}

export interface ShadowDistressOpportunity {
  opportunity_id: string;
  entity_name: string;
  fips_code: string;
  jurisdiction_name: string;
  naics_code: string;
  naics_title: string;
  maturity_tier: string;
  primary_signal: string;
  signal_source_url: string;
  estimated_enterprise_value_usd: string;
  unpaid_lien_amount_usd: string;
  lead_time_days: number;
  operator_action_strategy: string;
}

export interface SensitivityMatrixCell {
  revenue_shock_pct: string;
  rate_shock_bps: string;
  effective_rate_pct: string;
  net_cash_flow_usd: string;
  annual_debt_service_usd: string;
  dscr: string;
  cash_on_cash_pct: string;
  risk_tier: "SAFE_IN_BOX" | "WATCH_STRESSED" | "MARGINAL_COVERAGE" | "BREACH_INSOLVENT";
  is_mandate_compliant: boolean;
}

export interface SensitivityMatrixResponse {
  deal_id?: string;
  base_adjusted_ebitda_usd: string;
  sba_loan_usd: string;
  base_rate_pct: string;
  buyer_equity_usd: string;
  revenue_steps: string[];
  rate_shock_bps_steps: number[];
  matrix: SensitivityMatrixCell[][];
}

export interface MerkleAuditVerification {
  chain_integrity_valid: boolean;
  total_events: number;
  tip_hash: string;
}

// ============================================================================
// PROJECT ASSET AGGREGATOR V2.0 MULTI-ASSET TYPES
// ============================================================================

export type AssetClass =
  | "BUSINESS_ACQUISITION"
  | "REAL_ESTATE"
  | "TAX_LIEN_MUNICIPAL"
  | "EQUIPMENT_FLEET";

export type PipelineStage =
  | "SAVED"
  | "OUTREACH_PENDING"
  | "IN_COMMUNICATION"
  | "UNDER_DILIGENCE"
  | "LOI_ISSUED"
  | "CLOSED"
  | "PASSED";

export type OperatorStyle = "PASSIVE_YIELD" | "ACTIVE_OPERATOR";

export interface UserPreferenceProfile {
  profile_id: string;
  investor_name: string;
  target_locations: string[];
  min_check_usd: string;
  max_budget_usd: string;
  target_asset_classes: AssetClass[];
  operator_style: OperatorStyle;
  max_acceptable_crime_index: number;
  min_years_operating: number;
  baby_boomer_succession_only: boolean;
  section_8_only: boolean;
  updated_at?: string;
}

export interface OwnerOSINTReport {
  founder_name: string;
  owner_age_bracket: string;
  tenure_years: number;
  is_confirmed_baby_boomer: boolean;
  professional_licenses: Array<{ board: string; license_no: string; status: string }>;
  litigation_screening: Record<string, any>;
  criminal_background_clearance: boolean;
  regulatory_enforcement_status: string;
  public_reputation_summary: string;
  direct_contacts: Record<string, string>;
  beneficial_ownership?: any;
  corporate_network?: any;
  verified_at?: string;
}

export interface UniversalAsset {
  asset_id: string;
  title: string;
  asset_class: AssetClass;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  metro_area: string;
  parcel_id?: string;
  asking_or_estimated_value_usd: string;
  downside_liquidation_floor_usd: string;
  pipeline_stage: PipelineStage;

  // Macro Metrics (Tier 1 Bulk Indexed)
  crime_index: number;
  median_household_income_usd: string;
  population_growth_10yr_pct: string;
  property_tax_rate_pct: string;

  // Business Specifics
  operating_years?: number;
  founded_year?: number;
  is_potential_baby_boomer?: boolean;
  employee_count_band?: string;
  estimated_annual_revenue_usd?: string;
  estimated_sde_or_ebitda_usd?: string;
  corporate_registry_status?: string;
  naics_code?: string;
  industry_category?: string;

  // Real Estate Specifics
  property_type?: string;
  units_count?: number;
  building_sqft?: number;
  cap_rate_pct?: string;
  cash_on_cash_pct?: string;
  average_monthly_rent_usd?: string;
  section_8_eligible?: boolean;

  // Tax Lien Specifics
  lien_face_value_usd?: string;
  redemption_penalty_rate_pct?: string;
  redemption_period_months?: number;
  parcel_assessed_value_usd?: string;

  // Equipment Specifics
  machinery_type?: string;
  hours_or_mileage?: string;

  // On-Demand Deep Intelligence
  ai_deal_thesis?: string;
  ai_risk_assessment?: string;
  owner_osint?: OwnerOSINTReport;
}

export interface OutreachPlaybook {
  asset_id: string;
  playbook_type: "SUCCESSION_BUYOUT" | "AI_MODERNIZATION";
  target_owner: string;
  subject_line: string;
  body_markdown: string;
  suggested_channels: string[];
  generated_at: string;
}

// ==========================================
// USER AUTHENTICATION & MANAGEMENT TYPES
// ==========================================
export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  role: TeamRole;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  preferences_id?: string;
}

export interface AuthResponse {
  status: string;
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface SignUpPayload {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  role?: TeamRole;
}

export interface SignInPayload {
  username_or_email: string;
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface OAuthProviderInfo {
  enabled: boolean;
  client_id: string | null;
  provider_name: string;
  is_mock_available: boolean;
}

export interface OAuthProvidersResponse {
  google: OAuthProviderInfo;
  microsoft: OAuthProviderInfo;
}

export interface NationwideScraperStatus {
  status: string;
  federal_bankruptcy_courts_indexed: number;
  statewide_public_notice_portals_indexed: number;
  centralized_auction_platforms_indexed: number;
  universal_arcgis_parcel_crawler_active: boolean;
  circuit_breaker_domain_locks_active: number;
  crawling_policy: string;
}

export interface NationwideScanMetrics {
  status: string;
  target_states: string[];
  target_fips_count: number;
  federal_dockets_harvested: number;
  public_notices_harvested: number;
  government_auctions_harvested: number;
  gis_parcels_harvested: number;
  total_raw_harvested: number;
  in_box_ingested_count: number;
  rejected_count: number;
  scanned_at: string;
}

export interface NationwideScanResponse {
  status: string;
  message: string;
  metrics: NationwideScanMetrics;
}

export interface ParcelSpatialTwin {
  parcel_id: string;
  fips_code: string;
  center_lat: number;
  center_lng: number;
  ground_elevation_ft: number;
  polygon_vertices: [number, number][];
  acreage: number;
  building_footprint_sqft: number;
  clear_ceiling_height_ft: number;
  rooftop_hvac_units: number;
  rooftop_condition_score: string;
  loading_dock_bays: number;
  drive_in_doors: number;
  truck_apron_depth_ft: number;
  nearest_interstate_miles: number;
  active_rail_spur: boolean;
  fema_bfe_elevation_ft: number;
  flood_clearance_delta_ft: number;
}

export interface SpatialTwinResponse {
  status: string;
  asset_id: string;
  title: string;
  asset_class: string;
  address: string;
  spatial_twin: ParcelSpatialTwin;
  camera_preset: {
    heading_deg: number;
    pitch_deg: number;
    altitude_meters: number;
  };
}

// =========================================================================
// FIVE INSTITUTIONAL ALADDIN ENGINES TYPES
// =========================================================================

// Engine 1: Uber H3 Spatial Clustering
export interface H3SpatialIndex {
  h3_index_res8: string;
  h3_index_res7: string;
  h3_index_res9: string;
  center_lat: number;
  center_lng: number;
  hex_boundary_res8: [number, number][];
}

export interface H3RollUpCluster {
  cluster_id: string;
  cluster_name: string;
  anchor_h3_res7: string;
  covered_h3_cells_res8: string[];
  naics_code: string;
  industry_title: string;
  asset_ids: string[];
  asset_titles: string[];
  member_count: number;
  combined_asking_value_usd: string;
  combined_revenue_usd: string;
  combined_ebitda_usd: string;
  standalone_avg_multiple: string;
  institutional_exit_multiple: string;
  arbitrage_spread_multiple: string;
  projected_post_synergy_value_usd: string;
  multiple_expansion_arbitrage_gain_usd: string;
  center_lat: number;
  center_lng: number;
}

// Engine 2: SEC EDGAR XBRL Comps & Form D Distress
export interface PublicSectorCompsBenchmark {
  naics_code: string;
  sector_name: string;
  peer_tickers: string[];
  median_ev_ebitda: string;
  p25_ev_ebitda: string;
  p75_ev_ebitda: string;
  median_pe_multiple: string;
  median_debt_to_equity: string;
  median_fcf_yield_pct: string;
  source_domain: string;
}

export interface MultipleArbitrageResult {
  naics_code: string;
  sector_name: string;
  private_purchase_ev_usd: string;
  private_normalized_ebitda_usd: string;
  private_entry_multiple: string;
  public_median_multiple: string;
  multiple_expansion_spread: string;
  immediate_arbitrage_gain_usd: string;
  projected_institutional_exit_val_usd: string;
  is_arbitrage_accretive: boolean;
  arbitrage_tier: "TIER_1_SUPER_ACCRETIVE" | "TIER_2_ACCRETIVE" | "TIER_3_FAIR" | "TIER_4_DILUTIVE";
}

export interface FormDDistressEvaluation {
  cik: string;
  issuer_name: string;
  offering_amount_usd: string;
  amount_sold_usd: string;
  remaining_unsold_usd: string;
  percent_subscribed: string;
  security_type: string;
  days_open: number;
  distress_score: number;
  distress_severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  identified_distress_flags: string[];
  acquisition_opportunity_summary: string;
}

// Engine 3: OpenSanctions & Yente AML/KYC Screening
export interface SanctionMatchHit {
  dataset: string;
  matched_name: string;
  target_query: string;
  similarity_score: string;
  program_or_category: string;
  sanctions_url: string;
  is_exact_match: boolean;
}

export interface YenteComplianceCertificate {
  certificate_id: string;
  screened_at: string;
  screener_role: string;
  target_entity_name: string;
  target_tin_or_ein?: string;
  target_jurisdiction: string;
  screened_beneficial_owners: string[];
  total_datasets_queried: number;
  matched_hits: SanctionMatchHit[];
  clearance_disposition: "CLEARED_FOR_TRANSACTION" | "RESTRICTED_REQUIRES_ENHANCED_DILIGENCE" | "PROHIBITED_SANCTIONED_ENTITY";
  is_fully_cleared: boolean;
  risk_score_basis_points: number;
  sha256_fingerprint: string;
  legal_disclaimer: string;
}

// Engine 4: Unstructured Tax Return Parser
export interface ExtractedTaxLineItem {
  line_number: string;
  description: string;
  amount_usd: string;
  is_lifestyle_addback_candidate: boolean;
  rationale: string;
}

export interface ParsedTaxDocumentReport {
  document_type: string;
  tax_year: number;
  taxpayer_name: string;
  gross_receipts_usd: string;
  cost_of_goods_sold_usd: string;
  gross_profit_usd: string;
  depreciation_amortization_usd: string;
  interest_expense_usd: string;
  officer_or_owner_comp_usd: string;
  net_taxable_income_usd: string;
  line_items: ExtractedTaxLineItem[];
  detected_lifestyle_addbacks: Array<{
    category: string;
    amount_usd: string;
    has_cpa_or_tax_return_proof: boolean;
    is_guru_synergy_claim: boolean;
  }>;
  qoe_audit_result: {
    reported_sde_usd: string;
    verified_addbacks_usd: string;
    disallowed_unproven_addbacks_usd: string;
    replacement_gm_deduction_usd: string;
    adjusted_ebitda_post_gm_usd: string;
    working_capital_peg_12m_avg_usd: string;
    audit_flags: string[];
  };
}

// Engine 5: OpenBB Macro SOFR Yield Curve
export interface BenchmarkYieldCurve {
  as_of_date: string;
  sofr_1m_rate: string;
  sofr_3m_rate: string;
  treasury_10y_rate: string;
  wsj_prime_rate: string;
  sba_max_rate_prime_plus_275: string;
  senior_bank_spread_bps: number;
  openbb_source: string;
}

export interface MacroRateShockResult {
  scenario_id: string;
  scenario_name: string;
  rate_shock_bps: number;
  resulting_interest_rate: string;
  stressed_annual_debt_service_usd: string;
  annual_debt_service_increase_usd: string;
  stressed_ebitda_usd: string;
  stressed_dscr: string;
  debt_yield_ratio: string;
  meets_sba_floor_1_25x: boolean;
  meets_principal_hurdle_1_15x: boolean;
  covenant_headroom_usd: string;
  risk_assessment: string;
}

export interface MacroStressMatrixReport {
  asset_id_or_title: string;
  loan_principal_usd: string;
  amortization_years: number;
  baseline_interest_rate: string;
  baseline_annual_ebitda_usd: string;
  benchmark_yield_curve: BenchmarkYieldCurve;
  scenarios: MacroRateShockResult[];
  max_rate_shock_tolerated_bps: number;
  overall_fragility_tier: "RESILIENT" | "MODERATE_SENSITIVITY" | "VULNERABLE" | "HIGH_RISK_FRAGILE";
}

// MCP & Developer API Key Gateway Types
export interface DeveloperApiKey {
  key_id: string;
  name: string;
  key_prefix: string;
  role: "ADMIN" | "ANALYST" | "READ_ONLY";
  created_at: string;
  last_used_at?: string | null;
  is_active: boolean;
  rate_limit_rpm: number;
}

export interface CreateApiKeyResponse {
  status: string;
  key_id: string;
  name: string;
  raw_api_key: string;
  role: string;
  created_at: string;
  message: string;
}

export interface ClaudeDesktopConfigResponse {
  status: string;
  config: {
    mcpServers: {
      "asup-platform": {
        command: string;
        args: string[];
        env: Record<string, string>;
      };
    };
  };
}

export interface McpHubManifest {
  status: string;
  platform: string;
  base_url: string;
  token: string;
  sse_endpoint: string;
  messages_endpoint: string;
  tool_count: number;
  tool_categories: Record<string, string[]>;
  configs: {
    claude_desktop: Record<string, any>;
    cursor: Record<string, any>;
    cline: Record<string, any>;
    windsurf: Record<string, any>;
    chatgpt_custom_actions: Record<string, any>;
  };
  install_commands: {
    windows_powershell: string;
    macos_linux_bash: string;
    download_urls: {
      claude_desktop_json: string;
      cursor_json: string;
      cline_json: string;
      windsurf_json: string;
      openapi_json: string;
      powershell_script: string;
      bash_script: string;
    };
  };
  quick_test_prompts: string[];
  universal_prompt: string;
}

export interface UpstreamDependencyRecord {
  id: string;
  name: string;
  category: "GITHUB_REPO" | "PYTHON_PACKAGE" | "NPM_PACKAGE" | "SOVEREIGN_SOURCE";
  current_version: string;
  upstream_version?: string | null;
  upstream_repo_url: string;
  update_status: "UP_TO_DATE" | "UPDATE_AVAILABLE" | "SYNCED_VERIFIED" | "CHECK_FAILED";
  last_checked_at: string;
  auto_discovered: boolean;
  critical_for_airgap: boolean;
  purpose: string;
  changelog_snippet?: string | null;
}

export interface UpstreamDependenciesResponse {
  summary: {
    total_tracked: number;
    updates_available_count: number;
    auto_discovered_count: number;
    breakdown: {
      github_repositories: number;
      python_pip_packages: number;
      npm_frontend_packages: number;
    };
    airgap_policy: string;
  };
  dependencies: UpstreamDependencyRecord[];
}

export interface UpstreamCheckResult {
  status: string;
  new_dependencies_discovered: number;
  check_results: {
    total_dependencies_tracked: number;
    checked_count: number;
    updates_found: number;
    timestamp: string;
  };
  summary: UpstreamDependenciesResponse["summary"];
}

export interface UpstreamVerifyAirgapResult {
  status: string;
  is_airgap_passed: boolean;
  exit_code: number;
  test_summary: string;
  output_snippet: string;
}

// =========================================================================
// AUGURY-INSPIRED ASSETHEALTH™ PHYSICAL INTELLIGENCE TYPES
// =========================================================================

export type PhysicalConditionTier = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL";

export type PhysicalRiskGrade = "GRADE_A" | "GRADE_B" | "GRADE_C" | "GRADE_D" | "GRADE_F";

export interface EquipmentItemRecord {
  item_id: string;
  description: string;
  serial_number: string;
  make_model: string;
  year_manufactured: number;
  operating_hours: string;
  rated_life_hours: string;
  original_cost_usd: string;
  estimated_replacement_cost_usd: string;
  condition_tier: PhysicalConditionTier;
  remaining_useful_life_pct: string;
  failure_risk_score: string;
  inspection_notes?: string;
}

export interface AerialFacilityHealthReport {
  parcel_id: string;
  roof_condition_score: string;
  roof_surface_area_sqft: string;
  estimated_roof_replacement_cost_usd: string;
  yard_truck_occupancy_pct: string;
  outdoor_scrap_anomaly_detected: boolean;
  imagery_timestamp_iso: string;
  imagery_source: string;
  confidence_score: string;
}

export interface PredictiveCapexResult {
  total_equipment_value_usd: string;
  year1_mandatory_capex_usd: string;
  year2_mandatory_capex_usd: string;
  year3_mandatory_capex_usd: string;
  total_3year_capex_reserve_usd: string;
  baseline_annual_dscr: string;
  capex_adjusted_dscr: string;
  is_dscr_breached_by_capex: boolean;
  recommended_seller_escrow_holdback_usd: string;
}

export interface OperationalDriftResult {
  drift_detected: boolean;
  drift_p_value: string;
  metric_name: string;
  target_value: string;
  naics_benchmark_value: string;
  deviation_pct: string;
  disguised_distress_signal: boolean;
  diagnosis: string;
}

export interface MaintenanceLedgerAuditResult {
  total_invoices_audited: number;
  suspicious_invoices_count: number;
  disallowed_unproven_maintenance_usd: string;
  phantom_tooling_detected: boolean;
  adjusted_ebitda_deduction_usd: string;
  audit_confidence: string;
  flagged_invoices: Array<{
    invoice_id: string;
    vendor: string;
    description: string;
    amount_usd: string;
    flag_reason: string;
  }>;
}

export interface CompositeAssetHealthScore {
  overall_health_score: number;
  physical_risk_grade: PhysicalRiskGrade;
  equipment_items_count: number;
  critical_failure_items_count: number;
  total_deferred_capex_usd: string;
  recommended_escrow_holdback_usd: string;
  aerial_report: AerialFacilityHealthReport;
  predictive_capex: PredictiveCapexResult;
  operational_drift: OperationalDriftResult;
  maintenance_audit: MaintenanceLedgerAuditResult;
  executive_summary: string;
}

export interface AssetHealthResponse {
  status: string;
  asset_id: string;
  health: CompositeAssetHealthScore;
}

// =========================================================================
// PALANTIR OPERATIONAL ONTOLOGY & GOTHAM LINK GRAPH
// =========================================================================

export interface OntologyNodeRecord {
  node_id: string;
  label: string;
  node_type: string;
  properties: Record<string, any>;
  confidence_score: string;
  provenance_sources: string[];
}

export interface OntologyEdgeRecord {
  source_id: string;
  target_id: string;
  edge_type: string;
  weight: string;
  legal_instrument_ref: string;
  properties: Record<string, any>;
}

export interface OntologyGraphReport {
  asset_id: string;
  total_nodes: number;
  total_edges: number;
  nodes: OntologyNodeRecord[];
  edges: OntologyEdgeRecord[];
  leverage_hub_node_id: string;
  leverage_hub_role: string;
  cross_collateralization_detected: boolean;
  shortest_leverage_path: string[];
  graph_density: string;
  executive_intel_summary: string;
}

export interface EntityResolutionMatchResult {
  source_record_id: string;
  candidate_record_id: string;
  match_probability: string;
  match_tier: string;
  jaro_winkler_name_score: string;
  address_similarity_score: string;
  tax_id_exact_match: boolean;
  is_merged: boolean;
  canonical_entity_id: string;
  epistemic_reasoning: string;
}

export interface TopologicalParcelFusionReport {
  parcel_id: string;
  parcel_area_acres: string;
  building_footprint_sqft: string;
  setback_encroachment_detected: boolean;
  floodway_intersection_sqft: string;
  flood_coverage_pct: string;
  contiguous_roll_up_candidate_parcels: string[];
  rail_spur_adjacent: boolean;
  confidence_score: string;
}

export interface ContourAnalyticalQueryResult {
  query_description: string;
  matched_records_count: number;
  execution_time_ms: string;
  aggregate_ebitda_usd: string;
  aggregate_cure_basis_usd: string;
  records: Array<Record<string, any>>;
}

// =========================================================================
// SOURCING INTELLIGENCE (INVEN / REONOMY / PROPERTYRADAR / CHERRE)
// =========================================================================

export interface LookalikeMatchResult {
  candidate_id: string;
  company_name: string;
  naics_code: string;
  industry_description: string;
  semantic_similarity_score: string;
  estimated_ebitda_usd: string;
  estimated_asking_basis_usd: string;
  distance_miles: string;
  city_and_state: string;
  operational_thesis: string;
  contact_fiduciary_type: string;
}

export interface SemanticLookalikeReport {
  query_text: string;
  exemplary_entity_id?: string;
  total_matched: number;
  candidates: LookalikeMatchResult[];
  executive_summary: string;
}

export interface MaturityWallLoanRecord {
  loan_id: string;
  borrower_name: string;
  parcel_id: string;
  original_principal_usd: string;
  current_balance_usd: string;
  origination_year: number;
  maturity_date_iso: string;
  origination_coupon_pct: string;
  projected_refinance_coupon_pct: string;
  historical_ebitda_usd: string;
  current_annual_debt_service_usd: string;
  projected_annual_debt_service_usd: string;
  current_dscr: string;
  refinanced_dscr: string;
  refinance_cliff_score: string;
  distress_tier: "IMMINENT_DEFAULT" | "HIGH_REFINANCE_STRESS" | "MODERATE_PRESSURE" | "STABLE_COVERAGE";
  months_to_maturity: number;
}

export interface DebtMaturityRadarReport {
  target_market: string;
  total_loans_tracked: number;
  total_maturing_debt_volume_usd: string;
  high_stress_loans_count: number;
  loans: MaturityWallLoanRecord[];
  refinance_stress_thesis: string;
}

export interface TitleLienRecord {
  lien_id: string;
  lien_type: string;
  recording_instrument_no: string;
  recorded_date_iso: string;
  claimed_amount_usd: string;
  is_senior_priority: boolean;
  statutory_redemption_period_days: number;
  redemption_deadline_iso?: string;
  is_blocking_clearance: boolean;
  curative_action_required: string;
}

export interface TitleCurativeAuditReport {
  parcel_id: string;
  deal_id: string;
  title_status: "TITLE_MARKETABLE_INSURABLE" | "TITLE_CLOUDED_REDEMPTION_RISK" | "TITLE_FATAL_SUPERIOR_LIEN";
  is_clearance_blocked: boolean;
  total_liens_count: number;
  total_encumbrance_basis_usd: string;
  irs_120_day_redemption_active: boolean;
  irs_redemption_days_remaining: number;
  recommended_escrow_holdback_usd: string;
  liens: TitleLienRecord[];
  counsel_closing_opinion: string;
}

export interface BuildingPermitRecord {
  permit_id: string;
  issue_date_iso: string;
  permit_type: string;
  estimated_valuation_usd: string;
  status: string;
  contractor_name: string;
  description: string;
}

export interface ZoningEnvelopeReport {
  parcel_id: string;
  zone_code: string;
  zone_description: string;
  permitted_use_status: "PERMITTED_BY_RIGHT" | "LEGAL_NON_CONFORMING_GRANDFATHERED" | "SPECIAL_USE_PERMIT_REQUIRED";
  parcel_sqft: string;
  building_footprint_sqft: string;
  max_allowable_far: string;
  current_far: string;
  expansion_potential_sqft: string;
  open_permit_citations_count: number;
  permits: BuildingPermitRecord[];
  unpermitted_alteration_risk_detected: boolean;
  analyst_zoning_summary: string;
}

// =========================================================================
// INSTITUTIONAL TITAN TYPES (GOLDMAN SECDB / BLACKROCK EFRONT / VANGUARD / JANE STREET / BRIDGEWATER)
// =========================================================================

export interface DAGNodeState {
  node_id: string;
  node_type: "INPUT" | "FORMULA" | "HURDLE";
  label: string;
  dependencies: string[];
  dependents: string[];
  cached_value?: string;
  is_dirty: boolean;
  unit: string;
  description: string;
}

export interface DAGEvaluationReport {
  evaluation_id: string;
  timestamp_iso: string;
  inputs: Record<string, string>;
  computed_formulas: Record<string, string>;
  hurdle_evaluations: Record<string, boolean>;
  is_sba_compliant: boolean;
  is_va_foreclosure_compliant: boolean;
  is_principal_hurdle_passed: boolean;
  dirty_nodes_recalculated_count: number;
  total_dag_nodes_count: number;
  execution_time_microseconds: number;
  incremental_efficiency_pct: string;
  executive_synthesis: string;
}

export interface WaterfallTierResult {
  tier_number: number;
  tier_name: string;
  description: string;
  lp_distribution_usd: string;
  gp_distribution_usd: string;
  total_tier_distribution_usd: string;
  remaining_distributable_usd: string;
}

export interface PEWaterfallReport {
  deal_id: string;
  waterfall_structure: "EUROPEAN_WHOLE_FUND" | "AMERICAN_DEAL_BY_DEAL";
  total_equity_contributed_usd: string;
  lp_equity_contributed_usd: string;
  gp_equity_contributed_usd: string;
  preferred_return_rate_pct: string;
  holding_period_years: string;
  total_distributable_proceeds_usd: string;
  lp_total_received_usd: string;
  gp_total_received_usd: string;
  lp_moic: string;
  gp_moic: string;
  lp_annualized_roi_pct: string;
  gp_carried_interest_usd: string;
  tier_breakdown: WaterfallTierResult[];
  cpa_waterfall_opinion: string;
}

export interface ConcentrationLimitRule {
  rule_name: string;
  dimension_type: string;
  target_identifier: string;
  max_allowable_allocation_pct: string;
  current_allocation_pct: string;
  current_deployed_usd: string;
  is_breached: boolean;
  remedial_action: string;
}

export interface CapitalCallMilestone {
  month_offset: number;
  scheduled_date_iso: string;
  call_amount_usd: string;
  purpose: string;
  cumulative_funded_usd: string;
}

export interface PortfolioAllocationReport {
  report_id: string;
  as_of_date_iso: string;
  total_committed_family_capital_usd: string;
  total_deployed_equity_usd: string;
  dry_powder_liquidity_usd: string;
  dry_powder_ratio_pct: string;
  active_deals_count: number;
  is_all_concentration_limits_compliant: boolean;
  concentration_rules: ConcentrationLimitRule[];
  capital_call_schedule: CapitalCallMilestone[];
  principal_risk_summary: string;
}

export interface Section1031IdentificationRecord {
  candidate_id: string;
  property_address: string;
  county_fips: string;
  estimated_purchase_price_usd: string;
  identified_date_iso: string;
  is_within_45_days: boolean;
  rule_category: string;
}

export interface Section1031ExchangeReport {
  exchange_id: string;
  relinquished_property_name: string;
  sale_closing_date_iso: string;
  sale_price_usd: string;
  adjusted_cost_basis_usd: string;
  existing_mortgage_payoff_usd: string;
  net_equity_proceeds_usd: string;
  statutory_45_day_deadline_iso: string;
  statutory_180_day_deadline_iso: string;
  days_remaining_45d_id: number;
  days_remaining_180d_close: number;
  is_id_window_active: boolean;
  is_exchange_active: boolean;
  identified_properties: Section1031IdentificationRecord[];
  projected_tax_deferral_usd: string;
  effective_capital_gains_rate_pct: string;
  tax_opinion_summary: string;
}

export interface CostSegregationClassAllocation {
  asset_class: "5_YEAR_TANGIBLE_PERSONAL_PROPERTY" | "15_YEAR_LAND_IMPROVEMENTS" | "39_YEAR_NON_RESIDENTIAL_CRE";
  description: string;
  allocated_basis_usd: string;
  allocation_pct: string;
  bonus_depreciation_pct: string;
  year_1_depreciation_usd: string;
}

export interface CostSegregationAnalysisReport {
  parcel_id: string;
  deal_id: string;
  total_acquisition_basis_usd: string;
  land_value_non_depreciable_usd: string;
  depreciable_basis_usd: string;
  class_allocations: CostSegregationClassAllocation[];
  year_1_accelerated_deduction_usd: string;
  year_1_straight_line_deduction_usd: string;
  first_year_additional_deduction_usd: string;
  marginal_tax_rate_pct: string;
  year_1_cash_tax_savings_usd: string;
  npv_5yr_tax_benefit_usd: string;
  cpa_tax_opinion: string;
}

export interface CanonicalEventRecord {
  sequence_no: number;
  timestamp_iso: string;
  event_type: string;
  aggregate_id: string;
  actor_role: string;
  payload_data: Record<string, unknown>;
  payload_hash: string;
  parent_hash: string;
  event_hash: string;
}

export interface ReplayLedgerReport {
  replay_id: string;
  total_events_replayed: number;
  tip_sequence_no: number;
  tip_event_hash: string;
  is_hash_chain_valid: boolean;
  reconstructed_state: Record<string, unknown>;
  earliest_event_timestamp: string;
  latest_event_timestamp: string;
  statutory_audit_opinion: string;
}

export interface QuadrantStressResult {
  quadrant: string;
  regime_name: string;
  growth_trend: string;
  inflation_trend: string;
  revenue_shock_pct: string;
  input_cost_inflation_pct: string;
  rate_shock_bps: string;
  stressed_revenue_usd: string;
  stressed_ebitda_usd: string;
  stressed_annual_debt_service_usd: string;
  stressed_dscr: string;
  solvency_status: string;
  resilience_points: number;
}

export interface BridgewaterMacroRegimeReport {
  deal_id: string;
  entity_name: string;
  naics_code: string;
  base_revenue_usd: string;
  base_ebitda_usd: string;
  base_annual_debt_service_usd: string;
  base_dscr: string;
  composite_resilience_score: string;
  all_weather_grade: string;
  quadrant_results: QuadrantStressResult[];
  most_severe_threat_quadrant: string;
  recommended_hedging_strategy: string;
  dalio_macro_synthesis: string;
}

// =========================================================================
// PALANTIR OPERATIONAL SUPREMACY ENGINES
// =========================================================================

export type CrisisSolvencyStatus =
  | "ROBUST_RESILIENT"
  | "STRESSED_MODERATE"
  | "COVENANT_BREACH_VULNERABLE"
  | "INSOLVENT_DISTRESS";

export interface DefensiveContractualCovenant {
  covenant_name: string;
  legal_mechanism: string;
  target_counterparty: string;
  dollar_impact_or_reserve_usd: string;
  draft_contract_language: string;
}

export interface CrisisSimulationResult {
  deal_id: string;
  asset_name: string;
  base_dscr: string;
  crisis_dscr: string;
  base_ebitda_usd: string;
  crisis_ebitda_usd: string;
  gross_cash_burn_12m_usd: string;
  net_burn_after_reserves_usd: string;
  solvency_status: CrisisSolvencyStatus;
  is_capital_call_required: boolean;
  capital_call_shortfall_usd: string;
  recommended_emergency_liquidity_usd: string;
  defensive_covenants: DefensiveContractualCovenant[];
  executive_summary: string;
}

export type TransactionStructureType =
  | "DIRECT_NOTE_PURCHASE"
  | "SECTION_363_STALKING_HORSE"
  | "DEED_IN_LIEU_FRIENDLY"
  | "COURTHOUSE_STEP_FORECLOSURE";

export type StakeholderRole =
  | "SUBSTITUTE_TRUSTEE"
  | "SENIOR_LENDER_SPECIAL_SERVICER"
  | "DISTRESSED_RETIRING_OWNER"
  | "JUNIOR_ENCUMBRANCE_HOLDERS"
  | "TITLE_UNDERWRITER";

export type PayoffPreference =
  | "CASH_EXPEDIENCY"
  | "PAR_PRINCIPAL_RECOVERY"
  | "LIABILITY_RELEASE"
  | "CRAMDOWN_AVOIDANCE"
  | "INSURABLE_FEE_SIMPLE";

export interface StakeholderProfile {
  role: StakeholderRole;
  stakeholder_name: string;
  payoff_preference: PayoffPreference;
  estimated_batna_value_usd: string;
  pain_threshold_timeline_days: number;
  legal_leverage_description: string;
  key_vulnerability: string;
}

export interface NegotiationStrategyReport {
  deal_id: string;
  asset_name: string;
  optimal_transaction_structure: TransactionStructureType;
  recommended_opening_offer_usd: string;
  maximum_allowable_bid_usd: string;
  walk_away_leverage_point_usd: string;
  stakeholder_matrix: StakeholderProfile[];
  negotiation_roadmap_steps: string[];
  game_theoretic_synthesis: string;
}

export type ExecutionPhase =
  | "IMMEDIATE_TRIAGE_WEEKS_1_2"
  | "CASH_AND_SYSTEMS_LOCKDOWN_WEEKS_3_6"
  | "OPERATIONAL_EXPANSION_WEEKS_7_10"
  | "EXIT_READINESS_WEEKS_11_14";

export interface EBITDAExpansionBridge {
  expansion_lever: string;
  target_domain: string;
  incremental_annual_ebitda_usd: string;
  operational_mechanism: string;
  target_completion_week: number;
}

export interface HundredDayMilestone {
  milestone_id: string;
  week_number: number;
  phase: ExecutionPhase;
  title: string;
  objective: string;
  responsible_role: string;
  statutory_or_operational_kpi: string;
}

export interface HundredDayBlueprintReport {
  deal_id: string;
  asset_name: string;
  purchase_price_usd: string;
  baseline_annual_ebitda_usd: string;
  pro_forma_annual_ebitda_usd: string;
  total_ebitda_expansion_usd: string;
  ebitda_expansion_percentage_pct: string;
  projected_equity_value_creation_usd: string;
  exit_multiple_applied: string;
  milestone_schedule: HundredDayMilestone[];
  ebitda_bridge_breakdown: EBITDAExpansionBridge[];
  executive_mandate_summary: string;
}

export type MilestoneCategory =
  | "CORPORATE_AND_AUTHORITY"
  | "REAL_ESTATE_AND_TITLE"
  | "LENDER_AND_REGULATORY"
  | "TAX_AND_OPERATIONS";

export type MilestoneStatus = "PASSED" | "IN_PROGRESS" | "BLOCKED" | "WAIVED";

export interface StatutoryClosingMilestone {
  milestone_code: string;
  category: MilestoneCategory;
  description: string;
  statutory_or_contractual_basis: string;
  status: MilestoneStatus;
  required_for_funding: boolean;
  responsible_role: string;
  verified_timestamp?: string;
  blocker_detail?: string;
}

export interface ClosingChecklistReport {
  deal_id: string;
  asset_name: string;
  total_statutory_milestones_count: number;
  passed_milestones_count: number;
  blocked_milestones_count: number;
  in_progress_milestones_count: number;
  closing_readiness_score_pct: string;
  is_funding_authorized: boolean;
  total_escrow_holdback_usd: string;
  milestones: StatutoryClosingMilestone[];
  critical_blockers_list: string[];
  counsel_closing_opinion: string;
}

// =========================================================================
// MILESTONE 32: ARGUS ASSET FLIP & CAPITAL VELOCITY ENGINE TYPES
// =========================================================================

export interface SaleLeasebackReport {
  deal_id: string;
  asset_name: string;
  total_acquisition_cost_usd: string;
  facility_sqft: string;
  annual_nnn_rent_usd: string;
  gross_slb_sale_proceeds_usd: string;
  broker_closing_costs_usd: string;
  net_slb_cash_recouped_usd: string;
  net_remaining_equity_basis_usd: string;
  capital_recouped_pct: string;
  post_slb_adjusted_ebitda_usd: string;
  rent_coverage_ratio: string;
  is_slb_viable: boolean;
  is_infinite_return: boolean;
  flipper_synthesis: string;
}

export type FlipExitRouteType =
  | "SALE_LEASEBACK_OPERATING_HOLD"
  | "WHOLESALE_CONTRACT_ASSIGNMENT"
  | "ORDERLY_LIQUIDATION_BREAKUP"
  | "RAPID_OPERATIONAL_TURNAROUND_FLIP";

export interface ExitRouteEvaluation {
  route_type: FlipExitRouteType;
  route_name: string;
  estimated_gross_proceeds_usd: string;
  execution_capital_required_usd: string;
  net_profit_or_cushion_usd: string;
  target_timeline_days: number;
  annualized_roic_pct: string;
  execution_risk_score_1_to_10: number;
  is_capital_recouped_under_90_days: boolean;
  strategic_rationale: string;
}

export interface FlipStrategyReport {
  deal_id: string;
  asset_name: string;
  purchase_price_usd: string;
  recommended_primary_route: FlipExitRouteType;
  highest_roic_route: FlipExitRouteType;
  fastest_payback_route: FlipExitRouteType;
  routes: ExitRouteEvaluation[];
  capital_velocity_index_score: string;
  executive_recommendation: string;
}

export interface ContractAssignmentReport {
  deal_id: string;
  asset_name: string;
  contract_purchase_price_usd: string;
  end_buyer_takeout_price_usd: string;
  gross_assignment_fee_usd: string;
  net_assignment_profit_usd: string;
  assignment_fee_percentage_pct: string;
  cash_on_cash_return_pct: string;
  earnest_money_deposit_usd: string;
  days_to_closing: number;
  is_assignment_viable: boolean;
  is_double_close_recommended: boolean;
  enforceable_assignment_clause: string;
  executive_synthesis: string;
}

// ============================================================================
// PERSISTENT USER SETTINGS & PWA AUTO-UPDATE TYPES
// ============================================================================

export type ThemeMode = "DARK" | "LIGHT" | "MIDNIGHT_OLED" | "BLOOMBERG_NAVY";
export type InterfaceDensity = "COMFORTABLE" | "COMPACT";
export type AutoUpdatePromptMode = "SILENT_AUTO_RELOAD" | "NOTIFY_BEFORE_RELOAD";

export interface UserSettings {
  user_id: string;
  display_name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  organization: string;

  // Theme & Appearance
  theme: ThemeMode;
  density: InterfaceDensity;
  high_contrast: boolean;
  default_landing_view: "AGGREGATOR" | "DIGEST";
  default_role: TeamRole;
  currency_format: "USD_STANDARD" | "USD_COMPACT";

  // Notifications
  push_notifications_enabled: boolean;
  foreclosure_statutory_alerts: boolean;
  monday_weekly_digest_push: boolean;
  instant_distress_alerts: boolean;
  sound_alerts_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;

  // PWA & Auto-Update
  auto_update_enabled: boolean;
  auto_update_prompt_mode: AutoUpdatePromptMode;
  offline_cache_enabled: boolean;
  background_sync_enabled: boolean;
  update_check_interval_minutes: number;

  // Underwriting & Sourcing Defaults
  default_target_cap_rate_pct: string;
  default_replacement_gm_salary_usd: string;
  default_hurdle_base_dscr: string;
  default_hurdle_stressed_dscr: string;
  default_max_purchase_price_usd: string;
  default_target_locations: string[];

  // Metadata
  updated_at?: string;
  client_device_info?: string;
}

export interface PwaVersionInfo {
  app_name: string;
  version: string;
  cache_name: string;
  release_timestamp: string;
  features: string[];
  mandatory_update: boolean;
}













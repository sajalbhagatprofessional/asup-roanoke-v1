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


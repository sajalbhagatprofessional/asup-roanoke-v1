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

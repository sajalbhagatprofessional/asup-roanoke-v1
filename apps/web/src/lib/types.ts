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
  independent_source_count?: number;
  independent_source_urls?: string[];
  docket_verified_at?: string;
  gis_verified_at?: string;
  analyst_verified_by?: string;
  counsel_verified_by?: string;
  cpa_verified_by?: string;
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
  has_real_estate_or_equipment_floor: boolean;
  is_predatory_personal_distress: boolean;
  source_url?: string;
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

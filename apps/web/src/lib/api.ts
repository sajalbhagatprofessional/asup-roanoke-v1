import {
  AccessRequirementsResponse,
  AssetClass,
  AuthResponse,
  AuthUser,
  Deal,
  DealFilterParams,
  DealMemo,
  DocketIngestRequest,
  DocketIngestResponse,
  ExternalFetchResponse,
  ForgotPasswordPayload,
  HealthStatus,
  InstitutionalScorecardResult,
  InstitutionalWaterfallResult,
  LiquidationFloorResult,
  LocationConnectivityReport,
  MandateProfile,
  MerkleAuditVerification,
  MetroPresetInfo,
  NationwideScanResponse,
  NationwideScraperStatus,
  OAuthProvidersResponse,
  SpatialTwinResponse,
  H3RollUpCluster,
  H3SpatialIndex,
  PublicSectorCompsBenchmark,
  MultipleArbitrageResult,
  FormDDistressEvaluation,
  YenteComplianceCertificate,
  ParsedTaxDocumentReport,
  BenchmarkYieldCurve,
  MacroStressMatrixReport,
  OperatorStyle,
  OutreachPlaybook,
  OwnerOSINTReport,
  PipelineStage,
  ResetPasswordPayload,
  RollUpClusterOpportunity,
  SBALenderPackBundle,
  SensitivityMatrixResponse,
  ShadowDistressOpportunity,
  SignInPayload,
  SignUpPayload,
  StateGeoInfo,
  TeamRole,
  UniversalAsset,
  UserPreferenceProfile,
  VerifyEmailPayload,
  UpstreamDependenciesResponse,
  UpstreamCheckResult,
  UpstreamVerifyAirgapResult,
  AssetHealthResponse,
  CompositeAssetHealthScore,
  SemanticLookalikeReport,
  DebtMaturityRadarReport,
  TitleCurativeAuditReport,
  ZoningEnvelopeReport,
  DAGEvaluationReport,
  DAGNodeState,
  PEWaterfallReport,
  PortfolioAllocationReport,
  Section1031ExchangeReport,
  CostSegregationAnalysisReport,
  ReplayLedgerReport,
  BridgewaterMacroRegimeReport,
} from "./types";

export const getApiBase = () => {
  if (typeof window !== "undefined") {
    // Client-side: use relative path through Next.js rewrite or direct URL
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  return process.env.FASTAPI_URL || "http://127.0.0.1:8000";
};

export async function fetchHealth(): Promise<HealthStatus> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDeals(
  role: TeamRole = "ANALYST",
  stageOrParams?: string | DealFilterParams
): Promise<Deal[]> {
  const base = getApiBase();
  const params = new URLSearchParams({ role });

  if (typeof stageOrParams === "string") {
    if (stageOrParams && stageOrParams !== "ALL") params.append("stage", stageOrParams);
  } else if (stageOrParams) {
    if (stageOrParams.stage && stageOrParams.stage !== "ALL") params.append("stage", stageOrParams.stage);
    if (stageOrParams.fips_code) params.append("fips_code", stageOrParams.fips_code);
    if (stageOrParams.signal_type) params.append("signal_type", stageOrParams.signal_type);
    if (stageOrParams.naics_prefix) params.append("naics_prefix", stageOrParams.naics_prefix);
    if (stageOrParams.min_price_usd) params.append("min_price_usd", stageOrParams.min_price_usd);
    if (stageOrParams.max_price_usd) params.append("max_price_usd", stageOrParams.max_price_usd);
    if (stageOrParams.min_base_dscr) params.append("min_base_dscr", stageOrParams.min_base_dscr);
    if (stageOrParams.max_basis_ratio) params.append("max_basis_ratio", stageOrParams.max_basis_ratio);
    if (stageOrParams.has_cre !== undefined) params.append("has_cre", String(stageOrParams.has_cre));
    if (stageOrParams.q) params.append("q", stageOrParams.q);
    if (stageOrParams.sort_by) params.append("sort_by", stageOrParams.sort_by);
  }

  try {
    const res = await fetch(`${base}/v1/deals?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch deals for ${role}: ${res.statusText}`);
    const deals: Deal[] = await res.json();
    if (typeof window !== "undefined") {
      import("./offlineStore").then((mod) => mod.cacheDealsLocally(deals)).catch(() => {});
    }
    return deals;
  } catch (err) {
    if (typeof window !== "undefined") {
      try {
        const mod = await import("./offlineStore");
        const cached = await mod.getCachedDeals();
        if (cached && cached.length > 0) {
          console.warn("[Argus PWA Memory] Network offline: returning local cached deal vault.");
          return cached;
        }
      } catch (e) {}
    }
    throw err;
  }
}

export async function fetchDealDetail(dealId: string, role: TeamRole = "ANALYST"): Promise<Deal> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}?role=${role}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch deal detail: ${res.statusText}`);
  return res.json();
}

export async function fetchDealIntelligence(dealId: string, role: TeamRole = "ANALYST"): Promise<Deal> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/intelligence?role=${role}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch deal intelligence: ${res.statusText}`);
  return res.json();
}

export async function ingestDocket(payload: DocketIngestRequest): Promise<DocketIngestResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/dockets/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Docket ingestion failed: ${res.statusText}`);
  return res.json();
}

export async function verifyAndPromoteDeal(
  dealId: string,
  newSourceUrls?: string[],
  analystId: string = "analyst_1"
): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "ANALYST",
      analyst_id: analystId,
      new_source_urls: newSourceUrls,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Verification failed");
  }
  return res.json();
}

export async function principalDecision(
  dealId: string,
  action: "APPROVE" | "REJECT" | "SEND_TO_COUNSEL",
  principalId: string = "principal_1",
  notes?: string
): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, principal_id: principalId, notes }),
  });
  if (!res.ok) throw new Error(`Principal decision failed: ${res.statusText}`);
  return res.json();
}

export async function counselReview(
  dealId: string,
  data: {
    counsel_id: string;
    notice_published_date: string;
    scheduled_sale_date: string;
    senior_payoff_usd: string;
    delinquent_tax_usd: string;
    trustee_fees_usd: string;
    immediate_capex_usd: string;
    verified_assessed_usd: string;
  }
): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/counsel-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Counsel review failed");
  }
  return res.json();
}

export async function cpaAudit(
  dealId: string,
  data: {
    cpa_id: string;
    total_project_cost_usd: string;
    appraised_cre_usd: string;
    sba_7a_loan_usd: string;
    buyer_cash_equity_usd: string;
    seller_standby_note_usd: string;
    seller_standby_lock_months: number;
    seller_consulting_months: number;
    adjusted_ebitda_post_gm_usd: string;
    annual_maintenance_capex_usd: string;
    annual_cash_taxes_usd: string;
  }
): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/cpa-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "CPA audit failed");
  }
  return res.json();
}

export async function generateMemo(
  dealId: string,
  counselId?: string,
  cpaId?: string,
  keyRisks?: string[]
): Promise<DealMemo> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/memo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      counsel_id: counselId,
      cpa_id: cpaId,
      key_risks: keyRisks,
    }),
  });
  if (!res.ok) throw new Error(`Memo generation failed: ${res.statusText}`);
  return res.json();
}

export async function fetchLenderPack(
  dealId: string,
  standbyLockMonths: number = 36
): Promise<SBALenderPackBundle> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/v1/deals/${dealId}/lender-pack?standby_lock_months=${standbyLockMonths}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to fetch lender pack");
  }
  return res.json();
}

export async function fetchAccessRequirements(): Promise<AccessRequirementsResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/access-requirements`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch access requirements: ${res.statusText}`);
  return res.json();
}

export async function fetchExternalListings(
  fipsCodes?: string[],
  mandateCode: string = "ROA-REGIONAL-01"
): Promise<ExternalFetchResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/listings/external-fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fips_codes: fipsCodes,
      mandate_code: mandateCode,
      auto_ingest: true,
    }),
  });
  if (!res.ok) throw new Error(`External listing fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchActiveMandate(): Promise<MandateProfile> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/mandates/active`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch active mandate: ${res.statusText}`);
  return res.json();
}

export async function configureMandate(
  profile: MandateProfile
): Promise<{ status: string; message: string; profile: MandateProfile }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/mandates/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`Failed to configure mandate: ${res.statusText}`);
  return res.json();
}

export async function fetchStatesAndPresets(): Promise<{
  states: StateGeoInfo[];
  metro_presets: MetroPresetInfo[];
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/geo/states`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch states & presets: ${res.statusText}`);
  return res.json();
}

export async function fetchStateCounties(
  state: string = "VA"
): Promise<{ state_code: string; total_counties: number; counties: any[] }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/geo/counties?state=${state}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch counties for ${state}: ${res.statusText}`);
  return res.json();
}

export async function fetchTargetedListings(): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/listings/targeted-fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auto_ingest: true }),
  });
  if (!res.ok) throw new Error(`Targeted listing scan failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSourcesHealth(mandateCode?: string): Promise<LocationConnectivityReport> {
  const base = getApiBase();
  const url = mandateCode
    ? `${base}/v1/sources/health?mandate_code=${encodeURIComponent(mandateCode)}`
    : `${base}/v1/sources/health`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch source connectivity: ${res.statusText}`);
  return res.json();
}

export async function refreshSourcesHealth(): Promise<{
  status: string;
  message: string;
  report: LocationConnectivityReport;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/sources/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to refresh source connectivity: ${res.statusText}`);
  return res.json();
}

export async function fetchRollUpClusters(): Promise<{
  status: string;
  total_clusters_identified: number;
  clusters: RollUpClusterOpportunity[];
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/analytics/roll-up-clusters`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch roll-up clusters: ${res.statusText}`);
  return res.json();
}

export async function fetchShadowPipeline(fips?: string): Promise<{
  status: string;
  total_shadow_opportunities: number;
  opportunities: ShadowDistressOpportunity[];
}> {
  const base = getApiBase();
  const url = fips ? `${base}/v1/dockets/shadow-pipeline?fips=${fips}` : `${base}/v1/dockets/shadow-pipeline`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch shadow pipeline: ${res.statusText}`);
  return res.json();
}

export async function fetchDealScorecard(dealId: string): Promise<InstitutionalScorecardResult> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}/institutional-scorecard`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch deal scorecard: ${res.statusText}`);
  return res.json();
}

export async function runInstitutionalWaterfall(payload: any): Promise<InstitutionalWaterfallResult> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/underwriting/institutional-waterfall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Institutional waterfall run failed: ${res.statusText}`);
  return res.json();
}

export async function runLiquidationFloor(payload: any): Promise<LiquidationFloorResult> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/underwriting/liquidation-floor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Liquidation floor solver failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSensitivityMatrix(payload?: any): Promise<SensitivityMatrixResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/underwriting/sensitivity-matrix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`Sensitivity matrix failed: ${res.statusText}`);
  return res.json();
}

export async function verifyMerkleAuditChain(): Promise<MerkleAuditVerification> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/audit-ledger/verify`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Audit ledger verification failed: ${res.statusText}`);
  return res.json();
}

export async function triggerPwaPushTest(payload?: any): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/pwa/notify-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`PWA Push test failed: ${res.statusText}`);
  return res.json();
}

export async function fetchVapidPublicKey(): Promise<string> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/pwa/vapid-public-key`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch VAPID key: ${res.statusText}`);
  const data = await res.json();
  return data.public_key;
}

export async function registerPushSubscription(sub: any): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/pwa/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  if (!res.ok) throw new Error(`Failed to register push subscription: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// PROJECT ASSET AGGREGATOR V2.0 MULTI-ASSET API CLIENT
// ============================================================================

export interface UniversalSearchParams {
  query?: string;
  asset_class?: AssetClass;
  state?: string;
  metro_area?: string;
  min_price?: string;
  max_price?: string;
  max_crime_index?: number;
  min_years_operating?: number;
  baby_boomer_only?: boolean;
  section_8_only?: boolean;
  pipeline_stage?: PipelineStage;
  sort_by?: string;
  apply_user_preferences?: boolean;
}

export async function searchUniversalAssets(
  params: UniversalSearchParams = {}
): Promise<UniversalAsset[]> {
  const base = getApiBase();
  const urlParams = new URLSearchParams();

  if (params.query) urlParams.append("query", params.query);
  if (params.asset_class) urlParams.append("asset_class", params.asset_class);
  if (params.state) urlParams.append("state", params.state);
  if (params.metro_area) urlParams.append("metro_area", params.metro_area);
  if (params.min_price) urlParams.append("min_price", params.min_price);
  if (params.max_price) urlParams.append("max_price", params.max_price);
  if (params.max_crime_index !== undefined)
    urlParams.append("max_crime_index", String(params.max_crime_index));
  if (params.min_years_operating !== undefined)
    urlParams.append("min_years_operating", String(params.min_years_operating));
  if (params.baby_boomer_only) urlParams.append("baby_boomer_only", "true");
  if (params.section_8_only) urlParams.append("section_8_only", "true");
  if (params.pipeline_stage) urlParams.append("pipeline_stage", params.pipeline_stage);
  if (params.sort_by) urlParams.append("sort_by", params.sort_by);
  if (params.apply_user_preferences !== undefined)
    urlParams.append("apply_user_preferences", String(params.apply_user_preferences));

  const qs = urlParams.toString();
  const res = await fetch(`${base}/v2/assets/search${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to search universal assets: ${res.statusText}`);
  return res.json();
}

export async function fetchUniversalAssetDetail(assetId: string): Promise<UniversalAsset> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/assets/${encodeURIComponent(assetId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch asset ${assetId}: ${res.statusText}`);
  return res.json();
}

export async function runAssetDeepOsint(assetId: string): Promise<UniversalAsset> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/assets/${encodeURIComponent(assetId)}/deep-osint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Deep OSINT failed for ${assetId}: ${res.statusText}`);
  return res.json();
}

export async function generateOutreachPlaybook(
  assetId: string,
  playbookType: "SUCCESSION_BUYOUT" | "AI_MODERNIZATION" = "SUCCESSION_BUYOUT"
): Promise<OutreachPlaybook> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/v2/assets/${encodeURIComponent(assetId)}/outreach-playbook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playbook_type: playbookType }),
    }
  );
  if (!res.ok) throw new Error(`Failed to generate playbook for ${assetId}: ${res.statusText}`);
  return res.json();
}

export async function updatePipelineStage(
  assetId: string,
  stage: PipelineStage
): Promise<UniversalAsset> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/pipeline/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId, stage }),
  });
  if (!res.ok) throw new Error(`Failed to update pipeline stage: ${res.statusText}`);
  return res.json();
}

export async function fetchUserPreferences(
  profileId: string = "default_investor"
): Promise<UserPreferenceProfile> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/v2/user/preferences?profile_id=${encodeURIComponent(profileId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to fetch user preferences: ${res.statusText}`);
  return res.json();
}

export async function saveUserPreferences(
  preferences: UserPreferenceProfile
): Promise<UserPreferenceProfile> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/user/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error(`Failed to save user preferences: ${res.statusText}`);
  return res.json();
}

// ==========================================
// USER AUTHENTICATION & MANAGEMENT API METHODS
// ==========================================

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("asup_access_token");
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("asup_access_token", token);
  } else {
    localStorage.removeItem("asup_access_token");
  }
}

export function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getStoredAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiSignUp(payload: SignUpPayload): Promise<{
  status: string;
  message: string;
  user: AuthUser;
  verification_token: string;
  verification_url: string;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function apiSignIn(payload: SignInPayload): Promise<AuthResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Sign in failed");
  setStoredAuthToken(data.access_token);
  return data;
}

export async function apiVerifyEmail(token: string): Promise<{
  status: string;
  message: string;
  user?: AuthUser;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Email verification failed");
  return data;
}

export async function apiResendVerification(email: string): Promise<{
  status: string;
  message: string;
  verification_token?: string;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to resend verification");
  return data;
}

export async function apiForgotPassword(email: string): Promise<{
  status: string;
  message: string;
  reset_token?: string;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to process forgot password");
  return data;
}

export async function apiResetPassword(payload: ResetPasswordPayload): Promise<{
  status: string;
  message: string;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to reset password");
  return data;
}

export async function apiGetCurrentUser(): Promise<{
  status: string;
  user: AuthUser;
  claims: Record<string, any>;
} | null> {
  const token = getStoredAuthToken();
  if (!token) return null;
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/v1/auth/me`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 401) {
        setStoredAuthToken(null);
      }
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("Failed to fetch current user session:", err);
    return null;
  }
}

export async function apiFetchOAuthProviders(): Promise<OAuthProvidersResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/auth/oauth/providers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load OAuth providers");
  return res.json();
}

// ==========================================
// NATIONWIDE SOVEREIGN SCRAPERS API METHODS
// ==========================================

export async function fetchNationwideScrapersStatus(): Promise<NationwideScraperStatus> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/ingestion/nationwide/status`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch nationwide scrapers status");
  return res.json();
}

export async function triggerNationwideSovereignScan(payload?: {
  target_states?: string[];
  target_fips?: string[];
  min_price_usd?: string;
  max_price_usd?: string;
}): Promise<NationwideScanResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/ingestion/nationwide/scan`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to execute nationwide sovereign scan");
  }
  return res.json();
}

// ==========================================
// 3D SPATIAL TWIN & SITE FLYOVER API METHODS
// ==========================================

export async function fetchAssetSpatialTwin(assetId: string): Promise<SpatialTwinResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/assets/${encodeURIComponent(assetId)}/spatial-twin`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load spatial digital twin for asset ${assetId}`);
  }
  return res.json();
}

// ==========================================
// FIVE INSTITUTIONAL ALADDIN ENGINES API
// ==========================================

// Engine 1: Uber H3 Spatial Clustering
export async function fetchH3RollUpClusters(kRingRadius: number = 3): Promise<{
  status: string;
  total_clusters: number;
  k_ring_radius: number;
  clusters: H3RollUpCluster[];
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/analytics/h3-clusters?k_ring_radius=${kRingRadius}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load H3 roll-up clusters");
  return res.json();
}

export async function fetchAssetH3Index(assetId: string): Promise<{
  status: string;
  asset_id: string;
  title: string;
  h3_spatial_index: H3SpatialIndex;
  k_ring_2_neighbors: string[];
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/assets/${encodeURIComponent(assetId)}/h3-index`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch H3 index for asset ${assetId}`);
  return res.json();
}

// Engine 2: SEC EDGAR Public Comps & Form D Distress
export async function fetchPublicCompsBenchmark(naicsCode: string): Promise<PublicSectorCompsBenchmark & { status: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/underwriting/public-comps/${encodeURIComponent(naicsCode)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch SEC EDGAR comps for NAICS ${naicsCode}`);
  return res.json();
}

export async function calculateMultipleArbitrage(
  purchaseEvUsd: string,
  normalizedEbitdaUsd: string,
  naicsCode: string = "5412"
): Promise<{ status: string; arbitrage: MultipleArbitrageResult }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/underwriting/multiple-arbitrage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purchase_ev_usd: purchaseEvUsd,
      normalized_ebitda_usd: normalizedEbitdaUsd,
      naics_code: naicsCode,
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate multiple arbitrage");
  return res.json();
}

export async function scanEdgarFormDDistress(
  stateCode?: string,
  issuerQuery?: string
): Promise<{
  status: string;
  total_filings_screened: number;
  filings: Array<{
    accession_number: string;
    filing_date: string;
    sec_filing_url: string;
    distress_evaluation: FormDDistressEvaluation;
  }>;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/underwriting/edgar-distress-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state_code: stateCode, issuer_query: issuerQuery }),
  });
  if (!res.ok) throw new Error("Failed to scan SEC Form D filings");
  return res.json();
}

// Engine 3: OpenSanctions & Yente AML/KYC Screening
export async function screenEntityCompliance(req: {
  entity_name: string;
  jurisdiction?: string;
  screener_role?: string;
  beneficial_owners?: string[];
  tin_or_ein?: string;
}): Promise<{ status: string; certificate: YenteComplianceCertificate }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/compliance/screen-entity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to screen entity compliance");
  return res.json();
}

export async function fetchComplianceCertificate(certificateId: string): Promise<{
  status: string;
  certificate: YenteComplianceCertificate;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/compliance/certificate/${encodeURIComponent(certificateId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load compliance certificate ${certificateId}`);
  return res.json();
}

// Engine 4: Unstructured Tax Return Parser
export async function parseTaxDocument(req: {
  document_type?: string;
  document_text: string;
  tax_year?: number;
  taxpayer_name?: string;
  owner_hours_per_week?: number;
}): Promise<{ status: string; report: ParsedTaxDocumentReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/underwriting/parse-tax-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to parse tax document");
  return res.json();
}

// Engine 5: OpenBB Macro SOFR Yield Curve
export async function fetchBenchmarkYieldCurve(): Promise<{
  status: string;
  yield_curve: BenchmarkYieldCurve;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/underwriting/benchmark-yield-curve`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch benchmark yield curve");
  return res.json();
}

export async function runMacroSofrScenarios(req: {
  loan_principal_usd: string;
  baseline_annual_ebitda_usd: string;
  amortization_years?: number;
  baseline_rate_pct?: string;
  asset_title?: string;
}): Promise<{ status: string; matrix_report: MacroStressMatrixReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v2/underwriting/macro-sofr-scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to run macro SOFR stress scenarios");
  return res.json();
}

// ==========================================
// DEVELOPER & AI AGENT GATEWAY (MCP) API METHODS
// ==========================================

export async function fetchDeveloperApiKeys(): Promise<{
  status: string;
  keys: import("./types").DeveloperApiKey[];
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/developer/keys`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch developer API keys");
  return res.json();
}

export async function createDeveloperApiKey(
  name: string,
  role: string = "ANALYST"
): Promise<import("./types").CreateApiKeyResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/developer/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role }),
  });
  if (!res.ok) throw new Error("Failed to create developer API key");
  return res.json();
}

export async function revokeDeveloperApiKey(
  keyId: string
): Promise<{ status: string; message: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/developer/keys/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to revoke API key ${keyId}`);
  return res.json();
}

export async function fetchClaudeDesktopConfig(): Promise<import("./types").ClaudeDesktopConfigResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/developer/mcp/config`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch Claude Desktop configuration");
  return res.json();
}

export async function fetchMcpHubManifest(token: string = "asup_live_anthropic_mcp_master_key_2026"): Promise<import("./types").McpHubManifest> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/mcp/hub?token=${encodeURIComponent(token)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load MCP Hub manifest");
  return res.json();
}

export async function fetchMcpUniversalPrompt(token: string = "asup_live_anthropic_mcp_master_key_2026"): Promise<{ status: string; prompt: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/mcp/prompt?format=json&token=${encodeURIComponent(token)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch Universal MCP prompt");
  return res.json();
}

export async function dispatchMcpJsonRpc(
  payload: any,
  apiKey: string = "asup_live_anthropic_mcp_master_key_2026"
): Promise<any> {
  const base = getApiBase();
  const res = await fetch(`${base}/mcp/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MCP Dispatch Failed (${res.status}): ${errText}`);
  }
  return res.json();
}

export async function fetchUpstreamDependencies(): Promise<UpstreamDependenciesResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/system/dependencies`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch upstream dependencies manifest");
  return res.json();
}

export async function checkUpstreamDependencies(): Promise<UpstreamCheckResult> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/system/dependencies/check-updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to poll upstream registries for updates");
  return res.json();
}

export async function verifyUpstreamAirgap(): Promise<UpstreamVerifyAirgapResult> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/system/dependencies/verify-tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to run air-gap test verification gate");
  return res.json();
}

export async function fetchAssetHealthScore(
  assetId: string,
  naicsCode: string = "332710",
  annualEbitda: number = 480000,
  annualDebtService: number = 285000
): Promise<AssetHealthResponse> {
  const base = getApiBase();
  const params = new URLSearchParams({
    naics_code: naicsCode,
    annual_ebitda: String(annualEbitda),
    debt_service: String(annualDebtService),
  });
  const res = await fetch(`${base}/v1/assets/${assetId}/health-score?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch physical asset health score: ${res.statusText}`);
  return res.json();
}

// =========================================================================
// PALANTIR OPERATIONAL ONTOLOGY & GOTHAM LINK GRAPH CLIENT
// =========================================================================

export async function fetchOntologyGraph(assetId: string): Promise<{
  status: string;
  asset_id: string;
  ontology_graph: import("./types").OntologyGraphReport;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/ontology/graph/${assetId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ontology graph: ${res.statusText}`);
  return res.json();
}

export async function resolveEntitySplink(
  sourceRecord: Record<string, any>,
  candidateRecord: Record<string, any>
): Promise<{
  status: string;
  entity_resolution: import("./types").EntityResolutionMatchResult;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/ontology/resolve-entity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_record: sourceRecord, candidate_record: candidateRecord }),
  });
  if (!res.ok) throw new Error(`Failed to execute Splink entity resolution: ${res.statusText}`);
  return res.json();
}

export async function queryContourMicroOlap(params: {
  naics_prefix?: string;
  max_cure_basis_usd?: string;
  min_dscr?: string;
  min_notice_days?: number;
  jurisdiction?: string;
}): Promise<{
  status: string;
  contour_query_result: import("./types").ContourAnalyticalQueryResult;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/ontology/contour-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to execute Contour micro-OLAP query: ${res.statusText}`);
  return res.json();
}

export async function fuseGaiaSpatialTwin(params: {
  parcel_id: string;
  flood_hazard_zone?: string;
  distance_to_boundary_ft?: number;
  distance_to_rail_ft?: number;
}): Promise<{
  status: string;
  spatial_fusion: import("./types").TopologicalParcelFusionReport;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/ontology/spatial-fusion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to execute Gaia spatial fusion: ${res.statusText}`);
  return res.json();
}

// Sourcing Intelligence & Debt Radar (Inven / Reonomy / PropertyRadar / Cherre)
export async function fetchSemanticLookalikes(params: {
  query: string;
  exemplary_entity_id?: string;
  min_similarity?: number;
  naics_prefix?: string;
  max_distance_miles?: number;
}): Promise<{ status: string; lookalike_report: SemanticLookalikeReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/sourcing/semantic-lookalikes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to fetch semantic lookalikes: ${res.statusText}`);
  return res.json();
}

export async function fetchDebtMaturityRadar(params: {
  target_market?: string;
  max_months_to_maturity?: number;
  projected_refinance_rate?: number;
} = {}): Promise<{ status: string; maturity_radar: DebtMaturityRadarReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/sourcing/debt-maturity-radar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to fetch debt maturity radar: ${res.statusText}`);
  return res.json();
}

export async function fetchTitleCurativeAudit(params: {
  parcel_id: string;
  deal_id?: string;
  foreclosure_sale_date_iso?: string;
  custom_liens?: any[];
}): Promise<{ status: string; title_curative_audit: TitleCurativeAuditReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/sourcing/title-curative-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to execute title curative audit: ${res.statusText}`);
  return res.json();
}

export async function fetchPermitZoningScan(params: {
  parcel_id: string;
  parcel_area_acres?: number;
  building_footprint_sqft?: number;
  zoning_code?: string;
  custom_permits?: any[];
}): Promise<{ status: string; zoning_envelope: ZoningEnvelopeReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/sourcing/permit-zoning-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to execute permit & zoning scan: ${res.statusText}`);
  return res.json();
}

// =========================================================================
// INSTITUTIONAL TITAN API CLIENT METHODS
// =========================================================================

export async function fetchReactiveDAGEvaluation(params: {
  purchase_price_usd?: number;
  buyer_equity_pct?: number;
  sofr_benchmark_rate?: number;
  bank_spread_bps?: number;
  historical_ebitda_usd?: number;
  replacement_gm_salary_usd?: number;
  assessed_cre_value_usd?: number;
  seller_standby_note_usd?: number;
  seller_consulting_months?: number;
  loan_term_years?: number;
} = {}): Promise<{ status: string; dag_report: DAGEvaluationReport; node_states: DAGNodeState[] }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/reactive-dag/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to evaluate reactive DAG: ${res.statusText}`);
  return res.json();
}

export async function fetchPEWaterfall(params: {
  deal_id?: string;
  total_distributable_proceeds_usd: number;
  lp_equity_contributed_usd: number;
  gp_equity_contributed_usd?: number;
  preferred_return_rate_pct?: number;
  holding_period_years?: number;
  carried_interest_pct?: number;
  waterfall_structure?: "EUROPEAN_WHOLE_FUND" | "AMERICAN_DEAL_BY_DEAL";
}): Promise<{ status: string; waterfall_report: PEWaterfallReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/capital-allocator/waterfall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to calculate PE waterfall: ${res.statusText}`);
  return res.json();
}

export async function fetchPortfolioConcentration(params: {
  total_committed_capital_usd?: number;
  active_positions?: any[];
} = {}): Promise<{ status: string; concentration_report: PortfolioAllocationReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/capital-allocator/concentration-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to audit portfolio concentration: ${res.statusText}`);
  return res.json();
}

export async function fetch1031ExchangeAudit(params: {
  exchange_id?: string;
  relinquished_property_name?: string;
  sale_closing_date_iso?: string;
  sale_price_usd: number;
  adjusted_cost_basis_usd: number;
  existing_mortgage_payoff_usd?: number;
  candidate_replacements?: any[];
}): Promise<{ status: string; exchange_report: Section1031ExchangeReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/tax-alpha/1031-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to audit 1031 exchange: ${res.statusText}`);
  return res.json();
}

export async function fetchCostSegregationAnalysis(params: {
  parcel_id: string;
  deal_id?: string;
  total_acquisition_basis_usd: number;
  land_value_ratio?: number;
  five_year_ratio?: number;
  fifteen_year_ratio?: number;
  bonus_depreciation_pct?: number;
  marginal_tax_rate_pct?: number;
}): Promise<{ status: string; cost_segregation_report: CostSegregationAnalysisReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/tax-alpha/cost-segregation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to calculate cost segregation: ${res.statusText}`);
  return res.json();
}

export async function fetchCanonicalEventReplay(params: {
  aggregate_id?: string;
  up_to_sequence_no?: number;
} = {}): Promise<{ status: string; replay_report: ReplayLedgerReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/event-stream/replay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to replay canonical event stream: ${res.statusText}`);
  return res.json();
}

export async function fetchMacroRegimeStressTest(params: {
  deal_id?: string;
  entity_name?: string;
  naics_code?: string;
  base_annual_revenue_usd: number;
  base_normalized_ebitda_usd: number;
  base_annual_debt_service_usd: number;
  base_interest_rate_pct?: number;
}): Promise<{ status: string; macro_regime_report: BridgewaterMacroRegimeReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/titan/macro-regime/stress-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to execute macro regime stress test: ${res.statusText}`);
  return res.json();
}

// ==========================================
// PALANTIR OPERATIONAL SUPREMACY API METHODS
// ==========================================

export async function fetchWarRoomSimulation(params: {
  deal_id: string;
  asset_name?: string;
  naics_code?: string;
  base_annual_revenue_usd: number;
  base_annual_ebitda_usd: number;
  annual_senior_debt_service_usd: number;
  customer_churn_pct?: number;
  cogs_inflation_pct?: number;
  unplanned_capex_usd?: number;
  key_person_recruiting_premium_usd?: number;
  insurance_cost_shock_pct?: number;
  baseline_insurance_expense_usd?: number;
  existing_liquid_cash_reserves_usd?: number;
}): Promise<{ status: string; crisis_report: import("./types").CrisisSimulationResult }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/operations/war-room/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to simulate crisis war room: ${res.statusText}`);
  return res.json();
}

export async function fetchNegotiationStrategy(params: {
  deal_id: string;
  asset_name?: string;
  senior_defaulted_principal_usd: number;
  accrued_default_interest_and_fees_usd?: number;
  junior_encumbrances_usd?: number;
  verified_assessed_real_estate_usd: number;
  estimated_going_concern_ebitda_usd: number;
  irs_tax_lien_present?: boolean;
  notice_lead_days?: number;
  owner_personal_guarantee_active?: boolean;
  competing_bidders_count?: number;
}): Promise<{ status: string; negotiation_report: import("./types").NegotiationStrategyReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/operations/negotiation/stakeholder-matrix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to solve stakeholder game theory: ${res.statusText}`);
  return res.json();
}

export async function fetchHundredDayBlueprint(params: {
  deal_id: string;
  asset_name?: string;
  naics_code?: string;
  purchase_price_usd: number;
  baseline_annual_revenue_usd: number;
  baseline_annual_ebitda_usd: number;
  exit_multiple_ev_ebitda?: number;
}): Promise<{ status: string; blueprint_report: import("./types").HundredDayBlueprintReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/operations/value-creation/100-day-blueprint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to generate 100-day blueprint: ${res.statusText}`);
  return res.json();
}

export async function fetchClosingChecklist(deal_id: string): Promise<{
  status: string;
  closing_report: import("./types").ClosingChecklistReport;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/operations/closing/checklist/${deal_id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch closing checklist: ${res.statusText}`);
  return res.json();
}

export async function auditCustomClosingChecklist(
  deal_id: string,
  params: {
    asset_name?: string;
    total_purchase_price_usd: number;
    total_escrow_holdback_required_usd?: number;
    irs_redemption_active?: boolean;
    open_lust_or_flood_issue?: boolean;
    principal_approval_token_present?: boolean;
    counsel_signoff_present?: boolean;
  }
): Promise<{ status: string; closing_report: import("./types").ClosingChecklistReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/operations/closing/checklist/${deal_id}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to audit closing checklist: ${res.statusText}`);
  return res.json();
}

// =========================================================================
// MILESTONE 32: ARGUS ASSET FLIP & CAPITAL VELOCITY CLIENT FETCHERS
// =========================================================================

export async function fetchSaleLeaseback(params: {
  deal_id?: string;
  asset_name?: string;
  total_acquisition_cost_usd: number;
  facility_sqft: number;
  market_nnn_rent_per_sqft_usd?: number;
  investor_exit_cap_rate?: number;
  transaction_broker_fee_pct?: number;
  baseline_annual_ebitda_usd?: number;
}): Promise<{ status: string; sale_leaseback_report: import("./types").SaleLeasebackReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/flipper/sale-leaseback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to calculate sale-leaseback: ${res.statusText}`);
  return res.json();
}

export async function fetchFlipStrategies(params: {
  deal_id?: string;
  asset_name?: string;
  purchase_price_usd: number;
  cre_market_assessed_value_usd: number;
  equipment_liquidation_floor_usd: number;
  current_annual_ebitda_usd: number;
  turnaround_target_ebitda_usd?: number;
  facility_sqft?: number;
  market_nnn_rent_per_sqft_usd?: number;
  exit_cap_rate?: number;
  wholesaling_assignment_fee_usd?: number;
}): Promise<{ status: string; flip_strategy_report: import("./types").FlipStrategyReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/flipper/flip-strategy-matrix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to optimize flip strategies: ${res.statusText}`);
  return res.json();
}

export async function fetchContractAssignment(params: {
  deal_id?: string;
  asset_name?: string;
  contract_purchase_price_usd: number;
  end_buyer_takeout_price_usd: number;
  earnest_money_deposit_usd?: number;
  inspection_contingency_days?: number;
  closing_deadline_days?: number;
  title_and_legal_costs_usd?: number;
}): Promise<{ status: string; contract_assignment_report: import("./types").ContractAssignmentReport }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/flipper/contract-assignment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to calculate contract assignment: ${res.statusText}`);
  return res.json();
}

export async function fetchExecutiveTearSheet(deal_id: string): Promise<{
  status: string;
  deal_id: string;
  tear_sheet_text: string;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/flipper/tear-sheet/${deal_id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch executive tear-sheet: ${res.statusText}`);
  return res.json();
}

export async function generateCustomTearSheet(params: {
  deal_id: string;
  asset_name: string;
  naics_code: string;
  jurisdiction_fips: string;
  asking_or_cure_price_usd: number;
  cre_market_assessed_usd: number;
  machinery_floor_usd: number;
  total_liquidation_floor_usd: number;
  cushion_spread_usd: number;
  cushion_spread_pct: number;
  current_annual_ebitda_usd: number;
  slb_net_cash_recouped_usd: number;
  slb_net_remaining_basis_usd: number;
  wholesale_assignment_fee_usd: number;
  turnaround_18m_ev_usd: number;
  va_statutory_notice_days: number;
  sba_baseline_dscr: number;
  recommended_action: string;
}): Promise<{ status: string; deal_id: string; tear_sheet_text: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/flipper/tear-sheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to generate custom tear-sheet: ${res.statusText}`);
  return res.json();
}

// ==========================================
// PERSISTENT USER SETTINGS & PWA AUTO-UPDATE
// ==========================================

export async function fetchUserSettings(userId?: string): Promise<import("./types").UserSettings> {
  const base = getApiBase();
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`${base}/v1/user/settings${query}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch user settings: ${res.statusText}`);
  return res.json();
}

export async function saveUserSettings(settings: import("./types").UserSettings): Promise<import("./types").UserSettings> {
  const base = getApiBase();
  const token = getStoredAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}/v1/user/settings`, {
    method: "POST",
    headers,
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to save settings: ${res.statusText}`);
  return res.json();
}

export async function fetchPwaVersion(): Promise<import("./types").PwaVersionInfo> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/pwa/version`);
  if (!res.ok) throw new Error(`Failed to fetch PWA version: ${res.statusText}`);
  return res.json();
}

export async function fetchAssetResearchLinks(params: {
  entity_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  fips_code?: string;
  parcel_id?: string;
  naics_code?: string;
  docket_id?: string;
}): Promise<any> {
  const base = getApiBase();
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  const res = await fetch(`${base}/v1/research/links?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch research links: ${res.statusText}`);
  return res.json();
}














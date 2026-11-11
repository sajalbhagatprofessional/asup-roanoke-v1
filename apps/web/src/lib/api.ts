import {
  AccessRequirementsResponse,
  Deal,
  DealFilterParams,
  DealMemo,
  DocketIngestRequest,
  DocketIngestResponse,
  ExternalFetchResponse,
  HealthStatus,
  SBALenderPackBundle,
  TeamRole,
} from "./types";

const getApiBase = () => {
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

  const res = await fetch(`${base}/v1/deals?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch deals for ${role}: ${res.statusText}`);
  return res.json();
}

export async function fetchDealDetail(dealId: string, role: TeamRole = "ANALYST"): Promise<Deal> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/deals/${dealId}?role=${role}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch deal detail: ${res.statusText}`);
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


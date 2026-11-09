-- =========================================================================
-- Acquisition Sourcing & Underwriting Platform (v1.0)
-- Migration 001: PostGIS, Mandates, Bronze/Silver/Gold Tables, Temporal Rules & 5-Role RLS
-- Target: PostgreSQL 16 + PostGIS 3 on Oracle OCI ARM64
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Team Role Enum & Epistemic Tier Enum
CREATE TYPE team_role AS ENUM ('PRINCIPAL', 'ANALYST', 'COUNSEL', 'CPA', 'LENDER_BROKER');
CREATE TYPE epistemic_tier AS ENUM ('TIER_A_STATUTE', 'TIER_B_PUBLIC_RECORD', 'TIER_C_PRACTITIONER', 'TIER_D_INTERNAL');
CREATE TYPE deal_stage AS ENUM (
    'REJECTED_HARD_FILTER',
    'NEAR_MISS_LOGGED',
    'SILVER_ENRICHING',
    'UNDERWRITING_FAILED',
    'ANALYST_REVIEW_PENDING',
    'VERIFIED_READY_FOR_PRINCIPAL',
    'STALE_REVERIFICATION_REQUIRED',
    'COUNSEL_DILIGENCE',
    'NDA_DATA_ROOM',
    'LOI_LENDER_PACK',
    'ARCHIVED_PASSED'
);

-- 2. Saved Mandates Table (Enforces 90-Day Anti-Drift Review Gate)
CREATE TABLE mandates (
    mandate_code VARCHAR(32) PRIMARY KEY,
    version VARCHAR(16) NOT NULL,
    title TEXT NOT NULL,
    in_box_fips TEXT[] NOT NULL,
    near_miss_fips TEXT[] NOT NULL,
    min_price_usd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    max_price_usd NUMERIC(14, 2) NOT NULL,
    near_miss_max_price_usd NUMERIC(14, 2) NOT NULL,
    min_base_dscr NUMERIC(6, 4) NOT NULL,
    min_stress_dscr NUMERIC(6, 4) NOT NULL,
    max_basis_to_replacement NUMERIC(6, 4) NOT NULL,
    replacement_gm_salary_usd NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    CONSTRAINT chk_90_day_window CHECK (review_due_at <= created_at + INTERVAL '95 days')
);

INSERT INTO mandates (
    mandate_code, version, title, in_box_fips, near_miss_fips,
    min_price_usd, max_price_usd, near_miss_max_price_usd,
    min_base_dscr, min_stress_dscr, max_basis_to_replacement, replacement_gm_salary_usd
) VALUES (
    'ROA-SMB-01', '1.0.0',
    'Roanoke City & County Operating Brick-and-Mortar Businesses (Real Estate / Hard Asset Floor)',
    ARRAY['51770', '51161'], ARRAY['51775'],
    0.00, 5000000.00, 5750000.00,
    1.3500, 1.1500, 0.7000, 85000.00
);

-- 3. Temporal Statutory & Underwriting Rule Registry
CREATE TABLE underwriting_rule_versions (
    rule_bundle_id VARCHAR(64) PRIMARY KEY,
    authority_name TEXT NOT NULL,
    authority_url TEXT NOT NULL,
    tier epistemic_tier NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    parameters_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO underwriting_rule_versions (
    rule_bundle_id, authority_name, authority_url, tier, effective_from, effective_to, parameters_json
) VALUES
(
    'SBA-SOP-50-10-8.1-v2026.10',
    'SBA SOP 50 10 8.1 (Information Notice 5000-880695 & Technical Updates 5000-882227)',
    'https://legacy.sba.gov/document/information-notice-5000-880695-issuance-sop-50-10-81',
    'TIER_A_STATUTE',
    '2026-10-01', NULL,
    '{"min_sba_dscr": "1.25", "min_equity_injection_pct": "0.10", "max_limited_equity_share": "0.50", "min_buyer_cash_pct": "0.05", "min_seller_standby_months": 36, "max_seller_consulting_months": 24, "mandatory_qoe_ex_cre_usd": "3000000.00"}'::jsonb
),
(
    'VA-FORECLOSURE-55.1-321-v2026',
    'Code of Virginia §§ 55.1-320 to 55.1-322 (Non-Judicial Substitute Trustee Sales)',
    'https://law.lis.virginia.gov/vacode/title55.1/chapter3/section55.1-320/',
    'TIER_A_STATUTE',
    '2021-07-01', NULL,
    '{"min_commercial_notice_days": 14, "commissioner_accounting_months": 6}'::jsonb
);

-- 4. Bronze Layer: Append-Only Raw Docket & GIS Payload Vault
CREATE TABLE bronze_ingest_log (
    bronze_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(64) NOT NULL,
    source_url TEXT NOT NULL,
    payload_sha256 CHAR(64) NOT NULL UNIQUE,
    raw_payload JSONB NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Silver & Gold Layer: Deals Pipeline with Verified-Lead Hardware Constraint
CREATE TABLE deals (
    deal_id VARCHAR(32) PRIMARY KEY,
    mandate_code VARCHAR(32) NOT NULL REFERENCES mandates(mandate_code),
    fips_code CHAR(5) NOT NULL,
    parcel_id VARCHAR(64) NOT NULL,
    entity_name TEXT NOT NULL,
    naics_code VARCHAR(12) NOT NULL,
    stage deal_stage NOT NULL,
    asking_or_cure_price_usd NUMERIC(14, 2) NOT NULL,
    assessed_or_replacement_usd NUMERIC(14, 2) NOT NULL,
    base_dscr NUMERIC(6, 4),
    stress_dscr NUMERIC(6, 4),
    independent_source_count INTEGER NOT NULL DEFAULT 1,
    primary_source_url TEXT NOT NULL,
    secondary_source_url TEXT,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analyst_verified_by VARCHAR(64),
    analyst_verified_at TIMESTAMPTZ,
    rule_bundle_id VARCHAR(64) REFERENCES underwriting_rule_versions(rule_bundle_id),
    geom GEOMETRY(Point, 4326),
    -- Improvement #2 Hardware Constraint: No deal can enter VERIFIED_READY_FOR_PRINCIPAL
    -- without >=2 independent sources, a secondary URL, and human Analyst sign-off!
    CONSTRAINT chk_verified_lead_gate CHECK (
        stage <> 'VERIFIED_READY_FOR_PRINCIPAL'
        OR (
            independent_source_count >= 2
            AND secondary_source_url IS NOT NULL
            AND analyst_verified_by IS NOT NULL
            AND analyst_verified_at IS NOT NULL
        )
    )
);

-- 6. Encrypted Owner / Fiduciary PII Vault (AES-256-GCM Ciphertext Only)
CREATE TABLE owner_pii_vault (
    deal_id VARCHAR(32) PRIMARY KEY REFERENCES deals(deal_id),
    fiduciary_or_trustee_name TEXT NOT NULL,
    encrypted_contact_payload BYTEA NOT NULL,
    encryption_key_id VARCHAR(32) NOT NULL,
    dnc_checked_at TIMESTAMPTZ NOT NULL,
    is_dnc_suppressed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. Immutable Audit Log with Tamper-Prevention Trigger
CREATE TABLE audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_role team_role NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    deal_id VARCHAR(32),
    event_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_audit_tamper()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AUDIT_LOG_IMMUTABLE_VIOLATION: UPDATE and DELETE are forbidden on audit_events';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tamper();

-- 8. Row-Level Security (RLS) Enforcing the Principal's Time Protection (Priority #1)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Principal ONLY sees deals that have passed human Analyst sign-off or are in active Counsel/LOI diligence
CREATE POLICY principal_verified_only_policy ON deals
    FOR SELECT
    USING (
        current_setting('app.current_role', true) <> 'PRINCIPAL'
        OR stage IN ('VERIFIED_READY_FOR_PRINCIPAL', 'COUNSEL_DILIGENCE', 'NDA_DATA_ROOM', 'LOI_LENDER_PACK')
    );

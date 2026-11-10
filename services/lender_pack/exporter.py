from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List
from packages.underwriting_engine import SBAUnderwritingResult, VirginiaForeclosureResult
from services.memo_drafter import DraftedDealMemo


@dataclass(frozen=True)
class SBALenderPackBundle:
    deal_id: str
    entity_name: str
    rule_bundle_id: str
    sba_compliant: bool
    base_dscr: Decimal
    stress_dscr: Decimal
    buyer_cash_pct: Decimal
    limited_equity_share_pct: Decimal
    standby_lock_months: int
    independent_qoe_required: bool
    va_foreclosure_notice_days: int
    all_in_basis_to_replacement_ratio: Decimal
    sanitized_markdown_pack: str


def generate_sba_lender_pack(
    deal_id: str,
    entity_name: str,
    sba_res: SBAUnderwritingResult,
    va_res: VirginiaForeclosureResult,
    approved_memo: DraftedDealMemo,
    standby_lock_months: int,
) -> SBALenderPackBundle:
    """
    Generates a sanitized, lender-ready SBA 7(a) / 504 Underwriting Package.
    Requires that the Deal Memo has already been signed off by Counsel and CPA,
    and strips confidential internal family-office maximum bid ceilings.
    """
    if approved_memo.status != "APPROVED_BY_COUNSEL_AND_CPA":
        raise PermissionError(
            f"Cannot export SBA Lender Pack for {deal_id}: Deal Memo status is '{approved_memo.status}' (requires Counsel + CPA sign-off)"
        )
    if not sba_res.is_sba_compliant:
        raise ValueError(f"Cannot export SBA Lender Pack for {deal_id}: SBA SOP 50 10 8.1 violations present: {sba_res.violation_codes}")

    md = "\n".join([
        f"# SBA 7(a) / 504 Lender Underwriting Package — {entity_name} (`{deal_id}`)",
        "- **Governing Standard**: SBA SOP 50 10 8.1 (Effective October 1, 2026 — Notice 5000-880695 & 5000-882227)",
        f"- **Historical / Base DSCR**: `{sba_res.base_dscr}x` (SBA Minimum: `1.25x` | Family-Office Hurdle: `1.35x`)",
        f"- **Stressed DSCR (-15% Rev & +200 bps Rate Shock)**: `{sba_res.stress_dscr}x` (Hurdle: `1.15x`)",
        f"- **Total Equity Injection**: `{sba_res.total_equity_injection_pct * Decimal(100):.2f}%` (Buyer Cash: `{sba_res.buyer_cash_pct_of_project * Decimal(100):.2f}%` | Limited Equity Share: `{sba_res.limited_equity_share_of_required_pct * Decimal(100):.2f}%` <= 50% Cap)",
        f"- **Seller Standby Note Lock**: `{standby_lock_months} Months` (SOP 50 10 8.1 Minimum: `36 Months`)",
        f"- **Independent QoE Required (>=$3.0M ex-CRE)**: `{sba_res.independent_qoe_required}`",
        f"- **Va. Code § 55.1-321 Foreclosure Notice Lead Time**: `{va_res.notice_lead_days} Days` (Statutory Minimum: `14 Days`)",
        f"- **All-In Cure Basis / Verified Value Ratio**: `{va_res.basis_to_replacement_ratio * Decimal(100):.2f}%` (Ceiling: `70.00%`)",
        f"- **Counsel & CPA Sign-Off**: Verified by `{approved_memo.counsel_signed_by}` & `{approved_memo.cpa_signed_by}`",
    ])

    return SBALenderPackBundle(
        deal_id=deal_id,
        entity_name=entity_name,
        rule_bundle_id="SBA-SOP-50-10-8.1-v2026.10",
        sba_compliant=sba_res.is_sba_compliant,
        base_dscr=sba_res.base_dscr,
        stress_dscr=sba_res.stress_dscr,
        buyer_cash_pct=sba_res.buyer_cash_pct_of_project,
        limited_equity_share_pct=sba_res.limited_equity_share_of_required_pct,
        standby_lock_months=standby_lock_months,
        independent_qoe_required=sba_res.independent_qoe_required,
        va_foreclosure_notice_days=va_res.notice_lead_days,
        all_in_basis_to_replacement_ratio=va_res.basis_to_replacement_ratio,
        sanitized_markdown_pack=md,
    )


@dataclass(frozen=True)
class MandateGovernanceStatus:
    mandate_code: str
    version: str
    status: str  # ACTIVE | RENEWAL_DUE_WARNING | PAUSED_EXPIRED_REVIEW_DUE
    days_remaining: int
    allow_paid_enrichment: bool


def check_90_day_mandate_expiry(
    mandate_code: str,
    version: str,
    created_at: datetime,
    now: datetime,
) -> MandateGovernanceStatus:
    """
    Enforces Phase 7 Anti-Drift Rule:
    A filter set today must never silently govern deals in 2028.
    - Days 0..75: ACTIVE
    - Days 76..90: RENEWAL_DUE_WARNING (T-14 day review packet triggered)
    - Day >90: PAUSED_EXPIRED_REVIEW_DUE (paid enrichment automatically halted until Principal renews)
    """
    review_due_at = created_at + timedelta(days=90)
    remaining = (review_due_at - now).days
    if now > review_due_at:
        return MandateGovernanceStatus(
            mandate_code=mandate_code,
            version=version,
            status="PAUSED_EXPIRED_REVIEW_DUE",
            days_remaining=remaining,
            allow_paid_enrichment=False,
        )
    if remaining <= 14:
        return MandateGovernanceStatus(
            mandate_code=mandate_code,
            version=version,
            status="RENEWAL_DUE_WARNING",
            days_remaining=remaining,
            allow_paid_enrichment=True,
        )
    return MandateGovernanceStatus(
        mandate_code=mandate_code,
        version=version,
        status="ACTIVE",
        days_remaining=remaining,
        allow_paid_enrichment=True,
    )

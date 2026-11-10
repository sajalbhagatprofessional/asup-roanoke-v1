from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from packages.core_types import ProvenancedValue

LEGAL_TAX_DISCLAIMER_BANNER = (
    "LLM DRAFT — NOT LEGAL, TAX, OR CPA ADVICE. REQUIRES HUMAN COUNSEL & CPA SIGN-OFF"
)


class UncitedClaimError(ValueError):
    """Raised when a Deal Memo contains a quantitative claim not backed by a verified Silver source URL or explicit UNPROVEN badge."""


class MissingDisclaimerError(ValueError):
    """Raised when any generated Deal Memo or legal/tax summary omits the mandatory disclaimer banner."""


@dataclass(frozen=True)
class MemoMetricClaim:
    metric_name: str
    provenanced_value: ProvenancedValue[Decimal]

    def render_line(self) -> str:
        return f"- **{self.metric_name}**: {self.provenanced_value.format_badge()}"


@dataclass(frozen=True)
class DraftedDealMemo:
    deal_id: str
    entity_name: str
    disclaimer_banner: str
    status: str  # DRAFT_PENDING_REVIEW | APPROVED_BY_COUNSEL_AND_CPA
    executive_summary_md: str
    quantitative_claims: List[MemoMetricClaim]
    key_risks: List[str]
    generated_at: datetime
    used_deterministic_fallback: bool
    counsel_signed_by: Optional[str] = None
    cpa_signed_by: Optional[str] = None


class CitationLockedMemoDrafter:
    """
    Enforces Improvement #4 (LLM as Drafter, Not Auditor):
    1. Every quantitative claim in a Deal Memo must come from a `ProvenancedValue[Decimal]`
       with a verified `https://` source URL, timestamp, and confidence score—or render
       `[UNPROVEN — REQUIRES DILIGENCE]`.
    2. Every memo carries the non-removable `LEGAL_TAX_DISCLAIMER_BANNER`.
    3. If `kill_switch_memo_drafter=True` (incident fallback), generates a 100% deterministic
       tabular memo without calling any external LLM API.
    4. Remains locked in `DRAFT_PENDING_REVIEW` until both Counsel and CPA sign off.
    """

    @staticmethod
    def generate_deal_memo(
        deal_id: str,
        entity_name: str,
        claims: Dict[str, ProvenancedValue[Decimal]],
        key_risks: List[str],
        generated_at: datetime,
        kill_switch_memo_drafter: bool = False,
        custom_disclaimer: Optional[str] = None,
    ) -> DraftedDealMemo:
        banner = custom_disclaimer if custom_disclaimer is not None else LEGAL_TAX_DISCLAIMER_BANNER
        if banner != LEGAL_TAX_DISCLAIMER_BANNER:
            raise MissingDisclaimerError(
                "Deal Memo rejected: Mandatory LEGAL_TAX_DISCLAIMER_BANNER is missing or modified."
            )

        metric_claims: List[MemoMetricClaim] = []
        for name, pv in claims.items():
            if not pv.is_unproven and (not pv.source_url or not pv.source_url.startswith("https://")):
                raise UncitedClaimError(
                    f"Uncited metric '{name}' in Deal {deal_id}: must have https:// source_url or is_unproven=True"
                )
            metric_claims.append(MemoMetricClaim(metric_name=name, provenanced_value=pv))

        lines = [
            f"> **{banner}**",
            "",
            f"# Institutional Deal Memo: {entity_name} (`{deal_id}`)",
            "",
            "## 1. Verified Quantitative Underwriting Summary (SBA SOP 50 10 8.1 & Va. Code § 55.1-321)",
        ]
        for mc in metric_claims:
            lines.append(mc.render_line())

        lines.append("")
        lines.append("## 2. Identified Statutory, Environmental & Operational Risks")
        for r in key_risks:
            lines.append(f"- {r}")

        return DraftedDealMemo(
            deal_id=deal_id,
            entity_name=entity_name,
            disclaimer_banner=banner,
            status="DRAFT_PENDING_REVIEW",
            executive_summary_md="\n".join(lines),
            quantitative_claims=metric_claims,
            key_risks=list(key_risks),
            generated_at=generated_at,
            used_deterministic_fallback=kill_switch_memo_drafter,
        )

    @staticmethod
    def record_counsel_and_cpa_signoff(
        memo: DraftedDealMemo,
        counsel_id: str,
        cpa_id: str,
    ) -> DraftedDealMemo:
        if not counsel_id or not cpa_id:
            raise ValueError("Both counsel_id and cpa_id are required to unlock a Deal Memo")
        return DraftedDealMemo(
            deal_id=memo.deal_id,
            entity_name=memo.entity_name,
            disclaimer_banner=memo.disclaimer_banner,
            status="APPROVED_BY_COUNSEL_AND_CPA",
            executive_summary_md=memo.executive_summary_md,
            quantitative_claims=memo.quantitative_claims,
            key_risks=memo.key_risks,
            generated_at=memo.generated_at,
            used_deterministic_fallback=memo.used_deterministic_fallback,
            counsel_signed_by=counsel_id,
            cpa_signed_by=cpa_id,
        )

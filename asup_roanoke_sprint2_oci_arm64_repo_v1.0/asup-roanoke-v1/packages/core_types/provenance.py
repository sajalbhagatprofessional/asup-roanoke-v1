from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from enum import IntEnum
from typing import Generic, Optional, TypeVar, List
from urllib.parse import urlparse

T = TypeVar("T")


class EpistemicTier(IntEnum):
    """
    Strict Epistemic Hierarchy (Improvement #4 & #9):
    Lower integer rank = Higher authority.
    TIER_A_STATUTE (1) > TIER_B_PUBLIC_RECORD (2) > TIER_C_PRACTITIONER (3) > TIER_D_INTERNAL (4)
    """
    TIER_A_STATUTE = 1
    TIER_B_PUBLIC_RECORD = 2
    TIER_C_PRACTITIONER = 3
    TIER_D_INTERNAL = 4


@dataclass(frozen=True)
class ProvenancedValue(Generic[T]):
    """
    Wraps every number, date, or claim in the platform.
    If a claim lacks a verified URL or is marked unproven, it automatically renders
    an explicit [UNPROVEN — REQUIRES DILIGENCE] badge.
    """
    value: Optional[T]
    source_url: Optional[str]
    verified_at: Optional[datetime]
    confidence_score: Decimal
    epistemic_tier: EpistemicTier
    is_unproven: bool = False
    unproven_reason: Optional[str] = None

    def __post_init__(self) -> None:
        if not isinstance(self.confidence_score, Decimal):
            raise TypeError("confidence_score must be a decimal.Decimal")
        if self.confidence_score < Decimal("0.00") or self.confidence_score > Decimal("1.00"):
            raise ValueError("confidence_score must be between 0.00 and 1.00")
        if not self.is_unproven:
            if not self.source_url or not self.source_url.startswith("https://"):
                raise ValueError("Verified ProvenancedValue requires an https:// source_url")
            if self.verified_at is None:
                raise ValueError("Verified ProvenancedValue requires a verified_at timestamp")

    def is_stale(self, now: datetime, max_age_hours: int) -> bool:
        if self.is_unproven or self.verified_at is None:
            return True
        age = now - self.verified_at
        return age > timedelta(hours=max_age_hours)

    def format_badge(self) -> str:
        if self.is_unproven or self.value is None or not self.source_url:
            reason = f": {self.unproven_reason}" if self.unproven_reason else ""
            return f"[UNPROVEN — REQUIRES DILIGENCE{reason}]"
        dt_str = self.verified_at.strftime("%Y-%m-%d") if self.verified_at else "unknown"
        return f"{self.value} (Source: {self.source_url} | Verified: {dt_str} | Conf: {self.confidence_score:.2f} | {self.epistemic_tier.name})"


def verify_dual_independent_sources(urls: List[str]) -> bool:
    """
    Enforces Improvement #2: At least 2 independent public source domains required
    before a deal can reach Analyst sign-off or Principal Digest.
    """
    domains = set()
    for u in urls:
        if u and u.startswith("https://"):
            parsed = urlparse(u)
            host = parsed.netloc.lower().lstrip("www.")
            if host:
                domains.add(host)
    return len(domains) >= 2


@dataclass(frozen=True)
class RuleCandidate:
    rule_id: str
    parameter_name: str
    value: Decimal
    tier: EpistemicTier
    source_url: str
    applicable_min_deal_usd: Decimal = Decimal("0")
    applicable_max_deal_usd: Decimal = Decimal("999999999")


def resolve_epistemic_conflict(
    candidates: List[RuleCandidate],
    deal_size_usd: Decimal,
) -> RuleCandidate:
    """
    Enforces Improvement #4 & #9:
    1. Filters candidates to those applicable to `deal_size_usd`.
    2. Selects the highest epistemic authority (Tier A > Tier B > Tier C > Tier D).
    3. If two candidates share the same tier, the more conservative (higher DSCR / higher buyer cash / longer lock) wins.
    """
    applicable = [
        c for c in candidates
        if c.applicable_min_deal_usd <= deal_size_usd <= c.applicable_max_deal_usd
    ]
    if not applicable:
        raise ValueError(f"No applicable rule candidate for deal_size_usd={deal_size_usd}")
    # Sort by EpistemicTier ascending (1=Tier A wins), then by conservative value descending
    applicable.sort(key=lambda c: (int(c.tier), -c.value))
    return applicable[0]

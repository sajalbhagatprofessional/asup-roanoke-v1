from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Optional
from urllib.parse import urlparse


class CircuitBreakerOpenError(RuntimeError):
    """Raised when a domain is locked by the 24-hour HTTP 401/403/429/CAPTCHA circuit breaker."""


class RobotsTxtDisallowedError(RuntimeError):
    """Raised when a target path is disallowed by the domain's robots.txt policy."""


class PacerDailyCapExceededError(RuntimeError):
    """Raised when PACER page charges ($0.10/page) would exceed the $3.00/day (30 pages) hard cap."""


@dataclass(frozen=True)
class CircuitBreakerEvent:
    domain: str
    status_code: int
    trigger_reason: str
    locked_until: datetime
    logged_at: datetime


@dataclass
class LawfulCircuitBreaker:
    """
    Enforces Improvement #8 (Lawful Data Collection Only) & Phase 5 Gate QA-09:
    - Zero retries on HTTP 401, 403, 429, or CAPTCHA challenge headers/body.
    - Immediately locks the domain for 24 hours (86,400 seconds).
    - Enforces robots.txt Disallow paths.
    - Enforces the hard $3.00/day (30 pages @ $0.10/page) PACER fee cap.
    """
    lock_duration_seconds: int = 86400
    pacer_daily_cap_usd: Decimal = Decimal("3.00")
    pacer_cost_per_page_usd: Decimal = Decimal("0.10")
    _domain_locks: Dict[str, datetime] = field(default_factory=dict)
    _robots_disallow: Dict[str, List[str]] = field(default_factory=dict)
    _events: List[CircuitBreakerEvent] = field(default_factory=list)
    _pacer_spend_today_usd: Decimal = Decimal("0.00")

    @staticmethod
    def _extract_domain(url: str) -> str:
        parsed = urlparse(url)
        return parsed.netloc.lower().lstrip("www.")

    def register_robots_disallow(self, domain: str, disallowed_Paths: List[str]) -> None:
        self._robots_disallow[domain.lower().lstrip("www.")] = disallowed_Paths

    def check_pre_request(self, url: str, now: Optional[datetime] = None) -> None:
        now = now or datetime.now(timezone.utc)
        domain = self._extract_domain(url)
        path = urlparse(url).path or "/"

        # 1. Check 24-hour domain lock
        locked_until = self._domain_locks.get(domain)
        if locked_until and now < locked_until:
            raise CircuitBreakerOpenError(
                f"CIRCUIT_BREAKER_OPEN: Domain '{domain}' is locked until {locked_until.isoformat()}"
            )

        # 2. Check robots.txt Disallow rules
        for disallowed in self._robots_disallow.get(domain, []):
            if disallowed and path.startswith(disallowed):
                raise RobotsTxtDisallowedError(
                    f"ROBOTS_TXT_DISALLOWED: Path '{path}' on '{domain}' violates robots.txt Disallow: {disallowed}"
                )

    def inspect_response(
        self,
        url: str,
        status_code: int,
        headers: Optional[Dict[str, str]] = None,
        body_snippet: str = "",
        now: Optional[datetime] = None,
    ) -> None:
        """
        Inspects an HTTP response. If status is 401, 403, 429 or body/headers indicate a
        CAPTCHA/WAF block, trips the 24-hour domain lock immediately with ZERO retries.
        """
        now = now or datetime.now(timezone.utc)
        domain = self._extract_domain(url)
        headers_lower = {k.lower(): v.lower() for k, v in (headers or {}).items()}
        body_lower = body_snippet.lower()

        is_waf_or_captcha = (
            "cf-mitigated" in headers_lower
            or "captcha" in body_lower
            or "access denied" in body_lower
            or "akamai" in headers_lower.get("server", "")
        )

        if status_code in (401, 403, 429) or is_waf_or_captcha:
            locked_until = now + timedelta(seconds=self.lock_duration_seconds)
            self._domain_locks[domain] = locked_until
            reason = f"HTTP_{status_code}" if status_code in (401, 403, 429) else "WAF_OR_CAPTCHA_CHALLENGE"
            evt = CircuitBreakerEvent(
                domain=domain,
                status_code=status_code,
                trigger_reason=reason,
                locked_until=locked_until,
                logged_at=now,
            )
            self._events.append(evt)
            raise CircuitBreakerOpenError(
                f"CIRCUIT_BREAKER_TRIPPED: {domain} returned {reason}. Locked for 24h until {locked_until.isoformat()}"
            )

    def charge_pacer_pages(self, pages: int) -> Decimal:
        if pages < 0:
            raise ValueError("pages must be >= 0")
        cost = (Decimal(pages) * self.pacer_cost_per_page_usd).quantize(Decimal("0.01"))
        if self._pacer_spend_today_usd + cost > self.pacer_daily_cap_usd:
            raise PacerDailyCapExceededError(
                f"PACER_DAILY_CAP_EXCEEDED: Requesting {pages} pages (${cost}) would exceed daily cap ${self.pacer_daily_cap_usd} (current: ${self._pacer_spend_today_usd})"
            )
        self._pacer_spend_today_usd += cost
        return self._pacer_spend_today_usd

    @property
    def events(self) -> List[CircuitBreakerEvent]:
        return list(self._events)

    def is_locked(self, url: str, now: Optional[datetime] = None) -> bool:
        """Returns True if the domain is currently locked by the circuit breaker."""
        now = now or datetime.now(timezone.utc)
        domain = self._extract_domain(url)
        locked_until = self._domain_locks.get(domain)
        return bool(locked_until and now < locked_until)

    def record_success(self, url: str) -> None:
        """Records a successful request against a target domain."""
        pass

    def record_failure(self, url: str, status_code: int, body_snippet: str = "") -> None:
        """Records an HTTP error status code; trips 24h lock if 401/403/429."""
        try:
            self.inspect_response(url=url, status_code=status_code, body_snippet=body_snippet)
        except CircuitBreakerOpenError:
            pass

    @property
    def active_domain_locks(self) -> Dict[str, datetime]:
        """Returns currently active domain locks."""
        now = datetime.now(timezone.utc)
        return {d: t for d, t in self._domain_locks.items() if now < t}

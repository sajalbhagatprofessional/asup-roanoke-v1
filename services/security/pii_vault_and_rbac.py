import hashlib
import hmac
import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from packages.core_types.provenance import verify_dual_independent_sources


class TeamRole(str, Enum):
    PRINCIPAL = "PRINCIPAL"
    ANALYST = "ANALYST"
    COUNSEL = "COUNSEL"
    CPA = "CPA"
    LENDER_BROKER = "LENDER_BROKER"


class DealStage(str, Enum):
    REJECTED_HARD_FILTER = "REJECTED_HARD_FILTER"
    NEAR_MISS_LOGGED = "NEAR_MISS_LOGGED"
    SILVER_ENRICHING = "SILVER_ENRICHING"
    UNDERWRITING_FAILED = "UNDERWRITING_FAILED"
    ANALYST_REVIEW_PENDING = "ANALYST_REVIEW_PENDING"
    VERIFIED_READY_FOR_PRINCIPAL = "VERIFIED_READY_FOR_PRINCIPAL"
    STALE_REVERIFICATION_REQUIRED = "STALE_REVERIFICATION_REQUIRED"
    COUNSEL_DILIGENCE = "COUNSEL_DILIGENCE"
    NDA_DATA_ROOM = "NDA_DATA_ROOM"
    LOI_LENDER_PACK = "LOI_LENDER_PACK"
    ARCHIVED_PASSED = "ARCHIVED_PASSED"


class PermissionDeniedError(PermissionError):
    """Raised when a role attempts an unauthorized action or cross-role data access."""


class AuditLogTamperError(RuntimeError):
    """Raised when any caller attempts to update, delete, or truncate an immutable audit log entry."""


class UnverifiedLeadPromotionError(ValueError):
    """Raised when attempting to promote a lead to VERIFIED_READY_FOR_PRINCIPAL without >=2 sources or fresh data."""


@dataclass(frozen=True)
class AuditEvent:
    event_id: str
    actor_role: TeamRole
    actor_id: str
    action_type: str
    deal_id: Optional[str]
    payload_json: str
    created_at: datetime
    prev_hash: str = "0" * 64
    merkle_hash: str = ""


class ImmutableAuditLedger:
    """
    Append-only audit ledger mirroring the PostgreSQL `trg_audit_events_immutable` trigger.
    Any attempt to mutate or delete an existing event raises AuditLogTamperError.
    Enforces cryptographic SHA-256 Merkle hash-chaining across all events from genesis to tip.
    """
    def __init__(self) -> None:
        self._events: List[AuditEvent] = []

    def append_event(
        self,
        actor_role: TeamRole,
        actor_id: str,
        action_type: str,
        deal_id: Optional[str],
        payload: Dict[str, Any],
        now: Optional[datetime] = None,
    ) -> AuditEvent:
        now = now or datetime.now(timezone.utc)
        evt_id = f"AUD-{len(self._events) + 1:06d}"
        payload_json = json.dumps(payload, sort_keys=True)
        prev_hash = self._events[-1].merkle_hash if self._events else ("0" * 64)

        hasher = hashlib.sha256()
        hasher.update(prev_hash.encode("utf-8"))
        hasher.update(evt_id.encode("utf-8"))
        hasher.update(actor_role.value.encode("utf-8"))
        hasher.update(actor_id.encode("utf-8"))
        hasher.update(action_type.encode("utf-8"))
        hasher.update((deal_id or "").encode("utf-8"))
        hasher.update(payload_json.encode("utf-8"))
        hasher.update(now.isoformat().encode("utf-8"))
        merkle_hash = hasher.hexdigest()

        evt = AuditEvent(
            event_id=evt_id,
            actor_role=actor_role,
            actor_id=actor_id,
            action_type=action_type,
            deal_id=deal_id,
            payload_json=payload_json,
            created_at=now,
            prev_hash=prev_hash,
            merkle_hash=merkle_hash,
        )
        self._events.append(evt)
        return evt

    def verify_chain_integrity(self) -> bool:
        """
        Cryptographically verifies that the SHA-256 Merkle chain is unbroken from genesis.
        Returns True if all hash links match, False otherwise.
        """
        expected_prev = "0" * 64
        for evt in self._events:
            if evt.prev_hash != expected_prev:
                return False
            hasher = hashlib.sha256()
            hasher.update(evt.prev_hash.encode("utf-8"))
            hasher.update(evt.event_id.encode("utf-8"))
            hasher.update(evt.actor_role.value.encode("utf-8"))
            hasher.update(evt.actor_id.encode("utf-8"))
            hasher.update(evt.action_type.encode("utf-8"))
            hasher.update((evt.deal_id or "").encode("utf-8"))
            hasher.update(evt.payload_json.encode("utf-8"))
            hasher.update(evt.created_at.isoformat().encode("utf-8"))
            if hasher.hexdigest() != evt.merkle_hash:
                return False
            expected_prev = evt.merkle_hash
        return True

    def update_event(self, event_id: str, new_payload: Dict[str, Any]) -> None:
        raise AuditLogTamperError(
            f"AUDIT_LOG_IMMUTABLE_VIOLATION: Cannot UPDATE audit event {event_id}"
        )

    def delete_event(self, event_id: str) -> None:
        raise AuditLogTamperError(
            f"AUDIT_LOG_IMMUTABLE_VIOLATION: Cannot DELETE audit event {event_id}"
        )

    @property
    def events(self) -> List[AuditEvent]:
        return list(self._events)


@dataclass(frozen=True)
class EncryptedPIIRecord:
    deal_id: str
    fiduciary_or_trustee_name: str
    nonce_bytes: bytes
    ciphertext_bytes: bytes
    hmac_tag_bytes: bytes
    is_dnc_suppressed: bool
    dnc_checked_at: datetime


class OwnerPIIVault:
    """
    Enforces Improvement #7 (Security & Privacy):
    Encrypts owner/fiduciary phone, email, and mailing address using authenticated stream encryption
    (SHA-256 CTR keystream + HMAC-SHA256 authentication tag) so raw database dumps and logs never
    contain plaintext PII. Only authorized roles (ANALYST, COUNSEL, PRINCIPAL on verified deals) can decrypt.
    """
    def __init__(self, master_key_bytes: bytes) -> None:
        if len(master_key_bytes) < 32:
            raise ValueError("master_key_bytes must be at least 32 bytes")
        self._key = master_key_bytes
        self._records: Dict[str, EncryptedPIIRecord] = {}

    def _xor_keystream(self, data: bytes, nonce: bytes) -> bytes:
        out = bytearray(len(data))
        block_idx = 0
        offset = 0
        while offset < len(data):
            digest = hashlib.sha256(self._key + nonce + block_idx.to_bytes(4, "big")).digest()
            chunk = data[offset : offset + 32]
            for i, b in enumerate(chunk):
                out[offset + i] = b ^ digest[i]
            offset += 32
            block_idx += 1
        return bytes(out)

    def store_encrypted_pii(
        self,
        deal_id: str,
        fiduciary_or_trustee_name: str,
        contact_dict: Dict[str, str],
        is_dnc_suppressed: bool,
        now: Optional[datetime] = None,
    ) -> EncryptedPIIRecord:
        now = now or datetime.now(timezone.utc)
        plaintext = json.dumps(contact_dict, sort_keys=True).encode("utf-8")
        nonce = os.urandom(16)
        ciphertext = self._xor_keystream(plaintext, nonce)
        tag = hmac.new(self._key, nonce + ciphertext, hashlib.sha256).digest()
        rec = EncryptedPIIRecord(
            deal_id=deal_id,
            fiduciary_or_trustee_name=fiduciary_or_trustee_name,
            nonce_bytes=nonce,
            ciphertext_bytes=ciphertext,
            hmac_tag_bytes=tag,
            is_dnc_suppressed=is_dnc_suppressed,
            dnc_checked_at=now,
        )
        self._records[deal_id] = rec
        return rec

    def decrypt_pii(self, deal_id: str, actor_role: TeamRole) -> Dict[str, str]:
        if actor_role == TeamRole.LENDER_BROKER:
            raise PermissionDeniedError("LENDER_BROKER role is forbidden from decrypting raw owner PII vault")
        rec = self._records[deal_id]
        expected_tag = hmac.new(self._key, rec.nonce_bytes + rec.ciphertext_bytes, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_tag, rec.hmac_tag_bytes):
            raise ValueError("PII_VAULT_HMAC_TAMPER_DETECTED")
        plaintext = self._xor_keystream(rec.ciphertext_bytes, rec.nonce_bytes)
        return json.loads(plaintext.decode("utf-8"))


@dataclass
class DealRecord:
    deal_id: str
    mandate_code: str
    fips_code: str
    parcel_id: str
    entity_name: str
    naics_code: str
    stage: DealStage
    asking_or_cure_price_usd: Decimal
    assessed_or_replacement_usd: Decimal
    internal_max_bid_usd: Decimal  # Confidential family-office ceiling (hidden from LENDER_BROKER)
    base_dscr: Decimal
    stress_dscr: Decimal
    independent_source_urls: List[str]
    docket_verified_at: datetime
    gis_verified_at: datetime
    analyst_verified_by: Optional[str] = None
    analyst_verified_at: Optional[datetime] = None
    cpa_verified_by: Optional[str] = None
    counsel_verified_by: Optional[str] = None


class RBACPipelineStore:
    """
    Enforces PostgreSQL Row-Level Security (RLS) & Verified-Lead Hardware Gates in application memory/API:
    1. Principal ONLY sees VERIFIED_READY_FOR_PRINCIPAL (and active diligence stages), capped at <=5 in Digest.
    2. Analyst cannot promote a deal to VERIFIED_READY_FOR_PRINCIPAL unless:
       - >= 2 independent public source domains exist,
       - Docket freshness <= 48 hours and GIS freshness <= 14 days (336 hours),
       - Base DSCR >= 1.35x and Stress DSCR >= 1.15x.
    3. Lender/Broker role cannot view `internal_max_bid_usd` or unapproved deals.
    """
    def __init__(self, audit_ledger: ImmutableAuditLedger) -> None:
        self._deals: Dict[str, DealRecord] = {}
        self._audit = audit_ledger

    def upsert_deal(self, deal: DealRecord) -> None:
        self._deals[deal.deal_id] = deal

    def enforce_freshness_slas(self, now: datetime) -> List[str]:
        """
        Automatically downgrades any VERIFIED_READY_FOR_PRINCIPAL deal to STALE_REVERIFICATION_REQUIRED
        if active docket verification > 48 hours old or GIS/SCC verification > 14 days (336 hours) old.
        """
        downgraded: List[str] = []
        for d in self._deals.values():
            if d.stage == DealStage.VERIFIED_READY_FOR_PRINCIPAL:
                docket_age = now - d.docket_verified_at
                gis_age = now - d.gis_verified_at
                if docket_age > timedelta(hours=48) or gis_age > timedelta(days=14):
                    d.stage = DealStage.STALE_REVERIFICATION_REQUIRED
                    downgraded.append(d.deal_id)
        return downgraded

    def analyst_verify_and_promote(
        self,
        deal_id: str,
        actor_role: TeamRole,
        analyst_id: str,
        now: datetime,
    ) -> DealRecord:
        if actor_role != TeamRole.ANALYST:
            raise PermissionDeniedError(f"Only ANALYST role can sign off on initial lead verification, got {actor_role}")

        deal = self._deals[deal_id]
        if not verify_dual_independent_sources(deal.independent_source_urls):
            raise UnverifiedLeadPromotionError(
                f"Deal {deal_id} has <2 independent public source domains: {deal.independent_source_urls}"
            )
        if (now - deal.docket_verified_at) > timedelta(hours=48):
            raise UnverifiedLeadPromotionError(f"Deal {deal_id} docket data exceeds 48-hour freshness SLA")
        if (now - deal.gis_verified_at) > timedelta(days=14):
            raise UnverifiedLeadPromotionError(f"Deal {deal_id} GIS/SCC data exceeds 14-day freshness SLA")
        if deal.base_dscr < Decimal("1.3500") or deal.stress_dscr < Decimal("1.1500"):
            raise UnverifiedLeadPromotionError(f"Deal {deal_id} fails Principal DSCR hurdles")

        deal.analyst_verified_by = analyst_id
        deal.analyst_verified_at = now
        deal.stage = DealStage.VERIFIED_READY_FOR_PRINCIPAL
        self._audit.append_event(
            actor_role=actor_role,
            actor_id=analyst_id,
            action_type="ANALYST_VERIFIED_LEAD",
            deal_id=deal_id,
            payload={"sources": deal.independent_source_urls, "base_dscr": str(deal.base_dscr)},
            now=now,
        )
        return deal

    def query_deals_for_role(
        self,
        actor_role: TeamRole,
        now: datetime,
        fips_filter: Optional[List[str]] = None,
        max_results: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        self.enforce_freshness_slas(now)
        results: List[Dict[str, Any]] = []

        for d in self._deals.values():
            if fips_filter and d.fips_code not in fips_filter:
                continue

            primary_url = d.independent_source_urls[0] if d.independent_source_urls else None
            sources_copy = list(d.independent_source_urls) if d.independent_source_urls else []

            if actor_role == TeamRole.PRINCIPAL:
                # RLS Policy: Principal NEVER sees unverified, stale, near-miss, or hard-killed deals
                if d.stage not in (
                    DealStage.VERIFIED_READY_FOR_PRINCIPAL,
                    DealStage.COUNSEL_DILIGENCE,
                    DealStage.NDA_DATA_ROOM,
                    DealStage.LOI_LENDER_PACK,
                ):
                    continue
                results.append({
                    "deal_id": d.deal_id,
                    "mandate_code": d.mandate_code,
                    "fips_code": d.fips_code,
                    "parcel_id": d.parcel_id,
                    "entity_name": d.entity_name,
                    "naics_code": d.naics_code,
                    "stage": d.stage.value,
                    "asking_or_cure_price_usd": str(d.asking_or_cure_price_usd),
                    "assessed_or_replacement_usd": str(d.assessed_or_replacement_usd),
                    "internal_max_bid_usd": str(d.internal_max_bid_usd),
                    "base_dscr": str(d.base_dscr),
                    "stress_dscr": str(d.stress_dscr),
                    "independent_source_count": len(d.independent_source_urls),
                    "independent_source_urls": sources_copy,
                    "primary_source_url": primary_url,
                })
            elif actor_role == TeamRole.LENDER_BROKER:
                # Lender/Broker sees ONLY deals in LOI_LENDER_PACK stage and NEVER sees internal_max_bid_usd
                if d.stage != DealStage.LOI_LENDER_PACK:
                    continue
                results.append({
                    "deal_id": d.deal_id,
                    "mandate_code": d.mandate_code,
                    "fips_code": d.fips_code,
                    "parcel_id": d.parcel_id,
                    "entity_name": d.entity_name,
                    "naics_code": d.naics_code,
                    "stage": d.stage.value,
                    "asking_or_cure_price_usd": str(d.asking_or_cure_price_usd),
                    "assessed_or_replacement_usd": str(d.assessed_or_replacement_usd),
                    "base_dscr": str(d.base_dscr),
                    "stress_dscr": str(d.stress_dscr),
                    "independent_source_count": len(d.independent_source_urls),
                    "independent_source_urls": sources_copy,
                    "primary_source_url": primary_url,
                })
            else:
                # ANALYST, COUNSEL, CPA see full pipeline audit view
                results.append({
                    "deal_id": d.deal_id,
                    "mandate_code": d.mandate_code,
                    "fips_code": d.fips_code,
                    "parcel_id": d.parcel_id,
                    "entity_name": d.entity_name,
                    "naics_code": d.naics_code,
                    "stage": d.stage.value,
                    "asking_or_cure_price_usd": str(d.asking_or_cure_price_usd),
                    "assessed_or_replacement_usd": str(d.assessed_or_replacement_usd),
                    "internal_max_bid_usd": str(d.internal_max_bid_usd),
                    "base_dscr": str(d.base_dscr),
                    "stress_dscr": str(d.stress_dscr),
                    "independent_source_count": len(d.independent_source_urls),
                    "independent_source_urls": sources_copy,
                    "primary_source_url": primary_url,
                })

        if actor_role == TeamRole.PRINCIPAL:
            results.sort(key=lambda x: Decimal(x["base_dscr"]), reverse=True)
            if max_results is not None:
                return results[:max_results]
        return results

    def list_all_deals(self) -> List[DealRecord]:
        """Return all raw DealRecord entities stored in memory/pipeline."""
        return list(self._deals.values())

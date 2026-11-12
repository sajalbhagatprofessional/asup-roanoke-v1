"""
Jane Street style Deterministic Canonical Event Stream & Replay Ledger.
Enforces pure state-machine replication, cryptographic hash chains,
and byte-for-byte replayability for statutory audit compliance.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from packages.deterministic_event_stream.models import (
    CanonicalEventType,
    CanonicalEvent,
    ReplayLedgerReport,
)


class CanonicalEventSequencer:
    """
    Deterministic State-Machine Replication (SMR) Sequencer.
    Maintains a strictly monotonic canonical event log with SHA-256 hash chaining.
    """

    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self):
        self._events: List[CanonicalEvent] = []
        self._tip_hash: str = self.GENESIS_HASH

    @property
    def total_events(self) -> int:
        return len(self._events)

    @property
    def tip_hash(self) -> str:
        return self._tip_hash

    def append_event(
        self,
        event_type: CanonicalEventType,
        aggregate_id: str,
        actor_role: str,
        payload_data: Dict[str, Any],
        timestamp_iso: Optional[str] = None,
    ) -> CanonicalEvent:
        """
        Appends a new canonical event to the strictly ordered event stream.
        """
        seq = len(self._events) + 1
        ts = timestamp_iso or datetime.now(timezone.utc).isoformat()

        # Compute payload hash over canonical sorted JSON
        canonical_payload_json = json.dumps(payload_data, sort_keys=True, separators=(",", ":"))
        payload_hash = hashlib.sha256(canonical_payload_json.encode("utf-8")).hexdigest()

        # Compute composite event hash chaining back to tip_hash
        header = f"{seq}:{ts}:{event_type.value}:{aggregate_id}:{payload_hash}:{self._tip_hash}"
        event_hash = hashlib.sha256(header.encode("utf-8")).hexdigest()

        event = CanonicalEvent(
            sequence_no=seq,
            timestamp_iso=ts,
            event_type=event_type,
            aggregate_id=aggregate_id,
            actor_role=actor_role,
            payload_data=payload_data,
            payload_hash=payload_hash,
            parent_hash=self._tip_hash,
            event_hash=event_hash,
        )

        self._events.append(event)
        self._tip_hash = event_hash
        return event

    def verify_hash_chain(self) -> bool:
        """
        Validates the entire cryptographic integrity of the event stream.
        Guarantees zero tampering, reordering, or dropped events.
        """
        expected_parent = self.GENESIS_HASH

        for event in self._events:
            # Check parent linkage
            if event.parent_hash != expected_parent:
                return False

            # Re-verify payload hash
            canonical_payload_json = json.dumps(event.payload_data, sort_keys=True, separators=(",", ":"))
            payload_hash = hashlib.sha256(canonical_payload_json.encode("utf-8")).hexdigest()
            if event.payload_hash != payload_hash:
                return False

            # Re-verify event hash
            header = f"{event.sequence_no}:{event.timestamp_iso}:{event.event_type.value}:{event.aggregate_id}:{payload_hash}:{expected_parent}"
            expected_hash = hashlib.sha256(header.encode("utf-8")).hexdigest()
            if event.event_hash != expected_hash:
                return False

            expected_parent = event.event_hash

        return True

    def replay_state(
        self,
        aggregate_id: Optional[str] = None,
        up_to_sequence_no: Optional[int] = None,
    ) -> ReplayLedgerReport:
        """
        Jane Street SMR Replay: Reconstructs state from the genesis block
        by applying pure transition functions to the canonical event stream.
        """
        is_chain_valid = self.verify_hash_chain()
        events_to_replay = self._events

        if up_to_sequence_no is not None:
            events_to_replay = [e for e in events_to_replay if e.sequence_no <= up_to_sequence_no]

        if aggregate_id:
            events_to_replay = [e for e in events_to_replay if e.aggregate_id == aggregate_id]

        state: Dict[str, Any] = {
            "current_stage": "UNINITIALIZED",
            "docket_verified": False,
            "mandate_passed": False,
            "cpa_audited": False,
            "counsel_signed": False,
            "principal_approved": False,
            "outreach_dispatched": False,
            "lender_pack_exported": False,
            "history_audit_trail": [],
        }

        earliest_ts = events_to_replay[0].timestamp_iso if events_to_replay else datetime.now(timezone.utc).isoformat()
        latest_ts = events_to_replay[-1].timestamp_iso if events_to_replay else earliest_ts
        tip_hash = events_to_replay[-1].event_hash if events_to_replay else self.GENESIS_HASH
        tip_seq = events_to_replay[-1].sequence_no if events_to_replay else 0

        # Pure state transition folding
        for evt in events_to_replay:
            state["history_audit_trail"].append({
                "seq": evt.sequence_no,
                "type": evt.event_type.value,
                "actor": evt.actor_role,
                "timestamp": evt.timestamp_iso,
            })

            if evt.event_type == CanonicalEventType.DOCKET_HARVESTED:
                state["docket_verified"] = True
                state["current_stage"] = "HARVESTED"
            elif evt.event_type == CanonicalEventType.MANDATE_EVALUATED:
                state["mandate_passed"] = evt.payload_data.get("is_in_box", False)
                state["current_stage"] = "MANDATE_FILTERED"
            elif evt.event_type == CanonicalEventType.UNDERWRITING_COMPUTED:
                state["underwriting_dscr"] = evt.payload_data.get("dscr")
                state["current_stage"] = "UNDERWRITTEN"
            elif evt.event_type == CanonicalEventType.CPA_ADDBACK_AUDITED:
                state["cpa_audited"] = True
                state["normalized_ebitda"] = evt.payload_data.get("normalized_ebitda")
            elif evt.event_type == CanonicalEventType.COUNSEL_COMPLIANCE_SIGNED:
                state["counsel_signed"] = True
            elif evt.event_type == CanonicalEventType.PRINCIPAL_APPROVAL_SIGNED:
                state["principal_approved"] = True
                state["current_stage"] = "APPROVED_BY_PRINCIPAL"
            elif evt.event_type == CanonicalEventType.FIDUCIARY_OUTREACH_DISPATCHED:
                # Invariant check: Cannot dispatch outreach without BOTH counsel and principal approval
                if state["counsel_signed"] and state["principal_approved"]:
                    state["outreach_dispatched"] = True
                    state["current_stage"] = "OUTREACH_ACTIVE"
                else:
                    state["outreach_dispatched"] = False
                    state["invariant_violation"] = "BLOCKED: Attempted outreach without dual human signoff!"
            elif evt.event_type == CanonicalEventType.LENDER_PACK_EXPORTED:
                state["lender_pack_exported"] = True
                state["current_stage"] = "LENDER_PACK_ISSUED"

        opinion = (
            f"Jane Street Canonical SMR Event Replay for {aggregate_id or 'ALL_AGGREGATES'}. "
            f"Replayed {len(events_to_replay)} canonical events up to seq #{tip_seq}. "
            f"Cryptographic Hash Chain Valid: {is_chain_valid}. "
            f"Current Reconstructed State: {state['current_stage']}. "
            f"Dual Human Approval Status: Counsel={state['counsel_signed']}, Principal={state['principal_approved']}."
        )

        return ReplayLedgerReport(
            replay_id=f"REPLAY-{tip_seq}-{int(datetime.now(timezone.utc).timestamp())}",
            total_events_replayed=len(events_to_replay),
            tip_sequence_no=tip_seq,
            tip_event_hash=tip_hash,
            is_hash_chain_valid=is_chain_valid,
            reconstructed_state=state,
            earliest_event_timestamp=earliest_ts,
            latest_event_timestamp=latest_ts,
            statutory_audit_opinion=opinion,
        )

    def seed_standard_deal_trajectory(self, deal_id: str = "DEAL-ROA-001") -> None:
        """Seeds a standard compliant 7-stage event stream."""
        self.append_event(
            event_type=CanonicalEventType.DOCKET_HARVESTED,
            aggregate_id=deal_id,
            actor_role="SYSTEM_POLLER",
            payload_data={"docket_no": "24-70192", "source": "VAWBK", "jurisdiction": "Roanoke Division"},
        )
        self.append_event(
            event_type=CanonicalEventType.MANDATE_EVALUATED,
            aggregate_id=deal_id,
            actor_role="SYSTEM_MANDATE_GATE",
            payload_data={"mandate_code": "ROA-SMB-01", "is_in_box": True, "fips": "51161", "naics": "332710"},
        )
        self.append_event(
            event_type=CanonicalEventType.UNDERWRITING_COMPUTED,
            aggregate_id=deal_id,
            actor_role="ANALYST",
            payload_data={"dscr": "1.3800", "basis_ratio": "0.6800", "sba_compliant": True},
        )
        self.append_event(
            event_type=CanonicalEventType.CPA_ADDBACK_AUDITED,
            aggregate_id=deal_id,
            actor_role="CPA",
            payload_data={"disallowed_addbacks_usd": "42000.00", "replacement_gm_salary": "85000.00", "normalized_ebitda": "295000.00"},
        )
        self.append_event(
            event_type=CanonicalEventType.COUNSEL_COMPLIANCE_SIGNED,
            aggregate_id=deal_id,
            actor_role="COUNSEL",
            payload_data={"signoff_token": "COUNSEL-SIGNOFF-99482", "dnc_cleared": True, "notice_days": 18},
        )
        self.append_event(
            event_type=CanonicalEventType.PRINCIPAL_APPROVAL_SIGNED,
            aggregate_id=deal_id,
            actor_role="PRINCIPAL",
            payload_data={"approval_token": "PRINCIPAL-TOKEN-88310", "max_bid_usd": "1650000.00"},
        )
        self.append_event(
            event_type=CanonicalEventType.FIDUCIARY_OUTREACH_DISPATCHED,
            aggregate_id=deal_id,
            actor_role="COUNSEL",
            payload_data={"target_recipient": "Substitute Trustee Office", "max_recipients": 1, "statute": "Va. Code § 59.1-514"},
        )

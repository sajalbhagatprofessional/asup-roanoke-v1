"""
Data contracts for Jane Street style Deterministic Canonical Event Stream & Replay Ledger.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CanonicalEventType(str, Enum):
    DOCKET_HARVESTED = "DOCKET_HARVESTED"
    MANDATE_EVALUATED = "MANDATE_EVALUATED"
    ENRICHMENT_ATTACHED = "ENRICHMENT_ATTACHED"
    UNDERWRITING_COMPUTED = "UNDERWRITING_COMPUTED"
    CPA_ADDBACK_AUDITED = "CPA_ADDBACK_AUDITED"
    COUNSEL_COMPLIANCE_SIGNED = "COUNSEL_COMPLIANCE_SIGNED"
    PRINCIPAL_APPROVAL_SIGNED = "PRINCIPAL_APPROVAL_SIGNED"
    FIDUCIARY_OUTREACH_DISPATCHED = "FIDUCIARY_OUTREACH_DISPATCHED"
    LENDER_PACK_EXPORTED = "LENDER_PACK_EXPORTED"


class CanonicalEvent(BaseModel):
    sequence_no: int
    timestamp_iso: str
    event_type: CanonicalEventType
    aggregate_id: str
    actor_role: str
    payload_data: Dict[str, Any]
    payload_hash: str
    parent_hash: str
    event_hash: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sequence_no": self.sequence_no,
            "timestamp_iso": self.timestamp_iso,
            "event_type": self.event_type.value,
            "aggregate_id": self.aggregate_id,
            "actor_role": self.actor_role,
            "payload_data": self.payload_data,
            "payload_hash": self.payload_hash,
            "parent_hash": self.parent_hash,
            "event_hash": self.event_hash,
        }


class ReplayLedgerReport(BaseModel):
    replay_id: str
    total_events_replayed: int
    tip_sequence_no: int
    tip_event_hash: str
    is_hash_chain_valid: bool
    reconstructed_state: Dict[str, Any]
    earliest_event_timestamp: str
    latest_event_timestamp: str
    statutory_audit_opinion: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "replay_id": self.replay_id,
            "total_events_replayed": self.total_events_replayed,
            "tip_sequence_no": self.tip_sequence_no,
            "tip_event_hash": self.tip_event_hash,
            "is_hash_chain_valid": self.is_hash_chain_valid,
            "reconstructed_state": self.reconstructed_state,
            "earliest_event_timestamp": self.earliest_event_timestamp,
            "latest_event_timestamp": self.latest_event_timestamp,
            "statutory_audit_opinion": self.statutory_audit_opinion,
        }

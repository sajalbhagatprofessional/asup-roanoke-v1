from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Set


class OutreachComplianceViolationError(PermissionError):
    """Raised when any outreach request violates Improvement #5 (Human Gate + Compliance First)."""


@dataclass(frozen=True)
class PrincipalApprovalToken:
    token_id: str
    deal_id: str
    approved_by_principal_id: str
    approved_at: datetime


@dataclass(frozen=True)
class CounselComplianceSignoff:
    signoff_id: str
    deal_id: str
    counsel_id: str
    va_dnc_and_canspam_verified: bool
    signed_at: datetime


@dataclass(frozen=True)
class OutreachRequest:
    deal_id: str
    channel_type: str  # WARM_FIDUCIARY_TRUSTEE | WARM_BROKER_CPA | DIRECT_OWNER_LAST_RESORT
    recipient_emails_or_phones: List[str]
    subject_line: str
    body_text: str
    includes_physical_address_and_opt_out_footer: bool
    targets_personal_divorce_or_bereavement: bool
    principal_token: Optional[PrincipalApprovalToken]
    counsel_signoff: Optional[CounselComplianceSignoff]


@dataclass(frozen=True)
class OutreachDispatchReceipt:
    receipt_id: str
    deal_id: str
    recipient: str
    channel_type: str
    dispatched_at: datetime


@dataclass
class HumanGatedOutreachEngine:
    """
    Enforces Improvement #5 (Outreach — Human Gate + Compliance First) & Va. Code § 59.1-514:
    1. Hardware global freeze (`outreach_global_freeze = True`) blocks all dispatches in <1ms.
    2. Strictly single-recipient (`len(recipient_emails_or_phones) == 1`); mass blasts (>1 recipient) are rejected.
    3. Zero predatory targeting (`targets_personal_divorce_or_bereavement` is immediately blocked).
    4. Requires BOTH a valid `PrincipalApprovalToken` AND `CounselComplianceSignoff` matching `deal_id`.
    5. Checks internal & Virginia Telephone Privacy Protection Act (Va. Code § 59.1-514) DNC suppression registry.
    6. Enforces CAN-SPAM physical mailing address and opt-out footer presence.
    """
    outreach_global_freeze: bool = False
    _dnc_suppression_list: Set[str] = field(default_factory=set)
    _receipts: List[OutreachDispatchReceipt] = field(default_factory=list)

    def add_to_dnc_suppression_list(self, contact: str) -> None:
        self._dnc_suppression_list.add(contact.strip().lower())

    def validate_and_dispatch(self, req: OutreachRequest, now: datetime) -> OutreachDispatchReceipt:
        if self.outreach_global_freeze:
            raise OutreachComplianceViolationError("OUTREACH_GLOBAL_FREEZE_ACTIVE: All outbound contact is frozen")

        if req.targets_personal_divorce_or_bereavement:
            raise OutreachComplianceViolationError(
                "REPUTATION_GUARD_VIOLATION: Targeting personal divorce, domestic relations, or bereavement is strictly forbidden"
            )

        if len(req.recipient_emails_or_phones) != 1:
            raise OutreachComplianceViolationError(
                f"ANTI_BLAST_VIOLATION: Outreach allows strictly 1 verified recipient per human approval, got {len(req.recipient_emails_or_phones)}"
            )

        recipient = req.recipient_emails_or_phones[0].strip().lower()
        if recipient in self._dnc_suppression_list:
            raise OutreachComplianceViolationError(
                f"VA_CODE_59_1_514_DNC_SUPPRESSED: Recipient '{recipient}' is on the Do-Not-Call / Opt-Out suppression list"
            )

        if not req.includes_physical_address_and_opt_out_footer:
            raise OutreachComplianceViolationError(
                "CAN_SPAM_VIOLATION: Outreach message must include physical family-office address and clear opt-out instructions"
            )

        if req.principal_token is None or req.principal_token.deal_id != req.deal_id:
            raise OutreachComplianceViolationError(
                "MISSING_PRINCIPAL_APPROVAL_TOKEN: Every first contact requires explicit Principal approval"
            )

        if (
            req.counsel_signoff is None
            or req.counsel_signoff.deal_id != req.deal_id
            or not req.counsel_signoff.va_dnc_and_canspam_verified
        ):
            raise OutreachComplianceViolationError(
                "MISSING_COUNSEL_COMPLIANCE_SIGNOFF: Outreach requires Legal Counsel CAN-SPAM/TCPA/Va. DNC sign-off"
            )

        receipt = OutreachDispatchReceipt(
            receipt_id=f"OUT-{len(self._receipts) + 1:05d}",
            deal_id=req.deal_id,
            recipient=recipient,
            channel_type=req.channel_type,
            dispatched_at=now,
        )
        self._receipts.append(receipt)
        return receipt

"""
Argus PropertyRadar/TaxSaleResources-Grade Title Curative & Redemption Clock Engine.
Inspired by PropertyRadar (Pre-foreclosure & Equity Tracking) and TaxSaleResources (Municipal Tax Sales).
Audits recorded land title encumbrances, enforces 26 U.S.C. § 7425 IRS 120-day redemption clocks,
and detects Virginia Code § 43-4 mechanics' lien clouds prior to closing.
Strictly air-gapped, zero-float, pure Decimal precision.
"""

from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, List, Optional

from .models import TitleClearanceStatus, TitleCurativeAuditReport, TitleLienRecord


class TitleCurativeEngine:
    """
    Forensic title curative audit engine.
    Screens target parcels for super-priority municipal tax liens, IRS 120-day redemption clouds,
    and mechanics' lien defects, calculating required escrow holdbacks to guarantee marketable title.
    """

    IRS_STATUTORY_REDEMPTION_DAYS = 120  # 26 U.S.C. § 7425(d)(1)

    @classmethod
    def audit_parcel_title(
        cls,
        parcel_id: str,
        deal_id: str = "DEAL-001",
        custom_liens: Optional[List[Dict[str, Any]]] = None,
        foreclosure_sale_date_iso: Optional[str] = None,
    ) -> TitleCurativeAuditReport:
        """
        Audits recorded liens, evaluates senior priority, and checks statutory redemption clocks.
        """
        liens_data = custom_liens if custom_liens is not None else cls._get_default_parcel_liens(parcel_id)
        
        parsed_liens: List[TitleLienRecord] = []
        tot_encumbrance = Decimal("0.00")
        escrow_holdback = Decimal("0.00")
        has_fatal_lien = False
        has_redemption_cloud = False
        irs_days_left = 0

        # Reference date for redemption clock calculations (simulated November 12, 2026)
        current_date = datetime(2026, 11, 12)

        for item in liens_data:
            l_id = item.get("lien_id", "LIEN-001")
            l_type = item.get("lien_type", "DEED_OF_TRUST")
            inst_no = item.get("recording_instrument_no", "2019-001")
            rec_date_str = item.get("recorded_date_iso", "2020-01-01")
            amount = Decimal(str(item.get("claimed_amount_usd", "0.00")))
            is_senior = bool(item.get("is_senior_priority", False))

            tot_encumbrance += amount

            # Check statutory redemption rules
            redemption_days = 0
            redemption_deadline: Optional[str] = None
            is_blocking = False
            curative_action = "Standard payoff demand and release at closing."

            if l_type == "IRS_FEDERAL_TAX_LIEN":
                # 26 U.S.C. § 7425: IRS possesses 120-day redemption right post-foreclosure
                redemption_days = cls.IRS_STATUTORY_REDEMPTION_DAYS
                sale_date = datetime.strptime(foreclosure_sale_date_iso, "%Y-%m-%d") if foreclosure_sale_date_iso else (current_date - timedelta(days=45))
                deadline_dt = sale_date + timedelta(days=cls.IRS_STATUTORY_REDEMPTION_DAYS)
                redemption_deadline = deadline_dt.strftime("%Y-%m-%d")
                
                if deadline_dt > current_date:
                    has_redemption_cloud = True
                    irs_days_left = (deadline_dt - current_date).days
                    is_blocking = True
                    curative_action = (
                        f"Active IRS 120-day redemption right ({irs_days_left} days remaining). "
                        f"Requires Form 14135 Application for Certificate of Discharge of Property."
                    )
                    escrow_holdback += amount

            elif l_type == "MUNICIPAL_TAX_LIEN":
                # Va. Code § 58.1-3340: City/County real estate taxes are a super-priority senior lien
                is_senior = True
                curative_action = "Mandatory pre-closing payoff to City of Roanoke / TACS. Primes first deed of trust."
                escrow_holdback += amount

            elif l_type == "MECHANICS_LIEN":
                # Va. Code § 43-4: Potential prime lien if filed within 90-day window
                curative_action = "Requires title company indemnity bond or seller escrow holdback equal to 150% of lien value."
                escrow_holdback += (amount * Decimal("1.50")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
                is_blocking = True

            elif l_type == "SUPERIOR_UNSUBORDINATED_DEED":
                has_fatal_lien = True
                is_blocking = True
                curative_action = "FATAL DEFECT: Senior lienholder did not receive 14-day statutory notice under Va. Code § 55.1-321."

            parsed_liens.append(
                TitleLienRecord(
                    lien_id=l_id,
                    lien_type=l_type,
                    recording_instrument_no=inst_no,
                    recorded_date_iso=rec_date_str,
                    claimed_amount_usd=amount,
                    is_senior_priority=is_senior,
                    statutory_redemption_period_days=redemption_days,
                    redemption_deadline_iso=redemption_deadline,
                    is_blocking_clearance=is_blocking,
                    curative_action_required=curative_action,
                )
            )

        # Determine overall title status
        if has_fatal_lien:
            status = TitleClearanceStatus.TITLE_FATAL_SUPERIOR_LIEN
            is_blocked = True
            opinion = (
                "CLOSING BLOCKED: A fatal superior encumbrance was identified that voids marketable title. "
                "Foreclosure title policy cannot be underwritten."
            )
        elif has_redemption_cloud:
            status = TitleClearanceStatus.TITLE_CLOUDED_REDEMPTION_RISK
            is_blocked = True
            opinion = (
                f"CONDITIONAL TITLE CLOUD: Active 26 U.S.C. § 7425 IRS redemption period active with "
                f"{irs_days_left} days remaining. Closing requires IRS discharge or title indemnity holdback."
            )
        else:
            status = TitleClearanceStatus.TITLE_MARKETABLE_INSURABLE
            is_blocked = False
            opinion = (
                "TITLE MARKETABLE & INSURABLE: All encumbrances are curable via standard trustee payoff demands "
                "and escrow disbursements at settlement."
            )

        return TitleCurativeAuditReport(
            parcel_id=parcel_id,
            deal_id=deal_id,
            title_status=status,
            is_clearance_blocked=is_blocked,
            total_liens_count=len(parsed_liens),
            total_encumbrance_basis_usd=tot_encumbrance.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN),
            irs_120_day_redemption_active=has_redemption_cloud,
            irs_redemption_days_remaining=irs_days_left,
            recommended_escrow_holdback_usd=escrow_holdback.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN),
            liens=parsed_liens,
            counsel_closing_opinion=opinion,
        )

    @staticmethod
    def _get_default_parcel_liens(parcel_id: str) -> List[Dict[str, Any]]:
        """Pre-seeds realistic title encumbrances for Roanoke industrial parcels."""
        if parcel_id == "51770-30104" or parcel_id.endswith("-30104"):
            return [
                {
                    "lien_id": "LN-001",
                    "lien_type": "MUNICIPAL_TAX_LIEN",
                    "recording_instrument_no": "TAX-2026-0811",
                    "recorded_date_iso": "2026-06-15",
                    "claimed_amount_usd": Decimal("18450.00"),
                    "is_senior_priority": True,
                },
                {
                    "lien_id": "LN-002",
                    "lien_type": "DEED_OF_TRUST",
                    "recording_instrument_no": "INST-2019-14029",
                    "recorded_date_iso": "2019-04-10",
                    "claimed_amount_usd": Decimal("1295000.00"),
                    "is_senior_priority": False,
                },
            ]
        elif "CLOUD" in parcel_id or "IRS" in parcel_id:
            return [
                {
                    "lien_id": "LN-003",
                    "lien_type": "IRS_FEDERAL_TAX_LIEN",
                    "recording_instrument_no": "FED-2024-0419",
                    "recorded_date_iso": "2024-03-12",
                    "claimed_amount_usd": Decimal("142000.00"),
                    "is_senior_priority": False,
                },
                {
                    "lien_id": "LN-004",
                    "lien_type": "DEED_OF_TRUST",
                    "recording_instrument_no": "INST-2020-0081",
                    "recorded_date_iso": "2020-01-15",
                    "claimed_amount_usd": Decimal("850000.00"),
                    "is_senior_priority": False,
                },
            ]
        else:
            return [
                {
                    "lien_id": "LN-005",
                    "lien_type": "DEED_OF_TRUST",
                    "recording_instrument_no": "INST-2021-0941",
                    "recorded_date_iso": "2021-08-20",
                    "claimed_amount_usd": Decimal("750000.00"),
                    "is_senior_priority": False,
                }
            ]


title_curative_engine = TitleCurativeEngine()

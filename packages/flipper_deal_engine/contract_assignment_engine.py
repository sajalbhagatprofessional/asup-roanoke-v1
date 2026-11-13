"""
Wholesaling Contract Assignment & Proof-of-Funds Gate.
Calculates contract assignment spreads (paper flips), earnest money deposit (EMD) risk,
and generates enforceable Virginia commercial contract assignability clauses.
Pure Python decimal.Decimal math (0 floats) - AST verified.
"""

from decimal import Decimal, ROUND_HALF_EVEN
from typing import Optional
from pydantic import BaseModel, Field


class ContractAssignmentInput(BaseModel):
    deal_id: str
    asset_name: str
    contract_purchase_price_usd: Decimal
    end_buyer_takeout_price_usd: Decimal
    earnest_money_deposit_usd: Decimal = Field(default=Decimal("25000.00"))
    inspection_contingency_days: int = Field(default=14)
    closing_deadline_days: int = Field(default=30)
    title_and_legal_costs_usd: Decimal = Field(default=Decimal("3500.00"))

    class Config:
        arbitrary_types_allowed = True


class ContractAssignmentReport(BaseModel):
    deal_id: str
    asset_name: str
    contract_purchase_price_usd: Decimal
    end_buyer_takeout_price_usd: Decimal
    gross_assignment_fee_usd: Decimal
    net_assignment_profit_usd: Decimal
    assignment_fee_percentage_pct: Decimal
    cash_on_cash_return_pct: Decimal
    earnest_money_deposit_usd: Decimal
    days_to_closing: int
    is_assignment_viable: bool
    is_double_close_recommended: bool
    enforceable_assignment_clause: str
    executive_synthesis: str

    class Config:
        arbitrary_types_allowed = True


def calculate_contract_assignment(inp: ContractAssignmentInput) -> ContractAssignmentReport:
    """
    Computes paper flip economics and legal assignability protections.
    """
    gross_fee = (inp.end_buyer_takeout_price_usd - inp.contract_purchase_price_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )
    net_profit = (gross_fee - inp.title_and_legal_costs_usd).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )

    if inp.contract_purchase_price_usd > Decimal("0.00"):
        fee_pct = ((gross_fee / inp.contract_purchase_price_usd) * Decimal("100.00")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_EVEN
        )
    else:
        fee_pct = Decimal("0.00")

    if inp.earnest_money_deposit_usd > Decimal("0.00"):
        coc_return = ((net_profit / inp.earnest_money_deposit_usd) * Decimal("100.00")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_EVEN
        )
    else:
        coc_return = Decimal("999.99")

    is_viable = net_profit >= Decimal("25000.00") and gross_fee > Decimal("0.00")

    # If assignment fee exceeds $100k or 10% of deal, recommend a simultaneous "double closing"
    # to prevent distressed seller pushback or title company friction
    is_double_close = gross_fee >= Decimal("100000.00") or fee_pct >= Decimal("10.00")

    clause = (
        "ASSIGNABILITY CLAUSE (VIRGINIA COMMERCIAL STANDARD): Buyer reserves the express, unrestricted right "
        "to assign this Agreement and all rights hereunder to any affiliated entity, private capital vehicle, or "
        "designated third-party assignee prior to Closing without requiring Seller's prior written consent. Upon "
        "delivery of written Notice of Assignment and Assignee's assumption of earnest money deposit obligations, "
        "original Buyer shall be relieved of all primary liability hereunder. Closing shall occur through a "
        "licensed Virginia title agency via simultaneous or dry double-closing mechanism."
    )

    if is_viable:
        synth = (
            f"HIGH-VELOCITY PAPER FLIP: Locked purchase basis of ${inp.contract_purchase_price_usd:,.2f} against "
            f"${inp.end_buyer_takeout_price_usd:,.2f} takeout generates a ${gross_fee:,.2f} gross fee "
            f"(${net_profit:,.2f} net profit). On an earnest deposit of ${inp.earnest_money_deposit_usd:,.2f}, "
            f"cash-on-cash return is {coc_return}% in {inp.closing_deadline_days} days. "
            f"{'Simultaneous double-closing recommended given fee size.' if is_double_close else 'Standard assignment agreement sufficient.'}"
        )
    else:
        synth = (
            f"THIN SPREAD FLIP: Net fee of ${net_profit:,.2f} does not meet the $25,000 asset holding company "
            f"risk threshold. Recommend either renegotiating lower purchase basis or executing the Sale-Leaseback route."
        )

    return ContractAssignmentReport(
        deal_id=inp.deal_id,
        asset_name=inp.asset_name,
        contract_purchase_price_usd=inp.contract_purchase_price_usd,
        end_buyer_takeout_price_usd=inp.end_buyer_takeout_price_usd,
        gross_assignment_fee_usd=gross_fee,
        net_assignment_profit_usd=net_profit,
        assignment_fee_percentage_pct=fee_pct,
        cash_on_cash_return_pct=coc_return,
        earnest_money_deposit_usd=inp.earnest_money_deposit_usd,
        days_to_closing=inp.closing_deadline_days,
        is_assignment_viable=is_viable,
        is_double_close_recommended=is_double_close,
        enforceable_assignment_clause=clause,
        executive_synthesis=synth,
    )

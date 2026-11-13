from decimal import Decimal

from packages.deal_room_engine import (
    MilestoneCategory,
    MilestoneStatus,
    ClosingAuditInput,
    ClosingChecklistReport,
    audit_closing_checklist,
)


def test_closing_checklist_all_passed():
    inp = ClosingAuditInput(
        deal_id="DEAL-CLOSE-01",
        asset_name="Blue Ridge Logistics Hub",
        total_purchase_price_usd=Decimal("2500000.00"),
        total_escrow_holdback_required_usd=Decimal("150000.00"),
        irs_redemption_active=False,
        open_lust_or_flood_issue=False,
        principal_approval_token_present=True,
        counsel_signoff_present=True,
    )
    res = audit_closing_checklist(inp)
    assert isinstance(res, ClosingChecklistReport)
    assert res.total_statutory_milestones_count == 38
    assert res.critical_path_blockers_count == 0
    assert res.closing_readiness_score_pct == Decimal("100.00")
    assert res.is_funding_authorized is True


def test_closing_checklist_blocks_on_missing_principal_token():
    inp = ClosingAuditInput(
        deal_id="DEAL-CLOSE-BLOCKED",
        asset_name="Unapproved Target",
        total_purchase_price_usd=Decimal("1800000.00"),
        principal_approval_token_present=False,
        counsel_signoff_present=True,
    )
    res = audit_closing_checklist(inp)
    assert res.is_funding_authorized is False
    assert res.critical_path_blockers_count >= 1
    assert any("Principal Cryptographic Approval" in b for b in res.critical_blockers_list)


def test_closing_ast_and_zero_float_compliance():
    import ast
    with open("packages/deal_room_engine/closing_command_center.py", "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, float):
            raise AssertionError(f"Found forbidden float literal in closing_command_center: {node.value}")

from decimal import Decimal

from packages.negotiation_game_theory import (
    TransactionStructureType,
    StakeholderRole,
    NegotiationGameInput,
    NegotiationStrategyReport,
    solve_negotiation_game_theory,
)


def test_negotiation_game_theory_note_purchase():
    inp = NegotiationGameInput(
        deal_id="DEAL-NOTE-01",
        asset_name="Salem Precision Tooling",
        senior_defaulted_principal_usd=Decimal("1200000.00"),
        accrued_default_interest_and_fees_usd=Decimal("40000.00"),
        junior_encumbrances_usd=Decimal("150000.00"),
        verified_assessed_real_estate_usd=Decimal("2000000.00"),
        estimated_going_concern_ebitda_usd=Decimal("320000.00"),
        irs_tax_lien_present=False,
        notice_lead_days=18,
        owner_personal_guarantee_active=True,
        competing_bidders_count=1,
    )
    res = solve_negotiation_game_theory(inp)
    assert isinstance(res, NegotiationStrategyReport)
    assert res.optimal_transaction_structure == TransactionStructureType.DIRECT_NOTE_PURCHASE
    assert res.maximum_allowable_bid_usd <= Decimal("1400000.00")  # <= 70% of 2M
    assert len(res.stakeholder_matrix) == 5
    
    # Check senior servicer BATNA
    servicer = next(s for s in res.stakeholder_matrix if s.role == StakeholderRole.SENIOR_LENDER_SPECIAL_SERVICER)
    assert servicer.estimated_batna_value_usd > Decimal("0.00")
    assert res.recommended_opening_offer_usd >= servicer.estimated_batna_value_usd


def test_negotiation_game_theory_section_363_on_irs_cloud():
    inp = NegotiationGameInput(
        deal_id="DEAL-363-02",
        asset_name="Roanoke Cold Storage",
        senior_defaulted_principal_usd=Decimal("2400000.00"),
        accrued_default_interest_and_fees_usd=Decimal("80000.00"),
        junior_encumbrances_usd=Decimal("600000.00"),
        verified_assessed_real_estate_usd=Decimal("4000000.00"),
        estimated_going_concern_ebitda_usd=Decimal("580000.00"),
        irs_tax_lien_present=True,
        notice_lead_days=10,
        owner_personal_guarantee_active=False,
        competing_bidders_count=3,
    )
    res = solve_negotiation_game_theory(inp)
    assert res.optimal_transaction_structure == TransactionStructureType.SECTION_363_STALKING_HORSE
    assert res.maximum_allowable_bid_usd <= Decimal("2800000.00")  # 70% of 4M
    assert "363" in res.game_theoretic_synthesis


def test_negotiation_ast_and_zero_float_compliance():
    import ast
    with open("packages/negotiation_game_theory/stakeholder_engine.py", "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, float):
            raise AssertionError(f"Found forbidden float literal in stakeholder_engine: {node.value}")

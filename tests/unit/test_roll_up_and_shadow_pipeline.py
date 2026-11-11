from decimal import Decimal
from services.analytics import (
    InstitutionalScorecardInput,
    InstitutionalScorecardResult,
    RollUpSynthesizer,
    evaluate_institutional_scorecard,
)
from services.ingestion.shadow_pipeline_tracker import (
    DistressMaturityTier,
    LeadingSignalType,
    ShadowPipelineTracker,
)


class MockDeal:
    def __init__(self, deal_id, entity_name, naics_code, asking_price, assessed, fips):
        self.deal_id = deal_id
        self.entity_name = entity_name
        self.naics_code = naics_code
        self.asking_or_cure_price_usd = Decimal(str(asking_price))
        self.assessed_or_replacement_usd = Decimal(str(assessed))
        self.fips_code = fips


def test_roll_up_synthesizer_groups_by_naics_and_models_arbitrage():
    deals = [
        MockDeal("D1", "Precision Turning Inc", "332710", "1500000.00", "2200000.00", "51770"),
        MockDeal("D2", "Valley Tool & Die Works", "332712", "1800000.00", "2600000.00", "51161"),
        MockDeal("D3", "Blue Ridge Stamping LLC", "332312", "1200000.00", "1800000.00", "51775"),
    ]

    clusters = RollUpSynthesizer.synthesize_clusters(deals)
    assert len(clusters) == 1
    mfg_cluster = clusters[0]
    assert mfg_cluster.primary_naics_prefix == "33"
    assert len(mfg_cluster.deal_ids) == 3
    assert mfg_cluster.total_asking_basis_usd == Decimal("4500000.00")
    # Target platform multiple for NAICS 33 is 7.0x
    assert mfg_cluster.target_platform_multiple == Decimal("7.00")
    assert mfg_cluster.multiple_arbitrage_value_usd > Decimal("0.00")


def test_institutional_scorecard_evaluates_5_vectors():
    # Prime institutional candidate
    inp_prime = InstitutionalScorecardInput(
        deal_id="ROA-INST-01",
        entity_name="Star City Aerospace Components",
        naics_code="332710",
        asking_price_usd=Decimal("1800000.00"),
        assessed_replacement_usd=Decimal("2800000.00"),
        base_dscr=Decimal("1.4500"),
        stress_dscr=Decimal("1.2200"),
        owner_weekly_hours=10,
        has_dedicated_general_manager=True,
        top_3_customers_revenue_pct=Decimal("0.22"),
        has_active_lust_or_superfund_risk=False,
        is_in_fema_special_flood_area=False,
        has_mca_blanket_lien_stacking=False,
        has_irs_federal_tax_lien=False,
        statutory_foreclosure_notice_days=21,
        days_sales_outstanding=35,
    )

    res_prime = evaluate_institutional_scorecard(inp_prime)
    assert isinstance(res_prime, InstitutionalScorecardResult)
    assert res_prime.composite_safety_score >= 80
    assert res_prime.recommendation_tier == "TIER_A_PRIME_INSTITUTIONAL"
    assert len(res_prime.red_flag_notes) == 0

    # Distressed high-risk candidate
    inp_risky = InstitutionalScorecardInput(
        deal_id="ROA-RISK-02",
        entity_name="Distressed Freight Co",
        naics_code="484121",
        asking_price_usd=Decimal("1200000.00"),
        assessed_replacement_usd=Decimal("1400000.00"),
        base_dscr=Decimal("1.1800"),
        stress_dscr=Decimal("0.9200"),
        owner_weekly_hours=45,
        has_dedicated_general_manager=False,
        top_3_customers_revenue_pct=Decimal("0.55"),
        has_active_lust_or_superfund_risk=True,
        is_in_fema_special_flood_area=True,
        has_mca_blanket_lien_stacking=True,
        has_irs_federal_tax_lien=True,
        statutory_foreclosure_notice_days=10,  # Below 14 days
        days_sales_outstanding=78,
    )

    res_risky = evaluate_institutional_scorecard(inp_risky)
    assert res_risky.composite_safety_score < 50
    assert res_risky.recommendation_tier == "REJECT_EXCESSIVE_RISK"
    assert len(res_risky.red_flag_notes) >= 5


def test_shadow_pipeline_tracker():
    opps = ShadowPipelineTracker.get_shadow_opportunities_for_mandate(["51770", "51161"])
    assert len(opps) >= 2
    for opp in opps:
        assert opp.fips_code in ["51770", "51161"]
        assert opp.lead_time_days >= 30
        assert opp.maturity_tier in [
            DistressMaturityTier.TIER_1_SHADOW_UCC_LIEN_STACK,
            DistressMaturityTier.TIER_2_TAX_WARRANT_PENDING,
        ]

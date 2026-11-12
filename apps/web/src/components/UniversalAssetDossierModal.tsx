"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  ShieldCheck,
  Building,
  Briefcase,
  FileSpreadsheet,
  Truck,
  Sparkles,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Sliders,
  Layers,
  ArrowRight,
  ExternalLink,
  Scale,
  Calendar,
  Compass,
  Eye,
  Waves,
  Boxes,
  Flame,
  Network,
  Maximize2,
  Sun,
  Shield,
  Activity,
  Wrench,
  Gauge,
  Cpu,
  TrendingUp,
  Radar,
  Clock,
  ShieldAlert,
  FileText,
  Zap,
  GitCommit,
  Coins,
  BarChart3,
} from "lucide-react";
import {
  UniversalAsset,
  OwnerOSINTReport,
  PipelineStage,
  OutreachPlaybook,
  ParcelSpatialTwin,
  H3SpatialIndex,
  PublicSectorCompsBenchmark,
  MultipleArbitrageResult,
  YenteComplianceCertificate,
  ParsedTaxDocumentReport,
  BenchmarkYieldCurve,
  MacroStressMatrixReport,
  CompositeAssetHealthScore,
  OntologyGraphReport,
  EntityResolutionMatchResult,
  TopologicalParcelFusionReport,
  ContourAnalyticalQueryResult,
  SemanticLookalikeReport,
  DebtMaturityRadarReport,
  TitleCurativeAuditReport,
  ZoningEnvelopeReport,
  DAGEvaluationReport,
  DAGNodeState,
  PEWaterfallReport,
  PortfolioAllocationReport,
  Section1031ExchangeReport,
  CostSegregationAnalysisReport,
  ReplayLedgerReport,
  BridgewaterMacroRegimeReport,
} from "../lib/types";
import {
  runAssetDeepOsint,
  generateOutreachPlaybook,
  updatePipelineStage,
  fetchAssetSpatialTwin,
  fetchAssetH3Index,
  fetchPublicCompsBenchmark,
  calculateMultipleArbitrage,
  screenEntityCompliance,
  parseTaxDocument,
  fetchBenchmarkYieldCurve,
  runMacroSofrScenarios,
  fetchAssetHealthScore,
  fetchOntologyGraph,
  resolveEntitySplink,
  queryContourMicroOlap,
  fuseGaiaSpatialTwin,
  fetchSemanticLookalikes,
  fetchDebtMaturityRadar,
  fetchTitleCurativeAudit,
  fetchPermitZoningScan,
  fetchReactiveDAGEvaluation,
  fetchPEWaterfall,
  fetchPortfolioConcentration,
  fetch1031ExchangeAudit,
  fetchCostSegregationAnalysis,
  fetchCanonicalEventReplay,
  fetchMacroRegimeStressTest,
} from "../lib/api";
import InfoPop from "./InfoPop";

interface UniversalAssetDossierModalProps {
  asset: UniversalAsset | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "OVERVIEW" | "SPATIAL_TWIN" | "OSINT" | "UNDERWRITING" | "ASSET_HEALTH" | "GOTHAM_ONTOLOGY" | "SOURCING_RADAR" | "TITAN_ANALYTICS" | "OUTREACH" | "PIPELINE";
  onAssetUpdated: (updated: UniversalAsset) => void;
}

export default function UniversalAssetDossierModal({
  asset,
  isOpen,
  onClose,
  initialTab = "OVERVIEW",
  onAssetUpdated,
}: UniversalAssetDossierModalProps) {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "SPATIAL_TWIN" | "OSINT" | "UNDERWRITING" | "ASSET_HEALTH" | "GOTHAM_ONTOLOGY" | "SOURCING_RADAR" | "TITAN_ANALYTICS" | "OUTREACH" | "PIPELINE"
  >(initialTab);
  const [currentAsset, setCurrentAsset] = useState<UniversalAsset | null>(asset);
  const [spatialTwin, setSpatialTwin] = useState<ParcelSpatialTwin | null>(null);
  const [loadingSpatialTwin, setLoadingSpatialTwin] = useState(false);
  const [flyoverMode, setFlyoverMode] = useState<
    "ORBIT" | "ROOFTOP" | "TRUCK_APRON" | "THERMAL_FLIR"
  >("ORBIT");
  const [floodSurgeFt, setFloodSurgeFt] = useState<number>(0.0);
  const [boundaryGlow, setBoundaryGlow] = useState(true);
  const [loadingOsint, setLoadingOsint] = useState(false);
  const [playbookType, setPlaybookType] = useState<"SUCCESSION_BUYOUT" | "AI_MODERNIZATION">(
    "SUCCESSION_BUYOUT"
  );
  const [playbook, setPlaybook] = useState<OutreachPlaybook | null>(null);
  const [loadingPlaybook, setLoadingPlaybook] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  // Aladdin Engine 1-5 States
  const [h3Index, setH3Index] = useState<H3SpatialIndex | null>(null);
  const [loadingH3, setLoadingH3] = useState(false);

  const [edgarBenchmark, setEdgarBenchmark] = useState<PublicSectorCompsBenchmark | null>(null);
  const [arbitrageResult, setArbitrageResult] = useState<MultipleArbitrageResult | null>(null);
  const [loadingEdgar, setLoadingEdgar] = useState(false);

  const [kycCertificate, setKycCertificate] = useState<YenteComplianceCertificate | null>(null);
  const [screeningKyc, setScreeningKyc] = useState(false);

  const [taxReport, setTaxReport] = useState<ParsedTaxDocumentReport | null>(null);
  const [parsingTax, setParsingTax] = useState(false);

  const [yieldCurve, setYieldCurve] = useState<BenchmarkYieldCurve | null>(null);
  const [macroMatrix, setMacroMatrix] = useState<MacroStressMatrixReport | null>(null);
  const [runningMacro, setRunningMacro] = useState(false);

  // Augury AssetHealth™ Engine State
  const [assetHealth, setAssetHealth] = useState<CompositeAssetHealthScore | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Palantir Gotham & Operational Ontology States
  const [ontologyGraph, setOntologyGraph] = useState<OntologyGraphReport | null>(null);
  const [loadingOntology, setLoadingOntology] = useState(false);
  const [selectedGraphNode, setSelectedGraphNode] = useState<any | null>(null);
  const [contourResult, setContourResult] = useState<ContourAnalyticalQueryResult | null>(null);
  const [loadingContour, setLoadingContour] = useState(false);
  const [splinkMatch, setSplinkMatch] = useState<EntityResolutionMatchResult | null>(null);
  const [resolvingSplink, setResolvingSplink] = useState(false);

  // Sourcing Intelligence & Debt Radar States (Inven / Reonomy / PropertyRadar / Cherre)
  const [radarSubTab, setRadarSubTab] = useState<"DEBT_WALL" | "LOOKALIKES" | "TITLE_CURATIVE" | "ZONING_PERMITS">("DEBT_WALL");
  const [debtRadarReport, setDebtRadarReport] = useState<DebtMaturityRadarReport | null>(null);
  const [loadingDebtRadar, setLoadingDebtRadar] = useState(false);
  const [projectedRefiRate, setProjectedRefiRate] = useState<number>(0.0825);

  const [lookalikeReport, setLookalikeReport] = useState<SemanticLookalikeReport | null>(null);
  const [loadingLookalike, setLoadingLookalike] = useState(false);
  const [lookalikeSearchQuery, setLookalikeSearchQuery] = useState("");

  const [titleAuditReport, setTitleAuditReport] = useState<TitleCurativeAuditReport | null>(null);
  const [loadingTitleAudit, setLoadingTitleAudit] = useState(false);

  const [zoningReport, setZoningReport] = useState<ZoningEnvelopeReport | null>(null);
  const [loadingZoning, setLoadingZoning] = useState(false);

  // Institutional Titan States (Goldman SecDB, BlackRock eFront, Vanguard Tax, Jane Street SMR, Bridgewater Macro)
  const [titanSubTab, setTitanSubTab] = useState<"DAG_REACTIVE" | "PE_WATERFALL" | "TAX_ALPHA" | "JANE_STREET_REPLAY" | "MACRO_REGIME">("DAG_REACTIVE");

  // 1. Goldman SecDB DAG
  const [dagReport, setDagReport] = useState<DAGEvaluationReport | null>(null);
  const [dagNodes, setDagNodes] = useState<DAGNodeState[]>([]);
  const [loadingDag, setLoadingDag] = useState(false);
  const [dagPurchasePrice, setDagPurchasePrice] = useState<number>(1500000);
  const [dagBuyerEquityPct, setDagBuyerEquityPct] = useState<number>(0.10);
  const [dagSofrRate, setDagSofrRate] = useState<number>(0.0530);
  const [dagBankSpreadBps, setDagBankSpreadBps] = useState<number>(275);
  const [dagEbitda, setDagEbitda] = useState<number>(380000);

  // 2. BlackRock eFront Waterfall & Citadel Concentration
  const [waterfallReport, setWaterfallReport] = useState<PEWaterfallReport | null>(null);
  const [loadingWaterfall, setLoadingWaterfall] = useState(false);
  const [concentrationReport, setConcentrationReport] = useState<PortfolioAllocationReport | null>(null);
  const [loadingConcentration, setLoadingConcentration] = useState(false);
  const [distributableProceeds, setDistributableProceeds] = useState<number>(3200000);
  const [lpCapital, setLpCapital] = useState<number>(1500000);

  // 3. Vanguard / CPA Tax Alpha (1031 & Cost Seg)
  const [tax1031Report, setTax1031Report] = useState<Section1031ExchangeReport | null>(null);
  const [loading1031, setLoading1031] = useState(false);
  const [costSegReport, setCostSegReport] = useState<CostSegregationAnalysisReport | null>(null);
  const [loadingCostSeg, setLoadingCostSeg] = useState(false);

  // 4. Jane Street Event Stream Replay
  const [replayReport, setReplayReport] = useState<ReplayLedgerReport | null>(null);
  const [loadingReplay, setLoadingReplay] = useState(false);

  // 5. Bridgewater Macro Regime
  const [macroRegimeReport, setMacroRegimeReport] = useState<BridgewaterMacroRegimeReport | null>(null);
  const [loadingMacroRegime, setLoadingMacroRegime] = useState(false);

  useEffect(() => {
    setCurrentAsset(asset);
    setActiveTab(initialTab);
    setPlaybook(null);
    setSpatialTwin(null);
    setH3Index(null);
    setEdgarBenchmark(null);
    setArbitrageResult(null);
    setKycCertificate(null);
    setTaxReport(null);
    setYieldCurve(null);
    setMacroMatrix(null);
    setAssetHealth(null);
    setOntologyGraph(null);
    setSelectedGraphNode(null);
    setContourResult(null);
    setSplinkMatch(null);
    setDebtRadarReport(null);
    setLookalikeReport(null);
    setTitleAuditReport(null);
    setZoningReport(null);
    setDagReport(null);
    setDagNodes([]);
    setWaterfallReport(null);
    setConcentrationReport(null);
    setTax1031Report(null);
    setCostSegReport(null);
    setReplayReport(null);
    setMacroRegimeReport(null);
    setLookalikeSearchQuery(asset ? `${asset.title} ${asset.asset_class}` : "");
  }, [asset, initialTab]);

  useEffect(() => {
    if (activeTab === "OUTREACH" && currentAsset && !playbook) {
      loadPlaybook(playbookType);
    }
    if (activeTab === "SPATIAL_TWIN" && currentAsset && !spatialTwin) {
      loadSpatialTwin();
    }
    if ((activeTab === "OVERVIEW" || activeTab === "SPATIAL_TWIN") && currentAsset && !h3Index) {
      loadH3Index();
    }
    if (activeTab === "UNDERWRITING" && currentAsset && !edgarBenchmark) {
      loadEdgarCompsAndArbitrage();
      loadYieldCurve();
    }
    if (activeTab === "ASSET_HEALTH" && currentAsset && !assetHealth) {
      loadAssetHealth();
    }
    if (activeTab === "GOTHAM_ONTOLOGY" && currentAsset && !ontologyGraph) {
      loadOntologyGraph();
    }
    if (activeTab === "SOURCING_RADAR" && currentAsset) {
      if (radarSubTab === "DEBT_WALL" && !debtRadarReport) loadDebtRadar();
      if (radarSubTab === "LOOKALIKES" && !lookalikeReport) loadLookalikes();
      if (radarSubTab === "TITLE_CURATIVE" && !titleAuditReport) loadTitleAudit();
      if (radarSubTab === "ZONING_PERMITS" && !zoningReport) loadZoning();
    }
    if (activeTab === "TITAN_ANALYTICS" && currentAsset) {
      if (titanSubTab === "DAG_REACTIVE" && !dagReport) loadDagEvaluation();
      if (titanSubTab === "PE_WATERFALL" && !waterfallReport) {
        loadWaterfall();
        loadConcentration();
      }
      if (titanSubTab === "TAX_ALPHA" && !tax1031Report) {
        load1031Audit();
        loadCostSegregation();
      }
      if (titanSubTab === "JANE_STREET_REPLAY" && !replayReport) loadEventReplay();
      if (titanSubTab === "MACRO_REGIME" && !macroRegimeReport) loadMacroRegime();
    }
  }, [activeTab, currentAsset, playbookType, radarSubTab, titanSubTab]);

  const loadAssetHealth = async () => {
    if (!currentAsset) return;
    setLoadingHealth(true);
    try {
      const ebitda = parseFloat(currentAsset.estimated_sde_or_ebitda_usd || "480000");
      const asking = parseFloat(currentAsset.asking_or_estimated_value_usd || "1450000");
      const debtService = Math.round(asking * 0.80 * 0.14) || 285000;
      const res = await fetchAssetHealthScore(
        currentAsset.asset_id,
        currentAsset.naics_code || "332710",
        ebitda,
        debtService
      );
      setAssetHealth(res.health);
    } catch (err) {
      console.error("Failed to load asset physical health:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadOntologyGraph = async () => {
    if (!currentAsset) return;
    setLoadingOntology(true);
    try {
      const res = await fetchOntologyGraph(currentAsset.asset_id);
      setOntologyGraph(res.ontology_graph);
    } catch (err) {
      console.error("Failed to load Gotham ontology graph:", err);
    } finally {
      setLoadingOntology(false);
    }
  };

  const runContourMicroOlap = async () => {
    setLoadingContour(true);
    try {
      const prefix = currentAsset?.naics_code ? currentAsset.naics_code.substring(0, 3) : "484";
      const res = await queryContourMicroOlap({
        naics_prefix: prefix,
        max_cure_basis_usd: "3500000.00",
        min_dscr: "1.25",
      });
      setContourResult(res.contour_query_result);
    } catch (err) {
      console.error("Failed to query Contour micro-OLAP:", err);
    } finally {
      setLoadingContour(false);
    }
  };

  const runSplinkResolution = async () => {
    if (!currentAsset) return;
    setResolvingSplink(true);
    try {
      const addr = `${currentAsset.city || "Roanoke"}, ${currentAsset.state || "VA"}`;
      const res = await resolveEntitySplink(
        { id: currentAsset.asset_id, name: currentAsset.title, address: addr, tax_id: "VA-1284910" },
        { id: `${currentAsset.asset_id}-SCC`, name: `${currentAsset.title.toUpperCase()} LLC`, address: addr, tax_id: "VA-1284910" }
      );
      setSplinkMatch(res.entity_resolution);
    } catch (err) {
      console.error("Failed to resolve entity via Splink:", err);
    } finally {
      setResolvingSplink(false);
    }
  };

  const loadDebtRadar = async (rate?: number) => {
    if (!currentAsset) return;
    setLoadingDebtRadar(true);
    try {
      const market = `${currentAsset.city || "Roanoke"}, ${currentAsset.state || "VA"}`;
      const res = await fetchDebtMaturityRadar({
        target_market: market,
        max_months_to_maturity: 24,
        projected_refinance_rate: rate !== undefined ? rate : projectedRefiRate,
      });
      setDebtRadarReport(res.maturity_radar);
    } catch (err) {
      console.error("Failed to load debt maturity radar:", err);
    } finally {
      setLoadingDebtRadar(false);
    }
  };

  const loadLookalikes = async (queryOverride?: string) => {
    if (!currentAsset) return;
    setLoadingLookalike(true);
    try {
      const q = queryOverride || lookalikeSearchQuery || `${currentAsset.title} ${currentAsset.asset_class}`;
      const res = await fetchSemanticLookalikes({
        query: q,
        exemplary_entity_id: currentAsset.asset_id,
        min_similarity: 0.30,
        max_distance_miles: 50.0,
      });
      setLookalikeReport(res.lookalike_report);
    } catch (err) {
      console.error("Failed to load semantic lookalikes:", err);
    } finally {
      setLoadingLookalike(false);
    }
  };

  const loadTitleAudit = async () => {
    if (!currentAsset) return;
    setLoadingTitleAudit(true);
    try {
      const res = await fetchTitleCurativeAudit({
        parcel_id: currentAsset.parcel_id || "51161-ROA-001",
        deal_id: currentAsset.asset_id,
      });
      setTitleAuditReport(res.title_curative_audit);
    } catch (err) {
      console.error("Failed to load title curative audit:", err);
    } finally {
      setLoadingTitleAudit(false);
    }
  };

  const loadZoning = async () => {
    if (!currentAsset) return;
    setLoadingZoning(true);
    try {
      const res = await fetchPermitZoningScan({
        parcel_id: currentAsset.parcel_id || "51161-ROA-001",
        parcel_area_acres: 3.85,
        building_footprint_sqft: 48500.0,
        zoning_code: "I-2",
      });
      setZoningReport(res.zoning_envelope);
    } catch (err) {
      console.error("Failed to load permit and zoning scan:", err);
    } finally {
      setLoadingZoning(false);
    }
  };

  const loadH3Index = async () => {
    if (!currentAsset) return;
    setLoadingH3(true);
    try {
      const res = await fetchAssetH3Index(currentAsset.asset_id);
      setH3Index(res.h3_spatial_index);
    } catch (err) {
      console.error("Failed to load H3 index:", err);
    } finally {
      setLoadingH3(false);
    }
  };

  const loadEdgarCompsAndArbitrage = async () => {
    if (!currentAsset) return;
    setLoadingEdgar(true);
    try {
      const naics = currentAsset.naics_code || "5412";
      const bench = await fetchPublicCompsBenchmark(naics);
      setEdgarBenchmark(bench);

      const asking = currentAsset.asking_or_estimated_value_usd || "1450000.00";
      const sde = currentAsset.estimated_sde_or_ebitda_usd || "420000.00";
      const arb = await calculateMultipleArbitrage(asking, sde, naics);
      setArbitrageResult(arb.arbitrage);
    } catch (err) {
      console.error("Failed to load EDGAR comps / arbitrage:", err);
    } finally {
      setLoadingEdgar(false);
    }
  };

  const loadYieldCurve = async () => {
    try {
      const res = await fetchBenchmarkYieldCurve();
      setYieldCurve(res.yield_curve);
    } catch (err) {
      console.error("Failed to load yield curve:", err);
    }
  };

  const handleRunMacroSofr = async () => {
    if (!currentAsset) return;
    setRunningMacro(true);
    try {
      const asking = parseFloat(currentAsset.asking_or_estimated_value_usd || "1450000");
      const loan = (asking * 0.80).toFixed(2);
      const ebitda = currentAsset.estimated_sde_or_ebitda_usd || "420000.00";
      const res = await runMacroSofrScenarios({
        loan_principal_usd: loan,
        baseline_annual_ebitda_usd: ebitda,
        amortization_years: 10,
        asset_title: currentAsset.title,
      });
      setMacroMatrix(res.matrix_report);
    } catch (err) {
      console.error("Failed to run macro SOFR scenarios:", err);
    } finally {
      setRunningMacro(false);
    }
  };

  const handleScreenKyc = async () => {
    if (!currentAsset) return;
    setScreeningKyc(true);
    try {
      const founder = currentAsset.owner_osint?.founder_name || "Arthur Pendelton";
      const res = await screenEntityCompliance({
        entity_name: currentAsset.title,
        jurisdiction: `US-${currentAsset.state}`,
        screener_role: "COUNSEL",
        beneficial_owners: [founder],
      });
      setKycCertificate(res.certificate);
    } catch (err) {
      console.error("Failed to screen entity compliance:", err);
    } finally {
      setScreeningKyc(false);
    }
  };

  const handleSimulateTaxParse = async () => {
    if (!currentAsset) return;
    setParsingTax(true);
    try {
      const sampleText = `
        INTERNAL REVENUE SERVICE
        Schedule C (Form 1040) Profit or Loss From Business
        Tax Year: 2025
        Taxpayer: ${currentAsset.title}
        Line 1 Gross receipts or sales: $${(parseFloat(currentAsset.estimated_annual_revenue_usd || "1500000")).toLocaleString()}.00
        Line 4 Cost of goods sold: $420,000.00
        Line 9 Car and truck expenses: $24,500.00
        Line 13 Depreciation and section 179: $48,000.00
        Line 16b Interest expense: $16,500.00
        Line 17 Legal and professional services: $12,000.00
        Line 24b Meals: $6,800.00
        Line 27a Other expenses: $22,000.00
        Line 31 Net profit: $${(parseFloat(currentAsset.estimated_sde_or_ebitda_usd || "380000")).toLocaleString()}.00
      `;
      const res = await parseTaxDocument({
        document_type: "IRS_1040_SCHED_C",
        document_text: sampleText,
        tax_year: 2025,
        taxpayer_name: currentAsset.title,
        owner_hours_per_week: 45,
      });
      setTaxReport(res.report);
    } catch (err) {
      console.error("Failed to parse tax document:", err);
    } finally {
      setParsingTax(false);
    }
  };

  const loadSpatialTwin = async () => {
    if (!currentAsset) return;
    setLoadingSpatialTwin(true);
    try {
      const res = await fetchAssetSpatialTwin(currentAsset.asset_id);
      setSpatialTwin(res.spatial_twin);
    } catch (err) {
      console.error("Failed to load spatial digital twin:", err);
    } finally {
      setLoadingSpatialTwin(false);
    }
  };

  const loadDagEvaluation = async () => {
    if (!currentAsset) return;
    setLoadingDag(true);
    try {
      const res = await fetchReactiveDAGEvaluation({
        purchase_price_usd: dagPurchasePrice,
        buyer_equity_pct: dagBuyerEquityPct,
        sofr_benchmark_rate: dagSofrRate,
        bank_spread_bps: dagBankSpreadBps,
        historical_ebitda_usd: dagEbitda,
        replacement_gm_salary_usd: 85000,
        assessed_cre_value_usd: 2200000,
        seller_standby_note_usd: 0,
        seller_consulting_months: 12,
        loan_term_years: 25,
      });
      setDagReport(res.dag_report);
      setDagNodes(res.node_states);
    } catch (err) {
      console.error("Failed to evaluate reactive DAG:", err);
    } finally {
      setLoadingDag(false);
    }
  };

  const loadWaterfall = async () => {
    if (!currentAsset) return;
    setLoadingWaterfall(true);
    try {
      const res = await fetchPEWaterfall({
        deal_id: currentAsset.asset_id,
        total_distributable_proceeds_usd: distributableProceeds,
        lp_equity_contributed_usd: lpCapital,
        gp_equity_contributed_usd: 0,
        preferred_return_rate_pct: 8.0,
        holding_period_years: 3.0,
        carried_interest_pct: 20.0,
        waterfall_structure: "EUROPEAN_WHOLE_FUND",
      });
      setWaterfallReport(res.waterfall_report);
    } catch (err) {
      console.error("Failed to calculate PE waterfall:", err);
    } finally {
      setLoadingWaterfall(false);
    }
  };

  const loadConcentration = async () => {
    setLoadingConcentration(true);
    try {
      const res = await fetchPortfolioConcentration();
      setConcentrationReport(res.concentration_report);
    } catch (err) {
      console.error("Failed to audit concentration:", err);
    } finally {
      setLoadingConcentration(false);
    }
  };

  const load1031Audit = async () => {
    if (!currentAsset) return;
    setLoading1031(true);
    try {
      const price = parseFloat(currentAsset.asking_or_estimated_value_usd || "2200000");
      const res = await fetch1031ExchangeAudit({
        exchange_id: `EX-${currentAsset.asset_id}`,
        relinquished_property_name: currentAsset.title || "Relinquished Commercial Asset",
        sale_price_usd: price,
        adjusted_cost_basis_usd: Math.round(price * 0.55),
        existing_mortgage_payoff_usd: Math.round(price * 0.25),
      });
      setTax1031Report(res.exchange_report);
    } catch (err) {
      console.error("Failed to audit 1031 exchange:", err);
    } finally {
      setLoading1031(false);
    }
  };

  const loadCostSegregation = async () => {
    if (!currentAsset) return;
    setLoadingCostSeg(true);
    try {
      const price = parseFloat(currentAsset.asking_or_estimated_value_usd || "2200000");
      const res = await fetchCostSegregationAnalysis({
        parcel_id: currentAsset.parcel_id || "51161-ROA-001",
        deal_id: currentAsset.asset_id,
        total_acquisition_basis_usd: price,
        land_value_ratio: 0.18,
        five_year_ratio: 0.185,
        fifteen_year_ratio: 0.125,
        bonus_depreciation_pct: 60.0,
        marginal_tax_rate_pct: 42.75,
      });
      setCostSegReport(res.cost_segregation_report);
    } catch (err) {
      console.error("Failed to calculate cost segregation:", err);
    } finally {
      setLoadingCostSeg(false);
    }
  };

  const loadEventReplay = async () => {
    if (!currentAsset) return;
    setLoadingReplay(true);
    try {
      const res = await fetchCanonicalEventReplay({
        aggregate_id: currentAsset.asset_id,
      });
      setReplayReport(res.replay_report);
    } catch (err) {
      console.error("Failed to replay canonical events:", err);
    } finally {
      setLoadingReplay(false);
    }
  };

  const loadMacroRegime = async () => {
    if (!currentAsset) return;
    setLoadingMacroRegime(true);
    try {
      const rev = parseFloat(currentAsset.estimated_annual_revenue_usd || "2500000");
      const ebitda = parseFloat(currentAsset.estimated_sde_or_ebitda_usd || "450000");
      const debtService = Math.round(ebitda * 0.52);
      const res = await fetchMacroRegimeStressTest({
        deal_id: currentAsset.asset_id,
        entity_name: currentAsset.title,
        naics_code: currentAsset.naics_code || "332710",
        base_annual_revenue_usd: rev,
        base_normalized_ebitda_usd: ebitda,
        base_annual_debt_service_usd: debtService,
        base_interest_rate_pct: 8.05,
      });
      setMacroRegimeReport(res.macro_regime_report);
    } catch (err) {
      console.error("Failed to run macro regime stress test:", err);
    } finally {
      setLoadingMacroRegime(false);
    }
  };

  if (!isOpen || !currentAsset) return null;

  const handleRunOsint = async () => {
    setLoadingOsint(true);
    try {
      const updated = await runAssetDeepOsint(currentAsset.asset_id);
      setCurrentAsset(updated);
      onAssetUpdated(updated);
    } catch (err) {
      console.error("OSINT error:", err);
    } finally {
      setLoadingOsint(false);
    }
  };

  const loadPlaybook = async (type: "SUCCESSION_BUYOUT" | "AI_MODERNIZATION") => {
    setLoadingPlaybook(true);
    try {
      const res = await generateOutreachPlaybook(currentAsset.asset_id, type);
      setPlaybook(res);
    } catch (err) {
      console.error("Playbook error:", err);
    } finally {
      setLoadingPlaybook(false);
    }
  };

  const handleCopyPlaybook = () => {
    if (!playbook) return;
    const text = `Subject: ${playbook.subject_line}\n\n${playbook.body_markdown}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetStage = async (newStage: PipelineStage) => {
    setUpdatingStage(true);
    try {
      const res = await updatePipelineStage(currentAsset.asset_id, newStage);
      setCurrentAsset(res);
      onAssetUpdated(res);
    } catch (err) {
      console.error("Stage update error:", err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const formatUSD = (val?: string) => {
    if (!val) return "—";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {currentAsset.asset_id} • {currentAsset.asset_class.replace("_", " ")}
              </span>
              {currentAsset.is_potential_baby_boomer && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/50 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Baby Boomer Succession
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                Stage: {currentAsset.pipeline_stage.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
              {currentAsset.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {currentAsset.city}, {currentAsset.state} {currentAsset.zip_code} (
                {currentAsset.metro_area}) • {currentAsset.county}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 pb-3 border-b border-zinc-800/80 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "OVERVIEW"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            Asset Overview & Macro
          </button>
          <button
            onClick={() => setActiveTab("SPATIAL_TWIN")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "SPATIAL_TWIN"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>God's Eye 3D Twin</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
              3D
            </span>
          </button>
          <button
            onClick={() => setActiveTab("OSINT")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "OSINT"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Owner & Key Person OSINT</span>
            {currentAsset.owner_osint && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("UNDERWRITING")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "UNDERWRITING"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Aladdin Underwriting &amp; Comps</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-950 border border-purple-800 text-purple-300 font-bold">
              5 Engines
            </span>
          </button>
          <button
            onClick={() => setActiveTab("ASSET_HEALTH")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "ASSET_HEALTH"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Augury AssetHealth™</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 border border-amber-800 text-amber-300 font-bold">
              AI Health
            </span>
          </button>
          <button
            onClick={() => setActiveTab("GOTHAM_ONTOLOGY")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "GOTHAM_ONTOLOGY"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>Palantir Gotham™ Graph</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
              Ontology
            </span>
          </button>
          <button
            onClick={() => setActiveTab("SOURCING_RADAR")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "SOURCING_RADAR"
                ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-rose-400" />
            <span>Sourcing &amp; Debt Radar</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950 border border-rose-800 text-rose-300 font-bold">
              Inven/Trepp
            </span>
          </button>
          <button
            onClick={() => setActiveTab("TITAN_ANALYTICS")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "TITAN_ANALYTICS"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Titan Analytics</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
              5 Systems
            </span>
          </button>
          <button
            onClick={() => setActiveTab("OUTREACH")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "OUTREACH"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Fiduciary Outreach Playbooks</span>
          </button>
          <button
            onClick={() => setActiveTab("PIPELINE")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "PIPELINE"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline Handoff</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-6">
              {/* Valuation & Downside Protection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                      Asking / Valuation
                    </span>
                    <InfoPop term="ASKING_BASIS" size="xs" />
                  </div>
                  <span className="text-lg font-extrabold text-white">
                    {formatUSD(currentAsset.asking_or_estimated_value_usd)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                      Downside Liquidation Floor
                    </span>
                    <InfoPop term="COLLATERAL_FLOOR" size="xs" />
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatUSD(currentAsset.downside_liquidation_floor_usd)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    Macro Crime Index
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      currentAsset.crime_index <= 30
                        ? "text-emerald-400"
                        : currentAsset.crime_index <= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {currentAsset.crime_index} / 100
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    10-Yr Population Growth
                  </span>
                  <span className="text-lg font-bold text-blue-400">
                    +{currentAsset.population_growth_10yr_pct}%
                  </span>
                </div>
              </div>

              {/* Uber H3 Geospatial Hex Index & Private Equity Roll-Up Density */}
              {h3Index && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 p-3.5 rounded-xl border border-emerald-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span className="text-zinc-400 font-medium">Uber H3 Spatial Cell:</span>
                    <span className="font-mono text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      Res-8: {h3Index.h3_index_res8}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">
                      (Anchor Res-7: {h3Index.h3_index_res7})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[11px]">PE Roll-Up Density:</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold text-[11px]">
                      Active Consolidated Cluster
                    </span>
                  </div>
                </div>
              )}

              {/* Class Specific Financials */}
              {currentAsset.asset_class === "BUSINESS_ACQUISITION" && (
                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    Operating Firm Fundamentals & Registry
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Industry Category</span>
                      <span className="font-semibold text-white">
                        {currentAsset.industry_category || "General Business"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">NAICS Code</span>
                      <span className="font-mono text-white">{currentAsset.naics_code || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Annual Revenue</span>
                      <span className="font-semibold text-white">
                        {formatUSD(currentAsset.estimated_annual_revenue_usd)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 block">SDE / Net Cashflow</span>
                        <InfoPop term="SDE" size="xs" />
                      </div>
                      <span className="font-semibold text-emerald-400">
                        {formatUSD(currentAsset.estimated_sde_or_ebitda_usd)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Operating Tenure</span>
                      <span className="font-semibold text-white">
                        {currentAsset.operating_years} Years (Founded {currentAsset.founded_year})
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Employee Scale</span>
                      <span className="font-semibold text-white">
                        {currentAsset.employee_count_band || "5-15 Staff"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Corporate Registry</span>
                      <span className="font-semibold text-emerald-400">
                        {currentAsset.corporate_registry_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Property Tax Rate</span>
                      <span className="font-semibold text-white">
                        {currentAsset.property_tax_rate_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentAsset.asset_class === "REAL_ESTATE" && (
                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    Real Estate & Rental Economics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Property Type</span>
                      <span className="font-semibold text-white">
                        {currentAsset.property_type || "Commercial CRE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Institutional Cap Rate</span>
                      <span className="font-bold text-emerald-400">
                        {currentAsset.cap_rate_pct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Cash-on-Cash Return</span>
                      <span className="font-bold text-emerald-400">
                        {currentAsset.cash_on_cash_pct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Gross Monthly Rent</span>
                      <span className="font-semibold text-white">
                        {formatUSD(currentAsset.average_monthly_rent_usd)}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Total Units / Doors</span>
                      <span className="font-semibold text-white">
                        {currentAsset.units_count || 1} Units
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Building Area</span>
                      <span className="font-semibold text-white">
                        {currentAsset.building_sqft?.toLocaleString()} SqFt
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Section 8 Status</span>
                      <span className="font-semibold text-emerald-400">
                        {currentAsset.section_8_eligible
                          ? "100% Eligible (Direct ACH)"
                          : "Market Rate"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Median Household Income</span>
                      <span className="font-semibold text-white">
                        {formatUSD(currentAsset.median_household_income_usd)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Deal Thesis & AI Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    AI Investment Thesis
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {currentAsset.ai_deal_thesis}
                  </p>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Risk Audit & Downside Protection
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {currentAsset.ai_risk_assessment}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOD'S EYE 3D SPATIAL TWIN & FLYOVER */}
          {activeTab === "SPATIAL_TWIN" && (
            <div className="space-y-5 animate-fadeIn">
              {loadingSpatialTwin ? (
                <div className="py-24 text-center space-y-3">
                  <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-zinc-400">Loading 3D photorealistic spatial twin and parcel boundary polygons...</p>
                </div>
              ) : spatialTwin ? (
                <>
                  {/* Top HUD Bar */}
                  <div className="p-3.5 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Compass className="w-4 h-4 animate-spin-slow" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-white">
                            3D Spatial Digital Twin &amp; Site Flyover
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                            Google 3D Tiles • Cesium Engine
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          GPS: {spatialTwin.center_lat.toFixed(5)}°N, {spatialTwin.center_lng.toFixed(5)}°W • Ground Elev:{" "}
                          <strong className="text-zinc-200">{spatialTwin.ground_elevation_ft} ft MSL</strong> • 100yr BFE:{" "}
                          <strong className="text-zinc-200">{spatialTwin.fema_bfe_elevation_ft} ft MSL</strong>
                        </p>
                      </div>
                    </div>

                    {/* Camera Mode Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        onClick={() => setFlyoverMode("ORBIT")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          flyoverMode === "ORBIT"
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                        }`}
                      >
                        360° Orbit
                      </button>
                      <button
                        onClick={() => setFlyoverMode("ROOFTOP")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          flyoverMode === "ROOFTOP"
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Roof &amp; HVAC
                      </button>
                      <button
                        onClick={() => setFlyoverMode("TRUCK_APRON")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          flyoverMode === "TRUCK_APRON"
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Truck Docks
                      </button>
                      <button
                        onClick={() => setFlyoverMode("THERMAL_FLIR")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                          flyoverMode === "THERMAL_FLIR"
                            ? "bg-amber-600 text-white"
                            : "bg-zinc-800/80 text-zinc-400 hover:text-amber-300"
                        }`}
                      >
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>FLIR Thermal</span>
                      </button>
                    </div>
                  </div>

                  {/* 3D Photorealistic Simulated Spatial Viewport */}
                  <div className="relative w-full h-[320px] sm:h-[380px] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
                    {/* Viewport Backdrop with Perspective Grid & 3D Building Representation */}
                    <div
                      className={`absolute inset-0 transition-all duration-700 ${
                        flyoverMode === "THERMAL_FLIR"
                          ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/80 via-purple-950/90 to-black"
                          : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black"
                      }`}
                    >
                      {/* Perspective Grid Floor */}
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:32px_32px]"></div>

                      {/* 3D Extruded Building Envelope */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-40 sm:h-48 border-2 border-emerald-500/80 rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 backdrop-blur-md shadow-2xl flex flex-col justify-between p-3.5 transform -rotate-12 transition-transform duration-500 hover:rotate-0">
                        {/* Roof Inspection HUD */}
                        <div className="flex items-center justify-between border-b border-zinc-700/60 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span className="text-[11px] font-bold text-white font-mono">
                              BUILDING ENVELOPE: {spatialTwin.building_footprint_sqft.toLocaleString()} SQFT
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                            {spatialTwin.clear_ceiling_height_ft}ft Clear
                          </span>
                        </div>

                        {/* Rooftop HVAC Elements Markers */}
                        <div className="grid grid-cols-4 gap-2 py-2">
                          {Array.from({ length: Math.min(8, spatialTwin.rooftop_hvac_units) }).map((_, idx) => (
                            <div
                              key={idx}
                              className="p-1 rounded bg-zinc-800 border border-zinc-700 text-center text-[9px] font-mono text-zinc-300"
                              title={`Packaged HVAC Unit #${idx + 1}`}
                            >
                              HVAC-{idx + 1}
                            </div>
                          ))}
                        </div>

                        {/* Loading Dock Levelers Visualizer */}
                        <div className="flex items-center justify-between border-t border-zinc-700/60 pt-2 text-[10px] text-zinc-300 font-mono">
                          <span className="text-emerald-400 font-bold">
                            ▲ {spatialTwin.loading_dock_bays} Dock-High Bays
                          </span>
                          <span className="text-zinc-400">
                            ■ {spatialTwin.drive_in_doors} Drive-In Doors
                          </span>
                        </div>
                      </div>

                      {/* 3D Parcel Boundary Extrusion Polygon Lines */}
                      {boundaryGlow && (
                        <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-500/60 rounded-3xl pointer-events-none animate-pulse">
                          <span className="absolute top-2 left-2 text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-emerald-400 border border-emerald-800">
                            GIS Parcel Boundary ({spatialTwin.acreage} Acres)
                          </span>
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">
                            GPIN: {spatialTwin.parcel_id}
                          </span>
                        </div>
                      )}

                      {/* 3D FEMA Flood Inundation Plane (Simulated Water Plane Rising) */}
                      {floodSurgeFt > 0 && (
                        <div
                          className="absolute inset-x-0 bottom-0 bg-blue-500/30 border-t-2 border-blue-400/80 backdrop-blur-xs transition-all duration-500 pointer-events-none flex items-start justify-end p-3"
                          style={{
                            height: `${Math.min(90, (floodSurgeFt / 12.0) * 80 + 20)}%`,
                          }}
                        >
                          <span className="text-xs font-mono font-bold bg-blue-950/90 text-blue-200 border border-blue-500 px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5">
                            <Waves className="w-3.5 h-3.5 text-blue-400" />
                            Simulated Flood Surge: +{floodSurgeFt.toFixed(1)} ft ({floodSurgeFt >= spatialTwin.flood_clearance_delta_ft ? "FLOODED" : "DRY FLOOR"})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Viewport Overlay Controls */}
                    <div className="relative z-10 flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setBoundaryGlow(!boundaryGlow)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition border ${
                            boundaryGlow
                              ? "bg-emerald-950/90 border-emerald-700 text-emerald-300"
                              : "bg-black/80 border-zinc-700 text-zinc-400"
                          }`}
                        >
                          Boundary Extrusion: {boundaryGlow ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div className="text-[11px] font-mono bg-black/80 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                        Camera Pitch: -35.0° • Heading: 045° • Zoom: 1.0x
                      </div>
                    </div>

                    {/* Interactive 3D FEMA Flood Simulation Slider */}
                    <div className="relative z-10 p-2.5 rounded-xl bg-black/80 border border-zinc-800 backdrop-blur-md space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-blue-400 font-bold flex items-center gap-1.5">
                          <Waves className="w-3.5 h-3.5" />
                          3D FEMA Floodplain Inundation Water-Plane Simulator
                        </span>
                        <span className="text-zinc-300">
                          Surge Delta: <strong className="text-white">+{floodSurgeFt.toFixed(1)} ft</strong> (Clearance:{" "}
                          <strong
                            className={
                              spatialTwin.flood_clearance_delta_ft - floodSurgeFt > 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {(spatialTwin.flood_clearance_delta_ft - floodSurgeFt).toFixed(1)} ft
                          </strong>
                          )
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setFloodSurgeFt(0.0)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            floodSurgeFt === 0.0
                              ? "bg-zinc-700 text-white"
                              : "bg-zinc-900 text-zinc-400 hover:text-white"
                          }`}
                        >
                          Baseline (0ft)
                        </button>
                        <button
                          onClick={() => setFloodSurgeFt(7.5)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            floodSurgeFt === 7.5
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-900 text-zinc-400 hover:text-blue-300"
                          }`}
                        >
                          100-Yr Surge (+7.5ft)
                        </button>
                        <button
                          onClick={() => setFloodSurgeFt(12.0)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            floodSurgeFt === 12.0
                              ? "bg-rose-600 text-white"
                              : "bg-zinc-900 text-zinc-400 hover:text-rose-300"
                          }`}
                        >
                          500-Yr Extreme (+12ft)
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          step="0.5"
                          value={floodSurgeFt}
                          onChange={(e) => setFloodSurgeFt(parseFloat(e.target.value))}
                          className="flex-1 accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aerial Building & Logistics Specifications Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Rooftop & Structural Integrity Card */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-amber-400" />
                          Rooftop &amp; Envelope Specifications
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                          {spatialTwin.rooftop_condition_score}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Roof Area</span>
                          <span className="font-bold text-white">
                            {spatialTwin.building_footprint_sqft.toLocaleString()} SqFt
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Packaged HVAC Units</span>
                          <span className="font-bold text-white">
                            {spatialTwin.rooftop_hvac_units} Units Monitored
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Clear Ceiling Height</span>
                          <span className="font-bold text-white">
                            {spatialTwin.clear_ceiling_height_ft} ft Eaves Clear
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Solar Rooftop Potential</span>
                          <span className="font-bold text-emerald-400">
                            {Math.round(spatialTwin.building_footprint_sqft * 0.012)} kW Array Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Freight Ingress / Egress & Logistics Card */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-blue-400" />
                          Freight Ingress &amp; Logistics Infrastructure
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 border border-blue-800 text-blue-300 font-bold">
                          {spatialTwin.loading_dock_bays} Docks
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Loading Dock Bays</span>
                          <span className="font-bold text-white">
                            {spatialTwin.loading_dock_bays} Dock-High with Levelers
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Drive-In Doors</span>
                          <span className="font-bold text-white">
                            {spatialTwin.drive_in_doors} Grade-Level Doors
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Truck Turnaround Apron</span>
                          <span className="font-bold text-white">
                            {spatialTwin.truck_apron_depth_ft} ft Heavy Concrete
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Rail Spur / Interstate</span>
                          <span className="font-bold text-white">
                            {spatialTwin.nearest_interstate_miles} mi to I-Corridor {spatialTwin.active_rail_spur ? "• Rail Active" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
          {activeTab === "OSINT" && (
            <div className="space-y-6">
              {currentAsset.owner_osint ? (
                <div className="space-y-6">
                  {/* Founder Profile Card */}
                  <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-700/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          Verified Key Person / Owner
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          {currentAsset.owner_osint.founder_name}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Tenure:{" "}
                          <strong className="text-white">
                            {currentAsset.owner_osint.tenure_years} years
                          </strong>{" "}
                          • Age Bracket:{" "}
                          <strong className="text-white">
                            {currentAsset.owner_osint.owner_age_bracket}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentAsset.owner_osint.criminal_background_clearance && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Criminal Clearance Clean
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Direct Contacts Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                      {Object.entries(currentAsset.owner_osint.direct_contacts).map(
                        ([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            {key.includes("phone") ? (
                              <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            ) : key.includes("email") ? (
                              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            )}
                            <span className="text-zinc-400 capitalize">
                              {key.replace("_", " ")}:
                            </span>
                            <span className="font-semibold text-white select-all">{val}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Professional Licensing & Good Standing */}
                  <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-400" />
                      State Licensing & Board Good Standing
                    </h4>
                    <div className="space-y-2">
                      {currentAsset.owner_osint.professional_licenses.map((lic, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50"
                        >
                          <div>
                            <span className="font-semibold text-white block">{lic.board}</span>
                            <span className="text-zinc-400 font-mono">
                              License: {lic.license_no}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-500/30">
                            {lic.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Litigation & Regulatory Screening */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                        Court Litigation Screening
                      </span>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Civil Judgments:</span>
                        <span className="font-bold text-emerald-400">
                          {currentAsset.owner_osint.litigation_screening.civil_judgments ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Commercial Tax Liens:</span>
                        <span className="font-bold text-emerald-400">
                          {currentAsset.owner_osint.litigation_screening.commercial_tax_liens ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Bankruptcy History:</span>
                        <span className="font-bold text-emerald-400">
                          {currentAsset.owner_osint.litigation_screening.bankruptcy_history ?? "NONE"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                        Reputation & Community Standing
                      </span>
                      <p className="text-xs text-zinc-300">
                        {currentAsset.owner_osint.public_reputation_summary}
                      </p>
                      <span className="text-[10px] text-zinc-500 block pt-1">
                        Verified at: {currentAsset.owner_osint.verified_at?.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  {/* OCCRP FollowTheMoney Beneficial Ownership & Corporate Network */}
                  {currentAsset.owner_osint.beneficial_ownership && (
                    <div className="bg-zinc-900/80 p-4 rounded-xl border border-purple-900/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <Network className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            OCCRP FollowTheMoney Beneficial Ownership (UBO) Graph
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                            Risk Score: {currentAsset.owner_osint.beneficial_ownership.entity_risk_score}/100 (Clean)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                            OFAC/FinCEN: Clean
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {currentAsset.owner_osint.beneficial_ownership.resolution_narrative}
                      </p>

                      {/* Corporate Network Nodes & Relationships */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                          Verified Holding &amp; Operating Structure:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {currentAsset.owner_osint.beneficial_ownership.relationships?.map((rel: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-2"
                            >
                              <span className="text-purple-400 font-mono text-[10px] mt-0.5 font-bold">➔</span>
                              <div className="text-[11px] text-zinc-300">
                                <span className="font-semibold text-white block">{rel.relation}</span>
                                <span className="text-zinc-400">{rel.details}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Engine 3: OpenSanctions & Yente AML/KYC Clearance Certificate */}
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-indigo-900/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          OpenSanctions &amp; Yente AML / KYC Compliance Clearance
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Automated screening across OFAC SDN, BIS Entity List, EU Sanctions, UN SC, and PEP registers.
                        </p>
                      </div>
                      <button
                        onClick={handleScreenKyc}
                        disabled={screeningKyc}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{screeningKyc ? "Screening Watchlists..." : "Generate Yente Certificate"}</span>
                      </button>
                    </div>

                    {kycCertificate ? (
                      <div className="space-y-2.5 pt-1 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-emerald-800/60">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <div>
                              <span className="font-bold text-emerald-300 font-mono">
                                {kycCertificate.clearance_disposition}
                              </span>
                              <span className="text-[10px] text-zinc-400 block font-mono">
                                Cert ID: {kycCertificate.certificate_id} • Screener: {kycCertificate.screener_role}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                            Risk: {kycCertificate.risk_score_basis_points} bps (CLEAN)
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">SHA-256 Cryptographic Digest:</span>
                          <span className="text-indigo-300 break-all">{kycCertificate.sha256_fingerprint}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                        <span>Zero sanctions hits logged. Click button to run real-time cryptographic AML audit.</span>
                        <span className="text-[10px] font-mono text-zinc-500">6 Global Datasets</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-zinc-800/20 border border-zinc-800 rounded-xl space-y-4">
                  <UserCheck className="w-12 h-12 text-zinc-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Deep Agentic OSINT Not Yet Run
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                      Trigger on-demand background intelligence to verify founder age bracket,
                      state licensing, civil judgments, and direct executive contact info.
                    </p>
                  </div>
                  <button
                    onClick={handleRunOsint}
                    disabled={loadingOsint}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loadingOsint ? "Querying State Registries & Courts..." : "Run Deep Agentic OSINT"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: ALADDIN INSTITUTIONAL UNDERWRITING & COMPS (ENGINES 2, 4, 5) */}
          {activeTab === "UNDERWRITING" && (
            <div className="space-y-6">
              {/* Header Overview Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/60 to-zinc-900 p-4 rounded-xl border border-purple-800/40">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-400" />
                    <span>Institutional Aladdin Underwriting &amp; Multi-Engine Comps</span>
                  </h3>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Deterministic SBA SOP 50 10 8.1 capital stacks, SEC EDGAR XBRL valuation arbitrage, OpenBB SOFR rate shocks, and IRS tax schedule auditing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-600/40">
                    Pure Python Decimal • 0 Floats
                  </span>
                </div>
              </div>

              {/* MODULE 1: SEC EDGAR Public Comps & Valuation Multiple Arbitrage (Engine 2) */}
              <div className="bg-zinc-900/70 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      SEC EDGAR XBRL Public Comps &amp; Valuation Multiple Arbitrage
                    </h4>
                    <InfoPop term="MULTIPLE_ARBITRAGE" size="xs" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    NAICS: {currentAsset.naics_code || "5412"} • SEC.gov Live Multiples
                  </span>
                </div>

                {loadingEdgar ? (
                  <div className="text-center py-6 text-xs text-zinc-400">
                    Resolving SEC EDGAR XBRL peer benchmarks &amp; multiple expansion spread...
                  </div>
                ) : edgarBenchmark ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Sector Peer Group</span>
                        <span className="font-semibold text-white truncate block">{edgarBenchmark.sector_name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">Peers: {edgarBenchmark.peer_tickers.join(", ")}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Public Median EV/EBITDA</span>
                        <span className="text-base font-extrabold text-blue-400">{edgarBenchmark.median_ev_ebitda}x</span>
                        <span className="text-[10px] font-mono text-zinc-500">P25-P75: {edgarBenchmark.p25_ev_ebitda}x - {edgarBenchmark.p75_ev_ebitda}x</span>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Public Median P/E</span>
                        <span className="text-base font-bold text-white">{edgarBenchmark.median_pe_multiple}x</span>
                        <span className="text-[10px] font-mono text-zinc-500">D/E Ratio: {edgarBenchmark.median_debt_to_equity}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Median FCF Yield</span>
                        <span className="text-base font-bold text-emerald-400">{edgarBenchmark.median_fcf_yield_pct}%</span>
                        <span className="text-[10px] font-mono text-zinc-500">Free Cash Flow</span>
                      </div>
                    </div>

                    {/* Arbitrage Spread Card */}
                    {arbitrageResult && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-purple-950/40 border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">
                            {arbitrageResult.arbitrage_tier.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300">
                              Private Entry: <strong className="text-white">{arbitrageResult.private_entry_multiple}x</strong>
                            </span>
                            <span className="text-zinc-500">➔</span>
                            <span className="text-zinc-300">
                              Public Exit: <strong className="text-blue-300">{arbitrageResult.public_median_multiple}x</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-600/40">
                              +{arbitrageResult.multiple_expansion_spread}x Spread
                            </span>
                          </div>
                        </div>
                        <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-4">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                            Multiple Expansion Arbitrage Gain
                          </span>
                          <span className="text-base font-extrabold text-emerald-400">
                            +{formatUSD(arbitrageResult.immediate_arbitrage_gain_usd)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* MODULE 2: OpenBB Macro SOFR Yield Curve & Stress Testing (Engine 5) */}
              <div className="bg-zinc-900/70 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      OpenBB Macro SOFR Yield Curve &amp; Dynamic Rate Shock Engine
                    </h4>
                  </div>
                  <button
                    onClick={handleRunMacroSofr}
                    disabled={runningMacro}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{runningMacro ? "Simulating Rate Shocks..." : "Run 5-Scenario Macro Stress Test"}</span>
                  </button>
                </div>

                {/* Active Reference Yield Curve */}
                {yieldCurve && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">1M SOFR</span>
                      <span className="font-mono font-bold text-white">{(parseFloat(yieldCurve.sofr_1m_rate) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">3M SOFR</span>
                      <span className="font-mono font-bold text-white">{(parseFloat(yieldCurve.sofr_3m_rate) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">10Y US Treasury</span>
                      <span className="font-mono font-bold text-white">{(parseFloat(yieldCurve.treasury_10y_rate) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">WSJ Prime</span>
                      <span className="font-mono font-bold text-amber-400">{(parseFloat(yieldCurve.wsj_prime_rate) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">SBA SOP Cap</span>
                        <InfoPop term="SBA_SOP_50_10_8_1" size="xs" />
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{(parseFloat(yieldCurve.sba_max_rate_prime_plus_275) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                )}

                {/* Macro Stress Scenarios Results Table */}
                {macroMatrix && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300">
                        Stress Matrix Evaluation (Principal: {formatUSD(macroMatrix.loan_principal_usd)} • {macroMatrix.amortization_years}yr Amortization)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                        Fragility: {macroMatrix.overall_fragility_tier}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                          <tr>
                            <th className="p-2.5">Scenario</th>
                            <th className="p-2.5">Rate Shock</th>
                            <th className="p-2.5">All-In Rate</th>
                            <th className="p-2.5">Annual Debt Service</th>
                            <th className="p-2.5">
                              <div className="flex items-center gap-1">
                                <span>Stressed DSCR</span>
                                <InfoPop term="STRESS_DSCR" size="xs" />
                              </div>
                            </th>
                            <th className="p-2.5">Covenant Headroom</th>
                            <th className="p-2.5">Compliance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-mono">
                          {macroMatrix.scenarios.map((scen) => (
                            <tr key={scen.scenario_id} className="hover:bg-zinc-800/40">
                              <td className="p-2.5 font-bold text-white font-sans">{scen.scenario_name}</td>
                              <td className="p-2.5 text-zinc-400">+{scen.rate_shock_bps} bps</td>
                              <td className="p-2.5 text-amber-300">{(parseFloat(scen.resulting_interest_rate) * 100).toFixed(2)}%</td>
                              <td className="p-2.5 text-zinc-200">{formatUSD(scen.stressed_annual_debt_service_usd)}</td>
                              <td className="p-2.5">
                                <span className={`font-bold px-1.5 py-0.5 rounded ${parseFloat(scen.stressed_dscr) >= 1.25 ? "bg-emerald-950 text-emerald-300" : parseFloat(scen.stressed_dscr) >= 1.15 ? "bg-amber-950 text-amber-300" : "bg-rose-950 text-rose-300"}`}>
                                  {scen.stressed_dscr}x
                                </span>
                              </td>
                              <td className="p-2.5 text-zinc-300">{formatUSD(scen.covenant_headroom_usd)}</td>
                              <td className="p-2.5 font-sans">
                                {scen.meets_principal_hurdle_1_15x ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Passes
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> Breached
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* MODULE 3: Unstructured IRS Tax Return & Sched C / 1120-S OCR Parser (Engine 4) */}
              <div className="bg-zinc-900/70 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Unstructured IRS Tax Return &amp; Schedule C / 1120-S OCR Auditor
                    </h4>
                    <InfoPop term="SCHEDULE_C_ADD_BACK" size="xs" />
                  </div>
                  <button
                    onClick={handleSimulateTaxParse}
                    disabled={parsingTax}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{parsingTax ? "Parsing Form 1040 Schedule C..." : "Simulate IRS Schedule C OCR Ingestion"}</span>
                  </button>
                </div>

                {taxReport ? (
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Line 1 Gross Receipts</span>
                        <span className="font-extrabold text-white text-sm">{formatUSD(taxReport.gross_receipts_usd)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Line 4 COGS</span>
                        <span className="font-bold text-zinc-300 text-sm">{formatUSD(taxReport.cost_of_goods_sold_usd)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Line 13 Depreciation</span>
                        <span className="font-bold text-emerald-400 text-sm">{formatUSD(taxReport.depreciation_amortization_usd)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Line 31 Net Profit</span>
                        <span className="font-extrabold text-white text-sm">{formatUSD(taxReport.net_taxable_income_usd)}</span>
                      </div>
                    </div>

                    {/* Quality of Earnings Post-$85k GM Deduction Audit */}
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Quality of Earnings Add-Back &amp; Normalized EBITDA Audit</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          Post-GM EBITDA: {formatUSD(taxReport.qoe_audit_result.adjusted_ebitda_post_gm_usd)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300">
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">Verified Add-Backs</span>
                          <span className="font-bold text-emerald-400">+{formatUSD(taxReport.qoe_audit_result.verified_addbacks_usd)}</span>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">Mandatory GM Deduction</span>
                          <span className="font-bold text-rose-400">-{formatUSD(taxReport.qoe_audit_result.replacement_gm_deduction_usd)}</span>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">12-Mo NWC Peg Average</span>
                          <span className="font-bold text-blue-400">{formatUSD(taxReport.qoe_audit_result.working_capital_peg_12m_avg_usd)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                    <span>Simulates OCR line item extraction for Schedule C / 1120-S and tests automatic add-back auditor disallowances.</span>
                    <span className="text-[10px] font-mono text-zinc-500">IRS Form 1040 / 1120-S</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: AUGURY ASSETHEALTH™ PHYSICAL AI */}
          {activeTab === "ASSET_HEALTH" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-800/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold text-white text-base">
                      Augury-Inspired AssetHealth™ Industrial Sentinel
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-700/80 text-amber-300 font-bold">
                      Physical AI
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Deterministic machine health, aerial roof sentinel, 3-year capex curves, operational drift, and maintenance ledger audits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAssetHealth}
                  disabled={loadingHealth}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Activity className={`w-3.5 h-3.5 ${loadingHealth ? "animate-spin" : ""}`} />
                  <span>{loadingHealth ? "Auditing Physical Assets..." : "Re-Scan Physical Assets"}</span>
                </button>
              </div>

              {loadingHealth && !assetHealth ? (
                <div className="p-12 text-center text-zinc-400 space-y-3">
                  <Activity className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Running 5 Augury Physical AI Engines across machinery &amp; parcels...</p>
                  <p className="text-xs text-zinc-500">Querying Docling table parser, TorchGeo satellite sentinel, and Darts capex curves.</p>
                </div>
              ) : assetHealth ? (
                <div className="space-y-5">
                  {/* Top Score & Holdback Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Overall Score */}
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AssetHealth™ Score</span>
                      <div className="flex items-baseline gap-2 my-1">
                        <span className="text-3xl font-extrabold text-amber-400">{assetHealth.overall_health_score}</span>
                        <span className="text-xs text-zinc-500 font-mono">/ 100</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">Composite physical condition</span>
                    </div>

                    {/* Physical Risk Grade */}
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Physical Risk Grade</span>
                      <div className="my-1">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-extrabold border ${
                          assetHealth.physical_risk_grade === "GRADE_A"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                            : assetHealth.physical_risk_grade === "GRADE_B"
                            ? "bg-blue-950/80 text-blue-300 border-blue-700"
                            : assetHealth.physical_risk_grade === "GRADE_C"
                            ? "bg-amber-950/80 text-amber-300 border-amber-700"
                            : "bg-rose-950/80 text-rose-300 border-rose-700"
                        }`}>
                          {assetHealth.physical_risk_grade.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {assetHealth.critical_failure_items_count > 0
                          ? `${assetHealth.critical_failure_items_count} critical items flagged`
                          : "No critical failure items"}
                      </span>
                    </div>

                    {/* 3-Year Capex Reserve */}
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">3-Yr Capex Reserve</span>
                      <div className="my-1">
                        <span className="text-2xl font-extrabold text-rose-400">
                          {formatUSD(assetHealth.total_deferred_capex_usd)}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">Mandatory equipment reserve</span>
                    </div>

                    {/* Escrow Holdback */}
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Seller Escrow Holdback</span>
                      <div className="my-1">
                        <span className="text-2xl font-extrabold text-emerald-400">
                          {formatUSD(assetHealth.recommended_escrow_holdback_usd)}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">Deducted from closing proceeds</span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                    <span className="font-bold text-amber-300 block mb-1">Underwriting Engineering Executive Summary:</span>
                    {assetHealth.executive_summary}
                  </div>

                  {/* 4 Deep Intelligence Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. TorchGeo Aerial Facility & Roof Sentinel */}
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white text-xs">TorchGeo Aerial Facility &amp; Roof Sentinel</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{assetHealth.aerial_report.imagery_source}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Roof Albedo Condition</span>
                          <span className="font-extrabold text-emerald-400 text-sm">
                            {assetHealth.aerial_report.roof_condition_score} / 100
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Estimated Roof Replacement</span>
                          <span className="font-bold text-rose-400 text-sm">
                            {formatUSD(assetHealth.aerial_report.estimated_roof_replacement_cost_usd)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Roof Surface Footprint</span>
                          <span className="font-bold text-zinc-200">
                            {parseFloat(assetHealth.aerial_report.roof_surface_area_sqft).toLocaleString()} sqft
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Yard Fleet Occupancy</span>
                          <span className="font-bold text-blue-400">
                            {assetHealth.aerial_report.yard_truck_occupancy_pct}%
                          </span>
                        </div>
                      </div>

                      {assetHealth.aerial_report.outdoor_scrap_anomaly_detected && (
                        <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 text-[11px] text-rose-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>Outdoor debris or scrap metal anomaly detected in yard apron. Requires environmental Phase I inspection.</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Darts 3-Year Predictive Capex Reserve */}
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <span className="font-bold text-white text-xs">Darts 3-Year Predictive Capex Reserve</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">Time-Series Forecast</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-zinc-500 block text-[10px]">Year 1 Capex</span>
                          <span className="font-extrabold text-rose-400">
                            {formatUSD(assetHealth.predictive_capex.year1_mandatory_capex_usd)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-zinc-500 block text-[10px]">Year 2 Capex</span>
                          <span className="font-bold text-amber-400">
                            {formatUSD(assetHealth.predictive_capex.year2_mandatory_capex_usd)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-zinc-500 block text-[10px]">Year 3 Capex</span>
                          <span className="font-bold text-blue-400">
                            {formatUSD(assetHealth.predictive_capex.year3_mandatory_capex_usd)}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Baseline DSCR vs Capex-Adjusted</span>
                          <span className="font-bold text-zinc-300">
                            {assetHealth.predictive_capex.baseline_annual_dscr}x &rarr;{" "}
                            <span className={parseFloat(assetHealth.predictive_capex.capex_adjusted_dscr) < 1.25 ? "text-rose-400" : "text-emerald-400"}>
                              {assetHealth.predictive_capex.capex_adjusted_dscr}x
                            </span>
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          assetHealth.predictive_capex.is_dscr_breached_by_capex
                            ? "bg-rose-950/60 text-rose-300 border-rose-800"
                            : "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                        }`}>
                          {assetHealth.predictive_capex.is_dscr_breached_by_capex ? "SBA 1.25x Floor Breached" : "SBA DSCR Compliant"}
                        </span>
                      </div>
                    </div>

                    {/* 3. Alibi-Detect Operational Drift */}
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-white text-xs">Alibi-Detect Operational Efficiency Drift</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">NAICS Baseline</span>
                      </div>

                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Observed Metric:</span>
                          <span className="font-bold text-white">{assetHealth.operational_drift.metric_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Target Value vs Benchmark:</span>
                          <span className="font-mono text-zinc-300">
                            {assetHealth.operational_drift.target_value} vs {assetHealth.operational_drift.naics_benchmark_value}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Drift Deviation:</span>
                          <span className="font-bold text-amber-400">{assetHealth.operational_drift.deviation_pct}%</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 leading-snug">
                        <span className="font-semibold text-zinc-300">Diagnosis: </span>
                        {assetHealth.operational_drift.diagnosis}
                      </div>
                    </div>

                    {/* 4. Cleanlab Maintenance Ledger Audit */}
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-white text-xs">Cleanlab Maintenance Ledger Audit</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {assetHealth.maintenance_audit.total_invoices_audited} Invoices Checked
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Disallowed Personal Add-Backs</span>
                          <span className="font-extrabold text-rose-400 text-sm">
                            {formatUSD(assetHealth.maintenance_audit.disallowed_unproven_maintenance_usd)}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {assetHealth.maintenance_audit.suspicious_invoices_count} Suspicious Items
                        </span>
                      </div>

                      {assetHealth.maintenance_audit.flagged_invoices && assetHealth.maintenance_audit.flagged_invoices.length > 0 && (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {assetHealth.maintenance_audit.flagged_invoices.map((inv, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] flex justify-between items-center">
                              <span className="text-zinc-300 truncate max-w-[200px]">{inv.vendor}: {inv.description}</span>
                              <span className="font-mono text-rose-400 font-bold">{formatUSD(inv.amount_usd)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {activeTab === "GOTHAM_ONTOLOGY" && (
            <div className="space-y-6">
              {loadingOntology ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-zinc-300">
                    Constructing Palantir Gotham™ Multi-Relational Knowledge Graph...
                  </p>
                  <p className="text-xs text-zinc-500">
                    Traversing Virginia SCC records, WDVA court dockets, deeds of trust, and Roanoke GIS parcel layers.
                  </p>
                </div>
              ) : ontologyGraph ? (
                <div className="space-y-6">
                  {/* 1. Header Metrics Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Total Nodes</span>
                      <span className="text-xl font-mono font-bold text-white">{ontologyGraph.total_nodes}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Semantic Entities</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Directed Edges</span>
                      <span className="text-xl font-mono font-bold text-white">{ontologyGraph.total_edges}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Legal &amp; Debt Links</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Graph Density</span>
                      <span className="text-xl font-mono font-bold text-indigo-400">{ontologyGraph.graph_density}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Network Connectivity</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Cross-Collateral</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {ontologyGraph.cross_collateralization_detected ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 border border-amber-800 text-amber-300">
                            DETECTED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                            UNENCUMBERED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Multi-Parcel Lien Cycle</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Key Leverage Hub</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 block truncate mt-1" title={ontologyGraph.leverage_hub_node_id}>
                        {ontologyGraph.leverage_hub_role}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Betweenness Centrality</span>
                    </div>
                  </div>

                  {/* 2. Executive Intel Summary */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        Palantir Gotham™ Epistemic Link Intelligence
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200/90 leading-relaxed font-sans">
                      {ontologyGraph.executive_intel_summary}
                    </p>
                  </div>

                  {/* 3. Shortest Fiduciary Leverage Path */}
                  <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wide">
                          Shortest Fiduciary Workout Path
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {ontologyGraph.shortest_leverage_path.length} Hops to Relief
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-2">
                      {ontologyGraph.shortest_leverage_path.map((nodeId, idx) => (
                        <React.Fragment key={idx}>
                          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-200 whitespace-nowrap shadow-sm">
                            {nodeId}
                          </div>
                          {idx < ontologyGraph.shortest_leverage_path.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* 4. Multi-Relational Knowledge Graph Nodes */}
                  <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wide">
                          Dynamic Ontology Objects ({ontologyGraph.nodes.length} Verified Nodes)
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Click Node to Inspect Properties</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {ontologyGraph.nodes.map((node) => (
                        <div
                          key={node.node_id}
                          onClick={() => setSelectedGraphNode(node)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                            selectedGraphNode?.node_id === node.node_id
                              ? "bg-indigo-950/50 border-indigo-500 text-white shadow-lg"
                              : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-indigo-300 border border-zinc-700">
                              {node.node_type}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              Conf: {(parseFloat(node.confidence_score) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="font-bold text-xs text-white truncate">{node.label}</p>
                          <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">ID: {node.node_id}</p>
                        </div>
                      ))}
                    </div>

                    {selectedGraphNode && (
                      <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-900/60 mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">
                            Node Properties: {selectedGraphNode.label}
                          </span>
                          <button
                            onClick={() => setSelectedGraphNode(null)}
                            className="text-[10px] text-zinc-400 hover:text-white"
                          >
                            Close
                          </button>
                        </div>
                        <div className="p-2 rounded bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono space-y-1 text-zinc-300">
                          {Object.entries(selectedGraphNode.properties).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-zinc-500">{k}:</span>
                              <span className="text-zinc-200">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                        {selectedGraphNode.provenance_sources && selectedGraphNode.provenance_sources.length > 0 && (
                          <div className="text-[10px] text-zinc-500">
                            <span className="font-semibold text-zinc-400">Provenance: </span>
                            {selectedGraphNode.provenance_sources.join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. Palantir Engine Action Center (Splink & Contour) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Splink Probabilistic Entity Linkage */}
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white text-xs">Splink Entity Resolution (Fellegi-Sunter)</span>
                        </div>
                        <button
                          onClick={runSplinkResolution}
                          disabled={resolvingSplink}
                          className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                        >
                          {resolvingSplink ? "Resolving..." : "Run Linkage"}
                        </button>
                      </div>

                      {splinkMatch ? (
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Match Probability:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {(parseFloat(splinkMatch.match_probability) * 100).toFixed(1)}% ({splinkMatch.match_tier})
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Jaro-Winkler Name Score:</span>
                            <span className="font-mono text-zinc-300">{splinkMatch.jaro_winkler_name_score}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Canonical Entity ID:</span>
                            <span className="font-mono text-indigo-300">{splinkMatch.canonical_entity_id}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 italic pt-1 border-t border-zinc-800">
                            {splinkMatch.epistemic_reasoning}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Executes probabilistic Fellegi-Sunter multi-modal record linkage across court dockets, Virginia SCC corporate records, and Roanoke GIS parcels.
                        </p>
                      )}
                    </div>

                    {/* Foundry Contour Micro-OLAP Vectorized Engine */}
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-white text-xs">Foundry Contour Micro-OLAP (DuckDB)</span>
                        </div>
                        <button
                          onClick={runContourMicroOlap}
                          disabled={loadingContour}
                          className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50"
                        >
                          {loadingContour ? "Running..." : "Execute OLAP"}
                        </button>
                      </div>

                      {contourResult ? (
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Execution Latency:</span>
                            <span className="font-mono font-bold text-cyan-400">{contourResult.execution_time_ms} ms</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Matched Distressed Assets:</span>
                            <span className="font-mono text-white">{contourResult.matched_records_count}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Aggregate Distressed EBITDA:</span>
                            <span className="font-mono text-emerald-400">{formatUSD(contourResult.aggregate_ebitda_usd)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Aggregate Cure/Acquisition Basis:</span>
                            <span className="font-mono text-amber-400">{formatUSD(contourResult.aggregate_cure_basis_usd)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          In-process vectorized columnar micro-OLAP analytical queries executing sub-50ms multi-dimensional aggregations over regional distressed assets.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB: SOURCING & DEBT RADAR (INVEN / REONOMY / PROPERTYRADAR / CHERRE) */}
          {activeTab === "SOURCING_RADAR" && (
            <div className="space-y-6">
              {/* Sourcing Intelligence Sub-nav */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setRadarSubTab("DEBT_WALL");
                    if (!debtRadarReport) loadDebtRadar();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-semibold ${
                    radarSubTab === "DEBT_WALL"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Debt Maturity Wall (Trepp)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRadarSubTab("LOOKALIKES");
                    if (!lookalikeReport) loadLookalikes();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-semibold ${
                    radarSubTab === "LOOKALIKES"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Radar className="w-3.5 h-3.5" />
                  <span>Semantic Lookalikes (Inven)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRadarSubTab("TITLE_CURATIVE");
                    if (!titleAuditReport) loadTitleAudit();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-semibold ${
                    radarSubTab === "TITLE_CURATIVE"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Title &amp; IRS 120-Day Clock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRadarSubTab("ZONING_PERMITS");
                    if (!zoningReport) loadZoning();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-semibold ${
                    radarSubTab === "ZONING_PERMITS"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Permits &amp; FAR Zoning (Cherre)</span>
                </button>
              </div>

              {/* 1. DEBT MATURITY WALL (REONOMY / TREPP) */}
              {radarSubTab === "DEBT_WALL" && (
                <div className="space-y-4">
                  {loadingDebtRadar ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      Scanning regional commercial mortgage maturity dockets &amp; interest rate shock envelopes...
                    </div>
                  ) : debtRadarReport ? (
                    <div className="space-y-4">
                      {/* Top Metrics Banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Target Regional Market
                          </span>
                          <span className="text-sm font-bold text-white mt-0.5 block">
                            {debtRadarReport.target_market}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {debtRadarReport.total_loans_tracked} Commercial Mortgages
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                              Total Maturing Debt Volume
                            </span>
                            <InfoPop term="DEBT_MATURITY_WALL" size="xs" />
                          </div>
                          <span className="text-sm font-extrabold text-rose-400 mt-0.5 block font-mono">
                            {formatUSD(debtRadarReport.total_maturing_debt_volume_usd)}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Maturing within &le; 24 Months
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            High Refinance Stress / Default
                          </span>
                          <span className="text-sm font-extrabold text-amber-400 mt-0.5 block font-mono">
                            {debtRadarReport.high_stress_loans_count} Loans Critical
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Post-Refi DSCR &lt; 1.05x
                          </span>
                        </div>
                      </div>

                      {/* Strategic Refinance Thesis Banner */}
                      <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-rose-400" />
                          <span className="font-bold text-rose-300 uppercase tracking-wide text-[11px]">
                            Trepp Refinance Cliff Thesis
                          </span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {debtRadarReport.refinance_stress_thesis}
                        </p>
                      </div>

                      {/* Interest Rate Shock Selector */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
                        <span className="font-semibold text-zinc-300">
                          Projected Refinance Benchmark Coupon:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { rate: 0.075, label: "7.50% (SOFR+200)" },
                            { rate: 0.0825, label: "8.25% (Base SOFR+275)" },
                            { rate: 0.090, label: "9.00% (High Stress)" },
                            { rate: 0.100, label: "10.00% (Severe Shock)" },
                          ].map((opt) => (
                            <button
                              key={opt.rate}
                              type="button"
                              onClick={() => {
                                setProjectedRefiRate(opt.rate);
                                loadDebtRadar(opt.rate);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition ${
                                Math.abs(projectedRefiRate - opt.rate) < 0.001
                                  ? "bg-rose-600 text-white"
                                  : "bg-zinc-900 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Maturing Commercial Mortgages Table */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Maturing Commercial Mortgages Schedule
                        </span>
                        <div className="space-y-2">
                          {debtRadarReport.loans.map((loan) => (
                            <div
                              key={loan.loan_id}
                              className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition space-y-2.5"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs">
                                      {loan.borrower_name}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500">
                                      Parcel: {loan.parcel_id}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-zinc-400 mt-0.5 block">
                                    Balance: {formatUSD(loan.current_balance_usd)} (Orig. {formatUSD(loan.original_principal_usd)}) • {loan.months_to_maturity} mos to maturity ({loan.maturity_date_iso})
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                    loan.distress_tier === "IMMINENT_DEFAULT"
                                      ? "bg-red-950 text-red-300 border border-red-800"
                                      : loan.distress_tier === "HIGH_REFINANCE_STRESS"
                                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                                      : "bg-blue-950 text-blue-300 border border-blue-800"
                                  }`}
                                >
                                  {loan.distress_tier.replace(/_/g, " ")} • Cliff Score {loan.refinance_cliff_score}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">Coupon Shock:</span>
                                  <span className="font-mono text-zinc-300 font-semibold">
                                    {loan.origination_coupon_pct}% &rarr; {loan.projected_refinance_coupon_pct}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">Annual Debt Service:</span>
                                  <span className="font-mono text-rose-300 font-semibold">
                                    {formatUSD(loan.current_annual_debt_service_usd)} &rarr; {formatUSD(loan.projected_annual_debt_service_usd)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">DSCR Compression:</span>
                                  <span
                                    className={`font-mono font-bold ${
                                      parseFloat(loan.refinanced_dscr) < 1.05
                                        ? "text-red-400"
                                        : "text-amber-400"
                                    }`}
                                  >
                                    {loan.current_dscr}x &rarr; {loan.refinanced_dscr}x
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">Historical EBITDA:</span>
                                  <span className="font-mono text-emerald-400 font-semibold">
                                    {formatUSD(loan.historical_ebitda_usd)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 2. SEMANTIC LOOKALIKES (INVEN) */}
              {radarSubTab === "LOOKALIKES" && (
                <div className="space-y-4">
                  {/* Search Query Input */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                      Inven Vectorized Sourcing Thesis
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={lookalikeSearchQuery}
                        onChange={(e) => setLookalikeSearchQuery(e.target.value)}
                        placeholder="Search operational profile, machinery, or industrial vertical..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => loadLookalikes(lookalikeSearchQuery)}
                        disabled={loadingLookalike}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
                      >
                        {loadingLookalike ? "Cloning..." : "Find Lookalikes"}
                      </button>
                    </div>
                  </div>

                  {loadingLookalike ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      Executing semantic embedding similarity across unlisted regional operating entities...
                    </div>
                  ) : lookalikeReport ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs">
                        <span className="font-bold text-rose-300 block mb-1">
                          Inven Sourcing Analysis ({lookalikeReport.total_matched} Matched Private Clones)
                        </span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {lookalikeReport.executive_summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lookalikeReport.candidates.map((cand) => (
                          <div
                            key={cand.candidate_id}
                            className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-white text-xs block">
                                  {cand.company_name}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {cand.city_and_state} • {cand.distance_miles} miles away
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                {(parseFloat(cand.semantic_similarity_score) * 100).toFixed(0)}% Similarity
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                              {cand.operational_thesis}
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[10px] font-mono">
                              <div>
                                <span className="text-zinc-500 block">Est. Normalized EBITDA:</span>
                                <span className="text-emerald-400 font-bold">
                                  {formatUSD(cand.estimated_ebitda_usd)}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">Estimated Asking Basis:</span>
                                <span className="text-zinc-200 font-bold">
                                  {formatUSD(cand.estimated_asking_basis_usd)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] pt-1 text-zinc-400">
                              <span>Fiduciary Route: <strong className="text-rose-300">{cand.contact_fiduciary_type}</strong></span>
                              <span className="font-mono text-zinc-500">NAICS {cand.naics_code}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 3. TITLE CURATIVE & IRS 120-DAY CLOCK (PROPERTYRADAR) */}
              {radarSubTab === "TITLE_CURATIVE" && (
                <div className="space-y-4">
                  {loadingTitleAudit ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      Querying recorded instruments, title encumbrance index &amp; IRS 120-day redemption clocks...
                    </div>
                  ) : titleAuditReport ? (
                    <div className="space-y-4">
                      {/* Title Clearance Status Header */}
                      <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-zinc-400">
                              Title Marketability Status:
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase font-mono ${
                                titleAuditReport.title_status === "TITLE_MARKETABLE_INSURABLE"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : titleAuditReport.title_status === "TITLE_CLOUDED_REDEMPTION_RISK"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-red-950 text-red-300 border border-red-800"
                              }`}
                            >
                              {titleAuditReport.title_status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 mt-1 block">
                            Parcel: {titleAuditReport.parcel_id} • Total Encumbrances: {formatUSD(titleAuditReport.total_encumbrance_basis_usd)} ({titleAuditReport.total_liens_count} Recorded Liens)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                              Recommended Escrow Holdback
                            </span>
                            <InfoPop term="TITLE_CURATIVE_HOLDBACK" size="xs" />
                          </div>
                          <span className="text-sm font-extrabold text-amber-400 font-mono">
                            {formatUSD(titleAuditReport.recommended_escrow_holdback_usd)}
                          </span>
                        </div>
                      </div>

                      {/* 26 U.S.C. § 7425 IRS 120-Day Statutory Redemption Alert */}
                      {titleAuditReport.irs_120_day_redemption_active ? (
                        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-amber-300 text-xs uppercase tracking-wide">
                                26 U.S.C. &sect; 7425 Statutory Redemption Period Active
                              </span>
                              <InfoPop term="IRS_120_DAY_REDEMPTION" size="xs" />
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-900/60 text-amber-200 border border-amber-700">
                              {titleAuditReport.irs_redemption_days_remaining} Days Remaining
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                            Under 26 U.S.C. &sect; 7425, the Internal Revenue Service retains a 120-day right of statutory redemption following non-judicial trustee foreclosure. A standard title policy will except this cloud unless an IRS Form 14135 Certificate of Discharge or affirmative escrow indemnity is secured prior to closing.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>IRS 120-day statutory redemption period has lapsed or does not apply to this title.</span>
                        </div>
                      )}

                      {/* Schedule of Recorded Encumbrances */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Recorded Encumbrance Schedule
                        </span>
                        <div className="space-y-2">
                          {titleAuditReport.liens.map((lien) => (
                            <div
                              key={lien.lien_id}
                              className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    {lien.lien_type.replace(/_/g, " ")}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">
                                    Doc #{lien.recording_instrument_no} ({lien.recorded_date_iso})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-rose-300">
                                    {formatUSD(lien.claimed_amount_usd)}
                                  </span>
                                  {lien.is_senior_priority && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                                      Senior Priority
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-zinc-400 font-sans">
                                <strong className="text-zinc-300">Curative Action: </strong>
                                {lien.curative_action_required}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Counsel Closing Opinion */}
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1">
                        <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
                          Title Counsel Opinion
                        </span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          {titleAuditReport.counsel_closing_opinion}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 4. PERMITS & FAR ZONING ENVELOPE (CHERRE / BOWERY) */}
              {radarSubTab === "ZONING_PERMITS" && (
                <div className="space-y-4">
                  {loadingZoning ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      Querying municipal building permit ledgers, FAR envelopes &amp; zoning ordinances...
                    </div>
                  ) : zoningReport ? (
                    <div className="space-y-4">
                      {/* Zoning Envelope Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Zoning Code &amp; Use Status
                          </span>
                          <span className="text-sm font-bold text-white mt-0.5 block">
                            {zoningReport.zone_code} • {zoningReport.permitted_use_status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate block">
                            {zoningReport.zone_description}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Floor Area Ratio (FAR)
                          </span>
                          <span className="text-sm font-extrabold text-white mt-0.5 block font-mono">
                            {zoningReport.current_far} / {zoningReport.max_allowable_far} Max FAR
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Footprint: {parseFloat(zoningReport.building_footprint_sqft).toLocaleString()} sqft
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Unused Expansion Potential
                          </span>
                          <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block font-mono">
                            +{parseFloat(zoningReport.expansion_potential_sqft).toLocaleString()} SQFT
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Permitted Building Envelope
                          </span>
                        </div>
                      </div>

                      {/* Unpermitted Alteration Risk Banner */}
                      {zoningReport.unpermitted_alteration_risk_detected ? (
                        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/60 text-xs flex items-start gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-amber-300">
                              Unpermitted Structural Alteration Risk Detected
                            </span>
                            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                              Municipal permit records reflect open citations or substantial interior industrial modifications without final certificate of occupancy. A physical engineering and code inspection is required prior to contract execution.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Municipal permit status clean. No unpermitted structural alteration citations on file.</span>
                        </div>
                      )}

                      {/* Municipal Building Permits Ledger */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Municipal Building Permits Ledger ({zoningReport.permits.length} Records)
                        </span>
                        <div className="space-y-2">
                          {zoningReport.permits.map((pmt) => (
                            <div
                              key={pmt.permit_id}
                              className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    {pmt.permit_type}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">
                                    Permit #{pmt.permit_id} ({pmt.issue_date_iso})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-emerald-400">
                                    Valuation: {formatUSD(pmt.estimated_valuation_usd)}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    {pmt.status}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-zinc-300 font-sans">
                                {pmt.description}
                              </p>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                Contractor: {pmt.contractor_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Analyst Zoning Summary */}
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1">
                        <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
                          Zoning &amp; Land Use Analysis
                        </span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          {zoningReport.analyst_zoning_summary}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* INSTITUTIONAL TITAN ANALYTICS SUITE (GOLDMAN/BLACKROCK/VANGUARD/JANE/BRIDGEWATER) */}
          {/* ========================================================================= */}
          {activeTab === "TITAN_ANALYTICS" && (
            <div className="space-y-6">
              {/* Titan Sub-Tab Navigation */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-semibold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setTitanSubTab("DAG_REACTIVE");
                    if (!dagReport) loadDagEvaluation();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    titanSubTab === "DAG_REACTIVE"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Goldman SecDB DAG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitanSubTab("PE_WATERFALL");
                    if (!waterfallReport) {
                      loadWaterfall();
                      loadConcentration();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    titanSubTab === "PE_WATERFALL"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-300" />
                  <span>BlackRock eFront Waterfall</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitanSubTab("TAX_ALPHA");
                    if (!tax1031Report) {
                      load1031Audit();
                      loadCostSegregation();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    titanSubTab === "TAX_ALPHA"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-300" />
                  <span>Vanguard Tax Alpha (§1031 / MACRS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitanSubTab("JANE_STREET_REPLAY");
                    if (!replayReport) loadEventReplay();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    titanSubTab === "JANE_STREET_REPLAY"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Jane Street Event Stream</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitanSubTab("MACRO_REGIME");
                    if (!macroRegimeReport) loadMacroRegime();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    titanSubTab === "MACRO_REGIME"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
                  <span>Bridgewater 4-Quadrant Macro</span>
                </button>
              </div>

              {/* 1. GOLDMAN SECDB / J.P. MORGAN ATHENA REACTIVE UNDERWRITING DAG */}
              {titanSubTab === "DAG_REACTIVE" && (
                <div className="space-y-4">
                  {/* Interactive Parameter Controls */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          Reactive DAG Underwriting Parameters
                        </span>
                        <InfoPop term="GOLDMAN_SECDB_DAG" size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={loadDagEvaluation}
                        disabled={loadingDag}
                        className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        {loadingDag ? "Evaluating..." : "Evaluate DAG (<50μs)"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block">Purchase Price ($)</label>
                        <input
                          type="number"
                          value={dagPurchasePrice}
                          onChange={(e) => setDagPurchasePrice(parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block">Buyer Cash Equity (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={dagBuyerEquityPct}
                          onChange={(e) => setDagBuyerEquityPct(parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block">SOFR Benchmark Rate</label>
                        <input
                          type="number"
                          step="0.001"
                          value={dagSofrRate}
                          onChange={(e) => setDagSofrRate(parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block">Historical EBITDA ($)</label>
                        <input
                          type="number"
                          value={dagEbitda}
                          onChange={(e) => setDagEbitda(parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {loadingDag ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      Executing topological sort &amp; reactive DAG memoized evaluation...
                    </div>
                  ) : dagReport ? (
                    <div className="space-y-4">
                      {/* Highlight Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Execution Latency</span>
                          <span className="text-lg font-extrabold text-cyan-400 font-mono mt-0.5 block">
                            {dagReport.execution_time_microseconds} μs
                          </span>
                          <span className="text-[10px] text-zinc-400 block">Sub-millisecond</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Caching Efficiency</span>
                          <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 block">
                            {dagReport.incremental_efficiency_pct}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            {dagReport.dirty_nodes_recalculated_count} of {dagReport.total_dag_nodes_count} recalculated
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-500">
                            <span>SBA SOP 50 10 8.1</span>
                            <InfoPop term="SBA_SOP_50_10_8_1" size="xs" />
                          </div>
                          <span className={`text-sm font-extrabold mt-1 block ${dagReport.is_sba_compliant ? "text-emerald-400" : "text-red-400"}`}>
                            {dagReport.is_sba_compliant ? "COMPLIANT (>=1.25x)" : "NON-COMPLIANT"}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">October 1, 2026 rules</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-500">
                            <span>Principal Hurdle</span>
                            <InfoPop term="BASE_DSCR" size="xs" />
                          </div>
                          <span className={`text-sm font-extrabold mt-1 block ${dagReport.is_principal_hurdle_passed ? "text-emerald-400" : "text-amber-400"}`}>
                            {dagReport.is_principal_hurdle_passed ? "PASSED (>=1.35x)" : "FAILED"}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">Post-$85k GM Deduction</span>
                        </div>
                      </div>

                      {/* DAG Formula Node Grid */}
                      <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                          Reactive Formula Nodes ({Object.keys(dagReport.computed_formulas).length} Computed)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {Object.entries(dagReport.computed_formulas).map(([k, v]) => (
                            <div key={k} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                              <div>
                                <span className="font-mono text-[10px] text-zinc-400 uppercase block">{k.replace(/_/g, " ")}</span>
                                <span className="font-mono font-bold text-white mt-0.5 block">{v}</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                                CACHED
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Executive Synthesis */}
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1">
                        <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
                          Goldman SecDB DAG Synthesis
                        </span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          {dagReport.executive_synthesis}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 2. BLACKROCK EFRONT WATERFALL & CITADEL CONCENTRATION */}
              {titanSubTab === "PE_WATERFALL" && (
                <div className="space-y-4">
                  {/* Parameter Controls */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          Private Capital Distribution Parameters
                        </span>
                        <InfoPop term="BLACKROCK_WATERFALL" size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          loadWaterfall();
                          loadConcentration();
                        }}
                        disabled={loadingWaterfall}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        {loadingWaterfall ? "Solving..." : "Solve 4-Tier Waterfall"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block">Distributable Proceeds ($)</label>
                        <input
                          type="number"
                          value={distributableProceeds}
                          onChange={(e) => setDistributableProceeds(parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block">LP Contributed Equity ($)</label>
                        <input
                          type="number"
                          value={lpCapital}
                          onChange={(e) => setLpCapital(parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 block">Preferred Return Hurdle</label>
                          <InfoPop term="PREFERRED_RETURN" size="xs" />
                        </div>
                        <span className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs block">
                          8.00% Annually
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 block">Carried Interest</label>
                          <InfoPop term="CARRIED_INTEREST" size="xs" />
                        </div>
                        <span className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs block">
                          20.00% to GP
                        </span>
                      </div>
                    </div>
                  </div>

                  {loadingWaterfall ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      Calculating BlackRock eFront 4-tier distribution waterfall...
                    </div>
                  ) : waterfallReport ? (
                    <div className="space-y-4">
                      {/* Metric Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">LP Total Received</span>
                          <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 block">
                            {formatUSD(waterfallReport.lp_total_received_usd)}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                            <span>MOIC: {waterfallReport.lp_moic}</span>
                            <InfoPop term="MOIC" size="xs" />
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">LP Annualized ROI</span>
                          <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                            {waterfallReport.lp_annualized_roi_pct}%
                          </span>
                          <span className="text-[10px] text-zinc-400 block">3.0 Year Hold</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">GP Total Received</span>
                          <span className="text-lg font-extrabold text-purple-400 font-mono mt-0.5 block">
                            {formatUSD(waterfallReport.gp_total_received_usd)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block font-mono">Carried Interest</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Structure</span>
                          <span className="text-sm font-extrabold text-zinc-200 mt-1 block">
                            {waterfallReport.waterfall_structure.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">European Whole-Fund</span>
                        </div>
                      </div>

                      {/* 4-Tier Breakdown Table */}
                      <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                          Distribution Tiers Breakdown
                        </span>
                        <div className="space-y-2">
                          {waterfallReport.tier_breakdown.map((tier) => (
                            <div key={tier.tier_number} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-white">Tier {tier.tier_number}: {tier.tier_name}</span>
                                <p className="text-[11px] text-zinc-400 mt-0.5">{tier.description}</p>
                              </div>
                              <div className="flex items-center gap-3 font-mono text-[11px]">
                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-500 block">LP Share</span>
                                  <span className="text-emerald-400 font-bold">{formatUSD(tier.lp_distribution_usd)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-500 block">GP Share</span>
                                  <span className="text-purple-400 font-bold">{formatUSD(tier.gp_distribution_usd)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-500 block">Total</span>
                                  <span className="text-white font-bold">{formatUSD(tier.total_tier_distribution_usd)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Citadel Concentration Limit Audit */}
                      {concentrationReport && (
                        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-blue-400" />
                                Citadel Factor Neutrality &amp; Concentration Limits
                              </span>
                              <InfoPop term="CITADEL_FACTOR_NEUTRALITY" size="xs" />
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              concentrationReport.is_all_concentration_limits_compliant ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
                            }`}>
                              {concentrationReport.is_all_concentration_limits_compliant ? "ALL LIMITS COMPLIANT" : "BREACH DETECTED"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500 uppercase block">Dry Powder Liquidity</span>
                                <InfoPop term="DRY_POWDER" size="xs" />
                              </div>
                              <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatUSD(concentrationReport.dry_powder_liquidity_usd)}</span>
                              <span className="text-[10px] text-emerald-400 font-mono">{concentrationReport.dry_powder_ratio_pct}% Available</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-zinc-500 uppercase block">Total Committed Capital</span>
                              <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatUSD(concentrationReport.total_committed_family_capital_usd)}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">Family Allocation</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-zinc-500 uppercase block">Active Deployed Positions</span>
                              <span className="text-sm font-bold text-white font-mono mt-0.5 block">{concentrationReport.active_deals_count} Deals</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{formatUSD(concentrationReport.total_deployed_equity_usd)} Deployed</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {concentrationReport.concentration_rules.map((rule, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-white">{rule.rule_name}</span>
                                  <span className="text-[10px] text-zinc-400 ml-2 font-mono">{rule.dimension_type}: {rule.target_identifier}</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                  <span className="text-zinc-300">{rule.current_allocation_pct}% / {rule.max_allowable_allocation_pct}% Max</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    !rule.is_breached ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
                                  }`}>
                                    {!rule.is_breached ? "PASS" : "BREACH"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* 3. VANGUARD & CPA TAX ALPHA (§ 1031 & COST SEGREGATION) */}
              {titanSubTab === "TAX_ALPHA" && (
                <div className="space-y-4">
                  {/* Section A: IRC § 1031 Exchange Countdown */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-400" />
                          26 U.S.C. § 1031 Like-Kind Exchange Statutory Timelines
                        </span>
                        <InfoPop term="SECTION_1031_EXCHANGE" size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={load1031Audit}
                        disabled={loading1031}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                      >
                        {loading1031 ? "Auditing..." : "Audit § 1031 Deadlines"}
                      </button>
                    </div>

                    {tax1031Report && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Projected Tax Deferral</span>
                            <span className="text-base font-extrabold text-amber-400 font-mono mt-0.5 block">
                              {formatUSD(tax1031Report.projected_tax_deferral_usd)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">@ {tax1031Report.effective_capital_gains_rate_pct}% Rate</span>
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block">45-Day ID Window</span>
                              <InfoPop term="ID_WINDOW_45_DAY" size="xs" />
                            </div>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {tax1031Report.days_remaining_45d_id} Days Left
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono block">Deadline: {tax1031Report.statutory_45_day_deadline_iso}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block">180-Day Close Window</span>
                              <InfoPop term="CLOSE_WINDOW_180_DAY" size="xs" />
                            </div>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {tax1031Report.days_remaining_180d_close} Days Left
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">Deadline: {tax1031Report.statutory_180_day_deadline_iso}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Net Equity Proceeds</span>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {formatUSD(tax1031Report.net_equity_proceeds_usd)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">Must be fully redeployed</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                          <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">CPA § 1031 Statutory Opinion</span>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">{tax1031Report.tax_opinion_summary}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section B: MACRS Cost Segregation & Bonus Depreciation */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          MACRS Cost Segregation &amp; Bonus Depreciation Shelter
                        </span>
                        <InfoPop term="MACRS_COST_SEGREGATION" size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={loadCostSegregation}
                        disabled={loadingCostSeg}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                      >
                        {loadingCostSeg ? "Analyzing..." : "Calculate Cost Seg"}
                      </button>
                    </div>

                    {costSegReport && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Year 1 Cash Tax Savings</span>
                              <InfoPop term="BONUS_DEPRECIATION" size="xs" />
                            </div>
                            <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 block">
                              {formatUSD(costSegReport.year_1_cash_tax_savings_usd)}
                            </span>
                            <span className="text-[10px] text-emerald-200/80 font-mono block">Direct Cash Alpha</span>
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">5-Year NPV Benefit</span>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {formatUSD(costSegReport.npv_5yr_tax_benefit_usd)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">@ 7% Discount Rate</span>
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Yr 1 Accelerated Deduction</span>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {formatUSD(costSegReport.year_1_accelerated_deduction_usd)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">vs {formatUSD(costSegReport.year_1_straight_line_deduction_usd)} Straight Line</span>
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Depreciable Basis</span>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {formatUSD(costSegReport.depreciable_basis_usd)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">Land: {formatUSD(costSegReport.land_value_non_depreciable_usd)}</span>
                          </div>
                        </div>

                        {/* Class Allocations Table */}
                        <div className="space-y-1.5">
                          {costSegReport.class_allocations.map((cls, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-white">{cls.description}</span>
                                <span className="text-[10px] text-zinc-400 ml-2 font-mono">
                                  {cls.allocation_pct}% of Depreciable Basis • Bonus: {cls.bonus_depreciation_pct}%
                                </span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-zinc-300">Basis: {formatUSD(cls.allocated_basis_usd)}</span>
                                <span className="text-emerald-400 font-bold">Yr 1 Depr: {formatUSD(cls.year_1_depreciation_usd)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. JANE STREET DETERMINISTIC EVENT STREAM REPLAY */}
              {titanSubTab === "JANE_STREET_REPLAY" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <GitCommit className="w-4 h-4 text-indigo-400" />
                          Canonical State Machine Event Replay
                        </span>
                        <InfoPop term="JANE_STREET_SMR" size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={loadEventReplay}
                        disabled={loadingReplay}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                      >
                        {loadingReplay ? "Replaying..." : "Replay Canonical State"}
                      </button>
                    </div>

                    {replayReport && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Hash Chain Verification</span>
                            <span className={`text-sm font-extrabold mt-1 block ${replayReport.is_hash_chain_valid ? "text-emerald-400" : "text-red-400"}`}>
                              {replayReport.is_hash_chain_valid ? "VALID HASH CHAIN" : "CHAIN CORRUPTED"}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">SHA-256 Provenance</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Events Replayed</span>
                            <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                              {replayReport.total_events_replayed} Events
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">Tip Seq: #{replayReport.tip_sequence_no}</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 col-span-2">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tip Event Hash</span>
                            <span className="text-xs font-mono font-bold text-indigo-300 mt-1 block truncate">
                              {replayReport.tip_event_hash}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block">
                              {replayReport.earliest_event_timestamp} to {replayReport.latest_event_timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Reconstructed State Parameters */}
                        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                            Byte-for-Byte Reconstructed Pipeline State
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                            {Object.entries(replayReport.reconstructed_state).map(([k, v]) => (
                              <div key={k} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                                <span className="text-[10px] text-zinc-500 uppercase block">{k.replace(/_/g, " ")}</span>
                                <span className="text-zinc-200 font-bold mt-0.5 block truncate">
                                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Audit Opinion */}
                        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1">
                          <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                            Jane Street SMR Audit Opinion
                          </span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                            {replayReport.statutory_audit_opinion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. BRIDGEWATER ASSOCIATES 4-QUADRANT MACRO REGIME */}
              {titanSubTab === "MACRO_REGIME" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          Bridgewater Associates 4-Quadrant Macro Economic Regime
                        </span>
                        <InfoPop term="BRIDGEWATER_MACRO_REGIME" size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={loadMacroRegime}
                        disabled={loadingMacroRegime}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                      >
                        {loadingMacroRegime ? "Simulating..." : "Simulate 4 Quadrants"}
                      </button>
                    </div>

                    {macroRegimeReport && (
                      <div className="space-y-4">
                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Resilience Score</span>
                            <span className="text-xl font-extrabold text-purple-400 font-mono mt-0.5 block">
                              {macroRegimeReport.composite_resilience_score} / 100
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">Composite Grade</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">All-Weather Rating</span>
                            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                              {macroRegimeReport.all_weather_grade.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-emerald-400 block">Dalio All-Weather</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Base DSCR</span>
                            <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                              {macroRegimeReport.base_dscr}x
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">Historical Coverage</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Primary Vulnerability</span>
                              <InfoPop term="STAGFLATION_SHOCK" size="xs" />
                            </div>
                            <span className="text-xs font-extrabold text-red-400 mt-1 block truncate">
                              {macroRegimeReport.most_severe_threat_quadrant.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-zinc-400 block">Severe Shock</span>
                          </div>
                        </div>

                        {/* 4-Quadrant Matrix */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {macroRegimeReport.quadrant_results.map((q) => {
                            const isSevere = q.quadrant === macroRegimeReport.most_severe_threat_quadrant;
                            return (
                              <div
                                key={q.quadrant}
                                className={`p-4 rounded-xl border text-xs space-y-2 transition ${
                                  isSevere
                                    ? "bg-red-950/30 border-red-500/50"
                                    : "bg-zinc-900/80 border-zinc-800"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-sm">{q.regime_name}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    q.solvency_status === "ROBUST_SOLVENT"
                                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                      : q.solvency_status === "MARGINAL_STRESS"
                                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                                      : "bg-red-950 text-red-300 border border-red-800"
                                  }`}>
                                    {q.solvency_status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                                  <span>Growth: {q.growth_trend}</span>
                                  <span>•</span>
                                  <span>Inflation: {q.inflation_trend}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                                  <div>
                                    <span className="text-[10px] text-zinc-500 block">Stressed Rev:</span>
                                    <span className="text-zinc-200 font-bold">{formatUSD(q.stressed_revenue_usd)}</span>
                                    <span className="text-[10px] text-zinc-500 block">({q.revenue_shock_pct} Shock)</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-zinc-500 block">Stressed EBITDA:</span>
                                    <span className="text-zinc-200 font-bold">{formatUSD(q.stressed_ebitda_usd)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-zinc-500 block">Debt Service:</span>
                                    <span className="text-zinc-200 font-bold">{formatUSD(q.stressed_annual_debt_service_usd)}</span>
                                    <span className="text-[10px] text-zinc-500 block">({q.rate_shock_bps})</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-zinc-500 block">Stressed DSCR:</span>
                                    <span className={`font-extrabold text-sm ${parseFloat(q.stressed_dscr) >= 1.25 ? "text-emerald-400" : parseFloat(q.stressed_dscr) >= 1.0 ? "text-amber-400" : "text-red-400"}`}>
                                      {q.stressed_dscr}x
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Recommended Hedging Strategy */}
                        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs space-y-1">
                          <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">
                            Recommended Institutional Hedging Strategy
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                            {macroRegimeReport.recommended_hedging_strategy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "OUTREACH" && (
            <div className="space-y-5">
              {/* Playbook Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPlaybookType("SUCCESSION_BUYOUT");
                    loadPlaybook("SUCCESSION_BUYOUT");
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    playbookType === "SUCCESSION_BUYOUT"
                      ? "bg-purple-950/40 border-purple-500/60 text-white"
                      : "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-purple-300">
                      Playbook A: Succession Buyout
                    </span>
                    {playbookType === "SUCCESSION_BUYOUT" && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Legacy preservation, respectful retirement transition, 100% confidential
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlaybookType("AI_MODERNIZATION");
                    loadPlaybook("AI_MODERNIZATION");
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    playbookType === "AI_MODERNIZATION"
                      ? "bg-blue-950/40 border-blue-500/60 text-white"
                      : "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-300">
                      Playbook B: AI Modernization
                    </span>
                    {playbookType === "AI_MODERNIZATION" && (
                      <Check className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Consulting-to-equity, operational streamlining, enterprise AI deployment
                  </p>
                </button>
              </div>

              {/* Playbook Preview & Copy */}
              {loadingPlaybook ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Synthesizing tailored executive correspondence...
                </div>
              ) : playbook ? (
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                      Subject Line
                    </span>
                    <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-white select-all">
                      {playbook.subject_line}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">
                        Executive Letter Body (Fiduciary Compliant)
                      </span>
                      <button
                        onClick={handleCopyPlaybook}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied!" : "Copy Full Letter"}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={11}
                      value={playbook.body_markdown}
                      className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 leading-relaxed focus:outline-none resize-none select-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                    <span>
                      Target: <strong className="text-white">{playbook.target_owner}</strong>
                    </span>
                    <span className="text-zinc-500">
                      Channels: {playbook.suggested_channels.join(" • ")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: CRM PIPELINE STAGES */}
          {activeTab === "PIPELINE" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Advance Asset in In-App Kanban CRM
              </h4>
              <p className="text-xs text-zinc-400">
                Track deal progression from initial radar bookmarking to closed acquisition.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {[
                  { stage: "SAVED" as PipelineStage, label: "1. Radar / Saved", desc: "Bookmarked for weekly review" },
                  { stage: "OUTREACH_PENDING" as PipelineStage, label: "2. Outreach Ready", desc: "Playbook synthesized, ready to dispatch" },
                  { stage: "IN_COMMUNICATION" as PipelineStage, label: "3. In Communication", desc: "Founder dialog open" },
                  { stage: "UNDER_DILIGENCE" as PipelineStage, label: "4. Under Diligence", desc: "QoE and site inspection active" },
                  { stage: "LOI_ISSUED" as PipelineStage, label: "5. LOI Issued", desc: "Acquisition or partnership term sheet" },
                  { stage: "CLOSED" as PipelineStage, label: "6. Closed Deal", desc: "Final agreement executed" },
                ].map((item) => {
                  const isCurrent = currentAsset.pipeline_stage === item.stage;
                  return (
                    <button
                      key={item.stage}
                      type="button"
                      disabled={updatingStage}
                      onClick={() => handleSetStage(item.stage)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isCurrent
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                          : "bg-zinc-800/40 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {isCurrent && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <p className={`text-[11px] mt-1 ${isCurrent ? "text-blue-100" : "text-zinc-500"}`}>
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            FIPS: {currentAsset.county} • Verified deterministic data engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

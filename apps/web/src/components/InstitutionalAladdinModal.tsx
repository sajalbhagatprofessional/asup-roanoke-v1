"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  TrendingUp,
  ShieldAlert,
  Layers,
  Zap,
  Activity,
  ArrowRight,
  ExternalLink,
  Info,
  DollarSign,
} from "lucide-react";
import {
  InstitutionalWaterfallResult,
  LiquidationFloorResult,
  RollUpClusterOpportunity,
  ShadowDistressOpportunity,
} from "../lib/types";
import {
  fetchRollUpClusters,
  fetchShadowPipeline,
  runInstitutionalWaterfall,
  runLiquidationFloor,
} from "../lib/api";

interface InstitutionalAladdinModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
}

export default function InstitutionalAladdinModal({
  isOpen,
  onClose,
  dealId,
}: InstitutionalAladdinModalProps) {
  const [activeTab, setActiveTab] = useState<
    "WATERFALL" | "LIQUIDATION" | "ROLLUP" | "SHADOW"
  >("WATERFALL");

  // Waterfall State
  const [purchasePrice, setPurchasePrice] = useState("2000000.00");
  const [ebitda, setEbitda] = useState("500000.00");
  const [seniorRate, setSeniorRate] = useState("0.105");
  const [waterfallResult, setWaterfallResult] =
    useState<InstitutionalWaterfallResult | null>(null);
  const [waterfallLoading, setWaterfallLoading] = useState(false);

  // Liquidation Floor State
  const [reAssessed, setReAssessed] = useState("2400000.00");
  const [equipAssessed, setEquipAssessed] = useState("750000.00");
  const [liquidationResult, setLiquidationResult] =
    useState<LiquidationFloorResult | null>(null);
  const [liquidationLoading, setLiquidationLoading] = useState(false);

  // Roll-Up Clusters State
  const [clusters, setClusters] = useState<RollUpClusterOpportunity[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  // Shadow Pipeline State
  const [shadowOpps, setShadowOpps] = useState<ShadowDistressOpportunity[]>([]);
  const [shadowLoading, setShadowLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      loadWaterfall();
      loadLiquidation();
      loadRollUps();
      loadShadow();
    }
  }, [isOpen]);

  const loadWaterfall = async () => {
    setWaterfallLoading(true);
    try {
      const res = await runInstitutionalWaterfall({
        purchase_price_usd: purchasePrice,
        working_capital_required_usd: "200000.00",
        closing_costs_usd: "50000.00",
        historical_normalized_ebitda_usd: ebitda,
        senior_debt_share_pct: "0.75",
        senior_interest_rate_pct: seniorRate,
        senior_amortization_years: 10,
        seller_note_share_pct: "0.10",
        seller_note_interest_rate_pct: "0.06",
        seller_note_standby_years: 3,
        preferred_equity_share_pct: "0.05",
        preferred_hurdle_rate_pct: "0.08",
        buyer_common_equity_usd: (
          (parseFloat(purchasePrice || "0") + 250000) *
          0.1
        ).toFixed(2),
      });
      setWaterfallResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setWaterfallLoading(false);
    }
  };

  const loadLiquidation = async () => {
    setLiquidationLoading(true);
    try {
      const res = await runLiquidationFloor({
        purchase_or_cure_price_usd: purchasePrice,
        real_estate_assessed_usd: reAssessed,
        equipment_floor_assessed_usd: equipAssessed,
        re_flv_factor: "0.65",
        re_olv_factor: "0.80",
        equipment_flv_factor: "0.45",
        equipment_olv_factor: "0.65",
      });
      setLiquidationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLiquidationLoading(false);
    }
  };

  const loadRollUps = async () => {
    setClustersLoading(true);
    try {
      const res = await fetchRollUpClusters();
      setClusters(res.clusters);
    } catch (err) {
      console.error(err);
    } finally {
      setClustersLoading(false);
    }
  };

  const loadShadow = async () => {
    setShadowLoading(true);
    try {
      const res = await fetchShadowPipeline();
      setShadowOpps(res.opportunities);
    } catch (err) {
      console.error(err);
    } finally {
      setShadowLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Dialog Card - Strictly Clamped to max-h-[86vh] */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[86vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-sans"
      >
        {/* Fixed Top Terminal Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-xs tracking-wider">BLK</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ALADDIN INSTITUTIONAL TERMINAL
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                  Risk &amp; Portfolio Intelligence
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Multi-Tranche Waterfall • SOFR Sensitivity • Liquidation Floors • Spatial Roll-Ups • Pre-Distress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close terminal"
            className="text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fixed Tab Switcher */}
        <div className="shrink-0 flex items-center space-x-1 px-4 sm:px-6 pt-2.5 border-b border-zinc-800 bg-zinc-950 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("WATERFALL")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "WATERFALL"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Waterfall &amp; SOFR Stress</span>
          </button>
          <button
            onClick={() => setActiveTab("LIQUIDATION")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "LIQUIDATION"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Liquidation Floor (FLV/OLV)</span>
          </button>
          <button
            onClick={() => setActiveTab("ROLLUP")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "ROLLUP"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Roll-Up Synthesizer ({clusters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("SHADOW")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "SHADOW"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Pre-Distress Pipeline ({shadowOpps.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {/* TAB 1: WATERFALL & SOFR */}
          {activeTab === "WATERFALL" && (
            <div className="space-y-6">
              {/* Parameter Inputs */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Purchase Price ($)
                  </label>
                  <input
                    type="text"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Normalized EBITDA ($)
                  </label>
                  <input
                    type="text"
                    value={ebitda}
                    onChange={(e) => setEbitda(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Senior Rate (SOFR+550)
                  </label>
                  <input
                    type="text"
                    value={seniorRate}
                    onChange={(e) => setSeniorRate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadWaterfall}
                    disabled={waterfallLoading}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    {waterfallLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Solving...</span>
                      </>
                    ) : (
                      <span>Run Aladdin Waterfall</span>
                    )}
                  </button>
                </div>
              </div>

              {waterfallResult && (
                <>
                  {/* Tranche Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                        Total Project Cost
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white font-mono mt-1">
                        ${parseFloat(waterfallResult.total_project_cost_usd).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Incl. $200k NWC Peg</div>
                    </div>
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl">
                      <div className="text-[10px] text-blue-400 uppercase font-semibold">
                        Senior Debt (75%)
                      </div>
                      <div className="text-base sm:text-lg font-bold text-blue-300 font-mono mt-1">
                        ${parseFloat(waterfallResult.senior_debt_amount_usd).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-blue-500/80 mt-1">
                        P&amp;I: ${parseFloat(waterfallResult.base_annual_debt_service_usd).toLocaleString()}/yr
                      </div>
                    </div>
                    <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                      <div className="text-[10px] text-amber-400 uppercase font-semibold">
                        Seller Note (10%)
                      </div>
                      <div className="text-base sm:text-lg font-bold text-amber-300 font-mono mt-1">
                        ${parseFloat(waterfallResult.seller_note_amount_usd).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-amber-500/80 mt-1">36m Standby Lock</div>
                    </div>
                    <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl">
                      <div className="text-[10px] text-purple-400 uppercase font-semibold">
                        Preferred Equity (5%)
                      </div>
                      <div className="text-base sm:text-lg font-bold text-purple-300 font-mono mt-1">
                        ${parseFloat(waterfallResult.preferred_equity_amount_usd).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-purple-500/80 mt-1">8% Compounding Hurdle</div>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                      <div className="text-[10px] text-emerald-400 uppercase font-semibold">
                        Common Equity (10%)
                      </div>
                      <div className="text-base sm:text-lg font-bold text-emerald-300 font-mono mt-1">
                        ${parseFloat(waterfallResult.sponsor_common_equity_usd).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-500/80 mt-1">
                        WACC: {waterfallResult.blended_cost_of_capital_pct}%
                      </div>
                    </div>
                  </div>

                  {/* CME SOFR Forward Curve Sensitivity Matrix */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      CME SOFR Forward Curve Macro Stress Matrix
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {waterfallResult.stress_scenarios.map((sc, i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-xl border ${
                            sc.is_solvent
                              ? "bg-zinc-900/60 border-zinc-800"
                              : "bg-rose-950/30 border-rose-800/50"
                          } space-y-2`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {sc.scenario_name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                                sc.is_solvent
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : "bg-rose-950 text-rose-300 border border-rose-800"
                              }`}
                            >
                              {sc.is_solvent ? "Solvent" : "Distressed"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div>
                              <div className="text-zinc-500 text-[10px]">Stressed DSCR</div>
                              <div className="text-zinc-200 font-bold">{sc.stressed_dscr}x</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 text-[10px]">Stressed EBITDA</div>
                              <div className="text-zinc-200 font-bold">
                                ${parseFloat(sc.stressed_ebitda_usd).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-500 text-[10px]">Annual Debt Service</div>
                              <div className="text-zinc-200 font-bold">
                                ${parseFloat(sc.annual_debt_service_usd).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-500 text-[10px]">Free Cash Flow</div>
                              <div
                                className={`font-bold ${
                                  parseFloat(sc.unlevered_free_cash_flow_usd) >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                ${parseFloat(sc.unlevered_free_cash_flow_usd).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exit Multiples & Equity Return Heatmap */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Equity Return Sensitivity Grid (MOIC / Annualized IRR)
                    </h4>
                    <div className="overflow-x-auto border border-zinc-800 rounded-xl custom-scrollbar">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-2.5 sm:p-3">Exit Horizon</th>
                            <th className="p-2.5 sm:p-3">Exit Multiple</th>
                            <th className="p-2.5 sm:p-3">Enterprise Value</th>
                            <th className="p-2.5 sm:p-3">Common Proceeds</th>
                            <th className="p-2.5 sm:p-3 text-emerald-400 font-bold">MOIC</th>
                            <th className="p-2.5 sm:p-3 text-emerald-400 font-bold">Equity IRR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                          {waterfallResult.returns_matrix.map((c, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/40 transition">
                              <td className="p-2.5 sm:p-3 text-white font-semibold">
                                Year {c.exit_year}
                              </td>
                              <td className="p-2.5 sm:p-3 text-zinc-300">{c.exit_multiple}x</td>
                              <td className="p-2.5 sm:p-3 text-zinc-300">
                                ${parseFloat(c.exit_enterprise_value_usd).toLocaleString()}
                              </td>
                              <td className="p-2.5 sm:p-3 text-zinc-300">
                                ${parseFloat(c.common_equity_proceeds_usd).toLocaleString()}
                              </td>
                              <td className="p-2.5 sm:p-3 font-bold text-emerald-300">{c.moic}x</td>
                              <td className="p-2.5 sm:p-3 font-bold text-emerald-400">
                                {c.annualized_irr_pct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: LIQUIDATION FLOOR */}
          {activeTab === "LIQUIDATION" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Real Estate Assessed ($)
                  </label>
                  <input
                    type="text"
                    value={reAssessed}
                    onChange={(e) => setReAssessed(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Equipment Floor Assessed ($)
                  </label>
                  <input
                    type="text"
                    value={equipAssessed}
                    onChange={(e) => setEquipAssessed(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadLiquidation}
                    disabled={liquidationLoading}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {liquidationLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Solving...</span>
                      </>
                    ) : (
                      <span>Solve Downside FLV Floor</span>
                    )}
                  </button>
                </div>
              </div>

              {liquidationResult && (
                <div className="space-y-4">
                  {/* Protection Banner */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      liquidationResult.is_100pct_principal_protected
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                        : "bg-amber-950/40 border-amber-800 text-amber-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {liquidationResult.is_100pct_principal_protected ? "🛡️" : "⚠️"}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">
                          {liquidationResult.is_100pct_principal_protected
                            ? "100% PRINCIPAL DOWNSIDE PROTECTION CONFIRMED"
                            : "UNPROTECTED PRINCIPAL BASIS AT RISK"}
                        </h3>
                        <p className="text-xs opacity-90 mt-0.5">
                          {liquidationResult.is_100pct_principal_protected
                            ? "Purchase basis is 100% covered by 60-day forced auction values (FLV) of real estate and machinery floors."
                            : `Purchase basis exceeds forced liquidation auction recovery by $${parseFloat(
                                liquidationResult.principal_at_risk_flv_usd
                              ).toLocaleString()}.`}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right font-mono shrink-0">
                      <div className="text-xs text-zinc-400">FLV Coverage</div>
                      <div className="text-lg font-bold">
                        {liquidationResult.flv_downside_coverage_ratio}x
                      </div>
                    </div>
                  </div>

                  {/* FLV & OLV Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="text-xs font-bold text-zinc-300 uppercase font-mono">
                        Forced Liquidation Value (FLV - 60 Day Auction)
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Real Estate FLV (65% factor):</span>
                          <span className="text-white">
                            ${parseFloat(liquidationResult.real_estate_flv_usd).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Machinery FLV (45% factor):</span>
                          <span className="text-white">
                            ${parseFloat(liquidationResult.equipment_flv_usd).toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-emerald-400">
                          <span>Total Forced Liquidation Floor:</span>
                          <span>
                            ${parseFloat(liquidationResult.total_forced_liquidation_usd).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="text-xs font-bold text-zinc-300 uppercase font-mono">
                        Orderly Liquidation Value (OLV - 6 Month Sale)
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Real Estate OLV (80% factor):</span>
                          <span className="text-white">
                            ${parseFloat(liquidationResult.real_estate_olv_usd).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Machinery OLV (65% factor):</span>
                          <span className="text-white">
                            ${parseFloat(liquidationResult.equipment_olv_usd).toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-blue-400">
                          <span>Total Orderly Liquidation Floor:</span>
                          <span>
                            ${parseFloat(liquidationResult.total_orderly_liquidation_usd).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROLL-UP SYNTHESIZER */}
          {activeTab === "ROLLUP" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-blue-300 flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Aladdin Platform Aggregation Engine:</strong> Automatically groups
                  active targets within regional clusters sharing complementary NAICS prefixes to
                  model multiple arbitrage on consolidated exit.
                </span>
              </div>

              {clustersLoading ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  Scanning regional deal clusters...
                </div>
              ) : clusters.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
                  No multi-deal clusters identified yet. Ingest more filings to synthesize roll-up platforms.
                </div>
              ) : (
                <div className="space-y-3">
                  {clusters.map((c) => (
                    <div
                      key={c.cluster_id}
                      className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 mr-2">
                            NAICS {c.primary_naics_prefix}
                          </span>
                          <h4 className="text-sm font-bold text-white inline-block">
                            {c.cluster_title}
                          </h4>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Targets: {c.deal_names.join(" • ")} ({c.deal_ids.length} platform assets)
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-[10px] text-zinc-500">Multiple Arbitrage</div>
                          <div className="text-emerald-400 font-bold text-sm">
                            +${parseFloat(c.multiple_arbitrage_value_usd).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-950 rounded-lg text-xs font-mono">
                        <div>
                          <div className="text-zinc-500 text-[10px]">Combined Asking Basis</div>
                          <div className="text-white font-bold">
                            ${parseFloat(c.total_asking_basis_usd).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[10px]">Blended Entry Multiple</div>
                          <div className="text-zinc-300 font-bold">{c.entry_blended_multiple}x</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[10px]">Platform Exit Multiple</div>
                          <div className="text-emerald-400 font-bold">{c.target_platform_multiple}x</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[10px]">Pro-Forma Platform EV</div>
                          <div className="text-white font-bold">
                            ${parseFloat(c.pro_forma_platform_ev_usd).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80">
                        &quot;{c.synergy_thesis}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHADOW PIPELINE */}
          {activeTab === "SHADOW" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-xs text-amber-300 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Pre-Distress Signal Intelligence:</strong> Identifies opportunities
                  3 to 9 months before bankruptcy or foreclosure dockets are formally published.
                </span>
              </div>

              {shadowLoading ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  Scanning UCC-1 and tax lien dockets...
                </div>
              ) : shadowOpps.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
                  No pre-distress filings detected in active target counties.
                </div>
              ) : (
                <div className="space-y-3">
                  {shadowOpps.map((opp) => (
                    <div
                      key={opp.opportunity_id}
                      className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-bold">
                              {opp.maturity_tier}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">
                              Lead Time: ~{opp.lead_time_days} days
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {opp.entity_name}
                          </h4>
                          <div className="text-xs text-zinc-400">
                            {opp.naics_title} • {opp.jurisdiction_name}
                          </div>
                        </div>

                        <div className="text-right font-mono self-start sm:self-center">
                          <div className="text-[10px] text-zinc-500">Unpaid Lien Stack</div>
                          <div className="text-rose-400 font-bold text-sm">
                            ${parseFloat(opp.unpaid_lien_amount_usd).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs space-y-1">
                        <div className="text-zinc-400 font-semibold flex items-center space-x-1.5">
                          <span>🎯</span>
                          <span>Operator Warm Engagement Strategy:</span>
                        </div>
                        <p className="text-zinc-300">{opp.operator_action_strategy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer - Always Visible on Any Viewport */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-zinc-800 bg-zinc-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Deterministic Pure Decimal Math • Zero Floats • SBA SOP 50 10 8.1 Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
}

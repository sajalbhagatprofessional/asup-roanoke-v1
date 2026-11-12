"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Info,
  Sliders,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { fetchSensitivityMatrix } from "../lib/api";
import { SensitivityMatrixCell, SensitivityMatrixResponse } from "../lib/types";

interface Props {
  dealId?: string;
  defaultEbitda?: string;
  defaultLoan?: string;
  defaultEquity?: string;
}

export default function AladdinSensitivityHeatmap({
  dealId,
  defaultEbitda = "520000.00",
  defaultLoan = "2250000.00",
  defaultEquity = "125000.00",
}: Props) {
  const [data, setData] = useState<SensitivityMatrixResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<SensitivityMatrixCell | null>(null);

  // Form parameters
  const [ebitda, setEbitda] = useState(defaultEbitda);
  const [loan, setLoan] = useState(defaultLoan);
  const [equity, setEquity] = useState(defaultEquity);

  const loadMatrix = async (ebitdaVal: string, loanVal: string, equityVal: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSensitivityMatrix({
        deal_id: dealId,
        adjusted_ebitda_post_gm_usd: ebitdaVal,
        sba_7a_loan_usd: loanVal,
        buyer_cash_equity_usd: equityVal,
      });
      setData(res);
      // Select baseline cell by default
      if (res.matrix && res.matrix[0] && res.matrix[0][0]) {
        setSelectedCell(res.matrix[3][4] || res.matrix[0][0]); // -15% / +200 bps
      }
    } catch (err: any) {
      setError(err.message || "Failed to solve sensitivity matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix(ebitda, loan, equity);
  }, [dealId]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    loadMatrix(ebitda, loan, equity);
  };

  const getTierColor = (cell: SensitivityMatrixCell) => {
    switch (cell.risk_tier) {
      case "SAFE_IN_BOX":
        return "bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700/60 text-emerald-300";
      case "WATCH_STRESSED":
        return "bg-amber-950/80 hover:bg-amber-900 border-amber-600/60 text-amber-300";
      case "MARGINAL_COVERAGE":
        return "bg-orange-950/80 hover:bg-orange-900 border-orange-600/60 text-orange-300";
      case "BREACH_INSOLVENT":
      default:
        return "bg-rose-950/80 hover:bg-rose-900 border-rose-700/60 text-rose-300";
    }
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              Aladdin 2D Stress Sensitivity Heatmap
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-400">
              Pure Decimal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dynamic NxM matrix evaluating DSCR and Cash-on-Cash across Revenue Compression vs. SOFR Rate Shocks.
          </p>
        </div>

        {/* Quick Parameters Form */}
        <form onSubmit={handleApply} className="flex items-center space-x-2 shrink-0">
          <div>
            <label className="text-[10px] text-slate-400 block font-mono">EBITDA ($)</label>
            <input
              type="text"
              value={ebitda}
              onChange={(e) => setEbitda(e.target.value)}
              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-mono">Loan ($)</label>
            <input
              type="text"
              value={loan}
              onChange={(e) => setLoan(e.target.value)}
              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-[11px]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="apple-press mt-3.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
          >
            {loading ? "Solving..." : "Recalculate"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300">
          {error}
        </div>
      )}

      {/* 2D Heatmap Grid */}
      {data && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Revenue \ Rate Shock
                </th>
                {data.rate_shock_bps_steps.map((bps) => (
                  <th
                    key={bps}
                    className="p-2 text-[11px] font-mono font-bold text-slate-300 border-b border-slate-800"
                  >
                    +{bps} bps
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row, rIdx) => {
                const revLabel = data.revenue_steps[rIdx];
                const revPct = `${(parseFloat(revLabel) * 100).toFixed(0)}%`;
                return (
                  <tr key={revLabel} className="border-b border-slate-900/60">
                    <td className="p-2 text-left font-mono font-bold text-slate-300 bg-slate-900/40">
                      {revPct}
                    </td>
                    {row.map((cell, cIdx) => {
                      const isSelected =
                        selectedCell?.revenue_shock_pct === cell.revenue_shock_pct &&
                        selectedCell?.rate_shock_bps === cell.rate_shock_bps;

                      return (
                        <td key={cIdx} className="p-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCell(cell)}
                            className={`w-full py-1.5 px-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${getTierColor(
                              cell
                            )} ${isSelected ? "ring-2 ring-white scale-105 z-10 font-extrabold" : ""}`}
                          >
                            <div>{parseFloat(cell.dscr).toFixed(2)}x</div>
                            <div className="text-[9px] opacity-75">{cell.cash_on_cash_pct}</div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Cell Deep Inspector */}
      {selectedCell && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Scenario Inspection:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {selectedCell.revenue_shock_pct} Rev Compression • {selectedCell.rate_shock_bps} Rate Shock
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  selectedCell.is_mandate_compliant
                    ? "bg-emerald-950 border border-emerald-700 text-emerald-300"
                    : "bg-rose-950 border border-rose-700 text-rose-300"
                }`}
              >
                {selectedCell.risk_tier}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Effective Interest Rate:{" "}
              <span className="text-white font-mono font-medium">{selectedCell.effective_rate_pct}</span> |
              Mandate Threshold: <span className="text-emerald-400 font-mono">≥1.15x Stressed DSCR</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-mono">STRESSED DSCR</span>
              <span
                className={`text-sm font-mono font-extrabold ${
                  parseFloat(selectedCell.dscr) >= 1.35
                    ? "text-emerald-400"
                    : parseFloat(selectedCell.dscr) >= 1.15
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {parseFloat(selectedCell.dscr).toFixed(2)}x
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-mono">CASH-ON-CASH</span>
              <span className="text-sm font-mono font-bold text-sky-400">
                {selectedCell.cash_on_cash_pct}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-mono">NET CASH FLOW</span>
              <span className="text-sm font-mono font-bold text-white">
                ${(parseFloat(selectedCell.net_cash_flow_usd) / 1000).toFixed(0)}k/yr
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

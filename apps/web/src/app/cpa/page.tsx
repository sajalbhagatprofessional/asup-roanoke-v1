"use client";

import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Calculator,
} from "lucide-react";
import DealCard from "../../components/DealCard";
import { cpaAudit, fetchDeals } from "../../lib/api";
import { Deal } from "../../lib/types";

export default function CPAAuditPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Form state for CPA SOP 50 10 8.1 Audit
  const [projectCost, setProjectCost] = useState("2500000.00");
  const [appraisedCre, setAppraisedCre] = useState("1200000.00");
  const [sbaLoan, setSbaLoan] = useState("2250000.00");
  const [buyerCash, setBuyerCash] = useState("125000.00");
  const [sellerNote, setSellerNote] = useState("125000.00");
  const [standbyLock, setStandbyLock] = useState<number>(36);
  const [consultingMonths, setConsultingMonths] = useState<number>(12);
  const [adjustedEbitda, setAdjustedEbitda] = useState("520000.00");
  const [maintCapex, setMaintCapex] = useState("40000.00");
  const [cashTaxes, setCashTaxes] = useState("65000.00");

  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadCpaDeals = async () => {
    setLoading(true);
    try {
      const data = await fetchDeals("CPA");
      setDeals(data);
      if (data.length > 0 && !selectedDeal) {
        setSelectedDeal(data[0]);
      }
    } catch (err: any) {
      console.error("Failed to load CPA deals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCpaDeals();
  }, []);

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setSubmitting(true);
    setAuditResult(null);

    try {
      const res = await cpaAudit(selectedDeal.deal_id, {
        cpa_id: "cpa_1",
        total_project_cost_usd: projectCost,
        appraised_cre_usd: appraisedCre,
        sba_7a_loan_usd: sbaLoan,
        buyer_cash_equity_usd: buyerCash,
        seller_standby_note_usd: sellerNote,
        seller_standby_lock_months: Number(standbyLock),
        seller_consulting_months: Number(consultingMonths),
        adjusted_ebitda_post_gm_usd: adjustedEbitda,
        annual_maintenance_capex_usd: maintCapex,
        annual_cash_taxes_usd: cashTaxes,
      });
      setAuditResult(res);
      setActionMessage(
        `CPA Audit complete! Base DSCR: ${res.base_dscr}x (hurdle 1.35x), Stress DSCR: ${res.stress_dscr}x (hurdle 1.15x). SBA Compliant: ${res.is_sba_compliant}`
      );
      loadCpaDeals();
    } catch (err: any) {
      setActionMessage(`Audit failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>CPA SBA SOP 50 10 8.1 Underwriting Audit</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Effective Oct 1, 2026
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enforcing pure decimal.Decimal math, 50% Limited Equity cap, 36m standby lock, $85k GM salary deduction, and QoE trigger.
          </p>
        </div>

        <button
          onClick={loadCpaDeals}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main CPA Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deal Selector */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pipeline Deals ({deals.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Loading pipeline...
            </div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
              No deals currently in pipeline.
            </div>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.deal_id}
                onClick={() => setSelectedDeal(deal)}
                className={`cursor-pointer rounded-xl transition ${
                  selectedDeal?.deal_id === deal.deal_id
                    ? "ring-2 ring-emerald-500 shadow-md"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <DealCard deal={deal} currentRole="CPA" />
              </div>
            ))
          )}
        </div>

        {/* Right Column: Capital Structure & SOP 50 10 8.1 Audit Calculator */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Capital Structure &amp; Debt Service Coverage Audit
              </h2>
              <p className="text-xs text-slate-400">
                Target Deal:{" "}
                <span className="font-mono text-emerald-400">
                  {selectedDeal?.deal_id ?? "Select a deal"}
                </span>{" "}
                ({selectedDeal?.entity_name})
              </p>
            </div>
          </div>

          <form onSubmit={handleAuditSubmit} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Total Project Cost ($ USD)
                </label>
                <input
                  type="text"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Appraised Owner-Occupied CRE ($)
                </label>
                <input
                  type="text"
                  value={appraisedCre}
                  onChange={(e) => setAppraisedCre(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  SBA 7(a) Senior Loan ($)
                </label>
                <input
                  type="text"
                  value={sbaLoan}
                  onChange={(e) => setSbaLoan(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Buyer Cash Equity ($ &gt;= 5.0% Project)
                </label>
                <input
                  type="text"
                  value={buyerCash}
                  onChange={(e) => setBuyerCash(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Seller Standby Note ($)
                </label>
                <input
                  type="text"
                  value={sellerNote}
                  onChange={(e) => setSellerNote(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Seller Standby Lock (Months &gt;= 36m)
                </label>
                <input
                  type="number"
                  min="36"
                  value={standbyLock}
                  onChange={(e) => setStandbyLock(Number(e.target.value))}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Seller Consulting Agreement (&lt;= 24m)
                </label>
                <input
                  type="number"
                  max="24"
                  value={consultingMonths}
                  onChange={(e) => setConsultingMonths(Number(e.target.value))}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Adjusted EBITDA (Post-$85k GM Ded.)
                </label>
                <input
                  type="text"
                  value={adjustedEbitda}
                  onChange={(e) => setAdjustedEbitda(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Annual Maintenance CapEx ($)
                </label>
                <input
                  type="text"
                  value={maintCapex}
                  onChange={(e) => setMaintCapex(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Annual Cash Taxes ($)
                </label>
                <input
                  type="text"
                  value={cashTaxes}
                  onChange={(e) => setCashTaxes(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            {/* Audit Results Preview */}
            {auditResult && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-700 space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Base DSCR (Hurdle: 1.35x | SBA: 1.25x):</span>
                  <span
                    className={`font-bold ${
                      parseFloat(auditResult.base_dscr) >= 1.35
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {auditResult.base_dscr}x
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Stress DSCR (-15% Rev &amp; +200 bps Shock):</span>
                  <span
                    className={`font-bold ${
                      parseFloat(auditResult.stress_dscr) >= 1.15
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {auditResult.stress_dscr}x (Hurdle 1.15x)
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Buyer Unborrowed Cash Equity Share:</span>
                  <span className="text-white font-bold">
                    {(parseFloat(auditResult.buyer_cash_pct) * 100).toFixed(2)}% (&gt;=5.0% Required)
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Limited Equity Sources Share of Injection:</span>
                  <span className="text-white font-bold">
                    {(parseFloat(auditResult.limited_equity_share_pct) * 100).toFixed(2)}% (&lt;=50.0% Cap)
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Independent Quality of Earnings Triggered (&gt;=$3M ex-CRE):</span>
                  <span
                    className={`font-bold ${
                      auditResult.independent_qoe_required
                        ? "text-amber-400"
                        : "text-slate-300"
                    }`}
                  >
                    {auditResult.independent_qoe_required ? "YES (Mandatory)" : "NO"}
                  </span>
                </div>

                {auditResult.violations && auditResult.violations.length > 0 && (
                  <div className="p-2 rounded bg-red-950/80 border border-red-800 text-red-300 font-mono text-[11px]">
                    Violations: {auditResult.violations.join(", ")}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={submitting || !selectedDeal}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition shadow-sm"
              >
                {submitting ? "Auditing Debt Math..." : "Execute SBA SOP 50 10 8.1 Audit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

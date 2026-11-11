"use client";

import React, { useEffect, useState } from "react";
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import DealCard from "../../components/DealCard";
import AssetIntelligenceModal from "../../components/AssetIntelligenceModal";
import { counselReview, fetchDeals } from "../../lib/api";
import { Deal } from "../../lib/types";

export default function CounselReviewPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedOsintDeal, setSelectedOsintDeal] = useState<Deal | null>(null);

  // Form state for Counsel Statutory Audit
  const [noticePubDate, setNoticePubDate] = useState("2026-11-01");
  const [saleDate, setSaleDate] = useState("2026-11-19");
  const [seniorPayoff, setSeniorPayoff] = useState("950000.00");
  const [delinquentTax, setDelinquentTax] = useState("25000.00");
  const [trusteeFees, setTrusteeFees] = useState("15000.00");
  const [immediateCapex, setImmediateCapex] = useState("80000.00");
  const [verifiedAssessed, setVerifiedAssessed] = useState("1800000.00");
  const [dncVerified, setDncVerified] = useState(true);

  const [reviewResult, setReviewResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadCounselDeals = async () => {
    setLoading(true);
    try {
      const data = await fetchDeals("COUNSEL");
      setDeals(data);
      if (data.length > 0 && !selectedDeal) {
        setSelectedDeal(data[0]);
      }
    } catch (err: any) {
      console.error("Failed to load counsel deals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounselDeals();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setSubmitting(true);
    setReviewResult(null);

    try {
      const res = await counselReview(selectedDeal.deal_id, {
        counsel_id: "counsel_1",
        notice_published_date: noticePubDate,
        scheduled_sale_date: saleDate,
        senior_payoff_usd: seniorPayoff,
        delinquent_tax_usd: delinquentTax,
        trustee_fees_usd: trusteeFees,
        immediate_capex_usd: immediateCapex,
        verified_assessed_usd: verifiedAssessed,
      });
      setReviewResult(res);
      setActionMessage(
        `Counsel sign-off ${res.signoff_id} issued! Statutory notice lead: ${res.notice_lead_days} days (>=14d). Basis ratio: ${(parseFloat(res.basis_to_replacement_ratio)*100).toFixed(2)}% (<=70%).`
      );
      loadCounselDeals();
    } catch (err: any) {
      setActionMessage(`Review failed: ${err.message}`);
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
            <span>Counsel Title, Notice &amp; Foreclosure Review</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              Va. Code §§ 55.1-320 to 55.1-322
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mandatory 14-day statutory notice check, senior deed of trust lien audit, and &lt;= 70% cure basis gate.
          </p>
        </div>

        <button
          onClick={loadCounselDeals}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-700 text-indigo-200 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-indigo-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Review Layout: Split Deal Selector and Statutory Audit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deal Selector */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Diligence Queue ({deals.length} Deals)
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Loading diligence deals...
            </div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
              No deals currently pending Counsel diligence.
            </div>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.deal_id}
                onClick={() => setSelectedDeal(deal)}
                className={`cursor-pointer rounded-xl transition ${
                  selectedDeal?.deal_id === deal.deal_id
                    ? "ring-2 ring-indigo-500 shadow-md"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <DealCard
                  deal={deal}
                  currentRole="COUNSEL"
                  onViewOsint={(d) => setSelectedOsintDeal(d)}
                />
              </div>
            ))
          )}
        </div>

        {/* Right Column: Statutory Checklist & Review Form */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Virginia Non-Judicial Foreclosure Audit Form
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

          <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Notice Published Date
                </label>
                <input
                  type="date"
                  value={noticePubDate}
                  onChange={(e) => setNoticePubDate(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Scheduled Substitute Trustee Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Senior Deed of Trust Payoff ($)
                </label>
                <input
                  type="text"
                  value={seniorPayoff}
                  onChange={(e) => setSeniorPayoff(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Delinquent Real Estate Tax Arrears ($)
                </label>
                <input
                  type="text"
                  value={delinquentTax}
                  onChange={(e) => setDelinquentTax(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Trustee &amp; Legal Foreclosure Fees ($)
                </label>
                <input
                  type="text"
                  value={trusteeFees}
                  onChange={(e) => setTrusteeFees(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Immediate Stabilization CapEx ($)
                </label>
                <input
                  type="text"
                  value={immediateCapex}
                  onChange={(e) => setImmediateCapex(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium uppercase tracking-wider">
                  Verified Replacement / Assessed Value ($)
                </label>
                <input
                  type="text"
                  value={verifiedAssessed}
                  onChange={(e) => setVerifiedAssessed(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            {/* Statutory Compliance Checkboxes */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dnc"
                  checked={dncVerified}
                  onChange={(e) => setDncVerified(e.target.checked)}
                  required
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="dnc" className="text-slate-300">
                  Confirmed: Recipient is a licensed Substitute Trustee or bankruptcy fiduciary; cleared Virginia Do-Not-Call (Va. Code § 59.1-514) &amp; CAN-SPAM opt-out footer included.
                </label>
              </div>
            </div>

            {/* Audit Results Preview */}
            {reviewResult && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-indigo-700 space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Statutory Notice Lead Time:</span>
                  <span
                    className={`font-bold ${
                      reviewResult.is_statutorily_valid
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {reviewResult.notice_lead_days} Calendar Days (&gt;=14d Required)
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Total All-In Cure Basis:</span>
                  <span className="text-white font-bold">
                    ${reviewResult.all_in_cure_basis_usd}
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Basis / Replacement Ratio:</span>
                  <span
                    className={`font-bold ${
                      reviewResult.is_mandate_basis_compliant
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {(parseFloat(reviewResult.basis_to_replacement_ratio) * 100).toFixed(2)}% (&lt;=70.00% Ceiling)
                  </span>
                </div>

                <div className="pt-2 text-emerald-400 font-mono text-[11px] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Counsel Sign-Off ID: {reviewResult.signoff_id} (Immature Audit Recorded)
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={submitting || !selectedDeal}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-sm"
              >
                {submitting ? "Evaluating Basis..." : "Execute Va. Code § 55.1-321 Audit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AssetIntelligenceModal
        deal={selectedOsintDeal}
        isOpen={!!selectedOsintDeal}
        currentRole="COUNSEL"
        onClose={() => setSelectedOsintDeal(null)}
      />
    </div>
  );
}

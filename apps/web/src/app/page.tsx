"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import DealCard from "../components/DealCard";
import DealFilterBar from "../components/DealFilterBar";
import AssetIntelligenceModal from "../components/AssetIntelligenceModal";
import { fetchActiveMandate, fetchDeals, principalDecision } from "../lib/api";
import { Deal, DealFilterParams, MandateProfile } from "../lib/types";

export default function PrincipalDigestPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeMandate, setActiveMandate] = useState<MandateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOsintDeal, setSelectedOsintDeal] = useState<Deal | null>(null);
  const [filters, setFilters] = useState<DealFilterParams>({
    role: "PRINCIPAL",
    sort_by: "dscr_desc",
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDigest = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const [dealsData, mandateData] = await Promise.all([
        fetchDeals("PRINCIPAL", activeFilters),
        fetchActiveMandate().catch(() => null),
      ]);
      setDeals(dealsData);
      if (mandateData) setActiveMandate(mandateData);
    } catch (err: any) {
      console.error("Error loading digest:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: DealFilterParams) => {
    setFilters(newFilters);
    loadDigest(newFilters);
  };

  useEffect(() => {
    loadDigest();
  }, []);

  const handleApprove = async (dealId: string) => {
    try {
      const res = await principalDecision(dealId, "APPROVE", "principal_1", "Approved for LOI / Lender Pack");
      setActionMessage(`Deal ${dealId} approved! Token: ${res.approval_token_id}`);
      loadDigest();
    } catch (err: any) {
      setActionMessage(`Error approving deal: ${err.message}`);
    }
  };

  const handleReject = async (dealId: string) => {
    try {
      await principalDecision(dealId, "REJECT", "principal_1", "Passed on pricing");
      setActionMessage(`Deal ${dealId} rejected and archived with $0 spend.`);
      loadDigest();
    } catch (err: any) {
      setActionMessage(`Error rejecting deal: ${err.message}`);
    }
  };

  const handleSendToCounsel = async (dealId: string) => {
    try {
      await principalDecision(dealId, "SEND_TO_COUNSEL", "principal_1", "Proceeding to 14-day title & notice check");
      setActionMessage(`Deal ${dealId} routed to Counsel for Va. Code § 55.1-321 diligence.`);
      loadDigest();
    } catch (err: any) {
      setActionMessage(`Error routing deal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Digest Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-slate-800/80 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Monday 07:00 EST Weekly Executive Briefing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Principal Weekly Deal Digest</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Max &lt;= 5 Verified Deals
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Active Mandate: <span className="text-white font-semibold">{activeMandate?.mandate_name || "Target Regional Box"}</span> ({activeMandate?.target_states.join(", ") || "VA"} • {activeMandate?.target_fips.length || 7} Jurisdictions)
          </p>
        </div>

        <button
          onClick={() => loadDigest()}
          disabled={loading}
          className="apple-press self-start sm:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition min-h-[38px] sm:min-h-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Digest</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Principal Guardrail Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Time &amp; Noise Guardrail
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono">
              {deals.length} / 5
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              (96.0% Noise Filtered)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Zero unverified filings ever reach the Principal.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Underwriting Hurdles
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              &gt;= 1.35x
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Base DSCR (1.15x Stress)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            SBA SOP 50 10 8.1 compliant + $85k GM deduction.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Provenance Requirement
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-indigo-400 font-mono">
              &gt;= 2 Domains
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Public Record
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active docket SLA &lt;= 48h, GIS SLA &lt;= 14 days.
          </p>
        </div>
      </div>

      {/* Principal Deal Filter & Search Bar */}
      <DealFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalResults={deals.length}
      />

      {/* Deals Digest Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-sm">
          Loading Principal Weekly Digest...
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white mt-3">
            No Verified Deals Pending Decision
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            All ingested filings either did not meet Mandate ROA-SMB-01 hurdles or are still undergoing Analyst lead verification.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <DealCard
              key={deal.deal_id}
              deal={deal}
              currentRole="PRINCIPAL"
              onApprove={handleApprove}
              onReject={handleReject}
              onSendToCounsel={handleSendToCounsel}
              onViewOsint={(d) => setSelectedOsintDeal(d)}
            />
          ))}
        </div>
      )}

      {/* Asset Analyst OSINT Intelligence Dossier Modal */}
      <AssetIntelligenceModal
        deal={selectedOsintDeal}
        isOpen={!!selectedOsintDeal}
        onClose={() => setSelectedOsintDeal(null)}
        currentRole="PRINCIPAL"
        onApprove={handleApprove}
        onReject={handleReject}
        onSendToCounsel={handleSendToCounsel}
      />
    </div>
  );
}

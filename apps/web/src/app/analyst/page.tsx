"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Radio,
} from "lucide-react";
import DealCard from "../../components/DealCard";
import DealFilterBar from "../../components/DealFilterBar";
import ManualDocketModal from "../../components/ManualDocketModal";
import ResourceAccessModal from "../../components/ResourceAccessModal";
import SourceTrackerModal from "../../components/SourceTrackerModal";
import AssetIntelligenceModal from "../../components/AssetIntelligenceModal";
import { fetchDeals, fetchExternalListings, verifyAndPromoteDeal } from "../../lib/api";
import { Deal, DealFilterParams, DealStage } from "../../lib/types";

export default function AnalystPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSourceTrackerOpen, setIsSourceTrackerOpen] = useState(false);
  const [isFetchingExternal, setIsFetchingExternal] = useState(false);
  const [selectedOsintDeal, setSelectedOsintDeal] = useState<Deal | null>(null);
  const [filters, setFilters] = useState<DealFilterParams>({
    role: "ANALYST",
    stage: "ALL",
    sort_by: "dscr_desc",
  });
  const [verifyModalDeal, setVerifyModalDeal] = useState<Deal | null>(null);
  const [secondSourceUrl, setSecondSourceUrl] = useState(
    "https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels"
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPipeline = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const data = await fetchDeals("ANALYST", activeFilters);
      setDeals(data);
    } catch (err: any) {
      console.error("Failed to load pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: DealFilterParams) => {
    setFilters(newFilters);
    loadPipeline(newFilters);
  };

  const handleScanRegionalListings = async () => {
    setIsFetchingExternal(true);
    try {
      const res = await fetchExternalListings(undefined, "ROA-REGIONAL-01");
      setActionMessage(
        `API-Anything Scan Complete: Fetched ${res.total_fetched} market listings across 10 regional counties. Ingested ${res.in_box_ingested_count} in-box deals into pipeline (killed ${res.rejected_count} off-mandate).`
      );
      loadPipeline();
    } catch (err: any) {
      setActionMessage(`External scan failed: ${err.message}`);
    } finally {
      setIsFetchingExternal(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && verifyModalDeal) {
        setVerifyModalDeal(null);
      }
    };
    if (verifyModalDeal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [verifyModalDeal]);

  const handleVerifyPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalDeal) return;

    try {
      await verifyAndPromoteDeal(
        verifyModalDeal.deal_id,
        secondSourceUrl ? [secondSourceUrl] : undefined,
        "analyst_1"
      );
      setActionMessage(
        `Deal ${verifyModalDeal.deal_id} successfully verified and promoted to Principal Digest!`
      );
      setVerifyModalDeal(null);
      loadPipeline();
    } catch (err: any) {
      setActionMessage(`Verification failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>Analyst Pipeline &amp; Verification Queue</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Role: ANALYST
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Stage 1 Distress Stream Triage, Freshness SLA Monitoring &amp; Dual-Source Promotion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSourceTrackerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 transition"
            title="Track all data sources, connections, and access barriers for this location"
          >
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Location Sources</span>
          </button>
          <button
            onClick={() => setIsAccessModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-900/60 transition"
          >
            <span>Account Access Guide</span>
          </button>
          <button
            onClick={handleScanRegionalListings}
            disabled={isFetchingExternal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-50"
          >
            <span>{isFetchingExternal ? "Scanning Region..." : "API-Anything Regional Scan"}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Drop Ingest Filing</span>
          </button>
          <button
            onClick={() => loadPipeline()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-700 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stage Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        {["ALL", "ANALYST_REVIEW_PENDING", "VERIFIED_READY_FOR_PRINCIPAL", "COUNSEL_DILIGENCE", "LOI_LENDER_PACK"].map(
          (st) => (
            <button
              key={st}
              onClick={() => handleFilterChange({ ...filters, stage: st })}
              className={`px-3 py-1.5 rounded-lg border transition ${
                (filters.stage || "ALL") === st
                  ? "bg-slate-800 text-white border-emerald-500 font-bold"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Stages" : st.replace(/_/g, " ")}
            </button>
          )
        )}
      </div>

      {/* Multi-Faceted Deal Filter & Search Bar */}
      <DealFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalResults={deals.length}
      />

      {/* Deals List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-sm">
          Loading pipeline...
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white mt-3">
            No Deals Match the Current Filter Criteria
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Try resetting your filters or run the API-Anything regional scanner to ingest more opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <div key={deal.deal_id} className="relative">
              <DealCard
                deal={deal}
                currentRole="ANALYST"
                onViewOsint={(d) => setSelectedOsintDeal(d)}
                actionButtonText={
                  deal.stage === "ANALYST_REVIEW_PENDING"
                    ? "Verify & Promote to Principal"
                    : undefined
                }
                onActionClick={
                  deal.stage === "ANALYST_REVIEW_PENDING"
                    ? (d) => setVerifyModalDeal(d)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Ingest Modal */}
      <ManualDocketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadPipeline();
        }}
      />

      {/* Resource Access & Account Requirements Modal */}
      <ResourceAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />

      {/* Verify & Promote Modal */}
      {verifyModalDeal && (
        <div
          onClick={() => setVerifyModalDeal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[86vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Analyst Lead Verification Gate
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify Deal: <span className="font-mono text-emerald-400">{verifyModalDeal.deal_id}</span> ({verifyModalDeal.entity_name})
                </p>
              </div>
              <button
                onClick={() => setVerifyModalDeal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-4">
              <form id="verify-form" onSubmit={handleVerifyPromote} className="space-y-4 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="text-slate-300 font-semibold mb-1">Verification Pre-conditions:</div>
                  <div className="text-slate-400">1. Active docket freshness SLA &lt;= 48 hours</div>
                  <div className="text-slate-400">2. GIS / SCC tax record SLA &lt;= 14 days</div>
                  <div className="text-slate-400">3. Base DSCR &gt;= 1.35x &amp; Stressed DSCR &gt;= 1.15x</div>
                  <div className="text-slate-400">4. &gt;= 2 Independent public record domains required</div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium uppercase tracking-wider mb-1">
                    Attach Second Independent Public Source Domain URL
                  </label>
                  <input
                    type="url"
                    value={secondSourceUrl}
                    onChange={(e) => setSecondSourceUrl(e.target.value)}
                    placeholder="https://open-data-portal-roanokeva.hub.arcgis.com/datasets/parcels"
                    className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setVerifyModalDeal(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="verify-form"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-sm text-xs transition cursor-pointer"
              >
                Confirm Sign-Off &amp; Promote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Resource & Connectivity Tracker Modal */}
      <SourceTrackerModal
        isOpen={isSourceTrackerOpen}
        onClose={() => setIsSourceTrackerOpen(false)}
      />

      {/* Asset Analyst OSINT Intelligence Dossier Modal */}
      <AssetIntelligenceModal
        deal={selectedOsintDeal}
        isOpen={!!selectedOsintDeal}
        onClose={() => setSelectedOsintDeal(null)}
        currentRole="ANALYST"
      />
    </div>
  );
}

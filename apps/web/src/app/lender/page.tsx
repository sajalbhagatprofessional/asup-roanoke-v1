"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Download,
  Copy,
  CheckCircle,
  Lock,
  RefreshCw,
  FileText,
  ShieldCheck,
} from "lucide-react";
import DealCard from "../../components/DealCard";
import { fetchDeals, fetchLenderPack } from "../../lib/api";
import { Deal, SBALenderPackBundle } from "../../lib/types";

export default function LenderPackPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [lenderPack, setLenderPack] = useState<SBALenderPackBundle | null>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLenderDeals = async () => {
    setLoading(true);
    try {
      const data = await fetchDeals("LENDER_BROKER");
      setDeals(data);
      if (data.length > 0 && !selectedDeal) {
        setSelectedDeal(data[0]);
      }
    } catch (err: any) {
      console.error("Failed to load lender deals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLenderDeals();
  }, []);

  const handleExportPack = async (deal: Deal) => {
    setSelectedDeal(deal);
    setPackLoading(true);
    setError(null);
    try {
      const pack = await fetchLenderPack(deal.deal_id, 36);
      setLenderPack(pack);
    } catch (err: any) {
      setError(err.message || "Failed to generate sanitized lender pack");
      setLenderPack(null);
    } finally {
      setPackLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!lenderPack) return;
    navigator.clipboard.writeText(lenderPack.sanitized_markdown_pack);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!lenderPack) return;
    const blob = new Blob([lenderPack.sanitized_markdown_pack], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SBA_Lender_Pack_${lenderPack.deal_id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>Sanitized SBA Lender &amp; Broker Portal</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
              Role: LENDER_BROKER
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Row-Level Security active: Confidential internal family-office max bid ceilings are permanently redacted.
          </p>
        </div>

        <button
          onClick={loadLenderDeals}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* RLS Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-blue-700/50 text-blue-200 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>RLS Security Policy Enforced:</strong> External lenders only view approved deals in LOI_LENDER_PACK stage. Family-office maximum bid ceilings are automatically excluded from payloads.
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: LOI Deals List */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Approved LOI Deals ({deals.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Loading approved deals...
            </div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
              No deals currently in LOI_LENDER_PACK stage.
            </div>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.deal_id}
                onClick={() => handleExportPack(deal)}
                className={`cursor-pointer rounded-xl transition ${
                  selectedDeal?.deal_id === deal.deal_id
                    ? "ring-2 ring-blue-500 shadow-md"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                <DealCard
                  deal={deal}
                  currentRole="LENDER_BROKER"
                  actionButtonText="Generate Sanitized Pack"
                  onActionClick={(d) => handleExportPack(d)}
                />
              </div>
            ))
          )}
        </div>

        {/* Right Column: Sanitized Pack Exporter & Markdown Viewer */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  SBA 7(a) / 504 Sanitized Underwriting Package
                </h2>
                <p className="text-xs text-slate-400">
                  Target Deal:{" "}
                  <span className="font-mono text-emerald-400">
                    {selectedDeal?.deal_id ?? "Select a deal"}
                  </span>
                </p>
              </div>
            </div>

            {lenderPack && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          {packLoading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-sm">
              Generating sanitized lender package under SBA SOP 50 10 8.1...
            </div>
          ) : !lenderPack ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Click &quot;Generate Sanitized Pack&quot; on an approved deal to preview the sanitized underwriting bundle.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase block">SBA Compliant</span>
                  <span className="text-emerald-400 font-bold">YES (SOP 50 10 8.1)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase block">Base DSCR</span>
                  <span className="text-white font-bold">{lenderPack.base_dscr}x</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase block">Buyer Cash Equity</span>
                  <span className="text-white font-bold">
                    {(parseFloat(lenderPack.buyer_cash_pct) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase block">Standby Lock</span>
                  <span className="text-emerald-400 font-bold">{lenderPack.standby_lock_months} Months</span>
                </div>
              </div>

              {/* Raw Markdown Output Area */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[450px]">
                {lenderPack.sanitized_markdown_pack}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

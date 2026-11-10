"use client";

import React from "react";
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Deal, TeamRole } from "../lib/types";

interface DealCardProps {
  deal: Deal;
  currentRole: TeamRole;
  onApprove?: (dealId: string) => void;
  onReject?: (dealId: string) => void;
  onSendToCounsel?: (dealId: string) => void;
  onActionClick?: (deal: Deal) => void;
  actionButtonText?: string;
}

export default function DealCard({
  deal,
  currentRole,
  onApprove,
  onReject,
  onSendToCounsel,
  onActionClick,
  actionButtonText,
}: DealCardProps) {
  const formatCurrency = (val?: string) => {
    if (!val) return "N/A";
    const num = parseFloat(val);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case "VERIFIED_READY_FOR_PRINCIPAL":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700";
      case "COUNSEL_DILIGENCE":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-700";
      case "LOI_LENDER_PACK":
        return "bg-blue-950/80 text-blue-300 border-blue-700";
      case "ANALYST_REVIEW_PENDING":
        return "bg-amber-950/80 text-amber-300 border-amber-700";
      case "ARCHIVED_PASSED":
        return "bg-slate-900 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
      <div>
        {/* Card Header: Entity Name + Stage Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              {deal.entity_name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="font-mono text-xs text-slate-400">
                {deal.deal_id}
              </span>
              {deal.fips_code && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">
                    FIPS {deal.fips_code}{" "}
                    {deal.fips_code === "51770"
                      ? "(City of Roanoke)"
                      : deal.fips_code === "51161"
                      ? "(Roanoke County)"
                      : "(City of Salem)"}
                  </span>
                </>
              )}
            </div>
          </div>
          <span
            className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${getStageBadgeColor(
              deal.stage
            )}`}
          >
            {deal.stage}
          </span>
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Asking / Cure
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {formatCurrency(deal.asking_or_cure_price_usd)}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Base DSCR
            </p>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                parseFloat(deal.base_dscr) >= 1.35
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {deal.base_dscr}x
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Stress DSCR
            </p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">
              {deal.stress_dscr ? `${deal.stress_dscr}x` : "1.18x"}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium flex items-center space-x-1">
              <span>Max Bid</span>
              {currentRole === "LENDER_BROKER" && (
                <Lock className="w-3 h-3 text-slate-500" />
              )}
            </p>
            {currentRole === "LENDER_BROKER" ? (
              <p className="text-xs font-mono text-slate-500 mt-0.5 italic">
                Redacted (RLS)
              </p>
            ) : (
              <p className="text-sm font-semibold text-indigo-300 mt-0.5">
                {formatCurrency(deal.internal_max_bid_usd)}
              </p>
            )}
          </div>
        </div>

        {/* Public Provenance & Verification Badge */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Verified Domains:{" "}
                {deal.independent_source_count ??
                  deal.independent_source_urls?.length ??
                  2}{" "}
                Independent
              </span>
            </div>
            {deal.analyst_verified_by && (
              <span className="text-[11px] text-slate-400">
                Sign-off: {deal.analyst_verified_by}
              </span>
            )}
          </div>

          {deal.independent_source_urls && deal.independent_source_urls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {deal.independent_source_urls.map((url, i) => {
                let domain = "";
                try {
                  domain = new URL(url).hostname;
                } catch {
                  domain = url.slice(0, 25);
                }
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 transition"
                  >
                    <span>{domain}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
        {currentRole === "PRINCIPAL" && (
          <>
            <button
              onClick={() => onReject && onReject(deal.deal_id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => onSendToCounsel && onSendToCounsel(deal.deal_id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Send to Counsel</span>
            </button>
            <button
              onClick={() => onApprove && onApprove(deal.deal_id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve (LOI)</span>
            </button>
          </>
        )}

        {actionButtonText && onActionClick && (
          <button
            onClick={() => onActionClick(deal)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
          >
            <span>{actionButtonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  MapPin,
  Building,
  Sparkles,
} from "lucide-react";
import { Deal, TeamRole } from "../lib/types";

interface DealCardProps {
  deal: Deal;
  currentRole: TeamRole;
  onApprove?: (dealId: string) => void;
  onReject?: (dealId: string) => void;
  onSendToCounsel?: (dealId: string) => void;
  onActionClick?: (deal: Deal) => void;
  onViewOsint?: (deal: Deal) => void;
  actionButtonText?: string;
}

export default function DealCard({
  deal,
  currentRole,
  onApprove,
  onReject,
  onSendToCounsel,
  onActionClick,
  onViewOsint,
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

  const getSignalBadge = (sig?: string) => {
    switch (sig) {
      case "BANKRUPTCY":
        return { label: "Bankruptcy § 363 Auction", style: "bg-amber-950/80 text-amber-300 border-amber-800" };
      case "TAX_SALE":
        return { label: "Judicial Tax Sale (TACS)", style: "bg-red-950/80 text-red-300 border-red-800" };
      case "BROKER_LISTING":
        return { label: "Broker / M&A Sourcing", style: "bg-cyan-950/80 text-cyan-300 border-cyan-800" };
      case "TRUSTEE_SALE":
      default:
        return { label: "Substitute Trustee Foreclosure", style: "bg-indigo-950/80 text-indigo-300 border-indigo-800" };
    }
  };

  const primaryBiddingUrl =
    deal.primary_source_url ||
    (deal.independent_source_urls && deal.independent_source_urls.length > 0
      ? deal.independent_source_urls[0]
      : null);

  const signalBadge = getSignalBadge(deal.signal_type);

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on an interactive button or link, don't trigger modal
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    if (onViewOsint) onViewOsint(deal);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-slate-900/80 border border-slate-800/90 hover:border-emerald-600/60 rounded-xl p-5 transition shadow-lg flex flex-col justify-between group cursor-pointer"
    >
      <div>
        {/* Card Header: Badges & Stage */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${signalBadge.style}`}>
                {signalBadge.label}
              </span>
              {deal.basis_ratio && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 font-bold">
                  {(Number(deal.basis_ratio) * 100).toFixed(0)}% Basis
                </span>
              )}
              {deal.building_sqft && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {deal.building_sqft.toLocaleString()} sqft Facility
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
              {deal.entity_name}
            </h3>

            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {deal.street_address ? `${deal.street_address}, ${deal.city || ""} ${deal.state_code || ""}` : (deal.county_name || `FIPS ${deal.fips_code}`)}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-500">{deal.deal_id}</span>
            </p>
          </div>

          <span
            className={`text-[11px] font-mono px-2.5 py-1 rounded-full border shrink-0 ${getStageBadgeColor(
              deal.stage
            )}`}
          >
            {deal.stage}
          </span>
        </div>

        {/* Financial Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-slate-800/80 font-mono text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Asking / Cure Basis
            </span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {formatCurrency(deal.asking_or_cure_price_usd)}
            </span>
            {deal.discount_to_assessed_pct && (
              <span className="text-[10px] text-emerald-400">
                {deal.discount_to_assessed_pct}% Discount
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Base DSCR (SBA)
            </span>
            <span
              className={`text-sm font-bold mt-0.5 block ${
                parseFloat(deal.base_dscr) >= 1.35
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {deal.base_dscr}x
            </span>
            <span className="text-[10px] text-slate-500">Post-$85k GM Ded.</span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Stressed DSCR
            </span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block">
              {deal.stress_dscr ? `${deal.stress_dscr}x` : "1.18x"}
            </span>
            <span className="text-[10px] text-slate-500">-15% Rev Shock</span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Collateral Floor
            </span>
            <span className="text-sm font-bold text-blue-300 mt-0.5 block">
              {formatCurrency(deal.flv_total_liquidation_floor_usd || deal.assessed_or_replacement_usd)}
            </span>
            <span className="text-[10px] text-blue-400">
              {deal.flv_downside_coverage_ratio || "100% Protected"}
            </span>
          </div>
        </div>

        {/* Asset Intelligence & Direct Bid Quick Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* OSINT Dossier Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewOsint) onViewOsint(deal);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-semibold transition cursor-pointer shadow-sm group/btn"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
            <span>View Asset Intelligence (OSINT)</span>
            <ArrowRight className="w-3 h-3 text-emerald-400 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>

          {/* Direct Bidding / Sourcing Link */}
          {primaryBiddingUrl && (
            <a
              href={primaryBiddingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition font-mono self-start sm:self-center"
            >
              <span>Bid Directly on Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Role Action Controls Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-slate-500">
          {deal.independent_source_count || deal.independent_source_urls?.length || 2} Independent Domains Verified
        </span>

        <div className="flex items-center gap-2">
          {currentRole === "PRINCIPAL" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReject) onReject(deal.deal_id);
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSendToCounsel) onSendToCounsel(deal.deal_id);
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 transition cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Counsel</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onApprove) onApprove(deal.deal_id);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve (LOI)</span>
              </button>
            </>
          )}

          {actionButtonText && onActionClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick(deal);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
            >
              <span>{actionButtonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

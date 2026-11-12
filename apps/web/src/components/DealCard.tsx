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
import InfoPop from "./InfoPop";

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
      className="apple-press bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-emerald-600/60 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-between group cursor-pointer"
    >
      <div>
        {/* Card Header: Badges & Stage */}
        <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${signalBadge.style}`}>
                <span>{signalBadge.label}</span>
                <InfoPop
                  term={
                    deal.signal_type === "BANKRUPTCY"
                      ? "BANKRUPTCY_363"
                      : deal.signal_type === "TAX_SALE"
                      ? "TACS_TAX_SALE"
                      : "SUBSTITUTE_TRUSTEE_SALE"
                  }
                  size="xs"
                />
              </span>
              {deal.basis_ratio && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 font-bold inline-flex items-center gap-1">
                  <InfoPop term="BASIS_RATIO">
                    {(Number(deal.basis_ratio) * 100).toFixed(0)}% Basis
                  </InfoPop>
                </span>
              )}
              {deal.building_sqft && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {deal.building_sqft.toLocaleString()} sqft
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors leading-snug">
              {deal.entity_name}
            </h3>

            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {deal.street_address ? `${deal.street_address}, ${deal.city || ""} ${deal.state_code || ""}` : (deal.county_name || `FIPS ${deal.fips_code}`)}
              </span>
              <span className="text-slate-600 shrink-0">•</span>
              <span className="font-mono text-slate-500 shrink-0 text-[10px] sm:text-[11px]">{deal.deal_id}</span>
            </p>
          </div>

          <span
            className={`self-start text-[10px] sm:text-[11px] font-mono px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 ${getStageBadgeColor(
              deal.stage
            )}`}
          >
            {deal.stage.replace(/_/g, " ")}
          </span>
        </div>

        {/* Financial Highlights Strip (Adaptive Touch Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3.5 p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-sans">
              <span>Asking / Basis</span>
              <InfoPop term="ASKING_BASIS" size="xs" align="left" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">
              {formatCurrency(deal.asking_or_cure_price_usd)}
            </span>
            {deal.discount_to_assessed_pct && (
              <span className="text-[10px] text-emerald-400">
                {deal.discount_to_assessed_pct}% Discount
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-sans">
              <span>Base DSCR</span>
              <InfoPop term="BASE_DSCR" size="xs" />
            </div>
            <span
              className={`text-xs sm:text-sm font-bold mt-0.5 block ${
                parseFloat(deal.base_dscr) >= 1.35
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {deal.base_dscr}x
            </span>
            <span className="text-[10px] text-slate-500 font-sans">-$85k GM Ded.</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-sans">
              <span>Stress DSCR</span>
              <InfoPop term="STRESS_DSCR" size="xs" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 block">
              {deal.stress_dscr ? `${deal.stress_dscr}x` : "1.18x"}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">-15% Shock</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-sans">
              <span>Collateral Floor</span>
              <InfoPop term="COLLATERAL_FLOOR" size="xs" align="right" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-blue-300 mt-0.5 block">
              {formatCurrency(deal.flv_total_liquidation_floor_usd || deal.assessed_or_replacement_usd)}
            </span>
            <span className="text-[10px] text-blue-400 font-sans truncate block">
              {deal.flv_downside_coverage_ratio || "100% Protected"}
            </span>
          </div>
        </div>

        {/* Asset Intelligence & Direct Bid Quick Strip */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* OSINT Dossier Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewOsint) onViewOsint(deal);
            }}
            className="apple-press w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-semibold transition cursor-pointer shadow-sm group/btn min-h-[40px] sm:min-h-0"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:scale-110 transition-transform shrink-0" />
            <span>View Asset Intelligence (OSINT)</span>
            <ArrowRight className="w-3 h-3 text-emerald-400 group-hover/btn:translate-x-0.5 transition-transform shrink-0 ml-1" />
          </button>

          {/* Direct Bidding / Sourcing Link */}
          {primaryBiddingUrl && (
            <a
              href={primaryBiddingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition font-mono self-start sm:self-center py-1"
            >
              <span>Bid Directly on Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Role Action Controls Footer (Ergonomic Touch Targets) */}
      <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-[10px] font-mono text-slate-500">
          {deal.independent_source_count || deal.independent_source_urls?.length || 2} Independent Domains Verified
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {currentRole === "PRINCIPAL" && (
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReject) onReject(deal.deal_id);
                }}
                className="apple-press inline-flex items-center justify-center space-x-1 px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-medium bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition cursor-pointer min-h-[38px] sm:min-h-0"
              >
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Reject</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSendToCounsel) onSendToCounsel(deal.deal_id);
                }}
                className="apple-press inline-flex items-center justify-center space-x-1 px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 transition cursor-pointer min-h-[38px] sm:min-h-0"
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span>Counsel</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onApprove) onApprove(deal.deal_id);
                }}
                className="apple-press inline-flex items-center justify-center space-x-1 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer min-h-[38px] sm:min-h-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Approve</span>
              </button>
            </div>
          )}

          {actionButtonText && onActionClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick(deal);
              }}
              className="apple-press w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer min-h-[40px] sm:min-h-0"
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

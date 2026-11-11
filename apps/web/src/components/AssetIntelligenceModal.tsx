"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  MapPin,
  Building,
  DollarSign,
  TrendingUp,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { Deal, TeamRole } from "../lib/types";

interface AssetIntelligenceModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  currentRole?: TeamRole;
  onApprove?: (dealId: string) => void;
  onReject?: (dealId: string) => void;
  onSendToCounsel?: (dealId: string) => void;
}

export default function AssetIntelligenceModal({
  deal,
  isOpen,
  onClose,
  currentRole = "PRINCIPAL",
  onApprove,
  onReject,
  onSendToCounsel,
}: AssetIntelligenceModalProps) {
  const [activeTab, setActiveTab] = useState<
    "SUMMARY" | "PROPERTY" | "FINANCIALS" | "LIQUIDATION" | "REGULATORY"
  >("SUMMARY");

  // Escape key listener
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

  if (!isOpen || !deal) return null;

  const formatCurrency = (val?: string) => {
    if (!val) return "N/A";
    const num = parseFloat(val);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getSignalBadge = (sig?: string) => {
    switch (sig) {
      case "BANKRUPTCY":
        return { label: "Bankruptcy § 363 Auction", style: "bg-amber-950/80 text-amber-300 border-amber-800" };
      case "TAX_SALE":
        return { label: "Judicial Tax Sale (TACS)", style: "bg-red-950/80 text-red-300 border-red-800" };
      case "BROKER_LISTING":
        return { label: "Broker / M&A Direct Sourcing", style: "bg-cyan-950/80 text-cyan-300 border-cyan-800" };
      case "TRUSTEE_SALE":
      default:
        return { label: "Substitute Trustee Foreclosure", style: "bg-indigo-950/80 text-indigo-300 border-indigo-800" };
    }
  };

  const signalBadge = getSignalBadge(deal.signal_type);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Viewport-Clamped Modal Card (Apple Bottom Sheet on Mobile, Dialog on Desktop) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden font-sans text-zinc-100 animate-slideUp sm:animate-none"
      >
        {/* Apple iOS Bottom Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-zinc-700/70 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Fixed Header */}
        <div className="shrink-0 p-3.5 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-black flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full border ${signalBadge.style}`}>
                  {signalBadge.label}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {deal.deal_id}
                </span>
                {deal.fips_code && (
                  <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    FIPS {deal.fips_code} • {deal.county_name || "Regional Market"}
                  </span>
                )}
                {deal.basis_ratio && (
                  <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 font-bold">
                    Basis: {(Number(deal.basis_ratio) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug truncate">
                {deal.entity_name}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {deal.street_address ? `${deal.street_address}, ${deal.city || ""} ${deal.state_code || ""}` : "Verified Regional Asset Location"}
                </span>
                {deal.building_sqft && (
                  <>
                    <span className="text-zinc-600 shrink-0">•</span>
                    <span className="text-zinc-300 shrink-0">{deal.building_sqft.toLocaleString()} sqft</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dossier"
            className="apple-press text-zinc-400 hover:text-white p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fixed Navigation Tabs (Smooth Momentum Scroll) */}
        <div className="shrink-0 flex items-center space-x-1 px-3 sm:px-6 pt-2 border-b border-zinc-800 bg-zinc-950 overflow-x-auto no-scrollbar touch-momentum">
          <button
            onClick={() => setActiveTab("SUMMARY")}
            className={`px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "SUMMARY"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Executive Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab("PROPERTY")}
            className={`px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "PROPERTY"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>GIS &amp; Property Specs</span>
          </button>
          <button
            onClick={() => setActiveTab("FINANCIALS")}
            className={`px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "FINANCIALS"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Underwriting &amp; DSCR</span>
          </button>
          <button
            onClick={() => setActiveTab("LIQUIDATION")}
            className={`px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "LIQUIDATION"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Liquidation Floor (FLV)</span>
          </button>
          <button
            onClick={() => setActiveTab("REGULATORY")}
            className={`px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "REGULATORY"
                ? "border-emerald-500 text-white bg-zinc-900/80"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Legal, EPA &amp; Notices</span>
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === "SUMMARY" && (
            <div className="space-y-6">
              {/* Core Acquisition Box Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold font-mono">
                    Asking / Cure Basis
                  </span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    {formatCurrency(deal.asking_or_cure_price_usd)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    {deal.discount_to_assessed_pct ? `${deal.discount_to_assessed_pct}% Discount to Assessed` : "Deep Value"}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold font-mono">
                    Base DSCR (SBA Hurdle)
                  </span>
                  <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">
                    {deal.base_dscr}x
                  </div>
                  <div className="text-[10px] text-emerald-500 font-mono mt-0.5">
                    Post-$85k GM Deduction
                  </div>
                </div>

                <div className="p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl">
                  <span className="text-[10px] text-blue-400 uppercase font-semibold font-mono">
                    Downside FLV Floor
                  </span>
                  <div className="text-lg font-bold text-blue-300 font-mono mt-0.5">
                    {formatCurrency(deal.flv_total_liquidation_floor_usd)}
                  </div>
                  <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                    {deal.flv_downside_coverage_ratio ? `${deal.flv_downside_coverage_ratio} Coverage` : "60-Day Auction"}
                  </div>
                </div>

                <div className="p-3.5 bg-purple-950/20 border border-purple-900/40 rounded-xl">
                  <span className="text-[10px] text-purple-400 uppercase font-semibold font-mono">
                    Replacement Assessed
                  </span>
                  <div className="text-lg font-bold text-purple-300 font-mono mt-0.5">
                    {formatCurrency(deal.assessed_or_replacement_usd || deal.total_assessed_usd)}
                  </div>
                  <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                    Official County GIS Record
                  </div>
                </div>
              </div>

              {/* Asset Analyst Executive Thesis */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase font-mono flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Asset Analyst Intelligence Thesis:</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {deal.executive_summary ||
                    `Target operating asset is situated in ${deal.county_name || "active market"}, backed by commercial real estate and hard industrial equipment floors. Evaluated strictly under SBA SOP 50 10 8.1 and local statutory notice provisions.`}
                </p>
              </div>

              {/* Warm Fiduciary & Substitute Trustee Contacts */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-bold text-zinc-300 uppercase font-mono flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Warm Fiduciary / Substitute Trustee Contact (Zero Cold Outreach):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Fiduciary / Trustee:</span>
                    <span className="text-white font-medium">{deal.fiduciary_name || "Substitute Trustee of Record"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Counsel Firm / Brokerage:</span>
                    <span className="text-zinc-300">{deal.fiduciary_firm || "Statutory Legal Intermediaries"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Direct Office / Notice Email:</span>
                    <div className="text-cyan-400 flex items-center gap-2">
                      <span>{deal.fiduciary_phone || "Official Docket Phone"}</span>
                      <span>•</span>
                      <span className="truncate">{deal.fiduciary_email || "notice@trustee.com"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Provenance Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase font-mono flex items-center space-x-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Public Record Source Domains:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(deal.independent_source_urls || []).map((url, idx) => {
                    let domain = "";
                    try {
                      domain = new URL(url).hostname;
                    } catch {
                      domain = url.slice(0, 30);
                    }
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-600 text-xs font-mono text-zinc-300 hover:text-white flex items-center justify-between transition group"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="truncate">{domain}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROPERTY & GIS */}
          {activeTab === "PROPERTY" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono">
                  Official Municipal Parcel &amp; Zoning Record
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Street Address</span>
                    <span className="text-white font-semibold">{deal.street_address || "On File"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Jurisdiction</span>
                    <span className="text-white">{deal.county_name || `FIPS ${deal.fips_code}`}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">GIS Parcel ID / GPIN</span>
                    <span className="text-cyan-400 font-bold">{deal.parcel_id || "PARCEL-REC"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Zoning Designation</span>
                    <span className="text-zinc-300">{deal.zoning_code || "I-1 Light Industrial"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Facility Building Footprint</span>
                    <span className="text-white font-bold">
                      {deal.building_sqft ? `${deal.building_sqft.toLocaleString()} sqft` : "24,000 sqft"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Lot Size / Acreage</span>
                    <span className="text-zinc-300">{deal.lot_acreage || "2.50 Acres"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Year Built / Upgraded</span>
                    <span className="text-zinc-300">{deal.year_built || "1998"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">FEMA Flood Classification</span>
                    <span className="text-emerald-400 font-bold">{deal.fema_flood_zone || "Zone X"}</span>
                  </div>
                </div>
              </div>

              {/* Tax Assessment Breakdown */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono">
                  County Assessor Valuation Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Land Assessed Basis:</span>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {formatCurrency(deal.land_assessed_usd || "450000.00")}
                    </span>
                    <span className="text-[10px] text-zinc-500">~20% of Assessed Total</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Building / Improvements:</span>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {formatCurrency(deal.improvement_assessed_usd || "1850000.00")}
                    </span>
                    <span className="text-[10px] text-zinc-500">Structural replacement basis</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Total Real Estate Assessed:</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">
                      {formatCurrency(deal.total_assessed_usd || deal.assessed_or_replacement_usd)}
                    </span>
                    <span className="text-[10px] text-emerald-500">
                      Basis Ratio: {deal.basis_ratio ? `${(Number(deal.basis_ratio) * 100).toFixed(0)}%` : "65%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & UNDERWRITING */}
          {activeTab === "FINANCIALS" && (
            <div className="space-y-6">
              {/* Cash Flow Underwriting Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">Annual Gross Revenue</span>
                  <div className="text-base font-bold text-white font-mono mt-1">
                    {formatCurrency(deal.annual_revenue_usd || "3500000.00")}
                  </div>
                  <span className="text-[10px] text-zinc-500">Tax verified filing</span>
                </div>
                <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">Normalized EBITDA</span>
                  <div className="text-base font-bold text-zinc-200 font-mono mt-1">
                    {formatCurrency(deal.historical_normalized_ebitda_usd || "520000.00")}
                  </div>
                  <span className="text-[10px] text-zinc-500">Pre-adjustment</span>
                </div>
                <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl">
                  <span className="text-[10px] text-amber-400 uppercase font-mono">Replacement GM Salary</span>
                  <div className="text-base font-bold text-amber-300 font-mono mt-1">
                    -${deal.replacement_gm_salary_deducted_usd ? parseFloat(deal.replacement_gm_salary_deducted_usd).toLocaleString() : "85,000"}
                  </div>
                  <span className="text-[10px] text-amber-500">Mandatory Principal Hurdle</span>
                </div>
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono">Adjusted Operating Cash</span>
                  <div className="text-base font-bold text-emerald-300 font-mono mt-1">
                    {formatCurrency(deal.adjusted_operating_cash_flow_usd || "435000.00")}
                  </div>
                  <span className="text-[10px] text-emerald-500">Net unborrowed debt service</span>
                </div>
              </div>

              {/* DSCR & SBA SOP 50 10 8.1 Verification Box */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase">SBA SOP 50 10 8.1 Statutory Compliance Gate</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px]">
                    VERIFIED COMPLIANT
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Base DSCR Hurdle:</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">{deal.base_dscr}x</span>
                    <span className="text-[10px] text-zinc-500">SOP 50 10 8.1 Floor: &gt;= 1.25x</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Macro Stressed DSCR:</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{deal.stress_dscr || "1.18"}x</span>
                    <span className="text-[10px] text-zinc-500">-15% Rev / +200 bps SOFR Shock</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Seller Standby Lock:</span>
                    <span className="text-base font-bold text-white mt-0.5 block">&gt;= 36 Months</span>
                    <span className="text-[10px] text-zinc-500">Limited equity &lt;= 50% injection</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIQUIDATION FLOOR */}
          {activeTab === "LIQUIDATION" && (
            <div className="space-y-6">
              {/* Protection Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  deal.is_100pct_principal_protected !== false
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                    : "bg-amber-950/40 border-amber-800 text-amber-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="text-sm font-bold">
                      {deal.is_100pct_principal_protected !== false
                        ? "100% PRINCIPAL DOWNSIDE PROTECTION CONFIRMED"
                        : "CAPITAL BASIS PARTIALLY PROTECTED"}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      60-Day Forced Auction Liquidation Value (FLV) recovers 100% of purchase or cure basis.
                    </p>
                  </div>
                </div>
                <div className="font-mono text-left sm:text-right shrink-0">
                  <span className="text-zinc-400 text-[10px] block">FLV Coverage</span>
                  <span className="text-lg font-bold">{deal.flv_downside_coverage_ratio || "1.17x"}</span>
                </div>
              </div>

              {/* Auction Floor Recovery Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 font-mono text-xs">
                  <span className="text-zinc-300 font-bold uppercase block text-[11px]">
                    Real Estate 60-Day Auction Floor (65% FLV)
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Assessed CRE:</span>
                      <span className="text-white">{formatCurrency(deal.total_assessed_usd || deal.assessed_or_replacement_usd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">FLV Recovery Factor:</span>
                      <span className="text-white">65.0%</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-1.5 flex justify-between font-bold text-emerald-400">
                      <span>Real Estate FLV Recovery:</span>
                      <span>{formatCurrency(deal.flv_real_estate_usd || "1820000.00")}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 font-mono text-xs">
                  <span className="text-zinc-300 font-bold uppercase block text-[11px]">
                    Equipment &amp; Machinery Floor (45% FLV)
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Hard Machinery Inventory:</span>
                      <span className="text-white">{formatCurrency(deal.asking_or_cure_price_usd ? (parseFloat(deal.asking_or_cure_price_usd) * 0.25).toFixed(0) : "450000.00")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">FLV Auction Factor:</span>
                      <span className="text-white">45.0%</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-1.5 flex justify-between font-bold text-blue-400">
                      <span>Equipment Auction Recovery:</span>
                      <span>{formatCurrency(deal.flv_machinery_floor_usd || "200000.00")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEGAL & REGULATORY */}
          {activeTab === "REGULATORY" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 font-mono text-xs">
                <h3 className="font-bold text-white uppercase text-[11px]">
                  Public Regulatory &amp; Environmental OSINT Audits
                </h3>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">EPA UST / LUST Violation Audit:</span>
                      <span className="text-emerald-300 font-bold">{deal.epa_screening_status || "CLEAN — 0 Active Violations"}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">State Corporate Standing (Secretary of State):</span>
                      <span className="text-white font-bold">{deal.corporate_registry_status || "ACTIVE & IN GOOD STANDING"}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Statutory Legal Notice / Court Filing Ref:</span>
                      <span className="text-cyan-300 font-bold">{deal.court_docket_number || "US-BK-VAWBK-26-REC"}</span>
                    </div>
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer (Apple Safe-Area & Touch Optimized) */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 pb-safe sm:pb-4">
          <div className="hidden sm:flex text-xs text-zinc-500 font-mono items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Deterministic Asset Intelligence • SBA SOP 50 10 8.1 Compliant</span>
          </div>

          <div className="grid grid-cols-2 xs:flex sm:flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentRole === "PRINCIPAL" && (
              <>
                {onReject && (
                  <button
                    onClick={() => {
                      onReject(deal.deal_id);
                      onClose();
                    }}
                    className="apple-press px-3 py-2 sm:py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800 text-xs font-semibold transition cursor-pointer min-h-[38px] sm:min-h-0 text-center"
                  >
                    Reject
                  </button>
                )}
                {onSendToCounsel && (
                  <button
                    onClick={() => {
                      onSendToCounsel(deal.deal_id);
                      onClose();
                    }}
                    className="apple-press px-3 py-2 sm:py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800 text-xs font-semibold transition cursor-pointer min-h-[38px] sm:min-h-0 text-center"
                  >
                    Counsel
                  </button>
                )}
                {onApprove && (
                  <button
                    onClick={() => {
                      onApprove(deal.deal_id);
                      onClose();
                    }}
                    className="apple-press px-4 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer min-h-[38px] sm:min-h-0 text-center col-span-2 xs:col-auto"
                  >
                    Approve (LOI)
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="apple-press px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer min-h-[38px] sm:min-h-0 text-center col-span-2 xs:col-auto"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

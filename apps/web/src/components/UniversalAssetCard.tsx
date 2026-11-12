"use client";

import React from "react";
import {
  Briefcase,
  Building,
  FileSpreadsheet,
  Truck,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Send,
  Compass,
  Gauge,
} from "lucide-react";
import { UniversalAsset, AssetClass, PipelineStage } from "../lib/types";
import InfoPop from "./InfoPop";

interface UniversalAssetCardProps {
  asset: UniversalAsset;
  onInspect: (asset: UniversalAsset) => void;
  onDraftOutreach: (asset: UniversalAsset) => void;
  onUpdateStage?: (assetId: string, stage: PipelineStage) => void;
}

const CLASS_CONFIG: Record<
  AssetClass,
  { label: string; icon: any; badgeBg: string; textCol: string; borderCol: string }
> = {
  BUSINESS_ACQUISITION: {
    label: "Operating SMB",
    icon: Briefcase,
    badgeBg: "bg-purple-950/50",
    textCol: "text-purple-300",
    borderCol: "border-purple-800/50",
  },
  REAL_ESTATE: {
    label: "Real Estate",
    icon: Building,
    badgeBg: "bg-emerald-950/50",
    textCol: "text-emerald-300",
    borderCol: "border-emerald-800/50",
  },
  TAX_LIEN_MUNICIPAL: {
    label: "Tax Lien",
    icon: FileSpreadsheet,
    badgeBg: "bg-amber-950/50",
    textCol: "text-amber-300",
    borderCol: "border-amber-800/50",
  },
  EQUIPMENT_FLEET: {
    label: "Fleet & Equipment",
    icon: Truck,
    badgeBg: "bg-cyan-950/50",
    textCol: "text-cyan-300",
    borderCol: "border-cyan-800/50",
  },
};

const STAGE_LABELS: Record<PipelineStage, { label: string; color: string }> = {
  SAVED: { label: "Saved", color: "bg-zinc-800/70 text-zinc-400 border-zinc-700/60" },
  OUTREACH_PENDING: { label: "Outreach Ready", color: "bg-blue-950/60 text-blue-300 border-blue-800/60" },
  IN_COMMUNICATION: { label: "In Dialogue", color: "bg-amber-950/60 text-amber-300 border-amber-800/60" },
  UNDER_DILIGENCE: { label: "Under Diligence", color: "bg-purple-950/60 text-purple-300 border-purple-800/60" },
  LOI_ISSUED: { label: "LOI Sent", color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60" },
  CLOSED: { label: "Closed", color: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" },
  PASSED: { label: "Archived", color: "bg-zinc-900 text-zinc-500 border-zinc-800" },
};

export default function UniversalAssetCard({
  asset,
  onInspect,
  onDraftOutreach,
}: UniversalAssetCardProps) {
  const config = CLASS_CONFIG[asset.asset_class] || CLASS_CONFIG.BUSINESS_ACQUISITION;
  const Icon = config.icon;
  const stageInfo = STAGE_LABELS[asset.pipeline_stage] || STAGE_LABELS.SAVED;

  const formatUSD = (val?: string) => {
    if (!val) return "—";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-zinc-900/80 hover:bg-zinc-850/90 border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header: Class Badge, Stage Pill, & Key Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeBg} ${config.textCol} ${config.borderCol}`}
            >
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
            </span>

            {asset.is_potential_baby_boomer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60">
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                <span>Boomer Founder</span>
              </span>
            )}

            {asset.section_8_eligible && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span>Sec. 8</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onInspect(asset)}
              title="Inspect Augury Physical Machine & Roof Health"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition cursor-pointer"
            >
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Health</span>
            </button>
            <button
              onClick={() => onInspect(asset)}
              title="Inspect 3D Digital Twin & Site Elevation"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition cursor-pointer"
            >
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>3D</span>
            </button>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border uppercase tracking-wider ${stageInfo.color}`}
            >
              {stageInfo.label}
            </span>
          </div>
        </div>

        {/* Title & Location */}
        <h3
          onClick={() => onInspect(asset)}
          className="text-base font-bold text-white group-hover:text-blue-300 cursor-pointer transition leading-snug line-clamp-1"
        >
          {asset.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 mb-3.5">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>
            {asset.city}, {asset.state} <span className="text-zinc-600">({asset.metro_area})</span>
          </span>
        </div>

        {/* Primary Financial & Operating Metrics (Glanceable 3-Col Micro-Grid) */}
        <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 mb-3.5">
          {asset.asset_class === "BUSINESS_ACQUISITION" && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tenure</span>
                <span className="text-xs font-semibold text-white">
                  {asset.operating_years ? `${asset.operating_years} yrs` : "—"}
                </span>
              </div>
              <div className="border-x border-zinc-850">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Est. Revenue</span>
                <span className="text-xs font-semibold text-zinc-200">
                  {formatUSD(asset.estimated_annual_revenue_usd)}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
                  <span>SDE / Cashflow</span>
                  <InfoPop term="SDE" size="xs" />
                </div>
                <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                  {formatUSD(asset.estimated_sde_or_ebitda_usd)}
                </span>
              </div>
            </div>
          )}

          {asset.asset_class === "REAL_ESTATE" && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Cap Rate</span>
                <span className="text-xs font-bold text-emerald-400">
                  {asset.cap_rate_pct ? `${asset.cap_rate_pct}%` : "—"}
                </span>
              </div>
              <div className="border-x border-zinc-850">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Units</span>
                <span className="text-xs font-semibold text-white">
                  {asset.units_count ? `${asset.units_count} Units` : asset.property_type || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Rent / Mo</span>
                <span className="text-xs font-semibold text-zinc-200">
                  {formatUSD(asset.average_monthly_rent_usd)}
                </span>
              </div>
            </div>
          )}

          {asset.asset_class === "TAX_LIEN_MUNICIPAL" && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Lien Face</span>
                <span className="text-xs font-bold text-amber-400">
                  {formatUSD(asset.lien_face_value_usd)}
                </span>
              </div>
              <div className="border-x border-zinc-850">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Yield</span>
                <span className="text-xs font-bold text-emerald-400">
                  {asset.redemption_penalty_rate_pct ? `${asset.redemption_penalty_rate_pct}%` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Collateral</span>
                <span className="text-xs font-semibold text-white">
                  {formatUSD(asset.parcel_assessed_value_usd)}
                </span>
              </div>
            </div>
          )}

          {asset.asset_class === "EQUIPMENT_FLEET" && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Equipment Model</span>
                <span className="text-xs font-semibold text-white truncate block">
                  {asset.machinery_type || "Heavy Equipment"}
                </span>
              </div>
              <div className="border-l border-zinc-850">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Usage</span>
                <span className="text-xs font-bold text-cyan-400">
                  {asset.hours_or_mileage || "Low Hours"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Safety & Macro Telemetry */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Crime:</span>
            <span
              className={`font-mono font-bold ${
                asset.crime_index <= 30
                  ? "text-emerald-400"
                  : asset.crime_index <= 50
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {asset.crime_index} / 100
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">10y Growth:</span>
            <span className="font-semibold text-zinc-300">
              +{asset.population_growth_10yr_pct}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Median Inc:</span>
            <span className="font-semibold text-zinc-300">
              {formatUSD(asset.median_household_income_usd)}
            </span>
          </div>
        </div>

        {/* AI Deal Thesis */}
        {asset.ai_deal_thesis && (
          <p className="text-xs text-zinc-300 line-clamp-2 italic mb-3 border-l-2 border-blue-500/50 pl-2 py-0.5">
            &ldquo;{asset.ai_deal_thesis}&rdquo;
          </p>
        )}
      </div>

      {/* Footer: Valuation, Floor, and Actions */}
      <div className="pt-3 border-t border-zinc-850">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              Asking Valuation
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              {formatUSD(asset.asking_or_estimated_value_usd)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              Liquidation Floor
            </span>
            <span className="text-xs font-semibold text-zinc-400 font-mono">
              {formatUSD(asset.downside_liquidation_floor_usd)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDraftOutreach(asset)}
            className="apple-press flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 text-xs font-semibold transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span>Playbook</span>
          </button>

          <button
            onClick={() => onInspect(asset)}
            className="apple-press flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <span>Dossier & 3D</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

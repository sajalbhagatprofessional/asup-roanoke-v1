"use client";

import React from "react";
import {
  X,
  Layers,
  ArrowRight,
  MapPin,
  DollarSign,
  Briefcase,
  Building,
  FileSpreadsheet,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { UniversalAsset, PipelineStage, AssetClass } from "../lib/types";

interface DealPipelineKanbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: UniversalAsset[];
  onSelectAsset: (asset: UniversalAsset) => void;
  onAdvanceStage: (assetId: string, nextStage: PipelineStage) => void;
}

const STAGES: { stage: PipelineStage; label: string; color: string; next?: PipelineStage }[] = [
  { stage: "SAVED", label: "Radar / Saved", color: "border-zinc-700 bg-zinc-800/40", next: "OUTREACH_PENDING" },
  { stage: "OUTREACH_PENDING", label: "Outreach Ready", color: "border-blue-700/50 bg-blue-950/20", next: "IN_COMMUNICATION" },
  { stage: "IN_COMMUNICATION", label: "In Dialogue", color: "border-amber-700/50 bg-amber-950/20", next: "UNDER_DILIGENCE" },
  { stage: "UNDER_DILIGENCE", label: "Under Diligence", color: "border-purple-700/50 bg-purple-950/20", next: "LOI_ISSUED" },
  { stage: "LOI_ISSUED", label: "LOI / Offer Sent", color: "border-indigo-700/50 bg-indigo-950/20", next: "CLOSED" },
  { stage: "CLOSED", label: "Closed Acquisitions", color: "border-emerald-700/50 bg-emerald-950/20" },
];

export default function DealPipelineKanbanModal({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onAdvanceStage,
}: DealPipelineKanbanModalProps) {
  if (!isOpen) return null;

  const formatUSD = (val?: string) => {
    if (!val) return "—";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-hidden">
      <div className="relative w-full max-w-7xl h-[92vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 flex flex-col text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Deal Flow Pipeline & CRM Kanban
              </h2>
              <p className="text-xs text-zinc-400">
                Visual lifecycle management across all asset classes nationwide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Kanban Columns */}
        <div className="flex-1 overflow-x-auto py-4 flex gap-4 scrollbar-thin">
          {STAGES.map((col) => {
            const colAssets = assets.filter((a) => a.pipeline_stage === col.stage);
            return (
              <div
                key={col.stage}
                className={`w-72 shrink-0 flex flex-col rounded-xl border ${col.color} p-3 overflow-hidden`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300">
                    {colAssets.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colAssets.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-xs text-zinc-500 italic">
                      No assets in this stage
                    </div>
                  ) : (
                    colAssets.map((asset) => (
                      <div
                        key={asset.asset_id}
                        className="bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl p-3 shadow-sm hover:shadow-md transition text-left cursor-pointer group"
                        onClick={() => onSelectAsset(asset)}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 truncate">
                            {asset.asset_class.replace("_", " ")}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            {formatUSD(asset.asking_or_estimated_value_usd)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-blue-300 line-clamp-2 leading-snug">
                          {asset.title}
                        </h4>

                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1.5">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">
                            {asset.city}, {asset.state}
                          </span>
                        </div>

                        {/* Fast advance button if not closed */}
                        {col.next && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-700/40 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdvanceStage(asset.asset_id, col.next!);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-zinc-700/60 hover:bg-blue-600 text-zinc-300 hover:text-white transition"
                              title={`Advance to ${col.next}`}
                            >
                              <span>Advance</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Click any deal card to inspect full OSINT dossier and outreach playbooks</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition"
          >
            Close Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  Building,
  FileSpreadsheet,
  Truck,
  Layers,
  Sparkles,
  ShieldCheck,
  X,
  ChevronDown,
  RotateCcw,
  MapPin,
  ArrowUpDown,
} from "lucide-react";
import { AssetClass, PipelineStage } from "../lib/types";

interface UniversalAssetSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedClass: AssetClass | "ALL";
  onClassChange: (cls: AssetClass | "ALL") => void;
  selectedMetro: string;
  onMetroChange: (metro: string) => void;
  babyBoomerOnly: boolean;
  onBabyBoomerChange: (val: boolean) => void;
  section8Only: boolean;
  onSection8Change: (val: boolean) => void;
  maxCrimeIndex?: number;
  onMaxCrimeIndexChange: (val?: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  pipelineStage?: PipelineStage | "ALL";
  onPipelineStageChange?: (stage: PipelineStage | "ALL") => void;
  onOpenPreferences: () => void;
  onOpenKanban: () => void;
  totalAssetsFound: number;
}

const CLASS_TABS: { id: AssetClass | "ALL"; label: string; icon: any }[] = [
  { id: "ALL", label: "All Assets", icon: Layers },
  { id: "BUSINESS_ACQUISITION", label: "Operating SMBs", icon: Briefcase },
  { id: "REAL_ESTATE", label: "Real Estate", icon: Building },
  { id: "TAX_LIEN_MUNICIPAL", label: "Tax Liens", icon: FileSpreadsheet },
  { id: "EQUIPMENT_FLEET", label: "Fleets & Equipment", icon: Truck },
];

export default function UniversalAssetSearchBar({
  searchQuery,
  onSearchChange,
  selectedClass,
  onClassChange,
  selectedMetro,
  onMetroChange,
  babyBoomerOnly,
  onBabyBoomerChange,
  section8Only,
  onSection8Change,
  maxCrimeIndex,
  onMaxCrimeIndexChange,
  sortBy,
  onSortChange,
  onOpenPreferences,
  onOpenKanban,
  totalAssetsFound,
}: UniversalAssetSearchBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFilterCount =
    (selectedMetro ? 1 : 0) +
    (babyBoomerOnly ? 1 : 0) +
    (section8Only ? 1 : 0) +
    (maxCrimeIndex !== undefined ? 1 : 0);

  const handleClearFilters = () => {
    onSearchChange("");
    onClassChange("ALL");
    onMetroChange("");
    onBabyBoomerChange(false);
    onSection8Change(false);
    onMaxCrimeIndexChange(undefined);
    onSortChange("recommended");
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl shadow-xl backdrop-blur-xl transition-all">
      {/* Primary Spotlight Header Row (Apple 48px Input Bar) */}
      <div className="p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2">
        {/* Spotlight Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search assets nationwide (e.g. 'accounting Allentown', 'warehouse', 'tax lien', 'CNC')..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-white transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Actions Group */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          {/* Progressive Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`apple-press flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isDrawerOpen || activeFilterCount > 0
                ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                : "bg-zinc-950/60 text-zinc-400 hover:text-white border-zinc-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isDrawerOpen ? "rotate-180" : ""}`} />
          </button>

          {/* CRM Pipeline Button */}
          <button
            type="button"
            onClick={onOpenKanban}
            className="apple-press flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition cursor-pointer"
            title="Open Deal Flow Kanban Pipeline"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">CRM Pipeline</span>
          </button>

          {/* Preferences Button */}
          <button
            type="button"
            onClick={onOpenPreferences}
            className="apple-press flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold transition cursor-pointer"
            title="Edit Investor Mandate & Criteria"
          >
            <span>Criteria</span>
          </button>
        </div>
      </div>

      {/* Asset Class Segmented Filter Tabs */}
      <div className="px-2.5 pb-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-t border-zinc-850/60 pt-2">
        <div className="flex items-center space-x-1">
          {CLASS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedClass === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onClassChange(tab.id)}
                className={`apple-press flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? "bg-zinc-800 text-white font-semibold border border-zinc-700/80 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Counter & Sort Indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-zinc-500 shrink-0">
          <span>
            <strong className="text-zinc-200 font-mono">{totalAssetsFound}</strong> assets indexed
          </span>
        </div>
      </div>

      {/* Progressive Disclosure Filter Drawer (Smooth Slide-Down) */}
      {isDrawerOpen && (
        <div className="px-3.5 py-3 border-t border-zinc-850 bg-zinc-950/50 rounded-b-2xl space-y-3 animate-fadeIn text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Metro Area Select */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Target Metro Market
              </label>
              <select
                value={selectedMetro}
                onChange={(e) => onMetroChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                <option value="">All Metro Markets (Nationwide)</option>
                <option value="Allentown">Allentown-Bethlehem, PA</option>
                <option value="Roanoke">Roanoke Valley, VA</option>
                <option value="Raleigh">Raleigh-Durham, NC</option>
                <option value="Austin">Austin-Round Rock, TX</option>
                <option value="Chicago">Chicago Metro, IL</option>
                <option value="Miami">Miami-Fort Lauderdale, FL</option>
              </select>
            </div>

            {/* Founder Succession Filter */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Founder Demographics
              </label>
              <button
                type="button"
                onClick={() => onBabyBoomerChange(!babyBoomerOnly)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  babyBoomerOnly
                    ? "bg-purple-950/70 border-purple-600/70 text-purple-200 font-semibold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Baby Boomer Succession</span>
                </span>
                <span className="font-mono text-[10px]">{babyBoomerOnly ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Macro Crime & Safety Filter */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Neighborhood Safety
              </label>
              <button
                type="button"
                onClick={() => onMaxCrimeIndexChange(maxCrimeIndex === 30 ? undefined : 30)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  maxCrimeIndex === 30
                    ? "bg-emerald-950/70 border-emerald-600/70 text-emerald-200 font-semibold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Safe Pocket (Crime &le; 30)</span>
                </span>
                <span className="font-mono text-[10px]">{maxCrimeIndex === 30 ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Sort Engine Selector */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Sort Hierarchy
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                <option value="recommended">Recommended (Aladdin Composite)</option>
                <option value="price_asc">Valuation: Low to High</option>
                <option value="price_desc">Valuation: High to Low</option>
                <option value="crime_asc">Safest Crime Index</option>
                <option value="years_desc">Longest Operating Tenure</option>
                <option value="cap_rate_desc">Highest Cap Rate</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Footer */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-zinc-850 text-xs">
              <span className="text-zinc-500">
                {activeFilterCount} active filter criteria applied
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center space-x-1 text-zinc-400 hover:text-rose-400 transition cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

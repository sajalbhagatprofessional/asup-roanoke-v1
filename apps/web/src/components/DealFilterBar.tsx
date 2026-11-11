"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  DollarSign,
  MapPin,
  Flame,
  Check,
  RotateCcw,
} from "lucide-react";
import { DealFilterParams } from "../lib/types";

interface DealFilterBarProps {
  filters: DealFilterParams;
  onFilterChange: (newFilters: DealFilterParams) => void;
  totalResults: number;
}

const REGIONAL_COUNTIES = [
  { fips: "51770", name: "City of Roanoke (Core)" },
  { fips: "51161", name: "Roanoke County (Core)" },
  { fips: "51775", name: "City of Salem" },
  { fips: "51023", name: "Botetourt County" },
  { fips: "51067", name: "Franklin County" },
  { fips: "51019", name: "Bedford County" },
  { fips: "51121", name: "Montgomery County" },
  { fips: "51750", name: "Radford City" },
  { fips: "51045", name: "Craig County" },
  { fips: "51063", name: "Floyd County" },
];

const NAICS_VERTICALS = [
  { prefix: "332", label: "Machining & CNC (332)" },
  { prefix: "238", label: "Contractors & Trades (238)" },
  { prefix: "811", label: "Fleet & Auto Repair (811)" },
  { prefix: "42", label: "Wholesale & Distribution (42)" },
  { prefix: "484", label: "Trucking & Logistics (484)" },
  { prefix: "4471", label: "Fuel / C-Store CRE (4471)" },
];

export default function DealFilterBar({
  filters,
  onFilterChange,
  totalResults,
}: DealFilterBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.q || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, q: searchInput.trim() || undefined });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    onFilterChange({
      role: filters.role,
      stage: filters.stage,
      sort_by: "dscr_desc",
    });
  };

  const handleQuickPreset = (presetKey: string) => {
    switch (presetKey) {
      case "ALL":
        onFilterChange({ role: filters.role, stage: filters.stage, sort_by: "dscr_desc" });
        break;
      case "TRUSTEE_SALE":
        onFilterChange({ ...filters, signal_type: "TRUSTEE_SALE" });
        break;
      case "BANKRUPTCY":
        onFilterChange({ ...filters, signal_type: "BANKRUPTCY" });
        break;
      case "TAX_SALE":
        onFilterChange({ ...filters, signal_type: "TAX_SALE" });
        break;
      case "BROKER_LISTING":
        onFilterChange({ ...filters, signal_type: "BROKER_LISTING" });
        break;
      case "MACHINING":
        onFilterChange({ ...filters, naics_prefix: "332" });
        break;
      case "CONTRACTORS":
        onFilterChange({ ...filters, naics_prefix: "238" });
        break;
      case "CORE_VALLEY":
        onFilterChange({ ...filters, fips_code: "51770,51161,51775" });
        break;
      case "PRIME_DSCR":
        onFilterChange({ ...filters, min_base_dscr: "1.35" });
        break;
      case "DEEP_DISCOUNT":
        onFilterChange({ ...filters, max_basis_ratio: "0.70" });
        break;
      default:
        break;
    }
  };

  const hasActiveFilters = Boolean(
    filters.signal_type ||
      filters.fips_code ||
      filters.naics_prefix ||
      filters.min_price_usd ||
      filters.max_price_usd ||
      filters.min_base_dscr ||
      filters.max_basis_ratio ||
      filters.has_cre !== undefined ||
      filters.q
  );

  return (
    <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Search Input & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search debtor entity, parcel GPIN, docket, or keyword..."
            className="w-full pl-9 pr-9 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                onFilterChange({ ...filters, q: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Filter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              hasActiveFilters || isDrawerOpen
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={filters.sort_by || "dscr_desc"}
              onChange={(e) => onFilterChange({ ...filters, sort_by: e.target.value })}
              className="px-3 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="dscr_desc">Sort: Highest DSCR</option>
              <option value="basis_asc">Sort: Lowest Basis Ratio (&lt;=70%)</option>
              <option value="price_asc">Sort: Lowest Price</option>
              <option value="price_desc">Sort: Highest Price</option>
              <option value="date_desc">Sort: Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Chips Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
        <span className="text-slate-400 text-[11px] font-mono mr-1 shrink-0">Presets:</span>
        <button
          onClick={() => handleQuickPreset("ALL")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition font-medium text-[11px] ${
            !hasActiveFilters
              ? "bg-slate-700 text-white font-bold"
              : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleQuickPreset("TRUSTEE_SALE")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.signal_type === "TRUSTEE_SALE"
              ? "bg-indigo-900/90 text-indigo-200 font-bold border border-indigo-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Foreclosure Sales
        </button>
        <button
          onClick={() => handleQuickPreset("BANKRUPTCY")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.signal_type === "BANKRUPTCY"
              ? "bg-amber-900/90 text-amber-200 font-bold border border-amber-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Bankruptcy 363
        </button>
        <button
          onClick={() => handleQuickPreset("BROKER_LISTING")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.signal_type === "BROKER_LISTING"
              ? "bg-cyan-900/90 text-cyan-200 font-bold border border-cyan-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Broker Listings
        </button>
        <button
          onClick={() => handleQuickPreset("MACHINING")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.naics_prefix === "332"
              ? "bg-emerald-900/90 text-emerald-200 font-bold border border-emerald-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Machine Shops (332)
        </button>
        <button
          onClick={() => handleQuickPreset("CORE_VALLEY")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.fips_code === "51770,51161,51775"
              ? "bg-blue-900/90 text-blue-200 font-bold border border-blue-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Core Roanoke Valley
        </button>
        <button
          onClick={() => handleQuickPreset("PRIME_DSCR")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.min_base_dscr === "1.35"
              ? "bg-emerald-900/90 text-emerald-200 font-bold border border-emerald-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          DSCR &gt;= 1.35x
        </button>
        <button
          onClick={() => handleQuickPreset("DEEP_DISCOUNT")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] ${
            filters.max_basis_ratio === "0.70"
              ? "bg-purple-900/90 text-purple-200 font-bold border border-purple-700"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Basis &lt;= 70%
        </button>
      </div>

      {/* Expandable Advanced Filter Drawer */}
      {isDrawerOpen && (
        <div className="pt-3 border-t border-slate-800 space-y-4 text-xs animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Regional County */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Regional County / FIPS
              </label>
              <select
                value={filters.fips_code || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    fips_code: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Regional Counties</option>
                <option value="51770,51161,51775">Preset: Core Roanoke Valley</option>
                <option value="51023,51067,51019,51121">Preset: Neighboring Industrial</option>
                {REGIONAL_COUNTIES.map((c) => (
                  <option key={c.fips} value={c.fips}>
                    {c.fips} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Distress Signal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Distress Signal Type
              </label>
              <select
                value={filters.signal_type || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    signal_type: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Signals (Distress &amp; Market)</option>
                <option value="TRUSTEE_SALE">Substitute Trustee Foreclosure</option>
                <option value="BANKRUPTCY">Bankruptcy Court (§ 363 / Ch. 11)</option>
                <option value="TAX_SALE">City / County Judicial Tax Sale</option>
                <option value="BROKER_LISTING">Broker / M&amp;A Market Listing</option>
              </select>
            </div>

            {/* 3. NAICS Vertical */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Asset Vertical (NAICS)
              </label>
              <select
                value={filters.naics_prefix || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    naics_prefix: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Approved Verticals</option>
                {NAICS_VERTICALS.map((v) => (
                  <option key={v.prefix} value={v.prefix}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Underwriting Hurdle (DSCR) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Minimum Base DSCR Hurdle
              </label>
              <select
                value={filters.min_base_dscr || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    min_base_dscr: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">All DSCR Ratios</option>
                <option value="1.25">SBA SOP 50 10 8.1 Floor (&gt;= 1.25x)</option>
                <option value="1.35">Principal Hurdle (&gt;= 1.35x)</option>
                <option value="1.50">Prime Coverage (&gt;= 1.50x)</option>
              </select>
            </div>

            {/* 5. Max Basis Ratio */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Basis to Replacement Ratio
              </label>
              <select
                value={filters.max_basis_ratio || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    max_basis_ratio: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">Any Ratio</option>
                <option value="0.60">Deep Discount (&lt;= 60%)</option>
                <option value="0.70">Va. Foreclosure Cap (&lt;= 70%)</option>
                <option value="0.80">Moderate Discount (&lt;= 80%)</option>
              </select>
            </div>

            {/* 6. Price Range */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Max Price ($ USD)
              </label>
              <select
                value={filters.max_price_usd || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    max_price_usd: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">No Maximum ($5.75M Mandate Cap)</option>
                <option value="1000000.00">Up to $1,000,000</option>
                <option value="2500000.00">Up to $2,500,000</option>
                <option value="4000000.00">Up to $4,000,000</option>
                <option value="5000000.00">Up to $5,000,000</option>
              </select>
            </div>

            {/* 7. Collateral Floor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Collateral Floor
              </label>
              <select
                value={
                  filters.has_cre === undefined
                    ? ""
                    : filters.has_cre
                    ? "true"
                    : "false"
                }
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    has_cre:
                      e.target.value === "true"
                        ? true
                        : e.target.value === "false"
                        ? false
                        : undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">CRE or Heavy Equipment</option>
                <option value="true">Owner-Occupied Real Estate Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Pills Bar & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px]">
            {totalResults} {totalResults === 1 ? "deal" : "deals"} found
          </span>

          {filters.q && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
              <span>Query: &quot;{filters.q}&quot;</span>
              <button
                onClick={() => {
                  setSearchInput("");
                  onFilterChange({ ...filters, q: undefined });
                }}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.signal_type && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[11px]">
              <span>Signal: {filters.signal_type}</span>
              <button
                onClick={() => onFilterChange({ ...filters, signal_type: undefined })}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.fips_code && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800 text-[11px]">
              <span>FIPS: {filters.fips_code}</span>
              <button
                onClick={() => onFilterChange({ ...filters, fips_code: undefined })}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.naics_prefix && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px]">
              <span>NAICS: {filters.naics_prefix}*</span>
              <button
                onClick={() => onFilterChange({ ...filters, naics_prefix: undefined })}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.min_base_dscr && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px]">
              <span>DSCR &gt;= {filters.min_base_dscr}x</span>
              <button
                onClick={() => onFilterChange({ ...filters, min_base_dscr: undefined })}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.max_basis_ratio && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 text-[11px]">
              <span>Basis &lt;= {Number(filters.max_basis_ratio) * 100}%</span>
              <button
                onClick={() => onFilterChange({ ...filters, max_basis_ratio: undefined })}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.max_price_usd && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
              <span>Max: ${Number(filters.max_price_usd).toLocaleString()}</span>
              <button
                onClick={() => onFilterChange({ ...filters, max_price_usd: undefined })}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center space-x-1 text-slate-400 hover:text-white font-mono text-[11px] underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

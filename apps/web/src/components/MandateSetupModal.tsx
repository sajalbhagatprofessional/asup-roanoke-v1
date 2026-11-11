"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Compass,
  MapPin,
  DollarSign,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Search,
  Check,
} from "lucide-react";
import {
  configureMandate,
  fetchActiveMandate,
  fetchStateCounties,
  fetchStatesAndPresets,
  fetchTargetedListings,
} from "../lib/api";
import { MandateProfile, MetroPresetInfo, StateGeoInfo } from "../lib/types";

interface MandateSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: MandateProfile) => void;
}

export default function MandateSetupModal({
  isOpen,
  onClose,
  onSuccess,
}: MandateSetupModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [states, setStates] = useState<StateGeoInfo[]>([]);
  const [presets, setPresets] = useState<MetroPresetInfo[]>([]);
  const [selectedState, setSelectedState] = useState("VA");
  const [availableCounties, setAvailableCounties] = useState<any[]>([]);
  const [countySearch, setCountySearch] = useState("");

  // Mandate Form State
  const [mandateName, setMandateName] = useState("Targeted Regional Box");
  const [selectedFips, setSelectedFips] = useState<string[]>([
    "51770", "51161", "51775", "51023", "51067", "51019", "51121"
  ]);
  const [minPrice, setMinPrice] = useState("500000.00");
  const [maxPrice, setMaxPrice] = useState("3500000.00");
  const [minDscr, setMinDscr] = useState("1.3500");
  const [hasCreOnly, setHasCreOnly] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("PRESET_ROANOKE_VALLEY");
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) {
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
  }, [isOpen, submitting, onClose]);

  // Load active mandate and geography metadata
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      Promise.all([fetchActiveMandate(), fetchStatesAndPresets()])
        .then(([active, geoData]) => {
          setStates(geoData.states);
          setPresets(geoData.metro_presets);

          if (active) {
            setMandateName(active.mandate_name);
            setSelectedState(active.target_states[0] || "VA");
            setSelectedFips(active.target_fips || []);
            setMinPrice(active.min_price_usd || "500000.00");
            setMaxPrice(active.max_price_usd || "3500000.00");
            setMinDscr(active.min_base_dscr || "1.3500");
            setHasCreOnly(active.has_cre_required || false);
            if (active.active_metro_preset) {
              setSelectedPresetId(active.active_metro_preset);
            }
          }
        })
        .catch((err) => setError(err.message || "Failed to load mandate data"))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Load counties whenever selectedState changes
  useEffect(() => {
    if (selectedState) {
      fetchStateCounties(selectedState)
        .then((res) => setAvailableCounties(res.counties))
        .catch(console.error);
    }
  }, [selectedState]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: MetroPresetInfo) => {
    setSelectedPresetId(preset.preset_id);
    setSelectedState(preset.state_code);
    setMandateName(preset.name);
    setSelectedFips(preset.counties.map((c) => c.fips_code));
  };

  const toggleFips = (fips: string) => {
    setSelectedPresetId(""); // Custom selection
    if (selectedFips.includes(fips)) {
      setSelectedFips(selectedFips.filter((f) => f !== fips));
    } else {
      setSelectedFips([...selectedFips, fips]);
    }
  };

  const selectAllCounties = () => {
    setSelectedPresetId("");
    const all = availableCounties.map((c) => c.fips_code);
    setSelectedFips(all);
  };

  const clearAllCounties = () => {
    setSelectedPresetId("");
    setSelectedFips([]);
  };

  const handleSaveAndScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFips.length === 0) {
      setError("Please select at least one county or metropolitan cluster.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const priceNum = parseFloat(maxPrice) || 5000000;
    const nearMissCeiling = (priceNum * 1.15).toFixed(2);

    const newProfile: MandateProfile = {
      mandate_id: `MANDATE-${selectedState}-${Date.now().toString().slice(-4)}`,
      mandate_name: mandateName,
      target_states: [selectedState],
      target_fips: selectedFips,
      min_price_usd: minPrice,
      max_price_usd: maxPrice,
      near_miss_max_price_usd: nearMissCeiling,
      min_base_dscr: minDscr,
      approved_naics_prefixes: [
        "31", "32", "33", "42", "4413", "4471", "484", "493", "238", "811", "722"
      ],
      has_cre_required: hasCreOnly,
      active_metro_preset: selectedPresetId || undefined,
    };

    try {
      // 1. Configure the active mandate on backend
      const res = await configureMandate(newProfile);

      // 2. Trigger on-demand targeted scanning strictly for this market
      await fetchTargetedListings();

      onSuccess(res.profile);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update target mandate");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCounties = availableCounties.filter((county) =>
    county.county_name.toLowerCase().includes(countySearch.toLowerCase()) ||
    county.fips_code.includes(countySearch)
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Dialog Card - Strictly Clamped to max-h-[86vh] */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[86vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100"
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Target Acquisition Mandate &amp; Budget Setup</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                  Zero-Waste Sourcing
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pollers query strictly the selected target counties and budget bounds. Zero wasted nationwide requests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading nationwide court directory &amp; metro clusters...</p>
            </div>
          ) : (
            <form id="mandate-form" onSubmit={handleSaveAndScan} className="space-y-6">
              {/* 1. Metro Cluster Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      1-Click Strategic Metro Cluster Presets:
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Instantly pins state + court jurisdictions
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {presets.map((preset) => {
                    const isSelected = selectedPresetId === preset.preset_id;
                    return (
                      <button
                        key={preset.preset_id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-950/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30 text-white"
                            : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              <span>{preset.name}</span>
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700 font-semibold">
                              {preset.state_code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-2">
                          {preset.counties.length} Jurisdictions Included
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Custom State & County Selection */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Or Select Target State &amp; Counties:</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Target State:</span>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setSelectedPresetId("");
                        setSelectedFips([]);
                        setCountySearch("");
                      }}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      {states.map((st) => (
                        <option key={st.state_code} value={st.state_code}>
                          {st.state_name} ({st.state_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* County Selection Tools & Search */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter counties in list..."
                      value={countySearch}
                      onChange={(e) => setCountySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={selectAllCounties}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      Select All ({availableCounties.length})
                    </button>
                    <button
                      type="button"
                      onClick={clearAllCounties}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* County Checkboxes Grid */}
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl max-h-44 overflow-y-auto custom-scrollbar">
                  {filteredCounties.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono">
                      No counties match &quot;{countySearch}&quot;
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredCounties.map((county) => {
                        const isChecked = selectedFips.includes(county.fips_code);
                        return (
                          <label
                            key={county.fips_code}
                            className={`flex items-center space-x-2 p-2 rounded-lg text-xs cursor-pointer border transition select-none ${
                              isChecked
                                ? "bg-emerald-950/70 border-emerald-700 text-white font-medium"
                                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/70"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFips(county.fips_code)}
                              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="truncate">
                              <span className="block truncate">{county.county_name}</span>
                              <span className="text-[10px] font-mono text-slate-500 block truncate">
                                FIPS {county.fips_code} • {county.bankruptcy_court_id}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Budget & Underwriting Parameters */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Define Purchase / Cure Price Budget Box:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-mono mb-1">
                      Minimum Budget ($ USD)
                    </label>
                    <input
                      type="number"
                      step="50000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-mono mb-1">
                      Maximum Target Ceiling ($ USD)
                    </label>
                    <input
                      type="number"
                      step="50000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-mono mb-1">
                      Near-Miss Quarantine (+15%)
                    </label>
                    <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-amber-300 font-mono text-xs flex items-center justify-between">
                      <span>${(parseFloat(maxPrice || "0") * 1.15).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">$0 Paid API</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-mono mb-1">
                      Underwriting Floor (Base DSCR Hurdle)
                    </label>
                    <select
                      value={minDscr}
                      onChange={(e) => setMinDscr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="1.2500">SBA SOP 50 10 8.1 Statutory Floor (&gt;= 1.25x)</option>
                      <option value="1.3500">Principal Required Hurdle (&gt;= 1.35x)</option>
                      <option value="1.5000">Prime Acquisition Coverage (&gt;= 1.50x)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <input
                      type="checkbox"
                      id="cre_floor"
                      checked={hasCreOnly}
                      onChange={(e) => setHasCreOnly(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="cre_floor" className="text-xs text-slate-300 cursor-pointer select-none">
                      Require Owner-Occupied Commercial Real Estate Collateral
                    </label>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Fixed Sticky Footer - Always Visible on Any Viewport */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono flex items-center flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
              {selectedFips.length} Counties Selected
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-bold">{selectedState} Market</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              ${(parseFloat(minPrice || "0") / 1000).toFixed(0)}k – ${(parseFloat(maxPrice || "0") / 1000000).toFixed(1)}M Box
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="mandate-form"
              disabled={submitting || selectedFips.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Targeting &amp; Scanning...</span>
                </>
              ) : (
                <>
                  <span>Activate Market &amp; Scan Deals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

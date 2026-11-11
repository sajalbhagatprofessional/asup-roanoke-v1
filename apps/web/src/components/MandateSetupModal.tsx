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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Target Acquisition Mandate &amp; Budget Setup
            </h2>
            <p className="text-xs text-slate-400">
              Scrapers and M&amp;A connectors only query the selected states, counties, and budget bounds. Zero wasted nationwide requests.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading nationwide court directory &amp; metro clusters...
          </div>
        ) : (
          <form onSubmit={handleSaveAndScan} className="space-y-6">
            {/* 1. Metro Cluster Quick Presets */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  1-Click Strategic Metro Cluster Presets:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.preset_id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedPresetId === preset.preset_id
                        ? "bg-emerald-950/90 border-emerald-600 text-white"
                        : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{preset.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                          {preset.state_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-2">
                      {preset.counties.length} Counties Selected
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Custom State & County Selection */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Or Customize by State &amp; County:</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Select State:</span>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedPresetId("");
                      setSelectedFips([]);
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

              {/* County Checkboxes */}
              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableCounties.map((county) => {
                    const isChecked = selectedFips.includes(county.fips_code);
                    return (
                      <label
                        key={county.fips_code}
                        className={`flex items-center space-x-2 p-2 rounded-lg text-xs cursor-pointer border transition ${
                          isChecked
                            ? "bg-emerald-950/70 border-emerald-700 text-white"
                            : "bg-slate-800/60 border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFips(county.fips_code)}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="truncate">
                          <span className="font-medium">{county.county_name}</span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            FIPS {county.fips_code} • {county.bankruptcy_court_id}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Budget & Deal Box Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Define Purchase / Cure Price Budget Box:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-mono mb-1">
                    Minimum Price ($ USD)
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
                    Maximum Purchase Ceiling ($ USD)
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
                    Near-Miss Tolerance Ceiling (+15%)
                  </label>
                  <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-amber-300 font-mono text-xs">
                    ${(parseFloat(maxPrice || "0") * 1.15).toLocaleString()} USD
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-mono mb-1">
                    Underwriting Floor (Base DSCR)
                  </label>
                  <select
                    value={minDscr}
                    onChange={(e) => setMinDscr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
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
                  <label htmlFor="cre_floor" className="text-xs text-slate-300 cursor-pointer">
                    Require Owner-Occupied Commercial Real Estate Collateral
                  </label>
                </div>
              </div>
            </div>

            {/* Footer / Submit */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-mono">
                Selected: <span className="text-emerald-400 font-bold">{selectedFips.length} counties</span> in{" "}
                <span className="text-white font-bold">{selectedState}</span> | Budget:{" "}
                <span className="text-white font-bold">
                  ${(parseFloat(minPrice || "0") / 1000).toFixed(0)}k - $
                  {(parseFloat(maxPrice || "0") / 1000000).toFixed(1)}M
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <span>{submitting ? "Targeting & Scanning..." : "Activate Market & Scan Deals"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

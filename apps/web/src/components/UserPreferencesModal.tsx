"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  MapPin,
  DollarSign,
  Briefcase,
  Building,
  FileSpreadsheet,
  Truck,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AssetClass, OperatorStyle, UserPreferenceProfile } from "../lib/types";
import { saveUserPreferences } from "../lib/api";

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferenceProfile;
  onPreferencesSaved: (updated: UserPreferenceProfile) => void;
}

const ASSET_CLASS_OPTIONS: { id: AssetClass; label: string; icon: any; desc: string }[] = [
  {
    id: "BUSINESS_ACQUISITION",
    label: "Operating Businesses",
    icon: Briefcase,
    desc: "Off-market succession, retiring founders, cash-flowing SMBs",
  },
  {
    id: "REAL_ESTATE",
    label: "Real Estate & Housing",
    icon: Building,
    desc: "Multi-family, Section 8 guaranteed, industrial, and commercial CRE",
  },
  {
    id: "TAX_LIEN_MUNICIPAL",
    label: "Tax Liens & Municipal Debt",
    icon: FileSpreadsheet,
    desc: "16-18% statutory penalty certificates, sheriff foreclosure sales",
  },
  {
    id: "EQUIPMENT_FLEET",
    label: "Heavy Equipment & Fleets",
    icon: Truck,
    desc: "CNC machining centers, commercial transport, liquidation floors",
  },
];

export default function UserPreferencesModal({
  isOpen,
  onClose,
  currentPreferences,
  onPreferencesSaved,
}: UserPreferencesModalProps) {
  const [prefs, setPrefs] = useState<UserPreferenceProfile>(currentPreferences);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setPrefs(currentPreferences);
  }, [currentPreferences]);

  if (!isOpen) return null;

  const toggleAssetClass = (cls: AssetClass) => {
    const exists = prefs.target_asset_classes.includes(cls);
    let updated: AssetClass[];
    if (exists) {
      if (prefs.target_asset_classes.length === 1) return; // keep at least one
      updated = prefs.target_asset_classes.filter((c) => c !== cls);
    } else {
      updated = [...prefs.target_asset_classes, cls];
    }
    setPrefs({ ...prefs, target_asset_classes: updated });
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = newLocationInput.trim();
    if (loc && !prefs.target_locations.includes(loc)) {
      setPrefs({ ...prefs, target_locations: [...prefs.target_locations, loc] });
      setNewLocationInput("");
    }
  };

  const handleRemoveLocation = (loc: string) => {
    if (prefs.target_locations.length === 1) return;
    setPrefs({
      ...prefs,
      target_locations: prefs.target_locations.filter((l) => l !== loc),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveUserPreferences(prefs);
      onPreferencesSaved(res);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToAllentownArchetype = () => {
    setPrefs({
      ...prefs,
      target_locations: ["Allentown, PA", "Nationwide"],
      min_check_usd: "100000.00",
      max_budget_usd: "5000000.00",
      target_asset_classes: [
        "BUSINESS_ACQUISITION",
        "REAL_ESTATE",
        "TAX_LIEN_MUNICIPAL",
        "EQUIPMENT_FLEET",
      ],
      operator_style: "ACTIVE_OPERATOR",
      max_acceptable_crime_index: 45,
      min_years_operating: 15,
      baby_boomer_succession_only: true,
      section_8_only: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Investor Onboarding & Sourcing Mandate
              </h2>
              <p className="text-xs text-zinc-400">
                Personalized nationwide asset filtering criteria automatically applied on login
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

        {/* Content Body */}
        <div className="space-y-6 pt-5">
          {/* Investor Name & Operator Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Investor / Family Office Entity
              </label>
              <input
                type="text"
                value={prefs.investor_name}
                onChange={(e) => setPrefs({ ...prefs, investor_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Principal Family Office"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Strategic Operator Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, operator_style: "ACTIVE_OPERATOR" })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-center ${
                    prefs.operator_style === "ACTIVE_OPERATOR"
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white"
                  }`}
                >
                  Active Operator
                  <span className="block text-[10px] font-normal opacity-80">M&A, Rollup, AI Ops</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, operator_style: "PASSIVE_YIELD" })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-center ${
                    prefs.operator_style === "PASSIVE_YIELD"
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white"
                  }`}
                >
                  Passive Yield
                  <span className="block text-[10px] font-normal opacity-80">Hands-off, Stable Cash</span>
                </button>
              </div>
            </div>
          </div>

          {/* Target Asset Classes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Target Asset Classes (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ASSET_CLASS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = prefs.target_asset_classes.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleAssetClass(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-blue-950/40 border-blue-500/60 text-white"
                        : "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/80"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? "bg-blue-600/30 text-blue-400" : "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-100">{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Target Geographies & Metros
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {prefs.target_locations.map((loc) => (
                <span
                  key={loc}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-600/40"
                >
                  <MapPin className="w-3 h-3 text-blue-400" />
                  {loc}
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc)}
                    className="hover:text-white transition ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddLocation} className="flex gap-2">
              <input
                type="text"
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                placeholder="Add city, metro, or 'Nationwide' (e.g. Allentown, PA)..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white border border-zinc-700 transition"
              >
                Add
              </button>
            </form>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Capital Bounds (USD)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-zinc-400 mb-1 block">Minimum Check</span>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={prefs.min_check_usd}
                    onChange={(e) => setPrefs({ ...prefs, min_check_usd: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <span className="text-xs text-zinc-400 mb-1 block">Maximum Budget</span>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={prefs.max_budget_usd}
                    onChange={(e) => setPrefs({ ...prefs, max_budget_usd: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Macro Filters: Crime, Business Tenure, Section 8, Baby Boomer */}
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60 space-y-4">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Automated Macro Safety & Succession Triggers
            </h3>

            {/* Crime Index Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-zinc-300">Max Acceptable Crime Index (0-100 scale):</span>
                <span className="font-bold text-emerald-400">
                  {prefs.max_acceptable_crime_index} (
                  {prefs.max_acceptable_crime_index <= 30
                    ? "Very Safe Pocket"
                    : prefs.max_acceptable_crime_index <= 50
                    ? "Moderate Safety"
                    : "High Alert"}
                  )
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={prefs.max_acceptable_crime_index}
                onChange={(e) =>
                  setPrefs({ ...prefs, max_acceptable_crime_index: parseInt(e.target.value, 10) })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Min Operating Years */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-zinc-300">Minimum Years in Business (Mature Firms):</span>
                <span className="font-bold text-blue-400">{prefs.min_years_operating}+ Years</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="5"
                value={prefs.min_years_operating}
                onChange={(e) =>
                  setPrefs({ ...prefs, min_years_operating: parseInt(e.target.value, 10) })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200">
                <input
                  type="checkbox"
                  checked={prefs.baby_boomer_succession_only}
                  onChange={(e) =>
                    setPrefs({ ...prefs, baby_boomer_succession_only: e.target.checked })
                  }
                  className="rounded bg-zinc-700 border-zinc-600 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Target Baby Boomer Founders Only (Age 60+)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200">
                <input
                  type="checkbox"
                  checked={prefs.section_8_only}
                  onChange={(e) => setPrefs({ ...prefs, section_8_only: e.target.checked })}
                  className="rounded bg-zinc-700 border-zinc-600 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Section 8 Guaranteed Housing Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800 mt-6">
          <button
            type="button"
            onClick={handleResetToAllentownArchetype}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Preset: Allentown Succession & Cashflow
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition ${
                savedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved & Applied!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Mandate"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

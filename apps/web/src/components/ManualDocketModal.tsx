"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ingestDocket } from "../lib/api";
import { DocketIngestResponse } from "../lib/types";

interface ManualDocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualDocketModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualDocketModalProps) {
  const [docketId, setDocketId] = useState("ROA-MANUAL-01");
  const [mandateCode, setMandateCode] = useState("ROA-REGIONAL-01");
  const [fipsCode, setFipsCode] = useState("51770");
  const [parcelId, setParcelId] = useState("4012903");
  const [entityName, setEntityName] = useState("Blue Ridge Precision Tooling LLC");
  const [naicsCode, setNaicsCode] = useState("332710");
  const [price, setPrice] = useState("1650000.00");
  const [hasFloor, setHasFloor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocketIngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
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
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handlePreFill = (
    type:
      | "IN_BOX"
      | "NEAR_MISS"
      | "BOTETOURT"
      | "FRANKLIN"
      | "BEDFORD"
      | "HARD_KILL"
      | "LUST_BLOCK"
  ) => {
    setResult(null);
    setError(null);
    if (type === "IN_BOX") {
      setDocketId("ROA-INBOX-" + Math.floor(Math.random() * 1000));
      setFipsCode("51770"); // City of Roanoke
      setParcelId("4011902");
      setEntityName("Valley Machining & Gear Corp");
      setNaicsCode("332710");
      setPrice("1750000.00");
      setHasFloor(true);
    } else if (type === "BOTETOURT") {
      setDocketId("BOT-CNC-" + Math.floor(Math.random() * 1000));
      setFipsCode("51023"); // Botetourt County
      setParcelId("BOT-PARCEL-8841");
      setEntityName("Botetourt Precision CNC & Industrial Fabrication LLC");
      setNaicsCode("332710");
      setPrice("2450000.00");
      setHasFloor(true);
    } else if (type === "FRANKLIN") {
      setDocketId("FRK-HVAC-" + Math.floor(Math.random() * 1000));
      setFipsCode("51067"); // Franklin County
      setParcelId("FRK-PARCEL-1940");
      setEntityName("Franklin County Commercial HVAC Contractors Inc.");
      setNaicsCode("238220");
      setPrice("1850000.00");
      setHasFloor(true);
    } else if (type === "BEDFORD") {
      setDocketId("BDF-FLEET-" + Math.floor(Math.random() * 1000));
      setFipsCode("51019"); // Bedford County
      setParcelId("BDF-PARCEL-4412");
      setEntityName("Bedford Commercial Fleet Maintenance & Heavy Truck Repair");
      setNaicsCode("811111");
      setPrice("1650000.00");
      setHasFloor(true);
    } else if (type === "NEAR_MISS") {
      setDocketId("ROA-SALEM-" + Math.floor(Math.random() * 1000));
      setFipsCode("51775"); // City of Salem
      setParcelId("SALEM-099");
      setEntityName("Salem Industrial Fabrication LLC");
      setNaicsCode("332312");
      setPrice("5200000.00"); // In $5.0M - $5.75M near-miss band
      setHasFloor(true);
    } else if (type === "HARD_KILL") {
      setDocketId("ROA-RESID-" + Math.floor(Math.random() * 1000));
      setFipsCode("51770");
      setParcelId("4019999");
      setEntityName("Oakwood Single Family Rental Portfolio");
      setNaicsCode("531110"); // Pure residential - HARD KILL
      setPrice("1200000.00");
      setHasFloor(false);
    } else if (type === "LUST_BLOCK") {
      setDocketId("ROA-GAS-" + Math.floor(Math.random() * 1000));
      setFipsCode("51161"); // Roanoke County
      setParcelId("ROA-GAS-01");
      setEntityName("Midway Fuel & Petroleum Distribution");
      setNaicsCode("447110");
      setPrice("1800000.00");
      setHasFloor(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await ingestDocket({
        docket_id: docketId,
        mandate_code: mandateCode,
        fips_code: fipsCode,
        parcel_id: parcelId,
        entity_name: entityName,
        naics_code: naicsCode,
        asking_or_cure_price_usd: price,
        has_real_estate_or_equipment_floor: hasFloor,
        is_predatory_personal_distress: false,
        source_url: "https://manual.input.local/dockets",
      });
      setResult(res);
      if (res.disposition === "IN_BOX") {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to ingest filing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Dialog Card (Apple Bottom Sheet on Mobile, Dialog on Desktop) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 animate-slideUp sm:animate-none"
      >
        {/* Apple iOS Bottom Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/70 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Fixed Header */}
        <div className="shrink-0 p-3.5 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Manual Docket Dropzone
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Stage 1 Distress Parsing &amp; Zero-Cost Mandate Gate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="apple-press p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
          {/* Quick Pre-fill Presets */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Quick Test Presets:</span>
              <span className="text-slate-500">1-click test filings</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handlePreFill("IN_BOX")}
                className="px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-mono transition"
              >
                In-Box Machining
              </button>
              <button
                type="button"
                onClick={() => handlePreFill("BOTETOURT")}
                className="px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-mono transition"
              >
                Botetourt CNC
              </button>
              <button
                type="button"
                onClick={() => handlePreFill("FRANKLIN")}
                className="px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-mono transition"
              >
                Franklin HVAC
              </button>
              <button
                type="button"
                onClick={() => handlePreFill("NEAR_MISS")}
                className="px-2.5 py-1 rounded-md bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-mono transition"
              >
                Salem Near-Miss
              </button>
              <button
                type="button"
                onClick={() => handlePreFill("HARD_KILL")}
                className="px-2.5 py-1 rounded-md bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-mono transition"
              >
                Residential Kill
              </button>
            </div>
          </div>

          <form id="docket-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Docket ID / Filing Ref</label>
                <input
                  type="text"
                  value={docketId}
                  onChange={(e) => setDocketId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Target Jurisdiction FIPS</label>
                <select
                  value={fipsCode}
                  onChange={(e) => setFipsCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="51770">City of Roanoke (51770)</option>
                  <option value="51161">Roanoke County (51161)</option>
                  <option value="51775">City of Salem (51775)</option>
                  <option value="51023">Botetourt County (51023)</option>
                  <option value="51067">Franklin County (51067)</option>
                  <option value="51019">Bedford County (51019)</option>
                  <option value="51121">Montgomery County (51121)</option>
                  <option value="51059">Fairfax County (51059 - Out of Box)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Entity / Target Name</label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">GIS Parcel ID / GPIN</label>
                <input
                  type="text"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">NAICS Code (6 Digits)</label>
                <input
                  type="text"
                  value={naicsCode}
                  onChange={(e) => setNaicsCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Purchase / Cure Price ($ USD)</label>
                <input
                  type="number"
                  step="50000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="hasFloor"
                checked={hasFloor}
                onChange={(e) => setHasFloor(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="hasFloor" className="text-slate-300 font-mono cursor-pointer select-none">
                Backed by Commercial Real Estate or Hard Equipment Floor
              </label>
            </div>
          </form>

          {/* Feedback & Disposition Banner */}
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs">
              {error}
            </div>
          )}

          {result && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                result.disposition === "IN_BOX"
                  ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                  : result.disposition === "NEAR_MISS_QUARANTINE"
                  ? "bg-amber-950/80 border-amber-800 text-amber-200"
                  : "bg-red-950/80 border-red-800 text-red-200"
              }`}
            >
              <div className="flex items-center space-x-2 font-bold uppercase tracking-wider">
                {result.disposition === "IN_BOX" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                )}
                <span>Gate Disposition: {result.disposition}</span>
              </div>
              <p>{result.reasons?.join("; ") || "Filing evaluated against active mandate."}</p>
              <div className="text-[11px] font-mono opacity-80">
                Stage: {result.stage} • Paid API Spend: ${result.spend_usd || "0.00"}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer (Apple Safe-Area & Touch Optimized) */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 pb-safe sm:pb-4">
          <div className="hidden sm:block text-xs text-slate-500 font-mono">
            Zero-Cost Mandate Filter • Zero Floating Point Distortion
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="apple-press flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition min-h-[40px] sm:min-h-0 text-center"
            >
              Close
            </button>
            <button
              type="submit"
              form="docket-form"
              disabled={loading}
              className="apple-press flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer min-h-[40px] sm:min-h-0 text-center"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <span>Ingest Docket</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

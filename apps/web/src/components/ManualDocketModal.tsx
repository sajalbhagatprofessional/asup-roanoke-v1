"use client";

import React, { useState } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
  FileText,
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
  const [fipsCode, setFipsCode] = useState("51770");
  const [parcelId, setParcelId] = useState("4012903");
  const [entityName, setEntityName] = useState("Blue Ridge Precision Tooling LLC");
  const [naicsCode, setNaicsCode] = useState("332710");
  const [price, setPrice] = useState("1650000.00");
  const [hasFloor, setHasFloor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocketIngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreFill = (type: "IN_BOX" | "NEAR_MISS" | "HARD_KILL" | "LUST_BLOCK") => {
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
    } else if (type === "NEAR_MISS") {
      setDocketId("ROA-SALEM-" + Math.floor(Math.random() * 1000));
      setFipsCode("51775"); // City of Salem (Near-Miss)
      setParcelId("SALEM-099");
      setEntityName("Salem Industrial Fabrication LLC");
      setNaicsCode("332312");
      setPrice("1950000.00");
      setHasFloor(true);
    } else if (type === "HARD_KILL") {
      setDocketId("ROA-RESID-" + Math.floor(Math.random() * 1000));
      setFipsCode("51770");
      setParcelId("RES-001");
      setEntityName("Roanoke Residential Apartments LLC");
      setNaicsCode("531110"); // Hard Kill Residential
      setPrice("2200000.00");
      setHasFloor(false);
    } else if (type === "LUST_BLOCK") {
      setDocketId("ROA-GAS-" + Math.floor(Math.random() * 1000));
      setFipsCode("51161"); // Roanoke County
      setParcelId("065.11-02-09");
      setEntityName("Peters Creek Fuel & Mart LLC");
      setNaicsCode("447110"); // Gas station
      setPrice("1850000.00");
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
        fips_code: fipsCode,
        parcel_id: parcelId,
        entity_name: entityName,
        naics_code: naicsCode,
        asking_or_cure_price_usd: price,
        has_real_estate_or_equipment_floor: hasFloor,
        is_predatory_personal_distress: false,
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
            <Upload className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Manual Docket Dropzone & Ingestion Gate
            </h2>
            <p className="text-xs text-slate-400">
              Stage 1 Distress Parsing & Zero-Cost Mandate Filter (ROA-SMB-01)
            </p>
          </div>
        </div>

        {/* Quick Pre-fill Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-400 self-center font-mono">Test Presets:</span>
          <button
            type="button"
            onClick={() => handlePreFill("IN_BOX")}
            className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800"
          >
            In-Box Precision Machining
          </button>
          <button
            type="button"
            onClick={() => handlePreFill("NEAR_MISS")}
            className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-800"
          >
            Salem (51775) Near-Miss
          </button>
          <button
            type="button"
            onClick={() => handlePreFill("HARD_KILL")}
            className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-800"
          >
            Residential 531110 (Hard Kill)
          </button>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Docket / Notice ID
              </label>
              <input
                type="text"
                value={docketId}
                onChange={(e) => setDocketId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Entity / Debtor Name
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Jurisdiction FIPS Code
              </label>
              <select
                value={fipsCode}
                onChange={(e) => setFipsCode(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="51770">51770 — City of Roanoke (In-Box)</option>
                <option value="51161">51161 — Roanoke County (In-Box)</option>
                <option value="51775">51775 — City of Salem (Near-Miss)</option>
                <option value="51760">51760 — City of Richmond (Out-of-Box Kill)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Parcel ID / GPIN
              </label>
              <input
                type="text"
                value={parcelId}
                onChange={(e) => setParcelId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                NAICS Vertical Code
              </label>
              <input
                type="text"
                value={naicsCode}
                onChange={(e) => setNaicsCode(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Asking / Cure Price ($ USD)
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="hasFloor"
              checked={hasFloor}
              onChange={(e) => setHasFloor(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <label htmlFor="hasFloor" className="text-xs text-slate-300">
              Verified Real Estate or Hard Equipment Floor (&gt;= $150k collateral)
            </label>
          </div>

          {/* Feedback Result Banner */}
          {result && (
            <div
              className={`p-4 rounded-xl border ${
                result.disposition === "IN_BOX"
                  ? "bg-emerald-950/80 border-emerald-700 text-emerald-200"
                  : result.disposition === "NEAR_MISS_LOGGED"
                  ? "bg-amber-950/80 border-amber-700 text-amber-200"
                  : "bg-red-950/80 border-red-700 text-red-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                {result.disposition === "IN_BOX" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span className="font-bold tracking-wide">
                  Gate Result: {result.disposition}
                </span>
                <span className="text-xs font-mono ml-auto">
                  Stage: {result.stage}
                </span>
              </div>

              {result.reasons && (
                <ul className="mt-2 text-xs list-disc list-inside space-y-0.5">
                  {result.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}

              {result.block_reasons && (
                <ul className="mt-2 text-xs list-disc list-inside space-y-0.5 font-mono">
                  {result.block_reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}

              {result.invoked_tools && (
                <div className="mt-2 text-xs">
                  <span className="font-semibold">Conditional Enrichment Invoked:</span>{" "}
                  <span className="font-mono">{result.invoked_tools.join(", ")}</span>
                </div>
              )}

              <div className="mt-2 text-[11px] font-mono text-slate-300">
                Paid Enrichment Spend: ${result.spend_usd ?? "0.00"}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? "Evaluating Mandate Gate..." : "Ingest & Evaluate Gate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

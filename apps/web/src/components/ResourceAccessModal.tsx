"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  Key,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { fetchAccessRequirements } from "../lib/api";
import { AccessRequirementsResponse, SiteAccessProfile } from "../lib/types";

interface ResourceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceAccessModal({
  isOpen,
  onClose,
}: ResourceAccessModalProps) {
  const [data, setData] = useState<AccessRequirementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
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

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetchAccessRequirements()
        .then((res) => setData(res))
        .catch((err) => setError(err.message || "Failed to load access requirements"))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 animate-slideUp sm:animate-none"
      >
        {/* Apple iOS Bottom Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/70 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Fixed Header */}
        <div className="shrink-0 p-3.5 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-blue-950/80 border border-blue-800/80 rounded-xl text-blue-400 shrink-0">
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Resource Access &amp; Account Requirements
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                API-Anything listing connections &amp; lawful access protocol audit
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
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Summary Badges */}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-mono">Total Tracked Sources</span>
                <p className="text-xl font-bold text-white mt-1">{data.total_tracked_platforms} Platforms</p>
              </div>
              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl">
                <span className="text-xs text-amber-300 uppercase font-mono">Physical Account Required</span>
                <p className="text-xl font-bold text-amber-200 mt-1">
                  {data.summary.physical_account_required_count} Platforms
                </p>
              </div>
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
                <span className="text-xs text-emerald-300 uppercase font-mono">Open / Public Access</span>
                <p className="text-xl font-bold text-emerald-200 mt-1">
                  {data.summary.open_public_count} Platforms
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Auditing external platform requirements...</p>
            </div>
          ) : data ? (
            <div className="space-y-3">
              {data.platforms.map((platform) => (
                <div
                  key={platform.site}
                  className="p-3.5 bg-slate-800/40 border border-slate-700/70 rounded-xl hover:border-slate-600 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{platform.display_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {platform.site}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {platform.requires_physical_account ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Account Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Open Public / Free
                        </span>
                      )}

                      <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-indigo-300 border border-indigo-900/60">
                        Auth: {platform.auth_mechanism}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-400 min-w-[120px] font-mono">Account Type:</span>
                      <span className="text-slate-200 font-medium">{platform.account_type_needed}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-400 min-w-[120px] font-mono">Target Domains:</span>
                      <span className="text-cyan-300 font-mono">
                        {platform.target_domains.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-400 min-w-[120px] font-mono">Compliance &amp; Notes:</span>
                      <span className="text-slate-300">{platform.compliance_notes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Fixed Sticky Footer (Apple Safe-Area & Touch Optimized) */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 pb-safe sm:pb-4">
          <span className="hidden sm:inline text-xs text-slate-400 font-mono">
            Protected by Lawful Circuit Breaker (24h lock on HTTP 403 / Akamai block)
          </span>
          <button
            onClick={onClose}
            className="apple-press w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition cursor-pointer min-h-[40px] sm:min-h-0 text-center"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { X, ShieldCheck, Key, Globe, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { fetchAccessRequirements } from "../lib/api";
import { AccessRequirementsResponse, SiteAccessProfile } from "../lib/types";

interface ResourceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceAccessModal({ isOpen, onClose }: ResourceAccessModalProps) {
  const [data, setData] = useState<AccessRequirementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="p-3 bg-blue-950/80 border border-blue-800/80 rounded-xl text-blue-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Resource Access &amp; Physical Account Requirements
            </h2>
            <p className="text-xs text-slate-400">
              API-Anything reverse-engineered listing connections &amp; lawful access protocol audit
            </p>
          </div>
        </div>

        {/* Summary Badges */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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

        {/* Loading / Error States */}
        {loading && (
          <div className="py-12 text-center text-slate-400 text-sm">
            Auditing external platform requirements...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs mb-4">
            {error}
          </div>
        )}

        {/* Platform Cards / Table */}
        {data && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            {data.platforms.map((platform) => (
              <div
                key={platform.site}
                className="p-4 bg-slate-800/40 border border-slate-700/70 rounded-xl hover:border-slate-600 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
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

                <div className="text-xs text-slate-300 mt-2 space-y-1">
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
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Protected by Lawful Circuit Breaker (24h lock on HTTP 403 / Akamai block)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { LocationConnectivityReport, TrackedSourceConnection } from "../lib/types";
import { fetchSourcesHealth, refreshSourcesHealth } from "../lib/api";

interface SourceTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandateCode?: string;
}

export default function SourceTrackerModal({
  isOpen,
  onClose,
  mandateCode,
}: SourceTrackerModalProps) {
  const [report, setReport] = useState<LocationConnectivityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTION_REQUIRED" | "CONNECTED">("ALL");

  useEffect(() => {
    if (isOpen) {
      loadHealth();
    }
  }, [isOpen, mandateCode]);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSourcesHealth(mandateCode);
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to load source connectivity report.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await refreshSourcesHealth();
      setReport(res.report);
    } catch (err: any) {
      setError(err.message || "Failed to refresh sources.");
    } finally {
      setRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const filteredSources = (report?.sources || []).filter((s) => {
    if (activeTab === "ACTION_REQUIRED") {
      return (
        s.status === "AUTH_REQUIRED" ||
        s.status === "CIRCUIT_BREAKER_LOCKED" ||
        s.status === "RATE_LIMITED"
      );
    }
    if (activeTab === "CONNECTED") {
      return s.status === "CONNECTED";
    }
    return true;
  });

  const getStatusBadge = (s: TrackedSourceConnection) => {
    switch (s.status) {
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected & Live
          </span>
        );
      case "AUTH_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Account Required
          </span>
        );
      case "CIRCUIT_BREAKER_LOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/70 border border-rose-500/40 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            24h Lockout Active
          </span>
        );
      case "RATE_LIMITED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-950/70 border border-orange-500/40 text-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            Rate / Fee Capped
          </span>
        );
      case "FALLBACK_GENERIC":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-600 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Generic Normalizer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
            {s.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-lg">📡</span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Location Resource & Connectivity Tracker
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Active Location Box:{" "}
              <span className="font-semibold text-zinc-200">
                {report?.mandate_name || "Target Box"}
              </span>{" "}
              ({report?.target_states.join(", ")}) •{" "}
              <span className="text-zinc-300">
                {report?.target_fips.length || 0} Target Jurisdictions
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-200 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-zinc-400">Pinging relevant resources for selected location...</p>
            </div>
          ) : report ? (
            <>
              {/* Coverage Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-400 font-medium">Coverage Score</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {report.coverage_score_pct}%
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        report.coverage_score_pct >= 80
                          ? "bg-emerald-500"
                          : report.coverage_score_pct >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${report.coverage_score_pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                  <div className="text-xs text-emerald-400 font-medium">Connected & Live</div>
                  <div className="text-2xl font-bold text-emerald-300 mt-1">
                    {report.connected_count}
                  </div>
                  <div className="text-[10px] text-emerald-500/80 mt-1">Free & automated</div>
                </div>

                <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                  <div className="text-xs text-amber-400 font-medium">Needs Account / Key</div>
                  <div className="text-2xl font-bold text-amber-300 mt-1">
                    {report.auth_required_count}
                  </div>
                  <div className="text-[10px] text-amber-500/80 mt-1">Requires buyer login</div>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl">
                  <div className="text-xs text-rose-400 font-medium">Compliance Locked</div>
                  <div className="text-2xl font-bold text-rose-300 mt-1">
                    {report.blocked_or_locked_count}
                  </div>
                  <div className="text-[10px] text-rose-500/80 mt-1">24h circuit breaker</div>
                </div>

                <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-400 font-medium">Generic Fallback</div>
                  <div className="text-2xl font-bold text-zinc-300 mt-1">
                    {report.fallback_or_unmapped_count}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Manual assessment</div>
                </div>
              </div>

              {/* Action Guidance Banner */}
              {report.summary_guidance.length > 0 && (
                <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <span>💡</span> Operator Action Guidance for Current Location:
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                    {report.summary_guidance.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === "ALL"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All Tracked Sources ({report.sources.length})
                </button>
                <button
                  onClick={() => setActiveTab("ACTION_REQUIRED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === "ACTION_REQUIRED"
                      ? "bg-amber-950/80 text-amber-200 border border-amber-800/60"
                      : "text-zinc-400 hover:text-amber-300"
                  }`}
                >
                  Action Required ({report.auth_required_count + report.blocked_or_locked_count})
                </button>
                <button
                  onClick={() => setActiveTab("CONNECTED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === "CONNECTED"
                      ? "bg-emerald-950/80 text-emerald-200 border border-emerald-800/60"
                      : "text-zinc-400 hover:text-emerald-300"
                  }`}
                >
                  Connected & Live ({report.connected_count})
                </button>
              </div>

              {/* Sources List */}
              <div className="space-y-3">
                {filteredSources.map((source) => (
                  <div
                    key={source.source_id}
                    className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                            {source.category}
                          </span>
                          <h4 className="text-sm font-semibold text-white">
                            {source.source_name}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                          <span>Jurisdiction: {source.target_jurisdictions.join(", ")}</span>
                          <span>•</span>
                          <a
                            href={source.endpoint_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span>Open URL</span>
                            <span>↗</span>
                          </a>
                          {source.latency_ms && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-500">{source.latency_ms}ms latency</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-zinc-300">
                            {source.records_retrieved_count} records verified
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {getStatusBadge(source)}
                      </div>
                    </div>

                    {/* Access Barrier Diagnostic Callout */}
                    {source.access_barrier_reason && (
                      <div className="p-3 rounded-lg bg-zinc-950 border border-amber-900/40 text-xs text-amber-200/90 space-y-1">
                        <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <span>⚠️</span> Access Limitation Detected:
                        </div>
                        <p className="text-zinc-300">{source.access_barrier_reason}</p>
                      </div>
                    )}

                    {/* Action Instructions Callout */}
                    {source.account_instructions && source.status !== "CONNECTED" && (
                      <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs text-blue-200 space-y-1">
                        <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                          <span>🔑</span> How to Connect & Unlock:
                        </div>
                        <p className="text-zinc-300">{source.account_instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Last evaluated: {report ? new Date(report.sources[0]?.last_checked_at || "").toLocaleTimeString() : "—"}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {refreshing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Pinging Sources...
                </>
              ) : (
                <>
                  <span>↻</span> Refresh Connections
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

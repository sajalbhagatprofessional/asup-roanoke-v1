"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Terminal,
  Code2,
} from "lucide-react";
import {
  UpstreamDependenciesResponse,
  UpstreamDependencyRecord,
  UpstreamCheckResult,
  UpstreamVerifyAirgapResult,
} from "../lib/types";
import {
  fetchUpstreamDependencies,
  checkUpstreamDependencies,
  verifyUpstreamAirgap,
} from "../lib/api";

interface UpstreamDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpstreamDependencyModal({
  isOpen,
  onClose,
}: UpstreamDependencyModalProps) {
  const [data, setData] = useState<UpstreamDependenciesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<UpstreamCheckResult | null>(null);
  const [airgapResult, setAirgapResult] = useState<UpstreamVerifyAirgapResult | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "UPDATES_AVAILABLE" | "GITHUB" | "PYTHON" | "NPM"
  >("ALL");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !checking && !verifying) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      loadManifest();
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadManifest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUpstreamDependencies();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load upstream dependencies manifest.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await checkUpstreamDependencies();
      setCheckResult(res);
      // Re-fetch manifest to display newly discovered versions
      const updated = await fetchUpstreamDependencies();
      setData(updated);
    } catch (err: any) {
      setError(err.message || "Failed to check upstream releases.");
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyAirgap = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await verifyUpstreamAirgap();
      setAirgapResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to run air-gap test suite verification.");
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  const dependencies = data?.dependencies || [];
  const filtered = dependencies.filter((dep) => {
    if (selectedFilter === "UPDATES_AVAILABLE") return dep.update_status === "UPDATE_AVAILABLE";
    if (selectedFilter === "GITHUB") return dep.category === "GITHUB_REPO";
    if (selectedFilter === "PYTHON") return dep.category === "PYTHON_PACKAGE";
    if (selectedFilter === "NPM") return dep.category === "NPM_PACKAGE";
    return true;
  });

  const updatesCount = dependencies.filter((d) => d.update_status === "UPDATE_AVAILABLE").length;
  const githubCount = dependencies.filter((d) => d.category === "GITHUB_REPO").length;
  const pythonCount = dependencies.filter((d) => d.category === "PYTHON_PACKAGE").length;
  const npmCount = dependencies.filter((d) => d.category === "NPM_PACKAGE").length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden font-sans text-zinc-100 animate-slideUp sm:animate-none"
      >
        {/* Apple iOS Bottom Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-zinc-700/70 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                  Upstream &amp; Open-Source Tracker
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold shrink-0">
                  Autonomous Auto-Discovery
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Continuous upstream tracking for 6 GitHub repositories, PyPI packages &amp; npm dependencies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="apple-press text-zinc-400 hover:text-white p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                <span>Total Dependencies</span>
                <Package className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-xl font-bold text-white mt-1">
                {data?.summary.total_tracked || 0}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                {data?.summary.auto_discovered_count || 0} Auto-discovered
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <div className="text-[11px] text-cyan-400 font-medium flex items-center justify-between">
                <span>GitHub Repos</span>
                <GitBranch className="w-3.5 h-3.5 text-cyan-500" />
              </div>
              <div className="text-xl font-bold text-cyan-300 mt-1">
                {githubCount}
              </div>
              <div className="text-[10px] text-cyan-500/80 mt-0.5">Yente, OpenBB, H3, RECAP</div>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <div className="text-[11px] text-purple-400 font-medium flex items-center justify-between">
                <span>Python &amp; Frontend</span>
                <Code2 className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-purple-300 mt-1">
                {pythonCount + npmCount}
              </div>
              <div className="text-[10px] text-purple-500/80 mt-0.5">
                {pythonCount} PyPI • {npmCount} npm
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <div className="text-[11px] text-emerald-400 font-medium flex items-center justify-between">
                <span>Air-Gap Gate</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-sm font-bold text-emerald-300 mt-1 truncate">
                100% Deterministic
              </div>
              <div className="text-[10px] text-emerald-500/80 mt-0.5">
                SBA SOP 50 10 8.1 Pure Decimal
              </div>
            </div>
          </div>

          {/* Action Sentinel Controls */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900/90 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Autonomous Upstream Sentinel &amp; Verification</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Polls GitHub, PyPI, and npm registries. Quarantines updates until verified by the 102-test suite.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCheckUpdates}
                disabled={checking}
                className="apple-press px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? "Checking..." : "Check Releases"}</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyAirgap}
                disabled={verifying}
                className="apple-press px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${verifying ? "animate-pulse" : ""}`} />
                <span>{verifying ? "Verifying Gate..." : "Run Air-Gap Gate"}</span>
              </button>
            </div>
          </div>

          {/* Check or Air-gap Banner Notifications */}
          {checkResult && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-xs text-cyan-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Check complete: <strong>{checkResult.check_results.checked_count}</strong> dependencies checked, <strong>{checkResult.check_results.updates_found}</strong> upstream updates detected.
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 shrink-0">
                {new Date(checkResult.check_results.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {airgapResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                airgapResult.is_airgap_passed
                  ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
                  : "bg-rose-950/30 border-rose-800/50 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {airgapResult.is_airgap_passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  <strong>{airgapResult.test_summary}</strong> (Exit Code {airgapResult.exit_code}). Pure Decimal SBA SOP 50 10 8.1 air-gap preserved.
                </span>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setSelectedFilter("ALL")}
              className={`apple-press px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "ALL"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Tracked ({dependencies.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("UPDATES_AVAILABLE")}
              className={`apple-press px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === "UPDATES_AVAILABLE"
                  ? "bg-amber-950 text-amber-200 border border-amber-800"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              <span>Updates Available</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900/60 font-bold">
                {updatesCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("GITHUB")}
              className={`apple-press px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "GITHUB"
                  ? "bg-cyan-950 text-cyan-200 border border-cyan-800"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              GitHub Repos ({githubCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("PYTHON")}
              className={`apple-press px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "PYTHON"
                  ? "bg-purple-950 text-purple-200 border border-purple-800"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Python PyPI ({pythonCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("NPM")}
              className={`apple-press px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "NPM"
                  ? "bg-emerald-950 text-emerald-200 border border-emerald-800"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Frontend npm ({npmCount})
            </button>
          </div>

          {/* Dependencies List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
              <span className="text-xs">Loading upstream dependencies ledger...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              No dependencies match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((dep) => {
                const hasUpdate = dep.update_status === "UPDATE_AVAILABLE";
                return (
                  <div
                    key={dep.id}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 transition flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-white truncate max-w-[200px]" title={dep.name}>
                              {dep.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                                dep.category === "GITHUB_REPO"
                                  ? "bg-cyan-950 border border-cyan-800/60 text-cyan-300"
                                  : dep.category === "PYTHON_PACKAGE"
                                  ? "bg-purple-950 border border-purple-800/60 text-purple-300"
                                  : "bg-emerald-950 border border-emerald-800/60 text-emerald-300"
                              }`}
                            >
                              {dep.category === "GITHUB_REPO" ? "GitHub" : dep.category === "PYTHON_PACKAGE" ? "PyPI" : "npm"}
                            </span>
                            {dep.auto_discovered && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
                                auto
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                            {dep.purpose || "Active platform dependency"}
                          </p>
                        </div>

                        {dep.upstream_repo_url && (
                          <a
                            href={dep.upstream_repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${dep.name} in browser`}
                            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono">v{dep.current_version}</span>
                        {hasUpdate && dep.upstream_version && (
                          <>
                            <span className="text-zinc-600">➔</span>
                            <span className="text-amber-300 font-semibold font-mono">
                              v{dep.upstream_version}
                            </span>
                          </>
                        )}
                      </div>

                      {hasUpdate ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 border border-amber-700/60 text-amber-300">
                          Update Available
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Up to Date</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All upstream PRs &amp; releases automatically gated by <code>scripts/run_all_tests.py</code>.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="apple-press px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

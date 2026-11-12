"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Key,
  Terminal,
  Code2,
  Check,
  Copy,
  Trash2,
  ShieldAlert,
  Play,
  Layers,
  Zap,
  Cpu,
  Sparkles,
  ExternalLink,
  X,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  fetchDeveloperApiKeys,
  createDeveloperApiKey,
  revokeDeveloperApiKey,
  fetchClaudeDesktopConfig,
  dispatchMcpJsonRpc,
} from "../lib/api";
import { DeveloperApiKey, CreateApiKeyResponse, ClaudeDesktopConfigResponse } from "../lib/types";

interface McpGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "config" | "keys" | "tools" | "playground";

export default function McpGatewayModal({ isOpen, onClose }: McpGatewayModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("config");
  const [keys, setKeys] = useState<DeveloperApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [claudeConfig, setClaudeConfig] = useState<ClaudeDesktopConfigResponse | null>(null);

  // Key creation state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRole, setNewKeyRole] = useState<"ADMIN" | "ANALYST" | "READ_ONLY">("ANALYST");
  const [createdKeyInfo, setCreatedKeyInfo] = useState<CreateApiKeyResponse | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Copy state
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Playground state
  const [selectedTool, setSelectedTool] = useState<string>("evaluate_sec_edgar_arbitrage");
  const [playgroundArgs, setPlaygroundArgs] = useState<string>(
    JSON.stringify(
      {
        purchase_ev_usd: "2400000",
        normalized_ebitda_usd: "650000",
        naics_code: "541211",
      },
      null,
      2
    )
  );
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundLatency, setPlaygroundLatency] = useState<number | null>(null);
  const [activeApiKeyForPlayground, setActiveApiKeyForPlayground] = useState<string>(
    "asup_live_anthropic_mcp_master_key_2026"
  );

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoadingKeys(true);
    try {
      const [keysRes, configRes] = await Promise.all([
        fetchDeveloperApiKeys(),
        fetchClaudeDesktopConfig(),
      ]);
      setKeys(keysRes.keys || []);
      setClaudeConfig(configRes);
    } catch (e) {
      console.error("Error loading MCP gateway data:", e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await createDeveloperApiKey(newKeyName.trim(), newKeyRole);
      setCreatedKeyInfo(res);
      setNewKeyName("");
      loadData();
    } catch (err) {
      alert("Failed to generate API key: " + err);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm(`Are you sure you want to revoke API Key ${keyId}? Any active agent using this key will immediately be disconnected.`)) {
      return;
    }
    try {
      await revokeDeveloperApiKey(keyId);
      loadData();
    } catch (err) {
      alert("Failed to revoke API key: " + err);
    }
  };

  const executePlaygroundCall = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const start = performance.now();
    try {
      let parsedArgs = {};
      if (playgroundArgs.trim()) {
        parsedArgs = JSON.parse(playgroundArgs);
      }
      const payload = {
        jsonrpc: "2.0",
        id: `pg-${Date.now()}`,
        method: "tools/call",
        params: {
          name: selectedTool,
          arguments: parsedArgs,
        },
      };
      const res = await dispatchMcpJsonRpc(payload, activeApiKeyForPlayground);
      setPlaygroundResponse(res);
    } catch (err: any) {
      setPlaygroundResponse({
        error: {
          code: -32603,
          message: err.message || "Failed to execute MCP tool",
        },
      });
    } finally {
      setPlaygroundLatency(Math.round(performance.now() - start));
      setPlaygroundLoading(false);
    }
  };

  // Pre-configured tool presets for quick testing
  const selectToolPreset = (tool: string) => {
    setSelectedTool(tool);
    if (tool === "search_deals_and_assets") {
      setPlaygroundArgs(JSON.stringify({ state: "PA", query: "Accounting" }, null, 2));
    } else if (tool === "get_asset_dossier") {
      setPlaygroundArgs(JSON.stringify({ asset_id: "ASSET-PA-ACC-01" }, null, 2));
    } else if (tool === "get_spatial_digital_twin") {
      setPlaygroundArgs(JSON.stringify({ asset_id: "ASSET-PA-ACC-01" }, null, 2));
    } else if (tool === "underwrite_sba_sop_50_10_8_1") {
      setPlaygroundArgs(
        JSON.stringify(
          {
            purchase_price_usd: "2400000",
            buyer_cash_injection_usd: "240000",
            seller_note_full_standby_usd: "240000",
            historical_ebitda_usd: "650000",
            loan_interest_rate_pct: "0.1125",
            seller_standby_months: 36,
          },
          null,
          2
        )
      );
    } else if (tool === "evaluate_sec_edgar_arbitrage") {
      setPlaygroundArgs(
        JSON.stringify(
          {
            purchase_ev_usd: "2400000",
            normalized_ebitda_usd: "650000",
            naics_code: "541211",
          },
          null,
          2
        )
      );
    } else if (tool === "screen_yente_aml_kyc") {
      setPlaygroundArgs(
        JSON.stringify(
          {
            entity_name: "Apex Precision Machining LLC",
            jurisdiction: "US-VA",
            screener_role: "COUNSEL",
            beneficial_owners: ["Robert Vance", "Evelyn Vance"],
          },
          null,
          2
        )
      );
    } else if (tool === "run_openbb_macro_sofr_stress") {
      setPlaygroundArgs(
        JSON.stringify(
          {
            loan_principal_usd: "1920000",
            baseline_annual_ebitda_usd: "650000",
            amortization_years: 10,
            asset_title: "Lehigh Valley Accounting Partners",
          },
          null,
          2
        )
      );
    } else if (tool === "generate_fiduciary_outreach_playbook") {
      setPlaygroundArgs(
        JSON.stringify(
          {
            asset_id: "ASSET-PA-ACC-01",
            playbook_type: "SUCCESSION_BUYOUT",
          },
          null,
          2
        )
      );
    } else if (tool === "manage_kanban_crm_stage") {
      setPlaygroundArgs(
        JSON.stringify(
          {
            asset_id: "ASSET-PA-ACC-01",
            stage: "DILIGENCE_REVIEW",
          },
          null,
          2
        )
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px] shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Developer & AI Agent Gateway
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/80">
                  MCP 2024-11-05
                </span>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect external AI agents (Claude Desktop, Claude Code, Hermes, OpenClaw, Copilot) to Argus deterministic engines.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/30 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === "config"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Agent Setup & Claude Config</span>
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === "keys"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Developer API Keys</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {keys.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === "tools"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tools & Capabilities</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              11
            </span>
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === "playground"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Agent Playground</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CONFIG & AGENT SETUP */}
          {activeTab === "config" && (
            <div className="space-y-6">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">stdio Process Runner</span>
                    <Terminal className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">Claude Desktop / Claude Code</p>
                  <p className="mt-1 text-xs text-slate-400">Runs locally via standard input/output pipe</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">HTTP / SSE Transport</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">Remote & Webhook Agents</p>
                  <p className="mt-1 text-xs text-slate-400">Hermes, OpenClaw, AutoGen, CrewAI</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Deterministic Engine</span>
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">Air-Gapped Math</p>
                  <p className="mt-1 text-xs text-slate-400">Pure Python Decimal, SOP 50 10 8.1</p>
                </div>
              </div>

              {/* Claude Desktop Config Snippet */}
              <div className="p-5 rounded-xl bg-slate-950 border border-purple-900/40 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      Claude Desktop Configuration (claude_desktop_config.json)
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(claudeConfig?.config || {}, null, 2),
                        "claude-config"
                      )
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/60 text-purple-200 text-xs font-semibold transition"
                  >
                    {copiedSection === "claude-config" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON Config</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Paste this snippet into your{" "}
                  <code className="text-purple-300 font-mono bg-purple-950/80 px-1 py-0.5 rounded">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>{" "}
                  file to immediately connect Claude Desktop to ASUP.
                </p>
                <pre className="p-4 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800">
                  {JSON.stringify(claudeConfig?.config || {}, null, 2)}
                </pre>
              </div>

              {/* Remote AI Agent Connection URLs */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Remote Agent Endpoints (Hermes, OpenClaw, Webhooks)</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400">SSE Endpoint:</span>
                      <code className="text-purple-300 font-mono">http://localhost:8000/mcp/sse</code>
                    </div>
                    <button
                      onClick={() => handleCopy("http://localhost:8000/mcp/sse", "sse-url")}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedSection === "sse-url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400">JSON-RPC Messages:</span>
                      <code className="text-purple-300 font-mono">http://localhost:8000/mcp/messages</code>
                    </div>
                    <button
                      onClick={() => handleCopy("http://localhost:8000/mcp/messages", "msg-url")}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedSection === "msg-url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVELOPER API KEYS */}
          {activeTab === "keys" && (
            <div className="space-y-6">
              {/* Newly Created Key Alert Banner */}
              {createdKeyInfo && (
                <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-600 shadow-xl space-y-2">
                  <div className="flex items-center space-x-2 text-purple-200 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>New Developer API Key Generated!</span>
                  </div>
                  <p className="text-xs text-purple-300/80">
                    Copy this secret token now. For your security, it will not be shown again.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={createdKeyInfo.raw_api_key}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/80 font-mono text-xs text-emerald-300"
                    />
                    <button
                      onClick={() => handleCopy(createdKeyInfo.raw_api_key, "new-token")}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      {copiedSection === "new-token" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Token</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Generate New Key Form */}
              <form onSubmit={handleCreateKey} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>Generate New AI Agent API Key</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Agent / Application Label
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Claude Desktop, OpenClaw Agent, Production VPS"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Role & Permissions
                    </label>
                    <select
                      value={newKeyRole}
                      onChange={(e) => setNewKeyRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ADMIN">ADMIN (Full Access)</option>
                      <option value="ANALYST">ANALYST (Standard Underwriting)</option>
                      <option value="READ_ONLY">READ_ONLY (Inspect Only)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingKey || !newKeyName.trim()}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isCreatingKey ? "Generating..." : "Generate API Key"}</span>
                  </button>
                </div>
              </form>

              {/* Active Keys Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Active Developer Keys</span>
                  </h3>
                  <button
                    onClick={loadData}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Refresh keys"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingKeys ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Name / Label</th>
                        <th className="py-2.5 px-3">Prefix</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Rate Limit</th>
                        <th className="py-2.5 px-3">Last Active</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {keys.map((k) => (
                        <tr key={k.key_id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {k.name}
                            <span className="block text-[10px] font-mono text-slate-500">{k.key_id}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-purple-300">{k.key_prefix}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                k.role === "ADMIN"
                                  ? "bg-purple-950 text-purple-300 border border-purple-800"
                                  : "bg-blue-950 text-blue-300 border border-blue-800"
                              }`}
                            >
                              {k.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{k.rate_limit_rpm} rpm</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {k.last_used_at ? new Date(k.last_used_at).toLocaleTimeString() : "Never"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {k.key_id !== "KEY-DEV-001" && (
                              <button
                                onClick={() => handleRevokeKey(k.key_id)}
                                className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 transition"
                                title="Revoke API key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOOLS CATALOG */}
          {activeTab === "tools" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                ASUP exposes 11 institutional-grade deterministic underwriting, spatial analysis, and compliance tools.
                External agents invoke these via standard JSON-RPC 2.0 <code className="text-purple-300">tools/call</code>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    name: "search_deals_and_assets",
                    desc: "Nationwide deal and business discovery across 50 states, price filters, and crime index constraints.",
                    badge: "Discovery",
                  },
                  {
                    name: "get_asset_dossier",
                    desc: "Retrieves complete financial metrics, broker/seller contact, and liquidation floor for an asset.",
                    badge: "Intelligence",
                  },
                  {
                    name: "get_spatial_digital_twin",
                    desc: "God's Eye 3D spatial twin: rooftop HVAC units, building sqft, truck apron clearance, FEMA flood elevation.",
                    badge: "Spatial 3D",
                  },
                  {
                    name: "underwrite_sba_sop_50_10_8_1",
                    desc: "Air-gapped SBA 7(a)/504 debt service solver: >=1.25x DSCR, 10% equity, 50% limited equity cap.",
                    badge: "Underwriting",
                  },
                  {
                    name: "audit_addbacks_and_qoe",
                    desc: "Forensic Quality of Earnings audit: mandatory $85k GM deduction, lifestyle addback disallowance.",
                    badge: "CPA Audit",
                  },
                  {
                    name: "evaluate_sec_edgar_arbitrage",
                    desc: "SEC EDGAR XBRL public comps analysis: computes immediate valuation arbitrage spread.",
                    badge: "Comps Arb",
                  },
                  {
                    name: "screen_yente_aml_kyc",
                    desc: "OpenSanctions & Yente AML screening: OFAC SDN, PEP, BIS clearance with SHA-256 certificate.",
                    badge: "Compliance",
                  },
                  {
                    name: "run_openbb_macro_sofr_stress",
                    desc: "OpenBB macro SOFR yield curve simulation: 5 dynamic interest rate shock scenarios (+100 to +300 bps).",
                    badge: "Macro Stress",
                  },
                  {
                    name: "parse_unstructured_tax_return",
                    desc: "Extracts gross receipts, net income, and 12-month NWC from IRS Form 1040 Schedule C / Form 1120-S OCR.",
                    badge: "OCR Parser",
                  },
                  {
                    name: "generate_fiduciary_outreach_playbook",
                    desc: "Synthesizes single-recipient warm succession outreach scripts for fiduciaries and trustees.",
                    badge: "Outreach",
                  },
                  {
                    name: "manage_kanban_crm_stage",
                    desc: "Transitions asset through CRM deal stages from INGESTION to DUE_DILIGENCE to CLOSED.",
                    badge: "CRM Pipeline",
                  },
                ].map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-600/60 transition group cursor-pointer"
                    onClick={() => {
                      selectToolPreset(tool.name);
                      setActiveTab("playground");
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <code className="text-xs font-mono font-bold text-purple-300 group-hover:text-purple-200">
                        {tool.name}
                      </code>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-400 border border-purple-800">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PLAYGROUND / LIVE TESTER */}
          {activeTab === "playground" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-semibold text-slate-300">Tool to Invoke:</label>
                  <select
                    value={selectedTool}
                    onChange={(e) => selectToolPreset(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                  >
                    <option value="evaluate_sec_edgar_arbitrage">evaluate_sec_edgar_arbitrage</option>
                    <option value="search_deals_and_assets">search_deals_and_assets</option>
                    <option value="get_asset_dossier">get_asset_dossier</option>
                    <option value="get_spatial_digital_twin">get_spatial_digital_twin</option>
                    <option value="underwrite_sba_sop_50_10_8_1">underwrite_sba_sop_50_10_8_1</option>
                    <option value="audit_addbacks_and_qoe">audit_addbacks_and_qoe</option>
                    <option value="screen_yente_aml_kyc">screen_yente_aml_kyc</option>
                    <option value="run_openbb_macro_sofr_stress">run_openbb_macro_sofr_stress</option>
                    <option value="generate_fiduciary_outreach_playbook">generate_fiduciary_outreach_playbook</option>
                    <option value="manage_kanban_crm_stage">manage_kanban_crm_stage</option>
                  </select>
                </div>

                <button
                  onClick={executePlaygroundCall}
                  disabled={playgroundLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition"
                >
                  <Play className={`w-3.5 h-3.5 ${playgroundLoading ? "animate-spin" : ""}`} />
                  <span>{playgroundLoading ? "Calling MCP..." : "Call Tool via MCP"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Arguments Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Arguments (JSON)</span>
                    <span className="text-[10px] text-slate-500 font-mono">tools/call params.arguments</span>
                  </div>
                  <textarea
                    rows={12}
                    value={playgroundArgs}
                    onChange={(e) => setPlaygroundArgs(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Live MCP Response */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>JSON-RPC Response</span>
                    {playgroundLatency !== null && (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                        <Activity className="w-3 h-3" />
                        <span>{playgroundLatency} ms</span>
                      </span>
                    )}
                  </div>
                  <pre className="w-full h-[264px] p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-y-auto">
                    {playgroundResponse ? (
                      JSON.stringify(playgroundResponse, null, 2)
                    ) : (
                      <span className="text-slate-600">// Click &apos;Call Tool via MCP&apos; to view live JSON-RPC response</span>
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Standard: Anthropic Model Context Protocol Specification (2024-11-05)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

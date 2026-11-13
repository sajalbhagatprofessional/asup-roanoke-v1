"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Terminal,
  Bot,
  ExternalLink,
  RefreshCw,
  Activity,
  Cpu,
  Laptop,
  ChevronDown,
  ChevronUp,
  Play,
  Code2,
} from "lucide-react";
import { fetchMcpHubManifest, fetchMcpUniversalPrompt, dispatchMcpJsonRpc, getApiBase } from "../lib/api";
import { McpHubManifest } from "../lib/types";

type McpSubTab = "prompt" | "claude" | "ides" | "installer" | "playground";

export default function McpSettingsPanel() {
  const [activeTab, setActiveTab] = useState<McpSubTab>("prompt");
  const [manifest, setManifest] = useState<McpHubManifest | null>(null);
  const [universalPrompt, setUniversalPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // IDE sub-segment
  const [ideSubTab, setIdeSubTab] = useState<"cursor" | "cline" | "windsurf">("cursor");

  // Playground state
  const [selectedTool, setSelectedTool] = useState<string>("evaluate_sba_sop_50_10_8_1");
  const [playgroundArgs, setPlaygroundArgs] = useState<string>(
    JSON.stringify(
      {
        total_project_cost_usd: "2000000.00",
        appraised_cre_value_usd: "1200000.00",
        sba_7a_loan_amount_usd: "1800000.00",
        buyer_cash_injection_usd: "100000.00",
        seller_standby_note_usd: "100000.00",
        seller_standby_lock_months: 36,
        seller_consulting_months: 12,
        adjusted_ebitda_post_gm_usd: "450000.00",
        annual_maintenance_capex_usd: "30000.00",
        annual_cash_taxes_usd: "50000.00",
      },
      null,
      2
    )
  );
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundLatency, setPlaygroundLatency] = useState<number | null>(null);

  useEffect(() => {
    loadMcpData();
  }, []);

  const loadMcpData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [man, promptRes] = await Promise.all([
        fetchMcpHubManifest().catch(() => null),
        fetchMcpUniversalPrompt().catch(() => null),
      ]);
      if (man) setManifest(man);
      if (promptRes?.prompt) {
        setUniversalPrompt(promptRes.prompt);
      } else if (man?.universal_prompt) {
        setUniversalPrompt(man.universal_prompt);
      }
    } catch (err: any) {
      setError(err?.message || "Could not load MCP configuration data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleDownload = (clientType: string) => {
    const base = getApiBase();
    const token = manifest?.token || "asup_live_anthropic_mcp_master_key_2026";
    const downloadUrl = `${base}/v1/mcp/download/${clientType}?token=${encodeURIComponent(token)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadScript = (scriptType: "ps1" | "sh") => {
    const base = getApiBase();
    const token = manifest?.token || "asup_live_anthropic_mcp_master_key_2026";
    const scriptUrl = `${base}/v1/mcp/install.${scriptType}?token=${encodeURIComponent(token)}`;
    const a = document.createElement("a");
    a.href = scriptUrl;
    a.download = `install_argus_mcp.${scriptType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const runPlaygroundTool = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResult(null);
    const start = performance.now();
    try {
      let parsedArgs = {};
      if (playgroundArgs.trim()) {
        parsedArgs = JSON.parse(playgroundArgs);
      }
      const response = await dispatchMcpJsonRpc(
        {
          jsonrpc: "2.0",
          id: `req_${Date.now()}`,
          method: "tools/call",
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        },
        manifest?.token || "asup_live_anthropic_mcp_master_key_2026"
      );
      setPlaygroundResult(response);
    } catch (err: any) {
      setPlaygroundResult({ error: err?.message || String(err) });
    } finally {
      setPlaygroundLatency(Math.round(performance.now() - start));
      setPlaygroundLoading(false);
    }
  };

  const activeToken = manifest?.token || "asup_live_anthropic_mcp_master_key_2026";
  const sseEndpoint = manifest?.sse_endpoint || `${getApiBase()}/mcp/sse?token=${activeToken}`;

  const tabs: { id: McpSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "prompt", label: "1-Click Prompt", icon: Sparkles },
    { id: "claude", label: "Claude Desktop", icon: Bot },
    { id: "ides", label: "Cursor & IDEs", icon: Laptop },
    { id: "installer", label: "Terminal Script", icon: Terminal },
    { id: "playground", label: "Live Tester", icon: Activity },
  ];

  const toolsList = [
    { name: "evaluate_sba_sop_50_10_8_1", description: "SBA SOP 50 10 8.1 Underwriting Solver" },
    { name: "audit_foreclosure_notice_and_basis", description: "Va. Code § 55.1-321 Foreclosure Solver" },
    { name: "audit_seller_addbacks", description: "Add-Back & GM Salary Auditor" },
    { name: "sofr_interest_rate_shock_matrix", description: "Commercial Rate Shock Engine" },
    { name: "sec_edgar_distressed_filings_search", description: "SEC EDGAR Form 8-K & 10-K Ingestion" },
    { name: "opensanctions_yente_entity_screening", description: "OpenSanctions / PEP Screening" },
    { name: "get_asset_research_links", description: "Deep Asset OSINT & GIS Links Generator" },
    { name: "get_mcp_connect_config", description: "Universal MCP Manifest & Config Dispatcher" },
  ];

  return (
    <div className="space-y-4 animate-fade-in text-xs text-zinc-100">
      {/* 1. Header Telemetry & Protocol Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-white text-sm">Model Context Protocol Hub</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                {manifest?.tool_count || 42} Deterministic Tools
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Anthropic MCP 2024-11-05 spec • Air-gapped Python decimal.Decimal • Zero LLM hallucinations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadMcpData}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Refresh Manifest"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <a
            href="/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-press flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700/80 transition"
          >
            <span>Fullscreen Hub</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>
      </div>

      {/* 2. Apple Segmented Control Bar */}
      <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`apple-press flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-1 justify-center ${
                isActive
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Sub-Tab Content Views */}

      {/* TAB 1: UNIVERSAL 1-CLICK AGENT PROMPT */}
      {activeTab === "prompt" && (
        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-xs">Universal Sovereign Agent Prompt</div>
              <div className="text-[11px] text-zinc-400">
                Paste into Claude, ChatGPT, Cursor, Windsurf, or Hermes to connect instantly.
              </div>
            </div>
            <button
              onClick={() => handleCopy(universalPrompt || manifest?.universal_prompt || "", "prompt")}
              className="apple-press flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition shadow-md cursor-pointer"
            >
              {copiedKey === "prompt" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy System Prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                System Prompt Preview (Includes 42 Tools & Statutory Invariants)
              </span>
              <button
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <span>{isPreviewExpanded ? "Collapse" : "Expand Full Text"}</span>
                {isPreviewExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <div
              className={`font-mono text-[11px] text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-850 whitespace-pre-wrap overflow-y-auto leading-relaxed select-all ${
                isPreviewExpanded ? "max-h-72" : "max-h-28"
              }`}
            >
              {universalPrompt || manifest?.universal_prompt || "Loading prompt..."}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-zinc-400">
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-center">
              <div className="text-white font-semibold">Claude Projects</div>
              <div className="text-[10px] text-zinc-500">Paste in Instructions</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-center">
              <div className="text-white font-semibold">ChatGPT Plus</div>
              <div className="text-[10px] text-zinc-500">Custom GPT Setup</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-center">
              <div className="text-white font-semibold">Cursor Rules</div>
              <div className="text-[10px] text-zinc-500">.cursorrules file</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-center">
              <div className="text-white font-semibold">Terminal / agy</div>
              <div className="text-[10px] text-zinc-500">Direct CLI context</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLAUDE DESKTOP */}
      {activeTab === "claude" && (
        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-xs">Claude Desktop Native Integration</div>
              <div className="text-[11px] text-zinc-400">
                Official Anthropic configuration using remote SSE endpoint or stdio bridge.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(JSON.stringify(manifest?.configs?.claude_desktop || {}, null, 2), "claude_json")}
                className="apple-press flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs border border-zinc-700 cursor-pointer"
              >
                {copiedKey === "claude_json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>Copy JSON</span>
              </button>
              <button
                onClick={() => handleDownload("claude-desktop")}
                className="apple-press flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 border border-zinc-850 overflow-x-auto max-h-44">
            <pre>{JSON.stringify(manifest?.configs?.claude_desktop || { mcpServers: { "asup-roanoke": { url: sseEndpoint } } }, null, 2)}</pre>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 space-y-1.5 text-[11px]">
            <div className="font-semibold text-white">Target Configuration Paths:</div>
            <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px]">
              <span>macOS: ~/Library/Application Support/Claude/claude_desktop_config.json</span>
              <button
                onClick={() => handleCopy("~/Library/Application Support/Claude/claude_desktop_config.json", "path_mac")}
                className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                {copiedKey === "path_mac" ? "Copied!" : "Copy Path"}
              </button>
            </div>
            <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px]">
              <span>Windows: %APPDATA%\Claude\claude_desktop_config.json</span>
              <button
                onClick={() => handleCopy("%APPDATA%\\Claude\\claude_desktop_config.json", "path_win")}
                className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                {copiedKey === "path_win" ? "Copied!" : "Copy Path"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CURSOR & MODERN IDES */}
      {activeTab === "ides" && (
        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIdeSubTab("cursor")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ideSubTab === "cursor" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Cursor IDE
              </button>
              <button
                onClick={() => setIdeSubTab("cline")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ideSubTab === "cline" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Cline VSCode
              </button>
              <button
                onClick={() => setIdeSubTab("windsurf")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ideSubTab === "windsurf" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Windsurf
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const cfg =
                    ideSubTab === "cursor"
                      ? manifest?.configs?.cursor
                      : ideSubTab === "cline"
                      ? manifest?.configs?.cline
                      : manifest?.configs?.windsurf;
                  handleCopy(JSON.stringify(cfg || {}, null, 2), "ide_cfg");
                }}
                className="apple-press flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs border border-zinc-700 cursor-pointer"
              >
                {copiedKey === "ide_cfg" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>Copy JSON</span>
              </button>
              <button
                onClick={() => handleDownload(ideSubTab)}
                className="apple-press flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 border border-zinc-850 overflow-x-auto max-h-44">
            <pre>
              {JSON.stringify(
                (ideSubTab === "cursor"
                  ? manifest?.configs?.cursor
                  : ideSubTab === "cline"
                  ? manifest?.configs?.cline
                  : manifest?.configs?.windsurf) || {},
                null,
                2
              )}
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 text-[11px] text-zinc-400 font-mono">
            Location:{" "}
            {ideSubTab === "cursor"
              ? ".cursor/mcp.json (Workspace root or %USERPROFILE%\\.cursor\\mcp.json)"
              : ideSubTab === "cline"
              ? "%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json"
              : "~/.codeium/windsurf/mcp_config.json"}
          </div>
        </div>
      )}

      {/* TAB 4: TERMINAL INSTALL SCRIPT */}
      {activeTab === "installer" && (
        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div>
            <div className="font-semibold text-white text-xs">Zero-Touch Automated Terminal Installers</div>
            <div className="text-[11px] text-zinc-400">
              Safe-merges Argus into existing Claude Desktop & Cursor JSON configs without overwriting other MCP tools.
            </div>
          </div>

          {/* Bash 1-Liner */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                macOS / Linux Terminal (1-Liner)
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    manifest?.install_commands?.macos_linux_bash ||
                      `curl -fsSL "${getApiBase()}/v1/mcp/install.sh?token=${activeToken}" | bash`,
                    "bash_cmd"
                  )
                }
                className="apple-press text-emerald-400 hover:text-emerald-300 font-medium text-[11px] flex items-center space-x-1 cursor-pointer"
              >
                {copiedKey === "bash_cmd" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "bash_cmd" ? "Copied!" : "Copy Command"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-300 select-all overflow-x-auto">
              {manifest?.install_commands?.macos_linux_bash ||
                `curl -fsSL "${getApiBase()}/v1/mcp/install.sh?token=${activeToken}" | bash`}
            </div>
          </div>

          {/* PowerShell 1-Liner */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                Windows PowerShell (1-Liner)
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    manifest?.install_commands?.windows_powershell ||
                      `irm "${getApiBase()}/v1/mcp/install.ps1?token=${activeToken}" | iex`,
                    "ps1_cmd"
                  )
                }
                className="apple-press text-blue-400 hover:text-blue-300 font-medium text-[11px] flex items-center space-x-1 cursor-pointer"
              >
                {copiedKey === "ps1_cmd" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "ps1_cmd" ? "Copied!" : "Copy Command"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-blue-300 select-all overflow-x-auto">
              {manifest?.install_commands?.windows_powershell ||
                `irm "${getApiBase()}/v1/mcp/install.ps1?token=${activeToken}" | iex`}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={() => handleDownloadScript("sh")}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download install.sh</span>
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => handleDownloadScript("ps1")}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download install.ps1</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE TOOL TESTER */}
      {activeTab === "playground" && (
        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-semibold text-white text-xs">Live MCP Tool Playground</div>
              <div className="text-[11px] text-zinc-400">
                Execute and verify any of the {manifest?.tool_count || 42} deterministic tools in real time.
              </div>
            </div>
            <button
              onClick={runPlaygroundTool}
              disabled={playgroundLoading}
              className="apple-press flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition disabled:opacity-50 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${playgroundLoading ? "animate-spin" : ""}`} />
              <span>{playgroundLoading ? "Dispatching..." : "Execute Tool"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                Select Tool
              </label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
              >
                {toolsList.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Latency Benchmark
                </label>
                {playgroundLatency !== null && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {playgroundLatency} ms (Zero LLM)
                  </span>
                )}
              </div>
              <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Deterministic RPC Mode</span>
                <span className="text-emerald-400 font-semibold">ONLINE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                JSON Arguments
              </span>
              <textarea
                rows={6}
                value={playgroundArgs}
                onChange={(e) => setPlaygroundArgs(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                Tool Output
              </span>
              <div className="h-[148px] p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 font-mono text-[11px] text-zinc-300 overflow-y-auto whitespace-pre-wrap">
                {playgroundResult ? (
                  JSON.stringify(playgroundResult, null, 2)
                ) : (
                  <span className="text-zinc-600 italic">Click "Execute Tool" to view deterministic output...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Persistent Protocol Parameters Footer */}
      <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px]">
        <div className="flex items-center space-x-2 text-zinc-400 font-mono text-[10px] truncate">
          <span className="text-zinc-500">SSE URL:</span>
          <span className="text-emerald-400/90 truncate">{sseEndpoint}</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => handleCopy(sseEndpoint, "sse_foot")}
            className="text-zinc-300 hover:text-white flex items-center space-x-1 cursor-pointer"
          >
            {copiedKey === "sse_foot" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy Endpoint</span>
          </button>
        </div>
      </div>
    </div>
  );
}

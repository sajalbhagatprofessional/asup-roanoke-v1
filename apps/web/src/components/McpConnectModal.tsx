"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Terminal,
  Bot,
  Layers,
  Code2,
  Play,
  ExternalLink,
  X,
  RefreshCw,
  Activity,
  FileCode,
  ShieldCheck,
  Cpu,
  Laptop,
  CheckCircle2,
  Info,
} from "lucide-react";
import { fetchMcpHubManifest, dispatchMcpJsonRpc, getApiBase } from "../lib/api";
import { McpHubManifest } from "../lib/types";

interface McpConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "prompt" | "claude" | "ides" | "installer" | "playground";

export default function McpConnectModal({ isOpen, onClose }: McpConnectModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("prompt");
  const [manifest, setManifest] = useState<McpHubManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy feedback tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Ide sub-tab
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
    if (isOpen) {
      loadManifest();
    }
  }, [isOpen]);

  const loadManifest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMcpHubManifest();
      setManifest(data);
    } catch (err: any) {
      console.error("Failed to load MCP manifest:", err);
      setError(err?.message || "Could not connect to MCP Hub API");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
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

  if (!isOpen) return null;

  const base = getApiBase();
  const token = manifest?.token || "asup_live_anthropic_mcp_master_key_2026";
  const ps1Cmd = manifest?.install_commands?.windows_powershell || `irm ${base}/v1/mcp/install.ps1?token=${token} | iex`;
  const bashCmd = manifest?.install_commands?.macos_linux_bash || `curl -fsSL ${base}/v1/mcp/install.sh?token=${token} | bash`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Argus Model Context Protocol (MCP) Connect Hub
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live 42 Tools
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect any AI Agent, ChatGPT, Claude Desktop, Cursor, or Terminal in seconds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadManifest}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh Manifest"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "prompt"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-4 h-4" />
            Universal AI Prompt
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wider font-mono">
              Zero Setup
            </span>
          </button>

          <button
            onClick={() => setActiveTab("claude")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "claude"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-4 h-4" />
            Claude Desktop
          </button>

          <button
            onClick={() => setActiveTab("ides")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "ides"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Cursor / Cline / Windsurf
          </button>

          <button
            onClick={() => setActiveTab("installer")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "installer"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            1-Click Terminal Installer
          </button>

          <button
            onClick={() => setActiveTab("playground")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "playground"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Play className="w-4 h-4" />
            Tool Playground (42)
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: UNIVERSAL AI PROMPT (ZERO SETUP) */}
          {activeTab === "prompt" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Universal AI Directive (Paste into ChatGPT, Claude.ai, or Gemini)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      No JSON editing, no local servers, and no installations needed. Simply copy this directive
                      and paste it into a ChatGPT Custom GPT, Claude Project, or Gemini session. It instructs the
                      model on how to query Argus's 42 live tools directly.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(manifest?.universal_prompt || "", "universal_prompt")}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs shadow-lg transition shrink-0"
                  >
                    {copiedKey === "universal_prompt" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        Copied Directive!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Universal Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative group">
                <div className="absolute right-3 top-3 z-10">
                  <button
                    onClick={() => handleCopy(manifest?.universal_prompt || "", "prompt_code")}
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-xs flex items-center gap-1.5 transition"
                  >
                    {copiedKey === "prompt_code" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto max-h-[340px] leading-relaxed select-all">
                  {manifest?.universal_prompt || "Loading prompt directive..."}
                </pre>
              </div>

              {/* Quick Test Queries */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Instant Questions to Ask Your AI Agent (Click to Copy)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(
                    manifest?.quick_test_prompts || [
                      "Underwrite deal ROA-GD-01 under SBA SOP 50 10 8.1 with 10% equity injection.",
                      "Run Sale-Leaseback arbitrage analysis for deal ROA-GD-01 at 7.25% exit cap rate.",
                      "Simulate a 200 bps interest rate shock and 15% revenue compression for deal ROA-GD-04.",
                      "What are the Virginia statutory foreclosure notice requirements under Va. Code § 55.1-321?",
                    ]
                  ).map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopy(promptText, `prompt_${idx}`)}
                      className="text-left p-3 rounded-lg bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-emerald-500/40 text-xs text-slate-300 transition flex items-center justify-between group"
                    >
                      <span className="line-clamp-2 pr-2">"{promptText}"</span>
                      {copiedKey === `prompt_${idx}` ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLAUDE DESKTOP */}
          {activeTab === "claude" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    Claude Desktop Configuration (Remote SSE & Stdio)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Download the pre-built JSON file or merge the block into your Claude Desktop settings.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload("claude-desktop")}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow"
                  >
                    <Download className="w-4 h-4" />
                    Download claude_desktop_config.json
                  </button>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(manifest?.configs?.claude_desktop || {}, null, 2),
                        "claude_json"
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    {copiedKey === "claude_json" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Path Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">Windows Target Path:</span>
                  <code className="text-emerald-400 font-mono text-[11px] block select-all">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">macOS Target Path:</span>
                  <code className="text-emerald-400 font-mono text-[11px] block select-all">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </div>
              </div>

              {/* JSON preview */}
              <div className="relative">
                <pre className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed">
                  {JSON.stringify(manifest?.configs?.claude_desktop || {}, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Remote SSE Active:</strong> Claude Desktop uses the official MCP SSE protocol via{" "}
                  <code>mcp-remote</code>. You do NOT need Python or a local backend installed on your PC.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CURSOR / CLINE / WINDSURF */}
          {activeTab === "ides" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setIdeSubTab("cursor")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ideSubTab === "cursor"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white bg-slate-900"
                  }`}
                >
                  Cursor IDE (.cursor/mcp.json)
                </button>
                <button
                  onClick={() => setIdeSubTab("cline")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ideSubTab === "cline"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white bg-slate-900"
                  }`}
                >
                  Cline / VS Code (cline_mcp_settings.json)
                </button>
                <button
                  onClick={() => setIdeSubTab("windsurf")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ideSubTab === "windsurf"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white bg-slate-900"
                  }`}
                >
                  Windsurf (mcp_config.json)
                </button>
              </div>

              {/* Details & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {ideSubTab === "cursor" && "Cursor IDE MCP Configuration"}
                    {ideSubTab === "cline" && "Cline (Roo Code) VS Code Configuration"}
                    {ideSubTab === "windsurf" && "Windsurf (Codeium) MCP Configuration"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {ideSubTab === "cursor" && "Save inside your project folder at .cursor/mcp.json"}
                    {ideSubTab === "cline" && "Save inside ~/.vscode/cline_mcp_settings.json or Roocode settings"}
                    {ideSubTab === "windsurf" && "Save inside ~/.codeium/windsurf/mcp_config.json"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(ideSubTab)}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON
                  </button>
                  <button
                    onClick={() => {
                      const cfg =
                        ideSubTab === "cursor"
                          ? manifest?.configs?.cursor
                          : ideSubTab === "cline"
                          ? manifest?.configs?.cline
                          : manifest?.configs?.windsurf;
                      handleCopy(JSON.stringify(cfg || {}, null, 2), "ide_json");
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    {copiedKey === "ide_json" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JSON preview */}
              <div className="relative">
                <pre className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed">
                  {JSON.stringify(
                    ideSubTab === "cursor"
                      ? manifest?.configs?.cursor
                      : ideSubTab === "cline"
                      ? manifest?.configs?.cline
                      : manifest?.configs?.windsurf || {},
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: 1-CLICK TERMINAL INSTALLER */}
          {activeTab === "installer" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Non-Destructive Safe Merging Installers
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Run a single command in your terminal. The script will automatically locate your Claude Desktop
                  configuration, preserve any existing MCP servers, and append Argus.
                </p>
              </div>

              {/* Windows PowerShell */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    Windows (PowerShell)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadScript("ps1")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .ps1
                    </button>
                    <button
                      onClick={() => handleCopy(ps1Cmd, "ps1_cmd")}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
                    >
                      {copiedKey === "ps1_cmd" ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied Command
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Command
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto select-all">
                  {ps1Cmd}
                </div>
              </div>

              {/* macOS / Linux Bash */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    macOS & Linux (Bash / Zsh)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadScript("sh")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .sh
                    </button>
                    <button
                      onClick={() => handleCopy(bashCmd, "bash_cmd")}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
                    >
                      {copiedKey === "bash_cmd" ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied Command
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Command
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto select-all">
                  {bashCmd}
                </div>
              </div>

              {/* ChatGPT Custom Actions */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">ChatGPT Custom GPT OpenAPI Schema</h4>
                  <p className="text-[11px] text-slate-400">
                    Import Argus as a ChatGPT Custom Action with OpenAPI 3.1.0 specifications.
                  </p>
                </div>
                <button
                  onClick={() => handleDownload("openapi")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download argus_openapi.json
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: TOOL PLAYGROUND */}
          {activeTab === "playground" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400" />
                    Interactive JSON-RPC Tool Runner (42 Live Tools)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Execute any MCP tool directly against the backend. Verifies token validity and live responses.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  >
                    <optgroup label="SBA SOP 50 10 8.1 & Foreclosure Underwriting">
                      <option value="evaluate_sba_sop_50_10_8_1">evaluate_sba_sop_50_10_8_1</option>
                      <option value="solve_va_foreclosure_compliance">solve_va_foreclosure_compliance</option>
                      <option value="audit_ebitda_addbacks">audit_ebitda_addbacks</option>
                      <option value="calculate_liquidation_floor">calculate_liquidation_floor</option>
                    </optgroup>
                    <optgroup label="Asset Flip & Capital Velocity">
                      <option value="solve_sale_leaseback_arbitrage">solve_sale_leaseback_arbitrage</option>
                      <option value="optimize_flip_strategy">optimize_flip_strategy</option>
                      <option value="draft_contract_assignment">draft_contract_assignment</option>
                      <option value="generate_deal_tear_sheet">generate_deal_tear_sheet</option>
                    </optgroup>
                    <optgroup label="Physical Asset AI & Comps">
                      <option value="diagnose_physical_asset_health">diagnose_physical_asset_health</option>
                      <option value="evaluate_sec_edgar_arbitrage">evaluate_sec_edgar_arbitrage</option>
                      <option value="query_yente_aml_sanctions">query_yente_aml_sanctions</option>
                      <option value="query_h3_spatial_cluster">query_h3_spatial_cluster</option>
                    </optgroup>
                    <optgroup label="Research & Connection Tools">
                      <option value="get_asset_research_links">get_asset_research_links</option>
                      <option value="get_mcp_connect_config">get_mcp_connect_config</option>
                    </optgroup>
                  </select>

                  <button
                    onClick={runPlaygroundTool}
                    disabled={playgroundLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow"
                  >
                    {playgroundLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Execute Tool
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor & Response Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-400">Tool Arguments (JSON):</span>
                  <textarea
                    rows={10}
                    value={playgroundArgs}
                    onChange={(e) => setPlaygroundArgs(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Live Server Response:</span>
                    {playgroundLatency !== null && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        {playgroundLatency} ms
                      </span>
                    )}
                  </div>
                  <pre className="w-full h-[220px] p-3 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 overflow-y-auto leading-relaxed">
                    {playgroundResult
                      ? JSON.stringify(playgroundResult, null, 2)
                      : "// Click 'Execute Tool' to test JSON-RPC dispatch live..."}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              SBA SOP 50 10 8.1 & Va. Code §§ 55.1-320 Air-Gapped Math
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="font-mono text-slate-400">
              API Base: <span className="text-emerald-400">{base}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Close Hub
          </button>
        </div>

      </div>
    </div>
  );
}

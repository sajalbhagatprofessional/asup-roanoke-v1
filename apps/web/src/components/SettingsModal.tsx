"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Palette,
  Bell,
  Smartphone,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Download,
  Shield,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  ExternalLink,
  Lock,
  Volume2,
  VolumeX,
  Vibrate,
  Radio,
  FileText,
  Clock,
  ArrowRight,
  Bot,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { ThemeMode, InterfaceDensity, AutoUpdatePromptMode, TeamRole } from "../lib/types";

export default function SettingsModal() {
  const {
    settings,
    updateSettings,
    saveCurrentSettings,
    isSettingsOpen,
    closeSettings,
    activeSettingsTab,
    setActiveSettingsTab,
    isSaving,
    saveMessage,
    updateAvailable,
    isCheckingUpdate,
    appVersion,
    cacheName,
    checkForUpdates,
    applyUpdateNow,
    canInstallPwa,
    installPwa,
    isStandalone,
  } = useSettings();

  const { user, openAuthModal } = useAuth();
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);
  const [copiedMcp, setCopiedMcp] = useState<string | null>(null);

  const handleCopyMcp = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMcp(key);
    setTimeout(() => setCopiedMcp(null), 2000);
  };

  const handleManualCheckUpdate = async () => {
    setUpdateFeedback("Checking cloud for latest update...");
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) {
      setUpdateFeedback("New version downloaded and ready to apply!");
    } else {
      setUpdateFeedback("Your app is completely up to date (v" + appVersion + ").");
    }
    setTimeout(() => setUpdateFeedback(null), 4000);
  };

  if (!isSettingsOpen) return null;

  const tabs = [
    { id: "ACCOUNT", label: "Account & Profile", icon: User },
    { id: "THEME", label: "Theme & Display", icon: Palette },
    { id: "NOTIFICATIONS", label: "Notifications & Alerts", icon: Bell },
    { id: "PWA", label: "PWA & Auto-Update", icon: Smartphone },
    { id: "UNDERWRITING", label: "Underwriting Defaults", icon: Sliders },
    { id: "MCP", label: "AI Agent & MCP Hub", icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[720px] rounded-3xl bg-zinc-950/95 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">Settings &amp; Preferences</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  ⌘,
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Persistent cross-device preferences for <span className="text-emerald-400 font-medium">{settings.display_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {saveMessage && (
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1 animate-pulse mr-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </span>
            )}
            <button
              onClick={closeSettings}
              className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Close settings (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. PWA Update Notification Banner (if update ready) */}
        {updateAvailable && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-b border-emerald-800/80 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="font-semibold text-white">New version available!</span>
              <span className="text-emerald-300/80 hidden sm:inline">The updated build has been cached and is ready.</span>
            </div>
            <button
              onClick={applyUpdateNow}
              className="apple-press px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center space-x-1 transition cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Update &amp; Reload Now</span>
            </button>
          </div>
        )}

        {/* 3. Main Modal Body: Sidebar Tabs + Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar Tabs */}
          <div className="w-56 sm:w-64 border-r border-zinc-850 p-3 bg-zinc-950/40 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSettingsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-zinc-800/90 text-white font-semibold border border-zinc-700/80 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* PWA Version & Standalone Info Pill */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">PWA Version:</span>
                <span className="font-mono text-zinc-300 font-bold">v{appVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Container:</span>
                <span className="font-mono text-cyan-400">{isStandalone ? "Standalone Native" : "Web Browser"}</span>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* TAB 1: ACCOUNT & PROFILE */}
            {activeSettingsTab === "ACCOUNT" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white">Account &amp; Institutional Profile</h3>
                  <p className="text-xs text-zinc-400">Manage identity, organization name, and sign-in credentials.</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Display / Investor Name
                      </label>
                      <input
                        type="text"
                        value={settings.display_name}
                        onChange={(e) => updateSettings({ display_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Organization / Family Office
                      </label>
                      <input
                        type="text"
                        value={settings.organization}
                        onChange={(e) => updateSettings({ organization: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || settings.email}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-850 text-xs text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Team Role (RBAC)
                      </label>
                      <div className="flex items-center space-x-2">
                        <select
                          value={settings.role}
                          onChange={(e) => updateSettings({ role: e.target.value as TeamRole })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                        >
                          <option value="PRINCIPAL">Principal (Family Office)</option>
                          <option value="ANALYST">Analyst (GIS &amp; Pipeline)</option>
                          <option value="COUNSEL">Counsel (Foreclosure &amp; Title)</option>
                          <option value="CPA">CPA (SBA SOP 50 10 8.1 &amp; Tax)</option>
                          <option value="LENDER_BROKER">Lender / Broker (Sanitized)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password & Security Actions */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs">Security &amp; Password</div>
                    <div className="text-[11px] text-zinc-400">Change your password or request a reset token.</div>
                  </div>
                  <button
                    onClick={() => {
                      closeSettings();
                      openAuthModal("FORGOT");
                    }}
                    className="apple-press px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: THEME & DISPLAY */}
            {activeSettingsTab === "THEME" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white">Theme &amp; Appearance</h3>
                  <p className="text-xs text-zinc-400">Customize visual appearance, layout density, and contrast.</p>
                </div>

                {/* Theme Selector Cards */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Interface Theme Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "DARK", label: "Dark Obsidian", desc: "Default Zinc/Slate", bg: "bg-zinc-900 border-zinc-700 text-white" },
                      { id: "LIGHT", label: "Light Titanium", desc: "Crisp Paper White", bg: "bg-slate-200 border-slate-300 text-slate-900" },
                      { id: "MIDNIGHT_OLED", label: "Midnight OLED", desc: "Pure Black #000000", bg: "bg-black border-zinc-800 text-zinc-100" },
                      { id: "BLOOMBERG_NAVY", label: "Bloomberg Navy", desc: "Financial Terminal", bg: "bg-[#060d1f] border-blue-900 text-blue-100" },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => updateSettings({ theme: th.id as ThemeMode })}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                          settings.theme === th.id
                            ? "ring-2 ring-emerald-500 border-emerald-500 shadow-md bg-zinc-900"
                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/60"
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg mb-2.5 flex items-center justify-center font-bold text-[10px] ${th.bg}`}>
                          Aa
                        </div>
                        <div className="font-semibold text-xs text-white">{th.label}</div>
                        <div className="text-[10px] text-zinc-400">{th.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density & Layout */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">Information Density</div>
                      <div className="text-[11px] text-zinc-400">Comfortable spacing vs dense financial rows.</div>
                    </div>
                    <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                      <button
                        onClick={() => updateSettings({ density: "COMFORTABLE" })}
                        className={`px-3 py-1 rounded-lg transition ${
                          settings.density === "COMFORTABLE"
                            ? "bg-zinc-800 text-white font-semibold shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Comfortable
                      </button>
                      <button
                        onClick={() => updateSettings({ density: "COMPACT" })}
                        className={`px-3 py-1 rounded-lg transition ${
                          settings.density === "COMPACT"
                            ? "bg-zinc-800 text-white font-semibold shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Compact
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <div>
                      <div className="font-semibold text-white text-xs">High Contrast Mode</div>
                      <div className="text-[11px] text-zinc-400">Sharpen borders and text contrast for outdoor field use.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.high_contrast}
                      onChange={(e) => updateSettings({ high_contrast: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS & ALERTS */}
            {activeSettingsTab === "NOTIFICATIONS" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white">Notifications &amp; Statutory Alerts</h3>
                  <p className="text-xs text-zinc-400">Configure Web Push alerts, distress notice thresholds, and quiet hours.</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">Master Push Notifications</div>
                      <div className="text-[11px] text-zinc-400">Receive native desktop &amp; mobile PWA notifications.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.push_notifications_enabled}
                      onChange={(e) => updateSettings({ push_notifications_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <div>
                      <div className="font-semibold text-white text-xs">Foreclosure Statutory Notices (SEV-1)</div>
                      <div className="text-[11px] text-zinc-400">Alerts when Virginia Code § 55.1-321 14-day notice published.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.foreclosure_statutory_alerts}
                      onChange={(e) => updateSettings({ foreclosure_statutory_alerts: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <div>
                      <div className="font-semibold text-white text-xs">Principal Monday 07:00 EST Weekly Digest</div>
                      <div className="text-[11px] text-zinc-400">Push notification when ≤5 verified deals are published.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.monday_weekly_digest_push}
                      onChange={(e) => updateSettings({ monday_weekly_digest_push: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-850">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-zinc-300">Sound Effects</div>
                      <input
                        type="checkbox"
                        checked={settings.sound_alerts_enabled}
                        onChange={(e) => updateSettings({ sound_alerts_enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-zinc-300">Haptic Vibration</div>
                      <input
                        type="checkbox"
                        checked={settings.vibration_enabled}
                        onChange={(e) => updateSettings({ vibration_enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PWA & AUTO-UPDATE */}
            {activeSettingsTab === "PWA" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white">Progressive Web App &amp; Auto-Update Engine</h3>
                  <p className="text-xs text-zinc-400">Manage automatic background updates, offline caching, and PWA installation.</p>
                </div>

                {/* Auto-Update Settings Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">Automatic App Updates</div>
                      <div className="text-[11px] text-zinc-400">
                        Automatically download and cache new platform releases in the background.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.auto_update_enabled}
                      onChange={(e) => updateSettings({ auto_update_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 border-t border-zinc-850 space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Update Activation Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => updateSettings({ auto_update_prompt_mode: "NOTIFY_BEFORE_RELOAD" })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          settings.auto_update_prompt_mode === "NOTIFY_BEFORE_RELOAD"
                            ? "bg-zinc-850 border-emerald-500 text-white ring-1 ring-emerald-500"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <div className="font-semibold text-xs">Notify Before Reload (Recommended)</div>
                        <div className="text-[10px] text-zinc-400 mt-1">Displays update banner; reloads only when clicked.</div>
                      </button>
                      <button
                        onClick={() => updateSettings({ auto_update_prompt_mode: "SILENT_AUTO_RELOAD" })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          settings.auto_update_prompt_mode === "SILENT_AUTO_RELOAD"
                            ? "bg-zinc-850 border-emerald-500 text-white ring-1 ring-emerald-500"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <div className="font-semibold text-xs">Silent Auto-Reload</div>
                        <div className="text-[10px] text-zinc-400 mt-1">Automatically switches to new version immediately.</div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">Manual Update Check</div>
                      <div className="text-[11px] text-zinc-400">Current Cache: <code className="font-mono text-cyan-400">{cacheName}</code></div>
                    </div>
                    <button
                      onClick={handleManualCheckUpdate}
                      disabled={isCheckingUpdate}
                      className="apple-press px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-spin text-emerald-400" : ""}`} />
                      <span>{isCheckingUpdate ? "Checking..." : "Check for Updates"}</span>
                    </button>
                  </div>
                  {updateFeedback && (
                    <div className="text-xs text-emerald-400 font-mono animate-fade-in">
                      {updateFeedback}
                    </div>
                  )}
                </div>

                {/* Standalone Installation Card */}
                {canInstallPwa && !isStandalone && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-blue-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">Install Argus Desktop / Mobile App</div>
                      <div className="text-[11px] text-blue-200/80">Launch from homescreen or dock with native multi-window support.</div>
                    </div>
                    <button
                      onClick={installPwa}
                      className="apple-press px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install App</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: UNDERWRITING DEFAULTS */}
            {activeSettingsTab === "UNDERWRITING" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white">Default Underwriting &amp; Mandate Hurdles</h3>
                  <p className="text-xs text-zinc-400">Configure global financial defaults applied to newly ingested assets.</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Target Corporate Exit Cap Rate (%)
                      </label>
                      <input
                        type="text"
                        value={settings.default_target_cap_rate_pct}
                        onChange={(e) => updateSettings({ default_target_cap_rate_pct: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <span className="text-[10px] text-zinc-500">e.g. 0.0725 for 7.25% institutional cap rate</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Replacement GM Salary Deduction (USD/yr)
                      </label>
                      <input
                        type="text"
                        value={settings.default_replacement_gm_salary_usd}
                        onChange={(e) => updateSettings({ default_replacement_gm_salary_usd: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <span className="text-[10px] text-zinc-500">Statutory minimum: $85,000.00/yr</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Base DSCR Hurdle
                      </label>
                      <input
                        type="text"
                        value={settings.default_hurdle_base_dscr}
                        onChange={(e) => updateSettings({ default_hurdle_base_dscr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <span className="text-[10px] text-zinc-500">Principal threshold: ≥1.35x</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Stressed DSCR Hurdle (-15% Rev, +200 bps)
                      </label>
                      <input
                        type="text"
                        value={settings.default_hurdle_stressed_dscr}
                        onChange={(e) => updateSettings({ default_hurdle_stressed_dscr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <span className="text-[10px] text-zinc-500">Principal threshold: ≥1.15x</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: AI AGENT & MCP CONNECTIVITY */}
            {activeSettingsTab === "MCP" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Model Context Protocol (MCP) &amp; AI Integration</h3>
                  <p className="text-xs text-zinc-400">
                    Connect Claude Desktop, Cursor, Cline, Windsurf, or sovereign AI agents directly into Argus.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850 space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">42 Air-Gapped Underwriting & Sourcing Tools Online</span>
                    </div>
                    <a
                      href="/mcp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <span>Open Fullscreen Hub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Remote SSE Endpoint */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Remote SSE Endpoint (Anthropic Standard)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value="http://api.argus.150.136.103.204.sslip.io/mcp/sse?token=asup_live_anthropic_mcp_master_key_2026"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-emerald-400 focus:outline-none font-mono select-all"
                      />
                      <button
                        onClick={() =>
                          handleCopyMcp(
                            "http://api.argus.150.136.103.204.sslip.io/mcp/sse?token=asup_live_anthropic_mcp_master_key_2026",
                            "sse_url"
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-xs text-zinc-200 transition shrink-0"
                      >
                        {copiedMcp === "sse_url" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Master Token */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Active AI Agent Bearer Token
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value="asup_live_anthropic_mcp_master_key_2026"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none font-mono select-all"
                      />
                      <button
                        onClick={() =>
                          handleCopyMcp("asup_live_anthropic_mcp_master_key_2026", "token")
                        }
                        className="px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-xs text-zinc-200 transition shrink-0"
                      >
                        {copiedMcp === "token" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Direct 1-Click Downloads */}
                  <div className="pt-2 border-t border-zinc-850">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      1-Click Download Configuration Files
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <a
                        href="http://api.argus.150.136.103.204.sslip.io/v1/mcp/download/claude-desktop?token=asup_live_anthropic_mcp_master_key_2026"
                        download="claude_desktop_config.json"
                        className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 flex items-center justify-between transition"
                      >
                        <span className="font-medium flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-emerald-400" />
                          Claude Desktop JSON
                        </span>
                        <Download className="w-3.5 h-3.5 text-zinc-400" />
                      </a>

                      <a
                        href="http://api.argus.150.136.103.204.sslip.io/v1/mcp/download/cursor?token=asup_live_anthropic_mcp_master_key_2026"
                        download="mcp.json"
                        className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 flex items-center justify-between transition"
                      >
                        <span className="font-medium flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-blue-400" />
                          Cursor IDE (.cursor/mcp.json)
                        </span>
                        <Download className="w-3.5 h-3.5 text-zinc-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 4. Modal Footer with Save Button */}
        <div className="px-6 py-3.5 border-t border-zinc-850 bg-zinc-900/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Settings are stored in cloud database and stay synchronized across all devices.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={closeSettings}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={saveCurrentSettings}
              disabled={isSaving}
              className="apple-press px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save to Cloud</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

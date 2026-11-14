"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Palette,
  Bell,
  BellRing,
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
  AlertTriangle,
  Key,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  LogOut,
  Eye,
  EyeOff,
  History,
  Globe,
  Trash2,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import {
  ThemeMode,
  InterfaceDensity,
  AutoUpdatePromptMode,
  TeamRole,
  UserSession,
  MfaSetupResponse,
  SecurityAuditEvent,
} from "../lib/types";
import McpSettingsPanel from "./McpSettingsPanel";
import {
  getBrowserNotificationPermission,
  requestPushNotifications,
  sendTestPushNotification,
} from "../lib/notifications";

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

  const {
    user,
    openAuthModal,
    setupMfa,
    enableMfa,
    disableMfa,
    getActiveSessions,
    revokeSession,
    revokeOtherSessions,
    changePassword,
    getSecurityAuditLog,
  } = useAuth();

  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);
  const [copiedMcp, setCopiedMcp] = useState<string | null>(null);

  // Cisco Zero-Trust Fleet Sessions & Security Audit State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionActionMsg, setSessionActionMsg] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Cisco Duo / TOTP RFC 6238 State
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupResponse | null>(null);
  const [isStartingMfa, setIsStartingMfa] = useState(false);
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [mfaVerifyError, setMfaVerifyError] = useState<string | null>(null);
  const [mfaVerifySuccess, setMfaVerifySuccess] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [copiedMfaSecret, setCopiedMfaSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Disable MFA confirmation
  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  // NIST SP 800-63B Change Password State
  const [currPassword, setCurrPassword] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await getActiveSessions();
      setSessions(res);
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const logs = await getSecurityAuditLog();
      setAuditLogs(logs.slice(0, 6));
    } catch (err: any) {
      console.error("Failed to load security audit logs:", err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isSettingsOpen && activeSettingsTab === "ACCOUNT" && user) {
      loadSessions();
      loadAuditLogs();
    }
  }, [isSettingsOpen, activeSettingsTab, user]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setSessionActionMsg("Session terminated cleanly.");
      await loadSessions();
      setTimeout(() => setSessionActionMsg(null), 3000);
    } catch (err: any) {
      setSessionActionMsg(err.message || "Failed to terminate session.");
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      const count = await revokeOtherSessions();
      setSessionActionMsg(`Terminated ${count} other active session(s).`);
      await loadSessions();
      setTimeout(() => setSessionActionMsg(null), 3000);
    } catch (err: any) {
      setSessionActionMsg(err.message || "Failed to terminate sessions.");
    }
  };

  const handleStartMfaSetup = async () => {
    setIsStartingMfa(true);
    setMfaVerifyError(null);
    try {
      const setup = await setupMfa();
      setMfaSetupData(setup);
    } catch (err: any) {
      setMfaVerifyError(err.message || "Failed to initiate MFA setup.");
    } finally {
      setIsStartingMfa(false);
    }
  };

  const handleConfirmEnableMfa = async () => {
    if (!mfaVerifyCode.trim()) {
      setMfaVerifyError("Please enter the 6-digit TOTP code.");
      return;
    }
    setIsVerifyingMfa(true);
    setMfaVerifyError(null);
    try {
      const msg = await enableMfa(mfaVerifyCode.trim());
      setMfaVerifySuccess(msg);
      setMfaVerifyCode("");
      loadAuditLogs();
    } catch (err: any) {
      setMfaVerifyError(err.message || "Invalid TOTP verification code.");
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleConfirmDisableMfa = async () => {
    if (!disablePassword) {
      setDisableError("Please enter your current password.");
      return;
    }
    setIsDisablingMfa(true);
    setDisableError(null);
    try {
      await disableMfa(disablePassword);
      setShowDisableMfa(false);
      setDisablePassword("");
      setMfaSetupData(null);
      setMfaVerifySuccess(null);
      loadAuditLogs();
    } catch (err: any) {
      setDisableError(err.message || "Failed to disable MFA. Check your password.");
    } finally {
      setIsDisablingMfa(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (!mfaSetupData?.backup_codes) return;
    navigator.clipboard.writeText(mfaSetupData.backup_codes.join("\n"));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2500);
  };

  // NIST SP 800-63B validation helpers
  const pwdHasLength = newPwd.length >= 8;
  const pwdHasUpper = /[A-Z]/.test(newPwd);
  const pwdHasLower = /[a-z]/.test(newPwd);
  const pwdHasNumber = /[0-9]/.test(newPwd);
  const pwdHasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPwd);
  const isNistCompliant = pwdHasLength && pwdHasUpper && pwdHasLower && pwdHasNumber && pwdHasSymbol;
  const passwordsMatch = newPwd.length > 0 && newPwd === confirmPwd;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!currPassword) {
      setPwdFeedback({ type: "error", msg: "Please enter your current password." });
      return;
    }
    if (!isNistCompliant) {
      setPwdFeedback({ type: "error", msg: "New password does not satisfy NIST complexity requirements." });
      return;
    }
    if (!passwordsMatch) {
      setPwdFeedback({ type: "error", msg: "New passwords do not match." });
      return;
    }

    setIsSubmittingPwd(true);
    try {
      const msg = await changePassword(currPassword, newPwd, confirmPwd);
      setPwdFeedback({ type: "success", msg: msg || "Password updated. Security alert dispatched to your email." });
      setCurrPassword("");
      setNewPwd("");
      setConfirmPwd("");
      loadAuditLogs();
      loadSessions();
    } catch (err: any) {
      setPwdFeedback({ type: "error", msg: err.message || "Failed to update password." });
    } finally {
      setIsSubmittingPwd(false);
    }
  };

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

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  useEffect(() => {
    setBrowserPermission(getBrowserNotificationPermission());
  }, []);

  const handleRequestPush = async () => {
    setNotifFeedback("Requesting push permission...");
    const res = await requestPushNotifications();
    setBrowserPermission(res.permission);
    if (res.permission === "granted") {
      updateSettings({ push_notifications_enabled: true });
      setNotifFeedback("Native push notifications activated successfully!");
    } else {
      setNotifFeedback(res.error || "Permission was not granted.");
    }
    setTimeout(() => setNotifFeedback(null), 4000);
  };

  const handleSendTestPush = async () => {
    setNotifFeedback("Dispatching test notification...");
    const res = await sendTestPushNotification();
    if (res.success) {
      setNotifFeedback("Test notification dispatched! Check your desktop or mobile notification center.");
    } else {
      setNotifFeedback(res.error || "Failed to dispatch test notification.");
    }
    setTimeout(() => setNotifFeedback(null), 4000);
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
            
            {/* TAB 1: ACCOUNT & PROFILE (CISCO ZERO-TRUST IDENTITY & SECURITY CENTER) */}
            {activeSettingsTab === "ACCOUNT" && (
              <div className="space-y-6 animate-fade-in pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cisco Zero-Trust Identity &amp; Account Security</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Manage institutional identity, RFC 6238 TOTP two-factor authentication, active device sessions, and cryptographic audit records.
                  </p>
                </div>

                {/* 1. Profile & Family Office Identity Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-sm text-emerald-400 font-mono">
                        {(user?.display_name || user?.username || settings.display_name || "FO").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">{settings.display_name || user?.display_name || user?.username}</div>
                        <div className="text-[11px] text-zinc-400">{settings.organization || "Family Office Principal"}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      {settings.role || user?.role || "PRINCIPAL"}
                    </span>
                  </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Registered Email
                        </label>
                        {user?.is_verified && (
                          <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        value={user?.email || settings.email}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-850 text-xs text-zinc-400 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Team Role (RBAC)
                      </label>
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

                {/* 2. Cisco Duo / RFC 6238 TOTP Multi-Factor Authentication Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        user?.mfa_enabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {user?.mfa_enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-xs">Two-Factor Authentication (TOTP / Cisco Duo)</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                            user?.mfa_enabled
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}>
                            {user?.mfa_enabled ? "ENFORCED & ACTIVE" : "NOT CONFIGURED"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Protects all family office sign-ins with standard RFC 6238 6-digit rolling codes from Cisco Duo Mobile, Google Authenticator, 1Password, or Apple Keychain.
                        </p>
                      </div>
                    </div>

                    {!user?.mfa_enabled && !mfaSetupData && (
                      <button
                        onClick={handleStartMfaSetup}
                        disabled={isStartingMfa}
                        className="apple-press px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-md"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>{isStartingMfa ? "Generating Key..." : "Enable 2FA"}</span>
                      </button>
                    )}

                    {user?.mfa_enabled && (
                      <button
                        onClick={() => setShowDisableMfa(true)}
                        className="apple-press px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-zinc-300 hover:text-red-400 border border-zinc-700 hover:border-red-800/80 text-xs font-semibold transition cursor-pointer"
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>

                  {/* Inline Modal to Confirm Disabling MFA */}
                  {showDisableMfa && (
                    <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/50 space-y-3 animate-fade-in">
                      <div className="text-xs text-red-200 font-semibold flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>Confirm Disabling Two-Factor Authentication</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Disabling 2FA lowers account security to password-only authentication. Enter your current password to proceed:
                      </p>
                      {disableError && (
                        <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800 px-2.5 py-1 rounded-lg">
                          {disableError}
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="password"
                          placeholder="Current account password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
                        />
                        <button
                          onClick={handleConfirmDisableMfa}
                          disabled={isDisablingMfa}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          {isDisablingMfa ? "Verifying..." : "Confirm Disable"}
                        </button>
                        <button
                          onClick={() => {
                            setShowDisableMfa(false);
                            setDisableError(null);
                            setDisablePassword("");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive MFA Setup Wizard */}
                  {mfaSetupData && !user?.mfa_enabled && (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
                        <span className="text-xs font-bold text-white flex items-center space-x-2">
                          <Key className="w-4 h-4 text-emerald-400" />
                          <span>Step 1: Link Authenticator App</span>
                        </span>
                        <a
                          href={mfaSetupData.otpauth_uri}
                          className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                        >
                          <span>Open in App</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] text-zinc-400">
                          Add this manual Base32 setup key into Cisco Duo, Google Authenticator, or your password manager:
                        </p>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 p-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-emerald-400 tracking-widest text-center select-all">
                            {mfaSetupData.secret}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mfaSetupData.secret);
                              setCopiedMfaSecret(true);
                              setTimeout(() => setCopiedMfaSecret(false), 2000);
                            }}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center space-x-1 cursor-pointer transition shrink-0"
                            title="Copy Secret Key"
                          >
                            {copiedMfaSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-850 space-y-2">
                        <span className="text-xs font-bold text-white block">
                          Step 2: Enter 6-Digit TOTP Verification Code
                        </span>
                        {mfaVerifyError && (
                          <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800 px-2.5 py-1 rounded-lg">
                            {mfaVerifyError}
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={mfaVerifyCode}
                            onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ""))}
                            className="w-36 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleConfirmEnableMfa}
                            disabled={isVerifyingMfa || mfaVerifyCode.length !== 6}
                            className="apple-press px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                          >
                            {isVerifyingMfa ? "Verifying..." : "Verify & Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMfaSetupData(null);
                              setMfaVerifyCode("");
                              setMfaVerifyError(null);
                            }}
                            className="px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-xs transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      {/* Step 3: Single-Use Backup Recovery Codes */}
                      {mfaVerifySuccess && mfaSetupData.backup_codes && (
                        <div className="pt-3 border-t border-zinc-850 space-y-3 animate-fade-in">
                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center space-x-2 text-xs text-emerald-300 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{mfaVerifySuccess} Save your emergency recovery backup codes below:</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                                8 Single-Use Recovery Codes
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyBackupCodes}
                                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                              >
                                {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedBackupCodes ? "Copied All Codes" : "Copy All Codes"}</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {mfaSetupData.backup_codes.map((code, idx) => (
                                <div
                                  key={idx}
                                  className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center font-mono text-xs text-zinc-200 select-all"
                                >
                                  {code}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Each code can only be used once if you lose access to your authenticator app. Store these in a safe vault.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Active Sessions Fleet Management (Cisco Device Inventory) */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-xs">Active Session Fleet</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {sessions.length} {sessions.length === 1 ? "device" : "devices"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Real-time device tracking with client IP telemetry, User-Agent identification, and single-click fleet revocation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={loadSessions}
                        disabled={isLoadingSessions}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Refresh session inventory"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? "animate-spin" : ""}`} />
                      </button>
                      {sessions.length > 1 && (
                        <button
                          onClick={handleRevokeOtherSessions}
                          className="apple-press px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-800/80 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Revoke Other Sessions</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {sessionActionMsg && (
                    <div className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-800 px-3 py-1.5 rounded-xl animate-fade-in flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{sessionActionMsg}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {sessions.map((sess) => (
                      <div
                        key={sess.session_id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          sess.is_current
                            ? "bg-zinc-950/80 border-emerald-500/40 shadow-sm"
                            : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            sess.device_name.toLowerCase().includes("mobile") || sess.device_name.toLowerCase().includes("iphone")
                              ? "bg-zinc-800 text-zinc-300"
                              : "bg-zinc-800 text-zinc-300"
                          }`}>
                            {sess.device_name.toLowerCase().includes("mobile") || sess.device_name.toLowerCase().includes("iphone") ? (
                              <Smartphone className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Monitor className="w-4 h-4 text-cyan-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-white">{sess.device_name}</span>
                              {sess.is_current && (
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono mt-0.5">
                              <span className="flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-zinc-600" />
                                <span>{sess.client_ip}</span>
                              </span>
                              <span>•</span>
                              <span>Active: {new Date(sess.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        {!sess.is_current && (
                          <button
                            onClick={() => handleRevokeSession(sess.session_id)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-800/80 transition cursor-pointer text-xs"
                            title="Terminate this device session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. NIST SP 800-63B Password Management Form */}
                <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">Update Account Password</h4>
                        <p className="text-[11px] text-zinc-400">
                          Enforces NIST SP 800-63B complexity. Changing password triggers an immediate SMTP security alert.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                    >
                      {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showNewPwd ? "Hide" : "Show"}</span>
                    </button>
                  </div>

                  {pwdFeedback && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
                      pwdFeedback.type === "success"
                        ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                        : "bg-red-950/30 border-red-800/60 text-red-300"
                    }`}>
                      {pwdFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{pwdFeedback.msg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Current Password
                      </label>
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={currPassword}
                        onChange={(e) => setCurrPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full px-3 py-2 rounded-xl bg-zinc-950 border text-xs text-white focus:outline-none transition ${
                          confirmPwd.length > 0 && !passwordsMatch
                            ? "border-red-500"
                            : "border-zinc-800 focus:border-purple-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Interactive NIST SP 800-63B Requirements Checklist */}
                  {newPwd.length > 0 && (
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1.5 animate-fade-in text-[11px]">
                      <div className="font-semibold text-zinc-300 text-[10px] uppercase tracking-wider">
                        NIST SP 800-63B Standard Verification
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <span className={`flex items-center space-x-1 ${pwdHasLength ? "text-emerald-400 font-medium" : "text-zinc-500"}`}>
                          <Check className="w-3 h-3" />
                          <span>8+ Chars</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${pwdHasUpper ? "text-emerald-400 font-medium" : "text-zinc-500"}`}>
                          <Check className="w-3 h-3" />
                          <span>Uppercase</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${pwdHasLower ? "text-emerald-400 font-medium" : "text-zinc-500"}`}>
                          <Check className="w-3 h-3" />
                          <span>Lowercase</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${pwdHasNumber ? "text-emerald-400 font-medium" : "text-zinc-500"}`}>
                          <Check className="w-3 h-3" />
                          <span>Number</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${pwdHasSymbol ? "text-emerald-400 font-medium" : "text-zinc-500"}`}>
                          <Check className="w-3 h-3" />
                          <span>Symbol</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingPwd || !currPassword || !isNistCompliant || !passwordsMatch}
                      className="apple-press px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition disabled:opacity-40 cursor-pointer border border-zinc-700"
                    >
                      {isSubmittingPwd ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>

                {/* 5. Recent Security Activity & Merkle AAA Audit Trail */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <History className="w-4 h-4 text-zinc-400" />
                      <h4 className="font-bold text-white text-xs">Security Activity Audit Trail</h4>
                    </div>
                    <button
                      type="button"
                      onClick={loadAuditLogs}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingAudit ? "animate-spin" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {auditLogs.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic py-2">No recent security events recorded.</p>
                    ) : (
                      auditLogs.map((log) => (
                        <div
                          key={log.event_id}
                          className="px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {log.action_type}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {log.actor_role} ({log.actor_id})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
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

                {/* Ex-Apple System Permission & Test Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          browserPermission === "granted"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                        }`}
                      >
                        {browserPermission === "granted" ? (
                          <BellRing className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-xs">
                            {browserPermission === "granted"
                              ? "System Push Notifications Active"
                              : "Native Push Notifications"}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              browserPermission === "granted"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {browserPermission.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {browserPermission === "granted"
                            ? "Connected to service worker push manager for SEV-1 distress notices & digests."
                            : "Enable desktop & mobile system banners for 14-day statutory foreclosure filings."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                      {browserPermission !== "granted" ? (
                        <button
                          onClick={handleRequestPush}
                          className="apple-press px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                        >
                          Enable Alerts
                        </button>
                      ) : (
                        <button
                          onClick={handleSendTestPush}
                          className="apple-press px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Send Test Push
                        </button>
                      )}
                    </div>
                  </div>

                  {notifFeedback && (
                    <div className="p-2 rounded-xl bg-zinc-950 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono animate-fadeIn flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{notifFeedback}</span>
                    </div>
                  )}
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
              <McpSettingsPanel />
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

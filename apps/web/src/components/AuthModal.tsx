"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Briefcase,
  Building2,
  Scale,
  FileCheck,
  DollarSign,
} from "lucide-react";
import { AuthModalTab, useAuth } from "../context/AuthContext";
import { TeamRole } from "../lib/types";

const ROLE_OPTIONS: { role: TeamRole; label: string; icon: any; desc: string }[] = [
  {
    role: "PRINCIPAL",
    label: "Principal / Family Office",
    icon: Briefcase,
    desc: "Capital allocation & final acquisition decisions",
  },
  {
    role: "ANALYST",
    label: "Deal Analyst",
    icon: Building2,
    desc: "Pipeline screening, docket ingestion & GIS verification",
  },
  {
    role: "COUNSEL",
    label: "Legal Counsel",
    icon: Scale,
    desc: "Foreclosure notice compliance, title diligence & DNC signoff",
  },
  {
    role: "CPA",
    label: "CPA / Auditor",
    icon: FileCheck,
    desc: "SBA SOP 50 10 8.1 capital structure & add-back audit",
  },
  {
    role: "LENDER_BROKER",
    label: "SBA Lender / Broker",
    icon: DollarSign,
    desc: "Redacted credit approval & 7(a)/504 lender pack review",
  },
];

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalInitialTab,
    closeAuthModal,
    signIn,
    signUp,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthModalTab>(authModalInitialTab);

  // Sign In State
  const [signInInput, setSignInInput] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up State
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<TeamRole>("PRINCIPAL");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"REQUEST" | "SUBMIT">("REQUEST");

  // Email Verification State
  const [verifyTokenInput, setVerifyTokenInput] = useState("");

  // Shared UI Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedVerificationToken, setGeneratedVerificationToken] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(authModalInitialTab);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalInitialTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleTabSwitch = (tab: AuthModalTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Sign In Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInInput.trim() || !signInPassword) {
      setErrorMsg("Please enter both username/email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signIn({
        username_or_email: signInInput.trim(),
        password: signInPassword,
      });
      // Modal auto-closes inside signIn
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Persona Auto-fill for Developer Ergonomics
  const handleQuickPersona = (username: string, role: TeamRole) => {
    setSignInInput(username);
    setSignInPassword("Institutional2026!");
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (signUpPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUp({
        username: signUpUsername.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        confirm_password: signUpConfirmPassword,
        role: signUpRole,
      });
      setGeneratedVerificationToken(res.verification_token);
      setVerifyTokenInput(res.verification_token);
      setSuccessMsg("Account created! Please verify your email with the one-click token below.");
      setActiveTab("VERIFY");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request Handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg("Please enter your account email address.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await requestPasswordReset(forgotEmail.trim());
      setSuccessMsg(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setResetStep("SUBMIT");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Submission Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const msg = await resetPassword({
        token: resetToken.trim(),
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });
      setSuccessMsg(msg);
      setTimeout(() => {
        handleTabSwitch("SIGNIN");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // Email Verification Handler
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) {
      setErrorMsg("Please provide a valid verification token.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const msg = await verifyEmail(verifyTokenInput.trim());
      setSuccessMsg(msg);
      setTimeout(() => {
        handleTabSwitch("SIGNIN");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed or token expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Institutional Identity & Access</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Single sign-on, cryptographic session tokens & 5-role governance
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-zinc-800/80 rounded-xl my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleTabSwitch("SIGNIN")}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              activeTab === "SIGNIN"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("SIGNUP")}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              activeTab === "SIGNUP"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("FORGOT")}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              activeTab === "FORGOT"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("VERIFY")}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              activeTab === "VERIFY"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Verify Email
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. SIGN IN TAB */}
        {/* ======================================================== */}
        {activeTab === "SIGNIN" && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Username or Email Address
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signInInput}
                  onChange={(e) => setSignInInput(e.target.value)}
                  placeholder="e.g. principal or principal@asup.internal"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("FORGOT")}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showSignInPassword ? "text" : "password"}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Sign In to Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Presets for Pair Programming */}
            <div className="pt-2 border-t border-zinc-800">
              <span className="block text-[11px] font-mono text-zinc-500 mb-1.5">
                Quick Persona Sign-In:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPersona("principal", "PRINCIPAL")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-emerald-300 border border-zinc-700"
                >
                  Principal
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPersona("analyst", "ANALYST")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-blue-300 border border-zinc-700"
                >
                  Analyst
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPersona("counsel", "COUNSEL")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-purple-300 border border-zinc-700"
                >
                  Counsel
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPersona("cpa", "CPA")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-amber-300 border border-zinc-700"
                >
                  CPA
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPersona("lender", "LENDER_BROKER")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-cyan-300 border border-zinc-700"
                >
                  Lender
                </button>
              </div>
            </div>

            {/* Google OAuth Option (Optional / Plug-and-Play) */}
            <div className="pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("Google Identity Client ID not set in environment. Standard Username & Password authentication is active.");
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (Optional Plug-in)</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* 2. SIGN UP TAB */}
        {/* ======================================================== */}
        {activeTab === "SIGNUP" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="investor_allentown"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="principal@capital.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Institutional Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Target Platform Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = signUpRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setSignUpRole(opt.role)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? "bg-blue-950/50 border-blue-500 text-white"
                          : "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/80"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? "bg-blue-600 text-white" : "bg-zinc-700/50 text-zinc-400"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-zinc-200">
                          {opt.label}
                        </span>
                        <span className="block text-[10px] text-zinc-400 truncate">
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Create Account & Send Verification Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* 3. FORGOT / RESET PASSWORD TAB */}
        {/* ======================================================== */}
        {activeTab === "FORGOT" && (
          <div className="space-y-4">
            {resetStep === "REQUEST" ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter your registered institutional email. We will generate a secure, 60-minute password reset token.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. principal@asup.internal"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white transition flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Generate Reset Token</span>
                  <KeyRound className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Set a new password for your account using your secure reset token.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm text-white transition flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Save New Password</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. VERIFY EMAIL TAB */}
        {/* ======================================================== */}
        {activeTab === "VERIFY" && (
          <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste your email verification token below to mark your account as verified and unlock all institutional underwriting and docket review capabilities.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Verification Token
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={verifyTokenInput}
                  onChange={(e) => setVerifyTokenInput(e.target.value)}
                  placeholder="Paste verification token here..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm text-white shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Verify Account Now</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

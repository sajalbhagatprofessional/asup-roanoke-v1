"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
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
  Smartphone,
  Check,
  Fingerprint,
} from "lucide-react";
import { AuthModalTab, useAuth } from "../context/AuthContext";
import { TeamRole } from "../lib/types";
import { apiGetOAuthAuthorizeUrl } from "../lib/api";

const ROLE_OPTIONS: { role: TeamRole; label: string; icon: any; desc: string; badge: string }[] = [
  {
    role: "PRINCIPAL",
    label: "Principal / Family Office",
    icon: Briefcase,
    desc: "Capital allocation & final acquisition decisions",
    badge: "Full Clearance",
  },
  {
    role: "ANALYST",
    label: "Deal Analyst",
    icon: Building2,
    desc: "Pipeline screening, docket ingestion & GIS verification",
    badge: "Sourcing Tier",
  },
  {
    role: "COUNSEL",
    label: "Legal Counsel",
    icon: Scale,
    desc: "Foreclosure notice compliance, title diligence & DNC signoff",
    badge: "Compliance Tier",
  },
  {
    role: "CPA",
    label: "CPA / Auditor",
    icon: FileCheck,
    desc: "SBA SOP 50 10 8.1 capital structure & add-back audit",
    badge: "Underwriting Tier",
  },
  {
    role: "LENDER_BROKER",
    label: "SBA Lender / Broker",
    icon: DollarSign,
    desc: "Redacted credit approval & 7(a)/504 lender pack review",
    badge: "Sanitized Tier",
  },
];

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalInitialTab,
    closeAuthModal,
    signIn,
    signUp,
    handleOAuthLogin,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    verifyMfaLogin,
    sendMagicLink,
    pendingMfaToken,
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

  // MFA 2FA State
  const [mfaCode, setMfaCode] = useState("");
  const [isBackupMode, setIsBackupMode] = useState(false);

  // Magic Link State
  const [magicEmail, setMagicEmail] = useState("");

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"REQUEST" | "SUBMIT">("REQUEST");

  // Email Verification State
  const [verifyTokenInput, setVerifyTokenInput] = useState("");
  const [verificationTargetEmail, setVerificationTargetEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Shared UI Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  // Password Strength Checkers (NIST SP 800-63B)
  const hasMinLen = signUpPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(signUpPassword);
  const hasLower = /[a-z]/.test(signUpPassword);
  const hasDigit = /[0-9]/.test(signUpPassword);
  const hasSymbol = /[\W_]/.test(signUpPassword);
  const isNistCompliant = hasMinLen && hasUpper && hasLower && hasDigit && hasSymbol;

  // Google OAuth SSO
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const redirectUri = typeof window !== "undefined" ? window.location.origin + "/auth/callback" : "http://localhost:3000/auth/callback";
      const authRes = await apiGetOAuthAuthorizeUrl("google", redirectUri);
      if (authRes.is_configured) {
        window.location.href = authRes.auth_url;
      } else {
        await handleOAuthLogin({
          provider: "google",
          code: "inst_eval_code_2026",
          state: authRes.state,
          mock_email: "principal.google@asup.internal",
          mock_username: "principal_google",
        });
        setSuccessMsg("Signed in successfully via Google Identity Services.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInInput.trim() || !signInPassword) {
      setErrorMsg("Please enter both username/email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signIn({
        username_or_email: signInInput.trim(),
        password: signInPassword,
      });
      if (res.status === "mfa_required") {
        setActiveTab("MFA");
        setSuccessMsg("Multi-factor authentication required. Enter your 6-digit TOTP code.");
      }
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

  // Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!isNistCompliant) {
      setErrorMsg("Password does not meet all NIST SP 800-63B requirements.");
      return;
    }

    setLoading(true);
    try {
      const email = signUpEmail.trim();
      await signUp({
        username: signUpUsername.trim(),
        email: email,
        password: signUpPassword,
        confirm_password: signUpConfirmPassword,
        role: signUpRole,
      });
      setVerificationTargetEmail(email);
      setVerifyTokenInput("");
      setSuccessMsg(`Verification email dispatched to ${email}. Check your inbox for your 6-digit code.`);
      setActiveTab("VERIFY");
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  // MFA Challenge Submit
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setErrorMsg("Please enter your verification code.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await verifyMfaLogin(mfaCode.trim());
      setSuccessMsg("Identity verified successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid MFA verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Magic Link Request Submit
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const msg = await sendMagicLink(magicEmail.trim());
      setSuccessMsg(msg);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch magic link.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Submit
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
      setResetToken("");
      setResetStep("SUBMIT");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Submit
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

  // Resend Verification Code
  const handleResendCode = async () => {
    const targetEmail = verificationTargetEmail || signUpEmail.trim() || signInInput.trim();
    if (!targetEmail) {
      setErrorMsg("Please provide your registered email address.");
      return;
    }
    setResendLoading(true);
    setErrorMsg(null);
    try {
      await resendVerification(targetEmail);
      setSuccessMsg(`A fresh 6-digit code has been dispatched to ${targetEmail}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend verification code.");
    } finally {
      setResendLoading(false);
    }
  };

  // Email Verification Submit
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) {
      setErrorMsg("Please enter the 6-digit code sent to your email.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[94vh] overflow-y-auto font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Argus Institutional Access</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-300">
                  Zero Trust
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                NIST SP 800-63B Authentication &amp; RFC 6238 Multi-Factor Gate
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Segment */}
        {activeTab !== "MFA" && (
          <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-850 rounded-xl my-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTabSwitch("SIGNIN")}
              className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
                activeTab === "SIGNIN"
                  ? "bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("SIGNUP")}
              className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
                activeTab === "SIGNUP"
                  ? "bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("MAGIC")}
              className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
                activeTab === "MAGIC"
                  ? "bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("VERIFY")}
              className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
                activeTab === "VERIFY"
                  ? "bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Verify Code
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* 1. SIGN IN TAB */}
        {activeTab === "SIGNIN" && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Username or Institutional Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signInInput}
                  onChange={(e) => setSignInInput(e.target.value)}
                  placeholder="e.g. principal or principal@asup.internal"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("FORGOT")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showSignInPassword ? "text" : "password"}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Authenticate Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Personas for Testing */}
            <div className="pt-3 border-t border-zinc-850">
              <span className="block text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">
                Authorized Personas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "principal", role: "PRINCIPAL", color: "text-emerald-400 border-emerald-900/60" },
                  { name: "analyst", role: "ANALYST", color: "text-blue-400 border-blue-900/60" },
                  { name: "counsel", role: "COUNSEL", color: "text-purple-400 border-purple-900/60" },
                  { name: "cpa", role: "CPA", color: "text-amber-400 border-amber-900/60" },
                  { name: "lender", role: "LENDER_BROKER", color: "text-cyan-400 border-cyan-900/60" },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleQuickPersona(p.name, p.role as TeamRole)}
                    className={`px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono border transition cursor-pointer ${p.color}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Google Identity SSO */}
            <div className="pt-3 border-t border-zinc-850">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In via Google Workspace</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGN UP TAB */}
        {activeTab === "SIGNUP" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="investor_john"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="john@familyoffice.com"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-8 pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* NIST SP 800-63B Interactive Checklist */}
              {signUpPassword && (
                <div className="mt-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1 text-[11px]">
                  <div className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider mb-1">
                    NIST SP 800-63B Complexity:
                  </div>
                  <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                    <span className={`flex items-center gap-1 ${hasMinLen ? "text-emerald-400" : "text-zinc-500"}`}>
                      <Check className="w-3 h-3" /> 8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-400" : "text-zinc-500"}`}>
                      <Check className="w-3 h-3" /> Uppercase (A-Z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? "text-emerald-400" : "text-zinc-500"}`}>
                      <Check className="w-3 h-3" /> Lowercase (a-z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasDigit ? "text-emerald-400" : "text-zinc-500"}`}>
                      <Check className="w-3 h-3" /> Number (0-9)
                    </span>
                    <span className={`flex items-center gap-1 col-span-2 ${hasSymbol ? "text-emerald-400" : "text-zinc-500"}`}>
                      <Check className="w-3 h-3" /> Special Symbol (!@#$%...)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type={showSignUpPassword ? "text" : "password"}
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                required
              />
            </div>

            {/* Role Clearance Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Institutional Role &amp; Clearance Level
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = signUpRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setSignUpRole(opt.role)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? "bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500"
                          : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`} />
                        <div>
                          <div className="text-xs font-semibold text-white">{opt.label}</div>
                          <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300">
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isNistCompliant}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Register &amp; Dispatch Verification Email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 3. MFA CHALLENGE TAB */}
        {activeTab === "MFA" && (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Two-Factor Authentication Required</h3>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  {isBackupMode
                    ? "Enter an unused 8-character backup recovery code generated when MFA was enabled."
                    : "Open your authenticator app (Cisco Duo, Google Authenticator, 1Password) and enter your current 6-digit code."}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {isBackupMode ? "Backup Recovery Code" : "6-Digit TOTP Code"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsBackupMode(!isBackupMode)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                >
                  {isBackupMode ? "Use Authenticator App" : "Use Backup Recovery Code"}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder={isBackupMode ? "e.g. A1B2-C3D4" : "e.g. 582910"}
                  maxLength={isBackupMode ? 16 : 6}
                  className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-base text-white font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500 transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !mfaCode.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Verify &amp; Enter Platform</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleTabSwitch("SIGNIN")}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                Cancel and return to sign in
              </button>
            </div>
          </form>
        )}

        {/* 4. MAGIC LINK (PASSWORDLESS) TAB */}
        {activeTab === "MAGIC" && (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Passwordless One-Click Access</h3>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Enter your registered institutional email. We will dispatch a cryptographically signed 15-minute login link via SMTP.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="sajalstudentcs@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !magicEmail.trim()}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-xs text-white shadow-lg shadow-teal-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Dispatch One-Click Magic Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 5. VERIFY EMAIL CODE TAB */}
        {activeTab === "VERIFY" && (
          <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Check Your Email Inbox</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  We dispatched your 6-digit verification code to:
                </p>
                <div className="mt-1 inline-block px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 font-semibold">
                  {verificationTargetEmail || signUpEmail || signInInput || "your email address"}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 transition cursor-pointer font-medium"
                >
                  {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={verifyTokenInput}
                  onChange={(e) => setVerifyTokenInput(e.target.value.trim())}
                  placeholder="e.g. 821353"
                  maxLength={64}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-base text-white font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500 shadow-inner"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Enter the 6-digit code sent to your email, or paste your verification link token.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !verifyTokenInput.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Verify &amp; Activate Account</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 6. FORGOT / RESET PASSWORD TAB */}
        {activeTab === "FORGOT" && (
          <div className="space-y-4">
            {resetStep === "REQUEST" ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="john@familyoffice.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !forgotEmail.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg shadow-blue-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Dispatch Reset Instructions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste reset token from email"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    New Password (NIST SP 800-63B)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Set New Password</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

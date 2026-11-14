"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthLogin } = useAuth();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function completeOAuth() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(
            errorDescription ||
              (error === "access_denied"
                ? "Authorization was canceled or declined in Google Identity Services."
                : `OAuth Error: ${error}`)
          );
        }
        return;
      }

      if (!code || !state) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Missing OAuth authorization code or CSRF state parameter.");
        }
        return;
      }

      try {
        const user = await handleOAuthLogin({
          provider: "google",
          code,
          state,
        });

        if (isMounted) {
          setStatus("success");
          setUserEmail(user.email);
          // Seamless redirect to dashboard after brief confirmation
          setTimeout(() => {
            router.push("/");
          }, 1200);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Failed to complete Google OAuth identity verification.");
        }
      }
    }

    completeOAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, handleOAuthLogin, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
              Argus Identity Services
            </h1>
            <p className="text-[11px] text-zinc-400 font-mono">RFC-7636 PKCE Authentication</p>
          </div>
        </div>

        {/* Processing State */}
        {status === "processing" && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-spin">
              <RefreshCw className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Verifying Google Identity...
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Exchanging cryptographic authorization tokens and establishing institutional session.
              </p>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Authentication Successful
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Welcome back{userEmail ? `, ${userEmail}` : ""}. Redirecting to dashboard...
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Authentication Failed
              </h2>
              <p className="text-xs text-red-400 mt-2 bg-red-950/40 border border-red-900/50 p-3 rounded-xl break-words">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition"
            >
              <span>Return to Argus Platform</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-zinc-800 text-zinc-400 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-400 font-mono">Loading authentication session...</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw, Mail } from "lucide-react";
import { apiVerifyEmail } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const token = searchParams.get("token");

    if (!token) {
      if (isMounted) {
        setStatus("error");
        setMessage("Missing verification token. Please check the link from your email.");
      }
      return;
    }

    async function runVerification() {
      try {
        const res = await apiVerifyEmail(token!);
        if (isMounted) {
          setStatus("success");
          setMessage(res.message || "Your email has been successfully verified.");
          setTimeout(() => {
            router.push("/");
          }, 2500);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setMessage(err.message || "Verification failed. The token may be expired or already used.");
        }
      }
    }

    runVerification();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
              Argus Platform
            </h1>
            <p className="text-[11px] text-zinc-400 font-mono">Email Identity Verification</p>
          </div>
        </div>

        {status === "verifying" && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-spin">
              <RefreshCw className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Verifying Email Token...
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Validating cryptographic signatures and activating institutional permissions.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Account Verified!
              </h2>
              <p className="text-xs text-zinc-300 mt-1">{message}</p>
              <p className="text-[11px] text-zinc-500 mt-2">Redirecting to platform dashboard...</p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Verification Failed
              </h2>
              <p className="text-xs text-rose-300 mt-2 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl break-words">
                {message}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-zinc-800 text-zinc-400 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-400 font-mono">Loading verification token...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

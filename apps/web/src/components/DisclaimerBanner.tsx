import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export const LEGAL_TAX_DISCLAIMER =
  "LLM DRAFT — NOT LEGAL, TAX, OR CPA ADVICE. REQUIRES HUMAN COUNSEL & CPA SIGN-OFF";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-950/60 border-b border-amber-700/50 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-semibold tracking-wide uppercase">
          Institutional Compliance Guard:
        </span>
        <span className="font-mono text-amber-300">{LEGAL_TAX_DISCLAIMER}</span>
      </div>
      <div className="hidden md:flex items-center space-x-2 text-emerald-400">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span className="font-mono text-[11px]">
          Pure Python decimal.Decimal Air-Gap Enforced
        </span>
      </div>
    </div>
  );
}

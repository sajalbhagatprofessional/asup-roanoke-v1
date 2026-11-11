import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export const LEGAL_TAX_DISCLAIMER =
  "LLM DRAFT — NOT LEGAL, TAX, OR CPA ADVICE. REQUIRES HUMAN COUNSEL & CPA SIGN-OFF";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-950/60 border-b border-amber-700/50 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-amber-200 flex items-center justify-between gap-2 select-none">
      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
        <span className="hidden sm:inline font-semibold tracking-wide uppercase shrink-0">
          Compliance Guard:
        </span>
        <span className="font-mono text-amber-300 truncate">{LEGAL_TAX_DISCLAIMER}</span>
      </div>
      <div className="hidden lg:flex items-center space-x-1.5 text-emerald-400 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span className="font-mono text-[11px]">
          decimal.Decimal Air-Gap Enforced
        </span>
      </div>
    </div>
  );
}

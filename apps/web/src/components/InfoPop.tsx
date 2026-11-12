"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X, ExternalLink, HelpCircle, Check, ArrowRight, BookOpen } from "lucide-react";
import { getGlossaryTerm, GlossaryTerm } from "../lib/glossary";

interface InfoPopProps {
  term: string; // The glossary term ID (e.g. "DSCR", "BASE_DSCR", "VA_CODE_55_1_321")
  children?: React.ReactNode; // Optional text to wrap with underline trigger
  size?: "xs" | "sm" | "md";
  className?: string;
  iconOnly?: boolean;
  align?: "left" | "center" | "right";
  onOpenGlossary?: (termId?: string) => void;
}

export default function InfoPop({
  term,
  children,
  size = "sm",
  className = "",
  iconOnly = false,
  align = "center",
  onOpenGlossary,
}: InfoPopProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const termData: GlossaryTerm | null = getGlossaryTerm(term);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!termData) {
    // If term not found, gracefully render children without crashing
    return <span className={className}>{children}</span>;
  }

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "UNDERWRITING_FINANCE":
        return {
          pill: "bg-blue-950/70 text-blue-300 border-blue-800/80",
          accent: "text-blue-400",
          border: "border-blue-500/30",
        };
      case "LEGAL_STATUTORY":
        return {
          pill: "bg-indigo-950/70 text-indigo-300 border-indigo-800/80",
          accent: "text-indigo-400",
          border: "border-indigo-500/30",
        };
      case "INSTITUTIONAL_TITANS":
        return {
          pill: "bg-purple-950/70 text-purple-300 border-purple-800/80",
          accent: "text-purple-400",
          border: "border-purple-500/30",
        };
      case "TAX_ALPHA":
        return {
          pill: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80",
          accent: "text-emerald-400",
          border: "border-emerald-500/30",
        };
      case "COMPLIANCE_OPERATIONS":
      default:
        return {
          pill: "bg-amber-950/70 text-amber-300 border-amber-800/80",
          accent: "text-amber-400",
          border: "border-amber-500/30",
        };
    }
  };

  const theme = getCategoryTheme(termData.category);

  const getAlignmentClass = () => {
    switch (align) {
      case "left":
        return "left-0";
      case "right":
        return "right-0";
      case "center":
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleOpenMasterGlossary = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenGlossary) {
      onOpenGlossary(termData.id);
    } else {
      // Dispatch global window event so any parent modal or navbar can open the master glossary
      window.dispatchEvent(
        new CustomEvent("open-argus-glossary", { detail: { termId: termData.id } })
      );
    }
  };

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger: Either wrapping children with dotted underline, or a standalone (i) icon */}
      {children && !iconOnly ? (
        <span
          onClick={handleTriggerClick}
          className="group/term inline-flex items-center gap-1 cursor-help border-b border-dotted border-zinc-500/70 hover:border-zinc-300 transition-colors"
          title={`Click for definition: ${termData.name}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span>{children}</span>
          <HelpCircle
            className={`${iconSizes[size]} text-zinc-500 group-hover/term:text-blue-400 transition-colors shrink-0 opacity-70 group-hover/term:opacity-100`}
          />
        </span>
      ) : (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="inline-flex items-center justify-center p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title={`Click for definition: ${termData.name}`}
          aria-label={`Info: ${termData.name}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <Info className={`${iconSizes[size]} text-zinc-400 hover:text-blue-400 transition-colors`} />
        </button>
      )}

      {/* Floating Info Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-[100] bottom-full mb-2 w-72 sm:w-80 p-3.5 rounded-2xl bg-zinc-950/95 border ${theme.border} shadow-2xl backdrop-blur-xl text-left font-sans text-xs animate-in fade-in zoom-in-95 duration-150 ${getAlignmentClass()}`}
          role="dialog"
          aria-labelledby={`infopop-${termData.id}-title`}
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2.5 border-b border-zinc-800/80">
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${theme.pill} mb-1`}
              >
                {termData.categoryLabel}
              </span>
              <h4
                id={`infopop-${termData.id}-title`}
                className="text-xs sm:text-sm font-extrabold text-white leading-tight"
              >
                {termData.name}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simple Plain-English Definition */}
          <p className="text-[11.5px] text-zinc-200 leading-relaxed font-sans mb-2.5">
            {termData.simpleDefinition}
          </p>

          {/* Formula or Statutory Rule */}
          {termData.formulaOrRule && (
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800/80 mb-2.5 text-[10.5px] font-mono">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-0.5">
                Formula / Statutory Rule
              </span>
              <span className="text-zinc-200 block break-words">
                {termData.formulaOrRule}
              </span>
            </div>
          )}

          {/* Why It Matters */}
          <div className="mb-2.5 text-[11px] leading-snug">
            <span className="font-bold text-zinc-400 block mb-0.5">Why It Matters:</span>
            <span className="text-zinc-300">{termData.whyItMatters}</span>
          </div>

          {/* Ideal Range / Benchmark if present */}
          {termData.idealRange && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 mb-2.5 text-[10.5px]">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-mono font-semibold">
                Target: {termData.idealRange}
              </span>
            </div>
          )}

          {/* Footer Link to Master Glossary */}
          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500 font-mono">
              {termData.statuteCitation || "Argus Protocol"}
            </span>
            <button
              type="button"
              onClick={handleOpenMasterGlossary}
              className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition group/btn cursor-pointer"
            >
              <span>Glossary</span>
              <ArrowRight className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

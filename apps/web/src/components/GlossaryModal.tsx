"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  BookOpen,
  Filter,
  Check,
  Copy,
  ExternalLink,
  Scale,
  DollarSign,
  Zap,
  Shield,
  Layers,
} from "lucide-react";
import { GLOSSARY_TERMS, GlossaryCategory, GlossaryTerm } from "../lib/glossary";

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string;
}

const CATEGORY_TABS: { id: GlossaryCategory | "ALL"; label: string; icon: any }[] = [
  { id: "ALL", label: "All Terms", icon: BookOpen },
  { id: "UNDERWRITING_FINANCE", label: "Underwriting & Finance", icon: DollarSign },
  { id: "LEGAL_STATUTORY", label: "Legal & Foreclosure", icon: Scale },
  { id: "INSTITUTIONAL_TITANS", label: "Institutional Titans", icon: Zap },
  { id: "TAX_ALPHA", label: "Tax Alpha (§ 1031 / MACRS)", icon: Layers },
  { id: "COMPLIANCE_OPERATIONS", label: "Compliance & Fiduciary", icon: Shield },
];

export default function GlossaryModal({
  isOpen,
  onClose,
  initialTermId,
}: GlossaryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | "ALL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Set initial state or scroll to term when opened
  useEffect(() => {
    if (initialTermId) {
      const term = GLOSSARY_TERMS[initialTermId];
      if (term) {
        setSelectedCategory("ALL");
        setSearchQuery(term.shortName);
      }
    } else {
      setSearchQuery("");
      setSelectedCategory("ALL");
    }
  }, [initialTermId, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allTermsList: GlossaryTerm[] = useMemo(() => {
    return Object.values(GLOSSARY_TERMS);
  }, []);

  const filteredTerms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allTermsList.filter((term) => {
      const matchesCategory =
        selectedCategory === "ALL" || term.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      return (
        term.name.toLowerCase().includes(query) ||
        term.shortName.toLowerCase().includes(query) ||
        term.simpleDefinition.toLowerCase().includes(query) ||
        (term.formulaOrRule && term.formulaOrRule.toLowerCase().includes(query)) ||
        (term.statuteCitation && term.statuteCitation.toLowerCase().includes(query))
      );
    });
  }, [allTermsList, searchQuery, selectedCategory]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-zinc-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-700/50 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Argus Platform Knowledge Base
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Financial, Statutory &amp; Institutional Glossary
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Clear plain-English explanations, statutory formulas, and institutional guidance for every metric.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="pt-4 pb-3 space-y-3 border-b border-zinc-800/80">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 45+ terms by acronym, formula, or law (e.g., 'DSCR', '55.1-321', '1031', 'Waterfall')..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold pb-1">
            {CATEGORY_TABS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                      : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Terms List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 custom-scrollbar">
          {filteredTerms.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-zinc-400">No matching financial or legal terms found</p>
              <p className="mt-1">Try searching for "DSCR", "Basis", "Foreclosure", "SBA", or "1031".</p>
            </div>
          ) : (
            filteredTerms.map((term) => (
              <div
                key={term.id}
                id={`glossary-item-${term.id}`}
                className="p-4 rounded-xl bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition space-y-2 text-xs"
              >
                {/* Term Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {term.categoryLabel}
                      </span>
                      {term.statuteCitation && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
                          {term.statuteCitation}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {term.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        term.id,
                        `${term.name}\n${term.simpleDefinition}\nFormula/Rule: ${term.formulaOrRule || "N/A"}`
                      )
                    }
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Copy definition to clipboard"
                  >
                    {copiedId === term.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Plain-English Definition */}
                <p className="text-zinc-300 text-xs leading-relaxed font-sans">
                  {term.simpleDefinition}
                </p>

                {/* Formula or Statutory Rule */}
                {term.formulaOrRule && (
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 font-mono text-[11px] text-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-0.5">
                      Statutory Formula / Governing Rule
                    </span>
                    {term.formulaOrRule}
                  </div>
                )}

                {/* Why It Matters & Ideal Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-850">
                    <span className="font-bold text-zinc-400 block mb-0.5">Why It Matters</span>
                    <span className="text-zinc-300">{term.whyItMatters}</span>
                  </div>

                  {term.idealRange && (
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                      <span className="font-bold text-emerald-400 block mb-0.5">
                        Target / Compliance Benchmark
                      </span>
                      <span className="text-emerald-200 font-mono">{term.idealRange}</span>
                    </div>
                  )}
                </div>

                {/* Practical Example */}
                {term.example && (
                  <div className="text-[11px] text-zinc-400 font-sans italic">
                    <span className="font-semibold text-zinc-500 not-italic">Example: </span>
                    {term.example}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Showing {filteredTerms.length} of {allTermsList.length} terms</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition cursor-pointer"
          >
            Close Glossary
          </button>
        </div>
      </div>
    </div>
  );
}

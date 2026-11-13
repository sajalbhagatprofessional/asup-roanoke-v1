"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Building,
  Scale,
  Waves,
  BarChart3,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronDown,
  Sparkles,
  FileText,
  Briefcase,
  Layers,
  Flame,
  Globe,
} from "lucide-react";
import {
  ResearchTargetParams,
  buildGoogleMapsUrl,
  buildGoogleSatelliteUrl,
  buildVaSccCisUrl,
  buildOpenCorporatesUrl,
  buildCourtListenerUrl,
  buildColumnPublicNoticeUrl,
  buildFemaFloodUrl,
  buildCensusNaicsUrl,
  buildLinkedInCompanyUrl,
  buildEpaUstUrl,
  generateMarkdownResearchBrief,
  downloadCsvUnderwritingModel,
  formatFullAddress,
} from "../lib/researchLinks";

export interface AssetResearchBarProps {
  params: ResearchTargetParams;
  variant?: "compact" | "full" | "card_strip";
  className?: string;
}

export default function AssetResearchBar({
  params,
  variant = "compact",
  className = "",
}: AssetResearchBarProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const address = formatFullAddress(params) || (params.city ? `${params.city}, ${params.state || "VA"}` : "Roanoke, VA");
  const entity = params.entityName || "Target Business";

  const googleMapsUrl = buildGoogleMapsUrl(address);
  const satelliteUrl = buildGoogleSatelliteUrl(address);
  const sccUrl = buildVaSccCisUrl(entity);
  const openCorpUrl = buildOpenCorporatesUrl(entity);
  const courtUrl = buildCourtListenerUrl(params.docketId, entity);
  const columnNoticeUrl = buildColumnPublicNoticeUrl(entity);
  const femaUrl = buildFemaFloodUrl(address);
  const naicsUrl = buildCensusNaicsUrl(params.naicsCode);
  const linkedInUrl = buildLinkedInCompanyUrl(entity);
  const epaUrl = buildEpaUstUrl();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopyBrief = (e: React.MouseEvent) => {
    e.stopPropagation();
    const markdown = generateMarkdownResearchBrief(params);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadCsvUnderwritingModel(params);
  };

  // Card Strip: Sleek horizontal micro-buttons designed to sit inside asset & deal cards
  if (variant === "card_strip") {
    return (
      <div
        className={`flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] font-sans ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold mr-1 shrink-0">
            Research:
          </span>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Address in Google Maps"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-300 transition shrink-0"
          >
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Map</span>
          </a>

          <a
            href={satelliteUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Inspect Satellite Roof & Yard Imagery"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-blue-300 transition shrink-0"
          >
            <Layers className="w-3 h-3 text-blue-400" />
            <span>Aerial</span>
          </a>

          <a
            href={sccUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Check Corporate Registry on Virginia SCC CIS"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-purple-300 transition shrink-0"
          >
            <Building className="w-3 h-3 text-purple-400" />
            <span>SCC</span>
          </a>

          <a
            href={courtUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Search Bankruptcy & Court Dockets on CourtListener / RECAP"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition shrink-0"
          >
            <Scale className="w-3 h-3 text-amber-400" />
            <span>Court</span>
          </a>

          <a
            href={femaUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Verify FEMA Flood Hazard Center"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition shrink-0"
          >
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>Flood</span>
          </a>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={handleCopyBrief}
            title="Copy pre-formatted Investment Committee Markdown brief to clipboard"
            className="p-1 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={handleExportCsv}
            title="Download CSV financial underwriting model"
            className="p-1 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Full Variant: Designed for Hero sections of Dossier Modals
  return (
    <div
      ref={dropdownRef}
      className={`relative flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-md ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 mr-1">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
          1-Click Research:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-emerald-400 border border-zinc-800 text-xs font-medium transition"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Google Maps</span>
        </a>

        <a
          href={satelliteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-blue-400 border border-zinc-800 text-xs font-medium transition"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Satellite Aerial</span>
        </a>

        <a
          href={sccUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-purple-400 border border-zinc-800 text-xs font-medium transition"
        >
          <Building className="w-3.5 h-3.5 text-purple-400" />
          <span>VA SCC CIS</span>
        </a>

        <a
          href={openCorpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-zinc-100 border border-zinc-800 text-xs font-medium transition"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <span>OpenCorporates</span>
        </a>

        <a
          href={courtUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 border border-zinc-800 text-xs font-medium transition"
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>CourtListener Dockets</span>
        </a>

        <a
          href={columnNoticeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-indigo-400 border border-zinc-800 text-xs font-medium transition"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Roanoke Times Notices</span>
        </a>

        <a
          href={femaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-cyan-400 border border-zinc-800 text-xs font-medium transition"
        >
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>FEMA Flood</span>
        </a>

        {params.naicsCode && (
          <a
            href={naicsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-emerald-400 border border-zinc-800 text-xs font-medium transition"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>NAICS {params.naicsCode} Census</span>
          </a>
        )}

        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-blue-400 border border-zinc-800 text-xs font-medium transition"
        >
          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
          <span>LinkedIn</span>
        </a>

        <a
          href={epaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-rose-400 border border-zinc-800 text-xs font-medium transition"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>EPA UST</span>
        </a>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={handleCopyBrief}
          title="Copy full Investment Committee Markdown brief with clickable research links"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-750 text-xs font-semibold transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Brief Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy Brief</span>
            </>
          )}
        </button>

        <button
          onClick={handleExportCsv}
          title="Export CSV underwriting model for Excel or Google Sheets"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Model</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Scale,
  FileCheck2,
  Building2,
  TrendingUp,
  Shield,
  Activity,
  Compass,
  MapPin,
  Radio,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { fetchActiveMandate, fetchHealth } from "../lib/api";
import { HealthStatus, MandateProfile, TeamRole } from "../lib/types";
import MandateSetupModal from "./MandateSetupModal";
import SourceTrackerModal from "./SourceTrackerModal";
import InstitutionalAladdinModal from "./InstitutionalAladdinModal";

interface NavItem {
  name: string;
  role: TeamRole;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Principal", role: "PRINCIPAL", href: "/", icon: Briefcase },
  { name: "Analyst", role: "ANALYST", href: "/analyst", icon: TrendingUp },
  { name: "Counsel", role: "COUNSEL", href: "/counsel", icon: Scale },
  { name: "CPA", role: "CPA", href: "/cpa", icon: FileCheck2 },
  { name: "Lender", role: "LENDER_BROKER", href: "/lender", icon: Building2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeMandate, setActiveMandate] = useState<MandateProfile | null>(null);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isAladdinModalOpen, setIsAladdinModalOpen] = useState(false);

  const loadMandateAndHealth = () => {
    fetchHealth().then(setHealth).catch(() => {});
    fetchActiveMandate().then(setActiveMandate).catch(() => {});
  };

  useEffect(() => {
    loadMandateAndHealth();
  }, []);

  const formatPriceCeiling = (priceStr?: string) => {
    if (!priceStr) return "$5.0M";
    const num = parseFloat(priceStr);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${(num / 1000).toFixed(0)}k`;
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* 1. Left Group: Brand & Active Market Selector */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Brand Logo & Title */}
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/60 transition">
                <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold tracking-tight text-white text-sm">
                    ASUP
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-950/70 border border-emerald-800/80">
                    PRO
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 -mt-0.5 tracking-tight font-medium">
                  Institutional Sourcing
                </div>
              </div>
            </Link>

            {/* Interactive Target Location & Budget Pill */}
            <button
              type="button"
              onClick={() => setIsMandateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-emerald-500/60 transition cursor-pointer text-xs group shadow-sm"
              title="Click to configure target state, counties, budget bounds & underwriting hurdles"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-semibold text-white">
                {activeMandate?.target_states.join(", ") || "VA"} Market
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-mono text-[11px]">
                ≤ {formatPriceCeiling(activeMandate?.max_price_usd)}
              </span>
              <span className="hidden md:inline text-slate-500 font-mono text-[10px]">
                ({activeMandate?.target_fips.length || 7} Co.)
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 transition-colors shrink-0 ml-0.5" />
            </button>
          </div>

          {/* 2. Center Group: 5-Role Segmented Workspace Navigation */}
          <nav className="flex items-center space-x-1 overflow-x-auto custom-scrollbar py-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.role}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* 3. Right Group: Institutional Tools & Real-Time Status */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* BlackRock Aladdin Institutional Terminal Button */}
            <button
              onClick={() => setIsAladdinModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-950/90 to-zinc-900 hover:from-emerald-900/80 hover:to-zinc-800 border border-emerald-600/50 hover:border-emerald-500 text-emerald-300 text-xs font-semibold transition cursor-pointer shadow-sm group"
              title="Open BlackRock Aladdin Institutional Risk & Portfolio Intelligence Terminal"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline">Aladdin Terminal</span>
              <span className="lg:hidden">Aladdin</span>
            </button>

            {/* Source Connectivity Health Button */}
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 text-blue-300 text-xs font-medium transition cursor-pointer"
              title="Track data sources, connectivity status, and access keys for this location"
            >
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Sources</span>
            </button>

            {/* Compliance Badge */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SOP 50 10 8.1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Location & Budget Mandate Modal */}
      <MandateSetupModal
        isOpen={isMandateModalOpen}
        onClose={() => setIsMandateModalOpen(false)}
        onSuccess={(profile) => {
          setActiveMandate(profile);
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />

      {/* Location Resource & Connectivity Tracker Modal */}
      <SourceTrackerModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        mandateCode={activeMandate?.mandate_id}
      />

      {/* Institutional Aladdin Terminal Modal */}
      <InstitutionalAladdinModal
        isOpen={isAladdinModalOpen}
        onClose={() => setIsAladdinModalOpen(false)}
      />
    </header>
  );
}

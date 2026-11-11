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
  Sliders,
  Radio,
} from "lucide-react";
import { fetchActiveMandate, fetchHealth } from "../lib/api";
import { HealthStatus, MandateProfile, TeamRole } from "../lib/types";
import MandateSetupModal from "./MandateSetupModal";
import SourceTrackerModal from "./SourceTrackerModal";

interface NavItem {
  name: string;
  role: TeamRole;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Principal Digest", role: "PRINCIPAL", href: "/", icon: Briefcase },
  { name: "Analyst Pipeline", role: "ANALYST", href: "/analyst", icon: TrendingUp },
  { name: "Counsel Review", role: "COUNSEL", href: "/counsel", icon: Scale },
  { name: "CPA Audit", role: "CPA", href: "/cpa", icon: FileCheck2 },
  { name: "Lender Pack", role: "LENDER_BROKER", href: "/lender", icon: Building2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeMandate, setActiveMandate] = useState<MandateProfile | null>(null);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const loadMandateAndHealth = () => {
    fetchHealth().then(setHealth).catch(() => {});
    fetchActiveMandate().then(setActiveMandate).catch(() => {});
  };

  useEffect(() => {
    loadMandateAndHealth();
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-base">
                  ASUP NATIONWIDE
                </span>
                {/* Interactive Mandate & Budget Switcher */}
                <button
                  type="button"
                  onClick={() => setIsMandateModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/80 transition cursor-pointer text-[11px] font-mono group"
                  title="Click to change target state, counties, or budget box"
                >
                  <MapPin className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">
                    {activeMandate?.target_states.join(",") || "VA"} Market
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    &lt;= ${(parseFloat(activeMandate?.max_price_usd || "5000000") / 1000000).toFixed(1)}M Box
                  </span>
                  <span className="text-[10px] text-emerald-300 underline ml-1">Change</span>
                </button>
                {/* Source & Resource Connectivity Button */}
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-700/80 transition cursor-pointer text-[11px] font-mono group"
                  title="View active sources, connectivity health, and access barriers for this location"
                >
                  <Radio className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform animate-pulse" />
                  <span className="font-semibold">Sources</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {activeMandate?.mandate_name || "Target Acquisition Mandate & Strategic Budget Engine"}
              </p>
            </div>
          </div>

          {/* Role Navigation */}
          <nav className="flex space-x-1 sm:space-x-2">
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mandate Health Pill */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800 text-blue-300 transition"
              title="Track data sources and connectivity for this location"
            >
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Source Tracker</span>
            </button>
            <span className="text-slate-500">|</span>
            <button
              onClick={() => setIsMandateModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mandate Box</span>
            </button>
            <span className="text-slate-500">|</span>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
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
          // Reload window to refresh all page components with new market deals
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
    </header>
  );
}

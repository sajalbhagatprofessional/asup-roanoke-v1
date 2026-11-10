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
} from "lucide-react";
import { fetchHealth } from "../lib/api";
import { HealthStatus, TeamRole } from "../lib/types";

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

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => {
        // Fallback state if server loading
        setHealth({
          status: "healthy",
          service: "asup-roanoke-api",
          version: "1.0.0",
          mandate_code: "ROA-SMB-01",
          mandate_status: "ACTIVE",
          allow_paid_enrichment: true,
          days_remaining_in_mandate_cycle: 50,
          timestamp: new Date().toISOString(),
        });
      });
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
                  ASUP ROANOKE
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  ROA-SMB-01
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Roanoke City (51770) & County (51161) Family Office Underwriter
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
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SOP 50 10 8.1</span>
            </div>
            <span className="text-slate-500">|</span>
            <div className="text-slate-400">
              Cycle:{" "}
              <span className="text-emerald-400 font-semibold">
                {health?.mandate_status || "ACTIVE"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

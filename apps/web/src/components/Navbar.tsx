"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Scale,
  FileCheck2,
  Building2,
  TrendingUp,
  Shield,
  MapPin,
  ChevronDown,
  Sparkles,
  Bot,
  Radio,
  Command,
  User,
  CheckCircle2,
  LogOut,
  Layers,
  GitBranch,
} from "lucide-react";
import { fetchActiveMandate, fetchHealth } from "../lib/api";
import { HealthStatus, MandateProfile, TeamRole } from "../lib/types";
import MandateSetupModal from "./MandateSetupModal";
import SourceTrackerModal from "./SourceTrackerModal";
import InstitutionalAladdinModal from "./InstitutionalAladdinModal";
import McpGatewayModal from "./McpGatewayModal";
import UpstreamDependencyModal from "./UpstreamDependencyModal";
import PWAInstallAndStatus from "./PWAInstallAndStatus";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";

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
  const { user, signOut, openAuthModal } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeMandate, setActiveMandate] = useState<MandateProfile | null>(null);

  // Modals
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isAladdinModalOpen, setIsAladdinModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

  const loadMandateAndHealth = () => {
    fetchHealth().then(setHealth).catch(() => {});
    fetchActiveMandate().then(setActiveMandate).catch(() => {});
  };

  useEffect(() => {
    loadMandateAndHealth();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <>
      {/* 1. Primary Top Navigation Bar (Apple Dynamic Glass Island) */}
      <header className="border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-2">
            
            {/* Left Group: Brand & Dynamic Mandate Capsule */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-sm">
                  <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
                  </div>
                </div>
                <div className="hidden xs:block sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold tracking-wider text-white text-sm">ARGUS</span>
                    <span className="text-[9px] font-mono text-cyan-400 font-semibold px-1 py-0.2 rounded bg-cyan-950/70 border border-cyan-800/60">
                      INTELLIGENCE
                    </span>
                  </div>
                </div>
              </Link>

              {/* Dynamic Mandate Capsule */}
              <button
                type="button"
                onClick={() => setIsMandateModalOpen(true)}
                className="apple-press flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-xs shadow-sm"
                title="Configure investment mandate bounds, target states, budget and underwriting hurdles"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white text-[11px] sm:text-xs">
                  {activeMandate?.target_states.join(", ") || "VA"} Market
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-300 font-mono text-[10px] sm:text-[11px]">
                  ≤{formatPriceCeiling(activeMandate?.max_price_usd)}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5 shrink-0" />
              </button>
            </div>

            {/* Center Group: 5-Role Segmented Workspace Navigation */}
            <nav className="hidden sm:flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-850">
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
                    className={`apple-press flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      isActive
                        ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/80 font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-850"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                    <span className="hidden md:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Group: Consolidated Tools Hub & User Profile */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* PWA Connection Status */}
              <PWAInstallAndStatus />

              {/* Consolidated Intelligence & Tools Hub (Apple Command Drawer) */}
              <div className="relative" ref={toolsMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className="apple-press flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold transition cursor-pointer shadow-sm group"
                  title="Open Intelligence Hub (Aladdin, AI Agents MCP, Location Sources)"
                >
                  <Command className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Tools Hub</span>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isToolsMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isToolsMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl p-1.5 z-50 text-xs backdrop-blur-xl animate-fadeIn space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-850">
                      Institutional Engines
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsAladdinModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-zinc-900 transition group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          Aladdin Terminal
                        </div>
                        <div className="text-[10px] text-zinc-400">Risk, sensitivity & SOFR stress</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsMcpModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-zinc-900 transition group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-700/50 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                          AI Agents (MCP Gateway)
                        </div>
                        <div className="text-[10px] text-zinc-400">Claude, Hermes & stdio runner</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsSourceModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-zinc-900 transition group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-700/50 flex items-center justify-center shrink-0">
                        <Radio className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                          Location Sources
                        </div>
                        <div className="text-[10px] text-zinc-400">GIS, TACS, dockets & scrapers</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsDependencyModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-zinc-900 transition group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center shrink-0">
                        <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          Upstream Tracker
                        </div>
                        <div className="text-[10px] text-zinc-400">29 repos, PyPI & air-gap gate</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* User Identity & Auth Button */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="apple-press flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs cursor-pointer transition"
                    title={`Logged in as ${user.username} (${user.role})`}
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-[10px]">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white text-xs hidden md:inline">
                      {user.username}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                  </button>

                  {isUserDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl p-2 z-50 text-xs backdrop-blur-xl animate-fadeIn">
                      <div className="px-3 py-2 border-b border-zinc-850">
                        <p className="font-semibold text-white truncate">{user.username}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                            {user.role}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {user.is_verified ? "• Verified" : "• Unverified"}
                          </span>
                        </div>
                      </div>
                      {!user.is_verified && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            openAuthModal("VERIFY");
                          }}
                          className="w-full text-left px-3 py-2 text-amber-300 hover:bg-zinc-900 rounded-lg transition font-medium mt-1"
                        >
                          Verify Email Address
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          openAuthModal("FORGOT");
                        }}
                        className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 rounded-lg transition font-medium mt-1"
                      >
                        Reset / Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-zinc-900 rounded-lg transition font-medium mt-1 border-t border-zinc-850 flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("SIGNIN")}
                  className="apple-press flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  title="Sign In or Register an Account"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Apple iOS-Style Floating Docked Tab Bar (Mobile Only) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/85 backdrop-blur-2xl border-t border-zinc-800 pb-safe shadow-2xl">
        <div className="flex items-center justify-around px-2 py-1.5">
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
                className={`apple-press flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "text-emerald-400 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition ${
                    isActive ? "bg-emerald-500/15" : "bg-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.name}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

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

      {/* Developer & AI Agent Gateway (MCP) Modal */}
      <McpGatewayModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />

      {/* Upstream & Open-Source Dependency Tracker Modal */}
      <UpstreamDependencyModal
        isOpen={isDependencyModalOpen}
        onClose={() => setIsDependencyModalOpen(false)}
      />

      {/* User Authentication & Identity Modal */}
      <AuthModal />
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
} from "lucide-react";
import DealCard from "../components/DealCard";
import DealFilterBar from "../components/DealFilterBar";
import AssetIntelligenceModal from "../components/AssetIntelligenceModal";
import UniversalAssetSearchBar from "../components/UniversalAssetSearchBar";
import UniversalAssetCard from "../components/UniversalAssetCard";
import UniversalAssetDossierModal from "../components/UniversalAssetDossierModal";
import UserPreferencesModal from "../components/UserPreferencesModal";
import DealPipelineKanbanModal from "../components/DealPipelineKanbanModal";
import {
  fetchActiveMandate,
  fetchDeals,
  fetchUserPreferences,
  principalDecision,
  searchUniversalAssets,
  updatePipelineStage,
} from "../lib/api";
import {
  AssetClass,
  Deal,
  DealFilterParams,
  MandateProfile,
  PipelineStage,
  UniversalAsset,
  UserPreferenceProfile,
} from "../lib/types";

const DEFAULT_PREFERENCES: UserPreferenceProfile = {
  profile_id: "default_investor",
  investor_name: "Principal Family Office",
  target_locations: ["Allentown, PA", "Nationwide"],
  min_check_usd: "100000.00",
  max_budget_usd: "5000000.00",
  target_asset_classes: [
    "BUSINESS_ACQUISITION",
    "REAL_ESTATE",
    "TAX_LIEN_MUNICIPAL",
    "EQUIPMENT_FLEET",
  ],
  operator_style: "ACTIVE_OPERATOR",
  max_acceptable_crime_index: 45,
  min_years_operating: 15,
  baby_boomer_succession_only: false,
  section_8_only: false,
};

export default function UnifiedSourcingDashboard() {
  // Top-Level Mode: "AGGREGATOR" (All Opportunities) vs "DIGEST" (Principal Top 5 Digest)
  const [activeView, setActiveView] = useState<"AGGREGATOR" | "DIGEST">("AGGREGATOR");

  // Universal Asset Aggregator State
  const [universalAssets, setUniversalAssets] = useState<UniversalAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferenceProfile>(DEFAULT_PREFERENCES);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<AssetClass | "ALL">("ALL");
  const [selectedMetro, setSelectedMetro] = useState("");
  const [babyBoomerOnly, setBabyBoomerOnly] = useState(false);
  const [section8Only, setSection8Only] = useState(false);
  const [maxCrimeIndex, setMaxCrimeIndex] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("recommended");

  // Modals
  const [selectedDossierAsset, setSelectedDossierAsset] = useState<UniversalAsset | null>(null);
  const [dossierInitialTab, setDossierInitialTab] = useState<
    "OVERVIEW" | "OSINT" | "OUTREACH" | "PIPELINE"
  >("OVERVIEW");
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isKanbanModalOpen, setIsKanbanModalOpen] = useState(false);

  // Principal Digest State
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeMandate, setActiveMandate] = useState<MandateProfile | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [selectedOsintDeal, setSelectedOsintDeal] = useState<Deal | null>(null);
  const [digestFilters, setDigestFilters] = useState<DealFilterParams>({
    role: "PRINCIPAL",
    sort_by: "dscr_desc",
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load User Preferences on Mount
  useEffect(() => {
    fetchUserPreferences()
      .then((prefs) => {
        setUserPreferences(prefs);
      })
      .catch((err) => console.error("Could not fetch user preferences:", err));
  }, []);

  // Query Universal Assets when filters change
  const loadUniversalAssets = async () => {
    setLoadingAssets(true);
    try {
      const results = await searchUniversalAssets({
        query: searchQuery || undefined,
        asset_class: selectedClass === "ALL" ? undefined : selectedClass,
        metro_area: selectedMetro || undefined,
        baby_boomer_only: babyBoomerOnly,
        section_8_only: section8Only,
        max_crime_index: maxCrimeIndex,
        sort_by: sortBy,
        apply_user_preferences: !searchQuery && selectedClass === "ALL" && !selectedMetro,
      });
      setUniversalAssets(results);
    } catch (err) {
      console.error("Error loading universal assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    loadUniversalAssets();
  }, [searchQuery, selectedClass, selectedMetro, babyBoomerOnly, section8Only, maxCrimeIndex, sortBy]);

  // Load Legacy Digest
  const loadDigest = async (activeFilters = digestFilters) => {
    setLoadingDigest(true);
    try {
      const [dealsData, mandateData] = await Promise.all([
        fetchDeals("PRINCIPAL", activeFilters),
        fetchActiveMandate().catch(() => null),
      ]);
      setDeals(dealsData);
      if (mandateData) setActiveMandate(mandateData);
    } catch (err: any) {
      console.error("Error loading digest:", err);
    } finally {
      setLoadingDigest(false);
    }
  };

  useEffect(() => {
    if (activeView === "DIGEST") {
      loadDigest();
    }
  }, [activeView]);

  // Handle Asset Actions
  const handleInspectAsset = (asset: UniversalAsset) => {
    setSelectedDossierAsset(asset);
    setDossierInitialTab("OVERVIEW");
  };

  const handleDraftOutreach = (asset: UniversalAsset) => {
    setSelectedDossierAsset(asset);
    setDossierInitialTab("OUTREACH");
  };

  const handleUpdateAssetStage = async (assetId: string, stage: PipelineStage) => {
    try {
      const updated = await updatePipelineStage(assetId, stage);
      setUniversalAssets((prev) =>
        prev.map((a) => (a.asset_id === assetId ? updated : a))
      );
      if (selectedDossierAsset?.asset_id === assetId) {
        setSelectedDossierAsset(updated);
      }
      setActionMessage(`Asset ${assetId} moved to ${stage.replace("_", " ")}`);
    } catch (err: any) {
      console.error("Error updating stage:", err);
    }
  };

  const handlePreferencesSaved = (updated: UserPreferenceProfile) => {
    setUserPreferences(updated);
    loadUniversalAssets();
    setActionMessage("Investment mandate preferences updated and auto-applied!");
  };

  // Principal Digest Actions
  const handleApprove = async (dealId: string) => {
    try {
      const res = await principalDecision(
        dealId,
        "APPROVE",
        "principal_1",
        "Approved for LOI / Lender Pack"
      );
      setActionMessage(`Deal ${dealId} approved! Token: ${res.approval_token_id}`);
      loadDigest();
    } catch (err: any) {
      setActionMessage(`Error approving deal: ${err.message}`);
    }
  };

  const handleReject = async (dealId: string) => {
    try {
      await principalDecision(dealId, "REJECT", "principal_1", "Passed on pricing");
      setActionMessage(`Deal ${dealId} rejected and archived with $0 spend.`);
      loadDigest();
    } catch (err: any) {
      setActionMessage(`Error rejecting deal: ${err.message}`);
    }
  };

  const handleSendToCounsel = async (dealId: string) => {
    try {
      await principalDecision(
        dealId,
        "SEND_TO_COUNSEL",
        "principal_1",
        "Proceeding to 14-day title & notice check"
      );
      setActionMessage(`Deal ${dealId} routed to Counsel for statutory notice diligence.`);
      loadDigest();
    } catch (err: any) {
      setActionMessage(`Error routing deal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-zinc-900 border border-blue-500/40 text-blue-200 text-xs flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-zinc-400 hover:text-white font-mono text-xs px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Executive Title & Segmented Feed Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Acquisitions &amp; Deal Flow</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
              {activeView === "AGGREGATOR" ? "All Nationwide" : "Principal Digest"}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {activeView === "AGGREGATOR"
              ? "Deterministic multi-asset catalog across 50 states, corporate registries & distressed dockets."
              : "Strictly vetted deals (≤ 5) meeting SBA SOP 50 10 8.1 and Virginia foreclosure hurdles for Monday decision."}
          </p>
        </div>

        {/* Apple Segmented Feed Capsule */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveView("AGGREGATOR")}
            className={`apple-press flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === "AGGREGATOR"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/80 font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-850"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>All Opportunities</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-300">
              {universalAssets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("DIGEST")}
            className={`apple-press flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === "DIGEST"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/80 font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-850"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>Principal Digest</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
              &le; 5
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: UNIVERSAL ASSET AGGREGATOR                                        */}
      {/* ========================================================================= */}
      {activeView === "AGGREGATOR" && (
        <div className="space-y-4">
          <UniversalAssetSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedClass={selectedClass}
            onClassChange={setSelectedClass}
            selectedMetro={selectedMetro}
            onMetroChange={setSelectedMetro}
            babyBoomerOnly={babyBoomerOnly}
            onBabyBoomerChange={setBabyBoomerOnly}
            section8Only={section8Only}
            onSection8Change={setSection8Only}
            maxCrimeIndex={maxCrimeIndex}
            onMaxCrimeIndexChange={setMaxCrimeIndex}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenPreferences={() => setIsPreferencesModalOpen(true)}
            onOpenKanban={() => setIsKanbanModalOpen(true)}
            totalAssetsFound={universalAssets.length}
          />

          {loadingAssets ? (
            <div className="p-16 text-center text-zinc-400 font-mono text-sm">
              Querying nationwide asset databases and corporate registries...
            </div>
          ) : universalAssets.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <Search className="w-8 h-8 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">
                No Assets Matched Your Current Filters
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Try widening your budget, resetting the crime threshold, or searching across all asset classes.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedClass("ALL");
                  setSelectedMetro("");
                  setBabyBoomerOnly(false);
                  setSection8Only(false);
                  setMaxCrimeIndex(undefined);
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universalAssets.map((asset) => (
                <UniversalAssetCard
                  key={asset.asset_id}
                  asset={asset}
                  onInspect={handleInspectAsset}
                  onDraftOutreach={handleDraftOutreach}
                  onUpdateStage={handleUpdateAssetStage}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PRINCIPAL WEEKLY DIGEST                                           */}
      {/* ========================================================================= */}
      {activeView === "DIGEST" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-xs">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Monday 07:00 EST Executive Briefing</strong>: Max &le; 5 verified deals reaching the Principal. 96.0% raw filings killed at Stage 1.
              </span>
            </div>
            <button
              onClick={() => loadDigest()}
              disabled={loadingDigest}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 transition shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingDigest ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <DealFilterBar
            filters={digestFilters}
            onFilterChange={(newF) => {
              setDigestFilters(newF);
              loadDigest(newF);
            }}
            totalResults={deals.length}
          />

          {loadingDigest ? (
            <div className="p-16 text-center text-zinc-400 font-mono text-sm">
              Loading verified Principal Weekly Digest...
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-2">
              <Briefcase className="w-8 h-8 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Verified Deals in Digest Queue</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Stage 1 zero-cost mandate engine has filtered all unproven filings. Promote in-box candidates from Analyst queue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {deals.map((deal) => (
                <DealCard
                  key={deal.deal_id}
                  deal={deal}
                  currentRole="PRINCIPAL"
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSendToCounsel={handleSendToCounsel}
                  onViewOsint={(d) => setSelectedOsintDeal(d)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED WORKSPACES & MODALS                                               */}
      {/* ========================================================================= */}

      {/* Universal Asset Dossier & 3D Spatial Inspector */}
      {selectedDossierAsset && (
        <UniversalAssetDossierModal
          asset={selectedDossierAsset}
          isOpen={!!selectedDossierAsset}
          initialTab={dossierInitialTab}
          onClose={() => setSelectedDossierAsset(null)}
          onAssetUpdated={(updated) => {
            setUniversalAssets((prev) =>
              prev.map((a) => (a.asset_id === updated.asset_id ? updated : a))
            );
            setSelectedDossierAsset(updated);
          }}
        />
      )}

      {/* Legacy Deal OSINT Modal */}
      {selectedOsintDeal && (
        <AssetIntelligenceModal
          deal={selectedOsintDeal}
          isOpen={!!selectedOsintDeal}
          onClose={() => setSelectedOsintDeal(null)}
          currentRole="PRINCIPAL"
        />
      )}

      {/* User Investment Mandate Preferences Modal */}
      <UserPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        currentPreferences={userPreferences}
        onPreferencesSaved={handlePreferencesSaved}
      />

      {/* CRM Kanban Pipeline Modal */}
      <DealPipelineKanbanModal
        isOpen={isKanbanModalOpen}
        onClose={() => setIsKanbanModalOpen(false)}
        assets={universalAssets}
        onAdvanceStage={handleUpdateAssetStage}
        onSelectAsset={handleInspectAsset}
      />
    </div>
  );
}

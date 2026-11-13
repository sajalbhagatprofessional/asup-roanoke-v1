"use client";

import React, { useEffect, useState } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  flushOfflineQueue,
  getPendingOfflineActions,
  isRunningStandalone,
  QueuedOfflineAction,
} from "../lib/offlineStore";

export default function PWAInstallAndStatus() {
  const { updateAvailable, applyUpdateNow } = useSettings();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [pendingActions, setPendingActions] = useState<QueuedOfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initial State
    setIsOnline(navigator.onLine);
    setIsStandalone(isRunningStandalone());

    // 2. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[ARGUS PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[ARGUS PWA] Service Worker registration failed:", err);
        });

      // Listen for SW broadcast messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "ASUP_SYNC_TRIGGER") {
          handleSyncQueue();
        }
      });
    }

    // 3. Online/Offline Listeners
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 4. Initial Offline Queue Check
    refreshPendingActions();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshPendingActions = () => {
    getPendingOfflineActions().then(setPendingActions).catch(() => {});
  };

  const handleSyncQueue = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Reconciling offline actions...");
    try {
      const res = await flushOfflineQueue();
      refreshPendingActions();
      setSyncStatusMsg(`Synchronized ${res.synced} action(s).`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err) {
      setSyncStatusMsg("Reconciliation deferred.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      {/* 1. Network Connectivity Indicator */}
      <div
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition-colors ${
          isOnline
            ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
            : "bg-rose-950/60 border-rose-800/80 text-rose-300 animate-pulse"
        }`}
        title={
          isOnline
            ? "Connected to Live Ingestion & Underwriting Stream"
            : "Offline Mode Active: Operating out of local IndexedDB Deal Memory"
        }
      >
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline font-mono text-[10px]">LIVE</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono text-[10px] font-bold">OFFLINE VAULT</span>
          </>
        )}
      </div>

      {/* PWA Update Ready Action Pill */}
      {updateAvailable && (
        <button
          onClick={applyUpdateNow}
          className="apple-press flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition cursor-pointer text-[11px] shadow-sm animate-pulse"
          title="New version downloaded. Click to reload with latest features."
        >
          <Sparkles className="w-3 h-3 text-black" />
          <span>Update Ready</span>
        </button>
      )}

      {/* 2. Offline Action Sync Pill (Shows if actions are queued) */}
      {pendingActions.length > 0 && (
        <button
          onClick={handleSyncQueue}
          disabled={!isOnline || isSyncing}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 hover:bg-amber-900/60 transition cursor-pointer text-[11px]"
          title="Click to replay queued offline physical inspections and diligence actions"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-amber-400" : ""}`} />
          <span className="font-semibold">{pendingActions.length} Queued</span>
        </button>
      )}

      {/* 3. Sync Confirmation Message Banner */}
      {syncStatusMsg && (
        <span className="text-[10px] text-emerald-400 font-mono hidden md:inline animate-fade-in">
          {syncStatusMsg}
        </span>
      )}

      {/* 4. Standalone Mode Badge */}
      {isStandalone && (
        <div
          className="hidden xl:flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400"
          title="Running in Standalone Native Application Window"
        >
          <Smartphone className="w-3 h-3 text-sky-400" />
          <span>APP</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ShieldAlert,
} from "lucide-react";
import {
  flushOfflineQueue,
  getPendingOfflineActions,
  isRunningStandalone,
  QueuedOfflineAction,
  triggerNativeNotification,
} from "../lib/offlineStore";
import { fetchVapidPublicKey, registerPushSubscription, triggerPwaPushTest } from "../lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PWAInstallAndStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [pendingActions, setPendingActions] = useState<QueuedOfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initial State
    setIsOnline(navigator.onLine);
    setIsStandalone(isRunningStandalone());
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // 2. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[ASUP PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[ASUP PWA] Service Worker registration failed:", err);
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

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Web notifications are not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const vapidKey = await fetchVapidPublicKey().catch(() => null);
          if (vapidKey && reg.pushManager) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
            await registerPushSubscription(sub.toJSON()).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("[ASUP PWA] VAPID push subscription registration:", err);
      }

      await triggerNativeNotification("ASUP Aladdin Notification Active", {
        body: "Native fiduciary docket alerts, 14-day statutory notices, and Monday digests enabled.",
        urgency: "HIGH",
      });
    }
  };

  const testPushNotification = async () => {
    try {
      await triggerPwaPushTest({
        title: "[SEV-1 ALERT] Foreclosure Notice Published",
        body: "GPIN 51770-0192 (Star City Precision): 18 days notice (>=14d SLA passed). All-in basis 64.5% (<=70% passed).",
        urgency: "HIGH",
      });

      await triggerNativeNotification("[SEV-1 ALERT] Foreclosure Notice Published", {
        body: "GPIN 51770-0192: 18 days notice (>=14d passed). Basis 64.5% (<=70% passed).",
        urgency: "HIGH",
      });
    } catch (e) {
      console.error("Test notification failed:", e);
    }
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

      {/* 4. Native Notification Controller */}
      {notificationPermission !== "granted" ? (
        <button
          onClick={requestNotifications}
          className="apple-press flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer"
          title="Enable native push notifications for 14-day statutory notices and Monday digests"
        >
          <Bell className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xl:inline text-[11px]">Enable Alerts</span>
        </button>
      ) : (
        <button
          onClick={testPushNotification}
          className="apple-press flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/80 text-emerald-300 transition cursor-pointer"
          title="Test Native Push Notification banner"
        >
          <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span className="hidden xl:inline text-[11px]">Test Push</span>
        </button>
      )}

      {/* 5. Standalone Mode Badge */}
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

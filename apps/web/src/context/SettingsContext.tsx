"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserSettings, ThemeMode, InterfaceDensity, AutoUpdatePromptMode } from "../lib/types";
import { fetchUserSettings, saveUserSettings, fetchPwaVersion } from "../lib/api";
import { useAuth } from "./AuthContext";

const DEFAULT_SETTINGS: UserSettings = {
  user_id: "default_investor",
  display_name: "Principal Family Office",
  email: "principal@asup.internal",
  role: "PRINCIPAL",
  organization: "Argus Intelligence Capital",

  theme: "DARK",
  density: "COMFORTABLE",
  high_contrast: false,
  default_landing_view: "AGGREGATOR",
  default_role: "PRINCIPAL",
  currency_format: "USD_STANDARD",

  push_notifications_enabled: true,
  foreclosure_statutory_alerts: true,
  monday_weekly_digest_push: true,
  instant_distress_alerts: true,
  sound_alerts_enabled: true,
  vibration_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",

  auto_update_enabled: true,
  auto_update_prompt_mode: "NOTIFY_BEFORE_RELOAD",
  offline_cache_enabled: true,
  background_sync_enabled: true,
  update_check_interval_minutes: 30,

  default_target_cap_rate_pct: "0.0725",
  default_replacement_gm_salary_usd: "85000.00",
  default_hurdle_base_dscr: "1.35",
  default_hurdle_stressed_dscr: "1.15",
  default_max_purchase_price_usd: "5000000.00",
  default_target_locations: [
    "City of Roanoke, VA",
    "Roanoke County, VA",
    "Allentown, PA",
  ],
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  saveCurrentSettings: () => Promise<void>;
  isSettingsOpen: boolean;
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;
  isSaving: boolean;
  saveMessage: string | null;

  // PWA Auto-Update state
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  appVersion: string;
  cacheName: string;
  checkForUpdates: () => Promise<boolean>;
  applyUpdateNow: () => void;
  canInstallPwa: boolean;
  installPwa: () => Promise<boolean>;
  isStandalone: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("ACCOUNT");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // PWA Auto-Update State
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [appVersion, setAppVersion] = useState("1.1.0");
  const [cacheName, setCacheName] = useState("asup-argus-v1.1.0");
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // 1. Rehydrate & Persist Settings
  const loadSettings = useCallback(async (userId?: string) => {
    try {
      // LocalStorage cache fallback first
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`argus_settings_${userId || "default"}`);
        if (local) {
          const parsed = JSON.parse(local);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      }

      // Fetch persistent settings from backend
      const remote = await fetchUserSettings(userId).catch(() => null);
      if (remote) {
        setSettings(remote);
        if (typeof window !== "undefined") {
          localStorage.setItem(`argus_settings_${userId || "default"}`, JSON.stringify(remote));
        }
      }
    } catch (e) {
      console.warn("[Settings] Failed to load remote settings, using cache/defaults", e);
    }
  }, []);

  useEffect(() => {
    loadSettings(user?.user_id);
  }, [user?.user_id, loadSettings]);

  // 2. Apply Theme & Density classes to DOM
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Theme Mode
    const themeMap: Record<ThemeMode, string> = {
      DARK: "dark",
      LIGHT: "light",
      MIDNIGHT_OLED: "midnight",
      BLOOMBERG_NAVY: "bloomberg",
    };
    root.setAttribute("data-theme", themeMap[settings.theme] || "dark");

    // Interface Density
    root.setAttribute("data-density", settings.density === "COMPACT" ? "compact" : "comfortable");

    // High Contrast
    if (settings.high_contrast) {
      root.setAttribute("data-high-contrast", "true");
    } else {
      root.removeAttribute("data-high-contrast");
    }
  }, [settings.theme, settings.density, settings.high_contrast]);

  // 3. Save Settings Handler (Write-through to backend & localStorage)
  const updateSettings = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem(`argus_settings_${user?.user_id || "default"}`, JSON.stringify(updated));
    }
  };

  const saveCurrentSettings = async () => {
    setIsSaving(true);
    setSaveMessage("Saving to cloud...");
    try {
      const payload: UserSettings = {
        ...settings,
        user_id: user?.user_id || settings.user_id || "default_investor",
        email: user?.email || settings.email,
        role: user?.role || settings.role,
      };
      const saved = await saveUserSettings(payload);
      setSettings(saved);
      if (typeof window !== "undefined") {
        localStorage.setItem(`argus_settings_${payload.user_id}`, JSON.stringify(saved));
      }
      setSaveMessage("Settings synchronized across all devices.");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error("[Settings] Save failed:", e);
      setSaveMessage("Saved locally. Will sync on next connection.");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. PWA Service Worker & Auto-Update Engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone mode
    const isRunningStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone());

    // BeforeInstallPrompt listener for install button
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Register Service Worker with Auto-Update listeners
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[ARGUS PWA] Registered with scope:", reg.scope);

          // Check if worker already waiting
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
            handleUpdateReady(reg.waiting);
          }

          // Listen for new updates discovered in background
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.onstatechange = () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[ARGUS PWA] New update installed and ready.");
                setWaitingWorker(installing);
                setUpdateAvailable(true);
                handleUpdateReady(installing);
              }
            };
          };
        })
        .catch((err) => {
          console.warn("[ARGUS PWA] Registration error:", err);
        });

      // Reload on controller change if update applied
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          console.log("[ARGUS PWA] Controller changed, refreshing application shell.");
          window.location.reload();
        }
      });
    }

    // Keyboard shortcut for settings: Cmd + , or Ctrl + ,
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Initial Version probe
    fetchPwaVersion()
      .then((info) => {
        setAppVersion(info.version);
        setCacheName(info.cache_name);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleUpdateReady = (worker: ServiceWorker) => {
    // If user has configured SILENT_AUTO_RELOAD, apply update automatically
    if (settings.auto_update_enabled && settings.auto_update_prompt_mode === "SILENT_AUTO_RELOAD") {
      console.log("[ARGUS PWA] Auto-applying update immediately per user preference.");
      worker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  const checkForUpdates = async (): Promise<boolean> => {
    setIsCheckingUpdate(true);
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.update();
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
          return true;
        }
      }
      // Also query backend version endpoint
      const versionInfo = await fetchPwaVersion();
      setAppVersion(versionInfo.version);
      setCacheName(versionInfo.cache_name);
      return false;
    } catch (e) {
      console.warn("[ARGUS PWA] Update check failed:", e);
      return false;
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const applyUpdateNow = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  const installPwa = async (): Promise<boolean> => {
    if (!deferredInstallPrompt) return false;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
    setCanInstallPwa(false);
    return outcome === "accepted";
  };

  const openSettings = (tab?: string) => {
    if (tab) setActiveSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        saveCurrentSettings,
        isSettingsOpen,
        openSettings,
        closeSettings,
        activeSettingsTab,
        setActiveSettingsTab,
        isSaving,
        saveMessage,
        updateAvailable,
        isCheckingUpdate,
        appVersion,
        cacheName,
        checkForUpdates,
        applyUpdateNow,
        canInstallPwa,
        installPwa,
        isStandalone,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

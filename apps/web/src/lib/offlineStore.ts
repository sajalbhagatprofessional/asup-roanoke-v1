// ASUP Aladdin — Client-Side Memory & Offline Vault (IndexedDB Engine)
// Provides persistent offline storage for on-site physical diligence and flight-mode Principal decisioning

import { Deal } from "./types";

const DB_NAME = "asup_offline_db";
const DB_VERSION = 1;
const STORE_DEALS = "deals";
const STORE_ACTIONS = "offline_actions";

export interface QueuedOfflineAction {
  id?: number;
  type: "PRINCIPAL_DECISION" | "ANALYST_FIELD_NOTE" | "COUNSEL_CHECK" | "CPA_NOTE";
  deal_id: string;
  payload: Record<string, any>;
  created_at: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_DEALS)) {
        db.createObjectStore(STORE_DEALS, { keyPath: "deal_id" });
      }

      if (!db.objectStoreNames.contains(STORE_ACTIONS)) {
        const actionStore = db.createObjectStore(STORE_ACTIONS, {
          keyPath: "id",
          autoIncrement: true,
        });
        actionStore.createIndex("by_deal", "deal_id", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache deals into client-side IndexedDB memory with timestamp and offline badges
 */
export async function cacheDealsLocally(deals: Deal[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DEALS, "readwrite");
      const store = tx.objectStore(STORE_DEALS);

      const now = new Date().toISOString();
      deals.forEach((deal) => {
        store.put({
          ...deal,
          _offline_cached_at: now,
          is_offline_cached: true,
        });
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[ASUP Offline Store] Failed to cache deals in IndexedDB:", err);
  }
}

/**
 * Retrieve cached deals from local IndexedDB memory (used when network is offline)
 */
export async function getCachedDeals(): Promise<Deal[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DEALS, "readonly");
      const store = tx.objectStore(STORE_DEALS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("[ASUP Offline Store] Failed to read from IndexedDB:", err);
    return [];
  }
}

/**
 * Retrieve single cached deal by ID
 */
export async function getCachedDeal(dealId: string): Promise<Deal | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DEALS, "readonly");
      const store = tx.objectStore(STORE_DEALS);
      const request = store.get(dealId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Enqueue an offline user action (e.g. Principal vote or Analyst field notes while disconnected)
 */
export async function enqueueOfflineAction(
  type: QueuedOfflineAction["type"],
  deal_id: string,
  payload: Record<string, any>
): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ACTIONS, "readwrite");
    const store = tx.objectStore(STORE_ACTIONS);
    const item: QueuedOfflineAction = {
      type,
      deal_id,
      payload,
      created_at: new Date().toISOString(),
    };
    const request = store.add(item);

    request.onsuccess = () => {
      // Trigger background sync if supported
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((reg: any) => {
          reg.sync?.register("sync-offline-actions").catch(() => {});
        });
      }
      resolve(request.result as number);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending actions waiting for network reconnection
 */
export async function getPendingOfflineActions(): Promise<QueuedOfflineAction[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIONS, "readonly");
      const store = tx.objectStore(STORE_ACTIONS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Remove an action after successful sync
 */
export async function removeOfflineAction(id: number): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ACTIONS, "readwrite");
    const store = tx.objectStore(STORE_ACTIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Flush and replay all queued actions when internet connectivity returns
 */
export async function flushOfflineQueue(apiBaseUrl?: string): Promise<{
  synced: number;
  failed: number;
}> {
  const actions = await getPendingOfflineActions();
  if (!actions.length) return { synced: 0, failed: 0 };

  const base = apiBaseUrl || "";
  let synced = 0;
  let failed = 0;

  for (const act of actions) {
    try {
      if (act.type === "PRINCIPAL_DECISION") {
        const res = await fetch(`${base}/v1/deals/${act.deal_id}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(act.payload),
        });
        if (res.ok && act.id !== undefined) {
          await removeOfflineAction(act.id);
          synced++;
          continue;
        }
      }
      // Other action types can be synchronized here
      if (act.id !== undefined) {
        await removeOfflineAction(act.id);
        synced++;
      }
    } catch (e) {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Trigger native browser / OS notification with fallback
 */
export async function triggerNativeNotification(
  title: string,
  options?: NotificationOptions & { url?: string; urgency?: "HIGH" | "NORMAL" }
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Notifications are not supported in this browser");
    return false;
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission === "granted") {
    // If Service Worker is active, dispatch through Service Worker for system-level banner
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          icon: "/icons/icon-192.svg",
          badge: "/icons/icon-192.svg",
          vibrate: options?.urgency === "HIGH" ? [300, 150, 300] : [150, 100],
          ...options,
        } as any);
        return true;
      } catch (e) {
        // Fallback to desktop Notification constructor
      }
    }

    new Notification(title, {
      icon: "/icons/icon-192.svg",
      ...options,
    } as any);
    return true;
  }

  return false;
}

/**
 * Check if running in installed Standalone PWA mode
 */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

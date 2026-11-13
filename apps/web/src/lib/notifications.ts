// Argus Intelligence — Native Push Notification & Statutory Alert Manager
// Manages Web Push Protocol, VAPID key registration, and native OS banners

import { fetchVapidPublicKey, registerPushSubscription, triggerPwaPushTest } from "./api";
import { triggerNativeNotification } from "./offlineStore";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }
  return Notification.permission;
}

export async function requestPushNotifications(): Promise<{
  permission: NotificationPermission;
  error?: string;
}> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return {
      permission: "denied",
      error: "Web push notifications are not supported in this browser or webview environment.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const vapidKey = await fetchVapidPublicKey().catch(() => null);
          if (vapidKey && reg.pushManager) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
            });
            await registerPushSubscription(sub.toJSON()).catch(() => {});
          }
        } catch (swErr) {
          console.warn("[Argus Notifications] Service worker push subscription:", swErr);
        }
      }

      await triggerNativeNotification("Argus Statutory Alerts Active", {
        body: "Real-time Virginia § 55.1-321 foreclosure alerts, Monday digests, and distress signals enabled.",
        urgency: "HIGH",
      });
    }

    return { permission };
  } catch (err: any) {
    return {
      permission: "denied",
      error: err?.message || "Failed to request notification permission.",
    };
  }
}

export async function sendTestPushNotification(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await triggerPwaPushTest({
      title: "[SEV-1 ALERT] Foreclosure Notice Published",
      body: "GPIN 51770-0192 (Star City Precision): 18 days notice (>=14d SLA passed). Basis 64.5% (<=70% passed).",
      urgency: "HIGH",
    }).catch(() => {});

    await triggerNativeNotification("[SEV-1 ALERT] Foreclosure Notice Published", {
      body: "GPIN 51770-0192 (Star City Precision): 18 days notice (>=14d passed). All-in basis 64.5% (<=70% passed).",
      urgency: "HIGH",
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to trigger test notification.",
    };
  }
}

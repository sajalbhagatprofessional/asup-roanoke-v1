// ASUP Aladdin — Vanguard Production Service Worker (v1.0.0)
// High-Reliability PWA Engine with Native Push Notifications, Background Sync & Offline Memory

const CACHE_NAME = "asup-aladdin-v1.0.0";
const PRECACHE_ASSETS = [
  "/",
  "/analyst",
  "/counsel",
  "/cpa",
  "/lender",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/maskable-icon-512.svg",
];

// 1. Service Worker Installation & Pre-caching
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[ASUP PWA SW] Pre-caching non-critical asset skipped:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activation & Cache Clean Up
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ASUP PWA SW] Removing obsolete cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Intelligent Fetch Strategy: Network-First for API, Cache-First for Static Assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests for standard caching
  if (event.request.method !== "GET") {
    return;
  }

  // API Requests: Network-First with Cache Fallback
  if (url.pathname.startsWith("/v1/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache when offline
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline synthetic payload for API
            return new Response(
              JSON.stringify({
                _offline_cached: true,
                status: "OFFLINE_FALLBACK",
                message: "Network unavailable. Serving cached local memory snapshot.",
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 200,
              }
            );
          });
        })
    );
    return;
  }

  // App Shell & Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Native Push Notification Receiver
self.addEventListener("push", (event) => {
  let data = {
    title: "ASUP Aladdin Alert",
    body: "New high-conviction docket event recorded.",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    urgency: "HIGH",
    tag: "asup-docket-alert",
    url: "/",
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // High urgency vibration pattern for statutory clocks (e.g. 14-day Substitute Trustee notices)
  const vibrationPattern = data.urgency === "HIGH" ? [300, 150, 300, 150, 300] : [150, 100, 150];

  const notificationOptions = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.svg",
    badge: data.badge || "/icons/icon-192.svg",
    tag: data.tag || "asup-notification",
    vibrate: vibrationPattern,
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
      urgency: data.urgency,
    },
    actions: [
      { action: "explore", title: "Open Dossier" },
      { action: "dismiss", title: "Dismiss" },
    ],
    requireInteraction: data.urgency === "HIGH",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// 5. Notification Click & Deep Link Routing
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. Background Sync: Replay Queued Diligence Marks & Field Inspections
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    console.log("[ASUP PWA SW] Background sync event triggered: replay offline diligence actions.");
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "ASUP_SYNC_TRIGGER",
            timestamp: Date.now(),
          });
        });
      })
    );
  }
});

/**
 * Minimal service worker for Testition PWA.
 *
 * Strategy:
 *   - Precache the offline fallback page on install.
 *   - Network-first for navigations; if the network fails, fall back to /offline.
 *   - No fancy runtime caching — Next.js ships hashed assets that the browser
 *     can already cache aggressively, and we don't want to serve stale JSON.
 */

const CACHE_VERSION = "testition-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle navigations — let everything else pass through to the network.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL))
  );
});

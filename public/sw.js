const CACHE_NAME = "gym-ravana-v4";
const STATIC_CACHE = "gym-ravana-static-v4";
const API_CACHE = "gym-ravana-api-v4";

// Static assets to cache on install (only truly static files)
const STATIC_ASSETS = [
  "/~offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Resilient caching: cache files individually, continue if one fails
      return Promise.all(
        STATIC_ASSETS.map(async (url) => {
          try {
            const request = new Request(url, { cache: "reload" });
            const response = await fetch(request);
            if (response.ok) {
              await cache.put(request, response);
              console.log(`[SW] Cached: ${url}`);
            } else {
              console.warn(`[SW] Failed to cache ${url}: ${response.status}`);
            }
          } catch (error) {
            console.error(`[SW] Network error caching ${url}:`, error);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Cache Next.js static assets aggressively
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Cache-first for same-origin requests with offline fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((networkResponse) => {
              // Cache the fetched response
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {
              // Fallback to offline page for navigation requests
              if (event.request.mode === "navigate") {
                return cache.match("/~offline");
              }
              throw new Error("Network request failed and no cache available");
            });
        });
      })
    );
    return;
  }

  // Network-first for API requests with offline fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful API responses
          const responseToCache = networkResponse.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Return cached API response if network fails
          return caches.open(API_CACHE).then((cache) => {
            return cache.match(event.request);
          });
        })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
const CACHE_NAME = "gym-ravana-v1";
const STATIC_CACHE = "gym-ravana-static-v1";
const API_CACHE = "gym-ravana-api-v1";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/access",
  "/check-in",
  "/login",
  "/dashboard",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
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

  // Cache-first for static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            // Cache the fetched response
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
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
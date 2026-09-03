const CACHE_NAME = "henna-c-v6.1.1";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=6.1.1",
  "/script.js?v=6.1.1",
  "/manifest.json",
  "/assets/henna-c-header-logo.png",
  "/assets/henna-c-logo-square.jpg",
  "/assets/henna-c-records-logo-gold.png",
  "/assets/electric-power-hoe-neon-garage.jpg",
  "/assets/ki-ma-lo.png",
  "/assets/dance-with-me.jpg",
  "/assets/qr-henna-c-gold-glow.png",
  "/assets/qr-henna-c-aura.png",
  "/assets/qr-bubblegum-glam.png",
  "/assets/qr-neon-garage-scene.png",
  "/assets/qr-liquid-chrome-room.png",
  "/assets/qr-disco-after-dark.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png"
];

// Install: Pre-cache shell assets & skip waiting immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Pre-cache error:", err);
      });
    })
  );
});

// Activate: Clean up all old cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. HTML / Navigation: Network First (ensures user always sees latest live HTML)
// 2. Audio: Network First
// 3. Static assets: Stale-while-revalidate with cache update
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return;
  }

  // HTML documents & navigation requests: Network First
  if (event.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match("/index.html"))
    );
    return;
  }

  // Audio files: Network First
  if (url.pathname.endsWith(".wav") || url.pathname.endsWith(".m4a") || url.pathname.endsWith(".mp3")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (CSS, JS, images): Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

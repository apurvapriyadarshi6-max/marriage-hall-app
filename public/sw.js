const CACHE_NAME = "pmh-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/bookings.html",
  "/calendar.html",
  "/new-booking.html",
  "/bookings.js",
  "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css",
  "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.min.js"
];

// 1. Install Event: Cache UI assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("PMH App: Caching UI Assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Event: Network-First Strategy for API, Cache-First for UI
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If the request is for your Render API, go to network first
  if (url.origin.includes("onrender.com") || url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // For UI files (HTML/CSS), serve from cache for speed
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
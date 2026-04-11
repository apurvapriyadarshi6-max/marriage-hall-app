const CACHE_NAME = "pmh-v4"; // Version 4
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/bookings.html",
  "/calendar.html",
  "/new-booking.html",
  "/bookings.js",
  "/style.css",
  "/dashboard.js",
  "/script.js",
  "/manifest.json",
  "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css",
  "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"
];

// 1. Install Event: Cache Core Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("PMH PWA: Caching UI Assets");
      // Map ensures that one failing asset doesn't break the whole install
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(new Request(url, { mode: 'no-cors' })).catch(err => {
             console.warn(`Asset failed to cache: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Cleanup & Take Control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("PMH PWA: Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch Event: Smart Hybrid Strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // --- STRATEGY A: Network-First for API (Render Data) ---
  if (url.origin.includes("onrender.com") || url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Success: Clone and Update Cache
          const clonedRes = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => {
          // Failure: Serve from Cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // Final Fallback: Return Offline JSON
            return new Response(JSON.stringify({ 
              error: "Offline", 
              message: "Check your internet connection." 
            }), {
              headers: { "Content-Type": "application/json" }
            });
          });
        })
    );
  } 
  
  // --- STRATEGY B: Cache-First for UI Assets (HTML/CSS/JS) ---
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached version or fetch from network
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          // If network works, cache it for next time
          if (networkResponse && networkResponse.status === 200) {
            const clonedRes = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          }
          return networkResponse;
        });
      }).catch(() => {
        // Silent fail for missing decorative assets
      })
    );
  }
});
/* =========================================
   Pandey Marriage Hall - SERVICE WORKER
   Version: 10.0 (Unified & Offline-Optimized)
   ========================================= */

const CACHE_NAME = "pmh-v10-final"; 

// Assets to be stored on the phone for offline use
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

// 1. Install Event: Download and cache core UI assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("PMH PWA: Preparing offline shell...");
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          // Use 'no-cors' for external CDNs so they don't block the installation
          const request = url.startsWith('http') 
            ? new Request(url, { mode: 'no-cors' }) 
            : url;
          return cache.add(request).catch(err => {
             console.warn(`Asset skipped (not critical): ${url}`);
          });
        })
      );
    })
  );
  self.skipWaiting(); // Force the new SW to take over immediately
});

// 2. Activate Event: Delete old caches and take control of the app
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("PMH PWA: Clearing legacy cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch Event: The 'One-Time Fix' Hybrid Strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // --- STRATEGY A: Network-First for API Data (/api/) ---
  // We want the newest money/booking data, but if offline, show the last known data.
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Success: Save a fresh copy in the cache
          const clonedRes = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => {
          // Failure (Offline): Serve from cache or return empty array to prevent dashboard crash
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // Return empty JSON array so bookings.forEach() doesn't error out
            return new Response(JSON.stringify([]), {
              headers: { "Content-Type": "application/json" }
            });
          });
        })
    );
  } 
  
  // --- STRATEGY B: Cache-First for UI Assets (HTML/CSS/JS) ---
  // This makes the app load instantly, like a native app on a phone.
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return from cache if exists, otherwise fetch from network
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          // Dynamically cache any new UI assets encountered
          if (networkResponse && networkResponse.status === 200) {
            const clonedRes = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          }
          return networkResponse;
        });
      }).catch(() => {
        // Absolute fallback: If offline and page not cached, show index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
    );
  }
});
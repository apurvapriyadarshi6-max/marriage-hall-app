const CACHE_NAME = "pmh-v5"; // Version 5
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
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          // Use 'no-cors' for external CDN requests to prevent opaque response errors
          const request = url.startsWith('http') 
            ? new Request(url, { mode: 'no-cors' }) 
            : url;
          return cache.add(request).catch(err => {
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
          // If successful, update the cache with the fresh data
          const clonedRes = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => {
          // If network fails, try serving from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // CRITICAL FIX: Return a proper Response object if everything fails
            return new Response(
              JSON.stringify({ error: "Offline", message: "Connect to internet to load bookings." }), 
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
  } 
  
  // --- STRATEGY B: Cache-First for UI Assets ---
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached version or fetch from network
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          // Cache successful UI requests dynamically
          if (networkResponse && networkResponse.status === 200) {
            const clonedRes = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          }
          return networkResponse;
        }).catch(() => {
            // If the UI fetch fails (truly offline and not cached), we return a fallback
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        });
      })
    );
  }
});
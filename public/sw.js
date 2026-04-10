self.addEventListener("install", (e) => {
  console.log("PMH App Installed");
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});
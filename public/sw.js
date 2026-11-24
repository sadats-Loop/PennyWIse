
const CACHE_NAME = "pennywise-beta-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll([
        OFFLINE_URL,
        "/icon-192.png",
        "/icon-512.png",
      ]);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(OFFLINE_URL))
          );
        })
    );

    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-")
  ) {
    event.respondWith(
      caches.match(request).then(async (cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      })
    );
  }
});

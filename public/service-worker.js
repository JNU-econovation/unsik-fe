/* global caches, fetch, self, URL, Response */

const CACHE_NAME = 'unsik-pwa-v1';
const APP_SHELL_URLS = [
  '/',
  '/main',
  '/manifest.webmanifest',
  '/favicon.png',
  '/app-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }

        return undefined;
      })))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/main', responseCopy);
          });

          return response;
        })
        .catch(async () => {
          return (await caches.match('/main')) ?? (await caches.match('/')) ?? Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseCopy);
        });

        return response;
      });
    }),
  );
});

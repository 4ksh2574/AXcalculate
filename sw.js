const CACHE_NAME = 'ax-calculate-v6';
const TAILWIND_CDN = 'https://cdn.tailwindcss.com';
const LOCAL_APP_SHELL = [
  '/',
  '/index.html',
  '/theme.css',
  '/manifest.json',
  '/sw.js',
  '/icon.svg',
  '/icon-monochrome.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(LOCAL_APP_SHELL))
    .then(() => fetch(TAILWIND_CDN))
    .then(response => caches.open(CACHE_NAME).then(cache => cache.put(TAILWIND_CDN, response)))
    .catch(() => null)
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
    .then(keys => Promise.all(
      keys
      .filter(key => key !== CACHE_NAME)
      .map(key => caches.delete(key))
    ))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isPageRequest = event.request.mode === 'navigate';
  const isTailwindRequest = event.request.url === TAILWIND_CDN;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
        }
        return networkResponse;
      }).catch(() => {
        if (isPageRequest) return caches.match('/');
        if (isTailwindRequest) {
          return new Response('', {
            status: 200,
            headers: {
              'Content-Type': 'application/javascript'
            }
          });
        }
        return new Response('', {
          status: 504,
          statusText: 'Offline'
        });
      });
    })
  );
});

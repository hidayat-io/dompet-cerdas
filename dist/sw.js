const SW_VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const STATIC_CACHE = `dompetcerdas-static-${SW_VERSION}`;
const RUNTIME_CACHE = `dompetcerdas-runtime-${SW_VERSION}`;
const APP_SHELL_CACHE = `dompetcerdas-app-shell-${SW_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon-16.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

const CACHEABLE_DESTINATIONS = new Set(['script', 'style', 'font', 'image']);
const FONT_ORIGINS = new Set([
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('dompetcerdas-') && ![
          STATIC_CACHE,
          RUNTIME_CACHE,
          APP_SHELL_CACHE,
        ].includes(cacheName))
        .map((cacheName) => caches.delete(cacheName))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const isCacheableResponse = (response) => response && (response.ok || response.type === 'opaque');

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(APP_SHELL_CACHE);
        cache.put('/index.html', response.clone());
        return response;
      } catch (error) {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cachedAppShell = await cache.match('/index.html');
        if (cachedAppShell) return cachedAppShell;

        const staticCache = await caches.open(STATIC_CACHE);
        return staticCache.match('/offline.html');
      }
    })());
    return;
  }

  const isSameOriginAsset =
    url.origin === self.location.origin &&
    (CACHEABLE_DESTINATIONS.has(request.destination) || url.pathname.startsWith('/assets/'));

  const isFontRequest =
    FONT_ORIGINS.has(url.origin) &&
    (request.destination === 'style' || request.destination === 'font');

  if (isSameOriginAsset || isFontRequest) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (url.origin === self.location.origin && PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

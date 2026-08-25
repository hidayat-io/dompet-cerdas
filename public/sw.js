const SW_VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const STATIC_CACHE = `dompetcerdas-static-${SW_VERSION}`;
// Runtime & app-shell cache sengaja TANPA suffix versi supaya aset yang sudah
// tercache tetap valid lintas rilis. Chunk hasil hash versi lama dipertahankan
// agar HTML cache lama tidak pernah 404, dan hanya dibersihkan lewat cap entri.
const RUNTIME_CACHE = 'dompetcerdas-runtime';
const APP_SHELL_CACHE = 'dompetcerdas-app-shell';
const MAX_RUNTIME_ENTRIES = 150;

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
  '/icon-192.webp',
  '/icon-512.webp',
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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const staleCaches = cacheNames.filter((cacheName) =>
      cacheName.startsWith('dompetcerdas-') && ![
        STATIC_CACHE,
        RUNTIME_CACHE,
        APP_SHELL_CACHE,
      ].includes(cacheName)
    );

    await Promise.all(staleCaches.map((cacheName) => caches.delete(cacheName)));
    await self.clients.claim();

    // On update (stale caches existed): force-navigate all open tabs so they
    // reload under the new SW with fresh HTML. This handles the blank-page
    // case where JS never loaded (stale HTML referencing deleted chunks).
    if (staleCaches.length > 0) {
      const windowClients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        windowClients.map((client) => client.navigate(client.url).catch(() => {}))
      );
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const isCacheableResponse = (response) => response && response.ok;

// Chunk hasil hash menumpuk tiap rilis; buang yang paling lama tidak dipakai
// supaya storage tidak tumbuh tanpa batas.
const trimRuntimeCache = async () => {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME_ENTRIES) return;
  await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES).map((key) => cache.delete(key)));
};

// Tanpa event.waitUntil, SW dapat di-terminate begitu respondWith selesai
// sehingga revalidasi background tidak pernah tersimpan (cache beku selamanya).
const staleWhileRevalidate = async (event, request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) {
        cache.put(request, response.clone());
        if (cacheName === RUNTIME_CACHE) void trimRuntimeCache();
      }
      return response;
    })
    .catch(() => cached);

  if (cached) {
    event.waitUntil(networkPromise.then(() => {}).catch(() => {}));
    return cached;
  }
  return networkPromise;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase Auth handler must bypass SW entirely; intercepting it breaks
  // signInWithRedirect (hangs on dompas.indoomega.my.id/__/auth/handler).
  if (url.pathname.startsWith('/__/auth/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      // Stale-while-revalidate: HTML cache langsung dipakai supaya buka ulang
      // PWA terasa instan, sementara versi baru direvalidasi di background.
      const cache = await caches.open(APP_SHELL_CACHE);
      const cachedShell = await cache.match('/index.html');

      const networkPromise = (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            await cache.put('/index.html', networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          if (cachedShell) return cachedShell;
          const staticCache = await caches.open(STATIC_CACHE);
          return (
            (await staticCache.match('/index.html')) ||
            (await staticCache.match('/offline.html')) ||
            Response.error()
          );
        }
      })();

      if (cachedShell) {
        event.waitUntil(networkPromise.then(() => {}).catch(() => {}));
        return cachedShell;
      }
      return networkPromise;
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
    event.respondWith(staleWhileRevalidate(event, request, RUNTIME_CACHE));
    return;
  }

  if (url.origin === self.location.origin && PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request, STATIC_CACHE));
  }
});

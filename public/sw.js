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
  '/fonts/space-grotesk-variable.woff2',
  '/fonts/material-symbols-outlined.woff2',
];

const CACHEABLE_DESTINATIONS = new Set(['script', 'style', 'font', 'image']);
const FONT_ORIGINS = new Set([
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
]);

const PRECACHE_MANIFEST_URL = '/precache-manifest.json';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);

    // Precache shell ke APP_SHELL_CACHE sedini mungkin saat install
    // agar navigasi pertama tidak pernah menunggu network.
    const appShellCache = await caches.open(APP_SHELL_CACHE);
    const indexResponse = (await cache.match('/index.html')) || (await cache.match('/'));
    if (indexResponse) {
      await appShellCache.put('/index.html', indexResponse.clone());
      await appShellCache.put('/', indexResponse.clone());
    }

    // Precache SEMUA chunk hasil build (manifest di-generate Vite saat build).
    // Ini krusial: sebelum activate, chunk milik rilis baru sudah tercache
    // sehingga reload pascapdate langsung instan dan tidak pernah 404.
    try {
      const manifestResponse = await fetch(PRECACHE_MANIFEST_URL, { cache: 'no-cache' });
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        const urls = Array.isArray(manifest.files)
          ? manifest.files.filter((u) => typeof u === 'string' && u.startsWith('/'))
          : [];
        await Promise.allSettled(urls.map((u) => cache.add(u)));
      }
    } catch {
      // Manifest gagal diambil (mis. offline saat update): abaikan, runtime
      // cache tetap mengisi aset secara lazy seperti biasa.
    }
  })());
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

// Stale-while-revalidate untuk aset non-hashed yang bisa berubah
const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) {
        void cache.put(request, response.clone()).then(() => {
          if (cacheName === RUNTIME_CACHE) void trimRuntimeCache();
        }).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);

  if (cached) {
    // Revalidasi di background tanpa memanggil event.waitUntil setelah await (menghindari InvalidStateError)
    void fetchPromise.catch(() => {});
    return cached;
  }
  return fetchPromise;
};

// Cache-first untuk aset immutable bertanda hash (/assets/*)
const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  if (cacheName !== STATIC_CACHE) {
    const staticCache = await caches.open(STATIC_CACHE);
    const staticMatch = await staticCache.match(request);
    if (staticMatch) return staticMatch;
  }

  const networkResponse = await fetch(request);
  if (isCacheableResponse(networkResponse)) {
    void cache.put(request, networkResponse.clone()).then(() => {
      if (cacheName === RUNTIME_CACHE) void trimRuntimeCache();
    }).catch(() => {});
  }
  return networkResponse;
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
      // Prioritas mutlak: Sajikan App Shell seketika (0 ms) dari cache
      const appShellCache = await caches.open(APP_SHELL_CACHE);
      const staticCache = await caches.open(STATIC_CACHE);

      const cachedShell =
        (await appShellCache.match('/index.html')) ||
        (await appShellCache.match('/')) ||
        (await staticCache.match('/index.html')) ||
        (await staticCache.match('/')) ||
        (await staticCache.match(request, { ignoreSearch: true })) ||
        (await appShellCache.match(request, { ignoreSearch: true }));

      if (cachedShell) {
        return cachedShell;
      }

      // Fallback jika belum pernah ada cache sama sekali (mis. install pertama kali)
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          await appShellCache.put('/index.html', networkResponse.clone());
          await appShellCache.put('/', networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        return (
          (await staticCache.match('/index.html')) ||
          (await staticCache.match('/offline.html')) ||
          Response.error()
        );
      }
    })());
    return;
  }

  const isHashedAsset =
    url.origin === self.location.origin && url.pathname.startsWith('/assets/');

  if (isHashedAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  const isFontAsset =
    (url.origin === self.location.origin && (url.pathname.startsWith('/fonts/') || request.destination === 'font')) ||
    (FONT_ORIGINS.has(url.origin) &&
      (request.destination === 'style' || request.destination === 'font'));

  if (isFontAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  const isSameOriginAsset =
    url.origin === self.location.origin && CACHEABLE_DESTINATIONS.has(request.destination);

  if (isSameOriginAsset) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (url.origin === self.location.origin && PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

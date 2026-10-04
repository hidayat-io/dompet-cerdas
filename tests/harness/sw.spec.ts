import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

// Menjalankan public/sw.js ASLI di sandbox Node dengan caches/clients/fetch fake.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const swSource = fs.readFileSync(path.join(repoRoot, 'public/sw.js'), 'utf8');

// public/sw.js belum di-stamp, jadi BUILD_ID masih placeholder.
const STATIC_CACHE = 'dompetcerdas-static-__DC_BUILD_ID__';
const OLD_STATIC_CACHE = 'dompetcerdas-static-buildlama';
const APP_SHELL_CACHE = 'dompetcerdas-app-shell';

class FakeResponse {
  constructor(public url: string, public ok = true, public status = 200, public body = '') {}
  clone() { return this; }
  async json() { return JSON.parse(this.body); }
}

type CacheEntries = Map<string, FakeResponse>;

const createSw = (options: {
  fetch: (url: string) => FakeResponse;
  caches?: Record<string, Record<string, FakeResponse>>;
  clientUrls?: string[];
}) => {
  const cacheStore = new Map<string, CacheEntries>();
  Object.entries(options.caches ?? {}).forEach(([name, entries]) => cacheStore.set(name, new Map(Object.entries(entries))));
  const keyOf = (request: string | { url: string }) => (typeof request === 'string' ? request : request.url);
  const fetchStub = async (url: string) => options.fetch(url);
  const openCache = (name: string) => {
    if (!cacheStore.has(name)) cacheStore.set(name, new Map());
    const entries = cacheStore.get(name)!;
    return {
      match: async (request: string | { url: string }) => entries.get(keyOf(request)),
      put: async (request: string | { url: string }, response: FakeResponse) => { entries.set(keyOf(request), response); },
      add: async (url: string) => {
        const response = await fetchStub(url);
        if (!response.ok) throw new Error(`add gagal: ${url}`);
        entries.set(url, response);
      },
      // Atomic seperti Cache.addAll asli: satu gagal, tidak ada yang disimpan.
      addAll: async (urls: string[]) => {
        const responses = await Promise.all(urls.map(fetchStub));
        if (responses.some((response) => !response.ok)) throw new Error('addAll gagal');
        urls.forEach((url, index) => entries.set(url, responses[index]));
      },
      keys: async () => [...entries.keys()].map((url) => ({ url })),
      delete: async (request: string | { url: string }) => entries.delete(keyOf(request)),
    };
  };

  const navigateCalls: string[] = [];
  const clients = (options.clientUrls ?? []).map((url) => ({
    url,
    // Tidak pernah selesai, persis seperti navigate() saat SW masih "activating".
    navigate: (target: string) => { navigateCalls.push(target); return new Promise(() => undefined); },
  }));
  const listeners: Record<string, (event: { waitUntil: (promise: Promise<unknown>) => void }) => void> = {};
  const self = {
    location: { href: 'https://app.test/sw.js' },
    addEventListener: (type: string, listener: (event: { waitUntil: (promise: Promise<unknown>) => void }) => void) => { listeners[type] = listener; },
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined, matchAll: async () => clients },
  };
  const context = vm.createContext({
    self,
    caches: {
      open: async (name: string) => openCache(name),
      keys: async () => [...cacheStore.keys()],
      delete: async (name: string) => cacheStore.delete(name),
    },
    fetch: fetchStub,
    URL,
    console,
    setTimeout,
  });
  vm.runInContext(swSource, context);

  const dispatch = (type: 'install' | 'activate') => {
    let pending: Promise<unknown> = Promise.resolve();
    listeners[type]({ waitUntil: (promise) => { pending = promise; } });
    return pending;
  };
  const cacheGet = (name: string, url: string) => cacheStore.get(name)?.get(url)?.body;
  return { cacheStore, cacheGet, navigateCalls, dispatch };
};

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([promise.then(() => 'selesai'), new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), ms))]);

const okFetch = (overrides: Record<string, FakeResponse> = {}) => (url: string) =>
  overrides[url] ?? (url === '/precache-manifest.json'
    ? new FakeResponse(url, true, 200, JSON.stringify({ files: ['/assets/index-baru.js', '/assets/chunk-baru.js'] }))
    : new FakeResponse(url, true, 200, url === '/index.html' || url === '/' ? 'index-baru' : `isi ${url}`));

test.describe('service worker', () => {
  test('activate tidak menunggu navigate() (dulu deadlock), membuang cache lama, dan reload tab lama', async () => {
    const sw = createSw({
      fetch: okFetch(),
      caches: {
        [OLD_STATIC_CACHE]: { '/assets/index-lama.js': new FakeResponse('/assets/index-lama.js') },
        [STATIC_CACHE]: { '/index.html': new FakeResponse('/index.html', true, 200, 'index-baru') },
        [APP_SHELL_CACHE]: { '/index.html': new FakeResponse('/index.html', true, 200, 'index-lama') },
      },
      clientUrls: ['https://app.test/transaksi'],
    });

    expect(await withTimeout(sw.dispatch('activate'), 1000)).toBe('selesai');
    expect(sw.navigateCalls).toEqual(['https://app.test/transaksi']);
    expect(sw.cacheStore.has(OLD_STATIC_CACHE)).toBe(false);
    expect(sw.cacheGet(APP_SHELL_CACHE, '/index.html')).toBe('index-baru');
  });

  test('tanpa cache versi lama tidak ada reload paksa', async () => {
    const sw = createSw({
      fetch: okFetch(),
      caches: { [STATIC_CACHE]: { '/index.html': new FakeResponse('/index.html', true, 200, 'index-baru') } },
      clientUrls: ['https://app.test/'],
    });
    expect(await withTimeout(sw.dispatch('activate'), 1000)).toBe('selesai');
    expect(sw.navigateCalls).toEqual([]);
  });

  test('install sukses tidak menyentuh app shell yang sedang dipakai SW lama', async () => {
    const sw = createSw({
      fetch: okFetch(),
      caches: { [APP_SHELL_CACHE]: { '/index.html': new FakeResponse('/index.html', true, 200, 'index-lama') } },
    });
    await sw.dispatch('install');
    expect(sw.cacheGet(STATIC_CACHE, '/assets/chunk-baru.js')).toBe('isi /assets/chunk-baru.js');
    expect(sw.cacheGet(APP_SHELL_CACHE, '/index.html')).toBe('index-lama');
  });

  test('install gagal (atomic) kalau precache-manifest gagal diambil', async () => {
    const sw = createSw({ fetch: okFetch({ '/precache-manifest.json': new FakeResponse('/precache-manifest.json', false, 503) }) });
    await expect(sw.dispatch('install')).rejects.toThrow();
  });

  test('install gagal (atomic) kalau satu chunk saja gagal diambil', async () => {
    const sw = createSw({ fetch: okFetch({ '/assets/chunk-baru.js': new FakeResponse('/assets/chunk-baru.js', false, 0) }) });
    await expect(sw.dispatch('install')).rejects.toThrow();
  });
});

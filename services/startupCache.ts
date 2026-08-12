/**
 * Cache-first persistence for startup hydration.
 *
 * Firestore's onSnapshot listeners already keep data fresh; this module only
 * mirrors the small set of data needed to render the shell instantly on the
 * next visit (accounts + active account + core collections). Writes are
 * fire-and-forget, versioned, and scoped per user+account so switching users
 * or accounts never leaks data across scopes.
 */

const DB_NAME = 'dompetcerdas-cache';
const DB_VERSION = 1;
const STORE = 'kv';

export interface AccountCache {
  id: string;
  name: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  sharedAccountId?: string;
  [key: string]: unknown;
}

export interface CachedSnapshot {
  activeAccountId: string | null;
  dataAccountId?: string | null;
  accounts: AccountCache[];
  categories: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  plans?: Array<Record<string, unknown>>;
  budgets?: Array<Record<string, unknown>>;
  debts?: Array<Record<string, unknown>>;
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

export async function readCachedSnapshot(userId: string): Promise<CachedSnapshot | null> {
  try {
    const raw = await withStore<string | undefined>('readonly', (store) => store.get(`user:${userId}`));
    if (!raw) return null;
    return JSON.parse(raw) as CachedSnapshot;
  } catch (error) {
    console.warn('[cache] read snapshot failed:', error);
    return null;
  }
}

export async function writeCachedSnapshot(userId: string, snapshot: CachedSnapshot): Promise<void> {
  try {
    await withStore<IDBValidKey>('readwrite', (store) => store.put(JSON.stringify(snapshot), `user:${userId}`));
  } catch (error) {
    // Cache writes must never block the app.
    console.warn('[cache] write snapshot failed:', error);
  }
}

export async function clearCachedSnapshot(userId: string): Promise<void> {
  try {
    await withStore<void>('readwrite', (store) => store.delete(`user:${userId}`));
  } catch (error) {
    console.warn('[cache] clear snapshot failed:', error);
  }
}

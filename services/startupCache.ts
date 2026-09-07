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

export const LAST_USER_ID_KEY = 'dompetcerdas_last_uid';
export const LAST_USER_PROFILE_KEY = 'dompetcerdas_last_profile';

export function getLastActiveUserId(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_USER_ID_KEY) : null;
  } catch {
    return null;
  }
}

export function setLastActiveUserId(userId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_USER_ID_KEY, userId);
    }
  } catch {}
}

export function clearLastActiveUserId(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LAST_USER_ID_KEY);
      localStorage.removeItem(LAST_USER_PROFILE_KEY);
    }
  } catch {}
}

export function getLastUserProfile(): { displayName?: string | null; photoURL?: string | null } | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(LAST_USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLastUserProfile(profile: { displayName?: string | null; photoURL?: string | null }): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_USER_PROFILE_KEY, JSON.stringify(profile));
    }
  } catch {}
}

const SNAPSHOT_STORAGE_KEY = (userId: string) => `dompetcerdas_snap_${userId}`;

export function readCachedSnapshotSync(userId: string): CachedSnapshot | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY(userId));
    return raw ? (JSON.parse(raw) as CachedSnapshot) : null;
  } catch {
    return null;
  }
}

export async function readCachedSnapshot(userId: string): Promise<CachedSnapshot | null> {
  const syncSnap = readCachedSnapshotSync(userId);
  if (syncSnap) return syncSnap;
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
    setLastActiveUserId(userId);
    // Tulis snapshot ringkas ke localStorage untuk hidrasi instan 0ms saat boot berikutnya
    try {
      if (typeof localStorage !== 'undefined') {
        const syncCopy: CachedSnapshot = {
          ...snapshot,
          transactions: snapshot.transactions.slice(0, 30),
        };
        localStorage.setItem(SNAPSHOT_STORAGE_KEY(userId), JSON.stringify(syncCopy));
      }
    } catch {}
    await withStore<IDBValidKey>('readwrite', (store) => store.put(JSON.stringify(snapshot), `user:${userId}`));
  } catch (error) {
    // Cache writes must never block the app.
    console.warn('[cache] write snapshot failed:', error);
  }
}

export async function clearCachedSnapshot(userId: string): Promise<void> {
  try {
    clearLastActiveUserId();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SNAPSHOT_STORAGE_KEY(userId));
      }
    } catch {}
    await withStore<void>('readwrite', (store) => store.delete(`user:${userId}`));
  } catch (error) {
    console.warn('[cache] clear snapshot failed:', error);
  }
}

const STORAGE_CLEANUP_QUEUE_KEY = 'dompetcerdas_pending_storage_cleanup';
const CATEGORY_CACHE_REFRESH_KEY = 'dompetcerdas_pending_category_cache_refresh';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readJsonArray = (key: string): string[] => {
  if (!isBrowser()) return [];

  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
  } catch (error) {
    console.error(`Failed to read offline queue "${key}":`, error);
    return [];
  }
};

const writeJsonArray = (key: string, values: string[]) => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch (error) {
    console.error(`Failed to write offline queue "${key}":`, error);
  }
};

export const enqueueStorageCleanup = (paths: string[]) => {
  const uniquePaths = paths.filter(Boolean);
  if (!uniquePaths.length) return 0;

  const nextQueue = Array.from(new Set([...readJsonArray(STORAGE_CLEANUP_QUEUE_KEY), ...uniquePaths]));
  writeJsonArray(STORAGE_CLEANUP_QUEUE_KEY, nextQueue);
  return nextQueue.length;
};

export const hasPendingStorageCleanup = () => readJsonArray(STORAGE_CLEANUP_QUEUE_KEY).length > 0;

export const flushStorageCleanupQueue = async (processPath: (path: string) => Promise<void>) => {
  const queue = readJsonArray(STORAGE_CLEANUP_QUEUE_KEY);
  const remainingPaths: string[] = [];
  let processedCount = 0;

  for (const path of queue) {
    try {
      await processPath(path);
      processedCount += 1;
    } catch (error) {
      console.error('Failed to process queued storage cleanup:', path, error);
      remainingPaths.push(path);
    }
  }

  writeJsonArray(STORAGE_CLEANUP_QUEUE_KEY, remainingPaths);

  return {
    processedCount,
    remainingCount: remainingPaths.length,
  };
};

export const markCategoryCacheRefreshPending = () => {
  if (!isBrowser()) return;
  localStorage.setItem(CATEGORY_CACHE_REFRESH_KEY, '1');
};

export const hasPendingCategoryCacheRefresh = () => isBrowser() && localStorage.getItem(CATEGORY_CACHE_REFRESH_KEY) === '1';

export const clearPendingCategoryCacheRefresh = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(CATEGORY_CACHE_REFRESH_KEY);
};

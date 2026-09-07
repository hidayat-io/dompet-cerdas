import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});

test.describe('Startup Cache Hydration', () => {
  test('boots cleanly without errors when cache is present', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => logs.push(msg.text()));

    // 1. Seed IndexedDB and localStorage before navigating
    await page.goto('/favicon-32.png');
    await page.evaluate(async () => {
      const DB_NAME = 'dompetcerdas-cache';
      const STORE = 'kv';
      const userId = 'test-cache-user';

      localStorage.setItem('dompetcerdas_last_uid', userId);
      localStorage.setItem('dompetcerdas_last_profile', JSON.stringify({
        displayName: 'Test User',
        photoURL: null,
      }));

      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };

      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(STORE, 'readwrite');
          const store = tx.objectStore(STORE);
          const snapshot = {
            activeAccountId: 'acc-1',
            dataAccountId: 'acc-1',
            accounts: [
              { id: 'acc-1', name: 'Dompet Utama', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            ],
            categories: [
              { id: 'cat-1', name: 'Makan', type: 'EXPENSE', icon: 'Utensils', color: '#f59e0b', order: 1 }
            ],
            transactions: [
              { id: 'tx-1', amount: 50000, type: 'EXPENSE', categoryId: 'cat-1', categoryName: 'Makan', date: '2026-09-07', note: 'Makan Siang' }
            ],
            plans: [],
            budgets: [],
            debts: [],
            cachedAt: Date.now(),
          };
          store.put(JSON.stringify(snapshot), `user:${userId}`);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    // 2. Navigate to root
    await page.goto('/');

    // 3. Waits for app mount and auth resolution
    await expect(page.getByRole('button', { name: 'Masuk dengan Google' })).toBeVisible({ timeout: 10_000 });
    expect(logs.some(l => l.includes('dc-app-mount'))).toBe(true);
    expect(logs.some(l => l.includes('dc-auth-no'))).toBe(true);
  });
});

import { expect, test } from './fixtures';
import { getHarness } from './helpers';

const openRegistration = async (page: import('@playwright/test').Page, from: 'plain' | 'versioned') => {
  await page.goto(`/?scenario=pwa-register&from=${from}`);
  await page.waitForFunction(() => window.__harness?.ready === true);
};

test.describe('Registrasi service worker', () => {
  // Guard console di fixtures.ts juga menggagalkan test kalau update() yang gagal (offline)
  // berakhir jadi unhandled rejection.
  test('di-register sebagai /sw.js polos (tanpa ?v=); update baru tetap memunculkan banner', async ({ page }) => {
    await openRegistration(page, 'plain');
    await expect.poll(async () => (await getHarness(page)).swRegistrations).toEqual(['/sw.js']);
    await expect.poll(async () => (await getHarness(page)).pwaUpdateEvents).toBe(1);
  });

  test('perpindahan dari URL lama /sw.js?v= (SW yang sama di-install ulang) tidak memunculkan phantom banner', async ({ page }) => {
    await openRegistration(page, 'versioned');
    await expect.poll(async () => (await getHarness(page)).swRegistrations).toEqual(['/sw.js']);
    await page.waitForTimeout(300);
    expect((await getHarness(page)).pwaUpdateEvents).toBe(0);
  });
});

import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});

test.describe('Auth startup', () => {
  test('boots auth without loading the popup/redirect iframe machinery', async ({ page }) => {
    const resolverRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/__/auth/') || url.includes('apis.google.com')) {
        resolverRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Masuk dengan Google' })).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3_000);

    expect(resolverRequests).toHaveLength(0);
  });
});

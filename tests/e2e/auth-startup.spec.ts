import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});

test.describe('Auth startup', () => {
  test('renders login without waiting for redirect resolver network', async ({ page }) => {
    const iframeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/__/auth/iframe')) {
        iframeRequests.push(request.url());
      }
    });

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Masuk dengan Google' })).toBeVisible({ timeout: 15_000 });

    expect(iframeRequests).toHaveLength(0);
  });
});

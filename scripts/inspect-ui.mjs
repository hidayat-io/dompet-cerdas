import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  console.log('Navigating to app...');
  await page.goto('https://expensetracker-test-1.web.app', { waitUntil: 'networkidle' });

  // Check login button
  const hasE2EBtn = await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="auth-e2e-login"]');
    return !!btn;
  });
  console.log('E2E Login button found on prod:', hasE2EBtn);

  // Take login screen
  await page.screenshot({ path: '/tmp/inspect-1-login.png' });

  await browser.close();
})();

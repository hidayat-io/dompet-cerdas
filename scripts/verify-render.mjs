import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true });
  await page.goto('https://expensetracker-test-1.web.app', { waitUntil: 'networkidle' });

  // Take screenshot of whatever is displayed
  await page.screenshot({ path: '/tmp/verify-login-page.png', fullPage: false });

  await browser.close();
  console.log('Done rendering screenshot');
})();

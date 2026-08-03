import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true });
  await page.goto('https://expensetracker-test-1.web.app', { waitUntil: 'networkidle' });

  await page.screenshot({ path: '/tmp/verify-fix.png', fullPage: false });
  await browser.close();
  console.log('Verification screenshot saved to /tmp/verify-fix.png');
})();

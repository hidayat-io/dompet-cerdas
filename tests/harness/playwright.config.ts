import { defineConfig, devices } from '@playwright/test';

// Jalankan: npx playwright test -c tests/harness/playwright.config.ts
// Harness merender component asli dengan fake Firestore (tanpa emulator/Java).
// Browser: npx playwright install chromium webkit
const port = Number(process.env.HARNESS_PORT || 4318);
const baseURL = `http://127.0.0.1:${port}`;
const NODE_ONLY_SPECS = /(sw|build)\.spec\.ts$/;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    timezoneId: 'Asia/Jakarta',
    locale: 'id-ID',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // cwd default = folder config ini (tests/harness).
    command: `npx vite --config vite.config.ts --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    // channel 'chromium' = Chromium penuh (headless baru), perilakunya lebih dekat ke Chrome asli.
    { name: 'android-chrome', testIgnore: NODE_ONLY_SPECS, use: { ...devices['Pixel 7'], channel: 'chromium' } },
    { name: 'iphone-webkit', testIgnore: NODE_ONLY_SPECS, use: { ...devices['iPhone 13'] } },
    // Test service worker (sandbox vm) & build Vite: jalan di Node, tanpa browser.
    { name: 'node', testMatch: NODE_ONLY_SPECS },
  ],
});

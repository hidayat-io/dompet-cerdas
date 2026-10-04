import { test as base, expect } from '@playwright/test';

type Options = {
  // Pola console error/warning yang memang disengaja di test tertentu (mis. simulasi gagal simpan).
  allowedConsoleMessages: RegExp[];
};

// Setiap test otomatis gagal kalau ada console error/warning atau pageerror yang tidak diharapkan.
export const test = base.extend<Options & { consoleGuard: void }>({
  allowedConsoleMessages: [[], { option: true }],
  consoleGuard: [
    async ({ page, allowedConsoleMessages }, use) => {
      const messages: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          messages.push(`[${message.type()}] ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`));
      await use();
      const unexpected = messages.filter((text) => !allowedConsoleMessages.some((pattern) => pattern.test(text)));
      expect(unexpected, 'console error/warning yang tidak diharapkan').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

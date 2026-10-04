import { expect, test } from './fixtures';
import { openScenario } from './helpers';
import { FIXTURE_TEXT } from './fixtureText';

test.describe('Anggaran', () => {
  // Guard console di fixtures.ts menggagalkan test kalau React melaporkan <div> di dalam <p>.
  test('detail anggaran menampilkan daftar transaksi tanpa console error', async ({ page }) => {
    await openScenario(page, 'budgets');
    // Button "lihat" (ikon mata) = IconButton pertama di kartu anggaran; tidak punya label aksesibilitas.
    await page.locator('.MuiCard-root', { hasText: 'Belanja Harian' }).locator('.MuiIconButton-root').first().click();
    await expect(page.getByText('Transaksi dalam Anggaran')).toBeVisible();
    await expect(page.getByText(FIXTURE_TEXT.long)).toBeVisible();
  });
});

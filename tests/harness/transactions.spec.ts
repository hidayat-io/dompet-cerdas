import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { findClippedText, openScenario, waitForAnimations } from './helpers';
import { FIXTURE_TEXT } from './fixtureText';

const LONG_SEARCH = 'belanja bulanan supermarket dekat rumah kontrakan';

// Audit seluruh menu Riwayat Transaksi: daftar, card upload, dialog filter (+ menu kategori),
// chip filter aktif, dan action sheet yang terbuka saat baris di-tap.
const auditWholeMenu = async (page: Page) => {
  // Setiap audit menunggu transisi MUI (fade/grow/slide) selesai: saat transisi masuk opacity masih 0
  // dan teks yang tidak terlihat dilewati audit, jadi pemotongan bisa lolos tanpa terdeteksi.
  const audit = async (label: string) => {
    await waitForAnimations(page);
    expect(await findClippedText(page), label).toEqual([]);
  };

  await openScenario(page, 'transactions');
  await expect(page.getByText(FIXTURE_TEXT.long).first()).toBeVisible();
  await audit('daftar & card upload');

  await page.getByRole('button', { name: 'Filter lanjutan' }).click();
  await page.getByLabel('Cari transaksi').fill(LONG_SEARCH);
  await page.getByRole('combobox').click();
  await expect(page.getByRole('option', { name: FIXTURE_TEXT.longCategory })).toBeVisible();
  await audit('menu kategori');
  await page.getByRole('option', { name: FIXTURE_TEXT.longCategory }).click();
  await page.getByRole('tab', { name: 'Masuk' }).click();
  await audit('dialog filter');
  await page.getByRole('tab', { name: 'Semua' }).click();
  await page.getByRole('button', { name: 'Terapkan' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await audit('chip filter aktif');

  await page.getByRole('button', { name: 'Hapus Semua' }).click();
  await page.getByText(FIXTURE_TEXT.unbroken).click();
  await expect(page.getByRole('heading', { name: FIXTURE_TEXT.unbroken })).toBeVisible();
  await audit('action sheet');
};

// Metrik elemen yang teks-nya PERSIS sama dengan `text` di dalam daftar transaksi.
const textMetrics = (page: Page, text: string) =>
  page.evaluate((target) => {
    const element = [...document.querySelectorAll<HTMLElement>('ul p, ul span')].find((el) => el.textContent === target && el.children.length === 0);
    if (!element) throw new Error(`teks tidak ditemukan: ${target}`);
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const row = element.closest<HTMLElement>('[role="button"]');
    const amount = row ? [...row.querySelectorAll<HTMLElement>('p')].find((el) => /^[-+]Rp /.test(el.textContent ?? '')) : null;
    return {
      fontSize: parseFloat(style.fontSize),
      lineHeight: parseFloat(style.lineHeight),
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      clippedHorizontally: element.scrollWidth > element.clientWidth + 1,
      clippedVertically: element.scrollHeight > element.clientHeight + 1,
      height: rect.height,
      right: rect.right,
      rowRight: row?.getBoundingClientRect().right ?? 0,
      amountLeft: amount?.getBoundingClientRect().left ?? null,
      amountText: amount?.textContent ?? null,
    };
  }, text);

test.describe('Daftar transaksi', () => {
  test('tidak ada teks terpotong di seluruh menu (daftar, card upload, filter, action sheet)', async ({ page }) => {
    await auditWholeMenu(page);
  });

  test('deskripsi panjang tampil penuh dengan font lebih kecil (batas 24/25/48/49 karakter)', async ({ page }) => {
    await openScenario(page, 'transactions');
    const expected: Array<[string, number]> = [
      [FIXTURE_TEXT.short, 14],
      [FIXTURE_TEXT.len24, 14],
      [FIXTURE_TEXT.len25, 13],
      [FIXTURE_TEXT.medium, 13],
      [FIXTURE_TEXT.len48, 13],
      [FIXTURE_TEXT.len49, 12],
      [FIXTURE_TEXT.long, 12],
    ];
    for (const [text, fontSize] of expected) {
      const metrics = await textMetrics(page, text);
      expect(metrics.fontSize, text).toBe(fontSize);
      expect(metrics.whiteSpace).not.toBe('nowrap');
      expect(metrics.textOverflow).not.toBe('ellipsis');
      expect(metrics.clippedHorizontally).toBe(false);
      expect(metrics.clippedVertically).toBe(false);
    }
    // Deskripsi panjang dibiarkan wrap ke beberapa baris, bukan dipotong.
    const long = await textMetrics(page, FIXTURE_TEXT.long);
    expect(long.height).toBeGreaterThan(long.lineHeight * 1.5);
  });

  test('teks tanpa spasi (URL) tetap wrap dan tidak menimpa nominal', async ({ page }) => {
    await openScenario(page, 'transactions');
    const unbroken = await textMetrics(page, FIXTURE_TEXT.unbroken);
    expect(unbroken.clippedHorizontally).toBe(false);
    expect(unbroken.amountText).toBe('-Rp 99.000');
    expect(unbroken.right).toBeLessThanOrEqual(unbroken.amountLeft!);
  });

  test('nama kategori panjang tidak terpotong', async ({ page }) => {
    await openScenario(page, 'transactions');
    const category = await textMetrics(page, FIXTURE_TEXT.longCategory);
    expect(category.clippedHorizontally).toBe(false);
    expect(category.whiteSpace).not.toBe('nowrap');
    expect(category.right).toBeLessThanOrEqual(category.rowRight);
  });

  test('preview lampiran: nama file panjang tanpa spasi di judul tidak terpotong & tidak menimpa button share', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openScenario(page, 'transactions-attachment');
    await page.locator('.MuiChip-clickable').first().click();
    await expect(page.getByText(FIXTURE_TEXT.longUnbrokenFileName, { exact: true })).toBeVisible();
    await waitForAnimations(page);
    expect(await findClippedText(page)).toEqual([]);
    const gap = await page.evaluate((fileName) => {
      const title = [...document.querySelectorAll<HTMLElement>('h6')].find((el) => el.textContent === fileName)!;
      const range = document.createRange();
      range.selectNodeContents(title);
      const share = document.querySelector<HTMLElement>('.MuiDialogTitle-root a')!;
      return share.getBoundingClientRect().left - range.getBoundingClientRect().right;
    }, FIXTURE_TEXT.longUnbrokenFileName);
    expect(gap).toBeGreaterThanOrEqual(0);
  });

  test('action sheet: nama kategori panjang tanpa spasi tidak overflow/terpotong', async ({ page }) => {
    for (const width of [320, 412]) {
      await page.setViewportSize({ width, height: 740 });
      await openScenario(page, 'transactions-unbroken-category');
      await page.getByText('Langganan', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Langganan' })).toBeVisible();
      await waitForAnimations(page);
      expect(await findClippedText(page), `${width}px`).toEqual([]);
    }
  });

  test.describe('layar sempit 320px', () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test('tidak ada teks terpotong di seluruh menu', async ({ page }) => {
      await auditWholeMenu(page);
    });

    test('header: button "Filter lanjutan" utuh di layar, halaman tidak bisa digeser ke samping', async ({ page }) => {
      await openScenario(page, 'transactions');
      await expect(page.getByRole('button', { name: 'Filter lanjutan' })).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test('dialog filter: button aksi utuh di dalam dialog, dialog tidak bisa digeser ke samping (280 & 320px)', async ({ page }) => {
      for (const width of [280, 320]) {
        await page.setViewportSize({ width, height: 640 });
        await openScenario(page, 'transactions');
        await page.getByRole('button', { name: 'Filter lanjutan' }).click();
        await expect(page.getByRole('button', { name: 'Terapkan' })).toBeVisible();
        await waitForAnimations(page);
        const metrics = await page.evaluate(() => {
          const paper = document.querySelector<HTMLElement>('.MuiDialog-paper');
          if (!paper) throw new Error('dialog filter tidak ditemukan');
          const actions = paper.querySelector<HTMLElement>('.MuiDialogActions-root')!;
          const actionsRect = actions.getBoundingClientRect();
          const style = getComputedStyle(actions);
          const contentLeft = actionsRect.left + parseFloat(style.paddingLeft);
          const contentRight = actionsRect.right - parseFloat(style.paddingRight);
          const buttons = [...actions.querySelectorAll<HTMLElement>('button')];
          const byText = (text: string) => buttons.find((button) => button.textContent?.trim() === text)!.getBoundingClientRect();
          const close = byText('Tutup');
          const apply = byText('Terapkan');
          return {
            horizontalOverflow: paper.scrollWidth - paper.clientWidth,
            // Button yang keluar dari area konten DialogActions (masuk ke padding atau keluar dialog).
            outside: buttons
              .filter((button) => {
                const rect = button.getBoundingClientRect();
                return rect.left < contentLeft - 0.5 || rect.right > contentRight + 0.5;
              })
              .map((button) => button.textContent?.trim()),
            applyGapToContentEdge: contentRight - apply.right,
            rowGap: apply.top >= close.bottom ? apply.top - close.bottom : null,
          };
        });
        expect(metrics.outside, `${width}px`).toEqual([]);
        expect(metrics.horizontalOverflow, `${width}px`).toBeLessThanOrEqual(0);
        // Button utama tetap rata kanan walau turun ke baris kedua, dengan jarak antar-baris.
        expect(Math.abs(metrics.applyGapToContentEdge), `${width}px`).toBeLessThanOrEqual(0.5);
        expect(metrics.rowGap, `${width}px`).not.toBeNull();
        expect(metrics.rowGap!, `${width}px`).toBeGreaterThanOrEqual(7.5);
      }
    });

    test('card upload: label tetap lebar & button aksi tetap terlihat', async ({ page }) => {
      await openScenario(page, 'transactions');
      const labelWidth = await page.getByText(FIXTURE_TEXT.long).first().evaluate((element) => element.getBoundingClientRect().width);
      expect(labelWidth).toBeGreaterThanOrEqual(150);
      const retryButtons = page.getByRole('button', { name: 'Coba lagi' });
      await expect(retryButtons).toHaveCount(2);
      for (const button of await retryButtons.all()) {
        await expect(button).toBeInViewport({ ratio: 1 });
      }
      await expect(page.getByText('Transaksi tidak ditemukan pada daftar saat ini')).toBeVisible();
    });
  });

  test.describe('tablet 600px', () => {
    test.use({ viewport: { width: 600, height: 960 } });

    test('font deskripsi tidak dikecilkan karena ruangnya sudah cukup', async ({ page }) => {
      await openScenario(page, 'transactions');
      expect((await textMetrics(page, FIXTURE_TEXT.len49)).fontSize).toBe(14);
      expect((await textMetrics(page, FIXTURE_TEXT.long)).fontSize).toBe(14);
    });
  });

  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

    test('di layar lebar font deskripsi tidak perlu dikecilkan', async ({ page }) => {
      await openScenario(page, 'transactions');
      expect((await textMetrics(page, FIXTURE_TEXT.long)).fontSize).toBe(14);
      expect(await findClippedText(page)).toEqual([]);
    });
  });
});

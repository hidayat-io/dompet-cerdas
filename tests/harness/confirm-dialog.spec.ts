import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { confirmDialogLayout, findClippedText, openScenario, waitForAnimations } from './helpers';
import { FIXTURE_TEXT } from './fixtureText';

// ConfirmDialog adalah shared component (Anggaran, Kategori, Utang, Rencana, Pengeluaran Rutin,
// hapus transaksi). Label yang dipakai app: default "Konfirmasi", "Hapus", "Tandai Lunas", "Ya, Batalkan Lunas".
const LABELS: Array<{ confirm?: string; cancel: string }> = [
  { confirm: 'Hapus', cancel: 'Batal' },
  { cancel: 'Batal' },
  { confirm: 'Tandai Lunas', cancel: 'Batal' },
  { confirm: 'Ya, Batalkan Lunas', cancel: 'Tutup' },
];

const openConfirm = async (page: Page, labels: { confirm?: string; cancel: string }, message?: string) => {
  const query = new URLSearchParams({ cancel: labels.cancel });
  if (labels.confirm) query.set('confirm', labels.confirm);
  if (message) query.set('message', message);
  await openScenario(page, `confirm-dialog&${query.toString()}`);
  await waitForAnimations(page);
};

test.describe('ConfirmDialog', () => {
  for (const labels of LABELS) {
    test(`"${labels.cancel}" + "${labels.confirm ?? 'Konfirmasi'}": button sama lebar & sama bentuk, label utuh, tanpa overflow (280–1280px)`, async ({ page }) => {
      for (const width of [280, 320, 360, 390, 412, 1280]) {
        await page.setViewportSize({ width, height: 740 });
        await openConfirm(page, labels);
        const [cancel, confirm] = (await confirmDialogLayout(page)).buttons;
        const label = `${width}px`;
        expect([cancel.textInside, confirm.textInside, cancel.insidePaper, confirm.insidePaper], label).toEqual([true, true, true, true]);
        // Berdampingan maupun bertumpuk, kedua button sama lebar, sama tinggi, dan sama radius.
        expect(Math.abs(cancel.width - confirm.width), label).toBeLessThanOrEqual(0.5);
        expect(Math.abs(cancel.height - confirm.height), label).toBeLessThanOrEqual(0.5);
        expect(cancel.radius, label).toBe(confirm.radius);
        if (confirm.top >= cancel.bottom) expect(Math.abs(confirm.left - cancel.left), label).toBeLessThanOrEqual(0.5);
        if (width >= 320) expect(confirm.labelLines, label).toBe(1);
        // Ikon menempel ke label (6px), bukan 48px.
        expect(confirm.iconGap!, label).toBeLessThanOrEqual(8);
        expect(await findClippedText(page), label).toEqual([]);
      }
    });
  }

  test('loading: posisi & ukuran button tidak berubah (layout tidak lompat) dan spinner tampil', async ({ page }) => {
    for (const width of [320, 360, 412]) {
      await page.setViewportSize({ width, height: 740 });
      await openConfirm(page, { confirm: 'Tandai Lunas', cancel: 'Batal' });
      const geometry = (layout: Awaited<ReturnType<typeof confirmDialogLayout>>) => ({
        paperHeight: layout.paperHeight,
        buttons: layout.buttons.map(({ left, top, width: buttonWidth, height }) => ({ left, top, width: buttonWidth, height })),
      });
      const idle = geometry(await confirmDialogLayout(page));
      await page.evaluate(() => window.__harnessSetConfirmLoading?.(true));
      await expect(page.locator('.MuiDialogActions-root .MuiCircularProgress-root')).toBeVisible();
      expect(geometry(await confirmDialogLayout(page)), `${width}px`).toEqual(idle);
    }
  });

  test('pesan berisi nama panjang tanpa spasi tidak overflow keluar dialog', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openConfirm(page, { confirm: 'Hapus', cancel: 'Batal' }, `Yakin ingin menghapus "${FIXTURE_TEXT.unbrokenCategory}"? Tindakan ini tidak dapat dibatalkan.`);
    expect(await findClippedText(page)).toEqual([]);
    expect(await page.locator('.MuiDialog-paper').evaluate((paper) => paper.scrollWidth - paper.clientWidth)).toBeLessThanOrEqual(0);
  });
});

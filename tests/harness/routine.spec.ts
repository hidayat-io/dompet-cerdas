import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { FIXED_MONTH_LABEL, FIXED_NOW, FIXED_TODAY, confirmDialogLayout, currentMonthKey, findClippedText, getHarness, openScenario, setHarness, waitForAnimations } from './helpers';
import { FIXTURE_TEXT } from './fixtureText';

const PERSONAL = 'users/u1/accounts/a1';
const SHARED = 'sharedAccounts/s1';

// Tunggu dialog sebelumnya selesai menutup (isinya sengaja tetap terisi selama animasi
// tutup, jadi nama tagihan sempat muncul dua kali) sebelum mengetuk baris tagihan.
const clickExpenseRow = async (page: Page, expenseName: string) => {
  await expect(page.locator('.MuiDialog-root')).toHaveCount(0);
  await page.getByText(expenseName, { exact: true }).click();
};

const openPayDialog = async (page: Page, expenseName: string) => {
  await clickExpenseRow(page, expenseName);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(`Set Lunas - ${expenseName}`);
  return dialog;
};

const openTransactionForm = async (page: Page, expenseName: string) => {
  const dialog = await openPayDialog(page, expenseName);
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Lanjut Catat Transaksi' }).click();
  await expect(page.getByRole('heading', { name: 'Catat Transaksi' })).toBeVisible();
};

const lastNotification = async (page: Page) => (await getHarness(page)).notifications.at(-1);

// Form transaksi dianggap tertutup kalau judulnya hilang. Jangan pakai button
// "Simpan": labelnya berubah jadi "Menyimpan..." saat proses, jadi "hilang" terlalu dini.
const expectTransactionFormClosed = (page: Page) =>
  expect(page.getByRole('heading', { name: 'Catat Transaksi' })).toBeHidden();

const paidChips = (page: Page) => page.getByText('Lunas', { exact: true });

const writtenPaths = async (page: Page) => (await getHarness(page)).writes.map((write) => `${write.op} ${write.path.replace(/auto_[a-z0-9]+$/, 'auto')}`);

test.describe('Pengeluaran rutin', () => {
  test('Set Lunas tanpa catat transaksi', async ({ page }) => {
    await openScenario(page, 'routine');
    const month = await currentMonthKey(page);
    expect(month).toBe('2026-11');
    const dialog = await openPayDialog(page, 'Listrik PLN');

    await expect(dialog.getByRole('checkbox')).not.toBeChecked();
    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect(dialog).toBeHidden();
    await expect(paidChips(page)).toHaveCount(1);
    await expect(page.getByText('1/2 Dibayar')).toBeVisible();

    await expect.poll(async () => (await getHarness(page)).writes.length).toBe(1);
    const state = await getHarness(page);
    expect(state.addedTransactions).toEqual([]);
    expect(state.writes[0]).toEqual({
      op: 'set',
      path: `${PERSONAL}/routine_expense_records/r-listrik_${month}`,
      data: { id: `r-listrik_${month}`, expenseId: 'r-listrik', month, paidAt: FIXED_NOW.toISOString(), createdByUserId: 'u1' },
    });
    await expect.poll(async () => (await lastNotification(page))?.message).toBe('"Listrik PLN" ditandai lunas.');
  });

  test('isi dialog tetap terisi selama animasi tutup (tidak berkedip kosong)', async ({ page }) => {
    await openScenario(page, 'routine');
    // Rekam SETIAP perubahan isi dialog sepanjang hidupnya (tidak bergantung timing animasi).
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __dialogTexts: string[] }).__dialogTexts = seen;
      new MutationObserver(() => {
        document.querySelectorAll('[role="dialog"]').forEach((dialog) => seen.push(dialog.textContent ?? ''));
      }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    });
    const dialogTexts = () => page.evaluate(() => (window as unknown as { __dialogTexts: string[] }).__dialogTexts);

    const dialog = await openPayDialog(page, 'Listrik PLN');
    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect(page.locator('.MuiDialog-root')).toHaveCount(0);
    await clickExpenseRow(page, 'Listrik PLN');
    await page.getByRole('button', { name: 'Ya, Batalkan Lunas' }).click();
    await expect(page.locator('.MuiDialog-root')).toHaveCount(0);

    const texts = await dialogTexts();
    expect(texts.some((text) => text.includes('Set Lunas - Listrik PLN'))).toBe(true);
    expect(texts.some((text) => text.includes('"Listrik PLN"') && text.includes('belum dibayar'))).toBe(true);
    expect(texts.filter((text) => /Set Lunas - (?!Listrik PLN)/.test(text) || text.includes('undefined') || text.includes('Rp 0'))).toEqual([]);
  });

  test('pilihan "catat transaksi" tidak terbawa ke tagihan berikutnya', async ({ page }) => {
    await openScenario(page, 'routine');
    let dialog = await openPayDialog(page, 'Internet');
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(dialog).toBeHidden();

    dialog = await openPayDialog(page, 'Listrik PLN');
    await expect(dialog.getByRole('checkbox')).not.toBeChecked();
    await expect(dialog.getByRole('button', { name: 'Set Lunas' })).toBeVisible();
  });

  test('Set Lunas langsung menutup dialog walau ack server lambat; toast menunggu ack', async ({ page }) => {
    await openScenario(page, 'routine');
    await setHarness(page, { writeLatencyMs: 4000 });
    const dialog = await openPayDialog(page, 'Listrik PLN');

    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect(dialog).toBeHidden({ timeout: 1000 });
    await expect(paidChips(page)).toHaveCount(1, { timeout: 1000 });
    const state = await getHarness(page);
    expect(state.writes).toEqual([]); // belum di-ack, tapi UI sudah benar
    expect(state.notifications).toEqual([]); // belum ada klaim "berhasil" sebelum server menerima
    await expect.poll(async () => (await lastNotification(page))?.type, { timeout: 8000 }).toBe('success');
  });

  test('offline: Set Lunas tetap jalan dan tersinkron setelah online', async ({ page }) => {
    await openScenario(page, 'routine');
    const month = await currentMonthKey(page);
    await setHarness(page, { offline: true });
    const dialog = await openPayDialog(page, 'Listrik PLN');

    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect(dialog).toBeHidden();
    await expect(paidChips(page)).toHaveCount(1);
    await page.waitForTimeout(300);
    expect((await getHarness(page)).writes).toEqual([]);

    await setHarness(page, { offline: false });
    await expect.poll(() => writtenPaths(page)).toEqual([`set ${PERSONAL}/routine_expense_records/r-listrik_${month}`]);
    await expect.poll(async () => (await lastNotification(page))?.type).toBe('success');
  });

  test('Lunas + catat transaksi: transaksi & tanda lunas tersimpan atomic, prefill benar, toast form tidak menimpa', async ({ page }) => {
    await openScenario(page, 'routine');
    const month = await currentMonthKey(page);
    await openTransactionForm(page, 'Internet');

    await expect(page.getByRole('textbox').first()).toHaveValue('400.000');
    await page.getByRole('button', { name: 'Simpan' }).click();

    await expectTransactionFormClosed(page);
    await expect(paidChips(page)).toHaveCount(1);
    await expect.poll(async () => (await lastNotification(page))?.message).toBe('"Internet" ditandai lunas dan transaksi dicatat.');
    const state = await getHarness(page);
    expect(state.addedTransactions).toEqual([
      { amount: 400000, categoryId: 'c-tagihan', date: FIXED_TODAY, description: `Pembayaran Internet - ${FIXED_MONTH_LABEL}` },
    ]);
    expect(await writtenPaths(page)).toEqual([
      `set ${PERSONAL}/transactions/auto`,
      `set ${PERSONAL}/routine_expense_records/r-internet_${month}`,
    ]);
    expect(state.notifications.map((n) => n.title)).not.toContain('Tersimpan!');
  });

  test('selama lampiran di-upload belum ada yang ditulis (tidak ada "lunas tanpa transaksi")', async ({ page }) => {
    await openScenario(page, 'routine');
    await openTransactionForm(page, 'Internet');
    await setHarness(page, { addTransactionDelayMs: 2000 });

    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForTimeout(400);
    // App bisa saja mati di titik ini: tidak boleh ada tanda lunas tanpa transaksinya.
    expect((await getHarness(page)).writes).toEqual([]);
    await expect(paidChips(page)).toHaveCount(0);

    await expectTransactionFormClosed(page);
    await expect(paidChips(page)).toHaveCount(1);
    expect((await getHarness(page)).addedTransactions).toHaveLength(1);
  });

  test('offline: Lunas + catat langsung tampil lunas, form boleh ditutup, tidak ada transaksi dobel', async ({ page }) => {
    await openScenario(page, 'routine');
    const month = await currentMonthKey(page);
    await openTransactionForm(page, 'Internet');
    await setHarness(page, { offline: true });

    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByRole('button', { name: 'Menyimpan...' })).toBeVisible();
    // User menutup form karena "Menyimpan..." tidak selesai-selesai.
    await page.getByRole('button', { name: 'Tutup' }).click();
    await expectTransactionFormClosed(page);
    // Item sudah tampil lunas, jadi user tidak terdorong mencatat ulang.
    await expect(paidChips(page)).toHaveCount(1);
    await clickExpenseRow(page, 'Internet');
    await expect(page.getByText('Batalkan Status Lunas?')).toBeVisible();
    await page.getByRole('button', { name: 'Tutup' }).click();

    await setHarness(page, { offline: false });
    await expect.poll(() => writtenPaths(page)).toEqual([
      `set ${PERSONAL}/transactions/auto`,
      `set ${PERSONAL}/routine_expense_records/r-internet_${month}`,
    ]);
    await expect.poll(async () => (await getHarness(page)).addedTransactions.length).toBe(1);
  });

  test('simpan tertunda lalu form ditutup: selesainya proses lama tidak menutup dialog tagihan lain', async ({ page }) => {
    await openScenario(page, 'routine');
    await openTransactionForm(page, 'Internet');
    await setHarness(page, { offline: true }); // tahan ack supaya race-nya pasti terjadi

    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.getByRole('button', { name: 'Tutup' }).click();
    await expectTransactionFormClosed(page);

    const dialog = await openPayDialog(page, 'Listrik PLN');
    expect((await getHarness(page)).addedTransactions).toEqual([]);
    await setHarness(page, { offline: false });
    await expect.poll(async () => (await getHarness(page)).addedTransactions.length).toBe(1);
    await page.waitForTimeout(200);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Set Lunas - Listrik PLN');
  });

  test('simpan tertunda lalu tagihan yang SAMA dibuka lagi: alur baru tidak ikut tertutup', async ({ page }) => {
    await openScenario(page, 'routine');
    await openTransactionForm(page, 'Internet');
    await setHarness(page, { addTransactionDelayMs: 1500 }); // "upload" lama, belum ada yang ditulis

    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.getByRole('button', { name: 'Tutup' }).click();
    await expectTransactionFormClosed(page);

    const dialog = await openPayDialog(page, 'Internet');
    await expect.poll(async () => (await getHarness(page)).addedTransactions.length, { timeout: 5000 }).toBe(1);
    await page.waitForTimeout(200);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Set Lunas - Internet');
  });

  test('batal di form transaksi tidak menandai lunas', async ({ page }) => {
    await openScenario(page, 'routine');
    await openTransactionForm(page, 'Internet');
    await page.getByRole('button', { name: 'Tutup' }).click();

    await expectTransactionFormClosed(page);
    await expect(page.getByText('Internet', { exact: true })).toBeVisible();
    await expect(paidChips(page)).toHaveCount(0);
    const state = await getHarness(page);
    expect(state.addedTransactions).toEqual([]);
    expect(state.writes).toEqual([]);
  });

  test('status lunas bisa dibatalkan, dialog langsung tertutup, toast menunggu ack', async ({ page }) => {
    await openScenario(page, 'routine');
    const month = await currentMonthKey(page);
    const dialog = await openPayDialog(page, 'Listrik PLN');
    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect(paidChips(page)).toHaveCount(1);
    await expect.poll(async () => (await getHarness(page)).notifications.length).toBe(1);

    await setHarness(page, { writeLatencyMs: 4000 });
    await clickExpenseRow(page, 'Listrik PLN');
    await page.getByRole('button', { name: 'Ya, Batalkan Lunas' }).click();
    await expect(page.getByText('Batalkan Status Lunas?')).toBeHidden({ timeout: 1000 });
    await expect(paidChips(page)).toHaveCount(0);
    expect((await getHarness(page)).notifications).toHaveLength(1);
    await expect.poll(async () => (await getHarness(page)).writes.at(-1), { timeout: 8000 }).toEqual({ op: 'delete', path: `${PERSONAL}/routine_expense_records/r-listrik_${month}` });
    await expect.poll(async () => (await lastNotification(page))?.message).toBe('Status lunas "Listrik PLN" telah dibatalkan.');
  });

  test('akun bersama: transaksi & tanda lunas ditulis ke koleksi shared account', async ({ page }) => {
    await openScenario(page, 'routine-shared');
    const month = await currentMonthKey(page);
    const dialog = await openPayDialog(page, 'Listrik PLN');
    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect.poll(() => writtenPaths(page)).toEqual([`set ${SHARED}/routine_expense_records/r-listrik_${month}`]);

    await openTransactionForm(page, 'Internet');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect.poll(() => writtenPaths(page)).toEqual([
      `set ${SHARED}/routine_expense_records/r-listrik_${month}`,
      `set ${SHARED}/transactions/auto`,
      `set ${SHARED}/routine_expense_records/r-internet_${month}`,
    ]);
  });

  test('dialog batal lunas: button "Ya, Batalkan Lunas" utuh (teks tidak overflow) di layar 320–412px', async ({ page }) => {
    for (const width of [320, 360, 412]) {
      await page.setViewportSize({ width, height: 740 });
      await openScenario(page, 'routine');
      const dialog = await openPayDialog(page, 'Listrik PLN');
      await dialog.getByRole('button', { name: 'Set Lunas' }).click();
      await clickExpenseRow(page, 'Listrik PLN');
      await expect(page.getByRole('button', { name: 'Ya, Batalkan Lunas' })).toBeVisible();
      await waitForAnimations(page);
      const label = `${width}px`;
      const [cancel, confirm] = (await confirmDialogLayout(page)).buttons;
      expect([cancel.textInside, confirm.textInside, cancel.insidePaper, confirm.insidePaper], label).toEqual([true, true, true, true]);
      expect(confirm.labelLines, label).toBe(1);
      expect(confirm.iconGap!, label).toBeLessThanOrEqual(8);
      expect(Math.abs(cancel.width - confirm.width), label).toBeLessThanOrEqual(0.5);
      expect(await findClippedText(page), label).toEqual([]);
    }
  });

  test('nama tagihan panjang tanpa spasi: list, Kelola, dialog Set Lunas & batal lunas tanpa overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openScenario(page, 'routine-long-name');
    const billName = page.getByText(FIXTURE_TEXT.unbrokenBillName, { exact: true });
    await expect(billName).toBeVisible();
    expect(await findClippedText(page), 'list').toEqual([]);
    const paperOverflow = () => page.locator('.MuiDialog-paper').evaluate((paper) => paper.scrollWidth - paper.clientWidth);

    await page.getByRole('button', { name: 'Kelola' }).click();
    await expect(page.getByText('Kelola Komponen Rutin')).toBeVisible();
    await waitForAnimations(page);
    expect(await findClippedText(page), 'Kelola').toEqual([]);
    expect(await paperOverflow(), 'Kelola').toBeLessThanOrEqual(0);
    await page.getByRole('button', { name: 'Tutup' }).click();
    await expect(page.locator('.MuiDialog-root')).toHaveCount(0);

    await billName.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Set Lunas - ');
    await waitForAnimations(page);
    expect(await findClippedText(page), 'Set Lunas').toEqual([]);
    expect(await paperOverflow(), 'Set Lunas').toBeLessThanOrEqual(0);
    await dialog.getByRole('button', { name: 'Set Lunas' }).click();
    await expect(page.locator('.MuiDialog-root')).toHaveCount(0);

    await billName.click();
    await expect(page.getByRole('button', { name: 'Ya, Batalkan Lunas' })).toBeVisible();
    await waitForAnimations(page);
    expect(await findClippedText(page), 'batal lunas').toEqual([]);
    expect(await paperOverflow(), 'batal lunas').toBeLessThanOrEqual(0);
  });

  test.describe('jalur gagal (console.error memang disengaja)', () => {
    test.use({ allowedConsoleMessages: [/Failed to (mark routine expense as paid|unmark routine expense|save transaction and mark paid)/] });

    // Kegagalan "Lunas + catat" wajib meninggalkan jejak di console untuk debugging.
    const watchSaveFailureLog = (page: Page) => {
      const logged: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && message.text().includes('Failed to save transaction and mark paid')) logged.push(message.text());
      });
      return logged;
    };

    test('Set Lunas ditolak server: status lunas batal lagi, tanpa toast "berhasil"', async ({ page }) => {
      await openScenario(page, 'routine');
      await setHarness(page, { failSetDocPathIncludes: 'routine_expense_records' });
      const dialog = await openPayDialog(page, 'Listrik PLN');
      await dialog.getByRole('button', { name: 'Set Lunas' }).click();

      await expect.poll(async () => (await lastNotification(page))?.type).toBe('error');
      await expect(paidChips(page)).toHaveCount(0);
      expect((await getHarness(page)).notifications.map((n) => n.type)).toEqual(['error']);
    });

    test('batal lunas ditolak server: status lunas kembali dan user diberi tahu', async ({ page }) => {
      await openScenario(page, 'routine');
      const dialog = await openPayDialog(page, 'Listrik PLN');
      await dialog.getByRole('button', { name: 'Set Lunas' }).click();
      await expect.poll(async () => (await getHarness(page)).notifications.length).toBe(1);

      await setHarness(page, { failDeletePathIncludes: 'routine_expense_records' });
      await clickExpenseRow(page, 'Listrik PLN');
      await page.getByRole('button', { name: 'Ya, Batalkan Lunas' }).click();
      await expect.poll(async () => (await lastNotification(page))?.type).toBe('error');
      await expect(paidChips(page)).toHaveCount(1);
      expect((await getHarness(page)).notifications.map((n) => n.type)).toEqual(['success', 'error']);
    });

    test('tanda lunas ditolak server: transaksi ikut tidak tersimpan (atomic), form tetap terbuka untuk dicoba lagi', async ({ page }) => {
      await openScenario(page, 'routine');
      const month = await currentMonthKey(page);
      await openTransactionForm(page, 'Internet');
      await setHarness(page, { failSetDocPathIncludes: 'routine_expense_records' });
      const failureLog = watchSaveFailureLog(page);

      await page.getByRole('button', { name: 'Simpan' }).click();
      await expect.poll(async () => (await lastNotification(page))?.type).toBe('error');
      await expect(page.getByRole('button', { name: 'Simpan' })).toBeVisible();
      await expect.poll(() => failureLog.length).toBe(1);
      let state = await getHarness(page);
      expect(state.addedTransactions).toEqual([]);
      expect(state.writes).toEqual([]);
      expect(state.failedWrites.map((write) => write.path.replace(/auto_[a-z0-9]+$/, 'auto'))).toEqual([
        `${PERSONAL}/transactions/auto`,
        `${PERSONAL}/routine_expense_records/r-internet_${month}`,
      ]);
      await expect(paidChips(page)).toHaveCount(0);

      await setHarness(page, { failSetDocPathIncludes: null });
      await page.getByRole('button', { name: 'Simpan' }).click();
      await expectTransactionFormClosed(page);
      await expect(paidChips(page)).toHaveCount(1);
      state = await getHarness(page);
      expect(state.addedTransactions).toHaveLength(1);
    });

    test('transaksi gagal sebelum tersimpan: form tetap terbuka, tidak ada yang ditulis, retry tidak dobel', async ({ page }) => {
      await openScenario(page, 'routine');
      await openTransactionForm(page, 'Internet');

      await setHarness(page, { failAddTransaction: true });
      const failureLog = watchSaveFailureLog(page);
      await page.getByRole('button', { name: 'Simpan' }).click();
      await expect.poll(async () => (await lastNotification(page))?.type).toBe('error');
      await expect(page.getByRole('button', { name: 'Simpan' })).toBeVisible();
      await expect.poll(() => failureLog.length).toBe(1);
      expect((await getHarness(page)).writes).toEqual([]);
      await expect(paidChips(page)).toHaveCount(0);

      await setHarness(page, { failAddTransaction: false });
      await page.getByRole('button', { name: 'Simpan' }).click();
      await expectTransactionFormClosed(page);
      await expect(paidChips(page)).toHaveCount(1);
      expect((await getHarness(page)).addedTransactions).toHaveLength(1);
    });
  });
});


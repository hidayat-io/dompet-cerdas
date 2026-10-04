import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { FIXED_TODAY, findClippedText, getHarness, installVisualViewportMock, openScenario, setVisualViewport, waitForAnimations } from './helpers';
import { FIXTURE_TEXT } from './fixtureText';

// Elemen sheet & area scroll dicari lewat struktur DOM, bukan test id, supaya
// test tidak menuntut perubahan markup produksi.
const sheetMetrics = (page: Page) =>
  page.evaluate(() => {
    const save = [...document.querySelectorAll('button')].find((button) => /^(Simpan|Update|Menyimpan\.\.\.)$/.test(button.textContent?.trim() ?? ''));
    if (!save) throw new Error('button simpan tidak ditemukan');
    let sheet: HTMLElement | null = save.parentElement;
    while (sheet && getComputedStyle(sheet).position !== 'fixed') sheet = sheet.parentElement;
    if (!sheet) throw new Error('sheet tidak ditemukan');
    const scroller = [...sheet.querySelectorAll<HTMLElement>('div')].find((el) => getComputedStyle(el).overflowY === 'auto');
    if (!scroller) throw new Error('area scroll tidak ditemukan');
    const bar = save.parentElement as HTMLElement;
    const saveRect = save.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    return {
      innerHeight: window.innerHeight,
      saveTop: saveRect.top,
      saveBottom: saveRect.bottom,
      sheetTop: sheetRect.top,
      sheetBottom: sheetRect.bottom,
      sheetCssBottom: getComputedStyle(sheet).bottom,
      sheetRadius: getComputedStyle(sheet).borderTopLeftRadius,
      scrollerTop: scrollerRect.top,
      scrollerBottom: scrollerRect.bottom,
      scrollerScrollTop: scroller.scrollTop,
      scrollerScrollable: scroller.scrollHeight > scroller.clientHeight,
      scrollerHorizontalOverflow: scroller.scrollWidth - scroller.clientWidth,
      scrollerOverscroll: getComputedStyle(scroller).overscrollBehaviorY,
      barPaddingBottom: getComputedStyle(bar).paddingBottom,
    };
  });

// Tinggi header (judul + button tutup) dan apakah judulnya terpotong oleh header.
const headerMetrics = (page: Page) =>
  page.evaluate(() => {
    const title = [...document.querySelectorAll('h6')].find((el) => /^(Catat|Edit|Detail) Transaksi$/.test(el.textContent ?? ''));
    if (!title) throw new Error('judul sheet tidak ditemukan');
    const header = title.parentElement as HTMLElement;
    const titleRect = title.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    return {
      titleHeight: titleRect.height,
      headerHeight: headerRect.height,
      titleInsideHeader: titleRect.top >= headerRect.top - 0.5 && titleRect.bottom <= headerRect.bottom + 0.5,
    };
  });

// Chip kategori: label yang keluar dari kotak chip-nya (mis. tinggi chip tidak ikut label yang wrap),
// dan label multi-baris yang menempel ke tepi atas/bawah chip (< 4px).
const chipLabelProblems = (page: Page) =>
  page.evaluate(() => {
    const chips = [...document.querySelectorAll<HTMLElement>('.MuiChip-root')];
    const problems: string[] = [];
    chips.forEach((chip) => {
      const label = chip.querySelector<HTMLElement>('.MuiChip-label');
      if (!label) return;
      const chipRect = chip.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(label);
      const text = range.getBoundingClientRect();
      if (text.top < chipRect.top - 0.5 || text.bottom > chipRect.bottom + 0.5 || text.left < chipRect.left - 0.5 || text.right > chipRect.right + 0.5) {
        problems.push(`[keluar chip] ${label.textContent}`);
      } else if (text.height > parseFloat(getComputedStyle(label).lineHeight) * 1.5
        && (text.top - chipRect.top < 4 || chipRect.bottom - text.bottom < 4)) {
        problems.push(`[rapat] ${label.textContent}`);
      }
    });
    return { count: chips.length, problems };
  });

// Teks label grid "Semua kategori" yang keluar dari tile-nya sendiri (overflow menimpa tile sebelah).
// findClippedText tidak menangkap ini karena teksnya tidak dipotong, hanya bertumpuk.
const gridLabelsOutsideTile = (page: Page) =>
  page.evaluate(() => {
    const header = [...document.querySelectorAll('span')].find((el) => el.textContent === 'Semua kategori');
    const grid = header?.parentElement?.nextElementSibling;
    if (!grid) throw new Error('grid kategori tidak ditemukan');
    const tiles = [...grid.querySelectorAll<HTMLElement>(':scope > button')];
    const outside = tiles
      .filter((tile) => {
        const range = document.createRange();
        range.selectNodeContents(tile.lastElementChild!);
        const text = range.getBoundingClientRect();
        const box = tile.getBoundingClientRect();
        return text.left < box.left - 0.5 || text.right > box.right + 0.5 || text.bottom > box.bottom + 0.5;
      })
      .map((tile) => tile.lastElementChild?.textContent);
    return { count: tiles.length, outside };
  });

// Label grid per nama: jumlah baris, ukuran font, dan jumlah kolom grid.
const gridLabelLayout = (page: Page) =>
  page.evaluate(() => {
    const header = [...document.querySelectorAll('span')].find((el) => el.textContent === 'Semua kategori');
    const grid = header?.parentElement?.nextElementSibling as HTMLElement | null | undefined;
    if (!grid) throw new Error('grid kategori tidak ditemukan');
    const labels = Object.fromEntries([...grid.querySelectorAll<HTMLElement>(':scope > button > :last-child')].map((label) => {
      const style = getComputedStyle(label);
      return [label.textContent ?? '', {
        lines: Math.round(label.getBoundingClientRect().height / parseFloat(style.lineHeight)),
        fontSize: parseFloat(style.fontSize),
      }];
    }));
    return { columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, labels };
  });

const scrollSheetContentTo = (page: Page, position: 'top' | 'bottom') =>
  page.evaluate((target) => {
    const scroller = [...document.querySelectorAll<HTMLElement>('div')].find((el) => getComputedStyle(el).overflowY === 'auto');
    if (!scroller) throw new Error('area scroll tidak ditemukan');
    scroller.scrollTop = target === 'top' ? 0 : scroller.scrollHeight;
  }, position);

const nextFrames = (page: Page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

// Elemen (input) harus terlihat utuh di area konten sheet (tidak tertutup header/bar Simpan).
const expectFullyVisibleInContent = async (page: Page, locator: Locator, label = '') => {
  await expect.poll(async () => {
    const metrics = await sheetMetrics(page);
    const box = await locator.boundingBox();
    return !!box && box.y >= metrics.scrollerTop - 1 && box.y + box.height <= metrics.scrollerBottom + 1;
  }, { message: `input tidak terlihat utuh ${label}` }).toBe(true);
};

// Gulir area konten (seperti user) sampai elemen berada persis di tepi bawah area terlihat.
const placeElementAtContentBottom = async (page: Page, locator: Locator, gap = 2) => {
  await locator.evaluate((element, gapPx) => {
    const scroller = [...document.querySelectorAll<HTMLElement>('div')].find((el) => getComputedStyle(el).overflowY === 'auto')!;
    scroller.scrollTop += element.getBoundingClientRect().bottom - (scroller.getBoundingClientRect().bottom - gapPx);
  }, gap);
  await nextFrames(page);
};


// Tunggu frame dulu: pengukuran hook jalan di requestAnimationFrame, jadi tanpa ini poll
// bisa lolos memakai nilai lama kalau posisi yang diharapkan kebetulan sama dengan sebelumnya.
const openKeyboard = async (page: Page, height: number, offsetTop = 0) => {
  const innerHeight = await page.evaluate(() => window.innerHeight);
  await setVisualViewport(page, { height, offsetTop });
  await nextFrames(page);
  const expectedBottom = Math.max(0, innerHeight - height - offsetTop);
  await expect.poll(async () => (await sheetMetrics(page)).sheetCssBottom).toBe(`${expectedBottom}px`);
  await nextFrames(page);
};

test.describe('Quick add sheet', () => {
  test('detail tanggal & lampiran langsung tampil, tanpa button toggle', async ({ page }) => {
    await openScenario(page, 'quick-add');

    await expect(page.getByLabel('Tanggal')).toBeVisible();
    await expect(page.getByText('Tambah foto atau PDF')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tambah detail|Sembunyikan detail/ })).toHaveCount(0);
  });

  test('ikon "Sering dipakai" dan "Semua kategori" berukuran sama (kecil)', async ({ page }) => {
    await openScenario(page, 'quick-add');

    const sizes = await page.evaluate(() => {
      const measure = (badge: Element) => {
        const rect = badge.getBoundingClientRect();
        const glyph = badge.querySelector('span');
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          glyphFontSize: glyph ? getComputedStyle(glyph).fontSize : null,
        };
      };
      const chipIcons = [...document.querySelectorAll('.MuiChip-root > .MuiChip-icon')];
      const allHeader = [...document.querySelectorAll('span')].find((el) => el.textContent === 'Semua kategori');
      const grid = allHeader?.parentElement?.nextElementSibling;
      const gridBadges = grid ? [...grid.querySelectorAll(':scope > button > div:first-child')] : [];
      return {
        chip: chipIcons.map(measure),
        chipMarginLeft: chipIcons[0] ? getComputedStyle(chipIcons[0]).marginLeft : null,
        chipIconClasses: chipIcons.map((icon) => icon.className),
        grid: gridBadges.map(measure),
      };
    });

    expect(sizes.chip.length).toBeGreaterThan(0);
    expect(sizes.grid.length).toBeGreaterThan(0);
    for (const badge of [...sizes.chip, ...sizes.grid]) {
      expect(badge).toEqual({ width: 24, height: 24, glyphFontSize: '14px' });
    }
    // className MuiChip-icon harus tetap sampai ke badge supaya spacing chip tidak berubah.
    expect(sizes.chipMarginLeft).toBe('5px');
    // Warna badge tidak boleh terbaca Chip sebagai prop `color` (muncul class MuiChip-iconColor#xxxxxx).
    for (const className of sizes.chipIconClasses) expect(className).not.toContain('#');
  });

  test('button Simpan selalu terlihat di bawah, termasuk saat konten di-scroll', async ({ page }) => {
    await openScenario(page, 'quick-add');
    const save = page.getByRole('button', { name: 'Simpan' });

    await expect(save).toBeInViewport({ ratio: 1 });
    const initial = await sheetMetrics(page);
    expect(initial.sheetCssBottom).toBe('0px');
    expect(initial.saveBottom).toBeLessThanOrEqual(initial.innerHeight);
    expect(initial.scrollerScrollable).toBe(true);

    await scrollSheetContentTo(page, 'bottom');
    await expect(save).toBeInViewport({ ratio: 1 });
    await expect(page.getByLabel('Tanggal')).toBeInViewport();
    const scrolled = await sheetMetrics(page);
    // Button tidak ikut ter-scroll dan tidak menimpa area konten.
    expect(scrolled.saveTop).toBe(initial.saveTop);
    expect(scrolled.scrollerBottom).toBeLessThanOrEqual(scrolled.saveTop);
  });

  test('semua input di sheet ≥16px supaya iOS tidak auto-zoom (zoom membuat sheet tidak lagi diangkat ke atas keyboard)', async ({ page }) => {
    await openScenario(page, 'quick-add');
    const fontSizes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>('input:not([type=file])')].map((input) => parseFloat(getComputedStyle(input).fontSize))
    );
    expect(fontSizes.length).toBeGreaterThanOrEqual(3);
    for (const size of fontSizes) expect(size).toBeGreaterThanOrEqual(16);
  });

  test('header (judul + button tutup) tidak menyusut atau terpotong walau isi form panjang', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const scenario of ['quick-add', 'quick-add-edit', 'quick-add-conflict']) {
      await openScenario(page, scenario);
      expect((await sheetMetrics(page)).scrollerScrollable, scenario).toBe(true);
      const header = await headerMetrics(page);
      expect(header.titleInsideHeader, scenario).toBe(true);
      expect(header.headerHeight, scenario).toBeGreaterThanOrEqual(header.titleHeight + 16 - 0.5);
      const offenders = await findClippedText(page);
      expect(offenders.filter((text) => /Transaksi|Simpan|Update/.test(text)), scenario).toEqual([]);
    }
  });

  test('nama kategori panjang di grid tidak membuat sheet overflow ke samping', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await openScenario(page, 'quick-add');
    await expect(page.getByText('Semua kategori')).toBeVisible();
    expect((await sheetMetrics(page)).scrollerHorizontalOverflow).toBeLessThanOrEqual(0);
  });

  test('nama kategori di "Sering dipakai" & "Semua kategori" tampil penuh (tidak terpotong) di layar 280–412px', async ({ page }) => {
    for (const width of [280, 320, 360, 412]) {
      await page.setViewportSize({ width, height: 740 });
      await openScenario(page, 'quick-add');
      expect(await findClippedText(page), `${width}px`).toEqual([]);
      expect((await sheetMetrics(page)).scrollerHorizontalOverflow, `${width}px`).toBeLessThanOrEqual(0);
      const chips = await chipLabelProblems(page);
      expect(chips.count, `${width}px`).toBeGreaterThan(0);
      expect(chips.problems, `${width}px`).toEqual([]);
      const tiles = await gridLabelsOutsideTile(page);
      expect(tiles.count, `${width}px`).toBeGreaterThan(0);
      expect(tiles.outside, `${width}px`).toEqual([]);
      // Chip bernama pendek tetap setinggi semula (40px); hanya nama panjang yang menambah tinggi.
      const shortChip = page.locator('.MuiChip-root').filter({ has: page.locator('.MuiChip-label', { hasText: /^Belanja$/ }) });
      expect((await shortChip.boundingBox())?.height, `${width}px`).toBe(40);
    }
  });

  test('chip bernama panjang (multi-baris) tidak berubah ukuran saat dipilih', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openScenario(page, 'quick-add');
    const longChip = page.locator('.MuiChip-root').filter({ has: page.locator('.MuiChip-label', { hasText: FIXTURE_TEXT.longCategory }) });
    const before = await longChip.boundingBox();
    expect(before!.height).toBeGreaterThan(40);
    await longChip.click();
    await expect(longChip).toHaveCSS('border-top-color', /^rgb\(/);
    const after = await longChip.boundingBox();
    expect({ width: after!.width, height: after!.height }).toEqual({ width: before!.width, height: before!.height });
  });

  test('nama kategori satu kata panjang tanpa spasi (chip & grid) tetap utuh tanpa overflow', async ({ page }) => {
    for (const width of [320, 412]) {
      await page.setViewportSize({ width, height: 740 });
      await openScenario(page, 'quick-add-long-names');
      await expect(page.locator('.MuiChip-label', { hasText: FIXTURE_TEXT.unbrokenCategory })).toBeVisible();
      await expect(page.getByText(FIXTURE_TEXT.unbrokenGridCategory)).toBeVisible();
      expect(await findClippedText(page), `${width}px`).toEqual([]);
      expect((await chipLabelProblems(page)).problems, `${width}px`).toEqual([]);
      expect((await gridLabelsOutsideTile(page)).outside, `${width}px`).toEqual([]);
      expect((await sheetMetrics(page)).scrollerHorizontalOverflow, `${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test('nama kategori umum di grid tetap satu baris di layar 320px; nama panjang di-wrap utuh', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openScenario(page, 'quick-add');
    const { labels } = await gridLabelLayout(page);
    expect(labels['Pendidikan'].lines).toBe(1);
    expect(labels['Kesehatan'].lines).toBe(1);
    expect(labels[FIXTURE_TEXT.longGridCategory].lines).toBeGreaterThan(1);
  });

  test('nama kategori dengan "/" (mis. "Sumbangan/Donasi") hanya pecah setelah "/", tidak di tengah kata', async ({ page }) => {
    for (const width of [280, 320, 360, 412]) {
      await page.setViewportSize({ width, height: 740 });
      await openScenario(page, 'quick-add-long-names');
      const breaks = await page.evaluate((names: string[]) => {
        const header = [...document.querySelectorAll('span')].find((el) => el.textContent === 'Semua kategori');
        const grid = header?.parentElement?.nextElementSibling;
        if (!grid) throw new Error('grid kategori tidak ditemukan');
        const result: Record<string, string[]> = {};
        grid.querySelectorAll<HTMLElement>(':scope > button > :last-child').forEach((label) => {
          const name = label.textContent ?? '';
          if (!names.includes(name)) return;
          // Posisi vertikal tiap karakter → indeks tempat baris baru dimulai.
          const chars: Array<{ ch: string; top: number }> = [];
          const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
            for (let index = 0; index < node.length; index += 1) {
              const range = document.createRange();
              range.setStart(node, index);
              range.setEnd(node, index + 1);
              const rect = range.getClientRects()[0];
              if (rect) chars.push({ ch: node.data[index], top: rect.top });
            }
          }
          result[name] = chars
            .map((char, index) => ({ index, lineStart: index > 0 && char.top > chars[index - 1].top + 2 }))
            .filter(({ index, lineStart }) => lineStart && !['/', ' '].includes(chars[index - 1].ch) && chars[index].ch !== ' ')
            .map(({ index }) => `${name.slice(0, index)}|${name.slice(index)}`);
        });
        return result;
      }, [...FIXTURE_TEXT.slashCategories] as string[]);
      for (const name of FIXTURE_TEXT.slashCategories) {
        expect(breaks[name], `${name} @${width}px`).toEqual([]);
      }
      // Ukuran font dihitung dari segmen terpanjang (dipisah spasi atau "/"), bukan seluruh nama.
      if (width < 360) {
        const { labels } = await gridLabelLayout(page);
        expect(labels['Zakat/Infaq/Sedekah'].fontSize, `${width}px`).toBe(11);
      }
    }
  });

  test('nama kategori satu kata yang panjang (11–14 huruf) tidak pecah di tengah kata, 280–412px', async ({ page }) => {
    for (const [width, columns, fontSize] of [[280, 2, 10], [320, 3, 10], [360, 3, 12], [412, 3, 12]] as const) {
      await page.setViewportSize({ width, height: 740 });
      await openScenario(page, 'quick-add-long-names');
      const layout = await gridLabelLayout(page);
      expect(layout.columns, `${width}px`).toBe(columns);
      for (const name of FIXTURE_TEXT.longWordCategories) {
        expect(layout.labels[name].lines, `${name} @${width}px`).toBe(1);
      }
      // Font hanya dikecilkan di layar < 360px; kata ≥13 huruf paling kecil (10px).
      expect(layout.labels['Telekomunikasi'].fontSize, `${width}px`).toBe(fontSize);
    }
  });

  test('read-only: chip & tile kategori sama-sama tampil pudar (disabled)', async ({ page }) => {
    await openScenario(page, 'quick-add-readonly');
    const opacities = await page.evaluate(() => {
      const chip = document.querySelector<HTMLElement>('.MuiChip-root');
      const header = [...document.querySelectorAll('span')].find((el) => el.textContent === 'Semua kategori');
      const tile = header?.parentElement?.nextElementSibling?.querySelector<HTMLElement>(':scope > button');
      if (!chip || !tile) throw new Error('chip/tile tidak ditemukan');
      return { chip: getComputedStyle(chip).opacity, tile: getComputedStyle(tile).opacity };
    });
    expect(opacities.chip).toBe('0.38');
    expect(opacities.tile).toBe(opacities.chip);
  });

  test('lampiran tersimpan bernama panjang: sheet tidak overflow ke samping, button hapus lampiran tetap di layar', async ({ page }) => {
    for (const width of [320, 360, 412]) {
      await page.setViewportSize({ width, height: 740 });
      for (const scenario of ['quick-add-edit-attachment', 'quick-add-readonly-attachment']) {
        const label = `${scenario} @${width}px`;
        await openScenario(page, scenario);
        await expect(page.getByText(FIXTURE_TEXT.longFileName), label).toBeVisible();
        await scrollSheetContentTo(page, 'bottom');
        expect((await sheetMetrics(page)).scrollerHorizontalOverflow, label).toBeLessThanOrEqual(0);
        const dateBox = await page.getByLabel('Tanggal').boundingBox();
        expect(dateBox!.x + dateBox!.width, label).toBeLessThanOrEqual(width);
        // Nama file tampil utuh (wrap), tidak di-ellipsis.
        expect(await findClippedText(page), label).toEqual([]);
        if (scenario === 'quick-add-edit-attachment') {
          await expect(page.getByRole('button', { name: 'Hapus lampiran' }), label).toBeInViewport({ ratio: 1 });
        }
      }
    }
  });

  test('read-only tanpa lampiran: tidak ada baris lampiran kosong (jarak Tanggal ke bar sama seperti biasa)', async ({ page }) => {
    await openScenario(page, 'quick-add-readonly');
    await scrollSheetContentTo(page, 'bottom');
    const metrics = await sheetMetrics(page);
    const dateField = await page.getByLabel('Tanggal').evaluate((input) => input.closest('.MuiFormControl-root')!.getBoundingClientRect().bottom);
    // Jarak = padding bawah area konten (16px) saja, tanpa tambahan gap grid untuk baris kosong.
    expect(metrics.scrollerBottom - dateField).toBeLessThanOrEqual(16.5);
  });

  test('dialog conflict: catatan panjang tanpa spasi tidak membuat dialog overflow ke samping', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openScenario(page, 'quick-add-conflict-unbroken');
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Versi Transaksi Berubah')).toBeVisible();
    await waitForAnimations(page);
    expect(await findClippedText(page)).toEqual([]);
    expect(await page.locator('.MuiDialog-paper').evaluate((paper) => paper.scrollWidth - paper.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('dialog hapus transaksi: catatan panjang tanpa spasi tidak membuat dialog overflow ke samping', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openScenario(page, 'quick-add-conflict-unbroken');
    await page.getByRole('button', { name: 'Hapus Transaksi' }).click();
    await expect(page.getByText('Apakah Anda yakin ingin menghapus transaksi ini?')).toBeVisible();
    await waitForAnimations(page);
    expect(await findClippedText(page)).toEqual([]);
    expect(await page.locator('.MuiDialog-paper').evaluate((paper) => paper.scrollWidth - paper.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('lampiran baru bernama panjang tanpa spasi tampil penuh tanpa overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openScenario(page, 'quick-add');
    await page.locator('input[type=file][accept="image/*,application/pdf"]').setInputFiles({
      name: FIXTURE_TEXT.longUnbrokenFileName,
      mimeType: 'image/jpeg',
      buffer: Buffer.from('harness'),
    });
    await expect(page.getByText(`Lampiran: ${FIXTURE_TEXT.longUnbrokenFileName}`)).toBeVisible();
    await scrollSheetContentTo(page, 'bottom');
    expect((await sheetMetrics(page)).scrollerHorizontalOverflow).toBeLessThanOrEqual(0);
    expect(await findClippedText(page)).toEqual([]);
  });

  test('scroll konten sheet tidak merambat ke halaman di belakang', async ({ page }) => {
    await openScenario(page, 'quick-add');
    expect((await sheetMetrics(page)).scrollerOverscroll).toBe('contain');
  });

  test('sheet yang dibuka saat keyboard sudah terbuka langsung berada di atas keyboard', async ({ page }) => {
    const viewport = page.viewportSize()!;
    const height = Math.round(viewport.height * 0.55);
    await installVisualViewportMock(page, { height, offsetTop: 0 });
    await openScenario(page, 'quick-add');
    const metrics = await sheetMetrics(page);
    expect(metrics.sheetCssBottom).toBe(`${viewport.height - height}px`);
    expect(metrics.saveBottom).toBeLessThanOrEqual(height);
  });

  test.describe('keyboard virtual (visualViewport disimulasikan)', () => {
    test.beforeEach(async ({ page }) => {
      await installVisualViewportMock(page);
    });

    test('saat keyboard terbuka, sheet naik sehingga Simpan tetap di atas keyboard dan bisa ditekan', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const save = page.getByRole('button', { name: 'Simpan' });
      const description = page.getByLabel('Catatan / Keterangan *');

      await page.getByRole('textbox').first().fill('50000');
      await description.fill('Bensin');
      await description.focus();
      const { innerHeight } = await sheetMetrics(page);
      const keyboardTop = Math.round(innerHeight * 0.55);

      await openKeyboard(page, keyboardTop);
      const opened = await sheetMetrics(page);
      expect(opened.saveBottom).toBeLessThanOrEqual(keyboardTop);
      expect(opened.sheetTop).toBeGreaterThanOrEqual(0);
      // Input yang sedang fokus tetap terlihat di area konten, tidak tertutup button.
      const descriptionBox = await description.boundingBox();
      expect(descriptionBox).not.toBeNull();
      expect(descriptionBox!.y).toBeGreaterThanOrEqual(opened.scrollerTop - 1);
      expect(descriptionBox!.y + descriptionBox!.height).toBeLessThanOrEqual(opened.scrollerBottom + 1);

      // Browser yang menggeser visual viewport (offsetTop) juga diperhitungkan:
      // tepi bawah sheet harus PERSIS di tepi bawah visual viewport (offsetTop + height).
      const panned = { height: keyboardTop - 100, offsetTop: 40 };
      await openKeyboard(page, panned.height, panned.offsetTop);
      const pannedMetrics = await sheetMetrics(page);
      expect(pannedMetrics.saveBottom).toBeLessThanOrEqual(panned.offsetTop + panned.height);
      expect(pannedMetrics.sheetTop).toBeGreaterThanOrEqual(panned.offsetTop);

      // Button bisa langsung ditekan selagi keyboard terbuka.
      await save.click();
      await expect.poll(async () => (await getHarness(page)).addedTransactions.length).toBe(1);

      // Keyboard ditutup: sheet kembali menempel di bawah.
      await setVisualViewport(page, null);
      await expect.poll(async () => (await sheetMetrics(page)).sheetCssBottom).toBe('0px');
      await expect(save).toBeInViewport({ ratio: 1 });
    });

    test('field bawah (Tanggal) yang fokus tetap terlihat setelah sheet memendek', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const dateInput = page.getByLabel('Tanggal');

      await dateInput.focus();
      const { innerHeight } = await sheetMetrics(page);
      await openKeyboard(page, Math.round(innerHeight * 0.55));

      const opened = await sheetMetrics(page);
      await expect.poll(async () => {
        const box = await dateInput.boundingBox();
        return !!box && box.y >= opened.scrollerTop - 1 && box.y + box.height <= opened.scrollerBottom + 1;
      }).toBe(true);
    });

    test('keyboard ditutup lalu dibuka lagi: field fokus (Tanggal) tetap digulir ke area terlihat', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const dateInput = page.getByLabel('Tanggal');
      await dateInput.focus();
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      await openKeyboard(page, height);
      await setVisualViewport(page, null);
      await expect.poll(async () => (await sheetMetrics(page)).sheetCssBottom).toBe('0px');

      await scrollSheetContentTo(page, 'top');
      await openKeyboard(page, height);
      const opened = await sheetMetrics(page);
      await expect.poll(async () => {
        const box = await dateInput.boundingBox();
        return !!box && box.y >= opened.scrollerTop - 1 && box.y + box.height <= opened.scrollerBottom + 1;
      }).toBe(true);
    });

    test('input yang sudah terlihat tidak ikut digulir saat keyboard muncul', async ({ page }) => {
      await openScenario(page, 'quick-add');
      await page.getByLabel('Catatan / Keterangan *').focus();
      const { innerHeight } = await sheetMetrics(page);
      await openKeyboard(page, Math.round(innerHeight * 0.55));
      expect((await sheetMetrics(page)).scrollerScrollTop).toBe(0);
    });

    test('offsetTop yang diperbarui belakangan tanpa event (bug WebKit) tetap terkoreksi', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      await page.evaluate((value) => {
        const host = window as unknown as {
          __setVisualViewport: (next: unknown) => void;
          __setVisualViewportSilently: (next: unknown) => void;
        };
        host.__setVisualViewport({ height: value, offsetTop: 0 });
        setTimeout(() => host.__setVisualViewportSilently({ height: value, offsetTop: 60 }), 50);
      }, height);
      await expect.poll(async () => (await sheetMetrics(page)).sheetCssBottom, { timeout: 3000 }).toBe(`${innerHeight - height - 60}px`);
    });

    test('scroll manual user tidak ditarik balik saat visual viewport cuma bergeser/berubah sedikit', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      await description.focus();
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      await openKeyboard(page, height);

      // User menggulir konten ke bawah untuk memilih kategori, fokus masih di Catatan.
      await scrollSheetContentTo(page, 'bottom');
      await nextFrames(page);
      const scrolledTop = (await sheetMetrics(page)).scrollerScrollTop;
      expect(scrolledTop).toBeGreaterThan(0);

      // Perubahan kecil (bar saran keyboard muncul, < 48px): scroll user tidak ditarik balik.
      for (const shrink of [30, 47]) {
        await openKeyboard(page, height - shrink);
        await nextFrames(page);
        expect((await sheetMetrics(page)).scrollerScrollTop, `menyusut ${shrink}px`).toBe(scrolledTop);
      }

      // Keyboard membesar jauh: input fokus digulir lagi ke area terlihat.
      await openKeyboard(page, height - 120);
      const metrics = await sheetMetrics(page);
      await expect.poll(async () => {
        const box = await description.boundingBox();
        return !!box && box.y >= metrics.scrollerTop - 1 && box.y + box.height <= metrics.scrollerBottom + 1;
      }).toBe(true);
    });

    test('iOS: visual viewport tergeser mentok bawah tetap dianggap keyboard terbuka', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      const offsetTop = innerHeight - height;

      await openKeyboard(page, height, offsetTop); // bottomInset = 0 padahal keyboard terbuka
      const metrics = await sheetMetrics(page);
      expect(metrics.sheetCssBottom).toBe('0px');
      // Sheet dipendekkan ke tinggi visual viewport: header tidak tersembunyi di atas layar terlihat.
      expect(metrics.sheetTop).toBeGreaterThanOrEqual(offsetTop);
      expect(metrics.barPaddingBottom).toBe('12px');
    });

    test('posisi bawah sheet tidak pernah negatif', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const { innerHeight } = await sheetMetrics(page);
      await setVisualViewport(page, { height: innerHeight - 100, offsetTop: 200 });
      await nextFrames(page);
      expect((await sheetMetrics(page)).sheetCssBottom).toBe('0px');
    });

    test('layar sangat pendek (landscape + keyboard): Simpan tetap utuh di atas keyboard', async ({ page }) => {
      await openScenario(page, 'quick-add');
      await openKeyboard(page, 150);
      const metrics = await sheetMetrics(page);
      expect(metrics.saveTop).toBeGreaterThanOrEqual(metrics.sheetTop);
      expect(metrics.saveBottom).toBeLessThanOrEqual(150);
      expect(metrics.sheetTop).toBeGreaterThanOrEqual(0);
    });

    test('layar pendek (180px) + keyboard: input yang sedang diketik tetap terlihat utuh', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      await description.focus();
      await openKeyboard(page, 180);
      const metrics = await sheetMetrics(page);
      const box = await description.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(metrics.scrollerTop - 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(metrics.scrollerBottom + 1);
      expect(metrics.saveBottom).toBeLessThanOrEqual(180.5);
    });

    test('layar ekstrem pendek (110px): button Simpan/Update tetap utuh, header disembunyikan (tidak terpotong)', async ({ page }) => {
      for (const scenario of ['quick-add', 'quick-add-edit']) {
        await openScenario(page, scenario);
        await openKeyboard(page, 110);
        const metrics = await sheetMetrics(page);
        expect(metrics.saveBottom, scenario).toBeLessThanOrEqual(110.5);
        expect(metrics.saveTop, scenario).toBeGreaterThanOrEqual(-0.5);
        await expect(page.getByRole('heading', { name: /Transaksi$/ }), scenario).toHaveCount(0);
        await setVisualViewport(page, null);
      }
    });

    test('layar sangat pendek (150px) + keyboard: header disembunyikan sampai keyboard ditutup, input yang diketik tetap utuh', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      const title = page.getByRole('heading', { name: 'Catat Transaksi' });
      await description.focus();
      await openKeyboard(page, 150);
      await expect(title).toHaveCount(0);
      await expectFullyVisibleInContent(page, description);

      // Keyboard memendek tapi masih terbuka: header TIDAK muncul lagi (konten tidak bergeser).
      await openKeyboard(page, 400);
      await expect(title).toHaveCount(0);
      await expectFullyVisibleInContent(page, description);

      await setVisualViewport(page, null);
      await expect(title).toBeInViewport({ ratio: 1 });
      // Sesi keyboard baru dengan ruang cukup: header tampil.
      await openKeyboard(page, 400);
      await expect(title).toBeInViewport({ ratio: 1 });
    });

    test('ambang header: area terlihat 200px → header disembunyikan, 230px → tetap tampil', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const title = page.getByRole('heading', { name: 'Catat Transaksi' });
      await openKeyboard(page, 200);
      await expect(title).toHaveCount(0);
      await setVisualViewport(page, null);
      await expect(title).toBeVisible();
      await openKeyboard(page, 230);
      await expect(title).toBeInViewport({ ratio: 1 });
    });

    test('header tersembunyi lalu keyboard memendek: input di tepi bawah tidak tertutup bar Simpan', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      await description.focus();
      await openKeyboard(page, 210);
      await placeElementAtContentBottom(page, description);
      await expectFullyVisibleInContent(page, description);

      await openKeyboard(page, 240);
      await expect(page.getByRole('heading', { name: 'Catat Transaksi' })).toHaveCount(0);
      await expectFullyVisibleInContent(page, description);
    });

    test('area terlihat menyusut sedikit (< 48px): input fokus yang tertutup tetap digulir lagi', async ({ page }) => {
      for (const [from, to] of [[150, 110], [180, 140]] as const) {
        await openScenario(page, 'quick-add');
        const description = page.getByLabel('Catatan / Keterangan *');
        await description.focus();
        await openKeyboard(page, from);
        await expectFullyVisibleInContent(page, description);
        await openKeyboard(page, to);
        await expectFullyVisibleInContent(page, description, `${from}→${to}px`);
      }
    });

    test('dibuka langsung di 110px: bar Simpan dipadatkan sehingga input setinggi 40px muat utuh', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      await description.focus();
      await openKeyboard(page, 110);
      await expectFullyVisibleInContent(page, description);
      const metrics = await sheetMetrics(page);
      expect(metrics.saveBottom).toBeLessThanOrEqual(110.5);
      expect(metrics.saveTop).toBeGreaterThanOrEqual(-0.5);
    });

    test('input yang di-scroll keluar lalu di-scroll balik sendiri oleh user tetap dijaga saat area menyusut', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      await description.focus();
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      await openKeyboard(page, height);

      // Catatan 20px di atas tepi bawah; user scroll menjauh lalu kembali ke posisi itu.
      await placeElementAtContentBottom(page, description, 20);
      await scrollSheetContentTo(page, 'bottom');
      await nextFrames(page);
      await placeElementAtContentBottom(page, description, 20);
      await expectFullyVisibleInContent(page, description);

      // Area menyusut 30px: Catatan tertutup 10px → tetap digulir lagi (user tidak sedang menjauhinya).
      await openKeyboard(page, height - 30);
      await expectFullyVisibleInContent(page, description);
    });

    test('pindah fokus ke input lain setelah scroll manual: input baru tetap dijaga terlihat', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const description = page.getByLabel('Catatan / Keterangan *');
      const dateInput = page.getByLabel('Tanggal');
      await description.focus();
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      await openKeyboard(page, height);

      // User menggulir sampai Tanggal persis di tepi bawah (Catatan keluar layar), lalu tap Tanggal.
      await placeElementAtContentBottom(page, dateInput);
      await dateInput.focus();
      await expectFullyVisibleInContent(page, dateInput);

      // Bar saran keyboard muncul (area menyusut 30px): Tanggal tertutup → tetap digulir lagi.
      await openKeyboard(page, height - 30);
      await expectFullyVisibleInContent(page, dateInput);
    });

    test('keyboard terbuka: sudut atas sheet rata dan konten paling bawah tidak menempel ke bar Simpan', async ({ page }) => {
      await openScenario(page, 'quick-add');
      expect((await sheetMetrics(page)).sheetRadius).toBe('24px');
      const { innerHeight } = await sheetMetrics(page);
      await openKeyboard(page, Math.round(innerHeight * 0.55));
      expect((await sheetMetrics(page)).sheetRadius).toBe('0px');

      await scrollSheetContentTo(page, 'bottom');
      await nextFrames(page);
      const metrics = await sheetMetrics(page);
      const lastControl = await page.getByText('Tambah foto atau PDF').boundingBox();
      expect(metrics.scrollerBottom - (lastControl!.y + lastControl!.height)).toBeGreaterThanOrEqual(7.5);

      await setVisualViewport(page, null);
      await expect.poll(async () => (await sheetMetrics(page)).sheetRadius).toBe('24px');
    });

    test('mode edit + keyboard: Hapus disembunyikan, Update tetap utuh di layar pendek', async ({ page }) => {
      await openScenario(page, 'quick-add-edit');
      await expect(page.getByRole('button', { name: 'Hapus Transaksi' })).toBeVisible();

      await openKeyboard(page, 150);
      await expect(page.getByRole('button', { name: 'Hapus Transaksi' })).toHaveCount(0);
      const metrics = await sheetMetrics(page);
      expect(metrics.saveTop).toBeGreaterThanOrEqual(metrics.sheetTop);
      expect(metrics.saveBottom).toBeLessThanOrEqual(150);

      await setVisualViewport(page, null);
      await expect(page.getByRole('button', { name: 'Hapus Transaksi' })).toBeVisible();
    });

    test('pinch-zoom tidak dianggap keyboard', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const { innerHeight } = await sheetMetrics(page);
      await openKeyboard(page, Math.round(innerHeight * 0.55));

      await setVisualViewport(page, { height: Math.round(innerHeight / 2), offsetTop: 120, scale: 2 });
      await expect.poll(async () => (await sheetMetrics(page)).sheetCssBottom).toBe('0px');
    });

    test('perubahan visual viewport tidak menambah rule CSS terus-menerus', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const { innerHeight } = await sheetMetrics(page);
      const height = Math.round(innerHeight * 0.55);
      await openKeyboard(page, height);
      const countRules = () => page.evaluate(() =>
        [...document.styleSheets].reduce((total, sheet) => {
          try { return total + sheet.cssRules.length; } catch { return total; }
        }, 0)
      );
      const before = await countRules();
      for (let offset = 1; offset <= 30; offset += 1) {
        await setVisualViewport(page, { height, offsetTop: offset });
        await nextFrames(page);
      }
      expect((await sheetMetrics(page)).sheetCssBottom).toBe(`${innerHeight - height - 30}px`);
      expect(await countRules()).toBe(before);
    });

    test('listener visualViewport dilepas saat sheet di-unmount', async ({ page }) => {
      await openScenario(page, 'quick-add');
      const count = () => page.evaluate(() => (window as unknown as { __visualViewportListenerCount: () => number }).__visualViewportListenerCount());
      expect(await count()).toBe(2);
      await page.evaluate(() => window.__harnessUnmount?.());
      expect(await count()).toBe(0);
    });

    test('padding safe-area hanya dipakai saat keyboard tertutup', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Emulasi safe-area lewat CDP hanya ada di Chromium');
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 0, right: 0, bottom: 34 } });
      await openScenario(page, 'quick-add');
      expect((await sheetMetrics(page)).barPaddingBottom).toBe('46px'); // 12px + 34px

      const { innerHeight } = await sheetMetrics(page);
      await openKeyboard(page, Math.round(innerHeight * 0.55));
      expect((await sheetMetrics(page)).barPaddingBottom).toBe('12px');
    });
  });

  test('simpan transaksi baru tetap jalan dengan tanggal default hari ini', async ({ page }) => {
    await openScenario(page, 'quick-add');
    await page.getByRole('textbox').first().fill('15000');
    await page.getByLabel('Catatan / Keterangan *').fill('Parkir mall');
    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect.poll(async () => (await getHarness(page)).addedTransactions.length).toBe(1);
    const state = await getHarness(page);
    expect(state.addedTransactions[0]).toEqual({ amount: 15000, categoryId: 'c-belanja', date: FIXED_TODAY, description: 'Parkir mall' });
  });

  test('mode edit: Hapus & Update ada di bar bawah dan terlihat', async ({ page }) => {
    await openScenario(page, 'quick-add-edit');
    await expect(page.getByRole('button', { name: 'Update' })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Hapus Transaksi' })).toBeInViewport({ ratio: 1 });
    await expect(page.getByLabel('Tanggal')).toBeVisible();
  });

  test('conflict versi: klik Update membuka dialog conflict, tidak langsung menimpa', async ({ page }) => {
    await openScenario(page, 'quick-add-conflict');
    await expect(page.getByText('Transaksi ini berubah di perangkat atau tab lain.')).toBeVisible();

    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Versi Transaksi Berubah')).toBeVisible();
    // Tidak masuk proses simpan sama sekali (label tidak berubah jadi "Menyimpan...").
    await expect(page.locator('button', { hasText: /^Update$/ })).toBeVisible();
    expect((await getHarness(page)).updatedTransactions).toEqual([]);

    // Pilihan sadar "Simpan versi saya" tetap bisa menimpa, dengan isi form milik user.
    await page.getByRole('button', { name: 'Simpan versi saya' }).click();
    await expect.poll(async () => (await getHarness(page)).updatedTransactions.length).toBe(1);
    expect((await getHarness(page)).updatedTransactions[0]).toMatchObject({ id: 't-long', amount: 1250000, categoryId: 'c-belanja' });
  });

  test('read-only (transaksi anggota lain): detail tampil tapi tidak bisa diubah', async ({ page }) => {
    await openScenario(page, 'quick-add-readonly');
    await expect(page.getByText('Dibuat oleh: Anggota Lain')).toBeVisible();
    await expect(page.getByLabel('Tanggal')).toBeDisabled();
    // Tidak ada button tambah lampiran (disabled pun tidak) untuk transaksi yang tidak bisa diubah.
    await expect(page.getByText('Tambah foto atau PDF')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Hapus Transaksi' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Update' })).toBeDisabled();
  });

  test('dua sheet ter-mount: ID input lampiran unik dan label membuka input di sheet yang sama', async ({ page }) => {
    await openScenario(page, 'two-sheets');
    const wiring = await page.evaluate(() =>
      ['edit', 'quick-add'].map((name) => {
        const sheet = document.querySelector(`[data-sheet="${name}"]`)!;
        const input = sheet.querySelector<HTMLInputElement>('input[type=file][accept="image/*,application/pdf"]')!;
        const label = [...sheet.querySelectorAll<HTMLLabelElement>('label[for]')].find((item) => item.textContent?.includes('Tambah foto atau PDF'))!;
        const target = document.getElementById(label.htmlFor);
        return { id: input.id, labelPointsToOwnInput: target === input };
      })
    );
    expect(wiring[0].id).not.toBe(wiring[1].id);
    expect(wiring.every((item) => item.labelPointsToOwnInput)).toBe(true);
  });

  test('input lampiran di-reset, jadi file yang sama bisa dipilih lagi setelah dihapus', async ({ page }) => {
    await openScenario(page, 'quick-add');
    const input = page.locator('input[type=file][accept="image/*,application/pdf"]');
    const file = { name: 'struk.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 harness') };

    await input.setInputFiles(file);
    await expect(page.getByText('Lampiran: struk.pdf')).toBeVisible();
    expect(await input.evaluate((element: HTMLInputElement) => element.value)).toBe('');

    await page.getByRole('button', { name: 'Hapus lampiran' }).click();
    await expect(page.getByText('Tambah foto atau PDF')).toBeVisible();
    await input.setInputFiles(file);
    await expect(page.getByText('Lampiran: struk.pdf')).toBeVisible();
  });

  test.describe('tema gelap app, OS terang', () => {
    test.use({ colorScheme: 'light' });

    test('batas bar Simpan tetap terlihat & ikon kalender ikut tema app', async ({ page }) => {
      await openScenario(page, 'quick-add', { theme: 'dark' });
      const style = await page.evaluate(() => {
        const save = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Simpan')!;
        const bar = getComputedStyle(save.parentElement!);
        const dateInput = document.querySelector<HTMLInputElement>('input[type=date]')!;
        // Kontras garis atas bar (warna border di-composite di atas background bar) vs background bar.
        const channels = (color: string) => color.match(/[\d.]+/g)!.map(Number);
        const [br, bg, bb, alpha = 1] = channels(bar.borderTopColor);
        const [pr, pg, pb] = channels(bar.backgroundColor);
        const mix = (front: number, back: number) => front * alpha + back * (1 - alpha);
        const luminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((value) => {
            const channel = value / 255;
            return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const line = luminance([mix(br, pr), mix(bg, pg), mix(bb, pb)]);
        const paper = luminance([pr, pg, pb]);
        return {
          borderTopWidth: bar.borderTopWidth,
          borderContrast: (Math.max(line, paper) + 0.05) / (Math.min(line, paper) + 0.05),
          dateColorScheme: getComputedStyle(dateInput).colorScheme,
        };
      });
      expect(style.borderTopWidth).toBe('1px');
      // Di dark mode garis divider bawaan cuma ±1,4:1 (nyaris tidak terlihat), bar jadi tidak terkesan floating.
      expect(style.borderContrast).toBeGreaterThanOrEqual(1.8);
      expect(style.dateColorScheme).toBe('dark');
    });
  });

  test.describe('tema terang app, OS gelap', () => {
    test.use({ colorScheme: 'dark' });

    test('ikon kalender ikut tema app (bukan putih di atas putih)', async ({ page }) => {
      await openScenario(page, 'quick-add', { theme: 'light' });
      const colorScheme = await page.evaluate(() => getComputedStyle(document.querySelector('input[type=date]')!).colorScheme);
      expect(colorScheme).toBe('light');
    });
  });
});

import type { Page } from '@playwright/test';

// Jam dibekukan supaya "hari ini"/"bulan ini" tidak berubah di tengah run. Sengaja
// tanggal 1 jam 00:30 WIB (= tanggal 31 bulan sebelumnya di UTC): kode yang keliru
// memakai tanggal/bulan UTC langsung ketahuan.
export const FIXED_NOW = new Date('2026-11-01T00:30:00+07:00');
export const FIXED_TODAY = '2026-11-01';
export const FIXED_MONTH_LABEL = 'November 2026';

export const openScenario = async (page: Page, scenario: string, options: { theme?: 'light' | 'dark' } = {}) => {
  await page.clock.setFixedTime(FIXED_NOW);
  const theme = options.theme ? `&theme=${options.theme}` : '';
  await page.goto(`/?scenario=${scenario}${theme}`);
  await page.waitForFunction(() => window.__harness?.ready === true);
  await waitForAnimations(page);
};

// Sheet punya animasi slide-up; ukur posisi hanya setelah animasi (yang tidak infinite) selesai.
export const waitForAnimations = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) =>
      animation.playState === 'finished' || animation.effect?.getComputedTiming().iterations === Infinity
    )
  );

export const getHarness = (page: Page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__harness)) as Window['__harness']);

export const setHarness = (page: Page, patch: Partial<Window['__harness']>) =>
  page.evaluate((value) => { Object.assign(window.__harness, value); }, patch);

type ViewportOverride = { height?: number; offsetTop?: number; scale?: number } | null;

// Ganti window.visualViewport dengan versi yang bisa dikendalikan test, untuk
// mensimulasikan keyboard virtual (yang tidak bisa dimunculkan di headless).
// Seperti browser asli: perubahan tinggi/scale memancarkan `resize`, perubahan
// posisi (offsetTop) saja memancarkan `scroll`. `initial` = keadaan saat halaman
// dimuat (mis. keyboard sudah terbuka sebelum sheet di-mount).
export const installVisualViewportMock = async (page: Page, initial: ViewportOverride = null) => {
  await page.addInitScript((start) => {
    type Override = { height?: number; offsetTop?: number; scale?: number } | null;
    const listeners: Record<string, Set<EventListener>> = { resize: new Set(), scroll: new Set() };
    let override: Override = start;
    const viewport = {
      get height() { return override?.height ?? window.innerHeight; },
      get width() { return window.innerWidth; },
      get offsetTop() { return override?.offsetTop ?? 0; },
      get offsetLeft() { return 0; },
      get pageTop() { return window.scrollY + (override?.offsetTop ?? 0); },
      get pageLeft() { return window.scrollX; },
      get scale() { return override?.scale ?? 1; },
      addEventListener(type: string, listener: EventListener) { listeners[type]?.add(listener); },
      removeEventListener(type: string, listener: EventListener) { listeners[type]?.delete(listener); },
      dispatchEvent() { return true; },
    };
    Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => viewport });
    const host = window as unknown as {
      __setVisualViewport: (next: Override) => void;
      __setVisualViewportSilently: (next: Override) => void;
      __visualViewportListenerCount: () => number;
    };
    host.__setVisualViewport = (next: Override) => {
      const before = { height: viewport.height, scale: viewport.scale };
      override = next;
      const type = before.height !== viewport.height || before.scale !== viewport.scale ? 'resize' : 'scroll';
      listeners[type].forEach((listener) => listener(new Event(type)));
    };
    // Berubah tanpa event (meniru WebKit yang memperbarui offsetTop belakangan tanpa event).
    host.__setVisualViewportSilently = (next: Override) => {
      override = next;
    };
    host.__visualViewportListenerCount = () => listeners.resize.size + listeners.scroll.size;
  }, initial);
};

export const setVisualViewport = (page: Page, next: ViewportOverride) =>
  page.evaluate((value) => {
    (window as unknown as { __setVisualViewport: (next: unknown) => void }).__setVisualViewport(value);
  }, next);

export const setVisualViewportSilently = (page: Page, next: ViewportOverride) =>
  page.evaluate((value) => {
    (window as unknown as { __setVisualViewportSilently: (next: unknown) => void }).__setVisualViewportSilently(value);
  }, next);

export const currentMonthKey = (page: Page) =>
  page.evaluate(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

// Cari teks yang terpotong di seluruh halaman (termasuk dialog/menu/sheet yang di-portal ke body).
// Yang diukur adalah kotak TEKS sebenarnya (Range), bukan kotak elemen, supaya teks yang overflow
// keluar dari elemennya sendiri juga ketahuan. Dihitung terpotong kalau:
// - elemen memotong isinya sendiri (overflow hidden/clip, ellipsis, clip-path, contain paint)
//   padahal isinya lebih besar;
// - teks overflow ke samping keluar kotak elemennya sendiri (elemen non-inline);
// - teks keluar dari ancestor yang memotong: overflow hidden/clip/clip-path/contain paint,
//   luberan ke samping dari kontainer scroll, atau luberan vertikal dari kontainer scroll KECIL
//   (< 35% tinggi layar — scroll di dalamnya mudah tidak disadari, scrollbar tidak terlihat di HP);
// - teks keluar dari lebar layar.
// Luberan vertikal di kontainer scroll besar (halaman, dialog, sheet, menu) tidak dihitung.
export const findClippedText = (page: Page) =>
  page.evaluate(() => {
    const clippingOverflow = (value: string) => value === 'hidden' || value === 'clip';
    const scrolling = (value: string) => value === 'auto' || value === 'scroll';
    const clipsPaint = (style: CSSStyleDeclaration) =>
      style.clipPath !== 'none' || /paint|strict|content/.test(style.contain);
    const offenders: string[] = [];
    document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
      const ownText = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      if (ownText.length <= 1) return; // glyph ikon tunggal, bukan teks
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return;
      // Teks tak terlihat (mis. span di <legend> outline MUI yang cuma membentuk celah garis) dilewati.
      let opacity = 1;
      for (let node: HTMLElement | null = element; node; node = node.parentElement) opacity *= parseFloat(getComputedStyle(node).opacity);
      if (opacity === 0) return;

      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();

      if (text.right > window.innerWidth + 1 || text.left < -1) {
        offenders.push(`[keluar layar] ${ownText}`);
        return;
      }
      const clipsSelf = clippingOverflow(style.overflowX) || clippingOverflow(style.overflowY)
        || style.textOverflow === 'ellipsis' || clipsPaint(style);
      if (clipsSelf && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)) {
        offenders.push(`[terpotong] ${ownText}`);
        return;
      }
      // Teks overflow keluar kotak elemennya sendiri tanpa dipotong (mis. label panjang di button
      // yang lebarnya tetap): teks bertumpuk di luar button dan sering tidak terbaca.
      const ownBox = element.getBoundingClientRect();
      if (style.display !== 'inline' && (text.left < ownBox.left - 1 || text.right > ownBox.right + 1)) {
        offenders.push(`[overflow] ${ownText}`);
        return;
      }
      let current: HTMLElement = element;
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        // Elemen fixed (dialog, sheet, menu) tidak terpotong oleh ancestor di atasnya,
        // termasuk body yang diberi overflow hidden saat modal mengunci scroll.
        if (getComputedStyle(current).position === 'fixed') break;
        current = ancestor;
        const ancestorStyle = getComputedStyle(ancestor);
        const box = ancestor.getBoundingClientRect();
        const smallScroller = box.height < window.innerHeight * 0.35;
        const clipX = clippingOverflow(ancestorStyle.overflowX) || scrolling(ancestorStyle.overflowX) || clipsPaint(ancestorStyle);
        const clipY = clippingOverflow(ancestorStyle.overflowY) || clipsPaint(ancestorStyle)
          || (scrolling(ancestorStyle.overflowY) && smallScroller);
        if (!clipX && !clipY) continue;
        if ((clipX && (text.left < box.left - 1 || text.right > box.right + 1)) || (clipY && (text.top < box.top - 1 || text.bottom > box.bottom + 1))) {
          offenders.push(`[dipotong parent] ${ownText}`);
          return;
        }
      }
    });
    return offenders;
  });

// Layout button di DialogActions ConfirmDialog: posisi/ukuran tiap button, apakah label (yang terlihat,
// bukan label "bayangan" aria-hidden) utuh di dalam button & satu baris, dan jarak ikon ke teks.
export const confirmDialogLayout = (page: Page) =>
  page.evaluate(() => {
    const paper = document.querySelector('.MuiDialog-paper')!.getBoundingClientRect();
    const buttons = [...document.querySelectorAll<HTMLElement>('.MuiDialogActions-root button')].map((button) => {
      const box = button.getBoundingClientRect();
      // Sel grid berisi [label terlihat, label bayangan aria-hidden]; label terlihat = anak pertama.
      // (inline-grid di dalam button flex terbaca `grid` karena flex item di-blockify.)
      const grid = [...button.querySelectorAll<HTMLElement>('span')].find((el) => /^(inline-)?grid$/.test(getComputedStyle(el).display));
      const label = grid?.firstElementChild as HTMLElement | null | undefined;
      if (!label) throw new Error('label button tidak ditemukan');
      const range = document.createRange();
      range.selectNodeContents(label);
      const text = range.getBoundingClientRect();
      const icon = label.firstElementChild;
      let iconGap: number | null = null;
      if (icon && label.lastChild?.nodeType === Node.TEXT_NODE) {
        const textRange = document.createRange();
        textRange.selectNodeContents(label.lastChild);
        iconGap = textRange.getBoundingClientRect().left - icon.getBoundingClientRect().right;
      }
      return {
        text: label.textContent,
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        bottom: box.bottom,
        radius: getComputedStyle(button).borderTopLeftRadius,
        textInside: text.left >= box.left - 0.5 && text.right <= box.right + 0.5 && text.top >= box.top - 0.5 && text.bottom <= box.bottom + 0.5,
        insidePaper: box.left >= paper.left - 0.5 && box.right <= paper.right + 0.5,
        labelLines: Math.round(text.height / parseFloat(getComputedStyle(label).lineHeight)),
        iconGap,
      };
    });
    return { buttons, paperHeight: paper.height };
  });

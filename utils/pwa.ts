import { APP_VERSION } from '../constants';

export const PWA_UPDATE_EVENT = 'dompetcerdas:pwa-update-available';

const dispatchPwaUpdateEvent = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: { version: APP_VERSION } }));
};

const watchInstallingWorker = (worker: ServiceWorker | null, notifyUpdate: () => void) => {
  if (!worker) return;

  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      notifyUpdate();
    }
  });
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  // PENTING: JANGAN reload pada controllerchange. Saat install pertama, SW
  // melakukan clients.claim() sehingga controllerchange fire dan dulu memicu
  // reload penuh tepat setelah load pertama selesai (aplikasi terasa dibuka
  // dua kali). Pembaruan versi kini cukup ditangani SATU mekanisme: activate
  // di sw.js me-navigate semua client ketika ada cache versi lama.
  try {
    // Pindah dari URL lama `/sw.js?v=...` ke `/sw.js` meng-install ulang SW yang SAMA (isi
    // file identik) sekali. Itu bukan versi baru, jadi banner update tidak ditampilkan.
    const previous = await navigator.serviceWorker.getRegistration();
    const migratingFromVersionedUrl = /\/sw\.js\?v=/.test(previous?.active?.scriptURL ?? '');
    const notifyUpdate = migratingFromVersionedUrl ? () => undefined : dispatchPwaUpdateEvent;

    // Tanpa `?v=APP_VERSION`: setiap build sudah mengubah isi sw.js (BUILD_ID), dan URL
    // yang berubah hanya memicu install ulang SW yang sama (phantom update banner).
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    if (registration.waiting && navigator.serviceWorker.controller) {
      notifyUpdate();
    }

    watchInstallingWorker(registration.installing, notifyUpdate);
    registration.addEventListener('updatefound', () => {
      watchInstallingWorker(registration.installing, notifyUpdate);
    });

    // Gagal saat offline: abaikan, dicek lagi saat app dibuka berikutnya.
    registration.update().catch(() => {});
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
};

export const activateServiceWorkerUpdate = async () => {
  if (!('serviceWorker' in navigator)) {
    window.location.reload();
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return;
  }

  // If there's no waiting worker but the user clicked update, 
  // it might have already been activated by another tab or skipWaiting.
  window.location.reload();
};

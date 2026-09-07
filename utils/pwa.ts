import { APP_VERSION } from '../constants';

export const PWA_UPDATE_EVENT = 'dompetcerdas:pwa-update-available';

const dispatchPwaUpdateEvent = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: { version: APP_VERSION } }));
};

const watchInstallingWorker = (worker: ServiceWorker | null) => {
  if (!worker) return;

  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      dispatchPwaUpdateEvent();
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
    const registration = await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(APP_VERSION)}`, {
      scope: '/',
    });

    if (registration.waiting && navigator.serviceWorker.controller) {
      dispatchPwaUpdateEvent();
    }

    watchInstallingWorker(registration.installing);
    registration.addEventListener('updatefound', () => {
      watchInstallingWorker(registration.installing);
    });

    void registration.update();
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

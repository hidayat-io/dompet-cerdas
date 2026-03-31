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

  await registration?.update();

  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return;
  }

  window.location.reload();
};

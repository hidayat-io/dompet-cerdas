import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  getLastActiveUserId,
  readCachedSnapshot,
  readCachedSnapshotSync,
  getLastUserProfile,
} from './services/startupCache';
import { registerServiceWorker } from './utils/pwa';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Registrasi SW sedini mungkin supaya aset tercache untuk rilis berikutnya.
if (document.readyState === 'complete') {
  void registerServiceWorker();
} else {
  window.addEventListener('load', () => {
    void registerServiceWorker();
  }, { once: true });
}

const boot = async () => {
  const lastUserId = getLastActiveUserId();
  const cachedProfile = getLastUserProfile();

  // Baca cache sinkron 0ms dari localStorage jika tersedia, atau baca IndexedDB (~8ms)
  let initialCached = lastUserId ? readCachedSnapshotSync(lastUserId) : null;
  if (!initialCached && lastUserId) {
    initialCached = await readCachedSnapshot(lastUserId);
  }

  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <App initialCached={initialCached} cachedProfile={cachedProfile} />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>
  );
};

boot().catch((error) => {
  console.error('Gagal memuat aplikasi:', error);
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.innerHTML =
      '<div style="padding:24px;text-align:center;font-family:system-ui,sans-serif;color:#6b7280">Gagal memuat aplikasi. Periksa koneksi internet lalu muat ulang halaman.</div>';
  }
});
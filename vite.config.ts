import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin: generate daftar aset hasil build supaya service worker bisa
// precache semua chunk sebelum activate (instan setelah update versi).
const precacheManifestPlugin = () => ({
  name: 'dompetcerdas-precache-manifest',
  apply: 'build' as const,
  closeBundle() {
    // outDir default Vite; sesuaikan jika build.outDir diubah.
    const outDir = path.resolve(__dirname, 'dist');
    const entries: string[] = [];

    const assetsDir = path.join(outDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      // Exclude chunk lazy yang berat dan jarang dipakai di detik-detik pertama
      // (exceljs ~940KB untuk export Excel, markdown ~118KB untuk AI advisor).
      // Aset ini tetap tercache otomatis oleh RUNTIME_CACHE saat pertama dipakai,
      // sehingga install SW pascapdate jauh lebih cepat di jaringan mobile.
      const EXCLUDE_PREFIXES = ['exceljs-', 'markdown-'];
      entries.push(
        ...fs.readdirSync(assetsDir)
          .filter((f) =>
            (f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.woff2')) &&
            !EXCLUDE_PREFIXES.some((p) => f.startsWith(p))
          )
          .sort()
          .map((f) => `/assets/${f}`)
      );
    }

    const fontsDir = path.join(outDir, 'fonts');
    if (fs.existsSync(fontsDir)) {
      entries.push(...fs.readdirSync(fontsDir).sort().map((f) => `/fonts/${f}`));
    }

    fs.writeFileSync(
      path.join(outDir, 'precache-manifest.json'),
      JSON.stringify({ files: entries, generatedAt: new Date().toISOString() }, null, 2)
    );
    console.log(`[precache-manifest] ${entries.length} aset ditulis ke precache-manifest.json`);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const manualChunks = (id: string) => {
    if (!id.includes('node_modules')) return undefined;

    if (id.includes('exceljs')) return 'exceljs';
    if (id.includes('firebase/storage') || id.includes('@firebase/storage')) return 'firebase-storage';
    if (id.includes('firebase/functions') || id.includes('@firebase/functions')) return 'firebase-functions';
    if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) return 'firebase-firestore';
    if (id.includes('firebase/auth') || id.includes('@firebase/auth')) return 'firebase-auth';
    if (id.includes('firebase/app') || id.includes('@firebase/app')) return 'firebase-core';
    if (id.includes('firebase')) return 'firebase';
    if (id.includes('@mui/material') || id.includes('@emotion/')) return 'mui-core';
    if (id.includes('@dnd-kit')) return 'dnd-kit';
    if (id.includes('recharts')) return 'charts';
    if (id.includes('react-markdown')) return 'markdown';
    if (id.includes('react/') || id.includes('/react-dom/')) return 'react-core';

    return undefined;
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), precacheManifestPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks,
        }
      },
      // Generate source maps for debugging
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    }
  };
});

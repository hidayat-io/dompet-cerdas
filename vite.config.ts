import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SW_BUILD_ID_PLACEHOLDER = '__DC_BUILD_ID__';

// Hash seluruh output build supaya BUILD_ID hanya berubah kalau isi release-nya
// memang berbeda. sw.js (yang sedang di-stamp) dan precache-manifest.json (berisi
// timestamp) dikecualikan agar build yang identik menghasilkan ID yang sama.
// Dotfile (mis. .DS_Store) juga dilewati karena tidak ikut di-deploy Firebase.
const hashBuildOutput = (outDir: string): string => {
  const hash = createHash('sha256');
  const walk = (dir: string) => {
    const names = fs.readdirSync(dir).sort();
    for (const name of names) {
      if (name.startsWith('.')) continue;
      const fullPath = path.join(dir, name);
      // Pemisah path dinormalisasi supaya BUILD_ID sama walau build di OS berbeda.
      const relativePath = path.relative(outDir, fullPath).split(path.sep).join('/');
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (relativePath === 'sw.js' || relativePath === 'precache-manifest.json') continue;
      hash.update(relativePath);
      hash.update(fs.readFileSync(fullPath));
    }
  };
  walk(outDir);
  return hash.digest('hex').slice(0, 16);
};

// Plugin: generate daftar aset hasil build supaya service worker bisa
// precache semua chunk sebelum activate (instan setelah update versi),
// lalu stamp BUILD_ID ke sw.js supaya setiap release memicu update SW.
const precacheManifestPlugin = (): Plugin => {
  let outDir = path.resolve(__dirname, 'dist');
  let bundleWritten = false;

  return {
    name: 'dompetcerdas-precache-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      bundleWritten = true;
    },
    closeBundle(error?: Error) {
      // Rollup juga memanggil closeBundle saat build GAGAL. Jangan sentuh outDir
      // dan jangan melempar error baru yang menutupi error aslinya.
      if (error || !bundleWritten) return;

      const entries: string[] = [];

      const assetsDir = path.join(outDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        // Exclude chunk lazy yang berat dan jarang dipakai di detik-detik pertama
        // (exceljs ~940KB untuk export Excel, markdown ~118KB untuk AI advisor).
        // Asset ini tetap tercache otomatis (cache-first ke STATIC_CACHE) saat pertama
        // dipakai, sehingga install SW pascapdate jauh lebih cepat di jaringan mobile.
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

      const swPath = path.join(outDir, 'sw.js');
      const swSource = fs.readFileSync(swPath, 'utf8');
      if (!swSource.includes(SW_BUILD_ID_PLACEHOLDER)) {
        // Gagal keras: tanpa stamp, release ini tidak akan sampai ke PWA yang sudah ter-install.
        throw new Error(`[sw-build-id] placeholder ${SW_BUILD_ID_PLACEHOLDER} tidak ditemukan di ${swPath}`);
      }
      const buildId = hashBuildOutput(outDir);
      fs.writeFileSync(swPath, swSource.replace(SW_BUILD_ID_PLACEHOLDER, buildId));
      console.log(`[sw-build-id] sw.js di-stamp dengan BUILD_ID ${buildId}`);
    },
  };
};

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

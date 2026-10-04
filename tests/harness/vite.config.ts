import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Harness component: merender component asli tanpa Firebase sungguhan supaya
// perilaku UI bisa diuji Playwright tanpa emulator (yang butuh Java).
const harnessDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(harnessDir, '../..');

const FAKE_FIRESTORE = path.join(harnessDir, 'fakes/firestore.ts');
const FAKE_MODULES: Record<string, string> = {
  [path.join(repoRoot, 'firebase.ts')]: path.join(harnessDir, 'fakes/firebase.ts'),
  [path.join(repoRoot, 'services/firebaseRuntime.ts')]: path.join(harnessDir, 'fakes/firebaseRuntime.ts'),
  [path.join(repoRoot, 'services/geminiService.ts')]: path.join(harnessDir, 'fakes/geminiService.ts'),
};

const fakeModulesPlugin = (): Plugin => ({
  name: 'harness-fake-modules',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source === 'firebase/firestore') return FAKE_FIRESTORE;
    if (!importer || !source.startsWith('.')) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    if (!resolved) return null;
    return FAKE_MODULES[resolved.id] ?? null;
  },
});

export default defineConfig({
  root: harnessDir,
  publicDir: path.join(repoRoot, 'public'),
  // Cache dependency terpisah dari `npm run dev` (config-nya berbeda).
  cacheDir: path.join(repoRoot, 'node_modules/.vite-harness'),
  plugins: [fakeModulesPlugin(), react()],
  server: {
    fs: { allow: [repoRoot] },
  },
});

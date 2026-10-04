import { expect, test } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { build, type InlineConfig } from 'vite';

// Menjalankan `vite build` sungguhan dengan vite.config.ts repo, ke folder sementara.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-build-'));

const buildInto = async (name: string, extra: InlineConfig = {}) => {
  const outDir = path.join(tmpRoot, name);
  await build({
    root: repoRoot,
    configFile: path.join(repoRoot, 'vite.config.ts'),
    logLevel: 'silent',
    ...extra,
    build: { outDir, emptyOutDir: true },
  });
  return outDir;
};

const buildIdOf = (outDir: string) =>
  fs.readFileSync(path.join(outDir, 'sw.js'), 'utf8').match(/const BUILD_ID = '([^']+)';/)?.[1];

const copyPublic = (name: string) => {
  const target = path.join(tmpRoot, name);
  fs.cpSync(path.join(repoRoot, 'public'), target, { recursive: true });
  return target;
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

test.describe('build: stamp BUILD_ID ke sw.js', () => {
  let firstBuildId: string | undefined;

  test('BUILD_ID ter-stamp (hash 16 hex), placeholder tidak tersisa, manifest precache ada', async () => {
    const outDir = await buildInto('a');
    firstBuildId = buildIdOf(outDir);
    expect(firstBuildId).toMatch(/^[0-9a-f]{16}$/);
    expect(fs.readFileSync(path.join(outDir, 'sw.js'), 'utf8')).not.toContain('__DC_BUILD_ID__');
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'precache-manifest.json'), 'utf8'));
    expect(manifest.files.some((file: string) => /^\/assets\/index-.+\.js$/.test(file))).toBe(true);
  });

  test('build identik menghasilkan BUILD_ID yang sama; dotfile di public tidak mengubahnya', async () => {
    expect(buildIdOf(await buildInto('b'))).toBe(firstBuildId);
    const publicWithDotfile = copyPublic('public-dotfile');
    fs.writeFileSync(path.join(publicWithDotfile, '.DS_Store'), 'x');
    expect(buildIdOf(await buildInto('c', { publicDir: publicWithDotfile }))).toBe(firstBuildId);
  });

  test('isi release berubah → BUILD_ID berubah', async () => {
    const publicChanged = copyPublic('public-changed');
    fs.appendFileSync(path.join(publicChanged, 'offline.html'), '\n<!-- berubah -->\n');
    expect(buildIdOf(await buildInto('d', { publicDir: publicChanged }))).not.toBe(firstBuildId);
  });

  test('build gagal keras kalau placeholder BUILD_ID hilang dari sw.js', async () => {
    const publicBroken = copyPublic('public-broken');
    const swPath = path.join(publicBroken, 'sw.js');
    fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace('__DC_BUILD_ID__', 'lupa'));
    await expect(buildInto('e', { publicDir: publicBroken })).rejects.toThrow(/placeholder/);
  });
});

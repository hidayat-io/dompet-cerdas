const baseUrl = process.argv[2] || 'https://expensetracker-test-1.web.app';
const routes = process.argv.slice(3);
const targets = routes.length > 0 ? routes : ['/', '/link-telegram'];

const normalizeUrl = (path) => {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${safePath}`;
};

const withCacheBust = (inputUrl) => {
  const url = new URL(inputUrl);
  url.searchParams.set('__smoke', `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return url.toString();
};

const assertAppShell = (path, html) => {
  if (!html || typeof html !== 'string') {
    throw new Error(`[${path}] empty HTML response`);
  }

  if (/Page Not Found/i.test(html)) {
    throw new Error(`[${path}] returned Firebase generic 404 page`);
  }

  if (!/<title>\s*DompetCerdas\s*<\/title>/i.test(html)) {
    throw new Error(`[${path}] did not return DompetCerdas app shell`);
  }
};

const findPrimaryAsset = (html, type) => {
  const regex = type === 'js'
    ? /<script[^>]+type="module"[^>]+src="([^"]+)"/i
    : /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/i;

  const match = html.match(regex);
  return match?.[1];
};

const run = async () => {
  console.log(`🔎 Hosting smoke check: ${baseUrl}`);

  let firstHtml = '';
  for (const route of targets) {
    const url = withCacheBust(normalizeUrl(route));
    const response = await fetch(url, {
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });
    const html = await response.text();

    if (!response.ok) {
      throw new Error(`[${route}] returned HTTP ${response.status}`);
    }

    assertAppShell(route, html);
    if (!firstHtml) firstHtml = html;
    console.log(`✅ ${route} -> app shell OK`);
  }

  const assetChecks = [
    ['js', findPrimaryAsset(firstHtml, 'js')],
    ['css', findPrimaryAsset(firstHtml, 'css')],
  ];

  for (const [assetType, assetPath] of assetChecks) {
    if (!assetPath) {
      throw new Error(`missing primary ${assetType.toUpperCase()} asset in index.html`);
    }

    const assetUrl = withCacheBust(assetPath.startsWith('http') ? assetPath : normalizeUrl(assetPath));
    const response = await fetch(assetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`asset ${assetPath} returned HTTP ${response.status}`);
    }
    console.log(`✅ asset ${assetType.toUpperCase()} -> ${assetPath}`);
  }

  console.log('✅ Hosting smoke check passed');
};

run().catch((error) => {
  console.error(`❌ Hosting smoke check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

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

  const jsAsset = findPrimaryAsset(firstHtml, 'js');
  if (!jsAsset) {
    throw new Error('missing primary JS asset in index.html');
  }

  const jsUrl = withCacheBust(jsAsset.startsWith('http') ? jsAsset : normalizeUrl(jsAsset));
  const jsResponse = await fetch(jsUrl, {
    method: 'HEAD',
    redirect: 'follow',
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  });
  if (!jsResponse.ok) {
    throw new Error(`asset ${jsAsset} returned HTTP ${jsResponse.status}`);
  }
  console.log(`✅ asset JS -> ${jsAsset}`);

  const cssAsset = findPrimaryAsset(firstHtml, 'css');
  if (cssAsset) {
    const cssUrl = withCacheBust(cssAsset.startsWith('http') ? cssAsset : normalizeUrl(cssAsset));
    const cssResponse = await fetch(cssUrl, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });
    if (!cssResponse.ok) {
      throw new Error(`asset ${cssAsset} returned HTTP ${cssResponse.status}`);
    }
    console.log(`✅ asset CSS -> ${cssAsset}`);
  } else {
    console.log('ℹ️ asset CSS -> not present in index.html');
  }

  console.log('✅ Hosting smoke check passed');
};

run().catch((error) => {
  console.error(`❌ Hosting smoke check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

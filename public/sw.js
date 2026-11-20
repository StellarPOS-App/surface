/*
 * StellarPOS service worker.
 *
 * - App shell: navigations are network-first, falling back to the cached
 *   index.html, so the app opens without a connection.
 * - Built assets (/assets/*, hashed): cache-first, since a hash never changes.
 * - Read-only register data (store settings, product catalog, categories):
 *   stale-while-revalidate, so the register shows products offline and
 *   refreshes them when the connection is back.
 * - Everything else (sales, payments, auth) always goes to the network. A sale
 *   is never faked offline.
 */
const VERSION = 'v1';
const SHELL = `stellarpos-shell-${VERSION}`;
const ASSETS = `stellarpos-assets-${VERSION}`;
const DATA = `stellarpos-data-${VERSION}`;
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png'];
const CACHED_API = [/\/api\/v1\/store$/, /\/api\/v1\/products\/catalog$/, /\/api\/v1\/products\/categories$/];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, ASSETS, DATA]);
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (CACHED_API.some((re) => re.test(url.pathname))) {
    event.respondWith(
      caches.open(DATA).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || network;
      }),
    );
  }
});

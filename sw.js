/* Wind Accumulation — service worker
   Bump CACHE on every release so clients pick up the new shell. */
const CACHE = 'windaccum-20261116-93';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // still activate even if a shell asset is missing
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    // App shell: cache-first, then network (and refresh cache).
    e.respondWith(
      caches.match(e.request).then(hit =>
        hit || fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
      )
    );
  } else {
    // External (ECMWF/Open-Meteo, GIBS tiles, ensemble, basemap): network-first,
    // fall back to any cached copy if offline. Never serve stale weather silently
    // when online — the app itself flags offline mode.
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});

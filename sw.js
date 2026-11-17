// Onsetbeat service worker: keeps the app on the device so the installed app opens without a network.
// The page itself is fetched from the network first (so updates arrive) and falls back to the saved
// copy when offline; fonts and icons come from the cache. Raise VERSION when fonts or icons change.
const VERSION = 'onsetbeat-1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/favicon-32.png', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/dela-gothic-one-latin-400-normal.woff2', 'fonts/dela-gothic-one-latin-ext-400-normal.woff2',
  'fonts/ibm-plex-mono-latin-500-normal.woff2', 'fonts/ibm-plex-mono-latin-ext-500-normal.woff2',
  'fonts/zen-kaku-gothic-new-latin-400-normal.woff2', 'fonts/zen-kaku-gothic-new-latin-ext-400-normal.woff2',
  'fonts/zen-kaku-gothic-new-latin-700-normal.woff2', 'fonts/zen-kaku-gothic-new-latin-ext-700-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('onsetbeat-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    // network first, with a short timeout so a weak connection doesn't hold the app up
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
        if (res.ok) cache.put('index.html', res.clone());
        return res;
      } catch (err) {
        return (await cache.match('index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  // everything else: cache first, then the network (and keep a copy)
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});

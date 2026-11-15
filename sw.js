// Offline support for Lab Inspector Challenge.
// Everything the game needs is saved on the first visit, so it keeps working with no internet.
// Bump VERSION whenever any file changes, so devices pick up the new game.
const VERSION = 'lic-v3';
const FONTS = ['IBMPlexSansArabic-400', 'IBMPlexSansArabic-500', 'IBMPlexSansArabic-600', 'IBMPlexSansArabic-700',
  'ReemKufi-500', 'ReemKufi-600', 'ReemKufi-700'];
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'fonts/fonts.css',
  'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png',
  ...FONTS.flatMap(f => [`fonts/${f}-arabic.woff2`, `fonts/${f}-latin.woff2`])
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // The page: network first (so updates arrive), the saved copy when offline.
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); }
        return res;
      }).catch(() => caches.match('index.html', {ignoreSearch: true}))
    );
    return;
  }
  // Fonts, icons and the rest: the saved copy first.
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)));
});

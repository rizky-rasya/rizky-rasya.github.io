/* Service Worker — cache aset statis untuk kunjungan berikutnya */
const CACHE_NAME = 'uleman-v2';   // ← REVISI: bump versi untuk paksa refresh
const ASSETS = [
  './',
  './index.html',
  './assets/cover-v3fiks.webp',
  './assets/divider.png',
  './assets/flower.png',
  './assets/branch.png',
  './assets/ribbon.png',
  './assets/crest-red.png',
  './assets/floral-left.png',
  './assets/floral-right.png',
  './assets/floral-left1.png',
  './assets/floral-right1.png',
  './assets/loading-art.webp',
  './assets/gatekiriv4.webp',
  './assets/gatekananv4.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Jangan cache Apps Script / maps
  if (url.hostname.includes('script.google.com')) return;
  if (url.hostname.includes('google.com/maps')) return;
  // Stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
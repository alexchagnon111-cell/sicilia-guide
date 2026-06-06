// sw.js — Service Worker Sicilia Guide Audio
const CACHE = 'sicilia-v1';
const CORE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API/transformers, cache-first for app shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network for HuggingFace model files and CDN (large binary files — don't cache)
  if (
    url.hostname.includes('huggingface.co') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.pathname.endsWith('.onnx') ||
    url.pathname.endsWith('.wasm')
  ) {
    return; // default browser fetch
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Background sync placeholder for future script uploads
self.addEventListener('sync', e => {
  if (e.tag === 'sync-scripts') {
    console.log('Background sync: scripts');
  }
});

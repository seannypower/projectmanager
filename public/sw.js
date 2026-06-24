const CACHE = 'tasks-v1';
const SHELL = ['/', '/index.html', '/static/js/main.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first: always try network, fall back to cache for the app shell
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Don't intercept Supabase API calls
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

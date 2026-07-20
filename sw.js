// Service Worker — Día del Amigo PWA
const CACHE_NAME = 'dia-del-amigo-v1';
const ASSETS = [
  './',
  './dia-del-amigo.html',
  './manifest.json',
  'https://base44.app/api/apps/6a5da972c767fff27b059883/files/mp/public/6a5da972c767fff27b059883/249564b3d_icon-192.png',
  'https://base44.app/api/apps/6a5da972c767fff27b059883/files/mp/public/6a5da972c767fff27b059883/2cf349d90_icon-512.png'
];

// Install — cache core assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(e) {
        console.log('Cache error (non-critical):', e);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache first for assets, network first for audio
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // Audio files: always try network first (they're large, don't cache)
  if (url.pathname.includes('.m4a') || url.pathname.includes('.mp3')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Everything else: cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // Cache new responses for next time
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback — serve cached page
        return caches.match('./dia-del-amigo.html');
      });
    })
  );
});
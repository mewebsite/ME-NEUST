/**
 * ME BoardPrep Offline Service Worker
 * Enables 100% offline access to the complete application and question bank (3,105 questions)
 * regardless of whether the user or host computer is offline or online.
 */

const CACHE_NAME = 'me-boardprep-cache-v2.2.5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css?v=2.2.5',
  './questions-data.js?v=2.2.5',
  './paho-mqtt.min.js?v=2.2.5',
  './static-engine.js?v=2.2.5',
  './app.bundle.js?v=2.2.5',
  './images/neust_seal.png',
  './images/neust_coe_seal.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching app shell and question bank for offline use...');
      return cache.addAll(ASSETS_TO_CACHE).catch(e => console.warn('[Service Worker] Cache addAll warning:', e));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            console.log('[Service Worker] Purging old cache:', k);
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bypass WebSocket connections, Firestore Cloud API, and broker traffic
  if (
    url.protocol === 'ws:' || 
    url.protocol === 'wss:' || 
    url.pathname.includes('/api/') || 
    url.hostname.includes('firestore.googleapis.com') || 
    url.hostname.includes('broker.emqx.io')
  ) {
    return;
  }

  // Stale-While-Revalidate with offline fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch fresh copy in background if network is available
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});

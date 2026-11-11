/**
 * ME BoardPrep Offline Service Worker
 * Enables offline access to the application shell and 5,036-question licensure bank
 * while ensuring Firebase Auth and Cloud Firestore traffic always goes directly to Google servers.
 */

const CACHE_NAME = 'me-boardprep-cache-v2.8.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css?v=2.8.3',
  './questions-data.js?v=2.8.3',
  './static-engine.js?v=2.8.3',
  './app.bundle.js?v=2.8.3',
  './images/neust_seal.png',
  './images/neust_coe_seal.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore-compat.js'
];

// Hosts (besides our own origin) whose static library/font responses are safe to cache for offline use
const CACHEABLE_HOSTS = ['unpkg.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

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
    }).then(() => self.clients.claim())
  );
});

// Safe cache write: never throws an unhandled rejection
function safePut(request, response) {
  return caches.open(CACHE_NAME)
    .then(cache => cache.put(request, response))
    .catch(err => console.warn('[Service Worker] Cache put skipped:', request.url, err && err.message));
}

// Offline fallback to the cached app shell
function shellFallback() {
  return caches.match('./index.html').then(r => r || caches.match('./'));
}

self.addEventListener('fetch', event => {
  const request = event.request;

  // Only GET requests over http(s) can be stored in the Cache API.
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Bypass API, Firebase Auth handlers (/__/auth/), Firestore, IdentityToolkit, and third-party APIs
  if (
    url.pathname.includes('/api/') ||
    url.pathname.startsWith('/__/') ||
    (!isSameOrigin && !CACHEABLE_HOSTS.includes(url.hostname))
  ) {
    return;
  }

  // Network-First for HTML navigation requests to ensure devices always get latest scripts
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            safePut(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => shellFallback())
    );
    return;
  }

  // Versioned assets (?v=...) are immutable: pure Cache-First
  const isVersioned = url.searchParams.has('v');

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        if (!isVersioned) {
          fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              safePut(request, networkResponse);
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(request).then(response => {
        if (response && (response.status === 200 || response.type === 'opaque')) {
          safePut(request, response.clone());
        }
        return response;
      }).catch(() => shellFallback());
    })
  );
});

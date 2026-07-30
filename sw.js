// Simple offline cache for the checklist site.
// After the first successful visit, everything below loads instantly
// from the device itself, even with no internet connection.

const CACHE_NAME = 'magical-checklist-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './theme.mp3',
  './fonts/Cinzel.woff2',
  './fonts/CormorantGaramond.woff2',
  './fonts/CormorantGaramond-Italic.woff2',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.0/mammoth.browser.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for our own files (instant load), but always try the
// network first for Firestore's own requests (handled by the SDK itself,
// not intercepted here since Firestore uses its own connection, not fetch).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Save a copy for next time
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached); // offline and not cached: just fail gracefully
    })
  );
});

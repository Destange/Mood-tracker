// sw.js — Life Tracker PWA
// Incrémente CACHE_NAME à chaque déploiement pour invalider l'ancien cache
const CACHE_NAME = 'life-tracker-v1';

const ASSETS = [
  './index.html',
  './manifest.json',
  './launchericon-192x192.png',
  './launchericon-512x512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Installation : on précharge les assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch : cache-first pour les assets locaux, network-first pour le reste
self.addEventListener('fetch', event => {
  // On ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // On ne cache que les réponses valides
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => cached); // fallback sur le cache si hors ligne
    })
  );
});

const CACHE_NAME = 'lagerbestand-v20261122-64';

const APP_FILES = [
  './',
  './index.html',
  './wochenplan.css?v=2026-11-20-tage2',
  './wochenplan.js?v=2026-11-20-tage',
  './v50.js?v=2026-11-22-seite',
  './v52.js?v=2',
  './montagebericht.html?v=2026-11-22-nozoom'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    });
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Versionsprüfung immer direkt online abrufen.
  if (url.searchParams.has('version-check')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // HTML direkt online abrufen, damit veröffentlichte Änderungen
  // möglichst schnell sichtbar werden. Offline: letzte Kopie.
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match('./index.html')
          )
        )
    );
    return;
  }

  // V36: Vorlagen und Monteurbericht tragen eine Version in der Adresse (?v=…).
  // Eine neue Version hat eine neue Adresse, deshalb einmal laden und dann aus dem Cache.
  event.respondWith(cacheFirst(request));
});

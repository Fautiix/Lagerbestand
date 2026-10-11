const CACHE_NAME = 'lagerbestand-v20261011-01';

const APP_FILES = [
  './',
  './index.html'
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

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Versionsprüfung und andere Cache-Buster immer direkt online abrufen.
  if (
    url.searchParams.has('version-check') ||
    url.searchParams.has('v')
  ) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // HTML direkt online abrufen, damit veröffentlichte Änderungen
  // möglichst schnell sichtbar werden.
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

  // Andere App-Dateien zuerst aus dem Cache laden.
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request)
    )
  );
});

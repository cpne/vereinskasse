// Service Worker Version - wird bei jedem Update erhöht
const SW_VERSION = '3';
const CACHE_NAME = `vereinskasse-cache-v${SW_VERSION}`;
const BASE_PATH = '/vereinskasse/';

// URLs to cache during install
const urlsToCache = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
];

// Install Event - neuer Service Worker wird installiert
self.addEventListener('install', event => {
  console.log(`[SW] Installing Service Worker v${SW_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache opened:', CACHE_NAME);
        // Nur kritische Dateien beim Install cachen
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Cache install failed:', err);
      })
  );
  
  // Sofort aktivieren - keine Wartezeit
  self.skipWaiting();
});

// Activate Event - alter Service Worker wird entfernt
self.addEventListener('activate', event => {
  console.log(`[SW] Activating Service Worker v${SW_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Lösche alte Caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Übernehme sofort die Kontrolle über alle Clients
      self.clients.claim()
    ])
  );
});

// Fetch Event - handle all network requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Nur Requests für unsere Domain behandeln
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Service Worker selbst nicht cachen
  if (event.request.url.includes('/sw.js')) {
    return;
  }

  // Network First Strategy für HTML und JS - immer frische Versionen
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' ||
      event.request.url.includes('/assets/')) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Wenn erfolgreich, cache die Antwort
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.error('[SW] Cache put failed:', err);
              });
          }
          return response;
        })
        .catch(() => {
          // Falls Netzwerk fehlschlägt, versuche aus Cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback auf index.html für Navigation
              if (event.request.mode === 'navigate') {
                return caches.match(`${BASE_PATH}index.html`);
              }
            });
        })
    );
    return;
  }

  // Cache First Strategy für statische Assets (Bilder, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            // Nur erfolgreiche Antworten cachen
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(err => {
            console.error('[SW] Fetch failed:', err);
            // Fallback auf index.html für Navigation
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}index.html`);
            }
          });
      })
  );
});

// Message Event - für Kommunikation mit der App
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

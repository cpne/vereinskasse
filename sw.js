const CACHE_NAME = 'vereinskasse-cache-v2';
const BASE_PATH = '/vereins-kasse/';

// URLs to cache - these will be the built assets
const urlsToCache = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}assets/`,
  'https://cdn.tailwindcss.com',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Don't cache external URLs during install - they'll be cached on fetch
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('http')));
      })
      .catch(err => {
        console.error('Cache install failed:', err);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle requests for our domain
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            // Only cache GET requests
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.error('Cache put failed:', err);
                });
            }

            return response;
          }
        ).catch(err => {
          console.error('Fetch failed:', err);
          // Return a fallback response if available
          return caches.match(`${BASE_PATH}index.html`);
        });
      })
  );
});


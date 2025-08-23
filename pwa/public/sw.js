const CACHE_NAME = 'pill-counter-v3';
const STATIC_CACHE = 'pill-counter-static-v3';
const DYNAMIC_CACHE = 'pill-counter-dynamic-v3';

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.svg',
  '/logo512.svg'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Opened static cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets - cache first
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // Handle navigation requests - network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }

  // Default strategy - network first
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // This will be handled by the sync service in the main app
      console.log('Background sync triggered')
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New pill count data available',
    icon: '/logo192.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pill Counter', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

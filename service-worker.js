// Service Worker for PWA offline functionality
const CACHE_NAME = 'melomania-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/custom.css',
  '/img/music-heart.png',
  '/img/skull.png',
  '/img/background.png',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/js/database.js',
  '/js/ui-helpers.js',
  'https://cdn.tailwindcss.com'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(err => console.log('Cache install error:', err))
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the new response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Return offline page if available
        return caches.match('/index.html');
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-comments') {
    event.waitUntil(syncComments());
  }
  if (event.tag === 'sync-likes') {
    event.waitUntil(syncLikes());
  }
});

function syncComments() {
  // Sync pending comments from IndexedDB
  return new Promise((resolve) => {
    console.log('Syncing comments...');
    resolve();
  });
}

function syncLikes() {
  // Sync pending likes from IndexedDB
  return new Promise((resolve) => {
    console.log('Syncing likes...');
    resolve();
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Melomania Viva!',
    icon: '/img/music-heart.png',
    badge: '/img/skull.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver más',
        icon: '/img/music-heart.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/img/skull.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Melomania Viva!', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
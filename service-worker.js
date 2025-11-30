// Service Worker
const CACHE_NAME = 'melomania-clean-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'profile.html',
  'albums.html',
  'album.html',
  '/img/music-heart.png',
  '/img/skull.png',
  '/img/background.png',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/js/database.js',
  '/js/ui-helpers.js',
  '/js/main.js',
  '/js/music-player.js',
  '/js/profile.js',
  '/js/albums.js',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker instalado (Modo Red Directa)');
});


self.addEventListener('activate', (event) => {
 
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Eliminando caché antigua:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );

  return self.clients.claim();
});

// 3. FETCH (PETICIONES DE RED)
// IMPORTANTE: Al NO incluir un evento 'fetch' aquí,
// el navegador enviará todas las solicitudes directamente a Internet.
// Esto evita que el SW intercepte las llamadas a Firestore,
// eliminando los errores de "ServiceWorker ha interceptado la solicitud...".

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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
const CACHE_NAME = 'foodflow-v2';
const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v1';
const OFFLINE_URL = '/offline.html';

// Recursos estáticos para cachear durante la instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/index.css',
  '/manifest.json',
  '/auth'
];

// Instalación del service worker - cachea recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Crear una página offline básica en caso de que no exista
  const offlineResponse = new Response(
    '<html><head><title>Sin conexión</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="padding: 20px; font-family: system-ui, sans-serif; text-align: center;">' +
    '<h1>FoodFlow</h1><p>No hay conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.</p>' +
    '<button onclick="location.reload()">Reintentar</button>' +
    '</body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Precargando caché estática');
        // Caché de la página offline en caso de que falle la red
        cache.put(new Request(OFFLINE_URL), offlineResponse.clone());
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Service Worker] Error de precarga:', err))
  );
});

// Activación del service worker - limpia cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');

  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        console.log('[Service Worker] Limpiando cachés antiguas:', cachesToDelete);
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => caches.delete(cacheToDelete))
        );
      })
      .then(() => {
        console.log('[Service Worker] Reclamando clientes');
        return self.clients.claim();
      })
      .catch(err => console.error('[Service Worker] Error de activación:', err))
  );
});

// Estrategia de caché: Stale-While-Revalidate para recursos estáticos y CSS/JS
const staleWhileRevalidate = (event) => {
  return caches.match(event.request).then((cachedResponse) => {
    // Devuelve el recurso cacheado inmediatamente si existe
    const fetchPromise = fetch(event.request)
      .then((networkResponse) => {
        // Actualiza el caché con la respuesta fresca de la red
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch((error) => {
        console.log('[Service Worker] Fetch falló:', error);
        // Si el recurso es una página HTML, devolver la página offline
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });

    return cachedResponse || fetchPromise;
  });
};

// Fetch event - diferentes estrategias según el tipo de recurso
self.addEventListener('fetch', (event) => {
  // Verificación básica para evitar problemas con solicitudes de extensiones y otros orígenes
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.method !== 'GET') {
    return;
  }
  
  // No cachear API requests 
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Para navegación (páginas HTML), usar Network-First con fallback a caché
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[Service Worker] Navegación fallida, usando caché o página offline');
          return caches.match(event.request)
            .then(cachedResponse => cachedResponse || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Para el resto de recursos estáticos, utilizar Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(event));
});

// Evento de sincronización en segundo plano (para enviar datos cuando hay conexión)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronización en segundo plano', event.tag);
  if (event.tag === 'sync-new-orders') {
    // Lógica para sincronizar pedidos pendientes
    event.waitUntil(syncPendingData());
  }
});

// Función para sincronizar datos pendientes (simulada)
function syncPendingData() {
  return Promise.resolve();
}

// Notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text() || 'Notificación de FoodFlow',
    icon: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {action: 'explore', title: 'Ver detalles'},
      {action: 'close', title: 'Cerrar'}
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FoodFlow', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

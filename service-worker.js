[file name]: service-worker.js
[file content begin]
// Service Worker para Hinos CCB Play
const CACHE_NAME = 'hinos-ccb-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/data/hinos.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Módulos
  '/modules/categories.js',
  '/modules/favorites.js',
  '/modules/player.js',
  '/modules/playlists.js',
  '/modules/views.js',
  '/modules/utils.js',
  '/modules/storage.js',
  // Adicionar fallback
  '/fallback.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Estratégia: Cache First, depois Network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }
        
        // Clona a requisição porque é um stream que só pode ser consumido uma vez
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verifica se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clona a resposta porque também é um stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        }).catch(() => {
          // Fallback para páginas de visualização
          if (event.request.mode === 'navigate') {
            return caches.match('/fallback.html');
          }
          
          // Para outros tipos de requisições
          return new Response('Offline - Aplicativo não disponível', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
[file content end]
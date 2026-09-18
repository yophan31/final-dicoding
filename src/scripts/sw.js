const CORE_CACHE_TAG = 'chronogrid-core-v2';
const API_CACHE_TAG = 'chronogrid-api-v2';
const MEDIA_CACHE_TAG = 'chronogrid-media-v2';

const ASSET_MANIFEST = [
  './',
  './index.html',
  './app.bundle.js',
  './app.css',
  './favicon.png',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png',
  './screenshots/screenshot-desktop.png',
  './screenshots/screenshot-mobile.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (installEvent) => {
  self.skipWaiting();
  installEvent.waitUntil(
    caches.open(CORE_CACHE_TAG).then((cacheStorage) => {
      return cacheStorage.addAll(ASSET_MANIFEST).catch((cacheErr) => {
        console.warn('Non-critical asset caching skipped during install:', cacheErr);
      });
    })
  );
});

self.addEventListener('activate', (activationEvent) => {
  activationEvent.waitUntil(
    caches.keys().then((cacheKeys) => {
      return Promise.all(
        cacheKeys
          .filter((key) => key !== CORE_CACHE_TAG && key !== API_CACHE_TAG && key !== MEDIA_CACHE_TAG)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (fetchEvent) => {
  const reqObject = fetchEvent.request;
  const parsedTargetUrl = new URL(reqObject.url);

  if (parsedTargetUrl.protocol !== 'http:' && parsedTargetUrl.protocol !== 'https:') {
    return;
  }

  // API Caching Strategy (Network First -> Cache Fallback)
  if (parsedTargetUrl.origin === 'https://story-api.dicoding.dev') {
    fetchEvent.respondWith(
      fetch(reqObject)
        .then((serverResponse) => {
          if (serverResponse.status === 200 && reqObject.method === 'GET') {
            const clonedResponse = serverResponse.clone();
            caches.open(API_CACHE_TAG).then((apiCache) => apiCache.put(reqObject, clonedResponse));
          }
          return serverResponse;
        })
        .catch(() => {
          return caches.match(reqObject).then((matchedCache) => {
            if (matchedCache) return matchedCache;
            return new Response(
              JSON.stringify({
                error: false,
                message: 'Offline fallback mode active',
                listStory: [],
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Media & Map Tiles Strategy (Cache First -> Network Fallback)
  if (
    reqObject.destination === 'image' ||
    parsedTargetUrl.hostname.includes('tile.openstreetmap.org') ||
    parsedTargetUrl.hostname.includes('tile.opentopomap.org') ||
    parsedTargetUrl.hostname.includes('story-api.dicoding.dev')
  ) {
    fetchEvent.respondWith(
      caches.match(reqObject).then((cachedItem) => {
        if (cachedItem) return cachedItem;
        return fetch(reqObject).then((netResponse) => {
          if (netResponse.status === 200) {
            const cloneNet = netResponse.clone();
            caches.open(MEDIA_CACHE_TAG).then((mediaCache) => mediaCache.put(reqObject, cloneNet));
          }
          return netResponse;
        }).catch(() => caches.match('./favicon.png'));
      })
    );
    return;
  }

  // App Shell Strategy
  fetchEvent.respondWith(
    caches.match(reqObject).then((cachedShell) => {
      const networkFetchPromise = fetch(reqObject)
        .then((freshShell) => {
          if (freshShell.status === 200 && reqObject.method === 'GET') {
            const shellClone = freshShell.clone();
            caches.open(CORE_CACHE_TAG).then((coreCache) => coreCache.put(reqObject, shellClone));
          }
          return freshShell;
        })
        .catch(() => cachedShell);

      return cachedShell || networkFetchPromise;
    })
  );
});

/* PUSH NOTIFICATIONS */
self.addEventListener('push', (pushEvent) => {
  let alertPayload = {
    title: 'ChronoGrid Nexus',
    body: 'New chronicle broadcasted!',
    id: '',
  };

  if (pushEvent.data) {
    try {
      alertPayload = pushEvent.data.json();
    } catch (parseErr) {
      alertPayload.body = pushEvent.data.text();
    }
  }

  const notificationTitle = alertPayload.title || 'ChronoGrid Nexus';
  const notificationOptions = {
    body: alertPayload.body || 'A fresh entry has been published to the grid.',
    icon: './icons/icon-192x192.png',
    badge: './favicon.png',
    data: {
      url: alertPayload.id ? `/#/detail/${alertPayload.id}` : '/#/',
    },
    actions: [
      {
        action: 'inspect-chronicle',
        title: 'View Chronicle',
      },
    ],
  };

  pushEvent.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

self.addEventListener('notificationclick', (clickEvent) => {
  clickEvent.notification.close();
  const destinationHref = clickEvent.notification.data && clickEvent.notification.data.url ? clickEvent.notification.data.url : '/#/';

  clickEvent.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientCollection) => {
      for (const clientNode of clientCollection) {
        if (clientNode.url && 'focus' in clientNode) {
          clientNode.navigate(destinationHref);
          return clientNode.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(destinationHref);
      }
    })
  );
});

/* BACKGROUND SYNC */
self.addEventListener('sync', (syncEvent) => {
  if (syncEvent.tag === 'sync-new-stories') {
    syncEvent.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientArray) => {
        clientArray.forEach((clientWindow) => {
          clientWindow.postMessage({ type: 'SYNC_OFFLINE_STORIES' });
        });
      })
    );
  }
});

const CACHE_NAME = 'squishy-simulator-v1';
const APP_SHELL = [
    './',
    './index.html',
    './bga.jpg',
    './manifest.webmanifest'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith('squishy-simulator-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    const acceptHeader = request.headers.get('accept') || '';
    if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseToCache));
                    }
                    return response;
                })
                .catch(() => caches.match(request)
                    .then(cachedResponse => cachedResponse || caches.match('./index.html'))
                    .then(cachedResponse => cachedResponse || new Response('App page is not available offline.', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    })))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => cachedResponse || fetch(request))
    );
});

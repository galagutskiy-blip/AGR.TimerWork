/* Service Worker для автономной работы приложения */
const CACHE = 'mks-timer-v5';
const ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icon-192.svg',
    './icon-512.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return Promise.all(
                ASSETS.map(url =>
                    cache.add(url).catch(err => console.warn('Не закэшировано:', url, err))
                )
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetched = fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, copy));
                }
                return response;
            }).catch(() => cached || caches.match('./index.html'));
            return cached || fetched;
        })
    );
});
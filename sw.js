const CACHE_NAME = 'moaath-store-v7'; // قم برقم إصدار أحدث لتجبار المتصفح على التحديث
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './store-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // لتجاوز الانتظار وتثبيت النسخة الجديدة فوراً
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // حذف الكاش القديم بالكامل
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('firebaseio.com') || e.request.url.includes('googleapis.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

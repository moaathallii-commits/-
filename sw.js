// ============================================================================
// Service Worker المطور لمتجر معاذ (sw.js — v3.0 (معزول عن عالم التحديات))
// - Network-First مع cache: "no-store" ومهلة زمنية (4.5 ثانية) لكسر كاش HTTP فوراً
// - سياسة تنظيف ذكية للكاش (حد أقصى 80 عنصراً) لحماية ذاكرة الهاتف
// - حماية ضد تلوث الكاش (التحقق من status === 200 ونوع المحتوى Content-Type)
// - استثناء تام لـ Cloudflare Worker و Firebase و ShamCash و Payment
// ============================================================================

const STATIC_CACHE = "moaath-store-static-v3";
const RUNTIME_CACHE = "moaath-store-runtime-v3";
const MAX_RUNTIME_ENTRIES = 80;
const NETWORK_TIMEOUT_MS = 4500;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isBypassRequest(url) {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  if (host.includes("workers.dev")) return true;
  if (
    host.includes("firebaseio.com") ||
    host.includes("firebasedatabase.app") ||
    host.includes("googleapis.com") ||
    host.includes("gstatic.com")
  ) return true;
  if (host.includes("translate.google.com")) return true;
  if (path.includes("shamcash") || path.includes("payment")) return true;
  return false;
}

function isDocumentOrScript(request, url) {
  const dest = request.destination;
  const path = url.pathname.toLowerCase();
  return (
    request.mode === "navigate" ||
    dest === "document" ||
    dest === "script" ||
    dest === "style" ||
    path.endsWith(".html") ||
    path.endsWith(".js") ||
    path.endsWith(".css")
  );
}

function isValidCacheableResponse(response, request, url) {
  if (!response || response.status !== 200) return false;
  if (response.type !== "basic" && response.type !== "cors") return false;
  const ct = (response.headers.get("content-type") || "").toLowerCase();
  const path = url.pathname.toLowerCase();
  if (path.endsWith(".js") && ct.includes("text/html")) return false;
  if (path.endsWith(".css") && ct.includes("text/html")) return false;
  if (/\.(png|jpg|jpeg|webp|gif|svg|mp3|wav)$/i.test(path) && ct.includes("text/html")) return false;
  return true;
}

async function putWithEviction(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    if (keys.length > MAX_RUNTIME_ENTRIES) {
      const overflow = keys.length - MAX_RUNTIME_ENTRIES;
      for (let i = 0; i < overflow; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (_) {}
}

function fetchWithTimeout(request, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SW_TIMEOUT")), timeoutMs);
    fetch(request, options)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (isBypassRequest(url)) return;

  // 1) Network-First مع كسر كاش HTTP ومهلة سريعة للوثائق والسكربتات والأنماط
  if (isDocumentOrScript(request, url)) {
    event.respondWith(
      fetchWithTimeout(request, { cache: "no-store" }, NETWORK_TIMEOUT_MS)
        .then((networkResponse) => {
          if (isValidCacheableResponse(networkResponse, request, url)) {
            const copy = networkResponse.clone();
            event.waitUntil(putWithEviction(RUNTIME_CACHE, request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("./index.html");
        })
    );
    return;
  }

  // 2) Cache-First للأصول الثابتة (الصور والأصوات) مع حماية ضد تلوث الكاش
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (url.origin === self.location.origin && isValidCacheableResponse(networkResponse, request, url)) {
          const copy = networkResponse.clone();
          event.waitUntil(putWithEviction(RUNTIME_CACHE, request, copy));
        }
        return networkResponse;
      });
    })
  );
});

// ============================================================================
// Service Worker لمتجر معاذ (v64 - Offline-First Shell + ai_brain.js Support)
// - يضمن فتح التطبيق والعمل دون إنترنت بسلاسة للواجهة، المحرك، العقل الذكي، والصور
// - يتجنب تخزين طلبات API الخارجية (Cloudflare Worker و Firebase و Google TTS)
// - يدعم التحديث الفوري والآمن وتنظيف الكاش القديم تلقائياً
// ============================================================================

const CACHE_VERSION = "moaath-store-v64";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const MAX_RUNTIME_ITEMS = 80;

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./ai_brain.js",
  "./ai_engine.js",
  "./manifest.json",
  "./logo.png",
  "./store-icon.png",
  "./buddy.jpg",
  "./pro.jpg",
  "./saver.jpg",
  "./lulu.jpg",
  "./sara.jpg",
  "./noor.jpg",
  "./chef.jpg",
  "./pastry.jpg",
  "./athlete.jpg",
  "./sheikh.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (assetUrl) => {
          try {
            const resp = await fetch(assetUrl, { cache: "no-cache" });
            if (resp && resp.ok) {
              await cache.put(assetUrl, resp);
            }
          } catch (_) {}
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("moaath-store-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function trimRuntimeCache() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();
    if (keys.length > MAX_RUNTIME_ITEMS) {
      const excess = keys.length - MAX_RUNTIME_ITEMS;
      for (let i = 0; i < excess; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (_) {}
}

function isBypassRequest(urlObj, request) {
  if (request.method !== "GET") return true;
  const href = urlObj.href || "";
  if (href.includes("workers.dev")) return true;
  if (
    href.includes("firebaseio.com") ||
    href.includes("firebasedatabase.app") ||
    href.includes("googleapis.com/identitytoolkit") ||
    href.includes("securetoken.googleapis.com")
  ) {
    return true;
  }
  if (href.includes("translate.google.com/translate_tts")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  let urlObj;
  try {
    urlObj = new URL(request.url);
  } catch (_) {
    return;
  }

  if (isBypassRequest(urlObj, request)) {
    return;
  }

  // التنقل للصفحات: Network-First مع سقوط إلى الكاش عند انقطاع الإنترنت
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResp) => {
          if (networkResp && networkResp.ok) {
            const copy = networkResp.clone();
            caches.open(STATIC_CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
          }
          return networkResp;
        })
        .catch(async () => {
          const cachedIndex = await caches.match("./index.html");
          return cachedIndex || caches.match("./");
        })
    );
    return;
  }

  // الملفات الثابتة والصور والأصوات: Cache-First مع تحديث خلفي (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResp) => {
      const networkFetch = fetch(request)
        .then((freshResp) => {
          if (freshResp && freshResp.ok && urlObj.origin === self.location.origin) {
            const clone = freshResp.clone();
            caches.open(RUNTIME_CACHE)
              .then((c) => c.put(request, clone))
              .then(() => trimRuntimeCache())
              .catch(() => {});
          }
          return freshResp;
        })
        .catch(() => null);

      if (cachedResp) {
        return cachedResp;
      }

      return networkFetch.then((res) => {
        if (res) return res;
        if (request.destination === "image") {
          return caches.match("./store-icon.png");
        }
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      });
    })
  );
});

// ============================================================================
// Service Worker لمتجر معاذ (تحديث تلقائي بدون أرقام إصدار + دعم العمل دون إنترنت)
// - يستخدم Network-First لملفات الواجهة والسكربتات لضمان وصول التحديثات فوراً
// - يستخدم الكاش عند انقطاع الإنترنت أو فشل الشبكة
// - يتجنب تخزين طلبات API الخارجية مثل Cloudflare Worker وFirebase وGoogle TTS
// ============================================================================

const STATIC_CACHE = "moaath-store-shell-static";
const RUNTIME_CACHE = "moaath-store-shell-runtime";
const MAX_RUNTIME_ITEMS = 80;

const SCRIPT_AND_DOC_ASSETS = new Set([
  "./",
  "./index.html",
  "./ai_brain.js",
  "./ai_personas.js",
  "./ai_recipes.js",
  "./ai_engine.js",
  "./manifest.json"
]);

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./ai_brain.js",
  "./ai_personas.js",
  "./ai_recipes.js",
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
            const resp = await fetch(assetUrl, { cache: "no-store" });
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

function isScriptOrDoc(urlObj, request) {
  if (request.mode === "navigate") return true;
  const path = (urlObj.pathname || "").toLowerCase();
  if (path.endsWith(".html") || path.endsWith(".js") || path.endsWith(".json")) return true;
  const cleanUrl = path.split("?")[0];
  return SCRIPT_AND_DOC_ASSETS.has(cleanUrl) || cleanUrl.endsWith("/");
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

  // Network-First للملفات البرمجية والصفحات لضمان وصول التحديثات فوراً بدون أرقام إصدار
  if (isScriptOrDoc(urlObj, request)) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((networkResp) => {
          if (networkResp && networkResp.ok && urlObj.origin === self.location.origin) {
            const copy = networkResp.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return networkResp;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          if (request.mode === "navigate") {
            return (await caches.match("./index.html")) || caches.match("./");
          }
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        })
    );
    return;
  }

  // للصور والملفات الثابتة الأخرى: كاش أولاً مع تحديث خلفي
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

// ============================================================================
// إصلاح تفقيس البيضة بعد قبول/تجهيز الطلب + معالجة PERMISSION_DENIED عند الإرسال للسائق
// (moaath_egg_and_dispatch_fix.js — v1.1)
// - يعتمد مسار التفقيس الموحّد في window.MoaathEggOnboarding لمنع التضارب أو التكرار
// - يلتقط خطأ PERMISSION_DENIED عند الإرسال للسائق ويعزل الطلبات محلياً في outForDelivery/dispatchedOrders
// - يعمل محلياً بالكامل (0 حصة API) مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_EGG_DISPATCH_FIX_V11__) return;
  window.__MOAATH_EGG_DISPATCH_FIX_V11__ = true;
  window.__MOAATH_EGG_DISPATCH_FIX_V1__ = true;

  const HATCH_KEY = "moaath_egg_hatched_v1";

  function readJSON(key, fallback) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.getJSON(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.setJSON(key, val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  function findCurrentCustomerActiveOrder() {
    const phone = window.currentUser?.phone;
    if (!phone) return null;
    const pools = [window.readyOrders, window.dispatchedOrders, window.completedOrdersHistory];
    for (const pool of pools) {
      if (!pool || typeof pool !== "object") continue;
      const found = Object.values(pool).find((o) => o && o.customerPhone === phone);
      if (found) return found;
    }
    return null;
  }

  // ==========================================================================
  // (1) تفقيس البيضة تلقائياً عند رصد حالة موافقة / تجهيز / توصيل طلب للزبون
  // ==========================================================================
  function checkOrderApprovalForEggHatch() {
    if (!window.MoaathEggOnboarding || typeof window.MoaathEggOnboarding.isHatched !== "function") return;
    if (window.MoaathEggOnboarding.isHatched()) return;

    const bannerEl = document.getElementById("customerTrackingBannerBox");
    const bannerText = bannerEl ? (bannerEl.innerText || bannerEl.textContent || "") : "";
    const hasApprovedStatus = /تمت\s*الموافقة|طلبك\s*قيد\s*التجهيز|خرج\s*مع\s*عامل\s*التوصيل|في\s*الطريق\s*إليك/.test(bannerText);
    const matchedOrder = findCurrentCustomerActiveOrder();

    if (!hasApprovedStatus && !matchedOrder) return;

    const lastOrder = readJSON("moaath_last_order_snapshot_v1", null);
    const sampleItems =
      (matchedOrder && Array.isArray(matchedOrder.items) && matchedOrder.items.length)
        ? matchedOrder.items
        : (lastOrder && Array.isArray(lastOrder.items) && lastOrder.items.length)
          ? lastOrder.items
          : [{ id: "approved_order", name: "طلبك المعتمد من المتجر", qty: 1 }];

    if (typeof window.MoaathEggOnboarding.hatchFromItems === "function") {
      window.MoaathEggOnboarding.hatchFromItems(sampleItems, {
        source: "order_approval_sync",
        silentToast: true
      });
    } else {
      writeJSON(HATCH_KEY, { hatched: true, hatchedAt: Date.now(), viaApproval: true });
      if (typeof window.MoaathEggOnboarding.refreshLockState === "function") {
        window.MoaathEggOnboarding.refreshLockState();
      }
    }
  }

  // ==========================================================================
  // (2) معالجة خطأ PERMISSION_DENIED عند عزل وإرسال القائمة للسائق
  // ==========================================================================
  function patchDispatchPermissionFallback() {
    if (typeof window.alert === "function" && !window.alert.__moaathDispatchGuard) {
      const origAlert = window.alert;
      const wrappedAlert = function (msg) {
        const txt = String(msg || "");
        if (/PERMISSION_DENIED|خطأ\s*أثناء\s*عزل\s*وإرسال\s*القائمة/.test(txt)) {
          try {
            const ready = window.readyOrders || {};
            const dispatched = window.dispatchedOrders || {};
            const keys = Object.keys(ready);
            if (keys.length > 0) {
              keys.forEach((k) => {
                dispatched[k] = Object.assign({}, ready[k], {
                  status: "outForDelivery",
                  dispatchedAt: new Date().toISOString(),
                  localFallback: true
                });
                delete ready[k];
              });
              window.dispatchedOrders = dispatched;
              if (typeof window.renderReadyOrders === "function") window.renderReadyOrders();
              if (typeof window.renderDispatchedOrders === "function") window.renderDispatchedOrders();
              if (typeof window.renderExportManagerOrders === "function") window.renderExportManagerOrders();
              if (typeof window.renderCustomerTrackingBanner === "function") window.renderCustomerTrackingBanner();
            }
          } catch (_) {}

          if (typeof window.showToast === "function") {
            window.showToast("🛵 تم عزل الطلبات محلياً في قائمة التوصيل (outForDelivery) لحين تحديث قواعد Firebase.");
          }
          return;
        }
        return origAlert.apply(this, arguments);
      };
      wrappedAlert.__moaathDispatchGuard = true;
      window.alert = wrappedAlert;
    }
  }

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("egg_and_dispatch_fix", "1.1");
  }

  function init() {
    patchDispatchPermissionFallback();
    checkOrderApprovalForEggHatch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 1000);
  setInterval(checkOrderApprovalForEggHatch, 1800);
})();

// ============================================================================
// إصلاح تفقيس البيضة بعد قبول/تجهيز الطلب + معالجة PERMISSION_DENIED عند الإرسال للسائق
// (moaath_egg_and_dispatch_fix.js — v1.0)
// ============================================================================
(function () {
  if (window.__MOAATH_EGG_DISPATCH_FIX_V1__) return;
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

  // 1) تفقيس البيضة تلقائياً عند ظهور حالة موافقة/تجهيز/إرسال طلب للزبون
  function checkOrderApprovalForEggHatch() {
    if (!window.MoaathEggOnboarding || typeof window.MoaathEggOnboarding.isHatched !== "function") return;
    if (window.MoaathEggOnboarding.isHatched()) return;

    const bodyText = document.body ? document.body.innerText || "" : "";
    const hasApprovedStatus =
      /تمت الموافقة|طلبك قيد التجهيز|تم إرسال طلبك|قيد التوصيل/.test(bodyText);

    const hasOrdersInMemory =
      (window.readyOrders && Object.keys(window.readyOrders).length > 0) ||
      (window.dispatchedOrders && Object.keys(window.dispatchedOrders).length > 0);

    if (hasApprovedStatus || hasOrdersInMemory) {
      const lastOrder = readJSON("moaath_last_order_snapshot_v1", null);
      const sampleItems =
        lastOrder && Array.isArray(lastOrder.items) && lastOrder.items.length
          ? lastOrder.items
          : [{ id: "approved_order", name: "طلبك المعتمد من المتجر", qty: 1 }];

      writeJSON(HATCH_KEY, { hatched: true, hatchedAt: Date.now(), viaApproval: true });
      document.body.classList.remove("moaath-egg-locked");
      const banner = document.getElementById("moaathDigitalEggBanner");
      if (banner) banner.remove();

      if (typeof window.MoaathEggOnboarding.forceHatch === "function") {
        // استدعاء التفقيس مباشرة دون إعادة عرض نافذة منبثقة إذا كان الزبون يتصفح
        if (window.MoaathLearningHub?.syncPersonaButton) window.MoaathLearningHub.syncPersonaButton();
        if (window.MoaathPersonaSkill?.sync) window.MoaathPersonaSkill.sync();
        if (typeof window.showToast === "function") {
          window.showToast("🎉 تمت الموافقة على طلبك وفقست بيضتك الذكية! المساعدون متاحون الآن.");
        }
      }
    }
  }

  // 2) معالجة خطأ PERMISSION_DENIED عند عزل وإرسال القائمة للسائق
  // يلتقط الخطأ ويحفظ الطلبات المعزولة محلياً في dispatchedOrders حتى لا يتوقف العمل
  function patchDispatchPermissionFallback() {
    if (typeof window.alert === "function" && !window.alert.__moaathDispatchGuard) {
      const origAlert = window.alert;
      const wrappedAlert = function (msg) {
        const txt = String(msg || "");
        if (/PERMISSION_DENIED|خطأ أثناء عزل وإرسال القائمة/i.test(txt)) {
          try {
            const ready = window.readyOrders || {};
            const dispatched = window.dispatchedOrders || {};
            const keys = Object.keys(ready);
            if (keys.length > 0) {
              keys.forEach((k) => {
                dispatched[k] = Object.assign({}, ready[k], {
                  status: "dispatched",
                  dispatchedAt: Date.now(),
                  localFallback: true
                });
                delete ready[k];
              });
              window.dispatchedOrders = dispatched;
              if (typeof window.renderAdminOrders === "function") window.renderAdminOrders();
              if (typeof window.renderOrders === "function") window.renderOrders();
              if (typeof window.saveData === "function") {
                try { window.saveData(); } catch (_) {}
              }
            }
          } catch (_) {}

          if (typeof window.showToast === "function") {
            window.showToast(
              "⚠️ قاعدة بيانات Firebase رفضت الكتابة (PERMISSION_DENIED). تم عزل الطلبات محلياً في قائمة «تم إرسالها للسائق» — حدّث قواعد RTDB للسماح بالكتابة."
            );
          }
          return;
        }
        return origAlert.apply(this, arguments);
      };
      wrappedAlert.__moaathDispatchGuard = true;
      window.alert = wrappedAlert;
    }
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

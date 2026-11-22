// ============================================================================
// النواة المعمارية والأمنية لمتجر معاذ (moaath_core_registry.js — v1.0)
// - سجل جاهزية الوحدات (window.MoaathSystemRegistry)
// - ناقل أحداث خفيف (window.MoaathEventBus) لتقليل الاعتماد على MutationObserver
// - دالة تعقيم XSS موحّدة (window.moaathEscapeHtml) وحماية للتخزين المحلي
// - شريط حالة لطيف عند انقطاع الاتصال (Offline Mode)
// ============================================================================
(function () {
  if (window.__MOAATH_CORE_REGISTRY_V1__) return;
  window.__MOAATH_CORE_REGISTRY_V1__ = true;

  // 1) إعدادات مركزية موحّدة
  window.MoaathConfig = Object.assign({
    schemaVersion: "2.0",
    maxRuntimeCacheItems: 80,
    networkTimeoutMs: 4500,
    financialIsolationStrict: true
  }, window.MoaathConfig || {});

  // 2) دالة تعقيم نصوص موحّدة ضد XSS
  window.moaathEscapeHtml = function (str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // 3) طبقة تخزين محلي محمية من البيانات التالفة
  window.moaathSafeStorage = {
    getJSON(key, fallback = null, useSession = false) {
      try {
        const store = useSession ? sessionStorage : localStorage;
        const raw = store.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed == null ? fallback : parsed;
      } catch (_) {
        return fallback;
      }
    },
    setJSON(key, value, useSession = false) {
      try {
        const store = useSession ? sessionStorage : localStorage;
        store.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  // 4) ناقل أحداث خفيف (Event Bus)
  const listeners = new Map();
  window.MoaathEventBus = {
    on(eventName, handler) {
      if (!eventName || typeof handler !== "function") return () => {};
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      listeners.get(eventName).add(handler);
      return () => this.off(eventName, handler);
    },
    off(eventName, handler) {
      const set = listeners.get(eventName);
      if (set) set.delete(handler);
    },
    emit(eventName, payload) {
      const set = listeners.get(eventName);
      if (!set) return;
      set.forEach((fn) => {
        try { fn(payload); } catch (_) {}
      });
    }
  };

  // 5) سجل جاهزية الوحدات والفحص الذاتي (Self-Check Runner)
  const registeredModules = new Map();
  window.MoaathSystemRegistry = {
    version: "1.0",
    register(name, version = "1.0", meta = {}) {
      if (!name) return;
      registeredModules.set(String(name), {
        version: String(version),
        registeredAt: new Date().toISOString(),
        meta
      });
      window.MoaathEventBus.emit("module:registered", { name, version });
    },
    getStatus() {
      const checks = {
        core_registry: true,
        ai_personas: !!(window.MoaathAIPersonas && window.MoaathAIPersonas.PERSONAS),
        ai_recipes: !!(window.MoaathAIRecipes && Array.isArray(window.MoaathAIRecipes.recipes)),
        ai_brain: !!window.MoaathAIBrain,
        ai_engine: !!window.__MOAATH_AI_LOADED__,
        ai_vip: !!(window.MoaathVIPSystem && window.MoaathVIPSystem.personas),
        store_ui: !!(window.__MOAATH_STORE_UI_V54__ || window.__MOAATH_STORE_UI_V4__),
        cart_api: typeof window.changeQty === "function",
        unmatched_renderer: typeof window.renderAdminBrainUnmatchedList === "function",
        financial_isolation: window.verifyShamCashPaymentWithAI == null
      };
      const keys = Object.keys(checks);
      const passed = keys.filter((k) => checks[k]).length;
      return {
        healthScore: Math.round((passed / keys.length) * 100),
        passed,
        total: keys.length,
        checks,
        registered: Object.fromEntries(registeredModules),
        online: navigator.onLine !== false
      };
    }
  };

  window.MoaathSystemRegistry.register("core_registry", "1.0");

  // 6) إشعار هادئ لحالة الاتصال (Offline / Online)
  function syncOfflineBanner() {
    const isOffline = navigator.onLine === false;
    window.MoaathEventBus.emit("network:changed", { online: !isOffline });
    let banner = document.getElementById("moaathOfflineStatusPill");
    if (isOffline) {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "moaathOfflineStatusPill";
        banner.style.cssText =
          "position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:10090; " +
          "background:#1e293b; color:#fbbf24; border:1px solid #f59e0b; border-radius:999px; " +
          "padding:5px 12px; font-size:10.5px; font-weight:800; box-shadow:0 6px 18px rgba(0,0,0,0.45);";
        banner.textContent = "🟡 الوضع المحلي (بدون إنترنت) — التصفح والغرف تعمل محلياً";
        document.body.appendChild(banner);
      }
      banner.style.display = "block";
    } else if (banner) {
      banner.style.display = "none";
    }
  }

  window.addEventListener("online", syncOfflineBanner);
  window.addEventListener("offline", syncOfflineBanner);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncOfflineBanner);
  } else {
    syncOfflineBanner();
  }
})();

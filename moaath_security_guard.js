// ============================================================================
// طبقة الحماية والأمان والتعقيم الموحدة لمتجر معاذ (moaath_security_guard.js — v1.1)
// - تعقيم النصوص والروابط ضد XSS (window.moaathEscapeHtml / moaathSanitizeText / moaathSanitizeUrl)
// - تغليف التخزين المحلي (window.moaathSafeStorage) + فحص المفاتيح البدائية وكائنات JSON التالفة
// - فحص سلامة الكاش (Cache API) وتطهيره من أي استجابات تالفة أو روابط دفع/شام كاش
// - عزل أمني تام يمنع أي تداخل للذكاء الاصطناعي مع الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_SECURITY_GUARD_V11__) return;
  window.__MOAATH_SECURITY_GUARD_V11__ = true;
  window.__MOAATH_SECURITY_GUARD_V1__ = true;

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/`/g, "&#96;");
  }

  function sanitizePlainText(str, maxLen = 500) {
    return String(str === null || str === undefined ? "" : str)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, maxLen);
  }

  function sanitizeUrl(rawUrl, allowGeo = true) {
    const u = String(rawUrl || "").trim();
    if (!u) return "";
    if (/^(javascript|data|vbscript|file):/i.test(u)) return "";
    if (/^https:\/\//i.test(u)) return u;
    if (allowGeo && /^geo:[-0-9.,?q=&]+$/i.test(u)) return u;
    if (/^(\.\/|\/)?[a-zA-Z0-9_\-./]+(\?[a-zA-Z0-9_\-=&.%]+)?$/.test(u)) return u;
    return "";
  }

  window.moaathEscapeHtml = escapeHtml;
  window.moaathSanitizeText = sanitizePlainText;
  window.moaathSanitizeUrl = sanitizeUrl;

  const FINANCIAL_TAMPER_RX = /shamcash|sham_cash|payment_secret|admin_pin|password/i;

  const safeStorage = {
    getJSON(key, fallback = null) {
      try {
        const raw = localStorage.getItem(String(key));
        if (raw === null || raw === undefined || raw === "") return fallback;
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object") return fallback;
        return parsed;
      } catch (_) {
        try { localStorage.removeItem(String(key)); } catch (__) {}
        return fallback;
      }
    },
    setJSON(key, value) {
      const k = String(key || "");
      if (!k || FINANCIAL_TAMPER_RX.test(k)) return false;
      try {
        const serialized = JSON.stringify(value);
        if (serialized.length > 512 * 1024) return false;
        localStorage.setItem(k, serialized);
        return true;
      } catch (_) {
        return false;
      }
    },
    getSessionJSON(key, fallback = null) {
      try {
        const raw = sessionStorage.getItem(String(key));
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === "object") ? parsed : fallback;
      } catch (_) {
        try { sessionStorage.removeItem(String(key)); } catch (__) {}
        return fallback;
      }
    },
    setSessionJSON(key, value) {
      const k = String(key || "");
      if (!k || FINANCIAL_TAMPER_RX.test(k)) return false;
      try {
        sessionStorage.setItem(k, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  window.moaathSafeStorage = safeStorage;

  const KNOWN_JSON_KEYS = [
    "moaath_cart",
    "moaath_user",
    "moaath_store_pet_prefs",
    "moaath_store_pet_pos",
    "moaath_store_pet_learned",
    "moaath_store_local_synonyms",
    "moaath_store_local_recipes",
    "moaath_learning_metrics_v1",
    "moaath_last_order_snapshot_v1",
    "moaath_egg_hatched_v1",
    "moaath_gps_saved_home_v1",
    "moaath_gps_point_radii_v2"
  ];

  const KNOWN_PRIMITIVE_RULES = {
    moaath_store_ai_collapsed: (v) => /^(0|1|true|false)$/.test(v),
    moaath_store_userbar_collapsed: (v) => /^(0|1|true|false)$/.test(v),
    moaath_store_chips_collapsed: (v) => /^(0|1|true|false)$/.test(v),
    moaath_theme: (v) => /^(light|dark)$/.test(v),
    moaath_active_branch: (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 64,
    moaath_active_branch_id: (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 64,
    moaath_ai_worker_url: (v) => v === "" || /^https:\/\/[a-zA-Z0-9.-]+(\/.*)?$/.test(v)
  };

  function auditLocalStorageHealth() {
    let repairedCount = 0;

    KNOWN_JSON_KEYS.forEach((k) => {
      try {
        const raw = localStorage.getItem(k);
        if (raw === null || raw === "") return;
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object") {
          localStorage.removeItem(k);
          repairedCount++;
        }
      } catch (_) {
        try {
          localStorage.removeItem(k);
          repairedCount++;
        } catch (__) {}
      }
    });

    Object.keys(KNOWN_PRIMITIVE_RULES).forEach((k) => {
      try {
        const raw = localStorage.getItem(k);
        if (raw === null) return;
        const isValid = KNOWN_PRIMITIVE_RULES[k](String(raw).trim());
        if (!isValid) {
          localStorage.removeItem(k);
          repairedCount++;
        }
      } catch (_) {}
    });

    return repairedCount;
  }

  function hardenExternalLinks(root = document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (/^(javascript|data|vbscript):/i.test(href.trim())) {
        a.removeAttribute("href");
        return;
      }
      if (a.target === "_blank") {
        const rel = (a.getAttribute("rel") || "").toLowerCase();
        if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
          a.setAttribute("rel", "noopener noreferrer");
        }
      }
    });
  }

  async function verifyAndPurifyCaches() {
    if (typeof caches === "undefined") return { checked: 0, purged: 0 };
    let checked = 0;
    let purged = 0;
    try {
      const names = await caches.keys();
      for (const name of names) {
        if (!/moaath/i.test(name)) continue;
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const req of requests) {
          checked++;
          const urlLower = req.url.toLowerCase();
          if (/shamcash|payment|workers\.dev/.test(urlLower)) {
            await cache.delete(req);
            purged++;
            continue;
          }
          const resp = await cache.match(req);
          if (!resp || resp.status !== 200) {
            await cache.delete(req);
            purged++;
            continue;
          }
          const ct = (resp.headers.get("content-type") || "").toLowerCase();
          if (urlLower.endsWith(".js") && ct.includes("text/html")) {
            await cache.delete(req);
            purged++;
          }
        }
      }
    } catch (_) {}
    return { checked, purged };
  }

  function enforceFinancialIsolation() {
    window.verifyShamCashPaymentWithAI = null;
    window.checkPaymentReceiptAI = null;
    window.checkShamCashPriceAI = null;
    window.verifyShamCashAmountAI = null;
    window.analyzeShamCashReceiptOCR = function () {
      const outBox = document.getElementById("shamCashOcrResult");
      if (outBox) {
        outBox.innerHTML = "";
        outBox.style.display = "none";
      }
      return null;
    };
  }

  window.MoaathSecurityGuard = {
    version: "1.1",
    escapeHtml,
    sanitizeText: sanitizePlainText,
    sanitizeUrl,
    storage: safeStorage,
    auditStorage: auditLocalStorageHealth,
    purifyCaches: verifyAndPurifyCaches,
    hardenLinks: hardenExternalLinks
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("security_guard", "1.1");
  }

  function init() {
    enforceFinancialIsolation();
    auditLocalStorageHealth();
    hardenExternalLinks(document);
    setTimeout(verifyAndPurifyCaches, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

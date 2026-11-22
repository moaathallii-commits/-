// ============================================================================
// طبقة تحسين واجهة متجر معاذ المستقبلية (store_ui_futuristic.js — v3.0)
// - ضغط الهيدر العلوي وشريط المستخدم لتوفير مساحة الشاشة الأولى
// - تحويل العروض الخاصة تلقائياً إلى شريط سحب أفقي مضغوط (84vw بحد أقصى 300px)
// - إخفاء الجنية العائمة (#petCharRoot) تلقائياً عند فتح المساعد الذكي
// - ضمان عمل زر فتح/طي المساعد الذكي + تثبيت شريط التصنيفات + زر العودة للأعلى
// - عزل تام عن الدفع وشام كاش وبدون أي تعديل على وظائف index.html
// ============================================================================
(function () {
  if (window.__MOAATH_STORE_UI_V3__) return;
  window.__MOAATH_STORE_UI_V3__ = true;

  var COLLAPSE_KEY = "moaath_store_ai_collapsed";

  function $(id) {
    return document.getElementById(id);
  }

  function injectStoreFuturisticCSS() {
    var style = $("moaathStoreFuturisticCSS");
    if (!style) {
      style = document.createElement("style");
      style.id = "moaathStoreFuturisticCSS";
      document.head.appendChild(style);
    }

    style.textContent = [
      "/* 1. منع الانزياح الأفقي والحفاظ على سلاسة التمرير العمودي */",
      "html, body { max-width: 100%; overflow-x: clip; }",
      "",
      "/* 2. ضغط الهيدر العلوي بمظهر زجاجي مستقبلِي */",
      "header, .store-header, .top-bar {",
      "  padding: 6px 11px !important;",
      "  margin-bottom: 5px !important;",
      "  border-radius: 0 0 18px 18px !important;",
      "  backdrop-filter: blur(12px) !important;",
      "  -webkit-backdrop-filter: blur(12px) !important;",
      "}",
      "",
      "/* 3. ضغط وتنظيم شريط المستخدم ليصبح أكثر أناقة وأقل ارتفاعاً */",
      ".user-bar, .user-info-bar, #userInfoBar, [class*='user-bar'] {",
      "  border-radius: 14px !important;",
      "  padding: 6px 9px !important;",
      "  margin: 4px 0 6px 0 !important;",
      "  font-size: 11px !important;",
      "  line-height: 1.4 !important;",
      "  background: rgba(255, 255, 255, 0.035) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.25) !important;",
      "}",
      "body.light-mode .user-bar, body.light-mode .user-info-bar, body.light-mode #userInfoBar {",
      "  background: rgba(255, 255, 255, 0.94) !important;",
      "  border-color: rgba(180, 140, 20, 0.3) !important;",
      "}",
      "",
      "/* 4. تحويل العروض الخاصة إلى شريط سحب أفقي مضغوط (Slider) */",
      ".moaath-offers-track {",
      "  display: flex !important;",
      "  flex-direction: row !important;",
      "  flex-wrap: nowrap !important;",
      "  overflow-x: auto !important;",
      "  overflow-y: hidden !important;",
      "  scroll-snap-type: x mandatory !important;",
      "  gap: 10px !important;",
      "  padding: 4px 2px 10px 2px !important;",
      "  margin: 4px 0 8px 0 !important;",
      "  scrollbar-width: none !important;",
      "  -webkit-overflow-scrolling: touch !important;",
      "  touch-action: pan-x pan-y !important;",
      "}",
      ".moaath-offers-track::-webkit-scrollbar { display: none !important; }",
      ".moaath-offer-card-slide {",
      "  flex: 0 0 84vw !important;",
      "  width: 84vw !important;",
      "  min-width: 230px !important;",
      "  max-width: 300px !important;",
      "  scroll-snap-align: start !important;",
      "  box-sizing: border-box !important;",
      "  margin: 0 !important;",
      "  padding: 9px 10px !important;",
      "  border-radius: 15px !important;",
      "  background: linear-gradient(155deg, rgba(22, 30, 46, 0.95), rgba(12, 17, 28, 0.98)) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.38) !important;",
      "  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28) !important;",
      "}",
      "body.light-mode .moaath-offer-card-slide {",
      "  background: #ffffff !important;",
      "  border-color: rgba(180, 140, 20, 0.32) !important;",
      "}",
      "",
      "/* 5. تثبيت شريط التصنيفات العلوي أثناء التمرير */",
      ".categories {",
      "  position: sticky !important;",
      "  top: 0 !important;",
      "  z-index: 45 !important;",
      "  background: rgba(12, 16, 24, 0.9) !important;",
      "  backdrop-filter: blur(12px) !important;",
      "  -webkit-backdrop-filter: blur(12px) !important;",
      "  border-radius: 14px !important;",
      "  padding: 6px !important;",
      "  scrollbar-width: none !important;",
      "}",
      "body.light-mode .categories { background: rgba(248, 250, 252, 0.94) !important; }",
      "",
      "/* 6. ضمان فتح وطي المساعد الذكي وإخفاء الجنية العائمة عند الفتح */",
      "#aiSmartAssistantBox.is-ai-collapsed #futuristicAiBody, #futuristicAiBody.is-collapsed {",
      "  display: none !important;",
      "  max-height: 0 !important;",
      "  opacity: 0 !important;",
      "}",
      "#aiSmartAssistantBox:not(.is-ai-collapsed) #futuristicAiBody:not(.is-collapsed) {",
      "  display: block !important;",
      "}",
      "body.moaath-ai-expanded #petCharRoot {",
      "  opacity: 0 !important;",
      "  visibility: hidden !important;",
      "  pointer-events: none !important;",
      "  transform: scale(0.75) !important;",
      "}",
      "",
      "/* 7. شريط إتمام الطلب السفلي الزجاجي */",
      ".cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar {",
      "  border-radius: 18px !important;",
      "  backdrop-filter: blur(14px) !important;",
      "  -webkit-backdrop-filter: blur(14px) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.35) !important;",
      "  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.45) !important;",
      "}",
      "",
      "/* 8. زر العودة للأعلى الذكي */",
      "#moaathBackToTopBtn {",
      "  position: fixed;",
      "  bottom: 86px;",
      "  left: 14px;",
      "  z-index: 95;",
      "  width: 38px;",
      "  height: 38px;",
      "  border-radius: 50%;",
      "  border: 1px solid rgba(212, 175, 55, 0.6);",
      "  background: rgba(15, 23, 42, 0.9);",
      "  color: #d4af37;",
      "  font-size: 16px;",
      "  font-weight: 900;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  cursor: pointer;",
      "  opacity: 0;",
      "  pointer-events: none;",
      "  transform: translateY(10px);",
      "  transition: opacity 0.25s ease, transform 0.25s ease;",
      "}",
      "#moaathBackToTopBtn.is-visible {",
      "  opacity: 1;",
      "  pointer-events: auto;",
      "  transform: translateY(0);",
      "}"
    ].join("\n");
  }

  function applyOffersHorizontalSlider() {
    var cards = [];
    var seen = new Set();

    function addCard(el) {
      if (!el || seen.has(el) || el === document.body || el === document.documentElement) return;
      if (!el.parentElement || el.parentElement === document.body) return;
      seen.add(el);
      cards.push(el);
    }

    document.querySelectorAll(".offer-card, [class*='offer-card']").forEach(addCard);

    if (cards.length < 2) {
      document.querySelectorAll("button[onclick*='OFFER_'], [data-offer-id]").forEach(function (btn) {
        var card = btn.closest("div[style*='border'], article, .card, div");
        if (card && card.parentElement && card.parentElement !== document.body && card.offsetHeight < 360) {
          addCard(card);
        }
      });
    }

    if (cards.length < 2) {
      document.querySelectorAll("div").forEach(function (div) {
        var txt = div.textContent || "";
        if (div.children.length > 0 && div.children.length <= 7 && /عرض\s*خاص/.test(txt)) {
          var h = div.offsetHeight;
          if (h > 65 && h < 340 && div.parentElement && div.parentElement !== document.body) {
            addCard(div);
          }
        }
      });
    }

    if (cards.length < 2) return;

    var parentMap = new Map();
    cards.forEach(function (c) {
      var p = c.parentElement;
      parentMap.set(p, (parentMap.get(p) || 0) + 1);
    });

    var bestParent = null;
    var bestCount = 0;
    parentMap.forEach(function (count, p) {
      if (count > bestCount) {
        bestCount = count;
        bestParent = p;
      }
    });

    if (bestParent && bestCount >= 2) {
      bestParent.classList.add("moaath-offers-track");
      Array.prototype.forEach.call(bestParent.children, function (child) {
        if (child.tagName === "DIV" || child.tagName === "ARTICLE") {
          child.classList.add("moaath-offer-card-slide");
        }
      });
    }
  }

  function readCollapsedPref() {
    try {
      var v = localStorage.getItem(COLLAPSE_KEY);
      if (v === null) return true;
      return v === "1" || v === "true";
    } catch (_) {
      return true;
    }
  }

  function writeCollapsedPref(isCollapsed) {
    try {
      localStorage.setItem(COLLAPSE_KEY, isCollapsed ? "1" : "0");
    } catch (_) {}
  }

  function syncAssistantState(forceCollapsed) {
    var collapsed = (typeof forceCollapsed === "boolean") ? forceCollapsed : readCollapsedPref();
    var dock = $("aiSmartAssistantBox");
    var body = $("futuristicAiBody");
    var btn = $("futuristicAiToggleBtn");

    if (dock) {
      dock.classList.toggle("is-ai-collapsed", collapsed);
      dock.classList.toggle("is-dock-collapsed", collapsed);
    }
    if (body) {
      body.classList.toggle("is-collapsed", collapsed);
      body.style.display = collapsed ? "none" : "block";
    }
    if (btn) {
      btn.setAttribute("aria-expanded", String(!collapsed));
      btn.innerHTML = collapsed
        ? '<span class="fut-dot"></span><span>فتح المساعد والبحث</span><span class="fut-chev">▾</span>'
        : '<span class="fut-dot"></span><span>طي المساعد</span><span class="fut-chev">▴</span>';
    }

    document.body.classList.toggle("moaath-ai-expanded", !collapsed);
    document.body.classList.toggle("ai-dock-expanded", !collapsed);
  }

  window.toggleFuturisticAssistantPanel = function (forceState) {
    var currentCollapsed = readCollapsedPref();
    var nextCollapsed = (typeof forceState === "boolean") ? !forceState : !currentCollapsed;
    writeCollapsedPref(nextCollapsed);
    syncAssistantState(nextCollapsed);
  };

  function bindToggleButtonDirect() {
    var btn = $("futuristicAiToggleBtn");
    if (!btn) return;
    btn.onclick = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      window.toggleFuturisticAssistantPanel();
    };
  }

  function mountBackToTop() {
    if ($("moaathBackToTopBtn")) return;
    var btn = document.createElement("button");
    btn.id = "moaathBackToTopBtn";
    btn.type = "button";
    btn.title = "العودة للأعلى";
    btn.textContent = "↑";
    btn.onclick = function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 360);
    }, { passive: true });
  }

  var timer = null;
  function runAll() {
    injectStoreFuturisticCSS();
    applyOffersHorizontalSlider();
    bindToggleButtonDirect();
    syncAssistantState();
    mountBackToTop();
  }

  function init() {
    runAll();
    var obs = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(runAll, 200);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

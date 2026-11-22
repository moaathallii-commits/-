// ============================================================================
// store_ui_futuristic.js - v4.1 (طبقة تحسين واجهة متجر معاذ المستقبلية)
// - التفاف تلقائي ذكي لبطاقات العروض الخاصة داخل شريط سحب أفقي مضغوط (Slider)
// - ضغط الهيدر وشريط المستخدم وتثبيت شريط التصنيفات
// - فتح وطي المساعد الذكي وإخفاء الجنية العائمة تلقائياً عند الفتح
// - عزل تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_STORE_UI_V41__) return;
  window.__MOAATH_STORE_UI_V41__ = true;

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
      "/* 1. حماية التمرير العمودي ومنع الانزياح الأفقي */",
      "html, body { max-width: 100% !important; overflow-x: clip !important; }",

      "/* 2. ضغط الهيدر العلوي بمظهر زجاجي مستقبلي */",
      "header, .store-header, .top-bar {",
      "  padding: 6px 11px !important;",
      "  margin-bottom: 5px !important;",
      "  border-radius: 0 0 18px 18px !important;",
      "  backdrop-filter: blur(12px) !important;",
      "  -webkit-backdrop-filter: blur(12px) !important;",
      "}",

      "/* 3. ضغط وتنظيم شريط المستخدم ليأخذ مساحة أقل */",
      ".user-bar, .user-info-bar, #userInfoBar, [class*='user-bar'] {",
      "  border-radius: 14px !important;",
      "  padding: 5px 9px !important;",
      "  margin: 4px 0 6px 0 !important;",
      "  font-size: 11px !important;",
      "  line-height: 1.35 !important;",
      "}",

      "/* 4. شريط السحب الأفقي المضغوط لبطاقات العروض الخاصة */",
      ".moaath-offers-track {",
      "  display: flex !important;",
      "  flex-direction: row !important;",
      "  flex-wrap: nowrap !important;",
      "  align-items: stretch !important;",
      "  grid-template-columns: none !important;",
      "  overflow-x: auto !important;",
      "  overflow-y: hidden !important;",
      "  scroll-snap-type: x mandatory !important;",
      "  gap: 10px !important;",
      "  padding: 4px 2px 10px 2px !important;",
      "  margin: 4px 0 8px 0 !important;",
      "  scrollbar-width: none !important;",
      "  -webkit-overflow-scrolling: touch !important;",
      "  touch-action: pan-x pan-y !important;",
      "  width: 100% !important;",
      "  box-sizing: border-box !important;",
      "}",
      ".moaath-offers-track::-webkit-scrollbar { display: none !important; }",

      ".moaath-offers-track > .moaath-offer-card-slide,",
      ".moaath-offer-card-slide {",
      "  flex: 0 0 84vw !important;",
      "  width: 84vw !important;",
      "  min-width: 240px !important;",
      "  max-width: 310px !important;",
      "  scroll-snap-align: start !important;",
      "  box-sizing: border-box !important;",
      "  margin: 0 !important;",
      "  padding: 9px 10px !important;",
      "  border-radius: 15px !important;",
      "}",

      "/* 5. تثبيت شريط التصنيفات العلوي أثناء التمرير */",
      ".categories {",
      "  position: sticky !important;",
      "  top: 0 !important;",
      "  z-index: 45 !important;",
      "  background: rgba(12, 16, 24, 0.92) !important;",
      "  backdrop-filter: blur(12px) !important;",
      "  -webkit-backdrop-filter: blur(12px) !important;",
      "  border-radius: 14px !important;",
      "  padding: 6px !important;",
      "  scrollbar-width: none !important;",
      "}",
      "body.light-mode .categories { background: rgba(248, 250, 252, 0.95) !important; }",

      "/* 6. فتح وطي المساعد الذكي وإخفاء الجنية العائمة عند الفتح */",
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

      "/* 7. شريط إتمام الطلب السفلي الزجاجي */",
      ".cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar {",
      "  border-radius: 18px !important;",
      "  backdrop-filter: blur(14px) !important;",
      "  -webkit-backdrop-filter: blur(14px) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.35) !important;",
      "}",

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

  function findOfferCards() {
    var raw = [];
    var seen = new Set();

    function addCandidate(el) {
      if (!el || seen.has(el)) return;
      if (el === document.body || el === document.documentElement) return;
      if (el.closest(".modal-overlay")) return;
      if (el.id === "moaathOffersSliderTrack") return;
      var h = el.offsetHeight;
      if (h < 60 || h > 440) return;
      seen.add(el);
      raw.push(el);
    }

    // 1. البحث بالكلاسات الصريحة أولاً
    document.querySelectorAll(".offer-card, [class*='offer-card']").forEach(function (el) {
      if (el.querySelector("img")) addCandidate(el);
    });

    // 2. البحث بالنص المميز لبطاقات العروض (متوفر أو سيتم إعلامك)
    if (raw.length < 2) {
      document.querySelectorAll("div, article").forEach(function (el) {
        var txt = el.textContent || "";
        if (/عرض\s*خاص|عرض\s*محدث/.test(txt) && el.querySelector("img")) {
          addCandidate(el);
        }
      });
    }

    // استبعاد أي عنصر يحتوي بداخله على بطاقة عرض أخرى (للاحتفاظ بالبطاقات الفردية فقط)
    return raw.filter(function (el) {
      return !raw.some(function (other) {
        return other !== el && el.contains(other);
      });
    });
  }

  function applyOffersHorizontalSlider() {
    var cards = findOfferCards();
    if (cards.length < 2) return;

    // إذا كانت جميع البطاقات داخل الشريط الأفقي بالفعل، نؤكد الكلاسات فقط دون إعادة تعديل DOM
    var existingTrack = $("moaathOffersSliderTrack");
    if (existingTrack && cards.every(function (c) { return c.parentElement === existingTrack; })) {
      cards.forEach(function (c) { c.classList.add("moaath-offer-card-slide"); });
      return;
    }

    // تحديد الأب المشترك لأغلب البطاقات
    var parentCounts = new Map();
    cards.forEach(function (c) {
      var p = c.parentElement;
      if (!p || p === document.body) return;
      parentCounts.set(p, (parentCounts.get(p) || 0) + 1);
    });

    var bestParent = null;
    var bestCount = 0;
    parentCounts.forEach(function (count, p) {
      if (count > bestCount) {
        bestCount = count;
        bestParent = p;
      }
    });

    if (!bestParent || bestCount < 2) return;

    var groupCards = cards.filter(function (c) { return c.parentElement === bestParent; });
    var otherChildren = Array.prototype.filter.call(bestParent.children, function (ch) {
      if (ch.tagName === "SCRIPT" || ch.tagName === "STYLE") return false;
      return groupCards.indexOf(ch) === -1;
    });

    var track = bestParent;
    // إذا كان الأب يحتوي عناصر أخرى غير العروض (مثل زر طلب صنف)، ننشئ حاوية مستقلة للعروض فقط
    if (otherChildren.length > 0) {
      track = document.createElement("div");
      track.id = "moaathOffersSliderTrack";
      track.className = "moaath-offers-track";
      bestParent.insertBefore(track, groupCards[0]);
      groupCards.forEach(function (card) {
        track.appendChild(card);
      });
    } else {
      track.classList.add("moaath-offers-track");
    }

    groupCards.forEach(function (card) {
      card.classList.add("moaath-offer-card-slide");
    });
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

  function start() {
    runAll();
    var obs = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(runAll, 200);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

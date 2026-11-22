// ============================================================================
// طبقة تحسين واجهة متجر معاذ المستقبلية (store_ui_futuristic.js — v1.1)
// - اكتشاف ذكي تلقائي لبطاقات العروض (حتى بدون كلاس offer-card) وتحويلها لسحب أفقي
// - ضمان عمل زر فتح/طي المساعد الذكي وإخفاء الجنية العائمة تلقائياً عند الفتح
// - ضغط الهيدر وشريط المستخدم + تثبيت التصنيفات + زر العودة للأعلى
// - عزل تام عن الدفع وشام كاش وبدون أي تعديل على وظائف index.html
// ============================================================================
(function () {
  if (window.__MOAATH_STORE_UI_V11__) return;
  window.__MOAATH_STORE_UI_V11__ = true;

  function injectStoreFuturisticCSS() {
    let style = document.getElementById("moaathStoreFuturisticCSS");
    if (!style) {
      style = document.createElement("style");
      style.id = "moaathStoreFuturisticCSS";
      document.head.appendChild(style);
    }
    style.textContent = `
      body {
        overflow-x: clip !important;
        max-width: 100% !important;
      }

      /* ضغط الهيدر العلوي */
      header, .store-header, .top-bar {
        padding: 7px 11px !important;
        margin-bottom: 6px !important;
        border-radius: 0 0 18px 18px !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }

      /* حاوية السحب الأفقي للعروض (تُضاف تلقائياً عبر JS) */
      .moaath-offers-slider {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scroll-snap-type: x mandatory !important;
        gap: 10px !important;
        padding: 4px 2px 10px 2px !important;
        margin: 4px 0 8px 0 !important;
        scrollbar-width: none !important;
        -webkit-overflow-scrolling: touch !important;
        touch-action: pan-x pan-y !important;
      }
      .moaath-offers-slider::-webkit-scrollbar {
        display: none !important;
      }
      .moaath-offer-slide-item {
        min-width: 82vw !important;
        max-width: 290px !important;
        width: 82vw !important;
        flex: 0 0 auto !important;
        scroll-snap-align: start !important;
        margin: 0 !important;
        padding: 9px 10px !important;
        border-radius: 15px !important;
        box-sizing: border-box !important;
      }

      /* تثبيت شريط التصنيفات */
      .categories {
        position: sticky !important;
        top: 0 !important;
        z-index: 45 !important;
        background: rgba(12, 16, 24, 0.9) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border-radius: 14px !important;
        padding: 6px !important;
        scrollbar-width: none !important;
      }
      body.light-mode .categories {
        background: rgba(248, 250, 252, 0.94) !important;
      }

      /* إخفاء الجنية العائمة تماماً عند فتح المساعد الذكي */
      body.moaath-ai-open #petCharRoot {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* ضمان طي وفتح جسم المساعد بسلاسة */
      #futuristicAiBody.is-collapsed {
        display: none !important;
        max-height: 0 !important;
        opacity: 0 !important;
      }

      /* زر العودة للأعلى */
      #moaathBackToTopBtn {
        position: fixed;
        bottom: 86px;
        left: 14px;
        z-index: 95;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid rgba(212, 175, 55, 0.55);
        background: rgba(15, 23, 42, 0.88);
        color: #d4af37;
        font-size: 16px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      #moaathBackToTopBtn.is-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
    `;
  }

  // اكتشاف بطاقات العروض تلقائياً من النص أو أزرار OFFER_ مهما كان اسم الكلاس في index.html
  function enhanceOffersContainer() {
    const candidates = new Set();

    // 1) البحث عبر الكلاسات المعروفة
    document.querySelectorAll(".offer-card, [class*='offer-card']").forEach(el => candidates.add(el));

    // 2) البحث الذكي عبر أزرار OFFER_ أو عبارة "عرض خاص"
    if (candidates.size < 2) {
      const allBtns = document.querySelectorAll("button[onclick*='OFFER_'], [data-offer-id]");
      allBtns.forEach(btn => {
        const card = btn.closest("div[style*='border'], .card, .offer-card, div");
        if (card && card.parentElement && card.parentElement !== document.body) {
          candidates.add(card);
        }
      });
    }

    if (candidates.size < 2) {
      const divs = document.querySelectorAll("div");
      divs.forEach(div => {
        if (div.children.length > 0 && div.children.length <= 6 && /عرض\s*خاص/.test(div.textContent || "")) {
          const style = window.getComputedStyle(div);
          if (style.borderStyle !== "none" && div.offsetHeight > 70 && div.offsetHeight < 320) {
            candidates.add(div);
          }
        }
      });
    }

    const cardsArr = Array.from(candidates);
    if (cardsArr.length < 2) return;

    // إيجاد الأب المشترك المباشر لبطاقات العروض
    const parentCount = new Map();
    cardsArr.forEach(c => {
      if (c.parentElement && c.parentElement !== document.body) {
        parentCount.set(c.parentElement, (parentCount.get(c.parentElement) || 0) + 1);
      }
    });

    let bestParent = null;
    let bestCount = 0;
    parentCount.forEach((cnt, p) => {
      if (cnt > bestCount) {
        bestCount = cnt;
        bestParent = p;
      }
    });

    if (bestParent && bestCount >= 2) {
      bestParent.classList.add("moaath-offers-slider");
      Array.from(bestParent.children).forEach(ch => {
        if (ch.tagName === "DIV") ch.classList.add("moaath-offer-slide-item");
      });
    }
  }

  // مزامنة إخفاء الجنية + ضمان عمل زر فتح/طي المساعد
  function syncFairyVisibilityWithAssistant() {
    const bodyEl = document.getElementById("futuristicAiBody");
    const dockEl = document.getElementById("aiSmartAssistantBox");
    if (!bodyEl || !dockEl) return;
    const isCollapsed = bodyEl.classList.contains("is-collapsed") || dockEl.classList.contains("is-dock-collapsed");
    document.body.classList.toggle("moaath-ai-open", !isCollapsed);
  }

  function bindAssistantToggleSafety() {
    const btn = document.getElementById("futuristicAiToggleBtn");
    if (!btn || btn.dataset.safeToggleBound) return;
    btn.dataset.safeToggleBound = "1";
    btn.addEventListener("click", () => {
      setTimeout(syncFairyVisibilityWithAssistant, 40);
    });
  }

  function mountBackToTop() {
    if (document.getElementById("moaathBackToTopBtn")) return;
    const btn = document.createElement("button");
    btn.id = "moaathBackToTopBtn";
    btn.type = "button";
    btn.title = "العودة للأعلى";
    btn.textContent = "↑";
    btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.appendChild(btn);

    window.addEventListener("scroll", () => {
      btn.classList.toggle("is-visible", window.scrollY > 360);
    }, { passive: true });
  }

  let debounceTimer = null;
  function runAll() {
    injectStoreFuturisticCSS();
    enhanceOffersContainer();
    bindAssistantToggleSafety();
    syncFairyVisibilityWithAssistant();
    mountBackToTop();
  }

  function initObserver() {
    runAll();
    const obs = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runAll, 250);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initObserver);
  } else {
    initObserver();
  }
})();

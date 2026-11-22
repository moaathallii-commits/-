// ============================================================================
// طبقة تحسين واجهة متجر معاذ المستقبلية (store_ui_futuristic.js — v1.0)
// - ضغط الهيدر العلوي وشريط المستخدم لتوفير مساحة الشاشة الأولى
// - تحويل العروض الخاصة تلقائياً إلى شريط سحب أفقي مضغوط (Horizontal Slider)
// - إخفاء الجنية العائمة تلقائياً عند فتح المساعد الذكي لمنع أي تداخل
// - تثبيت شريط التصنيفات + شريط السلة الزجاجي + زر العودة للأعلى الذكي
// - عزل تام عن الدفع وشام كاش وبدون أي تعديل على وظائف index.html
// ============================================================================
(function () {
  if (window.__MOAATH_STORE_UI_V1__) return;
  window.__MOAATH_STORE_UI_V1__ = true;

  function injectStoreFuturisticCSS() {
    if (document.getElementById("moaathStoreFuturisticCSS")) return;
    const style = document.createElement("style");
    style.id = "moaathStoreFuturisticCSS";
    style.textContent = `
      /* 1. حماية التمرير العمودي ومنع الانزياح الأفقي */
      body {
        overflow-x: clip !important;
        max-width: 100% !important;
      }

      /* 2. ضغط الهيدر العلوي بمظهر زجاجي أنيق */
      header, .store-header, .top-bar {
        padding: 7px 11px !important;
        margin-bottom: 6px !important;
        border-radius: 0 0 18px 18px !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }

      /* 3. ضغط وتنظيم شريط المستخدم */
      .user-bar, .user-info-bar, #userInfoBar, [class*="user-bar"] {
        border-radius: 14px !important;
        padding: 6px 9px !important;
        margin: 5px 0 7px 0 !important;
        font-size: 11px !important;
        line-height: 1.45 !important;
        background: rgba(255, 255, 255, 0.035) !important;
        border: 1px solid rgba(212, 175, 55, 0.24) !important;
      }
      body.light-mode .user-bar,
      body.light-mode .user-info-bar,
      body.light-mode #userInfoBar {
        background: rgba(255, 255, 255, 0.92) !important;
        border-color: rgba(180, 140, 20, 0.28) !important;
      }

      /* 4. تحويل العروض الخاصة إلى شريط سحب أفقي مضغوط (Slider) */
      .moaath-offers-slider,
      #specialOffersSection,
      #offersSection,
      .offers-grid,
      .offers-container,
      .special-offers-list {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        scroll-snap-type: x mandatory !important;
        gap: 9px !important;
        padding: 4px 2px 8px 2px !important;
        margin-bottom: 6px !important;
        scrollbar-width: none !important;
        -webkit-overflow-scrolling: touch !important;
      }
      .moaath-offers-slider::-webkit-scrollbar,
      #specialOffersSection::-webkit-scrollbar,
      #offersSection::-webkit-scrollbar,
      .offers-grid::-webkit-scrollbar,
      .offers-container::-webkit-scrollbar {
        display: none !important;
      }
      .offer-card, [class*="offer-card"] {
        min-width: 248px !important;
        max-width: 272px !important;
        flex: 0 0 auto !important;
        scroll-snap-align: start !important;
        padding: 9px 10px !important;
        margin: 0 !important;
        border-radius: 15px !important;
        background: linear-gradient(155deg, rgba(22, 30, 46, 0.94), rgba(12, 17, 28, 0.98)) !important;
        border: 1px solid rgba(212, 175, 55, 0.38) !important;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28) !important;
      }
      body.light-mode .offer-card,
      body.light-mode [class*="offer-card"] {
        background: #ffffff !important;
        border-color: rgba(180, 140, 20, 0.32) !important;
      }

      /* 5. تثبيت شريط التصنيفات العلوي أثناء التمرير */
      .categories {
        position: sticky !important;
        top: 0 !important;
        z-index: 45 !important;
        background: rgba(12, 16, 24, 0.9) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border-radius: 14px !important;
        padding: 6px !important;
        margin: 4px 0 8px 0 !important;
        scrollbar-width: none !important;
      }
      body.light-mode .categories {
        background: rgba(248, 250, 252, 0.94) !important;
      }

      /* 6. شريط إتمام الطلب السفلي الزجاجي */
      .cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar {
        border-radius: 18px !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
        border: 1px solid rgba(212, 175, 55, 0.35) !important;
        box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.45) !important;
      }

      /* 7. إخفاء الجنية العائمة تلقائياً عند فتح المساعد الذكي */
      body.moaath-ai-open #petCharRoot {
        opacity: 0 !important;
        transform: scale(0.75) !important;
        pointer-events: none !important;
      }

      /* 8. زر العودة للأعلى الذكي */
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
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
      #moaathBackToTopBtn.is-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  // اكتشاف حاوية بطاقات العروض تلقائياً مهما كان اسمها وتفعيل السحب الأفقي عليها
  function enhanceOffersContainer() {
    const offerCards = document.querySelectorAll(".offer-card, [class*='offer-card']");
    if (offerCards.length < 2) return;
    const parent = offerCards[0].parentElement;
    if (parent && !parent.classList.contains("moaath-offers-slider")) {
      parent.classList.add("moaath-offers-slider");
    }
  }

  // مراقبة حالة فتح/طي المساعد الذكي لإخفاء الجنية العائمة تلقائياً
  function syncFairyVisibilityWithAssistant() {
    const bodyEl = document.getElementById("futuristicAiBody");
    const dockEl = document.getElementById("aiSmartAssistantBox");
    const isOpen = (bodyEl && !bodyEl.classList.contains("is-collapsed")) ||
                   (dockEl && !dockEl.classList.contains("is-dock-collapsed"));
    document.body.classList.toggle("moaath-ai-open", !!isOpen);
  }

  function watchAssistantToggle() {
    syncFairyVisibilityWithAssistant();
    const target = document.getElementById("aiSmartAssistantBox");
    if (!target || target.dataset.uiWatched) return;
    target.dataset.uiWatched = "1";
    const obs = new MutationObserver(syncFairyVisibilityWithAssistant);
    obs.observe(target, { attributes: true, subtree: true, attributeFilter: ["class"] });
  }

  // زر العودة للأعلى الذكي
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

  function initAll() {
    injectStoreFuturisticCSS();
    enhanceOffersContainer();
    watchAssistantToggle();
    mountBackToTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // إعادة فحص العروض بعد تحميل بيانات Firebase
  setTimeout(initAll, 1200);
  setTimeout(enhanceOffersContainer, 2800);
})();

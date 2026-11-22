/* store_ui_futuristic.js — v5.8 (Step 4: Safe MutationObserver + Clean Search Sync + Zero Duplicate Containers + All 15 Store UI & 10 AI Enhancements) */
(function () {
  if (window.__MOAATH_STORE_UI_V58__) return;
  window.__MOAATH_STORE_UI_V58__ = true;
  window.__MOAATH_STORE_UI_V56__ = true;
  window.__MOAATH_STORE_UI_V55__ = true;
  window.__MOAATH_STORE_UI_V54__ = true;

  var COLLAPSE_KEY = "moaath_store_ai_collapsed";
  var USERBAR_COLLAPSE_KEY = "moaath_store_userbar_collapsed";
  var isSelfMutating = false;
  var isSearchSyncing = false;
  var obsTimer = null;
  var observer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function withSelfMutationGuard(fn) {
    isSelfMutating = true;
    try {
      fn();
    } finally {
      setTimeout(function () {
        isSelfMutating = false;
      }, 25);
    }
  }

  function injectStoreFuturisticCSS() {
    var style = $("moaathStoreFuturisticCSS");
    if (!style) {
      style = document.createElement("style");
      style.id = "moaathStoreFuturisticCSS";
      document.head.appendChild(style);
    }
    style.textContent = [
      ":root { --moaath-bg-deep: #0f141e; --moaath-gold: #D4AF37; --moaath-emerald: #10b981; --moaath-sky: #38bdf8; }",
      "html, body { max-width: 100% !important; overflow-x: clip !important; }",
      "body:not(.light-mode) { background-color: #0f141e !important; }",
      "body:not(.light-mode) .product-card, body:not(.light-mode) .offer-card, body:not(.light-mode) .moaath-offer-card-slide { background: linear-gradient(155deg, rgba(22, 30, 46, 0.96), rgba(15, 20, 30, 0.98)) !important; border-color: rgba(212, 175, 55, 0.3) !important; }",
      "body:not(.light-mode) .cat-btn.active { background: #D4AF37 !important; color: #0f141e !important; border-color: #D4AF37 !important; }",
      "header, .store-header, .top-bar { padding: 6px 11px !important; margin-bottom: 5px !important; border-radius: 0 0 18px 18px !important; background: rgba(15, 20, 30, 0.95) !important; border-bottom: 1px solid rgba(212, 175, 55, 0.32) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; }",
      "body.light-mode header, body.light-mode .store-header, body.light-mode .top-bar { background: rgba(255, 255, 255, 0.95) !important; }",
      ".moaath-header-phone-hidden { display: none !important; }",
      "#moaathFooterContactBar { margin: 14px 8px 92px 8px !important; padding: 10px 12px !important; border-radius: 14px !important; background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(212, 175, 55, 0.24) !important; text-align: center !important; font-size: 11px !important; color: var(--gray-text, #94a3b8) !important; }",

      /* Collapsible User Bar */
      ".moaath-userbar-shell { border-radius: 16px !important; padding: 6px 10px !important; margin: 4px 0 6px 0 !important; border: 1px solid rgba(212, 175, 55, 0.32) !important; background: rgba(255, 255, 255, 0.035) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; }",
      "body.light-mode .moaath-userbar-shell { background: #ffffff !important; }",
      ".moaath-userbar-toggle-row { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 8px !important; cursor: pointer !important; font-size: 11px !important; font-weight: 800 !important; user-select: none !important; }",
      ".moaath-userbar-summary { display: flex !important; align-items: center !important; gap: 6px !important; min-width: 0 !important; overflow: hidden !important; white-space: nowrap !important; text-overflow: ellipsis !important; color: var(--text-color) !important; }",
      ".moaath-userbar-menu-btn { width: 30px !important; height: 30px !important; border-radius: 50% !important; border: 1px solid rgba(212, 175, 55, 0.48) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; font-size: 13px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; }",
      ".moaath-userbar-body { margin-top: 7px !important; padding-top: 7px !important; border-top: 1px dashed rgba(212, 175, 55, 0.24) !important; display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 6px !important; }",
      ".moaath-userbar-shell.is-collapsed .moaath-userbar-body { display: none !important; }",
      ".moaath-glass-circle-btn { min-width: 34px !important; height: 34px !important; padding: 0 10px !important; border-radius: 999px !important; border: 1px solid rgba(212, 175, 55, 0.36) !important; background: rgba(255, 255, 255, 0.06) !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important; color: var(--text-color) !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important; font-size: 12px !important; cursor: pointer !important; margin: 0 !important; text-decoration: none !important; }",
      ".moaath-glass-icon-only { width: 34px !important; min-width: 34px !important; padding: 0 !important; border-radius: 50% !important; }",

      /* Horizontal Offers Slider */
      ".moaath-offers-track { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: stretch !important; grid-template-columns: none !important; overflow-x: auto !important; overflow-y: hidden !important; scroll-snap-type: x mandatory !important; gap: 10px !important; padding: 3px 2px 6px 2px !important; margin: 4px 0 2px 0 !important; scrollbar-width: none !important; -webkit-overflow-scrolling: touch !important; touch-action: pan-x pan-y !important; width: 100% !important; box-sizing: border-box !important; }",
      ".moaath-offers-track::-webkit-scrollbar { display: none !important; }",
      ".moaath-offers-track > div, .moaath-offers-track > article, .moaath-offer-card-slide { flex: 0 0 84vw !important; width: 84vw !important; min-width: 240px !important; max-width: 310px !important; scroll-snap-align: start !important; box-sizing: border-box !important; margin: 0 !important; padding: 7px 10px !important; border-radius: 15px !important; border: 1px solid rgba(212, 175, 55, 0.36) !important; }",
      "#moaathOffersDots { display: flex !important; justify-content: center !important; align-items: center !important; gap: 5px !important; margin: 2px 0 7px 0 !important; }",
      ".moaath-offer-dot { width: 6px !important; height: 6px !important; border-radius: 999px !important; background: rgba(212, 175, 55, 0.28) !important; transition: width 0.22s ease, background 0.22s ease !important; }",
      ".moaath-offer-dot.is-active { width: 16px !important; background: #D4AF37 !important; }",

      /* Unified Search Bar */
      ".moaath-unified-pill-bar { display: flex !important; align-items: center !important; gap: 5px !important; width: 100% !important; border-radius: 999px !important; padding: 4px 6px !important; margin: 5px 0 6px 0 !important; background: rgba(255, 255, 255, 0.045) !important; border: 1px solid rgba(212, 175, 55, 0.42) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; box-sizing: border-box !important; }",
      "body.light-mode .moaath-unified-pill-bar { background: #ffffff !important; }",
      ".moaath-unified-pill-input { flex: 1 !important; min-width: 0 !important; border: none !important; background: transparent !important; color: var(--text-color) !important; font-size: 11px !important; padding: 4px 8px !important; outline: none !important; }",
      ".moaath-pill-clear { width: 24px !important; height: 24px !important; padding: 0 !important; border-radius: 50% !important; border: none !important; background: rgba(239, 68, 68, 0.16) !important; color: #f87171 !important; font-size: 11px !important; font-weight: 900 !important; display: none; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; }",
      ".moaath-pill-clear.is-visible { display: inline-flex !important; }",
      ".moaath-pill-action { border-radius: 999px !important; padding: 4px 9px !important; font-size: 10px !important; font-weight: 800 !important; border: 1px solid rgba(212, 175, 55, 0.38) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; cursor: pointer !important; white-space: nowrap !important; flex-shrink: 0 !important; }",
      ".moaath-pill-mic { width: 28px !important; height: 28px !important; padding: 0 !important; border-radius: 50% !important; background: rgba(16, 185, 129, 0.16) !important; border-color: rgba(16, 185, 129, 0.42) !important; color: #10b981 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }",

      /* AI Dock */
      "#aiSmartAssistantBox.fut-ai-dock { padding: 6px 8px !important; margin: 4px 0 8px 0 !important; border-radius: 16px !important; background: linear-gradient(155deg, rgba(18, 25, 39, 0.94), rgba(15, 20, 30, 0.98)) !important; border: 1px solid rgba(212, 175, 55, 0.34) !important; }",
      "body.light-mode #aiSmartAssistantBox.fut-ai-dock { background: #ffffff !important; border-color: rgba(212, 175, 55, 0.4) !important; }",
      "#aiSmartAssistantBox #petDirectMicBtn, #aiSmartAssistantBox #fairySpecialtyNote, #aiSmartAssistantBox #futuristicChipsToggleBtn, #aiSmartAssistantBox #futVoiceSubControls, #aiSmartAssistantBox #petPersonaBar, #aiSmartAssistantBox .moaath-ai-static-title-hidden { display: none !important; }",
      "#aiSmartAssistantBox #futuristicAiHeader { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 5px !important; flex-wrap: nowrap !important; width: 100% !important; }",
      "#aiSmartAssistantBox.is-ai-collapsed #futuristicAiBody, #futuristicAiBody.is-collapsed { display: none !important; }",
      "#aiSmartAssistantBox #petQuickPromptChips { display: flex !important; flex-wrap: nowrap !important; gap: 5px !important; overflow-x: auto !important; scrollbar-width: none !important; padding: 2px 0 !important; margin: 3px 0 0 0 !important; max-height: 36px !important; opacity: 1 !important; }",
      "#aiSmartAssistantBox.is-ai-collapsed #petQuickPromptChips { display: none !important; }",
      "#aiSmartAssistantBox .fut-chip-btn { flex-shrink: 0 !important; background: rgba(255, 255, 255, 0.045) !important; color: var(--text-color) !important; border: 1px solid rgba(212, 175, 55, 0.3) !important; border-radius: 999px !important; padding: 3px 9px !important; font-size: 10px !important; font-weight: 700 !important; cursor: pointer !important; }",

      /* Anti-Crowding Layout for #aiSmartAssistantBox across store_ui + learning_hub + vip_daily */
      "#aiSmartAssistantBox #futuristicAiHeader { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 5px !important; flex-wrap: wrap !important; width: 100% !important; box-sizing: border-box !important; }",
      "#aiSmartAssistantBox #moaathRestorePersonaBtn { flex: 1 1 auto !important; min-width: 0 !important; max-width: 156px !important; height: 28px !important; padding: 2px 8px 2px 4px !important; gap: 5px !important; box-sizing: border-box !important; }",
      "#aiSmartAssistantBox #moaathRestorePersonaName { font-size: 10px !important; font-weight: 800 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }",
      "#aiSmartAssistantBox .fut-ai-header-actions { display: flex !important; align-items: center !important; gap: 4px !important; flex-wrap: nowrap !important; flex-shrink: 0 !important; }",
      "#aiSmartAssistantBox #moaathLearningHubHeaderBtn { width: 28px !important; height: 28px !important; min-width: 28px !important; padding: 0 !important; font-size: 12px !important; flex-shrink: 0 !important; }",
      "#aiSmartAssistantBox #futVipShowcaseBtn, #aiSmartAssistantBox #futuristicAiToggleBtn { height: 28px !important; padding: 3px 8px !important; font-size: 10px !important; white-space: nowrap !important; flex-shrink: 0 !important; }",
      "#aiSmartAssistantBox #petQuickPromptChips { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: center !important; gap: 5px !important; overflow-x: auto !important; overflow-y: hidden !important; max-width: 100% !important; box-sizing: border-box !important; }",
      "#aiSmartAssistantBox #moaathLearningHubChipBtn, #aiSmartAssistantBox #moaathVIPDailyOverviewBtn { flex-shrink: 0 !important; white-space: nowrap !important; height: 26px !important; display: inline-flex !important; align-items: center !important; }",

      /* Sticky Categories & Product Cards */
      ".categories { position: sticky !important; top: 0 !important; z-index: 45 !important; background: rgba(15, 20, 30, 0.94) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border-radius: 14px !important; padding: 6px !important; scrollbar-width: none !important; }",
      "body.light-mode .categories { background: rgba(248, 250, 252, 0.95) !important; }",
      ".product-card { position: relative !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; height: 100% !important; border-radius: 16px !important; border: 1px solid rgba(212, 175, 55, 0.25) !important; box-sizing: border-box !important; }",
      ".product-card img { aspect-ratio: 1 / 1; object-fit: cover; }",
      ".moaath-card-fab-add { position: absolute !important; top: 8px !important; left: 8px !important; z-index: 12 !important; width: 32px !important; height: 32px !important; border-radius: 50% !important; border: 1.5px solid #D4AF37 !important; background: rgba(15, 20, 30, 0.88) !important; color: #D4AF37 !important; font-size: 18px !important; font-weight: 900 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45) !important; cursor: pointer !important; }",
      ".moaath-inline-stepper { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 6px !important; width: 100% !important; background: rgba(212, 175, 55, 0.12) !important; border: 1.5px solid #D4AF37 !important; box-shadow: 0 0 12px rgba(212, 175, 55, 0.28) !important; border-radius: 12px !important; padding: 3px 6px !important; box-sizing: border-box !important; margin-top: 4px !important; }",
      ".moaath-step-btn { width: 28px !important; height: 26px !important; border-radius: 8px !important; border: none !important; font-size: 16px !important; font-weight: 900 !important; cursor: pointer !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }",
      ".moaath-step-minus { background: rgba(255, 255, 255, 0.1) !important; color: var(--text-color) !important; }",
      ".moaath-step-plus { background: #D4AF37 !important; color: #000 !important; }",
      ".moaath-step-qty { font-size: 13px !important; font-weight: 900 !important; color: #10b981 !important; }",
      ".moaath-out-of-stock-card { opacity: 0.7 !important; }",
      ".moaath-out-of-stock-card img { filter: grayscale(0.45) brightness(0.85) !important; }",
      ".moaath-out-badge { position: absolute !important; top: 8px !important; right: 8px !important; z-index: 14 !important; background: rgba(15, 20, 30, 0.92) !important; color: #D4AF37 !important; border: 1px solid rgba(212, 175, 55, 0.55) !important; border-radius: 999px !important; padding: 2px 8px !important; font-size: 9.5px !important; font-weight: 800 !important; pointer-events: none !important; }",
      "@keyframes moaathSkeletonShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }",
      ".moaath-img-skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(212,175,55,0.16) 50%, rgba(255,255,255,0.05) 75%) !important; background-size: 200% 100% !important; animation: moaathSkeletonShimmer 1.3s infinite linear !important; min-height: 95px !important; }",

      /* Floating Dock & BackToTop */
      "body.moaath-ai-expanded #petCharRoot, body.moaath-search-focused #petCharRoot { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; transform: scale(0.75) !important; }",
      ".cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar { left: 8px !important; right: 8px !important; bottom: 8px !important; width: auto !important; border-radius: 18px !important; background: rgba(15, 20, 30, 0.92) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border: 1px solid rgba(212, 175, 55, 0.42) !important; box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5) !important; }",
      "#moaathCartCountBadge { display: inline-flex !important; align-items: center !important; justify-content: center !important; min-width: 19px !important; height: 19px !important; padding: 0 5px !important; border-radius: 999px !important; background: #D4AF37 !important; color: #000 !important; font-size: 10px !important; font-weight: 900 !important; margin-right: 5px !important; }",
      "#moaathBackToTopBtn { position: fixed; bottom: 82px; left: 14px; z-index: 95; width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(212, 175, 55, 0.65); background: rgba(15, 20, 30, 0.92); color: #D4AF37; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transform: translateY(10px); transition: opacity 0.25s ease, transform 0.25s ease; }",
      "#moaathBackToTopBtn.is-visible { opacity: 1; pointer-events: auto; transform: translateY(0); }",

      /* Futuristic Clean Cart Modal */
      "#cartModal { align-items: flex-end !important; padding: 0 !important; }",
      "#cartModal .modal-content { width: 100% !important; max-width: 480px !important; max-height: 90vh !important; overflow-y: auto !important; border-radius: 22px 22px 0 0 !important; border: 1.5px solid rgba(212, 175, 55, 0.48) !important; border-bottom: none !important; padding: 10px 13px 14px 13px !important; background: linear-gradient(170deg, #131a27, #0b1019) !important; box-shadow: 0 -14px 40px rgba(0,0,0,0.65) !important; }",
      "body.light-mode #cartModal .modal-content { background: #ffffff !important; }",
      "#moaathCartDragHandle { width: 42px; height: 4px; border-radius: 999px; background: rgba(212, 175, 55, 0.45); margin: 0 auto 8px auto; }",
      "#moaathCartTopBar { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(212, 175, 55, 0.22); }",
      ".moaath-cart-top-title { font-size: 14px; font-weight: 900; color: #D4AF37; }",
      ".moaath-cart-top-actions { display: flex; align-items: center; gap: 5px; }",
      ".moaath-cart-mini-btn { padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; border: 1px solid rgba(212, 175, 55, 0.35); background: rgba(255, 255, 255, 0.05); color: var(--text-color); cursor: pointer; }",
      ".moaath-cart-close-x { width: 28px; height: 28px; padding: 0; border-radius: 50%; border: 1px solid rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.16); color: #fca5a5; font-size: 13px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }",
      "#cartModal #cleanCheckoutSummaryCard, #cartModal #cartCheckoutStepper, #cartModal .moaath-cart-hidden-close { display: none !important; }",
      "#moaathCartRecsToggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 6px 9px; margin: 6px 0; border-radius: 12px; background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.38); color: #38bdf8; font-size: 10.5px; font-weight: 800; cursor: pointer; }",
      "#aiCartRecommendationsBox.moaath-recs-collapsed { display: none !important; }",
      "#moaathPaymentPillsWrap { display: flex; gap: 6px; margin: 6px 0 8px 0; width: 100%; }",
      ".moaath-pay-pill { flex: 1; padding: 8px 6px; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.32); background: rgba(255, 255, 255, 0.04); color: var(--text-color); font-size: 11px; font-weight: 800; cursor: pointer; text-align: center; transition: all 0.18s ease; }",
      ".moaath-pay-pill.is-active { background: linear-gradient(135deg, rgba(212, 175, 55, 0.28), rgba(16, 185, 129, 0.22)) !important; border-color: #D4AF37 !important; color: #D4AF37 !important; box-shadow: 0 0 12px rgba(212, 175, 55, 0.25); }",
      "body.light-mode .moaath-pay-pill { background: #f8fafc; }",
      "#moaathCartNotesToggle { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; margin: 4px 0 6px 0; border-radius: 999px; border: 1px dashed rgba(212, 175, 55, 0.4); background: transparent; color: var(--gray-text); font-size: 10.5px; font-weight: 700; cursor: pointer; }",
      ".moaath-notes-hidden { display: none !important; }",
      "#cartModal #submitOrderUnifiedBtn { position: sticky !important; bottom: 0 !important; z-index: 20 !important; margin-top: 8px !important; padding: 11px 12px !important; border-radius: 14px !important; font-size: 12.5px !important; font-weight: 900 !important; box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.55) !important; }"
    ].join(" ");
  }

  /* Deduplicate dynamic containers & buttons if any script ever mounted twice */
  function deduplicateDynamicContainers() {
    var idsToDedupe = [
      "moaathUnifiedSmartBar",
      "moaathOffersSliderTrack",
      "moaathOffersDots",
      "moaathCartTopBar",
      "moaathCartDragHandle",
      "moaathCartRecsToggle",
      "moaathCartNotesToggle",
      "moaathPaymentPillsWrap",
      "moaathBackToTopBtn"
    ];
    idsToDedupe.forEach(function (id) {
      var matches = document.querySelectorAll("#" + id);
      if (matches.length > 1) {
        for (var i = 1; i < matches.length; i++) {
          if (matches[i] && matches[i].parentNode) matches[i].parentNode.removeChild(matches[i]);
        }
      }
    });
  }

  /* === 1. Collapsible User Bar === */
  function stripIconBracketsInUserBar(container) {
    if (!container) return;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var v = node.nodeValue || "";
      if (!/[()]/.test(v)) continue;
      var cleaned = v.replace(/\(\s*([^\w\u0600-\u06FF\s]{1,4})\s*\)/g, "$1");
      if (/^[\s()]+$/.test(cleaned)) cleaned = "";
      if (cleaned !== v) node.nodeValue = cleaned;
    }
    container.querySelectorAll("button, a, span[onclick]").forEach(function (btn) {
      if (btn.classList.contains("moaath-userbar-menu-btn")) return;
      var t = (btn.textContent || "").trim();
      var stripped = t.replace(/^\(\s*|\s*\)$/g, "").trim();
      if (stripped !== t && !/[\u0600-\u06FF]{3,}/.test(stripped)) btn.textContent = stripped;
      if (stripped.length > 0 && stripped.length <= 16) {
        btn.classList.add("moaath-glass-circle-btn");
        if (!/[\u0600-\u06FFA-Za-z0-9]/.test(stripped)) btn.classList.add("moaath-glass-icon-only");
      }
    });
  }

  function enhanceCollapsibleUserBar() {
    var bar = document.querySelector(".user-bar, .user-info-bar, #userInfoBar, [class*='user-bar']");
    if (!bar || bar.closest(".modal-overlay")) return;

    var userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "حسابي";
    var fullTxt = bar.textContent || "";
    var ptsMatch = fullTxt.match(/نقاطي\s*:\s*[\d,]+/);
    var balMatch = fullTxt.match(/رصيدي\s*:\s*[\d,]+\s*ل\.?س?/);
    var summaryBits = ["👤 " + userName];
    if (balMatch) summaryBits.push("💳 " + balMatch[0]);
    if (ptsMatch) summaryBits.push("🎁 " + ptsMatch[0]);

    if (!bar.dataset.moaathCollapsibleBound) {
      bar.dataset.moaathCollapsibleBound = "1";
      bar.classList.add("moaath-userbar-shell");

      var bodyWrap = document.createElement("div");
      bodyWrap.className = "moaath-userbar-body";
      while (bar.firstChild) bodyWrap.appendChild(bar.firstChild);

      var toggleRow = document.createElement("div");
      toggleRow.className = "moaath-userbar-toggle-row";
      toggleRow.innerHTML = '<div id="moaathUserBarSummaryTxt" class="moaath-userbar-summary"></div><span id="moaathUserBarMenuBtn" class="moaath-userbar-menu-btn" title="خيارات الحساب">☰</span>';
      toggleRow.onclick = function () {
        var nextCollapsed = !bar.classList.contains("is-collapsed");
        bar.classList.toggle("is-collapsed", nextCollapsed);
        try { localStorage.setItem(USERBAR_COLLAPSE_KEY, nextCollapsed ? "1" : "0"); } catch (_) {}
        var menuBtn = $("moaathUserBarMenuBtn");
        if (menuBtn) menuBtn.textContent = nextCollapsed ? "☰" : "✕";
      };

      bar.appendChild(toggleRow);
      bar.appendChild(bodyWrap);

      var initCollapsed = true;
      try {
        var saved = localStorage.getItem(USERBAR_COLLAPSE_KEY);
        if (saved !== null) initCollapsed = (saved === "1" || saved === "true");
      } catch (_) {}
      bar.classList.toggle("is-collapsed", initCollapsed);
      var initBtn = $("moaathUserBarMenuBtn");
      if (initBtn) initBtn.textContent = initCollapsed ? "☰" : "✕";
    }

    stripIconBracketsInUserBar(bar);
    var sumEl = $("moaathUserBarSummaryTxt");
    if (sumEl) sumEl.textContent = summaryBits.join(" • ");
  }

  /* === 2. Horizontal Slider for Special Offers === */
  function findOfferCards() {
    var raw = [];
    var seen = new Set();

    function addCandidate(el) {
      if (!el || seen.has(el) || el === document.body || el === document.documentElement) return;
      if (el.closest(".modal-overlay") || el.id === "moaathOffersSliderTrack") return;
      var h = el.offsetHeight;
      if (h < 60 || h > 440) return;
      seen.add(el);
      raw.push(el);
    }

    document.querySelectorAll(".offer-card, [class*='offer-card']").forEach(function (el) {
      if (el.querySelector("img")) addCandidate(el);
    });

    if (raw.length < 2) {
      document.querySelectorAll("div, article").forEach(function (el) {
        var txt = el.textContent || "";
        if (/عرض\s*خاص\s*محدث|عرض\s*خاص/.test(txt) && el.querySelector("img")) addCandidate(el);
      });
    }

    return raw.filter(function (el) {
      return !raw.some(function (other) { return other !== el && el.contains(other); });
    });
  }

  function renderOfferDots(track, count) {
    if (!track || count < 2) return;
    var dotsWrap = $("moaathOffersDots");
    if (!dotsWrap) {
      dotsWrap = document.createElement("div");
      dotsWrap.id = "moaathOffersDots";
      track.parentNode.insertBefore(dotsWrap, track.nextSibling);
    }
    if (dotsWrap.children.length !== count) {
      var html = "";
      for (var i = 0; i < count; i++) {
        html += '<span class="moaath-offer-dot' + (i === 0 ? " is-active" : "") + '"></span>';
      }
      dotsWrap.innerHTML = html;
    }
    if (!track.dataset.dotsBound) {
      track.dataset.dotsBound = "1";
      track.addEventListener("scroll", function () {
        var maxScroll = Math.max(1, track.scrollWidth - track.clientWidth);
        var ratio = Math.min(1, Math.max(0, Math.abs(track.scrollLeft) / maxScroll));
        var activeIdx = Math.round(ratio * (count - 1));
        Array.prototype.forEach.call(dotsWrap.children, function (dot, idx) {
          dot.classList.toggle("is-active", idx === activeIdx);
        });
      }, { passive: true });
    }
  }

  function applyOffersHorizontalSlider() {
    var cards = findOfferCards();
    if (cards.length < 2) return;

    var existingTrack = $("moaathOffersSliderTrack");
    if (existingTrack && cards.every(function (c) { return c.parentElement === existingTrack; })) {
      cards.forEach(function (c) { c.classList.add("moaath-offer-card-slide"); });
      renderOfferDots(existingTrack, cards.length);
      return;
    }

    var parentCounts = new Map();
    cards.forEach(function (c) {
      var p = c.parentElement;
      if (!p || p === document.body) return;
      parentCounts.set(p, (parentCounts.get(p) || 0) + 1);
    });

    var bestParent = null;
    var bestCount = 0;
    parentCounts.forEach(function (count, p) {
      if (count > bestCount) { bestCount = count; bestParent = p; }
    });
    if (!bestParent || bestCount < 2) return;

    var groupCards = cards.filter(function (c) { return c.parentElement === bestParent; });
    var otherChildren = Array.prototype.filter.call(bestParent.children, function (ch) {
      if (ch.tagName === "SCRIPT" || ch.tagName === "STYLE" || ch.id === "moaathOffersDots") return false;
      return groupCards.indexOf(ch) === -1;
    });

    var track = bestParent;
    if (otherChildren.length > 0) {
      track = document.createElement("div");
      track.id = "moaathOffersSliderTrack";
      track.className = "moaath-offers-track";
      bestParent.insertBefore(track, groupCards[0]);
      groupCards.forEach(function (card) { track.appendChild(card); });
    } else {
      track.classList.add("moaath-offers-track");
    }

    groupCards.forEach(function (card) { card.classList.add("moaath-offer-card-slide"); });
    renderOfferDots(track, groupCards.length);
  }

  /* === 3. Futuristic Clean Cart Modal + Segmented Payment Pills === */
  function isUserClassifiedForDebt() {
    try {
      var u = window.currentUser || {};
      if (u.isDebtCustomer || u.allowDebt || u.canDebt || u.isCreditCustomer || u.creditEnabled) return true;
      if (/debt|credit|postpaid|آجل|أجل|دين|دفتر/i.test(String(u.userType || u.customerType || u.accountType || ""))) return true;
      var barTxt = String(document.querySelector(".user-bar, .user-info-bar, #userInfoBar, [class*='user-bar']")?.textContent || "");
      if (/زبون\s*(آجل|أجل|دين)|دفتر\s*الدين|آجل\s*\/\s*دفتر/.test(barTxt)) return true;
    } catch (_) {}
    return false;
  }

  function buildPaymentSegmentedPills(modalContent) {
    var paySel = $("cartPaymentMethod");
    if (!paySel || !paySel.parentNode) return;

    paySel.style.display = "none";

    var wrap = $("moaathPaymentPillsWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "moaathPaymentPillsWrap";
      paySel.parentNode.insertBefore(wrap, paySel.nextSibling);
    }

    var allowDebt = isUserClassifiedForDebt();
    var options = Array.prototype.slice.call(paySel.options || []);

    var visibleOpts = options.filter(function (opt) {
      if (opt.disabled || opt.hidden) return false;
      var txt = String(opt.textContent || opt.value || "");
      var isDebtOpt = /دين|آجل|أجل|دفتر/.test(txt);
      if (isDebtOpt && !allowDebt) return false;
      return true;
    });

    function formatPillLabel(rawText) {
      if (/شام\s*كاش|شامكاش/i.test(rawText)) return "💳 شام كاش";
      if (/محفظ|رصيد/i.test(rawText)) return "👛 من المحفظة";
      if (/دين|آجل|أجل|دفتر/i.test(rawText)) return "📒 بالدين";
      if (/نقد|كاش|عند\s*الاستلام/i.test(rawText)) return "💵 نقداً";
      return rawText.slice(0, 16);
    }

    var sig = visibleOpts.map(function (o) { return o.value + ":" + (o.selected ? "1" : "0"); }).join("|");
    if (wrap.dataset.sig === sig) return;
    wrap.dataset.sig = sig;
    wrap.innerHTML = "";

    visibleOpts.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "moaath-pay-pill" + (paySel.value === opt.value ? " is-active" : "");
      btn.textContent = formatPillLabel(opt.textContent || opt.value);
      btn.onclick = function () {
        paySel.value = opt.value;
        paySel.dispatchEvent(new Event("change", { bubbles: true }));
        wrap.dataset.sig = "";
        buildPaymentSegmentedPills(modalContent);
      };
      wrap.appendChild(btn);
    });
  }

  function enhanceFuturisticCartModal() {
    var cartModal = $("cartModal");
    if (!cartModal) return;
    var modalContent = cartModal.querySelector(".modal-content");
    if (!modalContent) return;

    if (!$("moaathCartDragHandle")) {
      var handle = document.createElement("div");
      handle.id = "moaathCartDragHandle";
      modalContent.insertBefore(handle, modalContent.firstChild);
    }

    if (!$("moaathCartTopBar")) {
      var topBar = document.createElement("div");
      topBar.id = "moaathCartTopBar";
      topBar.innerHTML =
        '<span class="moaath-cart-top-title">🛒 سلة المشتريات</span>' +
        '<div class="moaath-cart-top-actions">' +
          '<button type="button" id="moaathCartSaveListBtn" class="moaath-cart-mini-btn" title="حفظ كقائمة سريعة">💾 حفظ</button>' +
          '<button type="button" id="moaathCartClearBtn" class="moaath-cart-mini-btn" title="إفراغ السلة">🧹 إفراغ</button>' +
          '<button type="button" id="moaathCartTopCloseBtn" class="moaath-cart-close-x" title="إغلاق">✕</button>' +
        '</div>';
      var handleEl = $("moaathCartDragHandle");
      if (handleEl && handleEl.nextSibling) modalContent.insertBefore(topBar, handleEl.nextSibling);
      else modalContent.insertBefore(topBar, modalContent.firstChild);

      Array.prototype.forEach.call(modalContent.children, function (ch) {
        if (ch.id === "moaathCartTopBar" || ch.id === "moaathCartDragHandle") return;
        if (/سلة\s*المشتريات\s*وإتمام\s*الطلب/.test(ch.textContent || "") && ch.offsetHeight < 70) {
          ch.style.display = "none";
        }
      });

      $("moaathCartTopCloseBtn").onclick = function () {
        if (typeof window.closeCartModal === "function") window.closeCartModal();
        else cartModal.style.display = "none";
      };

      $("moaathCartClearBtn").onclick = function () {
        var keys = Object.keys(window.cart || {}).filter(function (k) { return (parseInt(window.cart[k]?.qty, 10) || 0) > 0; });
        if (!keys.length) return;
        if (!confirm("هل تريد إفراغ جميع الأصناف من السلة؟")) return;
        keys.forEach(function (k) {
          var q = parseInt(window.cart[k]?.qty, 10) || 0;
          if (q > 0 && typeof window.changeQty === "function") window.changeQty(k, -q);
        });
        if (typeof window.renderCartModalItems === "function") window.renderCartModalItems();
      };

      $("moaathCartSaveListBtn").onclick = function () {
        var nm = prompt("اكتب اسماً لهذه القائمة (مثال: مونة الأسبوع أو سهرة الخميس):");
        if (nm && window.MoaathDelightPack && typeof window.MoaathDelightPack.saveCurrentCartAsQuickList === "function") {
          window.MoaathDelightPack.saveCurrentCartAsQuickList(nm);
        }
      };
    }

    modalContent.querySelectorAll("button").forEach(function (b) {
      if (b.id === "moaathCartTopCloseBtn" || b.id === "submitOrderUnifiedBtn") return;
      if (/^إغلاق$|^اغلاق$/.test((b.textContent || "").trim())) {
        b.classList.add("moaath-cart-hidden-close");
      }
    });

    var recsBox = $("aiCartRecommendationsBox");
    if (recsBox && recsBox.innerHTML.trim() && !$("moaathCartRecsToggle")) {
      var recsBtn = document.createElement("button");
      recsBtn.id = "moaathCartRecsToggle";
      recsBtn.type = "button";
      recsBtn.innerHTML = '<span>✨ مقترحات ذكية تكمل سلتك</span><span id="moaathCartRecsChev">▾</span>';
      recsBox.classList.add("moaath-recs-collapsed");
      recsBtn.onclick = function () {
        var isNowCol = recsBox.classList.toggle("moaath-recs-collapsed");
        var ch = $("moaathCartRecsChev");
        if (ch) ch.textContent = isNowCol ? "▾" : "▴";
      };
      recsBox.parentNode.insertBefore(recsBtn, recsBox);
    }

    var notesInp = modalContent.querySelector("input[placeholder*='ملاحظات'], textarea[placeholder*='ملاحظات']");
    if (notesInp && !$("moaathCartNotesToggle")) {
      var notesToggle = document.createElement("button");
      notesToggle.id = "moaathCartNotesToggle";
      notesToggle.type = "button";
      notesToggle.textContent = "📝 + إضافة ملاحظة للطلب (اختياري)";
      if (!notesInp.value.trim()) notesInp.classList.add("moaath-notes-hidden");
      notesToggle.onclick = function () {
        var hidden = notesInp.classList.toggle("moaath-notes-hidden");
        if (!hidden) notesInp.focus();
      };
      notesInp.parentNode.insertBefore(notesToggle, notesInp);
    }

    buildPaymentSegmentedPills(modalContent);
  }

  /* === 4. Unified Smart Search + Loop-Safe Sync === */
  function applySearchValueDirectly(origSearch, val) {
    if (!origSearch || isSearchSyncing) return;
    isSearchSyncing = true;
    try {
      if (origSearch.value !== val) {
        origSearch.value = val;
      }
      if (typeof window.renderStore === "function") {
        window.renderStore();
      } else {
        origSearch.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } finally {
      setTimeout(function () {
        isSearchSyncing = false;
      }, 30);
    }
  }

  function buildUnifiedSmartSearchBar() {
    var assistBox = $("aiSmartAssistantBox");
    if (!assistBox || !assistBox.parentNode) return;

    var origSearch = document.querySelector("#searchInput, #productSearchInput, #storeSearchInput, input[placeholder*='ابحث عن']");
    var reqProductBtn = null;
    document.querySelectorAll("button, a, div[onclick]").forEach(function (b) {
      if (!reqProductBtn && /طلب\s*صنف/.test(b.textContent || "") && !b.closest(".modal-overlay") && (b.textContent || "").trim().length < 25) {
        reqProductBtn = b;
      }
    });

    var pill = $("moaathUnifiedSmartBar");
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "moaathUnifiedSmartBar";
      pill.className = "moaath-unified-pill-bar";

      var inp = document.createElement("input");
      inp.type = "text";
      inp.id = "moaathUnifiedSearchInput";
      inp.className = "moaath-unified-pill-input";
      inp.placeholder = "🔍 ابحث عن صنف أو اطلب من المساعد...";

      var clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.id = "moaathUnifiedClearBtn";
      clearBtn.className = "moaath-pill-clear";
      clearBtn.title = "مسح البحث";
      clearBtn.textContent = "✕";

      function syncClearBtn() {
        clearBtn.classList.toggle("is-visible", inp.value.length > 0);
      }

      clearBtn.onclick = function () {
        inp.value = "";
        syncClearBtn();
        applySearchValueDirectly(origSearch, "");
        inp.focus();
      };

      var searchDebounce = null;
      inp.addEventListener("input", function () {
        syncClearBtn();
        var nextVal = inp.value;
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(function () {
          applySearchValueDirectly(origSearch, nextVal);
        }, 160);
      });

      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && inp.value.trim() && typeof window.runAIShoppingAssistant === "function") {
          window.runAIShoppingAssistant(inp.value.trim());
        }
      });
      inp.addEventListener("focus", function () { document.body.classList.add("moaath-search-focused"); });
      inp.addEventListener("blur", function () { setTimeout(function () { document.body.classList.remove("moaath-search-focused"); }, 220); });

      var micBtn = document.createElement("button");
      micBtn.type = "button";
      micBtn.className = "moaath-pill-action moaath-pill-mic";
      micBtn.title = "بحث صوتي";
      micBtn.textContent = "🎙️";
      micBtn.onclick = function () { if (typeof window.startVoiceShoppingInput === "function") window.startVoiceShoppingInput(); };

      pill.appendChild(inp);
      pill.appendChild(clearBtn);
      pill.appendChild(micBtn);

      if (reqProductBtn) {
        var reqBtn = document.createElement("button");
        reqBtn.type = "button";
        reqBtn.id = "moaathUnifiedReqItemBtn";
        reqBtn.className = "moaath-pill-action";
        reqBtn.textContent = "📝 طلب صنف";
        reqBtn.onclick = function () { reqProductBtn.click(); };
        pill.appendChild(reqBtn);
      }

      assistBox.parentNode.insertBefore(pill, assistBox);
    }

    if (reqProductBtn) {
      reqProductBtn.style.display = "none";
      if (reqProductBtn.parentElement && reqProductBtn.parentElement.children.length === 1 && reqProductBtn.parentElement.tagName === "DIV") {
        reqProductBtn.parentElement.style.display = "none";
      }
    }

    if (origSearch) {
      var origWrap = origSearch.closest(".search-box, .search-bar, .form-group") || origSearch;
      if (origWrap && !origWrap.closest("#aiSmartAssistantBox")) origWrap.style.display = "none";
      var unifiedInp = $("moaathUnifiedSearchInput");
      if (unifiedInp && document.activeElement !== unifiedInp && unifiedInp.value !== origSearch.value) {
        unifiedInp.value = origSearch.value || "";
        var clr = $("moaathUnifiedClearBtn");
        if (clr) clr.classList.toggle("is-visible", unifiedInp.value.length > 0);
      }
    }
  }

  /* === 5. Product & Offer Cards === */
  function enhanceProductAndOfferCards() {
    var cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    var prods = (typeof window.products === "object" && window.products) ? window.products : {};

    document.querySelectorAll(".product-card img, .offer-card img, .moaath-offer-card-slide img").forEach(function (img) {
      if (img.dataset.lazyBound) return;
      img.dataset.lazyBound = "1";
      img.loading = "lazy";
      img.decoding = "async";
      if (!img.complete || img.naturalWidth === 0) {
        img.classList.add("moaath-img-skeleton");
        img.addEventListener("load", function () { img.classList.remove("moaath-img-skeleton"); }, { once: true });
        img.addEventListener("error", function () { img.classList.remove("moaath-img-skeleton"); }, { once: true });
      }
    });

    var buttons = document.querySelectorAll(".product-card button[onclick*='changeQty']");
    buttons.forEach(function (btn) {
      if (btn.classList.contains("moaath-step-btn") || btn.classList.contains("moaath-card-fab-add")) return;
      var onclk = btn.getAttribute("onclick") || "";
      var m = onclk.match(/changeQty\(\s*['"]([^'"]+)['"]\s*,\s*1\s*\)/);
      if (!m) return;
      var pid = m[1];
      var card = btn.closest(".product-card");
      if (!card) return;

      var pObj = prods[pid];
      var realStock = pObj
        ? (typeof window.getProductStockForBranch === "function"
            ? window.getProductStockForBranch(pObj, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
            : (parseInt(pObj.stock, 10) || 0))
        : 1;
      var isOut = realStock <= 0;
      card.classList.toggle("moaath-out-of-stock-card", isOut);
      if (isOut && !card.querySelector(".moaath-out-badge")) {
        var outBadge = document.createElement("span");
        outBadge.className = "moaath-out-badge";
        outBadge.textContent = "نفد مؤقتاً";
        card.appendChild(outBadge);
      }

      if (!isOut && !card.querySelector(".moaath-card-fab-add")) {
        var fab = document.createElement("button");
        fab.type = "button";
        fab.className = "moaath-card-fab-add";
        fab.title = "إضافة سريعة للسلة";
        fab.textContent = "+";
        fab.onclick = function (e) {
          if (e) e.stopPropagation();
          if (typeof window.changeQty === "function") window.changeQty(pid, 1);
        };
        card.appendChild(fab);
      }

      var qty = (cartObj[pid] && parseInt(cartObj[pid].qty, 10)) ? parseInt(cartObj[pid].qty, 10) : 0;
      var nextEl = btn.nextElementSibling;
      var hasStepper = nextEl && nextEl.classList && nextEl.classList.contains("moaath-inline-stepper");

      if (qty > 0) {
        btn.style.display = "none";
        if (!hasStepper) {
          var stepper = document.createElement("div");
          stepper.className = "moaath-inline-stepper";
          stepper.innerHTML =
            '<button type="button" class="moaath-step-btn moaath-step-minus" aria-label="إنقاص">−</button>' +
            '<span class="moaath-step-qty">' + qty + '</span>' +
            '<button type="button" class="moaath-step-btn moaath-step-plus" aria-label="زيادة">+</button>';
          stepper.querySelector(".moaath-step-minus").onclick = function (e) {
            if (e) e.stopPropagation();
            if (typeof window.changeQty === "function") window.changeQty(pid, -1);
          };
          stepper.querySelector(".moaath-step-plus").onclick = function (e) {
            if (e) e.stopPropagation();
            if (typeof window.changeQty === "function") window.changeQty(pid, 1);
          };
          btn.parentNode.insertBefore(stepper, btn.nextSibling);
        } else {
          var qSpan = nextEl.querySelector(".moaath-step-qty");
          if (qSpan && qSpan.textContent !== String(qty)) qSpan.textContent = String(qty);
        }
      } else {
        btn.style.display = "";
        if (hasStepper) nextEl.remove();
      }
    });
  }

  function syncFloatingCartBadge() {
    var cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    var totalPieces = 0;
    Object.keys(cartObj).forEach(function (k) {
      totalPieces += (parseInt(cartObj[k] && cartObj[k].qty, 10) || 0);
    });
    var dock = document.querySelector(".cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar");
    if (!dock) return;
    var checkoutBtn = dock.querySelector("button");
    if (!checkoutBtn) return;

    var badge = $("moaathCartCountBadge");
    if (totalPieces > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.id = "moaathCartCountBadge";
        checkoutBtn.appendChild(badge);
      }
      if (badge.textContent !== String(totalPieces)) badge.textContent = String(totalPieces);
    } else if (badge) {
      badge.remove();
    }
  }

  function readCollapsedPref() {
    try {
      var v = localStorage.getItem(COLLAPSE_KEY);
      if (v === null) return true;
      return v === "1" || v === "true";
    } catch (_) { return true; }
  }

  function writeCollapsedPref(isCollapsed) {
    try { localStorage.setItem(COLLAPSE_KEY, isCollapsed ? "1" : "0"); } catch (_) {}
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
        ? '<span>المساعد</span><span class="fut-chev">▾</span>'
        : '<span>طي</span><span class="fut-chev">▴</span>';
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
    if (!btn || btn.dataset.v57Bound) return;
    btn.dataset.v57Bound = "1";
    btn.onclick = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      window.toggleFuturisticAssistantPanel();
    };
  }

  function bindEscapeKeyClose() {
    if (window.__MOAATH_ESC_BOUND__) return;
    window.__MOAATH_ESC_BOUND__ = true;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".modal-overlay").forEach(function (m) {
        if (m.style.display === "flex" || m.style.display === "block") m.style.display = "none";
      });
    });
  }

  function mountBackToTop() {
    if ($("moaathBackToTopBtn")) return;
    var btn = document.createElement("button");
    btn.id = "moaathBackToTopBtn";
    btn.type = "button";
    btn.title = "العودة للأعلى";
    btn.textContent = "↑";
    btn.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
    document.body.appendChild(btn);
    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 360);
    }, { passive: true });
  }

  function hookEventsDirectly() {
    if (typeof window.changeQty === "function" && !window.changeQty.__moaathUiHooked) {
      var origChangeQty = window.changeQty;
      var wrapped = function () {
        var res = origChangeQty.apply(this, arguments);
        withSelfMutationGuard(function () {
          enhanceProductAndOfferCards();
          syncFloatingCartBadge();
        });
        if (window.MoaathEventBus) window.MoaathEventBus.emit("cart:updated");
        return res;
      };
      wrapped.__moaathUiHooked = true;
      window.changeQty = wrapped;
    }

    if (typeof window.renderCartModalItems === "function" && !window.renderCartModalItems.__moaathCartUiHooked) {
      var origCartRender = window.renderCartModalItems;
      var wrappedCart = function () {
        var res = origCartRender.apply(this, arguments);
        withSelfMutationGuard(enhanceFuturisticCartModal);
        return res;
      };
      wrappedCart.__moaathCartUiHooked = true;
      window.renderCartModalItems = wrappedCart;
    }

    if (window.MoaathEventBus && !window.__MOAATH_UI_BUS_BOUND__) {
      window.__MOAATH_UI_BUS_BOUND__ = true;
      window.MoaathEventBus.on("cart:cleared", function () {
        withSelfMutationGuard(function () {
          enhanceProductAndOfferCards();
          syncFloatingCartBadge();
        });
      });
    }
  }

  function runAll() {
    if (isSearchSyncing) return;
    withSelfMutationGuard(function () {
      injectStoreFuturisticCSS();
      deduplicateDynamicContainers();
      enhanceCollapsibleUserBar();
      applyOffersHorizontalSlider();
      buildUnifiedSmartSearchBar();
      enhanceProductAndOfferCards();
      enhanceFuturisticCartModal();
      syncFloatingCartBadge();
      bindToggleButtonDirect();
      syncAssistantState();
      bindEscapeKeyClose();
      mountBackToTop();
      hookEventsDirectly();
    });
  }

  function isRelevantMutation(mutations) {
    if (!Array.isArray(mutations) || !mutations.length) return false;
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      var target = m.target && m.target.nodeType === 1 ? m.target : (m.target && m.target.parentElement);
      if (target && target.closest && target.closest("#moaathUnifiedSmartBar, #moaathOffersDots, #moaathCartTopBar, #moaathBackToTopBtn")) {
        continue;
      }
      if (m.type === "childList" && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
        return true;
      }
      if (m.type === "attributes" && target && target.matches && target.matches(".modal-overlay, #cartModal, #adminModal")) {
        return true;
      }
    }
    return false;
  }

  function start() {
    runAll();
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      if (isSelfMutating || isSearchSyncing) return;
      if (!isRelevantMutation(mutations)) return;
      clearTimeout(obsTimer);
      obsTimer = setTimeout(runAll, 260);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("store_ui", "5.8");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

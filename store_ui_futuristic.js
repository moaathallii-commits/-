/* store_ui_futuristic.js - v5.4 (All 15 Store UI + All 10 AI Assistant Tab Enhancements | Mobile-Safe, Zero-Flicker) */
(function () {
  if (window.__MOAATH_STORE_UI_V54__) return;
  window.__MOAATH_STORE_UI_V54__ = true;

  var COLLAPSE_KEY = "moaath_store_ai_collapsed";
  var USERBAR_COLLAPSE_KEY = "moaath_store_userbar_collapsed";

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
      ":root { --moaath-bg-deep: #0f141e; --moaath-gold: #D4AF37; --moaath-emerald: #10b981; --moaath-sky: #38bdf8; }",
      "html, body { max-width: 100% !important; overflow-x: clip !important; }",
      "body:not(.light-mode) { background-color: #0f141e !important; }",
      "body:not(.light-mode) .product-card, body:not(.light-mode) .offer-card, body:not(.light-mode) .moaath-offer-card-slide { background: linear-gradient(155deg, rgba(22, 30, 46, 0.96), rgba(15, 20, 30, 0.98)) !important; border-color: rgba(212, 175, 55, 0.3) !important; }",
      "body:not(.light-mode) .cat-btn.active { background: #D4AF37 !important; color: #0f141e !important; border-color: #D4AF37 !important; }",

      "header, .store-header, .top-bar { padding: 6px 11px !important; margin-bottom: 5px !important; border-radius: 0 0 18px 18px !important; background: rgba(15, 20, 30, 0.95) !important; border-bottom: 1px solid rgba(212, 175, 55, 0.32) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; }",
      "body.light-mode header, body.light-mode .store-header, body.light-mode .top-bar { background: rgba(255, 255, 255, 0.95) !important; }",
      ".moaath-header-phone-hidden { display: none !important; }",
      "#moaathFooterContactBar { margin: 14px 8px 92px 8px !important; padding: 10px 12px !important; border-radius: 14px !important; background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(212, 175, 55, 0.24) !important; text-align: center !important; font-size: 11px !important; color: var(--gray-text, #94a3b8) !important; }",

      ".moaath-userbar-shell { border-radius: 16px !important; padding: 6px 10px !important; margin: 4px 0 6px 0 !important; border: 1px solid rgba(212, 175, 55, 0.32) !important; background: rgba(255, 255, 255, 0.035) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; }",
      "body.light-mode .moaath-userbar-shell { background: #ffffff !important; }",
      ".moaath-userbar-toggle-row { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 8px !important; cursor: pointer !important; font-size: 11px !important; font-weight: 800 !important; user-select: none !important; }",
      ".moaath-userbar-summary { display: flex !important; align-items: center !important; gap: 6px !important; min-width: 0 !important; overflow: hidden !important; white-space: nowrap !important; text-overflow: ellipsis !important; color: var(--text-color) !important; }",
      ".moaath-userbar-menu-btn { width: 30px !important; height: 30px !important; border-radius: 50% !important; border: 1px solid rgba(212, 175, 55, 0.48) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; font-size: 13px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; }",
      ".moaath-userbar-body { margin-top: 7px !important; padding-top: 7px !important; border-top: 1px dashed rgba(212, 175, 55, 0.24) !important; display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 6px !important; }",
      ".moaath-userbar-shell.is-collapsed .moaath-userbar-body { display: none !important; }",
      ".moaath-glass-circle-btn { min-width: 34px !important; height: 34px !important; padding: 0 10px !important; border-radius: 999px !important; border: 1px solid rgba(212, 175, 55, 0.36) !important; background: rgba(255, 255, 255, 0.06) !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important; color: var(--text-color) !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important; font-size: 12px !important; cursor: pointer !important; margin: 0 !important; text-decoration: none !important; }",
      ".moaath-glass-icon-only { width: 34px !important; min-width: 34px !important; padding: 0 !important; border-radius: 50% !important; }",

      ".moaath-offers-track { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: stretch !important; grid-template-columns: none !important; overflow-x: auto !important; overflow-y: hidden !important; scroll-snap-type: x mandatory !important; gap: 10px !important; padding: 3px 2px 6px 2px !important; margin: 4px 0 2px 0 !important; scrollbar-width: none !important; -webkit-overflow-scrolling: touch !important; touch-action: pan-x pan-y !important; width: 100% !important; box-sizing: border-box !important; }",
      ".moaath-offers-track::-webkit-scrollbar { display: none !important; }",
      ".moaath-offers-track > div, .moaath-offers-track > article, .moaath-offers-track > .moaath-offer-card-slide, .moaath-offer-card-slide { flex: 0 0 84vw !important; width: 84vw !important; min-width: 240px !important; max-width: 310px !important; scroll-snap-align: start !important; box-sizing: border-box !important; margin: 0 !important; padding: 7px 10px !important; border-radius: 15px !important; border: 1px solid rgba(212, 175, 55, 0.36) !important; }",
      "#moaathOffersDots { display: flex !important; justify-content: center !important; align-items: center !important; gap: 5px !important; margin: 2px 0 7px 0 !important; }",
      ".moaath-offer-dot { width: 6px !important; height: 6px !important; border-radius: 999px !important; background: rgba(212, 175, 55, 0.28) !important; transition: width 0.22s ease, background 0.22s ease !important; }",
      ".moaath-offer-dot.is-active { width: 16px !important; background: #D4AF37 !important; }",

      ".moaath-unified-pill-bar { display: flex !important; align-items: center !important; gap: 5px !important; width: 100% !important; border-radius: 999px !important; padding: 4px 6px !important; margin: 5px 0 6px 0 !important; background: rgba(255, 255, 255, 0.045) !important; border: 1px solid rgba(212, 175, 55, 0.42) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; box-sizing: border-box !important; }",
      "body.light-mode .moaath-unified-pill-bar { background: #ffffff !important; }",
      ".moaath-unified-pill-input { flex: 1 !important; min-width: 0 !important; border: none !important; background: transparent !important; color: var(--text-color) !important; font-size: 11px !important; padding: 4px 8px !important; outline: none !important; }",
      ".moaath-pill-action { border-radius: 999px !important; padding: 4px 9px !important; font-size: 10px !important; font-weight: 800 !important; border: 1px solid rgba(212, 175, 55, 0.38) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; cursor: pointer !important; white-space: nowrap !important; flex-shrink: 0 !important; }",
      ".moaath-pill-mic { width: 28px !important; height: 28px !important; padding: 0 !important; border-radius: 50% !important; background: rgba(16, 185, 129, 0.16) !important; border-color: rgba(16, 185, 129, 0.42) !important; color: #10b981 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }",

      /* === AI Assistant Tab v5.4: 10 Compact Futuristic Enhancements === */
      "@keyframes moaathAiAmbientGlow { 0%, 100% { box-shadow: 0 0 12px rgba(56, 189, 248, 0.35), 0 0 22px rgba(212, 175, 55, 0.2); border-color: rgba(56, 189, 248, 0.75); } 50% { box-shadow: 0 0 18px rgba(212, 175, 55, 0.45), 0 0 28px rgba(56, 189, 248, 0.25); border-color: rgba(212, 175, 55, 0.85); } }",
      "@keyframes moaathDotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: 0.7; } }",

      "#aiSmartAssistantBox.fut-ai-dock { padding: 6px 8px !important; margin: 4px 0 8px 0 !important; border-radius: 16px !important; background: linear-gradient(155deg, rgba(18, 25, 39, 0.94), rgba(15, 20, 30, 0.98)) !important; border: 1px solid rgba(212, 175, 55, 0.34) !important; transition: border-color 0.25s ease, box-shadow 0.25s ease !important; }",
      "body.light-mode #aiSmartAssistantBox.fut-ai-dock { background: #ffffff !important; border-color: rgba(212, 175, 55, 0.4) !important; }",
      "#aiSmartAssistantBox.moaath-ai-active-glow { animation: moaathAiAmbientGlow 1.6s ease-in-out infinite !important; }",

      /* #1 + #3 + #6 Hide duplicate mic, static heading, long persona description, chips toggle, old voice bar */
      "#aiSmartAssistantBox #petDirectMicBtn, #aiSmartAssistantBox #fairySpecialtyNote, #aiSmartAssistantBox #futuristicChipsToggleBtn, #aiSmartAssistantBox #futVoiceSubControls, #aiSmartAssistantBox #petPersonaBar, #aiSmartAssistantBox .moaath-ai-static-title-hidden { display: none !important; }",

      /* #2 Unified Compact Single-Row Control Header */
      "#aiSmartAssistantBox #futuristicAiHeader { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 5px !important; flex-wrap: nowrap !important; width: 100% !important; }",
      "#moaathAiCompactPersonaBtn { display: inline-flex !important; align-items: center !important; gap: 6px !important; background: rgba(255, 255, 255, 0.045) !important; border: 1px solid rgba(212, 175, 55, 0.35) !important; border-radius: 999px !important; padding: 3px 9px 3px 4px !important; cursor: pointer !important; min-width: 0 !important; flex: 1 1 auto !important; max-width: 50% !important; color: var(--text-color) !important; }",
      "#moaathAiCompactAvatarWrap { position: relative !important; width: 24px !important; height: 24px !important; flex-shrink: 0 !important; }",
      "#moaathAiCompactAvatar { width: 24px !important; height: 24px !important; border-radius: 50% !important; object-fit: cover !important; border: 1.5px solid #D4AF37 !important; display: block !important; }",
      /* #4 Live Status Dot on Persona Avatar */
      "#moaathPersonaStatusDot { position: absolute !important; bottom: -1px !important; right: -1px !important; width: 8px !important; height: 8px !important; border-radius: 50% !important; background: #10b981 !important; border: 1.5px solid #0f141e !important; box-shadow: 0 0 6px #10b981 !important; }",
      "#moaathPersonaStatusDot.is-busy { background: #38bdf8 !important; box-shadow: 0 0 8px #38bdf8 !important; animation: moaathDotPulse 0.9s infinite !important; }",
      "#moaathPersonaStatusDot.is-offline { background: #f59e0b !important; box-shadow: 0 0 6px #f59e0b !important; }",
      "#moaathAiCompactName { font-size: 10.5px !important; font-weight: 800 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; color: var(--text-color) !important; }",

      "#aiSmartAssistantBox .fut-ai-header-actions { display: flex !important; align-items: center !important; gap: 4px !important; flex-shrink: 0 !important; }",
      "#aiSmartAssistantBox .moaath-ai-mini-icon { width: 28px !important; height: 28px !important; padding: 0 !important; border-radius: 50% !important; border: 1px solid rgba(212, 175, 55, 0.34) !important; background: rgba(255, 255, 255, 0.05) !important; color: #D4AF37 !important; font-size: 12px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; }",
      "#aiSmartAssistantBox .moaath-ai-mini-icon.is-muted { opacity: 0.5 !important; color: #94a3b8 !important; }",
      "#aiSmartAssistantBox #futVipShowcaseBtn { padding: 4px 8px !important; font-size: 10px !important; border-radius: 999px !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; border: 1px solid rgba(212, 175, 55, 0.42) !important; }",
      "#aiSmartAssistantBox #futuristicAiToggleBtn { padding: 4px 9px !important; font-size: 10px !important; border-radius: 999px !important; background: rgba(255, 255, 255, 0.05) !important; color: var(--text-color) !important; border: 1px solid rgba(212, 175, 55, 0.38) !important; }",
      "#aiSmartAssistantBox.is-ai-collapsed #moaathAiCompactVoiceBtn, #aiSmartAssistantBox.is-ai-collapsed #moaathAiCompactReplayBtn { display: none !important; }",

      /* #5 Embedded Submit Button Inside Pill Prompt Input */
      "#aiSmartAssistantBox #futuristicAiBody { margin-top: 6px !important; }",
      "#moaathAiEmbeddedInputRow { position: relative !important; display: flex !important; align-items: center !important; width: 100% !important; border-radius: 999px !important; background: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(212, 175, 55, 0.38) !important; padding: 2px 4px 2px 3px !important; box-sizing: border-box !important; margin-bottom: 5px !important; }",
      "body.light-mode #moaathAiEmbeddedInputRow { background: #f8fafc !important; }",
      "#moaathAiEmbeddedInputRow #aiShoppingPromptInput { flex: 1 !important; min-width: 0 !important; border: none !important; background: transparent !important; color: var(--text-color) !important; font-size: 11px !important; padding: 5px 10px !important; margin: 0 !important; outline: none !important; box-shadow: none !important; }",
      "#moaathAiEmbeddedInputRow .moaath-ai-embedded-send { width: auto !important; min-width: 34px !important; height: 28px !important; padding: 0 10px !important; margin: 0 !important; border-radius: 999px !important; border: none !important; background: linear-gradient(135deg, #D4AF37, #10b981) !important; color: #0f141e !important; font-size: 11px !important; font-weight: 900 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 3px !important; cursor: pointer !important; flex-shrink: 0 !important; }",

      /* #6 Always-Visible Slim One-Tap Chips Strip (Unified Palette) */
      "#aiSmartAssistantBox #petQuickPromptChips { display: flex !important; flex-wrap: nowrap !important; gap: 5px !important; overflow-x: auto !important; scrollbar-width: none !important; padding: 2px 0 !important; margin: 3px 0 0 0 !important; max-height: 36px !important; opacity: 1 !important; pointer-events: auto !important; }",
      "#aiSmartAssistantBox.is-ai-collapsed #petQuickPromptChips { display: none !important; }",
      "#aiSmartAssistantBox .fut-chip-btn { flex-shrink: 0 !important; background: rgba(255, 255, 255, 0.045) !important; color: var(--text-color) !important; border: 1px solid rgba(212, 175, 55, 0.3) !important; border-radius: 999px !important; padding: 3px 9px !important; font-size: 10px !important; font-weight: 700 !important; cursor: pointer !important; }",

      /* #7 Quick Budget Pills for Multi-Turn Dialog */
      "#moaathAiBudgetQuickRow { display: none; align-items: center !important; gap: 5px !important; overflow-x: auto !important; scrollbar-width: none !important; margin: 5px 0 2px 0 !important; padding: 3px 0 !important; }",
      "#moaathAiBudgetQuickRow.is-visible { display: flex !important; }",
      ".moaath-ai-budget-pill { flex-shrink: 0 !important; padding: 3px 10px !important; border-radius: 999px !important; border: 1px solid rgba(16, 185, 129, 0.45) !important; background: rgba(16, 185, 129, 0.14) !important; color: #10b981 !important; font-size: 10px !important; font-weight: 800 !important; cursor: pointer !important; }",

      /* #8 Dynamic Reply Line (Visible Only When Reply Exists) */
      "#moaathAiDynamicReplyBar { display: none; align-items: center !important; justify-content: space-between !important; gap: 6px !important; margin-top: 5px !important; padding: 4px 8px !important; border-radius: 10px !important; background: rgba(56, 189, 248, 0.08) !important; border: 1px solid rgba(56, 189, 248, 0.28) !important; font-size: 10.5px !important; color: var(--text-color) !important; }",
      "#moaathAiDynamicReplyBar.has-reply { display: flex !important; }",
      "#moaathAiDynamicReplyBar #aiShoppingStatusText { flex: 1 !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; font-size: 10.5px !important; line-height: 1.4 !important; color: var(--text-color) !important; }",
      ".moaath-reply-listen-btn { width: 24px !important; height: 24px !important; border-radius: 50% !important; border: 1px solid rgba(212, 175, 55, 0.4) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; font-size: 11px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; }",

      /* Store Reorder, Categories, Cards, Out-of-Stock, Skeleton, Cart Dock, BackToTop */
      "#moaathQuickReorderBar { margin: 4px 0 8px 0 !important; padding: 6px 9px !important; border-radius: 14px !important; border: 1px solid rgba(16, 185, 129, 0.3) !important; background: rgba(16, 185, 129, 0.06) !important; }",
      ".moaath-reorder-head { display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 10px !important; font-weight: 800 !important; color: #10b981 !important; margin-bottom: 5px !important; }",
      ".moaath-reorder-track { display: flex !important; gap: 7px !important; overflow-x: auto !important; scrollbar-width: none !important; }",
      ".moaath-reorder-track::-webkit-scrollbar { display: none !important; }",
      ".moaath-reorder-chip { flex: 0 0 auto !important; display: flex !important; align-items: center !important; gap: 6px !important; background: #0f141e !important; border: 1px solid rgba(212, 175, 55, 0.35) !important; border-radius: 999px !important; padding: 3px 6px 3px 4px !important; }",
      "body.light-mode .moaath-reorder-chip { background: #f8fafc !important; }",
      ".moaath-reorder-chip img { width: 24px !important; height: 24px !important; border-radius: 50% !important; object-fit: cover !important; }",
      ".moaath-reorder-name { font-size: 10px !important; font-weight: 700 !important; max-width: 92px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }",
      ".moaath-reorder-add { width: 22px !important; height: 22px !important; border-radius: 50% !important; border: none !important; background: #10b981 !important; color: #000 !important; font-weight: 900 !important; cursor: pointer !important; }",

      ".categories { position: sticky !important; top: 0 !important; z-index: 45 !important; background: rgba(15, 20, 30, 0.94) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border-radius: 14px !important; padding: 6px !important; scrollbar-width: none !important; }",
      "body.light-mode .categories { background: rgba(248, 250, 252, 0.95) !important; }",

      ".product-card { position: relative !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; height: 100% !important; border-radius: 16px !important; border: 1px solid rgba(212, 175, 55, 0.25) !important; box-sizing: border-box !important; }",
      ".moaath-card-fab-add { position: absolute !important; top: 8px !important; left: 8px !important; z-index: 12 !important; width: 32px !important; height: 32px !important; border-radius: 50% !important; border: 1.5px solid #D4AF37 !important; background: rgba(15, 20, 30, 0.88) !important; color: #D4AF37 !important; font-size: 18px !important; font-weight: 900 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45) !important; cursor: pointer !important; }",
      ".moaath-inline-stepper { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 6px !important; width: 100% !important; background: rgba(212, 175, 55, 0.12) !important; border: 1.5px solid #D4AF37 !important; box-shadow: 0 0 12px rgba(212, 175, 55, 0.28) !important; border-radius: 12px !important; padding: 3px 6px !important; box-sizing: border-box !important; margin-top: 4px !important; }",
      ".moaath-step-btn { width: 28px !important; height: 26px !important; border-radius: 8px !important; border: none !important; font-size: 16px !important; font-weight: 900 !important; cursor: pointer !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }",
      ".moaath-step-minus { background: rgba(255, 255, 255, 0.1) !important; color: var(--text-color) !important; }",
      ".moaath-step-plus { background: #D4AF37 !important; color: #000 !important; }",
      ".moaath-step-qty { font-size: 13px !important; font-weight: 900 !important; color: #10b981 !important; }",

      ".moaath-out-of-stock-card { opacity: 0.7 !important; }",
      ".moaath-out-of-stock-card img { filter: grayscale(0.45) brightness(0.85) !important; }",
      ".moaath-out-badge { position: absolute !important; top: 8px !important; right: 8px !important; z-index: 14 !important; background: rgba(15, 20, 30, 0.92) !important; color: #D4AF37 !important; border: 1px solid rgba(212, 175, 55, 0.55) !important; border-radius: 999px !important; padding: 2px 8px !important; font-size: 9.5px !important; font-weight: 800 !important; pointer-events: none !important; }",
      ".moaath-compact-notify-btn { padding: 5px 8px !important; font-size: 10px !important; background: rgba(56, 189, 248, 0.14) !important; background-image: none !important; color: #38bdf8 !important; border: 1px solid rgba(56, 189, 248, 0.42) !important; box-shadow: none !important; }",

      "@keyframes moaathSkeletonShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }",
      ".moaath-img-skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(212,175,55,0.16) 50%, rgba(255,255,255,0.05) 75%) !important; background-size: 200% 100% !important; animation: moaathSkeletonShimmer 1.3s infinite linear !important; min-height: 95px !important; }",

      "#aiSmartAssistantBox.is-ai-collapsed #futuristicAiBody, #futuristicAiBody.is-collapsed { display: none !important; }",
      "body.moaath-ai-expanded #petCharRoot, body.moaath-search-focused #petCharRoot { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; transform: scale(0.75) !important; }",

      ".cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar { left: 8px !important; right: 8px !important; bottom: 8px !important; width: auto !important; border-radius: 18px !important; background: rgba(15, 20, 30, 0.92) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border: 1px solid rgba(212, 175, 55, 0.42) !important; box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5) !important; }",
      "#moaathCartCountBadge { display: inline-flex !important; align-items: center !important; justify-content: center !important; min-width: 19px !important; height: 19px !important; padding: 0 5px !important; border-radius: 999px !important; background: #D4AF37 !important; color: #000 !important; font-size: 10px !important; font-weight: 900 !important; margin-right: 5px !important; }",

      "#moaathBackToTopBtn { position: fixed; bottom: 82px; left: 14px; z-index: 95; width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(212, 175, 55, 0.65); background: rgba(15, 20, 30, 0.92); color: #D4AF37; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transform: translateY(10px); transition: opacity 0.25s ease, transform 0.25s ease; }",
      "#moaathBackToTopBtn.is-visible { opacity: 1; pointer-events: auto; transform: translateY(0); }"
    ].join(" ");
  }

  /* === 10 AI Assistant Tab Enhancements === */
  function enhanceCompactAIAssistantTab() {
    var box = $("aiSmartAssistantBox");
    var header = $("futuristicAiHeader");
    var body = $("futuristicAiBody");
    if (!box || !header || !body) return;

    /* #1 Hide static heading "مساعد التسوق الذكي..." */
    body.querySelectorAll("div, p, label, span, h3, h4").forEach(function (el) {
      if (el.id === "aiShoppingStatusText" || el.closest("#moaathAiDynamicReplyBar")) return;
      if (el.children.length <= 1 && /مساعد\s*التسوق\s*الذكي/.test(el.textContent || "")) {
        el.classList.add("moaath-ai-static-title-hidden");
      }
    });

    /* #2 + #4 Compact Persona Pill + Live Status Dot inside Header */
    var compactPersonaBtn = $("moaathAiCompactPersonaBtn");
    if (!compactPersonaBtn) {
      compactPersonaBtn = document.createElement("button");
      compactPersonaBtn.type = "button";
      compactPersonaBtn.id = "moaathAiCompactPersonaBtn";
      compactPersonaBtn.title = "تغيير الشخصية أو عرض التشخيص";
      compactPersonaBtn.innerHTML =
        '<span id="moaathAiCompactAvatarWrap">' +
          '<img id="moaathAiCompactAvatar" src="buddy.jpg" onerror="this.onerror=null;this.src=\'store-icon.png\';" alt="المساعد">' +
          '<span id="moaathPersonaStatusDot" title="جاهز"></span>' +
        '</span>' +
        '<span id="moaathAiCompactName">المساعد الذكي</span>';
      compactPersonaBtn.onclick = function (e) {
        if (e && e.target && e.target.id === "moaathPersonaStatusDot") {
          e.stopPropagation();
          if (typeof window.showVoiceDiagnosticOnPhone === "function") window.showVoiceDiagnosticOnPhone();
          return;
        }
        if (typeof window.openFairyGalleryModal === "function") window.openFairyGalleryModal();
      };
      header.insertBefore(compactPersonaBtn, header.firstChild);
    }

    var srcAvatar = $("fairyBarThumb") || $("fairyCharImg");
    var dstAvatar = $("moaathAiCompactAvatar");
    if (srcAvatar && dstAvatar && srcAvatar.src && dstAvatar.src !== srcAvatar.src) {
      dstAvatar.src = srcAvatar.src;
    }
    var srcName = $("fairyBarActiveName");
    var dstName = $("moaathAiCompactName");
    if (srcName && dstName && srcName.textContent) {
      dstName.textContent = srcName.textContent.trim();
    }

    /* #2 Compact circular Voice & Replay icon buttons in Header Actions */
    var actions = header.querySelector(".fut-ai-header-actions");
    if (actions) {
      if (!$("moaathAiCompactReplayBtn")) {
        var repBtn = document.createElement("button");
        repBtn.type = "button";
        repBtn.id = "moaathAiCompactReplayBtn";
        repBtn.className = "moaath-ai-mini-icon";
        repBtn.title = "إعادة الاستماع";
        repBtn.textContent = "🔁";
        repBtn.onclick = function () {
          if (typeof window.replayLastCompanionSpeech === "function") window.replayLastCompanionSpeech();
        };
        actions.insertBefore(repBtn, actions.firstChild);
      }
      if (!$("moaathAiCompactVoiceBtn")) {
        var vBtn = document.createElement("button");
        vBtn.type = "button";
        vBtn.id = "moaathAiCompactVoiceBtn";
        vBtn.className = "moaath-ai-mini-icon";
        vBtn.title = "تفعيل أو كتم الصوت";
        vBtn.textContent = "🔊";
        vBtn.onclick = function () {
          if (typeof window.toggleCompanionVoice === "function") window.toggleCompanionVoice();
          setTimeout(syncCompactVoiceIcon, 50);
        };
        actions.insertBefore(vBtn, actions.firstChild);
      }
    }
    syncCompactVoiceIcon();

    /* #4 + #9 Live Status Dot & Ambient Glow */
    var dot = $("moaathPersonaStatusDot");
    var badge = $("petConnStatusBadge");
    var badgeTxt = badge ? (badge.textContent || "") : "";
    var isOffline = navigator.onLine === false || /محلي|محدود/.test(badgeTxt);
    var isBusy = /يستمع|يجهز|تفكير|جاري/.test(badgeTxt) ||
      (!!$("petDirectMicBtn") && $("petDirectMicBtn").classList.contains("mic-listening-pulse")) ||
      (!!$("petListenRing") && $("petListenRing").style.display === "block");

    if (dot) {
      dot.classList.toggle("is-busy", isBusy);
      dot.classList.toggle("is-offline", !isBusy && isOffline);
      dot.title = isBusy ? "يستمع / يعالج..." : (isOffline ? "وضع محلي" : "جاهز");
    }
    box.classList.toggle("moaath-ai-active-glow", isBusy);

    /* #5 Embed Submit Button inside Prompt Input Pill */
    var promptInp = $("aiShoppingPromptInput");
    if (promptInp && !$("moaathAiEmbeddedInputRow")) {
      var origRow = promptInp.parentElement;
      var sendBtn = null;
      if (origRow) {
        sendBtn = origRow.querySelector("button[onclick*='runAIShoppingAssistant'], button");
      }
      var wrap = document.createElement("div");
      wrap.id = "moaathAiEmbeddedInputRow";
      if (origRow && origRow.parentNode) {
        origRow.parentNode.insertBefore(wrap, origRow);
      } else {
        body.insertBefore(wrap, body.firstChild);
      }
      wrap.appendChild(promptInp);
      if (sendBtn) {
        sendBtn.classList.add("moaath-ai-embedded-send");
        sendBtn.innerHTML = "<span>✨</span><span>تعبئة</span>";
        wrap.appendChild(sendBtn);
      } else {
        var newSend = document.createElement("button");
        newSend.type = "button";
        newSend.className = "moaath-ai-embedded-send";
        newSend.innerHTML = "<span>✨</span><span>تعبئة</span>";
        newSend.onclick = function () {
          if (typeof window.runAIShoppingAssistant === "function") window.runAIShoppingAssistant();
        };
        wrap.appendChild(newSend);
      }
      if (origRow && origRow.children.length === 0) {
        origRow.style.display = "none";
      }
    }

    /* #6 Enhance One-Tap Horizontal Chips Strip (Ensure "كرر طلبي" is included) */
    var chips = $("petQuickPromptChips");
    if (chips) {
      chips.classList.remove("is-chips-collapsed");
      if (!chips.dataset.v54ChipsReady) {
        chips.dataset.v54ChipsReady = "1";
        var hasRepeat = Array.prototype.some.call(chips.children, function (c) {
          return /كرر\s*طلبي/.test(c.textContent || "");
        });
        if (!hasRepeat) {
          var repChip = document.createElement("button");
          repChip.type = "button";
          repChip.className = "fut-chip-btn";
          repChip.textContent = "🔁 كرر طلبي";
          repChip.onclick = function () {
            if (typeof window.runAIShoppingAssistant === "function") window.runAIShoppingAssistant("كرر طلبي");
          };
          chips.appendChild(repChip);
        }
      }
    }

    /* #8 Dynamic Reply Bar (Visible only when reply exists) */
    var statusEl = $("aiShoppingStatusText");
    var replyBar = $("moaathAiDynamicReplyBar");
    if (statusEl) {
      if (!replyBar) {
        replyBar = document.createElement("div");
        replyBar.id = "moaathAiDynamicReplyBar";
        if (statusEl.parentNode) {
          statusEl.parentNode.insertBefore(replyBar, statusEl);
        } else {
          body.appendChild(replyBar);
        }
        replyBar.appendChild(statusEl);
        var listenBtn = document.createElement("button");
        listenBtn.type = "button";
        listenBtn.className = "moaath-reply-listen-btn";
        listenBtn.title = "استماع للرد";
        listenBtn.textContent = "🔊";
        listenBtn.onclick = function () {
          if (typeof window.replayLastCompanionSpeech === "function") window.replayLastCompanionSpeech();
        };
        replyBar.appendChild(listenBtn);
      }
      var statusTxt = (statusEl.textContent || "").trim();
      var hasActiveReply = statusTxt.length > 0 && !/^(جاهز|مساعد التسوق الذكي)$/.test(statusTxt);
      replyBar.classList.toggle("has-reply", hasActiveReply);

      /* #7 Quick Budget Pills when Multi-Turn Dialog asks for budget */
      var budgetRow = $("moaathAiBudgetQuickRow");
      if (!budgetRow) {
        budgetRow = document.createElement("div");
        budgetRow.id = "moaathAiBudgetQuickRow";
        ["500", "1000", "2000", "5000"].forEach(function (amt) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "moaath-ai-budget-pill";
          b.textContent = "💰 " + amt + " ل.س";
          b.onclick = function () {
            if (typeof window.runAIShoppingAssistant === "function") window.runAIShoppingAssistant(amt);
          };
          budgetRow.appendChild(b);
        });
        replyBar.parentNode.insertBefore(budgetRow, replyBar.nextSibling);
      }
      var pendingBudget = false;
      try {
        var pd = JSON.parse(sessionStorage.getItem("moaath_ai_pending_dialog_v2") || "null");
        if (pd && pd.type === "awaiting_budget" && pd.expiresAt > Date.now()) pendingBudget = true;
      } catch (_) {}
      var asksBudget = pendingBudget || /كم\s*الميزانية|اكتب\s*رقم\s*الميزانية|اكتب\s*الرقم\s*فقط/.test(statusTxt);
      budgetRow.classList.toggle("is-visible", asksBudget);
    }
  }

  function syncCompactVoiceIcon() {
    var vBtn = $("moaathAiCompactVoiceBtn");
    if (!vBtn) return;
    var enabled = true;
    try {
      var prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      if (prefs && prefs.voiceEnabled === false) enabled = false;
    } catch (_) {}
    vBtn.textContent = enabled ? "🔊" : "🔇";
    vBtn.classList.toggle("is-muted", !enabled);
  }

  /* === Store UI Enhancements (v5.3 Preserved) === */
  function simplifyHeaderAndFooter() {
    var header = document.querySelector("header, .store-header, .top-bar");
    if (!header) return;

    var phoneText = "";
    var candidates = [];
    header.querySelectorAll("div, span, p, small, a").forEach(function (el) {
      var txt = (el.textContent || "").trim();
      if (/963\d{7,}|09\d{8}/.test(txt) && !/متجر\s*معاذ/.test(txt)) {
        candidates.push(el);
      }
    });

    candidates.forEach(function (el) {
      var hasChildMatch = candidates.some(function (other) {
        return other !== el && el.contains(other);
      });
      if (!hasChildMatch) {
        phoneText = (el.textContent || "").trim();
        el.classList.add("moaath-header-phone-hidden");
      }
    });

    if (phoneText && !$("moaathFooterContactBar")) {
      var footer = document.createElement("div");
      footer.id = "moaathFooterContactBar";
      footer.innerHTML = "📍 <b>متجر معاذ</b> — قرية العوينة | للتواصل: <b style=\"color:#D4AF37; direction:ltr; display:inline-block;\">" + phoneText.replace(/</g, "&lt;") + "</b>";
      document.body.appendChild(footer);
    }
  }

  function stripIconBracketsInUserBar(container) {
    if (!container) return;

    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var v = node.nodeValue || "";
      if (!/[()]/.test(v)) continue;
      var cleaned = v.replace(/\(\s*([^\w\u0600-\u06FF\s]{1,4})\s*\)/g, "$1");
      if (/^[\s()]+$/.test(cleaned)) cleaned = " ";
      if (cleaned !== v) node.nodeValue = cleaned;
    }

    container.querySelectorAll("button, a, span[onclick]").forEach(function (btn) {
      if (btn.classList.contains("moaath-userbar-menu-btn")) return;
      var t = (btn.textContent || "").trim();
      var stripped = t.replace(/^\(\s*|\s*\)$/g, "").trim();
      if (stripped !== t && !/[\u0600-\u06FF]{3,}/.test(stripped)) {
        btn.textContent = stripped;
      }
      if (stripped.length > 0 && stripped.length <= 16) {
        btn.classList.add("moaath-glass-circle-btn");
        if (!/[\u0600-\u06FFA-Za-z0-9]/.test(stripped)) {
          btn.classList.add("moaath-glass-icon-only");
        }
      }
    });
  }

  function enhanceCollapsibleUserBar() {
    var bar = document.querySelector(".user-bar, .user-info-bar, #userInfoBar, [class*='user-bar']");
    if (!bar || bar.closest(".modal-overlay")) return;

    var userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "حسابي";
    var fullTxt = bar.textContent || "";
    var ptsMatch = fullTxt.match(/نقاطي\s*:\s*[\d,]+/);
    var balMatch = fullTxt.match(/رصيدي\s*:\s*[\d,]+\s*ل\.س/);
    var summaryBits = ["👤 " + userName];
    if (balMatch) summaryBits.push("💳 " + balMatch[0]);
    if (ptsMatch) summaryBits.push("🎁 " + ptsMatch[0]);

    if (!bar.dataset.moaathCollapsibleBound) {
      bar.dataset.moaathCollapsibleBound = "1";
      bar.classList.add("moaath-userbar-shell");

      var bodyWrap = document.createElement("div");
      bodyWrap.className = "moaath-userbar-body";
      while (bar.firstChild) {
        bodyWrap.appendChild(bar.firstChild);
      }

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
        if (/عرض\s*خاص|عرض\s*محدث/.test(txt) && el.querySelector("img")) addCandidate(el);
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

  function buildUnifiedSmartSearchBar() {
    if ($("moaathUnifiedSmartBar")) return;
    var assistBox = $("aiSmartAssistantBox");
    if (!assistBox || !assistBox.parentNode) return;

    var origSearch = document.querySelector("#searchInput, #productSearchInput, #storeSearchInput, input[placeholder*='ابحث']");
    var reqProductBtn = null;
    document.querySelectorAll("button, a, div[onclick]").forEach(function (b) {
      if (!reqProductBtn && /طلب\s*صنف/.test(b.textContent || "") && !b.closest(".modal-overlay") && (b.textContent || "").trim().length < 25) {
        reqProductBtn = b;
      }
    });

    var pill = document.createElement("div");
    pill.id = "moaathUnifiedSmartBar";
    pill.className = "moaath-unified-pill-bar";

    var inp = document.createElement("input");
    inp.type = "text";
    inp.id = "moaathUnifiedSearchInput";
    inp.className = "moaath-unified-pill-input";
    inp.placeholder = "🔍 ابحث عن صنف أو اطلب من المساعد...";

    inp.addEventListener("input", function () {
      if (origSearch) {
        origSearch.value = inp.value;
        origSearch.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && inp.value.trim() && typeof window.runAIShoppingAssistant === "function") {
        window.runAIShoppingAssistant(inp.value.trim());
      }
    });
    inp.addEventListener("focus", function () {
      document.body.classList.add("moaath-search-focused");
    });
    inp.addEventListener("blur", function () {
      setTimeout(function () { document.body.classList.remove("moaath-search-focused"); }, 250);
    });

    var micBtn = document.createElement("button");
    micBtn.type = "button";
    micBtn.className = "moaath-pill-action moaath-pill-mic";
    micBtn.title = "بحث صوتي";
    micBtn.textContent = "🎙️";
    micBtn.onclick = function () {
      if (typeof window.startVoiceShoppingInput === "function") window.startVoiceShoppingInput();
    };

    var reqBtn = document.createElement("button");
    reqBtn.type = "button";
    reqBtn.className = "moaath-pill-action";
    reqBtn.textContent = "📝 طلب صنف";
    reqBtn.onclick = function () {
      if (reqProductBtn) reqProductBtn.click();
    };

    pill.appendChild(inp);
    pill.appendChild(micBtn);
    if (reqProductBtn) {
      pill.appendChild(reqBtn);
      reqProductBtn.style.display = "none";
      if (reqProductBtn.parentElement && reqProductBtn.parentElement.children.length === 1 && reqProductBtn.parentElement.tagName === "DIV") {
        reqProductBtn.parentElement.style.display = "none";
      }
    }
    if (origSearch) {
      var origWrap = origSearch.closest(".search-box, .search-bar, .form-group") || origSearch;
      if (origWrap && !origWrap.closest("#aiSmartAssistantBox")) {
        origWrap.style.display = "none";
      }
    }

    assistBox.parentNode.insertBefore(pill, assistBox);
  }

  function enhanceProductAndOfferCards() {
    var cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};

    document.querySelectorAll(".product-card img, .offer-card img, .moaath-offer-card-slide img").forEach(function (img) {
      if (img.dataset.skelBound) return;
      img.dataset.skelBound = "1";
      if (!img.complete || img.naturalWidth === 0) {
        img.classList.add("moaath-img-skeleton");
        img.addEventListener("load", function () { img.classList.remove("moaath-img-skeleton"); }, { once: true });
        img.addEventListener("error", function () { img.classList.remove("moaath-img-skeleton"); }, { once: true });
      }
    });

    document.querySelectorAll(".product-card, .offer-card, .moaath-offer-card-slide").forEach(function (card) {
      var txt = card.textContent || "";
      var isOut = /سيتم\s*إعلامك|أعلمني\s*عند|نفد|غير\s*متوفر/.test(txt);
      card.classList.toggle("moaath-out-of-stock-card", isOut);

      if (isOut) {
        if (!card.querySelector(".moaath-out-badge")) {
          var badge = document.createElement("span");
          badge.className = "moaath-out-badge";
          badge.textContent = "نفد مؤقتاً";
          card.style.position = "relative";
          card.appendChild(badge);
        }
        card.querySelectorAll("button").forEach(function (b) {
          if (/أعلمني|سيتم\s*إعلامك/.test(b.textContent || "")) {
            b.classList.add("moaath-compact-notify-btn");
          }
        });
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

      if (!card.querySelector(".moaath-card-fab-add")) {
        var fab = document.createElement("button");
        fab.type = "button";
        fab.className = "moaath-card-fab-add";
        fab.title = "إضافة سريعة للسلة";
        fab.textContent = "+";
        fab.onclick = function (e) {
          if (e) e.stopPropagation();
          if (typeof window.changeQty === "function") window.changeQty(pid, 1);
          setTimeout(enhanceProductAndOfferCards, 30);
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
          stepper.innerHTML = '<button type="button" class="moaath-step-btn moaath-step-minus" aria-label="إنقاص">−</button><span class="moaath-step-qty">' + qty + '</span><button type="button" class="moaath-step-btn moaath-step-plus" aria-label="زيادة">+</button>';

          stepper.querySelector(".moaath-step-minus").onclick = function (e) {
            if (e) e.stopPropagation();
            if (typeof window.changeQty === "function") window.changeQty(pid, -1);
            setTimeout(enhanceProductAndOfferCards, 30);
          };
          stepper.querySelector(".moaath-step-plus").onclick = function (e) {
            if (e) e.stopPropagation();
            if (typeof window.changeQty === "function") window.changeQty(pid, 1);
            setTimeout(enhanceProductAndOfferCards, 30);
          };

          btn.parentNode.insertBefore(stepper, btn.nextSibling);
        } else {
          var qSpan = nextEl.querySelector(".moaath-step-qty");
          if (qSpan) qSpan.textContent = String(qty);
        }
      } else {
        btn.style.display = "";
        if (hasStepper) nextEl.remove();
      }
    });
  }

  function renderQuickReorderBar() {
    var prods = (typeof window.products === "object" && window.products) ? window.products : {};
    var hist = (typeof window.completedOrdersHistory === "object" && window.completedOrdersHistory) ? window.completedOrdersHistory : {};
    var catsBar = document.querySelector(".categories");
    if (!catsBar || !catsBar.parentNode) return;

    var freq = {};
    Object.values(hist).forEach(function (ord) {
      (ord && Array.isArray(ord.items) ? ord.items : []).forEach(function (it) {
        var pid = it.origId || String(it.id || "").replace(/_PKG$/, "");
        if (!pid || !prods[pid]) return;
        freq[pid] = (freq[pid] || 0) + (parseInt(it.qty, 10) || 1);
      });
    });

    var picks = Object.keys(freq)
      .filter(function (pid) {
        var p = prods[pid];
        if (!p) return false;
        var st = (typeof window.getProductStockForBranch === "function")
          ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
          : (parseInt(p.stock, 10) || 0);
        return st > 0;
      })
      .sort(function (a, b) { return freq[b] - freq[a]; })
      .slice(0, 8);

    var bar = $("moaathQuickReorderBar");
    if (!picks.length) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement("div");
      bar.id = "moaathQuickReorderBar";
      catsBar.parentNode.insertBefore(bar, catsBar);
    }

    var signature = picks.join(",");
    if (bar.dataset.sig === signature) return;
    bar.dataset.sig = signature;

    bar.innerHTML = "";
    var head = document.createElement("div");
    head.className = "moaath-reorder-head";
    head.innerHTML = "<span>⚡ أكثر ما تطلبه (إعادة طلب سريعة)</span><span>بنقرة واحدة</span>";
    bar.appendChild(head);

    var track = document.createElement("div");
    track.className = "moaath-reorder-track";
    picks.forEach(function (pid) {
      var p = prods[pid];
      var chip = document.createElement("div");
      chip.className = "moaath-reorder-chip";

      var img = document.createElement("img");
      img.src = p.thumb || p.image || p.img || "store-icon.png";
      img.alt = p.name || "";
      img.onerror = function () { this.onerror = null; this.src = "store-icon.png"; };

      var nameSpan = document.createElement("span");
      nameSpan.className = "moaath-reorder-name";
      nameSpan.title = p.name || "";
      nameSpan.textContent = p.name || "";

      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "moaath-reorder-add";
      addBtn.textContent = "+";
      addBtn.onclick = function () {
        if (typeof window.changeQty === "function") window.changeQty(pid, 1);
      };

      chip.appendChild(img);
      chip.appendChild(nameSpan);
      chip.appendChild(addBtn);
      track.appendChild(chip);
    });
    bar.appendChild(track);
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
      badge.textContent = String(totalPieces);
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
    btn.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 360);
    }, { passive: true });
  }

  var timer = null;
  function runAll() {
    var tasks = [
      injectStoreFuturisticCSS,
      simplifyHeaderAndFooter,
      enhanceCollapsibleUserBar,
      applyOffersHorizontalSlider,
      buildUnifiedSmartSearchBar,
      enhanceCompactAIAssistantTab,
      renderQuickReorderBar,
      enhanceProductAndOfferCards,
      syncFloatingCartBadge,
      bindToggleButtonDirect,
      syncAssistantState,
      mountBackToTop
    ];
    tasks.forEach(function (fn) {
      try { fn(); } catch (_) {}
    });
  }

  function start() {
    runAll();
    var obs = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(runAll, 30);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

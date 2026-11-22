/* store_ui_futuristic.js — v5.5 (Event-Driven, Zero-Friction MutationObserver, Lazy Images, Clear Search ✕, Escape Modal Close) */
(function () {
  if (window.__MOAATH_STORE_UI_V55__) return;
  window.__MOAATH_STORE_UI_V55__ = true;
  window.__MOAATH_STORE_UI_V54__ = true; // compatibility flag

  var COLLAPSE_KEY = "moaath_store_ai_collapsed";
  var USERBAR_COLLAPSE_KEY = "moaath_store_userbar_collapsed";
  var isSelfMutating = false;
  var obsTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function withSelfMutationGuard(fn) {
    isSelfMutating = true;
    try { fn(); } catch (_) {}
    setTimeout(function () { isSelfMutating = false; }, 16);
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
      ".moaath-offers-track > div, .moaath-offers-track > article, .moaath-offer-card-slide { flex: 0 0 84vw !important; width: 84vw !important; min-width: 240px !important; max-width: 310px !important; scroll-snap-align: start !important; box-sizing: border-box !important; margin: 0 !important; padding: 7px 10px !important; border-radius: 15px !important; border: 1px solid rgba(212, 175, 55, 0.36) !important; }",
      "#moaathOffersDots { display: flex !important; justify-content: center !important; align-items: center !important; gap: 5px !important; margin: 2px 0 7px 0 !important; }",
      ".moaath-offer-dot { width: 6px !important; height: 6px !important; border-radius: 999px !important; background: rgba(212, 175, 55, 0.28) !important; transition: width 0.22s ease, background 0.22s ease !important; }",
      ".moaath-offer-dot.is-active { width: 16px !important; background: #D4AF37 !important; }",
      ".moaath-unified-pill-bar { display: flex !important; align-items: center !important; gap: 5px !important; width: 100% !important; border-radius: 999px !important; padding: 4px 6px !important; margin: 5px 0 6px 0 !important; background: rgba(255, 255, 255, 0.045) !important; border: 1px solid rgba(212, 175, 55, 0.42) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; box-sizing: border-box !important; }",
      "body.light-mode .moaath-unified-pill-bar { background: #ffffff !important; }",
      ".moaath-unified-pill-input { flex: 1 !important; min-width: 0 !important; border: none !important; background: transparent !important; color: var(--text-color) !important; font-size: 11px !important; padding: 4px 8px !important; outline: none !important; }",
      ".moaath-pill-clear { width: 24px !important; height: 24px !important; padding: 0 !important; border-radius: 50% !important; border: none !important; background: rgba(239, 68, 68, 0.16) !important; color: #f87171 !important; font-size: 11px !important; font-weight: 900 !important; display: none; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; }",
      ".moaath-pill-clear.is-visible { display: inline-flex !important; }",
      ".moaath-pill-action { border-radius: 999px !important; padding: 4px 9px !important; font-size: 10px !important; font-weight: 800 !important; border: 1px solid rgba(212, 175, 55, 0.38) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; cursor: pointer !important; white-space: nowrap !important; flex-shrink: 0 !important; }",
      ".moaath-pill-mic { width: 28px !important; height: 28px !important; padding: 0 !important; border-radius: 50% !important; background: rgba(16, 185, 129, 0.16) !important; border-color: rgba(16, 185, 129, 0.42) !important; color: #10b981 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }",
      "@keyframes moaathAiAmbientGlow { 0%, 100% { box-shadow: 0 0 12px rgba(56, 189, 248, 0.35), 0 0 22px rgba(212, 175, 55, 0.2); border-color: rgba(56, 189, 248, 0.75); } 50% { box-shadow: 0 0 18px rgba(212, 175, 55, 0.45), 0 0 28px rgba(56, 189, 248, 0.25); border-color: rgba(212, 175, 55, 0.85); } }",
      "@keyframes moaathDotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: 0.7; } }",
      "#aiSmartAssistantBox.fut-ai-dock { padding: 6px 8px !important; margin: 4px 0 8px 0 !important; border-radius: 16px !important; background: linear-gradient(155deg, rgba(18, 25, 39, 0.94), rgba(15, 20, 30, 0.98)) !important; border: 1px solid rgba(212, 175, 55, 0.34) !important; transition: border-color 0.25s ease, box-shadow 0.25s ease !important; }",
      "body.light-mode #aiSmartAssistantBox.fut-ai-dock { background: #ffffff !important; border-color: rgba(212, 175, 55, 0.4) !important; }",
      "#aiSmartAssistantBox.moaath-ai-active-glow { animation: moaathAiAmbientGlow 1.6s ease-in-out infinite !important; }",
      "#aiSmartAssistantBox #petDirectMicBtn, #aiSmartAssistantBox #fairySpecialtyNote, #aiSmartAssistantBox #futuristicChipsToggleBtn, #aiSmartAssistantBox #futVoiceSubControls, #aiSmartAssistantBox #petPersonaBar, #aiSmartAssistantBox .moaath-ai-static-title-hidden { display: none !important; }",
      "#aiSmartAssistantBox #futuristicAiHeader { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 5px !important; flex-wrap: nowrap !important; width: 100% !important; }",
      "#moaathAiCompactPersonaBtn { display: inline-flex !important; align-items: center !important; gap: 6px !important; background: rgba(255, 255, 255, 0.045) !important; border: 1px solid rgba(212, 175, 55, 0.35) !important; border-radius: 999px !important; padding: 3px 9px 3px 4px !important; cursor: pointer !important; min-width: 0 !important; flex: 1 1 auto !important; max-width: 50% !important; color: var(--text-color) !important; }",
      "#moaathAiCompactAvatarWrap { position: relative !important; width: 24px !important; height: 24px !important; flex-shrink: 0 !important; }",
      "#moaathAiCompactAvatar { width: 24px !important; height: 24px !important; border-radius: 50% !important; object-fit: cover !important; border: 1.5px solid #D4AF37 !important; display: block !important; }",
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
      "#aiSmartAssistantBox #futuristicAiBody { margin-top: 6px !important; }",
      "#moaathAiEmbeddedInputRow { position: relative !important; display: flex !important; align-items: center !important; width: 100% !important; border-radius: 999px !important; background: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(212, 175, 55, 0.38) !important; padding: 2px 4px 2px 3px !important; box-sizing: border-box !important; margin-bottom: 5px !important; }",
      "body.light-mode #moaathAiEmbeddedInputRow { background: #f8fafc !important; }",
      "#moaathAiEmbeddedInputRow #aiShoppingPromptInput { flex: 1 !important; min-width: 0 !important; border: none !important; background: transparent !important; color: var(--text-color) !important; font-size: 11px !important; padding: 5px 10px !important; margin: 0 !important; outline: none !important; box-shadow: none !important; }",
      "#moaathAiEmbeddedInputRow .moaath-ai-embedded-send { width: auto !important; min-width: 34px !important; height: 28px !important; padding: 0 10px !important; margin: 0 !important; border-radius: 999px !important; border: none !important; background: linear-gradient(135deg, #D4AF37, #10b981) !important; color: #0f141e !important; font-size: 11px !important; font-weight: 900 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 3px !important; cursor: pointer !important; flex-shrink: 0 !important; }",
      "#aiSmartAssistantBox #petQuickPromptChips { display: flex !important; flex-wrap: nowrap !important; gap: 5px !important; overflow-x: auto !important; scrollbar-width: none !important; padding: 2px 0 !important; margin: 3px 0 0 0 !important; max-height: 36px !important; opacity: 1 !important; pointer-events: auto !important; }",
      "#aiSmartAssistantBox.is-ai-collapsed #petQuickPromptChips { display: none !important; }",
      "#aiSmartAssistantBox .fut-chip-btn { flex-shrink: 0 !important; background: rgba(255, 255, 255, 0.045) !important; color: var(--text-color) !important; border: 1px solid rgba(212, 175, 55, 0.3) !important; border-radius: 999px !important; padding: 3px 9px !important; font-size: 10px !important; font-weight: 700 !important; cursor: pointer !important; }",
      "#moaathAiBudgetQuickRow { display: none; align-items: center !important; gap: 5px !important; overflow-x: auto !important; scrollbar-width: none !important; margin: 5px 0 2px 0 !important; padding: 3px 0 !important; }",
      "#moaathAiBudgetQuickRow.is-visible { display: flex !important; }",
      ".moaath-ai-budget-pill { flex-shrink: 0 !important; padding: 3px 10px !important; border-radius: 999px !important; border: 1px solid rgba(16, 185, 129, 0.45) !important; background: rgba(16, 185, 129, 0.14) !important; color: #10b981 !important; font-size: 10px !important; font-weight: 800 !important; cursor: pointer !important; }",
      "#moaathAiDynamicReplyBar { display: none; align-items: center !important; justify-content: space-between !important; gap: 6px !important; margin-top: 5px !important; padding: 4px 8px !important; border-radius: 10px !important; background: rgba(56, 189, 248, 0.08) !important; border: 1px solid rgba(56, 189, 248, 0.28) !important; font-size: 10.5px !important; color: var(--text-color) !important; }",
      "#moaathAiDynamicReplyBar.has-reply { display: flex !important; }",
      "#moaathAiDynamicReplyBar #aiShoppingStatusText { flex: 1 !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; font-size: 10.5px !important; line-height: 1.4 !important; color: var(--text-color) !important; }",
      ".moaath-reply-listen-btn { width: 24px !important; height: 24px !important; border-radius: 50% !important; border: 1px solid rgba(212, 175, 55, 0.4) !important; background: rgba(212, 175, 55, 0.14) !important; color: #D4AF37 !important; font-size: 11px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; }",
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

  function buildUnifiedSmartSearchBar() {
    if ($("moaathUnifiedSmartBar")) return;
    var assistBox = $("aiSmartAssistantBox");
    if (!assistBox || !assistBox.parentNode) return;

    var origSearch = document.querySelector("#searchInput, #productSearchInput, #storeSearchInput, input[placeholder*='ابحث عن']");
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

    // زر المسح السريع (✕)
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
      if (origSearch) {
        origSearch.value = "";
        origSearch.dispatchEvent(new Event("input", { bubbles: true }));
      }
      inp.focus();
    };

    var searchDebounce = null;
    inp.addEventListener("input", function () {
      syncClearBtn();
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () {
        if (origSearch) {
          origSearch.value = inp.value;
          origSearch.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, 120);
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
    micBtn.onclick = function () {
      if (typeof window.startVoiceShoppingInput === "function") window.startVoiceShoppingInput();
    };

    pill.appendChild(inp);
    pill.appendChild(clearBtn);
    pill.appendChild(micBtn);

    if (reqProductBtn) {
      var reqBtn = document.createElement("button");
      reqBtn.type = "button";
      reqBtn.className = "moaath-pill-action";
      reqBtn.textContent = "📝 طلب صنف";
      reqBtn.onclick = function () { reqProductBtn.click(); };
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
    var prods = (typeof window.products === "object" && window.products) ? window.products : {};

    // تفعيل loading="lazy" وهيكل التحميل للصور
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

    // تحديث العداد (− 1 +) والزر العائم + كشف النفاد الدقيق من المخزون الفعلي
    var buttons = document.querySelectorAll(".product-card button[onclick*='changeQty']");
    buttons.forEach(function (btn) {
      if (btn.classList.contains("moaath-step-btn") || btn.classList.contains("moaath-card-fab-add")) return;
      var onclk = btn.getAttribute("onclick") || "";
      var m = onclk.match(/changeQty\(\s*['"]([^'"]+)['"]\s*,\s*1\s*\)/);
      if (!m) return;
      var pid = m[1];
      var card = btn.closest(".product-card");
      if (!card) return;

      // فحص المخزون الفعلي أولاً
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
    if (!btn || btn.dataset.v55Bound) return;
    btn.dataset.v55Bound = "1";
    btn.onclick = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      window.toggleFuturisticAssistantPanel();
    };
  }

  // إغلاق النوافذ المنبثقة عند الضغط على Escape
  function bindEscapeKeyClose() {
    if (window.__MOAATH_ESC_BOUND__) return;
    window.__MOAATH_ESC_BOUND__ = true;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".modal-overlay").forEach(function (m) {
        if (m.style.display === "flex" || m.style.display === "block") {
          m.style.display = "none";
        }
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

  // ربط تحديث السلة المباشر بدالة changeQty و EventBus لتفادي إعادة الرسم المتكرر
  function hookCartEventsDirectly() {
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
    withSelfMutationGuard(function () {
      injectStoreFuturisticCSS();
      buildUnifiedSmartSearchBar();
      enhanceProductAndOfferCards();
      syncFloatingCartBadge();
      bindToggleButtonDirect();
      syncAssistantState();
      bindEscapeKeyClose();
      mountBackToTop();
      hookCartEventsDirectly();
    });
  }

  function start() {
    runAll();
    // مراقب خفيف ومخمّد (220ms) يتجاهل التعديلات التي يجريها السكربت نفسه
    var obs = new MutationObserver(function () {
      if (isSelfMutating) return;
      clearTimeout(obsTimer);
      obsTimer = setTimeout(runAll, 220);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("store_ui", "5.5");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

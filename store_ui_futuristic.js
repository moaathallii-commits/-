
(function () {
  if (window.__MOAATH_STORE_UI_V2__) return;
  window.__MOAATH_STORE_UI_V2__ = true;

  var COLLAPSE_KEY = "moaath_store_ai_collapsed";

  function $(id) {
    return document.getElementById(id);
  }

  function injectStyles() {
    var style = $("moaathStoreUiV2Style");
    if (!style) {
      style = document.createElement("style");
      style.id = "moaathStoreUiV2Style";
      document.head.appendChild(style);
    }

    style.textContent = [
      "html, body { max-width: 100%; overflow-x: clip; }",
      "header, .store-header, .top-bar { padding: 7px 11px !important; border-radius: 0 0 18px 18px !important; }",
      ".moaath-offers-track { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; overflow-y: hidden !important; gap: 10px !important; padding: 4px 2px 10px 2px !important; margin: 4px 0 8px 0 !important; scroll-snap-type: x mandatory !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; }",
      ".moaath-offers-track::-webkit-scrollbar { display: none !important; }",
      ".moaath-offer-card-slide { flex: 0 0 84vw !important; width: 84vw !important; min-width: 230px !important; max-width: 300px !important; scroll-snap-align: start !important; box-sizing: border-box !important; margin: 0 !important; }",
      ".categories { position: sticky !important; top: 0 !important; z-index: 45 !important; border-radius: 14px !important; }",
      "#aiSmartAssistantBox.is-ai-collapsed #futuristicAiBody { display: none !important; }",
      "#aiSmartAssistantBox:not(.is-ai-collapsed) #futuristicAiBody { display: block !important; }",
      "body.moaath-ai-expanded #petCharRoot { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }",
      "#moaathBackToTopBtn { position: fixed; bottom: 86px; left: 14px; z-index: 95; width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(212,175,55,0.6); background: rgba(15,23,42,0.9); color: #d4af37; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }",
      "#moaathBackToTopBtn.is-visible { opacity: 1; pointer-events: auto; }"
    ].join("
");
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
  function runFixes() {
    injectStyles();
    applyOffersHorizontalSlider();
    bindToggleButtonDirect();
    syncAssistantState();
    mountBackToTop();
  }

  function start() {
    runFixes();
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(runFixes, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

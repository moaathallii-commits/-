// ============================================================================
// store_ui_futuristic.js - v4.2 (الدفعة 1 + الدفعة 2: طبقة واجهة متجر معاذ)
// الدفعة 1: شريط العروض الأفقي، ضغط الهيدر، تثبيت التصنيفات، طي المساعد وإخفاء الجنية
// الدفعة 2: طي شريط حساب الزبون، توحيد بطاقات المنتجات + عداد (- 1 +)، شريط إعادة الطلب السريع
// عزل أمني تام عن الدفع وشام كاش | يعمل محلياً بـ 0 حصة API
// ============================================================================
(function () {
  if (window.__MOAATH_STORE_UI_V42__) return;
  window.__MOAATH_STORE_UI_V42__ = true;

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

      "/* 3. بطاقة حساب الزبون القابلة للطي (الدفعة 2) */",
      ".moaath-userbar-shell {",
      "  border-radius: 14px !important;",
      "  padding: 5px 9px !important;",
      "  margin: 4px 0 6px 0 !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.28) !important;",
      "  background: rgba(255, 255, 255, 0.035) !important;",
      "}",
      "body.light-mode .moaath-userbar-shell { background: #ffffff !important; }",
      ".moaath-userbar-toggle-row {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  justify-content: space-between !important;",
      "  gap: 8px !important;",
      "  cursor: pointer !important;",
      "  font-size: 11px !important;",
      "  font-weight: 800 !important;",
      "  user-select: none !important;",
      "}",
      ".moaath-userbar-summary {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  gap: 6px !important;",
      "  min-width: 0 !important;",
      "  overflow: hidden !important;",
      "  white-space: nowrap !important;",
      "  text-overflow: ellipsis !important;",
      "  color: var(--text-color) !important;",
      "}",
      ".moaath-userbar-pill {",
      "  background: rgba(212, 175, 55, 0.16) !important;",
      "  color: var(--gold-color) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.4) !important;",
      "  border-radius: 999px !important;",
      "  padding: 2px 8px !important;",
      "  font-size: 10px !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".moaath-userbar-body {",
      "  margin-top: 6px !important;",
      "  padding-top: 6px !important;",
      "  border-top: 1px dashed rgba(212, 175, 55, 0.22) !important;",
      "}",
      ".moaath-userbar-shell.is-collapsed .moaath-userbar-body {",
      "  display: none !important;",
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

      "/* 5. شريط إعادة الطلب السريع (الدفعة 2) */",
      "#moaathQuickReorderBar {",
      "  margin: 4px 0 8px 0 !important;",
      "  padding: 7px 9px !important;",
      "  border-radius: 14px !important;",
      "  border: 1px solid rgba(0, 230, 118, 0.28) !important;",
      "  background: linear-gradient(135deg, rgba(0, 230, 118, 0.07), rgba(15, 23, 42, 0.72)) !important;",
      "}",
      "body.light-mode #moaathQuickReorderBar {",
      "  background: linear-gradient(135deg, rgba(0, 230, 118, 0.08), #ffffff) !important;",
      "}",
      ".moaath-reorder-head {",
      "  display: flex !important;",
      "  justify-content: space-between !important;",
      "  align-items: center !important;",
      "  font-size: 10.5px !important;",
      "  font-weight: 800 !important;",
      "  color: #00e676 !important;",
      "  margin-bottom: 6px !important;",
      "}",
      ".moaath-reorder-track {",
      "  display: flex !important;",
      "  gap: 7px !important;",
      "  overflow-x: auto !important;",
      "  scrollbar-width: none !important;",
      "  -webkit-overflow-scrolling: touch !important;",
      "  padding-bottom: 2px !important;",
      "}",
      ".moaath-reorder-track::-webkit-scrollbar { display: none !important; }",
      ".moaath-reorder-chip {",
      "  flex: 0 0 auto !important;",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  gap: 6px !important;",
      "  background: var(--bg-color, #0f172a) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.35) !important;",
      "  border-radius: 999px !important;",
      "  padding: 3px 6px 3px 4px !important;",
      "  max-width: 195px !important;",
      "}",
      ".moaath-reorder-chip img {",
      "  width: 26px !important;",
      "  height: 26px !important;",
      "  border-radius: 50% !important;",
      "  object-fit: cover !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".moaath-reorder-name {",
      "  font-size: 10px !important;",
      "  font-weight: 700 !important;",
      "  color: var(--text-color) !important;",
      "  white-space: nowrap !important;",
      "  overflow: hidden !important;",
      "  text-overflow: ellipsis !important;",
      "  max-width: 96px !important;",
      "}",
      ".moaath-reorder-add {",
      "  width: 24px !important;",
      "  height: 24px !important;",
      "  border-radius: 50% !important;",
      "  border: none !important;",
      "  background: #00e676 !important;",
      "  color: #000 !important;",
      "  font-size: 14px !important;",
      "  font-weight: 900 !important;",
      "  cursor: pointer !important;",
      "  display: inline-flex !important;",
      "  align-items: center !important;",
      "  justify-content: center !important;",
      "  flex-shrink: 0 !important;",
      "}",

      "/* 6. توحيد ارتفاع بطاقات المنتجات + عداد الكمية المباشر (- 1 +) (الدفعة 2) */",
      ".product-card {",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "  justify-content: space-between !important;",
      "  height: 100% !important;",
      "  box-sizing: border-box !important;",
      "}",
      ".moaath-inline-stepper {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  justify-content: space-between !important;",
      "  gap: 6px !important;",
      "  width: 100% !important;",
      "  background: rgba(0, 230, 118, 0.12) !important;",
      "  border: 1.5px solid #00e676 !important;",
      "  border-radius: 12px !important;",
      "  padding: 3px 5px !important;",
      "  box-sizing: border-box !important;",
      "  margin-top: 4px !important;",
      "}",
      ".moaath-step-btn {",
      "  width: 30px !important;",
      "  height: 28px !important;",
      "  border-radius: 9px !important;",
      "  border: none !important;",
      "  font-size: 16px !important;",
      "  font-weight: 900 !important;",
      "  cursor: pointer !important;",
      "  display: inline-flex !important;",
      "  align-items: center !important;",
      "  justify-content: center !important;",
      "}",
      ".moaath-step-minus { background: rgba(239, 68, 68, 0.22) !important; color: #f87171 !important; }",
      ".moaath-step-plus { background: #00e676 !important; color: #000 !important; }",
      ".moaath-step-qty { font-size: 13px !important; font-weight: 900 !important; color: #00e676 !important; min-width: 24px !important; text-align: center !important; }",

      "/* 7. تثبيت شريط التصنيفات العلوي أثناء التمرير */",
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

      "/* 8. فتح وطي المساعد الذكي وإخفاء الجنية العائمة عند الفتح */",
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

      "/* 9. شريط إتمام الطلب السفلي الزجاجي وزر العودة للأعلى */",
      ".cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar {",
      "  border-radius: 18px !important;",
      "  backdrop-filter: blur(14px) !important;",
      "  -webkit-backdrop-filter: blur(14px) !important;",
      "  border: 1px solid rgba(212, 175, 55, 0.35) !important;",
      "}",
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

  // ---------- 1. بطاقة حساب الزبون القابلة للطي ----------
  function readUserBarCollapsed() {
    try {
      var v = localStorage.getItem(USERBAR_COLLAPSE_KEY);
      if (v === null) return true; // مطوية افتراضياً لتوفير المساحة
      return v === "1" || v === "true";
    } catch (_) {
      return true;
    }
  }

  function enhanceCollapsibleUserBar() {
    var bar = document.querySelector(".user-bar, .user-info-bar, #userInfoBar, [class*='user-bar']");
    if (!bar || bar.closest(".modal-overlay")) return;

    var userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "حسابي";
    var ptsMatch = (bar.textContent || "").match(/نقاطي\s*:\s*[\d,]+/);
    var balMatch = (bar.textContent || "").match(/رصيدي\s*:\s*[\d,]+\s*ل\.س/);
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
      toggleRow.innerHTML =
        '<div id="moaathUserBarSummaryTxt" class="moaath-userbar-summary"></div>' +
        '<span id="moaathUserBarTogglePill" class="moaath-userbar-pill">تفاصيل الحساب ▾</span>';

      toggleRow.onclick = function () {
        var nextCollapsed = !bar.classList.contains("is-collapsed");
        bar.classList.toggle("is-collapsed", nextCollapsed);
        try { localStorage.setItem(USERBAR_COLLAPSE_KEY, nextCollapsed ? "1" : "0"); } catch (_) {}
        var pill = $("moaathUserBarTogglePill");
        if (pill) pill.textContent = nextCollapsed ? "تفاصيل الحساب ▾" : "إخفاء ▴";
      };

      bar.appendChild(toggleRow);
      bar.appendChild(bodyWrap);

      var initCollapsed = readUserBarCollapsed();
      bar.classList.toggle("is-collapsed", initCollapsed);
      var initPill = $("moaathUserBarTogglePill");
      if (initPill) initPill.textContent = initCollapsed ? "تفاصيل الحساب ▾" : "إخفاء ▴";
    }

    var sumEl = $("moaathUserBarSummaryTxt");
    if (sumEl) sumEl.textContent = summaryBits.join(" • ");
  }

  // ---------- 2. شريط العروض الأفقي ----------
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

  function applyOffersHorizontalSlider() {
    var cards = findOfferCards();
    if (cards.length < 2) return;

    var existingTrack = $("moaathOffersSliderTrack");
    if (existingTrack && cards.every(function (c) { return c.parentElement === existingTrack; })) {
      cards.forEach(function (c) { c.classList.add("moaath-offer-card-slide"); });
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
      if (ch.tagName === "SCRIPT" || ch.tagName === "STYLE") return false;
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
  }

  // ---------- 3. عداد الكمية المباشر (- 1 +) على بطاقات المنتجات ----------
  function syncInlineProductSteppers() {
    var cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    var buttons = document.querySelectorAll(".product-card button[onclick*='changeQty']");

    buttons.forEach(function (btn) {
      if (btn.classList.contains("moaath-step-btn")) return;
      var onclk = btn.getAttribute("onclick") || "";
      var m = onclk.match(/changeQty\(\s*['"]([^'"]+)['"]\s*,\s*1\s*\)/);
      if (!m) return;

      var pid = m[1];
      var qty = (cartObj[pid] && parseInt(cartObj[pid].qty, 10)) ? parseInt(cartObj[pid].qty, 10) : 0;
      var nextEl = btn.nextElementSibling;
      var hasStepper = nextEl && nextEl.classList && nextEl.classList.contains("moaath-inline-stepper");

      if (qty > 0) {
        btn.style.display = "none";
        if (!hasStepper) {
          var stepper = document.createElement("div");
          stepper.className = "moaath-inline-stepper";
          stepper.dataset.pid = pid;
          stepper.innerHTML =
            '<button type="button" class="moaath-step-btn moaath-step-minus" aria-label="إنقاص">−</button>' +
            '<span class="moaath-step-qty">' + qty + "</span>" +
            '<button type="button" class="moaath-step-btn moaath-step-plus" aria-label="زيادة">+</button>';

          stepper.querySelector(".moaath-step-minus").onclick = function (e) {
            if (e) e.stopPropagation();
            if (typeof window.changeQty === "function") window.changeQty(pid, -1);
            setTimeout(syncInlineProductSteppers, 40);
          };
          stepper.querySelector(".moaath-step-plus").onclick = function (e) {
            if (e) e.stopPropagation();
            if (typeof window.changeQty === "function") window.changeQty(pid, 1);
            setTimeout(syncInlineProductSteppers, 40);
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

  // ---------- 4. شريط إعادة الطلب السريع ----------
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

    bar.innerHTML =
      '<div class="moaath-reorder-head"><span>⚡ إعادة الطلب السريع (مشترياتك المعتادة)</span><span>بنقرة واحدة</span></div>' +
      '<div class="moaath-reorder-track">' +
      picks.map(function (pid) {
        var p = prods[pid];
        var img = p.thumb || p.image || p.img || "store-icon.png";
        var safeName = String(p.name || "").replace(/</g, "&lt;");
        return (
          '<div class="moaath-reorder-chip">' +
          '<img src="' + img + '" onerror="this.onerror=null;this.src=\'store-icon.png\';" alt="' + safeName + '">' +
          '<span class="moaath-reorder-name" title="' + safeName + '">' + safeName + "</span>" +
          '<button type="button" class="moaath-reorder-add" onclick="if(typeof changeQty===\'function\'){changeQty(\'' + pid + '\',1);}">+</button>' +
          "</div>"
        );
      }).join("") +
      "</div>";
  }

  // ---------- 5. المساعد الذكي وزر العودة للأعلى ----------
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
    btn.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 360);
    }, { passive: true });
  }

  var timer = null;
  function runAll() {
    injectStoreFuturisticCSS();
    enhanceCollapsibleUserBar();
    applyOffersHorizontalSlider();
    renderQuickReorderBar();
    syncInlineProductSteppers();
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

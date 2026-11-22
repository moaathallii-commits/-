// ============================================================================
// شريط التنقل السفلي المزدوج + إعادة آخر طلب بلمسة واحدة (moaath_express_nav.js — v1.0)
// - فصل ذكي بين: (🛒 المتجر السريع 30 ثانية) و (✨ عالمي VIP التفاعلي)
// - حفظ تلقائي لآخر طلب مؤكّد وإعادة تعبئته للسلة بلمسة واحدة (1-Tap Reorder)
// - رفع شريط السلة العائم تلقائياً فوق شريط التبويب السفلي بدون أي تداخل
// - يختفي تلقائياً عند فتح لوحة الإدارة (#adminModal) أو نافذة السلة (#cartModal)
// - يعمل محلياً بالكامل (0 حصة API) مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_EXPRESS_NAV_V1__) return;
  window.__MOAATH_EXPRESS_NAV_V1__ = true;

  const LAST_ORDER_KEY = "moaath_last_order_snapshot_v1";
  let activeBottomTab = "store"; // store | vip

  const escHtml = (s) =>
    typeof window.moaathEscapeHtml === "function"
      ? window.moaathEscapeHtml(s)
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

  function readJSON(key, fallback) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.getJSON(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.setJSON(key, val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getStock(pObj) {
    if (!pObj) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(pObj, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(pObj.stock, 10) || 0);
  }

  // ==========================================================================
  // 1) حفظ واستعادة «آخر طلب» بلمسة واحدة (1-Tap Reorder)
  // ==========================================================================
  function snapshotCurrentCartAsLastOrder() {
    const cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    const items = [];
    let totalPieces = 0;

    Object.keys(cartObj).forEach((k) => {
      const qty = parseInt(cartObj[k]?.qty, 10) || 0;
      if (qty > 0) {
        items.push({ id: k, name: cartObj[k]?.name || k, qty });
        totalPieces += qty;
      }
    });

    if (!items.length) return;
    writeJSON(LAST_ORDER_KEY, {
      items,
      totalPieces,
      savedAt: new Date().toLocaleDateString("ar-SY")
    });
    renderReorderBanner();
  }

  function hookOrderSubmitForSnapshot() {
    // التقاط الضغط على زر إتمام الطلب لحفظ نسخة من السلة كآخر طلب
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("#submitOrderUnifiedBtn") : null;
      if (btn) snapshotCurrentCartAsLastOrder();
    }, true);

    if (typeof window.submitOrderUnified === "function" && !window.submitOrderUnified.__moaathLastOrderHooked) {
      const orig = window.submitOrderUnified;
      const wrapped = function () {
        snapshotCurrentCartAsLastOrder();
        return orig.apply(this, arguments);
      };
      wrapped.__moaathLastOrderHooked = true;
      window.submitOrderUnified = wrapped;
    }
  }

  function runOneTapReorder() {
    const snap = readJSON(LAST_ORDER_KEY, null);
    if (!snap || !Array.isArray(snap.items) || !snap.items.length) {
      if (typeof window.showToast === "function") {
        window.showToast("📋 سيتم تفعيل «إعادة آخر طلب» تلقائياً بعد إتمام أول طلب لك.");
      }
      return;
    }

    const prods = window.products || {};
    let addedCount = 0;
    let skippedCount = 0;

    snap.items.forEach((it) => {
      const baseId = String(it.id || "").replace(/_PKG$/, "");
      const isOffer = String(it.id || "").startsWith("OFFER_");
      const available = isOffer ? !!(window.specialOffers && window.specialOffers[it.id]) : (prods[baseId] && getStock(prods[baseId]) > 0);
      if (available && typeof window.changeQty === "function") {
        window.changeQty(it.id, it.qty || 1);
        addedCount += (it.qty || 1);
      } else {
        skippedCount++;
      }
    });

    vibrate([15, 25, 15]);
    if (typeof window.showToast === "function") {
      const msg = skippedCount > 0
        ? `🔄 تمت إضافة ${addedCount} قطع من آخر طلبك (تم تخطي ${skippedCount} صنف غير متوفر حالياً).`
        : `⚡ تمت إعادة آخر طلبك (${addedCount} قطع) إلى السلة في ثانية!`;
      window.showToast(msg);
    }
  }

  function renderReorderBanner() {
    const snap = readJSON(LAST_ORDER_KEY, null);
    const hasSnap = !!(snap && Array.isArray(snap.items) && snap.items.length > 0);
    const searchBar = document.getElementById("moaathUnifiedSmartBar") || document.getElementById("aiSmartAssistantBox");
    if (!searchBar || !searchBar.parentNode) return;

    let bar = document.getElementById("moaathOneTapReorderBar");
    if (!hasSnap) {
      if (bar) bar.style.display = "none";
      return;
    }

    if (!bar) {
      bar = document.createElement("div");
      bar.id = "moaathOneTapReorderBar";
      searchBar.parentNode.insertBefore(bar, searchBar.nextSibling);
    }

    bar.style.display = "flex";
    const previewNames = snap.items.slice(0, 2).map((x) => x.name).join("، ") + (snap.items.length > 2 ? "..." : "");
    bar.innerHTML = `
      <div style="min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        <b style="color:#10b981;">⚡ طلبك المعتاد:</b>
        <span style="color:var(--gray-text);">${escHtml(previewNames)} (${snap.totalPieces} قطع)</span>
      </div>
      <button type="button" onclick="window.MoaathExpressNav.reorderLast()" style="flex-shrink:0; background:linear-gradient(135deg,#10b981,#D4AF37); color:#000; border:none; border-radius:999px; padding:4px 10px; font-size:10px; font-weight:900; cursor:pointer;">🔄 إعادة الطلب</button>
    `;
  }

  // ==========================================================================
  // 2) بوابة «✨ عالمي VIP» المستقبلية (تجمع الغرف الـ 9 وأدوات الإبهار)
  // ==========================================================================
  function renderVipWorldOverlay() {
    let overlay = document.getElementById("moaathVipWorldOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "moaathVipWorldOverlay";
      document.body.appendChild(overlay);
    }

    const period = window.MoaathVIPDailyEngine?.getPeriodInfo
      ? window.MoaathVIPDailyEngine.getPeriodInfo().label
      : "✨ عالمك الشخصي المتجدد";

    overlay.innerHTML = `
      <div class="moaath-vip-hub-shell">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid rgba(212,175,55,0.28);">
          <div>
            <div style="font-size:15px; font-weight:900; color:#D4AF37;">✨ عالمي VIP</div>
            <div style="font-size:10px; color:var(--gray-text);">${escHtml(period)} • جميع الشخصيات والأدوات في مكان واحد</div>
          </div>
          <button type="button" onclick="window.MoaathExpressNav.switchTab('store')" class="btn" style="width:auto; padding:5px 10px; font-size:10.5px; background:rgba(212,175,55,0.16); color:#D4AF37; border:1px solid rgba(212,175,55,0.4);">🛒 العودة للمتجر</button>
        </div>

        <div class="moaath-vip-hub-grid">
          <button type="button" class="moaath-vip-hub-card" style="border-color:#10b981;" onclick="window.MoaathSaadRoom && window.MoaathSaadRoom.openModal()">
            <span class="hub-ico">🕌</span>
            <b>غرفة سعد</b>
            <small>الصلاة، الأذكار، المسبحة والمواعظ</small>
          </button>

          <button type="button" class="moaath-vip-hub-card" style="border-color:#D4AF37;" onclick="window.openMoaathVIPDailyOverview && window.openMoaathVIPDailyOverview()">
            <span class="hub-ico">✨</span>
            <b>تحديثات VIP الآن</b>
            <small>ملخص الغرف الـ 8 بالصور</small>
          </button>

          <button type="button" class="moaath-vip-hub-card" style="border-color:#f59e0b;" onclick="(window.openVIPShowcaseModal ? window.openVIPShowcaseModal('all') : (window.openFairyGalleryModal && window.openFairyGalleryModal()))">
            <span class="hub-ico">👑</span>
            <b>الشخصيات والغرف</b>
            <small>اختر شخصيتك أو ادخل غرفتها</small>
          </button>

          <button type="button" class="moaath-vip-hub-card" style="border-color:#ec4899;" onclick="window.openMoaathSurpriseModal && window.openMoaathSurpriseModal()">
            <span class="hub-ico">🎁</span>
            <b>فاجئني بميزانيتي</b>
            <small>تشكيلة متجددة ضمن مبلغك</small>
          </button>

          <button type="button" class="moaath-vip-hub-card" style="border-color:#38bdf8;" onclick="window.openMoaathLearningHubModal && window.openMoaathLearningHubModal()">
            <span class="hub-ico">🧠</span>
            <b>ماذا تعلّمتُ عنك؟</b>
            <small>دقة التوقعات والذاكرة المشتركة</small>
          </button>

          <button type="button" class="moaath-vip-hub-card" style="border-color:#22c55e;" onclick="window.MoaathExpressNav.switchTab('store'); window.toggleFreeVoiceChatMode && window.toggleFreeVoiceChatMode();">
            <span class="hub-ico">🎙️</span>
            <b>دردشة صوتية حرة</b>
            <small>تحدث مع مساعدك مباشرة</small>
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 3) شريط التنقل السفلي المزدوج (🛒 المتجر | ✨ عالمي VIP)
  // ==========================================================================
  function injectCSS() {
    if (document.getElementById("moaathExpressNavCSS")) return;
    const st = document.createElement("style");
    st.id = "moaathExpressNavCSS";
    st.textContent = `
      body { padding-bottom: 132px !important; }
      .cart-bar, .bottom-cart-bar, .fixed-cart-bar, #bottomCartBar {
        bottom: 62px !important;
      }
      #moaathBackToTopBtn {
        bottom: 128px !important;
      }
      #moaathOneTapReorderBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 4px 0 6px 0;
        padding: 5px 9px;
        border-radius: 12px;
        background: rgba(16, 185, 129, 0.09);
        border: 1px solid rgba(16, 185, 129, 0.35);
        font-size: 10.5px;
      }
      #moaathDualBottomNav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9990;
        display: flex;
        align-items: center;
        justify-content: space-around;
        gap: 8px;
        padding: 6px 10px calc(6px + env(safe-area-inset-bottom, 0px)) 10px;
        background: rgba(11, 16, 25, 0.96);
        border-top: 1px solid rgba(212, 175, 55, 0.38);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        direction: rtl;
      }
      body.light-mode #moaathDualBottomNav {
        background: rgba(255, 255, 255, 0.96);
      }
      .moaath-bottom-tab-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 14px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--gray-text, #94a3b8);
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .moaath-bottom-tab-btn.is-active {
        background: linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(16, 185, 129, 0.16));
        border-color: rgba(212, 175, 55, 0.55);
        color: #D4AF37;
        box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);
      }
      #moaathVipWorldOverlay {
        display: none;
        position: fixed;
        inset: 0 0 56px 0;
        z-index: 9985;
        background: rgba(11, 16, 25, 0.96);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        overflow-y: auto;
        padding: 14px 12px 24px 12px;
        direction: rtl;
      }
      body.light-mode #moaathVipWorldOverlay {
        background: rgba(248, 250, 252, 0.98);
      }
      .moaath-vip-hub-shell {
        max-width: 480px;
        margin: 0 auto;
      }
      .moaath-vip-hub-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }
      .moaath-vip-hub-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: right;
        gap: 3px;
        padding: 12px 10px;
        border-radius: 16px;
        border: 1px solid rgba(212, 175, 55, 0.35);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-color);
        cursor: pointer;
      }
      body.light-mode .moaath-vip-hub-card {
        background: #ffffff;
      }
      .moaath-vip-hub-card .hub-ico {
        font-size: 22px;
        margin-bottom: 2px;
      }
      .moaath-vip-hub-card b {
        font-size: 12px;
        color: var(--text-color);
      }
      .moaath-vip-hub-card small {
        font-size: 9.5px;
        color: var(--gray-text, #94a3b8);
        line-height: 1.4;
      }
    `;
    document.head.appendChild(st);
  }

  function mountDualBottomNav() {
    if (document.getElementById("moaathDualBottomNav")) return;
    const nav = document.createElement("nav");
    nav.id = "moaathDualBottomNav";
    nav.innerHTML = `
      <button type="button" id="moaathTabStoreBtn" class="moaath-bottom-tab-btn is-active" onclick="window.MoaathExpressNav.switchTab('store')">
        <span>🛒</span><span>المتجر</span>
      </button>
      <button type="button" id="moaathTabVipBtn" class="moaath-bottom-tab-btn" onclick="window.MoaathExpressNav.switchTab('vip')">
        <span>✨</span><span>عالمي VIP</span>
      </button>
    `;
    document.body.appendChild(nav);
  }

  function switchTab(tab) {
    activeBottomTab = tab === "vip" ? "vip" : "store";
    const storeBtn = document.getElementById("moaathTabStoreBtn");
    const vipBtn = document.getElementById("moaathTabVipBtn");
    if (storeBtn) storeBtn.classList.toggle("is-active", activeBottomTab === "store");
    if (vipBtn) vipBtn.classList.toggle("is-active", activeBottomTab === "vip");

    renderVipWorldOverlay();
    const overlay = document.getElementById("moaathVipWorldOverlay");
    if (overlay) overlay.style.display = activeBottomTab === "vip" ? "block" : "none";
    vibrate(10);
  }

  function syncNavVisibilityWithModals() {
    const nav = document.getElementById("moaathDualBottomNav");
    if (!nav) return;
    const adminM = document.getElementById("adminModal");
    const cartM = document.getElementById("cartModal");
    const hideNav =
      (adminM && window.getComputedStyle(adminM).display !== "none") ||
      (cartM && window.getComputedStyle(cartM).display !== "none");
    nav.style.display = hideNav ? "none" : "flex";
  }

  window.MoaathExpressNav = {
    version: "1.0",
    switchTab,
    reorderLast: runOneTapReorder,
    snapshotCart: snapshotCurrentCartAsLastOrder
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("express_nav", "1.0");
  }

  function init() {
    injectCSS();
    mountDualBottomNav();
    renderVipWorldOverlay();
    renderReorderBanner();
    hookOrderSubmitForSnapshot();
    syncNavVisibilityWithModals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 1000);
  setInterval(syncNavVisibilityWithModals, 500);
})();

// ============================================================================
// حزمة إبهار الزبون المستقبلية لمتجر معاذ (moaath_delight_pack.js — v1.0)
// 1) الموجة الصوتية والهالة التفاعلية (Live Voice Aura) حول صورة الشخصية أثناء الاستماع/التحدث
// 2) زر «🎁 فاجئني ضمن ميزانيتي» (Smart Surprise Basket) لتشكيل سلة غير مكررة من المتوفر
// 3) رادار التوفير الذكي قبل إتمام الطلب (تبديل مفرد إلى طرد _PKG أو عرض خاص OFFER_ أوفر)
// 4) حفظ «قوائمي السريعة» بالأمر الصوتي أو الكتابي («احفظ السلة باسم ...» / «اطلب قائمة ...»)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_DELIGHT_PACK_V1__) return;
  window.__MOAATH_DELIGHT_PACK_V1__ = true;

  const SAVED_LISTS_KEY = "moaath_customer_quick_lists_v1";
  const SURPRISE_HIST_KEY = "moaath_surprise_recent_ids_v1";

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

  function normAr(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
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

  function getUnitPrice(pid) {
    const prods = window.products || {};
    const offers = window.specialOffers || {};
    const isW = window.currentUser?.userType === "wholesale";
    if (typeof window.calcSYP !== "function") return 0;
    if (String(pid).startsWith("OFFER_")) {
      const o = offers[pid];
      return o ? window.calcSYP((isW && o.wholesaleUSD > 0) ? o.wholesaleUSD : (o.newPriceUSD || 0)) : 0;
    }
    if (String(pid).endsWith("_PKG")) {
      const p = prods[String(pid).replace(/_PKG$/, "")];
      return p ? window.calcSYP(p.pkgPriceUSD || 0) : 0;
    }
    const p = prods[pid];
    return p ? window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0)) : 0;
  }

  // ==========================================================================
  // 1) الموجة الصوتية والهالة التفاعلية (Live Voice Aura)
  // ==========================================================================
  function injectDelightCSS() {
    if (document.getElementById("moaathDelightPackCSS")) return;
    const st = document.createElement("style");
    st.id = "moaathDelightPackCSS";
    st.textContent = `
      @keyframes moaathVoiceAuraPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7), 0 0 12px rgba(56, 189, 248, 0.5); }
        50% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0), 0 0 18px rgba(212, 175, 55, 0.75); }
      }
      @keyframes moaathWaveBar {
        0%, 100% { height: 4px; }
        50% { height: 13px; }
      }
      .moaath-voice-aura-active {
        animation: moaathVoiceAuraPulse 1.15s infinite ease-in-out !important;
        border-color: #10b981 !important;
      }
      #moaathVoiceWaveBars {
        display: none;
        align-items: center;
        gap: 2px;
        height: 14px;
        margin-right: 4px;
      }
      #moaathVoiceWaveBars.is-live {
        display: inline-flex !important;
      }
      #moaathVoiceWaveBars span {
        width: 2.5px;
        height: 6px;
        border-radius: 999px;
        background: linear-gradient(180deg, #38bdf8, #10b981);
        animation: moaathWaveBar 0.75s infinite ease-in-out;
      }
      #moaathVoiceWaveBars span:nth-child(2) { animation-delay: 0.15s; }
      #moaathVoiceWaveBars span:nth-child(3) { animation-delay: 0.3s; }
      #moaathVoiceWaveBars span:nth-child(4) { animation-delay: 0.45s; }
    `;
    document.head.appendChild(st);
  }

  function syncVoiceAura() {
    const personaBtn = document.getElementById("moaathRestorePersonaBtn") || document.getElementById("moaathAiCompactPersonaBtn");
    if (!personaBtn) return;

    let waveEl = document.getElementById("moaathVoiceWaveBars");
    if (!waveEl) {
      waveEl = document.createElement("span");
      waveEl.id = "moaathVoiceWaveBars";
      waveEl.innerHTML = "<span></span><span></span><span></span><span></span>";
      personaBtn.appendChild(waveEl);
    }

    const badgeTxt = String(document.getElementById("petConnStatusBadge")?.textContent || "");
    const freeBtnTxt = String(document.getElementById("moaathFreeVoiceChatBtn")?.textContent || "");
    const speakingNow = typeof window.speechSynthesis !== "undefined" && window.speechSynthesis.speaking;
    const listeningNow = /يستمع|يجهّز|يتحدث/.test(badgeTxt) || /إيقاف الدردشة/.test(freeBtnTxt) || speakingNow;

    personaBtn.classList.toggle("moaath-voice-aura-active", listeningNow);
    waveEl.classList.toggle("is-live", listeningNow);
  }

  // ==========================================================================
  // 2) زر «🎁 فاجئني ضمن ميزانيتي» (Smart Surprise Basket — غير مكرر)
  // ==========================================================================
  function buildSurpriseBasket(budgetSYP) {
    const prods = window.products || {};
    const recentIds = readJSON(SURPRISE_HIST_KEY, []);

    const pool = Object.keys(prods)
      .filter((pid) => {
        const p = prods[pid];
        if (!p || getStock(p) <= 0) return false;
        const price = getUnitPrice(pid);
        return price > 0 && price <= budgetSYP;
      })
      .map((pid) => ({
        id: pid,
        name: prods[pid].name,
        cat: prods[pid].category || "عام",
        price: getUnitPrice(pid),
        isRecent: recentIds.includes(pid)
      }));

    if (!pool.length) {
      if (typeof window.showToast === "function") {
        window.showToast("⚠️ لا توجد أصناف متوفرة ضمن هذه الميزانية حالياً.");
      }
      return;
    }

    // نفضّل الأصناف غير المكررة مؤخراً ونخلطها لتجربة متجددة في كل مرة
    const fresh = pool.filter((x) => !x.isRecent).sort(() => Math.random() - 0.5);
    const old = pool.filter((x) => x.isRecent).sort(() => Math.random() - 0.5);
    const ordered = [...fresh, ...old];

    const picked = [];
    const usedCats = new Set();
    let sum = 0;

    for (const item of ordered) {
      if (picked.length >= 6) break;
      if (sum + item.price <= budgetSYP) {
        // تنويع الأقسام قدر الإمكان
        if (usedCats.has(item.cat) && ordered.length > 8 && picked.length < 3) continue;
        picked.push(item);
        usedCats.add(item.cat);
        sum += item.price;
      }
    }

    if (!picked.length) return;

    picked.forEach((it) => {
      if (typeof window.changeQty === "function") window.changeQty(it.id, 1);
    });

    const nextRecent = [...picked.map((x) => x.id), ...recentIds].slice(0, 18);
    writeJSON(SURPRISE_HIST_KEY, nextRecent);
    vibrate([15, 30, 15]);

    const msg = `🎁 مفاجأة جاهزة! أضفت ${picked.length} أصناف متنوعة للسلة بمجموع ${sum.toLocaleString()} ل.س من أصل ${budgetSYP.toLocaleString()} ل.س.`;
    if (typeof window.showToast === "function") window.showToast(msg);
    const st = document.getElementById("aiShoppingStatusText");
    if (st) st.textContent = msg;
    window.closeMoaathSurpriseModal();
  }

  window.closeMoaathSurpriseModal = function () {
    const m = document.getElementById("moaathSurpriseModal");
    if (m) m.style.display = "none";
  };

  window.openMoaathSurpriseModal = function () {
    let modal = document.getElementById("moaathSurpriseModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathSurpriseModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10080; background:rgba(0,0,0,0.84); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.closeMoaathSurpriseModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:400px; width:94%; border:1.5px solid #D4AF37; border-radius:18px; padding:14px; text-align:right; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
          <b style="color:#D4AF37; font-size:13.5px;">🎁 فاجئني ضمن ميزانيتي</b>
          <button type="button" onclick="window.closeMoaathSurpriseModal()" class="btn btn-danger" style="width:auto; padding:3px 9px; font-size:11px;">✕</button>
        </div>
        <div style="color:var(--gray-text); margin-bottom:9px;">اختر المبلغ وسأركّب لك تشكيلة جديدة غير مكررة من المتوفر في الفرع الآن:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:10px;">
          ${[300, 500, 1000, 2000].map((amt) => `
            <button type="button" onclick="window.MoaathDelightPack.runSurprise(${amt})" class="btn" style="padding:8px; font-size:11px; background:rgba(212,175,55,0.16); color:#D4AF37; border:1px solid rgba(212,175,55,0.45);">🎲 ${amt.toLocaleString()} ل.س</button>
          `).join("")}
        </div>
        <div style="display:flex; gap:6px;">
          <input id="moaathCustomSurpriseBudget" type="number" min="100" step="100" placeholder="أو اكتب مبلغاً مخصصاً..." class="form-control" style="flex:1; padding:6px 9px; font-size:11px;">
          <button type="button" onclick="window.MoaathDelightPack.runSurprise(parseInt(document.getElementById('moaathCustomSurpriseBudget')?.value||'0',10))" class="btn" style="width:auto; padding:6px 12px; font-size:11px; background:linear-gradient(45deg,#D4AF37,#10b981); color:#000;">انطلق ✨</button>
        </div>
      </div>
    `;
  };

  // ==========================================================================
  // 3) رادار التوفير الذكي قبل إتمام الطلب (Checkout Savings Radar)
  // ==========================================================================
  function findCartSavingsOpportunities() {
    const cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    const prods = window.products || {};
    const opportunities = [];

    Object.keys(cartObj).forEach((k) => {
      if (String(k).endsWith("_PKG") || String(k).startsWith("OFFER_")) return;
      const qty = parseInt(cartObj[k]?.qty, 10) || 0;
      const p = prods[k];
      if (!p || qty <= 0) return;

      const pkgQty = parseInt(p.pkgQty, 10) || 0;
      const pkgPrice = typeof window.calcSYP === "function" ? window.calcSYP(p.pkgPriceUSD || 0) : 0;
      const unitPrice = getUnitPrice(k);

      // إذا كان الزبون يطلب كمية قريبة من الطرد وكان الطرد أوفر
      if (pkgQty > 1 && pkgPrice > 0 && unitPrice > 0 && qty >= pkgQty) {
        const pkgsCount = Math.floor(qty / pkgQty);
        const normalCost = unitPrice * (pkgsCount * pkgQty);
        const pkgCost = pkgPrice * pkgsCount;
        const saving = normalCost - pkgCost;
        if (saving > 0) {
          opportunities.push({
            fromId: k,
            toId: k + "_PKG",
            name: p.name,
            removeQty: pkgsCount * pkgQty,
            addPkgQty: pkgsCount,
            saving
          });
        }
      }
    });

    return opportunities;
  }

  function renderCheckoutSavingsRadar() {
    const modalContent = document.querySelector("#cartModal .modal-content");
    if (!modalContent) return;

    let box = document.getElementById("moaathCheckoutSavingsRadar");
    const opps = findCartSavingsOpportunities();

    if (!opps.length) {
      if (box) box.style.display = "none";
      return;
    }

    if (!box) {
      box = document.createElement("div");
      box.id = "moaathCheckoutSavingsRadar";
      box.style.cssText =
        "margin:8px 0; padding:8px 10px; border-radius:10px; background:rgba(16,185,129,0.1); " +
        "border:1px solid #10b981; font-size:10.5px; text-align:right;";
      const summary = document.getElementById("cleanCheckoutSummaryCard");
      if (summary && summary.parentNode) summary.parentNode.insertBefore(box, summary);
      else modalContent.insertBefore(box, modalContent.firstChild);
    }

    box.style.display = "block";
    box.innerHTML = `
      <div style="font-weight:900; color:#10b981; margin-bottom:5px;">📡 رادار التوفير الذكي — يمكنك التوفير الآن:</div>
      ${opps.map((o) => `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; padding:4px 0; border-top:1px dashed rgba(16,185,129,0.28);">
          <span>بدّل ${o.removeQty} من <b>${escHtml(o.name)}</b> إلى ${o.addPkgQty} طرد ووفّر <b style="color:#D4AF37;">${o.saving.toLocaleString()} ل.س</b></span>
          <button type="button" onclick="window.MoaathDelightPack.applyPkgSaving('${o.fromId}','${o.toId}',${o.removeQty},${o.addPkgQty})" class="btn" style="width:auto; padding:3px 8px; font-size:9.5px; background:#10b981; color:#000;">بدّل ووفّر</button>
        </div>
      `).join("")}
    `;
  }

  // ==========================================================================
  // 4) حفظ «قوائمي السريعة» بالأمر الصوتي/الكتابي
  // ==========================================================================
  function saveCurrentCartAsQuickList(rawName) {
    const listName = String(rawName || "").trim().slice(0, 40);
    if (!listName) return false;
    const cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    const items = Object.keys(cartObj)
      .filter((k) => (parseInt(cartObj[k]?.qty, 10) || 0) > 0)
      .map((k) => ({ id: k, name: cartObj[k]?.name || k, qty: parseInt(cartObj[k].qty, 10) || 1 }));

    if (!items.length) {
      if (typeof window.showToast === "function") window.showToast("⚠️ سلتك فارغة حالياً، أضف منتجات أولاً لحفظ القائمة.");
      return true;
    }

    const lists = readJSON(SAVED_LISTS_KEY, {});
    lists[normAr(listName)] = { title: listName, items, savedAt: new Date().toLocaleDateString("ar-SY") };
    writeJSON(SAVED_LISTS_KEY, lists);
    vibrate([15, 25, 15]);
    const msg = `💾 تم حفظ سلتك (${items.length} أصناف) باسم «${listName}»! يمكنك طلبها لاحقاً بقول: اطلب ${listName}.`;
    if (typeof window.showToast === "function") window.showToast(msg);
    const st = document.getElementById("aiShoppingStatusText");
    if (st) st.textContent = msg;
    return true;
  }

  function loadQuickListIntoCart(rawName) {
    const key = normAr(rawName);
    const lists = readJSON(SAVED_LISTS_KEY, {});
    const matchKey = Object.keys(lists).find((k) => k === key || k.includes(key) || key.includes(k));
    if (!matchKey) return false;

    const list = lists[matchKey];
    let added = 0;
    (list.items || []).forEach((it) => {
      if (typeof window.changeQty === "function") {
        window.changeQty(it.id, it.qty || 1);
        added++;
      }
    });
    vibrate([15, 30, 15]);
    const msg = `📋 تمت إضافة قائمة «${list.title}» (${added} أصناف) إلى سلتك فوراً!`;
    if (typeof window.showToast === "function") window.showToast(msg);
    const st = document.getElementById("aiShoppingStatusText");
    if (st) st.textContent = msg;
    return true;
  }

  function hookAssistantForQuickLists() {
    const orig = window.runAIShoppingAssistant;
    if (typeof orig !== "function" || orig.__moaathDelightHooked) return;
    const wrapped = async function (overridePrompt = null) {
      const txt = String(overridePrompt ?? (document.getElementById("aiShoppingPromptInput")?.value || "")).trim();
      if (txt) {
        const norm = normAr(txt);
        // حفظ السلة باسم مخصص
        const saveMatch = norm.match(/(?:احفظ|سجل|خزن)\s*(?:هذه\s*)?(?:السله|سلتي|الطلب|القائمه)\s*(?:باسم|اسمها)?\s*(.+)/);
        if (saveMatch && saveMatch[1]) {
          saveCurrentCartAsQuickList(saveMatch[1]);
          const inp = document.getElementById("aiShoppingPromptInput");
          if (inp) inp.value = "";
          return;
        }
        // استدعاء قائمة محفوظة
        const loadMatch = norm.match(/(?:اطلب|جهز|افتح|هات)\s*(?:قائمه|سله)?\s*(.+)/);
        if (loadMatch && loadMatch[1] && loadQuickListIntoCart(loadMatch[1])) {
          const inp = document.getElementById("aiShoppingPromptInput");
          if (inp) inp.value = "";
          return;
        }
      }
      return orig.apply(this, arguments);
    };
    wrapped.__moaathDelightHooked = true;
    window.runAIShoppingAssistant = wrapped;
  }

  function hookCartModalForRadar() {
    if (typeof window.renderCartModalItems === "function" && !window.renderCartModalItems.__moaathRadarHooked) {
      const orig = window.renderCartModalItems;
      const wrapped = function () {
        const res = orig.apply(this, arguments);
        setTimeout(renderCheckoutSavingsRadar, 40);
        return res;
      };
      wrapped.__moaathRadarHooked = true;
      window.renderCartModalItems = wrapped;
    }
  }

  function mountSurpriseChip() {
    const chips = document.getElementById("petQuickPromptChips");
    if (!chips || document.getElementById("moaathSurpriseChipBtn")) return;
    const btn = document.createElement("button");
    btn.id = "moaathSurpriseChipBtn";
    btn.type = "button";
    btn.className = "fut-chip-btn";
    btn.style.cssText = "border:1px solid rgba(212,175,55,0.55); background:rgba(212,175,55,0.16); color:#D4AF37;";
    btn.textContent = "🎁 فاجئني بميزانيتي";
    btn.onclick = window.openMoaathSurpriseModal;
    chips.insertBefore(btn, chips.firstChild);
  }

  window.MoaathDelightPack = {
    version: "1.0",
    runSurprise(budget) {
      if (!budget || budget < 50) return window.showToast && window.showToast("⚠️ أدخل مبلغاً صحيحاً.");
      buildSurpriseBasket(budget);
    },
    applyPkgSaving(fromId, toId, removeQty, addPkgQty) {
      if (typeof window.changeQty === "function") {
        window.changeQty(fromId, -removeQty);
        window.changeQty(toId, addPkgQty);
      }
      vibrate([20, 30, 20]);
      if (typeof window.showToast === "function") window.showToast("🎉 تم التبديل للطرد الأوفر بنجاح!");
      setTimeout(renderCheckoutSavingsRadar, 60);
    },
    saveCurrentCartAsQuickList,
    loadQuickListIntoCart
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("delight_pack", "1.0");
  }

  function init() {
    injectDelightCSS();
    mountSurpriseChip();
    hookAssistantForQuickLists();
    hookCartModalForRadar();
    syncVoiceAura();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 1000);
  setInterval(syncVoiceAura, 450);
})();

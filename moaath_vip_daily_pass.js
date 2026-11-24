// ============================================================================
// نظام الشراء اليومي لشخصيات VIP من المحفظة مسبقة الدفع حصراً
// (moaath_vip_daily_pass.js — v1.0)
// - تحديد سعر اليوم الواحد لكل شخصية VIP من الإدارة (مع حفظ محلي ومزامنة Firebase)
// - شراء الشخصية لعدد أيام يحدده الزبون ويُخصم من رصيد المحفظة مسبقة الدفع حصراً
// - إغلاق الشخصية تلقائياً عند نفاذ عدد الأيام مع إبقاء جميع بياناتها وتفضيلاتها محفوظة
// - متكامل مع فحص الصلاحية لضمان عدم فتح أو تفعيل شخصية منتهية إلا بعد تجديد الشراء
// - عزل أمني تام عن الدفع وشام كاش والإيصالات المالية
// ============================================================================
(function () {
  if (window.__MOAATH_VIP_DAILY_PASS_V1__) return;
  window.__MOAATH_VIP_DAILY_PASS_V1__ = true;

  const PRICES_KEY = "moaath_vip_daily_prices_v1";
  const LEASES_KEY = "moaath_vip_daily_leases_v1";
  const DEFAULT_DAILY_PRICE_SYP = 500;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const VIP_CATALOG = [
    { id: "coach_sakhr", name: "كابتن صخر", icon: "💪", role: "اللياقة والقوة" },
    { id: "grand_chef", name: "الشيف الذهبي", icon: "👨‍🍳", role: "الطبخ والمونة" },
    { id: "princess_layla", name: "الأميرة ليلى", icon: "👑", role: "الضيافة والذوق" },
    { id: "butler_farid", name: "السيد فريد", icon: "🎩", role: "التنظيم والتوفير" },
    { id: "friend_fadi", name: "فادي الفرفوش", icon: "🔥", role: "السهرات والتسالي" },
    { id: "anime_zain", name: "كابتن زين", icon: "⚡", role: "المهام والتركيز" },
    { id: "anime_ryu", name: "المحقق ريو", icon: "🔍", role: "التحليل والندرة" },
    { id: "anime_ritaj", name: "ريتاج", icon: "🌸", role: "البهجة واللطف" },
    { id: "friend_saad", name: "سعد", icon: "🕌", role: "الالتزام والوقار" }
  ];

  let buyLockUntil = 0;

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

  function toast(msg, isErr = false) {
    if (typeof window.showToast === "function") {
      window.showToast(msg, isErr);
    }
  }

  // ==========================================================================
  // 1) إدارة أسعار اليوم الواحد لشخصيات VIP (تحددها الإدارة)
  // ==========================================================================
  function getDailyPricesMap() {
    const saved = readJSON(PRICES_KEY, {});
    const map = {};
    VIP_CATALOG.forEach((v) => {
      const val = parseInt(saved?.[v.id], 10);
      map[v.id] = val > 0 ? val : DEFAULT_DAILY_PRICE_SYP;
    });
    if (saved && typeof saved === "object") {
      Object.keys(saved).forEach((k) => {
        const val = parseInt(saved[k], 10);
        if (val > 0) map[k] = val;
      });
    }
    return map;
  }

  function getDailyPriceForPersona(personaId) {
    const map = getDailyPricesMap();
    const pVal = parseInt(map[personaId], 10);
    return pVal > 0 ? pVal : DEFAULT_DAILY_PRICE_SYP;
  }

  function setDailyPriceForPersona(personaId, priceSYP) {
    const cleanId = String(personaId || "").trim();
    const val = Math.max(10, parseInt(priceSYP, 10) || DEFAULT_DAILY_PRICE_SYP);
    if (!cleanId) return;
    const map = getDailyPricesMap();
    map[cleanId] = val;
    writeJSON(PRICES_KEY, map);

    try {
      if (typeof window.db !== "undefined" && window.db && typeof window.db.ref === "function") {
        window.db.ref(`vipDailyPrices/${cleanId}`).set(val).catch(() => {});
      }
    } catch (_) {}
  }

  function syncDailyPricesFromCloud() {
    try {
      if (typeof window.db !== "undefined" && window.db && typeof window.db.ref === "function") {
        window.db.ref("vipDailyPrices").once("value", (snap) => {
          const cloud = snap && typeof snap.val === "function" ? snap.val() : null;
          if (!cloud || typeof cloud !== "object") return;
          const map = getDailyPricesMap();
          Object.keys(cloud).forEach((k) => {
            const val = parseInt(cloud[k], 10);
            if (val > 0) map[k] = val;
          });
          writeJSON(PRICES_KEY, map);
        }).catch(() => {});
      }
    } catch (_) {}
  }

  // ==========================================================================
  // 2) قراءة رصيد المحفظة مسبقة الدفع وخصمه حصراً (دون لمس شام كاش أو الديون)
  // ==========================================================================
  function getExchangeRateSafe() {
    try {
      if (typeof exchangeRate === "number" && exchangeRate > 0) return exchangeRate;
    } catch (_) {}
    if (typeof window.exchangeRate === "number" && window.exchangeRate > 0) return window.exchangeRate;
    try {
      const cached = JSON.parse(localStorage.getItem("cache_settings") || "{}");
      if (parseFloat(cached?.exchangeRate) > 0) return parseFloat(cached.exchangeRate);
    } catch (_) {}
    return 15000;
  }

  function getPrepaidWalletSYP() {
    const u = (typeof window.currentUser === "object" && window.currentUser) || {};
    const usdBal = parseFloat(u.prepaidBalanceUSD) || 0;
    if (usdBal > 0) {
      if (typeof window.calcSYP === "function") return Math.max(0, window.calcSYP(usdBal));
      return Math.max(0, Math.round(usdBal * getExchangeRateSafe()));
    }
    const directSyp = parseFloat(u.prepaidBalanceSYP ?? u.prepaidWalletSYP) || 0;
    return Math.max(0, Math.round(directSyp));
  }

  function deductFromPrepaidWalletSYP(amountSYP) {
    const cost = Math.max(0, Math.round(Number(amountSYP) || 0));
    if (cost <= 0) return { ok: false, reason: "مبلغ غير صالح" };

    const u = (typeof window.currentUser === "object" && window.currentUser) || null;
    if (!u || !u.phone) {
      return { ok: false, reason: "يرجى تسجيل الدخول بحسابك أولاً لاستخدام المحفظة مسبقة الدفع." };
    }

    const currentSYP = getPrepaidWalletSYP();
    if (currentSYP < cost) {
      return {
        ok: false,
        reason: `رصيد المحفظة مسبقة الدفع غير كافٍ (${currentSYP.toLocaleString()} ل.س المتوفر مقابل ${cost.toLocaleString()} ل.س المطلوب).`
      };
    }

    const rate = getExchangeRateSafe();
    const prevUSD = parseFloat(u.prepaidBalanceUSD) || 0;
    const deductUSD = rate > 0 ? (cost / rate) : 0;

    if (prevUSD > 0) {
      const nextUSD = Math.max(0, Number((prevUSD - deductUSD).toFixed(4)));
      u.prepaidBalanceUSD = nextUSD;
      if (typeof window.users === "object" && window.users && window.users[u.phone]) {
        window.users[u.phone].prepaidBalanceUSD = nextUSD;
      }
      try {
        if (typeof window.db !== "undefined" && window.db && typeof window.db.ref === "function") {
          window.db.ref(`users/${u.phone}/prepaidBalanceUSD`).set(nextUSD).catch(() => {});
        }
      } catch (_) {}
    } else {
      const nextSYP = Math.max(0, currentSYP - cost);
      u.prepaidBalanceSYP = nextSYP;
      if (typeof window.users === "object" && window.users && window.users[u.phone]) {
        window.users[u.phone].prepaidBalanceSYP = nextSYP;
      }
    }

    return { ok: true, remainingSYP: getPrepaidWalletSYP() };
  }

  // ==========================================================================
  // 3) إدارة الاشتراكات اليومية وحفظ البيانات عند انتهاء المدة
  // ==========================================================================
  function getUserLeaseScopeKey() {
    const phone = String(window.currentUser?.phone || "").trim();
    return phone ? `user_${phone}` : "guest_local";
  }

  function getAllLeasesMap() {
    const raw = readJSON(LEASES_KEY, {});
    return raw && typeof raw === "object" ? raw : {};
  }

  function getLeaseRecord(personaId) {
    const scope = getUserLeaseScopeKey();
    const all = getAllLeasesMap();
    return all?.[scope]?.[personaId] || null;
  }

  function isDailyLeaseActive(personaId) {
    const rec = getLeaseRecord(personaId);
    if (!rec || !rec.expiresAt) return false;
    return Number(rec.expiresAt) > Date.now();
  }

  function getLeaseRemainingText(personaId) {
    const rec = getLeaseRecord(personaId);
    if (!rec || !rec.expiresAt) return "غير مفعّل يومياً";
    const diffMs = Number(rec.expiresAt) - Date.now();
    if (diffMs <= 0) return "منتهي (البيانات محفوظة)";
    const days = Math.floor(diffMs / MS_PER_DAY);
    const hours = Math.floor((diffMs % MS_PER_DAY) / (60 * 60 * 1000));
    if (days > 0) return `متبقٍ ${days} يوم و ${hours} ساعة`;
    const mins = Math.max(1, Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000)));
    return hours > 0 ? `متبقٍ ${hours} ساعة و ${mins} د` : `متبقٍ ${mins} دقيقة`;
  }

  // يحافظ على جميع بيانات الشخصية والتفضيلات والذاكرة دون حذفها عند انتهاء المدة
  function preservePersonaDataOnExpiry(personaId) {
    const cleanId = String(personaId || "").trim();
    if (!cleanId) return;
    const backupKey = `moaath_vip_preserved_data_${cleanId}`;
    const snapshot = {
      personaId: cleanId,
      preservedAt: new Date().toISOString(),
      vipInsights: readJSON("moaath_vip_customer_insights_v1", {}),
      saadState: cleanId === "friend_saad" ? readJSON("moaath_vip_saad_state_v1", null) : null,
      roomState: readJSON(`moaath_vip_${cleanId}_v1`, null)
    };
    writeJSON(backupKey, snapshot);
  }

  function purchaseDailyLease(personaId, daysCount) {
    const now = Date.now();
    if (now < buyLockUntil) return { ok: false, reason: "جاري تنفيذ العملية..." };

    const cleanId = String(personaId || "").trim();
    const meta = VIP_CATALOG.find((x) => x.id === cleanId);
    if (!meta) return { ok: false, reason: "شخصية VIP غير معروفة" };

    const days = Math.max(1, Math.min(365, parseInt(daysCount, 10) || 1));
    const dailyPrice = getDailyPriceForPersona(cleanId);
    const totalCostSYP = days * dailyPrice;

    const payRes = deductFromPrepaidWalletSYP(totalCostSYP);
    if (!payRes.ok) {
      return payRes;
    }

    buyLockUntil = now + 800;

    const scope = getUserLeaseScopeKey();
    const all = getAllLeasesMap();
    all[scope] = all[scope] || {};
    const prevRec = all[scope][cleanId] || {};
    const baseStartMs = (prevRec.expiresAt && Number(prevRec.expiresAt) > now) ? Number(prevRec.expiresAt) : now;
    const newExpiresAt = baseStartMs + days * MS_PER_DAY;

    all[scope][cleanId] = {
      personaId: cleanId,
      daysBought: (parseInt(prevRec.daysBought, 10) || 0) + days,
      lastDays: days,
      dailyPriceSYP: dailyPrice,
      paidSYP: totalCostSYP,
      purchasedAt: now,
      expiresAt: newExpiresAt,
      dataPreserved: true
    };
    writeJSON(LEASES_KEY, all);

    // استعادة أي بيانات محفوظة مسبقاً للشخصية عند التجديد
    const preserved = readJSON(`moaath_vip_preserved_data_${cleanId}`, null);
    if (cleanId === "friend_saad" && preserved?.saadState) {
      writeJSON("moaath_vip_saad_state_v1", preserved.saadState);
    }

    if (window.MoaathEventBus && typeof window.MoaathEventBus.emit === "function") {
      window.MoaathEventBus.emit("vip:dailyLeaseActivated", { personaId: cleanId, days, expiresAt: newExpiresAt });
    }

    return {
      ok: true,
      days,
      totalCostSYP,
      expiresAt: newExpiresAt,
      remainingWalletSYP: payRes.remainingSYP
    };
  }

  // فحص انتهاء الصلاحية وإغلاق الشخصية المنتهية مع الإبقاء على بياناتها
  function enforceLeaseExpirationGuard() {
    const scope = getUserLeaseScopeKey();
    const all = getAllLeasesMap();
    const userLeases = all[scope];
    if (!userLeases || typeof userLeases !== "object") return;

    const now = Date.now();
    let changed = false;

    Object.keys(userLeases).forEach((pid) => {
      const rec = userLeases[pid];
      if (!rec || !rec.expiresAt) return;
      if (Number(rec.expiresAt) <= now && !rec.expiredHandled) {
        preservePersonaDataOnExpiry(pid);
        rec.expiredHandled = true;
        userLeases[pid] = rec;
        changed = true;

        // إذا كانت الشخصية المنتهية هي الشخصية النشطة حالياً، نُرجع المساعد للوضع الافتراضي دون حذف بيانات الشخصية
        try {
          const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
          if (prefs.persona === pid) {
            prefs.persona = "buddy";
            localStorage.setItem("moaath_store_pet_prefs", JSON.stringify(prefs));
          }
        } catch (_) {}

        if (window.activePetPersona === pid) window.activePetPersona = "buddy";
        if (window.MoaathVIPSystem?.activePersonaId === pid) window.MoaathVIPSystem.activePersonaId = null;

        toast(`⏰ انتهت مدة اشتراك «${VIP_CATALOG.find(v => v.id === pid)?.name || pid}» اليومي — تم إغلاقها مع حفظ بياناتك لتجديدها بأي وقت.`);
      }
    });

    if (changed) {
      all[scope] = userLeases;
      writeJSON(LEASES_KEY, all);
    }
  }

  function hasAccessToVIPPersona(personaId) {
    if (isDailyLeaseActive(personaId)) return true;
    if (window.MoaathVIPSystem && typeof window.MoaathVIPSystem.isPersonaUnlockedLifetime === "function") {
      return !!window.MoaathVIPSystem.isPersonaUnlockedLifetime(personaId);
    }
    return false;
  }

  // ==========================================================================
  // 4) نافذة الشراء اليومي للزبون (من المحفظة مسبقة الدفع حصراً)
  // ==========================================================================
  window.closeMoaathVipDailyBuyModal = function () {
    const m = document.getElementById("moaathVipDailyBuyModal");
    if (m) m.style.display = "none";
  };

  window.openMoaathVipDailyBuyModal = function (preselectId = "") {
    enforceLeaseExpirationGuard();
    const prices = getDailyPricesMap();
    const walletSYP = getPrepaidWalletSYP();
    const initialId = VIP_CATALOG.some((x) => x.id === preselectId) ? preselectId : VIP_CATALOG[0].id;

    let modal = document.getElementById("moaathVipDailyBuyModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathVipDailyBuyModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10092; background:rgba(0,0,0,0.85); backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.closeMoaathVipDailyBuyModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:440px; width:95%; max-height:88vh; overflow-y:auto; border:1.5px solid #D4AF37; border-radius:20px; padding:14px; text-align:right; direction:rtl;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:14px; font-weight:900; color:#D4AF37;">🗓️ الشراء اليومي لشخصيات VIP</div>
            <div style="font-size:10px; color:var(--gray-text);">من المحفظة مسبقة الدفع حصراً • تُحفظ بياناتك عند انتهاء المدة</div>
          </div>
          <button type="button" onclick="window.closeMoaathVipDailyBuyModal()" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>

        <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.45); border-radius:12px; padding:8px 10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; font-size:11px;">
          <span>💳 رصيد المحفظة مسبقة الدفع:</span>
          <b id="moaathVipBuyWalletBal" style="color:#10b981; font-size:12.5px;">${walletSYP.toLocaleString()} ل.س</b>
        </div>

        <div class="form-group" style="margin-bottom:8px;">
          <label style="font-size:11px;">اختر شخصية VIP:</label>
          <select id="moaathVipBuyPersonaSel" class="form-control" style="font-size:11.5px;" onchange="window._moaathVipRecalcLeasePrice()">
            ${VIP_CATALOG.map((v) => {
              const pDay = prices[v.id] || DEFAULT_DAILY_PRICE_SYP;
              const statusTxt = isDailyLeaseActive(v.id) ? ` (${getLeaseRemainingText(v.id)})` : "";
              return `<option value="${v.id}" ${v.id === initialId ? "selected" : ""}>${v.icon} ${escHtml(v.name)} — ${pDay.toLocaleString()} ل.س/يوم${escHtml(statusTxt)}</option>`;
            }).join("")}
          </select>
        </div>

        <div class="form-group" style="margin-bottom:8px;">
          <label style="font-size:11px;">حدد عدد الأيام:</label>
          <div style="display:flex; gap:5px; margin-bottom:6px;">
            ${[1, 3, 7, 14, 30].map((d) => `
              <button type="button" onclick="document.getElementById('moaathVipBuyDaysInp').value=${d}; window._moaathVipRecalcLeasePrice();" class="btn" style="flex:1; padding:5px 4px; font-size:10.5px; background:rgba(212,175,55,0.14); color:#D4AF37; border:1px solid rgba(212,175,55,0.4);">${d} ${d === 1 ? "يوم" : "أيام"}</button>
            `).join("")}
          </div>
          <input id="moaathVipBuyDaysInp" type="number" min="1" max="365" value="1" class="form-control" style="font-size:12px;" oninput="window._moaathVipRecalcLeasePrice()">
        </div>

        <div id="moaathVipBuySummaryBox" style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:9px; margin-bottom:10px; font-size:11px; line-height:1.6;"></div>

        <button type="button" id="moaathVipConfirmBuyBtn" onclick="window._moaathVipExecuteLeaseBuy()" class="btn" style="width:100%; padding:9px; font-size:12px; font-weight:900; background:linear-gradient(135deg,#D4AF37,#10b981); color:#000;">
          ✅ تأكيد الشراء من المحفظة مسبقة الدفع
        </button>

        <div style="margin-top:11px; border-top:1px dashed var(--border-color); padding-top:8px;">
          <div style="font-size:10.5px; font-weight:800; color:#38bdf8; margin-bottom:5px;">📋 حالة اشتراكاتك اليومية لـ VIP:</div>
          ${VIP_CATALOG.map((v) => {
            const active = isDailyLeaseActive(v.id);
            const stTxt = getLeaseRemainingText(v.id);
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed rgba(255,255,255,0.08); font-size:10px;">
                <span>${v.icon} <b>${escHtml(v.name)}</b> <small style="color:var(--gray-text);">(${prices[v.id].toLocaleString()} ل.س/يوم)</small></span>
                <span style="color:${active ? "#10b981" : "#f59e0b"}; font-weight:800;">${active ? "🟢 " + escHtml(stTxt) : "🔒 " + escHtml(stTxt)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    window._moaathVipRecalcLeasePrice();
  };

  window._moaathVipRecalcLeasePrice = function () {
    const pid = String(document.getElementById("moaathVipBuyPersonaSel")?.value || VIP_CATALOG[0].id);
    const days = Math.max(1, Math.min(365, parseInt(document.getElementById("moaathVipBuyDaysInp")?.value || "1", 10) || 1));
    const unitPrice = getDailyPriceForPersona(pid);
    const total = days * unitPrice;
    const wallet = getPrepaidWalletSYP();
    const enough = wallet >= total;
    const curState = getLeaseRemainingText(pid);

    const box = document.getElementById("moaathVipBuySummaryBox");
    if (box) {
      box.innerHTML = `
        <div>• سعر اليوم الواحد: <b>${unitPrice.toLocaleString()} ل.س</b></div>
        <div>• المدة المطلوبة: <b>${days} ${days === 1 ? "يوم" : "أيام"}</b></div>
        <div>• التكلفة الإجمالية: <b style="color:${enough ? "#10b981" : "#ef4444"}; font-size:12.5px;">${total.toLocaleString()} ل.س</b></div>
        <div>• الحالة الحالية: <b>${escHtml(curState)}</b></div>
        ${!enough ? `<div style="color:#fca5a5; font-size:10px; margin-top:3px;">⚠️ رصيد المحفظة مسبقة الدفع الحالي (${wallet.toLocaleString()} ل.س) أقل من التكلفة.</div>` : ""}
      `;
    }
  };

  window._moaathVipExecuteLeaseBuy = function () {
    const pid = String(document.getElementById("moaathVipBuyPersonaSel")?.value || VIP_CATALOG[0].id);
    const days = Math.max(1, Math.min(365, parseInt(document.getElementById("moaathVipBuyDaysInp")?.value || "1", 10) || 1));
    const res = purchaseDailyLease(pid, days);
    if (!res.ok) {
      toast(`⚠️ ${res.reason}`, true);
      return;
    }
    const vName = VIP_CATALOG.find((x) => x.id === pid)?.name || pid;
    toast(`🎉 تم فتح «${vName}» لمدة ${res.days} ${res.days === 1 ? "يوم" : "أيام"}! المتبقي في المحفظة: ${res.remainingWalletSYP.toLocaleString()} ل.س`);
    window.openMoaathVipDailyBuyModal(pid);
  };

  // ==========================================================================
  // 5) قسم تحديد سعر اليوم لكل شخصية VIP داخل لوحة الإدارة (#adminModal)
  // ==========================================================================
  function injectAdminDailyPricingCard() {
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;
    if (document.getElementById("moaathAdminVipDailyPricingCard")) return;

    const targetContainer =
      document.getElementById("admTab15Architect") ||
      adminModal.querySelector(".modal-content");
    if (!targetContainer) return;

    const prices = getDailyPricesMap();
    const card = document.createElement("div");
    card.id = "moaathAdminVipDailyPricingCard";
    card.className = "adm-sec";
    card.style.cssText = "border-color:#D4AF37; margin-top:10px;";
    card.innerHTML = `
      <div class="adm-sec-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#D4AF37;">🗓️ تسعير الشراء اليومي لشخصيات VIP (محفظة مسبقة الدفع)</span>
        <button type="button" onclick="window._moaathAdminSaveAllDailyPrices()" class="btn" style="width:auto; padding:3px 10px; font-size:10px; background:#10b981; color:#000;">💾 حفظ الأسعار</button>
      </div>
      <div style="font-size:10px; color:var(--gray-text); margin-bottom:7px;">
        حدّد سعر اليوم الواحد (بالليرة) لكل شخصية VIP؛ يُخصم تلقائياً من المحفظة مسبقة الدفع عند شراء الزبون لعدد أيام.
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        ${VIP_CATALOG.map((v) => `
          <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:9px; padding:6px; font-size:10px;">
            <div style="font-weight:800; margin-bottom:3px; color:var(--text-color);">${v.icon} ${escHtml(v.name)}</div>
            <input type="number" min="10" step="10" data-vip-price-id="${v.id}" value="${prices[v.id] || DEFAULT_DAILY_PRICE_SYP}" class="form-control" style="padding:4px 6px; font-size:10.5px;">
          </div>
        `).join("")}
      </div>
    `;
    targetContainer.appendChild(card);
  }

  window._moaathAdminSaveAllDailyPrices = function () {
    const inputs = document.querySelectorAll("input[data-vip-price-id]");
    let count = 0;
    inputs.forEach((inp) => {
      const pid = inp.getAttribute("data-vip-price-id");
      const val = parseInt(inp.value, 10);
      if (pid && val > 0) {
        setDailyPriceForPersona(pid, val);
        count++;
      }
    });
    toast(`✅ تم حفظ أسعار الشراء اليومي لـ ${count} شخصيات VIP.`);
  };

  // ==========================================================================
  // 6) ربط القفل التلقائي للغرف والاختيار مع الإبقاء على وصول المشتركين الدائمين
  // ==========================================================================
  function hookAccessGuards() {
    // زر سريع للشراء اليومي داخل شريط الاختصارات في المساعد
    const chips = document.getElementById("petQuickPromptChips");
    if (chips && !document.getElementById("moaathVipDailyLeaseChipBtn")) {
      const btn = document.createElement("button");
      btn.id = "moaathVipDailyLeaseChipBtn";
      btn.type = "button";
      btn.className = "fut-chip-btn";
      btn.style.cssText = "border:1px solid rgba(212,175,55,0.55); background:rgba(212,175,55,0.16); color:#D4AF37;";
      btn.textContent = "🗓️ شراء VIP يومي";
      btn.onclick = () => window.openMoaathVipDailyBuyModal();
      chips.appendChild(btn);
    }

    // التحقق عند محاولة فتح غرفة VIP مستقلة إذا كانت صلاحيتها اليومية منتهية
    if (window.MoaathVIPRooms && typeof window.MoaathVIPRooms.open === "function" && !window.MoaathVIPRooms.open.__moaathDailyLeaseGuarded) {
      const origOpen = window.MoaathVIPRooms.open;
      const wrappedOpen = function (roomId) {
        enforceLeaseExpirationGuard();
        const isKnownVip = VIP_CATALOG.some((x) => x.id === roomId);
        if (isKnownVip && !hasAccessToVIPPersona(roomId)) {
          toast("🔒 انتهت مدة هذه الشخصية اليومية أو لم يتم شراؤها بعد (بياناتك محفوظة). يمكنك شراؤها من المحفظة مسبقة الدفع.", true);
          window.openMoaathVipDailyBuyModal(roomId);
          return;
        }
        return origOpen.apply(this, arguments);
      };
      wrappedOpen.__moaathDailyLeaseGuarded = true;
      window.MoaathVIPRooms.open = wrappedOpen;
    }
  }

  window.MoaathVIPDailyPass = {
    version: "1.0",
    getDailyPricesMap,
    getDailyPriceForPersona,
    setDailyPriceForPersona,
    purchaseDailyLease,
    isDailyLeaseActive,
    getLeaseRemainingText,
    hasAccessToVIPPersona,
    enforceExpiration: enforceLeaseExpirationGuard,
    openBuyModal: window.openMoaathVipDailyBuyModal
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("vip_daily_pass", "1.0");
  }

  function init() {
    syncDailyPricesFromCloud();
    enforceLeaseExpirationGuard();
    injectAdminDailyPricingCard();
    hookAccessGuards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 1400);
  setInterval(() => {
    enforceLeaseExpirationGuard();
    injectAdminDailyPricingCard();
    hookAccessGuards();
  }, 4000);
})();

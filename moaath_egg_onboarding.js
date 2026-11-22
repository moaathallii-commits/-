// ============================================================================
// وحدة «البيضة الإلكترونية» للزائر الجديد وتفقيس المساعدين بعد أول طلب ناجح
// (moaath_egg_onboarding.js — v1.0)
// - للزائر الجديد: إخفاء زحمة المساعدين وإظهار «البيضة الإلكترونية المتوهّجة» بلمسة مستقبلية
// - عند الضغط على البيضة: نافذة مبهرة تشرح قدرات المساعدين (الشيف، فادي، صخر، ريتاج، سعد، فريد...)
// - للزبائن القدامى (لديهم طلب سابق أو نقاط أو رصيد): فتح تلقائي فوري بدون أي قيد
// - لحظة إتمام أول طلب ناجح:
//   1) مشهد تفقيس البيضة بوهج ذهبي + ترحيب شخصي باسم الزبون
//   2) تحليل أصناف أول فاتورة لبناء «بصمة الذوق الأولى» وحقنها في MoaathLearningHub
//   3) ترشيح وتفعيل أقرب شخصية مساعدة لذوق الزبون تلقائياً
// - يعمل محلياً بالكامل (0 حصة API) مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_EGG_ONBOARDING_V1__) return;
  window.__MOAATH_EGG_ONBOARDING_V1__ = true;

  const HATCH_KEY = "moaath_egg_hatched_v1";
  const LAST_ORDER_KEY = "moaath_last_order_snapshot_v1";

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

  function vibrate(p = 20) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getCustomerFirstName() {
    try {
      const raw = String(window.currentUser?.name || document.getElementById("customerNameInput")?.value || "").trim();
      if (!raw || raw === "زبون" || raw === "زائر") return "";
      return raw.split(/\s+/)[0].slice(0, 18);
    } catch (_) {
      return "";
    }
  }

  // ==========================================================================
  // 1) التحقق من حالة التفقيس (استثناء تلقائي للزبائن القدامى)
  // ==========================================================================
  function isEggHatched() {
    const saved = readJSON(HATCH_KEY, null);
    if (saved && saved.hatched) return true;

    // استثناء الزبائن القدامى تلقائياً: وجود طلب سابق أو نقاط أو رصيد محفظة
    const lastOrder = readJSON(LAST_ORDER_KEY, null);
    const hasLastOrder = !!(lastOrder && Array.isArray(lastOrder.items) && lastOrder.items.length > 0);
    const hasHistory =
      hasLastOrder ||
      (window.currentUser && (
        (parseInt(window.currentUser.points, 10) || 0) > 0 ||
        (parseFloat(window.currentUser.wallet) || 0) > 0 ||
        (parseInt(window.currentUser.ordersCount, 10) || 0) > 0
      ));

    if (hasHistory) {
      writeJSON(HATCH_KEY, { hatched: true, autoUnlocked: true, at: Date.now() });
      return true;
    }
    return false;
  }

  // ==========================================================================
  // 2) تحليل أصناف أول فاتورة لبناء «بصمة الذوق الأولى» وترشيح الشخصية الأنسب
  // ==========================================================================
  function analyzeFirstOrderTaste(items) {
    const names = (items || []).map((it) => String(it.name || "")).filter(Boolean);
    const joined = names.join(" ");
    const firstItem = names[0] || "منتجات المتجر";

    let recPersona = {
      id: "buddy",
      name: "بندق الودود",
      emoji: "✨",
      reason: "رفيقك الذكي لتسريع طلباتك اليومية وحفظ مفضلاتك."
    };

    if (/متة|مته|شيبس|بزر|موالح|سناكس|كناكر|فستق/.test(joined)) {
      recPersona = {
        id: "friend_fadi",
        name: "فادي الفرفوش",
        emoji: "🔥",
        reason: "لاحظتُ حبك لأجواء السهرة والمتة والتسالي! سأجهز لك سهراتك بلمسة واحدة."
      };
    } else if (/معكرون|مكرون|رز|ارز|عدس|برغل|بندور|زيت|سمن|بهار/.test(joined)) {
      recPersona = {
        id: "grand_chef",
        name: "الشيف الذهبي",
        emoji: "👨‍🍳",
        reason: "أنت تحب الطبخ ومونة البيت! سأقترح عليك أشهى الوصفات من مكونات المتجر."
      };
    } else if (/بيض|تونة|تونه|شوفان|حليب|لبن|فول/.test(joined)) {
      recPersona = {
        id: "coach_sakhr",
        name: "كابتن صخر",
        emoji: "💪",
        reason: "اختياراتك غنية بالبروتين والطاقة! سأساعدك بأوفر سلال اللياقة والتغذية."
      };
    } else if (/شوكولا|بسكوت|بسكويت|كاكاو|كابتشينو|عصير|ويفر/.test(joined)) {
      recPersona = {
        id: "anime_ritaj",
        name: "ريتاج",
        emoji: "🌸",
        reason: "ذوقك لطيف ومبهج! جهّزت لك وصفات حلى بدون فرن ومكافآت لطيفة."
      };
    } else if (items.some((x) => String(x.id || "").endsWith("_PKG")) || /سائل جلي|مسحوق|كلور|صابون/.test(joined)) {
      recPersona = {
        id: "butler_farid",
        name: "السيد فريد",
        emoji: "🎩",
        reason: "أنت تهتم بالتوفير وتنظيم ميزانية البيت! سأرصد لك أوفر الطرود دائماً."
      };
    }

    // حقن بصمة الذوق الأولى في الذاكرة المشتركة (MoaathLearningHub)
    if (window.MoaathLearningHub && typeof window.MoaathLearningHub.addLearnedFact === "function") {
      names.slice(0, 3).forEach((nm) => {
        window.MoaathLearningHub.addLearnedFact(`بصمة الطلب الأول: يفضّل الزبون «${nm}»`);
      });
    }

    // حفظ الشخصية المرشحة كشخصية مبدئية
    try {
      const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      prefs.persona = recPersona.id;
      localStorage.setItem("moaath_store_pet_prefs", JSON.stringify(prefs));
    } catch (_) {}

    return { firstItem, recPersona, itemsCount: items.length };
  }

  // ==========================================================================
  // 3) تنسيقات البيضة الإلكترونية ومشهد التفقيس (CSS)
  // ==========================================================================
  function injectEggCSS() {
    if (document.getElementById("moaathEggOnboardingCSS")) return;
    const st = document.createElement("style");
    st.id = "moaathEggOnboardingCSS";
    st.textContent = `
      @keyframes moaathEggFloat {
        0%, 100% { transform: translateY(0px) rotate(-2deg); }
        50% { transform: translateY(-5px) rotate(2deg); }
      }
      @keyframes moaathEggGlow {
        0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,0.35), 0 0 24px rgba(56,189,248,0.2); }
        50% { box-shadow: 0 0 22px rgba(212,175,55,0.75), 0 0 36px rgba(16,185,129,0.4); }
      }
      @keyframes moaathEggShakeHatch {
        0% { transform: scale(1) rotate(0deg); }
        20% { transform: scale(1.08) rotate(-10deg); }
        40% { transform: scale(1.12) rotate(10deg); }
        60% { transform: scale(1.16) rotate(-12deg); }
        80% { transform: scale(1.22) rotate(12deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      /* إخفاء واجهة المساعدين مؤقتاً للزائر الجديد مع إبقاء البحث والمنتجات 100% */
      body.moaath-egg-locked #aiSmartAssistantBox,
      body.moaath-egg-locked #futuristicAiHeader,
      body.moaath-egg-locked #futuristicAiBody,
      body.moaath-egg-locked #petCharRoot,
      body.moaath-egg-locked #petQuickPromptChips {
        display: none !important;
      }
      #moaathDigitalEggBanner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 6px 0 8px 0;
        padding: 9px 12px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.88));
        border: 1.5px solid rgba(212,175,55,0.65);
        cursor: pointer;
        direction: rtl;
        animation: moaathEggGlow 2.8s ease-in-out infinite;
      }
      body.light-mode #moaathDigitalEggBanner {
        background: linear-gradient(135deg, #fffbeb, #f0f9ff);
      }
      .moaath-egg-orb {
        width: 40px;
        height: 44px;
        border-radius: 50% 50% 45% 45% / 60% 60% 40% 40%;
        background: radial-gradient(circle at 35% 30%, #fef08a, #D4AF37 55%, #0f172a 100%);
        border: 1.5px solid #fde047;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
        animation: moaathEggFloat 2.4s ease-in-out infinite;
      }
      .moaath-egg-orb.is-hatching {
        animation: moaathEggShakeHatch 0.75s ease-in-out 2;
      }
    `;
    document.head.appendChild(st);
  }

  // ==========================================================================
  // 4) نافذة شرح «البيضة الإلكترونية» المستقبلية عند الضغط عليها
  // ==========================================================================
  function openEggPreviewModal() {
    let modal = document.getElementById("moaathEggPreviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathEggPreviewModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10088; background:rgba(0,0,0,0.86); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:430px; width:94%; border:1.5px solid #D4AF37; border-radius:22px; padding:16px 14px; text-align:center; direction:rtl; background:linear-gradient(160deg, #0f172a, #111827); color:#f8fafc;">
        <div style="display:flex; justify-content:center; margin-bottom:8px;">
          <div class="moaath-egg-orb" style="width:62px; height:70px; font-size:30px;">🥚</div>
        </div>
        <div style="font-size:16px; font-weight:900; color:#D4AF37; margin-bottom:4px;">بيضتك الذكية بانتظارك! ✨</div>
        <div style="font-size:11px; color:#cbd5e1; line-height:1.65; margin-bottom:12px;">
          بداخل هذه البيضة الإلكترونية عالمٌ كامل من <b>المساعدين الشخصيين الأذكياء</b> المصمّمين لخدمتك يومياً وتوفير وقتك ومالك.
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; text-align:right; margin-bottom:12px; font-size:10px;">
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(245,158,11,0.35); border-radius:11px; padding:7px;">
            <b style="color:#f59e0b;">👨‍🍳 الشيف الذهبي</b><br><span style="color:#94a3b8;">وصفات طبخ من المتجر</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(249,115,22,0.35); border-radius:11px; padding:7px;">
            <b style="color:#f97316;">🔥 فادي الفرفوش</b><br><span style="color:#94a3b8;">تجهيز السهرات والمتة</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(16,185,129,0.35); border-radius:11px; padding:7px;">
            <b style="color:#10b981;">🕌 سعد الوقور</b><br><span style="color:#94a3b8;">الصلاة والأذكار والمسبحة</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(56,189,248,0.35); border-radius:11px; padding:7px;">
            <b style="color:#38bdf8;">🎩 فريد وصخر وريتاج</b><br><span style="color:#94a3b8;">توفير ولياقة وحلويات</span>
          </div>
        </div>

        <div style="background:rgba(16,185,129,0.12); border:1px dashed #10b981; border-radius:12px; padding:9px; margin-bottom:12px;">
          <div style="font-size:11px; font-weight:900; color:#10b981; margin-bottom:4px;">🔓 كيف تفقس بيضتك الذكية؟</div>
          <div style="font-size:10.5px; color:#e2e8f0; line-height:1.55;">
            أتمم <b>أول عملية شراء ناجحة</b> الآن — وستفقس البيضة فوراً، ويتعرّف مساعدك الشخصي على ذوقك المفضّل من أول طلب!
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.12); border-radius:999px; overflow:hidden; margin-top:7px;">
            <div style="width:35%; height:100%; background:linear-gradient(90deg,#D4AF37,#10b981);"></div>
          </div>
        </div>

        <button type="button" onclick="document.getElementById('moaathEggPreviewModal').style.display='none'" class="btn" style="width:100%; padding:9px; font-size:12px; font-weight:900; background:linear-gradient(135deg,#D4AF37,#10b981); color:#000; border-radius:12px;">
          🛒 ابدأ التسوق الآن لفتح البيضة
        </button>
      </div>
    `;
    vibrate(15);
  }

  // ==========================================================================
  // 5) مشهد تفقيس البيضة الاحتفالي بعد أول طلب ناجح
  // ==========================================================================
  function showHatchingCelebrationModal(tasteInfo) {
    const cust = getCustomerFirstName();
    const namePart = cust ? ` يا ${cust}` : "";
    const p = tasteInfo.recPersona;

    let modal = document.getElementById("moaathEggHatchModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathEggHatchModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10090; background:rgba(0,0,0,0.88); backdrop-filter:blur(9px); -webkit-backdrop-filter:blur(9px);";
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:420px; width:94%; border:2px solid #D4AF37; border-radius:24px; padding:18px 14px; text-align:center; direction:rtl; background:radial-gradient(circle at top, #1e293b, #0b1019); color:#f8fafc;">
        <div id="moaathHatchStage">
          <div style="display:flex; justify-content:center; margin-bottom:10px;">
            <div class="moaath-egg-orb is-hatching" style="width:74px; height:84px; font-size:36px;">🥚</div>
          </div>
          <div style="font-size:15px; font-weight:900; color:#D4AF37;">✨ بيضتك الإلكترونية تفقس الآن...</div>
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">جاري تحليل بصمة ذوقك الأولى وتجهيز مساعدك الشخصي!</div>
        </div>
      </div>
    `;
    vibrate([20, 40, 20, 40, 60]);

    setTimeout(() => {
      const stage = document.getElementById("moaathHatchStage");
      if (!stage) return;
      stage.innerHTML = `
        <div style="font-size:44px; margin-bottom:6px;">🎉 ${p.emoji} 🎉</div>
        <div style="font-size:16px; font-weight:900; color:#10b981; margin-bottom:5px;">مبروك${escHtml(namePart)}! تم فتح عالم المساعدين وVIP</div>
        <div style="font-size:11.5px; color:#e2e8f0; line-height:1.6; margin-bottom:10px;">
          أهلاً بك! أنا <b>${escHtml(p.name)}</b>، لاحظتُ من أول طلبك أنك تحب <b>«${escHtml(tasteInfo.firstItem)}»</b>.<br>
          ${escHtml(p.reason)}
        </div>
        <div style="background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.4); border-radius:12px; padding:8px; font-size:10px; color:#bae6fd; margin-bottom:12px;">
          🧠 تم حفظ بصمة ذوقك الأولى في الذاكرة المشتركة لخدمتك أسرع في كل مرة!
        </div>
        <button type="button" onclick="document.getElementById('moaathEggHatchModal').style.display='none'" class="btn" style="width:100%; padding:10px; font-size:12px; font-weight:900; background:linear-gradient(135deg,#D4AF37,#10b981); color:#000; border-radius:12px;">
          ✨ استكشف مساعدك الشخصي الآن
        </button>
      `;
    }, 1450);
  }

  // ==========================================================================
  // 6) تطبيق القفل أو الفتح على الواجهة وربط حدث أول طلب ناجح
  // ==========================================================================
  function applyEggLockState() {
    const hatched = isEggHatched();
    document.body.classList.toggle("moaath-egg-locked", !hatched);

    const existingBanner = document.getElementById("moaathDigitalEggBanner");
    if (hatched) {
      if (existingBanner) existingBanner.remove();
      const vipTab = document.getElementById("moaathTabVipBtn");
      if (vipTab && vipTab.dataset.eggIntercepted) {
        delete vipTab.dataset.eggIntercepted;
        vipTab.innerHTML = `<span>✨</span><span>عالمي VIP</span>`;
      }
      return;
    }

    // إظهار شريط البيضة الإلكترونية الأنيق أسفل شريط البحث مباشرة
    if (!existingBanner) {
      const searchBar = document.getElementById("moaathUnifiedSmartBar") || document.getElementById("aiSmartAssistantBox");
      if (searchBar && searchBar.parentNode) {
        const banner = document.createElement("div");
        banner.id = "moaathDigitalEggBanner";
        banner.onclick = openEggPreviewModal;
        banner.innerHTML = `
          <div class="moaath-egg-orb">🥚</div>
          <div style="flex:1; min-width:0; text-align:right;">
            <div style="font-size:12px; font-weight:900; color:#D4AF37;">لديك بيضة ذكية بانتظار التفقيس! ✨</div>
            <div style="font-size:10px; color:var(--gray-text, #94a3b8);">اضغط لاكتشاف المساعدين الشخصيين (تُفتح بعد أول طلب)</div>
          </div>
          <span style="font-size:10px; font-weight:900; color:#10b981; background:rgba(16,185,129,0.16); padding:4px 8px; border-radius:999px; flex-shrink:0;">اكتشف ▾</span>
        `;
        searchBar.parentNode.insertBefore(banner, searchBar.nextSibling);
      }
    }

    // تحويل زر التبويب السفلي «عالمي VIP» مؤقتاً لفتح نافذة البيضة للزائر الجديد
    const vipTab = document.getElementById("moaathTabVipBtn");
    if (vipTab && !vipTab.dataset.eggIntercepted) {
      vipTab.dataset.eggIntercepted = "1";
      vipTab.innerHTML = `<span>🥚</span><span>البيضة الذكية</span>`;
      vipTab.addEventListener("click", (e) => {
        if (!isEggHatched()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          openEggPreviewModal();
        }
      }, true);
    }
  }

  function triggerHatchFromCurrentCart() {
    if (isEggHatched()) return;
    const cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    const items = Object.keys(cartObj)
      .filter((k) => (parseInt(cartObj[k]?.qty, 10) || 0) > 0)
      .map((k) => ({ id: k, name: cartObj[k]?.name || k, qty: parseInt(cartObj[k]?.qty, 10) || 1 }));

    if (!items.length) return;

    const tasteInfo = analyzeFirstOrderTaste(items);
    writeJSON(HATCH_KEY, {
      hatched: true,
      hatchedAt: Date.now(),
      firstItem: tasteInfo.firstItem,
      recommendedPersona: tasteInfo.recPersona.id
    });

    applyEggLockState();
    if (window.MoaathLearningHub?.syncPersonaButton) window.MoaathLearningHub.syncPersonaButton();
    if (window.MoaathPersonaSkill?.sync) window.MoaathPersonaSkill.sync();

    setTimeout(() => showHatchingCelebrationModal(tasteInfo), 500);
  }

  function hookFirstOrderCompletion() {
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("#submitOrderUnifiedBtn") : null;
      if (!btn || btn.dataset.gpsBlocked === "1") return;
      if (!isEggHatched()) {
        triggerHatchFromCurrentCart();
      }
    }, true);
  }

  // واجهة برمجية للتحكم والتجربة
  window.MoaathEggOnboarding = {
    version: "1.0",
    isHatched: isEggHatched,
    openPreview: openEggPreviewModal,
    // للتجربة السريعة من قبل المدير: إعادة قفل البيضة أو تفقيسها فوراً
    resetForTest() {
      try { localStorage.removeItem(HATCH_KEY); } catch (_) {}
      applyEggLockState();
      if (typeof window.showToast === "function") window.showToast("🥚 تم تفعيل وضع الزائر الجديد (البيضة الإلكترونية) للتجربة.");
    },
    forceHatch() {
      const taste = analyzeFirstOrderTaste([{ id: "demo", name: "متة وشيبس", qty: 1 }]);
      writeJSON(HATCH_KEY, { hatched: true, hatchedAt: Date.now(), manual: true });
      applyEggLockState();
      showHatchingCelebrationModal(taste);
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("egg_onboarding", "1.0");
  }

  function init() {
    injectEggCSS();
    applyEggLockState();
    hookFirstOrderCompletion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(applyEggLockState, 900);
  setTimeout(applyEggLockState, 2200);
})();

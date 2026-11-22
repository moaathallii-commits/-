// ============================================================================
// مركز التعلم الذاتي الموحّد لمتجر معاذ (moaath_learning_hub.js — v1.1)
// 1) الذاكرة المشتركة بين جميع الشخصيات والغرف (Cross-Persona Shared Brain)
// 2) مقياس دقة التوقعات الحي (Suggestion Hit-Rate %) ومستوى الألفة لكل شخصية
// 3) التعلم التلقائي للمرادفات عند تصحيح الزبون (Zero-Click Synonym Learning)
// 4) لوحة «ماذا تعلّمتُ عنك؟» المرئية القابلة للتحكم والحذف (0 حصة API)
// 5) إصلاح فوري ومزامنة حيّة لزر اختيار وتبديل الشخصية المساعدة داخل شريط المساعد الذكي
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_LEARNING_HUB_V1__) return;
  window.__MOAATH_LEARNING_HUB_V1__ = true;

  const METRICS_KEY = "moaath_learning_metrics_v1";
  const LOCAL_SYN_KEY = "moaath_store_local_synonyms";

  let lastFailedQuery = null; // { query, ts }

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

  function isFinancialText(txt) {
    return /شام\s*كاش|شامكاش|دفع|إيصال|ايصال|تحويل|shamcash|payment/i.test(String(txt || ""));
  }

  function loadMetrics() {
    const def = {
      acceptedCount: 0,
      ignoredCount: 0,
      autoSynonymsCount: 0,
      timeBuckets: { morning: 0, afternoon: 0, evening: 0 },
      personaXP: {},
      facts: [] // { id, text, date }
    };
    return Object.assign(def, readJSON(METRICS_KEY, {}));
  }

  function saveMetrics(m) {
    writeJSON(METRICS_KEY, m);
  }

  function addLearnedFact(text) {
    if (!text || isFinancialText(text)) return;
    const m = loadMetrics();
    if (m.facts.some((f) => f.text === text)) return;
    m.facts.unshift({
      id: "F_" + Date.now() + "_" + Math.floor(Math.random() * 999),
      text: String(text).slice(0, 120),
      date: new Date().toLocaleDateString("ar-SY")
    });
    m.facts = m.facts.slice(0, 25);
    saveMetrics(m);
  }

  function recordTimeOfDayHabit() {
    const h = new Date().getHours();
    const bucket = h >= 5 && h < 12 ? "morning" : h >= 12 && h < 18 ? "afternoon" : "evening";
    const m = loadMetrics();
    m.timeBuckets = m.timeBuckets || { morning: 0, afternoon: 0, evening: 0 };
    m.timeBuckets[bucket] = (m.timeBuckets[bucket] || 0) + 1;
    saveMetrics(m);
  }

  // ==========================================================================
  // 1) الذاكرة المشتركة بين جميع الشخصيات والغرف (Cross-Persona Shared Brain)
  // ==========================================================================
  function getSharedProfile() {
    const sakhr = readJSON("moaath_vip_sakhr_v1", {});
    const farid = readJSON("moaath_vip_farid_v1", {});
    const chef = readJSON("moaath_vip_grand_chef_v1", {});
    const ritaj = readJSON("moaath_vip_ritaj_v1", {});
    const m = loadMetrics();

    const tb = m.timeBuckets || { morning: 0, afternoon: 0, evening: 0 };
    let prefTime = "متنوع";
    if (tb.morning >= tb.afternoon && tb.morning >= tb.evening && tb.morning > 0) prefTime = "صباحاً ☀️";
    else if (tb.evening >= tb.morning && tb.evening >= tb.afternoon && tb.evening > 0) prefTime = "مساءً 🌙";
    else if (tb.afternoon > 0) prefTime = "ظهراً 🌤️";

    const goalMap = { cut: "تنشيف وصحي 🥗", bulk: "تضخيم وبروتين 💪", maintain: "توازن وثبات ⚖️" };
    const fitnessGoal = sakhr.goal ? (goalMap[sakhr.goal] || sakhr.goal) : "غير محدد";
    const monthlyBudget = farid.monthlyBudget ? `${Number(farid.monthlyBudget).toLocaleString()} ل.س` : "غير محدد";
    const favRecipesCount = Array.isArray(chef.favorites) ? chef.favorites.length : 0;

    const totalDec = (m.acceptedCount || 0) + (m.ignoredCount || 0);
    const hitRatePct = totalDec > 0 ? Math.round((m.acceptedCount / totalDec) * 100) : 100;

    let activePersonaId = "buddy";
    try {
      const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      if (prefs.persona) activePersonaId = prefs.persona;
    } catch (_) {}

    const pXP = (m.personaXP && m.personaXP[activePersonaId]) || 0;
    const understanding = pXP >= 30 ? "خبير بذوقك 👑" : pXP >= 12 ? "متآلف معك ✨" : "يتعرّف عليك 🌱";

    return {
      fitnessGoal,
      monthlyBudget,
      favRecipesCount,
      brightStreak: ritaj.brightStreak || 0,
      prefTime,
      hitRatePct,
      acceptedCount: m.acceptedCount || 0,
      ignoredCount: m.ignoredCount || 0,
      autoSynonymsCount: m.autoSynonymsCount || 0,
      activePersonaId,
      understanding,
      facts: m.facts || []
    };
  }

  // ==========================================================================
  // 2) مقياس دقة التوقعات الحي + التعلم التلقائي للمرادفات
  // ==========================================================================
  function getActivePersonaId() {
    try {
      return JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}").persona || "buddy";
    } catch (_) {
      return "buddy";
    }
  }

  function recordHit(acceptedDelta, ignoredDelta) {
    const m = loadMetrics();
    m.acceptedCount = (m.acceptedCount || 0) + acceptedDelta;
    m.ignoredCount = (m.ignoredCount || 0) + ignoredDelta;
    const pid = getActivePersonaId();
    m.personaXP = m.personaXP || {};
    if (acceptedDelta > 0) m.personaXP[pid] = (m.personaXP[pid] || 0) + acceptedDelta * 2;
    saveMetrics(m);
  }

  function tryLearnAutoSynonymFromProduct(pid) {
    if (!lastFailedQuery || (Date.now() - lastFailedQuery.ts) > 45000) return;
    const baseId = String(pid || "").replace(/_PKG$/, "");
    const prod = window.products && window.products[baseId];
    if (!prod || !prod.name) return;

    const failedTerm = lastFailedQuery.query;
    lastFailedQuery = null;
    if (!failedTerm || failedTerm.length < 2 || isFinancialText(failedTerm)) return;

    const synMap = readJSON(LOCAL_SYN_KEY, {});
    const key = "AUTO_" + baseId;
    const cur = Array.isArray(synMap[key]) ? synMap[key] : [prod.name];
    if (!cur.includes(failedTerm)) {
      cur.push(failedTerm);
      synMap[key] = cur.slice(0, 10);
      writeJSON(LOCAL_SYN_KEY, synMap);

      const m = loadMetrics();
      m.autoSynonymsCount = (m.autoSynonymsCount || 0) + 1;
      saveMetrics(m);
      addLearnedFact(`تعلّمت تلقائياً أن «${failedTerm}» تعني «${prod.name}»`);
    }
  }

  function hookLearningSignals() {
    if (typeof window.changeQty === "function" && !window.changeQty.__moaathLearnHooked) {
      const orig = window.changeQty;
      const wrapped = function (id, delta) {
        const res = orig.apply(this, arguments);
        if (delta > 0) {
          recordTimeOfDayHabit();
          tryLearnAutoSynonymFromProduct(id);
          const baseId = String(id || "").replace(/_PKG$/, "");
          const pName = window.products?.[baseId]?.name;
          if (pName) {
            recordHit(1, 0);
            if (Math.random() < 0.35) addLearnedFact(`يفضّل الزبون صنف «${pName}»`);
          }
        }
        return res;
      };
      wrapped.__moaathLearnHooked = true;
      window.changeQty = wrapped;
    }

    if (typeof window.closePetSuggestionsModal === "function" && !window.closePetSuggestionsModal.__moaathLearnHooked) {
      const origClose = window.closePetSuggestionsModal;
      const wrappedClose = function (wasConfirmed) {
        if (!wasConfirmed) recordHit(0, 1);
        return origClose.apply(this, arguments);
      };
      wrappedClose.__moaathLearnHooked = true;
      window.closePetSuggestionsModal = wrappedClose;
    }

    const statusEl = document.getElementById("aiShoppingStatusText");
    if (statusEl && !statusEl.dataset.learnWatched) {
      statusEl.dataset.learnWatched = "1";
      const obs = new MutationObserver(() => {
        const txt = statusEl.textContent || "";
        if (/لم أجد|غير متوفر|لم تظهر نتيجة/.test(txt)) {
          const inp = document.getElementById("aiShoppingPromptInput") || document.getElementById("moaathUnifiedSearchInput");
          const q = String(inp?.value || "").trim();
          if (q.length >= 2 && !isFinancialText(q)) {
            lastFailedQuery = { query: q, ts: Date.now() };
          }
        }
      });
      obs.observe(statusEl, { childList: true, characterData: true, subtree: true });
    }
  }

  // ==========================================================================
  // 3) لوحة «ماذا تعلّمتُ عنك؟» المرئية القابلة للتحكم
  // ==========================================================================
  window.closeMoaathLearningHubModal = function () {
    const m = document.getElementById("moaathLearningHubModal");
    if (m) m.style.display = "none";
  };

  window.openMoaathLearningHubModal = function () {
    const prof = getSharedProfile();

    let modal = document.getElementById("moaathLearningHubModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathLearningHubModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10078; background:rgba(0,0,0,0.84); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.closeMoaathLearningHubModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:450px; width:95%; max-height:86vh; overflow-y:auto; border:1.5px solid #38bdf8; border-radius:18px; padding:14px; text-align:right; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:14px; font-weight:900; color:#38bdf8;">🧠 لوحة «ماذا تعلّمتُ عنك؟»</div>
            <div style="font-size:10px; color:var(--gray-text);">ذاكرة مشتركة محلية بين جميع الشخصيات (0 حصة API)</div>
          </div>
          <button type="button" onclick="window.closeMoaathLearningHubModal()" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>

        <div style="background:rgba(56,189,248,0.1); border:1px solid #38bdf8; border-radius:12px; padding:10px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#38bdf8;">🎯 دقة توقعات المساعد لك:</b>
            <b style="color:#10b981; font-size:14px;">${prof.hitRatePct}%</b>
          </div>
          <div style="height:7px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden; margin-bottom:6px;">
            <div style="width:${prof.hitRatePct}%; height:100%; background:linear-gradient(90deg,#38bdf8,#10b981);"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--gray-text);">
            <span>مستوى الألفة: <b style="color:#D4AF37;">${prof.understanding}</b></span>
            <span>مرادفات مكتسبة ذاتياً: <b style="color:#10b981;">${prof.autoSynonymsCount}</b></span>
          </div>
        </div>

        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:9px; margin-bottom:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:5px;">🔗 الذاكرة المشتركة النشطة بين الغرف:</b>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:10px;">
            <div style="background:rgba(255,255,255,0.04); padding:5px 7px; border-radius:8px;">الهدف الصحي: <b>${escHtml(prof.fitnessGoal)}</b></div>
            <div style="background:rgba(255,255,255,0.04); padding:5px 7px; border-radius:8px;">سقف الميزانية: <b>${escHtml(prof.monthlyBudget)}</b></div>
            <div style="background:rgba(255,255,255,0.04); padding:5px 7px; border-radius:8px;">وقتك المفضل: <b>${escHtml(prof.prefTime)}</b></div>
            <div style="background:rgba(255,255,255,0.04); padding:5px 7px; border-radius:8px;">وصفات مفضلة: <b>${prof.favRecipesCount}</b></div>
          </div>
        </div>

        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:9px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <b style="color:#10b981;">📌 عادات وحقائق متعلَّمة (${prof.facts.length}):</b>
            <button type="button" onclick="window.MoaathLearningHub.resetAll()" class="btn" style="width:auto; padding:2px 8px; font-size:9.5px; background:rgba(239,68,68,0.16); color:#fca5a5;">تصفير الذاكرة</button>
          </div>
          ${prof.facts.length ? prof.facts.map((f) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10.5px;">
              <span>• ${escHtml(f.text)}</span>
              <button type="button" onclick="window.MoaathLearningHub.deleteFact('${f.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:11px;">✕</button>
            </div>
          `).join("") : `<div style="font-size:10px; color:var(--gray-text);">كلما تسوّقت أو استخدمت المساعد، ستظهر هنا العادات والمرادفات التي يتعلّمها تلقائياً.</div>`}
        </div>
      </div>
    `;
  };

  // ==========================================================================
  // 4) مزامنة حيّة لزر اختيار الشخصية المساعدة (صورة + اسم) + زر لوحة التعلم
  // ==========================================================================
  function syncActivePersonaButton() {
    const dstImg = document.getElementById("moaathRestorePersonaImg");
    const dstName = document.getElementById("moaathRestorePersonaName");
    if (!dstImg || !dstName) return;

    const pid = getActivePersonaId();
    const vipObj = window.MoaathVIPSystem?.personas?.[pid] || window.MoaathAIPersonas?.PERSONAS?.[pid] || null;

    // 1) الصورة: الأولوية للصورة الظاهرة فعلياً على الشخصية العائمة ثم الشريط ثم تعريف الشخصية
    const floatImg = document.querySelector("#petCharRoot img") || document.getElementById("fairyCharImg");
    const barImg = document.getElementById("fairyBarThumb");
    const targetSrc = (floatImg && floatImg.src) || (barImg && barImg.src) || (vipObj && vipObj.img) || "";
    if (targetSrc && dstImg.src !== targetSrc) {
      dstImg.src = targetSrc;
    }

    // 2) الاسم: الأولوية لاسم الشخصية النشطة في الشريط أو في سجل الشخصيات
    const barNameEl = document.getElementById("fairyBarActiveName");
    const barName = barNameEl ? barNameEl.textContent.trim() : "";
    const resolvedName = (vipObj && vipObj.name) || barName || "";
    if (resolvedName && dstName.textContent !== resolvedName) {
      dstName.textContent = resolvedName;
    }
  }

  function restorePersonaPickerAndMountHubBtn() {
    const header = document.getElementById("futuristicAiHeader");
    if (!header) return;

    let personaBtn = document.getElementById("moaathRestorePersonaBtn");
    if (!personaBtn) {
      personaBtn = document.createElement("button");
      personaBtn.id = "moaathRestorePersonaBtn";
      personaBtn.type = "button";
      personaBtn.title = "اختيار أو تغيير الشخصية المساعدة";
      personaBtn.style.cssText =
        "display:inline-flex; align-items:center; gap:5px; padding:3px 9px 3px 4px; border-radius:999px; " +
        "background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.48); color:var(--text-color); " +
        "font-size:10.5px; font-weight:800; cursor:pointer; max-width:44%; min-width:0;";
      personaBtn.innerHTML =
        '<img id="moaathRestorePersonaImg" src="buddy.jpg" onerror="this.onerror=null;this.src=\'store-icon.png\';" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1.5px solid #D4AF37; flex-shrink:0;">' +
        '<span id="moaathRestorePersonaName" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">اختر شخصية</span>' +
        '<span style="font-size:9px; color:#D4AF37;">▾</span>';
      personaBtn.onclick = function () {
        if (typeof window.openFairyGalleryModal === "function") {
          window.openFairyGalleryModal();
        } else if (typeof window.openVIPShowcaseModal === "function") {
          window.openVIPShowcaseModal("all");
        }
      };
      header.insertBefore(personaBtn, header.firstChild);
    }

    syncActivePersonaButton();

    const actions = header.querySelector(".fut-ai-header-actions");
    if (actions && !document.getElementById("moaathLearningHubHeaderBtn")) {
      const hBtn = document.createElement("button");
      hBtn.id = "moaathLearningHubHeaderBtn";
      hBtn.type = "button";
      hBtn.title = "ماذا تعلّمتُ عنك؟";
      hBtn.style.cssText =
        "width:28px; height:28px; padding:0; border-radius:50%; border:1px solid rgba(56,189,248,0.5); " +
        "background:rgba(56,189,248,0.16); color:#38bdf8; font-size:13px; display:inline-flex; " +
        "align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;";
      hBtn.textContent = "🧠";
      hBtn.onclick = window.openMoaathLearningHubModal;
      actions.insertBefore(hBtn, actions.firstChild);
    }

    const chips = document.getElementById("petQuickPromptChips");
    if (chips && !document.getElementById("moaathLearningHubChipBtn")) {
      const hubBtn = document.createElement("button");
      hubBtn.id = "moaathLearningHubChipBtn";
      hubBtn.type = "button";
      hubBtn.className = "fut-chip-btn";
      hubBtn.style.cssText = "border:1px solid rgba(56,189,248,0.48); background:rgba(56,189,248,0.16); color:#38bdf8;";
      hubBtn.textContent = "🧠 ماذا تعلّمتُ عنك؟";
      hubBtn.onclick = window.openMoaathLearningHubModal;
      const voiceBtn = document.getElementById("moaathFreeVoiceChatBtn");
      if (voiceBtn && voiceBtn.nextSibling) {
        chips.insertBefore(hubBtn, voiceBtn.nextSibling);
      } else {
        chips.insertBefore(hubBtn, chips.firstChild);
      }
    }
  }

  window.MoaathLearningHub = {
    version: "1.1",
    getSharedProfile,
    addLearnedFact,
    syncPersonaButton: syncActivePersonaButton,
    openModal: window.openMoaathLearningHubModal,
    deleteFact(id) {
      const m = loadMetrics();
      m.facts = (m.facts || []).filter((f) => f.id !== id);
      saveMetrics(m);
      window.openMoaathLearningHubModal();
    },
    resetAll() {
      writeJSON(METRICS_KEY, { acceptedCount: 0, ignoredCount: 0, autoSynonymsCount: 0, timeBuckets: { morning: 0, afternoon: 0, evening: 0 }, personaXP: {}, facts: [] });
      if (typeof window.showToast === "function") window.showToast("🧹 تم تصفير ذاكرة التعلم المحلية.");
      window.openMoaathLearningHubModal();
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("learning_hub", "1.1");
  }

  function init() {
    hookLearningSignals();
    restorePersonaPickerAndMountHubBtn();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 900);
  setTimeout(init, 2200);
  // مزامنة تلقائية خفيفة لتحديث صورة واسم الزر فور تغيير الشخصية
  setInterval(syncActivePersonaButton, 700);
})();

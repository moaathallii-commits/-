// ============================================================================
// وحدة الفحص الشامل والاعتماد (moaath_qa_runner.js — v1.0)
// المرحلة 5 والأخيرة:
// 1) فحص ذاتي شامل (Self-Check Runner) بـ 0 حصة API لجميع الوحدات والمؤشرات
// 2) سجل أخطاء مصنّف حسب الخطورة (Error / Warn / Network / Module) مع مسح فوري
// 3) قائمة تحقق تفاعلية قبل كل إطلاق (Release Checklist) محفوظة محلياً
// 4) التحقق من العزل المالي التام عن الدفع وشام كاش وتأكيد مؤشر الصحة 100%
// ============================================================================
(function () {
  if (window.__MOAATH_QA_RUNNER_V1__) return;
  window.__MOAATH_QA_RUNNER_V1__ = true;

  const CHECKLIST_KEY = "moaath_release_checklist_v1";
  const ERROR_LOG_KEY = "moaath_qa_error_log_v1";
  const MAX_ERRORS = 20;

  const escHtml = (s) =>
    typeof window.moaathEscapeHtml === "function"
      ? window.moaathEscapeHtml(s)
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

  function readStorage(key, fallback) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.getJSON(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, val) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.setJSON(key, val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  // 1) سجل الأخطاء المصنّف (Error / Warn / Network / Module)
  function recordClassifiedError(category, message, source = "") {
    const list = readStorage(ERROR_LOG_KEY, []);
    list.unshift({
      time: new Date().toLocaleTimeString("ar-SY"),
      category: category || "Error",
      message: String(message || "خطأ غير محدد").slice(0, 180),
      source: String(source || "").slice(0, 60)
    });
    writeStorage(ERROR_LOG_KEY, list.slice(0, MAX_ERRORS));
  }

  window.addEventListener("error", (ev) => {
    const src = ev?.filename ? ev.filename.split("/").pop() : "runtime";
    const cat = /network|fetch/i.test(ev?.message || "") ? "Network" : "Error";
    recordClassifiedError(cat, ev?.message || "JS Error", src);
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const msg = String(ev?.reason?.message || ev?.reason || "Promise Rejection");
    const cat = /network|fetch|timeout/i.test(msg) ? "Network" : "Warn";
    recordClassifiedError(cat, msg, "async");
  });

  // 2) محرك الفحص الذاتي الشامل (Self-Check Runner — 0 حصة API)
  async function runFullSelfCheck() {
    const regStatus = window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.getStatus === "function"
      ? window.MoaathSystemRegistry.getStatus()
      : null;

    let swActive = false;
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        swActive = !!(reg && (reg.active || reg.waiting || reg.installing));
      }
    } catch (_) {}

    let cacheCount = 0;
    try {
      if (typeof caches !== "undefined") {
        const names = await caches.keys();
        for (const n of names) {
          const c = await caches.open(n);
          const ks = await c.keys();
          cacheCount += ks.length;
        }
      }
    } catch (_) {}

    const vipRoomsCount = window.MoaathVIPRoomModules ? Object.keys(window.MoaathVIPRoomModules).length : 0;
    const noHorizontalOverflow = document.documentElement.scrollWidth <= (window.innerWidth + 4);

    const checks = [
      { id: "core", label: "النواة المعمارية وناقل الأحداث (Core & EventBus)", ok: !!(window.MoaathSystemRegistry && window.MoaathEventBus) },
      { id: "xss", label: "حماية XSS والتخزين الآمن (moaathEscapeHtml)", ok: typeof window.moaathEscapeHtml === "function" && !!window.moaathSafeStorage },
      { id: "financial", label: "العزل المالي التام عن الدفع وشام كاش", ok: window.verifyShamCashPaymentWithAI == null && window.checkPaymentReceiptAI == null },
      { id: "ai_engine", label: "محرك الجنيات والتراكيب اللانهائية (ai_engine)", ok: !!window.__MOAATH_AI_LOADED__ && !!window.MoaathPhraseComposer },
      { id: "ai_vip", label: `غرف VIP التفاعلية الـ 8 (المتوفر: ${vipRoomsCount}/8)`, ok: !!(window.MoaathVIPSystem && window.MoaathVIPSystem.personas && vipRoomsCount >= 8) },
      { id: "inv_guard", label: "حارس المخزن ومرادفات البحث (inventory_guard)", ok: !!(window.MoaathInventoryGuard && typeof window.MoaathInventoryGuard.findDuplicateProduct === "function") },
      { id: "skills", label: "أوامر المساعدين والدردشة الصوتية الحرة", ok: !!(window.MoaathAssistantSkills && typeof window.toggleFreeVoiceChatMode === "function") },
      { id: "store_ui", label: "طبقة الواجهة المستقبلية v5.5 (بدون احتكاك)", ok: !!(window.__MOAATH_STORE_UI_V55__ || window.__MOAATH_STORE_UI_V54__) },
      { id: "layout", label: "سلامة التخطيط على الهاتف (بدون انزياح أفقي)", ok: noHorizontalOverflow },
      { id: "pwa_sw", label: `جاهزية العمل بدون إنترنت (SW + كاش: ${cacheCount} عنصر)`, ok: swActive || location.protocol === "file:" }
    ];

    const passed = checks.filter((c) => c.ok).length;
    const score = Math.round((passed / checks.length) * 100);
    const errors = readStorage(ERROR_LOG_KEY, []);

    return {
      score,
      passed,
      total: checks.length,
      checks,
      errors,
      cacheCount,
      registryScore: regStatus ? regStatus.healthScore : score,
      checkedAt: new Date().toLocaleTimeString("ar-SY")
    };
  }

  // 3) قائمة التحقق قبل الإطلاق (Release Checklist)
  const RELEASE_ITEMS = [
    { id: "bump_v", label: "تحديث رقم النسخة (?v=) للسكربتات المعدّلة في index.html" },
    { id: "deploy_worker", label: "نشر worker.js v2.0 في Cloudflare Worker" },
    { id: "clear_cache", label: "تنفيذ «صيانة الكاش والتبريد» وإعادة تحميل الصفحة" },
    { id: "test_cart", label: "اختبار إضافة منتج وتعديل الكمية (− 1 +) وأمر «أفرغ السلة»" },
    { id: "test_dup", label: "اختبار منع تكرار اسم المنتج وتوليد مرادفات البحث في المخزن" },
    { id: "test_health", label: "التأكد من وصول مؤشر الصحة إلى 100% وخلو سجل الأخطاء" }
  ];

  window.closeMoaathQAModal = function () {
    const m = document.getElementById("moaathQAModal");
    if (m) m.style.display = "none";
  };

  window.openMoaathQAModal = async function () {
    const report = await runFullSelfCheck();
    const clState = readStorage(CHECKLIST_KEY, {});

    let modal = document.getElementById("moaathQAModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathQAModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10075; background:rgba(0,0,0,0.84); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.closeMoaathQAModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    const scoreColor = report.score === 100 ? "#10b981" : report.score >= 80 ? "#f59e0b" : "#ef4444";

    modal.innerHTML = `
      <div class="modal-content" style="max-width:460px; width:95%; max-height:88vh; overflow-y:auto; border:1.5px solid ${scoreColor}; border-radius:18px; padding:14px; text-align:right; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:14px; font-weight:900; color:${scoreColor};">🛡️ فحص الاعتماد والجودة الشامل (QA)</div>
            <div style="font-size:10px; color:var(--gray-text);">آخر فحص: ${report.checkedAt} • 0 حصة API</div>
          </div>
          <button type="button" onclick="window.closeMoaathQAModal()" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>

        <!-- مؤشر الصحة النهائي -->
        <div style="background:rgba(16,185,129,0.1); border:1px solid ${scoreColor}; border-radius:12px; padding:10px; text-align:center; margin-bottom:10px;">
          <div style="font-size:24px; font-weight:900; color:${scoreColor};">${report.score}%</div>
          <div style="font-size:10.5px; color:var(--text-color);">اجتياز ${report.passed} من أصل ${report.total} فحصاً معمارياً وأمنياً</div>
        </div>

        <!-- نتائج الفحوصات -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:9px; margin-bottom:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:5px;">📋 نتائج الفحص الذاتي (Self-Check):</b>
          ${report.checks.map((c) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10.5px;">
              <span>${escHtml(c.label)}</span>
              <span style="font-weight:900; color:${c.ok ? "#10b981" : "#f59e0b"};">${c.ok ? "✅ سليم" : "⚠️ يحتاج مراجعة"}</span>
            </div>
          `).join("")}
        </div>

        <!-- سجل الأخطاء المصنّف -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:9px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <b style="color:#38bdf8;">🐞 سجل الأخطاء المصنّف (${report.errors.length})</b>
            <button type="button" onclick="window.MoaathQARunner.clearErrorLog()" class="btn" style="width:auto; padding:2px 8px; font-size:9.5px; background:rgba(239,68,68,0.18); color:#fca5a5;">مسح السجل</button>
          </div>
          ${report.errors.length ? report.errors.slice(0, 6).map((e) => `
            <div style="font-size:10px; padding:3px 0; border-bottom:1px dashed var(--border-color);">
              <span style="color:#f59e0b; font-weight:800;">[${escHtml(e.category)}]</span>
              <span>${escHtml(e.message)}</span>
              <small style="color:var(--gray-text);">(${escHtml(e.source)} • ${escHtml(e.time)})</small>
            </div>
          `).join("") : `<div style="font-size:10px; color:#10b981;">✅ لا توجد أخطاء مسجلة — النظام مستقر تماماً!</div>`}
        </div>

        <!-- قائمة التحقق قبل الإطلاق -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:9px; margin-bottom:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:5px;">🚀 قائمة التحقق قبل الإطلاق (Release Checklist):</b>
          ${RELEASE_ITEMS.map((item) => {
            const done = !!clState[item.id];
            return `
              <button type="button" onclick="window.MoaathQARunner.toggleChecklist('${item.id}')" style="display:block; width:100%; text-align:right; background:none; border:none; color:var(--text-color); padding:4px 0; font-size:10.5px; cursor:pointer; opacity:${done ? "0.6" : "1"}; text-decoration:${done ? "line-through" : "none"};">
                ${done ? "☑️" : "⬜"} ${escHtml(item.label)}
              </button>
            `;
          }).join("")}
        </div>

        <button type="button" onclick="window.openMoaathQAModal()" class="btn" style="background:linear-gradient(45deg,#10b981,#38bdf8); color:#000; font-size:11px; padding:7px;">🔄 إعادة الفحص الفوري</button>
      </div>
    `;
  };

  function mountQAButtonInAdmin() {
    if (document.getElementById("moaathOpenQABtn")) return;
    const target =
      document.getElementById("admArchActionsRow") ||
      document.getElementById("admTab13Export") ||
      document.querySelector("#adminModal .modal-content");
    if (!target) return;

    const btn = document.createElement("button");
    btn.id = "moaathOpenQABtn";
    btn.type = "button";
    btn.className = "btn";
    btn.style.cssText =
      "margin:6px 0; background:linear-gradient(45deg,#10b981,#D4AF37); color:#000; font-size:11px; padding:7px 10px;";
    btn.textContent = "🛡️ فتح لوحة الفحص الشامل والاعتماد (QA Self-Check 100%)";
    btn.onclick = window.openMoaathQAModal;
    target.insertBefore(btn, target.firstChild);
  }

  window.MoaathQARunner = {
    version: "1.0",
    runFullSelfCheck,
    openModal: window.openMoaathQAModal,
    clearErrorLog() {
      writeStorage(ERROR_LOG_KEY, []);
      if (typeof window.showToast === "function") window.showToast("🧹 تم مسح سجل الأخطاء بالكامل.");
      window.openMoaathQAModal();
    },
    toggleChecklist(id) {
      const st = readStorage(CHECKLIST_KEY, {});
      st[id] = !st[id];
      writeStorage(CHECKLIST_KEY, st);
      window.openMoaathQAModal();
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("qa_runner", "1.0");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountQAButtonInAdmin);
  } else {
    mountQAButtonInAdmin();
  }
  setTimeout(mountQAButtonInAdmin, 1600);
})();

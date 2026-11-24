// ============================================================================
// الحكيم التقني — مساعد الإدارة والمراقب العام لمتجر معاذ (ai_admin_architect.js)
// - يعمل كمهندس معمارية، مطور واجهات وأكواد، خبير PWA وأداء، خبير أخطاء وQA،
//   وخبير ذكاء اصطناعي يراقب جميع الشخصيات (الأساسية وVIP) واحتياجات المتجر
// - غرفة خاصة داخل لوحة الإدارة (تبويب: الحكيم التقني) لاقتراحات التطوير والصيانة
// - مراقبة محلية فورية (صفر استهلاك للحصة) + استشارة ذكية عند الطلب عبر worker.js
// - عزل كامل ونهائي للذكاء الاصطناعي عن الدفع وشام كاش والإيصالات المالية
// - حصر المفاتيح المعتمدة: GEMINI_API_KEY_1 و GEMINI_API_KEY و GEMINI_API_KEY_2
// ============================================================================

(function () {
  if (window.MoaathAdminArchitect) return;

  const LOG_KEY = "moaath_admin_architect_logs_v1";
  const ADVICE_CACHE_KEY = "moaath_admin_architect_last_advice_v1";
  const MAX_LOGS = 60;

  let runtimeLogs = loadLogs();
  let lastAdvice = loadLastAdvice();

  function loadLogs() {
    try {
      const d = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      return Array.isArray(d) ? d : [];
    } catch (_) {
      return [];
    }
  }

  function saveLogs() {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(runtimeLogs.slice(0, MAX_LOGS)));
    } catch (_) {}
  }

  function loadLastAdvice() {
    try {
      const d = JSON.parse(localStorage.getItem(ADVICE_CACHE_KEY) || "null");
      return d && typeof d === "object" ? d : null;
    } catch (_) {
      return null;
    }
  }

  function saveLastAdvice(obj) {
    try {
      localStorage.setItem(ADVICE_CACHE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  function pushLog(level, roleTag, message) {
    const cleanMsg = String(message || "").trim();
    if (!cleanMsg) return;
    if (/shamcash|sham_cash|شام\s*كاش|إيصال|ايصال\s*دفع|رصيد\s*مالي/i.test(cleanMsg)) return;
    runtimeLogs.unshift({
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      level: level || "info",
      role: roleTag || "QA",
      msg: cleanMsg.slice(0, 220),
      time: new Date().toLocaleTimeString("ar-SY")
    });
    runtimeLogs = runtimeLogs.slice(0, MAX_LOGS);
    saveLogs();
  }

  window.addEventListener("error", function (ev) {
    const txt = ev?.message
      ? `${ev.message} (${ev.filename || "script"}:${ev.lineno || 0})`
      : "خطأ غير متوقع في المتصفح";
    pushLog("error", "Debugger & QA", txt);
  });

  window.addEventListener("unhandledrejection", function (ev) {
    const reason = ev?.reason?.message || String(ev?.reason || "وعد مرفوض غير معالج");
    pushLog("warn", "PWA & Async", reason);
  });

  function resolveWorkerUrl() {
    try {
      if (typeof window.getEffectiveAIWorkerUrl === "function") {
        const u = String(window.getEffectiveAIWorkerUrl() || "").trim();
        if (u) return u;
      }
    } catch (_) {}
    const candidates = [
      window.AI_WORKER_URL,
      window.WORKER_URL,
      window.aiWorkerUrl,
      localStorage.getItem("moaath_ai_worker_url"),
      localStorage.getItem("ai_worker_url"),
      localStorage.getItem("worker_url")
    ];
    for (const c of candidates) {
      if (typeof c === "string" && /^https?:\/\//i.test(c.trim())) return c.trim();
    }
    return "";
  }

  async function collectSystemTelemetry() {
    const basePersonasCount = window.MoaathAIPersonas?.PERSONAS
      ? Object.keys(window.MoaathAIPersonas.PERSONAS).length
      : 0;
    const vipPersonasCount = window.MoaathVIPSystem?.personas
      ? Object.keys(window.MoaathVIPSystem.personas).length
      : 0;
    const brainSummary = window.MoaathAIBrain && typeof window.MoaathAIBrain.getProfileSummary === "function"
      ? window.MoaathAIBrain.getProfileSummary()
      : null;

    let ttsCacheCount = 0;
    let vipMediaCacheCount = 0;
    if (typeof caches !== "undefined") {
      try {
        const c1 = await caches.open("moaath_store_tts_gemini_v1");
        ttsCacheCount = (await c1.keys()).length;
      } catch (_) {}
      try {
        const c2 = await caches.open("moaath_vip_media_cache_v1");
        vipMediaCacheCount = (await c2.keys()).length;
      } catch (_) {}
    }

    let localStorageKB = 0;
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        const v = localStorage.getItem(k) || "";
        bytes += (k.length + v.length) * 2;
      }
      localStorageKB = Math.round((bytes / 1024) * 10) / 10;
    } catch (_) {}

    const brokenImgs = Array.from(document.querySelectorAll("img"))
      .filter(img => img.complete && img.naturalWidth === 0 && img.offsetParent !== null)
      .map(img => img.getAttribute("src") || img.alt || "صورة")
      .slice(0, 6);

    const hasBrain = !!window.MoaathAIBrain;
    const hasEngine = !!(window.__MOAATH_AI_LOADED__ || window.MOAATH_AI_LOADED);
    const hasVIP = !!window.MoaathVIPSystem;
    const workerUrl = resolveWorkerUrl();
    const online = navigator.onLine !== false;

    const recentErrors = runtimeLogs.filter(x => x.level === "error").length;
    let healthScore = 100;
    if (!hasBrain) healthScore -= 20;
    if (!hasEngine) healthScore -= 25;
    if (!hasVIP) healthScore -= 15;
    if (!workerUrl) healthScore -= 15;
    if (!online) healthScore -= 10;
    healthScore -= Math.min(25, recentErrors * 5 + brokenImgs.length * 3);
    healthScore = Math.max(10, Math.min(100, healthScore));

    return {
      healthScore,
      online,
      workerConfigured: !!workerUrl,
      workerHost: workerUrl ? (() => { try { return new URL(workerUrl).hostname; } catch (_) { return workerUrl; } })() : "غير مضبوط",
      modules: { hasBrain, hasEngine, hasVIP },
      personas: {
        baseCount: basePersonasCount,
        vipCount: vipPersonasCount,
        totalCount: basePersonasCount + vipPersonasCount
      },
      cache: {
        ttsCacheCount,
        vipMediaCacheCount,
        localStorageKB
      },
      brainSummary,
      brokenImgs,
      recentErrorsCount: recentErrors,
      totalLogsCount: runtimeLogs.length
    };
  }

  function escHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window._admArchRunLocalAudit = async function () {
    const tel = await collectSystemTelemetry();
    const box = document.getElementById("admArchTelemetryBox");
    if (!box) return;

    const modBadges = [
      `ai_brain: ${tel.modules.hasBrain ? "✅" : "⚠️"}`,
      `ai_engine: ${tel.modules.hasEngine ? "✅" : "⚠️"}`,
      `ai_vip: ${tel.modules.hasVIP ? "✅" : "⚠️"}`
    ].join(" • ");

    const brokenNote = tel.brokenImgs.length
      ? `<div style="margin-top:5px; color:#fca5a5; font-size:10px;">صور بحاجة لمراجعة (${tel.brokenImgs.length}): ${escHtml(tel.brokenImgs.join("، "))}</div>`
      : `<div style="margin-top:5px; color:#6ee7b7; font-size:10px;">لا توجد صور ظاهرة مكسورة حالياً.</div>`;

    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11px; font-weight:800; color:#e2e8f0;">مؤشر صحة المنظومة والجاهزية:</span>
        <span style="background:${tel.healthScore >= 75 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}; color:${tel.healthScore >= 75 ? "#34d399" : "#fbbf24"}; border:1px solid currentColor; border-radius:999px; padding:2px 9px; font-size:11px; font-weight:800;">${tel.healthScore}%</span>
      </div>
      <div style="font-size:10px; color:#cbd5e1; line-height:1.65;">
        <div>• <b>الشخصيات المراقبة:</b> ${tel.personas.totalCount} شخصية (${tel.personas.baseCount} أساسية + ${tel.personas.vipCount} VIP)</div>
        <div>• <b>الوحدات المعمارية:</b> ${modBadges}</div>
        <div>• <b>الشبكة والـ Worker:</b> ${tel.online ? "متصل" : "غير متصل"} • ${escHtml(tel.workerHost)}</div>
        <div>• <b>الكاش والتخزين المحلي:</b> صوت محفوظ (${tel.cache.ttsCacheCount}) • وسائط VIP (${tel.cache.vipMediaCacheCount}) • LocalStorage (${tel.cache.localStorageKB} KB)</div>
        <div>• <b>سجل الأخطاء:</b> ${tel.recentErrorsCount} أخطاء حرجة من أصل ${tel.totalLogsCount} سجل</div>
      </div>
      ${brokenNote}
    `;
    renderLogsList();
  };

  function renderLogsList() {
    const box = document.getElementById("admArchLogsBox");
    if (!box) return;
    if (!runtimeLogs.length) {
      box.innerHTML = `<div style="font-size:10px; color:var(--gray-text); padding:6px;">لا توجد أخطاء أو تنبيهات مسجلة حتى الآن.</div>`;
      return;
    }
    box.innerHTML = runtimeLogs.slice(0, 12).map(item => {
      const clr = item.level === "error" ? "#f87171" : (item.level === "warn" ? "#fbbf24" : "#38bdf8");
      return `
        <div style="padding:5px 7px; border-bottom:1px dashed var(--border-color); font-size:10px; line-height:1.45;">
          <div style="display:flex; justify-content:space-between; color:${clr}; font-weight:700;">
            <span>[${escHtml(item.role)}] ${escHtml(item.level.toUpperCase())}</span>
            <span style="color:var(--gray-text); font-weight:400;">${escHtml(item.time)}</span>
          </div>
          <div style="color:var(--text-color); margin-top:2px;">${escHtml(item.msg)}</div>
        </div>
      `;
    }).join("");
  }

  window._admArchClearLogs = function () {
    runtimeLogs = [];
    saveLogs();
    renderLogsList();
    if (typeof showToast === "function") showToast("تم مسح سجل التشخيص والأخطاء المحلي.");
  };

  window._admArchRepairCachesAndCooldown = async function () {
    try {
      if (typeof window.resetVoiceCooldownNow === "function") {
        window.resetVoiceCooldownNow();
      } else {
        localStorage.removeItem("moaath_store_gemini_cooldown_until");
      }
    } catch (_) {}

    if (typeof caches !== "undefined") {
      try {
        const keys = await caches.keys();
        for (const k of keys) {
          if (/temp|stale|old/i.test(k)) await caches.delete(k);
        }
      } catch (_) {}
    }

    if (window.MoaathVIPSystem && typeof window.MoaathVIPSystem.syncDailyVIPFeedFromCloud === "function") {
      try { await window.MoaathVIPSystem.syncDailyVIPFeedFromCloud(); } catch (_) {}
    }

    pushLog("info", "PWA Specialist", "تمت إعادة ضبط التبريد الصوتي وتحديث تغذية الغرف بأمان.");
    await window._admArchRunLocalAudit();
    if (typeof showToast === "function") showToast("تمت صيانة الكاش والتبريد وتحديث التغذية.");
  };

  window._admArchPromoteTopUnmatchedToSynonym = function () {
    if (typeof db === "undefined" || !db || typeof db.ref !== "function") {
      if (typeof showToast === "function") showToast("قاعدة البيانات غير متاحة حالياً.");
      return;
    }
    db.ref("ai_brain/unmatched_queries").limitToLast(5).once("value", snap => {
      const val = snap.val() || {};
      const entries = Object.values(val);
      if (!entries.length) {
        if (typeof showToast === "function") showToast("لا توجد استعلامات غير مطابقة لتحويلها.");
        return;
      }
      const top = entries.sort((a, b) => (b.count || 0) - (a.count || 0))[0];
      const term = String(top?.query || "").trim();
      if (!term) return;
      const synId = "ARCH_" + Date.now();
      const group = [term, term.replace(/^ال/, "")].filter((v, i, arr) => v && arr.indexOf(v) === i);
      if (group.length >= 2) {
        db.ref(`ai_brain/synonyms/${synId}`).set(group).then(() => {
          pushLog("info", "AI & Brain", `تمت إضافة مجموعة مرادفات من استعلام متكرر: ${group.join("، ")}`);
          if (typeof showToast === "function") showToast(`تمت إضافة مرادفات لـ (${term}).`);
        }).catch(() => {
          if (typeof showToast === "function") showToast("تعذر الكتابة المباشرة على ai_brain/synonyms.");
        });
      }
    });
  };

  function renderAdviceResult(advObj) {
    const out = document.getElementById("admArchAdviceBox");
    if (!out || !advObj) return;
    const items = Array.isArray(advObj.recommendations) ? advObj.recommendations : [];
    const codeSnippet = String(advObj.codePatch || "").trim();

    out.innerHTML = `
      <div style="background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.35); border-radius:10px; padding:9px; font-size:11px; line-height:1.6;">
        <div style="font-weight:800; color:#38bdf8; margin-bottom:4px;">رأي الحكيم التقني:</div>
        <div style="margin-bottom:6px;">${escHtml(advObj.summary || "")}</div>
        ${items.length ? `<ul style="margin:0 0 8px 0; padding-right:16px;">${items.map(it => `<li style="margin-bottom:4px;"><b>[${escHtml(it.role || "معماري")}]</b> ${escHtml(it.detail || "")}</li>`).join("")}</ul>` : ""}
        ${codeSnippet ? `
          <div style="font-weight:700; color:#fbbf24; font-size:10px; margin-bottom:3px;">مقطع كود / خطوة مقترحة:</div>
          <pre style="background:#0b1120; color:#e2e8f0; padding:7px; border-radius:8px; font-size:10px; overflow-x:auto; direction:ltr; text-align:left; margin:0;">${escHtml(codeSnippet)}</pre>
        ` : ""}
      </div>
    `;
  }

  window._admArchConsultAI = async function () {
    const promptInp = document.getElementById("admArchPromptInput");
    const roleSel = document.getElementById("admArchRoleSelect");
    const userRequest = String(promptInp?.value || "").trim();
    const focusRole = String(roleSel?.value || "all");

    if (!userRequest) {
      if (typeof showToast === "function") showToast("اكتب سؤالك أو المشكلة أو التحسين المطلوب للحكيم التقني.");
      return;
    }

    if (/shamcash|sham_cash|شام\s*كاش|إيصال|دفع/i.test(userRequest)) {
      if (typeof showToast === "function") showToast("عزل الدفع وشام كاش ملزم ولا يدخل ضمن مهام الذكاء الاصطناعي.");
      return;
    }

    const workerUrl = resolveWorkerUrl();
    if (!workerUrl || navigator.onLine === false) {
      if (typeof showToast === "function") showToast("يتطلب اتصالاً بالإنترنت ورابط Worker مضبوط للاستشارة الذكية.");
      return;
    }

    const btn = document.getElementById("admArchAskBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جاري التحليل...";
    }

    try {
      const tel = await collectSystemTelemetry();
      const compactTelemetry = {
        healthScore: tel.healthScore,
        personas: tel.personas,
        cache: tel.cache,
        brainSummary: tel.brainSummary,
        recentErrors: runtimeLogs.slice(0, 6).map(l => `${l.role}: ${l.msg}`)
      };

      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "admin_architect",
          focusRole,
          request: userRequest,
          telemetry: compactTelemetry
        })
      });

      const json = await res.json();
      if (res.ok && json?.ok && json?.data) {
        lastAdvice = json.data;
        saveLastAdvice(lastAdvice);
        renderAdviceResult(lastAdvice);
        pushLog("info", "الحكيم التقني", `تم توليد تحليل وتوصيات لطلب: ${userRequest.slice(0, 80)}`);
      } else {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      const errMsg = err?.message || "تعذر الحصول على رد من الحكيم التقني";
      pushLog("warn", "Admin Architect", errMsg);
      if (typeof showToast === "function") showToast(errMsg);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "تحليل وتوليد مقترحات";
      }
    }
  };

  function mountAdminArchitectTab() {
    const adminContent = document.querySelector("#adminModal .modal-content");
    const tabsBar = adminContent?.querySelector(".categories");
    if (!adminContent || !tabsBar || document.getElementById("admTab15Architect")) return;

    const tabBtn = document.createElement("button");
    tabBtn.className = "cat-btn";
    tabBtn.textContent = "الحكيم التقني";
    tabBtn.onclick = function () {
      if (typeof switchAdminTab === "function") switchAdminTab("admTab15Architect", this);
      window._admArchRunLocalAudit();
      if (lastAdvice) renderAdviceResult(lastAdvice);
    };
    tabsBar.appendChild(tabBtn);

    const tabDiv = document.createElement("div");
    tabDiv.id = "admTab15Architect";
    tabDiv.className = "admin-tab";
    tabDiv.style.display = "none";
    tabDiv.innerHTML = `
      <div class="adm-sec" style="border-color:#38bdf8;">
        <div class="adm-sec-title" style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="color:#38bdf8;">غرفة الحكيم التقني — المراقب العام وتطوير التطبيق</span>
          <button type="button" onclick="window._admArchRunLocalAudit()" class="btn" style="width:auto; padding:3px 9px; font-size:10px; background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid #38bdf8;">فحص فوري (0 حصة)</button>
        </div>
        <div style="font-size:10px; color:var(--gray-text); margin-bottom:8px; line-height:1.5;">
          مهندس معمارية • مطور أكواد • خبير PWA وأداء • خبير أخطاء وQA • مراقب جميع الشخصيات (الأساسية وVIP) مع عزل كامل لشام كاش.
        </div>

        <div id="admArchTelemetryBox" style="background:rgba(15,23,42,0.55); border:1px solid rgba(56,189,248,0.28); border-radius:10px; padding:8px; margin-bottom:9px;"></div>

        <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:10px;">
          <button type="button" onclick="window._admArchRepairCachesAndCooldown()" class="btn" style="flex:1; min-width:120px; padding:5px 7px; font-size:10px; background:#10b981; color:#000;">صيانة الكاش والتبريد</button>
          <button type="button" onclick="window._admArchPromoteTopUnmatchedToSynonym()" class="btn" style="flex:1; min-width:120px; padding:5px 7px; font-size:10px; background:var(--gold-color); color:#000;">ترقية بحث لمرادف</button>
          <button type="button" onclick="window._admArchClearLogs()" class="btn btn-danger" style="width:auto; padding:5px 9px; font-size:10px;">مسح السجل</button>
        </div>

        <div class="form-group" style="margin-bottom:6px;">
          <label>التخصص المراد التركيز عليه:</label>
          <select id="admArchRoleSelect" class="form-control" style="font-size:11px;">
            <option value="all">جميع الخبرات (معماري + مطور + PWA + QA + AI)</option>
            <option value="architect">مهندس المعمارية والتخطيط (System Architect)</option>
            <option value="fullstack">مطور الواجهات ومنتج الأكواد (Full-Stack)</option>
            <option value="pwa">خبير الأداء والعمل بدون إنترنت (PWA Specialist)</option>
            <option value="qa">خبير اختبار واكتشاف الأخطاء (Debugger &amp; QA)</option>
            <option value="ai_personas">خبير الذكاء الاصطناعي ومراقبة الشخصيات</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:7px;">
          <label>اطلب تشخيص مشكلة أو اقتراح تطوير أو مقطع كود:</label>
          <textarea id="admArchPromptInput" class="form-control" rows="3" style="font-size:11px;" placeholder="مثال: اقترح تحسيناً لغرفة الشيف الذهبي أو حلل أخطاء الجلسة واكتب مقطع الكود المناسب..."></textarea>
        </div>

        <button type="button" id="admArchAskBtn" onclick="window._admArchConsultAI()" class="btn" style="background:linear-gradient(45deg,#38bdf8,#d4af37); color:#000; font-size:11px; margin-bottom:8px;">تحليل وتوليد مقترحات</button>

        <div id="admArchAdviceBox"></div>
      </div>

      <div class="adm-sec" style="border-color:rgba(245,158,11,0.5); margin-top:10px;">
        <div class="adm-sec-title"><span>سجل المراقبة والأخطاء الحية للتطبيق</span></div>
        <div id="admArchLogsBox" style="max-height:175px; overflow-y:auto;"></div>
      </div>
    `;
    adminContent.appendChild(tabDiv);
    renderLogsList();
    if (lastAdvice) renderAdviceResult(lastAdvice);
  }

  function initAdminArchitect() {
    mountAdminArchitectTab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initAdminArchitect, 150));
  } else {
    setTimeout(initAdminArchitect, 150);
  }

  const _origRenderStoreArch = window.renderStore;
  window.renderStore = function () {
    if (typeof _origRenderStoreArch === "function") _origRenderStoreArch();
    setTimeout(initAdminArchitect, 90);
  };
  

  window.MoaathAdminArchitect = {
    name: "الحكيم التقني",
    version: "1.0-admin-general-monitor",
    log: pushLog,
    getTelemetry: collectSystemTelemetry
  };

  const PERSONA_STATS_KEY = "moaath_persona_usage_stats_v1";
  let manifestClipsByPersona = {};
  let cachedAudioFilesSet = new Set();

  function loadPersonaUsageStats() {
    try {
      const d = JSON.parse(localStorage.getItem(PERSONA_STATS_KEY) || "{}");
      return d && typeof d === "object" ? d : {};
    } catch (_) {
      return {};
    }
  }

  function savePersonaUsageStats(st) {
    try { localStorage.setItem(PERSONA_STATS_KEY, JSON.stringify(st)); } catch (_) {}
  }

  function recordPersonaActivation(pid) {
    const cleanId = String(pid || "").trim();
    if (!cleanId) return;
    const st = loadPersonaUsageStats();
    const cur = st[cleanId] || { activations: 0, lastUsedAt: "" };
    cur.activations = (parseInt(cur.activations, 10) || 0) + 1;
    cur.lastUsedAt = new Date().toLocaleTimeString("ar-SY");
    st[cleanId] = cur;
    savePersonaUsageStats(st);
  }

  function hookPersonaUsageTracking() {
    if (typeof window.selectPetPersona === "function" && !window.selectPetPersona.__moaathArchTracked) {
      const origSel = window.selectPetPersona;
      const wrappedSel = function (key) {
        recordPersonaActivation(key);
        return origSel.apply(this, arguments);
      };
      wrappedSel.__moaathArchTracked = true;
      window.selectPetPersona = wrappedSel;
    }

    if (window.MoaathVIPRooms && typeof window.MoaathVIPRooms.open === "function" && !window.MoaathVIPRooms.open.__moaathArchTracked) {
      const origOpen = window.MoaathVIPRooms.open;
      const wrappedOpen = function (roomId) {
        recordPersonaActivation(roomId);
        return origOpen.apply(this, arguments);
      };
      wrappedOpen.__moaathArchTracked = true;
      window.MoaathVIPRooms.open = wrappedOpen;
    }
  }

  async function refreshPersonaAudioInventory() {
    manifestClipsByPersona = {};
    cachedAudioFilesSet = new Set();

    let mfData = null;
    try {
      const cachedMf = JSON.parse(localStorage.getItem("moaath_gemini_manifest_cache_v1") || "null");
      if (cachedMf && cachedMf.personas) mfData = cachedMf;
    } catch (_) {}

    if (navigator.onLine !== false) {
      try {
        const res = await fetch(`sounds_gemini_manifest.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" });
        if (res.ok) {
          const d = await res.json();
          if (d && d.personas) {
            mfData = d;
            try { localStorage.setItem("moaath_gemini_manifest_cache_v1", JSON.stringify(d)); } catch (_) {}
          }
        }
      } catch (_) {}
    }

    if (mfData && mfData.personas) {
      Object.keys(mfData.personas).forEach((pid) => {
        let total = 0;
        Object.values(mfData.personas[pid] || {}).forEach((arr) => {
          if (Array.isArray(arr)) total += arr.filter((x) => x && x.file).length;
        });
        manifestClipsByPersona[pid] = total;
      });
    }

    if (typeof caches !== "undefined") {
      try {
        const cache = await caches.open("moaath_store_tts_gemini_v1");
        const keys = await cache.keys();
        keys.forEach((req) => {
          const u = String(req.url || "");
          cachedAudioFilesSet.add(u);
          const pathOnly = u.split("?")[0].split("/").slice(-2).join("/");
          if (pathOnly) cachedAudioFilesSet.add(pathOnly);
        });
      } catch (_) {}
    }
  }

  function buildAllPersonasAnalytics() {
    const baseMap = (window.MoaathAIPersonas && window.MoaathAIPersonas.PERSONAS) || {};
    const vipMap = (window.MoaathVIPSystem && window.MoaathVIPSystem.personas) || {};
    const combined = {};

    Object.keys(baseMap).forEach((k) => {
      const p = baseMap[k];
      if (!p) return;
      combined[k] = {
        id: k,
        name: p.name || k,
        tier: p.isVip ? "VIP" : "أساسية",
        voiceName: p.voiceName || "-"
      };
    });

    Object.keys(vipMap).forEach((k) => {
      const vp = vipMap[k];
      if (!vp) return;
      combined[k] = {
        id: k,
        name: vp.name || k,
        tier: "VIP",
        voiceName: vp.voiceName || combined[k]?.voiceName || "-"
      };
    });

    // Ensure known 9 VIP + 9 standard IDs appear cleanly even before lazy load
    const knownVIP = [
      ["coach_sakhr", "كابتن صخر", "Fenrir"],
      ["grand_chef", "الشيف الذهبي", "Charon"],
      ["princess_layla", "الأميرة ليلى", "Aoede"],
      ["butler_farid", "السيد فريد", "Orus"],
      ["friend_fadi", "فادي الفرفوش", "Puck"],
      ["anime_zain", "كابتن زين", "Puck"],
      ["anime_ryu", "المحقق ريو", "Charon"],
      ["anime_ritaj", "ريتاج", "Kore"],
      ["friend_saad", "سعد", "Orus"]
    ];
    knownVIP.forEach(([id, nm, vn]) => {
      if (!combined[id]) combined[id] = { id, name: nm, tier: "VIP", voiceName: vn };
      else combined[id].tier = "VIP";
    });

    const usageMap = loadPersonaUsageStats();
    const brainTopPersonas = (window.MoaathAIBrain && typeof window.MoaathAIBrain.getProfileSummary === "function")
      ? (window.MoaathAIBrain.getProfileSummary()?.topPersonas || {})
      : {};

    let activePrefPersona = "";
    try {
      activePrefPersona = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}").persona || "";
    } catch (_) {}

    const rows = Object.values(combined).map((item) => {
      const clipsCount = manifestClipsByPersona[item.id] || 0;
      const localUsage = parseInt(usageMap[item.id]?.activations, 10) || 0;
      const brainUsage = parseInt(brainTopPersonas[item.id], 10) || 0;
      const totalUses = localUsage + brainUsage + (activePrefPersona === item.id ? 1 : 0);
      const isCached = Array.from(cachedAudioFilesSet).some((u) => u.includes(`/${item.id}_`) || u.includes(`::${item.id}::`));
      const readinessPct = clipsCount >= 15 ? 100 : (clipsCount > 0 ? Math.min(95, Math.round((clipsCount / 15) * 100)) : (isCached ? 60 : 35));
      return {
        ...item,
        clipsCount,
        totalUses,
        isCached,
        readinessPct,
        lastUsedAt: usageMap[item.id]?.lastUsedAt || "-"
      };
    });

    rows.sort((a, b) => (b.totalUses - a.totalUses) || (b.clipsCount - a.clipsCount));
    const vipRows = rows.filter((r) => r.tier === "VIP");
    const stdRows = rows.filter((r) => r.tier !== "VIP");
    const totalClips = rows.reduce((acc, r) => acc + r.clipsCount, 0);
    const totalUses = rows.reduce((acc, r) => acc + r.totalUses, 0);
    const mostUsed = rows[0] || null;

    return {
      rows,
      vipCount: vipRows.length,
      stdCount: stdRows.length,
      totalPersonas: rows.length,
      totalClips,
      totalUses,
      mostUsed
    };
  }

  window._admArchRenderPersonaAnalytics = async function () {
    const box = document.getElementById("admArchPersonasStatsBox");
    if (!box) return;
    await refreshPersonaAudioInventory();
    const stats = buildAllPersonasAnalytics();

    const summaryBar = `
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin-bottom:8px; text-align:center; font-size:10px;">
        <div style="background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.35); border-radius:8px; padding:5px;">
          <div style="color:var(--gray-text);">إجمالي الشخصيات</div>
          <b style="color:#D4AF37; font-size:12px;">${stats.totalPersonas}</b> <span style="font-size:9px;">(${stats.vipCount} VIP)</span>
        </div>
        <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); border-radius:8px; padding:5px;">
          <div style="color:var(--gray-text);">مقاطع الفهرس</div>
          <b style="color:#10b981; font-size:12px;">${stats.totalClips}</b>
        </div>
        <div style="background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.35); border-radius:8px; padding:5px;">
          <div style="color:var(--gray-text);">إجمالي التفاعلات</div>
          <b style="color:#38bdf8; font-size:12px;">${stats.totalUses}</b>
        </div>
      </div>
      ${stats.mostUsed ? `<div style="font-size:10px; color:#fbbf24; margin-bottom:6px;">🏆 الأكثر تفاعلاً حالياً: <b>${escHtml(stats.mostUsed.name)}</b> (${stats.mostUsed.totalUses} تفاعل • ${stats.mostUsed.clipsCount} صوت)</div>` : ""}
    `;

    const listHtml = stats.rows.map((r) => {
      const tierBadge = r.tier === "VIP"
        ? `<span style="background:rgba(212,175,55,0.2); color:#D4AF37; padding:1px 5px; border-radius:5px; font-size:9px; font-weight:800;">VIP</span>`
        : `<span style="background:rgba(148,163,184,0.16); color:#cbd5e1; padding:1px 5px; border-radius:5px; font-size:9px;">أساسية</span>`;
      const rColor = r.readinessPct >= 80 ? "#10b981" : (r.readinessPct >= 50 ? "#fbbf24" : "#94a3b8");
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; padding:5px 6px; border-bottom:1px dashed var(--border-color); font-size:10px;">
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:4px; font-weight:800; color:var(--text-color);">
              <span>${escHtml(r.name)}</span>
              ${tierBadge}
            </div>
            <div style="font-size:9px; color:var(--gray-text);">
              صوت: <b>${escHtml(r.voiceName)}</b> • مقاطع: <b style="color:#10b981;">${r.clipsCount}</b> • استخدام: <b style="color:#38bdf8;">${r.totalUses}</b>${r.isCached ? " • 💾 مخزّن" : ""}
            </div>
          </div>
          <div style="text-align:left; flex-shrink:0;">
            <span style="color:${rColor}; font-weight:900; font-size:10.5px;">${r.readinessPct}%</span>
            <div style="font-size:8.5px; color:var(--gray-text);">جاهزية</div>
          </div>
        </div>
      `;
    }).join("");

    box.innerHTML = `${summaryBar}<div style="max-height:210px; overflow-y:auto;">${listHtml}</div>`;
  };

  const _origMountArch = mountAdminArchitectTab;
  mountAdminArchitectTab = function () {
    _origMountArch();
    const sec = document.getElementById("admTab15Architect");
    if (sec && !document.getElementById("admArchPersonasStatsCard")) {
      const pCard = document.createElement("div");
      pCard.id = "admArchPersonasStatsCard";
      pCard.className = "adm-sec";
      pCard.style.cssText = "border-color:#a855f7; margin-top:10px;";
      pCard.innerHTML = `
        <div class="adm-sec-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#c084fc;">📊 إحصائيات الشخصيات (الأصوات، الاستخدام، والجاهزية)</span>
          <button type="button" onclick="window._admArchRenderPersonaAnalytics()" class="btn" style="width:auto; padding:2px 8px; font-size:9.5px; background:rgba(192,132,252,0.18); color:#d8b4fe; border:1px solid #c084fc;">تحديث</button>
        </div>
        <div id="admArchPersonasStatsBox" style="font-size:10px;">جاري تحميل إحصائيات الشخصيات...</div>
      `;
      sec.appendChild(pCard);
      window._admArchRenderPersonaAnalytics();
    }
  };

  hookPersonaUsageTracking();
  setTimeout(hookPersonaUsageTracking, 1500);
  setTimeout(() => { if (document.getElementById("admArchPersonasStatsBox")) window._admArchRenderPersonaAnalytics(); }, 1800);

})();

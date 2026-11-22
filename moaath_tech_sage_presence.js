// ============================================================================
// الحضور المرئي المتحدث والمتطور لـ «الحكيم التقني» داخل لوحة الإدارة
// (moaath_tech_sage_presence.js — v2.0 Executive Buddy Edition)
// - حضور مرئي دائم في جميع تبويبات الإدارة (#adminModal) مع نبض ذكي حسب حالة المتجر
// - موجز الصباح والمساء الودي + 3 أوضاع (🤝 صديق | ⚡ تنفيذي | 🛠️ تقني)
// - قائمة مهام وملاحظات تفاعلية قابلة للشطب (☑️) + حقن الذاكرة في استشارات worker.js
// - تنقل صوتي وكتابي فوري بين تبويبات الإدارة («افتح المنتجات / الطلبات / التصدير...»)
// - رادار النواقص وتجميع الطلبات حسب المنطقة وفكرة تطوير يومية (0 حصة API)
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_TECH_SAGE_V2__) return;
  window.__MOAATH_TECH_SAGE_V2__ = true;
  window.__MOAATH_TECH_SAGE_V1__ = true;

  const MEMORY_KEY = "moaath_tech_sage_evolution_v2";
  const LEGACY_KEY = "moaath_tech_sage_evolution_v1";

  let isDrawerOpen = false;
  let isListening = false;
  let activeRec = null;
  let sageAudio = null;
  let showTasksPane = false;

  const DAILY_IDEAS = [
    "جرّب إنشاء عرض خاص يجمع (متة + بزر أو بسكويت) لزيادة مبيعات السهرة المسائية.",
    "راجع الأصناف التي وصلت للحد الأدنى اليوم وجهّز طلبية المورّد قبل نفادها الكامل.",
    "شغّل «توليد مرادفات البحث» للمنتجات الجديدة لتسريع وصول الزبائن إليها عند البحث.",
    "اجمع طلبات المناطق القريبة في جولة توصيل واحدة لتوفير الوقت والوقود.",
    "تفقّد الأصناف قليلة الحركة واقترح عليها تخفيضاً بسيطاً في قسم العروض الخاصة.",
    "احفظ أهم مهامك الصباحية هنا بكتابة «تذكر ...» لأذكّرك بها فور فتح الإدارة."
  ];

  const MODES = {
    buddy: { id: "buddy", label: "🤝 صديق", focusRole: "all", tone: "ودود ومحفّز وواقعي" },
    exec: { id: "exec", label: "⚡ تنفيذي", focusRole: "System Architect", tone: "مختصر ومركز على الأرقام والقرارات" },
    tech: { id: "tech", label: "🛠️ تقني", focusRole: "Full-Stack", tone: "تقني ومعماري دقيق" }
  };

  const escHtml = (s) =>
    typeof window.moaathEscapeHtml === "function"
      ? window.moaathEscapeHtml(s)
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

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

  function loadMemory() {
    const fallback = {
      xp: 15,
      interactions: 0,
      voiceEnabled: true,
      mode: "buddy",
      notes: [], // { id, text, done, date }
      lastTopic: "",
      lastBriefDate: ""
    };
    const v2 = readStorage(MEMORY_KEY, null);
    if (v2 && typeof v2 === "object") {
      return Object.assign(fallback, v2);
    }
    // ترحيل سلس من ذاكرة v1 إن وجدت
    const v1 = readStorage(LEGACY_KEY, null);
    if (v1 && typeof v1 === "object") {
      const migratedNotes = Array.isArray(v1.notes)
        ? v1.notes.map((n, idx) => ({
            id: "T_" + Date.now() + "_" + idx,
            text: typeof n === "string" ? n : (n?.text || ""),
            done: !!(n && n.done),
            date: (n && n.date) || new Date().toLocaleDateString("ar-SY")
          })).filter((x) => x.text)
        : [];
      const merged = Object.assign(fallback, v1, { notes: migratedNotes });
      writeStorage(MEMORY_KEY, merged);
      return merged;
    }
    return fallback;
  }

  function saveMemory(mem) {
    writeStorage(MEMORY_KEY, mem);
  }

  function getEvolutionRank(xp) {
    const lvl = Math.floor((xp || 0) / 50) + 1;
    if (lvl >= 6) return { lvl, title: "شريك إداري ومعماري خبير" };
    if (lvl >= 4) return { lvl, title: "مستشار إداري متقدم" };
    if (lvl >= 2) return { lvl, title: "صديق ومراقب متطور" };
    return { lvl, title: "حكيم تقني نشط" };
  }

  function gainSageXP(amount = 5, topic = "") {
    const mem = loadMemory();
    mem.xp = (mem.xp || 0) + amount;
    mem.interactions = (mem.interactions || 0) + 1;
    if (topic) mem.lastTopic = topic;
    saveMemory(mem);
    syncSageUI();
  }

  function resolveWorkerUrl() {
    try {
      if (typeof window.getEffectiveAIWorkerUrl === "function") {
        const u = String(window.getEffectiveAIWorkerUrl() || "").trim();
        if (u) return u;
      }
    } catch (_) {}
    return String(
      window.AI_WORKER_URL ||
      window.WORKER_URL ||
      localStorage.getItem("moaath_ai_worker_url") ||
      ""
    ).trim();
  }

  function isFinancialRestricted(txt) {
    return /شام\s*كاش|شامكاش|دفع|إيصال|ايصال|تحويل|رصيد\s*دفع|shamcash|payment/i.test(String(txt || ""));
  }

  // ==========================================================================
  // [محرك النطق الخاص بالحكيم التقني]
  // ==========================================================================
  function stopSageVoice() {
    try { if (typeof window.speechSynthesis !== "undefined") window.speechSynthesis.cancel(); } catch (_) {}
    if (sageAudio) {
      try { sageAudio.pause(); sageAudio.currentTime = 0; } catch (_) {}
    }
  }

  function speakSageLocal(text) {
    if (typeof window.speechSynthesis === "undefined" || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      u.rate = 1.12;
      u.pitch = 0.94;
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const arV = voices.find((v) => /ar/i.test(v.lang || ""));
      if (arV) u.voice = arV;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  async function speakSage(rawText, force = false) {
    const mem = loadMemory();
    if (!mem.voiceEnabled && !force) return;
    const clean = String(rawText || "")
      .replace(/[\u{1F300}-\u{1FAFF}•|✅⚠️🛡️🧠📊📦📝🤝⚡🛠️🚚]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 210);
    if (!clean) return;

    stopSageVoice();
    const workerUrl = resolveWorkerUrl();
    if (!workerUrl || navigator.onLine === false) {
      speakSageLocal(clean);
      return;
    }

    const modeObj = MODES[mem.mode] || MODES.buddy;
    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tts",
          text: clean,
          voiceName: "Charon",
          gender: "male",
          toneTag: modeObj.tone,
          dialectMode: mem.mode === "buddy" ? "shami_friendly" : "fusha_simple",
          pitchSemitones: -1.2
        })
      });
      const json = await res.json();
      if (res.ok && json?.ok && json?.audioBase64) {
        const mime = /pcm|L16/i.test(json.mimeType || "") ? "audio/wav" : (json.mimeType || "audio/mpeg");
        if (!sageAudio) {
          sageAudio = new Audio();
          sageAudio.playsInline = true;
        }
        if (mime === "audio/mpeg") {
          sageAudio.src = `data:${mime};base64,${json.audioBase64}`;
          sageAudio.playbackRate = 1.18;
          sageAudio.play().catch(() => speakSageLocal(clean));
          return;
        }
      }
      speakSageLocal(clean);
    } catch (_) {
      speakSageLocal(clean);
    }
  }

  // ==========================================================================
  // [تحليل حالة المتجر الحية + تجميع المناطق (0 حصة API)]
  // ==========================================================================
  function getLiveAdminTelemetry() {
    const prods = (typeof window.products === "object" && window.products) ? Object.values(window.products) : [];
    const lowStock = prods.filter((p) => {
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      return st <= (parseInt(p.alertLimit, 10) || 2);
    });

    const pending = Object.values(window.pendingOrders || {});
    const ready = Object.values(window.readyOrders || {});
    const dispatched = Object.values(window.dispatchedOrders || {});
    const allActive = [...pending, ...ready, ...dispatched];

    const byRegion = {};
    allActive.forEach((o) => {
      const reg = String(o?.region || "غير محدد").trim();
      byRegion[reg] = (byRegion[reg] || 0) + 1;
    });

    const mem = loadMemory();
    const openTasks = (mem.notes || []).filter((n) => !n.done);
    const reg = window.MoaathSystemRegistry?.getStatus ? window.MoaathSystemRegistry.getStatus() : null;

    return {
      productsCount: prods.length,
      lowStockCount: lowStock.length,
      lowStockNames: lowStock.slice(0, 5).map((p) => p.name),
      activeOrders: allActive.length,
      pendingCount: pending.length,
      readyCount: ready.length,
      dispatchedCount: dispatched.length,
      ordersByRegion: byRegion,
      openTasksCount: openTasks.length,
      openTasks: openTasks.slice(0, 6).map((t) => t.text),
      healthScore: reg ? reg.healthScore : 100,
      online: navigator.onLine !== false
    };
  }

  // ==========================================================================
  // [التنقل الصوتي والكتابي بين تبويبات الإدارة]
  // ==========================================================================
  function tryNavigateAdminTab(normTxt) {
    if (!/(افتح|انتقل|روح|اعرض|وديني)/.test(normTxt)) return null;
    const tabsBar = document.querySelector("#adminModal .modal-content .categories");
    if (!tabsBar) return null;

    const targetPhrase = normTxt
      .replace(/^(افتح|انتقل|روح|اعرض|وديني)\s*(تبويب|قسم|صفحه|قائمه)?\s*/, "")
      .trim();
    if (!targetPhrase || targetPhrase.length < 2) return null;

    const btns = Array.from(tabsBar.querySelectorAll(".cat-btn, button"));
    const match = btns.find((b) => {
      const label = normAr(b.textContent || "");
      return label && (label.includes(targetPhrase) || targetPhrase.includes(label));
    });

    if (match) {
      match.click();
      return String(match.textContent || "").trim();
    }
    return null;
  }

  function appendSageMessage(role, text) {
    const log = document.getElementById("moaathSageChatLog");
    if (!log) return;
    const bubble = document.createElement("div");
    bubble.style.cssText =
      role === "user"
        ? "align-self:flex-start; background:rgba(56,189,248,0.16); border:1px solid rgba(56,189,248,0.4); color:#e2e8f0; padding:6px 9px; border-radius:10px; max-width:88%; font-size:10.5px;"
        : "align-self:flex-end; background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.45); color:#f8fafc; padding:6px 9px; border-radius:10px; max-width:94%; font-size:10.5px; line-height:1.55;";
    bubble.innerHTML = escHtml(text).replace(/\n/g, "<br>");
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function buildExecutiveGreeting(t, mem) {
    const h = new Date().getHours();
    const isMorning = h >= 5 && h < 12;
    const isEvening = h >= 18 || h < 5;
    const taskPart = t.openTasksCount > 0 ? ` وعندك ${t.openTasksCount} مهام محفوظة بانتظارك.` : "";

    if (mem.mode === "exec") {
      return `موجز فوري: ${t.activeOrders} طلبات نشطة | ${t.lowStockCount} نواقص | صحة النظام ${t.healthScore}%${taskPart}`;
    }
    if (isMorning) {
      return `صباح الخير والرزق يا معاذ! ☀️ عندنا اليوم ${t.activeOrders} طلبات نشطة و${t.lowStockCount} نواقص بالمخزن${taskPart} بشو نبدأ؟`;
    }
    if (isEvening) {
      return `يعطيك ألف عافية يا معاذ! 🌙 مع نهاية اليوم عندك ${t.activeOrders} طلبات نشطة و${t.lowStockCount} نواقص للتوريد القادم${taskPart} جاهز نرتّب أمورك؟`;
    }
    return `أهلاً يا معاذ! متجرك بصحة ${t.healthScore}%، وفيه ${t.activeOrders} طلبات نشطة و${t.lowStockCount} نواقص${taskPart} كيف أساعدك الآن؟`;
  }

  // ==========================================================================
  // [معالج أوامر ومهام ودردشة الحكيم التقني]
  // ==========================================================================
  async function handleSagePrompt(rawInput) {
    const txt = String(rawInput || "").trim();
    if (!txt) return;

    appendSageMessage("user", txt);
    const inp = document.getElementById("moaathSageInput");
    if (inp) inp.value = "";

    if (isFinancialRestricted(txt)) {
      const msg = "التحقق من الدفع وشام كاش معزول أمنياً عن الذكاء الاصطناعي ويتم يدوياً بالكامل.";
      appendSageMessage("sage", "🔒 " + msg);
      speakSage(msg);
      return;
    }

    const norm = normAr(txt);
    const mem = loadMemory();
    const t = getLiveAdminTelemetry();

    // 1) التنقل الصوتي/الكتابي بين تبويبات الإدارة
    const openedTab = tryNavigateAdminTab(norm);
    if (openedTab) {
      gainSageXP(6, "تنقل بين التبويبات");
      const msg = `فتحت لك تبويب «${openedTab}» مباشرة يا معاذ.`;
      appendSageMessage("sage", "🧭 " + msg);
      speakSage(msg);
      return;
    }

    // 2) إضافة مهمة أو ملاحظة في قائمة المهام
    if (/^(تذكر|احفظ ملاحظه|سجل ملاحظه|ملاحظه|اضف مهمه|مهمه)\s+(.+)/.test(norm)) {
      const note = txt.replace(/^(تذكر|احفظ\s*ملاحظة|احفظ\s*ملاحظه|سجل\s*ملاحظة|سجل\s*ملاحظه|ملاحظة|ملاحظه|أضف\s*مهمة|اضف\s*مهمه|مهمة|مهمه)\s+/i, "").trim();
      if (note) {
        addTaskNote(note);
        const msg = `سجّلتها في مهامك يا معاذ: «${note}»، ورح أتذكرها دائماً باستشاراتنا.`;
        appendSageMessage("sage", "📝 " + msg);
        speakSage(msg);
        return;
      }
    }

    // 3) تجميع التوصيل حسب المناطق
    if (/(توصيل|مناطق|رحله|توزيع)/.test(norm)) {
      gainSageXP(8, "تنظيم التوصيل");
      const entries = Object.entries(t.ordersByRegion);
      const msg = entries.length
        ? `توزيع الطلبات النشطة حسب المنطقة:\n${entries.map(([r, c]) => `• ${r}: ${c} طلب`).join("\n")}\nابدأ بالمنطقة الأكثر طلباً توفيراً للوقت والوقود.`
        : "لا توجد طلبات نشطة تحتاج لتوزيع حالياً.";
      appendSageMessage("sage", "🚚 " + msg);
      speakSage(entries.length ? `لديك طلبات في ${entries.length} مناطق، رتّبتها لك الآن.` : msg);
      return;
    }

    // 4) فكرة تطوير يومية
    if (/(فكره|تطوير|اقترح|تحسين)/.test(norm) && txt.length < 35) {
      gainSageXP(8, "فكرة يومية");
      const idea = DAILY_IDEAS[new Date().getDate() % DAILY_IDEAS.length];
      appendSageMessage("sage", "💡 فكرة اليوم لك يا معاذ:\n" + idea);
      speakSage(idea);
      return;
    }

    // 5) ملخص اليوم / وضع المتجر
    if (/(ملخص|تقرير|وضع المتجر|حاله المتجر|اخبار اليوم)/.test(norm)) {
      gainSageXP(8, "ملخص إداري");
      const msg = buildExecutiveGreeting(t, mem);
      appendSageMessage("sage", "📊 " + msg);
      speakSage(msg);
      return;
    }

    // 6) فحص النواقص وتجهيز طلبية الموردين
    if (/(نواقص|ناقص|مورد|توريد|المخزون)/.test(norm)) {
      gainSageXP(8, "فحص النواقص");
      const names = t.lowStockNames.length ? `\nأبرزها: ${t.lowStockNames.join("، ")}` : "";
      const msg = t.lowStockCount
        ? `يوجد ${t.lowStockCount} أصناف وصلت للحد الأدنى${names}.`
        : "المخزون ممتاز حالياً ولا توجد نواقص حرجة.";
      appendSageMessage("sage", "⚠️ " + msg);
      speakSage(msg);
      if (typeof window.exportLowStockShortageList === "function" && /صدر|انسخ|مورد/.test(norm)) {
        window.exportLowStockShortageList();
      }
      return;
    }

    // 7) فحص QA الشامل
    if (/(فحص|صحه|جوده|qa)/.test(norm)) {
      gainSageXP(10, "فحص QA");
      if (typeof window.openMoaathQAModal === "function") window.openMoaathQAModal();
      const msg = `فتحت لك لوحة الفحص الشامل، مؤشر الصحة الحالي ${t.healthScore}%.`;
      appendSageMessage("sage", "🛡️ " + msg);
      speakSage(msg);
      return;
    }

    // 8) توليد مرادفات البحث للمخزن
    if (/(مرادفات|بحث)/.test(norm)) {
      gainSageXP(10, "توليد مرادفات");
      if (window.MoaathInventoryGuard?.generateMissingSynonymsBatch) {
        appendSageMessage("sage", "🧠 جاري فحص المخزن وتوليد مرادفات البحث للمنتجات الناقصة...");
        const res = await window.MoaathInventoryGuard.generateMissingSynonymsBatch();
        const msg = `تم توليد مرادفات البحث لـ ${res.processed} منتجاً لتسهيل البحث على الزبائن.`;
        appendSageMessage("sage", "✅ " + msg);
        speakSage(msg);
        return;
      }
    }

    // 9) دردشة ودية وتحفيزية للمدير (وضع الصديق)
    if (/(تعبان|ضغط|شغل كثير|مرهق|محتار|شو رايك)/.test(norm) && txt.length < 45) {
      gainSageXP(6, "دعم معنوي");
      const msg = "يعطيك ألف عافية يا معاذ! إدارة المتجر والتطوير معاً مجهود كبير، خذ استراحة قصيرة وخلينا نرتّب الأولويات خطوة بخطوة: نبدأ بالأهم ثم الأسهل.";
      appendSageMessage("sage", "🤝 " + msg);
      speakSage(msg);
      return;
    }

    // 10) استشارة سحابية ذكية مع حقن ذاكرة المدير وملاحظاته تلقائياً
    const workerUrl = resolveWorkerUrl();
    if (workerUrl && navigator.onLine !== false) {
      appendSageMessage("sage", "⏳ جاري التحليل وتوظيف ذاكرتك الإدارية...");
      const modeObj = MODES[mem.mode] || MODES.buddy;
      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "admin_architect",
            focusRole: modeObj.focusRole,
            request: `[الأسلوب المطلوب: ${modeObj.tone}] ${txt}`,
            telemetry: {
              ...t,
              managerMode: mem.mode,
              lastTopic: mem.lastTopic || "",
              savedManagerNotes: t.openTasks
            }
          })
        });
        const json = await res.json();
        if (res.ok && json?.ok && json?.data?.summary) {
          gainSageXP(12, "استشارة سحابية");
          const summary = String(json.data.summary);
          const recs = Array.isArray(json.data.recommendations)
            ? json.data.recommendations.slice(0, 3).map((r) => `• ${r.role || "توصية"}: ${r.detail || ""}`).join("\n")
            : "";
          const fullReply = recs ? `${summary}\n${recs}` : summary;
          appendSageMessage("sage", "🧙‍♂️ " + fullReply);
          speakSage(summary);
          return;
        }
      } catch (_) {}
    }

    gainSageXP(5, "رد محلي");
    const offlineMsg = `أنا معك يا معاذ (وضع محلي سريع)! لديك ${t.activeOrders} طلبات نشطة و${t.lowStockCount} نواقص. جرّب: «ملخص اليوم»، «تنظيم التوصيل»، «افتح الطلبات»، أو «فكرة اليوم».`;
    appendSageMessage("sage", "🧙‍♂️ " + offlineMsg);
    speakSage(offlineMsg);
  }

  // ==========================================================================
  // [إدارة قائمة المهام والملاحظات القابلة للشطب]
  // ==========================================================================
  function addTaskNote(text) {
    const clean = String(text || "").trim().slice(0, 120);
    if (!clean || isFinancialRestricted(clean)) return;
    const mem = loadMemory();
    mem.notes = Array.isArray(mem.notes) ? mem.notes : [];
    mem.notes.unshift({
      id: "T_" + Date.now() + "_" + Math.floor(Math.random() * 999),
      text: clean,
      done: false,
      date: new Date().toLocaleDateString("ar-SY")
    });
    mem.notes = mem.notes.slice(0, 15);
    saveMemory(mem);
    gainSageXP(8, "مهمة إدارية");
    renderTasksPane();
  }

  function renderTasksPane() {
    const pane = document.getElementById("moaathSageTasksPane");
    if (!pane) return;
    pane.style.display = showTasksPane ? "block" : "none";
    if (!showTasksPane) return;

    const mem = loadMemory();
    const notes = Array.isArray(mem.notes) ? mem.notes : [];
    pane.innerHTML = `
      <div style="display:flex; gap:4px; margin-bottom:6px;">
        <input id="moaathSageNewTaskInp" type="text" placeholder="أضف مهمة أو تذكيراً سريعاً..." style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(212,175,55,0.35); border-radius:8px; padding:4px 7px; color:#fff; font-size:10px; outline:none;">
        <button type="button" id="moaathSageAddTaskBtn" style="background:#D4AF37; color:#000; border:none; border-radius:8px; padding:4px 8px; font-size:10px; font-weight:900; cursor:pointer;">+</button>
      </div>
      <div style="max-height:110px; overflow-y:auto;">
        ${notes.length ? notes.map((n) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:5px; padding:3px 0; border-bottom:1px dashed rgba(255,255,255,0.1); font-size:10px;">
            <button type="button" onclick="window.MoaathTechSage.toggleTask('${n.id}')" style="background:none; border:none; color:${n.done ? "#94a3b8" : "#f8fafc"}; text-decoration:${n.done ? "line-through" : "none"}; text-align:right; cursor:pointer; padding:0; flex:1;">
              ${n.done ? "☑️" : "⬜"} ${escHtml(n.text)}
            </button>
            <button type="button" onclick="window.MoaathTechSage.deleteTask('${n.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:11px;">✕</button>
          </div>
        `).join("") : `<div style="font-size:10px; color:#94a3b8; text-align:center; padding:6px;">لا توجد مهام مسجلة حالياً — أضف مهمتك الأولى!</div>`}
      </div>
    `;

    const addBtn = document.getElementById("moaathSageAddTaskBtn");
    const inp = document.getElementById("moaathSageNewTaskInp");
    if (addBtn && inp) {
      addBtn.onclick = () => { if (inp.value.trim()) { addTaskNote(inp.value); inp.value = ""; } };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inp.value.trim()) { addTaskNote(inp.value); inp.value = ""; } });
    }
  }

  // ==========================================================================
  // [ميكروفون الحكيم التقني]
  // ==========================================================================
  function startSageVoiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (typeof window.showToast === "function") window.showToast("⚠️ الميكروفون غير مدعوم، اكتب أمرك مباشرة.");
      return;
    }
    if (isListening && activeRec) {
      try { activeRec.stop(); } catch (_) {}
      return;
    }
    stopSageVoice();
    isListening = true;
    const micBtn = document.getElementById("moaathSageMicBtn");
    if (micBtn) micBtn.style.background = "#ef4444";

    const rec = new SR();
    activeRec = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (heard) handleSagePrompt(heard);
    };
    rec.onend = () => {
      isListening = false;
      activeRec = null;
      if (micBtn) micBtn.style.background = "rgba(16,185,129,0.2)";
    };
    rec.start();
  }

  // ==========================================================================
  // [الواجهة والنبض الاستباقي الدائم داخل #adminModal]
  // ==========================================================================
  function injectSageStyles() {
    if (document.getElementById("moaathTechSageCSS")) return;
    const st = document.createElement("style");
    st.id = "moaathTechSageCSS";
    st.textContent = `
      @keyframes sageFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      @keyframes sagePulseWarn { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.65); } 50% { box-shadow: 0 0 0 9px rgba(245,158,11,0); } }
      @keyframes sagePulseOk { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } }
      #moaathTechSageDock { position: fixed; bottom: 16px; left: 14px; z-index: 10085; display: none; flex-direction: column; align-items: flex-start; gap: 8px; direction: rtl; }
      #moaathTechSageOrb { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #D4AF37; background: radial-gradient(circle at 30% 25%, #1e3a5f, #0f172a 75%); display: flex; align-items: center; justify-content: center; font-size: 26px; cursor: pointer; position: relative; animation: sageFloat 2.8s ease-in-out infinite; }
      #moaathTechSageOrb.pulse-warn { border-color: #f59e0b; animation: sageFloat 2.8s ease-in-out infinite, sagePulseWarn 1.8s infinite; }
      #moaathTechSageOrb.pulse-ok { border-color: #10b981; animation: sageFloat 2.8s ease-in-out infinite, sagePulseOk 2.4s infinite; }
      #moaathTechSageLvlBadge { position: absolute; top: -4px; right: -4px; background: #D4AF37; color: #000; font-size: 9px; font-weight: 900; padding: 1px 5px; border-radius: 999px; border: 1px solid #0f172a; }
      #moaathTechSageDrawer { display: none; width: min(345px, 92vw); background: linear-gradient(160deg, #0f172a, #111827); border: 1.5px solid #D4AF37; border-radius: 16px; padding: 10px; color: #f8fafc; box-shadow: 0 16px 40px rgba(0,0,0,0.75); }
      #moaathSageChatLog { display: flex; flex-direction: column; gap: 6px; max-height: 165px; overflow-y: auto; padding: 6px 2px; margin: 6px 0; }
      .moaath-sage-mode-btn { flex: 1; padding: 3px 5px; border-radius: 999px; font-size: 9.5px; font-weight: 800; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer; }
      .moaath-sage-mode-btn.is-active { background: rgba(212,175,55,0.22); border-color: #D4AF37; color: #D4AF37; }
    `;
    document.head.appendChild(st);
  }

  function syncSageUI() {
    const mem = loadMemory();
    const rank = getEvolutionRank(mem.xp);
    const t = getLiveAdminTelemetry();

    const b = document.getElementById("moaathTechSageLvlBadge");
    if (b) b.textContent = `L${rank.lvl}`;

    const sub = document.getElementById("moaathSageRankSub");
    if (sub) sub.textContent = `${rank.title} • ${mem.xp} XP • ${t.openTasksCount} مهام`;

    const orb = document.getElementById("moaathTechSageOrb");
    if (orb) {
      const needsAttention = t.lowStockCount > 0 || t.pendingCount > 0;
      orb.classList.toggle("pulse-warn", needsAttention);
      orb.classList.toggle("pulse-ok", !needsAttention);
    }

    document.querySelectorAll(".moaath-sage-mode-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mem.mode);
    });
  }

  function mountTechSageDock() {
    injectSageStyles();
    if (document.getElementById("moaathTechSageDock")) return;

    const mem = loadMemory();
    const rank = getEvolutionRank(mem.xp);
    const dock = document.createElement("div");
    dock.id = "moaathTechSageDock";
    dock.innerHTML = `
      <div id="moaathTechSageDrawer">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.28); padding-bottom:6px; margin-bottom:6px;">
          <div>
            <b style="color:#D4AF37; font-size:12px;">🧙‍♂️ الحكيم التقني (شريك الإدارة)</b>
            <div id="moaathSageRankSub" style="font-size:9.5px; color:#38bdf8;">${rank.title} • ${mem.xp} XP</div>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" id="moaathSageTasksBtn" title="قائمة المهام والملاحظات" style="background:rgba(212,175,55,0.16); color:#D4AF37; border:1px solid rgba(212,175,55,0.45); border-radius:999px; padding:2px 7px; font-size:10px; cursor:pointer;">📝 مهامي</button>
            <button type="button" id="moaathSageVoiceToggle" title="تفعيل/كتم الصوت" style="background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid #38bdf8; border-radius:999px; padding:2px 7px; font-size:10px; cursor:pointer;">${mem.voiceEnabled ? "🗣️" : "🔇"}</button>
            <button type="button" id="moaathSageCloseBtn" style="background:#ef4444; color:#fff; border:none; border-radius:999px; padding:2px 7px; font-size:10px; cursor:pointer;">✕</button>
          </div>
        </div>

        <!-- تبديل وضع الحكيم (صديق / تنفيذي / تقني) -->
        <div style="display:flex; gap:4px; margin-bottom:6px;">
          ${Object.values(MODES).map((m) => `
            <button type="button" class="moaath-sage-mode-btn ${mem.mode === m.id ? "is-active" : ""}" data-mode="${m.id}">${m.label}</button>
          `).join("")}
        </div>

        <!-- لوحة المهام القابلة للشطب -->
        <div id="moaathSageTasksPane" style="display:none; background:rgba(255,255,255,0.03); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:7px; margin-bottom:6px;"></div>

        <!-- اختصارات إدارية فورية -->
        <div style="display:flex; gap:4px; overflow-x:auto; padding:2px 0; scrollbar-width:none;">
          <button type="button" class="moaath-sage-chip" data-q="ملخص اليوم" style="flex-shrink:0; background:rgba(212,175,55,0.16); color:#D4AF37; border:1px solid rgba(212,175,55,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">📊 ملخص</button>
          <button type="button" class="moaath-sage-chip" data-q="تنظيم التوصيل" style="flex-shrink:0; background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">🚚 توصيل</button>
          <button type="button" class="moaath-sage-chip" data-q="فكرة اليوم" style="flex-shrink:0; background:rgba(244,114,182,0.16); color:#f472b6; border:1px solid rgba(244,114,182,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">💡 فكرة</button>
          <button type="button" class="moaath-sage-chip" data-q="فحص النواقص" style="flex-shrink:0; background:rgba(245,158,11,0.16); color:#f59e0b; border:1px solid rgba(245,158,11,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">⚠️ نواقص</button>
          <button type="button" class="moaath-sage-chip" data-q="فحص الصحة" style="flex-shrink:0; background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">🛡️ QA</button>
        </div>

        <div id="moaathSageChatLog"></div>

        <div style="display:flex; gap:5px; align-items:center;">
          <input id="moaathSageInput" type="text" placeholder="تحدث معي، أو قل «افتح الطلبات» أو «تذكر ...»" style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(212,175,55,0.38); border-radius:999px; padding:5px 10px; color:#fff; font-size:10.5px; outline:none;">
          <button type="button" id="moaathSageMicBtn" title="تحدّث" style="width:30px; height:30px; border-radius:50%; background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981; cursor:pointer;">🎙️</button>
          <button type="button" id="moaathSageSendBtn" style="background:linear-gradient(45deg,#D4AF37,#10b981); color:#000; border:none; border-radius:999px; padding:5px 10px; font-size:10.5px; font-weight:900; cursor:pointer;">إرسال</button>
        </div>
      </div>

      <button type="button" id="moaathTechSageOrb" title="الحكيم التقني — شريك الإدارة المتحدث">
        <span>🧙‍♂️</span>
        <span id="moaathTechSageLvlBadge">L${rank.lvl}</span>
      </button>
    `;
    document.body.appendChild(dock);

    const drawer = document.getElementById("moaathTechSageDrawer");
    const orb = document.getElementById("moaathTechSageOrb");
    const toggleDrawer = (force) => {
      isDrawerOpen = typeof force === "boolean" ? force : !isDrawerOpen;
      drawer.style.display = isDrawerOpen ? "block" : "none";
      if (isDrawerOpen && document.getElementById("moaathSageChatLog").children.length === 0) {
        const m = loadMemory();
        const t = getLiveAdminTelemetry();
        const greet = buildExecutiveGreeting(t, m);
        appendSageMessage("sage", "🧙‍♂️ " + greet);
        speakSage(greet);
      }
      syncSageUI();
    };

    orb.onclick = () => toggleDrawer();
    document.getElementById("moaathSageCloseBtn").onclick = () => toggleDrawer(false);
    document.getElementById("moaathSageMicBtn").onclick = startSageVoiceInput;
    document.getElementById("moaathSageSendBtn").onclick = () => handleSagePrompt(document.getElementById("moaathSageInput")?.value);
    document.getElementById("moaathSageInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSagePrompt(e.target.value);
    });

    document.getElementById("moaathSageTasksBtn").onclick = () => {
      showTasksPane = !showTasksPane;
      renderTasksPane();
    };

    document.getElementById("moaathSageVoiceToggle").onclick = function () {
      const m = loadMemory();
      m.voiceEnabled = !m.voiceEnabled;
      saveMemory(m);
      this.textContent = m.voiceEnabled ? "🗣️" : "🔇";
      if (!m.voiceEnabled) stopSageVoice();
    };

    dock.querySelectorAll(".moaath-sage-mode-btn").forEach((btn) => {
      btn.onclick = () => {
        const m = loadMemory();
        m.mode = btn.dataset.mode || "buddy";
        saveMemory(m);
        syncSageUI();
        const label = MODES[m.mode]?.label || "";
        appendSageMessage("sage", `✨ تم التحويل إلى وضع (${label}).`);
      };
    });

    dock.querySelectorAll(".moaath-sage-chip").forEach((ch) => {
      ch.onclick = () => handleSagePrompt(ch.dataset.q);
    });
  }

  function syncVisibilityWithAdminModal() {
    const adminModal = document.getElementById("adminModal");
    const dock = document.getElementById("moaathTechSageDock");
    if (!dock) return;
    const isAdminVisible = !!(
      adminModal &&
      adminModal.style.display !== "none" &&
      window.getComputedStyle(adminModal).display !== "none"
    );
    dock.style.display = isAdminVisible ? "flex" : "none";
    if (isAdminVisible) {
      syncSageUI();
    } else {
      isDrawerOpen = false;
      const drawer = document.getElementById("moaathTechSageDrawer");
      if (drawer) drawer.style.display = "none";
      stopSageVoice();
    }
  }

  window.MoaathTechSage = {
    version: "2.0",
    ask: handleSagePrompt,
    speak: speakSage,
    getMemory: loadMemory,
    addTask: addTaskNote,
    toggleTask(id) {
      const mem = loadMemory();
      mem.notes = (mem.notes || []).map((n) => (n.id === id ? { ...n, done: !n.done } : n));
      saveMemory(mem);
      renderTasksPane();
      syncSageUI();
    },
    deleteTask(id) {
      const mem = loadMemory();
      mem.notes = (mem.notes || []).filter((n) => n.id !== id);
      saveMemory(mem);
      renderTasksPane();
      syncSageUI();
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("tech_sage_presence", "2.0");
  }

  function startWatcher() {
    mountTechSageDock();
    syncVisibilityWithAdminModal();
    setInterval(syncVisibilityWithAdminModal, 550);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatcher);
  } else {
    startWatcher();
  }
})();

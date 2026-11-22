// ============================================================================
// الحضور المرئي المتحدث والمتطور لـ «الحكيم التقني» داخل لوحة الإدارة
// (moaath_tech_sage_presence.js — v1.0)
// - يظهر تلقائياً بمجرد فتح لوحة الإدارة (#adminModal) وفي جميع التبويبات
// - يتحدث بصوت واضح (Gemini TTS عبر worker.js أو نطق محلي فوري) + ميكروفون للأوامر
// - يتطور ذاتياً: يحفظ خبرته وملاحظات الإدارة وتفضيلاتك في localStorage (مستوى التطور + ذاكرة)
// - يساعدك إدارياً بأوامر فورية (0 حصة API): فحص الصحة، النواقص، ملخص الطلبات، مرادفات المخزن،
//   وتحليل سحابي معماري عبر worker.js (mode: "admin_architect")
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_TECH_SAGE_V1__) return;
  window.__MOAATH_TECH_SAGE_V1__ = true;

  const MEMORY_KEY = "moaath_tech_sage_evolution_v1";
  let isDrawerOpen = false;
  let isListening = false;
  let activeRec = null;
  let sageAudio = null;

  const escHtml = (s) =>
    typeof window.moaathEscapeHtml === "function"
      ? window.moaathEscapeHtml(s)
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

  function loadMemory() {
    const fallback = {
      xp: 10,
      interactions: 0,
      voiceEnabled: true,
      notes: [],
      lastTopic: "",
      lastBriefDate: ""
    };
    if (window.moaathSafeStorage) return Object.assign(fallback, window.moaathSafeStorage.getJSON(MEMORY_KEY, {}));
    try {
      return Object.assign(fallback, JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"));
    } catch (_) {
      return fallback;
    }
  }

  function saveMemory(mem) {
    if (window.moaathSafeStorage) {
      window.moaathSafeStorage.setJSON(MEMORY_KEY, mem);
      return;
    }
    try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch (_) {}
  }

  function getEvolutionRank(xp) {
    const lvl = Math.floor((xp || 0) / 50) + 1;
    if (lvl >= 6) return { lvl, title: "حكيم معماري خبير" };
    if (lvl >= 4) return { lvl, title: "مستشار إداري متقدم" };
    if (lvl >= 2) return { lvl, title: "مراقب ذكي متطور" };
    return { lvl, title: "حكيم تقني نشط" };
  }

  function gainSageXP(amount = 5, topic = "") {
    const mem = loadMemory();
    mem.xp = (mem.xp || 0) + amount;
    mem.interactions = (mem.interactions || 0) + 1;
    if (topic) mem.lastTopic = topic;
    saveMemory(mem);
    syncSageBadge();
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
  // [محرك النطق الخاص بالحكيم التقني — فصحى رصينة وواضحة]
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
      u.rate = 1.1;
      u.pitch = 0.92;
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
      .replace(/[\u{1F300}-\u{1FAFF}•|✅⚠️🛡️🧠📊📦]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
    if (!clean) return;

    stopSageVoice();
    const workerUrl = resolveWorkerUrl();
    if (!workerUrl || navigator.onLine === false) {
      speakSageLocal(clean);
      return;
    }

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tts",
          text: clean,
          voiceName: "Charon",
          gender: "male",
          toneTag: "حكيم تقني رزين وواضح",
          dialectMode: "fusha_simple",
          pitchSemitones: -1.4
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
  // [تحليل حالة المتجر الحية (0 حصة API)]
  // ==========================================================================
  function getLiveAdminTelemetry() {
    const prods = (typeof window.products === "object" && window.products) ? Object.values(window.products) : [];
    const lowStock = prods.filter((p) => {
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      return st <= (parseInt(p.alertLimit, 10) || 2);
    });
    const pendingCount = Object.keys(window.pendingOrders || {}).length;
    const readyCount = Object.keys(window.readyOrders || {}).length;
    const dispatchedCount = Object.keys(window.dispatchedOrders || {}).length;
    const reg = window.MoaathSystemRegistry?.getStatus ? window.MoaathSystemRegistry.getStatus() : null;

    return {
      productsCount: prods.length,
      lowStockCount: lowStock.length,
      lowStockNames: lowStock.slice(0, 4).map((p) => p.name),
      activeOrders: pendingCount + readyCount + dispatchedCount,
      pendingCount,
      readyCount,
      dispatchedCount,
      healthScore: reg ? reg.healthScore : 100,
      online: navigator.onLine !== false
    };
  }

  function appendSageMessage(role, text) {
    const log = document.getElementById("moaathSageChatLog");
    if (!log) return;
    const bubble = document.createElement("div");
    bubble.style.cssText =
      role === "user"
        ? "align-self:flex-start; background:rgba(56,189,248,0.16); border:1px solid rgba(56,189,248,0.4); color:#e2e8f0; padding:6px 9px; border-radius:10px; max-width:88%; font-size:10.5px;"
        : "align-self:flex-end; background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.45); color:#f8fafc; padding:6px 9px; border-radius:10px; max-width:92%; font-size:10.5px; line-height:1.55;";
    bubble.innerHTML = escHtml(text).replace(/\n/g, "<br>");
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  // ==========================================================================
  // [معالج أوامر وتطور الحكيم التقني]
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

    const t = getLiveAdminTelemetry();

    // 1) حفظ ملاحظة إدارية في ذاكرة التطور
    if (/^(تذكر|احفظ ملاحظه|سجل ملاحظه|ملاحظه)\s+(.+)/.test(txt)) {
      const note = txt.replace(/^(تذكر|احفظ ملاحظه|سجل ملاحظه|ملاحظه)\s+/, "").trim();
      const mem = loadMemory();
      mem.notes.unshift({ text: note, date: new Date().toLocaleDateString("ar-SY") });
      mem.notes = mem.notes.slice(0, 12);
      saveMemory(mem);
      gainSageXP(10, "حفظ ملاحظة إدارية");
      const msg = `تم حفظ ملاحظتك في ذاكرتي المتطورة: "${note}".`;
      appendSageMessage("sage", "🧠 " + msg);
      speakSage(msg);
      return;
    }

    // 2) أوامر إدارية فورية (0 حصة API)
    if (/(ملخص|تقرير|وضع المتجر|حاله المتجر|اخبار اليوم)/.test(txt)) {
      gainSageXP(8, "ملخص إداري");
      const msg = `تقريرك الفوري: لديك ${t.activeOrders} طلبات نشطة (${t.pendingCount} بانتظار التجهيز)، و${t.productsCount} صنفاً في المخزن منها ${t.lowStockCount} نواقص، ومؤشر صحة النظام ${t.healthScore}%.`;
      appendSageMessage("sage", "📊 " + msg);
      speakSage(msg);
      return;
    }

    if (/(نواقص|ناقص|المخزون)/.test(txt)) {
      gainSageXP(8, "فحص النواقص");
      const names = t.lowStockNames.length ? ` وأبرزها: ${t.lowStockNames.join("، ")}` : "";
      const msg = t.lowStockCount
        ? `يوجد ${t.lowStockCount} أصناف وصلت للحد الأدنى${names}. يمكنك تصدير القائمة فوراً.`
        : "المخزون ممتاز حالياً ولا توجد نواقص حرجة.";
      appendSageMessage("sage", "⚠️ " + msg);
      speakSage(msg);
      if (typeof window.exportLowStockShortageList === "function" && /صدر|انسخ/.test(txt)) {
        window.exportLowStockShortageList();
      }
      return;
    }

    if (/(فحص|صحه|جوده|qa)/.test(txt)) {
      gainSageXP(10, "فحص QA");
      if (typeof window.openMoaathQAModal === "function") window.openMoaathQAModal();
      const msg = `فتحت لك لوحة الفحص الشامل، مؤشر الصحة الحالي ${t.healthScore}%.`;
      appendSageMessage("sage", "🛡️ " + msg);
      speakSage(msg);
      return;
    }

    if (/(مرادفات|بحث)/.test(txt)) {
      gainSageXP(10, "توليد مرادفات");
      if (window.MoaathInventoryGuard?.generateMissingSynonymsBatch) {
        appendSageMessage("sage", "🧠 جاري فحص المخزن وتوليد مرادفات البحث للمنتجات الناقصة...");
        const res = await window.MoaathInventoryGuard.generateMissingSynonymsBatch();
        const msg = `اكتمل التوليد لـ ${res.processed} منتجاً لتسهيل البحث على الزبائن.`;
        appendSageMessage("sage", "✅ " + msg);
        speakSage(msg);
        return;
      }
    }

    if (/(طلبات|تجهيز)/.test(txt)) {
      gainSageXP(8, "ملخص الطلبات");
      if (typeof window.exportTodayOrdersBrief === "function") window.exportTodayOrdersBrief();
      const msg = `لديك ${t.activeOrders} طلبات نشطة وتم تجهيز ونسخ ملخصها للتوزيع.`;
      appendSageMessage("sage", "📦 " + msg);
      speakSage(msg);
      return;
    }

    // 3) استشارة ذكية سحابية عبر worker.js (mode: "admin_architect")
    const workerUrl = resolveWorkerUrl();
    if (workerUrl && navigator.onLine !== false) {
      appendSageMessage("sage", "⏳ جاري التحليل المعماري والإداري...");
      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "admin_architect",
            focusRole: "all",
            request: txt,
            telemetry: t
          })
        });
        const json = await res.json();
        if (res.ok && json?.ok && json?.data?.summary) {
          gainSageXP(12, "استشارة سحابية");
          const summary = String(json.data.summary);
          const recs = Array.isArray(json.data.recommendations)
            ? json.data.recommendations.slice(0, 2).map((r) => `• ${r.role || "توصية"}: ${r.detail || ""}`).join("\n")
            : "";
          const fullReply = recs ? `${summary}\n${recs}` : summary;
          appendSageMessage("sage", "🧙‍♂️ " + fullReply);
          speakSage(summary);
          return;
        }
      } catch (_) {}
    }

    gainSageXP(5, "رد محلي");
    const fallbackMsg = `سمعتك يا معاذ! حالياً لديك ${t.activeOrders} طلبات نشطة و${t.lowStockCount} نواقص. اطلب «ملخص اليوم» أو «فحص الصحة» أو «مرادفات المخزن».`;
    appendSageMessage("sage", "🧙‍♂️ " + fallbackMsg);
    speakSage(fallbackMsg);
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
  // [الحضور المرئي الدائم داخل #adminModal في جميع التبويبات]
  // ==========================================================================
  function injectSageStyles() {
    if (document.getElementById("moaathTechSageCSS")) return;
    const st = document.createElement("style");
    st.id = "moaathTechSageCSS";
    st.textContent = `
      @keyframes sageFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }
      #moaathTechSageDock {
        position: fixed;
        bottom: 16px;
        left: 14px;
        z-index: 10085;
        display: none;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        direction: rtl;
      }
      #moaathTechSageOrb {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid #D4AF37;
        background: radial-gradient(circle at 30% 25%, #1e3a5f, #0f172a 75%);
        box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(56,189,248,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        cursor: pointer;
        position: relative;
        animation: sageFloat 2.8s ease-in-out infinite;
      }
      #moaathTechSageLvlBadge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #D4AF37;
        color: #000;
        font-size: 9px;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 999px;
        border: 1px solid #0f172a;
      }
      #moaathTechSageDrawer {
        display: none;
        width: min(330px, 90vw);
        background: linear-gradient(160deg, #0f172a, #111827);
        border: 1.5px solid #D4AF37;
        border-radius: 16px;
        padding: 10px;
        color: #f8fafc;
        box-shadow: 0 16px 40px rgba(0,0,0,0.72);
      }
      #moaathSageChatLog {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 170px;
        overflow-y: auto;
        padding: 6px 2px;
        margin: 6px 0;
      }
    `;
    document.head.appendChild(st);
  }

  function syncSageBadge() {
    const mem = loadMemory();
    const rank = getEvolutionRank(mem.xp);
    const b = document.getElementById("moaathTechSageLvlBadge");
    if (b) b.textContent = `L${rank.lvl}`;
    const sub = document.getElementById("moaathSageRankSub");
    if (sub) sub.textContent = `${rank.title} • ${mem.xp} XP`;
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
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.28); padding-bottom:6px;">
          <div>
            <b style="color:#D4AF37; font-size:12px;">🧙‍♂️ الحكيم التقني (مساعد الإدارة)</b>
            <div id="moaathSageRankSub" style="font-size:9.5px; color:#38bdf8;">${rank.title} • ${mem.xp} XP</div>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" id="moaathSageVoiceToggle" title="تفعيل/كتم الصوت" style="background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid #38bdf8; border-radius:999px; padding:2px 7px; font-size:10px; cursor:pointer;">${mem.voiceEnabled ? "🗣️" : "🔇"}</button>
            <button type="button" id="moaathSageCloseBtn" style="background:#ef4444; color:#fff; border:none; border-radius:999px; padding:2px 7px; font-size:10px; cursor:pointer;">✕</button>
          </div>
        </div>

        <div style="display:flex; gap:4px; overflow-x:auto; padding:6px 0 2px 0; scrollbar-width:none;">
          <button type="button" class="moaath-sage-chip" data-q="ملخص اليوم" style="flex-shrink:0; background:rgba(212,175,55,0.16); color:#D4AF37; border:1px solid rgba(212,175,55,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">📊 ملخص اليوم</button>
          <button type="button" class="moaath-sage-chip" data-q="فحص النواقص" style="flex-shrink:0; background:rgba(245,158,11,0.16); color:#f59e0b; border:1px solid rgba(245,158,11,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">⚠️ النواقص</button>
          <button type="button" class="moaath-sage-chip" data-q="فحص الصحة" style="flex-shrink:0; background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">🛡️ فحص QA</button>
          <button type="button" class="moaath-sage-chip" data-q="توليد مرادفات المخزن" style="flex-shrink:0; background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:999px; padding:3px 8px; font-size:9.5px; cursor:pointer;">🧠 مرادفات</button>
        </div>

        <div id="moaathSageChatLog"></div>

        <div style="display:flex; gap:5px; align-items:center;">
          <input id="moaathSageInput" type="text" placeholder="اسأل الحكيم أو قل «تذكر ...»" style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(212,175,55,0.38); border-radius:999px; padding:5px 10px; color:#fff; font-size:10.5px; outline:none;">
          <button type="button" id="moaathSageMicBtn" title="تحدّث" style="width:30px; height:30px; border-radius:50%; background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981; cursor:pointer;">🎙️</button>
          <button type="button" id="moaathSageSendBtn" style="background:linear-gradient(45deg,#D4AF37,#10b981); color:#000; border:none; border-radius:999px; padding:5px 10px; font-size:10.5px; font-weight:900; cursor:pointer;">إرسال</button>
        </div>
      </div>

      <button type="button" id="moaathTechSageOrb" title="الحكيم التقني — مساعد الإدارة المتحدث">
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
        const t = getLiveAdminTelemetry();
        const greet = `أهلاً بك يا معاذ في لوحة الإدارة. لديك ${t.activeOrders} طلبات نشطة و${t.lowStockCount} نواقص في المخزن. كيف أساعدك الآن؟`;
        appendSageMessage("sage", "🧙‍♂️ " + greet);
        speakSage(greet);
      }
    };

    orb.onclick = () => toggleDrawer();
    document.getElementById("moaathSageCloseBtn").onclick = () => toggleDrawer(false);
    document.getElementById("moaathSageMicBtn").onclick = startSageVoiceInput;
    document.getElementById("moaathSageSendBtn").onclick = () => handleSagePrompt(document.getElementById("moaathSageInput")?.value);
    document.getElementById("moaathSageInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSagePrompt(e.target.value);
    });
    document.getElementById("moaathSageVoiceToggle").onclick = function () {
      const m = loadMemory();
      m.voiceEnabled = !m.voiceEnabled;
      saveMemory(m);
      this.textContent = m.voiceEnabled ? "🗣️" : "🔇";
      if (!m.voiceEnabled) stopSageVoice();
    };
    dock.querySelectorAll(".moaath-sage-chip").forEach((ch) => {
      ch.onclick = () => handleSagePrompt(ch.dataset.q);
    });
  }

  // إظهار الحكيم التقني تلقائياً فقط عندما تكون لوحة الإدارة (#adminModal) مفتوحة في أي تبويب
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
    if (!isAdminVisible) {
      isDrawerOpen = false;
      const drawer = document.getElementById("moaathTechSageDrawer");
      if (drawer) drawer.style.display = "none";
      stopSageVoice();
    }
  }

  window.MoaathTechSage = {
    version: "1.0",
    ask: handleSagePrompt,
    speak: speakSage,
    getMemory: loadMemory
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("tech_sage_presence", "1.0");
  }

  function startWatcher() {
    mountTechSageDock();
    syncVisibilityWithAdminModal();
    setInterval(syncVisibilityWithAdminModal, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatcher);
  } else {
    startWatcher();
  }
})();

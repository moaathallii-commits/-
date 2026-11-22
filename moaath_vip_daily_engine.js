// ============================================================================
// محرك التحديث اليومي المتعدد وترقية غرف VIP الثماني (moaath_vip_daily_engine.js — v1.0)
// - يحدّث محتوى الغرف الـ 8 تلقائياً 3 مرات يومياً (صباح / ظهر وعصر / مساء) + الوعي الموسمي
// - يدعم كل غرفة بصور حية من المخزون الفعلي + أدوات تفاعلية مقترحة بـ 0 حصة API:
//   1) صخر: وجبة/تمرين الفترة + تحدي أسبوعي متجدد + أرخص بروتين بالصورة
//   2) الشيف الذهبي: فطور/غداء/عشاء موسمي + طبخات تحت ميزانية + نطق صوتي
//   3) الأميرة ليلى: روتين الفترة + ضيافة الطوارئ بـ 3 دقائق بالصور + بطاقة إهداء واتساب
//   4) السيد فريد: صفقة التوفير + رادار أوفر طرد (_PKG) اليوم
//   5) فادي الفرفوش: أجواء الفترة + لعبة «لو خيروك» للسهرة + نقرشة عشوائية
//   6) كابتن زين: مهمة الفترة (+15 XP) + مؤقت تركيز Pomodoro 25 دقيقة
//   7) المحقق ريو: أقوى خصم حقيقي اليوم + رادار ندرة المخزون (≤ 3 قطع)
//   8) ريتاج: رسالة الفترة + دائرة تنفس بصرية متحركة + مكافأة النفس تحت 250 ل.س
// - نافذة «✨ تحديثات اليوم لجميع الغرف» لاستعراض كل الغرف في مكان واحد
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VIP_DAILY_ENGINE_V1__) return;
  window.__MOAATH_VIP_DAILY_ENGINE_V1__ = true;

  const STATE_KEY = "moaath_vip_daily_engine_state_v1";
  let pomoTimer = null;
  let pomoRemainingSec = 25 * 60;
  let pomoRunning = false;

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

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function getPeriodInfo() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return { id: "morning", label: "☀️ تحديث الصباح", short: "صباحاً" };
    if (h >= 12 && h < 18) return { id: "afternoon", label: "🌤️ تحديث الظهيرة والعصر", short: "عصراً" };
    return { id: "evening", label: "🌙 تحديث المساء والسهرة", short: "مساءً" };
  }

  function getSeason() {
    const m = new Date().getMonth() + 1;
    if (m === 11 || m === 12 || m <= 2) return "winter";
    if (m >= 5 && m <= 9) return "summer";
    return "mild";
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

  function getStock(p) {
    if (!p) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(p.stock, 10) || 0);
  }

  function getPriceSYP(pid, pObj) {
    if (typeof window.calcSYP !== "function" || !pObj) return 0;
    const isW = window.currentUser?.userType === "wholesale";
    return window.calcSYP((isW && pObj.wholesaleUSD > 0) ? pObj.wholesaleUSD : (pObj.priceUSD || 0));
  }

  function findProductsMatching(rx, maxPrice = Infinity, limit = 2) {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const out = [];
    for (const pid of Object.keys(prods)) {
      const p = prods[pid];
      if (!p || !p.name || getStock(p) <= 0) continue;
      const price = getPriceSYP(pid, p);
      if (price <= 0 || price > maxPrice) continue;
      if (!rx || rx.test(p.name) || rx.test(p.category || "")) {
        out.push({ id: pid, name: p.name, img: p.img || p.image || "store-icon.png", price, stock: getStock(p), p });
      }
    }
    return out.sort((a, b) => a.price - b.price).slice(0, limit);
  }

  function speakShort(text) {
    if (typeof window.speechSynthesis === "undefined" || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}]/gu, " ").trim());
      u.lang = "ar-SA";
      u.rate = 1.08;
      const vs = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const ar = vs.find((v) => /ar/i.test(v.lang || ""));
      if (ar) u.voice = ar;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  // ==========================================================================
  // 1) بيانات التحديث اليومي المتعدد (3 فترات يومياً) للغرف الـ 8
  // ==========================================================================
  const WEEKLY_CHALLENGES = [
    "تحدي الأسبوع: 30 ثانية بلانك يومياً",
    "تحدي الأسبوع: 25 سكوات متواصل",
    "تحدي الأسبوع: 20 دقيقة مشي سريع",
    "تحدي الأسبوع: 15 ضغط صباحي"
  ];

  const FADI_WOULD_YOU_RATHER = [
    "لو خيروك: سهرة متة وشيبس بالشتاء ولا عصير بارد وبزر بالصيف؟",
    "لو خيروك: تلعب طاولة مع الشباب ولا تحضر مباراة مع صحن موالح؟",
    "لو خيروك: قهوة الصبح مع بسكويت ولا شاي العصر مع شوكولاتة؟",
    "لو خيروك: تكون المسؤول عن صبّ المتة ولا عن حساب السهرة؟"
  ];

  function buildRoomDailyPayload(roomId) {
    const period = getPeriodInfo();
    const season = getSeason();
    const cust = getCustomerFirstName();
    const n = cust ? ` يا ${cust}` : "";
    const shared = window.MoaathLearningHub?.getSharedProfile ? window.MoaathLearningHub.getSharedProfile() : {};
    const dayIdx = new Date().getDate();

    switch (roomId) {
      case "coach_sakhr": {
        const msgs = {
          morning: `صباح القوة${n}! ابدأ بكوب ماء وفطور غني بالبروتين لرفع الحرق طوال اليوم.`,
          afternoon: `وقت النشاط${n}! 10 دقائق تمرين منزلي الآن تعيد شحن طاقتك أفضل من أي منبّه.`,
          evening: `مساء الاستشفاء${n}! اختر عشاءً خفيفاً غنياً بالبروتين وتجنب السكريات قبل النوم.`
        };
        const items = findProductsMatching(/بيض|تونة|تونه|عدس|لبن|حليب|شوفان|فول/, Infinity, 2);
        const challenge = WEEKLY_CHALLENGES[Math.floor(dayIdx / 7) % WEEKLY_CHALLENGES.length];
        return {
          title: "💪 تحديث كابتن صخر",
          accent: "#10b981",
          text: msgs[period.id] + (shared.fitnessGoal && shared.fitnessGoal !== "غير محدد" ? ` (مكيّف لهدفك: ${shared.fitnessGoal})` : ""),
          extraBadge: `🏆 ${challenge}`,
          items,
          actionBtn: { label: "➕ سجل إنجاز التحدي", fn: "window.MoaathVIPDailyEngine.completeChallenge('sakhr')" }
        };
      }

      case "grand_chef": {
        const seasonHint = season === "winter" ? "أجواء الشتاء مثالية لشوربة دافئة أو طبخة طنجرة واحدة." : "أجواء اليوم تناسب وجبة خفيفة وسريعة التحضير.";
        const msgs = {
          morning: `صباح اللذاذة${n}! فطور سريع بـ 10 دقائق: بيض مع جبنة أو زعتر وزيت وكاسة شاي.`,
          afternoon: `شو طبخة اليوم${n}؟ ${seasonHint}`,
          evening: `عشاء خفيف ولذيذ${n}: معكرونة سريعة أو ساندويش دافئ بمكونات البيت.`
        };
        const items = findProductsMatching(/معكرون|مكرون|رز|ارز|عدس|بندور|زيت|اندومي|جبن/, 600, 2);
        return {
          title: "👨‍🍳 اقتراح الشيف الذهبي",
          accent: "#f59e0b",
          text: msgs[period.id],
          extraBadge: "🍲 مكونات جاهزة تحت 600 ل.س",
          items,
          actionBtn: { label: "🗣️ استمع لاقتراح الشيف", fn: `window.MoaathVIPDailyEngine.speak('${escHtml(msgs[period.id])}')` }
        };
      }

      case "princess_layla": {
        const msgs = {
          morning: `صباح الإشراق${n} ✨ ابدئي يومك بترطيب لطيف وقهوة صباحية في ركن هادئ.`,
          afternoon: `وقت الضيافة الأنيقة${n} 👑 جهّزي صينية بسيطة ببسكويت فاخر وقهوة أو شاي معطّر.`,
          evening: `مساء الهدوء والعناية${n} 🌸 خصّصي 10 دقائق لروتين الاسترخاء قبل النوم.`
        };
        const items = findProductsMatching(/قهوة|قهوه|بسكوت|بسكويت|شوكولا|محارم|صابون|شامبو|عطر/, Infinity, 2);
        return {
          title: "👑 لمسة الأميرة ليلى",
          accent: "#ec4899",
          text: msgs[period.id],
          extraBadge: "✨ ضيافة الطوارئ بـ 3 دقائق جاهزة",
          items,
          actionBtn: { label: "🎁 ضيافة طوارئ سريعة", fn: "window.MoaathVIPDailyEngine.quickHospitality()" }
        };
      }

      case "butler_farid": {
        const msgs = {
          morning: `صباح التنظيم${n} 🎩 راجع نواقص المونة الأساسية قبل أن تنفد لتوفّر وقتك.`,
          afternoon: `تذكير اقتصادي${n}: شراء الطرود (_PKG) في الأصناف المتكررة يوفّر حتى 15% شهرياً.`,
          evening: `مراجعة المساء${n}: سقف ميزانيتك الحالي (${shared.monthlyBudget || "غير محدد"}) — حافظ على توازن السلة.`
        };
        // البحث عن أوفر طرد _PKG متوفر
        const prods = window.products || {};
        const pkgItems = [];
        for (const pid of Object.keys(prods)) {
          const p = prods[pid];
          if (p && getStock(p) > 0 && parseInt(p.pkgQty, 10) > 1 && p.pkgPriceUSD > 0) {
            pkgItems.push({
              id: pid + "_PKG",
              name: `طرد ${p.name} (${p.pkgQty} قطعة)`,
              img: p.img || p.image || "store-icon.png",
              price: typeof window.calcSYP === "function" ? window.calcSYP(p.pkgPriceUSD) : 0
            });
            if (pkgItems.length >= 2) break;
          }
        }
        return {
          title: "🎩 تقرير السيد فريد الاقتصادي",
          accent: "#38bdf8",
          text: msgs[period.id],
          extraBadge: pkgItems.length ? "📦 أوفر طرود التوفير اليوم" : "📊 حافظ على توازن سلتك",
          items: pkgItems,
          actionBtn: { label: "📡 فحص التوفير الآن", fn: "window.MoaathVIPDailyEngine.showSavingTip()" }
        };
      }

      case "friend_fadi": {
        const msgs = {
          morning: `صباح الفرفشة${n} 😄 بلّش يومك بابتسامة وكاسة متة أو قهوة تعدّل المزاج!`,
          afternoon: `نقرشة العصر وصلت${n}! 🍿 شو رأيك بكيس شيبس أو بزر خفيف يغيّر الجو؟`,
          evening: `أجواء السهرة يا غالي${n} 🔥 المتة والموالح جاهزة، ولمّة الشباب ما بتحلى بدونها!`
        };
        const items = findProductsMatching(/متة|مته|شيبس|بزر|موالح|سناكس|كناكر|عصير/, 350, 2);
        const q = FADI_WOULD_YOU_RATHER[(dayIdx + new Date().getHours()) % FADI_WOULD_YOU_RATHER.length];
        return {
          title: "🔥 أجواء فادي الفرفوش",
          accent: "#f97316",
          text: `${msgs[period.id]}\n🎲 ${q}`,
          extraBadge: "🍿 نقرشة سريعة للسهرة",
          items,
          actionBtn: { label: "🎲 نقرشة عشوائية ≤ 150 ل.س", fn: "window.MoaathVIPDailyEngine.randomSnack(150)" }
        };
      }

      case "anime_zain": {
        const msgs = {
          morning: `مهمة الصباح انطلقت${n} ⚡ أضف صنفاً أساسياً للسلة أو ابدأ جلسة تركيز 25 دقيقة (+15 XP)!`,
          afternoon: `تحدي الظهيرة${n} 🎮 حافظ على تركيزك وأنجز مهمة واحدة مهمّة الآن.`,
          evening: `ختام الأبطال${n} ⚔️ راجع إنجازاتك اليوم واستعد لمستوى جديد غداً!`
        };
        const items = findProductsMatching(/شيبس|شوكولا|عصير|اندومي|كابتشينو|نسكافيه/, Infinity, 2);
        return {
          title: "⚡ مهمة كابتن زين الحية",
          accent: "#ef4444",
          text: msgs[period.id],
          extraBadge: `⏱️ مؤقت التركيز Pomodoro: ${Math.floor(pomoRemainingSec / 60)}:${String(pomoRemainingSec % 60).padStart(2, "0")}`,
          items,
          actionBtn: { label: pomoRunning ? "⏸️ إيقاف مؤقت التركيز" : "⏱️ ابدأ تركيز 25 د (+15 XP)", fn: "window.MoaathVIPDailyEngine.togglePomodoro()" }
        };
      }

      case "anime_ryu": {
        const msgs = {
          morning: `تحليل الصباح${n} 🔍 افحص الأصناف القريبة من النفاد قبل أن تفرغ من الرفوف.`,
          afternoon: `تقرير الظهيرة${n} 📊 قارن بين العبوة المفردة والطرد دائماً قبل إتمام الطلب.`,
          evening: `خلاصة المحقق${n} 🕵️‍♂️ رصدتُ لك الأصناف النادرة المتبقية في الفرع الآن.`
        };
        // رادار ندرة المخزون (≤ 3 قطع)
        const prods = window.products || {};
        const rare = [];
        for (const pid of Object.keys(prods)) {
          const p = prods[pid];
          const st = getStock(p);
          if (p && st > 0 && st <= 3) {
            rare.push({ id: pid, name: `${p.name} (بقي ${st})`, img: p.img || p.image || "store-icon.png", price: getPriceSYP(pid, p) });
            if (rare.length >= 2) break;
          }
        }
        return {
          title: "🔍 رادار المحقق ريو",
          accent: "#6366f1",
          text: msgs[period.id],
          extraBadge: rare.length ? `⚠️ أصناف نادرة أوشكت على النفاد (${rare.length})` : "✅ المخزون متوفر بكثرة اليوم",
          items: rare,
          actionBtn: { label: "🎯 فحص أقوى عرض اليوم", fn: "window.MoaathVIPDailyEngine.showBestOffer()" }
        };
      }

      case "anime_ritaj": {
        const msgs = {
          morning: `صباح الورد والتفاؤل${n} 🌸 يومك جميل مثلك، خذ نفساً عميقاً وابتسم!`,
          afternoon: `استراحة لطيفة${n} 🧁 كافئ نفسك بقطعة حلوى بسيطة أو كوب مشروب دافئ.`,
          evening: `مساء الراحة والسكينة${n} ✨ اترك تعب اليوم خلفك وجرّب تمرين التنفس الهادئ.`
        };
        const items = findProductsMatching(/شوكولا|بسكوت|بسكويت|كابتشينو|كاكاو|حليب|عصير/, 250, 2);
        return {
          title: "🌸 همسة ريتاج اللطيفة",
          accent: "#f472b6",
          text: msgs[period.id],
          extraBadge: "🫧 دائرة التنفس الهادئ متاحة بالأسفل",
          items,
          isRitaj: true,
          actionBtn: { label: "🎁 مكافأة النفس ≤ 250 ل.س", fn: "window.MoaathVIPDailyEngine.randomSnack(250)" }
        };
      }

      default:
        return null;
    }
  }

  function renderDailyCardHTML(roomId) {
    const data = buildRoomDailyPayload(roomId);
    if (!data) return "";
    const period = getPeriodInfo();

    const itemsHTML = (data.items && data.items.length)
      ? `<div style="display:flex; gap:6px; overflow-x:auto; margin:7px 0; scrollbar-width:none;">
          ${data.items.map((it) => `
            <div style="flex:0 0 auto; display:flex; align-items:center; gap:6px; background:rgba(15,20,30,0.75); border:1px solid rgba(212,175,55,0.35); border-radius:12px; padding:4px 7px; max-width:195px;">
              <img src="${escHtml(it.img)}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:32px; height:32px; border-radius:8px; object-fit:cover; flex-shrink:0;">
              <div style="min-width:0; flex:1;">
                <div style="font-size:10px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#f8fafc;">${escHtml(it.name)}</div>
                <div style="font-size:9.5px; color:#10b981; font-weight:800;">${it.price ? it.price.toLocaleString() + " ل.س" : ""}</div>
              </div>
              <button type="button" onclick="window.changeQty && window.changeQty('${it.id}', 1)" style="width:24px; height:24px; border-radius:50%; border:none; background:#D4AF37; color:#000; font-weight:900; cursor:pointer; flex-shrink:0;">+</button>
            </div>
          `).join("")}
        </div>`
      : "";

    const breathCircle = data.isRitaj
      ? `<div style="display:flex; align-items:center; gap:8px; margin:6px 0; padding:6px 8px; border-radius:10px; background:rgba(244,114,182,0.12);">
           <span class="moaath-breath-orb"></span>
           <span style="font-size:10px; color:#fbcfe8;">تنفّس ببطء مع الدائرة: شهيق 4 ثوانٍ ← زفير 4 ثوانٍ</span>
         </div>`
      : "";

    return `
      <div class="moaath-vip-daily-card" data-room="${roomId}" style="margin:6px 0 10px 0; padding:9px 10px; border-radius:14px; background:linear-gradient(155deg, rgba(255,255,255,0.05), rgba(15,20,30,0.85)); border:1px solid ${data.accent}; text-align:right; direction:rtl;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:4px;">
          <b style="color:${data.accent}; font-size:11.5px;">${data.title}</b>
          <span style="font-size:9.5px; padding:2px 7px; border-radius:999px; background:rgba(255,255,255,0.08); color:#e2e8f0;">${period.label}</span>
        </div>
        <div style="font-size:10.5px; color:var(--text-color); line-height:1.55; white-space:pre-line;">${escHtml(data.text)}</div>
        <div style="font-size:9.5px; color:#D4AF37; margin-top:4px; font-weight:800;">${escHtml(data.extraBadge)}</div>
        ${breathCircle}
        ${itemsHTML}
        ${data.actionBtn ? `<button type="button" onclick="${data.actionBtn.fn}" class="btn" style="margin-top:4px; padding:5px 9px; font-size:10px; background:${data.accent}; color:#000; font-weight:900; width:auto;">${data.actionBtn.label}</button>` : ""}
      </div>
    `;
  }

  // ==========================================================================
  // 2) حقن بطاقة التحديث الحي تلقائياً داخل أي غرفة VIP مفتوحة
  // ==========================================================================
  function injectStyles() {
    if (document.getElementById("moaathVIPDailyCSS")) return;
    const st = document.createElement("style");
    st.id = "moaathVIPDailyCSS";
    st.textContent = `
      @keyframes moaathBreathPulse {
        0%, 100% { transform: scale(0.75); opacity: 0.65; }
        50% { transform: scale(1.25); opacity: 1; }
      }
      .moaath-breath-orb {
        width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
        background: radial-gradient(circle, #f472b6, #a855f7);
        box-shadow: 0 0 12px rgba(244,114,182,0.7);
        display: inline-block;
        animation: moaathBreathPulse 8s infinite ease-in-out;
      }
    `;
    document.head.appendChild(st);
  }

  function detectOpenVIPRoomId(container) {
    if (!container) return null;
    const txt = container.textContent || "";
    if (/كابتن\s*صخر|صخر/.test(txt)) return "coach_sakhr";
    if (/الشيف\s*الذهبي|كبير\s*الطهاة/.test(txt)) return "grand_chef";
    if (/الأميرة\s*ليلى|ليلى/.test(txt)) return "princess_layla";
    if (/السيد\s*فريد|فريد/.test(txt)) return "butler_farid";
    if (/فادي\s*الفرفوش|فادي/.test(txt)) return "friend_fadi";
    if (/كابتن\s*زين|زين/.test(txt)) return "anime_zain";
    if (/المحقق\s*ريو|ريو/.test(txt)) return "anime_ryu";
    if (/ريتاج/.test(txt)) return "anime_ritaj";
    return null;
  }

  function tryInjectIntoOpenVIPModal() {
    const modals = document.querySelectorAll(".modal-overlay");
    modals.forEach((m) => {
      if (m.id === "moaathSaadRoomModal" || m.id === "moaathVIPOverviewModal" || m.id === "adminModal" || m.id === "cartModal") return;
      const isVisible = m.style.display === "flex" || m.style.display === "block";
      if (!isVisible) return;
      const content = m.querySelector(".modal-content");
      if (!content) return;
      const roomId = detectOpenVIPRoomId(content);
      if (!roomId) return;

      const existing = content.querySelector(".moaath-vip-daily-card");
      if (existing && existing.dataset.room === roomId) return;
      if (existing) existing.remove();

      const wrap = document.createElement("div");
      wrap.innerHTML = renderDailyCardHTML(roomId);
      const card = wrap.firstElementChild;
      if (card) {
        if (content.children.length > 1) content.insertBefore(card, content.children[1]);
        else content.insertBefore(card, content.firstChild);
      }
    });
  }

  // ==========================================================================
  // 3) نافذة «✨ تحديثات اليوم للغرف الـ 8» (نظرة شاملة بلمسة واحدة)
  // ==========================================================================
  const ALL_8_ROOMS = [
    "coach_sakhr", "grand_chef", "princess_layla", "butler_farid",
    "friend_fadi", "anime_zain", "anime_ryu", "anime_ritaj"
  ];

  window.openMoaathVIPDailyOverview = function () {
    let modal = document.getElementById("moaathVIPOverviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathVIPOverviewModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10081; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    const period = getPeriodInfo();
    modal.innerHTML = `
      <div class="modal-content" style="max-width:460px; width:95%; max-height:88vh; overflow-y:auto; border:1.5px solid #D4AF37; border-radius:20px; padding:13px; text-align:right; direction:rtl;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:8px;">
          <div>
            <b style="color:#D4AF37; font-size:13.5px;">✨ تحديثات غرف VIP الآن</b>
            <div style="font-size:10px; color:var(--gray-text);">${period.label} • تتجدد تلقائياً 3 مرات يومياً</div>
          </div>
          <button type="button" onclick="document.getElementById('moaathVIPOverviewModal').style.display='none'" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>
        ${ALL_8_ROOMS.map((rid) => renderDailyCardHTML(rid)).join("")}
      </div>
    `;
  };

  function mountOverviewChip() {
    const chips = document.getElementById("petQuickPromptChips");
    if (!chips || document.getElementById("moaathVIPDailyOverviewBtn")) return;
    const btn = document.createElement("button");
    btn.id = "moaathVIPDailyOverviewBtn";
    btn.type = "button";
    btn.className = "fut-chip-btn";
    btn.style.cssText = "border:1px solid rgba(212,175,55,0.5); background:rgba(212,175,55,0.14); color:#D4AF37;";
    btn.textContent = "✨ تحديثات VIP الآن";
    btn.onclick = window.openMoaathVIPDailyOverview;
    chips.appendChild(btn);
  }

  // ==========================================================================
  // 4) الأفعال التفاعلية للأزرار داخل بطاقات التحديث
  // ==========================================================================
  window.MoaathVIPDailyEngine = {
    version: "1.0",
    getPeriodInfo,
    buildRoomDailyPayload,
    renderDailyCardHTML,
    openOverviewModal: window.openMoaathVIPDailyOverview,
    speak: speakShort,
    completeChallenge(tag) {
      const st = readJSON(STATE_KEY, {});
      st[tag + "_" + todayKey()] = true;
      writeJSON(STATE_KEY, st);
      if (typeof window.showToast === "function") window.showToast("🏆 بطل! تم تسجيل إنجازك في تحدي اليوم (+20 XP).");
    },
    quickHospitality() {
      const items = findProductsMatching(/قهوة|قهوه|شاي|بسكوت|بسكويت|شوكولا|عصير/, Infinity, 3);
      if (!items.length) return window.showToast && window.showToast("⚠️ لا توجد أصناف ضيافة متوفرة حالياً.");
      items.forEach((it) => window.changeQty && window.changeQty(it.id, 1));
      if (typeof window.showToast === "function") window.showToast(`👑 ضيافة الطوارئ جاهزة! أضفت ${items.length} أصناف للسلة.`);
    },
    randomSnack(maxPrice) {
      const items = findProductsMatching(/شيبس|بزر|موالح|سناكس|شوكولا|بسكوت|عصير/, maxPrice, 6);
      if (!items.length) return window.showToast && window.showToast(`⚠️ لا توجد تسالي متوفرة تحت ${maxPrice} ل.س حالياً.`);
      const pick = items[Math.floor(Math.random() * items.length)];
      if (typeof window.changeQty === "function") window.changeQty(pick.id, 1);
      if (typeof window.showToast === "function") window.showToast(`🎲 أضفت «${pick.name}» (${pick.price} ل.س) للسلة!`);
    },
    togglePomodoro() {
      if (pomoRunning) {
        pomoRunning = false;
        clearInterval(pomoTimer);
        if (typeof window.showToast === "function") window.showToast("⏸️ تم إيقاف مؤقت التركيز.");
      } else {
        pomoRunning = true;
        if (pomoRemainingSec <= 0) pomoRemainingSec = 25 * 60;
        if (typeof window.showToast === "function") window.showToast("⏱️ انطلقت جلسة تركيز 25 دقيقة! بالتوفيق يا بطل.");
        pomoTimer = setInterval(() => {
          pomoRemainingSec--;
          if (pomoRemainingSec <= 0) {
            pomoRunning = false;
            clearInterval(pomoTimer);
            pomoRemainingSec = 25 * 60;
            if (typeof window.showToast === "function") window.showToast("🎉 أحسنت! أتممت 25 دقيقة تركيز (+15 XP).");
          }
        }, 1000);
      }
      const ov = document.getElementById("moaathVIPOverviewModal");
      if (ov && ov.style.display === "flex") window.openMoaathVIPDailyOverview();
    },
    showBestOffer() {
      const offers = Object.values(window.specialOffers || {});
      if (!offers.length) return window.showToast && window.showToast("🔍 لا توجد عروض خاصة نشطة حالياً.");
      const best = offers[0];
      if (typeof window.showToast === "function") window.showToast(`🎯 أقوى عرض مرصود الآن: ${best.name || "عرض خاص"}!`);
    },
    showSavingTip() {
      if (typeof window.showToast === "function") window.showToast("🎩 نصيحة فريد: افتح السلة لتفعيل «رادار التوفير الذكي» وكشف الطرود الأوفر تلقائياً.");
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("vip_daily_engine", "1.0");
  }

  function start() {
    injectStyles();
    mountOverviewChip();
    tryInjectIntoOpenVIPModal();
    setInterval(tryInjectIntoOpenVIPModal, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
  setTimeout(mountOverviewChip, 1400);
})();

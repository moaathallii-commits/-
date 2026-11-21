// ============================================================================
// منظومة الشخصيات المدفوعة VIP لمتجر معاذ (v4.0 — Unified 8 Micro-Apps Edition)
// - 8 شخصيات (5 مميزة + 3 أنمي) مع غرف تفاعلية مستقلة بالكامل (0 حصة API)
// - تصدير صريح لـ window.MoaathVIPSystem لرفع مؤشر الصحة والجاهزية إلى 100%
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================

(function () {
  if (window.__MOAATH_VIP_V4_LOADED__) return;
  window.__MOAATH_VIP_V4_LOADED__ = true;

  const VIP_UNLOCKS_KEY = "moaath_vip_unlocks_v4";
  const VIP_LEARNING_KEY = "moaath_vip_self_learning_v3";

  const VIP_PERSONAS = {
    coach_sakhr: {
      id: "coach_sakhr",
      group: "premium",
      name: "كابتن صخر",
      role: "الرياضة واللياقة والتغذية",
      shortDesc: "حاسبة السعرات والبروتين، مؤقت HIIT، متتبع الماء، وسلة البروتين الاقتصادي.",
      avatarUrl: "coach_sakhr.jpg",
      accent: "#f97316",
      gender: "male",
      voiceName: "Fenrir",
      speed: 1.42,
      pitchSemitones: -1.5,
      toneTag: "حماسي وقوي",
      dialectMode: "shami_friendly",
      greet: "أهلاً بالبطل! جاهز لتحدي اليوم وتجهيز وجبة الطاقة؟"
    },
    grand_chef: {
      id: "grand_chef",
      group: "premium",
      name: "الشيف الذهبي",
      role: "الطبخ والوصفات وتخطيط الوجبات",
      shortDesc: "شو عندك بالبراد، حاسبة تكلفة الطبخة، مؤقتان للطبخ، وجدول الأسبوع.",
      avatarUrl: "grand_chef.jpg",
      accent: "#d4af37",
      gender: "male",
      voiceName: "Orus",
      speed: 1.38,
      pitchSemitones: -0.6,
      toneTag: "خبير ودافئ",
      dialectMode: "fusha_simple",
      greet: "أهلاً بك في مطبخ الشيف الذهبي، ماذا سنطبخ اليوم؟"
    },
    princess_layla: {
      id: "princess_layla",
      group: "premium",
      name: "الأميرة ليلى",
      role: "الأناقة والضيافة والعناية",
      shortDesc: "منسّق الضيافة الفاخرة، سلال الهدايا، روتين العناية، وتذكير المناسبات.",
      avatarUrl: "princess_layla.jpg",
      accent: "#f472b6",
      gender: "female",
      voiceName: "Aoede",
      speed: 1.35,
      pitchSemitones: 1.8,
      toneTag: "راقية وناعمة",
      dialectMode: "fusha_simple",
      greet: "أهلاً بك بكل رقي، لننسّق ضيافتك وعنايتك اليوم بأجمل لمسة."
    },
    butler_farid: {
      id: "butler_farid",
      group: "premium",
      name: "السيد فريد",
      role: "التنظيم والميزانية والتسوق الذكي",
      shortDesc: "مخطط الميزانية الشهرية، خفض الفاتورة 20%، توفير الطرد، ودفتر النواقص.",
      avatarUrl: "butler_farid.jpg",
      accent: "#94a3b8",
      gender: "male",
      voiceName: "Charon",
      speed: 1.35,
      pitchSemitones: -1.8,
      toneTag: "رزين ومنظّم",
      dialectMode: "fusha_simple",
      greet: "أهلاً بك سيدي الكريم، كل حسابات بيتك وميزانيتك منظمة بدقة."
    },
    friend_fadi: {
      id: "friend_fadi",
      group: "premium",
      name: "فادي الفرفوش",
      role: "السهرات والمتة والتسالي والمرح",
      shortDesc: "عجلة الحظ للتسالي، حاسبة سهرة الشباب، قرعة مين يدفع، ومؤقت مي المتة.",
      avatarUrl: "friend_fadi.jpg",
      accent: "#facc15",
      gender: "male",
      voiceName: "Puck",
      speed: 1.48,
      pitchSemitones: 0.8,
      toneTag: "مرح وعفوي",
      dialectMode: "shami_friendly",
      greet: "ولك هلا بالغالي! خلينا نضبط السهرة والمتة بأحلى جو!"
    },
    anime_zain: {
      id: "anime_zain",
      group: "anime",
      name: "كابتن زين",
      role: "الألعاب والمستويات XP والمغامرة",
      shortDesc: "نظام مستويات XP، صندوق الغنيمة اليومي، لعبة خمّن السعر، وتحدي الذاكرة.",
      avatarUrl: "anime_zain.jpg",
      accent: "#ef4444",
      gender: "male",
      voiceName: "Fenrir",
      speed: 1.48,
      pitchSemitones: 0.5,
      toneTag: "حماسي أنمي",
      dialectMode: "shami_friendly",
      greet: "انطلق يا بطل! مهمتك اليومية وصندوق الغنيمة بانتظارك!"
    },
    anime_ryu: {
      id: "anime_ryu",
      group: "anime",
      name: "المحقق ريو",
      role: "التحليل ومقارنة الأسعار والألغاز",
      shortDesc: "مقارنة منتجين، لغز اليوم، رادار النفاد، كاشف التخفيضات، وتحليل السلة.",
      avatarUrl: "anime_ryu.jpg",
      accent: "#38bdf8",
      gender: "male",
      voiceName: "Charon",
      speed: 1.4,
      pitchSemitones: -1.0,
      toneTag: "ذكي وتحليلي",
      dialectMode: "fusha_simple",
      greet: "أهلاً بك في مكتب التحليل، دعنا نكشف أفضل قيمة وأذكي خيار اليوم."
    },
    anime_ritaj: {
      id: "anime_ritaj",
      group: "anime",
      name: "ريتاج",
      role: "البهجة والحلويات اللطيفة والمزاج",
      shortDesc: "مقياس المزاج، برطمان الرسائل اللطيفة، استراحة التنفس، وحلى بدون فرن.",
      avatarUrl: "anime_ritaj.jpg",
      accent: "#f472b6",
      gender: "female",
      voiceName: "Leda",
      speed: 1.4,
      pitchSemitones: 2.2,
      toneTag: "لطيفة ومبهجة",
      dialectMode: "shami_friendly",
      greet: "أهلاً يا حلو! كيف مزاجك اليوم؟ خلينا نضيف شوية بهجة وحلى!"
    }
  };

  function getUnlocksState() {
    try {
      const d = JSON.parse(localStorage.getItem(VIP_UNLOCKS_KEY) || "{}");
      return {
        allUnlocked: d.allUnlocked === undefined ? true : !!d.allUnlocked,
        ids: Array.isArray(d.ids) ? d.ids : Object.keys(VIP_PERSONAS)
      };
    } catch (_) {
      return { allUnlocked: true, ids: Object.keys(VIP_PERSONAS) };
    }
  }

  function saveUnlocksState(st) {
    try { localStorage.setItem(VIP_UNLOCKS_KEY, JSON.stringify(st)); } catch (_) {}
  }

  function isPersonaUnlockedLifetime(id) {
    if (!VIP_PERSONAS[id]) return false;
    if (window.currentUser?.isAdmin) return true;
    const st = getUnlocksState();
    return !!st.allUnlocked || st.ids.includes(id);
  }

  function recordVIPRoomVisit(id) {
    try {
      const cur = JSON.parse(localStorage.getItem(VIP_LEARNING_KEY) || "{}");
      cur[id] = cur[id] || { visits: 0, lastVisit: "" };
      cur[id].visits = (cur[id].visits || 0) + 1;
      cur[id].lastVisit = new Date().toISOString();
      localStorage.setItem(VIP_LEARNING_KEY, JSON.stringify(cur));
    } catch (_) {}
  }

  function registerAllVIPIntoEngine() {
    if (typeof window.__registerDynamicCompanionPersona !== "function") return;
    Object.values(VIP_PERSONAS).forEach(vp => {
      if (isPersonaUnlockedLifetime(vp.id)) {
        window.__registerDynamicCompanionPersona(vp.id, {
          ...vp,
          roleBadge: `👑 VIP • ${vp.role}`,
          specialtyNote: `${vp.name} (${vp.role}): ${vp.shortDesc}`,
          greets: [vp.greet],
          chatGood: "بأفضل حال، كيف يمكنني خدمتك اليوم؟",
          chatGoods: ["بأفضل حال، كيف يمكنني خدمتك اليوم؟"],
          thanks: "العفو، يسعدني دائماً خدمتك.",
          thanksList: ["العفو، يسعدني دائماً خدمتك."],
          addedMsgs: [(n) => `تمت إضافة ${n} إلى السلة.`],
          recipeReady: (t) => `جهزت لك المتوفر لوصفة ${t}، حدد الكمية.`,
          recipeMissing: (t) => `بعض مكونات ${t} غير متوفرة حالياً.`,
          itemsReady: () => "عرضت لك الأصناف المتوفرة في الفرع، حدد الكمية.",
          notFounds: ["لم أجد صنفاً مطابقاً متوفراً الآن."],
          notFound: "لم أجد صنفاً مطابقاً متوفراً الآن."
        });
      }
    });
  }

  window.triggerVIPProminentEntrance = function (id) {
    const vp = VIP_PERSONAS[id];
    if (!vp) return;
    let toast = document.getElementById("vipEntranceBanner");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "vipEntranceBanner";
      toast.style.cssText = "position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:10060; padding:8px 14px; border-radius:999px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:8px; box-shadow:0 10px 28px rgba(0,0,0,0.55); transition:opacity 0.3s ease;";
      document.body.appendChild(toast);
    }
    toast.style.background = `linear-gradient(135deg, #111827, #1f2937)`;
    toast.style.border = `1.5px solid ${vp.accent}`;
    toast.style.color = vp.accent;
    toast.innerHTML = `<img src="${vp.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:26px; height:26px; border-radius:50%; object-fit:cover; border:1px solid ${vp.accent};"><span>👑 ${vp.name} جاهز لخدمتك الآن!</span>`;
    toast.style.opacity = "1";
    toast.style.display = "flex";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => { toast.style.display = "none"; }, 300); }, 2800);
  };

  window.closeVIPShowcaseModal = function () {
    const m = document.getElementById("vipShowcaseModal");
    if (m) m.style.display = "none";
  };

  window.closeVIPRoomModal = function () {
    const m = document.getElementById("vipRoomModal");
    if (m) m.style.display = "none";
  };

  window.openVIPRoom = function (id) {
    const vp = VIP_PERSONAS[id];
    if (!vp) return;
    if (!isPersonaUnlockedLifetime(id)) {
      if (typeof window.showToast === "function") window.showToast("🔒 هذه الغرفة تتطلب تفعيل اشتراك VIP.");
      return;
    }

    window.closeVIPShowcaseModal();
    recordVIPRoomVisit(id);

    let modal = document.getElementById("vipRoomModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vipRoomModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10050; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.closeVIPRoomModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:460px; width:95%; max-height:88vh; overflow-y:auto; border:1.5px solid ${vp.accent}; border-radius:18px; padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${vp.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid ${vp.accent};">
            <div style="text-align:right;">
              <div style="font-size:13px; font-weight:900; color:${vp.accent};">👑 غرفة ${vp.name}</div>
              <div style="font-size:10px; color:var(--gray-text);">${vp.role}</div>
            </div>
          </div>
          <div style="display:flex; gap:5px;">
            <button type="button" onclick="if(typeof window.selectPetPersona==='function'){window.selectPetPersona('${vp.id}');}" class="btn" style="width:auto; padding:4px 8px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color);">تفعيل كمساعد</button>
            <button type="button" onclick="window.closeVIPRoomModal()" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
          </div>
        </div>
        <div id="vipRoomDynamicBody"></div>
      </div>
    `;

    const bodyEl = document.getElementById("vipRoomDynamicBody");
    const mod = window.MoaathVIPRoomModules && window.MoaathVIPRoomModules[id];
    if (mod && typeof mod.render === "function") {
      mod.render(bodyEl);
    } else if (bodyEl) {
      bodyEl.innerHTML = `<div style="padding:14px; text-align:center; color:var(--gray-text);">جاري تجهيز أدوات غرفة ${vp.name}...</div>`;
    }
  };

  window.openVIPShowcaseModal = function (filterGroup = "all") {
    let modal = document.getElementById("vipShowcaseModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vipShowcaseModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10045; background:rgba(0,0,0,0.84); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.closeVIPShowcaseModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    const list = Object.values(VIP_PERSONAS).filter(vp => filterGroup === "all" || vp.group === filterGroup);

    modal.innerHTML = `
      <div class="modal-content" style="max-width:460px; width:95%; max-height:86vh; overflow-y:auto; border:1.5px solid var(--gold-color); border-radius:18px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
          <div style="text-align:right;">
            <div style="font-size:14px; font-weight:900; color:var(--gold-color);">👑 غرف الشخصيات التفاعلية (8 VIP)</div>
            <div style="font-size:10px; color:var(--gray-text);">أدوات مصغّرة تعمل محلياً (0 حصة API) ومرتبطة بسلة المتجر</div>
          </div>
          <button type="button" onclick="window.closeVIPShowcaseModal()" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>

        <div style="display:flex; gap:5px; margin-bottom:10px;">
          <button type="button" onclick="window.openVIPShowcaseModal('all')" class="btn" style="flex:1; padding:5px; font-size:10px; background:${filterGroup === "all" ? "var(--gold-color)" : "var(--bg-color)"}; color:${filterGroup === "all" ? "#000" : "var(--text-color)"};">الكل (8)</button>
          <button type="button" onclick="window.openVIPShowcaseModal('premium')" class="btn" style="flex:1; padding:5px; font-size:10px; background:${filterGroup === "premium" ? "var(--gold-color)" : "var(--bg-color)"}; color:${filterGroup === "premium" ? "#000" : "var(--text-color)"};">مميزة (5)</button>
          <button type="button" onclick="window.openVIPShowcaseModal('anime')" class="btn" style="flex:1; padding:5px; font-size:10px; background:${filterGroup === "anime" ? "var(--gold-color)" : "var(--bg-color)"}; color:${filterGroup === "anime" ? "#000" : "var(--text-color)"};">أنمي (3)</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          ${list.map(vp => `
            <div style="background:var(--bg-color); border:1.5px solid ${vp.accent}; border-radius:14px; padding:10px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:space-between;">
              <img src="${vp.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:54px; height:54px; border-radius:50%; object-fit:cover; border:2px solid ${vp.accent}; margin-bottom:5px;">
              <div style="font-size:12px; font-weight:800; color:${vp.accent};">${vp.name}</div>
              <div style="font-size:9.5px; color:var(--gray-text); margin:2px 0 4px 0;">${vp.role}</div>
              <div style="font-size:9px; line-height:1.4; opacity:0.88; margin-bottom:7px;">${vp.shortDesc}</div>
              <button type="button" onclick="window.openVIPRoom('${vp.id}')" class="btn" style="padding:5px 8px; font-size:10px; background:${vp.accent}; color:#000;">🚪 دخول الغرفة</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  };

  // تصدير صريح لـ window.MoaathVIPSystem لرفع مؤشر الصحة والجاهزية في الحكيم التقني إلى 100%
  window.MoaathVIPSystem = {
    version: "4.0-unified-micro-apps",
    personas: VIP_PERSONAS,
    isPersonaUnlockedLifetime,
    getUnlocksState,
    saveUnlocksState,
    openShowcase: window.openVIPShowcaseModal,
    openRoom: window.openVIPRoom,
    roomModules: window.MoaathVIPRoomModules || {}
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerAllVIPIntoEngine);
  } else {
    registerAllVIPIntoEngine();
  }
  setTimeout(registerAllVIPIntoEngine, 800);
})();


// ============================================================================
// وحدة غرفة VIP المستقلة (1/8): كابتن صخر — الرياضة والتغذية (coach_sakhr)
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_sakhr_v1";
  let hiitInterval = null;
  let hiitState = { running: false, phase: "work", secLeft: 40, round: 1 };

  function loadData() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (d.waterDate !== today) {
        d.waterCups = 0;
        d.waterDate = today;
      }
      return {
        weight: d.weight || 75,
        height: d.height || 175,
        goal: d.goal || "cut",
        waterCups: d.waterCups || 0,
        waterDate: today,
        streak: d.streak || 0,
        lastTrainDate: d.lastTrainDate || "",
        weeklyPushups: d.weeklyPushups || 0,
        weightLog: Array.isArray(d.weightLog) ? d.weightLog : []
      };
    } catch (_) {
      return { weight: 75, height: 175, goal: "cut", waterCups: 0, waterDate: today, streak: 0, lastTrainDate: "", weeklyPushups: 0, weightLog: [] };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function vibrate(ms = 30) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (_) {}
  }

  function getHealthyStoreProducts(maxBudget = 0) {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const healthyRx = /(بيض|تونه|تونة|عدس|حليب|لبن|جبن|شوفان|برغل|عسل|ماء|عصير|دجاج|فول|حمص|مكسرات|زيتون)/;
    const isW = window.currentUser?.userType === "wholesale";
    const list = [];

    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p) return;
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      if (st <= 0) return;

      const price = typeof window.calcSYP === "function"
        ? window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0))
        : 0;
      if (price <= 0) return;
      if (maxBudget > 0 && price > maxBudget) return;

      const txt = String((p.name || "") + " " + (p.category || ""));
      if (healthyRx.test(txt)) {
        list.push({ id: pid, name: p.name, price, stock: st });
      }
    });

    return list.sort((a, b) => a.price - b.price);
  }

  function calcMetrics(weight, height, goal) {
    const hM = Math.max(1.2, height / 100);
    const bmi = +(weight / (hM * hM)).toFixed(1);
    let bmiLabel = "وزن مثالي";
    let bmiColor = "#00e676";
    if (bmi < 18.5) { bmiLabel = "نحافة"; bmiColor = "#38bdf8"; }
    else if (bmi >= 25 && bmi < 30) { bmiLabel = "زيادة وزن"; bmiColor = "#f59e0b"; }
    else if (bmi >= 30) { bmiLabel = "سمنة"; bmiColor = "#ef4444"; }

    const baseCal = Math.round(weight * 30);
    const calories = goal === "cut" ? Math.max(1400, baseCal - 400) : goal === "bulk" ? baseCal + 350 : baseCal;
    const protein = Math.round(weight * (goal === "bulk" ? 2.0 : 1.7));
    return { bmi, bmiLabel, bmiColor, calories, protein };
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const m = calcMetrics(d.weight, d.height, d.goal);
    const waterPct = Math.min(100, Math.round((d.waterCups / 8) * 100));
    const challengePct = Math.min(100, Math.round((d.weeklyPushups / 100) * 100));
    const healthyItems = getHealthyStoreProducts().slice(0, 4);

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div style="background:rgba(249,115,22,0.12); border:1px solid #f97316; border-radius:12px; padding:9px;">
            <div style="color:#fb923c; font-weight:800;">🔥 سلسلة الالتزام</div>
            <div style="font-size:18px; font-weight:900; margin:3px 0;">${d.streak} يوم</div>
            <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.logTodayWorkout()" class="btn" style="padding:4px 8px; font-size:10px; background:#f97316; color:#000;">✅ سجّل تمرين اليوم</button>
          </div>
          <div style="background:rgba(0,230,118,0.1); border:1px solid #00e676; border-radius:12px; padding:9px;">
            <div style="color:#00e676; font-weight:800;">💪 تحدي 100 ضغط</div>
            <div style="font-size:14px; font-weight:800; margin:3px 0;">${d.weeklyPushups} / 100 (${challengePct}%)</div>
            <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.addPushups(10)" class="btn" style="padding:4px 8px; font-size:10px; background:#00e676; color:#000;">+10 ضغط الآن</button>
          </div>
        </div>

        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="font-weight:800; color:#fb923c; margin-bottom:6px;">📊 حاسبة السعرات والبروتين و BMI</div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:7px;">
            <div>
              <label style="font-size:9px; color:var(--gray-text);">الوزن (كغ)</label>
              <input id="sakhrWeightInp" type="number" value="${d.weight}" min="35" max="200" class="form-control" style="padding:4px 6px; font-size:11px;">
            </div>
            <div>
              <label style="font-size:9px; color:var(--gray-text);">الطول (سم)</label>
              <input id="sakhrHeightInp" type="number" value="${d.height}" min="120" max="220" class="form-control" style="padding:4px 6px; font-size:11px;">
            </div>
            <div>
              <label style="font-size:9px; color:var(--gray-text);">الهدف</label>
              <select id="sakhrGoalSel" class="form-control" style="padding:4px; font-size:10px;">
                <option value="cut" ${d.goal === "cut" ? "selected" : ""}>تنشيف</option>
                <option value="maintain" ${d.goal === "maintain" ? "selected" : ""}>ثبات</option>
                <option value="bulk" ${d.goal === "bulk" ? "selected" : ""}>تضخيم</option>
              </select>
            </div>
          </div>
          <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.saveMetrics()" class="btn" style="padding:5px; font-size:10px; background:rgba(249,115,22,0.2); color:#fb923c; border:1px solid #f97316; margin-bottom:7px;">⚡ احسب واحفظ الوزن</button>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.04); padding:6px 8px; border-radius:8px; font-size:10.5px;">
            <span>BMI: <b style="color:${m.bmiColor};">${m.bmi} (${m.bmiLabel})</b></span>
            <span>السعرات: <b>${m.calories}</b></span>
            <span>البروتين: <b style="color:#00e676;">${m.protein} غ</b></span>
          </div>
        </div>

        <div style="background:var(--bg-color); border:1px solid #38bdf8; border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:#38bdf8;">⏱️ مؤقت HIIT (40ث تمرين / 20ث راحة)</b>
            <span id="sakhrHiitRound" style="font-size:10px; color:var(--gold-color);">جولة ${hiitState.round}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div id="sakhrHiitClock" style="font-size:22px; font-weight:900; color:${hiitState.phase === "work" ? "#00e676" : "#f59e0b"};">
              ${hiitState.phase === "work" ? "🔥 تمرين" : "😮‍💨 راحة"} • ${hiitState.secLeft}ث
            </div>
            <div style="display:flex; gap:5px;">
              <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.toggleHiit()" class="btn" style="width:auto; padding:5px 10px; font-size:10px; background:#38bdf8; color:#000;">${hiitState.running ? "⏸️ إيقاف" : "▶️ ابدأ"}</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.resetHiit()" class="btn btn-danger" style="width:auto; padding:5px 8px; font-size:10px;">↺</button>
            </div>
          </div>
        </div>

        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <b>💧 شرب الماء اليومي (${d.waterCups} / 8 أكواب)</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.addWater()" class="btn" style="width:auto; padding:3px 9px; font-size:10px; background:#0ea5e9; color:#fff;">+ كوب ماء</button>
          </div>
          <div style="height:7px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden;">
            <div style="width:${waterPct}%; height:100%; background:linear-gradient(90deg,#38bdf8,#00e676); transition:width 0.25s;"></div>
          </div>
        </div>

        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:var(--gold-color);">🥗 وجبة بعد التمرين (متوفر بالفرع)</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.coach_sakhr.addEconomicProteinBasket()" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:var(--gold-color); color:#000;">🛒 سلة بروتين اقتصادي</button>
          </div>
          ${healthyItems.length ? healthyItems.map(it => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed var(--border-color);">
              <span>${it.name} <small style="color:#00e676;">(${it.price.toLocaleString()} ل.س)</small></span>
              <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',1); if(typeof showToast==='function') showToast('💪 تمت إضافة ${it.name} لسلة البطل!');}" class="btn" style="width:auto; padding:2px 8px; font-size:10px; background:rgba(0,230,118,0.18); color:#00e676; border:1px solid #00e676;">+ أضف</button>
            </div>
          `).join("") : `<div style="color:var(--gray-text); font-size:10px;">تصفح قسم المواد الغذائية لإضافة مصادر البروتين المتوفرة.</div>`}
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); border-radius:10px; padding:8px; font-size:10px; line-height:1.6;">
          <b style="color:#fb923c;">⚡ إحماء سريع (5 دقائق بدون معدات):</b><br>
          1) قفز في المكان 40ث • 2) سكوات 15 عدة • 3) ضغط 10 عدات • 4) بلانك 30ث.
        </div>
      </div>
    `;
    container._sakhrMount = true;
  }

  function rerenderIfMounted() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._sakhrMount) render(el);
  }

  window.MoaathVIPRoomModules.coach_sakhr = {
    render,
    saveMetrics() {
      const d = loadData();
      const w = parseFloat(document.getElementById("sakhrWeightInp")?.value || d.weight);
      const h = parseFloat(document.getElementById("sakhrHeightInp")?.value || d.height);
      const g = document.getElementById("sakhrGoalSel")?.value || d.goal;
      if (w >= 35 && w <= 200) d.weight = w;
      if (h >= 120 && h <= 220) d.height = h;
      d.goal = g;
      d.weightLog.push({ date: new Date().toISOString().slice(0, 10), weight: d.weight });
      d.weightLog = d.weightLog.slice(-12);
      saveData(d);
      vibrate(20);
      if (typeof window.showToast === "function") window.showToast("💪 تم تحديث قياساتك وحساب السعرات والبروتين!");
      rerenderIfMounted();
    },
    addWater() {
      const d = loadData();
      d.waterCups = Math.min(16, (d.waterCups || 0) + 1);
      saveData(d);
      vibrate(15);
      rerenderIfMounted();
    },
    addPushups(n) {
      const d = loadData();
      d.weeklyPushups = Math.min(1000, (d.weeklyPushups || 0) + n);
      saveData(d);
      vibrate(20);
      if (typeof window.showToast === "function") window.showToast(`🔥 كفو يا بطل! وصلت إلى ${d.weeklyPushups} ضغط هذا الأسبوع.`);
      rerenderIfMounted();
    },
    logTodayWorkout() {
      const d = loadData();
      const today = new Date().toISOString().slice(0, 10);
      if (d.lastTrainDate === today) {
        if (typeof window.showToast === "function") window.showToast("✅ تم تسجيل تمرين اليوم مسبقاً، استمر يا بطل!");
        return;
      }
      d.streak = (d.streak || 0) + 1;
      d.lastTrainDate = today;
      saveData(d);
      vibrate([20, 40, 20]);
      if (typeof window.showToast === "function") window.showToast(`🏆 ممتاز! سلسلة الالتزام أصبحت ${d.streak} يوم.`);
      rerenderIfMounted();
    },
    toggleHiit() {
      if (hiitState.running) {
        clearInterval(hiitInterval);
        hiitInterval = null;
        hiitState.running = false;
        rerenderIfMounted();
        return;
      }
      hiitState.running = true;
      vibrate(25);
      hiitInterval = setInterval(() => {
        hiitState.secLeft--;
        if (hiitState.secLeft <= 0) {
          vibrate([40, 30, 40]);
          if (hiitState.phase === "work") {
            hiitState.phase = "rest";
            hiitState.secLeft = 20;
          } else {
            hiitState.phase = "work";
            hiitState.secLeft = 40;
            hiitState.round++;
          }
        }
        const clockEl = document.getElementById("sakhrHiitClock");
        const roundEl = document.getElementById("sakhrHiitRound");
        if (clockEl) {
          clockEl.style.color = hiitState.phase === "work" ? "#00e676" : "#f59e0b";
          clockEl.textContent = `${hiitState.phase === "work" ? "🔥 تمرين" : "😮‍💨 راحة"} • ${hiitState.secLeft}ث`;
        }
        if (roundEl) roundEl.textContent = `جولة ${hiitState.round}`;
      }, 1000);
      rerenderIfMounted();
    },
    resetHiit() {
      clearInterval(hiitInterval);
      hiitInterval = null;
      hiitState = { running: false, phase: "work", secLeft: 40, round: 1 };
      rerenderIfMounted();
    },
    addEconomicProteinBasket() {
      const picks = getHealthyStoreProducts().slice(0, 3);
      if (!picks.length) {
        if (typeof window.showToast === "function") window.showToast("⚠️ لا توجد أصناف بروتين متوفرة حالياً في الفرع.");
        return;
      }
      picks.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      vibrate([15, 30, 15]);
      if (typeof window.showToast === "function") window.showToast(`💪 تمت إضافة أوفر ${picks.length} أصناف بروتين للسلة!`);
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (2/8): الشيف الذهبي — الطبخ وتخطيط الوجبات (grand_chef)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - مرتبطة مباشرة بمخزون وأسعار متجر معاذ ووصفات الإدارة المحفوظة
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_grand_chef_v1";
  const LOCAL_RECIPES_KEY = "moaath_store_local_recipes";

  const CHEF_RECIPES = [
    {
      id: "chef_maqluba",
      title: "مقلوبة باذنجان وبطاطا",
      time: 45,
      difficulty: "متوسط",
      quick15: false,
      ingredients: ["رز", "زيت", "باذنجان", "بطاطا", "بصل", "بهار", "ملح"],
      steps: [
        "اغسل الأرز وانقعه بماء دافئ مع رشة ملح لمدة 20 دقيقة.",
        "اقلِ شرائح الباذنجان والبطاطا حتى تأخذ لوناً ذهبياً جميلاً.",
        "رتّب الخضار في قاع الطنجرة، ثم أضف الأرز والبهارات والمرق الساخن.",
        "اطبخ على نار هادئة 25 دقيقة ثم اقلب الطنجرة وقدّمها ساخنة."
      ]
    },
    {
      id: "chef_mjaddara",
      title: "مجدرة برغل وعدس",
      time: 30,
      difficulty: "سهل",
      quick15: false,
      ingredients: ["برغل", "عدس", "زيت", "بصل", "كمون", "ملح"],
      steps: [
        "اسلق العدس نصف سلقة في ماء مغلي مع رشة كمون.",
        "أضف البرغل الخشن والملح واتركهما على نار هادئة حتى يتشرب الماء.",
        "اقلِ شرائح البصل بالزيت حتى تقرمش، ثم وزّعها فوق المجدرة عند التقديم."
      ]
    },
    {
      id: "chef_lentil_soup",
      title: "شوربة عدس ذهبية",
      time: 25,
      difficulty: "سهل",
      quick15: false,
      ingredients: ["عدس", "بطاطا", "بصل", "زيت", "كمون", "ملح"],
      steps: [
        "شوّح البصل المفروم بالزيت ثم أضف العدس المغسول ومكعبات البطاطا.",
        "اغمرها بالماء الساخن واتركها تغلي 20 دقيقة حتى تنضج تماماً.",
        "اهرُس الشوربة وأضف الكمون والملح وعصرة ليمون عند التقديم."
      ]
    },
    {
      id: "chef_quick_pasta",
      title: "معكرونة سريعة بالصلصة",
      time: 15,
      difficulty: "سهل جداً",
      quick15: true,
      ingredients: ["معكرونة", "معجون طماطم", "زيت", "بصل", "ملح", "بهار"],
      steps: [
        "اسلق المعكرونة في ماء مغلي مملح لمدة 9 دقائق ثم صفّها.",
        "شوّح البصل بالزيت وأضف معجون الطماطم ونصف كوب من ماء السلق.",
        "قلّب المعكرونة مع الصلصة لمدة 3 دقائق وقدّمها فوراً."
      ]
    },
    {
      id: "chef_shakshuka",
      title: "شكشوكة طوارئ بـ 15 دقيقة",
      time: 15,
      difficulty: "سهل جداً",
      quick15: true,
      ingredients: ["بيض", "بندورة", "بصل", "زيت", "ملح", "فلفل"],
      steps: [
        "شوّح البصل بالزيت ثم أضف البندورة المفرومة واتركها تتسبك 7 دقائق.",
        "اصنع فجوات صغيرة وأضف البيض مع رشة ملح وفلفل أسود.",
        "غطِّ المقلاة 4 دقائق حتى ينضج البيض وقدّمها ساخنة."
      ]
    },
    {
      id: "chef_indomie_special",
      title: "نودلز الشيف السريعة بالخضار",
      time: 10,
      difficulty: "سهل جداً",
      quick15: true,
      ingredients: ["اندومي", "زيت", "بصل", "بهار"],
      steps: [
        "اسلق النودلز دقيقتين فقط لتبقى متماسكة.",
        "شوّح القليل من البصل والبهارات بالزيت ثم أضف النودلز مع بهارها.",
        "قلّبها دقيقة واحدة على نار عالية واستمتع بطعم مضاعف."
      ]
    },
    {
      id: "chef_kabsa",
      title: "كبسة أرز مبهرة",
      time: 40,
      difficulty: "متوسط",
      quick15: false,
      ingredients: ["رز", "سمن", "بصل", "معجون طماطم", "بهار", "ملح"],
      steps: [
        "حمّر البصل بالسمن وأضف معجون الطماطم وبهارات الكبسة.",
        "أضف الأرز المغسول والمنقوع وقلّبه دقيقة ليتغلف بالنكهة.",
        "أضف الماء الساخن واطبخه على نار هادئة 25 دقيقة حتى يتفلفل."
      ]
    }
  ];

  const DAILY_SECRETS = [
    "سر فلفلة الأرز: انقعه 20 دقيقة بماء دافئ مع ملعقة خل صغيرة، ثم اطبخه على نار هادئة جداً دون فتح الغطاء.",
    "سر قرمشة البطاطا: انقع أصابع البطاطا بماء بارد مع رشة نشا وملح 15 دقيقة قبل القلي وجففها جيداً.",
    "سر شوربة العدس الغنية: أضف حبة بطاطا صغيرة مع العدس لتمنحها قواماً كريمياً دون الحاجة للكريمة.",
    "سر عدم التصاق المعكرونة: أضف الملح لماء السلق بعد الغليان وحرّكها في أول دقيقتين فقط.",
    "سر نكهة البهارات القوية: حمّص البهارات 20 ثانية مع الزيت قبل إضافة الماء لتتضاعف رائحتها."
  ];

  const SUBSTITUTES = [
    { missing: "السمن", alt: "زيت نباتي + رشة بهار خفيفة" },
    { missing: "معجون الطماطم", alt: "بندورة مبشورة مطبوخة 5 دقائق على نار هادئة" },
    { missing: "النشا", alt: "ملعقة طحين أبيض مذابة بماء بارد" },
    { missing: "الحليب السائل", alt: "3 ملاعق حليب بودرة لكل كوب ماء دافئ" }
  ];

  const FRIDGE_OPTIONS = ["رز", "برغل", "عدس", "معكرونة", "بيض", "بطاطا", "بصل", "زيت", "اندومي", "بندورة"];

  const timers = {
    t1: { label: "الأرز / الأساسي", sec: 1200, running: false, id: null },
    t2: { label: "المرق / الجانبي", sec: 600, running: false, id: null }
  };

  let uiState = {
    selectedRecipeId: "chef_maqluba",
    servings: 4,
    fridgeSelected: [],
    checkedOwned: {},
    maxBudgetFilter: 0,
    onlyQuick15: false,
    handsFreeMode: false,
    handsFreeStep: 0
  };

  function loadData() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        favorites: Array.isArray(d.favorites) ? d.favorites : [],
        weeklyPlan: Array.isArray(d.weeklyPlan) ? d.weeklyPlan : []
      };
    } catch (_) {
      return { favorites: [], weeklyPlan: [] };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function normAr(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .trim();
  }

  function vibrate(p = 20) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getMergedRecipes() {
    const adminRecs = [];
    try {
      const raw = JSON.parse(localStorage.getItem(LOCAL_RECIPES_KEY) || "{}");
      Object.values(raw || {}).forEach(r => {
        if (r && r.title) {
          adminRecs.push({
            id: "adm_" + (r.id || r.title),
            title: r.title,
            time: 30,
            difficulty: "وصفة المتجر",
            isStoreRecipe: true,
            quick15: false,
            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
            steps: ["جهّز المكونات المتوفرة من متجر معاذ واتبع خطوات التحضير المعتادة لوصفة " + r.title + "."]
          });
        }
      });
    } catch (_) {}
    return [...adminRecs, ...CHEF_RECIPES];
  }

  function matchIngredientInStore(ingName) {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const target = normAr(ingName);
    const isW = window.currentUser?.userType === "wholesale";
    let best = null;

    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p) return;
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      if (st <= 0) return;

      if (normAr(p.name || "").includes(target)) {
        const price = typeof window.calcSYP === "function"
          ? window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0))
          : 0;
        if (!best || (price > 0 && price < best.price)) {
          best = { id: pid, name: p.name, price, stock: st };
        }
      }
    });
    return best;
  }

  function analyzeRecipeCost(recipe, servings) {
    const mult = servings >= 8 ? 2 : 1;
    let totalCost = 0;
    const mapped = (recipe.ingredients || []).map(ing => {
      const hit = matchIngredientInStore(ing);
      const owned = !!uiState.checkedOwned[`${recipe.id}::${ing}`];
      const cost = hit ? hit.price * mult : 0;
      if (!owned && hit) totalCost += cost;
      return { ing, hit, owned, qty: mult, cost };
    });
    return { mapped, totalCost, mult };
  }

  function fmtClock(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const allRecipes = getMergedRecipes();
    const dayIdx = new Date().getDate() % DAILY_SECRETS.length;

    let filtered = allRecipes.filter(r => {
      if (uiState.onlyQuick15 && !r.quick15) return false;
      if (uiState.fridgeSelected.length > 0) {
        const hits = r.ingredients.filter(ing =>
          uiState.fridgeSelected.some(f => normAr(ing).includes(normAr(f)))
        ).length;
        if (hits === 0) return false;
      }
      if (uiState.maxBudgetFilter > 0) {
        const c = analyzeRecipeCost(r, uiState.servings).totalCost;
        if (c > uiState.maxBudgetFilter) return false;
      }
      return true;
    });
    if (!filtered.length) filtered = allRecipes;

    const activeRec = filtered.find(r => r.id === uiState.selectedRecipeId) || filtered[0];
    uiState.selectedRecipeId = activeRec.id;
    const isFav = d.favorites.includes(activeRec.id);
    const analysis = analyzeRecipeCost(activeRec, uiState.servings);

    const handsFreeHtml = uiState.handsFreeMode ? `
      <div style="background:linear-gradient(145deg,#1e1b12,#121212); border:2px solid var(--gold-color); border-radius:14px; padding:14px; text-align:center;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <b style="color:var(--gold-color); font-size:12px;">👨‍🍳 وضع الطبخ بدون لمس — خطوة ${uiState.handsFreeStep + 1} من ${activeRec.steps.length}</b>
          <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleHandsFree(false)" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:10px;">إغلاق</button>
        </div>
        <div style="font-size:16px; font-weight:800; line-height:1.8; color:#fff; padding:12px 6px; min-height:74px;">
          ${activeRec.steps[uiState.handsFreeStep] || ""}
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.stepHandsFree(-1)" class="btn" style="flex:1; padding:10px; font-size:12px; background:var(--card-bg); color:var(--text-color); border:1px solid var(--border-color);">⬅️ السابق</button>
          <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.stepHandsFree(1)" class="btn" style="flex:1; padding:10px; font-size:12px; background:var(--gold-color); color:#000;">التالي ➡️</button>
        </div>
      </div>
    ` : "";

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">

        <!-- 1. سر الشيف اليومي -->
        <div style="background:rgba(212,175,55,0.12); border:1px solid var(--gold-color); border-radius:12px; padding:9px; line-height:1.55;">
          <b style="color:var(--gold-color);">✨ سر الشيف اليومي:</b> ${DAILY_SECRETS[dayIdx]}
        </div>

        ${handsFreeHtml}

        <!-- 2. ميزة "شو عندك بالبراد؟" + الفلاتر السريعة -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:5px;">
            <b style="color:var(--gold-color);">🧊 شو عندك بالبراد؟ (اختر المتوفر لديك)</b>
            <div style="display:flex; gap:4px;">
              <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleQuick15()" class="btn" style="width:auto; padding:3px 7px; font-size:9.5px; background:${uiState.onlyQuick15 ? "#00e676" : "rgba(255,255,255,0.06)"}; color:${uiState.onlyQuick15 ? "#000" : "var(--text-color)"};">⚡ بـ 15 دقيقة</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleBudgetFilter()" class="btn" style="width:auto; padding:3px 7px; font-size:9.5px; background:${uiState.maxBudgetFilter ? "#f59e0b" : "rgba(255,255,255,0.06)"}; color:${uiState.maxBudgetFilter ? "#000" : "var(--text-color)"};">💰 اقتصادية ≤ 500</button>
            </div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${FRIDGE_OPTIONS.map(f => {
              const on = uiState.fridgeSelected.includes(f);
              return `<button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleFridge('${f}')" style="padding:3px 8px; border-radius:999px; font-size:10px; cursor:pointer; border:1px solid ${on ? "#00e676" : "var(--border-color)"}; background:${on ? "rgba(0,230,118,0.2)" : "var(--card-bg)"}; color:${on ? "#00e676" : "var(--text-color)"};">${on ? "✓ " : "+ "}${f}</button>`;
            }).join("")}
          </div>
        </div>

        <!-- 3. اختيار الوصفة ومضاعف عدد الأشخاص وحاسبة التكلفة -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <div style="display:flex; gap:5px; overflow-x:auto; padding-bottom:6px; margin-bottom:7px;">
            ${filtered.map(r => {
              const act = r.id === activeRec.id;
              const star = d.favorites.includes(r.id) ? "⭐ " : "";
              const badge = r.isStoreRecipe ? "🏪 " : "";
              return `<button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.selectRecipe('${r.id}')" style="flex-shrink:0; padding:5px 10px; border-radius:999px; font-size:10px; font-weight:700; cursor:pointer; border:1px solid ${act ? "var(--gold-color)" : "var(--border-color)"}; background:${act ? "var(--gold-color)" : "var(--card-bg)"}; color:${act ? "#000" : "var(--text-color)"};">${badge}${star}${r.title}</button>`;
            }).join("")}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:7px;">
            <div>
              <b style="font-size:13px; color:var(--gold-color);">${activeRec.title}</b>
              <div style="font-size:9.5px; color:var(--gray-text);">⏱️ ${activeRec.time} دقيقة • الصعوبة: ${activeRec.difficulty}</div>
            </div>
            <div style="display:flex; gap:4px;">
              <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleFavorite('${activeRec.id}')" class="btn" style="width:auto; padding:4px 8px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color);">${isFav ? "⭐ مفضلة" : "☆ حفظ"}</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleHandsFree(true)" class="btn" style="width:auto; padding:4px 8px; font-size:10px; background:#38bdf8; color:#000;">📖 خطوات كبيرة</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.shareRecipeWhatsApp()" class="btn" style="width:auto; padding:4px 8px; font-size:10px; background:#22c55e; color:#000;">📲 واتساب</button>
            </div>
          </div>

          <!-- شريط عدد الأشخاص -->
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; background:rgba(255,255,255,0.04); padding:6px 8px; border-radius:8px; margin-bottom:8px;">
            <span>👥 عدد الأشخاص: <b style="color:var(--gold-color);">${uiState.servings}</b></span>
            <input type="range" min="2" max="10" step="2" value="${uiState.servings}" oninput="window.MoaathVIPRoomModules.grand_chef.setServings(this.value)" style="flex:1; accent-color:var(--gold-color);">
            <span>التكلفة: <b style="color:#00e676;">${analysis.totalCost.toLocaleString()} ل.س</b></span>
          </div>

          <!-- قائمة التحقق التفاعلية للمكونات -->
          <div style="font-size:10px; color:var(--gray-text); margin-bottom:4px;">اضغط على المكون الموجود في بيتك لشطبه، لتبقى النواقص فقط للسلة:</div>
          ${analysis.mapped.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed var(--border-color); opacity:${m.owned ? "0.48" : "1"};">
              <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleOwned('${activeRec.id}','${m.ing}')" style="background:none; border:none; color:var(--text-color); font-size:11px; cursor:pointer; text-decoration:${m.owned ? "line-through" : "none"}; padding:0;">
                ${m.owned ? "☑️" : "⬜"} ${m.ing} ${m.hit ? `<small style="color:#00e676;">(${m.hit.name} ×${m.qty} = ${m.cost.toLocaleString()} ل.س)</small>` : `<small style="color:#f59e0b;">(غير متوفر حالياً)</small>`}
              </button>
              ${(!m.owned && m.hit) ? `<button type="button" onclick="if(typeof changeQty==='function'){changeQty('${m.hit.id}',${m.qty}); if(typeof showToast==='function') showToast('🍲 تمت إضافة ${m.hit.name}');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(0,230,118,0.18); color:#00e676;">+ أضف</button>` : ""}
            </div>
          `).join("")}

          <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.addMissingToCart()" class="btn" style="margin-top:8px; background:linear-gradient(45deg,#d4af37,#f59e0b); color:#000; font-size:11px; padding:7px;">🛒 إضافة نواقص (${activeRec.title}) للسلة (${analysis.totalCost.toLocaleString()} ل.س)</button>
        </div>

        <!-- 4. مؤقت الطبخ المتعدد (مؤقتان معاً) -->
        <div style="background:var(--bg-color); border:1px solid #38bdf8; border-radius:12px; padding:10px;">
          <b style="color:#38bdf8; display:block; margin-bottom:6px;">⏱️ مؤقت الطبخ المتعدد</b>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px;">
            ${["t1", "t2"].map(k => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:9px; padding:7px; text-align:center;">
                <div style="font-size:9.5px; color:var(--gray-text);">${timers[k].label}</div>
                <div id="chefTimer_${k}" style="font-size:17px; font-weight:900; color:var(--gold-color); margin:3px 0;">${fmtClock(timers[k].sec)}</div>
                <div style="display:flex; gap:4px; justify-content:center;">
                  <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.toggleTimer('${k}')" class="btn" style="width:auto; padding:3px 8px; font-size:9.5px; background:#38bdf8; color:#000;">${timers[k].running ? "⏸️" : "▶️"}</button>
                  <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.resetTimer('${k}')" class="btn btn-danger" style="width:auto; padding:3px 7px; font-size:9.5px;">↺</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 5. جدول طبخات الأسبوع وموسوعة البدائل -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:var(--gold-color);">📅 جدول طبخات الأسبوع</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.grand_chef.generateWeeklyPlan()" class="btn" style="width:auto; padding:3px 8px; font-size:9.5px; background:rgba(0,230,118,0.18); color:#00e676;">🎲 توليد جدول 7 أيام</button>
          </div>
          ${d.weeklyPlan.length ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:10px;">
              ${d.weeklyPlan.map(row => `<div style="background:rgba(255,255,255,0.03); padding:4px 6px; border-radius:6px;"><b>${row.day}:</b> ${row.title}</div>`).join("")}
            </div>
          ` : `<div style="font-size:10px; color:var(--gray-text);">اضغط «توليد جدول 7 أيام» ليرتّب لك الشيف طبخات الأسبوع كاملة.</div>`}
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); border-radius:10px; padding:8px; font-size:10px; line-height:1.6;">
          <b style="color:var(--gold-color);">🧂 موسوعة البدائل السريعة:</b><br>
          ${SUBSTITUTES.map(s => `• بديل <b>${s.missing}</b>: ${s.alt}`).join("<br>")}
        </div>

      </div>
    `;
    container._grandChefMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._grandChefMount) render(el);
  }

  window.MoaathVIPRoomModules.grand_chef = {
    render,
    selectRecipe(id) {
      uiState.selectedRecipeId = id;
      uiState.handsFreeStep = 0;
      rerender();
    },
    setServings(val) {
      uiState.servings = parseInt(val, 10) || 4;
      rerender();
    },
    toggleFridge(item) {
      const idx = uiState.fridgeSelected.indexOf(item);
      if (idx >= 0) uiState.fridgeSelected.splice(idx, 1);
      else uiState.fridgeSelected.push(item);
      rerender();
    },
    toggleOwned(recId, ing) {
      const k = `${recId}::${ing}`;
      uiState.checkedOwned[k] = !uiState.checkedOwned[k];
      vibrate(12);
      rerender();
    },
    toggleQuick15() {
      uiState.onlyQuick15 = !uiState.onlyQuick15;
      rerender();
    },
    toggleBudgetFilter() {
      uiState.maxBudgetFilter = uiState.maxBudgetFilter ? 0 : 500;
      rerender();
    },
    toggleFavorite(recId) {
      const d = loadData();
      if (d.favorites.includes(recId)) d.favorites = d.favorites.filter(x => x !== recId);
      else d.favorites.push(recId);
      saveData(d);
      vibrate(15);
      rerender();
    },
    toggleHandsFree(on) {
      uiState.handsFreeMode = !!on;
      uiState.handsFreeStep = 0;
      rerender();
    },
    stepHandsFree(delta) {
      const rec = getMergedRecipes().find(r => r.id === uiState.selectedRecipeId) || CHEF_RECIPES[0];
      const next = uiState.handsFreeStep + delta;
      if (next >= 0 && next < rec.steps.length) {
        uiState.handsFreeStep = next;
        vibrate(12);
        rerender();
      }
    },
    addMissingToCart() {
      const rec = getMergedRecipes().find(r => r.id === uiState.selectedRecipeId) || CHEF_RECIPES[0];
      const { mapped } = analyzeRecipeCost(rec, uiState.servings);
      let added = 0;
      mapped.forEach(m => {
        if (!m.owned && m.hit && typeof window.changeQty === "function") {
          window.changeQty(m.hit.id, m.qty);
          added++;
        }
      });
      vibrate([15, 30, 15]);
      if (typeof window.showToast === "function") {
        window.showToast(added ? `👨‍🍳 تمت إضافة ${added} مكونات ناقصة لوصفة (${rec.title}) للسلة!` : "✅ جميع المكونات المتوفرة محددة كموجودة لديك.");
      }
    },
    toggleTimer(k) {
      const t = timers[k];
      if (!t) return;
      if (t.running) {
        clearInterval(t.id);
        t.id = null;
        t.running = false;
        rerender();
        return;
      }
      t.running = true;
      t.id = setInterval(() => {
        t.sec--;
        if (t.sec <= 0) {
          clearInterval(t.id);
          t.id = null;
          t.running = false;
          t.sec = 0;
          vibrate([60, 40, 60]);
          if (typeof window.showToast === "function") window.showToast(`⏰ انتهى مؤقت (${t.label})!`);
        }
        const el = document.getElementById("chefTimer_" + k);
        if (el) el.textContent = fmtClock(t.sec);
      }, 1000);
      rerender();
    },
    resetTimer(k) {
      const t = timers[k];
      if (!t) return;
      clearInterval(t.id);
      t.id = null;
      t.running = false;
      t.sec = k === "t1" ? 1200 : 600;
      rerender();
    },
    generateWeeklyPlan() {
      const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
      const pool = getMergedRecipes();
      const d = loadData();
      d.weeklyPlan = days.map((day, idx) => ({
        day,
        title: pool[(idx + Math.floor(Math.random() * pool.length)) % pool.length].title
      }));
      saveData(d);
      vibrate(20);
      rerender();
    },
    shareRecipeWhatsApp() {
      const rec = getMergedRecipes().find(r => r.id === uiState.selectedRecipeId) || CHEF_RECIPES[0];
      const txt = `👨‍🍳 وصفة من الشيف الذهبي — متجر معاذ:\n🍲 ${rec.title} (${uiState.servings} أشخاص)\nالمكونات: ${rec.ingredients.join("، ")}\nالخطوات:\n${rec.steps.map((s, i) => `${i + 1}) ${s}`).join("\n")}`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "📲 تم نسخ الوصفة جاهزة للمشاركة على واتساب!");
      } else if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(txt).then(() => window.showToast && window.showToast("📲 تم نسخ الوصفة!"));
      }
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (3/8): الأميرة ليلى — الأناقة والضيافة والعناية (princess_layla)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - مرتبطة مباشرة بمخزون متجر معاذ وحسابات الضيافة والمناسبات
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_layla_v1";

  const ETIQUETTE_TIPS = [
    "تقديم كوب ماء بارد بجانب فنجان القهوة يضفي لمسة ضيافة راقية ومريحة للضيف.",
    "ترتيب البسكويت والشوكولاتة بلونين متناغمين على صينية بسيطة يرفع جمال التقديم فوراً.",
    "إضافة ورقة نعناع أو شريحة ليمون لعصير الضيافة يمنحها انتعاشاً ومظهراً فندقياً.",
    "تحضير ركن ثابت للقهوة والشاي يوفر وقتك عند قدوم الضيوف المفاجئين."
  ];

  const HOSPITALITY_MODES = {
    morning_coffee: {
      title: "قهوة صباحية راقية",
      keywords: ["قهوة", "قهوه", "بسكوت", "شوكولاتة", "شوكولاته", "حليب", "سكر"]
    },
    surprise_guests: {
      title: "ضيافة سريعة بـ 5 دقائق",
      keywords: ["شاي", "عصير", "بسكوت", "شوكولاتة", "شوكولاته", "موالح", "كيك"]
    },
    formal_feast: {
      title: "عزيمة رسمية متكاملة",
      keywords: ["قهوة", "شاي", "عصير", "شوكولاتة", "بسكوت", "مناديل", "محارم", "سكر"]
    }
  };

  const CARE_ROUTINE = [
    { id: "am_water", label: "كوب ماء صباحي دافئ" },
    { id: "am_clean", label: "غسول وعناية صباحية" },
    { id: "pm_tea", label: "مشروب استرخاء مسائي" },
    { id: "pm_care", label: "ترطيب وعناية قبل النوم" }
  ];

  let uiState = {
    hospMode: "morning_coffee",
    guestsCount: 4,
    giftSelectedIds: [],
    warmGoldMode: false
  };

  function loadData() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (d.routineDate !== today) {
        d.routineDone = {};
        d.routineDate = today;
      }
      return {
        routineDone: d.routineDone || {},
        routineDate: today,
        careStreak: d.careStreak || 0,
        lastCareDay: d.lastCareDay || "",
        occasions: Array.isArray(d.occasions) ? d.occasions : [],
        memoItems: Array.isArray(d.memoItems) ? d.memoItems : []
      };
    } catch (_) {
      return { routineDone: {}, routineDate: today, careStreak: 0, lastCareDay: "", occasions: [], memoItems: [] };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function normAr(s) {
    return String(s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
  }

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getSeasonInfo() {
    const m = new Date().getMonth() + 1;
    const isWinter = m >= 10 || m <= 3;
    return isWinter
      ? { label: "موسم الشتاء الدافئ ❄️", drinkHint: "شاي، قهوة، كاكاو دافئ مع بسكويت", kw: ["شاي", "قهوة", "كاكاو", "حليب", "بسكوت"] }
      : { label: "موسم الصيف المنعش ☀️", drinkHint: "عصائر باردة، ماء بارد، وشوكولاتة خفيفة", kw: ["عصير", "ماء", "بسكوت", "شوكولاتة"] };
  }

  function findStoreItemsByKeywords(keywords, limit = 6) {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const isW = window.currentUser?.userType === "wholesale";
    const list = [];

    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p) return;
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      if (st <= 0) return;

      const txt = normAr((p.name || "") + " " + (p.category || ""));
      if (keywords.some(k => txt.includes(normAr(k)))) {
        const price = typeof window.calcSYP === "function"
          ? window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0))
          : 0;
        if (price > 0) list.push({ id: pid, name: p.name, price, stock: st });
      }
    });
    return list.sort((a, b) => a.price - b.price).slice(0, limit);
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const season = getSeasonInfo();
    const tip = ETIQUETTE_TIPS[new Date().getDate() % ETIQUETTE_TIPS.length];
    const modeObj = HOSPITALITY_MODES[uiState.hospMode] || HOSPITALITY_MODES.morning_coffee;
    const hospItems = findStoreItemsByKeywords(modeObj.keywords, 6);
    const careItems = findStoreItemsByKeywords(["صابون", "شامبو", "مناديل", "محارم", "معطر", "كريم"], 4);
    const qtyPerGuest = uiState.guestsCount >= 8 ? 2 : 1;

    // 3 مستويات لباقات الضيافة
    const tierBasic = hospItems.slice(0, 2);
    const tierMid = hospItems.slice(0, 4);
    const tierLux = hospItems.slice(0, 6);
    const sumTier = arr => arr.reduce((a, b) => a + b.price * qtyPerGuest, 0);

    const wrapBg = uiState.warmGoldMode
      ? "background:linear-gradient(160deg,#231c10,#16120b); border:1px solid #d4af37; border-radius:14px; padding:10px;"
      : "";

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px; ${wrapBg}">

        <!-- 1. إتيكيت اليوم + طابع الموسم + وضع الهدوء الذهبي -->
        <div style="background:rgba(244,114,182,0.12); border:1px solid #f472b6; border-radius:12px; padding:9px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#f472b6;">👑 إتيكيت ولطافة اليوم • ${season.label}</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.toggleWarmMode()" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(212,175,55,0.2); color:var(--gold-color);">${uiState.warmGoldMode ? "🌙 هادئ" : "✨ ذهبي"}</button>
          </div>
          <div style="line-height:1.55;">${tip}</div>
          <div style="font-size:10px; color:var(--gold-color); margin-top:4px;">🍵 ركن الاسترخاء المقترح: ${season.drinkHint}</div>
        </div>

        <!-- 2. منسّق الضيافة الفاخرة ومخطط طاولة العزيمة -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:6px;">🫖 منسّق الضيافة ومخطط طاولة العزيمة</b>
          <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:7px;">
            ${Object.keys(HOSPITALITY_MODES).map(k => {
              const on = uiState.hospMode === k;
              return `<button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.setHospMode('${k}')" style="padding:4px 9px; border-radius:999px; font-size:10px; cursor:pointer; border:1px solid ${on ? "#f472b6" : "var(--border-color)"}; background:${on ? "#f472b6" : "var(--card-bg)"}; color:${on ? "#000" : "var(--text-color)"}; font-weight:700;">${HOSPITALITY_MODES[k].title}</button>`;
            }).join("")}
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; background:rgba(255,255,255,0.04); padding:6px 8px; border-radius:8px;">
            <span>👥 عدد الضيوف: <b style="color:#f472b6;">${uiState.guestsCount}</b></span>
            <input type="range" min="2" max="16" step="2" value="${uiState.guestsCount}" oninput="window.MoaathVIPRoomModules.princess_layla.setGuests(this.value)" style="flex:1; accent-color:#f472b6;">
          </div>

          <!-- مقارنة 3 مستويات لباقات الضيافة -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; margin-bottom:8px; text-align:center;">
            <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.addTier('basic')" class="btn" style="padding:6px 4px; font-size:9.5px; background:rgba(255,255,255,0.05); color:var(--text-color); border:1px solid var(--border-color);">
              🌸 بسيطة<br><b style="color:#00e676;">${sumTier(tierBasic).toLocaleString()} ل.س</b>
            </button>
            <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.addTier('mid')" class="btn" style="padding:6px 4px; font-size:9.5px; background:rgba(244,114,182,0.14); color:#f472b6; border:1px solid #f472b6;">
              💐 متوسطة<br><b>${sumTier(tierMid).toLocaleString()} ل.س</b>
            </button>
            <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.addTier('lux')" class="btn" style="padding:6px 4px; font-size:9.5px; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color);">
              👑 فاخرة<br><b>${sumTier(tierLux).toLocaleString()} ل.س</b>
            </button>
          </div>

          ${hospItems.map(it => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color);">
              <span>${it.name} <small style="color:#00e676;">(${it.price.toLocaleString()} ل.س × ${qtyPerGuest})</small></span>
              <div style="display:flex; gap:4px;">
                <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.toggleGiftItem('${it.id}')" class="btn" style="width:auto; padding:2px 6px; font-size:9.5px; background:${uiState.giftSelectedIds.includes(it.id) ? "#f472b6" : "rgba(255,255,255,0.06)"}; color:${uiState.giftSelectedIds.includes(it.id) ? "#000" : "var(--text-color)"};">🎁</button>
                <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',${qtyPerGuest}); if(typeof showToast==='function') showToast('👑 تمت إضافة ${it.name}');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(0,230,118,0.18); color:#00e676;">+ أضف</button>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- 3. منسّق سلال الهدايا -->
        <div style="background:var(--bg-color); border:1px solid #f472b6; border-radius:12px; padding:10px;">
          <b style="color:#f472b6; display:block; margin-bottom:5px;">🎁 منسّق سلة الهدية (اختر بالأعلى بعلامة 🎁 — المحدد: ${uiState.giftSelectedIds.length})</b>
          <input id="laylaGiftNoteInp" type="text" class="form-control" placeholder="اكتب بطاقة إهداء لطيفة (مثال: كل عام وأنتِ بخير)..." style="padding:5px 8px; font-size:10.5px; margin-bottom:6px;">
          <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.confirmGiftBasket()" class="btn" style="background:linear-gradient(45deg,#f472b6,#d4af37); color:#000; font-size:10.5px; padding:6px;">🎀 إضافة سلة الهدية ونسخ بطاقة الإهداء</button>
        </div>

        <!-- 4. روتين العناية اليومي وسلسلة الالتزام -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:#f472b6;">💆‍♀️ روتين العناية اليومي</b>
            <span style="font-size:10px; color:var(--gold-color);">✨ سلسلة العناية: ${d.careStreak} يوم</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:7px;">
            ${CARE_ROUTINE.map(item => {
              const done = !!d.routineDone[item.id];
              return `<button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.toggleRoutine('${item.id}')" style="text-align:right; padding:5px 7px; border-radius:8px; font-size:10px; cursor:pointer; border:1px solid ${done ? "#00e676" : "var(--border-color)"}; background:${done ? "rgba(0,230,118,0.14)" : "var(--card-bg)"}; color:var(--text-color);">${done ? "☑️" : "⬜"} ${item.label}</button>`;
            }).join("")}
          </div>
          ${careItems.length ? `<div style="font-size:10px; color:var(--gray-text);">منتجات عناية متوفرة: ${careItems.map(c => `<button type="button" onclick="if(typeof changeQty==='function'){changeQty('${c.id}',1); showToast('✨ أُضيف ${c.name}');}" style="background:none; border:none; color:#38bdf8; cursor:pointer; text-decoration:underline; font-size:10px;">${c.name}</button>`).join(" • ")}</div>` : ""}
        </div>

        <!-- 5. تذكير المناسبات الخاصة + بطاقة دعوة واتساب + مذكرة أغراضي الخاصة -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:5px;">🗓️ تذكير المناسبات الخاصة ودعوات واتساب</b>
          <div style="display:flex; gap:5px; margin-bottom:6px;">
            <input id="laylaOccTitle" type="text" class="form-control" placeholder="اسم المناسبة (زيارة / عيد)..." style="flex:2; padding:4px 7px; font-size:10px;">
            <input id="laylaOccDate" type="date" class="form-control" style="flex:1; padding:4px; font-size:10px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.addOccasion()" class="btn" style="width:auto; padding:4px 8px; font-size:10px; background:var(--gold-color); color:#000;">+</button>
          </div>
          ${d.occasions.map((o, i) => `<div style="display:flex; justify-content:space-between; font-size:10px; padding:3px 0; border-bottom:1px dashed var(--border-color);"><span>🎀 ${o.title} (${o.date})</span><button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.removeOccasion(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button></div>`).join("")}
          <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.copyInviteTemplate()" class="btn" style="margin-top:7px; background:rgba(34,197,94,0.18); color:#22c55e; border:1px solid #22c55e; font-size:10px; padding:5px;">📲 نسخ بطاقة دعوة لطيفة لواتساب</button>
        </div>

        <!-- 6. مذكرة أغراضي الخاصة -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:#f472b6; display:block; margin-bottom:5px;">📝 مذكرة أغراضي الخاصة</b>
          <div style="display:flex; gap:5px; margin-bottom:6px;">
            <input id="laylaMemoInp" type="text" class="form-control" placeholder="أضف غرضاً خاصاً للبيت أو العناية..." style="flex:1; padding:4px 7px; font-size:10px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.addMemo()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:#f472b6; color:#000;">حفظ</button>
          </div>
          ${d.memoItems.map((m, i) => `<div style="display:flex; justify-content:space-between; font-size:10px; padding:3px 0; border-bottom:1px dashed var(--border-color);"><span>• ${m}</span><button type="button" onclick="window.MoaathVIPRoomModules.princess_layla.removeMemo(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button></div>`).join("")}
        </div>

      </div>
    `;
    container._laylaMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._laylaMount) render(el);
  }

  window.MoaathVIPRoomModules.princess_layla = {
    render,
    setHospMode(k) { uiState.hospMode = k; rerender(); },
    setGuests(v) { uiState.guestsCount = parseInt(v, 10) || 4; rerender(); },
    toggleWarmMode() { uiState.warmGoldMode = !uiState.warmGoldMode; rerender(); },
    toggleGiftItem(pid) {
      const idx = uiState.giftSelectedIds.indexOf(pid);
      if (idx >= 0) uiState.giftSelectedIds.splice(idx, 1);
      else if (uiState.giftSelectedIds.length < 5) uiState.giftSelectedIds.push(pid);
      vibrate(12);
      rerender();
    },
    addTier(tier) {
      const modeObj = HOSPITALITY_MODES[uiState.hospMode] || HOSPITALITY_MODES.morning_coffee;
      const all = findStoreItemsByKeywords(modeObj.keywords, 6);
      const picked = tier === "basic" ? all.slice(0, 2) : tier === "mid" ? all.slice(0, 4) : all.slice(0, 6);
      const qty = uiState.guestsCount >= 8 ? 2 : 1;
      picked.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, qty); });
      vibrate([15, 25, 15]);
      if (typeof window.showToast === "function") window.showToast(`👑 تمت إضافة باقة الضيافة (${picked.length} أصناف) إلى السلة!`);
    },
    confirmGiftBasket() {
      if (!uiState.giftSelectedIds.length) {
        if (typeof window.showToast === "function") window.showToast("🎁 اضغط رمز الهدية بجانب الأصناف أولاً لتجميع سلة الهدية.");
        return;
      }
      const note = String(document.getElementById("laylaGiftNoteInp")?.value || "هدية لطيفة بكل محبة").trim();
      uiState.giftSelectedIds.forEach(pid => { if (typeof window.changeQty === "function") window.changeQty(pid, 1); });
      const txt = `🎁 بطاقة إهداء من متجر معاذ:\n"${note}"`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "🎀 أُضيفت سلة الهدية للسلة وتم نسخ بطاقة الإهداء!");
      }
      uiState.giftSelectedIds = [];
      rerender();
    },
    toggleRoutine(id) {
      const d = loadData();
      d.routineDone[id] = !d.routineDone[id];
      const allDone = CARE_ROUTINE.every(x => d.routineDone[x.id]);
      const today = new Date().toISOString().slice(0, 10);
      if (allDone && d.lastCareDay !== today) {
        d.careStreak = (d.careStreak || 0) + 1;
        d.lastCareDay = today;
      }
      saveData(d);
      vibrate(15);
      rerender();
    },
    addOccasion() {
      const title = String(document.getElementById("laylaOccTitle")?.value || "").trim();
      const date = String(document.getElementById("laylaOccDate")?.value || "").trim();
      if (!title || !date) return;
      const d = loadData();
      d.occasions.push({ title, date });
      saveData(d);
      rerender();
    },
    removeOccasion(idx) {
      const d = loadData();
      d.occasions.splice(idx, 1);
      saveData(d);
      rerender();
    },
    addMemo() {
      const txt = String(document.getElementById("laylaMemoInp")?.value || "").trim();
      if (!txt) return;
      const d = loadData();
      d.memoItems.push(txt);
      saveData(d);
      rerender();
    },
    removeMemo(idx) {
      const d = loadData();
      d.memoItems.splice(idx, 1);
      saveData(d);
      rerender();
    },
    copyInviteTemplate() {
      const txt = `🌸 يسعدني جداً دعوتكم لجلسة قهوة وضيافة لطيفة عندنا في البيت، بانتظاركم بكل محبة وسرور 🫖✨`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "📲 تم نسخ بطاقة الدعوة لواتساب!");
      }
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (4/8): السيد فريد — التنظيم والميزانية والتسوق الذكي (butler_farid)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - مرتبطة مباشرة بمخزون وأسعار متجر معاذ والسلة الحالية والعروض الخاصة
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_farid_v1";

  const SAVING_TIPS = [
    "شراء المونة الأساسية بالعبوة أو الطرد يوفر عادةً بين 8% و 15% من مصروف الشهر.",
    "تحديد سقف الميزانية قبل التسوق يمنع المشتريات العشوائية ويحافظ على توازن السلة.",
    "مراجعة العروض الخاصة أولاً تساعدك على استبدال الأصناف الدورية بأسعار أوفر.",
    "تخزين الحبوب والعدس والأرز في أوعية محكمة الإغلاق يحفظ جودتها لأشهر طويلة."
  ];

  const PANTRY_ESSENTIALS = ["سكر", "زيت", "رز", "شاي", "ملح", "سائل جلي", "صابون", "محارم"];

  const SAVED_LIST_PRESETS = {
    monthly: { title: "قائمة بداية الشهر", keywords: ["رز", "سكر", "زيت", "شاي", "عدس", "برغل", "سائل جلي"] },
    friday: { title: "قائمة الجمعة", keywords: ["قهوة", "شاي", "متة", "بسكوت", "عصير", "بزر"] },
    emergency: { title: "قائمة الطوارئ السريعة", keywords: ["اندومي", "تونة", "بيض", "جبن", "خبز", "ماء"] }
  };

  let uiState = {
    splitCount: 2,
    compactMode: false,
    lowerBillSuggestions: []
  };

  function loadData() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        monthlyBudget: parseInt(d.monthlyBudget, 10) || 15000,
        homeNotes: Array.isArray(d.homeNotes) ? d.homeNotes : []
      };
    } catch (_) {
      return { monthlyBudget: 15000, homeNotes: [] };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function normAr(s) {
    return String(s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
  }

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getStock(p) {
    if (!p) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(p.stock, 10) || 0);
  }

  function getUnitPrice(pid) {
    const prods = window.products || {};
    const offers = window.specialOffers || {};
    const isW = window.currentUser?.userType === "wholesale";
    if (String(pid).startsWith("OFFER_")) {
      const so = offers[pid];
      return so && typeof window.calcSYP === "function"
        ? window.calcSYP((isW && so.wholesaleUSD > 0) ? so.wholesaleUSD : (so.newPriceUSD || 0))
        : 0;
    }
    if (String(pid).endsWith("_PKG")) {
      const p = prods[String(pid).replace(/_PKG$/, "")];
      return p && typeof window.calcSYP === "function" ? window.calcSYP(p.pkgPriceUSD || 0) : 0;
    }
    const p = prods[pid];
    return p && typeof window.calcSYP === "function"
      ? window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0))
      : 0;
  }

  function getCartStats() {
    const cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    let totalSYP = 0;
    const byCat = {};
    const entries = [];

    Object.keys(cartObj).forEach(k => {
      const item = cartObj[k];
      const qty = parseInt(item?.qty, 10) || 0;
      if (qty <= 0) return;
      const unit = getUnitPrice(k);
      const sub = unit * qty;
      totalSYP += sub;
      const cat = item.category || "أخرى";
      byCat[cat] = (byCat[cat] || 0) + sub;
      entries.push({ id: k, name: item.name || k, qty, unit, sub, cat });
    });

    return { totalSYP, byCat, entries };
  }

  function getPkgSavingsDeals() {
    const prods = window.products || {};
    const deals = [];
    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p || getStock(p) <= 0) return;
      const pkgQty = parseInt(p.pkgQty, 10) || 0;
      const pkgPrice = typeof window.calcSYP === "function" ? window.calcSYP(p.pkgPriceUSD || 0) : 0;
      const singlePrice = getUnitPrice(pid);
      if (pkgQty > 1 && pkgPrice > 0 && singlePrice > 0) {
        const normalCost = singlePrice * pkgQty;
        const saving = normalCost - pkgPrice;
        if (saving > 0) {
          deals.push({ id: pid + "_PKG", name: p.name, pkgQty, pkgPrice, saving });
        }
      }
    });
    return deals.sort((a, b) => b.saving - a.saving).slice(0, 4);
  }

  function getTopSpecialOffers() {
    const offers = window.specialOffers || {};
    const list = [];
    Object.keys(offers).forEach(oid => {
      const o = offers[oid];
      if (!o || getStock(o) <= 0) return;
      const oldP = typeof window.calcSYP === "function" ? window.calcSYP(o.oldPriceUSD || 0) : 0;
      const newP = getUnitPrice(oid);
      if (newP <= 0) return;
      const pct = oldP > newP ? Math.round(((oldP - newP) / oldP) * 100) : 0;
      list.push({ id: oid, name: o.name || "عرض خاص", newP, oldP, pct });
    });
    return list.sort((a, b) => b.pct - a.pct).slice(0, 4);
  }

  function matchByKeywords(keywords, limit = 6) {
    const prods = window.products || {};
    const out = [];
    keywords.forEach(kw => {
      const t = normAr(kw);
      let best = null;
      Object.keys(prods).forEach(pid => {
        const p = prods[pid];
        if (!p || getStock(p) <= 0) return;
        if (normAr(p.name || "").includes(t)) {
          const price = getUnitPrice(pid);
          if (price > 0 && (!best || price < best.price)) {
            best = { id: pid, name: p.name, price };
          }
        }
      });
      if (best && !out.some(x => x.id === best.id)) out.push(best);
    });
    return out.slice(0, limit);
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const cartStats = getCartStats();
    const remaining = Math.max(0, d.monthlyBudget - cartStats.totalSYP);
    const usedPct = d.monthlyBudget > 0 ? Math.min(100, Math.round((cartStats.totalSYP / d.monthlyBudget) * 100)) : 0;
    const perPerson = uiState.splitCount > 0 ? Math.ceil(cartStats.totalSYP / uiState.splitCount) : cartStats.totalSYP;
    const pkgDeals = getPkgSavingsDeals();
    const topOffers = getTopSpecialOffers();
    const tip = SAVING_TIPS[new Date().getDate() % SAVING_TIPS.length];
    const catEntries = Object.entries(cartStats.byCat).sort((a, b) => b[1] - a[1]);
    const barColors = ["#d4af37", "#38bdf8", "#00e676", "#f472b6", "#f97316"];

    // مؤشر كفاية السلة
    const hasFood = catEntries.some(([c]) => /غذائ|مواد|مونه|طبخ/.test(normAr(c)));
    const hasClean = catEntries.some(([c]) => /منظف|تنظيف/.test(normAr(c)));
    const balanceHint = !cartStats.entries.length
      ? "السلة فارغة حالياً — ابدأ بقائمة المونة الأساسية."
      : (hasFood && hasClean)
        ? "✅ سلتك متوازنة وتغطي الغذائيات والمنظفات."
        : (!hasClean ? "💡 سلتك تركز على الغذائيات وتفتقد لقسم المنظفات." : "💡 سلتك تركز على المنظفات وتفتقد للغذائيات الأساسية.");

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">

        <!-- 1. نصيحة التوفير + تبديل الوضع الصامت السريع -->
        <div style="background:rgba(148,163,184,0.12); border:1px solid #94a3b8; border-radius:12px; padding:9px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#cbd5e1;">🎩 نصيحة السيد فريد للتوفير</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.toggleCompact()" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(255,255,255,0.08); color:var(--text-color);">${uiState.compactMode ? "📋 عرض كامل" : "⚡ وضع سريع"}</button>
          </div>
          <div style="line-height:1.5;">${tip}</div>
        </div>

        <!-- 2. مخطط الميزانية الشهرية + تقسيم الفاتورة -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:6px;">💼 مخطط الميزانية الشهرية للبيت</b>
          <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
            <span style="font-size:10px; color:var(--gray-text);">سقف الميزانية (ل.س):</span>
            <input id="faridBudgetInp" type="number" value="${d.monthlyBudget}" min="500" step="500" class="form-control" style="flex:1; padding:4px 7px; font-size:11px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.saveBudget()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:var(--gold-color); color:#000;">حفظ</button>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:10.5px; margin-bottom:4px;">
            <span>السلة الحالية: <b style="color:#38bdf8;">${cartStats.totalSYP.toLocaleString()} ل.س</b></span>
            <span>المتبقي: <b style="color:${remaining > 0 ? "#00e676" : "#ef4444"};">${remaining.toLocaleString()} ل.س</b></span>
          </div>
          <div style="height:7px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden; margin-bottom:6px;">
            <div style="width:${usedPct}%; height:100%; background:${usedPct > 90 ? "#ef4444" : "linear-gradient(90deg,#d4af37,#00e676)"};"></div>
          </div>
          <div style="font-size:10px; color:var(--gray-text); margin-bottom:6px;">${balanceHint}</div>

          <!-- حاسبة تقسيم الفاتورة -->
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; background:rgba(255,255,255,0.03); padding:6px 8px; border-radius:8px;">
            <span>🤝 تقسيم الفاتورة على:</span>
            <input type="number" min="1" max="20" value="${uiState.splitCount}" oninput="window.MoaathVIPRoomModules.butler_farid.setSplit(this.value)" class="form-control" style="width:54px; padding:3px 5px; font-size:11px; text-align:center;">
            <span>حصة الفرد: <b style="color:#00e676;">${perPerson.toLocaleString()} ل.س</b></span>
          </div>
        </div>

        <!-- 3. تقرير "أين ذهبت مشترياتك؟" + زر تخفيض الفاتورة 20% -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:#38bdf8;">📊 توزيع مشترياتك الحالية</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.findCheaperSwaps()" class="btn" style="width:auto; padding:3px 8px; font-size:9.5px; background:rgba(0,230,118,0.16); color:#00e676; border:1px solid #00e676;">📉 خفّض الفاتورة 20%</button>
          </div>
          ${catEntries.length ? catEntries.map(([cat, val], idx) => {
            const pct = cartStats.totalSYP > 0 ? Math.round((val / cartStats.totalSYP) * 100) : 0;
            return `
              <div style="margin-bottom:5px;">
                <div style="display:flex; justify-content:space-between; font-size:10px;">
                  <span>${cat}</span><span><b>${val.toLocaleString()} ل.س</b> (${pct}%)</span>
                </div>
                <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; margin-top:2px;">
                  <div style="width:${pct}%; height:100%; background:${barColors[idx % barColors.length]};"></div>
                </div>
              </div>
            `;
          }).join("") : `<div style="font-size:10px; color:var(--gray-text);">أضف منتجات للسلة ليظهر تحليل توزيع المصروف هنا.</div>`}

          ${uiState.lowerBillSuggestions.length ? `
            <div style="margin-top:7px; padding-top:6px; border-top:1px dashed var(--border-color);">
              <b style="color:#00e676; font-size:10px;">💡 بدائل أوفر في نفس القسم:</b>
              ${uiState.lowerBillSuggestions.map(s => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; padding:3px 0;">
                  <span>استبدل <b>${s.fromName}</b> بـ <b style="color:#00e676;">${s.toName}</b> (توفر ${s.save.toLocaleString()} ل.س)</span>
                  <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.applySwap('${s.fromId}','${s.toId}',${s.qty})" class="btn" style="width:auto; padding:2px 6px; font-size:9px; background:#00e676; color:#000;">تبديل</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>

        <!-- 4. المونة الأساسية والقوائم المحفوظة -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:6px;">📦 قوائم التسوق الجاهزة والمونة الأساسية</b>
          <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:7px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.addPantryEssentials()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:var(--gold-color); color:#000;">🏠 المونة الأساسية</button>
            ${Object.keys(SAVED_LIST_PRESETS).map(k => `
              <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.addPreset('${k}')" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid #38bdf8;">📋 ${SAVED_LIST_PRESETS[k].title}</button>
            `).join("")}
          </div>
          ${!uiState.compactMode && pkgDeals.length ? `
            <div style="font-size:10px; color:#00e676; font-weight:700; margin-bottom:3px;">📦 توفير العبوات والطرد (_PKG):</div>
            ${pkgDeals.map(pk => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10px;">
                <span>${pk.name} (طرد ×${pk.pkgQty}) — توفر <b style="color:#00e676;">${pk.saving.toLocaleString()} ل.س</b></span>
                <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${pk.id}',1); showToast('📦 تمت إضافة طرد ${pk.name}');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(0,230,118,0.18); color:#00e676;">+ طرد</button>
              </div>
            `).join("")}
          ` : ""}
        </div>

        <!-- 5. أفضل صفقات اليوم -->
        ${!uiState.compactMode && topOffers.length ? `
          <div style="background:var(--bg-color); border:1px solid #f59e0b; border-radius:12px; padding:10px;">
            <b style="color:#f59e0b; display:block; margin-bottom:5px;">🔥 أفضل صفقات اليوم حسب نسبة الخصم</b>
            ${topOffers.map(o => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10.5px;">
                <span>${o.name} <b style="color:#00e676;">(${o.newP.toLocaleString()} ل.س)</b> ${o.pct ? `<small style="color:#f59e0b;">-${o.pct}%</small>` : ""}</span>
                <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${o.id}',1); showToast('🔥 أُضيف العرض للسلة');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:#f59e0b; color:#000;">+ أضف</button>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <!-- 6. دفتر ملاحظات المنزل وتصدير لواتساب -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <b style="color:#cbd5e1;">🗒️ دفتر نواقص المنزل</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.exportNotesWhatsApp()" class="btn" style="width:auto; padding:2px 8px; font-size:9.5px; background:#22c55e; color:#000;">📲 نسخ لواتساب</button>
          </div>
          <div style="display:flex; gap:5px; margin-bottom:6px;">
            <input id="faridNoteInp" type="text" class="form-control" placeholder="سجّل نقصاً في البيت للبحث عنه لاحقاً..." style="flex:1; padding:4px 7px; font-size:10px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.addNote()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:var(--gold-color); color:#000;">إضافة</button>
          </div>
          ${d.homeNotes.map((n, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 0; border-bottom:1px dashed var(--border-color); font-size:10px;">
              <span>• ${n}</span>
              <div style="display:flex; gap:5px;">
                <button type="button" onclick="if(typeof runAIShoppingAssistant==='function') runAIShoppingAssistant('${n.replace(/'/g, "")}');" style="background:none; border:none; color:#38bdf8; cursor:pointer; font-size:10px;">🔍 بحث</button>
                <button type="button" onclick="window.MoaathVIPRoomModules.butler_farid.removeNote(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
              </div>
            </div>
          `).join("")}
        </div>

      </div>
    `;
    container._faridMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._faridMount) render(el);
  }

  window.MoaathVIPRoomModules.butler_farid = {
    render,
    toggleCompact() { uiState.compactMode = !uiState.compactMode; rerender(); },
    setSplit(v) { uiState.splitCount = Math.max(1, parseInt(v, 10) || 1); rerender(); },
    saveBudget() {
      const val = parseInt(document.getElementById("faridBudgetInp")?.value || "15000", 10);
      if (val >= 500) {
        const d = loadData();
        d.monthlyBudget = val;
        saveData(d);
        vibrate(15);
        if (typeof window.showToast === "function") window.showToast(`🎩 تم حفظ سقف الميزانية: ${val.toLocaleString()} ل.س`);
        rerender();
      }
    },
    addPantryEssentials() {
      const picks = matchByKeywords(PANTRY_ESSENTIALS, 6);
      picks.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      vibrate([15, 25, 15]);
      if (typeof window.showToast === "function") window.showToast(`🏠 تمت إضافة ${picks.length} من المونة الأساسية المتوفرة للسلة!`);
      rerender();
    },
    addPreset(key) {
      const preset = SAVED_LIST_PRESETS[key];
      if (!preset) return;
      const picks = matchByKeywords(preset.keywords, 6);
      picks.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      vibrate(20);
      if (typeof window.showToast === "function") window.showToast(`📋 تمت إضافة ${picks.length} أصناف من (${preset.title}) للسلة!`);
      rerender();
    },
    findCheaperSwaps() {
      const cartStats = getCartStats();
      const prods = window.products || {};
      const swaps = [];
      cartStats.entries.forEach(entry => {
        if (String(entry.id).startsWith("OFFER_")) return;
        let cheaper = null;
        Object.keys(prods).forEach(pid => {
          const p = prods[pid];
          if (!p || pid === entry.id || p.category !== entry.cat || getStock(p) <= 0) return;
          const u = getUnitPrice(pid);
          if (u > 0 && u < entry.unit * 0.88 && (!cheaper || u < cheaper.unit)) {
            cheaper = { id: pid, name: p.name, unit: u };
          }
        });
        if (cheaper) {
          swaps.push({
            fromId: entry.id,
            fromName: entry.name,
            toId: cheaper.id,
            toName: cheaper.name,
            qty: entry.qty,
            save: (entry.unit - cheaper.unit) * entry.qty
          });
        }
      });
      uiState.lowerBillSuggestions = swaps.slice(0, 4);
      if (!swaps.length && typeof window.showToast === "function") {
        window.showToast("✅ سلتك تحتوي حالياً على أوفر الخيارات في أقسامها!");
      }
      rerender();
    },
    applySwap(fromId, toId, qty) {
      if (typeof window.changeQty === "function") {
        window.changeQty(fromId, -qty);
        window.changeQty(toId, qty);
      }
      uiState.lowerBillSuggestions = uiState.lowerBillSuggestions.filter(s => s.fromId !== fromId);
      vibrate(20);
      if (typeof window.showToast === "function") window.showToast("📉 تم التبديل للخيار الأوفر بنجاح!");
      rerender();
    },
    addNote() {
      const txt = String(document.getElementById("faridNoteInp")?.value || "").trim();
      if (!txt) return;
      const d = loadData();
      d.homeNotes.push(txt);
      saveData(d);
      rerender();
    },
    removeNote(idx) {
      const d = loadData();
      d.homeNotes.splice(idx, 1);
      saveData(d);
      rerender();
    },
    exportNotesWhatsApp() {
      const d = loadData();
      if (!d.homeNotes.length) {
        if (typeof window.showToast === "function") window.showToast("🗒️ الدفتر فارغ حالياً.");
        return;
      }
      const txt = `🎩 قائمة نواقص المنزل (متجر معاذ):\n${d.homeNotes.map((n, i) => `${i + 1}) ${n}`).join("\n")}`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "📲 تم نسخ قائمة نواقص المنزل لواتساب!");
      }
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (5/8): فادي الفرفوش — السهرات والمتة والتسالي (friend_fadi)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - عجلة حظ تفاعلية، قرعة مين يدفع، مؤقت مي المتة، وحاسبة سهرة الشباب
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_fadi_v1";

  const DAILY_JOKES = [
    "واحد قال لصاحبه: شو سر السعادة؟ قاله: كاسة متة سخنة وبزر مالح وإنترنت ما يقطع!",
    "صديقي اشترى 5 أكياس شيبس للفيلم... خلّصهم قبل ما تخلص الدعايات!",
    "القاعدة الذهبية في السهرة: يلي بيجيب المتة معفي من الجلي!",
    "سألوا فادي: شو أحلى ساعة باليوم؟ قال: الساعة يلي بتغلي فيها مي المتة وبتفتح فيها كيس الموالح!"
  ];

  const SAHRA_QUESTIONS = [
    "لو خيروك: سهرة متة وبزر على السطح، ولا سهرة شاي وبسكويت بالشتوية؟",
    "مين أكتر شخص بالجمعة دايماً بياكل نص البزر قبل الكل؟",
    "لو معك 500 ليرة هلق، شو أول صنف تسالي بتطلبه فوراً؟",
    "شو أكتر مباراة أو فيلم ما بتنساه بحياتك؟"
  ];

  const SAHRA_TYPES = {
    football: { label: "⚽ مباراة", keywords: ["متة", "بزر", "شيبس", "عصير", "موالح", "نقارش"] },
    friends: { label: "🔥 سهرة شباب", keywords: ["متة", "شاي", "سكر", "بزر", "شيبس", "بسكوت"] },
    family: { label: "👨‍👩‍👧‍👦 عائلية", keywords: ["شاي", "قهوة", "بسكوت", "شوكولاتة", "عصير", "بزر"] },
    movie: { label: "🎬 فلم", keywords: ["شيبس", "بوشار", "شوكولاتة", "عصير", "بسكوت", "موالح"] }
  };

  let mateTimer = { sec: 180, running: false, id: null };

  let uiState = {
    sahraType: "friends",
    vibe: "chill", // chill | hype | long
    people: 4,
    budget: 800,
    drinkTemp: "hot", // hot | cold
    wheelSpinning: false,
    wheelWinner: null,
    raffleWinner: "",
    qIndex: new Date().getDate() % SAHRA_QUESTIONS.length
  };

  function loadData() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        sahraCount: d.sahraCount || 0,
        friendsNames: d.friendsNames || "معاذ، أحمد، سامي، خالد"
      };
    } catch (_) {
      return { sahraCount: 0, friendsNames: "معاذ، أحمد، سامي، خالد" };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function normAr(s) {
    return String(s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
  }

  function vibrate(p = 20) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getStock(p) {
    if (!p) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(p.stock, 10) || 0);
  }

  function getUnitPrice(pid) {
    const p = (window.products || {})[pid];
    if (!p || typeof window.calcSYP !== "function") return 0;
    const isW = window.currentUser?.userType === "wholesale";
    return window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0));
  }

  function getSnackPool(keywords = null) {
    const prods = window.products || {};
    const kws = keywords || ["متة", "بزر", "شيبس", "بسكوت", "شوكولاتة", "عصير", "شاي", "موالح", "نقارش", "قهوة", "سناكس", "كناكر"];
    const out = [];
    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p || getStock(p) <= 0) return;
      const price = getUnitPrice(pid);
      if (price <= 0) return;
      const txt = normAr((p.name || "") + " " + (p.category || ""));
      if (kws.some(k => txt.includes(normAr(k)))) {
        out.push({ id: pid, name: p.name, price });
      }
    });
    return out.sort((a, b) => a.price - b.price);
  }

  function getRankTitle(count) {
    if (count >= 15) return "👑 إمبراطور السهرة";
    if (count >= 7) return "🧉 خبير المتة";
    if (count >= 3) return "🔥 ملك السهرة";
    return "😎 صديق السهرة";
  }

  function fmtClock(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const joke = DAILY_JOKES[new Date().getDate() % DAILY_JOKES.length];
    const typeObj = SAHRA_TYPES[uiState.sahraType] || SAHRA_TYPES.friends;
    const drinkKws = uiState.drinkTemp === "hot" ? ["متة", "شاي", "قهوة", "كاكاو", "سكر"] : ["عصير", "ماء", "بيبسي", "كولا", "مشروب"];
    const drinkItems = getSnackPool(drinkKws).slice(0, 4);

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">

        <!-- 1. طرفة اليوم + عدّاد السهرات واللقب -->
        <div style="background:rgba(250,204,21,0.12); border:1px solid #facc15; border-radius:12px; padding:9px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#facc15;">😂 طرفة فادي اليوم</b>
            <span style="font-size:10px; color:#00e676; font-weight:800;">${getRankTitle(d.sahraCount)} (${d.sahraCount})</span>
          </div>
          <div style="line-height:1.55;">${joke}</div>
        </div>

        <!-- 2. عجلة الحظ للتسالي (Spin Wheel) -->
        <div style="background:var(--bg-color); border:1px solid #facc15; border-radius:12px; padding:10px; text-align:center;">
          <b style="color:#facc15; display:block; margin-bottom:5px;">🎡 عجلة الحظ للتسالي (محتار شو تنقنق؟)</b>
          <div style="padding:10px; border-radius:10px; background:rgba(255,255,255,0.04); margin-bottom:7px; min-height:38px;">
            ${uiState.wheelSpinning
              ? `<span style="color:#facc15; font-weight:900; font-size:13px;">🎲 تدور العجلة...</span>`
              : uiState.wheelWinner
                ? `<div style="font-size:12px; font-weight:800; color:#00e676;">🎉 طلعلك: ${uiState.wheelWinner.name} (${uiState.wheelWinner.price.toLocaleString()} ل.س)</div>`
                : `<span style="color:var(--gray-text); font-size:10.5px;">اضغط لفّ العجلة ليختار لك فادي صنف تسالي متوفر!</span>`
            }
          </div>
          <div style="display:flex; gap:6px; justify-content:center;">
            <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.spinWheel()" class="btn" style="flex:1; padding:6px; font-size:10.5px; background:linear-gradient(45deg,#facc15,#f97316); color:#000;">🎡 لفّ العجلة!</button>
            ${uiState.wheelWinner ? `<button type="button" onclick="if(typeof changeQty==='function'){changeQty('${uiState.wheelWinner.id}',1); showToast('🎉 تمت إضافة ${uiState.wheelWinner.name} للسلة!');}" class="btn" style="flex:1; padding:6px; font-size:10.5px; background:#00e676; color:#000;">➕ أضف الفائز</button>` : ""}
          </div>
        </div>

        <!-- 3. منسّق وحاسبة السهرة الفوري + مقياس جو السهرة -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:6px;">🧉 منسّق وحاسبة سهرة الشباب</b>
          <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px;">
            ${Object.keys(SAHRA_TYPES).map(k => {
              const on = uiState.sahraType === k;
              return `<button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.setSahraType('${k}')" style="padding:3px 8px; border-radius:999px; font-size:10px; cursor:pointer; border:1px solid ${on ? "#facc15" : "var(--border-color)"}; background:${on ? "#facc15" : "var(--card-bg)"}; color:${on ? "#000" : "var(--text-color)"}; font-weight:700;">${SAHRA_TYPES[k].label}</button>`;
            }).join("")}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:7px;">
            <div>
              <label style="font-size:9px; color:var(--gray-text);">عدد الشباب/الأشخاص</label>
              <input id="fadiPeopleInp" type="number" min="1" max="20" value="${uiState.people}" class="form-control" style="padding:4px 6px; font-size:11px;">
            </div>
            <div>
              <label style="font-size:9px; color:var(--gray-text);">الميزانية (ل.س)</label>
              <input id="fadiBudgetInp" type="number" min="100" step="100" value="${uiState.budget}" class="form-control" style="padding:4px 6px; font-size:11px;">
            </div>
          </div>

          <div style="display:flex; gap:5px; flex-wrap:wrap;">
            <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.buildSahraBasket()" class="btn" style="flex:2; padding:6px; font-size:10.5px; background:linear-gradient(45deg,#00e676,#38bdf8); color:#000;">🛒 جهّز سلة (${typeObj.label})</button>
            <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.quickUnder500()" class="btn" style="flex:1; padding:6px; font-size:10px; background:rgba(250,204,21,0.18); color:#facc15; border:1px solid #facc15;">💰 تحت 500</button>
            <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.surpriseMe()" class="btn" style="flex:1; padding:6px; font-size:10px; background:rgba(244,114,182,0.18); color:#f472b6; border:1px solid #f472b6;">🎁 مفاجأة</button>
          </div>
        </div>

        <!-- 4. تحدي "مين يدفع الحساب؟" + مؤقت تسخين مي المتة -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div style="background:var(--bg-color); border:1px solid #f97316; border-radius:12px; padding:9px;">
            <b style="color:#fb923c; font-size:10.5px;">🎲 مين يدفع الحساب؟</b>
            <input id="fadiFriendsInp" type="text" value="${d.friendsNames}" class="form-control" placeholder="اكتب الأسماء بفاصلة..." style="padding:4px 6px; font-size:9.5px; margin:5px 0;">
            <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.pickPayer()" class="btn" style="padding:4px; font-size:10px; background:#f97316; color:#000;">اسحب القرعة!</button>
            ${uiState.raffleWinner ? `<div style="margin-top:5px; font-size:10.5px; color:#facc15; font-weight:800;">🎯 الحساب على: ${uiState.raffleWinner}!</div>` : ""}
          </div>

          <div style="background:var(--bg-color); border:1px solid #00e676; border-radius:12px; padding:9px; text-align:center;">
            <b style="color:#00e676; font-size:10.5px;">🧉 مؤقت مي المتة</b>
            <div id="fadiMateClock" style="font-size:19px; font-weight:900; color:#facc15; margin:4px 0;">${fmtClock(mateTimer.sec)}</div>
            <div style="display:flex; gap:4px; justify-content:center;">
              <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.toggleMateTimer()" class="btn" style="width:auto; padding:3px 9px; font-size:10px; background:#00e676; color:#000;">${mateTimer.running ? "⏸️" : "▶️"}</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.resetMateTimer()" class="btn btn-danger" style="width:auto; padding:3px 7px; font-size:10px;">↺</button>
            </div>
          </div>
        </div>

        <!-- 5. ركن مشروبات باردة وساخنة + سؤال السهرة ودعوة واتساب -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:#38bdf8;">🥤 مشروبات السهرة</b>
            <div style="display:flex; gap:4px;">
              <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.setDrinkTemp('hot')" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:${uiState.drinkTemp === "hot" ? "#f97316" : "rgba(255,255,255,0.06)"}; color:${uiState.drinkTemp === "hot" ? "#000" : "var(--text-color)"};">☕ ساخنة</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.setDrinkTemp('cold')" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:${uiState.drinkTemp === "cold" ? "#38bdf8" : "rgba(255,255,255,0.06)"}; color:${uiState.drinkTemp === "cold" ? "#000" : "var(--text-color)"};">🧊 باردة</button>
            </div>
          </div>
          ${drinkItems.length ? drinkItems.map(it => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10.5px;">
              <span>${it.name} <small style="color:#00e676;">(${it.price.toLocaleString()} ل.س)</small></span>
              <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',1); showToast('🧉 أُضيف ${it.name} للسهرة');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(0,230,118,0.18); color:#00e676;">+ أضف</button>
            </div>
          `).join("") : `<div style="font-size:10px; color:var(--gray-text);">تصفح قسم المشروبات لاختيار مشروبك المفضل.</div>`}
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px dashed #facc15; border-radius:10px; padding:8px; font-size:10.5px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#facc15;">💬 سؤال السهرة التفاعلي:</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.nextQuestion()" style="background:none; border:none; color:#38bdf8; cursor:pointer; font-size:10px;">سؤال آخر ↻</button>
          </div>
          <div style="margin-bottom:7px;">${SAHRA_QUESTIONS[uiState.qIndex]}</div>
          <button type="button" onclick="window.MoaathVIPRoomModules.friend_fadi.copySahraInvite()" class="btn" style="background:#22c55e; color:#000; font-size:10px; padding:5px;">📲 نسخ دعوة سهرة شامية لواتساب</button>
        </div>

      </div>
    `;
    container._fadiMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._fadiMount) render(el);
  }

  window.MoaathVIPRoomModules.friend_fadi = {
    render,
    setSahraType(k) { uiState.sahraType = k; rerender(); },
    setDrinkTemp(t) { uiState.drinkTemp = t; rerender(); },
    nextQuestion() { uiState.qIndex = (uiState.qIndex + 1) % SAHRA_QUESTIONS.length; rerender(); },
    spinWheel() {
      const pool = getSnackPool();
      if (!pool.length) {
        if (typeof window.showToast === "function") window.showToast("⚠️ لا توجد تسالي متوفرة حالياً في المخزون.");
        return;
      }
      uiState.wheelSpinning = true;
      vibrate([20, 20, 20]);
      rerender();
      setTimeout(() => {
        uiState.wheelSpinning = false;
        uiState.wheelWinner = pool[Math.floor(Math.random() * pool.length)];
        vibrate(40);
        rerender();
      }, 750);
    },
    buildSahraBasket() {
      const people = parseInt(document.getElementById("fadiPeopleInp")?.value || uiState.people, 10) || 4;
      const budget = parseInt(document.getElementById("fadiBudgetInp")?.value || uiState.budget, 10) || 800;
      uiState.people = people;
      uiState.budget = budget;
      const typeObj = SAHRA_TYPES[uiState.sahraType] || SAHRA_TYPES.friends;
      const pool = getSnackPool(typeObj.keywords);
      let sum = 0, added = 0;
      pool.forEach(it => {
        if (added < 6 && sum + it.price <= budget) {
          if (typeof window.changeQty === "function") window.changeQty(it.id, 1);
          sum += it.price;
          added++;
        }
      });
      const d = loadData();
      d.sahraCount = (d.sahraCount || 0) + 1;
      saveData(d);
      vibrate([15, 30, 15]);
      if (typeof window.showToast === "function") {
        window.showToast(added ? `🔥 جهّز فادي ${added} أصناف للسهرة بمجموع ${sum.toLocaleString()} ل.س!` : "⚠️ الميزانية أقل من أسعار الأصناف المتوفرة.");
      }
      rerender();
    },
    quickUnder500() {
      const pool = getSnackPool();
      let sum = 0, added = 0;
      pool.forEach(it => {
        if (added < 4 && sum + it.price <= 500) {
          if (typeof window.changeQty === "function") window.changeQty(it.id, 1);
          sum += it.price;
          added++;
        }
      });
      vibrate(25);
      if (typeof window.showToast === "function") window.showToast(`💰 سهرة اقتصادية: أُضيف ${added} أصناف بـ ${sum.toLocaleString()} ل.س!`);
    },
    surpriseMe() {
      const pool = getSnackPool();
      if (!pool.length) return;
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      shuffled.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      vibrate([15, 25, 15]);
      if (typeof window.showToast === "function") window.showToast(`🎁 مفاجأة فادي: أُضيفت ${shuffled.length} أصناف تسالي عشوائية للسلة!`);
    },
    pickPayer() {
      const raw = String(document.getElementById("fadiFriendsInp")?.value || "").trim();
      const names = raw.split(/[،,]/).map(s => s.trim()).filter(Boolean);
      if (!names.length) return;
      const d = loadData();
      d.friendsNames = raw;
      saveData(d);
      uiState.raffleWinner = names[Math.floor(Math.random() * names.length)];
      vibrate([25, 30, 25]);
      rerender();
    },
    toggleMateTimer() {
      if (mateTimer.running) {
        clearInterval(mateTimer.id);
        mateTimer.id = null;
        mateTimer.running = false;
        rerender();
        return;
      }
      mateTimer.running = true;
      mateTimer.id = setInterval(() => {
        mateTimer.sec--;
        if (mateTimer.sec <= 0) {
          clearInterval(mateTimer.id);
          mateTimer.id = null;
          mateTimer.running = false;
          mateTimer.sec = 0;
          vibrate([50, 40, 50]);
          if (typeof window.showToast === "function") window.showToast("🧉 مي المتة صارت جاهزة بالتمام! طفي الغاز قبل الغليان!");
        }
        const el = document.getElementById("fadiMateClock");
        if (el) el.textContent = fmtClock(mateTimer.sec);
      }, 1000);
      rerender();
    },
    resetMateTimer() {
      clearInterval(mateTimer.id);
      mateTimer.id = null;
      mateTimer.running = false;
      mateTimer.sec = 180;
      rerender();
    },
    copySahraInvite() {
      const txt = `🔥 يا شباب السهرة الليلة عندنا! المتة والبزر والتسالي جاهزين من متجر معاذ 🧉🍿 تعالوا بسرعة!`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "📲 تم نسخ دعوة السهرة لواتساب!");
      }
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (6/8): كابتن زين — الألعاب والتحديات والمستويات (anime_zain)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - نظام XP ومستويات، شارات إنجاز، صندوق الغنيمة اليومي، لعبة خمّن السعر، ولعبة الذاكرة
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_zain_v1";

  const BADGES = [
    { id: "b_explorer", xp: 20, icon: "🧭", label: "المستكشف" },
    { id: "b_hunter", xp: 60, icon: "🎯", label: "صائد العروض" },
    { id: "b_gamer", xp: 120, icon: "🎮", label: "لاعب محترف" },
    { id: "b_weekly", xp: 200, icon: "🔥", label: "بطل الأسبوع" },
    { id: "b_legend", xp: 350, icon: "👑", label: "أسطورة المتجر" }
  ];

  const PLAYER_TITLES = ["المغامر الصاعد", "قائد المهمات", "صائد الغنائم", "بطل العوينة", "النينجا الذهبي"];

  const SKILL_TIPS = [
    "قسم مهام يومك إلى جولات قصيرة (25 دقيقة تركيز + 5 دقائق راحة) لتضاعف إنجازك.",
    "ابدأ دائماً بأصعب مهمة في الصباح — مثل هزيمة الزعيم الأول في المرحلة!",
    "الاستمرارية الصغيرة يومياً تهزم الحماس المتقطع دائماً. اجمع نقاطك خطوة بخطوة.",
    "تنظيم سلتك ومشترياتك مسبقاً يوفر وقتك وطاقتك لباقي يومك."
  ];

  const MEMORY_ICONS = ["🍫", "🧉", "🍟", "🧃", "☕", "🍪"];

  let uiState = {
    guessProd: null,
    guessResult: "",
    memCards: [],
    memFlipped: [],
    memMatched: [],
    memMoves: 0,
    chestRewardText: ""
  };

  function loadData() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (d.dailyDate !== today) {
        d.dailyMissions = { visit: true, guess: false, memory: false };
        d.dailyDate = today;
      }
      return {
        xp: d.xp || 25,
        title: d.title || PLAYER_TITLES[0],
        lastChestDate: d.lastChestDate || "",
        dailyDate: today,
        dailyMissions: d.dailyMissions || { visit: true, guess: false, memory: false },
        highScoreGuess: d.highScoreGuess || 0,
        bestMemMoves: d.bestMemMoves || 0,
        weeklyQuestsDone: d.weeklyQuestsDone || 0
      };
    } catch (_) {
      return {
        xp: 25,
        title: PLAYER_TITLES[0],
        lastChestDate: "",
        dailyDate: today,
        dailyMissions: { visit: true, guess: false, memory: false },
        highScoreGuess: 0,
        bestMemMoves: 0,
        weeklyQuestsDone: 0
      };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function vibrate(p = 20) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function normAr(s) {
    return String(s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
  }

  function getStock(p) {
    if (!p) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(p.stock, 10) || 0);
  }

  function getUnitPrice(pid) {
    const p = (window.products || {})[pid];
    if (!p || typeof window.calcSYP !== "function") return 0;
    const isW = window.currentUser?.userType === "wholesale";
    return window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0));
  }

  function getAvailableProducts() {
    const prods = window.products || {};
    const list = [];
    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p || getStock(p) <= 0) return;
      const price = getUnitPrice(pid);
      if (price > 0) list.push({ id: pid, name: p.name, cat: p.category || "", price });
    });
    return list;
  }

  function getGamerSnacks() {
    const kws = ["شيبس", "شوكولاتة", "عصير", "بيبسي", "كولا", "بسكوت", "اندومي", "متة", "قهوة", "سناكس", "كناكر", "موالح"];
    return getAvailableProducts()
      .filter(it => kws.some(k => normAr(it.name + " " + it.cat).includes(normAr(k))))
      .sort((a, b) => a.price - b.price)
      .slice(0, 4);
  }

  function initMemoryGame() {
    const deck = [...MEMORY_ICONS, ...MEMORY_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, idx) => ({ idx, icon }));
    uiState.memCards = deck;
    uiState.memFlipped = [];
    uiState.memMatched = [];
    uiState.memMoves = 0;
  }

  function pickGuessProduct() {
    const all = getAvailableProducts();
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    if (!uiState.memCards.length) initMemoryGame();
    if (!uiState.guessProd) uiState.guessProd = pickGuessProduct();

    const level = Math.floor(d.xp / 100) + 1;
    const xpInLevel = d.xp % 100;
    const today = new Date().toISOString().slice(0, 10);
    const chestOpened = d.lastChestDate === today;
    const tip = SKILL_TIPS[new Date().getDate() % SKILL_TIPS.length];
    const gamerSnacks = getGamerSnacks();
    const unlockedBadges = BADGES.filter(b => d.xp >= b.xp);

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">

        <!-- 1. لوحة HUD النارية (المستوى + XP + اللقب) -->
        <div style="background:linear-gradient(135deg,rgba(239,68,68,0.18),rgba(15,23,42,0.95)); border:1.5px solid #ef4444; border-radius:14px; padding:10px; box-shadow:0 0 14px rgba(239,68,68,0.22);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <div>
              <span style="background:#ef4444; color:#fff; font-weight:900; padding:2px 8px; border-radius:999px; font-size:10px;">LVL ${level}</span>
              <b style="color:#fca5a5; margin-right:5px;">${d.title}</b>
            </div>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.cycleTitle()" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(255,255,255,0.08); color:#fff;">تغيير اللقب ↻</button>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:10px; color:#fca5a5; margin-bottom:3px;">
            <span>نقاط الخبرة: <b>${d.xp} XP</b></span>
            <span>المتبقي للمستوى التالي: <b>${100 - xpInLevel} XP</b></span>
          </div>
          <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden; margin-bottom:7px;">
            <div style="width:${xpInLevel}%; height:100%; background:linear-gradient(90deg,#ef4444,#f97316,#facc15);"></div>
          </div>
          <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
              ${BADGES.map(b => {
                const on = d.xp >= b.xp;
                return `<span style="padding:2px 6px; border-radius:999px; font-size:9.5px; border:1px solid ${on ? "#facc15" : "rgba(255,255,255,0.15)"}; background:${on ? "rgba(250,204,21,0.16)" : "transparent"}; opacity:${on ? "1" : "0.4"};">${b.icon} ${b.label}</span>`;
              }).join("")}
            </div>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.shareAchievement()" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:#22c55e; color:#000;">📲 مشاركة</button>
          </div>
        </div>

        <!-- 2. صندوق الغنيمة اليومي + مهمة سلة المغامر -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div style="background:var(--bg-color); border:1px solid #f59e0b; border-radius:12px; padding:9px; text-align:center;">
            <b style="color:#f59e0b; font-size:10.5px;">🎁 صندوق الغنيمة اليومي</b>
            <div style="font-size:10px; color:var(--gray-text); margin:4px 0;">${chestOpened ? (uiState.chestRewardText || "✅ تم فتح صندوق اليوم!") : "افتح الصندوق لتكسب +30 XP!"}</div>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.openDailyChest()" class="btn" style="padding:4px 8px; font-size:10px; background:${chestOpened ? "rgba(255,255,255,0.08)" : "linear-gradient(45deg,#f59e0b,#ef4444)"}; color:${chestOpened ? "var(--gray-text)" : "#000"};">${chestOpened ? "مفتوح اليوم" : "🔥 افتح الصندوق"}</button>
          </div>

          <div style="background:var(--bg-color); border:1px solid #ef4444; border-radius:12px; padding:9px; text-align:center;">
            <b style="color:#f87171; font-size:10.5px;">🎒 مهمة سلة المغامر</b>
            <div style="font-size:10px; color:var(--gray-text); margin:4px 0;">3 أصناف من 3 أقسام مختلفة (+40 XP)</div>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.runAdventurerMission()" class="btn" style="padding:4px 8px; font-size:10px; background:#ef4444; color:#fff;">⚡ نفّذ المهمة</button>
          </div>
        </div>

        <!-- 3. لعبة خمّن السعر -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <b style="color:var(--gold-color);">🎯 لعبة خمّن السعر (+25 XP)</b>
            <span style="font-size:9.5px; color:#00e676;">أعلى رصيد تخمين: ${d.highScoreGuess}</span>
          </div>
          ${uiState.guessProd ? `
            <div style="background:rgba(255,255,255,0.04); padding:7px; border-radius:8px; margin-bottom:6px;">
              كم تتوقع سعر: <b style="color:#facc15;">${uiState.guessProd.name}</b>؟
            </div>
            <div style="display:flex; gap:5px; margin-bottom:5px;">
              <input id="zainGuessInp" type="number" class="form-control" placeholder="اكتب توقعك بالليرة..." style="flex:1; padding:5px 7px; font-size:11px;">
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.checkPriceGuess()" class="btn" style="width:auto; padding:5px 10px; font-size:10px; background:var(--gold-color); color:#000;">تحقق</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.nextGuessProduct()" class="btn" style="width:auto; padding:5px 8px; font-size:10px; background:rgba(255,255,255,0.08); color:var(--text-color);">↻</button>
            </div>
            ${uiState.guessResult ? `<div style="font-size:10.5px; font-weight:700; color:#38bdf8;">${uiState.guessResult}</div>` : ""}
          ` : `<div style="font-size:10px; color:var(--gray-text);">بانتظار تحميل منتجات المتجر لتشغيل اللعبة.</div>`}
        </div>

        <!-- 4. لعبة تحدي الذاكرة السريع -->
        <div style="background:var(--bg-color); border:1px solid #38bdf8; border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:#38bdf8;">🧠 تحدي الذاكرة السريع (حركات: ${uiState.memMoves})</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.resetMemory()" class="btn" style="width:auto; padding:2px 8px; font-size:9.5px; background:rgba(56,189,248,0.18); color:#38bdf8;">إعادة ↻</button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:5px;">
            ${uiState.memCards.map((c, idx) => {
              const show = uiState.memFlipped.includes(idx) || uiState.memMatched.includes(idx);
              const matched = uiState.memMatched.includes(idx);
              return `<button type="button" onclick="window.MoaathVIPRoomModules.anime_zain.flipCard(${idx})" style="height:40px; border-radius:8px; font-size:18px; cursor:pointer; border:1px solid ${matched ? "#00e676" : (show ? "#facc15" : "var(--border-color)")}; background:${matched ? "rgba(0,230,118,0.16)" : (show ? "rgba(250,204,21,0.16)" : "var(--card-bg)")}; color:#fff;">${show ? c.icon : "❓"}</button>`;
            }).join("")}
          </div>
          ${d.bestMemMoves ? `<div style="font-size:9.5px; color:var(--gray-text); margin-top:5px;">🏆 أفضل رقم قياسي محلي: ${d.bestMemMoves} حركة</div>` : ""}
        </div>

        <!-- 5. ركن طاقة القيمرز + نصيحة تطوير المهارات -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:#f87171; display:block; margin-bottom:5px;">⚡ ركن طاقة القيمرز (سناكات سريعة متوفرة)</b>
          ${gamerSnacks.length ? gamerSnacks.map(it => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10.5px;">
              <span>${it.name} <small style="color:#00e676;">(${it.price.toLocaleString()} ل.س)</small></span>
              <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',1); window.MoaathVIPRoomModules.anime_zain.grantXP(10,'⚡ طاقة القيمرز');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(239,68,68,0.2); color:#fca5a5;">+ أضف (+10 XP)</button>
            </div>
          `).join("") : `<div style="font-size:10px; color:var(--gray-text);">تصفح قسم الموالح والمشروبات لتجهيز جلسة اللعب.</div>`}
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px dashed #ef4444; border-radius:10px; padding:8px; font-size:10px; line-height:1.55;">
          <b style="color:#f87171;">🔥 نصيحة كابتن زين للتركيز:</b> ${tip}
        </div>

      </div>
    `;
    container._zainMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._zainMount) render(el);
  }

  window.MoaathVIPRoomModules.anime_zain = {
    render,
    grantXP(amount, reason = "") {
      const d = loadData();
      d.xp = (d.xp || 0) + amount;
      saveData(d);
      vibrate(20);
      if (typeof window.showToast === "function") {
        window.showToast(`🔥 +${amount} XP ${reason ? "(" + reason + ")" : ""}!`);
      }
      rerender();
    },
    cycleTitle() {
      const d = loadData();
      const idx = (PLAYER_TITLES.indexOf(d.title) + 1) % PLAYER_TITLES.length;
      d.title = PLAYER_TITLES[idx];
      saveData(d);
      rerender();
    },
    openDailyChest() {
      const d = loadData();
      const today = new Date().toISOString().slice(0, 10);
      if (d.lastChestDate === today) {
        if (typeof window.showToast === "function") window.showToast("🎁 لقد فتحت صندوق الغنيمة اليوم بالفعل، عد غداً!");
        return;
      }
      d.lastChestDate = today;
      d.xp = (d.xp || 0) + 30;
      d.weeklyQuestsDone = (d.weeklyQuestsDone || 0) + 1;
      saveData(d);
      const all = getAvailableProducts();
      const spotlight = all.length ? all[Math.floor(Math.random() * all.length)] : null;
      uiState.chestRewardText = spotlight
        ? `🎉 +30 XP! كنز اليوم المقترح: ${spotlight.name} (${spotlight.price.toLocaleString()} ل.س)`
        : "🎉 مبروك! كسبت +30 XP من صندوق الغنيمة!";
      vibrate([25, 35, 25]);
      if (typeof window.showToast === "function") window.showToast("🔥 فتحت صندوق الغنيمة وكسبت +30 XP!");
      rerender();
    },
    runAdventurerMission() {
      const all = getAvailableProducts();
      const seenCats = new Set();
      const picks = [];
      for (const it of all.sort((a, b) => a.price - b.price)) {
        if (picks.length >= 3) break;
        if (!seenCats.has(it.cat)) {
          seenCats.add(it.cat);
          picks.push(it);
        }
      }
      if (!picks.length) return;
      picks.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      this.grantXP(40, "مهمة سلة المغامر");
    },
    nextGuessProduct() {
      uiState.guessProd = pickGuessProduct();
      uiState.guessResult = "";
      rerender();
    },
    checkPriceGuess() {
      if (!uiState.guessProd) return;
      const val = parseInt(document.getElementById("zainGuessInp")?.value || "0", 10);
      if (!val || val <= 0) return;
      const real = uiState.guessProd.price;
      const diffPct = Math.abs(val - real) / Math.max(1, real);
      const d = loadData();
      if (diffPct <= 0.25) {
        d.xp += 25;
        d.highScoreGuess = (d.highScoreGuess || 0) + 1;
        saveData(d);
        uiState.guessResult = `🎯 إصابة رائعة! السعر الحقيقي ${real.toLocaleString()} ل.س (+25 XP)`;
        vibrate([20, 30, 20]);
      } else {
        uiState.guessResult = `💡 قريب! السعر الحقيقي لـ (${uiState.guessProd.name}) هو ${real.toLocaleString()} ل.س — جرّب صنفاً آخر!`;
        vibrate(15);
      }
      rerender();
    },
    flipCard(idx) {
      if (uiState.memFlipped.length >= 2 || uiState.memFlipped.includes(idx) || uiState.memMatched.includes(idx)) return;
      uiState.memFlipped.push(idx);
      vibrate(10);
      rerender();
      if (uiState.memFlipped.length === 2) {
        uiState.memMoves++;
        const [a, b] = uiState.memFlipped;
        if (uiState.memCards[a].icon === uiState.memCards[b].icon) {
          uiState.memMatched.push(a, b);
          uiState.memFlipped = [];
          if (uiState.memMatched.length === uiState.memCards.length) {
            const d = loadData();
            d.xp += 35;
            if (!d.bestMemMoves || uiState.memMoves < d.bestMemMoves) d.bestMemMoves = uiState.memMoves;
            saveData(d);
            vibrate([30, 40, 30]);
            if (typeof window.showToast === "function") window.showToast(`🏆 بطل الذاكرة! أنهيتها بـ ${uiState.memMoves} حركة (+35 XP)`);
          }
          rerender();
        } else {
          setTimeout(() => {
            uiState.memFlipped = [];
            rerender();
          }, 650);
        }
      }
    },
    resetMemory() {
      initMemoryGame();
      rerender();
    },
    shareAchievement() {
      const d = loadData();
      const lvl = Math.floor(d.xp / 100) + 1;
      const txt = `🎮 إنجازي في غرفة كابتن زين — متجر معاذ:\n🏅 المستوى: LVL ${lvl} (${d.title})\n🔥 الخبرة: ${d.xp} XP\n🎯 إصابات خمّن السعر: ${d.highScoreGuess}`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "📲 تم نسخ بطاقة الإنجاز للمشاركة!");
      }
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (7/8): المحقق ريو — التحليل والأسعار والألغاز (anime_ryu)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - مقارنة منتجين، رادار القيمة، لغز المحقق اليومي، كاشف الخصومات، ورادار النفاد
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_ryu_v1";

  const RIDDLES = [
    { q: "ما هو الشيء الذي يمتلئ بالثقوب ومع ذلك يحتفظ بالماء؟", a: "الإسفنجة." },
    { q: "كلما أخذتَ منه كَبُرَ أكثر، فما هو؟", a: "الحفرة." },
    { q: "ثلاثة أعداد متتالية مجموعها يساوي حاصل ضربها، ما هي؟", a: "1 و 2 و 3 (مجموعها 6 وضربها 6)." },
    { q: "ما هو الشيء الذي يتكلم جميع لغات العالم دون أن يتعلمها؟", a: "الصدى." },
    { q: "تاجر باع سلعة بـ 100 وربح 25% من سعرها، كم كانت تكلفتها الأصلية؟", a: "80 (لأن 80 + ربعها 20 = 100)." }
  ];

  const SCIENCE_FACTS = [
    "الدماغ البشري يستهلك نحو 20% من طاقة الجسم اليومية رغم أنه يشكل 2% فقط من وزنه.",
    "تخزين البيانات محلياً في تطبيقات PWA يجعل الاستجابة أسرع بـ 10 أضعاف في الشبكات الضعيفة.",
    "العسل الطبيعي هو الغذاء الوحيد تقريباً الذي لا يفسد إذا حُفظ في عبوة محكمة الإغلاق.",
    "تنظيم قائمة المشتريات حسب السعر والقسم يقلل وقت التسوق بنسبة تتجاوز 40%."
  ];

  let uiState = {
    compareA: "",
    compareB: "",
    filterCat: "الكل",
    filterMaxPrice: 0,
    scenarioBudget: 600,
    showRiddleAnswer: false,
    riddleIdx: new Date().getDate() % RIDDLES.length
  };

  function loadData() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        solvedCount: d.solvedCount || 0,
        solvedIds: Array.isArray(d.solvedIds) ? d.solvedIds : []
      };
    } catch (_) {
      return { solvedCount: 0, solvedIds: [] };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getStock(p) {
    if (!p) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(p.stock, 10) || 0);
  }

  function getUnitPrice(pid) {
    const p = (window.products || {})[pid];
    if (!p || typeof window.calcSYP !== "function") return 0;
    const isW = window.currentUser?.userType === "wholesale";
    return window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0));
  }

  function getAllInStock() {
    const prods = window.products || {};
    return Object.keys(prods)
      .map(pid => {
        const p = prods[pid];
        if (!p) return null;
        const stock = getStock(p);
        const price = getUnitPrice(pid);
        const pkgPrice = typeof window.calcSYP === "function" ? window.calcSYP(p.pkgPriceUSD || 0) : 0;
        return { id: pid, name: p.name, cat: p.category || "عام", stock, price, pkgPrice, pkgQty: parseInt(p.pkgQty, 10) || 0 };
      })
      .filter(x => x && x.stock > 0 && x.price > 0);
  }

  function getCartAnalysis() {
    const cartObj = window.cart || {};
    const items = [];
    let total = 0;
    Object.keys(cartObj).forEach(k => {
      const it = cartObj[k];
      const qty = parseInt(it?.qty, 10) || 0;
      if (qty <= 0) return;
      const baseId = String(k).replace(/_PKG$/, "");
      const unit = getUnitPrice(baseId) || 0;
      const sub = unit * qty;
      total += sub;
      items.push({ name: it.name || k, unit, sub, qty });
    });
    items.sort((a, b) => b.unit - a.unit);
    return {
      count: items.length,
      total,
      mostExpensive: items[0] || null,
      cheapest: items.length ? items[items.length - 1] : null
    };
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const inStock = getAllInStock();
    const cats = ["الكل", ...Array.from(new Set(inStock.map(x => x.cat)))];

    if (!uiState.compareA && inStock.length >= 1) uiState.compareA = inStock[0].id;
    if (!uiState.compareB && inStock.length >= 2) uiState.compareB = inStock[1].id;

    const prodA = inStock.find(x => x.id === uiState.compareA) || null;
    const prodB = inStock.find(x => x.id === uiState.compareB) || null;

    // رادار النفاد (stock <= 3)
    const lowStock = inStock.filter(x => x.stock <= 3).slice(0, 4);

    // كاشف العروض والخصومات
    const offers = Object.keys(window.specialOffers || {}).map(oid => {
      const o = window.specialOffers[oid];
      if (!o || getStock(o) <= 0 || typeof window.calcSYP !== "function") return null;
      const oldP = window.calcSYP(o.oldPriceUSD || 0);
      const newP = window.calcSYP(o.newPriceUSD || 0);
      if (newP <= 0) return null;
      const save = Math.max(0, oldP - newP);
      const pct = oldP > newP ? Math.round((save / oldP) * 100) : 0;
      return { id: oid, name: o.name || "عرض", newP, save, pct };
    }).filter(Boolean).sort((a, b) => b.save - a.save).slice(0, 3);

    // البحث الدقيق المتقدم (القسم + السعر الأقصى)
    const filteredList = inStock
      .filter(x => (uiState.filterCat === "الكل" || x.cat === uiState.filterCat) && (!uiState.filterMaxPrice || x.price <= uiState.filterMaxPrice))
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    // 3 سيناريوهات للمبلغ
    const bAmt = uiState.scenarioBudget;
    const econPick = inStock.filter(x => x.price <= bAmt).sort((a, b) => a.price - b.price);
    let s1Count = 0, s1Sum = 0;
    econPick.forEach(x => { if (s1Sum + x.price <= bAmt && s1Count < 6) { s1Sum += x.price; s1Count++; } });
    const midPick = econPick.filter(x => x.price >= bAmt * 0.25 && x.price <= bAmt * 0.6).slice(0, 2);
    const topSingle = econPick.slice().sort((a, b) => b.price - a.price)[0];

    const cartInfo = getCartAnalysis();
    const riddle = RIDDLES[uiState.riddleIdx];
    const fact = SCIENCE_FACTS[new Date().getDate() % SCIENCE_FACTS.length];

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">

        <!-- 1. حقيقة علمية/تقنية + أرشيف التحقيقات -->
        <div style="background:rgba(56,189,248,0.12); border:1px solid #38bdf8; border-radius:12px; padding:9px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#38bdf8;">🔎 حقيقة المحقق ريو اليومية</b>
            <span style="font-size:10px; color:#00e676;">🧩 ألغاز محلولة: ${d.solvedCount}</span>
          </div>
          <div style="line-height:1.55;">${fact}</div>
        </div>

        <!-- 2. أداة مقارنة منتجين (Side-by-Side) -->
        <div style="background:var(--bg-color); border:1px solid #38bdf8; border-radius:12px; padding:10px;">
          <b style="color:#38bdf8; display:block; margin-bottom:6px;">⚖️ مقارنة منتجين جنباً إلى جنب</b>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:7px;">
            <select onchange="window.MoaathVIPRoomModules.anime_ryu.setCompare('A', this.value)" class="form-control" style="padding:4px; font-size:10px;">
              ${inStock.slice(0, 40).map(x => `<option value="${x.id}" ${x.id === uiState.compareA ? "selected" : ""}>${x.name}</option>`).join("")}
            </select>
            <select onchange="window.MoaathVIPRoomModules.anime_ryu.setCompare('B', this.value)" class="form-control" style="padding:4px; font-size:10px;">
              ${inStock.slice(0, 40).map(x => `<option value="${x.id}" ${x.id === uiState.compareB ? "selected" : ""}>${x.name}</option>`).join("")}
            </select>
          </div>
          ${(prodA && prodB) ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:rgba(255,255,255,0.03); padding:7px; border-radius:8px; font-size:10px;">
              <div style="border-left:1px dashed var(--border-color); padding-left:5px;">
                <b style="color:var(--gold-color);">${prodA.name}</b><br>
                السعر: <b style="color:${prodA.price <= prodB.price ? "#00e676" : "#fff"};">${prodA.price.toLocaleString()} ل.س</b><br>
                المتوفر: ${prodA.stock} قطعة<br>
                ${prodA.pkgPrice ? `طرد (×${prodA.pkgQty}): ${prodA.pkgPrice.toLocaleString()} ل.س` : "مفرد فقط"}
              </div>
              <div>
                <b style="color:#38bdf8;">${prodB.name}</b><br>
                السعر: <b style="color:${prodB.price <= prodA.price ? "#00e676" : "#fff"};">${prodB.price.toLocaleString()} ل.س</b><br>
                المتوفر: ${prodB.stock} قطعة<br>
                ${prodB.pkgPrice ? `طرد (×${prodB.pkgQty}): ${prodB.pkgPrice.toLocaleString()} ل.س` : "مفرد فقط"}
              </div>
            </div>
            <div style="font-size:10px; color:#00e676; margin-top:5px;">
              📌 الاستنتاج: <b>${prodA.price <= prodB.price ? prodA.name : prodB.name}</b> أوفر بفارق ${Math.abs(prodA.price - prodB.price).toLocaleString()} ل.س.
            </div>
          ` : ""}
        </div>

        <!-- 3. لغز المحقق اليومي -->
        <div style="background:var(--bg-color); border:1px solid var(--gold-color); border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <b style="color:var(--gold-color);">🧩 لغز المحقق اليومي</b>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_ryu.nextRiddle()" style="background:none; border:none; color:#38bdf8; cursor:pointer; font-size:10px;">لغز آخر ↻</button>
          </div>
          <div style="line-height:1.6; margin-bottom:7px;">${riddle.q}</div>
          ${uiState.showRiddleAnswer ? `<div style="background:rgba(0,230,118,0.12); border:1px solid #00e676; border-radius:8px; padding:6px; margin-bottom:7px; color:#00e676;"><b>الحل:</b> ${riddle.a}</div>` : ""}
          <div style="display:flex; gap:5px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_ryu.revealRiddle()" class="btn" style="flex:1; padding:5px; font-size:10px; background:#38bdf8; color:#000;">💡 كشف الحل وتسجيل التحقيق</button>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_ryu.shareRiddle()" class="btn" style="width:auto; padding:5px 9px; font-size:10px; background:#22c55e; color:#000;">📲 تحدي صديق</button>
          </div>
        </div>

        <!-- 4. حاسبة "كم يكفيني هذا المبلغ؟" (3 سيناريوهات) -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:#38bdf8; display:block; margin-bottom:5px;">📐 تحليل: كم يكفيني هذا المبلغ؟</b>
          <div style="display:flex; gap:5px; margin-bottom:6px;">
            <input id="ryuBudgetInp" type="number" min="100" step="100" value="${bAmt}" class="form-control" style="flex:1; padding:4px 7px; font-size:11px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_ryu.updateScenarioBudget()" class="btn" style="width:auto; padding:4px 10px; font-size:10px; background:#38bdf8; color:#000;">حلّل</button>
          </div>
          <div style="font-size:10px; line-height:1.65;">
            • <b>سيناريو التوفير الأقصى:</b> يكفيك لـ <b style="color:#00e676;">${s1Count} أصناف</b> بمجموع ${s1Sum.toLocaleString()} ل.س.<br>
            • <b>سيناريو التوازن:</b> ${midPick.length ? midPick.map(x => x.name).join(" + ") : "أصناف متوسطة متوفرة"}.<br>
            • <b>سيناريو الصنف الممتاز:</b> ${topSingle ? `${topSingle.name} (${topSingle.price.toLocaleString()} ل.س)` : "ارفع المبلغ قليلاً"}.
          </div>
        </div>

        <!-- 5. الفلتر الدقيق + كاشف الخصومات + رادار النفاد + محلل السلة -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:var(--gold-color); display:block; margin-bottom:5px;">📡 رادار القيمة والبحث الدقيق</b>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:6px;">
            <select onchange="window.MoaathVIPRoomModules.anime_ryu.setFilterCat(this.value)" class="form-control" style="padding:4px; font-size:10px;">
              ${cats.map(c => `<option value="${c}" ${c === uiState.filterCat ? "selected" : ""}>${c}</option>`).join("")}
            </select>
            <input type="number" placeholder="السعر الأقصى (ل.س)" value="${uiState.filterMaxPrice || ""}" onchange="window.MoaathVIPRoomModules.anime_ryu.setFilterPrice(this.value)" class="form-control" style="padding:4px 6px; font-size:10px;">
          </div>
          ${filteredList.map(it => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10px;">
              <span>${it.name} <b style="color:#00e676;">(${it.price.toLocaleString()} ل.س)</b></span>
              <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',1); showToast('🔎 أُضيف ${it.name}');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(56,189,248,0.2); color:#38bdf8;">+ أضف</button>
            </div>
          `).join("")}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px; font-size:10px;">
          <div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b; border-radius:10px; padding:8px;">
            <b style="color:#f59e0b;">⚠️ قبل النفاد (≤3 قطع):</b><br>
            ${lowStock.length ? lowStock.map(x => `• ${x.name} (${x.stock})`).join("<br>") : "المخزون وفير حالياً."}
          </div>
          <div style="background:rgba(0,230,118,0.08); border:1px solid #00e676; border-radius:10px; padding:8px;">
            <b style="color:#00e676;">🧾 محلل سلتك:</b><br>
            ${cartInfo.count ? `أغلى صنف: ${cartInfo.mostExpensive.name}<br>أوفر صنف: ${cartInfo.cheapest.name}` : "السلة فارغة الآن."}
          </div>
        </div>

        ${offers.length ? `
          <div style="background:rgba(255,255,255,0.03); border:1px dashed #38bdf8; border-radius:10px; padding:8px; font-size:10px;">
            <b style="color:#38bdf8;">🏷️ كاشف التخفيضات الفعلية:</b><br>
            ${offers.map(o => `• ${o.name}: وفر <b>${o.save.toLocaleString()} ل.س</b> (${o.pct}%)`).join("<br>")}
          </div>
        ` : ""}

      </div>
    `;
    container._ryuMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._ryuMount) render(el);
  }

  window.MoaathVIPRoomModules.anime_ryu = {
    render,
    setCompare(slot, pid) {
      if (slot === "A") uiState.compareA = pid;
      else uiState.compareB = pid;
      rerender();
    },
    setFilterCat(c) { uiState.filterCat = c; rerender(); },
    setFilterPrice(v) { uiState.filterMaxPrice = parseInt(v, 10) || 0; rerender(); },
    updateScenarioBudget() {
      const val = parseInt(document.getElementById("ryuBudgetInp")?.value || "600", 10);
      if (val >= 50) uiState.scenarioBudget = val;
      rerender();
    },
    revealRiddle() {
      uiState.showRiddleAnswer = true;
      const d = loadData();
      if (!d.solvedIds.includes(uiState.riddleIdx)) {
        d.solvedIds.push(uiState.riddleIdx);
        d.solvedCount = d.solvedIds.length;
        saveData(d);
      }
      vibrate(15);
      rerender();
    },
    nextRiddle() {
      uiState.riddleIdx = (uiState.riddleIdx + 1) % RIDDLES.length;
      uiState.showRiddleAnswer = false;
      rerender();
    },
    shareRiddle() {
      const r = RIDDLES[uiState.riddleIdx];
      const txt = `🔎 لغز المحقق ريو (متجر معاذ):\n${r.q}\nهل تعرف الحل؟ 🤔`;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "📲 تم نسخ اللغز لتحدي أصدقائك!");
      }
    }
  };
})();

// ============================================================================
// وحدة غرفة VIP المستقلة (8/8): ريتاج — البهجة والحلويات اللطيفة والمزاج (anime_ritaj)
// - تعمل محلياً بالكامل (0 حصة API) مع عزل تام عن الدفع وشام كاش
// - مقياس المزاج، برطمان الرسائل اللطيفة، مؤقت التنفس الهادئ، سلة السعادة، ولعبة اختر نجمة
// ============================================================================
(function () {
  window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};

  const STORAGE_KEY = "moaath_vip_ritaj_v1";

  const MOODS = {
    happy: { icon: "😊", label: "سعيد", msg: "يا رب تدوم ابتسامتك! لنحتفل بشوكولاتة لذيذة أو عصير منعش.", kw: ["شوكولاتة", "بسكوت", "عصير", "كيك"] },
    tired: { icon: "😮‍💨", label: "متعب", msg: "يعطيك ألف عافية! تستحق كوب مشروب دافئ وحلى سريع يجدد طاقتك.", kw: ["قهوة", "شاي", "كاكاو", "شوكولاتة", "حليب"] },
    chill: { icon: "🌸", label: "رايق", msg: "أحلى مزاج! شاي لطيف مع بسكويت خفيف يكمل روقانك.", kw: ["شاي", "بسكوت", "متة", "بزر"] },
    stressed: { icon: "🫧", label: "متوتر", msg: "خذ نفساً عميقاً مع مؤقت التنفس بالأسفل، وكل شيء سيكون بخير.", kw: ["شاي", "حليب", "ماء", "عسل"] },
    party: { icon: "🎉", label: "محتفل", msg: "ألف مبروك! خلينا نجهز سلة السعادة والحلويات للمناسبة الجميلة!", kw: ["شوكولاتة", "عصير", "شيبس", "بسكوت", "كيك"] }
  };

  const KINDNESS_JAR = [
    "أنت تقوم بعمل رائع اليوم، حتى الخطوات الصغيرة تصنع فرقاً كبيراً! ✨",
    "تذكّر أن تبتسم الآن؛ هناك دائماً شيء جميل ينتظرك في نهاية اليوم 🌸",
    "وجودك يضيف لطفاً وبهجة لمن حولك، لا تنسَ أن تكافئ نفسك قليلاً 🎀",
    "الأيام الهادئة واللحظات البسيطة مع العائلة هي أجمل النعم 💖",
    "كل بداية جديدة هي فرصة لطيفة لصنع ذكرى سعيدة ⭐"
  ];

  const NO_BAKE_RECIPES = [
    { title: "حلى البسكويت البارد بالشوكولاتة", ing: ["بسكوت", "حليب", "كاكاو", "سكر"] },
    { title: "كرات البسكويت السريعة للأطفال", ing: ["بسكوت", "شوكولاتة", "حليب", "جوز الهند"] },
    { title: "مهلبية الفانيليا اللطيفة", ing: ["حليب", "نشا", "سكر"] }
  ];

  const PASTEL_THEMES = {
    pink: { label: "🌸 وردي", accent: "#f472b6", bg: "rgba(244,114,182,0.12)" },
    sky: { label: "☁️ سماوي", accent: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
    lavender: { label: "💜 بنفسجي", accent: "#c084fc", bg: "rgba(192,132,252,0.12)" }
  };

  const GREETING_TEMPLATES = {
    success: "🎉 ألف ألف مبروك النجاح والتفوق! ومنها للأعلى دائماً يا رب 🌟💖",
    birthday: "🎂 كل عام وأنت بألف خير وسعادة، أتمنى لك سنة مليئة بالنجاح والبهجة 🎀✨",
    morning: "🌸 صباح الخير والتفاؤل! أتمنى لك يوماً لطيفاً ومشرقاً مثل قلبك ☀️💛",
    thanks: "💖 شكراً من القلب على لطفك وكرمك، الله يسعدك دائماً 🌸"
  };

  let breathTimer = { running: false, secLeft: 180, phase: "شهيق عميق...", id: null };

  let uiState = {
    mood: "happy",
    theme: "pink",
    jarMessage: KINDNESS_JAR[0],
    starResult: "",
    kidsCount: 5,
    partyBudget: 600
  };

  function loadData() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (d.journalDate !== today) {
        d.goodThings = [];
        d.journalDate = today;
      }
      return {
        brightStreak: d.brightStreak || 1,
        lastMoodDate: d.lastMoodDate || "",
        goodThings: Array.isArray(d.goodThings) ? d.goodThings : [],
        journalDate: today
      };
    } catch (_) {
      return { brightStreak: 1, lastMoodDate: "", goodThings: [], journalDate: today };
    }
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (_) {}
  }

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function normAr(s) {
    return String(s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
  }

  function getStock(p) {
    if (!p) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(p.stock, 10) || 0);
  }

  function getUnitPrice(pid) {
    const p = (window.products || {})[pid];
    if (!p || typeof window.calcSYP !== "function") return 0;
    const isW = window.currentUser?.userType === "wholesale";
    return window.calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0));
  }

  function findSweetsByKeywords(keywords, limit = 5) {
    const prods = window.products || {};
    const out = [];
    Object.keys(prods).forEach(pid => {
      const p = prods[pid];
      if (!p || getStock(p) <= 0) return;
      const price = getUnitPrice(pid);
      if (price <= 0) return;
      const txt = normAr((p.name || "") + " " + (p.category || ""));
      if (keywords.some(k => txt.includes(normAr(k)))) {
        out.push({ id: pid, name: p.name, price });
      }
    });
    return out.sort((a, b) => a.price - b.price).slice(0, limit);
  }

  function render(container) {
    if (!container) return;
    const d = loadData();
    const th = PASTEL_THEMES[uiState.theme] || PASTEL_THEMES.pink;
    const moodObj = MOODS[uiState.mood] || MOODS.happy;
    const moodPicks = findSweetsByKeywords(moodObj.kw, 4);
    const isEvening = new Date().getHours() >= 18;

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:right; font-size:11px;">

        <!-- 1. بطاقة الامتنان + تبديل ألوان الباستيل + سلسلة الأيام المشرقة -->
        <div style="background:${th.bg}; border:1px solid ${th.accent}; border-radius:14px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px; margin-bottom:5px;">
            <b style="color:${th.accent};">✨ سلسلة الأيام المشرقة: ${d.brightStreak} يوم ⭐</b>
            <div style="display:flex; gap:4px;">
              ${Object.keys(PASTEL_THEMES).map(k => `<button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.setTheme('${k}')" style="padding:2px 6px; border-radius:999px; font-size:9px; cursor:pointer; border:1px solid ${uiState.theme === k ? PASTEL_THEMES[k].accent : "var(--border-color)"}; background:var(--card-bg); color:var(--text-color);">${PASTEL_THEMES[k].label}</button>`).join("")}
            </div>
          </div>
          ${isEvening ? `<div style="font-size:10px; color:#facc15; margin-bottom:4px;">🌙 مكافأة نهاية اليوم: دلّل نفسك بسناك لطيف أو مشروب دافئ بعد تعب اليوم!</div>` : ""}
          <div style="line-height:1.55;">💖 ${uiState.jarMessage}</div>
          <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.pullKindnessJar()" class="btn" style="margin-top:6px; width:auto; padding:3px 9px; font-size:10px; background:${th.accent}; color:#000;">🫙 اسحب رسالة لطيفة من البرطمان</button>
        </div>

        <!-- 2. مقياس المزاج اليومي + اقتراحات المتجر حسب المزاج -->
        <div style="background:var(--bg-color); border:1px solid ${th.accent}; border-radius:12px; padding:10px;">
          <b style="color:${th.accent}; display:block; margin-bottom:6px;">🎀 كيف مزاجك اليوم؟</b>
          <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:7px;">
            ${Object.keys(MOODS).map(k => {
              const on = uiState.mood === k;
              return `<button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.setMood('${k}')" style="padding:4px 8px; border-radius:999px; font-size:10px; cursor:pointer; border:1px solid ${on ? th.accent : "var(--border-color)"}; background:${on ? th.accent : "var(--card-bg)"}; color:${on ? "#000" : "var(--text-color)"}; font-weight:700;">${MOODS[k].icon} ${MOODS[k].label}</button>`;
            }).join("")}
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:7px; border-radius:8px; margin-bottom:7px; line-height:1.5;">${moodObj.msg}</div>
          ${moodPicks.map(it => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10.5px;">
              <span>🍬 ${it.name} <small style="color:#00e676;">(${it.price.toLocaleString()} ل.س)</small></span>
              <button type="button" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',1); showToast('💖 أُضيف ${it.name} لسلة السعادة');}" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:${th.bg}; color:${th.accent}; border:1px solid ${th.accent};">+ أضف</button>
            </div>
          `).join("")}
          <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.buildHappinessBasket()" class="btn" style="margin-top:7px; background:linear-gradient(45deg,${th.accent},#facc15); color:#000; font-size:10.5px; padding:6px;">🛍️ صانع سلة السعادة السريعة</button>
        </div>

        <!-- 3. مؤقت الاستراحة والتنفس الهادئ + لعبة اختر نجمة -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div style="background:var(--bg-color); border:1px solid #38bdf8; border-radius:12px; padding:9px; text-align:center;">
            <b style="color:#38bdf8; font-size:10.5px;">🫧 استراحة تنفس (3 دقائق)</b>
            <div id="ritajBreathPhase" style="font-size:11px; font-weight:800; color:${th.accent}; margin:4px 0;">${breathTimer.running ? breathTimer.phase : "خذ نفساً هادئاً"}</div>
            <div id="ritajBreathClock" style="font-size:15px; font-weight:900; margin-bottom:5px;">${Math.floor(breathTimer.secLeft / 60)}:${String(breathTimer.secLeft % 60).padStart(2, "0")}</div>
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.toggleBreath()" class="btn" style="padding:4px 8px; font-size:10px; background:#38bdf8; color:#000;">${breathTimer.running ? "⏸️ إيقاف" : "▶️ ابدأ التنفس"}</button>
          </div>

          <div style="background:var(--bg-color); border:1px solid #facc15; border-radius:12px; padding:9px; text-align:center;">
            <b style="color:#facc15; font-size:10.5px;">⭐ لعبة اختر نجمة!</b>
            <div style="display:flex; justify-content:center; gap:8px; margin:7px 0;">
              ${[1, 2, 3].map(n => `<button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.pickStar(${n})" style="font-size:20px; background:none; border:none; cursor:pointer;">⭐</button>`).join("")}
            </div>
            <div style="font-size:9.5px; color:#00e676; min-height:24px;">${uiState.starResult || "اضغط أي نجمة لتكشف مفاجأتك!"}</div>
          </div>
        </div>

        <!-- 4. وصفات حلى بارد بدون فرن + منسّق حفلات الأطفال -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:${th.accent}; display:block; margin-bottom:5px;">🍰 وصفات حلى بارد وسريع بدون فرن</b>
          ${NO_BAKE_RECIPES.map((r, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed var(--border-color); font-size:10px;">
              <span><b>${r.title}</b> (${r.ing.join("، ")})</span>
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.addRecipeNeeds(${i})" class="btn" style="width:auto; padding:2px 7px; font-size:9.5px; background:rgba(0,230,118,0.18); color:#00e676;">+ مكوناتها</button>
            </div>
          `).join("")}

          <div style="margin-top:8px; padding-top:7px; border-top:1px solid var(--border-color);">
            <b style="color:#facc15; font-size:10.5px;">🎈 منسّق حفلة أطفال مصغّرة:</b>
            <div style="display:flex; gap:5px; margin-top:5px;">
              <input id="ritajKidsInp" type="number" min="2" max="20" value="${uiState.kidsCount}" class="form-control" placeholder="أطفال" style="width:65px; padding:4px; font-size:10px;">
              <input id="ritajPartyBudgetInp" type="number" min="200" step="100" value="${uiState.partyBudget}" class="form-control" placeholder="ميزانية" style="flex:1; padding:4px 6px; font-size:10px;">
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.buildKidsParty()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:#facc15; color:#000;">جهّز الحفلة</button>
            </div>
          </div>
        </div>

        <!-- 5. قائمة "أشياء جميلة اليوم" + بطاقات إهداء واتساب -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:10px;">
          <b style="color:${th.accent}; display:block; margin-bottom:5px;">🌈 3 أشياء جميلة أسعدتك اليوم</b>
          <div style="display:flex; gap:5px; margin-bottom:5px;">
            <input id="ritajGoodInp" type="text" class="form-control" placeholder="اكتب شيئاً جميلاً حدث معك اليوم..." style="flex:1; padding:4px 7px; font-size:10px;">
            <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.addGoodThing()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:${th.accent}; color:#000;">حفظ</button>
          </div>
          ${d.goodThings.map(g => `<div style="font-size:10px; padding:2px 0; color:#facc15;">✨ ${g}</div>`).join("")}

          <div style="margin-top:8px; padding-top:7px; border-top:1px dashed var(--border-color);">
            <b style="font-size:10px; color:#22c55e; display:block; margin-bottom:5px;">💌 بطاقات تهنئة وإهداء جاهزة لواتساب:</b>
            <div style="display:flex; gap:5px; flex-wrap:wrap;">
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.copyGreeting('success')" class="btn" style="width:auto; padding:3px 7px; font-size:9.5px; background:rgba(34,197,94,0.16); color:#22c55e;">🎓 نجاح</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.copyGreeting('birthday')" class="btn" style="width:auto; padding:3px 7px; font-size:9.5px; background:rgba(244,114,182,0.16); color:#f472b6;">🎂 ميلاد</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.copyGreeting('morning')" class="btn" style="width:auto; padding:3px 7px; font-size:9.5px; background:rgba(250,204,21,0.16); color:#facc15;">☀️ صباح</button>
              <button type="button" onclick="window.MoaathVIPRoomModules.anime_ritaj.copyGreeting('thanks')" class="btn" style="width:auto; padding:3px 7px; font-size:9.5px; background:rgba(56,189,248,0.16); color:#38bdf8;">💖 شكر</button>
            </div>
          </div>
        </div>

      </div>
    `;
    container._ritajMount = true;
  }

  function rerender() {
    const el = document.getElementById("vipRoomDynamicBody");
    if (el && el._ritajMount) render(el);
  }

  window.MoaathVIPRoomModules.anime_ritaj = {
    render,
    setTheme(t) { uiState.theme = t; rerender(); },
    setMood(m) {
      uiState.mood = m;
      const d = loadData();
      const today = new Date().toISOString().slice(0, 10);
      if (d.lastMoodDate !== today) {
        d.brightStreak = (d.brightStreak || 0) + 1;
        d.lastMoodDate = today;
        saveData(d);
      }
      vibrate(15);
      rerender();
    },
    pullKindnessJar() {
      uiState.jarMessage = KINDNESS_JAR[Math.floor(Math.random() * KINDNESS_JAR.length)];
      vibrate(15);
      rerender();
    },
    buildHappinessBasket() {
      const picks = findSweetsByKeywords(["شوكولاتة", "بسكوت", "عصير", "كيك", "كاكاو"], 3);
      picks.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      vibrate([15, 25, 15]);
      if (typeof window.showToast === "function") window.showToast(`💖 تمت إضافة ${picks.length} أصناف لطيفة لسلة السعادة!`);
    },
    addRecipeNeeds(idx) {
      const rec = NO_BAKE_RECIPES[idx];
      if (!rec) return;
      const picks = findSweetsByKeywords(rec.ing, 4);
      picks.forEach(it => { if (typeof window.changeQty === "function") window.changeQty(it.id, 1); });
      vibrate(20);
      if (typeof window.showToast === "function") window.showToast(`🍰 تمت إضافة ${picks.length} من مكونات (${rec.title}) للسلة!`);
    },
    buildKidsParty() {
      const budget = parseInt(document.getElementById("ritajPartyBudgetInp")?.value || "600", 10) || 600;
      const picks = findSweetsByKeywords(["عصير", "بسكوت", "شوكولاتة", "شيبس", "سناكس", "كيك"], 8);
      let sum = 0, added = 0;
      picks.forEach(it => {
        if (added < 6 && sum + it.price <= budget) {
          if (typeof window.changeQty === "function") window.changeQty(it.id, 1);
          sum += it.price;
          added++;
        }
      });
      vibrate(25);
      if (typeof window.showToast === "function") window.showToast(`🎈 جهّزت ريتاج ${added} أصناف للحفلة بمجموع ${sum.toLocaleString()} ل.س!`);
    },
    pickStar() {
      const picks = findSweetsByKeywords(["شوكولاتة", "بسكوت", "عصير", "شاي", "كيك"], 6);
      if (picks.length && Math.random() < 0.6) {
        const p = picks[Math.floor(Math.random() * picks.length)];
        uiState.starResult = `✨ نجمتك تقترح لك اليوم: ${p.name} (${p.price.toLocaleString()} ل.س)!`;
      } else {
        uiState.starResult = "🌟 " + KINDNESS_JAR[Math.floor(Math.random() * KINDNESS_JAR.length)];
      }
      vibrate(20);
      rerender();
    },
    toggleBreath() {
      if (breathTimer.running) {
        clearInterval(breathTimer.id);
        breathTimer.id = null;
        breathTimer.running = false;
        rerender();
        return;
      }
      breathTimer.running = true;
      breathTimer.id = setInterval(() => {
        breathTimer.secLeft--;
        const mod = breathTimer.secLeft % 12;
        breathTimer.phase = mod >= 8 ? "🌬️ شهيق بهدوء (4ث)..." : mod >= 4 ? "✨ احبس النفس (4ث)..." : "🍃 زفير مريح (4ث)...";
        if (breathTimer.secLeft <= 0) {
          clearInterval(breathTimer.id);
          breathTimer.id = null;
          breathTimer.running = false;
          breathTimer.secLeft = 180;
          vibrate([30, 30, 30]);
          if (typeof window.showToast === "function") window.showToast("🌸 أحسنت! انتهت استراحة التنفس الهادئ.");
        }
        const phEl = document.getElementById("ritajBreathPhase");
        const clEl = document.getElementById("ritajBreathClock");
        if (phEl) phEl.textContent = breathTimer.phase;
        if (clEl) clEl.textContent = `${Math.floor(breathTimer.secLeft / 60)}:${String(breathTimer.secLeft % 60).padStart(2, "0")}`;
      }, 1000);
      rerender();
    },
    addGoodThing() {
      const txt = String(document.getElementById("ritajGoodInp")?.value || "").trim();
      if (!txt) return;
      const d = loadData();
      d.goodThings.unshift(txt);
      d.goodThings = d.goodThings.slice(0, 3);
      saveData(d);
      rerender();
    },
    copyGreeting(k) {
      const txt = GREETING_TEMPLATES[k] || GREETING_TEMPLATES.thanks;
      if (typeof window.copyTextToClipboardClean === "function") {
        window.copyTextToClipboardClean(txt, "💌 تم نسخ بطاقة التهنئة لواتساب!");
      }
    }
  };
})();

// ربط وحدات الغرف الثماني بـ window.MoaathVIPSystem بعد تحميلها بالكامل
if (window.MoaathVIPSystem) { window.MoaathVIPSystem.roomModules = window.MoaathVIPRoomModules || {}; }

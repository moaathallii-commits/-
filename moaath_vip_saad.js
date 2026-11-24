// ============================================================================
// شخصية وغرفة VIP #9: «سعد» (friend_saad) — الصديق الوقور والالتزام الإيماني
// (moaath_vip_saad.js — v1.0)
// - محرك التحديث التلقائي متعدد الفترات اليومية (5 فترات: صباح / ظهر / عصر / مغرب / عشاء)
// - تذكير تلقائي بسنن يوم الجمعة + مواقيت الصلاة التقريبية لريف حماة/سوريا مع العدّاد القادم
// - متتبع الصلوات الخمس (Prayer Streak) + أذكار الصباح والمساء التفاعلية
// - المسبحة الإلكترونية المستقبلية + الورد القرآني + محاسبة النفس المسائية
// - ركن الأمر بالمعروف والنهي عن المنكر بالحكمة + الأدعية الجامعة + مشاركة واتساب + نطق صوتي وقور
// - ركن الصدقة وإكرام الجار (تشكيل سلة خير اختيارية من أساسيات المخزون المتوفر)
// - يعمل محلياً بـ 0 حصة API مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VIP_SAAD_V1__) return;
  window.__MOAATH_VIP_SAAD_V1__ = true;

  const STORAGE_KEY = "moaath_vip_saad_state_v1";
  const PERSONA_ID = "friend_saad";
  let saadAudio = null;
  let activeSubTab = "daily"; // daily | adhkar | tasbeeh | wisdom | duas
  let activeDuaCat = "rizq";
  let livePeriodTimer = null;

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

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function vibrate(pattern = 15) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
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
  // 1) بيانات الحالة المحلية + إعادة ضبط يومية ذكية مع الحفاظ على السلسلة
  // ==========================================================================
  function loadState() {
    const tdy = todayStr();
    const def = {
      lastDate: tdy,
      prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      prayerStreak: 0,
      lastStreakDay: "",
      tasbeehIndex: 0,
      tasbeehCount: 0,
      tasbeehDailyTotal: 0,
      adhkarDone: {},
      quranPage: 1,
      quranJuz: 1,
      accountability: { prayersOnTime: false, kindness: false, tongueGuard: false, gratitude: "" },
      customOffsetMin: 0,
      visits: 0
    };
    const saved = Object.assign(def, readJSON(STORAGE_KEY, {}));
    if (saved.lastDate !== tdy) {
      saved.lastDate = tdy;
      saved.prayers = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
      saved.adhkarDone = {};
      saved.tasbeehDailyTotal = 0;
      saved.accountability = { prayersOnTime: false, kindness: false, tongueGuard: false, gratitude: "" };
      writeJSON(STORAGE_KEY, saved);
    }
    return saved;
  }

  function saveState(st) {
    writeJSON(STORAGE_KEY, st);
  }

  // ==========================================================================
  // 2) محرك التحديث التلقائي متعدد الفترات اليومية (5 فترات + سنن الجمعة)
  // ==========================================================================
  const PERIOD_CONTENT = {
    morning: {
      id: "morning",
      badge: "☀️ فترة الفجر والصباح",
      greeting: (n) => `السلام عليكم ورحمة الله وبركاته${n}.. صباحٌ مبارك عامر بذكر الله والرزق الحلال.`,
      ayah: "﴿وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾",
      reflection: "بداية اليوم بالصلاة وأذكار الصباح تزرع البركة في وقتك ورزقك، وتشرح صدرك لكل خير.",
      mawaiz: "الرزق الحلال بركته في القناعة والصدق؛ فابدأ يومك بنية نافعة وتوكّل صادق على الله.",
      actionLabel: "ابدأ أذكار الصباح"
    },
    dhuhr: {
      id: "dhuhr",
      badge: "🌤️ فترة الظهر والعمل",
      greeting: (n) => `حيّاك الله${n} وبارك في سعيك.. لا تُشغلنّك الدنيا عن صلاة الظهر، فهي راحة القلب في منتصف اليوم.`,
      ayah: "﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾",
      reflection: "وقوفك بين يدي الله وسط زحمة العمل يجدد همّتك ويُذهب عنك التعب والضيق.",
      mawaiz: "من تمام الدين إتقان العمل والرفق بالناس؛ قال ﷺ: «إن الله يحب إذا عمل أحدكم عملاً أن يتقنه».",
      actionLabel: "سجّل صلاة الظهر"
    },
    asr: {
      id: "asr",
      badge: "🌇 فترة العصر والسكينة",
      greeting: (n) => `أهلاً بك يا رفيق الخير${n}.. وقت العصر وقتٌ مبارك، فحافظ على صلاته وأكثر فيه من الذكر والاستغفار.`,
      ayah: "﴿وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ﴾",
      reflection: "العمر يمضي سريعاً، والرابح الحقيقي من استثمر ساعاته في طاعة أو كلمة طيبة أو نفع للناس.",
      mawaiz: "الكلمة الطيبة صدقة، والابتسامة في وجه أخيك صدقة، وكفّ الأذى عن الناس رفعة في الدنيا والآخرة.",
      actionLabel: "افتح المسبحة"
    },
    maghrib: {
      id: "maghrib",
      badge: "🌆 فترة المغرب وأذكار المساء",
      greeting: (n) => `مساء السكينة والطمأنينة${n}.. حان وقت أذكار المساء وصلة الرحم، تقبّل الله منك صالح الأعمال.`,
      ayah: "﴿فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ﴾",
      reflection: "حصّن نفسك وأهلك بأذكار المساء، وتفقّد والديك وجيرانك بكلمة طيبة أو سؤال صادق.",
      mawaiz: "برّ الوالدين وصلة الرحم من أعظم أسباب سعة الرزق ودفع البلاء؛ فلا تؤجّل اتصالاً يُدخل السرور عليهما.",
      actionLabel: "ابدأ أذكار المساء"
    },
    isha: {
      id: "isha",
      badge: "🌙 فترة العشاء والوتر",
      greeting: (n) => `طابت ليلتك بذكر الله${n}.. اختم يومك بصلاة العشاء والوتر، واستغفر الله ليُبدّل همّك راحةً.`,
      ayah: "﴿وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا﴾",
      reflection: "قبل أن تنام، اعفُ عمّن ظلمك، وحاسب نفسك برفق، واشكر الله على نعمه التي لا تُحصى.",
      mawaiz: "لا تترك صلاة الوتر ولو بركعة واحدة، واجعل آخر كلامك في يومك ذكراً واستغفاراً.",
      actionLabel: "محاسبة النفس"
    }
  };

  function getCurrentIslamicPeriod() {
    const h = new Date().getHours();
    if (h >= 4 && h < 11) return PERIOD_CONTENT.morning;
    if (h >= 11 && h < 15) return PERIOD_CONTENT.dhuhr;
    if (h >= 15 && h < 18) return PERIOD_CONTENT.asr;
    if (h >= 18 && h < 20) return PERIOD_CONTENT.maghrib;
    return PERIOD_CONTENT.isha;
  }

  // مواقيت تقريبية لريف حماة / سوريا حسب الفصل مع قابلية التعديل اليدوي بالدقائق
  function getApproxPrayerSchedule(offsetMin = 0) {
    const m = new Date().getMonth() + 1; // 1..12
    const isSummer = m >= 5 && m <= 9;
    const isWinter = m === 11 || m === 12 || m <= 2;
    const base = isWinter
      ? [
          { key: "fajr", label: "الفجر", hh: 5, mm: 15 },
          { key: "dhuhr", label: "الظهر", hh: 11, mm: 40 },
          { key: "asr", label: "العصر", hh: 14, mm: 25 },
          { key: "maghrib", label: "المغرب", hh: 16, mm: 40 },
          { key: "isha", label: "العشاء", hh: 18, mm: 5 }
        ]
      : isSummer
      ? [
          { key: "fajr", label: "الفجر", hh: 3, mm: 45 },
          { key: "dhuhr", label: "الظهر", hh: 12, mm: 35 },
          { key: "asr", label: "العصر", hh: 16, mm: 15 },
          { key: "maghrib", label: "المغرب", hh: 19, mm: 40 },
          { key: "isha", label: "العشاء", hh: 21, mm: 10 }
        ]
      : [
          { key: "fajr", label: "الفجر", hh: 4, mm: 35 },
          { key: "dhuhr", label: "الظهر", hh: 12, mm: 10 },
          { key: "asr", label: "العصر", hh: 15, mm: 30 },
          { key: "maghrib", label: "المغرب", hh: 18, mm: 15 },
          { key: "isha", label: "العشاء", hh: 19, mm: 40 }
        ];

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let nextPrayer = null;

    const list = base.map((p) => {
      const totalM = (p.hh * 60 + p.mm + (parseInt(offsetMin, 10) || 0) + 1440) % 1440;
      const hh = Math.floor(totalM / 60);
      const mm = totalM % 60;
      const fmt12 = `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "م" : "ص"}`;
      if (!nextPrayer && totalM > nowMins) {
        const diff = totalM - nowMins;
        nextPrayer = { ...p, fmt12, remainingText: `${Math.floor(diff / 60)} س و ${diff % 60} د` };
      }
      return { ...p, totalM, fmt12 };
    });

    if (!nextPrayer) {
      const fajrM = list[0].totalM;
      const diff = (1440 - nowMins) + fajrM;
      nextPrayer = { ...list[0], remainingText: `${Math.floor(diff / 60)} س و ${diff % 60} د` };
    }
    return { list, nextPrayer };
  }

  // ==========================================================================
  // 3) مكتبة الأذكار، المسبحة، الأمر بالمعروف، والأدعية
  // ==========================================================================
  const TASBEEH_PHRASES = [
    { text: "سبحان الله", target: 33 },
    { text: "الحمد لله", target: 33 },
    { text: "الله أكبر", target: 33 },
    { text: "أستغفر الله العظيم وأتوب إليه", target: 33 },
    { text: "اللهم صلّ وسلّم على نبينا محمد ﷺ", target: 33 },
    { text: "لا إله إلا الله وحده لا شريك له", target: 33 }
  ];

  const ADHKAR_LIST = [
    { id: "kursi", title: "آية الكرسي", text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...", target: 1 },
    { id: "ikhlas", title: "الإخلاص والمعوذتان", text: "قل هو الله أحد، قل أعوذ برب الفلق، قل أعوذ برب الناس.", target: 3 },
    { id: "sayyid", title: "سيد الاستغفار", text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك...", target: 1 },
    { id: "bismillah", title: "التحصين", text: "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم.", target: 3 },
    { id: "raditu", title: "الرضا", text: "رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً ورسولاً.", target: 3 },
    { id: "hasbi", title: "الكفاية", text: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.", target: 7 }
  ];

  const WISDOM_COUNSEL = [
    { title: "الأمانة والصدق في المعاملة", text: "الصدق في البيع والشراء والوعد يطرح البركة في المال، ويجعل لصاحبه هيبةً ومحبةً في قلوب الناس." },
    { title: "حفظ اللسان وتجنب الغيبة", text: "الغيبة تأكل الحسنات كما تأكل النار الحطب؛ فإذا ذُكر أحدٌ بسوء في مجلسك، فاذكره بخير أو غيّر الحديث بلطف." },
    { title: "غضّ البصر وطهارة القلب", text: "غضّ البصر عن الحرام يورث القلب نوراً وحلاوة إيمان لا يذوقها إلا من جاهد نفسه لله." },
    { title: "برّ الوالدين وإدخال السرور", text: "أقرب أبواب الجنة في بيتك؛ كلمة حانية لوالديك ودعوة صالحة منهما تفتح لك أبواب التوفيق." },
    { title: "الصبر وكظم الغيظ", text: "ليس الشديد بالصرعة، وإنما الشديد الذي يملك نفسه عند الغضب؛ فالحلم زينة المؤمن ووقاره." },
    { title: "إكرام الجار والصدقة الخفية", text: "ما نقص مالٌ من صدقة، وتفقّد الجار المحتاج ولو بشيء يسير من مونة البيت يطفئ غضب الرب ويجلب البركة." }
  ];

  const DUAS_LIBRARY = {
    rizq: [
      "اللهم اكفني بحلالك عن حرامك، وأغنني بفضلك عمّن سواك.",
      "اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً.",
      "اللهم بارك لنا فيما رزقتنا وقنا عذاب النار."
    ],
    faraj: [
      "لا إله إلا أنت سبحانك إني كنت من الظالمين.",
      "اللهم رحمتك أرجو فلا تكلني إلى نفسي طرفة عين، وأصلح لي شأني كله.",
      "يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله."
    ],
    daily: [
      "بسم الله توكلت على الله، ولا حول ولا قوة إلا بالله. (عند الخروج)",
      "اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، وغلبة الدين وقهر الرجال.",
      "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار."
    ],
    shifa: [
      "اللهم رب الناس أذهب البأس، اشفِ أنت الشافي، لا شفاء إلا شفاؤك، شفاءً لا يغادر سقماً.",
      "أعوذ بكلمات الله التامات من شر ما خلق."
    ]
  };

  // ==========================================================================
  // 4) محرك النطق الصوتي الوقور لشخصية «سعد»
  // ==========================================================================
  function stopSaadVoice() {
    try { if (typeof window.speechSynthesis !== "undefined") window.speechSynthesis.cancel(); } catch (_) {}
    if (saadAudio) {
      try { saadAudio.pause(); saadAudio.currentTime = 0; } catch (_) {}
    }
  }

  function speakSaadLocal(text) {
    if (typeof window.speechSynthesis === "undefined" || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      u.rate = 1.02;
      u.pitch = 0.9;
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const arV = voices.find((v) => /ar/i.test(v.lang || ""));
      if (arV) u.voice = arV;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  async function speakSaad(rawText) {
    const clean = String(rawText || "")
      .replace(/[\u{1F300}-\u{1FAFF}﴿﴾۝]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
    if (!clean) return;
    stopSaadVoice();

    let workerUrl = "";
    try {
      workerUrl = typeof window.getEffectiveAIWorkerUrl === "function"
        ? String(window.getEffectiveAIWorkerUrl() || "").trim()
        : String(window.AI_WORKER_URL || localStorage.getItem("moaath_ai_worker_url") || "").trim();
    } catch (_) {}

    if (!workerUrl || navigator.onLine === false) {
      speakSaadLocal(clean);
      return;
    }

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tts",
          text: clean,
          voiceName: "Orus",
          gender: "male",
          toneTag: "شاب وقور هادئ ناصح بالخير",
          dialectMode: "fusha_simple",
          pitchSemitones: -1.3
        })
      });
      const json = await res.json();
      if (res.ok && json?.ok && json?.audioBase64 && !/pcm|L16/i.test(json.mimeType || "")) {
        if (!saadAudio) { saadAudio = new Audio(); saadAudio.playsInline = true; }
        saadAudio.src = `data:${json.mimeType || "audio/mpeg"};base64,${json.audioBase64}`;
        saadAudio.playbackRate = 1.08;
        saadAudio.play().catch(() => speakSaadLocal(clean));
        return;
      }
      speakSaadLocal(clean);
    } catch (_) {
      speakSaadLocal(clean);
    }
  }

  // ==========================================================================
  // 5) ركن الصدقة وإكرام الجار (تجهيز سلة خير اختيارية من المتوفر في الفرع)
  // ==========================================================================
  function addCharityNeighborBasket() {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const essentialsRx = /رز|أرز|ارز|سكر|زيت|عدس|برغل|طحين|شاي|معكرون|مكرون|سمن|دبس/;
    const picked = [];

    Object.keys(prods).forEach((pid) => {
      if (picked.length >= 4) return;
      const p = prods[pid];
      if (!p || !p.name) return;
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      if (st > 0 && essentialsRx.test(p.name)) {
        picked.push({ id: pid, name: p.name });
      }
    });

    if (!picked.length) {
      if (typeof window.showToast === "function") window.showToast("🕌 تقبّل الله نيتك! اختر أي صنف أساسي من المتجر لإكرام جارك.");
      return;
    }

    picked.forEach((it) => {
      if (typeof window.changeQty === "function") window.changeQty(it.id, 1);
    });
    vibrate([15, 25, 15]);
    const msg = `🕌 جزاك الله خيراً! أضفت ${picked.length} أصناف أساسية (${picked.map((x) => x.name).join("، ")}) إلى السلة بنية الصدقة وإكرام الجار.`;
    if (typeof window.showToast === "function") window.showToast(msg);
  }

  function copyForWhatsApp(text) {
    const payload = `${text}\n\n— من غرفة «سعد» في متجر معاذ 🕌`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(() => {
        if (typeof window.showToast === "function") window.showToast("📋 تم نسخ الموعظة لمشاركتها على واتساب — الدالّ على الخير كفاعله!");
      }).catch(() => {});
    }
  }

  // ==========================================================================
  // 6) بناء واجهة غرفة «سعد» الكاملة والمتجددة تلقائياً
  // ==========================================================================
  function renderSaadRoomHTML() {
    const st = loadState();
    const period = getCurrentIslamicPeriod();
    const custName = getCustomerFirstName();
    const namePart = custName ? ` يا ${custName}` : "";
    const isFriday = new Date().getDay() === 5;
    const { list: prayerList, nextPrayer } = getApproxPrayerSchedule(st.customOffsetMin);
    const donePrayersCount = Object.values(st.prayers).filter(Boolean).length;
    const wisdomItem = WISDOM_COUNSEL[(new Date().getDate() + new Date().getHours()) % WISDOM_COUNSEL.length];
    const activeTasbeeh = TASBEEH_PHRASES[st.tasbeehIndex % TASBEEH_PHRASES.length];

    const subTabsHTML = `
      <div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:6px; margin-bottom:8px; scrollbar-width:none;">
        ${[
          { id: "daily", label: "🕌 يومي والصلوات" },
          { id: "adhkar", label: "📿 الأذكار" },
          { id: "tasbeeh", label: "✨ المسبحة" },
          { id: "wisdom", label: "📜 المواعظ والورد" },
          { id: "duas", label: "🤲 الأدعية" }
        ].map((tb) => `
          <button type="button" onclick="window.MoaathSaadRoom.setTab('${tb.id}')" style="flex-shrink:0; padding:5px 10px; border-radius:999px; font-size:10.5px; font-weight:800; cursor:pointer; border:1px solid ${activeSubTab === tb.id ? "#10b981" : "rgba(212,175,55,0.3)"}; background:${activeSubTab === tb.id ? "linear-gradient(135deg,#10b981,#D4AF37)" : "rgba(255,255,255,0.04)"}; color:${activeSubTab === tb.id ? "#000" : "var(--text-color)"};">${tb.label}</button>
        `).join("")}
      </div>
    `;

    let bodyHTML = "";

    if (activeSubTab === "daily") {
      bodyHTML = `
        <!-- بطاقة الفترة الحالية المتجددة تلقائياً 5 مرات يومياً -->
        <div style="background:linear-gradient(155deg, rgba(16,185,129,0.14), rgba(212,175,55,0.08)); border:1px solid rgba(16,185,129,0.45); border-radius:14px; padding:10px; margin-bottom:9px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <span style="font-size:10px; font-weight:900; color:#10b981; background:rgba(16,185,129,0.16); padding:2px 8px; border-radius:999px;">${period.badge}</span>
            <button type="button" onclick="window.MoaathSaadRoom.speakCurrent()" style="background:rgba(212,175,55,0.18); color:#D4AF37; border:1px solid rgba(212,175,55,0.45); border-radius:999px; padding:2px 8px; font-size:10px; cursor:pointer;">🗣️ استمع</button>
          </div>
          <div style="font-size:11.5px; font-weight:800; color:var(--text-color); margin-bottom:5px;">${escHtml(period.greeting(namePart))}</div>
          <div style="font-size:11px; color:#D4AF37; font-weight:800; margin-bottom:4px;">${period.ayah}</div>
          <div style="font-size:10.5px; color:var(--gray-text); line-height:1.55;">${escHtml(period.reflection)}</div>
        </div>

        ${isFriday ? `
          <div style="background:rgba(212,175,55,0.14); border:1px solid #D4AF37; border-radius:12px; padding:8px 10px; margin-bottom:9px; font-size:10.5px;">
            <b style="color:#D4AF37;">🕌 سنن يوم الجمعة المبارك:</b>
            <div style="margin-top:3px; color:var(--text-color);">• قراءة سورة الكهف • الإكثار من الصلاة على النبي ﷺ • الغُسل والتبكير للجمعة • تحرّي ساعة الاستجابة قبل المغرب.</div>
          </div>
        ` : ""}

        <!-- مواقيت الصلاة والعدّاد التنازلي -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:9px; margin-bottom:9px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="color:#38bdf8; font-size:11px;">🕒 الصلاة القادمة: ${nextPrayer.label} (${nextPrayer.fmt12})</b>
            <span style="font-size:10px; color:#10b981; font-weight:800;">بعد ${nextPrayer.remainingText}</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; text-align:center;">
            ${prayerList.map((p) => {
              const checked = !!st.prayers[p.key];
              return `
                <button type="button" onclick="window.MoaathSaadRoom.togglePrayer('${p.key}')" style="padding:6px 2px; border-radius:10px; cursor:pointer; border:1px solid ${checked ? "#10b981" : "var(--border-color)"}; background:${checked ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.03)"}; color:var(--text-color);">
                  <div style="font-size:10px; font-weight:900;">${p.label}</div>
                  <div style="font-size:8.5px; color:var(--gray-text); margin:2px 0;">${p.fmt12}</div>
                  <div style="font-size:12px;">${checked ? "✅" : "⬜"}</div>
                </button>
              `;
            }).join("")}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:10px; color:var(--gray-text);">
            <span>إنجاز اليوم: <b style="color:#10b981;">${donePrayersCount}/5 صلوات</b></span>
            <span>🔥 سلسلة الالتزام: <b style="color:#D4AF37;">${st.prayerStreak} يوم</b></span>
          </div>
        </div>

        <!-- ركن الصدقة وإكرام الجار -->
        <div style="background:rgba(16,185,129,0.08); border:1px dashed rgba(16,185,129,0.45); border-radius:12px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="font-size:10.5px;">
            <b style="color:#10b981;">🤝 ركن الصدقة وإكرام الجار</b>
            <div style="font-size:9.5px; color:var(--gray-text);">جهّز سلة خير من أساسيات المتجر لإهدائها لأسرة أو جار</div>
          </div>
          <button type="button" onclick="window.MoaathSaadRoom.addCharityBasket()" class="btn" style="width:auto; padding:5px 9px; font-size:10px; background:#10b981; color:#000; flex-shrink:0;">تجهيز سلة خير</button>
        </div>
      `;
    } else if (activeSubTab === "adhkar") {
      bodyHTML = `
        <div style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:6px;">📿 اضغط على الذكر للعدّ حتى يكتمل:</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${ADHKAR_LIST.map((d) => {
            const cur = st.adhkarDone[d.id] || 0;
            const done = cur >= d.target;
            return `
              <button type="button" onclick="window.MoaathSaadRoom.tapDhikr('${d.id}', ${d.target})" style="text-align:right; width:100%; padding:8px 10px; border-radius:12px; cursor:pointer; border:1px solid ${done ? "#10b981" : "var(--border-color)"}; background:${done ? "rgba(16,185,129,0.14)" : "var(--bg-color)"}; color:var(--text-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                  <b style="color:${done ? "#10b981" : "#D4AF37"}; font-size:11px;">${done ? "✅" : "🔹"} ${d.title}</b>
                  <span style="font-size:10px; font-weight:900; color:#38bdf8;">${cur} / ${d.target}</span>
                </div>
                <div style="font-size:10px; color:var(--gray-text); line-height:1.5;">${d.text}</div>
              </button>
            `;
          }).join("")}
        </div>
      `;
    } else if (activeSubTab === "tasbeeh") {
      const pct = Math.min(100, Math.round((st.tasbeehCount / activeTasbeeh.target) * 100));
      bodyHTML = `
        <div style="text-align:center; background:var(--bg-color); border:1px solid rgba(16,185,129,0.4); border-radius:16px; padding:14px;">
          <div style="font-size:13px; font-weight:900; color:#D4AF37; margin-bottom:4px;">${activeTasbeeh.text}</div>
          <div style="font-size:10px; color:var(--gray-text); margin-bottom:10px;">المجموع اليومي: <b style="color:#10b981;">${st.tasbeehDailyTotal}</b> تسبيحة</div>
          <button type="button" onclick="window.MoaathSaadRoom.tapTasbeeh()" style="width:118px; height:118px; border-radius:50%; border:3px solid #10b981; background:radial-gradient(circle, rgba(16,185,129,0.28), rgba(15,23,42,0.95)); color:#fff; font-size:28px; font-weight:900; cursor:pointer; box-shadow:0 0 22px rgba(16,185,129,0.35);">
            ${st.tasbeehCount}
            <div style="font-size:10px; color:#D4AF37; font-weight:700;">من ${activeTasbeeh.target}</div>
          </button>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; margin:12px 0 8px 0;">
            <div style="width:${pct}%; height:100%; background:linear-gradient(90deg,#10b981,#D4AF37);"></div>
          </div>
          <div style="display:flex; justify-content:center; gap:6px;">
            <button type="button" onclick="window.MoaathSaadRoom.nextTasbeeh()" class="btn" style="width:auto; padding:4px 10px; font-size:10px; background:rgba(56,189,248,0.16); color:#38bdf8;">تبديل الذكر ↻</button>
            <button type="button" onclick="window.MoaathSaadRoom.resetTasbeeh()" class="btn" style="width:auto; padding:4px 10px; font-size:10px; background:rgba(239,68,68,0.16); color:#fca5a5;">تصفير العدّاد</button>
          </div>
        </div>
      `;
    } else if (activeSubTab === "wisdom") {
      bodyHTML = `
        <!-- ركن الأمر بالمعروف والنهي عن المنكر بالحكمة -->
        <div style="background:rgba(212,175,55,0.1); border:1px solid #D4AF37; border-radius:12px; padding:10px; margin-bottom:9px;">
          <b style="color:#D4AF37; font-size:11.5px;">📜 موعظة وحكمة: ${wisdomItem.title}</b>
          <p style="margin:5px 0 8px 0; font-size:10.5px; line-height:1.6; color:var(--text-color);">${wisdomItem.text}</p>
          <div style="display:flex; gap:6px;">
            <button type="button" onclick="window.MoaathSaadRoom.speakText('${escHtml(wisdomItem.text)}')" class="btn" style="flex:1; padding:4px 8px; font-size:10px; background:rgba(16,185,129,0.18); color:#10b981;">🗣️ استمع</button>
            <button type="button" onclick="window.MoaathSaadRoom.shareWisdom('${escHtml(wisdomItem.title + ": " + wisdomItem.text)}')" class="btn" style="flex:1; padding:4px 8px; font-size:10px; background:rgba(56,189,248,0.18); color:#38bdf8;">📤 شارك للأجر</button>
          </div>
        </div>

        <!-- متتبع الورد القرآني -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:9px; margin-bottom:9px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b style="color:#10b981; font-size:11px;">📖 وردك القرآني اليومي</b>
            <div style="font-size:10px; color:var(--gray-text);">وصلت إلى: <b style="color:#D4AF37;">الصفحة ${st.quranPage}</b> (الجزء ${Math.min(30, Math.ceil(st.quranPage / 20))})</div>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="window.MoaathSaadRoom.stepQuran(-1)" class="btn" style="width:auto; padding:4px 8px; font-size:11px;">−</button>
            <button type="button" onclick="window.MoaathSaadRoom.stepQuran(1)" class="btn" style="width:auto; padding:4px 10px; font-size:11px; background:#10b981; color:#000;">+1 صفحة</button>
          </div>
        </div>

        <!-- محاسبة النفس المسائية -->
        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; padding:9px;">
          <b style="color:#38bdf8; font-size:11px; display:block; margin-bottom:5px;">🌙 محاسبة النفس والامتنان اليومي:</b>
          ${[
            { k: "prayersOnTime", l: "حافظت على صلواتي في وقتها بخشوع" },
            { k: "kindness", l: "أحسنت لوالديّ أو أدخلت سروراً على مسلم" },
            { k: "tongueGuard", l: "حفظت لساني عن الغيبة والكلام الجارح" }
          ].map((q) => `
            <button type="button" onclick="window.MoaathSaadRoom.toggleAccount('${q.k}')" style="display:block; width:100%; text-align:right; background:none; border:none; color:var(--text-color); padding:3px 0; font-size:10.5px; cursor:pointer;">
              ${st.accountability[q.k] ? "☑️" : "⬜"} ${q.l}
            </button>
          `).join("")}
        </div>
      `;
    } else if (activeSubTab === "duas") {
      const duas = DUAS_LIBRARY[activeDuaCat] || DUAS_LIBRARY.rizq;
      bodyHTML = `
        <div style="display:flex; gap:4px; margin-bottom:8px;">
          ${[
            { id: "rizq", l: "رزق وبركة" },
            { id: "faraj", l: "تفريج هم" },
            { id: "daily", l: "أدعية يومية" },
            { id: "shifa", l: "شفاء وتحصين" }
          ].map((c) => `
            <button type="button" onclick="window.MoaathSaadRoom.setDuaCat('${c.id}')" style="flex:1; padding:4px; border-radius:8px; font-size:10px; cursor:pointer; border:1px solid ${activeDuaCat === c.id ? "#D4AF37" : "var(--border-color)"}; background:${activeDuaCat === c.id ? "rgba(212,175,55,0.2)" : "transparent"}; color:var(--text-color);">${c.l}</button>
          `).join("")}
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${duas.map((d) => `
            <div style="background:var(--bg-color); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:8px; font-size:10.5px; line-height:1.6;">
              <div>🤲 ${d}</div>
              <div style="margin-top:5px; text-align:left;">
                <button type="button" onclick="window.MoaathSaadRoom.shareWisdom('${escHtml(d)}')" style="background:none; border:none; color:#38bdf8; font-size:10px; cursor:pointer;">📋 نسخ</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    return `
      <div style="text-align:right; direction:rtl;">
        <div style="display:flex; align-items:center; gap:9px; margin-bottom:9px; padding-bottom:8px; border-bottom:1px solid rgba(16,185,129,0.28);">
          <img src="friend_saad.jpg" onerror="this.onerror=null;this.src='store-icon.png';" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid #10b981; box-shadow:0 0 12px rgba(16,185,129,0.4);">
          <div style="flex:1;">
            <div style="font-size:14px; font-weight:900; color:#10b981;">🕌 سعد — الصديق الوقور</div>
            <div style="font-size:10px; color:var(--gray-text);">غرفة الالتزام الإيماني • تتحدث تلقائياً 5 مرات يومياً</div>
          </div>
          <button type="button" onclick="window.MoaathSaadRoom.closeModal()" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>
        ${subTabsHTML}
        ${bodyHTML}
      </div>
    `;
  }

  function renderSaadModal() {
    let modal = document.getElementById("moaathSaadRoomModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathSaadRoomModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10082; background:rgba(0,0,0,0.85); backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) window.MoaathSaadRoom.closeModal(); });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }
    modal.innerHTML = `<div class="modal-content" style="max-width:460px; width:95%; max-height:88vh; overflow-y:auto; border:1.5px solid #10b981; border-radius:20px; padding:13px;">${renderSaadRoomHTML()}</div>`;
  }

  // ==========================================================================
  // 7) دمج «سعد» تلقائياً داخل منظومة VIP ومعرض الشخصيات وشريط الاختصارات
  // ==========================================================================
  const SAAD_PERSONA_DEF = {
    id: PERSONA_ID,
    name: "سعد",
    title: "الصديق الوقور والالتزام الإيماني",
    emoji: "🕌",
    img: "friend_saad.jpg",
    voiceName: "Orus",
    gender: "male",
    accent: "#10b981",
    isVIP: true,
    bio: "شاب قمة في الوقار، يذكّرك بالصلاة والأذكار ويأمر بالمعروف وينهى عن المنكر بالحكمة والموعظة الحسنة."
  };

  function registerSaadEverywhere() {
    window.MoaathVIPSystem = window.MoaathVIPSystem || {};
    window.MoaathVIPSystem.personas = window.MoaathVIPSystem.personas || {};
    window.MoaathVIPSystem.personas[PERSONA_ID] = SAAD_PERSONA_DEF;

    window.MoaathVIPRoomModules = window.MoaathVIPRoomModules || {};
    window.MoaathVIPRoomModules[PERSONA_ID] = {
      id: PERSONA_ID,
      name: SAAD_PERSONA_DEF.name,
      render: renderSaadRoomHTML,
      open: () => window.MoaathSaadRoom.openModal()
    };

    if (window.MoaathAIPersonas && window.MoaathAIPersonas.PERSONAS) {
      window.MoaathAIPersonas.PERSONAS[PERSONA_ID] = SAAD_PERSONA_DEF;
    }

    // زر سريع لفتح غرفة سعد في شريط اختصارات المساعد
    const chips = document.getElementById("petQuickPromptChips");
    if (chips && !document.getElementById("moaathSaadRoomChipBtn")) {
      const btn = document.createElement("button");
      btn.id = "moaathSaadRoomChipBtn";
      btn.type = "button";
      btn.className = "fut-chip-btn";
      btn.style.cssText = "border:1px solid rgba(16,185,129,0.55); background:rgba(16,185,129,0.16); color:#10b981;";
      btn.textContent = "🕌 غرفة سعد";
      btn.onclick = () => window.MoaathSaadRoom.openModal();
      chips.appendChild(btn);
    }
  }

  window.MoaathSaadRoom = {
    version: "1.0",
    persona: SAAD_PERSONA_DEF,
    getCurrentPeriod: getCurrentIslamicPeriod,
    openModal() {
      const st = loadState();
      st.visits = (st.visits || 0) + 1;
      saveState(st);
      renderSaadModal();
      clearInterval(livePeriodTimer);
      livePeriodTimer = setInterval(() => {
        const m = document.getElementById("moaathSaadRoomModal");
        if (m && m.style.display === "flex") renderSaadModal();
      }, 60000);
    },
    closeModal() {
      const m = document.getElementById("moaathSaadRoomModal");
      if (m) m.style.display = "none";
      stopSaadVoice();
      clearInterval(livePeriodTimer);
    },
    setTab(t) { activeSubTab = t; renderSaadModal(); },
    setDuaCat(c) { activeDuaCat = c; renderSaadModal(); },
    togglePrayer(key) {
      const st = loadState();
      st.prayers[key] = !st.prayers[key];
      const all5 = Object.values(st.prayers).every(Boolean);
      const tdy = todayStr();
      if (all5 && st.lastStreakDay !== tdy) {
        st.prayerStreak = (st.prayerStreak || 0) + 1;
        st.lastStreakDay = tdy;
        if (typeof window.showToast === "function") window.showToast("🕌 ما شاء الله! أتممت الصلوات الخمس اليوم، تقبّل الله منك.");
      }
      saveState(st);
      vibrate(15);
      renderSaadModal();
    },
    tapDhikr(id, target) {
      const st = loadState();
      const cur = st.adhkarDone[id] || 0;
      st.adhkarDone[id] = cur < target ? cur + 1 : target;
      saveState(st);
      vibrate(12);
      renderSaadModal();
    },
    tapTasbeeh() {
      const st = loadState();
      const phrase = TASBEEH_PHRASES[st.tasbeehIndex % TASBEEH_PHRASES.length];
      st.tasbeehCount = (st.tasbeehCount || 0) + 1;
      st.tasbeehDailyTotal = (st.tasbeehDailyTotal || 0) + 1;
      if (st.tasbeehCount >= phrase.target) {
        st.tasbeehCount = 0;
        st.tasbeehIndex = (st.tasbeehIndex + 1) % TASBEEH_PHRASES.length;
        vibrate([20, 30, 20]);
      } else {
        vibrate(10);
      }
      saveState(st);
      renderSaadModal();
    },
    nextTasbeeh() {
      const st = loadState();
      st.tasbeehIndex = (st.tasbeehIndex + 1) % TASBEEH_PHRASES.length;
      st.tasbeehCount = 0;
      saveState(st);
      renderSaadModal();
    },
    resetTasbeeh() {
      const st = loadState();
      st.tasbeehCount = 0;
      saveState(st);
      renderSaadModal();
    },
    stepQuran(delta) {
      const st = loadState();
      st.quranPage = Math.max(1, Math.min(604, (st.quranPage || 1) + delta));
      saveState(st);
      vibrate(12);
      renderSaadModal();
    },
    toggleAccount(key) {
      const st = loadState();
      st.accountability[key] = !st.accountability[key];
      saveState(st);
      renderSaadModal();
    },
    speakCurrent() {
      const p = getCurrentIslamicPeriod();
      speakSaad(`${p.greeting("")} ${p.reflection} ${p.mawaiz}`);
    },
    speakText: speakSaad,
    shareWisdom: copyForWhatsApp,
    addCharityBasket: addCharityNeighborBasket
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("vip_saad", "1.0");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerSaadEverywhere);
  } else {
    registerSaadEverywhere();
  }
  setTimeout(registerSaadEverywhere, 1100);
  setTimeout(registerSaadEverywhere, 2600);
})();

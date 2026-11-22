// ============================================================================
// زر «⚡ استخدم المهارة» المتكيف تلقائياً مع جميع الشخصيات (moaath_persona_skill_btn.js — v1.0)
// - يتعرف تلقائياً على الشخصية النشطة (الأساسية + الـ 9 VIP بما فيها سعد) ويغيّر عنوان الزر ومهارته فوراً
// - تدوير ذكي للسيناريوهات (3 سيناريوهات لكل شخصية لمنع التكرار عند الضغط المتكرر)
// - ربط مباشر بالمخزون الفعلي للفرع النشط (getProductStockForBranch) وبالأسعار الحية (calcSYP)
// - عرض بطاقة تأكيد مستقبلية بالصور والأسعار قبل الإضافة للسلة (احتراماً لقرار الزبون)
// - تكامل مع الذاكرة المشتركة (MoaathLearningHub) ومع غرفة سعد (MoaathSaadRoom)
// - يعمل محلياً بالكامل (0 حصة API) مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_PERSONA_SKILL_BTN_V1__) return;
  window.__MOAATH_PERSONA_SKILL_BTN_V1__ = true;

  const ROTATION_KEY = "moaath_persona_skill_rotation_v1";
  let lastRenderedPersonaId = null;

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

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  function getActivePersonaId() {
    try {
      const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      if (prefs && prefs.persona) return String(prefs.persona).trim();
    } catch (_) {}
    return "buddy";
  }

  function getStock(pObj) {
    if (!pObj) return 0;
    return typeof window.getProductStockForBranch === "function"
      ? window.getProductStockForBranch(pObj, typeof window.activeBranchId !== "undefined" ? window.activeBranchId : "main")
      : (parseInt(pObj.stock, 10) || 0);
  }

  function getPriceSYP(pObj, isPkg = false) {
    if (!pObj || typeof window.calcSYP !== "function") return 0;
    if (isPkg && pObj.pkgPriceUSD > 0) return window.calcSYP(pObj.pkgPriceUSD);
    const isW = window.currentUser?.userType === "wholesale";
    return window.calcSYP((isW && pObj.wholesaleUSD > 0) ? pObj.wholesaleUSD : (pObj.priceUSD || 0));
  }

  function queryAvailableProducts(regex, opts = {}) {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const maxPrice = opts.maxPrice || Infinity;
    const limit = opts.limit || 4;
    const onlyPkg = !!opts.onlyPkg;
    const onlyRare = !!opts.onlyRare;
    const list = [];

    for (const pid of Object.keys(prods)) {
      const p = prods[pid];
      if (!p || !p.name) continue;
      const st = getStock(p);
      if (st <= 0) continue;
      if (onlyRare && st > 3) continue;

      if (onlyPkg) {
        if (!(parseInt(p.pkgQty, 10) > 1 && p.pkgPriceUSD > 0)) continue;
        const pkgPrice = getPriceSYP(p, true);
        if (pkgPrice <= 0 || pkgPrice > maxPrice) continue;
        list.push({
          id: pid + "_PKG",
          name: `طرد ${p.name} (${p.pkgQty} قطعة)`,
          img: p.img || p.image || "store-icon.png",
          price: pkgPrice,
          stock: st
        });
        continue;
      }

      const price = getPriceSYP(p, false);
      if (price <= 0 || price > maxPrice) continue;
      if (!regex || regex.test(p.name) || regex.test(p.category || "")) {
        list.push({
          id: pid,
          name: p.name,
          img: p.img || p.image || "store-icon.png",
          price,
          stock: st
        });
      }
    }

    list.sort((a, b) => a.price - b.price);
    return list.slice(0, limit);
  }

  function getNextRotationIndex(personaId, count) {
    const map = readJSON(ROTATION_KEY, {});
    const cur = parseInt(map[personaId], 10) || 0;
    const next = (cur + 1) % Math.max(1, count);
    map[personaId] = next;
    writeJSON(ROTATION_KEY, map);
    return cur % Math.max(1, count);
  }

  // ==========================================================================
  // 1) تعريف مهارات جميع الشخصيات (الأساسية + الـ 9 VIP) مع التدوير الذكي
  // ==========================================================================
  const SKILL_DEFINITIONS = {
    grand_chef: {
      btnLabel: "⚡ طبخة بمكونات المتجر",
      accent: "#f59e0b",
      personaName: "الشيف الذهبي",
      scenarios: [
        () => ({
          title: "🍲 طبخة غداء سريعة بمكونات المتجر",
          note: "معكرونة بالبندورة أو مجدرة عدس وبرغل — وصفة مشبعة وسريعة خلال 25 دقيقة بمكونات متوفرة الآن:",
          steps: "1) اسلق المعكرونة أو العدس 12 دقيقة • 2) قلّب الصلصة مع الزيت والبهارات • 3) قدّمها ساخنة بالعافية!",
          items: queryAvailableProducts(/معكرون|مكرون|عدس|برغل|رز|ارز|رب بندور|بندور|زيت|سمن/, { limit: 4 })
        }),
        () => ({
          title: "🍳 فطور أو عشاء شامي دافئ (10 دقائق)",
          note: "تشكيلة فطور وعشاء خفيفة ومغذية من المتوفر حالياً في الفرع:",
          steps: "1) حضّر الشاي الساخن أولاً • 2) قدّم الجبنة والزعتر أو البيض مع الزيت • 3) وجبة متوازنة وسريعة!",
          items: queryAvailableProducts(/بيض|جبن|لبن|زعتر|زيت|مربى|حلاو|شاي|مرتديلا|تونة|تونه/, { limit: 4 })
        }),
        () => ({
          title: "🍜 وجبة طوارئ اقتصادية بـ 5 دقائق",
          note: "أسرع وجبة للجوع المفاجئ بأقل تكلفة متوفرة حالياً:",
          steps: "أضف الماء المغلي والبهارات وتمتع بوجبة دافئة خلال دقائق!",
          items: queryAvailableProducts(/اندومي|نودلز|شورب|معكرون|تونة|تونه|فول/, { maxPrice: 600, limit: 4 })
        })
      ]
    },

    anime_ritaj: {
      btnLabel: "⚡ وصفة حلى بدون فرن",
      accent: "#f472b6",
      personaName: "ريتاج",
      scenarios: [
        () => ({
          title: "🍰 حلى البسكويت والكاكاو البارد (بدون فرن)",
          note: "وصفة لطيفة ترفع المعنويات وتجهز في 10 دقائق فقط!",
          steps: "1) غمّس البسكويت بالحليب الدافئ • 2) اخلط الكاكاو والحليب ووزّعه طبقات • 3) برّده 30 دقيقة وزيّنه بالشوكولاتة 🌸",
          items: queryAvailableProducts(/بسكوت|بسكويت|كاكاو|شوكولا|حليب|قشط|نشاء|سكر/, { limit: 4 })
        }),
        () => ({
          title: "☕ مكافأة النفس اللطيفة (≤ 250 ل.س)",
          note: "تستحق استراحة صغيرة تبتسم فيها! اخترتُ لك أشهى الحلويات والمشروبات اللطيفة بسعر خفيف:",
          steps: "خذ نفساً عميقاً (شهيق 4ث ← زفير 4ث) واستمتع بمكافأتك اللطيفة ✨",
          items: queryAvailableProducts(/شوكولا|بسكوت|بسكويت|كابتشينو|كاكاو|عصير|ويفر/, { maxPrice: 250, limit: 4 })
        }),
        () => ({
          title: "🎈 تجهيز ضيافة أطفال مبهجة",
          note: "تشكيلة محبّبة للصغار للّعب والمرح بألوان وطعمات لذيذة:",
          steps: "رتّبها في أطباق صغيرة ملونة لتصنع لحظة سعادة لا تُنسى!",
          items: queryAvailableProducts(/عصير|شيبس|بسكوت|شوكولا|سناكس|كناكر|كيك/, { limit: 4 })
        })
      ]
    },

    coach_sakhr: {
      btnLabel: "⚡ سلة بروتين اقتصادية",
      accent: "#10b981",
      personaName: "كابتن صخر",
      scenarios: [
        () => {
          const shared = window.MoaathLearningHub?.getSharedProfile ? window.MoaathLearningHub.getSharedProfile() : {};
          const goalTxt = shared.fitnessGoal && shared.fitnessGoal !== "غير محدد" ? ` (مخصّصة لهدفك: ${shared.fitnessGoal})` : "";
          return {
            title: "💪 سلة البروتين الاقتصادي المتوفر الآن",
            note: `أفضل مصادر البروتين مقابل السعر في المخزن حالياً${goalTxt}:`,
            steps: "نصيحة صخر: اشرب كوبين ماء قبل الوجبة وأنجز 15 ضغط أو 20 سكوات اليوم!",
            items: queryAvailableProducts(/بيض|تونة|تونه|عدس|فول|حمص|لبن|حليب|شوفان|جبن/, { limit: 4 })
          };
        },
        () => ({
          title: "🔥 سناك طاقة نظيف قبل التمرين",
          note: "أصناف تمنحك طاقة سريعة قبل المشي أو التمرين المنزلي بدون ثقل:",
          steps: "تناول وجبة خفيفة قبل التمرين بـ 30 دقيقة، ثم ابدأ مؤقت HIIT في غرفتي!",
          items: queryAvailableProducts(/شوفان|تمر|قهوة|قهوه|نسكافيه|مكسرات|بزر|حليب/, { limit: 4 })
        }),
        () => ({
          title: "🥗 وجبة استشفاء مسائية خفيفة",
          note: "اختيارات ذكية وخفيفة على المعدة قبل النوم للحفاظ على لياقتك:",
          steps: "تجنب السكريات العالية ليلاً وركّز على البروتين والماء.",
          items: queryAvailableProducts(/لبن|جبن|تونة|تونه|بيض|شاي اخضر|بابونج|زهورات/, { limit: 4 })
        })
      ]
    },

    princess_layla: {
      btnLabel: "⚡ ضيافة طوارئ 3 دقائق",
      accent: "#ec4899",
      personaName: "الأميرة ليلى",
      scenarios: [
        () => ({
          title: "👑 ضيافة الطوارئ الأنيقة بـ 3 دقائق",
          note: "وصل ضيف مفاجئ؟ هذه أسرع وأرقى 3 أصناف جاهزة للتقديم الفوري من المتجر:",
          steps: "قدّم القهوة أو الشاي المعطّر بجانب البسكويت في صينية مرتّبة مع مناديل أنيقة ✨",
          items: queryAvailableProducts(/قهوة|قهوه|شاي|بسكوت|بسكويت|شوكولا|محارم|عصير/, { limit: 3 })
        }),
        () => ({
          title: "🌸 باقة العناية والانتعاش اليومي",
          note: "أهم مستلزمات العناية والنظافة المعطّرة المتوفرة في الفرع الآن:",
          steps: "خصّصي 10 دقائق مساءً لروتين العناية والاسترخاء.",
          items: queryAvailableProducts(/صابون|شامبو|معطر|ملطف|عطر|كريم|محارم|غسول/, { limit: 4 })
        }),
        () => ({
          title: "☕ تجهيز ركن القهوة والشاي المنزلي",
          note: "أساسيات ركن الضيافة الدافئ ليكون بيتك جاهزاً دائماً:",
          steps: "احفظي القهوة في علبة محكمة الإغلاق للحفاظ على رائحتها الزكية.",
          items: queryAvailableProducts(/قهوة|قهوه|متة|مته|شاي|نسكافيه|كابتشينو|سكر|هيل/, { limit: 4 })
        })
      ]
    },

    butler_farid: {
      btnLabel: "⚡ كشف أوفر طرود اليوم",
      accent: "#38bdf8",
      personaName: "السيد فريد",
      scenarios: [
        () => ({
          title: "📦 رادار أوفر الطرود (_PKG) المتوفرة اليوم",
          note: "شراء الطرد في الأصناف المتكررة يوفّر لك حتى 15% من فاتورتك الشهرية:",
          steps: "اختر الطرود التي تستهلكها عائلتك أسبوعياً لضمان أعلى توفير فعلي.",
          items: queryAvailableProducts(null, { onlyPkg: true, limit: 4 })
        }),
        () => ({
          title: "📊 سلة أساسيات المونة الاقتصادية",
          note: "رتّبتُ لك أرخص الأصناف الأساسية المتوفرة حالياً لضبط ميزانية البيت:",
          steps: "نصيحة فريد: حافظ على نسبة التسالي أقل من 25% من ميزانية الشهر.",
          items: queryAvailableProducts(/سكر|زيت|رز|ارز|عدس|برغل|شاي|سائل جلي|مسحوق/, { limit: 4 })
        }),
        () => ({
          title: "🧼 باقة المنظفات الاقتصادية للبيت",
          note: "أوفر خيارات التنظيف المتوفرة حالياً في المخزن:",
          steps: "راجع نواقص المنظفات مرة كل أسبوعين لتجنب الشراء العشوائي.",
          items: queryAvailableProducts(/سائل جلي|كلور|مسحوق|غسيل|صابون|معطر|ملطف|اسفنج/, { limit: 4 })
        })
      ]
    },

    friend_fadi: {
      btnLabel: "⚡ تجهيز سهرة ومتة",
      accent: "#f97316",
      personaName: "فادي الفرفوش",
      scenarios: [
        () => ({
          title: "🔥 سلة سهرة الشباب والمتة الجاهزة",
          note: "المتة والموالح جاهزة، ولمّة الشباب ما بتحلى بدونها! تشكيلة مختارة من المتوفر:",
          steps: "🎲 سؤال السهرة: لو خيروك تصبّ المتة طول السهرة ولا تدفع حساب الشيبس؟ 😄",
          items: queryAvailableProducts(/متة|مته|بزر|شيبس|موالح|سناكس|كناكر|فستق/, { limit: 4 })
        }),
        () => ({
          title: "🍿 نقرشة سريعة وخفيفة (≤ 200 ل.س)",
          note: "أطيب النقرشات والمقرمشات الخفيفة لتعديل المزاج بدون ما تكلّفك كثير:",
          steps: "افتح مباراة أو جلسة ضحك وخلي النقرشة علينا!",
          items: queryAvailableProducts(/شيبس|سناكس|كناكر|بزر|بسكوت|عصير|بشار/, { maxPrice: 200, limit: 4 })
        }),
        () => ({
          title: "🥤 مشروبات السهرة والروقان",
          note: "مشروبات باردة ودافئة تكمّل قعدة الأصحاب:",
          steps: "نصيحة فادي: لا تخلي مي المتة تغلي كثير حتى ما تحترق!",
          items: queryAvailableProducts(/متة|مته|عصير|كولا|شاي|كابتشينو|نسكافيه|قهوة/, { limit: 4 })
        })
      ]
    },

    anime_zain: {
      btnLabel: "⚡ مهمة سريعة +20 XP",
      accent: "#ef4444",
      personaName: "كابتن زين",
      scenarios: [
        () => {
          if (typeof window.showToast === "function") window.showToast("⚡ مهمة كابتن زين انطلقت! +20 XP عند إتمام التجهيز.");
          return {
            title: "🎮 مهمة القيمرز: تجهيز إمدادات اللعب (+20 XP)",
            note: "الأبطال لا يلعبون بمعدة فارغة! إليك أسرع إمدادات الطاقة والتركيز من المتجر:",
            steps: "🎯 التحدي: أضف صنفاً واحداً وشغّل مؤقت التركيز 25 دقيقة في غرفتي!",
            items: queryAvailableProducts(/شيبس|اندومي|شوكولا|عصير|كابتشينو|نسكافيه|بسكوت/, { limit: 4 })
          };
        },
        () => ({
          title: "⚔️ تحدي السلة المتوازنة (تحت 300 ل.س)",
          note: "اختر إمداداتك بذكاء ضمن ميزانية مغامر صغيرة:",
          steps: "كل خطوة منظّمة ترفع مستواك في عالم VIP!",
          items: queryAvailableProducts(null, { maxPrice: 300, limit: 4 })
        })
      ]
    },

    anime_ryu: {
      btnLabel: "⚡ رادار أقوى توفير",
      accent: "#6366f1",
      personaName: "المحقق ريو",
      scenarios: [
        () => {
          const rare = queryAvailableProducts(null, { onlyRare: true, limit: 4 });
          return {
            title: "🔍 رادار ندرة المخزون (بقي 3 قطع أو أقل)",
            note: rare.length
              ? "رصدتُ لك الأصناف التي أوشكت على النفاد من الرفوف قبل أن يسبقك إليها أحد:"
              : "التحقيق يثبت أن المخزون متوفر بكثرة اليوم! إليك أرخص الأصناف الممتازة:",
            steps: "💡 قاعدة المحقق: قارن السعر بالكمية قبل كل قرار شراء.",
            items: rare.length ? rare : queryAvailableProducts(null, { maxPrice: 250, limit: 4 })
          };
        },
        () => ({
          title: "🕵️‍♂️ ملف التحقيق: أفضل صفقات السعر المنخفض",
          note: "أقل 4 أسعار حقيقية متوفرة الآن في الفرع النشط لإكمال سلتك بذكاء:",
          steps: "لغز سريع: ما الشيء الذي كلما أخذت منه كَبُر؟ (الحفرة!).",
          items: queryAvailableProducts(null, { limit: 4 })
        })
      ]
    },

    friend_saad: {
      btnLabel: "⚡ موعظة وسلة خير",
      accent: "#10b981",
      personaName: "سعد",
      scenarios: [
        () => {
          const period = window.MoaathSaadRoom?.getCurrentPeriod ? window.MoaathSaadRoom.getCurrentPeriod() : null;
          return {
            title: "🕌 تذكير الفترة + ركن الصدقة وإكرام الجار",
            note: period
              ? `${period.ayah}\n${period.reflection}`
              : "ما نقص مالٌ من صدقة.. يمكنك إكرام جار أو أسرة بأصناف أساسية بسيطة من المتجر:",
            steps: "يمكنك أيضاً فتح «غرفة سعد» للمسبحة والأذكار ومواقيت الصلاة.",
            items: queryAvailableProducts(/رز|ارز|سكر|زيت|عدس|برغل|طحين|شاي|معكرون|سمن/, { limit: 4 }),
            extraRoomBtn: { label: "🕌 فتح غرفة سعد", fn: "window.MoaathSaadRoom && window.MoaathSaadRoom.openModal()" }
          };
        },
        () => ({
          title: "📜 حكمة اليوم في الصدق والبركة",
          note: "الصدق في المعاملة والرفق بالناس يطرحان البركة في الرزق والوقت؛ لا تنسَ صلاة وقتك وأذكارك.",
          steps: "ردّد الآن 3 مرات: «أستغفر الله العظيم وأتوب إليه».",
          items: queryAvailableProducts(/تمر|عسل|زيت|شاي|قهوة|سكر/, { limit: 3 }),
          extraRoomBtn: { label: "✨ فتح المسبحة", fn: "window.MoaathSaadRoom && (window.MoaathSaadRoom.setTab('tasbeeh'), window.MoaathSaadRoom.openModal())" }
        })
      ]
    },

    default: {
      btnLabel: "⚡ تعبئة الأساسيات",
      accent: "#D4AF37",
      personaName: "مساعدك الشخصي",
      scenarios: [
        () => ({
          title: "⚡ تعبئة الأساسيات اليومية بسرعة",
          note: "أكثر الأصناف اليومية التي يحتاجها البيت والمتوفرة حالياً في الفرع:",
          steps: "اضغط «✅ أضف التشكيلة للسلة» أو اختر ما تحتاجه فقط بلمسة واحدة.",
          items: queryAvailableProducts(/سكر|زيت|شاي|رز|ارز|متة|مته|بسكوت|معكرون|صابون/, { limit: 4 })
        }),
        () => ({
          title: "✨ مقترحات سريعة بأوفر الأسعار",
          note: "تشكيلة اقتصادية منتقاة لك من المتوفر الآن لتوفير وقتك:",
          steps: "تسوّق ذكي وسريع بأقل عدد من النقرات!",
          items: queryAvailableProducts(null, { maxPrice: 300, limit: 4 })
        })
      ]
    }
  };

  function getSkillDefForPersona(pid) {
    return SKILL_DEFINITIONS[pid] || SKILL_DEFINITIONS.default;
  }

  // ==========================================================================
  // 2) عرض نافذة نتيجة المهارة الاحترافية (بالصور + التأكيد قبل الإضافة)
  // ==========================================================================
  let currentSkillItems = [];

  function openSkillResultModal(personaId) {
    const def = getSkillDefForPersona(personaId);
    const idx = getNextRotationIndex(personaId, def.scenarios.length);
    const result = def.scenarios[idx]();
    currentSkillItems = Array.isArray(result.items) ? result.items : [];

    let totalSYP = 0;
    currentSkillItems.forEach((it) => { totalSYP += (it.price || 0); });

    let modal = document.getElementById("moaathSkillResultModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathSkillResultModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10086; background:rgba(0,0,0,0.85); backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px);";
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    const itemsHTML = currentSkillItems.length
      ? currentSkillItems.map((it) => `
          <div style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(212,175,55,0.28); margin-bottom:6px;">
            <img src="${escHtml(it.img)}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:38px; height:38px; border-radius:9px; object-fit:cover; flex-shrink:0;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:11px; font-weight:800; color:var(--text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(it.name)}</div>
              <div style="font-size:10px; color:#10b981; font-weight:800;">${it.price ? it.price.toLocaleString() + " ل.س" : ""}</div>
            </div>
            <button type="button" onclick="window.changeQty && window.changeQty('${it.id}', 1); window.showToast && window.showToast('✅ أُضيف ${escHtml(it.name)} للسلة');" style="width:30px; height:30px; border-radius:50%; border:none; background:#D4AF37; color:#000; font-size:16px; font-weight:900; cursor:pointer; flex-shrink:0;">+</button>
          </div>
        `).join("")
      : `<div style="font-size:10.5px; color:var(--gray-text); text-align:center; padding:10px;">لا توجد أصناف مطابقة متوفرة حالياً في هذا الفرع — جرّب «سيناريو آخر».</div>`;

    modal.innerHTML = `
      <div class="modal-content" style="max-width:440px; width:94%; max-height:86vh; overflow-y:auto; border:1.5px solid ${def.accent}; border-radius:20px; padding:13px; text-align:right; direction:rtl;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:8px; margin-bottom:8px;">
          <div>
            <b style="color:${def.accent}; font-size:13px;">${escHtml(result.title)}</b>
            <div style="font-size:9.5px; color:var(--gray-text);">مهارة ${escHtml(def.personaName)} الاحترافية • محلي 0 حصة API</div>
          </div>
          <button type="button" onclick="document.getElementById('moaathSkillResultModal').style.display='none'" class="btn btn-danger" style="width:auto; padding:4px 9px; font-size:11px;">✕</button>
        </div>

        <div style="font-size:11px; color:var(--text-color); line-height:1.6; white-space:pre-line; margin-bottom:8px;">${escHtml(result.note)}</div>

        ${result.steps ? `
          <div style="background:rgba(212,175,55,0.1); border:1px dashed ${def.accent}; border-radius:10px; padding:7px 9px; font-size:10px; color:#fde68a; line-height:1.55; margin-bottom:9px;">
            ✨ ${escHtml(result.steps)}
          </div>
        ` : ""}

        <div style="margin-bottom:9px;">${itemsHTML}</div>

        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${currentSkillItems.length ? `
            <button type="button" onclick="window.MoaathPersonaSkill.addAllToCart()" class="btn" style="flex:2; padding:8px 10px; font-size:11px; font-weight:900; background:linear-gradient(135deg, ${def.accent}, #10b981); color:#000;">
              ✅ أضف الكل للسلة (${totalSYP.toLocaleString()} ل.س)
            </button>
          ` : ""}
          <button type="button" onclick="window.MoaathPersonaSkill.trigger()" class="btn" style="flex:1; padding:8px 8px; font-size:10.5px; background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid #38bdf8;">
            🔄 سيناريو آخر
          </button>
          ${result.extraRoomBtn ? `
            <button type="button" onclick="document.getElementById('moaathSkillResultModal').style.display='none'; ${result.extraRoomBtn.fn}" class="btn" style="width:100%; padding:7px; font-size:10.5px; background:rgba(16,185,129,0.18); color:#10b981; border:1px solid #10b981;">
              ${result.extraRoomBtn.label}
            </button>
          ` : ""}
        </div>
      </div>
    `;
    vibrate(15);
  }

  // ==========================================================================
  // 3) زر «⚡ استخدم المهارة» المتكيف تلقائياً داخل لوحة المساعد الشخصي
  // ==========================================================================
  function mountAndSyncSkillButton() {
    const pid = getActivePersonaId();
    const def = getSkillDefForPersona(pid);

    // 1) وضعه كأول زر بارز في شريط الاختصارات (#petQuickPromptChips)
    const chips = document.getElementById("petQuickPromptChips");
    if (chips) {
      let chipBtn = document.getElementById("moaathUseSkillChipBtn");
      if (!chipBtn) {
        chipBtn = document.createElement("button");
        chipBtn.id = "moaathUseSkillChipBtn";
        chipBtn.type = "button";
        chipBtn.className = "fut-chip-btn";
        chipBtn.onclick = () => window.MoaathPersonaSkill.trigger();
        chips.insertBefore(chipBtn, chips.firstChild);
      }
      if (lastRenderedPersonaId !== pid || !chipBtn.textContent) {
        chipBtn.textContent = def.btnLabel;
        chipBtn.style.cssText =
          `border:1.5px solid ${def.accent} !important; ` +
          `background:linear-gradient(135deg, rgba(212,175,55,0.22), rgba(16,185,129,0.18)) !important; ` +
          `color:${def.accent} !important; font-weight:900 !important;`;
      }
    }

    // 2) وضعه أيضاً داخل جسم المساعد (#futuristicAiBody) ليكون مرئياً فوراً عند فتح اللوحة
    const aiBody = document.getElementById("futuristicAiBody");
    if (aiBody) {
      let bodyBtn = document.getElementById("moaathUseSkillBodyBtn");
      if (!bodyBtn) {
        bodyBtn = document.createElement("button");
        bodyBtn.id = "moaathUseSkillBodyBtn";
        bodyBtn.type = "button";
        bodyBtn.style.cssText =
          "width:100%; margin:5px 0 7px 0; padding:7px 10px; border-radius:12px; font-size:11px; font-weight:900; " +
          "cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:6px;";
        bodyBtn.onclick = () => window.MoaathPersonaSkill.trigger();
        aiBody.insertBefore(bodyBtn, aiBody.firstChild);
      }
      if (lastRenderedPersonaId !== pid || !bodyBtn.dataset.boundLabel) {
        bodyBtn.dataset.boundLabel = def.btnLabel;
        bodyBtn.style.border = `1px solid ${def.accent}`;
        bodyBtn.style.background = `linear-gradient(135deg, rgba(212,175,55,0.16), rgba(15,20,30,0.85))`;
        bodyBtn.style.color = def.accent;
        bodyBtn.innerHTML = `<span>${escHtml(def.btnLabel)}</span><span style="font-size:9.5px; color:var(--gray-text);">بلمسة واحدة ▾</span>`;
      }
    }

    lastRenderedPersonaId = pid;
  }

  window.MoaathPersonaSkill = {
    version: "1.0",
    trigger() {
      openSkillResultModal(getActivePersonaId());
    },
    addAllToCart() {
      if (!currentSkillItems.length) return;
      currentSkillItems.forEach((it) => {
        if (typeof window.changeQty === "function") window.changeQty(it.id, 1);
      });
      vibrate([15, 25, 15]);
      const modal = document.getElementById("moaathSkillResultModal");
      if (modal) modal.style.display = "none";
      if (typeof window.showToast === "function") {
        window.showToast(`✅ تمت إضافة ${currentSkillItems.length} أصناف من مهارة المساعد إلى السلة!`);
      }
    },
    sync: mountAndSyncSkillButton
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("persona_skill_btn", "1.0");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAndSyncSkillButton);
  } else {
    mountAndSyncSkillButton();
  }
  setTimeout(mountAndSyncSkillButton, 900);
  setInterval(mountAndSyncSkillButton, 800);
})();

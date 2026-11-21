// ============================================================================
// منظومة الشخصيات الثماني المدفوعة (مدى الحياة) + الغرف اليومية + التفعيل الإداري الحصري
// (ai_vip_personas.js)
// - اشتراك لمرة واحدة مدى الحياة لكل شخصية أو عبر «الباقة الشاملة»
// - التفعيل والإلغاء يتم حصراً من لوحة الإدارة
// - تحديثات يومية تلقائية للغرف المستقلة حسب تاريخ اليوم + دعم إضافات الإدارة
// - عزل كامل ونهائي للذكاء الاصطناعي عن الدفع وشام كاش والإيصالات المالية
// ============================================================================

(function () {
  if (window.MoaathVIPSystem) return;

  const VIP_ENTITLEMENTS_KEY = "moaath_vip_lifetime_entitlements_v1";
  const VIP_CONFIG_KEY = "moaath_vip_pricing_config_v1";
  const STORE_WHATSAPP_PHONE = "963965461504";

  const DEFAULT_VIP_CONFIG = {
    singlePriceUSD: 5,
    bundlePriceUSD: 25,
    updatedAt: "2026-11-21"
  };

  const VIP_PERSONAS = {
    // 1) الشخصيات الخمس المميزة
    coach_sakhr: {
      id: "coach_sakhr",
      group: "specialist",
      name: "كابتن صخر",
      role: "المدرب الرياضي",
      badge: "لياقة وبناء أجسام",
      gender: "male",
      toneTag: "حازم ومحفز ورياضي",
      voiceName: "Fenrir",
      speed: 1.24,
      pitchSemitones: -1.6,
      accent: "#10b981",
      avatarUrl: "coach_sakhr.jpg",
      shortDesc: "جداول تدريب يومية متجددة وحاسبة نشاط وسلة تغذية رياضية.",
      styleHint: "بصوت مدرب رياضي حازم ومحفز ومباشر بالعربية الواضحة",
      greet: "أهلاً بالبطل في غرفة التدريب! انضباط اليوم يصنع قوة الغد."
    },
    grand_chef: {
      id: "grand_chef",
      group: "specialist",
      name: "الشيف الذهبي",
      role: "كبير الطهاة",
      badge: "وصفات دقيقة ومصورة",
      gender: "male",
      toneTag: "راقٍ ودقيق وخبير مطبخ",
      voiceName: "Orus",
      speed: 1.18,
      pitchSemitones: -1.2,
      accent: "#f59e0b",
      avatarUrl: "grand_chef.jpg",
      shortDesc: "وصفات طبخ يومية دقيقة مع الصور والمقادير وتجهيز المتوفر للسلة.",
      styleHint: "بصوت طباخ خبير وهادئ وواضح يشرح الوصفات والمقادير بدقة",
      greet: "أهلاً بك في مطبخ الشيف الذهبي، حيث الدقة والمذاق الأصيل."
    },
    princess_layla: {
      id: "princess_layla",
      group: "specialist",
      name: "الأميرة ليلى",
      role: "الأميرة الجميلة",
      badge: "ضيافة وحلويات وعناية",
      gender: "female",
      toneTag: "رقيقة ومهذبة وراقية",
      voiceName: "Aoede",
      speed: 1.16,
      pitchSemitones: 3.0,
      accent: "#ec4899",
      avatarUrl: "princess_layla.jpg",
      shortDesc: "ركن الضيافة والحلويات اليومية ولمسات العناية والذوق الرفيع.",
      styleHint: "بصوت أنثوي راقٍ ومهذب وناعم ومشرق",
      greet: "أهلاً بك في جناح الضيافة الملكي، يسعدني تنسيق أرقى اختياراتك اليوم."
    },
    butler_farid: {
      id: "butler_farid",
      group: "specialist",
      name: "السيد فريد",
      role: "كبير الخدم",
      badge: "تنظيم ومؤونة البيت",
      gender: "male",
      toneTag: "رسمي ومنظم ودقيق",
      voiceName: "Charon",
      speed: 1.22,
      pitchSemitones: -1.8,
      accent: "#8b5cf6",
      avatarUrl: "butler_farid.jpg",
      shortDesc: "جدول مؤونة المنزل اليومي وتنسيق الميزانية وتجهيز الاحتياجات.",
      styleHint: "بصوت منظم ورسمي ومهذب يخاطب الزبون باحترام ودقة",
      greet: "أهلاً بك سيدي، كل شيء مرتب وجاهز لتنظيم مؤونة اليوم بدقة."
    },
    friend_fadi: {
      id: "friend_fadi",
      group: "specialist",
      name: "فادي الفرفوش",
      role: "الصديق الوفي كثير المزاح",
      badge: "مرح وسهرات وتسلية",
      gender: "male",
      toneTag: "مرح وعفوي وخفيف الظل",
      voiceName: "Puck",
      speed: 1.28,
      pitchSemitones: 1.1,
      accent: "#f97316",
      avatarUrl: "friend_fadi.jpg",
      shortDesc: "مزحة اليوم وتشكيلة السهرة والمتة اليومية وألعاب خفيفة.",
      styleHint: "بصوت صديق شاب مرح وعفوي وخفيف الظل بلهجة ودودة",
      greet: "ولك هلا بالصديق الوفي! خلينا نكسر الروتين ونضبط أحلى مزاج اليوم."
    },

    // 2) شخصيات الأنمي الثلاث (بما فيها ريتاج)
    anime_zain: {
      id: "anime_zain",
      group: "anime",
      name: "كابتن زين",
      role: "بطل الأنمي المغامر",
      badge: "مغامرات وطاقة الأبطال",
      gender: "male",
      toneTag: "حماسي وبطولي ومندفع",
      voiceName: "Fenrir",
      speed: 1.27,
      pitchSemitones: -0.6,
      accent: "#ef4444",
      avatarUrl: "anime_zain.jpg",
      shortDesc: "مهمة اليوم اليومية ووقود الأبطال ونقاط الخبرة التفاعلية.",
      styleHint: "بصوت بطل أنمي حماسي ومندفع وحيوي",
      greet: "مهمة جديدة بدأت اليوم! هل أنت مستعد لتجهيز وقود الأبطال؟"
    },
    anime_ryu: {
      id: "anime_ryu",
      group: "anime",
      name: "المحقق ريو",
      role: "محقق الأنمي الذكي",
      badge: "تحليل وأذكى صفقات",
      gender: "male",
      toneTag: "هادئ وذكي ومحلل",
      voiceName: "Charon",
      speed: 1.23,
      pitchSemitones: -1.0,
      accent: "#38bdf8",
      avatarUrl: "anime_ryu.jpg",
      shortDesc: "لغز اليوم اليومي ورادار أذكى صفقة ومقارنة الأسعار.",
      styleHint: "بصوت محقق ذكي وهادئ وواثق ومختصر",
      greet: "كل تفصيل له معنى؛ دعنا نحلل أفضل خيارات اليوم بدقة."
    },
    anime_ritaj: {
      id: "anime_ritaj",
      group: "anime",
      name: "ريتاج",
      role: "نجمة الأنمي اللطيفة",
      badge: "إشراقة وحلى ومزاج اليوم",
      gender: "female",
      toneTag: "لطيفة ومشرقة ومبهجة",
      voiceName: "Leda",
      speed: 1.22,
      pitchSemitones: 2.8,
      accent: "#f472b6",
      avatarUrl: "anime_ritaj.jpg",
      shortDesc: "رسالة طاقة ريتاج اليومية وحلى اليوم ومقياس المزاج.",
      styleHint: "بصوت أنثوي لطيف ومشرق ومبهج بنبرة أنمي ودودة",
      greet: "أهلاً بك في عالم ريتاج المشرق! لنجعل يومك مليئاً بالبهجة والحلاوة."
    }
  };

  // قوالب التحديث اليومي التلقائي لكل شخصية (تدور تلقائياً حسب رقم اليوم من السنة)
  const DAILY_ROOM_ROTATIONS = {
    coach_sakhr: [
      {
        title: "جدول القوة والتحمل المنزلي",
        focus: "إحماء 5 دقائق + تمرين ضغط 4×12 + سكوات 4×15 + بلانك 3×40 ثانية",
        nutritionTip: "احرص على وجبة غنية بالبروتين والكربوهيدرات المعقدة خلال ساعتين بعد التمرين.",
        keywords: ["بيض", "عدس", "حليب", "رز", "شوفان"]
      },
      {
        title: "جدول الكارديو والرشاقة السريع",
        focus: "مشي سريع/هرولة 20 دقيقة + قفز حبل 3 جولات + تمارين بطن متنوعة",
        nutritionTip: "اشرب الماء بانتظام وابتعد عن السكريات العالية بعد المساء.",
        keywords: ["ماء", "عصير", "لبن", "خضار", "تونة"]
      },
      {
        title: "جدول الاستشفاء والمرونة العضلية",
        focus: "إطالة كاملة للظهر والكتفين والأرجل 12 دقيقة + تنفس عميق واسترخاء",
        nutritionTip: "الاستشفاء جزء أساسي من بناء العضلات؛ نم مبكراً ووزّع وجباتك بهدوء.",
        keywords: ["حليب", "عسل", "موز", "بيض", "لبنة"]
      }
    ],
    grand_chef: [
      {
        recipeTitle: "مقلوبة باذنجان على أصولها",
        imageUrl: "recipe_maqlouba.jpg",
        steps: [
          "قطّع الباذنجان والبطاطا شرائح متوسطة واقلِهما حتى يأخذا لوناً ذهبياً خفيفاً.",
          "رتّب شرائح البندورة في قاع القدر ثم أضف الخضار والرز المغسول والمنقوع.",
          "أضف المرق المتبل بالبهار والملح والكمون، واتركها تغلي ثم على نار هادئة حتى تنضج."
        ],
        keywords: ["رز", "باذنجان", "بطاطا", "بندورة", "بصل", "بهار", "زيت"]
      },
      {
        recipeTitle: "مجدرة برغل بالزيت والكمون",
        imageUrl: "recipe_moujaddara.jpg",
        steps: [
          "اسلق العدس نصف سلقة ثم أضف البرغل الخشن مع الماء والملح والكمون.",
          "حمّر البصل المفروم جيداً بزيت الزيتون حتى يصبح مقرمشاً وذهبياً.",
          "اسكب المجدرة في طبق التقديم وزيّنها بالبصل المقرمش ورشة زيت زيتون."
        ],
        keywords: ["برغل", "عدس", "بصل", "زيتون", "كمون", "ملح"]
      },
      {
        recipeTitle: "معكرونة بالبشاميل الكريمية",
        imageUrl: "recipe_bechamel.jpg",
        steps: [
          "اسلق المعكرونة في ماء مملح مع قليل من الزيت وصفّها جانباً.",
          "حضّر صوص البشاميل بتحميص الطحين مع السمن ثم إضافة الحليب تدريجياً مع التحريك المستمر.",
          "امزج طبقة بشاميل مع المعكرونة وأضف الجبن ثم أدخلها الفرن حتى يتحمر الوجه."
        ],
        keywords: ["معكرونة", "حليب", "طحين", "سمن", "جبن", "ملح"]
      }
    ],
    princess_layla: [
      {
        title: "ضيافة القهوة وحلى البسكويت الملكي",
        detail: "قدّم قهوة أو شاي مع طبق حلى بارد بالبسكويت والشوكولاتة بترتيب أنيق يليق بالضيوف.",
        careTip: "الاهتمام بأدق التفاصيل الصغيرة في التقديم يترك أثراً جميلاً ومميزاً.",
        keywords: ["بسكوت", "شوكولاتة", "قهوة", "شاي", "حليب"]
      },
      {
        title: "ركن العناية والصفاء المسائي",
        detail: "حضّر مشروباً دافئاً مهدئاً ورتّب ركن الضيافة والمناديل والعطور المنزلية بهدوء.",
        careTip: "الذوق الرفيع يظهر في البساطة والترتيب واللطف في التعامل.",
        keywords: ["شاي", "عسل", "حليب", "مناديل", "صابون"]
      }
    ],
    butler_farid: [
      {
        title: "تدقيق المؤونة الأساسية للمنزل",
        detail: "مراجعة الأرز، الزيت، السكر، الخبز، والمنظفات الأساسية لضمان عدم نفادها فجأة.",
        budgetTip: "قسّم مشترياتك إلى أساسيات لا غنى عنها وكماليات مؤجلة للحفاظ على توازن الميزانية.",
        keywords: ["رز", "زيت", "سكر", "خبز", "سائل جلي"]
      },
      {
        title: "تنظيم قائمة الأسبوع والضيافة",
        detail: "تجهيز الاحتياجات اليومية للفطور والطبخ والمنظفات بجدول واضح ومنضبط.",
        budgetTip: "الشراء المنظم يقلل الهدر ويوفر الوقت والجهد طوال الأسبوع.",
        keywords: ["بيض", "جبن", "حليب", "طحين", "مسحوق غسيل"]
      }
    ],
    friend_fadi: [
      {
        joke: "مرة واحد راح عالدكان بدو غرضين، طلع ومعو كيس كامل قال للمحاسب: هاد الكيس لحالو بدو كرسي!",
        moodPick: "تشكيلة سهرة ومتة وبزر وشيبس لرفع المزاج وتغيير الجو.",
        keywords: ["متة", "بزر", "شيبس", "بسكوت", "عصير"]
      },
      {
        joke: "الفرق بين الجوعان قبل الفطور وبعده: قبل الفطور يشوف الرغيف قد الشمس، وبعده يسأل: وين راح الصحن؟",
        moodPick: "سناكس مقرمشة ومشروبات باردة لضحكة سريعة وسهرة حلوة.",
        keywords: ["شيبس", "بزر", "شوكولاتة", "عصير", "قهوة"]
      }
    ],
    anime_zain: [
      {
        mission: "مهمة اليوم: جهّز وجبة طاقة متكاملة وأكمل هدفك اليومي بثبات.",
        xpReward: "+150 XP روح قتالية",
        keywords: ["رز", "بيض", "حليب", "عصير", "بسكوت"]
      },
      {
        mission: "مهمة اليوم: تحدّي السرعة والانضباط — اختر أصنافك الأساسية دون تردد.",
        xpReward: "+200 XP بطل الميدان",
        keywords: ["عدس", "برغل", "شاي", "ماء", "شيبس"]
      }
    ],
    anime_ryu: [
      {
        mystery: "لغز اليوم: ما الشيء الذي يكتب ولا يقرأ؟ (القلم) — والصفقة الأذكى هي التي تجمع الجودة والسعر المناسب.",
        clue: "راجع الأصناف المتوفرة في الفرع وقارن السعر قبل الإضافة.",
        keywords: ["سكر", "زيت", "شاي", "جبن", "خبز"]
      },
      {
        mystery: "لغز اليوم: ما الشيء الذي كلما زاد نقص؟ (العمر) — والوقت الأنسب لاختيار احتياجاتك هو الآن.",
        clue: "استفد من البحث الذكي لاقتناص المتوفر فوراً.",
        keywords: ["رز", "حليب", "بيض", "بندورة", "بطاطا"]
      }
    ],
    anime_ritaj: [
      {
        message: "يا ريتاج تقول لك: ابتسامتك اليوم تصنع فرقاً كبيراً، ودلل نفسك بحلى أو مشروب تحبه!",
        sweetIdea: "حلى بارد بالبسكويت أو كيك منزلي خفيف مع كوب دافئ.",
        keywords: ["بسكوت", "شوكولاتة", "حليب", "سكر", "عصير"]
      },
      {
        message: "إشراقة ريتاج اليوم: كل يوم فرصة جديدة لطاقة حلوة واختيارات تسعد قلبك.",
        sweetIdea: "مهلبية أو كاسترد حلو أو شوكولاتة خفيفة للمساء.",
        keywords: ["حليب", "نشا", "سكر", "شوكولاتة", "بسكوت"]
      }
    ]
  };

  let adminEntitlements = loadLocalEntitlements();
  let vipConfig = loadLocalConfig();

  function loadLocalEntitlements() {
    try {
      const d = JSON.parse(localStorage.getItem(VIP_ENTITLEMENTS_KEY) || "{}");
      return d && typeof d === "object" ? d : { bundleLifetime: false, personas: {} };
    } catch (_) {
      return { bundleLifetime: false, personas: {} };
    }
  }

  function saveLocalEntitlements(obj) {
    try {
      localStorage.setItem(VIP_ENTITLEMENTS_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  function loadLocalConfig() {
    try {
      const d = JSON.parse(localStorage.getItem(VIP_CONFIG_KEY) || "{}");
      return { ...DEFAULT_VIP_CONFIG, ...(d && typeof d === "object" ? d : {}) };
    } catch (_) {
      return { ...DEFAULT_VIP_CONFIG };
    }
  }

  function saveLocalConfig(cfg) {
    try {
      localStorage.setItem(VIP_CONFIG_KEY, JSON.stringify(cfg));
    } catch (_) {}
  }

  function getCustomerKey() {
    try {
      const u = typeof currentUser !== "undefined" && currentUser ? currentUser : null;
      const phone = String(u?.phone || $("customerPhoneInput")?.value || $("cartPhoneInput")?.value || "guest").trim();
      return phone.replace(/[^0-9A-Za-z_]/g, "") || "guest";
    } catch (_) {
      return "guest";
    }
  }

  function getActiveCustomerEntitlements() {
    const custKey = getCustomerKey();
    const byCust = adminEntitlements.customers?.[custKey];
    if (byCust && typeof byCust === "object") {
      return {
        bundleLifetime: !!byCust.bundleLifetime,
        personas: { ...(byCust.personas || {}) }
      };
    }
    return {
      bundleLifetime: !!adminEntitlements.bundleLifetime,
      personas: { ...(adminEntitlements.personas || {}) }
    };
  }

  function isPersonaUnlockedLifetime(personaId) {
    if (!VIP_PERSONAS[personaId]) return false;
    const ent = getActiveCustomerEntitlements();
    return !!(ent.bundleLifetime || ent.personas?.[personaId]);
  }

  function isBundleUnlockedLifetime() {
    const ent = getActiveCustomerEntitlements();
    return !!ent.bundleLifetime;
  }

  // التفعيل أو الإلغاء يتم حصراً من لوحة الإدارة
  function adminSetEntitlement(targetCustomerKey, personaIdOrBundle, enable = true) {
    const cleanCust = String(targetCustomerKey || getCustomerKey() || "guest").replace(/[^0-9A-Za-z_]/g, "") || "guest";
    adminEntitlements.customers = adminEntitlements.customers || {};
    const curCust = adminEntitlements.customers[cleanCust] || { bundleLifetime: false, personas: {} };

    if (personaIdOrBundle === "BUNDLE_ALL_8") {
      curCust.bundleLifetime = !!enable;
      if (enable) {
        Object.keys(VIP_PERSONAS).forEach(pid => { curCust.personas[pid] = true; });
      }
    } else if (VIP_PERSONAS[personaIdOrBundle]) {
      curCust.personas = curCust.personas || {};
      curCust.personas[personaIdOrBundle] = !!enable;
    }

    adminEntitlements.customers[cleanCust] = curCust;
    if (cleanCust === getCustomerKey()) {
      adminEntitlements.bundleLifetime = !!curCust.bundleLifetime;
      adminEntitlements.personas = { ...(curCust.personas || {}) };
    }

    saveLocalEntitlements(adminEntitlements);

    if (typeof db !== "undefined" && db && typeof db.ref === "function") {
      try {
        db.ref(`vip_entitlements/${cleanCust}`).set(curCust).catch(() => {});
      } catch (_) {}
    }

    if (typeof showToast === "function") {
      const label = personaIdOrBundle === "BUNDLE_ALL_8" ? "الباقة الشاملة (8 شخصيات مدى الحياة)" : (VIP_PERSONAS[personaIdOrBundle]?.name || personaIdOrBundle);
      showToast(enable ? `✅ تم تفعيل (${label}) مدى الحياة للزبون (${cleanCust}) من الإدارة.` : `🔒 تم إيقاف تفعيل (${label}) للزبون (${cleanCust}).`);
    }
    renderAdminVIPTab();
    renderVIPShowcaseModal();
    syncUnlockedVIPPersonasIntoCompanion();
  }

  function getDayOfYearIndex() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / 86400000);
  }

  function getDailyContentForPersona(personaId) {
    const list = DAILY_ROOM_ROTATIONS[personaId] || [];
    if (!list.length) return null;
    const idx = getDayOfYearIndex() % list.length;
    return {
      dayIndex: getDayOfYearIndex(),
      dateLabel: new Date().toLocaleDateString("ar-SY"),
      item: list[idx]
    };
  }

  function formatPriceFromUSD(usd) {
    const numUSD = Number(usd) || 0;
    try {
      if (typeof calcSYP === "function") {
        const syp = calcSYP(numUSD);
        if (syp > 0) return `$${numUSD} (${Number(syp).toLocaleString()} ل.س)`;
      }
    } catch (_) {}
    return `$${numUSD}`;
  }

  function openWhatsAppSubscriptionRequest(labelName, priceText) {
    const custName = String($("customerNameInput")?.value || $("cartNameInput")?.value || currentUser?.name || "زبون المتجر").trim();
    const custPhone = String($("customerPhoneInput")?.value || $("cartPhoneInput")?.value || currentUser?.phone || "غير محدد").trim();
    const msg = `مرحباً متجر معاذ، أرغب بالاشتراك لمرة واحدة مدى الحياة في: ${labelName} (${priceText}) — الاسم: ${custName}، الرقم: ${custPhone}. يرجى التفعيل من الإدارة.`;
    const url = `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function findAvailableStoreProductsByKeywords(keywords = [], limit = 6) {
    if (typeof products !== "object" || !products) return [];
    const normList = (keywords || []).map(k => String(k || "").trim().toLowerCase()).filter(Boolean);
    const matches = [];
    for (const pid of Object.keys(products)) {
      const p = products[pid];
      if (!p || !p.name) continue;
      const stock = typeof getProductStockForBranch === "function"
        ? getProductStockForBranch(p, typeof activeBranchId !== "undefined" ? activeBranchId : "main")
        : (parseInt(p.stock, 10) || 1);
      if (stock <= 0) continue;
      const pName = String(p.name).toLowerCase();
      if (normList.some(kw => pName.includes(kw))) {
        matches.push({ id: pid, name: p.name });
        if (matches.length >= limit) break;
      }
    }
    return matches;
  }

  function addMatchedProductsToCart(keywords = []) {
    const found = findAvailableStoreProductsByKeywords(keywords, 6);
    if (!found.length) {
      if (typeof showToast === "function") showToast("لا توجد أصناف مطابقة متوفرة حالياً في الفرع.");
      return;
    }
    let added = 0;
    found.forEach(item => {
      if (typeof changeQty === "function") {
        changeQty(item.id, 1);
        added++;
      }
    });
    if (added > 0 && typeof showToast === "function") {
      showToast(`✅ تمت إضافة ${added} أصناف متوفرة إلى السلة.`);
    }
  }

  // نافذة الغرفة المستقلة اليومية للشخصية المفعّلة
  window.openVIPDailyRoom = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (!isPersonaUnlockedLifetime(personaId)) {
      if (typeof showToast === "function") showToast("🔒 هذه الشخصية تتطلب اشتراكاً لمرة واحدة مدى الحياة وتفعيلها من الإدارة.");
      window.openVIPShowcaseModal();
      return;
    }

    const daily = getDailyContentForPersona(personaId);
    const data = daily?.item || {};
    const matchedProds = findAvailableStoreProductsByKeywords(data.keywords || [], 6);

    let modal = document.getElementById("vipDailyRoomModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vipDailyRoomModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10045; background:rgba(0,0,0,0.82);";
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    let bodyHtml = "";
    if (personaId === "grand_chef") {
      const stepsHtml = (data.steps || []).map((st, idx) => `<li style="margin-bottom:5px;"><b>الخطوة ${idx + 1}:</b> ${st}</li>`).join("");
      bodyHtml = `
        <div style="margin-bottom:8px;">
          <img src="${data.imageUrl || "store-icon.png"}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${data.recipeTitle || p.name}" style="width:100%; max-height:155px; object-fit:cover; border-radius:10px; border:1px solid ${p.accent};">
        </div>
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🍲 وصفة اليوم: ${data.recipeTitle || ""}</div>
        <ol style="padding-right:18px; margin:0 0 8px 0; font-size:11px; line-height:1.65;">${stepsHtml}</ol>
      `;
    } else if (personaId === "coach_sakhr") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🏋️ برنامج اليوم: ${data.title || ""}</div>
        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:8px; font-size:11px; line-height:1.65; margin-bottom:8px;">
          <div><b>التمرين اليومي:</b> ${data.focus || ""}</div>
          <div style="margin-top:5px; color:#a7f3d0;"><b>نصيحة التغذية:</b> ${data.nutritionTip || ""}</div>
        </div>
      `;
    } else if (personaId === "princess_layla") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">👑 جناح اليوم: ${data.title || ""}</div>
        <div style="font-size:11px; line-height:1.65; margin-bottom:6px;">${data.detail || ""}</div>
        <div style="font-size:11px; color:#fbcfe8;">✨ ${data.careTip || ""}</div>
      `;
    } else if (personaId === "butler_farid") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🎩 دفتر اليوم: ${data.title || ""}</div>
        <div style="font-size:11px; line-height:1.65; margin-bottom:6px;">${data.detail || ""}</div>
        <div style="font-size:11px; color:#ddd6fe;">📌 ${data.budgetTip || ""}</div>
      `;
    } else if (personaId === "friend_fadi") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">😂 مزحة اليوم وتجهيز السهرة</div>
        <div style="background:rgba(249,115,22,0.08); border:1px solid rgba(249,115,22,0.3); border-radius:10px; padding:8px; font-size:11px; line-height:1.65; margin-bottom:8px;">
          <div>${data.joke || ""}</div>
          <div style="margin-top:6px; color:#fed7aa;"><b>مقترح اليوم:</b> ${data.moodPick || ""}</div>
        </div>
      `;
    } else if (personaId === "anime_zain") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">⚡ غرفة كابتن زين — مهمة اليوم</div>
        <div style="font-size:11px; line-height:1.65; margin-bottom:6px;">${data.mission || ""}</div>
        <div style="font-size:11px; color:#fca5a5; font-weight:700;">🏆 ${data.xpReward || ""}</div>
      `;
    } else if (personaId === "anime_ryu") {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🕵️ غرفة المحقق ريو — لغز اليوم</div>
        <div style="font-size:11px; line-height:1.65; margin-bottom:6px;">${data.mystery || ""}</div>
        <div style="font-size:11px; color:#7dd3fc;">🔍 ${data.clue || ""}</div>
      `;
    } else {
      bodyHtml = `
        <div style="font-weight:800; color:${p.accent}; font-size:13px; margin-bottom:6px;">🌟 غرفة ريتاج — إشراقة اليوم</div>
        <div style="font-size:11px; line-height:1.65; margin-bottom:6px;">${data.message || ""}</div>
        <div style="font-size:11px; color:#f9a8d4;">🍰 ${data.sweetIdea || ""}</div>
      `;
    }

    const prodsChips = matchedProds.length
      ? matchedProds.map(m => `<span style="background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.35); border-radius:999px; padding:3px 8px; font-size:10px;">${m.name}</span>`).join("")
      : `<span style="font-size:10px; color:var(--gray-text);">تصفح أقسام المتجر لإضافة المكونات المتوفرة.</span>`;

    modal.innerHTML = `
      <div class="modal-content" style="max-width:430px; border:1.5px solid ${p.accent}; background:#121212; color:#f9fafb; border-radius:16px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${p.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${p.name}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid ${p.accent};">
            <div>
              <div style="font-size:13px; font-weight:800; color:${p.accent};">${p.name} <small style="color:#9ca3af; font-weight:600;">(${p.role})</small></div>
              <div style="font-size:9px; color:#00e676;">✅ اشتراك مدى الحياة • تحديث يومي (${daily?.dateLabel || ""})</div>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('vipDailyRoomModal').style.display='none'" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:11px;">✕</button>
        </div>

        ${bodyHtml}

        <div style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.12);">
          <div style="font-size:10px; font-weight:700; color:var(--gold-color); margin-bottom:5px;">🛒 أصناف مرتبطة بيوميات الغرفة ومتوفرة في الفرع:</div>
          <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">${prodsChips}</div>
          <div style="display:flex; gap:7px; flex-wrap:wrap;">
            <button type="button" onclick="window.__vipAddRoomItems('${personaId}')" class="btn" style="flex:1; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000; font-size:11px;">➕ أضف المتوفر للسلة</button>
            <button type="button" onclick="window.__vipActivateAsCompanion('${personaId}')" class="btn" style="flex:1; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color); font-size:11px;">🎙️ نطق التحية</button>
          </div>
        </div>
      </div>
    `;
  };

  window.__vipAddRoomItems = function (personaId) {
    const daily = getDailyContentForPersona(personaId);
    addMatchedProductsToCart(daily?.item?.keywords || []);
  };

  window.__vipActivateAsCompanion = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (typeof window.selectPetPersona === "function") {
      // تمرير نداء النطق المباشر دون التأثير على القائمة المجانية إن لم تكن مسجلة فيها
    }
    if (typeof showToast === "function") showToast(`${p.name}: ${p.greet}`);
  };

  // نافذة عرض بطاقات الاشتراك (تضم بطاقة الباقة الشاملة + بطاقات الاشتراك لمرة واحدة مدى الحياة)
  window.openVIPShowcaseModal = function (activeTab = "all") {
    let modal = document.getElementById("vipShowcaseModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vipShowcaseModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10040; background:rgba(0,0,0,0.8);";
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }
    modal.dataset.vipTab = activeTab;
    renderVIPShowcaseModal();
  };

  function renderVIPShowcaseModal() {
    const modal = document.getElementById("vipShowcaseModal");
    if (!modal || modal.style.display === "none") return;
    const currentTab = modal.dataset.vipTab || "all";
    const bundleActive = isBundleUnlockedLifetime();
    const bundlePriceLbl = formatPriceFromUSD(vipConfig.bundlePriceUSD);
    const singlePriceLbl = formatPriceFromUSD(vipConfig.singlePriceUSD);

    const allList = Object.values(VIP_PERSONAS);
    const filteredList = allList.filter(p => {
      if (currentTab === "specialist") return p.group === "specialist";
      if (currentTab === "anime") return p.group === "anime";
      return true;
    });

    const cardsHtml = filteredList.map(p => {
      const unlocked = isPersonaUnlockedLifetime(p.id);
      return `
        <div style="background:#18181b; border:1px solid ${unlocked ? "#00e676" : "rgba(212,175,55,0.38)"}; border-radius:14px; padding:9px; display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
          <div>
            <div style="display:flex; align-items:center; gap:7px; margin-bottom:5px;">
              <img src="${p.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${p.name}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid ${p.accent}; flex-shrink:0;">
              <div style="min-width:0;">
                <div style="font-size:11px; font-weight:800; color:${p.accent}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                <div style="font-size:9px; color:#d1d5db;">${p.role}</div>
              </div>
            </div>
            <div style="font-size:10px; color:#9ca3af; line-height:1.4; margin-bottom:5px;">${p.shortDesc}</div>
            <div style="font-size:9px; color:#fbbf24; font-weight:700;">اشتراك مرة واحدة مدى الحياة: ${singlePriceLbl}</div>
          </div>
          ${unlocked
            ? `<button type="button" onclick="window.openVIPDailyRoom('${p.id}')" class="btn" style="padding:5px 8px; font-size:10px; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">🚪 دخول الغرفة اليومية</button>`
            : `<button type="button" onclick="window.__vipRequestSingle('${p.id}')" class="btn" style="padding:5px 8px; font-size:10px; background:rgba(212,175,55,0.16); color:var(--gold-color); border:1px solid var(--gold-color);">🔒 تفعيل مدى الحياة (إدارة)</button>`
          }
        </div>
      `;
    }).join("");

    modal.innerHTML = `
      <div class="modal-content" style="max-width:450px; border:1.5px solid var(--gold-color); background:#121212; color:#f9fafb; border-radius:18px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:8px; margin-bottom:10px;">
          <div>
            <b style="color:var(--gold-color); font-size:13px;">👑 الشخصيات المميزة — اشتراك لمرة واحدة مدى الحياة</b>
            <div style="font-size:9px; color:#9ca3af;">التفعيل يتم حصراً عبر الإدارة • تحديث يومي تلقائي للغرف</div>
          </div>
          <button type="button" onclick="document.getElementById('vipShowcaseModal').style.display='none'" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:11px;">✕</button>
        </div>

        <!-- بطاقة الباقة الشاملة -->
        <div style="background:linear-gradient(135deg, rgba(212,175,55,0.2), rgba(56,189,248,0.14)); border:1.5px solid var(--gold-color); border-radius:14px; padding:10px; margin-bottom:10px; box-shadow:0 6px 18px rgba(212,175,55,0.14);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-size:12px; font-weight:800; color:var(--gold-color);">💎 الباقة الشاملة (جميع الـ 8 شخصيات)</div>
              <div style="font-size:10px; color:#e5e7eb; margin-top:2px;">اشتراك واحد مدى الحياة يفتح كافة الغرف اليومية للشخصيات الثماني.</div>
            </div>
            <div style="font-size:11px; font-weight:800; color:#00e676;">${bundlePriceLbl}</div>
          </div>
          <div style="margin-top:8px;">
            ${bundleActive
              ? `<span style="display:inline-block; background:rgba(0,230,118,0.18); color:#00e676; border:1px solid #00e676; border-radius:999px; padding:4px 10px; font-size:10px; font-weight:800;">✅ الباقة الشاملة مفعّلة مدى الحياة</span>`
              : `<button type="button" onclick="window.__vipRequestBundle()" class="btn" style="background:linear-gradient(45deg,#d4af37,#f59e0b); color:#000; font-size:11px; padding:6px 10px;">👑 طلب تفعيل الباقة الشاملة مدى الحياة عبر الإدارة</button>`
            }
          </div>
        </div>

        <!-- تبويب الفئات -->
        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <button type="button" onclick="window.openVIPShowcaseModal('all')" class="cat-btn" style="flex:1; background:${currentTab === "all" ? "var(--gold-color)" : "transparent"}; color:${currentTab === "all" ? "#000" : "var(--text-color)"}; border:1px solid var(--gold-color);">الكل (8)</button>
          <button type="button" onclick="window.openVIPShowcaseModal('specialist')" class="cat-btn" style="flex:1; background:${currentTab === "specialist" ? "var(--gold-color)" : "transparent"}; color:${currentTab === "specialist" ? "#000" : "var(--text-color)"}; border:1px solid var(--gold-color);">المميزة (5)</button>
          <button type="button" onclick="window.openVIPShowcaseModal('anime')" class="cat-btn" style="flex:1; background:${currentTab === "anime" ? "var(--gold-color)" : "transparent"}; color:${currentTab === "anime" ? "#000" : "var(--text-color)"}; border:1px solid var(--gold-color);">الأنمي (3)</button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; max-height:48vh; overflow-y:auto; padding-left:2px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  window.__vipRequestSingle = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    openWhatsAppSubscriptionRequest(`شخصية (${p.name} - ${p.role})`, formatPriceFromUSD(vipConfig.singlePriceUSD));
  };

  window.__vipRequestBundle = function () {
    openWhatsAppSubscriptionRequest("الباقة الشاملة (8 شخصيات)", formatPriceFromUSD(vipConfig.bundlePriceUSD));
  };

  // لوحة التفعيل الحصرية في لوحة الإدارة (#adminModal)
  function renderAdminVIPTab() {
    const box = document.getElementById("admVipActivationBox");
    if (!box) return;
    const targetCust = String(document.getElementById("admVipTargetCustomer")?.value || getCustomerKey() || "guest").replace(/[^0-9A-Za-z_]/g, "") || "guest";
    const custData = adminEntitlements.customers?.[targetCust] || {
      bundleLifetime: !!adminEntitlements.bundleLifetime,
      personas: { ...(adminEntitlements.personas || {}) }
    };

    const rowsHtml = Object.values(VIP_PERSONAS).map(p => {
      const active = !!(custData.bundleLifetime || custData.personas?.[p.id]);
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; padding:6px 8px; border-bottom:1px dashed var(--border-color); font-size:11px;">
          <div>
            <b>${p.name}</b> <small style="color:var(--gray-text);">(${p.role})</small>
            <span style="margin-right:6px; color:${active ? "#00e676" : "#f59e0b"}; font-weight:700;">${active ? "• مفعّل مدى الحياة" : "• غير مفعّل"}</span>
          </div>
          <button type="button" onclick="window.__adminToggleVip('${targetCust}', '${p.id}', ${!active})" class="btn" style="width:auto; padding:3px 9px; font-size:10px; background:${active ? "#ef4444" : "#10b981"}; color:#000;">
            ${active ? "إلغاء التفعيل" : "تفعيل مدى الحياة"}
          </button>
        </div>
      `;
    }).join("");

    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; background:rgba(212,175,55,0.12); border:1px solid var(--gold-color); border-radius:8px; padding:8px; margin-bottom:8px; font-size:11px;">
        <div>
          <b>💎 الباقة الشاملة مدى الحياة (8 شخصيات)</b>
          <div style="font-size:10px; color:var(--gray-text);">الحالة للزبون (${targetCust}): ${custData.bundleLifetime ? "مفعّلة مدى الحياة" : "غير مفعّلة"}</div>
        </div>
        <button type="button" onclick="window.__adminToggleVip('${targetCust}', 'BUNDLE_ALL_8', ${!custData.bundleLifetime})" class="btn" style="width:auto; padding:4px 10px; font-size:10px; background:${custData.bundleLifetime ? "#ef4444" : "var(--gold-color)"}; color:#000;">
          ${custData.bundleLifetime ? "إلغاء الباقة" : "تفعيل الباقة الشاملة"}
        </button>
      </div>
      <div>${rowsHtml}</div>
    `;
  }

  window.__adminToggleVip = function (custKey, targetId, enable) {
    adminSetEntitlement(custKey, targetId, enable);
  };

  window.__adminSaveVipPrices = function () {
    const singleVal = Math.max(1, parseFloat(document.getElementById("admVipSinglePriceUSD")?.value || vipConfig.singlePriceUSD) || 5);
    const bundleVal = Math.max(1, parseFloat(document.getElementById("admVipBundlePriceUSD")?.value || vipConfig.bundlePriceUSD) || 25);
    vipConfig = { singlePriceUSD: singleVal, bundlePriceUSD: bundleVal, updatedAt: new Date().toISOString().slice(0, 10) };
    saveLocalConfig(vipConfig);
    if (typeof db !== "undefined" && db && typeof db.ref === "function") {
      try { db.ref("vip_config").set(vipConfig).catch(() => {}); } catch (_) {}
    }
    if (typeof showToast === "function") showToast("✅ تم حفظ أسعار الاشتراك مدى الحياة.");
    renderVIPShowcaseModal();
  };

  function mountAdminVIPSection() {
    const adminContent = document.querySelector("#adminModal .modal-content");
    const tabsBar = adminContent?.querySelector(".categories");
    if (!adminContent || !tabsBar || document.getElementById("admTab14VIP")) return;

    const tabBtn = document.createElement("button");
    tabBtn.className = "cat-btn";
    tabBtn.textContent = "👑 اشتراكات VIP";
    tabBtn.onclick = function () {
      if (typeof switchAdminTab === "function") switchAdminTab("admTab14VIP", this);
      renderAdminVIPTab();
    };
    tabsBar.appendChild(tabBtn);

    const tabDiv = document.createElement("div");
    tabDiv.id = "admTab14VIP";
    tabDiv.className = "admin-tab";
    tabDiv.style.display = "none";
    tabDiv.innerHTML = `
      <div class="adm-sec" style="border-color:var(--gold-color);">
        <div class="adm-sec-title"><span>👑 إدارة تفعيل الشخصيات المدفوعة مدى الحياة (للإدارة حصراً)</span></div>
        <div class="form-group">
          <label>معرّف / رقم هاتف الزبون المستهدف:</label>
          <input type="text" id="admVipTargetCustomer" class="form-control" value="${getCustomerKey()}" oninput="renderAdminVIPTab()" placeholder="مثال: 0965461504 أو guest">
        </div>
        <div class="stats-grid" style="margin-bottom:8px;">
          <div class="form-group">
            <label>سعر الشخصية الواحدة مدى الحياة ($):</label>
            <input type="number" id="admVipSinglePriceUSD" class="form-control" value="${vipConfig.singlePriceUSD}">
          </div>
          <div class="form-group">
            <label>سعر الباقة الشاملة مدى الحياة ($):</label>
            <input type="number" id="admVipBundlePriceUSD" class="form-control" value="${vipConfig.bundlePriceUSD}">
          </div>
        </div>
        <button type="button" onclick="window.__adminSaveVipPrices()" class="btn" style="background:var(--gold-color); color:#000; font-size:11px; margin-bottom:10px;">💾 حفظ الأسعار</button>
        <div id="admVipActivationBox"></div>
      </div>
    `;
    adminContent.appendChild(tabDiv);
    renderAdminVIPTab();
  }

  function injectVIPButtonIntoAssistantHeader() {
    const actionsEl = document.querySelector("#futuristicAiHeader .fut-ai-header-actions");
    if (!actionsEl || document.getElementById("futVipShowcaseBtn")) return;
    const btn = document.createElement("button");
    btn.id = "futVipShowcaseBtn";
    btn.type = "button";
    btn.className = "fut-icon-btn fut-gold-btn";
    btn.textContent = "👑 VIP";
    btn.title = "الشخصيات المميزة والباقة الشاملة (اشتراك مدى الحياة)";
    btn.onclick = function () { window.openVIPShowcaseModal("all"); };
    actionsEl.insertBefore(btn, actionsEl.firstChild);
  }

  // مزامنة تلقائية مع Firebase إن وُجد
  if (typeof db !== "undefined" && db && typeof db.ref === "function") {
    try {
      db.ref("vip_config").on("value", snap => {
        const val = snap.val();
        if (val && typeof val === "object") {
          vipConfig = { ...vipConfig, ...val };
          saveLocalConfig(vipConfig);
        }
      });
      const ck = getCustomerKey();
      db.ref(`vip_entitlements/${ck}`).on("value", snap => {
        const val = snap.val();
        if (val && typeof val === "object") {
          adminEntitlements.customers = adminEntitlements.customers || {};
          adminEntitlements.customers[ck] = val;
          if (ck === getCustomerKey()) {
            adminEntitlements.bundleLifetime = !!val.bundleLifetime;
            adminEntitlements.personas = { ...(val.personas || {}) };
          }
          saveLocalEntitlements(adminEntitlements);
          renderVIPShowcaseModal();
          renderAdminVIPTab();
        }
      });
    } catch (_) {}
  }

  function initVIPSystem() {
    injectVIPButtonIntoAssistantHeader();
    mountAdminVIPSection();
    syncUnlockedVIPPersonasIntoCompanion();
    const curSelVal = document.getElementById('petPersonaSelect')?.value;
    if (curSelVal && VIP_PERSONAS[curSelVal] && isPersonaUnlockedLifetime(curSelVal) && typeof window.__registerDynamicCompanionPersona === 'function') {
      window.__registerDynamicCompanionPersona(curSelVal, enrichVIPPersonaForCompanion(VIP_PERSONAS[curSelVal]));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initVIPSystem, 120));
  } else {
    setTimeout(initVIPSystem, 120);
  }

  const _origRenderStoreVIP = window.renderStore;
  window.renderStore = function () {
    if (typeof _origRenderStoreVIP === "function") _origRenderStoreVIP();
    setTimeout(initVIPSystem, 80);
  };

  // بناء حزمة كاملة من العبارات والردود المميزة لكل شخصية VIP لتعمل كجنية متحدثة بأسلوبها الخاص
  function enrichVIPPersonaForCompanion(p) {
    if (!p) return null;
    const baseGreets = [
      p.greet,
      `${p.name} معك (${p.role})، بماذا أساعدك اليوم في متجر معاذ؟`,
      `أهلاً بك، ${p.name} جاهز لتجهيز طلبك بسرعة ودقة.`
    ].filter(Boolean);

    const chatGoods = {
      coach_sakhr: ["بأعلى جاهزية ولياقة! هيا نكمل يومك بنشاط.", "تمام التمام يا بطل، ما هدفك الرياضي أو الغذائي اليوم؟"],
      grand_chef: ["بأفضل حال في المطبخ، المقادير جاهزة والذوق مضمون.", "أهلاً بك، أخبرني عن الطبخة أو الصنف الذي تريده اليوم."],
      princess_layla: ["بكل لطف وصفاء، يسعدني جداً مساعدتك اليوم.", "أهلاً بك، أختار لك دائماً ما يليق بذوقك الرفيع."],
      butler_farid: ["تحت أمرك سيدي، كل شيء منظم ومضبوط بدقة.", "بأتم الاستعداد لتنسيق مؤونة واحتياجات اليوم."],
      friend_fadi: ["عايش ومبسوط ورايق، ومجهزلك أحلى مزاج وسهرة!", "يا هلا بالصديق، شو بنضبط اليوم ليكسر الروتين؟"],
      anime_zain: ["طاقتي مشتعلة ومستعد لأي مهمة تسوق اليوم!", "بأقصى سرعة وحماس، انطلق لنجهز وقود الأبطال!"],
      anime_ryu: ["كل المؤشرات ممتازة، والصفقة الأذكى بانتظارك.", "بهدوء وتحليل دقيق، اخترت لك الأنسب دائماً."],
      anime_ritaj: ["مبسوطة ومشرقة بوجودك، وراح نخلي يومك أحلى!", "أهلاً بك، مع ريتاج كل شيء ألطف وأجمل!"]
    };

    const thanksList = {
      coach_sakhr: ["كفو منك، استمر على هذا الانضباط الرائع.", "على الرحب يا بطل، دائماً في الخدمة."],
      grand_chef: ["بالعافية مقدماً، يسعدني تقديم الأفضل دائماً.", "العفو، نكهة متجر معاذ ترحب بك."],
      princess_layla: ["بكل سرور، وجودك يزيد المكان جمالاً.", "العفو، يسعدني دائماً خدمتك بلطف."],
      butler_farid: ["على الرحب والسعة سيدي، في خدمتكم دائماً.", "لا شكر على واجب، التنظيم من أولوياتي."],
      friend_fadi: ["ولو يا غالي، الصديق وقت الضيق والطلب!", "العفو يا معلم، خلينا نشوف شو بدك بعد."],
      anime_zain: ["هذا واجب الأبطال، نراكم في المهمة القادمة!", "العفو، انطلق بثقة ونجاح!"],
      anime_ryu: ["تحليل ناجح، يسعدني مساعدتك دائماً.", "العفو، لأي استفسار أنا هنا."],
      anime_ritaj: ["شكراً لك أنت على لطفك، يسعدني أساعدك دايماً!", "العفو يا حلو، نورت المتجر!"]
    };

    const addedMsgs = {
      coach_sakhr: [(n) => `ممتاز يا بطل، تمت إضافة ${n} إلى سلة القوة.`],
      grand_chef: [(n) => `أضفت ${n} إلى السلة بعناية للمطبخ.`],
      princess_layla: [(n) => `بكل ذوق، تمت إضافة ${n} إلى سلتك.`],
      butler_farid: [(n) => `تم قيد وإضافة ${n} إلى السلة بنظام.`],
      friend_fadi: [(n) => `يا سلام! نزلت ${n} بالسلة وصارت جاهزة.`],
      anime_zain: [(n) => `تمت إضافة ${n} إلى السلة، مهمة ناجحة!`],
      anime_ryu: [(n) => `تمت إضافة ${n} إلى السلة بعد التحقق من التوفر.`],
      anime_ritaj: [(n) => `ياي! تمت إضافة ${n} إلى سلتك بكل حب.`]
    };

    return {
      ...p,
      roleBadge: `${p.gender === "female" ? "أنثوي" : "ذكري"} • ${p.badge || p.role}`,
      specialtyNote: `${p.name} (${p.role}): ${p.shortDesc}`,
      fallbackDetune: Math.round((p.pitchSemitones || 0) * 90),
      fallbackRate: p.speed || 1.24,
      greets: baseGreets,
      timeGreets: {
        morning: [`صباح الخير والنشاط، ${p.name} معك في متجر معاذ.`],
        evening: [`مساء الخير، ${p.name} جاهز لخدمتك اليوم.`]
      },
      chatGood: (chatGoods[p.id] || ["أنا بخير، كيف يمكنني خدمتك اليوم?"])[0],
      chatGoods: chatGoods[p.id] || ["أنا بخير، كيف يمكنني خدمتك اليوم?"],
      thanks: (thanksList[p.id] || ["العفو، يسعدني دائماً خدمتك."])[0],
      thanksList: thanksList[p.id] || ["العفو، يسعدني دائماً خدمتك."],
      addedMsgs: addedMsgs[p.id] || [(n) => `تمت إضافة ${n} إلى السلة.`],
      recipeReady: (t) => `جهزت لك المتوفر لوصفة ${t} بأسلوب ${p.name}، حدد الكمية.`,
      recipeMissing: (t) => `بعض مكونات ${t} غير متوفرة حالياً في الفرع.`,
      itemsReady: () => `عرضت لك الأصناف المتوفرة في الفرع، حدد الكمية.`,
      alternativeReplies: ["الطلب غير متوفر حالياً، وعرضت لك أقرب البدائل المتوفرة."],
      habitReplies: ["هذه اختياراتك المعتادة والمتوفرة في الفرع."],
      notFounds: ["لم أجد صنفاً مطابقاً متوفراً الآن."],
      notFound: "لم أجد صنفاً مطابقاً متوفراً الآن."
    };
  }

  // حركة دخول بارزة وعصرية عند تفعيل أو اختيار شخصية مميزة أو فتح غرفتها
  window.triggerVIPProminentEntrance = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (!document.getElementById("vipEntranceAnimStyle")) {
      const st = document.createElement("style");
      st.id = "vipEntranceAnimStyle";
      st.textContent = `
        @keyframes vipGrandEntrance {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.72) rotate(-8deg);
            filter: drop-shadow(0 0 0 rgba(212, 175, 55, 0));
          }
          55% {
            opacity: 1;
            transform: translateY(-6px) scale(1.14) rotate(4deg);
            filter: drop-shadow(0 0 22px rgba(212, 175, 55, 0.85));
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.45));
          }
        }
        @keyframes vipBannerSlide {
          0% { opacity: 0; transform: translate(-50%, -18px) scale(0.92); }
          15%, 85% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -14px) scale(0.95); }
        }
        .vip-grand-entrance-active {
          animation: vipGrandEntrance 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
        }
        #vipEntranceSpotlightBanner {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10060;
          background: linear-gradient(135deg, rgba(18, 18, 22, 0.96), rgba(30, 27, 15, 0.96));
          border: 1.5px solid #d4af37;
          border-radius: 999px;
          padding: 7px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f9fafb;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(212, 175, 55, 0.45);
          pointer-events: none;
          animation: vipBannerSlide 2.6s ease forwards;
        }
      `;
      document.head.appendChild(st);
    }

    const orb = document.getElementById("petCharOrb");
    if (orb) {
      orb.classList.remove("vip-grand-entrance-active");
      void orb.offsetWidth;
      orb.classList.add("vip-grand-entrance-active");
      setTimeout(() => orb.classList.remove("vip-grand-entrance-active"), 900);
    }

    let banner = document.getElementById("vipEntranceSpotlightBanner");
    if (banner) banner.remove();
    banner = document.createElement("div");
    banner.id = "vipEntranceSpotlightBanner";
    banner.style.borderColor = p.accent || "#d4af37";
    banner.innerHTML = `
      <img src="${p.avatarUrl}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${p.name}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1.5px solid ${p.accent || "#d4af37"};">
      <span style="color:${p.accent || "#fbbf24"};">✨ دخل ${p.name}</span>
      <span style="color:#d1d5db; font-weight:600;">(${p.role})</span>
    `;
    document.body.appendChild(banner);
    setTimeout(() => { if (banner && banner.parentNode) banner.remove(); }, 2650);
  };

  // ربط الشخصيات المفعّلة للزبون بقائمة اختيار الجنية المتحدثة في ai_engine.js
  function syncUnlockedVIPPersonasIntoCompanion() {
    const sel = document.getElementById("petPersonaSelect");
    if (!sel) return;

    const allVip = Object.values(VIP_PERSONAS);
    const unlockedVip = allVip.filter(p => isPersonaUnlockedLifetime(p.id));

    // إزالة أي خيارات VIP قديمة ثم إضافة المفعّلة فقط للزبون
    Array.from(sel.options).forEach(opt => {
      if (opt.dataset && opt.dataset.vipOption === "1") opt.remove();
    });

    unlockedVip.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.dataset.vipOption = "1";
      opt.textContent = `👑 ${p.name} — ${p.role}`;
      sel.appendChild(opt);
    });
  }

  // اعتراض استدعاء selectPetPersona في ai_engine.js ليدعم الشخصيات المفعّلة مع حركة الدخول البارزة
  const _origSelectPetPersona = window.selectPetPersona;
  window.selectPetPersona = function (key) {
    if (VIP_PERSONAS[key]) {
      if (!isPersonaUnlockedLifetime(key)) {
        if (typeof showToast === "function") showToast("🔒 هذه الشخصية تتطلب اشتراكاً مدى الحياة وتفعيلها من الإدارة.");
        window.openVIPShowcaseModal("all");
        return;
      }
      // تسجيل الشخصية المفعّلة في خريطة الشخصيات المتاحة قبل تشغيل التحديد
      if (typeof window.__registerDynamicCompanionPersona === "function") {
        window.__registerDynamicCompanionPersona(key, enrichVIPPersonaForCompanion(VIP_PERSONAS[key]));
      }
      if (typeof _origSelectPetPersona === "function") {
        _origSelectPetPersona(key);
      }
      window.triggerVIPProminentEntrance(key);
      return;
    }
    if (typeof _origSelectPetPersona === "function") {
      _origSelectPetPersona(key);
    }
  };

  // تحديث زر البطاقة داخل الغرفة اليومية لتعيين الشخصية كجنية متحدثة فعلياً مع حركة الدخول
  window.__vipActivateAsCompanion = function (personaId) {
    const p = VIP_PERSONAS[personaId];
    if (!p) return;
    if (!isPersonaUnlockedLifetime(personaId)) {
      window.openVIPShowcaseModal("all");
      return;
    }
    syncUnlockedVIPPersonasIntoCompanion();
    window.selectPetPersona(personaId);
    const roomModal = document.getElementById("vipDailyRoomModal");
    if (roomModal) roomModal.style.display = "none";
  };

  window.MoaathVIPSystem = {
    version: "1.0-lifetime-daily-rooms",
    personas: VIP_PERSONAS,
    isPersonaUnlockedLifetime,
    isBundleUnlockedLifetime,
    getDailyContentForPersona,
    adminSetEntitlement
  };
})();

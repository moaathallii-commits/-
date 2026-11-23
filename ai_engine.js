// ============================================================================
// محرك الجنيات المتحدثة ثلاثية الأبعاد لمتجر معاذ (v80 - Guaranteed Audible TTS & Diagnostics)
// - إلغاء كامل ونهائي للتحقق من الدفع وشام كاش عبر الذكاء الاصطناعي
// - ضمان خروج الصوت بوضوح على الهاتف عبر مشغل صوت مباشر موثوق + دعم Web Audio detune عند الإمكان
// - بحث ذكي عن رابط Cloudflare Worker في عدة مصادر لتجنب الخروج الصامت
// - كشف فوري لحالة الصوت والـ Worker في الشارة الجانبية مع إمكانية الاختبار المباشر
// - رفع سرعة التحدث قليلاً لجميع الشخصيات + أسلوب بشري حر وتلقائي
// ============================================================================

(function () {
  if (window.__MOAATH_AI_LOADED__) return;
  window.__MOAATH_AI_LOADED__ = true;

  const PREFS_KEY = "moaath_store_pet_prefs";
  const POS_KEY = "moaath_store_pet_pos";
  const LEARN_KEY = "moaath_store_pet_learned";

  const FALLBACK_BUDDY = {
    id: "buddy",
    gender: "male",
    toneTag: "ودود ومبتسم",
    name: "بندق الودود",
    roleBadge: "ذكري • ودود ومبتسم",
    specialtyNote: "بندق (ذكري ودود): صوت دافئ ومبتسم ومضيء يرحب بك بترحاب واضح.",
    avatarUrl: "buddy.jpg",
    accent: "#00b0ff",
    voiceName: "Puck",
    speed: 1.0,
    pitchSemitones: 0.6,
    fallbackDetune: 60,
    fallbackRate: 1.0,
    styleHint: "صوت ذكري شاب ودود ومبتسم بالعربية الفصحى المبسطة بسرعة إلقاء مضبوطة 1.32",
    greet: "أهلاً بك، نورت متجر معاذ. ماذا تحب أن أجهز لك اليوم؟",
    greets: ["أهلاً بك، نورت متجر معاذ. ماذا تحب أن أجهز لك اليوم؟"],
    chatGood: "أنا بخير والحمد لله، كيف يمكنني خدمتك اليوم؟",
    chatGoods: ["أنا بخير والحمد لله، كيف يمكنني خدمتك اليوم؟"],
    thanks: "العفو، يسعدني دائماً أن أكون في خدمتك.",
    thanksList: ["العفو، يسعدني دائماً أن أكون في خدمتك."],
    addedMsgs: [(n) => `تمت إضافة ${n} إلى السلة.`],
    recipeReady: (t) => `جهزت لك المتوفر لوصفة ${t}، حدد الكمية.`,
    recipeMissing: (t) => `مكونات وصفة ${t} غير متوفرة حالياً.`,
    itemsReady: () => "عرضت لك الأصناف المتوفرة، حدد الكمية.",
    notFounds: ["لم أجد صنفاً مطابقاً متوفراً الآن."],
    notFound: "لم أجد صنفاً مطابقاً متوفراً الآن."
  };

  const PERSONAS = (window.MoaathAIPersonas && window.MoaathAIPersonas.PERSONAS)
    ? window.MoaathAIPersonas.PERSONAS
    : { buddy: FALLBACK_BUDDY };

  window.__registerDynamicCompanionPersona = function (key, personaObj) {
    if (!key || !personaObj || typeof PERSONAS !== "object") return;
    PERSONAS[key] = personaObj;
  };

  function pickPhrase(list, key) {
    if (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.pickPhrase === "function") {
      return window.MoaathAIPersonas.pickPhrase(list, key);
    }
    return Array.isArray(list) && list.length ? list[0] : "";
  }

  // ==========================================================================
  // [محرك التراكيب اللانهائي للجمل + مانع التكرار + حماية حصة الصوت البشري]
  // - يولّد مئات التراكيب المتجددة لكل شخصية (10 أساسية + 8 VIP) بـ 0 حصة API
  // - يمنع تكرار آخر 12 جملة ظهرت للزبون
  // - يربط النية الصوتية بملفات sounds/ المحفوظة لحماية الحصة المجانية
  // ==========================================================================
  // ==========================================================================
  // [مكتبة الأصوات البشرية المسجّلة (sounds_manifest.json — 388+ مقطع Neural MP3)]
  // ==========================================================================
  let soundsManifestData = null;
  const manifestTextToFile = new Map();

  function indexSoundsManifest(data) {
    if (!data || !data.personas || typeof data.personas !== "object") return;
    soundsManifestData = data;
    manifestTextToFile.clear();
    Object.keys(data.personas).forEach((pid) => {
      const intents = data.personas[pid] || {};
      Object.keys(intents).forEach((intent) => {
        const arr = Array.isArray(intents[intent]) ? intents[intent] : [];
        arr.forEach((item) => {
          if (item && item.text && item.file) {
            const normKey = `${pid}::${looseSpeechNorm(item.text)}`;
            manifestTextToFile.set(normKey, item.file);
          }
        });
      });
    });
  }

  const MANIFEST_LOCAL_KEY = "moaath_sounds_manifest_cache_v1";
  let manifestPreloadRunning = false;

  function loadSoundsManifest() {
    // قراءة النسخة المحفوظة محلياً فوراً للعمل بدون إنترنت نهائياً
    try {
      const cached = JSON.parse(localStorage.getItem(MANIFEST_LOCAL_KEY) || "null");
      if (cached && cached.personas) indexSoundsManifest(cached);
    } catch (_) {}

    if (navigator.onLine === false) return;
    fetch("sounds_manifest.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.personas) {
          indexSoundsManifest(data);
          try { localStorage.setItem(MANIFEST_LOCAL_KEY, JSON.stringify(data)); } catch (_) {}
          setTimeout(() => {
            if (typeof runManifestBackgroundPreload === "function") runManifestBackgroundPreload();
          }, 3500);
        }
      })
      .catch(() => {});
  }
  loadSoundsManifest();

  const PHRASE_HIST_KEY = "moaath_phrase_anti_repeat_v1";

  function getPhraseHistory() {
    try {
      const d = JSON.parse(localStorage.getItem(PHRASE_HIST_KEY) || "{}");
      return d && typeof d === "object" ? d : {};
    } catch (_) {
      return {};
    }
  }

  function savePhraseHistory(hist) {
    try { localStorage.setItem(PHRASE_HIST_KEY, JSON.stringify(hist)); } catch (_) {}
  }

  function getPersonaStyleGroup(persona) {
    const id = String(persona?.id || "buddy");
    if (/coach_sakhr|anime_zain|athlete/.test(id)) return "energetic";
    if (/grand_chef|princess_layla|butler_farid|anime_ryu/.test(id)) return "formal";
    if (/friend_fadi/.test(id)) return "playful";
    if (/anime_ritaj|lolo|pastry/.test(id)) return "sweet";
    return "friendly";
  }

  function getCustomerFirstName() {
    try {
      const raw = String(currentUser?.name || $("customerNameInput")?.value || "").trim();
      if (!raw || raw === "زبون" || raw === "زائر") return "";
      return raw.split(/\s+/)[0].slice(0, 18);
    } catch (_) {
      return "";
    }
  }

  function getTimeGreetingWord() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return { word: "صباح الخير", clipKey: "greetMorning" };
    if (h >= 18 || h < 5) return { word: "مساء الخير", clipKey: "greetEvening" };
    return { word: "أهلاً بك", clipKey: "greet" };
  }

  const INFINITE_BANKS = {
    greet: {
      friendly: {
        a: ["أهلاً وسهلاً", "يا هلا ومرحبا", "نورت متجر معاذ", "حياك الله", "أهلاً بك دائماً", "يا مية هلا"],
        b: ["اليوم الأجواء جميلة للتسوق", "كل الأصناف الطازجة بانتظارك", "يسعدني جداً خدمتك الآن", "المتجر منور بوجودك", "جاهز أساعدك بأي طلب"],
        c: ["ماذا تحب أن نجهّز لك اليوم؟", "اخبرني بطلبك وسأرتبه لك فوراً.", "بماذا نبدأ سلتك الآن؟", "اطلب ما تحب أو جرّب طبخة اليوم!", "أنا هنا لتسهيل تسوقك."]
      },
      energetic: {
        a: ["أهلاً بالبطل", "يا هلا بالطاقة والهمة", "حيا الله الأبطال", "انطلاقة موفقة", "جاهزية كاملة"],
        b: ["يوم جديد يعني إنجاز جديد", "وقودك وطاقتك جاهزة في المتجر", "خلينا نضبط خياراتك بأسرع وقت", "الهمة عالية والطلب جاهز"],
        c: ["ما هدفك أو طلبك اليوم؟", "انطلق واذكر ما تحتاجه الآن!", "هيا نجهز سلة القوة والنشاط!", "بماذا نبدأ مهمتنا اليوم؟"]
      },
      formal: {
        a: ["أهلاً بك سيدي الكريم", "مرحباً بك بكل رقي", "يسعدني تشريفك لمتجر معاذ", "تحية طيبة وراقية لك", "أهلاً بك في جناحك الخاص"],
        b: ["كل شيء مرتب ومُعد بعناية لأجلك", "نحرص دائماً على أدق التفاصيل وأفضل الخيارات", "خدمتك بدقة وأناقة هي أولويتي", "الأصناف المختارة جاهزة بين يديك"],
        c: ["بماذا أتشرف بخدمتك اليوم؟", "أخبرني بما ترغب وسأنسّقه لك فوراً.", "كيف يمكنني تنظيم طلبك الآن؟", "ما الذي تفضل أن نبدأ به؟"]
      },
      playful: {
        a: ["ولك هلا بالغالي", "يا هلا بالصديق الوفي", "نورت الشاشة والمتجر", "أهلاً بأحلى زبون", "يا سيدي هلا ومية غلا"],
        b: ["خلينا نكسر الروتين ونضبط المزاج", "السهرة والمتة والتسالي كلها ناطرتك", "اليوم رح نطلع بأحلى سلة", "الجو بده كاسة متة وشي طيب"],
        c: ["شو عبالك نطلب اليوم؟", "خبرني شو ناقصك وخلّي الباقي عليّ!", "نبدأ بالسهرة ولا بطبخة مرتبة؟", "سمّي بالله واطلب يلي ببالك!"]
      },
      sweet: {
        a: ["أهلاً يا حلو", "نورت عالمنا المشرق", "يا أهلاً باللطف كله", "أهلاً بك بابتسامة جميلة", "سعيدة جداً بوجودك"],
        b: ["يومك رح يكون ألطف وأحلى معنا", "جهزتلك أشهى الأفكار والحلويات", "كل شيء هنا يرحب بك بكل حب", "خلينا نخلي تسوقك ممتع ومريح"],
        c: ["شو حابب نختار اليوم؟", "بدك حلى لطيف ولا أغراض البيت؟", "خبرني بمزاجك وأنا أساعدك فوراً!", "بشو نبدأ رحلتنا الحلوة؟"]
      }
    },
    chatGood: {
      default: {
        a: ["أنا بأفضل حال والحمد لله", "بخير وعافية بسؤالك اللطيف", "تمام التمام وبأعلى جاهزية", "بألف خير ونعمة", "الحمد لله، كلي نشاط وحيوية"],
        b: ["وجودك يسعدني دائماً", "وأتمنى لك يوماً رائعاً ومليئاً بالخير", "ومستعد أساعدك بكل سرور", "وشكراً على سؤالك الجميل"],
        c: ["كيف يمكنني خدمتك الآن؟", "بماذا أساعدك في طلبك اليوم؟", "أخبرني ما الذي تبحث عنه.", "جاهز لأي طلب أو وصفة!"]
      }
    },
    thanks: {
      default: {
        a: ["العفو يا غالي", "ولو، هذا واجبي بكل سرور", "على الرحب والسعة دائماً", "تكرم عينك", "لا شكر على واجب أبداً"],
        b: ["يسعدني دائماً أن أكون عند حسن ظنك", "خدمتك شرف وسعادة لي", "نحن هنا دائماً لراحتك في متجر معاذ", "بالعافية مقدماً على كل اختياراتك"],
        c: ["إذا احتجت أي شيء آخر أنا هنا!", "هل تحب أن نضيف شيئاً آخر للسلة؟", "أتمنى لك يوماً سعيداً!", "دائماً في خدمتك."]
      }
    },
    added: {
      default: {
        a: ["ممتاز!", "اختيار موفق!", "يا سلام!", "تمت المهمة بنجاح!", "رائع جداً!"],
        b: ["أضفت لك {item} إلى السلة بنجاح", "صار {item} جاهزاً داخل سلتك", "تم وضع {item} في سلة مشترياتك"],
        c: ["هل نكمل بباقي الاحتياجات؟", "يمكنك المراجعة أو إضافة المزيد متى شئت.", "سلتك أصبحت أجمل الآن!", "بماذا نكمل؟"]
      }
    },
    itemsReady: {
      default: {
        a: ["تفضل،", "جهزت لك القائمة،", "بكل سرور،", "إليك المختار،", "وجدت لك المطلوب،"],
        b: ["هذه هي الأصناف المتوفرة في الفرع الآن", "رتّبت لك أفضل المتوفر حسب طلبك", "عرضت لك الأصناف المتوفرة بدقة"],
        c: ["حدد الكمية المناسبة بالضغط على (+).", "اختر ما يناسبك وأضفه للسلة.", "اضغط «تحديد المتوفر» للإضافة السريعة."]
      }
    },
    notFound: {
      default: {
        a: ["عذراً منك،", "بحثت جيداً،", "يبدو أنه حالياً", "للأسف الآن"],
        b: ["لم أجد صنفاً مطابقاً متوفراً في المخزون", "هذا الصنف غير متوفر في الفرع حالياً", "لم تظهر نتيجة مطابقة تماماً"],
        c: ["جرّب كتابة اسم أقرب أو تصفح الأقسام.", "يمكنك طلب الصنف من زر «طلب صنف» أو تجربة بديل.", "أخبرني بنوع آخر وسأساعدك فوراً."]
      }
    }
  };

  function composeInfinitePhrase(intent, persona, extraCtx = {}) {
    const p = persona || PERSONAS.buddy || FALLBACK_BUDDY;
    const style = getPersonaStyleGroup(p);
    const bankRoot = INFINITE_BANKS[intent] || INFINITE_BANKS.greet;
    const parts = bankRoot[style] || bankRoot.friendly || bankRoot.default;

    const hist = getPhraseHistory();
    const hKey = `${p.id}_${intent}`;
    const recent = Array.isArray(hist[hKey]) ? hist[hKey] : [];

    const custName = getCustomerFirstName();
    const timeInfo = getTimeGreetingWord();

    // الأولوية القصوى: اختيار جملة بشرية مسجّلة من sounds_manifest.json لتطابق النص مع الصوت 100%
    if (soundsManifestData && soundsManifestData.personas) {
      const pBank = soundsManifestData.personas[p.id];
      if (pBank) {
        let pool = [];
        if (intent === "greet") {
          const timePool = Array.isArray(pBank[timeInfo.clipKey]) ? pBank[timeInfo.clipKey] : [];
          const basePool = Array.isArray(pBank.greet) ? pBank.greet : [];
          pool = [...timePool, ...basePool];
        } else if (Array.isArray(pBank[intent]) && pBank[intent].length) {
          pool = pBank[intent];
        }
        if (pool.length) {
          const fresh = pool.filter((item) => item && item.text && !recent.includes(item.text));
          const pickFrom = fresh.length ? fresh : pool;
          const chosenObj = pickFrom[Math.floor(Math.random() * pickFrom.length)];
          if (chosenObj && chosenObj.text) {
            recent.unshift(chosenObj.text);
            hist[hKey] = recent.slice(0, 12);
            savePhraseHistory(hist);
            sessionCtx.lastManifestClip = { text: chosenObj.text, file: chosenObj.file, pid: p.id };
            return chosenObj.text;
          }
        }
      }
    }

    sessionCtx.lastIntentClipKey = intent === "greet" ? timeInfo.clipKey : intent;

    let chosen = "";
    for (let attempt = 0; attempt < 12; attempt++) {
      const pA = parts.a[Math.floor(Math.random() * parts.a.length)];
      const pB = parts.b[Math.floor(Math.random() * parts.b.length)];
      const pC = parts.c[Math.floor(Math.random() * parts.c.length)];

      let opener = pA;
      if (intent === "greet" && Math.random() < 0.45) {
        opener = `${timeInfo.word}${custName ? " يا " + custName : ""}`;
      } else if (intent === "greet" && custName && Math.random() < 0.5) {
        opener = `${pA} يا ${custName}`;
      }

      let mid = pB;
      if (extraCtx.itemLabel) {
        mid = mid.replace("{item}", extraCtx.itemLabel);
      }

      const candidate = `${opener}، ${mid}. ${pC}`.replace(/\s+/g, " ").trim();
      if (!recent.includes(candidate)) {
        chosen = candidate;
        break;
      }
      chosen = candidate;
    }

    recent.unshift(chosen);
    hist[hKey] = recent.slice(0, 12);
    savePhraseHistory(hist);
    return chosen;
  }

  window.MoaathPhraseComposer = {
    version: "1.0-infinite-combinatorial",
    compose: composeInfinitePhrase
  };

  const DEFAULT_RECIPES = [
    { id: "DEF_1", title: "مقلوبة", category: "طبخ", keywords: ["مقلوبه", "مقلوبة"], ingredients: ["رز", "ارز", "زيت", "سمن", "باذنجان", "بطاطا", "بندوره", "بصل", "بهار", "ملح"] },
    { id: "DEF_2", title: "كبسة", category: "طبخ", keywords: ["كبسه", "كبسة"], ingredients: ["رز", "ارز", "زيت", "سمن", "بصل", "معجون طماطم", "بهار", "ملح"] },
    { id: "DEF_3", title: "مجدرة", category: "طبخ", keywords: ["مجدره", "مجدرة", "برغل"], ingredients: ["برغل", "عدس", "زيت", "زيتون", "بصل", "ملح", "كمون"] },
    { id: "DEF_4", title: "معكرونة بالبشاميل", category: "طبخ", keywords: ["معكرونه", "مكرونه", "بشاميل"], ingredients: ["معكرونه", "مكرونه", "حليب", "طحين", "زيت", "سمن", "جبن", "ملح"] },
    { id: "DEF_5", title: "شوربة عدس", category: "طبخ", keywords: ["شوربه", "شوربة", "عدس"], ingredients: ["عدس", "بطاطا", "جزر", "بصل", "زيت", "كمون", "ملح"] },
    { id: "DEF_6", title: "فريكة", category: "طبخ", keywords: ["فريكه", "فريكة"], ingredients: ["فريكه", "فريكة", "سمن", "زيت", "بصل", "بهار", "ملح"] },
    { id: "DEF_7", title: "كيك منزلي", category: "حلويات", keywords: ["كيك", "كاتو"], ingredients: ["طحين", "دقيق", "سكر", "بيض", "حليب", "زيت", "بيكنج باودر", "فانيليا", "كاكاو"] },
    { id: "DEF_8", title: "مهلبية وكاسترد", category: "حلويات", keywords: ["مهلبيه", "مهلبية", "كاسترد"], ingredients: ["حليب", "نشا", "سكر", "ماء ورد", "جوز الهند"] },
    { id: "DEF_9", title: "بسبوسة / نمورة", category: "حلويات", keywords: ["بسبوسه", "بسبوسة", "نموره", "نمورة"], ingredients: ["سميد", "سكر", "لبن", "جوز الهند", "بيكنج باودر", "سمن"] },
    { id: "DEF_10", title: "حلى بارد بالبسكويت", category: "حلويات", keywords: ["حلى بارد", "شوكولاته", "بسكوت شاي"], ingredients: ["بسكوت", "كاكاو", "شوكولاته", "حليب", "سكر", "نشا"] },
    { id: "DEF_11", title: "سهرة ومتة", category: "مشروبات وتسالي", keywords: ["سهره", "سهرة", "مته", "متة", "تسالي"], ingredients: ["مته", "متة", "بزر", "موالح", "نقارش", "شيبس", "بسكوت", "شاي", "سكر"] },
    { id: "DEF_12", title: "تنظيف المطبخ", category: "تنظيف", keywords: ["تنظيف المطبخ", "منظفات المطبخ", "جلي"], ingredients: ["سائل جلي", "جلي", "صابون", "ليف", "اسفنج", "كلور", "منظف", "معقم"] }
  ];

  let sessionCtx = {
    lastModalTitle: "",
    lastModalItems: [],
    lastModalIntent: "general",
    lastModalSubtitle: "",
    lastAddedIds: [],
    lastSpokenText: "",
    lastTtsSource: "",
    lastGeminiError: "",
    pendingDialog: null,
    conversationHistory: []
  };

  let customRecipesDB = {};
  let activeRecognizer = null;
  let isHoldingSpeak = false;
  let bubbleTimer = null;
  let scrollTimer = null;
  let modalItemsState = [];
  let speechUnlocked = false;
  let selectedRecipeProductIds = new Set();
  let roamTimer = null;
  let userPausedUntil = 0;

  // ==========================================================================
  // [إلغاء كامل ونهائي للتحقق من الدفع وشام كاش عبر الذكاء الاصطناعي]
  // ==========================================================================
  window.analyzeShamCashReceiptOCR = function () {
    const outBox = $("shamCashOcrResult");
    if (outBox) {
      outBox.innerHTML = "";
      outBox.style.display = "none";
    }
    return null;
  };
  window.verifyShamCashPaymentWithAI = null;
  window.checkPaymentReceiptAI = null;
  window.checkShamCashPriceAI = null;
  window.verifyShamCashAmountAI = null;

  function guardAgainstPaymentAI(text) {
    const norm = cleanArabicNorm(text || "");
    return /دفع|تحويل|شام\s*كاش|شامكاش|ايصال|اشعار\s*دفع|تحقق\s*من\s*الدفع|رصيد\s*دفع|فاتوره\s*دفع|اسعار\s*شام|سعر\s*شام/.test(norm);
  }

  customRecipesDB = loadLocalRecipesFallback();
  if (typeof db !== "undefined" && db.ref) {
    db.ref("recipes").on("value", snap => {
      const cloud = snap.val() || {};
      customRecipesDB = { ...loadLocalRecipesFallback(), ...cloud };
      if (typeof window.renderAdminRecipesList === "function") {
        window.renderAdminRecipesList();
      }
    }, () => {
      customRecipesDB = loadLocalRecipesFallback();
      if (typeof window.renderAdminRecipesList === "function") {
        window.renderAdminRecipesList();
      }
    });
  }

  function haptic(pattern = 15) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
  }

  function pauseRoaming(ms = 8000) {
    userPausedUntil = Date.now() + ms;
  }

  function toWesternDigits(str) {
    return String(str || "")
      .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));
  }

  function cleanArabicNorm(str) {
    const base = typeof normalizeArabic === "function" ? normalizeArabic(str) : String(str || "");
    return toWesternDigits(base)
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\w\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const COLLAPSE_KEY = "moaath_store_ai_collapsed";
  const CHIPS_COLLAPSE_KEY = "moaath_store_chips_collapsed";

  function isAssistantCollapsed() {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw === null) return true; // مطوي بشكل افتراضي لجمالية وأناقة وسرعة تصفح
      return raw === "1" || raw === "true";
    } catch (_) {
      return true;
    }
  }

  function setAssistantCollapsed(val) {
    try {
      localStorage.setItem(COLLAPSE_KEY, val ? "1" : "0");
    } catch (_) {}
  }

  function isChipsCollapsed() {
    try {
      const raw = localStorage.getItem(CHIPS_COLLAPSE_KEY);
      if (raw === null) return false;
      return raw === "1" || raw === "true";
    } catch (_) {
      return false;
    }
  }

  function setChipsCollapsed(val) {
    try {
      localStorage.setItem(CHIPS_COLLAPSE_KEY, val ? "1" : "0");
    } catch (_) {}
  }

  function syncFuturisticCollapseUI() {
    const collapsed = isAssistantCollapsed();
    const chipsCollapsed = isChipsCollapsed();
    const bodyEl = $("futuristicAiBody");
    const chipsEl = $("petQuickPromptChips");
    const toggleBtn = $("futuristicAiToggleBtn");
    const chipsToggleBtn = $("futuristicChipsToggleBtn");
    const dockEl = $("aiSmartAssistantBox");

    if (bodyEl) {
      bodyEl.classList.toggle("is-collapsed", collapsed);
    }
    if (dockEl) {
      dockEl.classList.toggle("is-dock-collapsed", collapsed);
    }
    document.querySelectorAll('[data-fut-search-row="1"]').forEach(el => {
      el.classList.toggle("fut-search-collapsed", collapsed);
    });
    if (toggleBtn) {
      toggleBtn.innerHTML = collapsed
        ? `<span class="fut-dot"></span><span>فتح المساعد والبحث</span><span class="fut-chev">▾</span>`
        : `<span class="fut-dot"></span><span>طي المساعد</span><span class="fut-chev">▴</span>`;
      toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    }
    if (chipsEl) {
      chipsEl.classList.toggle("is-chips-collapsed", chipsCollapsed || collapsed);
    }
    if (chipsToggleBtn) {
      chipsToggleBtn.textContent = chipsCollapsed ? "إظهار الاختصارات ▾" : "طي الاختصارات ▴";
    }
  }

  window.toggleFuturisticAssistantPanel = function (forceState = null) {
    haptic(12);
    unlockEmbeddedVoice();
    pauseRoaming(8000);
    const next = typeof forceState === "boolean" ? forceState : !isAssistantCollapsed();
    setAssistantCollapsed(next);
    syncFuturisticCollapseUI();
  };

  window.toggleFuturisticChipsPanel = function (forceState = null) {
    haptic(10);
    const next = typeof forceState === "boolean" ? forceState : !isChipsCollapsed();
    setChipsCollapsed(next);
    syncFuturisticCollapseUI();
  };

  function getPrefs() {
    try {
      const d = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return {
        persona: PERSONAS[d.persona] ? d.persona : "buddy",
        hidden: !!d.hidden,
        voiceEnabled: d.voiceEnabled === undefined ? true : !!d.voiceEnabled
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, voiceEnabled: true };
    }
  }

  function setPrefs(patch) {
    const next = { ...getPrefs(), ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
  }

  function getPos() {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) || "{}");
      return {
        right: typeof p.right === "number" ? p.right : 14,
        bottom: typeof p.bottom === "number" ? p.bottom : 88
      };
    } catch (_) {
      return { right: 14, bottom: 88 };
    }
  }

  function savePos(right, bottom) {
    localStorage.setItem(POS_KEY, JSON.stringify({ right, bottom }));
  }

  function getLearnedMap() {
    try { return JSON.parse(localStorage.getItem(LEARN_KEY) || "{}"); } catch (_) { return {}; }
  }

  function recordPracticeLearning(intentKey, productIds, delta = 1) {
    if (!intentKey || !Array.isArray(productIds) || !productIds.length) return;
    const map = getLearnedMap();
    map[intentKey] = map[intentKey] || {};
    productIds.forEach(pid => {
      if (!pid) return;
      const cur = map[intentKey][pid] || 0;
      map[intentKey][pid] = Math.max(0, Math.min(25, cur + delta));
    });
    localStorage.setItem(LEARN_KEY, JSON.stringify(map));
  }

  // ==========================================================================
  // [محرك الصوت المضمون على الهاتف — كشف رابط الـ Worker + تشغيل مباشر واضح]
  // ==========================================================================
  const ttsAudioCache = new Map();
  let sharedAudioPlayer = null;
  let webAudioCtx = null;
  let activeBufferSource = null;
  let ttsRequestSeq = 0;

  function resolveWorkerEndpoint() {
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
      if (typeof c === "string" && /^https?:\/\//i.test(c.trim())) {
        return c.trim();
      }
    }
    return "";
  }

  function ensureAudioPlayer() {
    if (!sharedAudioPlayer) {
      sharedAudioPlayer = new Audio();
      sharedAudioPlayer.preload = "auto";
      sharedAudioPlayer.playsInline = true;
      sharedAudioPlayer.setAttribute("playsinline", "");
    }
    return sharedAudioPlayer;
  }

  function ensureWebAudioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!webAudioCtx) webAudioCtx = new Ctx();
    if (webAudioCtx.state === "suspended") {
      try { webAudioCtx.resume(); } catch (_) {}
    }
    return webAudioCtx;
  }

  function unlockEmbeddedVoice() {
    ensureWebAudioCtx();
    if (speechUnlocked) return;
    speechUnlocked = true;
    try {
      const p = ensureAudioPlayer();
      p.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      p.play().then(() => { p.pause(); p.currentTime = 0; }).catch(() => {});
    } catch (_) {}
  }
  document.addEventListener("touchstart", unlockEmbeddedVoice, { once: true, passive: true });
  document.addEventListener("click", unlockEmbeddedVoice, { once: true });

  window.__moaathStopAiEngineVoice = function () { stopEmbeddedVoice(); };
  function stopEmbeddedVoice() {
    ttsRequestSeq++;
    try { if (typeof window.speechSynthesis !== "undefined") window.speechSynthesis.cancel(); } catch (_) {}
    stopWebAudioGraph();
    if (activeBufferSource) {
      try { activeBufferSource.stop(); } catch (_) {}
      try { activeBufferSource.disconnect(); } catch (_) {}
      activeBufferSource = null;
    }
    if (sharedAudioPlayer) {
      try {
        sharedAudioPlayer.pause();
        sharedAudioPlayer.currentTime = 0;
      } catch (_) {}
    }
  }

  function humanizeArabicNumbersForSpeech(txt) {
    const smallMap = {
      "0": "صفر", "1": "واحد", "2": "اثنين", "3": "ثلاثة", "4": "أربعة",
      "5": "خمسة", "6": "ستة", "7": "سبعة", "8": "ثمانية", "9": "تسعة", "10": "عشرة"
    };
    return String(txt || "")
      .replace(/\b1\s*(مواد|قطع|اصناف|أصناف)\b/g, "صنف واحد")
      .replace(/\b2\s*(مواد|قطع|اصناف|أصناف)\b/g, "صنفين")
      .replace(/\b(\d+)\s*%/g, "$1 بالمئة")
      .replace(/\b(\d+)\s*ل\.?س\b/g, "$1 ليرة")
      .replace(/\b([0-9]|10)\b/g, (m) => smallMap[m] || m);
  }

  function shortenForSpeech(text, maxWords = 26) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    const sliced = words.slice(0, maxWords).join(" ");
    const lastPunct = Math.max(sliced.lastIndexOf("،"), sliced.lastIndexOf("؛"), sliced.lastIndexOf("."), sliced.lastIndexOf("!"), sliced.lastIndexOf("؟"));
    if (lastPunct > sliced.length * 0.5) return sliced.slice(0, lastPunct + 1).trim();
    return sliced;
  }

  function normalizeTextForArabicSpeech(rawText) {
    let cleaned = humanizeArabicNumbersForSpeech(rawText)
      .replace(/[\u{1F300}-\u{1FAFF}🐾✨🎤🎧🎙️🤔🤩💡📌📍🔊🔇🗣️🍲🌸🛍️🔁⏰✅⚠️🔒🔄🧚🧉🍰💰🛒]/gu, " ")
      .replace(/[A-Za-z_]+/g, " ")
      .replace(/\+/g, " زائد ")
      .replace(/×/g, " ضرب ")
      .replace(/ل\.س/g, " ليرة ")
      .replace(/[•\-_*#|()[\]{}]/g, " ")
      .replace(/\s*([،؛.!؟])\s*/g, "$1 ")
      .replace(/\s+/g, " ")
      .trim();
    return shortenForSpeech(cleaned, 26);
  }

  function speakViaWebSpeechFallback(spokenText, persona) {
    if (typeof window.speechSynthesis === "undefined" || !spokenText) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spokenText);
      u.lang = "ar-SY";
      u.rate = Math.max(0.9, Math.min(1.35, persona.speed || 1.2));
      const semi = typeof persona.pitchSemitones === "number" ? persona.pitchSemitones : 0;
      u.pitch = Math.max(0.75, Math.min(1.35, 1 + semi * 0.08));
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const arVoice = voices.find(v => /ar/i.test(v.lang || ""));
      if (arVoice) u.voice = arVoice;
      window.speechSynthesis.speak(u);
      sessionCtx.lastTtsSource = "web_speech";
      updateVoiceSourceBadge("🔊 يتحدث", "#38bdf8", "نطق محلي فوري");
      return true;
    } catch (_) {
      return false;
    }
  }

  function base64ToUint8Array(base64Data) {
    const binStr = atob(base64Data);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return bytes;
  }

  function pcmBase64ToWavArrayBuffer(base64Pcm, sampleRate = 24000) {
    const binStr = atob(base64Pcm);
    const pcmLen = binStr.length;
    const buffer = new ArrayBuffer(44 + pcmLen);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + pcmLen, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, pcmLen, true);
    const outBytes = new Uint8Array(buffer, 44);
    for (let i = 0; i < pcmLen; i++) outBytes[i] = binStr.charCodeAt(i);
    return buffer;
  }

  function updateVoiceSourceBadge(labelText, colorHex, titleText) {
    const badge = $("petConnStatusBadge");
    if (!badge) return;
    badge.textContent = labelText;
    badge.style.color = colorHex;
    if (titleText) badge.title = titleText;
  }

  const PERSONA_VOICE_PROFILES = {
    buddy:          { rate: 1.00, semi:  0.6, filterType: "peaking",  freq: 2600, gain:  3.2 },
    lolo:           { rate: 1.10, semi:  2.2, filterType: "highshelf",freq: 2100, gain:  4.0 },
    noor:           { rate: 0.98, semi:  1.4, filterType: "lowshelf", freq:  520, gain:  3.5 },
    chef:           { rate: 1.05, semi: -1.2, filterType: "lowshelf", freq:  440, gain:  3.8 },
    pastry:         { rate: 0.95, semi:  1.8, filterType: "highshelf",freq: 2250, gain:  3.5 },
    athlete:        { rate: 1.15, semi:  0.4, filterType: "peaking",  freq: 1700, gain:  3.5 },
    sheikh:         { rate: 1.10, semi:  1.6, filterType: "peaking",  freq: 1850, gain:  4.0 },
    friend_saad:    { rate: 0.92, semi: -2.0, filterType: "lowshelf", freq:  390, gain:  4.0 },
    coach_sakhr:    { rate: 1.10, semi: -2.2, filterType: "lowshelf", freq:  380, gain:  5.0 },
    grand_chef:     { rate: 0.95, semi: -1.8, filterType: "lowshelf", freq:  440, gain:  4.2 },
    princess_layla: { rate: 0.90, semi:  1.2, filterType: "highshelf",freq: 2050, gain:  3.0 },
    butler_farid:   { rate: 1.00, semi: -1.5, filterType: "peaking",  freq:  950, gain:  3.2 },
    friend_fadi:    { rate: 1.02, semi:  1.2, filterType: "peaking",  freq: 1650, gain:  3.8 },
    anime_zain:     { rate: 1.18, semi:  2.0, filterType: "highshelf",freq: 2100, gain:  4.0 },
    anime_ryu:      { rate: 0.96, semi: -1.5, filterType: "peaking",  freq:  880, gain:  3.2 },
    anime_ritaj:    { rate: 1.12, semi:  2.6, filterType: "highshelf",freq: 2400, gain:  4.5 }
  };

  function getPersonaProfile(persona) {
    if (persona && persona.acoustic && typeof persona.acoustic.rate === "number") {
      return persona.acoustic;
    }
    const id = persona?.id || "buddy";
    if (PERSONA_VOICE_PROFILES[id]) return PERSONA_VOICE_PROFILES[id];
    const semi = typeof persona?.pitchSemitones === "number" ? persona.pitchSemitones : 0;
    return {
      rate: persona?.speed ? Math.max(0.85, Math.min(1.22, persona.speed / 1.2)) : 1.0,
      semi,
      filterType: semi >= 0 ? "highshelf" : "lowshelf",
      freq: semi >= 0 ? 2000 : 420,
      gain: 3.5
    };
  }

  let activeAudioCtxGraph = null;
  function stopWebAudioGraph() {
    if (activeAudioCtxGraph) {
      try { activeAudioCtxGraph.src.stop(); } catch (_) {}
      try { activeAudioCtxGraph.src.disconnect(); } catch (_) {}
      activeAudioCtxGraph = null;
    }
  }

  async function playClipWithPersonaCharacter(entry, persona, mySeq) {
    if (mySeq !== ttsRequestSeq) return;
    stopWebAudioGraph();

    // تشغيل المقاطع البشرية (Edge-TTS Neural / Gemini TTS) بنقاء 100% بدون detune أو فلاتر تشوّه الصوت البشري
    const isPreRecorded = entry && (entry.source === "local_repo" || entry.source === "persistent_cache" || entry.source === "gemini_tts");
    const player = ensureAudioPlayer();
    player.pause();
    player.src = entry.url;
    player.load();
    player.preservesPitch = true;
    player.mozPreservesPitch = true;
    player.webkitPreservesPitch = true;
    player.playbackRate = isPreRecorded ? 1.0 : Math.max(0.92, Math.min(1.18, persona?.speed || 1.05));
    const p = player.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        showBubble("اضغط على الجنية لتشغيل الصوت", 2600);
      });
    }
  }

  function playViaHtmlAudio(entry, persona, mySeq) {
    playClipWithPersonaCharacter(entry, persona, mySeq);
  }

  async function playFallbackWithDetune(arrayBuf, persona, mySeq) {
    const ctx = ensureWebAudioCtx();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      const cloned = arrayBuf.slice(0);
      const decoded = await ctx.decodeAudioData(cloned);
      if (mySeq !== ttsRequestSeq) return true;

      const src = ctx.createBufferSource();
      src.buffer = decoded;
      const pitchShift = typeof persona.pitchSemitones === "number"
        ? persona.pitchSemitones * 100
        : (persona.fallbackDetune || 0);
      if (src.detune) {
        src.detune.value = Math.max(-320, Math.min(320, pitchShift));
      }
      src.playbackRate.value = persona.fallbackRate || persona.speed || 1.35;
      src.connect(ctx.destination);
      activeBufferSource = src;
      src.onended = () => {
        if (activeBufferSource === src) activeBufferSource = null;
      };
      src.start(0);
      return true;
    } catch (_) {
      return false;
    }
  }

  const PERSISTENT_TTS_CACHE_NAME = "moaath_store_tts_human";
  const GEMINI_COOLDOWN_KEY = "moaath_store_gemini_cooldown_until";
  function getGeminiCooldownRemainingSec() {
    try {
      const until = parseInt(localStorage.getItem(GEMINI_COOLDOWN_KEY) || "0", 10);
      const diff = until - Date.now();
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    } catch (_) {
      return 0;
    }
  }
  function setGeminiCooldown(seconds = 900) {
    try {
      const sec = Math.max(60, Math.min(3600, parseInt(seconds, 10) || 900));
      localStorage.setItem(GEMINI_COOLDOWN_KEY, String(Date.now() + sec * 1000));
    } catch (_) {}
  }
  function clearGeminiCooldown() {
    try { localStorage.removeItem(GEMINI_COOLDOWN_KEY); } catch (_) {}
  }


  const missingLocalClips = new Set();

  function looseSpeechNorm(str) {
    return cleanArabicNorm(normalizeTextForArabicSpeech(str));
  }

  function getCoreClipPhrasesForPersona(persona) {
    if (!persona) return [];
    const pickFirst = (arr, fallback) => (Array.isArray(arr) && arr.length ? arr[0] : (fallback || ""));
    const addedSample = Array.isArray(persona.addedMsgs) && typeof persona.addedMsgs[0] === "function"
      ? persona.addedMsgs[0]("صنف واحد")
      : "تمت إضافة صنف واحد إلى السلة.";
    return [
      { key: "greet", text: persona.greet || pickFirst(persona.greets, "") },
      { key: "greetMorning", text: pickFirst(persona.timeGreets?.morning, persona.greet) },
      { key: "greetEvening", text: pickFirst(persona.timeGreets?.evening, persona.greet) },
      { key: "chatGood", text: persona.chatGood || pickFirst(persona.chatGoods, "") },
      { key: "thanks", text: persona.thanks || pickFirst(persona.thanksList, "") },
      { key: "added", text: addedSample },
      { key: "itemsReady", text: typeof persona.itemsReady === "function" ? persona.itemsReady("") : "" },
      { key: "alternative", text: pickFirst(persona.alternativeReplies, "") },
      { key: "habit", text: pickFirst(persona.habitReplies, "") },
      { key: "notFound", text: persona.notFound || pickFirst(persona.notFounds, "") }
    ].filter(x => x.text && x.text.trim());
  }

  function detectStaticClipCandidates(persona, spokenText) {
    const tLoose = looseSpeechNorm(spokenText);
    if (!tLoose) return [];
    const candidates = [];
    const addCandidate = (k) => { if (k && !candidates.includes(k)) candidates.push(k); };

    // مطابقة حرفية دقيقة 100% فقط مع العبارات المسجّلة في sounds/ لمنع اختلاف النص المكتوب عن النطق
    const core = getCoreClipPhrasesForPersona(persona);
    for (const c of core) {
      if (tLoose === looseSpeechNorm(c.text)) {
        addCandidate(c.key);
      }
    }
    return candidates;
  }

  async function tryLocalRepoClip(persona, spokenText, mySeq, cacheKey) {
    const relUrlsToTry = [];
    const tLoose = looseSpeechNorm(spokenText);

    // 1) البحث المباشر في فهرس sounds_manifest.json (تطابق حرفي 100% مع النص المكتوب)
    if (tLoose) {
      const exactForPersona = manifestTextToFile.get(`${persona.id}::${tLoose}`);
      if (exactForPersona) relUrlsToTry.push(exactForPersona);
      if (!exactForPersona && sessionCtx.lastManifestClip && looseSpeechNorm(sessionCtx.lastManifestClip.text) === tLoose) {
        relUrlsToTry.push(sessionCtx.lastManifestClip.file);
      }
      // عدم استخدام صوت شخصية أخرى لضمان احتفاظ كل شخصية بصوتها الخاص
    }

    // 2) إضافة المقاطع الأساسية القديمة إن طابقت حرفياً
    const candidateClips = detectStaticClipCandidates(persona, spokenText);
    candidateClips.forEach((clipName) => {
      const u = `sounds/${persona.id}_${clipName}.mp3`;
      if (!relUrlsToTry.includes(u)) relUrlsToTry.push(u);
    });

    if (!relUrlsToTry.length) return false;

    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey);
      if (cached?.source === "local_repo" || cached?.source === "persistent_cache") {
        sessionCtx.lastTtsSource = cached.source;
        updateVoiceSourceBadge("💾 محفوظ", "#00e676", cached.relUrl || "ملف صوتي محلي");
        playViaHtmlAudio(cached, persona, mySeq);
        return true;
      }
    }

    // قراءة فورية من الكاش الدائم على الهاتف (تعمل حتى بدون إنترنت نهائياً)
    const persistedLocalUrl = await readPersistentHumanCache(cacheKey);
    if (persistedLocalUrl && mySeq === ttsRequestSeq) {
      const pEntry = { url: persistedLocalUrl, rawBuffer: null, source: "local_repo", relUrl: relUrlsToTry[0] || "cache", geminiError: "" };
      ttsAudioCache.set(cacheKey, pEntry);
      sessionCtx.lastTtsSource = "local_repo";
      updateVoiceSourceBadge("💾 محفوظ", "#00e676", "كاش دائم بدون إنترنت");
      playViaHtmlAudio(pEntry, persona, mySeq);
      return true;
    }

    if (navigator.onLine === false) return false;

    for (const relUrl of relUrlsToTry) {
      if (missingLocalClips.has(relUrl)) continue;
      try {
        const res = await fetch(relUrl, { method: "GET", cache: "default" });
        if (!res.ok) {
          missingLocalClips.add(relUrl);
          continue;
        }
        const cType = res.headers.get("content-type") || "";
        if (/text\/html/i.test(cType)) {
          missingLocalClips.add(relUrl);
          continue;
        }
        const blob = await res.blob();
        if (!blob || blob.size < 400) {
          missingLocalClips.add(relUrl);
          continue;
        }
        // حفظ دائم للمقطع في Cache API على هاتف الزبون بعد أول تحميل
        writePersistentHumanCache(cacheKey, blob);
        if (mySeq !== ttsRequestSeq) return true;
        const blobUrl = URL.createObjectURL(blob);
        const entry = { url: blobUrl, rawBuffer: null, source: "local_repo", relUrl, geminiError: "" };
        if (ttsAudioCache.size > 30) {
          const firstKey = ttsAudioCache.keys().next().value;
          const oldEntry = ttsAudioCache.get(firstKey);
          if (oldEntry?.url) URL.revokeObjectURL(oldEntry.url);
          ttsAudioCache.delete(firstKey);
        }
        ttsAudioCache.set(cacheKey, entry);
        sessionCtx.lastTtsSource = "local_repo";
        updateVoiceSourceBadge("💾 محفوظ", "#00e676", relUrl);
        playViaHtmlAudio(entry, persona, mySeq);
        return true;
      } catch (_) {
        missingLocalClips.add(relUrl);
      }
    }
    return false;
  }

  async function readPersistentHumanCache(cacheKey) {
    if (typeof caches === "undefined") return null;
    try {
      const cache = await caches.open(PERSISTENT_TTS_CACHE_NAME);
      const reqUrl = "https://moaath-tts.local/" + encodeURIComponent(cacheKey);
      let match = await cache.match(reqUrl);
      if (!match) {
        // بحث مرن في الكاش الدائم عن نفس الشخصية ونفس العبارة (لتوافق المقاطع المحفوظة قبل التحديث)
        const parts = String(cacheKey || "").split("::");
        const pid = parts[0] || "";
        const targetLoose = looseSpeechNorm(parts[2] || "");
        if (pid && targetLoose) {
          const allReqs = await cache.keys();
          for (const r of allReqs) {
            const decoded = decodeURIComponent(r.url.replace("https://moaath-tts.local/", ""));
            const dParts = decoded.split("::");
            if (dParts[0] === pid && looseSpeechNorm(dParts[2] || "") === targetLoose) {
              match = await cache.match(r);
              if (match) break;
            }
          }
        }
      }
      if (!match) return null;
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    } catch (_) {
      return null;
    }
  }

  async function writePersistentHumanCache(cacheKey, blob) {
    if (typeof caches === "undefined" || !blob) return;
    try {
      const cache = await caches.open(PERSISTENT_TTS_CACHE_NAME);
      const keys = await cache.keys();
      if (keys.length >= 450) {
        await cache.delete(keys[0]);
      }
      const reqUrl = "https://moaath-tts.local/" + encodeURIComponent(cacheKey);
      await cache.put(reqUrl, new Response(blob, { headers: { "Content-Type": blob.type || "audio/wav" } }));
    } catch (_) {}
  }

  async function speakOutLoud(rawText, force = false) {
    const prefs = getPrefs();
    if (!prefs.voiceEnabled && !force) return;

    const spokenText = normalizeTextForArabicSpeech(rawText);
    if (!spokenText) return;
    sessionCtx.lastSpokenText = spokenText;
    if (window.MoaathVoiceFreshEngine && typeof window.MoaathVoiceFreshEngine.stop === "function") {
      window.MoaathVoiceFreshEngine.stop();
    }
    window.__moaathVoiceSync = { text: spokenText, ts: Date.now(), owner: "ai_engine" };

    stopEmbeddedVoice();
    const mySeq = ttsRequestSeq;

    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const voiceName = persona.voiceName || "Puck";
    const cacheKey = `${persona.id}::${voiceName}::${spokenText}`;

    const playEntry = async (entry) => {
      if (mySeq !== ttsRequestSeq) return;
      sessionCtx.lastTtsSource = entry.source;
      sessionCtx.lastGeminiError = entry.geminiError || "";

      if (entry.source === "gemini_tts") {
        updateVoiceSourceBadge("🎙️ بشري", "#00e676", "صوت بشري (Gemini)");
        playViaHtmlAudio(entry, persona, mySeq);
      } else if (entry.source === "persistent_cache" || entry.source === "local_repo") {
        updateVoiceSourceBadge("💾 محفوظ", "#00e676", entry.source === "local_repo" ? "ملف صوتي محلي" : "كاش بشري محفوظ");
        playViaHtmlAudio(entry, persona, mySeq);
      } else {
        if (entry.geminiError) console.info("[TTS Diagnostic]", entry.geminiError);
        updateVoiceSourceBadge("🔊 بديل", "#38bdf8", entry.geminiError || "صوت بديل");
        if (entry.rawBuffer) {
          const okWebAudio = await playFallbackWithDetune(entry.rawBuffer, persona, mySeq);
          if (okWebAudio) return;
        }
        playViaHtmlAudio(entry, persona, mySeq);
      }
    };

    // 1) التحقق أولاً من ملفات الصوت الثابتة في مستودع GitHub (sounds/<id>_greet.mp3)
    const playedLocal = await tryLocalRepoClip(persona, spokenText, mySeq, cacheKey);
    if (playedLocal) return;

    // 2) التحقق من الكاش في الذاكرة الحالية
    if (ttsAudioCache.has(cacheKey)) {
      await playEntry(ttsAudioCache.get(cacheKey));
      return;
    }

    // 3) التحقق من الكاش الدائم في الهاتف (Cache API) لتجنب استهلاك الحصة
    const persistedUrl = await readPersistentHumanCache(cacheKey);
    if (persistedUrl && mySeq === ttsRequestSeq) {
      const pEntry = { url: persistedUrl, rawBuffer: null, source: "persistent_cache", geminiError: "" };
      ttsAudioCache.set(cacheKey, pEntry);
      await playEntry(pEntry);
      return;
    }

    const workerUrl = resolveWorkerEndpoint();
    if (!workerUrl) {
      updateVoiceSourceBadge("🟡 جاهز", "#ff9800", "الوضع النصي");
      showBubble("رابط الصوت غير مضبوط في التطبيق", 3200);
      return;
    }
    if (navigator.onLine === false) {
      if (!speakViaWebSpeechFallback(spokenText, persona)) {
        updateVoiceSourceBadge("🟡 محلي", "#ff9800", "لا يوجد اتصال بالإنترنت");
      }
      return;
    }

    updateVoiceSourceBadge("⏳ يجهّز...", "#ffd54f", "جاري تجهيز الصوت");

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tts",
          text: spokenText,
          voiceName,
          gender: persona.gender || "male",
          toneTag: persona.toneTag || "",
          dialectMode: persona.dialectMode || "shami_friendly",
          pitchSemitones: typeof persona.pitchSemitones === "number" ? persona.pitchSemitones : 0,
          styleHint: persona.styleHint || ""
        })
      });
      const json = await res.json();
      if (mySeq !== ttsRequestSeq) return;

      if (!res.ok || !json?.ok || !json?.audioBase64) {
        if (!speakViaWebSpeechFallback(spokenText, persona)) {
          updateVoiceSourceBadge("🟢 جاهز", "#00e676", "جاهز");
        }
        return;
      }

      let rawBuffer = null;
      let audioBlob = null;
      let blobUrl = "";
      if (/pcm|L16/i.test(json.mimeType || "")) {
        const rateMatch = String(json.mimeType).match(/rate=(\d+)/i);
        const rate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
        rawBuffer = pcmBase64ToWavArrayBuffer(json.audioBase64, rate);
        audioBlob = new Blob([rawBuffer], { type: "audio/wav" });
        blobUrl = URL.createObjectURL(audioBlob);
      } else {
        const bytes = base64ToUint8Array(json.audioBase64);
        rawBuffer = bytes.buffer;
        audioBlob = new Blob([bytes], { type: json.mimeType || "audio/mpeg" });
        blobUrl = URL.createObjectURL(audioBlob);
      }

      const entry = {
        url: blobUrl,
        rawBuffer,
        source: json.source || "google_tts",
        geminiError: json.geminiError || ""
      };

      // حفظ الصوت البشري الأصلي فقط في الكاش الدائم على الهاتف (لا نحفظ البديل دائماً حتى يُستبدل بالبشري فور تجدد الحصة)
      if (entry.source === "gemini_tts" && audioBlob) {
        writePersistentHumanCache(cacheKey, audioBlob);
      }

      if (ttsAudioCache.size > 30) {
        const firstKey = ttsAudioCache.keys().next().value;
        const oldEntry = ttsAudioCache.get(firstKey);
        if (oldEntry?.url) URL.revokeObjectURL(oldEntry.url);
        ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, entry);
      await playEntry(entry);
    } catch (_) {
      if (!speakViaWebSpeechFallback(spokenText, persona)) {
        updateVoiceSourceBadge("🟡 محلي", "#ff9800", "اتصال محدود");
      }
    }
  }


  // ==========================================================================
  // [التحميل التدريجي الذكي في الخلفية — 10 مقاطع أساسية لكل شخصية دون حرق الحصة]
  // ==========================================================================
  let prewarmStarted = false;
  let prewarmQuotaHit = false;

  async function runDripFeedPrewarm() {
    if (prewarmStarted || prewarmQuotaHit || navigator.onLine === false) return;
    const workerUrl = resolveWorkerEndpoint();
    if (!workerUrl) return;
    prewarmStarted = true;

    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const voiceName = persona.voiceName || "Puck";
    const coreList = getCoreClipPhrasesForPersona(persona);
    let fetchedThisSession = 0;
    const MAX_PER_SESSION = 5;

    for (const item of coreList) {
      if (prewarmQuotaHit || fetchedThisSession >= MAX_PER_SESSION || navigator.onLine === false) break;
      const spokenText = normalizeTextForArabicSpeech(item.text);
      if (!spokenText) continue;
      const cacheKey = `${persona.id}::${voiceName}::${spokenText}`;

      // تخطي إذا كان موجوداً في الكاش الدائم أو الذاكرة
      if (ttsAudioCache.has(cacheKey)) continue;
      const existing = await readPersistentHumanCache(cacheKey);
      if (existing) {
        URL.revokeObjectURL(existing);
        continue;
      }

      // انتظار 10 ثوانٍ بين كل طلب لحماية الحصة المجانية
      await new Promise(r => setTimeout(r, 10000));
      if (prewarmQuotaHit || navigator.onLine === false) break;

      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "tts",
            text: spokenText,
            voiceName,
            gender: persona.gender || "male",
            toneTag: persona.toneTag || "",
            dialectMode: persona.dialectMode || "shami_friendly",
            pitchSemitones: typeof persona.pitchSemitones === "number" ? persona.pitchSemitones : 0,
            styleHint: persona.styleHint || ""
          })
        });
        const json = await res.json();
        if (json?.geminiError && /429|RESOURCE_EXHAUSTED|QUOTA/i.test(json.geminiError)) {
          prewarmQuotaHit = true;
          break;
        }
        if (res.ok && json?.ok && json?.source === "gemini_tts" && json?.audioBase64) {
          let audioBlob = null;
          if (/pcm|L16/i.test(json.mimeType || "")) {
            const rateMatch = String(json.mimeType).match(/rate=(\d+)/i);
            const rate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
            const wavBuf = pcmBase64ToWavArrayBuffer(json.audioBase64, rate);
            audioBlob = new Blob([wavBuf], { type: "audio/wav" });
          } else {
            const bytes = base64ToUint8Array(json.audioBase64);
            audioBlob = new Blob([bytes], { type: json.mimeType || "audio/mpeg" });
          }
          if (audioBlob) {
            await writePersistentHumanCache(cacheKey, audioBlob);
            fetchedThisSession++;
          }
        }
      } catch (_) {
        break;
      }
    }
  }

  async function runManifestBackgroundPreload(targetPersonaId = null) {
    if (manifestPreloadRunning || navigator.onLine === false || typeof caches === "undefined") return;
    if (!soundsManifestData || !soundsManifestData.personas) return;
    manifestPreloadRunning = true;
    try {
      const prefs = getPrefs();
      const pid = targetPersonaId || prefs.persona || "buddy";
      const persona = PERSONAS[pid] || PERSONAS.buddy;
      const voiceName = persona.voiceName || "Puck";
      const pBank = soundsManifestData.personas[pid];
      if (!pBank) return;

      const itemsToCache = [];
      Object.keys(pBank).forEach((intent) => {
        const arr = Array.isArray(pBank[intent]) ? pBank[intent] : [];
        arr.forEach((it) => { if (it && it.text && it.file) itemsToCache.push(it); });
      });

      const cache = await caches.open(PERSISTENT_TTS_CACHE_NAME);
      for (const it of itemsToCache) {
        if (navigator.onLine === false) break;
        const spokenText = normalizeTextForArabicSpeech(it.text);
        if (!spokenText) continue;
        const cacheKey = `${pid}::${voiceName}::${spokenText}`;
        const reqUrl = "https://moaath-tts.local/" + encodeURIComponent(cacheKey);
        const already = await cache.match(reqUrl);
        if (already) continue;

        try {
          const res = await fetch(it.file, { method: "GET", cache: "default" });
          if (res.ok && !/text\/html/i.test(res.headers.get("content-type") || "")) {
            const blob = await res.blob();
            if (blob && blob.size >= 400) {
              await writePersistentHumanCache(cacheKey, blob);
            }
          }
        } catch (_) {}

        // تحميل تدريجي هادئ (مقطع كل 1.6 ثانية) بدون التأثير على سرعة التصفح
        await new Promise((r) => setTimeout(r, 1600));
      }
    } finally {
      manifestPreloadRunning = false;
    }
  }

  window.addEventListener("load", () => {
    setTimeout(() => { runManifestBackgroundPreload(); }, 4500);
    setTimeout(() => { runDripFeedPrewarm(); }, 12000);
  });

  window.toggleCompanionVoice = function () {
    haptic(12);
    unlockEmbeddedVoice();
    const prefs = getPrefs();
    const next = !prefs.voiceEnabled;
    setPrefs({ voiceEnabled: next });
    if (!next) stopEmbeddedVoice();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const msg = next ? `${persona.name}: الصوت مفعّل، أهلاً بك!` : "تم كتم صوت الجنية.";
    showBubble(next ? "🗣️ الصوت مفعّل" : "🔇 الصوت مكتوم", 2800);
    showToast(next ? "🗣️ الصوت مفعّل" : "🔇 الصوت مكتوم");
    if (next) speakOutLoud(msg, true);
  };

  window.replayLastCompanionSpeech = function () {
    haptic(12);
    unlockEmbeddedVoice();
    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const phrase = sessionCtx.lastSpokenText || pickPhrase(persona.greets, `greet_${persona.id}`);
    showBubble(`🧚 ${phrase}`, 3800);
    speakOutLoud(phrase, true);
  };

  function getThumb(id) {
    try {
      const cleanId = String(id || "").trim();
      const baseId = cleanId.replace(/_PKG$/, "");
      const p = (typeof products === "object" && products?.[baseId]) ||
                (typeof specialOffers === "object" && specialOffers?.[cleanId]) ||
                {};

      if (cleanId.endsWith("_PKG")) {
        const pkgImg = p.pkgThumb || p.pkgImage;
        if (pkgImg && typeof pkgImg === "string" && pkgImg.trim()) return pkgImg.trim();
      }

      if (typeof window.getLockedHighResImage === "function") {
        const locked = window.getLockedHighResImage(baseId);
        if (locked && typeof locked === "string" && locked.trim()) return locked.trim();
      }

      const candidate = p.thumb || p.image || p.img || p.photo;
      if (candidate && typeof candidate === "string" && candidate.trim()) return candidate.trim();
    } catch (_) {}

    return "store-icon.png";
  }

  function getUnitSYP(id) {
    const isW = currentUser?.userType === "wholesale";
    if (String(id || "").startsWith("OFFER_")) {
      const so = specialOffers?.[id];
      return so ? calcSYP((isW && so.wholesaleUSD > 0) ? so.wholesaleUSD : (so.newPriceUSD || 0)) : 0;
    }
    if (String(id || "").endsWith("_PKG")) {
      const p = products?.[String(id).replace(/_PKG$/, "")];
      return p ? calcSYP(p.pkgPriceUSD || 0) : 0;
    }
    const p = products?.[id];
    return p ? calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0)) : 0;
  }

  function getBranchAvail(pid) {
    const baseId = String(pid || "").replace(/_PKG$/, "");
    const pObj = products?.[baseId] || specialOffers?.[pid];
    if (!pObj) return 0;
    return typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, typeof activeBranchId !== "undefined" ? activeBranchId : "main") : (parseInt(pObj.stock) || 0);
  }

  function renderFairyAvatarImage(imgEl, persona) {
    if (!imgEl || !persona) return;
    imgEl.alt = persona.name;
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = "store-icon.png";
    };
    imgEl.src = persona.avatarUrl;
  }

  window.selectPetPersona = function (key) {
    if (!PERSONAS[key] && window.MoaathVIPSystem && window.MoaathVIPSystem.personas && window.MoaathVIPSystem.personas[key]) {
      const vp = window.MoaathVIPSystem.personas[key];
      const unlocked = typeof window.MoaathVIPSystem.isPersonaUnlockedLifetime === "function"
        ? window.MoaathVIPSystem.isPersonaUnlockedLifetime(key)
        : false;
      if (!unlocked) {
        if (typeof showToast === "function") showToast("🔒 هذه الشخصية تتطلب اشتراكاً مدى الحياة وتفعيلها من الإدارة.");
        if (typeof window.openVIPShowcaseModal === "function") window.openVIPShowcaseModal("all");
        return;
      }
      PERSONAS[key] = {
        ...vp,
        roleBadge: `👑 VIP • ${vp.role || ""}`,
        specialtyNote: `${vp.name} (${vp.role || ""}): ${vp.shortDesc || ""}`,
        greets: [vp.greet || `أهلاً بك مع ${vp.name} في متجر معاذ.`],
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
      };
    }
    if (!PERSONAS[key]) return;
    haptic(15);
    unlockEmbeddedVoice();
    pauseRoaming(7500);
    setPrefs({ persona: key });
    if (window.MoaathAIBrain && typeof window.MoaathAIBrain.recordPersonaUsage === "function") {
      window.MoaathAIBrain.recordPersonaUsage(key);
    }
    syncVisuals();
    syncFuturisticCollapseUI();
    const p = PERSONAS[key];
    const greetLine = composeInfinitePhrase("greet", p);
    const specEl = $("fairySpecialtyNote");
    if (specEl) specEl.textContent = p.specialtyNote || "";
    showBubble(`🧚 ${greetLine}`, 3800);
    speakOutLoud(greetLine, true);
    setTimeout(() => { if (typeof runManifestBackgroundPreload === "function") runManifestBackgroundPreload(key); }, 2500);
  };

  window.closeFairyGalleryModal = function () {
    const m = $("fairyGalleryPickerModal");
    if (m) m.style.display = "none";
  };

  window.openFairyGalleryModal = function () {
    haptic(12);
    unlockEmbeddedVoice();
    pauseRoaming(12000);

    const prefs = getPrefs();
    const activeId = prefs.persona || "buddy";

    // جمع الشخصيات الأساسية + أي شخصيات VIP مفعّلة للزبون
    const allList = Object.values(PERSONAS || {});
    if (window.MoaathVIPSystem && window.MoaathVIPSystem.personas && typeof window.MoaathVIPSystem.isPersonaUnlockedLifetime === "function") {
      Object.values(window.MoaathVIPSystem.personas).forEach(vp => {
        if (window.MoaathVIPSystem.isPersonaUnlockedLifetime(vp.id) && !allList.some(x => x.id === vp.id)) {
          allList.push({
            ...vp,
            isVip: true,
            roleBadge: `👑 VIP • ${vp.role || ""}`,
            specialtyNote: vp.shortDesc || vp.role || ""
          });
        }
      });
    }

    let modal = $("fairyGalleryPickerModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "fairyGalleryPickerModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10042; background:rgba(0,0,0,0.82); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) window.closeFairyGalleryModal();
      });
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    const cardsHtml = allList.map(per => {
      const isSelected = per.id === activeId;
      const accent = per.accent || "#d4af37";
      const snippet = per.specialtyNote || per.shortDesc || per.roleBadge || "";
      return `
        <button type="button" onclick="window.__pickFairyFromGallery('${per.id}')" class="fairy-gal-card ${isSelected ? "is-active" : ""}" style="--f-accent:${accent};">
          ${isSelected ? `<span class="fairy-gal-active-pill">✓ نشطة</span>` : ""}
          <div class="fairy-gal-avatar-wrap">
            <img src="${esc(per.avatarUrl || "store-icon.png")}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${esc(per.name)}" class="fairy-gal-avatar">
          </div>
          <div class="fairy-gal-name">${esc(per.name)}</div>
          <div class="fairy-gal-badge">${esc(per.roleBadge || "")}</div>
          <div class="fairy-gal-desc">${esc(snippet)}</div>
        </button>
      `;
    }).join("");

    const vipBtnHtml = typeof window.openVIPShowcaseModal === "function"
      ? `<button type="button" onclick="window.closeFairyGalleryModal(); window.openVIPShowcaseModal('all');" class="btn" style="margin-top:10px; background:linear-gradient(45deg, rgba(212,175,55,0.22), rgba(56,189,248,0.18)); color:var(--gold-color); border:1px solid var(--gold-color); font-size:11px; padding:7px 10px;">👑 استعراض الشخصيات المميزة والباقة الشاملة (VIP)</button>`
      : "";

    modal.innerHTML = `
      <div class="modal-content fairy-gal-modal">
        <div class="fairy-gal-header">
          <div>
            <div class="fairy-gal-title">🧚 اختر الجنية المتحدثة</div>
            <div class="fairy-gal-sub">اضغط على أي شخصية لتفعيلها والاستماع إلى صوتها فوراً</div>
          </div>
          <button type="button" onclick="window.closeFairyGalleryModal()" class="btn btn-danger" style="width:auto; padding:4px 10px; font-size:11px;">✕</button>
        </div>
        <div class="fairy-gal-grid">${cardsHtml}</div>
        ${vipBtnHtml}
      </div>
    `;
  };

  window.__pickFairyFromGallery = function (key) {
    window.closeFairyGalleryModal();
    if (typeof window.selectPetPersona === "function") {
      window.selectPetPersona(key);
    }
    if (window.MoaathVIPSystem && window.MoaathVIPSystem.personas && window.MoaathVIPSystem.personas[key] && typeof window.triggerVIPProminentEntrance === "function") {
      window.triggerVIPProminentEntrance(key);
    }
  };

  window.setPetHidden = function (hide) {
    haptic(15);
    if (hide) stopEmbeddedVoice();
    setPrefs({ hidden: !!hide });
    syncVisuals();
  };

  function showBubble(txt, ms = 5000) {
    const b = $("petMiniBubble");
    if (!b || !txt) return;
    b.textContent = txt;
    b.style.display = "block";
    clearTimeout(bubbleTimer);
    if (ms > 0) bubbleTimer = setTimeout(() => { b.style.display = "none"; }, ms);
  }

  function setOrbEmotion(state = "idle", bubbleTxt = "", shouldSpeak = false) {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const orb = $("petCharOrb");
    const ring = $("petListenRing");
    const statusBadge = $("fairyStateBadge");
    if (!orb) return;

    const badges = {
      idle: "🧚",
      listening: "🎙️",
      thinking: "✨",
      happy: "🤩",
      greet: "🌸",
      choice: "🔀"
    };
    if (statusBadge) statusBadge.textContent = badges[state] || "🧚";

    orb.style.borderColor = state === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = state === "listening" ? "block" : "none";

    if (state === "happy" || state === "choice") {
      pauseRoaming(6500);
      orb.style.transform = "scale(1.12) rotateY(10deg)";
      setTimeout(() => { if (orb) orb.style.transform = ""; }, 650);
    }

    if (bubbleTxt) {
      showBubble(bubbleTxt, state === "listening" ? 0 : 5400);
      if (shouldSpeak) speakOutLoud(bubbleTxt, false);
    }
  }

  function syncConnectivityBadge() {
    const badge = $("petConnStatusBadge");
    if (!badge) return;
    const online = navigator.onLine !== false;
    if (!online) {
      badge.textContent = "🟡 محلي";
      badge.style.color = "#ff9800";
      return;
    }
    if (!sessionCtx.lastTtsSource) {
      badge.textContent = "🟢 جاهز";
      badge.style.color = "#00e676";
    }
  }

  function syncVisuals() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const pos = getPos();
    const isLight = document.body.classList.contains("light-mode");

    const root = $("petCharRoot");
    const orb = $("petCharOrb");
    const img = $("fairyCharImg");
    const barThumb = $("fairyBarThumb");
    const showBtn = $("petShowCharBtn");
    const sel = $("petPersonaSelect");

    if (root) {
      root.style.display = prefs.hidden ? "none" : "block";
      root.style.right = pos.right + "px";
      root.style.bottom = pos.bottom + "px";
    }
    if (showBtn) showBtn.style.display = prefs.hidden ? "inline-flex" : "none";
    if (sel && sel.value !== prefs.persona) sel.value = prefs.persona;

    if (orb) {
      orb.style.borderColor = p.accent;
      orb.style.background = isLight
        ? `radial-gradient(circle at 30% 25%, #ffffff, ${p.accent}26 75%)`
        : `radial-gradient(circle at 30% 25%, ${p.accent}33, #0c1428 72%)`;
      orb.style.boxShadow = isLight
        ? `0 12px 24px rgba(0,0,0,0.22), 0 0 16px ${p.accent}66`
        : `0 14px 28px rgba(0,0,0,0.6), 0 0 18px ${p.accent}77, inset 0 2px 6px rgba(255,255,255,0.35)`;
    }
    if (img) renderFairyAvatarImage(img, p);
    if (barThumb) {
      barThumb.style.borderColor = p.accent;
      renderFairyAvatarImage(barThumb, p);
    }
    const barNameEl = $("fairyBarActiveName");
    if (barNameEl) barNameEl.textContent = p.name || "";
    const specEl = $("fairySpecialtyNote");
    if (specEl) specEl.textContent = p.specialtyNote || "";
    syncConnectivityBadge();
  }

  function ensureGroundShadow(root) {
    if (!root || $("pet3DGroundShadow")) return;
    const orbWrap = root.querySelector("div[style*='position:relative']");
    if (orbWrap) {
      const sh = document.createElement("div");
      sh.id = "pet3DGroundShadow";
      orbWrap.appendChild(sh);
    }
  }

  function stepFreeRoam() {
    const root = $("petCharRoot");
    const orb = $("petCharOrb");
    if (!root || !orb || root.style.display === "none") return;
    if (Date.now() < userPausedUntil || isHoldingSpeak) return;

    const modalOpen = Array.from(document.querySelectorAll(".modal-overlay")).some(
      m => m.style.display === "flex" || m.style.display === "block"
    );
    if (modalOpen) return;

    const maxR = Math.max(12, window.innerWidth - 76);
    const minB = 96;
    const maxB = Math.max(minB + 40, window.innerHeight - 185);

    const curR = parseInt(root.style.right || "12", 10);
    const curB = parseInt(root.style.bottom || "96", 10);

    // إبقاء الجنية هادئة في زاويتها الجانبية الآمنة دون التنقل العشوائي فوق أزرار الشراء
    const stickLeft = curR > window.innerWidth / 2;
    const nextR = stickLeft ? maxR : 12;
    const nextB = Math.round(Math.max(minB, Math.min(145, curB + (Math.random() - 0.5) * 26)));

    const tiltY = nextR < curR ? 16 : -16;
    const tiltX = nextB > curB ? -12 : 12;

    orb.classList.add("is-roaming");
    orb.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(16px)`;
    root.style.right = nextR + "px";
    root.style.bottom = nextB + "px";

    setTimeout(() => {
      if (Date.now() >= userPausedUntil && orb) {
        orb.style.transform = "";
      }
    }, 950);
  }

  function startRoamLoop() {
    if (roamTimer) return;
    roamTimer = setInterval(stepFreeRoam, 4300);
  }

  function enhanceCustomerCartCheckoutUX() {
    const modalContent = document.querySelector("#cartModal .modal-content");
    if (!modalContent) return;

    if (!$("cartCheckoutStepper")) {
      const stepper = document.createElement("div");
      stepper.id = "cartCheckoutStepper";
      stepper.style.cssText = "display:flex; justify-content:space-between; align-items:center; gap:4px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; padding:6px 8px; margin-bottom:10px; font-size:10px; font-weight:bold;";
      stepper.innerHTML = `
        <span style="color:#00e676;">① مراجعة السلة</span>
        <span style="color:var(--gray-text);">←</span>
        <span style="color:var(--gold-color);">② التوصيل والدفع اليدوي</span>
        <span style="color:var(--gray-text);">←</span>
        <span style="color:#00b0ff;">③ تأكيد الطلب</span>
      `;
      const header = modalContent.firstElementChild;
      if (header && header.nextSibling) modalContent.insertBefore(stepper, header.nextSibling);
      else modalContent.insertBefore(stepper, modalContent.firstChild);
    }

    const submitBtn = $("submitOrderUnifiedBtn");
    if (submitBtn && submitBtn.parentNode) {
      let card = $("cleanCheckoutSummaryCard");
      if (!card) {
        card = document.createElement("div");
        card.id = "cleanCheckoutSummaryCard";
        card.style.cssText = "background:var(--bg-color); border:1px solid var(--gold-color); border-radius:8px; padding:8px 10px; margin-bottom:8px; font-size:11px; line-height:1.55;";
        submitBtn.parentNode.insertBefore(card, submitBtn);
      }

      const itemsCount = Object.values(cart || {}).reduce((acc, it) => acc + (parseInt(it.qty) || 0), 0);
      const feeTxt = $("modalDeliveryFee")?.textContent || "0";
      const ptsTxt = $("modalCartPoints")?.textContent || "0";
      const totalTxt = $("modalCartTotal")?.textContent || "0";
      const payMethod = $("cartPaymentMethod")?.value || "نقداً / حسب المتاح";
      const regionName = $("cartRegionSelect")?.value || "غير محدد";

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-color); padding-bottom:4px; margin-bottom:5px;">
          <b style="color:var(--gold-color);">🧾 ملخص طلبك قبل الإرسال</b>
          <span style="color:#00e676; font-weight:bold;">+${esc(ptsTxt)} نقطة</span>
        </div>
        <div style="display:flex; justify-content:space-between;"><span>عدد القطع:</span><b>${itemsCount}</b></div>
        <div style="display:flex; justify-content:space-between;"><span>المنطقة والتوصيل:</span><b>${esc(regionName)} (${esc(feeTxt)} ل.س)</b></div>
        <div style="display:flex; justify-content:space-between;"><span>طريقة الدفع (يدوي):</span><b>${esc(payMethod)}</b></div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:4px; padding-top:4px; font-size:12px;">
          <span>الإجمالي النهائي:</span>
          <strong style="color:var(--gold-color);">${esc(totalTxt)} ل.س</strong>
        </div>
      `;
    }
  }

  window.copyTextToClipboardClean = function (txt, successMsg) {
    if (!txt) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(txt).then(() => showToast(successMsg));
    } else {
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast(successMsg);
    }
  };

  window.exportTodayOrdersBrief = function () {
    const allOrds = [
      ...Object.values(pendingOrders || {}).map(o => ({ ...o, _st: "قيد الانتظار" })),
      ...Object.values(readyOrders || {}).map(o => ({ ...o, _st: "جاهز" })),
      ...Object.values(dispatchedOrders || {}).map(o => ({ ...o, _st: "قيد التوصيل" }))
    ];
    const lines = [
      `📦 تقرير تجهيز وتصدير الطلبات — متجر معاذ (${new Date().toLocaleDateString("ar-SY")})`,
      `إجمالي الطلبات النشطة: ${allOrds.length}`,
      "----------------------------------------"
    ];
    if (!allOrds.length) {
      lines.push("لا توجد طلبات نشطة حالياً.");
    } else {
      allOrds.forEach((o, i) => {
        const itemsStr = (o.items || []).map(it => `${it.name}×${it.qty}`).join("، ");
        lines.push(`${i + 1}) [${o._st}] ${o.customerName || "زبون"} (${o.region || "-"}) | ${itemsStr}`);
      });
    }
    const out = lines.join("\n");
    setVal("admExportPreviewArea", out);
    window.copyTextToClipboardClean(out, "✅ تم تجهيز ونسخ تقرير الطلبات النشطة!");
  };

  window.exportLowStockShortageList = function () {
    const low = Object.values(products || {}).filter(p => {
      const st = getBranchAvail(p.id);
      const lim = parseInt(p.alertLimit) || 2;
      return st <= lim;
    });
    const lines = [
      `⚠️ قائمة نواقص المخزون للطلب من الموردين (${new Date().toLocaleDateString("ar-SY")})`,
      `عدد الأصناف الناقصة: ${low.length}`,
      "----------------------------------------"
    ];
    low.forEach((p, i) => {
      lines.push(`${i + 1}) ${p.name} — المتوفر: ${getBranchAvail(p.id)} (الحد الأدنى: ${parseInt(p.alertLimit) || 2})`);
    });
    const out = lines.join("\n");
    setVal("admExportPreviewArea", out);
    window.copyTextToClipboardClean(out, "✅ تم تجهيز ونسخ قائمة النواقص!");
  };

  window.downloadStoreBackupJSON = function () {
    const payload = {
      exportedAt: new Date().toISOString(),
      store: "متجر معاذ",
      products: products || {},
      categories: categories || [],
      recipes: customRecipesDB || {}
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moaath-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✅ تم تنزيل ملف النسخة الاحتياطية بنجاح!");
  };

  function organizeAdminAndExportUI() {
    const adminContent = document.querySelector("#adminModal .modal-content");
    const tabsBar = adminContent?.querySelector(".categories");
    if (!adminContent || !tabsBar) return;

    if (!$("admTabsQuickSearch")) {
      const searchWrap = document.createElement("div");
      searchWrap.style.cssText = "margin-bottom:6px;";
      searchWrap.innerHTML = `<input type="text" id="admTabsQuickSearch" class="form-control" placeholder="🔍 ابحث عن تبويب إداري (وصفات، ديون، تصدير، منتجات...)" style="padding:6px 9px; font-size:11px;">`;
      tabsBar.parentNode.insertBefore(searchWrap, tabsBar);

      $("admTabsQuickSearch").addEventListener("input", function () {
        const q = cleanArabicNorm(this.value);
        tabsBar.querySelectorAll(".cat-btn").forEach(btn => {
          const match = !q || cleanArabicNorm(btn.textContent || "").includes(q);
          btn.style.display = match ? "inline-block" : "none";
        });
      });
    }

    if (!$("admTab12Recipes")) {
      const tabBtn = document.createElement("button");
      tabBtn.className = "cat-btn";
      tabBtn.textContent = "🍲 الوصفات";
      tabBtn.onclick = function () { switchAdminTab("admTab12Recipes", this); renderRecipeProductPicker(); renderAdminRecipesList(); };
      tabsBar.appendChild(tabBtn);

      const tabDiv = document.createElement("div");
      tabDiv.id = "admTab12Recipes";
      tabDiv.className = "admin-tab";
      tabDiv.style.display = "none";
      tabDiv.innerHTML = `
        <div class="adm-sec" style="border-color:var(--gold-color);">
          <div class="adm-sec-title">
            <span>🍲 إضافة / تعديل وصفة واحتياجاتها</span>
            <button type="button" onclick="resetAdminRecipeForm()" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:10px;">تفريغ</button>
          </div>
          <input type="hidden" id="admRecipeEditId">
          <div class="stats-grid">
            <div class="form-group"><label>اسم الوصفة:</label><input type="text" id="admRecipeTitle" class="form-control" placeholder="مثال: كنافة / شيش برك"></div>
            <div class="form-group"><label>النوع:</label>
              <select id="admRecipeCategory" class="form-control">
                <option value="طبخ">طبخ</option>
                <option value="حلويات">حلويات</option>
                <option value="مشروبات وتسالي">مشروبات وتسالي</option>
                <option value="تنظيف">تنظيف ومهام</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>كلمات مفتاحية بديلة (افصل بفاصلة):</label>
            <input type="text" id="admRecipeKeywords" class="form-control" placeholder="مثال: كنافة، حلى جبن">
          </div>
          <div class="form-group">
            <label>اختر احتياجات الوصفة من أصناف المتجر:</label>
            <input type="text" id="admRecipeProdSearch" class="form-control" placeholder="🔍 ابحث عن صنف..." oninput="renderRecipeProductPicker()" style="margin-bottom:6px; padding:6px;">
            <div id="admRecipeProductsPicker" style="display:flex; flex-wrap:wrap; gap:5px; max-height:125px; overflow-y:auto; background:var(--bg-color); padding:7px; border-radius:6px; border:1px solid var(--border-color);"></div>
          </div>
          <div class="form-group">
            <label>أو اكتب المكونات نصياً (افصل بفاصلة):</label>
            <input type="text" id="admRecipeIngredients" class="form-control" placeholder="سميد، سكر، سمن، جبن">
          </div>
          <button type="button" onclick="saveAdminRecipe()" class="btn" style="background:var(--success-color); color:#000;">💾 حفظ الوصفة</button>
        </div>
        <div class="adm-sec">
          <div class="adm-sec-title"><span>📋 الوصفات المحفوظة</span></div>
          <input type="text" id="admRecipeListFilter" class="form-control" placeholder="🔍 ابحث في الوصفات..." oninput="renderAdminRecipesList()" style="margin-bottom:8px; padding:6px;">
          <div id="admRecipesSavedList"></div>
        </div>
      `;
      adminContent.appendChild(tabDiv);
      renderRecipeProductPicker();
      renderAdminRecipesList();
    }

    if (!$("admTab13Export")) {
      const expBtn = document.createElement("button");
      expBtn.className = "cat-btn";
      expBtn.textContent = "📤 التصدير";
      expBtn.onclick = function () { switchAdminTab("admTab13Export", this); };
      tabsBar.appendChild(expBtn);

      const expDiv = document.createElement("div");
      expDiv.id = "admTab13Export";
      expDiv.className = "admin-tab";
      expDiv.style.display = "none";
      expDiv.innerHTML = `
        <div class="adm-sec" style="border-color:#00b0ff;">
          <div class="adm-sec-title"><span style="color:#00b0ff;">📤 مركز التصدير والتجهيز السريع</span></div>
          <div style="display:flex; flex-direction:column; gap:7px; margin-bottom:10px;">
            <button type="button" onclick="exportTodayOrdersBrief()" class="btn" style="background:linear-gradient(45deg,#00e676,#00b0ff); color:#000; font-size:11px;">📦 تصدير ونسخ ملخص الطلبات النشطة للتجهيز</button>
            <button type="button" onclick="exportLowStockShortageList()" class="btn" style="background:rgba(212,175,55,0.2); color:var(--gold-color); border:1px solid var(--gold-color); font-size:11px;">⚠️ تصدير ونسخ قائمة نواقص المخزون للموردين</button>
            <button type="button" onclick="downloadStoreBackupJSON()" class="btn" style="background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); font-size:11px;">💾 تنزيل نسخة احتياطية كاملة (JSON)</button>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>معاينة النص المصدّر (جاهز للنسخ أو المشاركة):</label>
            <textarea id="admExportPreviewArea" class="form-control" rows="6" readonly placeholder="اضغط أحد أزرار التصدير بالأعلى لمعاينة التقرير ونسخه تلقائياً..."></textarea>
          </div>
        </div>
        <div class="adm-sec" style="border-color:var(--gold-color);">
          <div class="adm-sec-title"><span>🧠 تدريب العقل الذكي (مرادفات واستعلامات غير مطابقة)</span></div>
          <div class="form-group">
            <label>إضافة مجموعة مرادفات جديدة (مثال: لبن، زبادي، رايب):</label>
            <input type="text" id="admBrainSynInput" class="form-control" placeholder="كلمة1، كلمة2، كلمة3">
          </div>
          <button type="button" onclick="saveAdminBrainSynonym()" class="btn" style="background:var(--success-color); color:#000; font-size:11px;">➕ حفظ مجموعة المرادفات</button>
          <div id="admBrainUnmatchedBox" style="margin-top:8px; font-size:11px;"></div>
        </div>
      `;
      adminContent.appendChild(expDiv);
      renderAdminBrainUnmatchedList();
    }

    const LOCAL_SYN_KEY = "moaath_store_local_synonyms";

    function saveLocalSynonymFallback(id, parts) {
      try {
        const cur = JSON.parse(localStorage.getItem(LOCAL_SYN_KEY) || "{}");
        cur[id] = parts;
        localStorage.setItem(LOCAL_SYN_KEY, JSON.stringify(cur));
      } catch (_) {}
    }

    window.saveAdminBrainSynonym = function () {
      const raw = String($("admBrainSynInput")?.value || "").trim();
      const parts = raw.split(/[،,]/).map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) return alert("⚠️ أدخل كلمتين أو أكثر مفصولتين بفاصلة.");
      const id = "SYN_" + Date.now();
      saveLocalSynonymFallback(id, parts);

      if (typeof db === "undefined" || !db || typeof db.ref !== "function") {
        setVal("admBrainSynInput", "");
        showToast("✅ تم حفظ المرادفات محلياً على الجهاز!");
        return;
      }

      db.ref(`ai_brain/synonyms/${id}`).set(parts).then(() => {
        setVal("admBrainSynInput", "");
        showToast("✅ تم حفظ المرادفات في العقل الذكي!");
      }).catch(() => {
        setVal("admBrainSynInput", "");
        showToast("✅ تم حفظ المرادفات محلياً (صلاحيات Firebase على ai_brain/synonyms مقيدة).");
      });
    };

    window.renderAdminBrainUnmatchedList = function () {
      const box = $("admBrainUnmatchedBox");
      if (!box || typeof db === "undefined" || !db.ref) return;
      db.ref("ai_brain/unmatched_queries").limitToLast(10).once("value", snap => {
        const val = snap.val() || {};
        const rows = Object.values(val);
        if (!rows.length) {
          box.innerHTML = `<div style="color:var(--gray-text);">لا توجد استعلامات غير مطابقة مسجلة حالياً.</div>`;
          return;
        }
        box.innerHTML = rows.map(r =>
          `<div style="padding:4px 6px; border-bottom:1px dashed var(--border-color); display:flex; justify-content:space-between;">
            <span>${esc(r.query || "")}</span>
            <span style="color:var(--gold-color);">×${r.count || 1}</span>
          </div>`
        ).join("");
      });
    };
  }

  window.renderSmartCartRecommendations = function () {
    const box = $("aiCartRecommendationsBox");
    if (!box) return;
    const keys = Object.keys(cart || {});
    if (!keys.length) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    const inCart = new Set(keys.map(k => cart[k]?.origId || String(k).replace(/_PKG$/, "")));
    const cats = new Set(keys.map(k => cart[k]?.category).filter(Boolean));
    const co = {};

    Object.values(completedOrdersHistory || {}).forEach(ord => {
      const ids = Array.from(new Set(
        (ord?.items || [])
          .filter(i => !String(i.id || "").startsWith("OFFER_"))
          .map(i => i.origId || String(i.id || "").replace(/_PKG$/, ""))
      ));
      if (ids.some(id => inCart.has(id))) {
        ids.forEach(id => {
          if (!inCart.has(id)) co[id] = (co[id] || 0) + 1;
        });
      }
    });

    const picks = Object.keys(products || {})
      .filter(pid => !inCart.has(pid) && getBranchAvail(pid) > 0)
      .map(pid => ({
        pid,
        p: products[pid],
        s: (co[pid] || 0) * 5 + (cats.has(products[pid].category) ? 2 : 0)
      }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4);

    if (!picks.length) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    box.style.display = "block";
    box.innerHTML = `
      <div style="background:rgba(0,176,255,0.06); border:1px dashed #00b0ff; border-radius:8px; padding:7px;">
        <div style="font-size:11px; font-weight:bold; color:#00b0ff; margin-bottom:6px;">🛍️ مقترحات مصورة تكمل سلتك:</div>
        <div style="display:flex; gap:6px; overflow-x:auto;">
          ${picks.map(({ pid, p }) => `
            <div style="min-width:112px; background:var(--bg-color); border:1px solid var(--gold-color); border-radius:7px; padding:6px; text-align:center; flex-shrink:0;">
              <img src="${esc(getThumb(pid))}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:46px; height:46px; border-radius:6px; object-fit:cover; margin:0 auto 4px auto; display:block;">
              <div style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(p.name)}">${esc(p.name)}</div>
              <div style="font-size:10px; color:var(--success-color); font-weight:bold; margin:2px 0;">${getUnitSYP(pid).toLocaleString()} ل.س</div>
              <button type="button" onclick="changeQty('${pid}', 1)" class="btn" style="padding:3px 6px; font-size:10px;">➕ أضف</button>
            </div>`).join("")}
        </div>
      </div>`;
  };

  function answerLiveStoreQueries(normText) {
    if (/مفتوح|دوام|اوقات|ساعات|مسكر|يفتح/.test(normText)) {
      const openNow = typeof isGlobalStoreOpenNow === "function" ? isGlobalStoreOpenNow() : true;
      const wh = workHoursSettings || {};
      const hours = wh.enabled ? `من ${wh.open || "08:00"} إلى ${wh.close || "23:00"}` : "متاح للطلب حالياً";
      const branch = typeof getBranchName === "function" ? getBranchName(typeof activeBranchId !== "undefined" ? activeBranchId : "main") : "الرئيسي";
      return openNow
        ? `نعم، المتجر مفتوح الآن في فرع ${branch}، ومواعيد الدوام ${hours}.`
        : `المتجر مغلق حالياً، مواعيد الدوام ${hours}.`;
    }
    return null;
  }

  // ==========================================================================
  // [محرك الحوار المتتابع الذكي (Multi-Turn Dialog v2) — يعمل محلياً بـ 0 حصة API]
  // - يدعم الأرقام العربية (٥٠٠) والإنجليزية (500) والأرقام المنطوقة (خمسمية / ألف)
  // - يحفظ حالة الحوار في sessionStorage لعدم فقدانها عند إعادة رسم الواجهة
  // ==========================================================================
  const PENDING_DIALOG_STORAGE_KEY = "moaath_ai_pending_dialog_v2";

  function loadPendingDialog() {
    if (sessionCtx.pendingDialog && sessionCtx.pendingDialog.expiresAt > Date.now()) {
      return sessionCtx.pendingDialog;
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem(PENDING_DIALOG_STORAGE_KEY) || "null");
      if (saved && saved.expiresAt > Date.now()) {
        sessionCtx.pendingDialog = saved;
        return saved;
      }
    } catch (_) {}
    return null;
  }

  function savePendingDialog(obj) {
    sessionCtx.pendingDialog = obj;
    try {
      if (obj) sessionStorage.setItem(PENDING_DIALOG_STORAGE_KEY, JSON.stringify(obj));
      else sessionStorage.removeItem(PENDING_DIALOG_STORAGE_KEY);
    } catch (_) {}
  }

  const DIALOG_PLAN_TOPICS = [
    {
      key: "sahra",
      title: "سهرة ومتة",
      regex: /(تنظيم|نظم|تجهيز|جهز|رتب|حضر|اقترح|سوي|اعمل|بدي|اريد).*(سهره|مته|تسالي|جمعه|قعده)|^(سهره|تنظيم سهره|تجهيز سهره)$/,
      keywords: ["متة", "مته", "بزر", "شيبس", "بسكوت", "شوكولاتة", "شوكولاته", "عصير", "شاي", "قهوة", "موالح", "نقارش"]
    },
    {
      key: "breakfast",
      title: "فطور صباحي",
      regex: /(تنظيم|نظم|تجهيز|جهز|رتب|حضر|اقترح|سوي|اعمل|بدي|اريد).*(فطور|افطار|صباحي)|^(فطور|فطور صباحي)$/,
      keywords: ["بيض", "جبن", "لبنة", "لبنه", "حليب", "خبز", "حلاوة", "حلاوه", "زيتون", "شاي", "زعتر", "مربى", "عسل"]
    },
    {
      key: "hospitality",
      title: "ضيافة وحلويات",
      regex: /(تنظيم|نظم|تجهيز|جهز|رتب|حضر|اقترح|سوي|اعمل|بدي|اريد).*(ضيافه|ضيوف|عزيمه|حلى|حلويات)|^(ضيافه|ضيافة)$/,
      keywords: ["قهوة", "قهوه", "شاي", "بسكوت", "شوكولاتة", "شوكولاته", "عصير", "حليب", "كيك", "سميد", "سكر", "نشا"]
    },
    {
      key: "cleaning",
      title: "تنظيف ومنظفات",
      regex: /(تنظيم|نظم|تجهيز|جهز|رتب|حضر|اقترح|سوي|اعمل|بدي|اريد).*(تنظيف|منظفات|غسيل|جلي)/,
      keywords: ["سائل جلي", "جلي", "مسحوق غسيل", "كلور", "صابون", "شامبو", "مناديل", "محارم", "معقم", "ليف", "اسفنج"]
    },
    {
      key: "general_basket",
      title: "سلة مشتريات بميزانية",
      regex: /(تنظيم|نظم|تجهيز|جهز|رتب|اقترح).*(سله|مشتريات|اغراض|طلب|ميزانيه)/,
      keywords: []
    }
  ];

  function extractBudgetNumber(normText) {
    const clean = toWesternDigits(String(normText || "")).replace(/[,،]/g, "").trim();

    // 1) أرقام رقمية (مثل 500، ٥٠٠، ب 500، ميزانيتي 1000 ليرة)
    const numMatch = clean.match(/(\d{2,7})/);
    if (numMatch) {
      const val = parseInt(numMatch[1], 10);
      if (val >= 10) return val;
    }

    // 2) أرقام منطوقة بالعربية (للصوت أو الكتابة)
    const spokenMap = [
      [/عشر\s*الاف|عشره\s*الاف/, 10000],
      [/خمس\s*الاف|خمسه\s*الاف/, 5000],
      [/اربع\s*الاف|اربعه\s*الاف/, 4000],
      [/تلت\s*الاف|ثلاث\s*الاف|ثلاثه\s*الاف/, 3000],
      [/الفين/, 2000],
      [/الف\s*ونص/, 1500],
      [/\bالف\b/, 1000],
      [/تسعميه|تسع\s*ميه|تسعمائه|تسعمئه/, 900],
      [/تمنميه|تمن\s*ميه|ثمانميه|ثمان\s*ميه/, 800],
      [/سبعميه|سبع\s*ميه|سبعمئه/, 700],
      [/ستميه|ست\s*ميه|ستمئه/, 600],
      [/خمسميه|خمس\s*ميه|خمسمئه|خمسمائه/, 500],
      [/اربعميه|اربع\s*ميه|اربعمئه/, 400],
      [/تلتميه|تلت\s*ميه|ثلاثميه|ثلاث\s*ميه|ثلاثمئه/, 300],
      [/ميتين|مائتين|مئتين/, 200],
      [/ميه\s*ونص/, 150],
      [/\b(ميه|مئه|مائه)\b/, 100],
      [/\bخمسين\b/, 50]
    ];
    for (const [rx, val] of spokenMap) {
      if (rx.test(clean)) return val;
    }
    return null;
  }

  function buildBudgetBasket(budgetSYP, keywords, topicTitle) {
    const allAvail = Object.keys(products || {})
      .filter(pid => getBranchAvail(pid) > 0 && getUnitSYP(pid) > 0 && getUnitSYP(pid) <= budgetSYP)
      .map(pid => {
        const p = products[pid];
        const pNorm = cleanArabicNorm((p.name || "") + " " + (p.category || ""));
        const kwScore = (keywords || []).reduce((acc, kw) => acc + (pNorm.includes(cleanArabicNorm(kw)) ? 10 : 0), 0);
        return {
          id: pid,
          name: p.name,
          price: getUnitSYP(pid),
          kwScore
        };
      });

    const matched = allAvail.filter(x => x.kwScore > 0).sort((a, b) => (b.kwScore - a.kwScore) || (a.price - b.price));
    const pool = matched.length >= 2 ? matched : [...matched, ...allAvail.filter(x => x.kwScore === 0).sort((a, b) => a.price - b.price)];

    const picked = [];
    let runningTotal = 0;
    for (const item of pool) {
      if (picked.length >= 8) break;
      if (runningTotal + item.price <= budgetSYP) {
        picked.push({
          id: item.id,
          name: item.name,
          suggestedQty: 1,
          reason: `ضمن ميزانية ${budgetSYP.toLocaleString()} ل.س (${item.price.toLocaleString()} ل.س)`
        });
        runningTotal += item.price;
      }
    }
    return { picked, runningTotal };
  }

  function handleMultiTurnDialog(normText, persona) {
    const now = Date.now();
    const pending = loadPendingDialog();
    const budgetVal = extractBudgetNumber(normText);

    // 1) إذا كان هناك حوار مفتوح ينتظر الميزانية وردّ الزبون برقم (مثل "500" أو "٥٠٠" أو "خمسمية")
    if (pending && pending.type === "awaiting_budget" && budgetVal) {
      const { picked, runningTotal } = buildBudgetBasket(budgetVal, pending.keywords, pending.title);
      savePendingDialog(null);
      setVal("aiShoppingPromptInput", "");
      if (picked.length > 0) {
        openZeroDefaultModal(
          `🎯 تجهيز (${pending.title}) بميزانية ${budgetVal.toLocaleString()} ل.س:`,
          picked,
          `budget_${pending.key}_${budgetVal}`,
          `المجموع المقترح: ${runningTotal.toLocaleString()} ل.س من أصل ${budgetVal.toLocaleString()} ل.س — اضغط «تحديد المتوفر» أو (+)`
        );
        const reply = `جهزتلك تشكيلة (${pending.title}) ضمن ميزانية ${budgetVal.toLocaleString()} ليرة، المجموع ${runningTotal.toLocaleString()} ليرة.`;
        setOrbEmotion("choice", reply, true);
        setTxt("aiShoppingStatusText", `🎯 ${reply}`);
        return true;
      } else {
        const lowMsg = `ميزانية ${budgetVal.toLocaleString()} ليرة أقل من أسعار الأصناف المتوفرة حالياً لـ (${pending.title})، جرّب رفع الميزانية قليلاً.`;
        setOrbEmotion("idle", lowMsg, true);
        setTxt("aiShoppingStatusText", `💡 ${lowMsg}`);
        return true;
      }
    }

    // 2) إذا كتب الزبون رقماً فقط (مثل "500" أو "٥٠٠" أو "ب 500") دون حوار معلق -> يجهز له سلة فورية ضمن الميزانية
    if (!pending && budgetVal && /^(?:ب|حوالي|تقريبا|حدود|ميزانيه|ميزانيتي|مبلغ)?\s*(?:\d{2,7}|خمسميه|خمس\s*ميه|الف|الفين|ميه|ميتين|تلتميه|اربعميه|ستميه|سبعميه|تمنميه|تسعميه)\s*(?:ليره|ل\s*س|سوري|فقط)?$/.test(normText)) {
      const ctxTitle = sessionCtx.lastModalTitle ? "تشكيلة حسب طلبك السابق" : "تشكيلة متوفرة";
      const ctxKws = sessionCtx.lastQuery ? [sessionCtx.lastQuery] : [];
      const { picked, runningTotal } = buildBudgetBasket(budgetVal, ctxKws, ctxTitle);
      setVal("aiShoppingPromptInput", "");
      if (picked.length > 0) {
        openZeroDefaultModal(
          `💰 ${ctxTitle} ضمن ميزانية ${budgetVal.toLocaleString()} ل.س:`,
          picked,
          `budget_quick_${budgetVal}`,
          `المجموع المقترح: ${runningTotal.toLocaleString()} ل.س — اضغط «تحديد المتوفر» أو (+)`
        );
        const reply = `رتبتلك أفضل الأصناف المتوفرة ضمن ميزانية ${budgetVal.toLocaleString()} ليرة، المجموع ${runningTotal.toLocaleString()} ليرة.`;
        setOrbEmotion("choice", reply, true);
        setTxt("aiShoppingStatusText", `💰 ${reply}`);
        return true;
      }
    }

    // 3) ردود الموافقة والمتابعة ("موافق"، "تمام"، "نعم"، "أوكي"، "ماشي"، "أضفهم")
    if (/^(موافق|تمام|نعم|اوكي|ماشي|ايه|ايوه|طيب|ممتاز|اكمل|اضفهم)$/.test(normText)) {
      setVal("aiShoppingPromptInput", "");
      if (pending && pending.type === "awaiting_budget") {
        const askAgain = `ممتاز! اكتب رقم الميزانية بالليرة (مثلاً 500 أو 1000) لأجهزلك (${pending.title}) فوراً.`;
        setOrbEmotion("greet", askAgain, true);
        setTxt("aiShoppingStatusText", `💬 ${askAgain}`);
        return true;
      }
      if (sessionCtx.lastModalItems.length > 0) {
        openZeroDefaultModal(sessionCtx.lastModalTitle, sessionCtx.lastModalItems, sessionCtx.lastModalIntent, sessionCtx.lastModalSubtitle);
        window.selectAllZeroDefaultSuggestions();
        const msg = "تم تحديد الأصناف المتوفرة لك، اضغط «إضافة للسلة» للتأكيد.";
        setOrbEmotion("happy", msg, true);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        return true;
      }
    }

    // 4) التقاط طلب تنظيم/تجهيز مناسبة (مثل "تنظيم سهرة" أو "نظم لي سهرة")
    for (const topic of DIALOG_PLAN_TOPICS) {
      if (topic.regex.test(normText)) {
        setVal("aiShoppingPromptInput", "");
        if (budgetVal) {
          const { picked, runningTotal } = buildBudgetBasket(budgetVal, topic.keywords, topic.title);
          if (picked.length > 0) {
            openZeroDefaultModal(
              `🎯 تجهيز (${topic.title}) بميزانية ${budgetVal.toLocaleString()} ل.س:`,
              picked,
              `budget_${topic.key}_${budgetVal}`,
              `المجموع المقترح: ${runningTotal.toLocaleString()} ل.س — اضغط «تحديد المتوفر» أو (+)`
            );
            const reply = `جهزتلك (${topic.title}) ضمن ${budgetVal.toLocaleString()} ليرة، المجموع ${runningTotal.toLocaleString()} ليرة.`;
            setOrbEmotion("choice", reply, true);
            setTxt("aiShoppingStatusText", `🎯 ${reply}`);
            return true;
          }
        } else {
          savePendingDialog({
            type: "awaiting_budget",
            key: topic.key,
            title: topic.title,
            keywords: topic.keywords,
            expiresAt: now + 10 * 60 * 1000
          });
          const askMsg = `على عيني! كم الميزانية التي تحب أن أجهز بها (${topic.title})؟ اكتب الرقم فقط مثل 500 أو 1000.`;
          setOrbEmotion("greet", askMsg, true);
          setTxt("aiShoppingStatusText", `💬 ${askMsg}`);
          return true;
        }
      }
    }

    return false;
  }

  function handleSessionFollowUp(normText) {
    if (/^(اعد|كرر|افتح)\s*(اخر)?\s*(اقتراح|قائمه|نافذه)/.test(normText) && sessionCtx.lastModalItems.length > 0) {
      openZeroDefaultModal(sessionCtx.lastModalTitle, sessionCtx.lastModalItems, sessionCtx.lastModalIntent, sessionCtx.lastModalSubtitle);
      return "أعدت فتح آخر قائمة اقتراحات لك.";
    }
    if (/^(زد|زود|حبه ثانيه|واحد ثاني)/.test(normText) && sessionCtx.lastAddedIds.length > 0) {
      const lastId = sessionCtx.lastAddedIds[sessionCtx.lastAddedIds.length - 1];
      const avail = getBranchAvail(lastId);
      const cur = cart[lastId] ? (parseInt(cart[lastId].qty) || 0) : 0;
      if (avail > cur) {
        changeQty(lastId, 1);
        return "زدت حبة إضافية في سلتك.";
      }
      return "وصلت للحد الأقصى المتوفر من هذا الصنف في الفرع.";
    }
    return null;
  }

  function getAllMergedRecipes() {
    const adminList = Object.keys(customRecipesDB || {}).map(k => {
      const r = customRecipesDB[k];
      if (!r || !r.title) return null;
      const kws = Array.isArray(r.keywords) && r.keywords.length ? r.keywords : [r.title];
      return {
        id: k,
        title: r.title,
        category: r.category || "طبخ",
        keywords: kws,
        productIds: Array.isArray(r.productIds) ? r.productIds : [],
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : []
      };
    }).filter(Boolean);

    const bank250 = (window.MoaathAIRecipes && Array.isArray(window.MoaathAIRecipes.recipes))
      ? window.MoaathAIRecipes.recipes
      : [];

    return [...adminList, ...bank250, ...DEFAULT_RECIPES];
  }

  function matchRecipeOrSweet(normText) {
    const allRecipes = getAllMergedRecipes();
    const matched = allRecipes.find(r => {
      const tNorm = cleanArabicNorm(r.title);
      if (tNorm && (normText.includes(tNorm) || (normText.length >= 3 && tNorm.includes(normText)))) return true;
      return (r.keywords || []).some(kw => {
        const kNorm = cleanArabicNorm(kw);
        return kNorm.length >= 2 && normText.includes(kNorm);
      });
    });

    if (!matched) return null;

    const learned = getLearnedMap()[`recipe_${matched.title}`] || {};
    const availableItems = [];
    const missingIngredients = [];

    (matched.productIds || []).forEach(pid => {
      const p = products?.[pid];
      if (!p) return;
      if (getBranchAvail(pid) > 0) {
        availableItems.push({ id: pid, name: p.name, reason: `من احتياجات (${matched.title})`, score: (learned[pid] || 0) + 15 });
      } else {
        missingIngredients.push(p.name);
      }
    });

    const prodEntries = Object.keys(products || {}).map(pid => {
      const p = products[pid];
      if (!p) return null;
      return { pid, p, st: getBranchAvail(pid), pNorm: cleanArabicNorm(p.name || "") };
    }).filter(Boolean);

    (matched.ingredients || []).forEach(ing => {
      const iNorm = cleanArabicNorm(ing);
      if (!iNorm) return;
      const found = prodEntries.find(x => x.pNorm.includes(iNorm) && x.st > 0);
      if (found) {
        if (!availableItems.some(a => a.id === found.pid)) {
          availableItems.push({ id: found.pid, name: found.p.name, reason: `متوفر للوصفة (${ing})`, score: learned[found.pid] || 0 });
        }
      } else {
        missingIngredients.push(ing);
      }
    });

    availableItems.sort((a, b) => b.score - a.score);
    if (window.MoaathAIBrain) {
      if (typeof window.MoaathAIBrain.recordRecipeUsage === "function") {
        window.MoaathAIBrain.recordRecipeUsage(matched.title);
      }
      if (typeof window.MoaathAIBrain.getPreferredQty === "function") {
        availableItems.forEach(it => {
          it.suggestedQty = window.MoaathAIBrain.getPreferredQty(it.id, 1);
        });
      }
    }
    return { recipe: matched, availableItems: availableItems.slice(0, 8), missingIngredients };
  }

  function matchCasualChat(normText, persona) {
    if (/^(ال)?سلام\s*عليكم|السلام/.test(normText)) return composeInfinitePhrase("greet", persona);
    if (/^(مرحبا|اهلا|هلا|هاي|صباح\s*الخير|مساء\s*الخير)/.test(normText)) return composeInfinitePhrase("greet", persona);
    if (/كيف\s*حالك|شلونك|كيفك|شو\s*اخبارك|اخبارك/.test(normText)) return composeInfinitePhrase("chatGood", persona);
    if (/شكرا|مشكور|يعطيك\s*العافيه|يسلمو/.test(normText)) return composeInfinitePhrase("thanks", persona);
    return null;
  }

  function parsePeopleCount(normText) {
    const m = normText.match(/(?:ل|لـ|حق|عدد)?\s*(\d{1,2})\s*(اشخاص|أشخاص|افراد|أفراد|شخص|نفرات|انفار|نفر)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return n >= 1 && n <= 30 ? n : null;
  }

  function handleCartComplementRequest(normText, persona) {
    if (!/(ناقصني|كمل\s*سلت|كمّل\s*سلت|مكملات|اضيف\s*عليها|كملها|شو\s*ناقص)/.test(normText)) return false;
    const keys = Object.keys(cart || {});
    if (!keys.length) {
      const msg = "سلتك فاضية هلق، خبرني بطلبك أو اختر من الاقتراحات السريعة!";
      setOrbEmotion("idle", msg, true);
      setTxt("aiShoppingStatusText", `🛒 ${msg}`);
      return true;
    }
    const inCart = new Set(keys.map(k => cart[k]?.origId || String(k).replace(/_PKG$/, "")));
    const cats = new Set(keys.map(k => cart[k]?.category).filter(Boolean));
    const picks = Object.keys(products || {})
      .filter(pid => !inCart.has(pid) && getBranchAvail(pid) > 0)
      .map(pid => ({
        id: pid,
        name: products[pid].name,
        reason: cats.has(products[pid].category) ? `يكمل قسم (${products[pid].category})` : "مقترح متوفر",
        score: cats.has(products[pid].category) ? 10 : 1
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    if (picks.length) {
      openZeroDefaultModal("🛒 مكملات متوفرة تناسب سلتك الحالية:", picks, "cart_complement");
      const msg = "جهزتلك مكملات متوفرة تناسب سلتك بدون تكرار.";
      setOrbEmotion("choice", msg, true);
      setTxt("aiShoppingStatusText", `🛒 ${msg}`);
      return true;
    }
    return false;
  }

  function handleCheapestAvailableRequest(normText, persona) {
    if (!/(ارخص|أرخص|اوفر|أوفر|عروض\s*توفير|رخيص)/.test(normText)) return false;
    const picks = Object.keys(products || {})
      .filter(pid => getBranchAvail(pid) > 0 && getUnitSYP(pid) > 0)
      .map(pid => ({
        id: pid,
        name: products[pid].name,
        price: getUnitSYP(pid),
        reason: `سعر موفر: ${getUnitSYP(pid).toLocaleString()} ل.س`
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 8);
    if (picks.length) {
      openZeroDefaultModal("💰 أوفر الأصناف المتوفرة في الفرع:", picks, "cheapest_picks");
      const msg = "رتبتلك أوفر الأصناف المتوفرة حالياً، حدد الكمية.";
      setOrbEmotion("choice", msg, true);
      setTxt("aiShoppingStatusText", `💰 ${msg}`);
      return true;
    }
    return false;
  }

  function handlePersonalHabitsRequest(normText) {
    if (!/(مفضلاتي|عادات|معتاد|المعتادة|توقعات|اعاده\s*طلب|إعادة\s*طلب|مقترحاتي)/.test(normText)) return false;
    if (window.MoaathAIBrain && typeof window.MoaathAIBrain.getPersonalHabitSuggestions === "function") {
      const habitPicks = window.MoaathAIBrain.getPersonalHabitSuggestions(products || {}, getBranchAvail, 6);
      const predictivePicks = typeof window.MoaathAIBrain.getPredictiveReorderSuggestions === "function"
        ? window.MoaathAIBrain.getPredictiveReorderSuggestions(products || {}, getBranchAvail, 4)
        : [];
      const merged = [...habitPicks];
      predictivePicks.forEach(pp => {
        if (!merged.some(m => m.id === pp.id)) merged.push(pp);
      });
      if (merged.length > 0) {
        openZeroDefaultModal("⭐ مفضلاتك وتوقعات التعلم الذاتي المتوفرة:", merged.slice(0, 8), "personal_habits");
        const prefs = getPrefs();
        const msg = (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.getHabitReaction === "function")
          ? window.MoaathAIPersonas.getHabitReaction(prefs.persona)
          : "عرضت لك الأصناف التي تعتاد اختيارها وتوقعات التعلم الذاتي، حدد الكمية.";
        setOrbEmotion("happy", msg, true);
        setTxt("aiShoppingStatusText", `⭐ ${msg}`);
        return true;
      }
    }
    return false;
  }

  function handleRepeatPreviousOrder(normText, persona) {
    if (!/(كرر\s*طلبي|طلبي\s*السابق|اخر\s*طلب|آخر\s*طلب)/.test(normText)) return false;
    if (sessionCtx.lastModalItems.length > 0) {
      openZeroDefaultModal(sessionCtx.lastModalTitle, sessionCtx.lastModalItems, sessionCtx.lastModalIntent, sessionCtx.lastModalSubtitle);
      const msg = "فتحتلك آخر قائمة اقتراحات لك بنقرة واحدة.";
      setOrbEmotion("happy", msg, true);
      setTxt("aiShoppingStatusText", `🔁 ${msg}`);
      return true;
    }
    const histList = Object.values(completedOrdersHistory || {});
    const lastOrd = histList.length ? histList[histList.length - 1] : null;
    if (lastOrd && Array.isArray(lastOrd.items) && lastOrd.items.length) {
      const items = lastOrd.items
        .map(it => {
          const pid = it.origId || String(it.id || "").replace(/_PKG$/, "");
          if (!pid || !products?.[pid] || getBranchAvail(pid) <= 0) return null;
          return { id: pid, name: products[pid].name, suggestedQty: parseInt(it.qty, 10) || 1, reason: `من طلبك السابق (الكمية: ${it.qty || 1})` };
        })
        .filter(Boolean)
        .slice(0, 8);
      if (items.length) {
        openZeroDefaultModal("🔁 تكرار أصناف طلبك السابق المتوفرة:", items, "repeat_last_order");
        const msg = "جبتلك الأصناف المتوفرة من طلبك السابق، اضغط تحديد المتوفر أو زائد.";
        setOrbEmotion("happy", msg, true);
        setTxt("aiShoppingStatusText", `🔁 ${msg}`);
        return true;
      }
    }
    const msg = "ما في طلب سابق محفوظ بعد، جرّب طبخة اليوم أو سهرة ومتة!";
    setOrbEmotion("idle", msg, true);
    setTxt("aiShoppingStatusText", `🔁 ${msg}`);
    return true;
  }

  function openZeroDefaultModal(title, items, intentKey = "general", subtitleNote = "") {
    const cappedItems = items.slice(0, 8);
    sessionCtx.lastModalTitle = title;
    sessionCtx.lastModalItems = cappedItems;
    sessionCtx.lastModalIntent = intentKey;
    sessionCtx.lastModalSubtitle = subtitleNote;

    modalItemsState = cappedItems.map(it => ({
      id: it.id,
      name: it.name,
      qty: 0,
      suggestedQty: Math.max(1, parseInt(it.suggestedQty, 10) || 1),
      unitPrice: getUnitSYP(it.id),
      thumb: getThumb(it.id),
      reason: it.reason || ""
    }));
    window._currentIntentKey = intentKey;

    let modal = $("petSuggestionsFloatingModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "petSuggestionsFloatingModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10030; background:rgba(0,0,0,0.78);";
      modal.innerHTML = `
        <div class="modal-content" style="max-width:440px; border-color:var(--gold-color);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:6px;">
            <b id="petSugModalTitle" style="color:var(--gold-color); font-size:13px;"></b>
            <div style="display:flex; gap:4px;">
              <button type="button" onclick="selectAllZeroDefaultSuggestions()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,230,118,0.16); color:#00e676; border:1px solid #00e676;">تحديد المتوفر</button>
              <button type="button" onclick="resetZeroDefaultSuggestions()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color);">تصفير</button>
              <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:11px;">✕</button>
            </div>
          </div>
          <div id="petSugModalSubtitle" style="font-size:10px; color:var(--gray-text); margin-bottom:8px;"></div>
          <div id="petSugModalList" style="max-height:52vh; overflow-y:auto; margin-bottom:10px;"></div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:10px; padding:6px 8px; background:var(--bg-color); border-radius:6px;">
            <span>إجمالي ما اخترته:</span>
            <strong id="petSugModalTotal" style="color:#00e676; font-size:14px;">0 ل.س</strong>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" onclick="confirmFloatingSuggestions()" class="btn" style="flex:2; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">✅ إضافة للسلة</button>
            <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="flex:1;">إلغاء</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    setTxt("petSugModalTitle", title);
    setTxt("petSugModalSubtitle", subtitleNote || "الكمية الافتراضية 0 — اضغط (+) لزيادة الكمية المطلوبة من الأصناف المتوفرة:");
    renderZeroDefaultList();
  }

  window.selectAllZeroDefaultSuggestions = function () {
    modalItemsState.forEach(it => {
      const maxAvail = getBranchAvail(it.id);
      if (maxAvail > 0) it.qty = Math.min(maxAvail, it.suggestedQty || 1);
    });
    haptic(12);
    renderZeroDefaultList();
  };

  window.resetZeroDefaultSuggestions = function () {
    modalItemsState.forEach(it => { it.qty = 0; });
    haptic(10);
    renderZeroDefaultList();
  };

  function renderZeroDefaultList() {
    const listEl = $("petSugModalList");
    if (!listEl) return;
    let total = 0;

    listEl.innerHTML = modalItemsState.map((it, idx) => {
      const lineTotal = it.unitPrice * it.qty;
      total += lineTotal;
      const isSelected = it.qty > 0;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; background:var(--bg-color); border:1px solid ${isSelected ? "var(--gold-color)" : "var(--border-color)"}; border-radius:8px; padding:7px; margin-bottom:7px;">
          <img src="${esc(it.thumb)}" onerror="this.onerror=null;this.src='store-icon.png';" style="width:42px; height:42px; border-radius:6px; object-fit:cover; flex-shrink:0;">
          <div style="flex:1; min-width:0; text-align:right;">
            <div style="font-size:12px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(it.name)}</div>
            <div style="font-size:10px; color:var(--gold-color);">${it.unitPrice.toLocaleString()} ل.س ${isSelected ? `× ${it.qty} = <b>${lineTotal.toLocaleString()} ل.س</b>` : ""}</div>
            ${it.reason ? `<div style="font-size:9px; color:#00e676;">${esc(it.reason)}</div>` : ""}
          </div>
          <div style="display:flex; align-items:center; gap:5px;">
            <button type="button" onclick="adjustSuggestionQty(${idx}, -1)" class="mini-btn" style="background:var(--card-bg); color:var(--text-color); border:1px solid var(--border-color);">-</button>
            <span style="font-size:13px; font-weight:bold; min-width:20px; text-align:center; color:${isSelected ? "#00e676" : "var(--gray-text)"};">${it.qty}</span>
            <button type="button" onclick="adjustSuggestionQty(${idx}, 1)" class="mini-btn" style="background:var(--gold-color); color:#000;">+</button>
          </div>
        </div>`;
    }).join("");

    setTxt("petSugModalTotal", total.toLocaleString() + " ل.س");
  }

  window.adjustSuggestionQty = function (idx, delta) {
    const it = modalItemsState[idx];
    if (!it) return;
    const maxAvail = getBranchAvail(it.id);
    it.qty = Math.max(0, Math.min(Math.max(0, maxAvail), it.qty + delta));
    haptic(10);
    renderZeroDefaultList();
  };

  window.closePetSuggestionsModal = function (wasConfirmed = false) {
    if (!wasConfirmed && Array.isArray(modalItemsState) && modalItemsState.length) {
      const ignoredIds = modalItemsState.filter(x => (x.qty || 0) === 0).map(x => x.id);
      if (ignoredIds.length && window.MoaathAIBrain && typeof window.MoaathAIBrain.recordIgnoredSuggestions === "function") {
        window.MoaathAIBrain.recordIgnoredSuggestions(ignoredIds);
      }
    }
    const m = $("petSuggestionsFloatingModal");
    if (m) m.style.display = "none";
  };

  window.confirmFloatingSuggestions = function () {
    const chosen = modalItemsState.filter(x => x.qty > 0);
    const intentKey = window._currentIntentKey || "general";
    if (!chosen.length) {
      showToast("⚠️ حدد كمية 1 على الأقل بالضغط على (+)", true);
      return;
    }

    let addedTotal = 0;
    const addedIds = [];
    chosen.forEach(it => {
      const avail = getBranchAvail(it.id);
      const cur = cart[it.id] ? (parseInt(cart[it.id].qty) || 0) : 0;
      const toAdd = Math.min(it.qty, Math.max(0, avail - cur));
      if (toAdd > 0) {
        changeQty(it.id, toAdd);
        addedTotal += toAdd;
        addedIds.push(it.id);
        if (!sessionCtx.lastAddedIds.includes(it.id)) sessionCtx.lastAddedIds.push(it.id);
      }
    });

    if (addedIds.length) {
      recordPracticeLearning(intentKey, addedIds, 2);
      if (window.MoaathAIBrain) {
        if (typeof window.MoaathAIBrain.recordCustomerChoice === "function") {
          chosen.forEach(it => {
            const baseId = String(it.id || "").replace(/_PKG$/, "");
            const cat = products?.[baseId]?.category || specialOffers?.[it.id]?.category || "";
            window.MoaathAIBrain.recordCustomerChoice(it.id, cat, it.qty, sessionCtx.lastQuery || "");
          });
        }
        if (typeof window.MoaathAIBrain.recordBasketCoOccurrence === "function") {
          const allBasketIds = Array.from(new Set([...Object.keys(cart || {}), ...addedIds]));
          window.MoaathAIBrain.recordBasketCoOccurrence(allBasketIds);
        }
        if (typeof window.MoaathAIBrain.recordIgnoredSuggestions === "function") {
          const unchosenIds = modalItemsState.filter(x => (x.qty || 0) === 0).map(x => x.id);
          if (unchosenIds.length) window.MoaathAIBrain.recordIgnoredSuggestions(unchosenIds);
        }
      }
    }
    window.closePetSuggestionsModal(true);

    if (addedTotal > 0) {
      haptic([15, 35, 15]);
      const prefs = getPrefs();
      const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
      const countLabel = addedTotal === 1 ? "صنف واحد" : (addedTotal === 2 ? "صنفين" : `${addedTotal} أصناف`);
      const msg = composeInfinitePhrase("added", persona, { itemLabel: countLabel });
      setOrbEmotion("happy", msg, true);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      showToast(`✅ ${msg}`);
    }
  };

  function matchCategoriesAndProducts(normText) {
    if (window.MoaathAIBrain && typeof window.MoaathAIBrain.smartSearch === "function") {
      const activeCartIds = Object.keys(cart || {}).map(k => cart[k]?.origId || String(k).replace(/_PKG$/, ""));
      return window.MoaathAIBrain.smartSearch(
        sessionCtx.lastQuery || normText,
        products || {},
        categories || [],
        getBranchAvail,
        getUnitSYP,
        activeCartIds
      );
    }

    const storeCats = (Array.isArray(categories) ? categories : []).filter(c => c && c !== "الكل");
    const budgetMatch = normText.match(/(\d{2,7})/);
    const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;

    const words = normText
      .replace(/\b(تجهيز|فاتوره|طلب|اريد|بدي|ابغى|ابي|مواد|اغراض|وصفه|وصفة|حلى|حلويات|طبخ|بـ|ب|\d+)\b/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 2);

    const matchedCategories = storeCats.filter(catName => {
      const cNorm = cleanArabicNorm(catName);
      return words.some(w => cNorm.includes(w) || w.includes(cNorm));
    });

    const learned = getLearnedMap();
    const availableResults = [];
    let outOfStockCategory = null;

    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p) return;
      const st = getBranchAvail(pid);
      const price = getUnitSYP(pid);
      const pNameNorm = cleanArabicNorm(p.name || "");
      const pCat = p.category || "";
      const inCat = matchedCategories.includes(pCat);
      const hitName = words.some(w => pNameNorm.includes(w));

      if (inCat || hitName) {
        if (st <= 0) {
          outOfStockCategory = outOfStockCategory || pCat;
          return;
        }
        if (maxBudget && price > maxBudget) return;
        availableResults.push({
          id: pid,
          name: p.name,
          reason: inCat ? `قسم: ${pCat}` : "متوفر في الفرع",
          score: (hitName ? 20 : 0) + (inCat ? 10 : 0) + (learned[pCat]?.[pid] || 0)
        });
      }
    });

    if (!availableResults.length && outOfStockCategory) {
      Object.keys(products || {}).forEach(pid => {
        const p = products[pid];
        if (!p || p.category !== outOfStockCategory || getBranchAvail(pid) <= 0) return;
        availableResults.push({
          id: pid,
          name: p.name,
          reason: `بديل متوفر في قسم (${outOfStockCategory})`,
          score: 5
        });
      });
    }

    availableResults.sort((a, b) => b.score - a.score);
    return { matchedCategories, items: availableResults.slice(0, 8), usedAlternative: !!outOfStockCategory };
  }

  window.runAIShoppingAssistant = async function (overridePrompt = null) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    sessionCtx.lastQuery = promptTxt;
    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;

    if (!promptTxt) {
      setOrbEmotion("idle", `${persona.name}: اضغط مطوّلاً وتحدّث بطلبك.`, true);
      return;
    }

    // إلغاء تدخل الذكاء الاصطناعي في الدفع أو شام كاش تماماً
    if (guardAgainstPaymentAI(promptTxt)) {
      const guardMsg = "التحقق من الدفع وشام كاش ملغى من الذكاء الاصطناعي ويتم يدوياً بالكامل.";
      setOrbEmotion("idle", guardMsg, false);
      setTxt("aiShoppingStatusText", `🔒 ${guardMsg}`);
      return;
    }

    const norm = cleanArabicNorm(promptTxt);

    if (handleMultiTurnDialog(norm, persona)) return;

    const chatReply = matchCasualChat(norm, persona);
    if (chatReply) {
      setOrbEmotion("greet", chatReply, true);
      setTxt("aiShoppingStatusText", `🧚 ${chatReply}`);
      return;
    }

    const followUpReply = handleSessionFollowUp(norm);
    if (followUpReply) {
      setOrbEmotion("happy", followUpReply, true);
      setTxt("aiShoppingStatusText", `🔄 ${followUpReply}`);
      return;
    }

    const liveReply = answerLiveStoreQueries(norm);
    if (liveReply) {
      setOrbEmotion("greet", liveReply, true);
      setTxt("aiShoppingStatusText", `⏰ ${liveReply}`);
      return;
    }

    if (handleCartComplementRequest(norm, persona)) return;
    if (handleCheapestAvailableRequest(norm, persona)) return;
    if (handlePersonalHabitsRequest(norm)) return;
    if (handleRepeatPreviousOrder(norm, persona)) return;

    const peopleCount = parsePeopleCount(norm);
    const suggestedPerItem = peopleCount && peopleCount >= 5 ? Math.min(4, Math.ceil(peopleCount / 3)) : 1;

    // دعم طلبات الرياضة والصحة (خاصة مع البطل الرياضي أو أي شخصية)
    if (/(رياضه|رياضة|صحي|صحه|صحة|دايت|بروتين|تمرين|لياقه|لياقة|طاقة)/.test(norm)) {
      const healthyKw = /(عدس|مجدره|مجدرة|شوربه|شوربة|حليب|لبن|بيض|رز|ارز|برغل|شوفان|عسل|ماء|عصير|خضار|فواكه|تونه|تونة)/;
      const healthyItems = Object.keys(products || {})
        .filter(pid => {
          const p = products[pid];
          if (!p || getBranchAvail(pid) <= 0) return false;
          const txt = cleanArabicNorm((p.name || "") + " " + (p.category || ""));
          return healthyKw.test(txt);
        })
        .slice(0, 8)
        .map(pid => ({
          id: pid,
          name: products[pid].name,
          suggestedQty: suggestedPerItem,
          reason: "خيار صحي ومناسب للرياضة والنشاط"
        }));
      if (healthyItems.length > 0) {
        openZeroDefaultModal("🏋️ خيارات صحية ومغذية للرياضة والنشاط:", healthyItems, "sports_health");
        const msg = persona.id === "athlete"
          ? "يا بطل، جهزتلك خيارات صحية ومغذية تعطي طاقة، حدد الكمية."
          : "جهزتلك خيارات صحية مناسبة للرياضة والنشاط، حدد الكمية.";
        setOrbEmotion("choice", msg, true);
        setTxt("aiShoppingStatusText", `🏋️ ${msg}`);
        return;
      }
    }

    // دعم طلبات وصفات الطعام (الطباخ الماهر) أو الحلويات (صانعة الحلويات)
    if (/(وصفه|وصفة|اكله|أكلة|طبخه|طبخة|غداء|عشاء)/.test(norm) && !matchRecipeOrSweet(norm)) {
      const allRecs = getAllMergedRecipes();
      const wantsSweets = persona.id === "pastry" || /(حلى|حلويات|حلو|كيك|بسبوسه|بسبوسة|مهلبيه|مهلبية)/.test(norm);
      const filteredRecs = allRecs.filter(r => {
        const isSweet = r.category === "حلويات";
        return wantsSweets ? isSweet : (!isSweet && r.category !== "تنظيف");
      });
      if (filteredRecs.length > 0) {
        const sampleTitles = filteredRecs.slice(0, 5).map(r => r.title).join("، ");
        const msg = wantsSweets
          ? `من حلويات الإدارة عندنا: ${sampleTitles}. اذكر اسم الحلى وأجهز المتوفر!`
          : `من وصفات الطعام عندنا: ${sampleTitles}. اذكر اسم الطبخة وأجهز مكوناتها!`;
        setOrbEmotion("choice", msg, true);
        setTxt("aiShoppingStatusText", `🍲 ${msg}`);
        return;
      }
    }

    const recipeRes = matchRecipeOrSweet(norm);
    if (recipeRes) {
      if (recipeRes.availableItems.length > 0) {
        const enrichedItems = recipeRes.availableItems.map(it => ({
          ...it,
          suggestedQty: suggestedPerItem,
          reason: peopleCount ? `${it.reason} • مقترح لـ ${peopleCount} أشخاص: ${suggestedPerItem}` : it.reason
        }));
        const missingNote = recipeRes.missingIngredients.length
          ? ` | غير متوفر حالياً: ${recipeRes.missingIngredients.slice(0, 4).join("، ")}`
          : " | جميع المكونات الأساسية متوفرة";
        const peopleNote = peopleCount ? ` (لـ ${peopleCount} أشخاص)` : "";
        openZeroDefaultModal(
          `🍲 ${recipeRes.recipe.title}${peopleNote} — المتوفر في الفرع:`,
          enrichedItems,
          `recipe_${recipeRes.recipe.title}`,
          `الكمية الافتراضية 0 — اضغط (+) أو «تحديد المتوفر»${missingNote}`
        );
        const msg = persona.recipeReady(recipeRes.recipe.title);
        setOrbEmotion("choice", msg, true);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        return;
      } else {
        const noStockMsg = persona.recipeMissing(recipeRes.recipe.title);
        setOrbEmotion("idle", noStockMsg, true);
        setTxt("aiShoppingStatusText", `⚠️ ${noStockMsg}`);
        return;
      }
    }

    const { matchedCategories, items, usedAlternative, usedFuzzy, usedSynonym } = matchCategoriesAndProducts(norm);
    if (items.length > 0) {
      const title = usedAlternative
        ? "🔁 الصنف المطلوب نافد — إليك أقرب البدائل المتوفرة:"
        : matchedCategories.length
          ? `🛍️ أصناف قسم (${matchedCategories.join("، ")}) — حدد الكمية:`
          : "🛍️ الأصناف المتوفرة المطابقة — حدد الكمية:";
      openZeroDefaultModal(title, items, matchedCategories[0] || `q_${norm.slice(0, 18)}`);
      const msg = (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.getSearchReaction === "function")
        ? window.MoaathAIPersonas.getSearchReaction(persona.id, { matchedCategories, usedAlternative, usedFuzzy, usedSynonym })
        : (usedAlternative ? "الصنف غير متوفر حالياً، عرضت لك أقرب البدائل المتوفرة." : persona.itemsReady(matchedCategories.join(" و")));
      setOrbEmotion("choice", msg, true);
      setTxt("aiShoppingStatusText", `💡 ${msg}`);
      return;
    }

    // خيار أخير: استدعاء الذكاء الاصطناعي التفاعلي (companion_shop) مع حظر تام لأي أمر دفع
    const workerUrl = resolveWorkerEndpoint();
    if (workerUrl && navigator.onLine !== false) {
      setOrbEmotion("thinking", "جاري البحث الذكي في أصناف المتجر...", false);
      try {
        const catalogSummary = Object.keys(products || {})
          .filter(pid => getBranchAvail(pid) > 0)
          .slice(0, 85)
          .map(pid => ({ id: pid, name: products[pid].name, cat: products[pid].category || "", price: getUnitSYP(pid) }));
        const currentCartSummary = Object.keys(cart || {}).map(k => ({ id: k, name: cart[k]?.name || "", qty: cart[k]?.qty || 0 }));
        const aiRes = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "companion_shop",
            prompt: promptTxt,
            catalog: catalogSummary,
            currentCart: currentCartSummary,
            storeMeta: { persona: persona.name, dialectMode: persona.dialectMode || "shami_friendly", branch: typeof activeBranchId !== "undefined" ? activeBranchId : "main" }
          })
        });
        const aiJson = await aiRes.json();
        const aiData = aiJson?.data || {};
        const aiItems = [];
        (Array.isArray(aiData.items) ? aiData.items : []).forEach(it => {
          if (it?.id && products?.[it.id] && getBranchAvail(it.id) > 0) {
            aiItems.push({ id: it.id, name: products[it.id].name, reason: it.reason || "اقتراح ذكي" });
          }
        });
        (Array.isArray(aiData.choices) ? aiData.choices : []).forEach(ch => {
          if (ch?.id && products?.[ch.id] && getBranchAvail(ch.id) > 0 && !aiItems.some(x => x.id === ch.id)) {
            aiItems.push({ id: ch.id, name: products[ch.id].name, reason: ch.reason || "خيار مقترح" });
          }
        });

        if (aiItems.length > 0) {
          const replyTxt = String(aiData.reply || persona.itemsReady("")).trim();
          openZeroDefaultModal("✨ اقتراحات المساعد الذكي — حدد الكمية:", aiItems, `ai_${norm.slice(0, 16)}`);
          setOrbEmotion("choice", replyTxt, true);
          setTxt("aiShoppingStatusText", `✨ ${replyTxt}`);
          return;
        }
        if (aiData.reply) {
          setOrbEmotion("greet", aiData.reply, true);
          setTxt("aiShoppingStatusText", `🧚 ${aiData.reply}`);
          return;
        }
      } catch (_) {}
    }

    const nfLine = composeInfinitePhrase("notFound", persona);
    setOrbEmotion("idle", nfLine, true);
    setTxt("aiShoppingStatusText", `⚠️ ${nfLine}`);
  };

  function beginLongPressVoice() {
    unlockEmbeddedVoice();
    stopEmbeddedVoice();
    pauseRoaming(12000);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showBubble("المتصفح لا يدعم الميكروفون، اكتب طلبك أو وصفتك في الخانة.", 3600);
      return;
    }
    if (activeRecognizer) {
      try { activeRecognizer.stop(); } catch (_) {}
      activeRecognizer = null;
    }

    isHoldingSpeak = true;
    haptic(25);
    updateVoiceSourceBadge("🎙️ يستمع...", "#00e676", "الميكروفون نشط الآن");
    const directMic = $("petDirectMicBtn");
    if (directMic) directMic.classList.add("mic-listening-pulse");
    setOrbEmotion("listening", "تحدّث الآن... أسمعك بوضوح", false);

    const rec = new SR();
    activeRecognizer = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = ev => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) {
        setOrbEmotion("idle", "لم أسمع صوتاً واضحاً، جرّب النقر المطوّل مرة أخرى.", true);
        return;
      }
      setVal("aiShoppingPromptInput", heard);
      window.runAIShoppingAssistant(heard);
    };

    rec.onerror = () => setOrbEmotion("idle", "تعذر التقاط الصوت، تأكد من إذن الميكروفون.", true);
    rec.onend = () => {
      isHoldingSpeak = false;
      activeRecognizer = null;
      const r = $("petListenRing");
      if (r) r.style.display = "none";
      const directMic = $("petDirectMicBtn");
      if (directMic) directMic.classList.remove("mic-listening-pulse");
      updateVoiceSourceBadge("🟢 جاهز", "#00e676", "جاهز");
    };

    rec.start();
  }

  function endLongPressVoice() {
    if (!isHoldingSpeak) return;
    isHoldingSpeak = false;
    if (activeRecognizer) {
      setTimeout(() => { try { activeRecognizer && activeRecognizer.stop(); } catch (_) {} }, 350);
    }
  }

  window.startVoiceShoppingInput = function () {
    beginLongPressVoice();
    setTimeout(endLongPressVoice, 4500);
  };

  function bindOrbInteractions(orb, root) {
    if (!orb || !root || orb.dataset.orbBound) return;
    orb.dataset.orbBound = "1";

    ensureGroundShadow(root);

    let down = false, dragging = false, holdFired = false, holdTimer = null;
    let sx = 0, sy = 0, r0 = 14, b0 = 88;

    const onDown = e => {
      unlockEmbeddedVoice();
      pauseRoaming(9500);
      orb.classList.remove("is-roaming");
      const pt = e.touches ? e.touches[0] : e;
      down = true; dragging = false; holdFired = false;
      sx = pt.clientX; sy = pt.clientY;
      r0 = parseInt(root.style.right || "14", 10);
      b0 = parseInt(root.style.bottom || "88", 10);
      orb.style.transform = "scale(1.08)";

      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (down && !dragging) {
          holdFired = true;
          beginLongPressVoice();
        }
      }, 550);
    };

    const onMove = e => {
      if (!down) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - sx, dy = pt.clientY - sy;

      if (!dragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        dragging = true;
        clearTimeout(holdTimer);
        if (holdFired) endLongPressVoice();
      }

      if (dragging) {
        const nr = Math.max(8, Math.min(Math.max(8, window.innerWidth - 76), r0 - dx));
        const nb = Math.max(84, Math.min(Math.max(84, window.innerHeight - 98), b0 - dy));
        root.style.right = nr + "px";
        root.style.bottom = nb + "px";
        orb.style.transform = `scale(1.06) rotateX(${Math.max(-14, Math.min(14, -dy * 0.25))}deg) rotateY(${Math.max(-14, Math.min(14, dx * 0.25))}deg)`;
      }
    };

    const onUp = () => {
      if (!down) return;
      down = false;
      clearTimeout(holdTimer);
      orb.style.transform = "";
      orb.classList.add("is-roaming");

      if (holdFired) {
        endLongPressVoice();
        return;
      }

      if (dragging) {
        dragging = false;
        const curR = parseInt(root.style.right || "14", 10);
        const curB = parseInt(root.style.bottom || "88", 10);
        const snapR = (window.innerWidth - curR - 30) >= window.innerWidth / 2 ? 12 : Math.max(12, window.innerWidth - 76);
        root.style.transition = "right 0.25s ease, bottom 0.25s ease";
        root.style.right = snapR + "px";
        setTimeout(() => {
          root.style.transition = "right 1.15s cubic-bezier(0.22, 1, 0.36, 1), bottom 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease";
        }, 260);
        savePos(snapR, curB);
        haptic(12);
        return;
      }

      const prefs = getPrefs();
      const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
      const phrase = sessionCtx.lastSpokenText || persona.greet;
      showBubble(`🧚 ${phrase}`, 4000);
      speakOutLoud(phrase, true);
    };

    orb.addEventListener("contextmenu", e => e.preventDefault());
    orb.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    orb.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    window.addEventListener("scroll", () => {
      if (isHoldingSpeak) return;
      pauseRoaming(4500);
      root.style.opacity = "0.48";
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { root.style.opacity = "1"; }, 550);
    }, { passive: true });
  }

  window.toggleRecipeProductTag = function (pid) {
    if (!pid) return;
    if (selectedRecipeProductIds.has(pid)) selectedRecipeProductIds.delete(pid);
    else selectedRecipeProductIds.add(pid);
    renderRecipeProductPicker();
  };

  function renderRecipeProductPicker() {
    const box = $("admRecipeProductsPicker");
    if (!box) return;
    const q = cleanArabicNorm($("admRecipeProdSearch")?.value || "");
    const keys = Object.keys(products || {}).filter(pid => {
      const p = products[pid];
      if (!p) return false;
      if (!q) return true;
      return cleanArabicNorm(p.name || "").includes(q);
    }).slice(0, 30);

    box.innerHTML = keys.map(pid => {
      const p = products[pid];
      const active = selectedRecipeProductIds.has(pid);
      return `<button type="button" onclick="toggleRecipeProductTag('${pid}')" style="padding:4px 8px; border-radius:12px; font-size:10px; cursor:pointer; border:1px solid ${active ? "#00e676" : "var(--border-color)"}; background:${active ? "rgba(0,230,118,0.2)" : "var(--bg-color)"}; color:${active ? "#00e676" : "var(--text-color)"}; font-weight:${active ? "bold" : "normal"};">${active ? "✓ " : "+ "}${esc(p.name)}</button>`;
    }).join("");
  }

  const LOCAL_RECIPES_KEY = "moaath_store_local_recipes";

  function loadLocalRecipesFallback() {
    try {
      const d = JSON.parse(localStorage.getItem(LOCAL_RECIPES_KEY) || "{}");
      return d && typeof d === "object" ? d : {};
    } catch (_) {
      return {};
    }
  }

  function saveLocalRecipeFallback(recipeObj) {
    const cur = loadLocalRecipesFallback();
    cur[recipeObj.id] = recipeObj;
    localStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(cur));
    customRecipesDB = { ...loadLocalRecipesFallback(), ...(customRecipesDB || {}), [recipeObj.id]: recipeObj };
  }

  function deleteLocalRecipeFallback(rId) {
    const cur = loadLocalRecipesFallback();
    if (cur[rId]) {
      delete cur[rId];
      localStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(cur));
    }
    if (customRecipesDB && customRecipesDB[rId]) {
      delete customRecipesDB[rId];
    }
  }

  window.saveAdminRecipe = function () {
    const editId = ($("admRecipeEditId")?.value || "").trim();
    const title = ($("admRecipeTitle")?.value || "").trim();
    const category = $("admRecipeCategory")?.value || "طبخ";
    const kwRaw = ($("admRecipeKeywords")?.value || "").trim();
    const ingRaw = ($("admRecipeIngredients")?.value || "").trim();

    if (!title) return alert("⚠️ يرجى إدخال اسم الوصفة أولاً.");
    const keywords = kwRaw ? kwRaw.split(/[،,]/).map(s => s.trim()).filter(Boolean) : [title];
    if (!keywords.includes(title)) keywords.unshift(title);
    const ingredients = ingRaw ? ingRaw.split(/[،,]/).map(s => s.trim()).filter(Boolean) : [];
    const productIds = Array.from(selectedRecipeProductIds);

    if (!ingredients.length && !productIds.length) {
      return alert("⚠️ يرجى تحديد احتياجات الوصفة من منتجات المتجر أو كتابة أسماء المكونات.");
    }

    const rId = editId || ("REC_" + Date.now());
    const payload = {
      id: rId,
      title,
      category,
      keywords,
      ingredients,
      productIds,
      updatedAt: new Date().toISOString()
    };

    const finishLocalSave = (noteToast) => {
      saveLocalRecipeFallback(payload);
      resetAdminRecipeForm();
      if (typeof window.renderAdminRecipesList === "function") window.renderAdminRecipesList();
      showToast(noteToast);
    };

    if (typeof db === "undefined" || !db || typeof db.ref !== "function") {
      finishLocalSave(`✅ تم حفظ وصفة (${title}) محلياً على الجهاز!`);
      return;
    }

    db.ref(`recipes/${rId}`).set(payload).then(() => {
      saveLocalRecipeFallback(payload);
      resetAdminRecipeForm();
      if (typeof window.renderAdminRecipesList === "function") window.renderAdminRecipesList();
      showToast(`✅ تم حفظ وصفة (${title}) بنجاح!`);
    }).catch(err => {
      const msg = String(err?.message || err || "");
      if (/permission_denied/i.test(msg)) {
        finishLocalSave(`✅ تم حفظ وصفة (${title}) محلياً (صلاحيات Firebase على المسار recipes مغلقة).`);
      } else {
        finishLocalSave(`✅ تم حفظ وصفة (${title}) محلياً بعد تعذر الحفظ السحابي.`);
      }
    });
  };

  window.editAdminRecipe = function (rId) {
    const r = customRecipesDB?.[rId];
    if (!r) return;
    setVal("admRecipeEditId", rId);
    setVal("admRecipeTitle", r.title || "");
    setVal("admRecipeCategory", r.category || "طبخ");
    setVal("admRecipeKeywords", (r.keywords || []).join("، "));
    setVal("admRecipeIngredients", (r.ingredients || []).join("، "));
    selectedRecipeProductIds = new Set(Array.isArray(r.productIds) ? r.productIds : []);
    renderRecipeProductPicker();
    showToast(`✏️ تم جلب وصفة (${r.title}) للتعديل`);
  };

  window.deleteAdminRecipe = function (rId) {
    const r = customRecipesDB?.[rId];
    if (!r || !confirm(`هل تريد حذف وصفة (${r.title}) نهائياً؟`)) return;
    deleteLocalRecipeFallback(rId);
    if (typeof window.renderAdminRecipesList === "function") window.renderAdminRecipesList();
    if (typeof db !== "undefined" && db && typeof db.ref === "function") {
      db.ref(`recipes/${rId}`).set(null).then(() => showToast("🗑️ تم حذف الوصفة")).catch(() => showToast("🗑️ تم حذف الوصفة محلياً"));
    } else {
      showToast("🗑️ تم حذف الوصفة محلياً");
    }
  };

  window.resetAdminRecipeForm = function () {
    ["admRecipeEditId", "admRecipeTitle", "admRecipeKeywords", "admRecipeIngredients", "admRecipeProdSearch"].forEach(k => setVal(k, ""));
    setVal("admRecipeCategory", "طبخ");
    selectedRecipeProductIds = new Set();
    renderRecipeProductPicker();
  };

  window.renderAdminRecipesList = function () {
    const box = $("admRecipesSavedList");
    if (!box) return;
    const filterQ = cleanArabicNorm($("admRecipeListFilter")?.value || "");
    const list = Object.values(customRecipesDB || {}).filter(r => {
      if (!r || !r.title) return false;
      if (!filterQ) return true;
      return cleanArabicNorm(r.title + " " + (r.category || "")).includes(filterQ);
    });

    if (!list.length) {
      box.innerHTML = `<div style="font-size:11px; color:var(--gray-text); text-align:center; padding:8px;">لا توجد وصفات مطابقة (الوصفات الافتراضية تعمل تلقائياً).</div>`;
      return;
    }
    box.innerHTML = list.map(r => {
      const linkedNames = (r.productIds || []).map(pid => products?.[pid]?.name).filter(Boolean);
      const totalNeedsCount = linkedNames.length + (r.ingredients || []).length;
      const allNeeds = [...linkedNames, ...(r.ingredients || [])].join("، ");
      return `<div class="adm-card" style="border-color:var(--gold-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <b style="color:var(--gold-color);">🍲 ${esc(r.title)} <small style="color:#00e676;">[${esc(r.category || "طبخ")} • ${totalNeedsCount} مكونات]</small></b>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="editAdminRecipe('${r.id}')" class="btn" style="width:auto; padding:3px 8px; font-size:10px;">✏️</button>
            <button type="button" onclick="deleteAdminRecipe('${r.id}')" class="btn btn-danger" style="width:auto; padding:3px 8px; font-size:10px;">🗑️</button>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-color);">الاحتياجات: ${esc(allNeeds || "-")}</div>
      </div>`;
    }).join("");
  };

  window.showVoiceDiagnosticOnPhone = async function () {
    let cachedCount = 0;
    try {
      if (typeof caches !== "undefined") {
        const cache = await caches.open(PERSISTENT_TTS_CACHE_NAME);
        const keys = await cache.keys();
        cachedCount = keys.length;
      }
    } catch (_) {}

    const wUrl = resolveWorkerEndpoint() || "غير مضبوط";
    const srcNow = sessionCtx.lastTtsSource || "لم يتم النطق بعد";
    const errNow = sessionCtx.lastGeminiError || "لا يوجد خطأ مسجل";
    const netNow = navigator.onLine !== false ? "متصل" : "غير متصل";

    let box = document.getElementById("moaathVoiceDiagModal");
    if (!box) {
      box = document.createElement("div");
      box.id = "moaathVoiceDiagModal";
      box.style.cssText = "position:fixed; inset:0; z-index:20000; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; padding:14px;";
      document.body.appendChild(box);
    }

    const escTxt = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    box.innerHTML = `
      <div style="background:#111827; color:#f9fafb; border:1.5px solid #d4af37; border-radius:12px; max-width:380px; width:100%; padding:14px; font-size:12px; line-height:1.7; text-align:right; box-shadow:0 12px 30px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #374151; padding-bottom:8px; margin-bottom:10px;">
          <b style="color:#fbbf24; font-size:13px;">📊 تشخيص الصوت البشري</b>
          <button type="button" onclick="document.getElementById('moaathVoiceDiagModal').style.display='none'" style="background:#ef4444; color:#fff; border:none; border-radius:6px; padding:2px 9px; font-size:12px; cursor:pointer;">✕</button>
        </div>
        <div>• <b>المصدر الحالي:</b> ${escTxt(srcNow)}</div>
        <div>• <b>سبب فشل Gemini TTS:</b> <span style="color:#38bdf8;">${escTxt(errNow)}</span></div>
        <div>• <b>المقاطع البشرية المحفوظة:</b> ${cachedCount}</div>
        <div>• <b>رابط Worker:</b> <span style="word-break:break-all; color:#a7f3d0;">${escTxt(wUrl)}</span></div>
        <div>• <b>الاتصال:</b> ${escTxt(netNow)}</div>
        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <button type="button" onclick="window.resetVoiceCooldownNow()" style="background:#f59e0b; color:#000; font-weight:bold; border:none; border-radius:8px; padding:6px 10px; font-size:11px; cursor:pointer;">إلغاء التبريد</button>
          <button type="button" onclick="document.getElementById('moaathVoiceDiagModal').style.display='none'" style="background:#10b981; color:#000; font-weight:bold; border:none; border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;">حسناً</button>
        </div>
      </div>
    `;
    box.style.display = "flex";
    try { if (typeof showToast === "function") showToast(`المصدر: ${srcNow} | الخطأ: ${errNow}`); } catch (_) {}
  };

  window.runAssistantQACheck = function () {
    const report = {
      version: "v80",
      shamCashPaymentAI: "COMPLETELY_DISABLED",
      resolvedWorkerUrl: resolveWorkerEndpoint() || "NOT_FOUND",
      lastTtsSource: sessionCtx.lastTtsSource || "not_played_yet",
      lastGeminiError: sessionCtx.lastGeminiError || "none",
      fairiesCount: Object.keys(PERSONAS).length,
      productsLoaded: Object.keys(products || {}).length,
      categoriesLoaded: Array.isArray(categories) ? categories.length : 0,
      recipesAvailable: getAllMergedRecipes().length,
      webAudioSupported: !!(window.AudioContext || window.webkitAudioContext),
      speechRecognitionSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      online: navigator.onLine !== false
    };
    console.info("[QA Assistant Diagnostic v70]", report);
    return report;
  };

  function ensureFuturisticStylesInjected() {
    if ($("futuristicUiMasterStyle")) return;
    const st = document.createElement("style");
    st.id = "futuristicUiMasterStyle";
    st.textContent = `

      html, body {
        overflow-y: visible !important;
        height: auto !important;
      }
      body {
        overflow-x: clip !important;
        max-width: 100% !important;
      }

      /* =====================================================================
         [تحسينات واجهة المتجر الكاملة + المساعد الذكي المستقبلي القابل للطي]
         ===================================================================== */
      :root {
        --moaath-radius-lg: 16px;
        --moaath-radius-md: 12px;
        --moaath-radius-pill: 999px;
      }
      body {
        letter-spacing: 0;
        -webkit-font-smoothing: antialiased;
      }
      /* تناسق البطاقات والأقسام في واجهة المتجر */
      .product-card, .offer-card, .adm-card, .adm-sec {
        border-radius: var(--moaath-radius-lg) !important;
        transition: transform 0.2s ease, box-shadow 0.22s ease, border-color 0.22s ease !important;
      }
      .product-card:hover, .offer-card:hover {
        border-color: rgba(212, 175, 55, 0.65) !important;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28) !important;
      }
      /* تهذيب شريط التصنيفات الأفقي */
      .categories {
        gap: 6px !important;
        padding: 6px 2px !important;
        scrollbar-width: none !important;
      }
      .categories::-webkit-scrollbar,
      .fut-quick-chips::-webkit-scrollbar {
        display: none !important;
      }
      .cat-btn {
        border-radius: var(--moaath-radius-pill) !important;
        padding: 6px 13px !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        transition: all 0.18s ease !important;
      }
      /* توحيد أزرار المتجر الرئيسية */
      .btn {
        border-radius: var(--moaath-radius-md) !important;
        font-weight: 700 !important;
        transition: transform 0.16s ease, filter 0.18s ease !important;
      }
      .btn:active {
        transform: scale(0.97) !important;
      }
      .form-control {
        border-radius: var(--moaath-radius-md) !important;
      }
      /* حاوية المساعد والبحث المستقبلية */
      .fut-ai-dock {
        position: relative !important;
        border-radius: 18px !important;
        border: 1px solid rgba(56, 189, 248, 0.35) !important;
        background: linear-gradient(155deg, rgba(15, 23, 42, 0.92), rgba(9, 13, 24, 0.97)) !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        padding: 8px 10px !important;
        margin: 8px 0 10px 0 !important;
        transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      body.light-mode .fut-ai-dock {
        background: linear-gradient(155deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98)) !important;
        border: 1px solid rgba(2, 132, 199, 0.25) !important;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.07) !important;
      }
      .fut-ai-dock.is-dock-collapsed {
        padding: 6px 9px !important;
        border-radius: 999px !important;
      }
      .fut-ai-dock, #aiSmartAssistantBox {
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      .fut-ai-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 6px !important;
        flex-wrap: wrap !important;
        max-width: 100% !important;
      }
      .fut-ai-pill-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(212, 175, 55, 0.18)) !important;
        color: var(--text-color) !important;
        border: 1px solid rgba(212, 175, 55, 0.48) !important;
        border-radius: 999px !important;
        padding: 5px 11px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
        white-space: nowrap !important;
      }
      .fut-dot {
        width: 7px !important;
        height: 7px !important;
        border-radius: 50% !important;
        background: #00e676 !important;
        box-shadow: 0 0 8px #00e676 !important;
        flex-shrink: 0 !important;
      }
      .fut-chev {
        font-size: 10px !important;
        color: var(--gold-color) !important;
      }
      .fut-ai-header-actions {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        flex-shrink: 0 !important;
      }
      .fut-status-badge {
        font-size: 9px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        padding: 2px 5px !important;
        border-radius: 999px !important;
        background: rgba(255, 255, 255, 0.05) !important;
      }
      .fut-icon-btn {
        width: auto !important;
        padding: 4px 8px !important;
        font-size: 10px !important;
        border-radius: 999px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        cursor: pointer !important;
        border: 1px solid transparent !important;
      }
      .fut-mic-btn {
        background: rgba(0, 230, 118, 0.15) !important;
        color: #00e676 !important;
        border-color: rgba(0, 230, 118, 0.35) !important;
      }
      .fut-gold-btn {
        background: rgba(212, 175, 55, 0.15) !important;
        color: var(--gold-color) !important;
        border-color: rgba(212, 175, 55, 0.35) !important;
      }
      .fut-blue-btn {
        background: rgba(56, 189, 248, 0.15) !important;
        color: #38bdf8 !important;
        border-color: rgba(56, 189, 248, 0.35) !important;
      }
      .fut-show-fairy-btn {
        display: inline-flex;
        align-items: center;
        background: var(--gold-color) !important;
        color: #000 !important;
        border: none !important;
        border-radius: 999px !important;
        padding: 4px 8px !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }
      .fut-ai-body {
        max-height: 480px !important;
        opacity: 1 !important;
        overflow: hidden !important;
        margin-top: 8px !important;
        transition: max-height 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, margin-top 0.25s ease !important;
      }
      .fut-ai-body.is-collapsed {
        max-height: 0 !important;
        opacity: 0 !important;
        margin-top: 0 !important;
        pointer-events: none !important;
      }
      .fut-persona-bar {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 6px !important;
        margin-bottom: 5px !important;
        font-size: 10px !important;
      }
      .fut-persona-select-wrap {
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        flex: 1 !important;
        min-width: 0 !important;
      }
      .fut-select {
        padding: 4px 8px !important;
        font-size: 10px !important;
        border-radius: 10px !important;
        flex: 1 !important;
        min-width: 0 !important;
      }
      .fut-sub-toggle-btn {
        background: rgba(56, 189, 248, 0.12) !important;
        color: #38bdf8 !important;
        border: 1px solid rgba(56, 189, 248, 0.32) !important;
        border-radius: 999px !important;
        padding: 3px 8px !important;
        font-size: 9px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        white-space: nowrap !important;
      }
      .fut-specialty-note {
        font-size: 10px !important;
        color: var(--gray-text) !important;
        margin-bottom: 6px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .fut-quick-chips {
        display: flex !important;
        gap: 5px !important;
        overflow-x: auto !important;
        padding: 5px 1px 2px 1px !important;
        margin-top: 5px !important;
        max-height: 46px !important;
        opacity: 1 !important;
        scrollbar-width: none !important;
        transition: max-height 0.26s ease, opacity 0.2s ease, margin-top 0.22s ease !important;
      }
      .fut-quick-chips.is-chips-collapsed {
        max-height: 0 !important;
        opacity: 0 !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        pointer-events: none !important;
      }
      .fut-chip-btn {
        flex-shrink: 0 !important;
        background: rgba(255, 255, 255, 0.05) !important;
        color: var(--text-color) !important;
        border: 1px solid rgba(212, 175, 55, 0.32) !important;
        border-radius: 999px !important;
        padding: 4px 10px !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }
      body.light-mode .fut-chip-btn {
        background: #ffffff !important;
        border-color: rgba(15, 23, 42, 0.14) !important;
      }
      .fut-search-collapsed {
        display: none !important;
      }

      /* نافذة اختيار الجنيات المنبثقة الأنيقة */
      .fairy-picker-trigger {
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
        width: 100% !important;
        background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(56, 189, 248, 0.08)) !important;
        border: 1px solid rgba(212, 175, 55, 0.45) !important;
        border-radius: 999px !important;
        padding: 4px 10px 4px 10px !important;
        cursor: pointer !important;
        font-size: 11px !important;
        transition: border-color 0.2s ease, transform 0.16s ease !important;
      }
      .fairy-picker-trigger:active {
        transform: scale(0.98) !important;
      }
      .fairy-gal-modal {
        max-width: 450px !important;
        width: 94% !important;
        background: linear-gradient(160deg, #141824, #0d1018) !important;
        border: 1.5px solid rgba(212, 175, 55, 0.65) !important;
        border-radius: 20px !important;
        padding: 14px !important;
        color: #f9fafb !important;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 26px rgba(212, 175, 55, 0.16) !important;
      }
      body.light-mode .fairy-gal-modal {
        background: linear-gradient(160deg, #ffffff, #f8fafc) !important;
        color: #0f172a !important;
      }
      .fairy-gal-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1px solid rgba(212, 175, 55, 0.22) !important;
        padding-bottom: 9px !important;
        margin-bottom: 11px !important;
      }
      .fairy-gal-title {
        font-size: 14px !important;
        font-weight: 800 !important;
        color: var(--gold-color) !important;
      }
      .fairy-gal-sub {
        font-size: 10px !important;
        color: var(--gray-text) !important;
        margin-top: 2px !important;
      }
      .fairy-gal-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 9px !important;
        max-height: 56vh !important;
        overflow-y: auto !important;
        padding: 2px !important;
      }
      .fairy-gal-card {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
        background: rgba(255, 255, 255, 0.04) !important;
        border: 1.5px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 16px !important;
        padding: 11px 8px 10px 8px !important;
        cursor: pointer !important;
        color: inherit !important;
        transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
      }
      body.light-mode .fairy-gal-card {
        background: #ffffff !important;
        border-color: rgba(15, 23, 42, 0.1) !important;
      }
      .fairy-gal-card:hover,
      .fairy-gal-card.is-active {
        border-color: var(--f-accent, #d4af37) !important;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35), 0 0 14px color-mix(in srgb, var(--f-accent, #d4af37) 35%, transparent) !important;
        transform: translateY(-2px) !important;
      }
      .fairy-gal-active-pill {
        position: absolute !important;
        top: 6px !important;
        left: 6px !important;
        background: #00e676 !important;
        color: #000 !important;
        font-size: 9px !important;
        font-weight: 800 !important;
        padding: 2px 6px !important;
        border-radius: 999px !important;
      }
      .fairy-gal-avatar-wrap {
        width: 58px !important;
        height: 58px !important;
        border-radius: 50% !important;
        padding: 2px !important;
        border: 2px solid var(--f-accent, #d4af37) !important;
        box-shadow: 0 0 14px color-mix(in srgb, var(--f-accent, #d4af37) 40%, transparent) !important;
        margin-bottom: 6px !important;
        overflow: hidden !important;
      }
      .fairy-gal-avatar {
        width: 100% !important;
        height: 100% !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        display: block !important;
      }
      .fairy-gal-name {
        font-size: 12px !important;
        font-weight: 800 !important;
        color: var(--f-accent, #d4af37) !important;
        margin-bottom: 2px !important;
      }
      .fairy-gal-badge {
        font-size: 9px !important;
        color: var(--gray-text) !important;
        margin-bottom: 4px !important;
      }
      .fairy-gal-desc {
        font-size: 9.5px !important;
        line-height: 1.4 !important;
        color: var(--text-color) !important;
        opacity: 0.88 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
      }

      /* إخفاء الأزرار الزائدة داخل جسم المساعد لتجنب التكرار مع الشريط العلوي */
      #futuristicAiBody button[onclick*="startVoiceShoppingInput"] {
        display: none !important;
      }
    `;
    document.head.appendChild(st);
  }

  function wrapCustomerSearchBarCollapsible() {
    // البحث عن حقل البحث الأساسي للمنتجات في الواجهة لجعله قابلاً للطي مع اللوحة المستقبلية
    const searchInput = document.querySelector("#searchInput, #productSearchInput, #storeSearchInput, input[placeholder*='ابحث عن']");
    if (!searchInput) return;
    const searchRow = searchInput.closest(".search-box, .search-bar, .form-group, div") || searchInput.parentElement;
    if (!searchRow || searchRow.id === "futuristicAiBody" || searchRow.closest("#aiSmartAssistantBox") || searchRow.closest(".modal-overlay")) return;
    searchRow.dataset.futSearchRow = "1";
  }

  function polishStoreHeaderLayout() {
    const header = document.querySelector("header, .store-header, .top-bar");
    if (!header || header.dataset.moaathHeaderPolished) return;
    header.dataset.moaathHeaderPolished = "1";
    header.style.borderRadius = "0 0 18px 18px";
  }

  function purgeShamCashPaymentAIDOM() {
    ["shamCashOcrResult", "shamCashOcrBox", "shamCashReceiptBox", "shamCashAiCheckBtn", "shamCashPriceAiBox"].forEach(id => {
      const el = $(id);
      if (el) {
        el.innerHTML = "";
        el.style.display = "none";
      }
    });
    // إخفاء أي صندوق يحتوي على "فحص مبدئي لإشعار شام كاش" أو حقل رفع إشعار مرتبط بـ analyzeShamCashReceiptOCR داخل سلة المشتريات
    const cartModal = $("cartModal") || document.body;
    if (cartModal) {
      cartModal.querySelectorAll("input[type='file']").forEach(inp => {
        const onchg = String(inp.getAttribute("onchange") || "");
        const idStr = String(inp.id || "");
        if (/analyzeShamCash|shamCash/i.test(onchg) || /shamCash|ocr/i.test(idStr)) {
          const box = inp.closest("div[style*='dashed'], .form-group, div") || inp.parentElement;
          if (box && box.id !== "cartModal") {
            box.style.display = "none";
          }
        }
      });
      cartModal.querySelectorAll("div, section, label").forEach(el => {
        if (el.children.length <= 4 && /فحص\s*مبدئي\s*لإشعار\s*شام\s*كاش/.test(el.textContent || "")) {
          const container = el.closest("div[style*='dashed']") || el;
          if (container && container.id !== "cartModal") {
            container.style.display = "none";
          }
        }
      });
    }
  }

  function mountAssistant() {
    ensureFuturisticStylesInjected();
    polishStoreHeaderLayout();
    wrapCustomerSearchBarCollapsible();
    window.analyzeShamCashReceiptOCR();
    purgeShamCashPaymentAIDOM();
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const assistBox = $("aiSmartAssistantBox");

    if (assistBox && !$("futuristicAiHeader")) {
      assistBox.classList.add("fut-ai-dock");

      const futHeader = document.createElement("div");
      futHeader.id = "futuristicAiHeader";
      futHeader.className = "fut-ai-header";
      futHeader.innerHTML = `
        <button id="futuristicAiToggleBtn" type="button" class="fut-ai-pill-btn" onclick="toggleFuturisticAssistantPanel()" aria-expanded="false">
          <span class="fut-dot"></span>
          <span>فتح المساعد والبحث</span>
          <span class="fut-chev">▾</span>
        </button>
        <div class="fut-ai-header-actions">
          <button id="futVipShowcaseBtn" type="button" onclick="if(typeof window.openVIPShowcaseModal==='function'){window.openVIPShowcaseModal('all');}else{showToast('يرجى التأكد من رفع ملف ai_vip_personas.js وربطه في index.html');}" class="fut-icon-btn fut-gold-btn" title="غرف الشخصيات المميزة والباقة الشاملة">👑 غرف VIP</button>
          <button id="petDirectMicBtn" type="button" onclick="startVoiceShoppingInput()" class="fut-icon-btn fut-mic-btn" title="تحدّث الآن">🎙️</button>
          <button id="petShowCharBtn" type="button" onclick="setPetHidden(false)" class="fut-show-fairy-btn" style="display:none;">إظهار</button>
        </div>
      `;

      const futBody = document.createElement("div");
      futBody.id = "futuristicAiBody";
      futBody.className = "fut-ai-body";

      // نقل العناصر الموجودة داخل صندوق المساعد إلى الجسم القابل للطي
      const existingChildren = Array.from(assistBox.children);
      existingChildren.forEach(ch => futBody.appendChild(ch));

      assistBox.appendChild(futHeader);
      assistBox.appendChild(futBody);

      const voiceBar = document.createElement("div");
      voiceBar.id = "futVoiceSubControls";
      voiceBar.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px; flex-wrap:wrap;";
      voiceBar.innerHTML = `
        <span id="petConnStatusBadge" onclick="showVoiceDiagnosticOnPhone()" class="fut-status-badge" title="اضغط لعرض سبب الخطأ وعدد المقاطع المحفوظة">🟢 جاهز</span>
        <div style="display:flex; gap:5px; align-items:center;">
          <button type="button" onclick="replayLastCompanionSpeech()" class="fut-icon-btn fut-gold-btn" title="إعادة الاستماع">🔁 إعادة</button>
          <button type="button" onclick="toggleCompanionVoice()" class="fut-icon-btn fut-blue-btn" title="تفعيل أو كتم الصوت">🗣️ صوت</button>
        </div>
      `;
      futBody.insertBefore(voiceBar, futBody.firstChild);

    }

    const futBodyTarget = $("futuristicAiBody") || assistBox;

    if (futBodyTarget && !$("petPersonaBar")) {
      const bar = document.createElement("div");
      bar.id = "petPersonaBar";
      bar.className = "fut-persona-bar";
      const opts = Object.values(PERSONAS).map(per =>
        `<option value="${per.id}">${per.name} — ${per.roleBadge}</option>`
      ).join("");
      bar.innerHTML = `
        <div class="fut-persona-select-wrap">
          <button type="button" id="fairyGalleryTriggerBtn" class="fairy-picker-trigger" onclick="openFairyGalleryModal()">
            <img id="fairyBarThumb" alt="${p.name}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1.5px solid ${p.accent}; flex-shrink:0;">
            <span id="fairyBarActiveName" style="font-weight:800; color:var(--text-color);">${esc(p.name)}</span>
            <span style="font-size:9px; color:var(--gold-color); margin-right:auto;">تغيير الجنية ▾</span>
          </button>
          <select id="petPersonaSelect" class="form-control fut-select" onchange="selectPetPersona(this.value)" style="display:none;">${opts}</select>
        </div>
        <button id="futuristicChipsToggleBtn" type="button" class="fut-sub-toggle-btn" onclick="toggleFuturisticChipsPanel()">طي الاختصارات ▴</button>
      `;
      futBodyTarget.insertBefore(bar, futBodyTarget.firstChild);

      const specNote = document.createElement("div");
      specNote.id = "fairySpecialtyNote";
      specNote.className = "fut-specialty-note";
      specNote.textContent = p.specialtyNote || "";
      bar.insertAdjacentElement("afterend", specNote);
    }

    if (futBodyTarget && !$("petQuickPromptChips")) {
      const chips = document.createElement("div");
      chips.id = "petQuickPromptChips";
      chips.className = "fut-quick-chips";
      const quickItems = [
        { label: "🍲 طبخة اليوم", q: "مقلوبة" },
        { label: "🍰 حلى سريع", q: "حلى بارد" },
        { label: "🔥 سهرة ومتة", q: "سهرة ومتة" },
        { label: "💰 أوفر المتوفر", q: "أوفر المتوفر" },
        { label: "🛒 كمّل سلتي", q: "شو ناقصني كمّل سلتي" }
      ];
      chips.innerHTML = quickItems.map(it =>
        `<button type="button" onclick="runAIShoppingAssistant('${it.q}')" class="fut-chip-btn">${it.label}</button>`
      ).join("");
      futBodyTarget.appendChild(chips);
    }

    // احترام هدوء الزبون عند التركيز على حقول البحث أو الكتابة
    if (!window.__MOAATH_QUIET_HOOK__) {
      window.__MOAATH_QUIET_HOOK__ = true;
      document.addEventListener("focusin", (e) => {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
          pauseRoaming(12000);
          const b = $("petMiniBubble");
          if (b && !isHoldingSpeak) b.style.display = "none";
        }
      });
    }

    if (!$("petCharRoot")) {
      const styleTag = document.createElement("style");
      styleTag.id = "petCharStyle";
      styleTag.textContent = `
        @keyframes fairyHover3D {
          0%, 100% { transform: translateY(0px) rotateX(4deg) rotateY(-4deg) scale(1); }
          50% { transform: translateY(-7px) rotateX(-5deg) rotateY(6deg) scale(1.04); }
        }
        @keyframes fairyShadow3D {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.42; }
          50% { transform: translateX(-50%) scale(0.75); opacity: 0.22; }
        }
        @keyframes fairyRing {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.38); opacity: 0; }
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
          50% { box-shadow: 0 0 0 7px rgba(0, 230, 118, 0); }
        }
        .mic-listening-pulse {
          animation: micPulse 1s infinite !important;
          background: rgba(0, 230, 118, 0.35) !important;
        }
        #petCharRoot {
          perspective: 760px;
          transform-style: preserve-3d;
          transition: right 1.15s cubic-bezier(0.22, 1, 0.36, 1), bottom 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
        }
        #petCharOrb {
          width: 52px; height: 52px; border-radius: 50%; border: 2.5px solid ${p.accent};
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          transform-style: preserve-3d;
          transition: transform 0.28s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        #petCharOrb.is-roaming {
          animation: fairyHover3D 2.2s ease-in-out infinite;
        }
        #fairyCharImg {
          width: 100%; height: 100%; object-fit: cover; border-radius: 50%; pointer-events: none;
        }
        #fairyStateBadge {
          position: absolute; bottom: -2px; left: -2px;
          background: var(--card-bg); border: 1px solid var(--gold-color);
          border-radius: 50%; width: 20px; height: 20px; font-size: 11px;
          display: flex; align-items: center; justify-content: center; pointer-events: none;
        }
        #pet3DGroundShadow {
          position: absolute; left: 50%; bottom: -8px; width: 42px; height: 9px;
          border-radius: 50%; background: rgba(0, 0, 0, 0.45); filter: blur(2px);
          pointer-events: none; animation: fairyShadow3D 2.2s ease-in-out infinite;
        }
        #petListenRing {
          display: none; position: absolute; inset: -6px; border-radius: 50%;
          border: 2.5px solid #00e676; pointer-events: none; animation: fairyRing 1.1s infinite;
        }
        #petMiniBubble {
          display: none; position: absolute; bottom: 72px; right: 0; max-width: 235px; width: max-content;
          background: var(--card-bg); color: var(--text-color); border: 1px solid var(--gold-color);
          border-radius: 10px; padding: 6px 9px; font-size: 11px; line-height: 1.4;
          box-shadow: 0 8px 20px rgba(0,0,0,0.45); pointer-events: none;
        }`;
      styleTag.textContent += `

        .fut-ai-dock {
          position: relative;
          border-radius: 18px !important;
          border: 1px solid rgba(212, 175, 55, 0.38) !important;
          background: linear-gradient(145deg, rgba(16, 24, 42, 0.88), rgba(10, 15, 28, 0.94)) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35), 0 0 18px rgba(0, 176, 255, 0.08) !important;
          padding: 8px 10px !important;
          transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        body.light-mode .fut-ai-dock {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 249, 0.96)) !important;
          border: 1px solid rgba(180, 140, 20, 0.32) !important;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08) !important;
        }
        .fut-ai-dock.is-dock-collapsed {
          padding: 6px 8px !important;
          border-radius: 22px !important;
        }
        .fut-ai-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          flex-wrap: wrap;
        }
        .fut-ai-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(90deg, rgba(0, 176, 255, 0.16), rgba(212, 175, 55, 0.18));
          color: var(--text-color);
          border: 1px solid rgba(212, 175, 55, 0.55);
          border-radius: 999px;
          padding: 5px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .fut-ai-pill-btn:hover {
          border-color: #38bdf8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.28);
          transform: translateY(-1px);
        }
        .fut-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00e676;
          box-shadow: 0 0 8px #00e676;
          flex-shrink: 0;
        }
        .fut-chev {
          font-size: 11px;
          color: var(--gold-color);
        }
        .fut-ai-header-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .fut-status-badge {
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          padding: 2px 5px;
        }
        .fut-icon-btn {
          width: auto !important;
          padding: 4px 8px !important;
          font-size: 10px !important;
          border-radius: 999px !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          cursor: pointer;
          border: 1px solid transparent;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }
        .fut-icon-btn:active {
          transform: scale(0.95);
        }
        .fut-mic-btn {
          background: rgba(0, 230, 118, 0.15) !important;
          color: #00e676 !important;
          border-color: rgba(0, 230, 118, 0.35) !important;
        }
        .fut-gold-btn {
          background: rgba(212, 175, 55, 0.15) !important;
          color: var(--gold-color) !important;
          border-color: rgba(212, 175, 55, 0.35) !important;
        }
        .fut-blue-btn {
          background: rgba(0, 176, 255, 0.15) !important;
          color: #38bdf8 !important;
          border-color: rgba(56, 189, 248, 0.35) !important;
        }
        .fut-show-fairy-btn {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: var(--gold-color);
          color: #000;
          border: none;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .fut-ai-body {
          max-height: 520px;
          opacity: 1;
          overflow: hidden;
          margin-top: 8px;
          transition: max-height 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease, margin-top 0.28s ease;
        }
        .fut-ai-body.is-collapsed {
          max-height: 0 !important;
          opacity: 0 !important;
          margin-top: 0 !important;
          pointer-events: none;
        }
        .fut-persona-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 6px;
          font-size: 10px;
        }
        .fut-persona-select-wrap {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 1;
          min-width: 165px;
        }
        .fut-select {
          padding: 4px 8px !important;
          font-size: 10px !important;
          border-radius: 10px !important;
          flex: 1;
        }
        .fut-sub-toggle-btn {
          background: rgba(255, 255, 255, 0.06);
          color: var(--gold-color);
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }
        .fut-specialty-note {
          font-size: 10px;
          color: var(--gray-text);
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .fut-quick-chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 6px 2px 2px 2px;
          margin-top: 6px;
          max-height: 56px;
          opacity: 1;
          scrollbar-width: none;
          transition: max-height 0.28s ease, opacity 0.22s ease, margin-top 0.24s ease;
        }
        .fut-quick-chips.is-chips-collapsed {
          max-height: 0 !important;
          opacity: 0 !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          pointer-events: none;
        }
        .fut-chip-btn {
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          color: var(--text-color);
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.16s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .fut-chip-btn:hover {
          border-color: #38bdf8;
          transform: translateY(-1px);
        }
        body.light-mode .fut-chip-btn {
          background: #ffffff;
          border-color: rgba(15, 23, 42, 0.14);
        }

`;
            document.head.appendChild(styleTag);

      const root = document.createElement("div");
      root.id = "petCharRoot";
      root.style.cssText = "position:fixed; bottom:96px; left:12px; z-index:98;";
      root.innerHTML = `
        <div id="petMiniBubble"></div>
        <div style="position:relative;">
          <div id="petListenRing"></div>
          <div id="petCharOrb" class="is-roaming" role="button" aria-label="جنية المساعد الذكي">
            <img id="fairyCharImg" alt="${p.name}">
          </div>
          <div id="fairyStateBadge">🧚</div>
        </div>`;
      document.body.appendChild(root);
      bindOrbInteractions($("petCharOrb"), root);
    }

    organizeAdminAndExportUI();
    enhanceCustomerCartCheckoutUX();
    syncVisuals();
    syncFuturisticCollapseUI();
    startRoamLoop();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountAssistant(); };

  const _origRenderCart = window.renderCartModalItems;
  window.renderCartModalItems = function () {
    pauseRoaming(15000);
    const b = $("petMiniBubble");
    if (b) b.style.display = "none";
    if (typeof _origRenderCart === "function") _origRenderCart();
    enhanceCustomerCartCheckoutUX();
    purgeShamCashPaymentAIDOM();
    const paySel = $("cartPaymentMethod");
    if (paySel && !paySel.dataset.purgeHooked) {
      paySel.dataset.purgeHooked = "1";
      paySel.addEventListener("change", () => setTimeout(purgeShamCashPaymentAIDOM, 30));
    }
    renderSmartCartRecommendations();
  };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncVisuals, 60); };

  window.addEventListener("online", syncConnectivityBadge);
  window.addEventListener("offline", syncConnectivityBadge);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAssistant);
  else mountAssistant();
})();

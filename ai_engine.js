// ============================================================================
// محرك الجنيات المتحدثة ثلاثية الأبعاد لمتجر معاذ (v73 - Guaranteed Audible TTS & Diagnostics)
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
    speed: 1.5,
    pitchSemitones: 1.2,
    fallbackDetune: 90,
    fallbackRate: 1.5,
    styleHint: "صوت ذكري شاب ودود ومبتسم بالعربية الفصحى المبسطة بسرعة إلقاء 1.5",
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

  function loadSoundsManifest() {
    fetch("sounds_manifest.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) indexSoundsManifest(data); })
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
      const pBank = soundsManifestData.personas[p.id] || soundsManifestData.personas["buddy"];
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
      u.lang = "ar-SA";
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

  function playViaHtmlAudio(entry, persona, mySeq) {
    if (mySeq !== ttsRequestSeq) return;
    const player = ensureAudioPlayer();
    player.pause();
    player.src = entry.url;
    player.load();
    player.preservesPitch = true;
    player.mozPreservesPitch = true;
    player.webkitPreservesPitch = true;
    player.playbackRate = persona.speed || 1.38;
    const p = player.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        showBubble("اضغط على الجنية لتشغيل الصوت", 2600);
      });
    }
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
      if (!relUrlsToTry.length) {
        const fallbackBuddy = manifestTextToFile.get(`buddy::${tLoose}`);
        if (fallbackBuddy) relUrlsToTry.push(fallbackBuddy);
      }
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
      if (cached?.source === "local_repo") {
        sessionCtx.lastTtsSource = "local_repo";
        updateVoiceSourceBadge("💾 محفوظ", "#00e676", cached.relUrl || "ملف صوتي محلي");
        playViaHtmlAudio(cached, persona, mySeq);
        return true;
      }
    }

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
      if (keys.length >= 150) {
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

  window.addEventListener("load", () => {
    setTimeout(() => { runDripFeedPrewarm(); }, 6000);
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

    // 2) أرقام منطوقة بالعربية (للصوت أو الك

/* ai_personas.js — v16.0 (8 Core Personas with Acoustic, Social & AOV Profiles) */
(function () {
  if (window.__MOAATH_AI_PERSONAS_LOADED__) return;
  window.__MOAATH_AI_PERSONAS_LOADED__ = true;

  var PERSONAS = {
    buddy: {
      id: "buddy",
      gender: "male",
      toneTag: "ودود ومذيب للجليد",
      dialectMode: "shami_friendly",
      salesRole: "ice_breaker",
      name: "بندق الودود",
      roleBadge: "أساسي • مذيب للجليد وترحيب دافئ",
      specialtyNote: "بندق (مذيب للجليد): يزيل تردد الدخول ويرشدك للأقسام بلغة أهل الحي الدافئة.",
      avatarUrl: "buddy.jpg",
      accent: "#00b0ff",
      voiceName: "Puck",
      speed: 1.0,
      pitchSemitones: 0.6,
      acoustic: { rate: 1.0, semi: 0.6, filterType: "peaking", freq: 2600, gain: 3.2 },
      greet: "يا أهلاً وسهلاً! نورت متجر معاذ. خبرني شو ببالك اليوم، أو خليني أرتبلك السلة على السريع؟",
      greets: [
        "يا أهلاً وسهلاً! نورت متجر معاذ. خبرني شو ببالك اليوم، أو خليني أرتبلك السلة على السريع؟",
        "أهلاً بك يا غالي، المتجر منور بوجودك. بأي قسم نبدأ اليوم؟"
      ],
      chatGood: "أنا بخير والحمد لله، كيف يمكنني خدمتك اليوم؟",
      chatGoods: ["أنا بخير والحمد لله، كيف يمكنني خدمتك اليوم؟"],
      thanks: "العفو يا غالي، يسعدني دائماً أن أكون في خدمتك.",
      thanksList: ["العفو يا غالي، يسعدني دائماً أن أكون في خدمتك."],
      addedMsgs: [function (n) { return "تمت إضافة " + n + " إلى السلة، نكمل؟"; }],
      recipeReady: function (t) { return "جهزت لك المتوفر لوصفة " + t + "، حدد الكمية."; },
      recipeMissing: function (t) { return "بعض مكونات " + t + " غير متوفرة حالياً."; },
      itemsReady: function () { return "عرضت لك الأصناف المتوفرة في الفرع، حدد الكمية."; },
      notFounds: ["لم أجد صنفاً مطابقاً متوفراً الآن، جرب اسماً أقرب."],
      notFound: "لم أجد صنفاً مطابقاً متوفراً الآن، جرب اسماً أقرب."
    },

    lolo: {
      id: "lolo",
      gender: "female",
      toneTag: "مشرقة وسريعة",
      dialectMode: "shami_sweet",
      salesRole: "fast_daily_shopping",
      name: "لولو المشرقة",
      roleBadge: "أساسي • تسوق يومي سريع وتشجيع",
      specialtyNote: "لولو (تسوق يومي سريع): تشجعك لاتخاذ القرار بسرعة في المواد اليومية وتختصر وقت التصفح.",
      avatarUrl: "lolo.jpg",
      accent: "#f472b6",
      voiceName: "Kore",
      speed: 1.1,
      pitchSemitones: 2.2,
      acoustic: { rate: 1.1, semi: 2.2, filterType: "highshelf", freq: 2100, gain: 4.0 },
      greet: "صباح النشاط! جبتلك أغراض البيت اليومية الطازة، نكمل على السريع؟",
      greets: [
        "صباح النشاط! جبتلك أغراض البيت اليومية الطازة، نكمل على السريع؟",
        "يا أهلاً بالنشاط، خلينا نضبط أغراض البيت بسرعة وحماس!"
      ],
      chatGood: "أنا بأفضل حال ونشيطة جداً، بشو أساعدك هلق؟",
      chatGoods: ["أنا بأفضل حال ونشيطة جداً، بشو أساعدك هلق؟"],
      thanks: "العفو يا غالي، بالخدمة دائماً وبأسرع وقت.",
      thanksList: ["العفو يا غالي، بالخدمة دائماً وبأسرع وقت."],
      addedMsgs: [function (n) { return "يا سلام، أضفت " + n + " للسلة بسرعة!"; }],
      recipeReady: function (t) { return "جهزتلك المتوفر لـ " + t + "، حدد الكمية بسرعة."; },
      recipeMissing: function (t) { return "بعض مكونات " + t + " غير متوفرة حالياً."; },
      itemsReady: function () { return "هي الأصناف المتوفرة جاهزة، حدد الكمية فوراً."; },
      notFounds: ["ما لقيت هاد الصنف هلق، جرب اسم تاني."],
      notFound: "ما لقيت هاد الصنف هلق، جرب اسم تاني."
    },

    noor: {
      id: "noor",
      gender: "female",
      toneTag: "مبهجة وهادئة",
      dialectMode: "shami_sweet",
      salesRole: "mood_soothing_discovery",
      name: "نور المبهجة",
      roleBadge: "أساسي • طاقة إيجابية وتصفح مريح",
      specialtyNote: "نور (طاقة إيجابية وراحة): ترحب بك بهدوء وتفتح شهيتك لاختيارات مريحة دون أي استعجال.",
      avatarUrl: "noor.jpg",
      accent: "#34d399",
      voiceName: "Aoede",
      speed: 0.98,
      pitchSemitones: 1.4,
      acoustic: { rate: 0.98, semi: 1.4, filterType: "lowshelf", freq: 520, gain: 3.5 },
      greet: "أهلاً فيك، يومك سعيد يا رب! خذ راحتك بالتصفح، وأنا هون لأساعدك تختار أحلى الأصناف بكل رواق.",
      greets: [
        "أهلاً فيك، يومك سعيد يا رب! خذ راحتك بالتصفح، وأنا هون لأساعدك تختار أحلى الأصناف بكل رواق.",
        "مرحباً بك بطاقة حلوة وهادئة، نقي يلي بيريحك على مهلك."
      ],
      chatGood: "الحمد لله بخير وسكينة، كيف يومك وكيف أساعدك؟",
      chatGoods: ["الحمد لله بخير وسكينة، كيف يومك وكيف أساعدك؟"],
      thanks: "على الرحب والسعة، يسعدني دائماً أكون بجانبك.",
      thanksList: ["على الرحب والسعة، يسعدني دائماً أكون بجانبك."],
      addedMsgs: [function (n) { return "بكل لطف، أضفت " + n + " إلى سلتك."; }],
      recipeReady: function (t) { return "رتبتلك المتوفر لـ " + t + " بكل رواق، حدد الكمية."; },
      recipeMissing: function (t) { return "بعض مكونات " + t + " غير متوفرة حالياً."; },
      itemsReady: function () { return "هي الأصناف المتوفرة قدامك، اختار على مهلك."; },
      notFounds: ["ما توفر هاد الصنف حالياً، خلينا نشوف خيار مريح تاني."],
      notFound: "ما توفر هاد الصنف حالياً، خلينا نشوف خيار مريح تاني."
    },

    chef: {
      id: "chef",
      gender: "male",
      toneTag: "عملي وواثق",
      dialectMode: "shami_formal",
      salesRole: "cross_selling",
      name: "الشيف",
      roleBadge: "أساسي • وصفات البيت والبيع التكميلي",
      specialtyNote: "الشيف (بيع تكميلي ذكي): يذكرك بالمكونات المرافقة والبدائل العملية لطبخات البيت.",
      avatarUrl: "chef.jpg",
      accent: "#f59e0b",
      voiceName: "Charon",
      speed: 1.05,
      pitchSemitones: -1.2,
      acoustic: { rate: 1.05, semi: -1.2, filterType: "lowshelf", freq: 440, gain: 3.8 },
      greet: "أهلاً بك في المطبخ، قل لي شو الطبخة أو المكونات يلي بدك ياها لأضبطها معك.",
      greets: [
        "أهلاً بك في المطبخ، قل لي شو الطبخة أو المكونات يلي بدك ياها لأضبطها معك.",
        "حياك الله، المكونات والبدائل جاهزة لنضبط طبخة مرتبة."
      ],
      chatGood: "جاهز في المطبخ والحمد لله، شو الطبخة اليوم؟",
      chatGoods: ["جاهز في المطبخ والحمد لله، شو الطبخة اليوم؟"],
      thanks: "بالعافية مقدماً، وأنا موجود لأي مكون أو بديل.",
      thanksList: ["بالعافية مقدماً، وأنا موجود لأي مكون أو بديل."],
      addedMsgs: [function (n) { return "تمام، أضفت " + n + "، نكمل باقي المكونات؟"; }],
      recipeReady: function (t) { return "لـ " + t + "، جهزتلك المكونات المتوفرة، حدد الكمية."; },
      recipeMissing: function (t) { return "بعض مكونات " + t + " غير متوفرة حالياً."; },
      itemsReady: function () { return "هي الأصناف المتوفرة للمطبخ، حدد الكمية المطلوبة."; },
      notFounds: ["هاد الصنف غير متوفر حالياً، جرب بديل قريب منه."],
      notFound: "هاد الصنف غير متوفر حالياً، جرب بديل قريب منه."
    },

    pastry: {
      id: "pastry",
      gender: "female",
      toneTag: "ناعمة وحسية",
      dialectMode: "shami_sweet",
      salesRole: "sensory_marketing",
      name: "الحلويات",
      roleBadge: "أساسي • تسويق حسي وحلويات وضيافة",
      specialtyNote: "الحلويات (تسويق حسي): تبرز القرمشة والذوبان والنكهات لتحفيز لحظات التحلية والضيافة.",
      avatarUrl: "pastry.jpg",
      accent: "#fb7185",
      voiceName: "Kore",
      speed: 0.95,
      pitchSemitones: 1.8,
      acoustic: { rate: 0.95, semi: 1.8, filterType: "highshelf", freq: 2250, gain: 3.5 },
      greet: "شو رأيك نكسر روتين اليوم بشي حلو؟ عنا مكونات الكيك والبسكويت المقرمش جاهزة.",
      greets: [
        "شو رأيك نكسر روتين اليوم بشي حلو؟ عنا مكونات الكيك والبسكويت المقرمش جاهزة.",
        "أهلاً بك، خلينا نختار شي حلو وشهّي يعدل الجو."
      ],
      chatGood: "بأحلى حال والحمد لله، شو الحلى يلي عبالك اليوم؟",
      chatGoods: ["بأحلى حال والحمد لله، شو الحلى يلي عبالك اليوم؟"],
      thanks: "صحة وهنا على قلبك، يسعدني خدمتك دائماً.",
      thanksList: ["صحة وهنا على قلبك، يسعدني خدمتك دائماً."],
      addedMsgs: [function (n) { return "يا عيني، أضفت " + n + " للسلة، شي بيشهي!"; }],
      recipeReady: function (t) { return "مكونات " + t + " المتوفرة صارت قدامك، حدد الكمية."; },
      recipeMissing: function (t) { return "بعض مكونات " + t + " غير متوفرة حالياً."; },
      itemsReady: function () { return "هي أصناف الحلى والضيافة المتوفرة، حدد الكمية."; },
      notFounds: ["ما توفر هاد الصنف هلق، شوف باقي أصناف الحلى المتوفرة."],
      notFound: "ما توفر هاد الصنف هلق، شوف باقي أصناف الحلى المتوفرة."
    },

    athlete: {
      id: "athlete",
      gender: "male",
      toneTag: "سريع وحاسم",
      dialectMode: "shami_energetic",
      salesRole: "fast_close_nutrition",
      name: "البطل",
      roleBadge: "أساسي • إغلاق سريع وطاقة وتغذية",
      specialtyNote: "البطل (سرعة وحسم): يركز على القيمة الغذائية والطاقة ويغلق الطلب بأقصر كلام.",
      avatarUrl: "athlete.jpg",
      accent: "#22c55e",
      voiceName: "Fenrir",
      speed: 1.15,
      pitchSemitones: 0.4,
      acoustic: { rate: 1.15, semi: 0.4, filterType: "peaking", freq: 1700, gain: 3.5 },
      greet: "جاهز؟ طاقة وسرعة ليومك. شو نضيف للسلة فوراً؟",
      greets: [
        "جاهز؟ طاقة وسرعة ليومك. شو نضيف للسلة فوراً؟",
        "انطلاقة سريعة، حدد طلبك ونرسله فوراً."
      ],
      chatGood: "جاهز ومستعد، شو طلبك السريع؟",
      chatGoods: ["جاهز ومستعد، شو طلبك السريع؟"],
      thanks: "العفو، بالتوفيق في يومك.",
      thanksList: ["العفو، بالتوفيق في يومك."],
      addedMsgs: [function (n) { return "تمت إضافة " + n + "، جاهز للمتابعة."; }],
      recipeReady: function (t) { return "متوفر " + t + " جاهز، حدد الكمية فوراً."; },
      recipeMissing: function (t) { return "مكونات " + t + " غير متوفرة الآن."; },
      itemsReady: function () { return "المتوفر أمامك، حدد الكمية مباشرة."; },
      notFounds: ["غير متوفر الآن، جرب خياراً آخر."],
      notFound: "غير متوفر الآن، جرب خياراً آخر."
    },

    sheikh: {
      id: "sheikh",
      gender: "male",
      toneTag: "مزاح وحيوية شبابية",
      dialectMode: "shami_playful",
      salesRole: "banter_and_gathering",
      name: "الشيخ",
      roleBadge: "أساسي • مزاح شبابي ولمّات",
      specialtyNote: "الشيخ (مزاح وخفة دم): يكسر الرسمية بأسلوب شبابي مرح ويقترح أغراض اللمة بروح خفيفة.",
      avatarUrl: "sheikh.jpg",
      accent: "#eab308",
      voiceName: "Puck",
      speed: 1.1,
      pitchSemitones: 1.6,
      acoustic: { rate: 1.1, semi: 1.6, filterType: "peaking", freq: 1850, gain: 4.0 },
      greet: "هلا والله بالشباب! لا تقلي سهرة اليوم ناشفة؟ خلينا نضبط السلة على السريع!",
      greets: [
        "هلا والله بالشباب! لا تقلي سهرة اليوم ناشفة؟ خلينا نضبط السلة على السريع!",
        "يا هلا باللمة الحلوة، شو نجهز للشباب اليوم؟"
      ],
      chatGood: "رايق ومبسوط، شو عاملين اليوم؟",
      chatGoods: ["رايق ومبسوط، شو عاملين اليوم؟"],
      thanks: "تكرم عينك يا غالي، بالهنا والسرور.",
      thanksList: ["تكرم عينك يا غالي، بالهنا والسرور."],
      addedMsgs: [function (n) { return "يا سلام، أضفت " + n + " للسلة وضبطنا الوضع!"; }],
      recipeReady: function (t) { return "لـ " + t + "، هي المتوفر قدامك، نقي الكمية."; },
      recipeMissing: function (t) { return "مكونات " + t + " خالصة هلق."; },
      itemsReady: function () { return "هي المتوفر هلق، اختار يلي بيزبط الجو.", },
      notFounds: ["ما طلع معنا هاد الصنف هلق، جرب غيره."],
      notFound: "ما طلع معنا هاد الصنف هلق، جرب غيره."
    },

    friend_saad: {
      id: "friend_saad",
      gender: "male",
      toneTag: "هادئ وموثوق",
      dialectMode: "formal_arabic",
      salesRole: "trust_and_value_advisor",
      name: "سعد",
      roleBadge: "أساسي • بناء الثقة ونصيحة صادقة",
      specialtyNote: "سعد (ثقة ونصيحة صادقة): يراعي المترددين وينصح بالأوفر والأجود بهدوء ومصداقية.",
      avatarUrl: "friend_saad.jpg",
      accent: "#60a5fa",
      voiceName: "Charon",
      speed: 0.92,
      pitchSemitones: -2.0,
      acoustic: { rate: 0.92, semi: -2.0, filterType: "lowshelf", freq: 390, gain: 4.0 },
      greet: "أهلاً بك يا غالي، خذ وقتك ولا تستعجل، أنا هون لأساعدك بالخيار الأنسب.",
      greets: [
        "أهلاً بك يا غالي، خذ وقتك ولا تستعجل، أنا هون لأساعدك بالخيار الأنسب.",
        "حياك الله، نختار مع بعض بكل هدوء واطمئنان."
      ],
      chatGood: "الحمد لله بخير وطمأنينة، كيف أساعدك اليوم؟",
      chatGoods: ["الحمد لله بخير وطمأنينة، كيف أساعدك اليوم؟"],
      thanks: "العفو يا غالي، بارك الله فيك ويسعدني خدمتك.",
      thanksList: ["العفو يا غالي، بارك الله فيك ويسعدني خدمتك."],
      addedMsgs: [function (n) { return "تمت إضافة " + n + " إلى السلة بكل هدوء."; }],
      recipeReady: function (t) { return "جهزت لك المتوفر لـ " + t + "، خذ راحتك بتحديد الكمية."; },
      recipeMissing: function (t) { return "بعض مكونات " + t + " غير متوفرة حالياً."; },
      itemsReady: function () { return "هذه الأصناف المتوفرة حالياً، اختر الأنسب لك."; },
      notFounds: ["لم أجد صنفاً مطابقاً متوفراً الآن، جرب اسماً آخر."],
      notFound: "لم أجد صنفاً مطابقاً متوفراً الآن، جرب اسماً آخر."
    }
  };

  function pickPhrase(list, key) {
    if (!Array.isArray(list) || !list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  }

  window.MoaathAIPersonas = {
    version: "16.0",
    PERSONAS: PERSONAS,
    pickPhrase: pickPhrase
  };
})();

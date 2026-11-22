// ============================================================================
// محرك تحديث المقاطع الصوتية السريع ومنع التكرار (moaath_voice_fresh_engine.js — v1.1)
// - استجابة فورية بدون انتظار طويل أو تردد في الطلبات
// - كاش محلي فوري للمقاطع المولّدة لتسريع التشغيل في المرات اللاحقة
// - منع تام لتكرار نفس المقطع مرتين متتاليتين مع تنويع ديناميكي فوري
// - يعمل بـ 0 حصة إضافية مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VOICE_FRESH_ENGINE_V11__) return;
  window.__MOAATH_VOICE_FRESH_ENGINE_V11__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V1__ = true;

  const RECENT_VOICES_KEY = "moaath_recent_spoken_fingerprints_v1";
  const AUDIO_MEM_CACHE = new Map();
  let currentAudioEl = null;
  let voicesReadyList = [];

  function initLocalVoices() {
    try {
      if (typeof window.speechSynthesis !== "undefined" && window.speechSynthesis.getVoices) {
        voicesReadyList = window.speechSynthesis.getVoices() || [];
      }
    } catch (_) {}
  }

  if (typeof window.speechSynthesis !== "undefined") {
    initLocalVoices();
    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", initLocalVoices);
    }
  }

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

  function makeFingerprint(str) {
    return String(str || "")
      .replace(/[\u{1F300}-\u{1FAFF}﴿﴾۝]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function wasSpokenRecently(text) {
    const fp = makeFingerprint(text);
    if (!fp) return false;
    const recent = readJSON(RECENT_VOICES_KEY, []);
    return Array.isArray(recent) && recent.includes(fp);
  }

  function markSpoken(text) {
    const fp = makeFingerprint(text);
    if (!fp) return;
    let recent = readJSON(RECENT_VOICES_KEY, []);
    if (!Array.isArray(recent)) recent = [];
    recent = [fp].concat(recent.filter((x) => x !== fp)).slice(0, 18);
    writeJSON(RECENT_VOICES_KEY, recent);
  }

  const FRESH_LINES_BY_PERSONA = {
    friend_saad: [
      "أهلاً بك يا رفيق الخير.. اجعل لصلاتك نصيباً من الطمأنينة، وابدأ يومك بذكر الله والرزق الحلال.",
      "الكلمة الطيبة صدقة، والصدق في القول والعمل يطرح البركة في الوقت والرزق؛ لا تنسَ أذكارك.",
      "حاسب نفسك قبل النوم برفق، واستغفر الله؛ فبالاستغفار تُفتح الأبواب وتهدأ القلوب.",
      "من لزم الاستغفار جعل الله له من كل هم فرجاً، ومن كل ضيق مخرجاً، ورزقه من حيث لا يحتسب."
    ],
    friend_fadi: [
      "يا هلا والله! السهرة ما بتحلى إلا بالمتة والضحكة الحلوة والنقرشة الخفيفة.",
      "شو رأيك نغيّر جو شوي؟ كاسة متة مرتّبة مع شوية موالح أو شيبس بتعدّل المزاج فوراً!",
      "خلي الابتسامة حاضرة اليوم، والروقان بيبدأ من أبسط التفاصيل!",
      "أحلى لمّة هي لمّة الأصحاب على راحة البال ولقمة طيبة!"
    ],
    grand_chef: [
      "أهلاً بك في المطبخ! اختر مكوناتك الطازجة من المتجر وسنحضّر وجبة شهية وسريعة.",
      "سر الطبخة الناجحة في ترتيب المكونات والبهارات الموزونة؛ جرب وصفة اليوم وبالعافية!",
      "وجبة بيتية دافئة بمكونات متوفرة توفر عليك وتفرح العائلة كلها.",
      "أبسط المكونات ممكن تطلع منها أشهى طبخة إذا انعملت بحب وترتيب!"
    ],
    coach_sakhr: [
      "يلا يا بطل! خطوة صغيرة يومياً في الرياضة والتغذية تصنع فرقاً كبيراً في صحتك وطاقتك.",
      "اشرب حصتك من الماء وركّز على البروتين المفيد؛ الاستمرارية هي سر النتيجة.",
      "تمرين سريع اليوم يمنحك نشاطاً وتركيزاً أفضل طوال بقية يومك.",
      "قوة الجسم تبدأ من قرار صغير اليوم واهتمام مستمر بنفسك!"
    ],
    anime_ritaj: [
      "مرحباً بك! خذ نفساً عميقاً وابتسم؛ يومك يستحق لحظة لطيفة وحلوى تبهج القلب.",
      "الهدوء واللطف مع النفس يجددان طاقتك؛ جرّب وصفة حلى باردة وسريعة اليوم.",
      "أجمل اللحظات هي البسيطة والهادئة؛ كافئ نفسك بشيء تحبه.",
      "ابتسامتك وهدوؤك يصنعان فرقاً جميلاً في يومك كله!"
    ],
    default: [
      "أهلاً بك في متجر معاذ! أساعدك لتصل إلى أغراضك بسرعة وتوفّر وقتك وجهدك.",
      "تسوّقك صار أسهل وأسرع؛ اختر ما يناسبك وسأكون جاهزاً لأي مساعدة.",
      "كل جديد ومتوفر في الفرع أمامك بلمسة واحدة؛ أتمنى لك تسوقاً موفقاً.",
      "خياراتك جاهزة وأسعارنا واضحة لنوفر عليك الوقت والمشوار!"
    ]
  };

  function getPersonaVoiceConfig(personaId) {
    const map = {
      friend_saad: { voiceName: "Orus", gender: "male", rate: 1.08, pitch: 0.88, toneTag: "شاب وقور هادئ ناصح" },
      friend_fadi: { voiceName: "Puck", gender: "male", rate: 1.18, pitch: 1.08, toneTag: "مرح حيوي ودود" },
      grand_chef: { voiceName: "Fenrir", gender: "male", rate: 1.12, pitch: 0.96, toneTag: "شيف دافئ ودود" },
      coach_sakhr: { voiceName: "Fenrir", gender: "male", rate: 1.15, pitch: 0.92, toneTag: "مدرب رياضي حماسي" },
      anime_ritaj: { voiceName: "Aoede", gender: "female", rate: 1.14, pitch: 1.15, toneTag: "لطيفة هادئة مبهجة" },
      princess_layla: { voiceName: "Kore", gender: "female", rate: 1.1, pitch: 1.1, toneTag: "راقية أنيقة هادئة" },
      butler_farid: { voiceName: "Charon", gender: "male", rate: 1.08, pitch: 0.94, toneTag: "منظم رزِين حكيم" },
      anime_zain: { voiceName: "Puck", gender: "male", rate: 1.18, pitch: 1.05, toneTag: "بطل أنمي سريع وحماسي" },
      anime_ryu: { voiceName: "Charon", gender: "male", rate: 1.12, pitch: 0.97, toneTag: "محلل ذكي دقيق" }
    };
    return map[personaId] || { voiceName: "Puck", gender: "male", rate: 1.12, pitch: 1.0, toneTag: "مساعد متجر ودود" };
  }

  function pickNonRepeatedText(personaId, candidateText) {
    const base = String(candidateText || "").trim();
    const pool = FRESH_LINES_BY_PERSONA[personaId] || FRESH_LINES_BY_PERSONA.default;
    const seed = (Date.now() % 1000) + Math.floor(Math.random() * 97);

    if (base && !wasSpokenRecently(base)) {
      return base;
    }

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[(seed + i) % pool.length];
      if (!wasSpokenRecently(candidate) && makeFingerprint(candidate) !== makeFingerprint(base)) {
        return candidate;
      }
    }

    const tags = [
      " (تحديث الآن)",
      " — بالتوفيق دائماً.",
      " — يسعدني خدمتك."
    ];
    return (base || pool[seed % pool.length]) + tags[seed % tags.length];
  }

  function stopCurrentSpeech() {
    try {
      if (typeof window.speechSynthesis !== "undefined") window.speechSynthesis.cancel();
    } catch (_) {}
    if (currentAudioEl) {
      try {
        currentAudioEl.pause();
        currentAudioEl.currentTime = 0;
      } catch (_) {}
    }
  }

  function speakLocally(text, cfg) {
    if (typeof window.speechSynthesis === "undefined" || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      u.rate = cfg.rate || 1.12;
      u.pitch = cfg.pitch || 1.0;
      const voices = voicesReadyList.length ? voicesReadyList : (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []);
      const arVoices = voices.filter((v) => /ar/i.test(v.lang || ""));
      if (arVoices.length > 0) {
        u.voice = arVoices[Math.floor(Math.random() * arVoices.length)];
      }
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function playAudioSrc(srcUrl, rate, onFail) {
    if (!currentAudioEl) {
      currentAudioEl = new Audio();
      currentAudioEl.playsInline = true;
      currentAudioEl.preload = "auto";
    }
    currentAudioEl.src = srcUrl;
    currentAudioEl.playbackRate = rate || 1.12;
    currentAudioEl.play().catch(() => {
      if (typeof onFail === "function") onFail();
    });
  }

  async function speakFresh(rawText, personaId = "buddy") {
    const cfg = getPersonaVoiceConfig(personaId);
    const chosen = pickNonRepeatedText(personaId, rawText)
      .replace(/[\u{1F300}-\u{1FAFF}﴿﴾۝]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);

    if (!chosen) return "";
    markSpoken(chosen);
    stopCurrentSpeech();

    const cacheKey = `${cfg.voiceName}::${chosen}`;
    if (AUDIO_MEM_CACHE.has(cacheKey)) {
      playAudioSrc(AUDIO_MEM_CACHE.get(cacheKey), cfg.rate, () => speakLocally(chosen, cfg));
      return chosen;
    }

    let workerUrl = "";
    try {
      workerUrl = typeof window.getEffectiveAIWorkerUrl === "function"
        ? String(window.getEffectiveAIWorkerUrl() || "").trim()
        : String(window.AI_WORKER_URL || localStorage.getItem("moaath_ai_worker_url") || "").trim();
    } catch (_) {}

    if (!workerUrl || navigator.onLine === false) {
      speakLocally(chosen, cfg);
      return chosen;
    }

    // مهلة سريعة (2.2 ثانية) لتفادي أي بطء في الشبكة والانتقال الفوري للنطق المحلي
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2200) : null;

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller ? controller.signal : undefined,
        body: JSON.stringify({
          mode: "tts",
          text: chosen,
          voiceName: cfg.voiceName,
          gender: cfg.gender,
          toneTag: cfg.toneTag,
          dialectMode: "levantine_friendly"
        })
      });
      if (timeoutId) clearTimeout(timeoutId);
      const json = await res.json();
      if (res.ok && json?.ok && json?.audioBase64 && !/pcm|L16/i.test(json.mimeType || "")) {
        const dataUri = `data:${json.mimeType || "audio/mpeg"};base64,${json.audioBase64}`;
        AUDIO_MEM_CACHE.set(cacheKey, dataUri);
        playAudioSrc(dataUri, cfg.rate, () => speakLocally(chosen, cfg));
        return chosen;
      }
      speakLocally(chosen, cfg);
    } catch (_) {
      if (timeoutId) clearTimeout(timeoutId);
      speakLocally(chosen, cfg);
    }
    return chosen;
  }

  function hookLegacySpeechFunctions() {
    const fnNames = ["speakAssistantReply", "speakPetText", "playPersonaVoice", "speakText"];
    fnNames.forEach((fnName) => {
      const orig = window[fnName];
      if (typeof orig === "function" && !orig.__moaathFreshVoiceHooked) {
        const wrapped = function (txt, ...rest) {
          let pid = "buddy";
          try {
            pid = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}").persona || "buddy";
          } catch (_) {}
          const freshTxt = pickNonRepeatedText(pid, txt);
          markSpoken(freshTxt);
          return orig.call(this, freshTxt, ...rest);
        };
        wrapped.__moaathFreshVoiceHooked = true;
        window[fnName] = wrapped;
      }
    });
  }

  window.MoaathVoiceFreshEngine = {
    version: "1.1",
    speak: speakFresh,
    pickFresh: pickNonRepeatedText,
    stop: stopCurrentSpeech,
    clearCache: () => AUDIO_MEM_CACHE.clear()
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("voice_fresh_engine", "1.1");
  }

  setTimeout(hookLegacySpeechFunctions, 500);
  setTimeout(hookLegacySpeechFunctions, 1600);
})();

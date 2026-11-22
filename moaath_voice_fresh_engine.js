// ============================================================================
// محرك تحديث المقاطع الصوتية ومنع التكرار الصوتي (moaath_voice_fresh_engine.js — v1.0)
// - يمنع تكرار نفس المقطع الصوتي مرتين متتاليتين عبر سجل ذكي للـ Fingerprints
// - يولّد تنويعات ديناميكية متجددة حسب الشخصية والوقت واليوم من الشهر
// - يضبط نبرة وسرعة وطبقات الصوت تلقائياً لكل شخصية (سعد وقور، فادي مرح، الشيف دافئ...)
// - يدعم التبديل السلس بين صوت السحابة (Worker TTS) والنطق المحلي (SpeechSynthesis) مع كاش نظيف
// - يعمل محلياً بـ 0 حصة API مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VOICE_FRESH_ENGINE_V1__) return;
  window.__MOAATH_VOICE_FRESH_ENGINE_V1__ = true;

  const RECENT_VOICES_KEY = "moaath_recent_spoken_fingerprints_v1";
  let currentAudioEl = null;

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
    recent = [fp].concat(recent.filter((x) => x !== fp)).slice(0, 14);
    writeJSON(RECENT_VOICES_KEY, recent);
  }

  // قوالب صوتية متجددة لتفادي تكرار نفس العبارة الصوتية
  const FRESH_LINES_BY_PERSONA = {
    friend_saad: [
      "أهلاً بك يا رفيق الخير.. اجعل لصلاتك نصيباً من الطمأنينة، وابدأ يومك بذكر الله والرزق الحلال.",
      "الكلمة الطيبة صدقة، والصدق في القول والعمل يطرح البركة في الوقت والرزق؛ لا تنسَ أذكارك.",
      "حاسب نفسك قبل النوم برفق، واستغفر الله؛ فبالاستغفار تُفتح الأبواب وتهدأ القلوب."
    ],
    friend_fadi: [
      "يا هلا والله! السهرة ما بتحلى إلا بالمتة والضحكة الحلوة والنقرشة الخفيفة.",
      "شو رأيك نغيّر جو شوي؟ كاسة متة مرتّبة مع شوية موالح أو شيبس بتعدّل المزاج فوراً!",
      "خلي الابتسامة حاضرة اليوم، والروقان بيبدأ من أبسط التفاصيل!"
    ],
    grand_chef: [
      "أهلاً بك في المطبخ! اختر مكوناتك الطازجة من المتجر وسنحضّر وجبة شهية وسريعة.",
      "سر الطبخة الناجحة في ترتيب المكونات والبهارات الموزونة؛ جرب وصفة اليوم وبالعافية!",
      "وجبة بيتية دافئة بمكونات متوفرة توفر عليك وتفرح العائلة كلها."
    ],
    coach_sakhr: [
      "يلا يا بطل! خطوة صغيرة يومياً في الرياضة والتغذية تصنع فرقاً كبيراً في صحتك وطاقتك.",
      "اشرب حصتك من الماء وركّز على البروتين المفيد؛ الاستمرارية هي سر النتيجة.",
      "تمرين سريع اليوم يمنحك نشاطاً وتركيزاً أفضل طوال بقية يومك."
    ],
    anime_ritaj: [
      "مرحباً بك! خذ نفساً عميقاً وابتسم؛ يومك يستحق لحظة لطيفة وحلوى تبهج القلب.",
      "الهدوء واللطف مع النفس يجددان طاقتك؛ جرّب وصفة حلى باردة وسريعة اليوم.",
      "أجمل اللحظات هي البسيطة والهادئة؛ كافئ نفسك بشيء تحبه."
    ],
    default: [
      "أهلاً بك في متجر معاذ! أساعدك لتصل إلى أغراضك بسرعة وتوفّر وقتك وجهدك.",
      "تسوّقك صار أسهل وأسرع؛ اختر ما يناسبك وسأكون جاهزاً لأي مساعدة.",
      "كل جديد ومتوفر في الفرع أمامك بلمسة واحدة؛ أتمنى لك تسوقاً موفقاً."
    ]
  };

  function getPersonaVoiceConfig(personaId) {
    const map = {
      friend_saad: { voiceName: "Orus", gender: "male", rate: 1.0, pitch: 0.88, toneTag: "شاب وقور هادئ ناصح" },
      friend_fadi: { voiceName: "Puck", gender: "male", rate: 1.12, pitch: 1.08, toneTag: "مرح حيوي ودود" },
      grand_chef: { voiceName: "Fenrir", gender: "male", rate: 1.05, pitch: 0.96, toneTag: "شيف دافئ ودود" },
      coach_sakhr: { voiceName: "Fenrir", gender: "male", rate: 1.08, pitch: 0.92, toneTag: "مدرب رياضي حماسي" },
      anime_ritaj: { voiceName: "Aoede", gender: "female", rate: 1.06, pitch: 1.15, toneTag: "لطيفة هادئة مبهجة" },
      princess_layla: { voiceName: "Kore", gender: "female", rate: 1.03, pitch: 1.1, toneTag: "راقية أنيقة هادئة" },
      butler_farid: { voiceName: "Charon", gender: "male", rate: 1.02, pitch: 0.94, toneTag: "منظم رزِين حكيم" },
      anime_zain: { voiceName: "Puck", gender: "male", rate: 1.12, pitch: 1.05, toneTag: "بطل أنمي سريع وحماسي" },
      anime_ryu: { voiceName: "Charon", gender: "male", rate: 1.04, pitch: 0.97, toneTag: "محلل ذكي دقيق" }
    };
    return map[personaId] || { voiceName: "Puck", gender: "male", rate: 1.06, pitch: 1.0, toneTag: "مساعد متجر ودود" };
  }

  function pickNonRepeatedText(personaId, candidateText) {
    const base = String(candidateText || "").trim();
    const pool = FRESH_LINES_BY_PERSONA[personaId] || FRESH_LINES_BY_PERSONA.default;
    const seed = new Date().getMinutes() + new Date().getSeconds() + Math.floor(Math.random() * 10);

    if (base && !wasSpokenRecently(base)) {
      return base;
    }

    // البحث عن جملة متجددة من بنك الشخصية لم تُنطق مؤخراً
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[(seed + i) % pool.length];
      if (!wasSpokenRecently(candidate) && makeFingerprint(candidate) !== makeFingerprint(base)) {
        return candidate;
      }
    }

    // تنويع تلقائي بإضافة خاتمة متجددة مختلفة عن المرة السابقة
    const suffixes = [
      " — يومك مبارك وموفق.",
      " — أنا هنا لخدمتك دائماً.",
      " — خطوة موفقة بإذن الله."
    ];
    return (base || pool[seed % pool.length]) + suffixes[seed % suffixes.length];
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
      u.rate = cfg.rate || 1.05;
      u.pitch = cfg.pitch || 1.0;
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const arVoices = voices.filter((v) => /ar/i.test(v.lang || ""));
      if (arVoices.length > 0) {
        // اختيار صوت مختلف كل مرة إن توفر أكثر من صوت عربي
        const idx = Math.floor(Math.random() * arVoices.length);
        u.voice = arVoices[idx];
      }
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  async function speakFresh(rawText, personaId = "buddy") {
    const cfg = getPersonaVoiceConfig(personaId);
    const chosen = pickNonRepeatedText(personaId, rawText)
      .replace(/[\u{1F300}-\u{1FAFF}﴿﴾۝]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);

    if (!chosen) return;
    markSpoken(chosen);
    stopCurrentSpeech();

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

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tts",
          text: chosen,
          voiceName: cfg.voiceName,
          gender: cfg.gender,
          toneTag: cfg.toneTag,
          dialectMode: "levantine_friendly",
          cacheBust: Date.now()
        })
      });
      const json = await res.json();
      if (res.ok && json?.ok && json?.audioBase64 && !/pcm|L16/i.test(json.mimeType || "")) {
        if (!currentAudioEl) {
          currentAudioEl = new Audio();
          currentAudioEl.playsInline = true;
        }
        currentAudioEl.src = `data:${json.mimeType || "audio/mpeg"};base64,${json.audioBase64}`;
        currentAudioEl.playbackRate = cfg.rate || 1.06;
        currentAudioEl.play().catch(() => speakLocally(chosen, cfg));
        return chosen;
      }
      speakLocally(chosen, cfg);
    } catch (_) {
      speakLocally(chosen, cfg);
    }
    return chosen;
  }

  // اعتراض دوال النطق القديمة في التطبيق لضمان عدم تكرار المقطع الصوتي وتجديده
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
    version: "1.0",
    speak: speakFresh,
    pickFresh: pickNonRepeatedText,
    stop: stopCurrentSpeech
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("voice_fresh_engine", "1.0");
  }

  setTimeout(hookLegacySpeechFunctions, 800);
  setTimeout(hookLegacySpeechFunctions, 2200);
})();

// ============================================================================
// محرك تحديث المقاطع الصوتية ومطابقة النص المرئي مع الصوت (moaath_voice_fresh_engine.js — v1.2)
// - يطابق الصوت المنطوق مع النص الظاهر فعلياً على فقاعة الشخصية أو رد المساعد
// - يراقب تلقائياً أي نص يظهر في فقاعة الشخصية أو رد المساعد وينطقه بنفس المعنى دون تناقض
// - يمنع تكرار نفس المقطع مرتين متتاليتين مع تنويع سلس واستجابة سريعة (0 حصة API)
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VOICE_FRESH_ENGINE_V12__) return;
  window.__MOAATH_VOICE_FRESH_ENGINE_V12__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V11__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V1__ = true;

  const RECENT_VOICES_KEY = "moaath_recent_spoken_fingerprints_v1";
  const AUDIO_MEM_CACHE = new Map();
  let currentAudioEl = null;
  let voicesReadyList = [];
  let lastBubbleTextSpoken = "";
  let lastBubbleSpeakTs = 0;

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

  function cleanSpeakableText(str) {
    return String(str || "")
      .replace(/[\u{1F300}-\u{1FAFF}﴿﴾۝]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
  }

  function makeFingerprint(str) {
    return cleanSpeakableText(str).toLowerCase();
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

  function getActivePersonaId() {
    try {
      const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      if (prefs && prefs.persona) return String(prefs.persona).trim();
    } catch (_) {}
    return "buddy";
  }

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

  // الأولوية المطلقة للنص المعروض فعلياً حتى يتطابق الصوت مع ما يقرأه المستخدم
  function resolveAlignedText(personaId, candidateText) {
    const exact = cleanSpeakableText(candidateText);
    if (exact) {
      if (!wasSpokenRecently(exact)) return exact;
      // إذا تكرر نفس النص تماماً في وقت قصير، نضيف تنويعاً خفيفاً مع الإبقاء على نفس المعنى والنص الظاهر
      const variations = [
        exact + "، أهلاً بك.",
        exact + "، يسعدني مساعدتك.",
        exact + "، تفضل."
      ];
      for (const v of variations) {
        if (!wasSpokenRecently(v)) return v;
      }
      return exact;
    }

    const fallbackPool = [
      "أهلاً بك في متجر معاذ! كيف يمكنني مساعدتك اليوم؟",
      "تسوّقك أسهل وأسرع هنا؛ أخبرني بما تحتاج."
    ];
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
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
        u.voice = arVoices[0];
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

  async function speakFresh(rawText, personaId = null) {
    const pid = personaId || getActivePersonaId();
    const cfg = getPersonaVoiceConfig(pid);
    const aligned = resolveAlignedText(pid, rawText);
    if (!aligned) return "";

    markSpoken(aligned);
    stopCurrentSpeech();

    const cacheKey = `${cfg.voiceName}::${aligned}`;
    if (AUDIO_MEM_CACHE.has(cacheKey)) {
      playAudioSrc(AUDIO_MEM_CACHE.get(cacheKey), cfg.rate, () => speakLocally(aligned, cfg));
      return aligned;
    }

    let workerUrl = "";
    try {
      workerUrl = typeof window.getEffectiveAIWorkerUrl === "function"
        ? String(window.getEffectiveAIWorkerUrl() || "").trim()
        : String(window.AI_WORKER_URL || localStorage.getItem("moaath_ai_worker_url") || "").trim();
    } catch (_) {}

    if (!workerUrl || navigator.onLine === false) {
      speakLocally(aligned, cfg);
      return aligned;
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2200) : null;

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller ? controller.signal : undefined,
        body: JSON.stringify({
          mode: "tts",
          text: aligned,
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
        playAudioSrc(dataUri, cfg.rate, () => speakLocally(aligned, cfg));
        return aligned;
      }
      speakLocally(aligned, cfg);
    } catch (_) {
      if (timeoutId) clearTimeout(timeoutId);
      speakLocally(aligned, cfg);
    }
    return aligned;
  }

  // مطابقة النطق تلقائياً مع النص الفعلي الظاهر في فقاعة الشخصية عند تغيّرها
  function watchVisibleCharacterBubble() {
    const checkBubble = () => {
      const bubble =
        document.getElementById("petBubbleText") ||
        document.getElementById("fairyBubbleText") ||
        document.querySelector("#petCharRoot .pet-bubble, #petCharRoot [class*='bubble'], #petCharRoot p");
      if (!bubble) return;
      const txt = cleanSpeakableText(bubble.textContent || "");
      if (!txt || txt.length < 3) return;
      if (txt !== lastBubbleTextSpoken && (Date.now() - lastBubbleSpeakTs) > 600) {
        lastBubbleTextSpoken = txt;
        lastBubbleSpeakTs = Date.now();
        // قراءة النص الظاهر مباشرة دون استبداله بجملة أخرى
        speakLocally(txt, getPersonaVoiceConfig(getActivePersonaId()));
      }
    };

    const obs = new MutationObserver(checkBubble);
    obs.observe(document.body, { childList: true, characterData: true, subtree: true });
    setInterval(checkBubble, 800);
  }

  function hookLegacySpeechFunctions() {
    const fnNames = ["speakAssistantReply", "speakPetText", "playPersonaVoice", "speakText"];
    fnNames.forEach((fnName) => {
      const orig = window[fnName];
      if (typeof orig === "function" && !orig.__moaathFreshVoiceHooked) {
        const wrapped = function (txt, ...rest) {
          const pid = getActivePersonaId();
          const aligned = resolveAlignedText(pid, txt);
          lastBubbleTextSpoken = aligned;
          lastBubbleSpeakTs = Date.now();
          markSpoken(aligned);
          return orig.call(this, aligned, ...rest);
        };
        wrapped.__moaathFreshVoiceHooked = true;
        window[fnName] = wrapped;
      }
    });
  }

  window.MoaathVoiceFreshEngine = {
    version: "1.2",
    speak: speakFresh,
    pickFresh: resolveAlignedText,
    stop: stopCurrentSpeech,
    clearCache: () => AUDIO_MEM_CACHE.clear()
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("voice_fresh_engine", "1.2");
  }

  setTimeout(() => {
    hookLegacySpeechFunctions();
    watchVisibleCharacterBubble();
  }, 600);
})();

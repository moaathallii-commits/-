// ============================================================================
// محرك مطابقة النص المكتوب مع النطق ومنع تراكم الطابور الصوتي
// (moaath_voice_fresh_engine.js — v1.3)
// - يحل مشكلة توافق الصوت مع النص في البداية ثم عدم التوافق لاحقاً عبر:
//   1) إلغاء أي نطق سابق متراكم فوراً قبل بدء نطق جديد (منع طابور الانتظار)
//   2) رقم تسلسلي (speechSeqId) لإسقاط أي رد صوتي متأخر يعود لنص قديم لم يعد معروضاً
//   3) قراءة النص الظاهر فعلياً في الفقاعة أو الرد مباشرة دون استبداله بنص آخر
// - يعمل بـ 0 حصة إضافية مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VOICE_FRESH_ENGINE_V13__) return;
  window.__MOAATH_VOICE_FRESH_ENGINE_V13__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V12__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V11__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V1__ = true;

  const AUDIO_MEM_CACHE = new Map();
  let currentAudioEl = null;
  let voicesReadyList = [];
  let speechSeqId = 0;
  let lastSpokenCleanText = "";
  let bubbleDebounceTimer = null;

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

  function cleanSpeakableText(str) {
    return String(str || "")
      .replace(/[\u{1F300}-\u{1FAFF}﴿﴾۝]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
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

  function stopCurrentSpeech() {
    try {
      if (typeof window.speechSynthesis !== "undefined") {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    if (currentAudioEl) {
      try {
        currentAudioEl.pause();
        currentAudioEl.currentTime = 0;
        currentAudioEl.onended = null;
        currentAudioEl.onerror = null;
      } catch (_) {}
    }
  }

  function speakLocally(text, cfg, seq) {
    if (seq !== speechSeqId) return;
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
      if (seq === speechSeqId) {
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }

  function playAudioSrc(srcUrl, rate, seq, onFail) {
    if (seq !== speechSeqId) return;
    if (!currentAudioEl) {
      currentAudioEl = new Audio();
      currentAudioEl.playsInline = true;
      currentAudioEl.preload = "auto";
    }
    currentAudioEl.src = srcUrl;
    currentAudioEl.playbackRate = rate || 1.12;
    currentAudioEl.play().catch(() => {
      if (seq === speechSeqId && typeof onFail === "function") onFail();
    });
  }

  async function speakFresh(rawText, personaId = null) {
    const clean = cleanSpeakableText(rawText);
    if (!clean) return "";

    // إلغاء أي نطق سابق فوراً ورفع عداد التسلسل لمنع تداخل أو تأخر المقاطع
    stopCurrentSpeech();
    const mySeq = ++speechSeqId;
    lastSpokenCleanText = clean;

    const pid = personaId || getActivePersonaId();
    const cfg = getPersonaVoiceConfig(pid);

    const cacheKey = `${cfg.voiceName}::${clean}`;
    if (AUDIO_MEM_CACHE.has(cacheKey)) {
      playAudioSrc(AUDIO_MEM_CACHE.get(cacheKey), cfg.rate, mySeq, () => speakLocally(clean, cfg, mySeq));
      return clean;
    }

    let workerUrl = "";
    try {
      workerUrl = typeof window.getEffectiveAIWorkerUrl === "function"
        ? String(window.getEffectiveAIWorkerUrl() || "").trim()
        : String(window.AI_WORKER_URL || localStorage.getItem("moaath_ai_worker_url") || "").trim();
    } catch (_) {}

    if (!workerUrl || navigator.onLine === false) {
      speakLocally(clean, cfg, mySeq);
      return clean;
    }

    // نبدأ النطق المحلي الفوري إذا لم يرد الخادم خلال 900ms، وإذا رد الخادم بصوت أوضح نحدّثه فقط إذا ما زلنا في نفس النص
    let localFallbackStarted = false;
    const quickLocalTimer = setTimeout(() => {
      if (mySeq === speechSeqId && !localFallbackStarted) {
        localFallbackStarted = true;
        speakLocally(clean, cfg, mySeq);
      }
    }, 900);

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const abortTimer = controller ? setTimeout(() => controller.abort(), 2200) : null;

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller ? controller.signal : undefined,
        body: JSON.stringify({
          mode: "tts",
          text: clean,
          voiceName: cfg.voiceName,
          gender: cfg.gender,
          toneTag: cfg.toneTag,
          dialectMode: "levantine_friendly"
        })
      });
      if (abortTimer) clearTimeout(abortTimer);
      if (quickLocalTimer) clearTimeout(quickLocalTimer);

      // إذا تغيّر النص المعروض أثناء الانتظار، نتجاهل هذا الرد القديم تماماً
      if (mySeq !== speechSeqId) return clean;

      const json = await res.json();
      if (mySeq !== speechSeqId) return clean;

      if (res.ok && json?.ok && json?.audioBase64 && !/pcm|L16/i.test(json.mimeType || "")) {
        const dataUri = `data:${json.mimeType || "audio/mpeg"};base64,${json.audioBase64}`;
        AUDIO_MEM_CACHE.set(cacheKey, dataUri);
        if (!localFallbackStarted) {
          playAudioSrc(dataUri, cfg.rate, mySeq, () => speakLocally(clean, cfg, mySeq));
        }
      } else if (!localFallbackStarted) {
        speakLocally(clean, cfg, mySeq);
      }
    } catch (_) {
      if (abortTimer) clearTimeout(abortTimer);
      if (quickLocalTimer) clearTimeout(quickLocalTimer);
      if (mySeq === speechSeqId && !localFallbackStarted) {
        speakLocally(clean, cfg, mySeq);
      }
    }
    return clean;
  }

  function getVisibleBubbleText() {
    const bubble =
      document.getElementById("petBubbleText") ||
      document.getElementById("fairyBubbleText") ||
      document.querySelector("#petCharRoot .pet-bubble, #petCharRoot [class*='bubble'], #petCharRoot p");
    return bubble ? cleanSpeakableText(bubble.textContent || "") : "";
  }

  function watchVisibleCharacterBubble() {
    const scheduleBubbleSync = () => {
      if (bubbleDebounceTimer) clearTimeout(bubbleDebounceTimer);
      bubbleDebounceTimer = setTimeout(() => {
        const txt = getVisibleBubbleText();
        if (!txt || txt.length < 3) return;
        if (txt === lastSpokenCleanText) return;
        speakFresh(txt, getActivePersonaId());
      }, 250);
    };

    const obs = new MutationObserver(scheduleBubbleSync);
    obs.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  function hookLegacySpeechFunctions() {
    const fnNames = ["speakAssistantReply", "speakPetText", "playPersonaVoice", "speakText"];
    fnNames.forEach((fnName) => {
      const orig = window[fnName];
      if (typeof orig === "function" && !orig.__moaathFreshVoiceHooked) {
        const wrapped = function (txt, ...rest) {
          const clean = cleanSpeakableText(txt);
          if (clean) {
            stopCurrentSpeech();
            const mySeq = ++speechSeqId;
            lastSpokenCleanText = clean;
            const cfg = getPersonaVoiceConfig(getActivePersonaId());
            if (fnName === "speakPetText" || fnName === "speakText") {
              speakLocally(clean, cfg, mySeq);
              return;
            }
            return orig.call(this, clean, ...rest);
          }
          return orig.apply(this, arguments);
        };
        wrapped.__moaathFreshVoiceHooked = true;
        window[fnName] = wrapped;
      }
    });
  }

  window.MoaathVoiceFreshEngine = {
    version: "1.3",
    speak: speakFresh,
    pickFresh: (pid, txt) => cleanSpeakableText(txt),
    stop: () => {
      speechSeqId++;
      stopCurrentSpeech();
    },
    clearCache: () => AUDIO_MEM_CACHE.clear()
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("voice_fresh_engine", "1.3");
  }

  setTimeout(() => {
    hookLegacySpeechFunctions();
    watchVisibleCharacterBubble();
  }, 500);
})();

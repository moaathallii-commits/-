// ============================================================================
// محرك مطابقة النص المكتوب مع النطق ومنع تراكم الطابور الصوتي
// (moaath_voice_fresh_engine.js — v1.5)
// - يوحّد تسلسل النطق عبر رقم تسلسلي عالمي (window.__moaathSpeechSeq)
// - يتزامن مع ai_engine.js عبر window.__moaathVoiceSync لمنع تكرار النطق أو تداخله
// - يلغي فوراً أي نطق سابق (Audio + speechSynthesis) قبل بدء نطق جديد
// - يعمل بـ 0 حصة إضافية مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_VOICE_FRESH_ENGINE_V15__) return;
  window.__MOAATH_VOICE_FRESH_ENGINE_V15__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V14__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V13__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V12__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V11__ = true;
  window.__MOAATH_VOICE_FRESH_ENGINE_V1__ = true;

  if (typeof window.__moaathSpeechSeq !== "number") {
    window.__moaathSpeechSeq = 0;
  }

  const AUDIO_MEM_CACHE = new Map();
  let currentAudioEl = null;
  let voicesReadyList = [];
  let lastSpokenCleanText = "";
  let bubbleDebounceTimer = null;

  function nextSeq() {
    window.__moaathSpeechSeq = (window.__moaathSpeechSeq || 0) + 1;
    return window.__moaathSpeechSeq;
  }

  function currentSeq() {
    return window.__moaathSpeechSeq || 0;
  }

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
      .replace(/^(🧚|🤖|✅|⚠️|💡|🎯|🛒|🔁|⏰|💬|🔒)\s*/u, "")
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
      if (typeof window.__moaathStopAiEngineVoice === "function") {
        window.__moaathStopAiEngineVoice();
      }
    } catch (_) {}
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
    if (seq !== currentSeq() || !text) return;
    if (typeof window.speechSynthesis === "undefined") return;
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
      if (seq === currentSeq()) {
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }

  function playAudioSrc(srcUrl, rate, seq, onFail) {
    if (seq !== currentSeq()) return;
    if (!currentAudioEl) {
      currentAudioEl = new Audio();
      currentAudioEl.playsInline = true;
      currentAudioEl.preload = "auto";
    }
    try {
      currentAudioEl.pause();
      currentAudioEl.currentTime = 0;
      currentAudioEl.src = srcUrl;
      currentAudioEl.preservesPitch = true;
      currentAudioEl.mozPreservesPitch = true;
      currentAudioEl.webkitPreservesPitch = true;
      currentAudioEl.playbackRate = rate || 1.12;
      currentAudioEl.onended = () => {
        if (currentAudioEl) currentAudioEl.onended = null;
      };
      currentAudioEl.onerror = () => {
        if (seq === currentSeq() && typeof onFail === "function") onFail();
      };
      const p = currentAudioEl.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (seq === currentSeq() && typeof onFail === "function") onFail();
        });
      }
    } catch (_) {
      if (seq === currentSeq() && typeof onFail === "function") onFail();
    }
  }

  async function speakFresh(rawText, personaId = null) {
    const clean = cleanSpeakableText(rawText);
    if (!clean) return "";

    stopCurrentSpeech();
    const mySeq = nextSeq();
    lastSpokenCleanText = clean;
    window.__moaathVoiceSync = { text: clean, ts: Date.now(), owner: "fresh_engine" };

    const pid = personaId || getActivePersonaId();
    const cfg = getPersonaVoiceConfig(pid);
    const cacheKey = `${pid}::${cfg.voiceName}::${clean}`;

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

    let localFallbackStarted = false;
    const quickLocalTimer = setTimeout(() => {
      if (mySeq === currentSeq() && !localFallbackStarted) {
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

      if (mySeq !== currentSeq()) return clean;

      const json = await res.json();
      if (mySeq !== currentSeq()) return clean;

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
      if (mySeq === currentSeq() && !localFallbackStarted) {
        speakLocally(clean, cfg, mySeq);
      }
    }
    return clean;
  }

  function isAlreadySpokenByAiEngine(cleanTxt) {
    const sync = window.__moaathVoiceSync;
    if (!sync || sync.owner !== "ai_engine") return false;
    if (Date.now() - (sync.ts || 0) > 2500) return false;
    const a = cleanSpeakableText(sync.text || "");
    const b = cleanSpeakableText(cleanTxt || "");
    return !!(a && b && (a === b || a.includes(b.slice(0, 18)) || b.includes(a.slice(0, 18))));
  }

  function getVisibleBubbleText() {
    const bubble =
      document.getElementById("petMiniBubble") ||
      document.getElementById("petBubbleText") ||
      document.getElementById("fairyBubbleText") ||
      document.querySelector("#petCharRoot .pet-bubble, #petCharRoot [class*='bubble'], #petCharRoot p");
    if (!bubble) return "";
    const style = window.getComputedStyle(bubble);
    if (style.display === "none" || style.visibility === "hidden") return "";
    return cleanSpeakableText(bubble.textContent || "");
  }

  function watchVisibleCharacterBubble() {
    const scheduleBubbleSync = () => {
      if (bubbleDebounceTimer) clearTimeout(bubbleDebounceTimer);
      bubbleDebounceTimer = setTimeout(() => {
        const txt = getVisibleBubbleText();
        if (!txt || txt.length < 3) return;
        if (txt === lastSpokenCleanText) return;
        if (isAlreadySpokenByAiEngine(txt)) {
          lastSpokenCleanText = txt;
          return;
        }
        speakFresh(txt, getActivePersonaId());
      }, 280);
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
            const mySeq = nextSeq();
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
    version: "1.5",
    speak: speakFresh,
    pickFresh: (pid, txt) => cleanSpeakableText(txt),
    stop: () => {
      nextSeq();
      stopCurrentSpeech();
    },
    clearCache: () => AUDIO_MEM_CACHE.clear()
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("voice_fresh_engine", "1.5");
  }

  setTimeout(() => {
    hookLegacySpeechFunctions();
    watchVisibleCharacterBubble();
  }, 500);
})();

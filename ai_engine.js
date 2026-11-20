// ============================================================================
// محرك الجنيات المتحدثة ثلاثية الأبعاد لمتجر معاذ (v68 - Guaranteed Audible TTS & Diagnostics)
// - إلغاء كامل ونهائي للتحقق من الدفع وشام كاش عبر الذكاء الاصطناعي
// - ضمان خروج الصوت بوضوح على الهاتف عبر مشغل صوت مباشر موثوق + دعم Web Audio detune عند الإمكان
// - بحث ذكي عن رابط Cloudflare Worker في عدة مصادر لتجنب الخروج الصامت
// - كشف فوري لحالة الصوت والـ Worker في الشارة الجانبية مع إمكانية الاختبار المباشر
// - رفع سرعة التحدث قليلاً لجميع الشخصيات + أسلوب بشري حر وتلقائي
// ============================================================================

(function () {
  if (window.__MOAATH_AI_V68_LOADED__) return;
  window.__MOAATH_AI_V68_LOADED__ = true;

  const PREFS_KEY = "moaath_pet_v68_prefs";
  const POS_KEY = "moaath_pet_v68_pos";
  const LEARN_KEY = "moaath_pet_v68_learned";

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

  function pickPhrase(list, key) {
    if (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.pickPhrase === "function") {
      return window.MoaathAIPersonas.pickPhrase(list, key);
    }
    return Array.isArray(list) && list.length ? list[0] : "";
  }

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
    lastGeminiError: ""
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

  function guardAgainstPaymentAI(text) {
    const norm = cleanArabicNorm(text || "");
    return /دفع|تحويل|شام\s*كاش|شامكاش|ايصال|اشعار\s*دفع|تحقق\s*من\s*الدفع|رصيد\s*دفع|فاتوره\s*دفع/.test(norm);
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

  function cleanArabicNorm(str) {
    const base = typeof normalizeArabic === "function" ? normalizeArabic(str) : String(str || "");
    return base
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\w\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

  function stopEmbeddedVoice() {
    ttsRequestSeq++;
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
    return String(txt || "")
      .replace(/\b1\s*(مواد|قطع|اصناف|أصناف)\b/g, "صنف واحد")
      .replace(/\b2\s*(مواد|قطع|اصناف|أصناف)\b/g, "صنفين")
      .replace(/\b(\d+)\s*ل\.?س\b/g, "$1 ليرة")
      .replace(/\b0\b/g, "صفر");
  }

  function shortenForSpeech(text, maxWords = 16) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    const sliced = words.slice(0, maxWords).join(" ");
    const lastPunct = Math.max(sliced.lastIndexOf("،"), sliced.lastIndexOf("."), sliced.lastIndexOf("!"));
    if (lastPunct > sliced.length * 0.55) return sliced.slice(0, lastPunct + 1).trim();
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
    return shortenForSpeech(cleaned, 16);
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
    player.playbackRate = persona.speed || 1.22;
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
      // إبقاء النبرة قريبة من الطبيعي قدر الإمكان لتجنب صوت الروبوت أو التضخيم المزعج
      if (src.detune) {
        src.detune.value = Math.max(-90, Math.min(90, (persona.fallbackDetune || 0) * 0.25));
      }
      src.playbackRate.value = persona.fallbackRate || 1.13;
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

  const PERSISTENT_TTS_CACHE_NAME = "moaath_tts_human_v68";
  const missingLocalClips = new Set();

  function detectStaticClipName(persona, spokenText) {
    const t = normalizeTextForArabicSpeech(spokenText);
    if (t === normalizeTextForArabicSpeech(persona.greet)) return "greet";
    if (t === normalizeTextForArabicSpeech(persona.chatGood)) return "chatGood";
    if (t === normalizeTextForArabicSpeech(persona.thanks)) return "thanks";
    return null;
  }

  async function tryLocalRepoClip(persona, spokenText, mySeq, cacheKey) {
    const clipName = detectStaticClipName(persona, spokenText);
    if (!clipName) return false;
    const relUrl = `sounds/${persona.id}_${clipName}.mp3`;
    if (missingLocalClips.has(relUrl)) return false;

    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey);
      if (cached?.source === "local_repo") {
        sessionCtx.lastTtsSource = "local_repo";
        updateVoiceSourceBadge("🔊 يتحدث", "#00e676", relUrl);
        playViaHtmlAudio(cached, persona, mySeq);
        return true;
      }
    }

    try {
      const res = await fetch(relUrl, { method: "GET", cache: "force-cache" });
      if (!res.ok) {
        missingLocalClips.add(relUrl);
        return false;
      }
      const cType = res.headers.get("content-type") || "";
      if (/text\/html/i.test(cType)) {
        missingLocalClips.add(relUrl);
        return false;
      }
      const blob = await res.blob();
      if (mySeq !== ttsRequestSeq) return true;
      const blobUrl = URL.createObjectURL(blob);
      const entry = { url: blobUrl, rawBuffer: null, source: "local_repo", geminiError: "" };
      if (ttsAudioCache.size > 30) {
        const firstKey = ttsAudioCache.keys().next().value;
        const oldEntry = ttsAudioCache.get(firstKey);
        if (oldEntry?.url) URL.revokeObjectURL(oldEntry.url);
        ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, entry);
      sessionCtx.lastTtsSource = "local_repo";
      updateVoiceSourceBadge("🔊 يتحدث", "#00e676", relUrl);
      playViaHtmlAudio(entry, persona, mySeq);
      return true;
    } catch (_) {
      missingLocalClips.add(relUrl);
      return false;
    }
  }

  async function readPersistentHumanCache(cacheKey) {
    if (typeof caches === "undefined") return null;
    try {
      const cache = await caches.open(PERSISTENT_TTS_CACHE_NAME);
      const reqUrl = "https://moaath-tts.local/" + encodeURIComponent(cacheKey);
      const match = await cache.match(reqUrl);
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
      if (keys.length >= 25) {
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

    stopEmbeddedVoice();
    const mySeq = ttsRequestSeq;

    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const voiceName = persona.voiceName || "Puck";
    const cacheKey = `${persona.id}::${voiceName}::${spokenText}`;

    const playEntry = async (entry) => {
      if (mySeq !== ttsRequestSeq) return;
      sessionCtx.lastTtsSource = entry.source;
      sessionCtx.lastGeminiError = entry.geminiError || "";

      if (entry.source === "gemini_tts" || entry.source === "persistent_cache" || entry.source === "local_repo") {
        updateVoiceSourceBadge("🔊 يتحدث", "#00e676", entry.source);
        playViaHtmlAudio(entry, persona, mySeq);
      } else {
        if (entry.geminiError) console.info("[TTS Diagnostic]", entry.geminiError);
        updateVoiceSourceBadge("🔊 يتحدث", "#38bdf8", "صوت نشط");
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
      updateVoiceSourceBadge("🟡 محلي", "#ff9800", "لا يوجد اتصال بالإنترنت");
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
          styleHint: persona.styleHint || ""
        })
      });
      const json = await res.json();
      if (mySeq !== ttsRequestSeq) return;

      if (!res.ok || !json?.ok || !json?.audioBase64) {
        updateVoiceSourceBadge("🟢 جاهز", "#00e676", "جاهز");
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
      updateVoiceSourceBadge("🟡 محلي", "#ff9800", "اتصال محدود");
    }
  }

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
    if (!PERSONAS[key]) return;
    haptic(15);
    unlockEmbeddedVoice();
    pauseRoaming(7500);
    setPrefs({ persona: key });
    syncVisuals();
    const p = PERSONAS[key];
    const greetLine = (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.getTimeGreet === "function")
      ? window.MoaathAIPersonas.getTimeGreet(p.id)
      : pickPhrase(p.greets || [p.greet], `greet_${p.id}`);
    const specEl = $("fairySpecialtyNote");
    if (specEl) specEl.textContent = p.specialtyNote || "";
    showBubble(`🧚 ${greetLine}`, 3800);
    speakOutLoud(greetLine, true);
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

    // حصر التجوال على الحواف الجانبية فقط (يمين أو يسار) لتجنب تغطية أزرار الشراء
    const stickLeft = curR > window.innerWidth / 2;
    const nextR = stickLeft ? maxR : 12;
    const nextB = Math.round(Math.max(minB, Math.min(maxB, curB + (Math.random() - 0.5) * 120)));

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

    const LOCAL_SYN_KEY = "moaath_local_synonyms_v68";

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

    return [...adminList, ...DEFAULT_RECIPES];
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
    return { recipe: matched, availableItems: availableItems.slice(0, 8), missingIngredients };
  }

  function matchCasualChat(normText, persona) {
    if (/^(ال)?سلام\s*عليكم|السلام/.test(normText)) return pickPhrase(persona.greets || [persona.greet], `greet_${persona.id}`);
    if (/^(مرحبا|اهلا|هلا|هاي|صباح\s*الخير|مساء\s*الخير)/.test(normText)) return pickPhrase(persona.greets || [persona.greet], `greet_${persona.id}`);
    if (/كيف\s*حالك|شلونك|كيفك|شو\s*اخبارك|اخبارك/.test(normText)) return pickPhrase(persona.chatGoods || [persona.chatGood], `good_${persona.id}`);
    if (/شكرا|مشكور|يعطيك\s*العافيه|يسلمو/.test(normText)) return pickPhrase(persona.thanksList || [persona.thanks], `thanks_${persona.id}`);
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
    if (!/(مفضلاتي|عادات|معتاد|المعتادة)/.test(normText)) return false;
    if (window.MoaathAIBrain && typeof window.MoaathAIBrain.getPersonalHabitSuggestions === "function") {
      const picks = window.MoaathAIBrain.getPersonalHabitSuggestions(products || {}, getBranchAvail, 8);
      if (picks.length > 0) {
        openZeroDefaultModal("⭐ مفضلاتك المعتادة المتوفرة:", picks, "personal_habits");
        const prefs = getPrefs();
        const msg = (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.getHabitReaction === "function")
          ? window.MoaathAIPersonas.getHabitReaction(prefs.persona)
          : "عرضت لك الأصناف التي تعتاد اختيارها، حدد الكمية المناسبة.";
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

  window.closePetSuggestionsModal = function () {
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
      if (window.MoaathAIBrain && typeof window.MoaathAIBrain.recordCustomerChoice === "function") {
        chosen.forEach(it => {
          const baseId = String(it.id || "").replace(/_PKG$/, "");
          const cat = products?.[baseId]?.category || specialOffers?.[it.id]?.category || "";
          window.MoaathAIBrain.recordCustomerChoice(it.id, cat, it.qty, sessionCtx.lastQuery || "");
        });
      }
    }
    window.closePetSuggestionsModal();

    if (addedTotal > 0) {
      haptic([15, 35, 15]);
      const prefs = getPrefs();
      const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
      const countLabel = addedTotal === 1 ? "صنف واحد" : (addedTotal === 2 ? "صنفين" : `${addedTotal} أصناف`);
      const msg = (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.getAddedReaction === "function")
        ? window.MoaathAIPersonas.getAddedReaction(persona.id, countLabel)
        : `تمت إضافة ${countLabel} إلى السلة.`;
      setOrbEmotion("happy", msg, true);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      showToast(`✅ ${msg}`);
    }
  };

  function matchCategoriesAndProducts(normText) {
    if (window.MoaathAIBrain && typeof window.MoaathAIBrain.smartSearch === "function") {
      return window.MoaathAIBrain.smartSearch(
        sessionCtx.lastQuery || normText,
        products || {},
        categories || [],
        getBranchAvail,
        getUnitSYP
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
            storeMeta: { persona: persona.name, branch: typeof activeBranchId !== "undefined" ? activeBranchId : "main" }
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

    const nfLine = (window.MoaathAIPersonas && typeof window.MoaathAIPersonas.getNotFoundReaction === "function")
      ? window.MoaathAIPersonas.getNotFoundReaction(persona.id)
      : pickPhrase(persona.notFounds || [persona.notFound], `nf_${persona.id}`);
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
    if (!orb || !root || orb.dataset.v68Bound) return;
    orb.dataset.v68Bound = "1";

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

  const LOCAL_RECIPES_KEY = "moaath_local_recipes_v68";

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

  window.runAssistantQACheck = function () {
    const report = {
      version: "v68",
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
    console.info("[QA Assistant Diagnostic v68]", report);
    return report;
  };

  function mountV68() {
    window.analyzeShamCashReceiptOCR();
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const assistBox = $("aiSmartAssistantBox");

    if (assistBox && !$("petPersonaBar")) {
      const bar = document.createElement("div");
      bar.id = "petPersonaBar";
      bar.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:5px; flex-wrap:wrap; margin-bottom:6px; font-size:10px;";
      const opts = Object.values(PERSONAS).map(per =>
        `<option value="${per.id}">${per.name} — ${per.roleBadge}</option>`
      ).join("");
      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:4px; flex:1; min-width:155px;">
          <img id="fairyBarThumb" alt="${p.name}" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1.5px solid ${p.accent}; flex-shrink:0;">
          <span style="color:var(--gold-color); font-weight:bold;">الجنية:</span>
          <select id="petPersonaSelect" class="form-control" onchange="selectPetPersona(this.value)" style="padding:3px 6px; font-size:10px; flex:1;">${opts}</select>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <span id="petConnStatusBadge" style="font-size:9px; font-weight:bold;">🟢 جاهز</span>
          <button id="petDirectMicBtn" type="button" onclick="startVoiceShoppingInput()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,230,118,0.16); color:#00e676;" title="تحدّث الآن">🎙️</button>
          <button type="button" onclick="replayLastCompanionSpeech()" class="btn" style="width:auto; padding:3px 6px; font-size:10px; background:rgba(212,175,55,0.16); color:var(--gold-color);" title="إعادة الاستماع">🔁</button>
          <button type="button" onclick="toggleCompanionVoice()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff;" title="تفعيل أو كتم الصوت">🗣️ صوت</button>
          <button id="petShowCharBtn" type="button" onclick="setPetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار</button>
        </div>`;
      assistBox.insertBefore(bar, assistBox.firstChild);

      const specNote = document.createElement("div");
      specNote.id = "fairySpecialtyNote";
      specNote.style.cssText = "font-size:10px; color:var(--gray-text); margin-bottom:5px; line-height:1.35;";
      specNote.textContent = p.specialtyNote || "";
      bar.insertAdjacentElement("afterend", specNote);
    }

    if (assistBox && !$("petQuickPromptChips")) {
      const chips = document.createElement("div");
      chips.id = "petQuickPromptChips";
      chips.style.cssText = "display:flex; gap:5px; overflow-x:auto; padding:5px 0 2px 0; margin-top:4px; scrollbar-width:none;";
      const quickItems = [
        { label: "🍲 مقلوبة", q: "مقلوبة" },
        { label: "🍰 حلى سريع", q: "حلى بارد" },
        { label: "🏋️ أكل صحي", q: "أكل صحي رياضة" },
        { label: "🔥 سهرة ومتة", q: "سهرة ومتة" },
        { label: "💰 أوفر المتوفر", q: "أوفر المتوفر" },
        { label: "🛒 كمّل سلتي", q: "شو ناقصني كمّل سلتي" },
        { label: "⭐ مفضلاتي", q: "مفضلاتي المعتادة" },
        { label: "🔁 كرر طلبي", q: "كرر طلبي السابق" }
      ];
      chips.innerHTML = quickItems.map(it =>
        `<button type="button" onclick="runAIShoppingAssistant('${it.q}')" style="flex-shrink:0; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); border-radius:14px; padding:4px 9px; font-size:10px; font-weight:bold; cursor:pointer;">${it.label}</button>`
      ).join("");
      assistBox.appendChild(chips);
    }

    // احترام هدوء الزبون عند التركيز على حقول البحث أو الكتابة
    if (!window.__MOAATH_QUIET_HOOK_V68__) {
      window.__MOAATH_QUIET_HOOK_V68__ = true;
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
      styleTag.id = "petCharStyleV68";
      styleTag.textContent = `
        @keyframes fairyHover3D {
          0%, 100% { transform: translateY(0px) rotateX(4deg) rotateY(-4deg) scale(1); }
          50% { transform: translateY(-7px) rotateX(-5deg) rotateY(6deg) scale(1.04); }
        }
        @keyframes fairyShadow3D {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.42; }
          50% { transform: translateX(-50%) scale(0.75); opacity: 0.22; }
        }
        @keyframes fairyRingV68 {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.38); opacity: 0; }
        }
        @keyframes micPulseV68 {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
          50% { box-shadow: 0 0 0 7px rgba(0, 230, 118, 0); }
        }
        .mic-listening-pulse {
          animation: micPulseV68 1s infinite !important;
          background: rgba(0, 230, 118, 0.35) !important;
        }
        #petCharRoot {
          perspective: 760px;
          transform-style: preserve-3d;
          transition: right 1.15s cubic-bezier(0.22, 1, 0.36, 1), bottom 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
        }
        #petCharOrb {
          width: 62px; height: 62px; border-radius: 50%; border: 2.5px solid ${p.accent};
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
          border: 2.5px solid #00e676; pointer-events: none; animation: fairyRingV68 1.1s infinite;
        }
        #petMiniBubble {
          display: none; position: absolute; bottom: 72px; right: 0; max-width: 235px; width: max-content;
          background: var(--card-bg); color: var(--text-color); border: 1px solid var(--gold-color);
          border-radius: 10px; padding: 6px 9px; font-size: 11px; line-height: 1.4;
          box-shadow: 0 8px 20px rgba(0,0,0,0.45); pointer-events: none;
        }`;
      document.head.appendChild(styleTag);

      const root = document.createElement("div");
      root.id = "petCharRoot";
      root.style.cssText = "position:fixed; bottom:88px; right:14px; z-index:98;";
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
    startRoamLoop();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountV68(); };

  const _origRenderCart = window.renderCartModalItems;
  window.renderCartModalItems = function () {
    pauseRoaming(15000);
    const b = $("petMiniBubble");
    if (b) b.style.display = "none";
    if (typeof _origRenderCart === "function") _origRenderCart();
    enhanceCustomerCartCheckoutUX();
    renderSmartCartRecommendations();
  };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncVisuals, 60); };

  window.addEventListener("online", syncConnectivityBadge);
  window.addEventListener("offline", syncConnectivityBadge);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV68);
  else mountV68();
})();

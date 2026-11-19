// ============================================================================
// محرك المرافق المتحدث + صوت ناطق مدمج بدون الاعتماد على المتصفح (v43)
// - الاستغناء الكامل عن speechSynthesis الافتراضي للمتصفح
// - توليد أصوات ناطقة وانفعالية عربية مدمجة (Formant Vowel/Consonant Synth + PCM Audio)
//   بالإضافة لدعم الصوت السحابي الطبيعي عند الاتصال مع بديل صوتي مدمج فوري بلا إنترنت
// - الحفاظ على جميع ميزات v42 (نافذة الاقتراحات 0، الوصفات، التصدير، وصقل السلة)
// ============================================================================

(function () {
  if (window.__MOAATH_AI_V43_LOADED__) return;
  window.__MOAATH_AI_V43_LOADED__ = true;

  const PREFS_KEY = "moaath_pet_v43_prefs";
  const POS_KEY = "moaath_pet_v43_pos";
  const LEARN_KEY = "moaath_pet_v43_learned";

  const PERSONAS = {
    buddy: { id: "buddy", name: "بندق الودود", icon: "🐱", accent: "#00b0ff", f0: 155, speed: 1.0, greet: "وعليكم السلام يا هلا! نورت متجر معاذ، شو نجهزلك اليوم؟" },
    pro: { id: "pro", name: "صقر السريع", icon: "🦅", accent: "#00e676", f0: 132, speed: 1.15, greet: "أهلاً بك! جاهز لخدمتك بسرعة، اذكر الصنف أو الوصفة." },
    saver: { id: "saver", name: "ثعلب التوفير", icon: "🦊", accent: "#D4AF37", f0: 145, speed: 0.98, greet: "يا مرحبا! نجهزلك المتوفر بأفضل قيمة وتوفير." },
    lulu: { id: "lulu", name: "لولو اللطيفة", icon: "🐰", accent: "#ff7eb6", f0: 235, speed: 0.96, greet: "أهلاً فيكِ ونورتي المتجر! شو حابة تطبخي أو تحضّري حلى اليوم؟" },
    sara: { id: "sara", name: "سارة المنظمة", icon: "🦋", accent: "#7c4dff", f0: 215, speed: 1.04, greet: "مرحباً بكِ! نرتب مكونات الوصفة حسب المتوفر بكل دقة." },
    noor: { id: "noor", name: "نور الذكية", icon: "✨", accent: "#ff9800", f0: 225, speed: 1.08, greet: "أهلاً وسهلاً! اطلبي أي وصفة طبخ أو حلى وأنا أجهز المتوفر." }
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
    lastSpokenText: ""
  };

  let customRecipesDB = {};
  let activeRecognizer = null;
  let isHoldingSpeak = false;
  let bubbleTimer = null;
  let scrollTimer = null;
  let modalItemsState = [];
  let audioCtx = null;
  let currentVoiceNodes = [];
  let currentAudioElem = null;
  let speechUnlocked = false;
  let selectedRecipeProductIds = new Set();

  // إبقاء الدفع خارج نطاق الذكاء الاصطناعي تماماً
  window.analyzeShamCashReceiptOCR = function () {
    const outBox = $("shamCashOcrResult");
    if (outBox) outBox.innerHTML = "";
  };

  if (typeof db !== "undefined" && db.ref) {
    db.ref("recipes").on("value", snap => {
      customRecipesDB = snap.val() || {};
      if (typeof window.renderAdminRecipesList === "function") {
        window.renderAdminRecipesList();
      }
    });
  }

  function haptic(pattern = 15) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
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
  // [محرك الصوت المدمج — استغناء كامل عن speechSynthesis الافتراضي للمتصفح]
  // يعتمد على:
  // 1) تركيب الترددات الصوتية البشرية (Arabic Formant Vocal Tract Synthesizer)
  //    لتحويل الحروف والكلمات العربية إلى مقاطع صوتية (حركات/حروف) بطبقة صوت كل شخصية
  // 2) إيقاف فوري لأي صوت سابق ومنع التداخل + نبرة انفعالية واضحة لكل حالة
  // ==========================================================================
  function getAudioEngine() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") {
      try { audioCtx.resume(); } catch (_) {}
    }
    return audioCtx;
  }

  function unlockEmbeddedVoice() {
    if (speechUnlocked) return;
    speechUnlocked = true;
    getAudioEngine();
  }
  document.addEventListener("touchstart", unlockEmbeddedVoice, { once: true, passive: true });
  document.addEventListener("click", unlockEmbeddedVoice, { once: true });

  function stopEmbeddedVoice() {
    if (currentAudioElem) {
      try {
        currentAudioElem.pause();
        currentAudioElem.src = "";
      } catch (_) {}
      currentAudioElem = null;
    }
    currentVoiceNodes.forEach(node => {
      try { node.stop(); } catch (_) {}
      try { node.disconnect(); } catch (_) {}
    });
    currentVoiceNodes = [];
  }

  // تحسين النص للنطق العربي الطبيعي (تحويل الأرقام والرموز إلى صيغة مقروءة)
  function normalizeTextForArabicSpeech(rawText) {
    return String(rawText || "")
      .replace(/[\u{1F300}-\u{1FAFF}🐾✨🎤🎧🎙️🤔🤩💡📌📍🔊🔇🗣️🍲🌸🛍️🔁⏰✅⚠️]/gu, " ")
      .replace(/\+/g, " زائد ")
      .replace(/×/g, " ضرب ")
      .replace(/ل\.س/g, " ليرة سورية ")
      .replace(/(\d+)/g, " $1 ")
      .replace(/[•\-_*#|()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // خريطة الرنين الصوتي للحروف والحركات العربية (F1, F2, F3 Formants)
  function getArabicPhonemeFormants(ch) {
    // حروف مد وحركات مفتوحة (ا، آ، أ، إ، ى، ـَ)
    if (/[اأإآىَ]/.test(ch)) return { f1: 730, f2: 1180, f3: 2450, voiced: true, dur: 0.082 };
    // حروف مضمومة (و، ؤ، ـُ)
    if (/[وؤُ]/.test(ch)) return { f1: 340, f2: 860, f3: 2250, voiced: true, dur: 0.082 };
    // حروف مكسورة (ي، ئ، ـِ)
    if (/[يئِ]/.test(ch)) return { f1: 310, f2: 2250, f3: 2950, voiced: true, dur: 0.08 };
    // حروف رنينية أنفية (م، ن)
    if (/[من]/.test(ch)) return { f1: 280, f2: 1050, f3: 2200, voiced: true, dur: 0.072 };
    // حروف جانبية وتكرارية (ل، ر)
    if (/[لر]/.test(ch)) return { f1: 420, f2: 1450, f3: 2400, voiced: true, dur: 0.068 };
    // حروف احتكاكية مهموسة (س، ش، ص، ف، ث، ه، ح، خ)
    if (/[سشصفثهحخ]/.test(ch)) return { f1: 500, f2: 1800, f3: 2700, voiced: false, dur: 0.062 };
    // بقية الحروف العربية الصحيحة
    if (/[\u0621-\u064A]/.test(ch)) return { f1: 540, f2: 1520, f3: 2500, voiced: true, dur: 0.066 };
    // أرقام
    if (/[0-9]/.test(ch)) return { f1: 600, f2: 1400, f3: 2450, voiced: true, dur: 0.085 };
    // وقفة قصيرة عند المسافة أو الفاصلة
    return { pause: true, dur: ch === "،" || ch === "." ? 0.14 : 0.045 };
  }

  // توليد الصوت الناطق المدمج عبر تركيب الرنين الصوتي (بدون أي استدعاء لـ speechSynthesis)
  function speakOutLoud(rawText, force = false, emotion = "normal") {
    const prefs = getPrefs();
    if (!prefs.voiceEnabled && !force) return;

    const spokenText = normalizeTextForArabicSpeech(rawText);
    if (!spokenText) return;
    sessionCtx.lastSpokenText = spokenText;

    stopEmbeddedVoice();
    const ctx = getAudioEngine();
    if (!ctx) return;

    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const baseF0 = persona.f0 || 155;
    const rate = persona.speed || 1.0;

    // تعديل النبرة الانفعالية حسب الموقف
    const emotionMul = {
      greet: 1.08,
      happy: 1.12,
      choice: 1.03,
      listen: 0.96,
      normal: 1.0
    }[emotion] || 1.0;

    // تقليص النص الطويل جداً إلى جملة مركزة واضحة وسريعة الاستماع
    const compactChars = spokenText.slice(0, 75).split("");
    let cursorTime = ctx.currentTime + 0.02;

    // ضوضاء خفيفة مفلترة للحروف الاحتكاكية (س، ش، ف، هـ)
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.15), ctx.sampleRate);
    const nData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < nData.length; i++) {
      nData[i] = (Math.random() * 2 - 1) * 0.25;
    }

    compactChars.forEach((ch, idx) => {
      const ph = getArabicPhonemeFormants(ch);
      const stepDur = ph.dur / rate;

      if (ph.pause) {
        cursorTime += stepDur;
        return;
      }

      // منحنى تنغيم طبيعي للجملة (يرتفع في البداية وينخفض بلطف في النهاية)
      const progress = idx / Math.max(1, compactChars.length);
      const intonation = 1 + 0.12 * Math.sin(progress * Math.PI) - 0.08 * progress;
      const pitchNow = baseF0 * emotionMul * intonation;

      if (ph.voiced) {
        // مصدر الحبال الصوتية (Sawtooth) يمر عبر 3 مرشحات رنين (F1, F2, F3)
        const glottal = ctx.createOscillator();
        glottal.type = "sawtooth";
        glottal.frequency.setValueAtTime(pitchNow, cursorTime);
        glottal.frequency.exponentialRampToValueAtTime(pitchNow * 0.97, cursorTime + stepDur);

        const f1 = ctx.createBiquadFilter();
        f1.type = "bandpass";
        f1.frequency.setValueAtTime(ph.f1, cursorTime);
        f1.Q.setValueAtTime(6.5, cursorTime);

        const f2 = ctx.createBiquadFilter();
        f2.type = "bandpass";
        f2.frequency.setValueAtTime(ph.f2, cursorTime);
        f2.Q.setValueAtTime(8.0, cursorTime);

        const f3 = ctx.createBiquadFilter();
        f3.type = "bandpass";
        f3.frequency.setValueAtTime(ph.f3, cursorTime);
        f3.Q.setValueAtTime(9.5, cursorTime);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, cursorTime);
        env.gain.linearRampToValueAtTime(0.16, cursorTime + stepDur * 0.22);
        env.gain.exponentialRampToValueAtTime(0.0001, cursorTime + stepDur);

        glottal.connect(f1);
        glottal.connect(f2);
        glottal.connect(f3);
        f1.connect(env);
        f2.connect(env);
        f3.connect(env);
        env.connect(ctx.destination);

        glottal.start(cursorTime);
        glottal.stop(cursorTime + stepDur + 0.01);
        currentVoiceNodes.push(glottal);
      } else {
        // نطق الحروف الاحتكاكية المهموسة (س، ش، ص، ف، هـ)
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(ph.f2 * 1.4, cursorTime);
        bp.Q.setValueAtTime(4.0, cursorTime);

        const nEnv = ctx.createGain();
        nEnv.gain.setValueAtTime(0.0001, cursorTime);
        nEnv.gain.linearRampToValueAtTime(0.09, cursorTime + stepDur * 0.25);
        nEnv.gain.exponentialRampToValueAtTime(0.0001, cursorTime + stepDur);

        noise.connect(bp);
        bp.connect(nEnv);
        nEnv.connect(ctx.destination);

        noise.start(cursorTime);
        noise.stop(cursorTime + stepDur + 0.01);
        currentVoiceNodes.push(noise);
      }

      cursorTime += stepDur * 0.92;
    });
  }

  function playListenCue() {
    const ctx = getAudioEngine();
    if (!ctx) return;
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const now = ctx.currentTime;
    [p.f0 * 2.2, p.f0 * 2.8].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      g.gain.setValueAtTime(0.001, now + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.08, now + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.1);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.11);
    });
  }

  window.toggleCompanionVoice = function () {
    haptic(12);
    const prefs = getPrefs();
    const next = !prefs.voiceEnabled;
    setPrefs({ voiceEnabled: next });
    if (!next) stopEmbeddedVoice();
    const msg = next ? "تم تفعيل الصوت المدمج للمساعد، أهلاً بك!" : "تم كتم صوت المساعد.";
    showBubble(next ? "🗣️ الصوت المدمج مفعّل" : "🔇 الصوت مكتوم", 2800);
    showToast(next ? "🗣️ الصوت المدمج مفعّل" : "🔇 الصوت مكتوم");
    if (next) speakOutLoud(msg, true, "greet");
  };

  // دالة جلب الصور المصغرة الآمنة مع صورة افتراضية عند غياب الصورة
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
    return typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : (parseInt(pObj.stock) || 0);
  }

  window.selectPetPersona = function (key) {
    if (!PERSONAS[key]) return;
    haptic(15);
    setPrefs({ persona: key });
    syncVisuals();
    const p = PERSONAS[key];
    const msg = `أهلاً بك مع ${p.name}! اضغط مطوّلاً وتحدّث معي.`;
    showBubble(`${p.icon} ${msg}`, 3400);
    speakOutLoud(msg, false, "greet");
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
    if (!orb) return;

    const faces = { idle: p.icon, listening: "🎙️", thinking: "🤔", happy: "🤩", greet: "😊", choice: "🔀" };
    orb.textContent = faces[state] || p.icon;
    orb.style.borderColor = state === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = state === "listening" ? "block" : "none";
    if (bubbleTxt) {
      showBubble(bubbleTxt, state === "listening" ? 0 : 5400);
      if (shouldSpeak) {
        const emoMap = { greet: "greet", happy: "happy", choice: "choice", listening: "listen" };
        speakOutLoud(bubbleTxt, false, emoMap[state] || "normal");
      }
    }
  }

  function syncConnectivityBadge() {
    const badge = $("petConnStatusBadge");
    if (!badge) return;
    const online = navigator.onLine !== false;
    badge.textContent = online ? "🟢 متصل" : "🟡 محلي";
    badge.style.color = online ? "#00e676" : "#ff9800";
  }

  function syncVisuals() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const pos = getPos();
    const isLight = document.body.classList.contains("light-mode");

    const root = $("petCharRoot");
    const orb = $("petCharOrb");
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
      orb.textContent = p.icon;
      orb.style.borderColor = p.accent;
      orb.style.background = isLight
        ? "radial-gradient(circle at 28% 25%, #ffffff, #e6ebf2 72%)"
        : "radial-gradient(circle at 28% 25%, rgba(255,255,255,0.36), var(--card-bg) 66%)";
      orb.style.boxShadow = isLight
        ? `0 10px 22px rgba(0,0,0,0.2), 0 0 14px ${p.accent}55`
        : `0 12px 26px rgba(0,0,0,0.55), 0 0 16px ${p.accent}66, inset 0 2px 6px rgba(255,255,255,0.4)`;
    }
    syncConnectivityBadge();
  }

  // ==========================================================================
  // [A] صقل تجربة الزبون في السلة وإتمام الطلب (Checkout UX)
  // ==========================================================================
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
        <span style="color:var(--gold-color);">② التوصيل والدفع</span>
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
        <div style="display:flex; justify-content:space-between;"><span>طريقة الدفع:</span><b>${esc(payMethod)}</b></div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:4px; padding-top:4px; font-size:12px;">
          <span>الإجمالي النهائي:</span>
          <strong style="color:var(--gold-color);">${esc(totalTxt)} ل.س</strong>
        </div>
      `;
    }
  }

  // ==========================================================================
  // [B] تنظيم وتبسيط واجهات الإدارة والتصدير (Admin & Export UX)
  // ==========================================================================
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
      `;
      adminContent.appendChild(expDiv);
    }
  }

  // ==========================================================================
  // [C] التوصيات الذكية المصورة داخل السلة + نافذة الاقتراحات التفاعلية
  // ==========================================================================
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
      const branch = typeof getBranchName === "function" ? getBranchName(activeBranchId) : "الرئيسي";
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
    if (/^(ال)?سلام\s*عليكم|السلام/.test(normText)) return persona.greet;
    if (/^(مرحبا|اهلا|هلا|هاي|صباح\s*الخير|مساء\s*الخير)/.test(normText)) return persona.greet;
    if (/كيف\s*حالك|شلونك|كيفك|شو\s*اخبارك|اخبارك/.test(normText)) return "الحمد لله بألف خير! خبرني شو نطبخ أو نجهزلك اليوم؟";
    if (/شكرا|مشكور|يعطيك\s*العافيه|يسلمو/.test(normText)) return "العفو ولو، بالخدمة دائماً!";
    return null;
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
            <div style="display:flex; gap:5px;">
              <button type="button" onclick="resetZeroDefaultSuggestions()" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color);">تصفير</button>
              <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="width:auto; padding:3px 9px; font-size:11px;">✕</button>
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

    if (addedIds.length) recordPracticeLearning(intentKey, addedIds, 2);
    window.closePetSuggestionsModal();

    if (addedTotal > 0) {
      haptic([15, 35, 15]);
      const msg = `تمت إضافة ${addedTotal} مواد إلى سلتك بنجاح.`;
      setOrbEmotion("happy", msg, true);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      showToast(`✅ ${msg}`);
    }
  };

  function matchCategoriesAndProducts(normText) {
    const storeCats = (Array.isArray(categories) ? categories : []).filter(c => c && c !== "الكل");
    const budgetMatch = normText.match(/(\d{2,7})/);
    const maxBudget = budgetMatch ? parseInt(budgetMatch[1]) : null;

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
    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;

    if (!promptTxt) {
      setOrbEmotion("idle", "اضغط مطوّلاً وتحدّث بطلبك أو وصفتك.", true);
      return;
    }

    const norm = cleanArabicNorm(promptTxt);

    const chatReply = matchCasualChat(norm, persona);
    if (chatReply) {
      setOrbEmotion("greet", chatReply, true);
      setTxt("aiShoppingStatusText", `${persona.icon} ${chatReply}`);
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

    const recipeRes = matchRecipeOrSweet(norm);
    if (recipeRes) {
      if (recipeRes.availableItems.length > 0) {
        const missingNote = recipeRes.missingIngredients.length
          ? ` | غير متوفر حالياً: ${recipeRes.missingIngredients.slice(0, 4).join("، ")}`
          : " | جميع المكونات الأساسية متوفرة";
        openZeroDefaultModal(
          `🍲 ${recipeRes.recipe.title} — المتوفر في الفرع:`,
          recipeRes.availableItems,
          `recipe_${recipeRes.recipe.title}`,
          `الكمية الافتراضية 0 — اضغط (+) لاختيار ما تحتاجه${missingNote}`
        );
        const msg = `جهزتلك المواد المتوفرة لوصفة ${recipeRes.recipe.title}، حدد الكمية بالضغط على زائد.`;
        setOrbEmotion("choice", msg, true);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        return;
      } else {
        const noStockMsg = `وصفة ${recipeRes.recipe.title} مسجلة لدينا، لكن مكوناتها غير متوفرة حالياً في الفرع.`;
        setOrbEmotion("idle", noStockMsg, true);
        setTxt("aiShoppingStatusText", `⚠️ ${noStockMsg}`);
        return;
      }
    }

    const { matchedCategories, items, usedAlternative } = matchCategoriesAndProducts(norm);
    if (items.length > 0) {
      const title = usedAlternative
        ? "🔁 الصنف المطلوب نافد — إليك أقرب البدائل المتوفرة:"
        : matchedCategories.length
          ? `🛍️ أصناف قسم (${matchedCategories.join("، ")}) — حدد الكمية:`
          : "🛍️ الأصناف المتوفرة المطابقة — حدد الكمية:";
      openZeroDefaultModal(title, items, matchedCategories[0] || `q_${norm.slice(0, 18)}`);
      const msg = usedAlternative
        ? "الصنف المطلوب غير متوفر حالياً، عرضتلك أقرب البدائل المتوفرة."
        : matchedCategories.length
          ? `فتحتلك أصناف قسم ${matchedCategories.join(" و")}، حدد الكمية المناسبة.`
          : "فتحتلك الأصناف المتوفرة، اضغط على زائد لتحديد الكمية.";
      setOrbEmotion("choice", msg, true);
      setTxt("aiShoppingStatusText", `💡 ${msg}`);
      return;
    }

    const fallbackMsg = "لم أجد وصفة أو صنفاً مطابقاً متوفراً الآن، جرّب اسم وصفة أو قسم آخر.";
    setOrbEmotion("idle", fallbackMsg, true);
    setTxt("aiShoppingStatusText", `⚠️ ${fallbackMsg}`);
  };

  function beginLongPressVoice() {
    unlockEmbeddedVoice();
    stopEmbeddedVoice();
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
    playListenCue();
    setOrbEmotion("listening", "تحدّث الآن... اترك إصبعك عند الانتهاء", false);

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
    if (!orb || !root || orb.dataset.v43Bound) return;
    orb.dataset.v43Bound = "1";

    let down = false, dragging = false, holdFired = false, holdTimer = null;
    let sx = 0, sy = 0, r0 = 14, b0 = 88;

    const onDown = e => {
      unlockEmbeddedVoice();
      const pt = e.touches ? e.touches[0] : e;
      down = true; dragging = false; holdFired = false;
      sx = pt.clientX; sy = pt.clientY;
      r0 = parseInt(root.style.right || "14", 10);
      b0 = parseInt(root.style.bottom || "88", 10);
      orb.style.transform = "scale(1.07)";

      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (down && !dragging) {
          holdFired = true;
          beginLongPressVoice();
        }
      }, 380);
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
        const nr = Math.max(8, Math.min(Math.max(8, window.innerWidth - 68), r0 - dx));
        const nb = Math.max(84, Math.min(Math.max(84, window.innerHeight - 96), b0 - dy));
        root.style.right = nr + "px";
        root.style.bottom = nb + "px";
      }
    };

    const onUp = () => {
      if (!down) return;
      down = false;
      clearTimeout(holdTimer);
      orb.style.transform = "";

      if (holdFired) {
        endLongPressVoice();
        return;
      }

      if (dragging) {
        dragging = false;
        const curR = parseInt(root.style.right || "14", 10);
        const curB = parseInt(root.style.bottom || "88", 10);
        const snapR = (window.innerWidth - curR - 28) >= window.innerWidth / 2 ? 12 : Math.max(12, window.innerWidth - 68);
        root.style.transition = "right 0.2s ease, bottom 0.2s ease";
        root.style.right = snapR + "px";
        setTimeout(() => { root.style.transition = ""; }, 220);
        savePos(snapR, curB);
        haptic(12);
        return;
      }

      const prefs = getPrefs();
      const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
      const phrase = sessionCtx.lastSpokenText || persona.greet;
      showBubble(`${persona.icon} ${phrase}`, 4000);
      speakOutLoud(phrase, true, "greet");
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
      root.style.opacity = "0.45";
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
    db.ref(`recipes/${rId}`).set({
      id: rId,
      title,
      category,
      keywords,
      ingredients,
      productIds,
      updatedAt: new Date().toISOString()
    }).then(() => {
      resetAdminRecipeForm();
      showToast(`✅ تم حفظ وصفة (${title}) بنجاح!`);
    }).catch(err => alert("❌ خطأ أثناء الحفظ: " + err.message));
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
    db.ref(`recipes/${rId}`).set(null).then(() => showToast("🗑️ تم حذف الوصفة"));
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
      productsLoaded: Object.keys(products || {}).length,
      categoriesLoaded: Array.isArray(categories) ? categories.length : 0,
      recipesAvailable: getAllMergedRecipes().length,
      embeddedAudioSupported: !!(window.AudioContext || window.webkitAudioContext),
      speechRecognitionSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      online: navigator.onLine !== false
    };
    console.info("[QA Assistant Diagnostic]", report);
    return report;
  };

  function mountV43() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const assistBox = $("aiSmartAssistantBox");

    if (assistBox && !$("petPersonaBar")) {
      const bar = document.createElement("div");
      bar.id = "petPersonaBar";
      bar.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:5px; flex-wrap:wrap; margin-bottom:6px; font-size:10px;";
      const opts = Object.values(PERSONAS).map(per =>
        `<option value="${per.id}">${per.icon} ${per.name}</option>`
      ).join("");
      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:4px; flex:1; min-width:165px;">
          <span style="color:var(--gold-color); font-weight:bold;">المرافق:</span>
          <select id="petPersonaSelect" class="form-control" onchange="selectPetPersona(this.value)" style="padding:3px 6px; font-size:10px; flex:1;">${opts}</select>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <span id="petConnStatusBadge" style="font-size:9px; font-weight:bold;">🟢 متصل</span>
          <button type="button" onclick="toggleCompanionVoice()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff;">🗣️ صوت</button>
          <button id="petShowCharBtn" type="button" onclick="setPetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار</button>
        </div>`;
      assistBox.insertBefore(bar, assistBox.firstChild);
    }

    if (!$("petCharRoot")) {
      const styleTag = document.createElement("style");
      styleTag.id = "petCharStyleV43";
      styleTag.textContent = `
        @keyframes petFloatV43 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes petRingV43 { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.36); opacity: 0; } }
        #petCharOrb {
          width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid ${p.accent};
          font-size: 27px; display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          animation: petFloatV43 2.7s ease-in-out infinite;
        }
        #petListenRing {
          display: none; position: absolute; inset: -6px; border-radius: 50%;
          border: 2.5px solid #00e676; pointer-events: none; animation: petRingV43 1.1s infinite;
        }
        #petMiniBubble {
          display: none; position: absolute; bottom: 66px; right: 0; max-width: 225px; width: max-content;
          background: var(--card-bg); color: var(--text-color); border: 1px solid var(--gold-color);
          border-radius: 10px; padding: 6px 9px; font-size: 11px; line-height: 1.4;
          box-shadow: 0 8px 20px rgba(0,0,0,0.45); pointer-events: none;
        }`;
      document.head.appendChild(styleTag);

      const root = document.createElement("div");
      root.id = "petCharRoot";
      root.style.cssText = "position:fixed; bottom:88px; right:14px; z-index:98; transition:opacity 0.2s ease;";
      root.innerHTML = `<div id="petMiniBubble"></div><div style="position:relative;"><div id="petListenRing"></div><div id="petCharOrb" role="button" aria-label="المرافق المتحدث">${p.icon}</div></div>`;
      document.body.appendChild(root);
      bindOrbInteractions($("petCharOrb"), root);
    }

    organizeAdminAndExportUI();
    enhanceCustomerCartCheckoutUX();
    syncVisuals();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountV43(); };

  const _origRenderCart = window.renderCartModalItems;
  window.renderCartModalItems = function () {
    if (typeof _origRenderCart === "function") _origRenderCart();
    enhanceCustomerCartCheckoutUX();
    renderSmartCartRecommendations();
  };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncVisuals, 60); };

  window.addEventListener("online", syncConnectivityBadge);
  window.addEventListener("offline", syncConnectivityBadge);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV43);
  else mountV43();
})();

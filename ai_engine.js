// ============================================================================
// محرك المرافق المتحدث بانفعال مدمج ومكتبة وصفات الطبخ والحلويات (v38)
// - تحدث وحالات انفعالية مدمجة عبر Web Audio API بدون الاعتماد على المتصفح
// - قائمة طويلة لوصفات الطبخ والحلويات ومطابقة المتوفر فعلياً في الفرع واقتراحه
// - الكمية الافتراضية في نافذة الاقتراحات = 0
// - بدون أي تدخل للذكاء الاصطناعي في الدفع أو فحص الإشعارات
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v38_prefs";
  const POS_KEY = "moaath_pet_v38_pos";
  const LEARN_KEY = "moaath_pet_v38_learned";

  const PERSONAS = {
    buddy: { id: "buddy", name: "بندق الودود", icon: "🐱", accent: "#00b0ff", pitchMul: 1.05, tempoMul: 1.0, greet: "وعليكم السلام يا هلا! نورت المتجر، شو نجهزلك اليوم؟" },
    pro: { id: "pro", name: "صقر السريع", icon: "🦅", accent: "#00e676", pitchMul: 0.94, tempoMul: 1.18, greet: "أهلاً بك! جاهز فوراً، اطلب وصفتك أو صنفك." },
    saver: { id: "saver", name: "ثعلب التوفير", icon: "🦊", accent: "#D4AF37", pitchMul: 1.0, tempoMul: 0.96, greet: "يا مرحبا! نجهزلك المتوفر بأفضل قيمة وتوفير." },
    lulu: { id: "lulu", name: "لولو اللطيفة", icon: "🐰", accent: "#ff7eb6", pitchMul: 1.24, tempoMul: 0.95, greet: "أهلاً فيكِ! شو حابة تطبخي أو تحضّري حلى اليوم؟" },
    sara: { id: "sara", name: "سارة المنظمة", icon: "🦋", accent: "#7c4dff", pitchMul: 1.15, tempoMul: 1.04, greet: "مرحباً بكِ! نرتب مكونات الوصفة حسب المتوفر بكل دقة." },
    noor: { id: "noor", name: "نور الذكية", icon: "✨", accent: "#ff9800", pitchMul: 1.18, tempoMul: 1.08, greet: "أهلاً وسهلاً! اطلبي أي وصفة طبخ أو حلى وأنا أجهز المتوفر." }
  };

  // قائمة طويلة لوصفات الطبخ والحلويات (مع كلمات مفتاحية ومكونات أساسية)
  const RECIPES_AND_SWEETS = [
    // وصفات طبخ رئيسية وشعبية
    { key: "مقلوبة", title: "وصفة المقلوبة", type: "طبخ", keywords: ["مقلوبه", "مقلوبة"], ingredients: ["رز", "ارز", "زيت", "سمن", "سمنه", "باذنجان", "بطاطا", "بندوره", "طماطم", "بصل", "بهار", "ملح"] },
    { key: "كبسة", title: "وصفة الكبسة", type: "طبخ", keywords: ["كبسه", "كبسة"], ingredients: ["رز", "ارز", "زيت", "سمن", "بصل", "بندوره", "معجون طماطم", "بهار", "ملح"] },
    { key: "مجدرة", title: "وصفة المجدرة", type: "طبخ", keywords: ["مجدره", "مجدرة", "برغل", "عدس"], ingredients: ["برغل", "عدس", "زيت", "زيتون", "بصل", "ملح", "كمون"] },
    { key: "منسف", title: "وصفة المنسف / الأرز باللبن", type: "طبخ", keywords: ["منسف", "ارز باللبن", "رز باللبن"], ingredients: ["رز", "ارز", "لبن", "جميد", "سمن", "مكسرات", "لوز", "ملح"] },
    { key: "معكرونة بالبشاميل", title: "وصفة المعكرونة بالبشاميل", type: "طبخ", keywords: ["معكرونه", "مكرونه", "بشاميل"], ingredients: ["معكرونه", "مكرونه", "حليب", "طحين", "دقيق", "زيت", "سمن", "جبن", "ملح"] },
    { key: "شوربة عدس", title: "وصفة شوربة العدس", type: "طبخ", keywords: ["شوربه", "شوربة", "عدس"], ingredients: ["عدس", "بطاطا", "جزر", "بصل", "زيت", "كمون", "ملح"] },
    { key: "فريكة", title: "وصفة الفريكة", type: "طبخ", keywords: ["فريكه", "فريكة"], ingredients: ["فريكه", "فريكة", "سمن", "زيت", "بصل", "بهار", "ملح"] },
    { key: "محشي كوسا وورق عنب", title: "وصفة المحشي والورق", type: "طبخ", keywords: ["محشي", "كوسا", "ورق عنب", "يبرق"], ingredients: ["رز", "ارز", "ورق عنب", "كوسا", "بندوره", "بصل", "زيت", "نعناع", "ملح"] },
    { key: "شيش برك", title: "وصفة الشيش برك", type: "طبخ", keywords: ["شيش برك", "شيشبرك"], ingredients: ["عجين", "طحين", "لبن", "ثوم", "كزبره", "سمن", "ملح"] },
    { key: "فطور صباحي", title: "سلة الفطور الصباحي", type: "طبخ", keywords: ["فطور", "فطور صباحي", "ترويقه"], ingredients: ["بيض", "جبن", "لبنه", "زيتون", "زيت", "زعتر", "مربى", "عسل", "شاي", "خبز"] },
    { key: "سهرة ومتة", title: "سلة السهرة والمتة", type: "طبخ", keywords: ["سهره", "سهرة", "مته", "متة", "تسالي"], ingredients: ["مته", "متة", "بزر", "موالح", "نقارش", "شيبس", "بسكوت", "شاي", "سكر"] },
    { key: "تنظيف المطبخ", title: "مهمة تنظيف المطبخ", type: "تنظيف", keywords: ["تنظيف المطبخ", "منظفات المطبخ", "جلي"], ingredients: ["سائل جلي", "جلي", "صابون", "ليف", "اسفنج", "كلور", "منظف", "معقم"] },

    // وصفات حلويات ومشروبات حلوة
    { key: "كيك", title: "وصفة الكيك المنزلي", type: "حلويات", keywords: ["كيك", "كاتو"], ingredients: ["طحين", "دقيق", "سكر", "بيض", "حليب", "زيت", "بيكنج باودر", "فانيليا", "كاكاو"] },
    { key: "بسكويت منزلي", title: "وصفة البسكويت", type: "حلويات", keywords: ["بسكويت", "بسكوت"], ingredients: ["طحين", "دقيق", "سكر", "زيت", "سمن", "زبده", "فانيليا", "حليب"] },
    { key: "مهلبية", title: "وصفة المهلبية / الكاسترد", type: "حلويات", keywords: ["مهلبيه", "مهلبية", "كاسترد"], ingredients: ["حليب", "نشا", "سكر", "ماء ورد", "فستق", "جوز الهند"] },
    { key: "حلاوة السميد", title: "وصفة حلاوة السميد", type: "حلويات", keywords: ["حلاوه", "حلاوة", "سميد"], ingredients: ["سميد", "سكر", "سمن", "زيت", "ماء", "مكسرات", "قرفه"] },
    { key: "قطايف", title: "وصفة القطايف", type: "حلويات", keywords: ["قطايف", "قطاائف"], ingredients: ["قطايف", "طحين", "سميد", "سكر", "جوز", "قشطه", "قشطة", "زيت للقلي"] },
    { key: "بسبوسة", title: "وصفة البسبوسة / النمورة", type: "حلويات", keywords: ["بسبوسه", "بسبوسة", "نموره", "نمورة"], ingredients: ["سميد", "سكر", "لبن", "جوز الهند", "بيكنج باودر", "سمن", "قطر"] },
    { key: "حلى الشوكولاتة البارد", title: "وصفة حلى الشوكولاتة البارد", type: "حلويات", keywords: ["حلى بارد", "شوكولاته", "شوكولا", "بسكوت شاي"], ingredients: ["بسكوت", "كاكاو", "شوكولاته", "حليب", "سكر", "نشا", "كريمه"] },
    { key: "عوامة ولقيمات", title: "وصفة العوامة / اللقيمات", type: "حلويات", keywords: ["عوامه", "عوامة", "لقيمات", "زلابيه"], ingredients: ["طحين", "دقيق", "نشا", "خميره", "سكر", "زيت", "قطر"] }
  ];

  let activeRecognizer = null;
  let isHoldingSpeak = false;
  let bubbleTimer = null;
  let scrollTimer = null;
  let modalItemsState = [];
  let audioCtx = null;

  // إبقاء الدفع خارج نطاق الذكاء الاصطناعي تماماً
  window.analyzeShamCashReceiptOCR = function () {
    const outBox = $("shamCashOcrResult");
    if (outBox) outBox.innerHTML = "";
  };

  function haptic(pattern = 15) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
  }

  function getPrefs() {
    try {
      const d = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return {
        persona: PERSONAS[d.persona] ? d.persona : "buddy",
        hidden: !!d.hidden,
        voiceFx: d.voiceFx === undefined ? true : !!d.voiceFx
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, voiceFx: true };
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
      map[intentKey][pid] = Math.max(0, (map[intentKey][pid] || 0) + delta);
    });
    localStorage.setItem(LEARN_KEY, JSON.stringify(map));
  }

  // [تحدث وحالات انفعالية مدمجة بدون الاعتماد على المتصفح]
  // يولّد خطاباً صوتياً إيقاعياً بنبرات متعددة تحاكي نبرة التحدث والانفعال لكل حالة وشخصية
  function speakEmbeddedEmotion(emotion = "happy", syllablesCount = 3) {
    const prefs = getPrefs();
    if (!prefs.voiceFx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
      const base = 240 * (persona.pitchMul || 1.0);
      const tempo = persona.tempoMul || 1.0;

      const profiles = {
        greet: { contour: [1.0, 1.25, 1.15, 1.35], step: 0.13, dur: 0.12, wave: "triangle" },
        happy: { contour: [1.05, 1.3, 1.45, 1.25], step: 0.11, dur: 0.11, wave: "sine" },
        thinking: { contour: [0.95, 1.08, 0.92, 1.12], step: 0.17, dur: 0.14, wave: "sine" },
        listen: { contour: [0.9, 1.2, 1.35], step: 0.1, dur: 0.1, wave: "sine" },
        choice: { contour: [1.0, 1.18, 1.05, 1.28], step: 0.12, dur: 0.11, wave: "triangle" },
        gentle: { contour: [0.92, 0.84, 0.95], step: 0.15, dur: 0.13, wave: "sine" }
      };

      const prof = profiles[emotion] || profiles.happy;
      const steps = Math.max(2, Math.min(6, syllablesCount || prof.contour.length));
      const now = audioCtx.currentTime;

      for (let i = 0; i < steps; i++) {
        const ratio = prof.contour[i % prof.contour.length];
        const freq = base * ratio;
        const startT = now + (i * prof.step) / tempo;
        const durT = prof.dur / tempo;

        // صوت أساسي + توافقي ناعم لإعطاء طابع صوتي بشري أنعم من النغمة البسيطة
        const osc = audioCtx.createOscillator();
        const overtone = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const overGain = audioCtx.createGain();

        osc.type = prof.wave;
        overtone.type = "sine";

        // انزلاق خفيف في التردد (formant glide) يشبه مقاطع الكلام
        osc.frequency.setValueAtTime(freq * 0.94, startT);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startT + durT * 0.65);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.96, startT + durT);

        overtone.frequency.setValueAtTime(freq * 2, startT);

        gain.gain.setValueAtTime(0.0001, startT);
        gain.gain.linearRampToValueAtTime(0.11, startT + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + durT);

        overGain.gain.setValueAtTime(0.0001, startT);
        overGain.gain.linearRampToValueAtTime(0.03, startT + 0.02);
        overGain.gain.exponentialRampToValueAtTime(0.0001, startT + durT);

        osc.connect(gain);
        overtone.connect(overGain);
        gain.connect(audioCtx.destination);
        overGain.connect(audioCtx.destination);

        osc.start(startT);
        overtone.start(startT);
        osc.stop(startT + durT + 0.02);
        overtone.stop(startT + durT + 0.02);
      }
    } catch (_) {}
  }

  window.toggleEmbeddedVoiceFx = function () {
    haptic(12);
    const prefs = getPrefs();
    const next = !prefs.voiceFx;
    setPrefs({ voiceFx: next });
    if (next) speakEmbeddedEmotion("greet", 3);
    const msg = next ? "🗣️ التحدث الانفعالي المدمج مفعّل" : "🔇 التحدث الانفعالي مكتوم";
    showBubble(msg, 2600);
    showToast(msg);
  };

  function getThumb(id) {
    const baseId = String(id || "").replace(/_PKG$/, "");
    const p = products?.[baseId] || specialOffers?.[id] || {};
    if (String(id || "").endsWith("_PKG") && (p.pkgThumb || p.pkgImage)) return p.pkgThumb || p.pkgImage;
    return (typeof getLockedHighResImage === "function" && getLockedHighResImage(baseId)) || p.thumb || p.image || "store-icon.png";
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

  window.selectPetPersona = function (key) {
    if (!PERSONAS[key]) return;
    haptic(15);
    setPrefs({ persona: key });
    syncVisuals();
    const p = PERSONAS[key];
    setOrbEmotion("greet", `${p.icon} ${p.name} — اضغط مطوّلاً وتحدث`, "greet", 3);
  };

  window.setPetHidden = function (hide) {
    haptic(15);
    setPrefs({ hidden: !!hide });
    syncVisuals();
  };

  function showBubble(txt, ms = 4800) {
    const b = $("petMiniBubble");
    if (!b || !txt) return;
    b.textContent = txt;
    b.style.display = "block";
    clearTimeout(bubbleTimer);
    if (ms > 0) bubbleTimer = setTimeout(() => { b.style.display = "none"; }, ms);
  }

  function setOrbEmotion(state = "idle", bubbleTxt = "", emotionFx = null, syllables = 3) {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const orb = $("petCharOrb");
    const ring = $("petListenRing");
    if (!orb) return;

    const faces = { idle: p.icon, listening: "🎙️", thinking: "🤔", happy: "🤩", greet: "😊", choice: "🔀" };
    orb.textContent = faces[state] || p.icon;
    orb.style.borderColor = state === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = state === "listening" ? "block" : "none";
    if (emotionFx) speakEmbeddedEmotion(emotionFx, syllables);
    if (bubbleTxt) showBubble(bubbleTxt, state === "listening" ? 0 : 5200);
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
  }

  // [تجهيز الوصفات والحلويات وتصفية المتوفر فعلياً في الفرع]
  function matchRecipeOrSweet(normText) {
    const matched = RECIPES_AND_SWEETS.find(r =>
      r.keywords.some(kw => {
        const kNorm = (typeof normalizeArabic === "function" ? normalizeArabic(kw) : kw).toLowerCase();
        return normText.includes(kNorm);
      })
    );
    if (!matched) return null;

    const learned = getLearnedMap()[`recipe_${matched.key}`] || {};
    const prodEntries = Object.keys(products || {}).map(pid => {
      const p = products[pid];
      if (!p) return null;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      const pNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      return { pid, p, st, pNorm };
    }).filter(Boolean);

    const availableItems = [];
    const missingIngredients = [];

    matched.ingredients.forEach(ing => {
      const iNorm = (typeof normalizeArabic === "function" ? normalizeArabic(ing) : ing).toLowerCase();
      const found = prodEntries.find(x => x.pNorm.includes(iNorm) && x.st > 0);
      if (found && !availableItems.some(a => a.id === found.pid)) {
        availableItems.push({
          id: found.pid,
          name: found.p.name,
          reason: `متوفر للوصفة (${ing})`,
          score: learned[found.pid] || 0
        });
      } else {
        missingIngredients.push(ing);
      }
    });

    availableItems.sort((a, b) => b.score - a.score);
    return {
      recipe: matched,
      availableItems,
      missingIngredients
    };
  }

  function matchCasualChat(normText, persona) {
    if (/^(ال)?سلام\s*عليكم|السلام/.test(normText)) return persona.greet;
    if (/^(مرحبا|اهلا|هلا|هاي|صباح\s*الخير|مساء\s*الخير)/.test(normText)) return persona.greet;
    if (/كيف\s*حالك|شلونك|كيفك|شو\s*اخبارك|اخبارك/.test(normText)) return "الحمد لله بألف خير! شو نطبخ أو نجهزلك اليوم؟";
    if (/شكرا|مشكور|يعطيك\s*العافيه|يسلمو/.test(normText)) return "العفو ولو، بالخدمة دائماً! 🌸";
    return null;
  }

  // [النافذة المنبثقة للاقتراحات بكمية افتراضية = 0]
  function openZeroDefaultModal(title, items, intentKey = "general", subtitleNote = "") {
    modalItemsState = items.map(it => ({
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
            <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="width:auto; padding:3px 9px; font-size:11px;">✕</button>
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
          <img src="${esc(it.thumb)}" onerror="this.src='store-icon.png'" style="width:42px; height:42px; border-radius:6px; object-fit:cover; flex-shrink:0;">
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
    const baseId = String(it.id).replace(/_PKG$/, "");
    const pObj = products?.[baseId] || specialOffers?.[it.id];
    const maxAvail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : 99;
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
      const baseId = String(it.id).replace(/_PKG$/, "");
      const pObj = products?.[baseId] || specialOffers?.[it.id];
      const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : 99;
      const cur = cart[it.id] ? (parseInt(cart[it.id].qty) || 0) : 0;
      const toAdd = Math.min(it.qty, Math.max(0, avail - cur));
      if (toAdd > 0) {
        changeQty(it.id, toAdd);
        addedTotal += toAdd;
        addedIds.push(it.id);
      }
    });

    if (addedIds.length) recordPracticeLearning(intentKey, addedIds, 2);
    window.closePetSuggestionsModal();

    if (addedTotal > 0) {
      haptic([15, 35, 15]);
      const msg = `تمت إضافة ${addedTotal} مواد إلى سلتك.`;
      setOrbEmotion("happy", msg, "happy", 4);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      showToast(`✅ ${msg}`);
    }
  };

  // مطابقة التصنيفات والأصناف
  function matchCategoriesAndProducts(normText) {
    const storeCats = (Array.isArray(categories) ? categories : []).filter(c => c && c !== "الكل");
    const words = normText
      .replace(/\b(تجهيز|فاتوره|طلب|اريد|بدي|ابغى|ابي|مواد|اغراض|وصفه|وصفة|حلى|حلويات|طبخ|بـ|ب)\b/g, " ")
      .split(/[^a-z0-9\u0600-\u06FF]+/)
      .filter(w => w.length >= 2);

    const matchedCategories = storeCats.filter(catName => {
      const cNorm = (typeof normalizeArabic === "function" ? normalizeArabic(catName) : catName).toLowerCase();
      return words.some(w => cNorm.includes(w) || w.includes(cNorm));
    });

    const learned = getLearnedMap();
    const results = [];

    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p) return;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      if (st <= 0) return;

      const pNameNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      const pCat = p.category || "";
      const inCat = matchedCategories.includes(pCat);
      const hitName = words.some(w => pNameNorm.includes(w));

      if (inCat || hitName) {
        results.push({
          id: pid,
          name: p.name,
          reason: inCat ? `قسم: ${pCat}` : "متوفر في المخزون",
          score: (hitName ? 20 : 0) + (inCat ? 10 : 0) + (learned[pCat]?.[pid] || 0)
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return { matchedCategories, items: results.slice(0, 8) };
  }

  window.runAIShoppingAssistant = async function (overridePrompt = null) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;

    if (!promptTxt) {
      setOrbEmotion("idle", "اضغط مطوّلاً وتحدّث بطلبك أو وصفتك.", "gentle", 2);
      return;
    }

    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    // 1. حوار عادي وتحيات
    const chatReply = matchCasualChat(norm, persona);
    if (chatReply) {
      setOrbEmotion("greet", chatReply, "greet", 3);
      setTxt("aiShoppingStatusText", `${persona.icon} ${chatReply}`);
      return;
    }

    // 2. وصفات الطبخ والحلويات ومطابقة المتوفر فعلياً في الفرع
    const recipeRes = matchRecipeOrSweet(norm);
    if (recipeRes) {
      if (recipeRes.availableItems.length > 0) {
        const missingNote = recipeRes.missingIngredients.length
          ? ` | غير متوفر حالياً: ${recipeRes.missingIngredients.slice(0, 4).join("، ")}`
          : " | جميع المكونات الأساسية متوفرة";
        openZeroDefaultModal(
          `🍽️ ${recipeRes.recipe.title} — المتوفر في الفرع:`,
          recipeRes.availableItems,
          `recipe_${recipeRes.recipe.key}`,
          `الكمية الافتراضية 0 — اضغط (+) لاختيار ما تحتاجه${missingNote}`
        );
        const msg = `جهزتلك المواد المتوفرة لوصفة ${recipeRes.recipe.key}، حدد الكمية بالضغط على +.`.trim();
        setOrbEmotion("choice", msg, "choice", 4);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        return;
      } else {
        const noStockMsg = `وصفة ${recipeRes.recipe.key} موجودة بالقائمة، لكن مكوناتها غير متوفرة حالياً في الفرع.`;
        setOrbEmotion("idle", noStockMsg, "gentle", 3);
        setTxt("aiShoppingStatusText", `⚠️ ${noStockMsg}`);
        return;
      }
    }

    // 3. مطابقة الأقسام والأصناف المباشرة
    const { matchedCategories, items } = matchCategoriesAndProducts(norm);
    if (items.length > 0) {
      const title = matchedCategories.length
        ? `🛍️ أصناف قسم (${matchedCategories.join("، ")}) — حدد الكمية:`
        : "🛍️ الأصناف المتوفرة المطابقة — حدد الكمية:";
      openZeroDefaultModal(title, items, matchedCategories[0] || `q_${norm.slice(0, 18)}`);
      const msg = "فتحتلك الأصناف المتوفرة، اضغط (+) لتحديد الكمية.";
      setOrbEmotion("choice", msg, "choice", 3);
      setTxt("aiShoppingStatusText", `💡 ${msg}`);
      return;
    }

    const fallbackMsg = "لم أجد وصفة أو صنفاً مطابقاً متوفراً الآن، جرّب اسم وصفة أو قسم آخر.";
    setOrbEmotion("idle", fallbackMsg, "gentle", 3);
    setTxt("aiShoppingStatusText", `⚠️ ${fallbackMsg}`);
  };

  function beginLongPressVoice() {
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
    setOrbEmotion("listening", "تحدّث الآن... اترك إصبعك عند الانتهاء", "listen", 2);

    const rec = new SR();
    activeRecognizer = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = ev => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) {
        setOrbEmotion("idle", "لم أسمع صوتاً واضحاً، جرّب النقر المطوّل مرة أخرى.", "gentle", 2);
        return;
      }
      setVal("aiShoppingPromptInput", heard);
      window.runAIShoppingAssistant(heard);
    };

    rec.onerror = () => setOrbEmotion("idle", "تعذر التقاط الصوت، تأكد من إذن الميكروفون.", "gentle", 2);
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
    if (!orb || !root || orb.dataset.v38Bound) return;
    orb.dataset.v38Bound = "1";

    let down = false, dragging = false, holdFired = false, holdTimer = null;
    let sx = 0, sy = 0, r0 = 14, b0 = 88;

    const onDown = e => {
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

      window.toggleEmbeddedVoiceFx();
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

  function mountV38() {
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
        <div style="display:flex; align-items:center; gap:4px; flex:1; min-width:170px;">
          <span style="color:var(--gold-color); font-weight:bold;">المرافق:</span>
          <select id="petPersonaSelect" class="form-control" onchange="selectPetPersona(this.value)" style="padding:3px 6px; font-size:10px; flex:1;">${opts}</select>
        </div>
        <div style="display:flex; gap:4px;">
          <button type="button" onclick="toggleEmbeddedVoiceFx()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff;">🗣️ صوت</button>
          <button id="petShowCharBtn" type="button" onclick="setPetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار</button>
        </div>`;
      assistBox.insertBefore(bar, assistBox.firstChild);
    }

    if (!$("petCharRoot")) {
      const styleTag = document.createElement("style");
      styleTag.id = "petCharStyleV38";
      styleTag.textContent = `
        @keyframes petFloatV38 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes petRingV38 { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.36); opacity: 0; } }
        #petCharOrb {
          width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid ${p.accent};
          font-size: 27px; display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          animation: petFloatV38 2.7s ease-in-out infinite;
        }
        #petListenRing {
          display: none; position: absolute; inset: -6px; border-radius: 50%;
          border: 2.5px solid #00e676; pointer-events: none; animation: petRingV38 1.1s infinite;
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
      root.innerHTML = `<div id="petMiniBubble"></div><div style="position:relative;"><div id="petListenRing"></div><div id="petCharOrb" role="button" aria-label="المرافق">${p.icon}</div></div>`;
      document.body.appendChild(root);
      bindOrbInteractions($("petCharOrb"), root);
    }

    syncVisuals();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountV38(); };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncVisuals, 60); };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV38);
  else mountV38();
})();

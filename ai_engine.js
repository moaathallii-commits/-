// ============================================================================
// محرك المرافق التفاعلي ثلاثي الأبعاد لمتجر معاذ (v37 - Zero-Default & Sound FX)
// - الكمية الافتراضية في نافذة الاقتراحات = 0 (يزيد الزبون ما يريده بـ +)
// - الكلمات المفتاحية الأساسية هي أسماء تصنيفات المتجر (categories) والأصناف نفسها
// - ردود ودّية مختصرة على التحيات والحوار العادي (السلام عليكم، كيف حالك...)
// - أصوات وحالات انفعالية مدمجة عبر Web Audio API دون الاعتماد على صوت المتصفح
// - بدون أي تدخل للذكاء الاصطناعي في الدفع أو فحص الإشعارات
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v37_prefs";
  const POS_KEY = "moaath_pet_v37_pos";
  const LEARN_KEY = "moaath_pet_v37_learned";

  const PERSONAS = {
    buddy: { id: "buddy", name: "بندق الودود", icon: "🐱", accent: "#00b0ff", baseFreq: 520, greetReply: "وعليكم السلام يا هلا! الحمد لله بأفضل حال، كيف أساعدك بتسوقك اليوم؟" },
    pro: { id: "pro", name: "صقر السريع", icon: "🦅", accent: "#00e676", baseFreq: 440, greetReply: "أهلاً بك! جاهز لخدمتك بسرعة، اذكر الصنف أو القسم المطلوب." },
    saver: { id: "saver", name: "ثعلب التوفير", icon: "🦊", accent: "#D4AF37", baseFreq: 480, greetReply: "يا مرحبا! جاهز أرتبلك أوفر الخيارات والعروض المتوفرة." },
    lulu: { id: "lulu", name: "لولو اللطيفة", icon: "🐰", accent: "#ff7eb6", baseFreq: 620, greetReply: "أهلاً فيكِ ونورتي المتجر! أنا بخير، شو بتحبي نجهزلك اليوم؟" },
    sara: { id: "sara", name: "سارة المنظمة", icon: "🦋", accent: "#7c4dff", baseFreq: 580, greetReply: "مرحباً! يسعدني مساعدتك بترتيب طلباتك بكل وضوح." },
    noor: { id: "noor", name: "نور الذكية", icon: "✨", accent: "#ff9800", baseFreq: 600, greetReply: "أهلاً وسهلاً! حاضرين لأي طلب أو استفسار عن أصناف المتجر." }
  };

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
        soundFx: d.soundFx === undefined ? true : !!d.soundFx
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, soundFx: true };
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

  // [أصوات وحالات انفعالية مدمجة تعمل بدون الاعتماد على المتصفح]
  function playEmotionSound(emotion = "happy") {
    const prefs = getPrefs();
    if (!prefs.soundFx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
      const base = persona.baseFreq || 520;
      const sequences = {
        greet: [base, base * 1.25, base * 1.5],
        listen: [base * 0.9, base * 1.2],
        happy: [base, base * 1.33, base * 1.6],
        choice: [base * 1.1, base * 1.35],
        gentle: [base * 0.85, base * 0.75]
      };
      const notes = sequences[emotion] || sequences.happy;
      const now = audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = persona.id === "pro" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.14);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.15);
      });
    } catch (_) {}
  }

  window.toggleCompanionSoundFx = function () {
    haptic(12);
    const prefs = getPrefs();
    const next = !prefs.soundFx;
    setPrefs({ soundFx: next });
    if (next) playEmotionSound("greet");
    const msg = next ? "🔔 الأصوات الانفعالية مفعّلة" : "🔇 الأصوات الانفعالية مكتومة";
    showBubble(msg, 2500);
    showToast(msg);
  };

  // [التعلم بالممارسة]
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
    playEmotionSound("greet");
    const p = PERSONAS[key];
    showBubble(`${p.icon} ${p.name} — اضغط مطوّلاً وتحدث`, 3200);
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

  function setOrbEmotion(state = "idle", bubbleTxt = "", soundEmotion = null) {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const orb = $("petCharOrb");
    const ring = $("petListenRing");
    if (!orb) return;

    const faces = {
      idle: p.icon,
      listening: "🎙️",
      thinking: "🤔",
      happy: "🤩",
      greet: "😊",
      choice: "🔀"
    };
    orb.textContent = faces[state] || p.icon;
    orb.style.borderColor = state === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = state === "listening" ? "block" : "none";
    if (soundEmotion) playEmotionSound(soundEmotion);
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

  // [الرد الودّي المختصر على التحيات والحوار العادي]
  function matchCasualConversation(normText, persona) {
    if (/^(ال)?سلام\s*عليكم|السلام/.test(normText)) {
      return persona.greetReply;
    }
    if (/^(مرحبا|اهلا|هلا|هاي|صباح\s*الخير|مساء\s*الخير)/.test(normText)) {
      return persona.greetReply;
    }
    if (/كيف\s*حالك|شلونك|كيفك|شو\s*اخبارك|اخبارك/.test(normText)) {
      return "الحمد لله بألف خير بوجودك! خبرني شو بتحب نطلب أو نسأل اليوم؟";
    }
    if (/شكرا|مشكور|يعطيك\s*العافيه|يسلمو/.test(normText)) {
      return "العفو ولو، بالخدمة دائماً! 🌸";
    }
    return null;
  }

  // [النافذة المنبثقة للاقتراحات بكمية افتراضية = 0 لكل مادة]
  function openZeroDefaultSuggestionsModal(title, items, intentKey = "general") {
    modalItemsState = items.map(it => ({
      id: it.id,
      name: it.name,
      qty: 0, // الكمية الافتراضية 0 ليزيد الزبون ما يريده فقط
      unitPrice: getUnitSYP(it.id),
      thumb: getThumb(it.id),
      reason: it.reason || ""
    }));
    window._currentSuggestionIntent = intentKey;

    let modal = $("petSuggestionsFloatingModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "petSuggestionsFloatingModal";
      modal.className = "modal-overlay";
      modal.style.cssText = "display:flex; z-index:10030; background:rgba(0,0,0,0.78);";
      modal.innerHTML = `
        <div class="modal-content" style="max-width:440px; border-color:var(--gold-color);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:8px;">
            <b id="petSugModalTitle" style="color:var(--gold-color); font-size:13px;"></b>
            <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="width:auto; padding:3px 9px; font-size:11px;">✕</button>
          </div>
          <div style="font-size:10px; color:var(--gray-text); margin-bottom:8px;">اضغط على (+) لتحديد الكمية المطلوبة من الأصناف التي تناسبك:</div>
          <div id="petSugModalList" style="max-height:54vh; overflow-y:auto; margin-bottom:10px;"></div>
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
            ${it.reason ? `<div style="font-size:9px; color:var(--gray-text);">${esc(it.reason)}</div>` : ""}
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
    const intentKey = window._currentSuggestionIntent || "general";

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
      setOrbEmotion("happy", msg, "happy");
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      showToast(`✅ ${msg}`);
    }
  };

  // [اعتماد أسماء تصنيفات المتجر (categories) وأسماء الأصناف ككلمات مفتاحية أساسية]
  function matchByStoreCategoriesAndProducts(normText) {
    const storeCats = (Array.isArray(categories) ? categories : []).filter(c => c && c !== "الكل");
    const words = normText
      .replace(/\b(تجهيز|فاتوره|طلب|اريد|بدي|ابغى|ابي|مواد|اغراض|بـ|ب)\b/g, " ")
      .split(/[^a-z0-9\u0600-\u06FF]+/)
      .filter(w => w.length >= 2);

    // 1. البحث أولاً عن تطابق مع أسماء تصنيفات المتجر الفعلية (مثل: موالح ونقرشات، منظفات، مواد غذائية...)
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
      const inMatchedCat = matchedCategories.includes(pCat);
      const nameHit = words.some(w => pNameNorm.includes(w));

      if (inMatchedCat || nameHit) {
        const lScore = (learned[pCat]?.[pid] || 0);
        results.push({
          id: pid,
          name: p.name,
          category: pCat,
          reason: inMatchedCat ? `قسم: ${pCat}` : "مطابق لاسم الصنف",
          score: (nameHit ? 20 : 0) + (inMatchedCat ? 10 : 0) + lScore
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
      setOrbEmotion("idle", "اضغط مطوّلاً وتحدّث بطلبك أو تحيّتك.", "gentle");
      return;
    }

    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    // 1. التحقق من الحوار العادي والتحيات (السلام عليكم، كيف حالك...)
    const casualReply = matchCasualConversation(norm, persona);
    if (casualReply) {
      setOrbEmotion("greet", casualReply, "greet");
      setTxt("aiShoppingStatusText", `${persona.icon} ${casualReply}`);
      return;
    }

    // 2. المطابقة المباشرة بناءً على أسماء تصنيفات المتجر (categories) وأسماء الأصناف
    const { matchedCategories, items } = matchByStoreCategoriesAndProducts(norm);

    if (items.length > 0) {
      const title = matchedCategories.length
        ? `🛍️ أصناف قسم (${matchedCategories.join("، ")}) — حدد الكمية:`
        : "🛍️ الأصناف المتوفرة المطابقة — حدد الكمية:";
      const intentKey = matchedCategories[0] || `q_${norm.slice(0, 18)}`;
      openZeroDefaultSuggestionsModal(title, items, intentKey);
      const msg = matchedCategories.length
        ? `فتحتلك أصناف قسم ${matchedCategories.join(" و")}، حدد الكمية المناسبة.`
        : "فتحتلك الأصناف المتوفرة، اضغط (+) لتحديد الكمية.";
      setOrbEmotion("choice", msg, "choice");
      setTxt("aiShoppingStatusText", `💡 ${msg}`);
      return;
    }

    const notFoundMsg = "لم أجد قسماً أو صنفاً مطابقاً متوفراً حالياً، جرّب ذكر اسم القسم أو الصنف.";
    setOrbEmotion("idle", notFoundMsg, "gentle");
    setTxt("aiShoppingStatusText", `⚠️ ${notFoundMsg}`);
  };

  // بدء الاستماع عند النقر المطوّل على الشخصية
  function beginLongPressVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showBubble("المتصفح لا يدعم الميكروفون، اكتب طلبك في الخانة.", 3500);
      return;
    }
    if (activeRecognizer) {
      try { activeRecognizer.stop(); } catch (_) {}
      activeRecognizer = null;
    }

    isHoldingSpeak = true;
    haptic(25);
    setOrbEmotion("listening", "تحدّث الآن... اترك إصبعك عند الانتهاء", "listen");

    const rec = new SR();
    activeRecognizer = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = ev => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) {
        setOrbEmotion("idle", "لم أسمع صوتاً واضحاً، جرّب النقر المطوّل مرة أخرى.", "gentle");
        return;
      }
      setVal("aiShoppingPromptInput", heard);
      window.runAIShoppingAssistant(heard);
    };

    rec.onerror = () => setOrbEmotion("idle", "تعذر التقاط الصوت، تأكد من إذن الميكروفون.", "gentle");
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

  // سحب الشخصية + نقر مطوّل للتحدث + نقرة سريعة لتبديل الصوت الانفعالي
  function bindOrbInteractions(orb, root) {
    if (!orb || !root || orb.dataset.v37Bound) return;
    orb.dataset.v37Bound = "1";

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

      window.toggleCompanionSoundFx();
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

  function mountV37() {
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
          <button type="button" onclick="toggleCompanionSoundFx()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff;">🔔 الصوت</button>
          <button id="petShowCharBtn" type="button" onclick="setPetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار</button>
        </div>`;
      assistBox.insertBefore(bar, assistBox.firstChild);
    }

    if (!$("petCharRoot")) {
      const styleTag = document.createElement("style");
      styleTag.id = "petCharStyleV37";
      styleTag.textContent = `
        @keyframes petFloatV37 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes petRingV37 { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.36); opacity: 0; } }
        #petCharOrb {
          width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid ${p.accent};
          font-size: 27px; display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          animation: petFloatV37 2.7s ease-in-out infinite;
        }
        #petListenRing {
          display: none; position: absolute; inset: -6px; border-radius: 50%;
          border: 2.5px solid #00e676; pointer-events: none; animation: petRingV37 1.1s infinite;
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
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountV37(); };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncVisuals, 60); };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV37);
  else mountV37();
})();

// ============================================================================
// محرك المرافق التفاعلي ثلاثي الأبعاد لمتجر معاذ (v35 - 25 UX & Voice Upgrades)
// - بدون أي تدخل للذكاء الاصطناعي في الدفع أو فحص الإشعارات
// - يجمع: منع حشو السلة عند تعدد الأحجام/الأنواع + التخيير الفوري + ميزانية الفئة
//   + أقرب 5 مواد للمهام والطبخات + ذاكرة جلسة + 6 شخصيات (3 منها للفتيات)
//   + حيوية ثلاثية الأبعاد + نطق عربي محسن وتحكم كامل بالصوت + بديل محلي فوري
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v35_prefs";
  const POS_KEY = "moaath_pet_v35_pos";
  const CACHE_KEY = "moaath_pet_v35_cache";
  const CACHE_TTL = 2 * 60 * 60 * 1000;

  const PERSONAS = {
    // 3 شخصيات أساسية
    buddy: { id: "buddy", name: "بندق الودود", icon: "🐱", accent: "#00b0ff", gender: "general", styleHint: "لهجة محلية ودودة ومرحّة وقصيرة جداً." },
    pro: { id: "pro", name: "صقر السريع", icon: "🦅", accent: "#00e676", gender: "general", styleHint: "أسلوب عملي ومباشر وسريع في الأرقام والكميات والأسعار." },
    saver: { id: "saver", name: "ثعلب التوفير", icon: "🦊", accent: "#D4AF37", gender: "general", styleHint: "يركّز على التوفير والطرود والميزانية." },
    // 3 شخصيات جديدة مناسبة للفتيات
    lulu: { id: "lulu", name: "لولو اللطيفة", icon: "🐰", accent: "#ff7eb6", gender: "female", styleHint: "أسلوب لطيف، مشرق، ودود، ومختصر يناسب الفتيات." },
    sara: { id: "sara", name: "سارة المنظمة", icon: "🦋", accent: "#7c4dff", gender: "female", styleHint: "أسلوب مرتب ومنظم وواضح للوصفات والمهام المنزلية والطلبات." },
    noor: { id: "noor", name: "نور الذكية", icon: "✨", accent: "#ff9800", gender: "female", styleHint: "أسلوب ذكي ومشجع ومفيد للخيارات السريعة والتنسيق." }
  };

  let sessionMemory = {
    lastPrompt: "",
    lastChoices: [],
    lastTaskItems: [],
    lastAddedIds: [],
    lastSpokenText: ""
  };

  let activeRecognizer = null;
  let isHoldingToSpeak = false;
  let bubbleHideTimer = null;
  let scrollFadeTimer = null;
  let lastActionBadge = 0;

  // استبعاد الذكاء الاصطناعي من الدفع وفحص الإشعارات بالكامل
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
        voiceMode: ["natural", "brief", "muted"].includes(d.voiceMode) ? d.voiceMode : "natural"
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, voiceMode: "natural" };
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
      if (!so) return 0;
      return calcSYP((isW && so.wholesaleUSD > 0) ? so.wholesaleUSD : (so.newPriceUSD || 0));
    }
    if (String(id || "").endsWith("_PKG")) {
      const p = products?.[String(id).replace(/_PKG$/, "")];
      return p ? calcSYP(p.pkgPriceUSD || 0) : 0;
    }
    const p = products?.[id];
    if (!p) return 0;
    return calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0));
  }

  function getCache(key) {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      const hit = c[key];
      if (hit && Date.now() - hit.t < CACHE_TTL) return hit.v;
    } catch (_) {}
    return null;
  }

  function setCache(key, v) {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      const ks = Object.keys(c);
      if (ks.length > 40) delete c[ks[0]];
      c[key] = { t: Date.now(), v };
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch (_) {}
  }

  // [22, 23, 24, 25] تحسين النطق بشكل عام + اختيار صوت عربي مناسب + إيجاز + إعادة النطق
  function cleanSpeechText(raw, briefOnly = false) {
    let s = String(raw || "")
      .replace(/[\u{1F300}-\u{1FAFF}🐾✨🎤🎧🎙️🤔🤩💡📌📍🔊🔇🗣️]/gu, "")
      .replace(/[*_`#<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (briefOnly && s.length > 110) {
      s = s.slice(0, 110).replace(/\s+\S*$/, "") + ".";
    }
    return s;
  }

  function pickArabicVoice() {
    try {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      return voices.find(v => /ar(-|_|$)/i.test(v.lang)) || voices.find(v => /arabic/i.test(v.name)) || null;
    } catch (_) {
      return null;
    }
  }

  function speakOutput(text, forceSpeak = false) {
    const prefs = getPrefs();
    if (prefs.voiceMode === "muted" && !forceSpeak) return;
    const cleaned = cleanSpeechText(text, prefs.voiceMode === "brief" && !forceSpeak);
    if (!cleaned) return;
    sessionMemory.lastSpokenText = cleaned;
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleaned);
      const arVoice = pickArabicVoice();
      if (arVoice) u.voice = arVoice;
      u.lang = arVoice?.lang || "ar-SA";
      u.rate = 1.0;
      u.pitch = 1.04;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  window.replayLastCompanionSpeech = function () {
    if (sessionMemory.lastSpokenText) speakOutput(sessionMemory.lastSpokenText, true);
  };

  window.cycleCompanionVoiceMode = function () {
    haptic(12);
    const prefs = getPrefs();
    const order = ["natural", "brief", "muted"];
    const next = order[(order.indexOf(prefs.voiceMode) + 1) % order.length];
    setPrefs({ voiceMode: next });
    const labels = { natural: "🗣️ نطق طبيعي واضح", brief: "⚡ نطق موجز سريع", muted: "🔇 الصوت مكتوم" };
    showBubble(labels[next], 2600);
    showToast(labels[next]);
  };

  // [20, 21] تبديل الشخصية (بما فيها 3 شخصيات للفتيات) وحفظها تلقائياً
  window.selectCompanionPersona = function (personaKey) {
    if (!PERSONAS[personaKey]) return;
    haptic(15);
    setPrefs({ persona: personaKey });
    syncOrbVisuals();
    const p = PERSONAS[personaKey];
    const msg = `أهلاً بك مع ${p.name}! اضغط مطوّلاً وتحدّث.`;
    showBubble(msg, 3200);
    speakOutput(msg);
  };

  window.setCompanionHidden = function (hide) {
    haptic(15);
    setPrefs({ hidden: !!hide });
    syncOrbVisuals();
  };

  function showBubble(text, ms = 5500) {
    const b = $("petMiniBubble");
    if (!b || !text) return;
    b.textContent = text;
    b.style.display = "block";
    clearTimeout(bubbleHideTimer);
    if (ms > 0) bubbleHideTimer = setTimeout(() => { b.style.display = "none"; }, ms);
  }

  function updateOrbMood(mood = "idle", bubbleText = "") {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const orb = $("petCharOrb");
    const ring = $("petListenRing");
    if (!orb) return;

    const moodFaces = {
      idle: p.icon,
      listening: "🎙️",
      thinking: "🤔",
      speaking: "🗣️",
      happy: "🤩",
      choice: "🔀"
    };
    orb.textContent = moodFaces[mood] || p.icon;
    orb.style.borderColor = mood === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = mood === "listening" ? "block" : "none";
    if (bubbleText) showBubble(bubbleText, mood === "listening" ? 0 : 6000);
  }

  function syncOrbVisuals() {
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
        ? "radial-gradient(circle at 28% 25%, #ffffff, #e8edf5 72%)"
        : "radial-gradient(circle at 28% 25%, rgba(255,255,255,0.38), var(--card-bg) 66%)";
      orb.style.boxShadow = isLight
        ? `0 10px 22px rgba(0,0,0,0.2), 0 0 14px ${p.accent}55`
        : `0 12px 26px rgba(0,0,0,0.55), 0 0 16px ${p.accent}66, inset 0 2px 6px rgba(255,255,255,0.4)`;
    }
  }

  // [1, 2, 3, 4, 5] كشف تعدد الأحجام أو الأنواع لتجنب حشو السلة وإتاحة التخيير الفوري
  function findMatchingProducts(normText) {
    const tokens = normText.split(/[^a-z0-9\u0600-\u06FF]+/).filter(w => w.length >= 2);
    if (!tokens.length) return [];

    return Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const pNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
        const cNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.category || "") : (p.category || "")).toLowerCase();
        let score = 0;
        tokens.forEach(t => {
          if (pNorm.includes(t)) score += 10;
          else if (cNorm.includes(t)) score += 3;
        });
        return { pid, p, st, pNorm, score };
      })
      .filter(x => x && x.score >= 10)
      .sort((a, b) => (b.st > 0 ? 1 : 0) - (a.st > 0 ? 1 : 0) || b.score - a.score);
  }

  // [6, 7] تجهيز سلة نقرشات/ميزانية لفئة معينة (مثال: نقارشات بـ 500)
  function buildCategoryBudgetBasket(normText, budgetNum) {
    const isSnacks = /نقارش|موالح|بسكوت|حلو|شيبس|تسالي/.test(normText);
    const candidates = Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const price = getUnitSYP(pid);
        if (st <= 0 || price <= 0 || price > budgetNum) return null;
        const textBlob = ((p.name || "") + " " + (p.category || "")).toLowerCase();
        const normBlob = typeof normalizeArabic === "function" ? normalizeArabic(textBlob) : textBlob;
        const matchesCat = isSnacks ? /نقارش|موالح|بسكوت|حلو|شيبس|تسالي|مقرمش/.test(normBlob) : true;
        return { pid, name: p.name, price, st, matchesCat };
      })
      .filter(Boolean)
      .sort((a, b) => (b.matchesCat ? 1 : 0) - (a.matchesCat ? 1 : 0) || a.price - b.price);

    let spent = 0;
    const picked = [];
    for (const c of candidates) {
      if (picked.length >= 5) break;
      if (spent + c.price <= budgetNum) {
        picked.push({ id: c.pid, name: c.name, qty: 1, reason: c.matchesCat ? "من فئة النقارشات والحلويات" : "ضمن الميزانية" });
        spent += c.price;
      }
    }
    return picked;
  }

  // [8, 9, 10, 11] ترشيح أقرب 5 مواد متوفرة للمهام والطبخات (مثال: مواد صنع الأرز / تنظيف المطبخ)
  function buildTaskOrRecipeTop5(normText) {
    const isRice = /رز|ارز|كبسه|مقلوبه|طبخ/.test(normText);
    const isKitchenClean = /تنظيف|مطبخ|جلي|صابون|منظف|سائل|ليف/.test(normText);
    if (!isRice && !isKitchenClean) return null;

    const keywords = isRice
      ? ["رز", "ارز", "زيت", "سمن", "سمنه", "شعيريه", "ملح", "بهار", "مرق"]
      : ["جلي", "صابون", "منظف", "مطبخ", "ليف", "اسفنج", "كلور", "معقم", "سائل"];

    const scored = Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const raw = ((p.name || "") + " " + (p.category || "")).toLowerCase();
        const n = typeof normalizeArabic === "function" ? normalizeArabic(raw) : raw;
        let hit = 0;
        keywords.forEach(k => { if (n.includes(k)) hit += 10; });
        if (hit <= 0) return null;
        return {
          id: pid,
          name: p.name,
          qty: 1,
          st,
          reason: st > 0 ? "متوفر في الفرع ومناسب للمهمة" : "غير متوفر حالياً"
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.st > 0 ? 1 : 0) - (a.st > 0 ? 1 : 0))
      .slice(0, 5);

    return scored;
  }

  function addItemSafelyToCart(pid, qty = 1) {
    const baseId = String(pid || "").replace(/_PKG$/, "");
    const pObj = products?.[baseId] || specialOffers?.[pid];
    if (!pObj) return 0;
    const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : (parseInt(pObj.stock) || 0);
    if (avail <= 0) return 0;
    const cur = cart[pid] ? (parseInt(cart[pid].qty) || 0) : 0;
    const toAdd = Math.min(Math.max(1, parseInt(qty) || 1), Math.max(0, avail - cur));
    if (toAdd > 0) {
      changeQty(pid, toAdd);
      if (!sessionMemory.lastAddedIds.includes(pid)) sessionMemory.lastAddedIds.push(pid);
    }
    return toAdd;
  }

  function renderChoiceStrip(choices, titleText = "اختر النوع أو الحجم المناسب:") {
    const assistBox = $("aiSmartAssistantBox");
    if (!assistBox) return;
    let box = $("petChoiceStripBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "petChoiceStripBox";
      box.style.cssText = "margin-top:6px;";
      assistBox.appendChild(box);
    }
    if (!choices || !choices.length) {
      box.innerHTML = "";
      return;
    }

    sessionMemory.lastChoices = choices.slice(0, 5);
    box.innerHTML = `
      <div style="background:rgba(212,175,55,0.09); border:1px solid var(--gold-color); border-radius:8px; padding:7px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
          <span style="font-size:11px; font-weight:bold; color:var(--gold-color);">${esc(titleText)}</span>
          <button type="button" onclick="$('petChoiceStripBox').innerHTML=''" style="background:transparent; border:none; color:var(--gray-text); font-size:11px; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:2px;">
          ${choices.slice(0, 5).map(ch => {
            const thumb = getThumb(ch.id);
            const price = getUnitSYP(ch.id).toLocaleString();
            return `<div style="min-width:118px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:7px; padding:6px; text-align:center; flex-shrink:0;">
              <img src="${esc(thumb)}" onerror="this.src='store-icon.png'" style="width:44px; height:44px; border-radius:6px; object-fit:cover; margin:0 auto 4px auto; display:block;">
              <div style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(ch.label || ch.name || '')}">${esc(ch.label || ch.name || '')}</div>
              <div style="font-size:10px; color:var(--success-color); font-weight:bold; margin:2px 0;">${price} ل.س</div>
              <div style="font-size:9px; color:var(--gray-text); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(ch.reason || "")}</div>
              <button type="button" onclick="pickCompanionChoice('${esc(ch.id)}')" class="btn" style="padding:3px 6px; font-size:10px; background:var(--gold-color); color:#000;">➕ اختيار هذا</button>
            </div>`;
          }).join("")}
        </div>
      </div>`;
  }

  window.pickCompanionChoice = function (pid) {
    const added = addItemSafelyToCart(pid, 1);
    if (added > 0) {
      haptic([15, 30, 15]);
      const baseId = String(pid).replace(/_PKG$/, "");
      const name = products?.[baseId]?.name || specialOffers?.[pid]?.name || "الصنف";
      const msg = `أضفت ${name} إلى سلتك.`;
      updateOrbMood("happy", msg);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      speakOutput(msg);
      const box = $("petChoiceStripBox");
      if (box) box.innerHTML = "";
    } else {
      showToast("⚠️ الكمية غير متوفرة حالياً", true);
    }
  };

  window.runAIShoppingAssistant = async function (overridePrompt = null, speakResponse = false) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    if (!promptTxt) {
      updateOrbMood("idle", "اضغط مطوّلاً وتحدّث بطلبك أو سؤالك.");
      return;
    }

    sessionMemory.lastPrompt = promptTxt;
    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    // [13, 14] ذاكرة سياقية سريعة للرد على التخيير أو تعديل الكمية
    if (sessionMemory.lastChoices.length > 0 && /^(الاولى|الاول|1|الثانيه|الثاني|2|الثالثه|الثالث|3|الوسط|ارخص|الافضل)$/.test(norm)) {
      let picked = sessionMemory.lastChoices[0];
      if (/الثانيه|الثاني|2|الوسط/.test(norm) && sessionMemory.lastChoices[1]) picked = sessionMemory.lastChoices[1];
      if (/الثالثه|الثالث|3/.test(norm) && sessionMemory.lastChoices[2]) picked = sessionMemory.lastChoices[2];
      if (/ارخص/.test(norm)) {
        picked = [...sessionMemory.lastChoices].sort((a, b) => getUnitSYP(a.id) - getUnitSYP(b.id))[0] || picked;
      }
      window.pickCompanionChoice(picked.id);
      return;
    }

    if (/زود|اكثر|حبتين|2/.test(norm) && sessionMemory.lastAddedIds.length > 0) {
      const targetId = sessionMemory.lastAddedIds[sessionMemory.lastAddedIds.length - 1];
      const added = addItemSafelyToCart(targetId, 1);
      if (added > 0) {
        const msg = "زدت حبة إضافية في السلة.";
        updateOrbMood("happy", msg);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        if (speakResponse) speakOutput(msg, true);
        return;
      }
    }

    // [6, 7] فحص طلب ميزانية لفئة محددة محلياً (مثل نقارشات بـ 500)
    const numMatch = norm.match(/(\d{2,7})/);
    if (numMatch && /نقارش|موالح|بسكوت|حلو|شيبس|تسالي|ميزاني|معي/.test(norm)) {
      const bAmt = parseInt(numMatch[1]);
      const basket = buildCategoryBudgetBasket(norm, bAmt);
      if (basket.length > 0) {
        let added = 0;
        basket.forEach(b => { added += addItemSafelyToCart(b.id, b.qty); });
        renderChoiceStrip(basket.map(b => ({ id: b.id, label: b.name, reason: b.reason })), `سلة ضمن ${bAmt.toLocaleString()} ل.س:`);
        const msg = `جهزتلك ${added} أصناف ضمن ${bAmt.toLocaleString()} ل.س.`;
        updateOrbMood("happy", msg);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        if (speakResponse) speakOutput(msg, true);
        return;
      }
    }

    // [8, 9, 10, 11] فحص المهام والطبخات (أقرب 5 مواد متوفرة)
    const taskList = buildTaskOrRecipeTop5(norm);
    if (taskList && taskList.length > 0) {
      const availableTask = taskList.filter(t => t.st > 0).slice(0, 5);
      sessionMemory.lastTaskItems = availableTask;
      renderChoiceStrip(
        availableTask.map(t => ({ id: t.id, label: t.name, reason: t.reason })),
        "أقرب 5 مواد متوفرة للمهمة أو الطبخة (اختر ما تحتاجه):"
      );
      const names = availableTask.map(t => t.name).join(" و");
      const msg = `أقرب المواد المتوفرة: ${names}.`;
      updateOrbMood("choice", msg);
      setTxt("aiShoppingStatusText", `💡 ${msg}`);
      if (speakResponse) speakOutput(msg, true);
      return;
    }

    const sendBtn = $("aiShoppingSendBtn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "⏳..."; }
    updateOrbMood("thinking", "جاري التحليل...");
    setTxt("aiShoppingStatusText", "🤖 جاري مطابقة الطلب...");

    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";

    try {
      if (navigator.onLine === false || !workerUrl) throw new Error("FALLBACK");

      const cacheKey = `${prefs.persona}::${activeBranchId}::${norm}`;
      let data = getCache(cacheKey);

      if (!data) {
        const subset = findMatchingProducts(norm).slice(0, 45).map(x => ({
          id: x.pid,
          name: x.p.name || "",
          category: x.p.category || "",
          stock: x.st,
          priceSYP: getUnitSYP(x.pid)
        }));

        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "companion_shop",
            prompt: promptTxt,
            catalog: subset,
            currentCart: Object.values(cart || {}).map(c => ({ id: c.id, name: c.name, qty: c.qty })),
            storeMeta: {
              personaName: persona.name,
              personaStyle: persona.styleHint,
              lastChoices: sessionMemory.lastChoices.slice(0, 5),
              lastAddedIds: sessionMemory.lastAddedIds.slice(-4),
              branchName: typeof getBranchName === "function" ? getBranchName(activeBranchId) : "الرئيسي"
            }
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error("FALLBACK");
        data = json.data || {};
        setCache(cacheKey, data);
      }

      const choices = Array.isArray(data.choices) ? data.choices.slice(0, 5) : [];
      const taskSugs = Array.isArray(data.taskSuggestions) ? data.taskSuggestions.slice(0, 5) : [];
      const combinedChoices = choices.length ? choices : taskSugs.map(t => ({ id: t.id, label: t.name || products?.[t.id]?.name || "", reason: t.reason || "" }));

      if (combinedChoices.length > 0) {
        renderChoiceStrip(combinedChoices, choices.length ? "تعددت الأنواع أو الأحجام — اختر المناسب لك:" : "أقرب المواد المتوفرة لطلبك:");
      }

      // إضافة حد أقصى صنف واحد عند تعدد الخيارات لتجنب حشو السلة
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const itemsToAdd = combinedChoices.length > 1 ? rawItems.slice(0, 1) : rawItems.slice(0, 3);
      let addedCount = 0;
      const addedLabels = [];

      itemsToAdd.forEach(it => {
        const added = addItemSafelyToCart(String(it?.id || "").trim(), parseInt(it?.qty) || 1);
        if (added > 0) {
          addedCount += added;
          const baseId = String(it.id).replace(/_PKG$/, "");
          addedLabels.push(products?.[baseId]?.name || specialOffers?.[it.id]?.name || "صنف");
        }
      });

      if (addedCount > 0) haptic([15, 30, 15]);

      const replyTxt = data.reply || (addedLabels.length ? `أضفت ${addedLabels.join(" و")} إلى السلة.` : "تفضّل، كيف أساعدك؟");
      const speechTxt = data.spokenText || replyTxt;
      updateOrbMood(combinedChoices.length > 1 ? "choice" : (addedCount > 0 ? "happy" : "speaking"), replyTxt);
      setTxt("aiShoppingStatusText", `🐾 ${replyTxt}`);
      if (speakResponse) speakOutput(speechTxt, true);
    } catch (_) {
      // [13] خطة بديلة محلية فورية دون إزعاج الزبون
      const matches = findMatchingProducts(norm).filter(m => m.st > 0);
      if (matches.length > 1) {
        renderChoiceStrip(
          matches.slice(0, 5).map(m => ({ id: m.pid, label: m.p.name, reason: "متوفر في الفرع" })),
          "توجد عدة أنواع أو أحجام متوفرة — اختر واحداً:"
        );
        const msg = "وجدت عدة خيارات متوفرة، اختر النوع أو الحجم المناسب.";
        updateOrbMood("choice", msg);
        setTxt("aiShoppingStatusText", `💡 ${msg}`);
        if (speakResponse) speakOutput(msg, true);
      } else if (matches.length === 1) {
        const added = addItemSafelyToCart(matches[0].pid, 1);
        const msg = added > 0 ? `أضفت ${matches[0].p.name} إلى سلتك.` : "الصنف غير متوفر حالياً.";
        updateOrbMood("happy", msg);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        if (speakResponse) speakOutput(msg, true);
      } else {
        const msg = "لم أجد تطابقاً مباشراً الآن، جرّب البحث بالاسم أو أعد المحاولة.";
        updateOrbMood("speaking", msg);
        setTxt("aiShoppingStatusText", `🐾 ${msg}`);
        if (speakResponse) speakOutput(msg, true);
      }
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "✨ تعبئة"; }
    }
  };

  // بدء الاستماع عند النقر المطوّل على الشخصية ثلاثية الأبعاد
  function beginLongPressListen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showBubble("المتصفح لا يدعم الصوت، اكتب طلبك في الخانة.", 3800);
      return;
    }
    if (activeRecognizer) {
      try { activeRecognizer.stop(); } catch (_) {}
      activeRecognizer = null;
    }

    isHoldingToSpeak = true;
    haptic(25);
    updateOrbMood("listening", "تحدّث الآن... اترك إصبعك عند الانتهاء");

    const rec = new SR();
    activeRecognizer = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = ev => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) {
        updateOrbMood("idle", "لم أسمع بوضوح، جرّب النقر المطوّل مرة أخرى.");
        return;
      }
      setVal("aiShoppingPromptInput", heard);
      window.runAIShoppingAssistant(heard, true);
    };

    rec.onerror = () => {
      updateOrbMood("idle", "تعذر التقاط الصوت، تأكد من إذن الميكروفون.");
    };

    rec.onend = () => {
      isHoldingToSpeak = false;
      activeRecognizer = null;
      const ring = $("petListenRing");
      if (ring) ring.style.display = "none";
    };

    rec.start();
  }

  function endLongPressListen() {
    if (!isHoldingToSpeak) return;
    isHoldingToSpeak = false;
    if (activeRecognizer) {
      setTimeout(() => {
        try { activeRecognizer && activeRecognizer.stop(); } catch (_) {}
      }, 350);
    }
  }

  window.startVoiceShoppingInput = function () {
    beginLongPressListen();
    setTimeout(endLongPressListen, 4500);
  };

  // [18, 19] حيوية ثلاثية الأبعاد + سحب + نقر مطوّل + نقرة سريعة
  function bindCharacterOrb(orb, root) {
    if (!orb || !root || orb.dataset.v35Bound) return;
    orb.dataset.v35Bound = "1";

    let down = false, dragging = false, holdFired = false, holdTimer = null;
    let sx = 0, sy = 0, r0 = 14, b0 = 88;

    const onDown = e => {
      const pt = e.touches ? e.touches[0] : e;
      down = true; dragging = false; holdFired = false;
      sx = pt.clientX; sy = pt.clientY;
      r0 = parseInt(root.style.right || "14", 10);
      b0 = parseInt(root.style.bottom || "88", 10);
      orb.style.transform = "scale(1.08) rotateX(10deg) rotateY(-8deg)";

      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (down && !dragging) {
          holdFired = true;
          beginLongPressListen();
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
        if (holdFired) endLongPressListen();
      }

      if (dragging) {
        const nr = Math.max(8, Math.min(Math.max(8, window.innerWidth - 68), r0 - dx));
        const nb = Math.max(84, Math.min(Math.max(84, window.innerHeight - 96), b0 - dy));
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

      if (holdFired) {
        endLongPressListen();
        return;
      }

      if (dragging) {
        dragging = false;
        const curR = parseInt(root.style.right || "14", 10);
        const curB = parseInt(root.style.bottom || "88", 10);
        const centerFromLeft = window.innerWidth - curR - 28;
        const snapR = centerFromLeft >= window.innerWidth / 2 ? 12 : Math.max(12, window.innerWidth - 68);
        root.style.transition = "right 0.2s ease, bottom 0.2s ease";
        root.style.right = snapR + "px";
        setTimeout(() => { root.style.transition = ""; }, 220);
        savePos(snapR, curB);
        haptic(12);
        return;
      }

      // نقرة سريعة: إعادة نطق آخر رد إذا وُجد، وإلا تلميح خفيف
      haptic(10);
      if (sessionMemory.lastSpokenText) {
        speakOutput(sessionMemory.lastSpokenText, true);
        showBubble("🔊 " + sessionMemory.lastSpokenText, 3800);
      } else {
        showBubble("اضغط مطوّلاً وتحدّث 🎤 (أو غيّر الشخصية بالأعلى)", 3600);
      }
    };

    orb.addEventListener("contextmenu", e => e.preventDefault());
    orb.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    orb.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    window.addEventListener("scroll", () => {
      if (isHoldingToSpeak) return;
      root.style.opacity = "0.45";
      clearTimeout(scrollFadeTimer);
      scrollFadeTimer = setTimeout(() => { root.style.opacity = "1"; }, 550);
    }, { passive: true });
  }

  // أدوات الإدارة
  window.runSupplierInvoiceOCR = async function () {
    const file = $("aiSupplierInvoiceFile")?.files?.[0], outBox = $("aiSupplierInvoiceResult");
    if (!file || !outBox) return;
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    outBox.innerHTML = `<div style="color:#00b0ff; font-size:11px;">⏳ جاري قراءة الفاتورة...</div>`;
    try {
      const b64 = await fileToBase64Clean(file);
      const res = await fetch(workerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "supplier_invoice_ocr", imageBase64: b64, imageMimeType: file.type || "image/jpeg" }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل القراءة");
      const items = Array.isArray(json.data?.items) ? json.data.items : [];
      window._lastParsedSupplierItems = items;
      outBox.innerHTML = items.length ? `<table class="tbl-clean"><thead><tr><th style="text-align:right;">الصنف</th><th>الكمية</th><th>التكلفة</th><th>إضافة</th></tr></thead><tbody>` + items.map((it, idx) => `<tr><td style="text-align:right;">${esc(it.name)}</td><td>${parseInt(it.qty) || 1}</td><td>${(Number(it.unitCost) || 0).toLocaleString()}</td><td><button type="button" onclick="applyParsedInvoiceItemToForm(${idx})" class="btn" style="padding:2px 6px; font-size:10px; width:auto;">⬇️</button></td></tr>`).join("") + `</tbody></table>` : `<div style="color:#ff9800; font-size:11px;">⚠️ لم تظهر أصناف واضحة.</div>`;
    } catch (err) { outBox.innerHTML = `<div style="color:var(--danger-color); font-size:11px;">❌ ${esc(err.message)}</div>`; }
  };

  window.applyParsedInvoiceItemToForm = function (idx) {
    const it = (window._lastParsedSupplierItems || [])[idx];
    if (!it) return;
    setVal("prodName", it.name || ""); setVal("prodStock", parseInt(it.qty) || 1);
    if (it.unitCost > 0) { setVal("prodCostSYP", Math.round(it.unitCost)); if (typeof updateLiveUSD === "function") updateLiveUSD("prodCostSYP", "prodCostUSDPreview", "prodCostUSD"); }
    showToast(`✅ تمت تعبئة (${it.name})`);
  };

  window.generateSmartDebtReminderWhatsApp = async function () {
    const phone = $("adminDebtCustomerSelect")?.value;
    if (!phone || !users?.[phone]) return alert("⚠️ اختر زبون الآجل أولاً.");
    const u = users[phone], balUSD = parseFloat(u.debtBalanceUSD) || 0;
    if (balUSD <= 0) return alert("✅ لا يوجد رصيد مستحق على هذا الزبون.");
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    try {
      const res = await fetch(workerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "debt_reminder", debtInfo: { customerName: u.name, amount: `${balUSD.toFixed(2)} $ (${calcSYP(balUSD).toLocaleString()} ل.س)`, daysOverdue: 7 } }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل توليد الرسالة");
      window.open(`https://wa.me/${formatWhatsAppPhone(phone)}?text=${encodeURIComponent(json.data?.message || "")}`, "_blank");
    } catch (err) { alert("❌ " + err.message); }
  };

  window.runDailyBriefAI = async function () {
    const box = $("aiDailyBriefOutput");
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    if (box) box.innerHTML = `<div style="color:#00b0ff; font-size:11px; margin-top:6px;">⏳ جاري التحليل...</div>`;
    const snap = window.latestStatsSnapshot || {};
    const lowItems = Object.values(products || {}).filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.alertLimit) || 2)).slice(0, 10).map(p => p.name);
    try {
      const res = await fetch(workerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "daily_brief", stats: { totalSalesSYP: snap.totS || 0, netProfitSYP: snap.netP || 0, lowStockItems: lowItems } }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل التحليل");
      const d = json.data || {};
      if (box) box.innerHTML = `<div class="adm-card" style="border-color:#00e676; margin-top:8px; font-size:11px;"><b style="color:#00e676;">🤖 ملخص اليوم:</b><p style="margin:4px 0;">${esc(d.summary || "")}</p><ul style="margin:0; padding-right:16px;">${(d.actions || []).map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>`;
    } catch (err) { if (box) box.innerHTML = `<div style="color:var(--danger-color); font-size:11px; margin-top:6px;">❌ ${esc(err.message)}</div>`; }
  };

  function mountV35() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const assistBox = $("aiSmartAssistantBox");

    // شريط اختيار الشخصية (يتضمن 3 شخصيات للفتيات) + وضع النطق + إظهار المرافق عند الإخفاء
    if (assistBox && !$("petPersonaBar")) {
      const bar = document.createElement("div");
      bar.id = "petPersonaBar";
      bar.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:5px; flex-wrap:wrap; margin-bottom:6px; font-size:10px;";
      const opts = Object.values(PERSONAS).map(per =>
        `<option value="${per.id}">${per.icon} ${per.name}${per.gender === "female" ? " (للبنات)" : ""}</option>`
      ).join("");
      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:4px; flex:1; min-width:170px;">
          <span style="color:var(--gold-color); font-weight:bold;">المرافق:</span>
          <select id="petPersonaSelect" class="form-control" onchange="selectCompanionPersona(this.value)" style="padding:3px 6px; font-size:10px; flex:1;">${opts}</select>
        </div>
        <div style="display:flex; gap:4px;">
          <button type="button" onclick="cycleCompanionVoiceMode()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff;">🔊 النطق</button>
          <button id="petShowCharBtn" type="button" onclick="setCompanionHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار 3D</button>
        </div>`;
      assistBox.insertBefore(bar, assistBox.firstChild);
    }

    // الشخصية ثلاثية الأبعاد فقط (بدون لوحة عائمة مزعجة)
    if (!$("petCharRoot")) {
      const styleTag = document.createElement("style");
      styleTag.id = "pet3DStyleV35";
      styleTag.textContent = `
        @keyframes petAlive3D {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.03); }
        }
        @keyframes petRingWave {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.38); opacity: 0; }
        }
        #petCharOrb {
          width: 56px; height: 56px; border-radius: 50%;
          border: 2.5px solid ${p.accent};
          font-size: 27px; display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          animation: petAlive3D 2.6s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        #petListenRing {
          display: none; position: absolute; inset: -6px; border-radius: 50%;
          border: 2.5px solid #00e676; pointer-events: none;
          animation: petRingWave 1.1s infinite;
        }
        #petMiniBubble {
          display: none; position: absolute; bottom: 66px; right: 0;
          max-width: 225px; width: max-content;
          background: var(--card-bg); color: var(--text-color);
          border: 1px solid var(--gold-color); border-radius: 10px;
          padding: 6px 9px; font-size: 11px; line-height: 1.4;
          box-shadow: 0 8px 20px rgba(0,0,0,0.45); pointer-events: none;
        }`;
      document.head.appendChild(styleTag);

      const root = document.createElement("div");
      root.id = "petCharRoot";
      root.style.cssText = "position:fixed; bottom:88px; right:14px; z-index:98; perspective:600px; transition:opacity 0.2s ease;";
      root.innerHTML = `
        <div id="petMiniBubble"></div>
        <div style="position:relative;">
          <div id="petListenRing"></div>
          <div id="petCharOrb" role="button" aria-label="المرافق ثلاثي الأبعاد">${p.icon}</div>
        </div>`;
      document.body.appendChild(root);
      bindCharacterOrb($("petCharOrb"), root);
    }

    // أدوات الإدارة
    const prodTab = $("admTab4Products");
    if (prodTab && !$("aiSupplierInvoiceCard")) {
      const card = document.createElement("div"); card.id = "aiSupplierInvoiceCard"; card.className = "adm-sec"; card.style.borderColor = "#00b0ff";
      card.innerHTML = `<div class="adm-sec-title"><span style="color:#00b0ff;">📸 قراءة فاتورة مورد بالكاميرا</span></div><input type="file" id="aiSupplierInvoiceFile" accept="image/*" class="form-control" style="margin-bottom:6px;" onchange="runSupplierInvoiceOCR()"><div id="aiSupplierInvoiceResult"></div>`;
      prodTab.insertBefore(card, prodTab.firstChild);
    }

    const debtSum = $("adminDebtCustomerSummary");
    if (debtSum && !$("aiDebtReminderBtn")) {
      const btn = document.createElement("button"); btn.id = "aiDebtReminderBtn"; btn.type = "button"; btn.className = "btn";
      btn.style.cssText = "margin-top:8px; background:linear-gradient(45deg,#25D366,#00b0ff); color:#000; font-size:11px; padding:6px;";
      btn.textContent = "🤖 توليد رسالة تذكير دين مهذبة وإرسالها واتساب"; btn.onclick = window.generateSmartDebtReminderWhatsApp;
      debtSum.appendChild(btn);
    }

    const statsTab = $("admTab1Stats");
    if (statsTab && !$("aiDailyBriefBtn")) {
      const wrap = document.createElement("div"); wrap.className = "adm-sec"; wrap.style.borderColor = "#00e676";
      wrap.innerHTML = `<button id="aiDailyBriefBtn" type="button" onclick="runDailyBriefAI()" class="btn" style="background:linear-gradient(45deg,#00b0ff,#00e676); color:#000; font-size:12px; font-weight:bold;">🤖 تحليل نهاية اليوم الذكي</button><div id="aiDailyBriefOutput"></div>`;
      statsTab.insertBefore(wrap, statsTab.firstChild);
    }

    syncOrbVisuals();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountV35(); };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncOrbVisuals, 60); };

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => { pickArabicVoice(); };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV35);
  else mountV35();
})();

// ============================================================================
// محرك المرافق التفاعلي المتعلم لمتجر معاذ (v36 - Interactive & Adaptive)
// - نافذة اقتراحات تفاعلية مع تحكم بالكميات (+ / -) وإلغاء أو إضافة
// - حصر دقيق لفئة النقارشات/الحلويات/البسكوت وفصل تام لمهام الطبخ والتنظيف
// - تكيّف النطق والسرعة والنبرة مع كل شخصية + تعلّم ذاتي بالممارسة
// - بدون أي تدخل للذكاء الاصطناعي في الدفع أو فحص الإشعارات
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v36_prefs";
  const POS_KEY = "moaath_pet_v36_pos";
  const LEARN_KEY = "moaath_pet_v36_learned";

  const PERSONAS = {
    buddy: { id: "buddy", name: "بندق الودود", icon: "🐱", accent: "#00b0ff", rate: 1.02, pitch: 1.05, prefix: "يا هلا! " },
    pro: { id: "pro", name: "صقر السريع", icon: "🦅", accent: "#00e676", rate: 1.15, pitch: 0.96, prefix: "مباشرة: " },
    saver: { id: "saver", name: "ثعلب التوفير", icon: "🦊", accent: "#D4AF37", rate: 0.98, pitch: 1.0, prefix: "بأفضل توفير: " },
    lulu: { id: "lulu", name: "لولو اللطيفة", icon: "🐰", accent: "#ff7eb6", rate: 0.96, pitch: 1.18, prefix: "أهلاً فيكِ، " },
    sara: { id: "sara", name: "سارة المنظمة", icon: "🦋", accent: "#7c4dff", rate: 1.03, pitch: 1.12, prefix: "رتبتلك القائمة: " },
    noor: { id: "noor", name: "نور الذكية", icon: "✨", accent: "#ff9800", rate: 1.06, pitch: 1.14, prefix: "إليكِ الأنسب: " }
  };

  let activeRecognizer = null;
  let isHoldingSpeak = false;
  let bubbleTimer = null;
  let scrollTimer = null;
  let modalItemsState = [];

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
        voiceMode: ["persona", "calm", "muted"].includes(d.voiceMode) ? d.voiceMode : "persona"
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, voiceMode: "persona" };
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

  // [التعلم بالممارسة] حفظ تفضيل الأصناف حسب نوع الطلب أو المهمة
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

  // [تحسين النطق ومراعاة اختلاف الشخصيات]
  function formatNaturalSpeech(text, persona, mode) {
    let clean = String(text || "")
      .replace(/[\u{1F300}-\u{1FAFF}🐾✨🎤🎧🎙️🤔🤩💡📌📍🔊🔇🗣️]/gu, "")
      .replace(/[•\-_*#]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return "";
    if (!clean.startsWith(persona.prefix.trim())) {
      clean = persona.prefix + clean;
    }
    if (mode === "calm" && clean.length > 95) {
      clean = clean.slice(0, 95).replace(/\s+\S*$/, "") + ".";
    }
    return clean;
  }

  function speakWithPersona(rawText, force = false) {
    const prefs = getPrefs();
    if (prefs.voiceMode === "muted" && !force) return;
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const phrase = formatNaturalSpeech(rawText, persona, prefs.voiceMode);
    if (!phrase) return;

    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase);
      const voices = window.speechSynthesis.getVoices?.() || [];
      const arVoice = voices.find(v => /ar(-|_|$)/i.test(v.lang)) || voices.find(v => /arabic/i.test(v.name));
      if (arVoice) utter.voice = arVoice;
      utter.lang = arVoice?.lang || "ar-SA";
      utter.rate = prefs.voiceMode === "calm" ? 0.92 : persona.rate;
      utter.pitch = persona.pitch;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  window.cyclePersonaVoiceMode = function () {
    haptic(12);
    const prefs = getPrefs();
    const seq = ["persona", "calm", "muted"];
    const next = seq[(seq.indexOf(prefs.voiceMode) + 1) % seq.length];
    setPrefs({ voiceMode: next });
    const labels = { persona: "🗣️ صوت حسب الشخصية", calm: "🌿 صوت هادئ ومختصر", muted: "🔇 الصوت مكتوم" };
    showBubble(labels[next], 2800);
    showToast(labels[next]);
  };

  window.selectPetPersona = function (key) {
    if (!PERSONAS[key]) return;
    haptic(15);
    setPrefs({ persona: key });
    syncVisuals();
    const p = PERSONAS[key];
    const msg = `تم اختيار ${p.name}`;
    showBubble(`${p.icon} ${msg} — اضغط مطوّلاً وتحدث`, 3200);
    speakWithPersona(msg);
  };

  window.setPetHidden = function (hide) {
    haptic(15);
    setPrefs({ hidden: !!hide });
    syncVisuals();
  };

  function showBubble(txt, ms = 4500) {
    const b = $("petMiniBubble");
    if (!b || !txt) return;
    b.textContent = txt;
    b.style.display = "block";
    clearTimeout(bubbleTimer);
    if (ms > 0) bubbleTimer = setTimeout(() => { b.style.display = "none"; }, ms);
  }

  function setOrbState(state = "idle", bubbleTxt = "") {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const orb = $("petCharOrb");
    const ring = $("petListenRing");
    if (!orb) return;
    const faces = { idle: p.icon, listening: "🎙️", thinking: "🤔", happy: "🤩" };
    orb.textContent = faces[state] || p.icon;
    orb.style.borderColor = state === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = state === "listening" ? "block" : "none";
    if (bubbleTxt) showBubble(bubbleTxt, state === "listening" ? 0 : 4500);
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

  // [النافذة العائمة التفاعلية للاقتراحات مع + / - وإلغاء أو إضافة]
  function openFloatingSuggestionsModal(title, items, intentKey = "general") {
    modalItemsState = items.map(it => ({
      id: it.id,
      name: it.name,
      qty: Math.max(1, parseInt(it.qty) || 1),
      unitPrice: getUnitSYP(it.id),
      thumb: getThumb(it.id),
      reason: it.reason || "",
      included: true
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
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
            <b id="petSugModalTitle" style="color:var(--gold-color); font-size:13px;"></b>
            <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="width:auto; padding:3px 9px; font-size:11px;">✕</button>
          </div>
          <div id="petSugModalList" style="max-height:55vh; overflow-y:auto; margin-bottom:10px;"></div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:10px; padding:6px 8px; background:var(--bg-color); border-radius:6px;">
            <span>المجموع المحدد:</span>
            <strong id="petSugModalTotal" style="color:#00e676; font-size:14px;">0 ل.س</strong>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" onclick="confirmFloatingSuggestions()" class="btn" style="flex:2; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">✅ إضافة المحدد للسلة</button>
            <button type="button" onclick="closePetSuggestionsModal()" class="btn btn-danger" style="flex:1;">إلغاء</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    } else {
      modal.style.display = "flex";
    }

    setTxt("petSugModalTitle", title);
    renderFloatingSuggestionsList();
  }

  function renderFloatingSuggestionsList() {
    const listEl = $("petSugModalList");
    if (!listEl) return;
    let total = 0;

    listEl.innerHTML = modalItemsState.map((it, idx) => {
      const lineTotal = it.included ? it.unitPrice * it.qty : 0;
      if (it.included) total += lineTotal;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; background:var(--bg-color); border:1px solid ${it.included ? "var(--border-color)" : "rgba(255,68,68,0.4)"}; opacity:${it.included ? "1" : "0.55"}; border-radius:8px; padding:7px; margin-bottom:7px;">
          <img src="${esc(it.thumb)}" onerror="this.src='store-icon.png'" style="width:42px; height:42px; border-radius:6px; object-fit:cover; flex-shrink:0;">
          <div style="flex:1; min-width:0; text-align:right;">
            <div style="font-size:12px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(it.name)}</div>
            <div style="font-size:10px; color:var(--gold-color);">${it.unitPrice.toLocaleString()} ل.س × ${it.qty} = <b>${(it.unitPrice * it.qty).toLocaleString()} ل.س</b></div>
            ${it.reason ? `<div style="font-size:9px; color:var(--gray-text);">${esc(it.reason)}</div>` : ""}
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <button type="button" onclick="adjustSuggestionQty(${idx}, -1)" class="mini-btn" style="background:var(--card-bg); color:var(--text-color); border:1px solid var(--border-color);">-</button>
            <span style="font-size:12px; font-weight:bold; min-width:18px; text-align:center;">${it.qty}</span>
            <button type="button" onclick="adjustSuggestionQty(${idx}, 1)" class="mini-btn" style="background:var(--gold-color); color:#000;">+</button>
            <button type="button" onclick="toggleSuggestionItem(${idx})" class="mini-btn" style="background:${it.included ? "rgba(255,68,68,0.2)" : "rgba(0,230,118,0.2)"}; color:${it.included ? "#ff4444" : "#00e676"};" title="${it.included ? "إلغاء" : "إعادة"}">${it.included ? "✕" : "↺"}</button>
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
    it.qty = Math.max(1, Math.min(Math.max(1, maxAvail), it.qty + delta));
    it.included = true;
    renderFloatingSuggestionsList();
  };

  window.toggleSuggestionItem = function (idx) {
    const it = modalItemsState[idx];
    if (!it) return;
    it.included = !it.included;
    renderFloatingSuggestionsList();
  };

  window.closePetSuggestionsModal = function () {
    const m = $("petSuggestionsFloatingModal");
    if (m) m.style.display = "none";
  };

  window.confirmFloatingSuggestions = function () {
    const chosen = modalItemsState.filter(x => x.included && x.qty > 0);
    const rejected = modalItemsState.filter(x => !x.included);
    const intentKey = window._currentSuggestionIntent || "general";

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
    if (rejected.length) recordPracticeLearning(intentKey, rejected.map(r => r.id), -1);

    window.closePetSuggestionsModal();
    if (addedTotal > 0) {
      haptic([15, 35, 15]);
      const msg = `تمت إضافة ${addedTotal} مواد إلى سلتك.`;
      setOrbState("happy", msg);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      speakWithPersona(msg);
      showToast(`✅ ${msg}`);
    } else {
      showToast("⚠️ لم تتم إضافة عناصر جديدة", true);
    }
  };

  // [حل ميزانية الفئة بدقة - مثال: نقارشات بـ 500]
  function buildStrictSnacksBudget(budgetSYP) {
    const learned = getLearnedMap()["snacks_budget"] || {};
    const snackRegex = /نقارش|موالح|بسكوت|حلو|شيبس|تسالي|مقرمش|كناكر|بزر/;
    const foodExcludeRegex = /زعتر|رز|ارز|عدس|برغل|زيت|سمن|معكرونه|شعيريه/;

    const list = Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const price = getUnitSYP(pid);
        if (st <= 0 || price <= 0 || price > budgetSYP) return null;
        const text = ((p.name || "") + " " + (p.category || "")).toLowerCase();
        const norm = typeof normalizeArabic === "function" ? normalizeArabic(text) : text;
        if (!snackRegex.test(norm) || foodExcludeRegex.test(norm)) return null;
        return { pid, name: p.name, price, learnScore: learned[pid] || 0 };
      })
      .filter(Boolean)
      .sort((a, b) => (b.learnScore - a.learnScore) || (a.price - b.price));

    let sum = 0;
    const picked = [];
    for (const item of list) {
      if (picked.length >= 5) break;
      if (sum + item.price <= budgetSYP) {
        picked.push({ id: item.pid, name: item.name, qty: 1, reason: "من أصناف النقارشات والحلويات المتوفرة" });
        sum += item.price;
      }
    }
    return picked;
  }

  // [حل مهام الطبخ والتنظيف بدقة - أقرب 5 مواد متوفرة]
  function buildStrictTaskItems(normText) {
    const isKitchenClean = /تنظيف\s*المطبخ|جلي|صابون\s*جلي|منظف\s*مطبخ|ليف|اسفنج|كلور/.test(normText);
    const isRiceCooking = /صنع\s*الارز|طبخ\s*الارز|مواد\s*الارز|رز|ارز|كبسه|مقلوبه/.test(normText);

    if (!isKitchenClean && !isRiceCooking) return null;

    const intentKey = isKitchenClean ? "kitchen_clean" : "rice_cook";
    const learned = getLearnedMap()[intentKey] || {};

    const targetKeywords = isKitchenClean
      ? ["جلي", "صابون", "منظف", "مطبخ", "ليف", "اسفنج", "كلور", "معقم", "سائل"]
      : ["رز", "ارز", "زيت", "سمن", "سمنه", "شعيريه", "ملح", "بهار"];

    const forbiddenForClean = /رز|ارز|سكر|شاي|مته|بسكوت|شيبس|موالح|حلو/;

    return Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        if (st <= 0) return null;
        const text = ((p.name || "") + " " + (p.category || "")).toLowerCase();
        const norm = typeof normalizeArabic === "function" ? normalizeArabic(text) : text;
        if (isKitchenClean && forbiddenForClean.test(norm)) return null;

        let score = learned[pid] || 0;
        targetKeywords.forEach(k => { if (norm.includes(k)) score += 10; });
        if (score <= 0) return null;

        return {
          id: pid,
          name: p.name,
          qty: 1,
          score,
          reason: isKitchenClean ? "مناسب لتنظيف المطبخ" : "مناسب لتحضير الأرز"
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // [حل تعدد الأحجام والأنواع - تخيير الزبون وعدم حشو السلة]
  function findGroupedOptions(normText) {
    const cleanTokens = normText
      .replace(/\b(متوفر|بـ|ب|سعر|كم|ابغى|اريد|بدي|ابي|مواد|تنظيف|صنع)\b/g, " ")
      .split(/[^a-z0-9\u0600-\u06FF]+/)
      .filter(w => w.length >= 2);
    if (!cleanTokens.length) return [];

    return Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        if (st <= 0) return null;
        const norm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
        if (cleanTokens.some(t => norm.includes(t))) {
          return { id: pid, name: p.name, qty: 1, reason: "متوفر في المخزون" };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 6);
  }

  window.runAIShoppingAssistant = async function (overridePrompt = null, speakOut = false) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    if (!promptTxt) {
      setOrbState("idle", "اضغط مطوّلاً وتحدّث بطلبك أو سؤالك.");
      return;
    }

    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    // 1. ميزانية النقارشات والحلويات
    const budgetNumMatch = norm.match(/(\d{2,7})/);
    if (budgetNumMatch && /نقارش|موالح|بسكوت|حلو|شيبس|تسالي/.test(norm)) {
      const budgetSYP = parseInt(budgetNumMatch[1]);
      const snacksBasket = buildStrictSnacksBudget(budgetSYP);
      if (snacksBasket.length > 0) {
        openFloatingSuggestionsModal(`🍬 نقارشات وحلويات ضمن ${budgetSYP.toLocaleString()} ل.س`, snacksBasket, "snacks_budget");
        const msg = `اخترتلك أصناف نقارشات وحلويات ضمن ${budgetSYP.toLocaleString()} ل.س، تحكم بالكميات أو الإلغاء من النافذة.`;
        setOrbState("happy", msg);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        speakWithPersona(msg, speakOut);
        return;
      }
    }

    // 2. مهام الطبخ والتنظيف (أقرب 5 مواد متوفرة)
    const taskItems = buildStrictTaskItems(norm);
    if (taskItems && taskItems.length > 0) {
      const isClean = /تنظيف\s*المطبخ|جلي|صابون\s*جلي|منظف\s*مطبخ|ليف|اسفنج|كلور/.test(norm);
      openFloatingSuggestionsModal(
        isClean ? "🧽 أقرب مواد متوفرة لتنظيف المطبخ" : "🍚 أقرب مواد متوفرة لصنع الأرز",
        taskItems,
        isClean ? "kitchen_clean" : "rice_cook"
      );
      const msg = isClean ? "جهزتلك أقرب مواد تنظيف المطبخ المتوفرة." : "جهزتلك أقرب مواد تحضير الأرز المتوفرة.";
      setOrbState("happy", msg);
      setTxt("aiShoppingStatusText", `✅ ${msg}`);
      speakWithPersona(msg, speakOut);
      return;
    }

    // 3. تعدد الأنواع أو الأحجام -> فتح نافذة التخيير وعدم حشو السلة
    const options = findGroupedOptions(norm);
    if (options.length > 1) {
      openFloatingSuggestionsModal("🔀 توجد عدة أنواع أو أحجام — اختر ما يناسبك", options, `choice_${norm.slice(0, 20)}`);
      const msg = "توجد عدة أنواع أو أحجام متوفرة، اختر الصنف المناسب وحدد الكمية.";
      setOrbState("happy", msg);
      setTxt("aiShoppingStatusText", `💡 ${msg}`);
      speakWithPersona(msg, speakOut);
      return;
    }

    // 4. صنف واحد واضح ومباشر
    if (options.length === 1) {
      const one = options[0];
      const baseId = String(one.id).replace(/_PKG$/, "");
      const pObj = products?.[baseId] || specialOffers?.[one.id];
      const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : 99;
      const cur = cart[one.id] ? (parseInt(cart[one.id].qty) || 0) : 0;
      const addQty = Math.min(1, Math.max(0, avail - cur));
      if (addQty > 0) {
        changeQty(one.id, addQty);
        recordPracticeLearning(`single_${norm.slice(0, 20)}`, [one.id], 1);
        const msg = `تمت إضافة ${one.name} إلى السلة.`;
        setOrbState("happy", msg);
        setTxt("aiShoppingStatusText", `✅ ${msg}`);
        speakWithPersona(msg, speakOut);
        return;
      }
    }

    const msg = "لم أجد تطابقاً مباشراً لهذا الطلب في المخزون الحالي.";
    setOrbState("idle", msg);
    setTxt("aiShoppingStatusText", `⚠️ ${msg}`);
    speakWithPersona(msg, speakOut);
  };

  // بدء الاستماع عند النقر المطوّل على الشخصية
  function beginLongPressVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showBubble("المتصفح لا يدعم الصوت، اكتب طلبك في الخانة.", 3500);
      return;
    }
    if (activeRecognizer) {
      try { activeRecognizer.stop(); } catch (_) {}
      activeRecognizer = null;
    }

    isHoldingSpeak = true;
    haptic(25);
    setOrbState("listening", "تحدّث الآن... اترك إصبعك عند الانتهاء");

    const rec = new SR();
    activeRecognizer = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = ev => {
      const spoken = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!spoken) {
        setOrbState("idle", "لم أسمع صوتاً واضحاً، جرّب النقر المطوّل مرة أخرى.");
        return;
      }
      setVal("aiShoppingPromptInput", spoken);
      window.runAIShoppingAssistant(spoken, true);
    };

    rec.onerror = () => setOrbState("idle", "تعذر التقاط الصوت، تأكد من إذن الميكروفون.");
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

  // سحب الشخصية + نقر مطوّل للتحدث + نقرة سريعة لتبديل الصوت/التلميح
  function bindOrbInteractions(orb, root) {
    if (!orb || !root || orb.dataset.v36Bound) return;
    orb.dataset.v36Bound = "1";

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

      window.cyclePersonaVoiceMode();
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

  function mountV36() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const assistBox = $("aiSmartAssistantBox");

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
          <select id="petPersonaSelect" class="form-control" onchange="selectPetPersona(this.value)" style="padding:3px 6px; font-size:10px; flex:1;">${opts}</select>
        </div>
        <div style="display:flex; gap:4px;">
          <button type="button" onclick="cyclePersonaVoiceMode()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff;">🔊 النطق</button>
          <button id="petShowCharBtn" type="button" onclick="setPetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار</button>
        </div>`;
      assistBox.insertBefore(bar, assistBox.firstChild);
    }

    if (!$("petCharRoot")) {
      const styleTag = document.createElement("style");
      styleTag.id = "petCharStyleV36";
      styleTag.textContent = `
        @keyframes petFloatV36 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes petRingV36 { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.36); opacity: 0; } }
        #petCharOrb {
          width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid ${p.accent};
          font-size: 27px; display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          animation: petFloatV36 2.7s ease-in-out infinite;
        }
        #petListenRing {
          display: none; position: absolute; inset: -6px; border-radius: 50%;
          border: 2.5px solid #00e676; pointer-events: none; animation: petRingV36 1.1s infinite;
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
      root.innerHTML = `<div id="petMiniBubble"></div><div style="position:relative;"><div id="petListenRing"></div><div id="petCharOrb" role="button" aria-label="المرافق الصوتي">${p.icon}</div></div>`;
      document.body.appendChild(root);
      bindOrbInteractions($("petCharOrb"), root);
    }

    syncVisuals();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountV36(); };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncVisuals, 60); };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV36);
  else mountV36();
})();

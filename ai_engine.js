// ============================================================================
// محرك الشخصية القابلة للسحب والنقر المطوّل للصوت والإجابة الصوتية (v34)
// - بدون لوحة عائمة مزعجة وبدون أي تدخل للذكاء الاصطناعي في الدفع
// - نقر مطوّل: بدء الاستماع للطلب أو الاستفسار ثم الإجابة الصوتية
// - سحب: تحريك الشخصية لأي مكان وحفظ موقعها
// - نقرة سريعة: تبديل الشخصية (ودود / سريع / توفير) أو وضع الصوت
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v34_prefs";
  const POS_KEY = "moaath_pet_v34_pos";
  const CACHE_KEY = "moaath_pet_v34_cache";
  const CACHE_TTL = 2 * 60 * 60 * 1000;

  const PERSONAS = {
    buddy: { id: "buddy", name: "بندق الودود", icon: "🐱", accent: "#00b0ff", styleHint: "لهجة محلية ودودة ومرحّة وقصيرة جداً." },
    pro: { id: "pro", name: "صقر السريع", icon: "🦅", accent: "#00e676", styleHint: "أسلوب عملي ومباشر وسريع في الكميات والأسعار." },
    saver: { id: "saver", name: "ثعلب التوفير", icon: "🦊", accent: "#D4AF37", styleHint: "يركّز على التوفير والطرود والميزانية." }
  };

  let sessionContext = { lastItems: [] };
  let activeRecognizer = null;
  let isListeningHold = false;
  let toastBubbleTimer = null;
  let scrollDimTimer = null;

  // إبقاء الدفع خارج نطاق الذكاء الاصطناعي بالكامل
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
      if (ks.length > 35) delete c[ks[0]];
      c[key] = { t: Date.now(), v };
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch (_) {}
  }

  function speakAnswer(text) {
    const prefs = getPrefs();
    if (!prefs.voiceEnabled || !text) return;
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text));
      utter.lang = "ar-SA";
      utter.rate = 1.03;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  function showMiniBubble(text, durationMs = 4500) {
    const bubble = $("petMiniBubble");
    if (!bubble || !text) return;
    bubble.textContent = text;
    bubble.style.display = "block";
    clearTimeout(toastBubbleTimer);
    if (durationMs > 0) {
      toastBubbleTimer = setTimeout(() => {
        bubble.style.display = "none";
      }, durationMs);
    }
  }

  function setCharacterState(state = "idle", bubbleText = "") {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const orb = $("petCharOrb");
    const ring = $("petListenRing");
    if (!orb) return;

    const faces = { idle: p.icon, listening: "🎙️", thinking: "🤔", speaking: "🗣️", happy: "🤩" };
    orb.textContent = faces[state] || p.icon;
    orb.style.borderColor = state === "listening" ? "#00e676" : p.accent;
    if (ring) ring.style.display = state === "listening" ? "block" : "none";
    if (bubbleText) showMiniBubble(bubbleText, state === "listening" ? 0 : 4800);
  }

  function syncCharacterVisuals() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const pos = getPos();
    const isLight = document.body.classList.contains("light-mode");
    const root = $("petCharRoot");
    const orb = $("petCharOrb");
    const showBtn = $("petShowCharBtn");

    if (root) {
      root.style.display = prefs.hidden ? "none" : "block";
      root.style.right = pos.right + "px";
      root.style.bottom = pos.bottom + "px";
    }
    if (showBtn) showBtn.style.display = prefs.hidden ? "inline-flex" : "none";
    if (orb) {
      orb.textContent = p.icon;
      orb.style.borderColor = p.accent;
      orb.style.background = isLight
        ? "radial-gradient(circle at 30% 25%, #ffffff, #e6ebf2 72%)"
        : "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32), var(--card-bg) 65%)";
      orb.style.boxShadow = isLight
        ? `0 8px 18px rgba(0,0,0,0.18), 0 0 12px ${p.accent}44`
        : `0 10px 22px rgba(0,0,0,0.45), 0 0 14px ${p.accent}55`;
    }
  }

  window.setPetHiddenState = function (hide) {
    setPrefs({ hidden: !!hide });
    syncCharacterVisuals();
  };

  function cyclePersonaOnQuickTap() {
    haptic(12);
    const prefs = getPrefs();
    const order = ["buddy", "pro", "saver"];
    const nextKey = order[(order.indexOf(prefs.persona) + 1) % order.length];
    const nextVoice = nextKey === "buddy" ? !prefs.voiceEnabled : prefs.voiceEnabled;
    setPrefs({ persona: nextKey, voiceEnabled: nextVoice });
    syncCharacterVisuals();
    const p = PERSONAS[nextKey];
    const vStatus = nextVoice ? "الصوت مفعّل" : "الصوت مكتوم";
    showMiniBubble(`${p.icon} ${p.name} (${vStatus}) — اضغط مطوّلاً وتحدث`, 3500);
  }

  function answerLiveStoreQuery(normText) {
    if (/مفتوح|دوام|اوقات|ساعات|مسكر|يفتح/.test(normText)) {
      const openNow = typeof isGlobalStoreOpenNow === "function" ? isGlobalStoreOpenNow() : true;
      const wh = workHoursSettings || {};
      const hours = wh.enabled ? `من ${wh.open || "08:00"} إلى ${wh.close || "23:00"}` : "متاح للطلب حالياً";
      return openNow
        ? `نعم، المتجر مفتوح الآن في ${getBranchName(activeBranchId)}، الدوام ${hours}.`
        : `المتجر مغلق حالياً، مواعيد الدوام ${hours}.`;
    }
    return null;
  }

  function localMatchFallback(promptTxt) {
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();
    const tokens = norm.split(/[^a-z0-9\u0600-\u06FF]+/).filter(w => w.length >= 2);
    const found = [];
    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p) return;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      if (st <= 0) return;
      const pNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      if (tokens.some(t => pNorm.includes(t))) {
        let qty = 1;
        if (/كيلوين|2\s*كيلو|اثنين/.test(norm)) qty = Math.min(2, st);
        found.push({ id: pid, name: p.name, qty });
      }
    });
    return found.slice(0, 5);
  }

  function buildRelevantCatalog(promptTxt) {
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();
    const words = norm.split(/[^a-z0-9\u0600-\u06FF]+/).filter(w => w.length >= 2);
    return Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const pNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
        const cNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.category || "") : (p.category || "")).toLowerCase();
        let score = st > 0 ? 2 : 0;
        words.forEach(w => { if (pNorm.includes(w)) score += 12; else if (cNorm.includes(w)) score += 5; });
        return { id: pid, name: p.name || "", category: p.category || "", stock: st, priceSYP: getUnitSYP(pid), unit: p.unitType || "قطعة", _score: score };
      })
      .filter(Boolean).sort((a, b) => b._score - a._score).slice(0, 60).map(({ _score, ...x }) => x);
  }

  // معالجة الطلب أو الاستفسار مع إجابة صوتية فورية
  window.runAIShoppingAssistant = async function (overridePrompt = null, speakOut = false) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    if (!promptTxt) {
      const msg = "اضغط مطوّلاً على الشخصية وتحدّث بطلبك أو سؤالك.";
      setCharacterState("idle", msg);
      if (speakOut) speakAnswer(msg);
      return;
    }

    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    const liveAns = answerLiveStoreQuery(norm);
    if (liveAns) {
      setCharacterState("speaking", liveAns);
      setTxt("aiShoppingStatusText", `💡 ${liveAns}`);
      if (speakOut) speakAnswer(liveAns);
      return;
    }

    const sendBtn = $("aiShoppingSendBtn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "⏳..."; }
    setCharacterState("thinking", "جاري التجهيز...");
    setTxt("aiShoppingStatusText", "🤖 جاري مطابقة طلبك...");

    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";

    try {
      if (navigator.onLine === false || !workerUrl) throw new Error("FALLBACK");
      const cacheKey = `${prefs.persona}::${activeBranchId}::${norm}`;
      let data = getCache(cacheKey);

      if (!data) {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "companion_shop",
            prompt: promptTxt,
            catalog: buildRelevantCatalog(promptTxt),
            currentCart: Object.values(cart || {}).map(c => ({ id: c.id, name: c.name, qty: c.qty })),
            storeMeta: {
              personaStyle: persona.styleHint,
              sessionLastItems: sessionContext.lastItems.slice(0, 5),
              branchName: typeof getBranchName === "function" ? getBranchName(activeBranchId) : "الرئيسي"
            }
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error("FALLBACK");
        data = json.data || {};
        setCache(cacheKey, data);
      }

      const items = Array.isArray(data.items) ? data.items : [];
      let addedUnits = 0;
      const addedNames = [];

      items.forEach(it => {
        const pid = String(it?.id || "").trim();
        const baseId = pid.replace(/_PKG$/, "");
        const pObj = products?.[baseId] || specialOffers?.[pid];
        if (!pObj) return;
        const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : (parseInt(pObj.stock) || 0);
        if (avail <= 0) return;
        const qty = Math.min(Math.max(1, parseInt(it?.qty) || 1), avail);
        const cur = cart[pid] ? (parseInt(cart[pid].qty) || 0) : 0;
        const canAdd = Math.max(0, avail - cur);
        const addNow = Math.min(qty, canAdd);
        if (addNow > 0) {
          changeQty(pid, addNow);
          addedUnits += addNow;
          addedNames.push(pObj.name);
        }
      });

      if (addedNames.length) sessionContext.lastItems = addedNames.map(n => ({ name: n }));
      if (addedUnits > 0) haptic([15, 35, 15]);

      const spokenReply = data.reply || data.answerNote || (addedUnits > 0 ? `تمت إضافة ${addedNames.join(" و")} إلى سلتك.` : "تفضّل، كيف أقدر أساعدك؟");
      setCharacterState(addedUnits > 0 ? "happy" : "speaking", spokenReply);
      setTxt("aiShoppingStatusText", `🐾 ${spokenReply}`);
      if (speakOut) speakAnswer(spokenReply);
    } catch (_) {
      const fb = localMatchFallback(promptTxt);
      let addedFb = 0;
      const fbNames = [];
      fb.forEach(f => {
        const cur = cart[f.id] ? (parseInt(cart[f.id].qty) || 0) : 0;
        const maxSt = typeof getProductStockForBranch === "function" ? getProductStockForBranch(products[f.id], activeBranchId) : 99;
        const addN = Math.min(f.qty, Math.max(0, maxSt - cur));
        if (addN > 0) { changeQty(f.id, addN); addedFb += addN; fbNames.push(f.name); }
      });
      const fbMsg = addedFb > 0 ? `أضفت ${fbNames.join(" و")} إلى سلتك.` : "لم أجد صنفاً مطابقاً متوفراً الآن.";
      setCharacterState("speaking", fbMsg);
      setTxt("aiShoppingStatusText", `🐾 ${fbMsg}`);
      if (speakOut) speakAnswer(fbMsg);
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "✨ تعبئة"; }
    }
  };

  // بدء الاستماع عند النقر المطوّل على الشخصية
  function beginLongPressVoiceListen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      const msg = "المتصفح لا يدعم الاستماع الصوتي، اكتب طلبك في الخانة.";
      showMiniBubble(msg, 4000);
      return;
    }

    if (activeRecognizer) {
      try { activeRecognizer.stop(); } catch (_) {}
      activeRecognizer = null;
    }

    isListeningHold = true;
    haptic(25);
    setCharacterState("listening", "تحدّث الآن... اترك إصبعك عند الانتهاء");

    const rec = new SR();
    activeRecognizer = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = ev => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) {
        setCharacterState("idle", "لم أسمع كلاماً واضحاً، جرّب النقر المطوّل مرة أخرى.");
        return;
      }
      setVal("aiShoppingPromptInput", heard);
      window.runAIShoppingAssistant(heard, true);
    };

    rec.onerror = () => {
      setCharacterState("idle", "تعذر التقاط الصوت، تأكد من إذن الميكروفون.");
    };

    rec.onend = () => {
      isListeningHold = false;
      activeRecognizer = null;
      const ring = $("petListenRing");
      if (ring) ring.style.display = "none";
    };

    rec.start();
  }

  function finishLongPressVoiceListen() {
    if (!isListeningHold) return;
    isListeningHold = false;
    if (activeRecognizer) {
      setTimeout(() => {
        try { activeRecognizer && activeRecognizer.stop(); } catch (_) {}
      }, 350);
    }
  }

  window.startVoiceShoppingInput = function () {
    beginLongPressVoiceListen();
    setTimeout(finishLongPressVoiceListen, 4500);
  };

  // ربط السحب الحر + النقر المطوّل للتحدث + النقرة السريعة
  function bindCharacterGestures(orb, root) {
    if (!orb || !root || orb.dataset.v34Bound) return;
    orb.dataset.v34Bound = "1";

    let pointerDown = false;
    let isDragging = false;
    let longPressTriggered = false;
    let longPressTimer = null;
    let startX = 0, startY = 0;
    let initRight = 14, initBottom = 88;

    const down = e => {
      if (e.cancelable && e.type === "touchstart") {
        // نترك التمرير أو السحب يعمل دون قائمة المتصفح
      }
      const pt = e.touches ? e.touches[0] : e;
      pointerDown = true;
      isDragging = false;
      longPressTriggered = false;
      startX = pt.clientX;
      startY = pt.clientY;
      initRight = parseInt(root.style.right || "14", 10);
      initBottom = parseInt(root.style.bottom || "88", 10);
      orb.style.transform = "scale(1.06)";

      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        if (pointerDown && !isDragging) {
          longPressTriggered = true;
          beginLongPressVoiceListen();
        }
      }, 400);
    };

    const move = e => {
      if (!pointerDown) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;

      if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        isDragging = true;
        clearTimeout(longPressTimer);
        if (longPressTriggered) finishLongPressVoiceListen();
      }

      if (isDragging) {
        const maxR = Math.max(8, window.innerWidth - 68);
        const maxB = Math.max(84, window.innerHeight - 96);
        const nr = Math.max(8, Math.min(maxR, initRight - dx));
        const nb = Math.max(84, Math.min(maxB, initBottom - dy));
        root.style.right = nr + "px";
        root.style.bottom = nb + "px";
      }
    };

    const up = () => {
      if (!pointerDown) return;
      pointerDown = false;
      clearTimeout(longPressTimer);
      orb.style.transform = "";

      if (longPressTriggered) {
        finishLongPressVoiceListen();
        return;
      }

      if (isDragging) {
        isDragging = false;
        const curR = parseInt(root.style.right || "14", 10);
        const curB = parseInt(root.style.bottom || "88", 10);
        const centerFromLeft = window.innerWidth - curR - 27;
        const snapR = centerFromLeft >= window.innerWidth / 2 ? 12 : Math.max(12, window.innerWidth - 68);
        root.style.transition = "right 0.2s ease, bottom 0.2s ease";
        root.style.right = snapR + "px";
        setTimeout(() => { root.style.transition = ""; }, 220);
        savePos(snapR, curB);
        haptic(10);
        return;
      }

      // نقرة سريعة واحدة
      cyclePersonaOnQuickTap();
    };

    orb.addEventListener("contextmenu", e => e.preventDefault());
    orb.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    orb.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    window.addEventListener("scroll", () => {
      if (isListeningHold) return;
      root.style.opacity = "0.42";
      clearTimeout(scrollDimTimer);
      scrollDimTimer = setTimeout(() => { root.style.opacity = "1"; }, 550);
    }, { passive: true });
  }

  // توصيات مصورة داخل السلة
  window.renderSmartCartRecommendations = function () {
    const box = $("aiCartRecommendationsBox");
    if (!box) return;
    const keys = Object.keys(cart || {});
    if (!keys.length) { box.style.display = "none"; box.innerHTML = ""; return; }

    const inCart = new Set(keys.map(k => cart[k]?.origId || String(k).replace(/_PKG$/, "")));
    const cats = new Set(keys.map(k => cart[k]?.category).filter(Boolean));
    const co = {};
    Object.values(completedOrdersHistory || {}).forEach(ord => {
      const ids = Array.from(new Set((ord?.items || []).filter(i => !String(i.id || "").startsWith("OFFER_")).map(i => i.origId || String(i.id || "").replace(/_PKG$/, ""))));
      if (ids.some(id => inCart.has(id))) ids.forEach(id => { if (!inCart.has(id)) co[id] = (co[id] || 0) + 1; });
    });

    const picks = Object.keys(products || {})
      .filter(pid => !inCart.has(pid) && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .map(pid => ({ pid, p: products[pid], s: (co[pid] || 0) * 5 + (cats.has(products[pid].category) ? 2 : 0) }))
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 4);

    if (!picks.length) { box.style.display = "none"; box.innerHTML = ""; return; }
    box.style.display = "block";
    box.innerHTML = `<div style="background:rgba(0,176,255,0.06); border:1px dashed #00b0ff; border-radius:8px; padding:7px;"><div style="font-size:11px; font-weight:bold; color:#00b0ff; margin-bottom:6px;">مقترحات مصورة تكمل سلتك:</div><div style="display:flex; gap:6px; overflow-x:auto;">` +
      picks.map(({ pid, p }) => `<div style="min-width:112px; background:var(--bg-color); border:1px solid var(--gold-color); border-radius:7px; padding:6px; text-align:center;"><img src="${esc(getThumb(pid))}" onerror="this.src='store-icon.png'" style="width:46px; height:46px; border-radius:6px; object-fit:cover; margin:0 auto 4px auto; display:block;"><div style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(p.name)}</div><div style="font-size:10px; color:var(--success-color); font-weight:bold; margin:2px 0;">${getUnitSYP(pid).toLocaleString()} ل.س</div><button type="button" onclick="changeQty('${pid}', 1)" class="btn" style="padding:3px 6px; font-size:10px;">➕ أضف</button></div>`).join("") +
      `</div></div>`;
  };

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

  function mountCharacterOnly() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;

    // زر صغير لإعادة إظهار الشخصية إذا تم إخفاؤها
    const assistBox = $("aiSmartAssistantBox");
    if (assistBox && !$("petShowCharBtn")) {
      const btn = document.createElement("button");
      btn.id = "petShowCharBtn";
      btn.type = "button";
      btn.onclick = () => window.setPetHiddenState(false);
      btn.style.cssText = "display:none; align-items:center; gap:4px; margin-top:6px; background:var(--card-bg); color:var(--gold-color); border:1px solid var(--gold-color); border-radius:12px; padding:3px 9px; font-size:10px; font-weight:bold; cursor:pointer;";
      btn.textContent = `${p.icon} إظهار المرافق`;
      assistBox.appendChild(btn);
    }

    // الشخصية القابلة للسحب فقط بدون أي لوحة عائمة
    if (!$("petCharRoot")) {
      const styleEl = document.createElement("style");
      styleEl.id = "petCharStyleV34";
      styleEl.textContent = `
        @keyframes petCharIdle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes petRingPulse { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.35); opacity: 0; } }
        #petCharOrb {
          width: 54px; height: 54px; border-radius: 50%;
          border: 2px solid ${p.accent};
          font-size: 26px; display: flex; align-items: center; justify-content: center;
          cursor: grab; -webkit-touch-callout: none; user-select: none;
          animation: petCharIdle 2.8s ease-in-out infinite;
        }
        #petListenRing {
          display: none; position: absolute; inset: -5px; border-radius: 50%;
          border: 2px solid #00e676; pointer-events: none;
          animation: petRingPulse 1.1s infinite;
        }
        #petMiniBubble {
          display: none; position: absolute; bottom: 64px; right: 0;
          max-width: 220px; width: max-content;
          background: var(--card-bg); color: var(--text-color);
          border: 1px solid var(--gold-color); border-radius: 10px;
          padding: 6px 9px; font-size: 11px; line-height: 1.4;
          box-shadow: 0 8px 20px rgba(0,0,0,0.45); pointer-events: none;
        }
      `;
      document.head.appendChild(styleEl);

      const root = document.createElement("div");
      root.id = "petCharRoot";
      root.style.cssText = "position:fixed; bottom:88px; right:14px; z-index:98; transition:opacity 0.2s ease;";
      root.innerHTML = `
        <div id="petMiniBubble"></div>
        <div style="position:relative;">
          <div id="petListenRing"></div>
          <div id="petCharOrb" role="button" aria-label="المرافق الصوتي">${p.icon}</div>
        </div>`;
      document.body.appendChild(root);
      bindCharacterGestures($("petCharOrb"), root);

      if (!localStorage.getItem("moaath_pet_v34_hint_shown")) {
        localStorage.setItem("moaath_pet_v34_hint_shown", "1");
        showMiniBubble("اضغط مطوّلاً وتحدث 🎤", 4000);
      }
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

    syncCharacterVisuals();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () { if (typeof _origRenderStore === "function") _origRenderStore(); mountCharacterOnly(); };

  const _origToggleTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origToggleTheme === "function") _origToggleTheme(); setTimeout(syncCharacterVisuals, 60); };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountCharacterOnly);
  else mountCharacterOnly();
})();

// ============================================================================
// محرك المرافق المخصص ثلاثي الأبعاد لمتجر معاذ (v32 - Complete UX Companion)
// - بدون أي تدخل للذكاء الاصطناعي في الدفع أو فحص الإشعارات
// - يدمج: 3D Orb + Smart Pill + تعابير بصرية + ذاكرة جلسة + ميزانية + وصفات
//   + صوت بتحكم كامل + إجابات حية + تكيّف مع الوقت + بديل محلي فوري
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v32_prefs";
  const CACHE_KEY = "moaath_pet_v32_cache";
  const CACHE_TTL = 2 * 60 * 60 * 1000;

  const PERSONAS = {
    buddy: {
      id: "buddy",
      name: "بندق الودود",
      baseIcon: "🐱",
      accent: "#00b0ff",
      styleHint: "لهجة محلية ودودة ومرحّة وقصيرة، كصديق قريب من الزبون."
    },
    pro: {
      id: "pro",
      name: "صقر السريع",
      baseIcon: "🦅",
      accent: "#00e676",
      styleHint: "أسلوب عملي ومباشر وسريع في الكميات والأسعار دون إطالة."
    },
    saver: {
      id: "saver",
      name: "ثعلب التوفير",
      baseIcon: "🦊",
      accent: "#D4AF37",
      styleHint: "يركّز على التوفير، الطرود، العروض، وتوزيع الميزانية بذكاء."
    }
  };

  let sessionContext = {
    lastPrompt: "",
    lastItems: [],
    lastBudget: null
  };
  let pendingVoiceText = "";
  let activeRecognition = null;

  // ضمان عدم استخدام الذكاء الاصطناعي في الدفع
  window.analyzeShamCashReceiptOCR = function () {
    const outBox = $("shamCashOcrResult");
    if (outBox) outBox.innerHTML = "";
  };

  function getPrefs() {
    try {
      const d = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return {
        persona: PERSONAS[d.persona] ? d.persona : "buddy",
        hidden: !!d.hidden,
        collapsed: d.collapsed === undefined ? true : !!d.collapsed,
        voiceMode: ["on_demand", "auto", "muted"].includes(d.voiceMode) ? d.voiceMode : "on_demand"
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, collapsed: true, voiceMode: "on_demand" };
    }
  }

  function setPrefs(patch) {
    const next = { ...getPrefs(), ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
  }

  function getThumb(id) {
    const baseId = String(id || "").replace(/_PKG$/, "");
    const p = products?.[baseId] || specialOffers?.[id] || {};
    if (String(id || "").endsWith("_PKG") && (p.pkgThumb || p.pkgImage)) {
      return p.pkgThumb || p.pkgImage;
    }
    return (typeof getLockedHighResImage === "function" && getLockedHighResImage(baseId)) || p.thumb || p.image || "store-icon.png";
  }

  function getUnitSYP(id) {
    const isW = currentUser?.userType === "wholesale";
    if (String(id || "").startsWith("OFFER_")) {
      const so = specialOffers?.[id];
      if (!so) return 0;
      const usd = (isW && so.wholesaleUSD > 0) ? so.wholesaleUSD : (so.newPriceUSD || 0);
      return calcSYP(usd);
    }
    if (String(id || "").endsWith("_PKG")) {
      const p = products?.[String(id).replace(/_PKG$/, "")];
      return p ? calcSYP(p.pkgPriceUSD || 0) : 0;
    }
    const p = products?.[id];
    if (!p) return 0;
    return calcSYP((isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0));
  }

  function getTimeOfDayGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return { period: "morning", label: "الصباح", tip: "تناسبه الفطور والمشروبات الساخنة والأساسيات" };
    if (h >= 12 && h < 17) return { period: "afternoon", label: "الظهيرة", tip: "تناسبه مستلزمات الطبخ والغداء السريع" };
    return { period: "evening", label: "المساء", tip: "تناسبه المتة والسهرة والموالح والمشروبات" };
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

  // [تعابير الشخصية البصرية + الحالة المصغّرة القابلة للطي]
  function setMoodExpression(mood = "happy", text = "", extraHtml = "", pillHint = "") {
    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const moodMap = {
      happy: persona.baseIcon,
      excited: "🤩",
      thinking: "🤔",
      listening: "🎧",
      helpful: "💡"
    };
    const face = moodMap[mood] || persona.baseIcon;
    setTxt("pet3DOrbBtn", face);
    setTxt("petInlineFace", face);
    setTxt("petPillFace", face);
    if (text) {
      setTxt("petInlineBubble", text);
      setTxt("petDrawerBubble", text);
      if (pillHint) setTxt("petPillText", pillHint);
    }
    const ex = $("petDrawerExtra");
    if (ex) ex.innerHTML = extraHtml;
  }

  function speakText(txt, force = false) {
    const prefs = getPrefs();
    if (prefs.voiceMode === "muted" && !force) return;
    if (prefs.voiceMode === "on_demand" && !force) return;
    try {
      if (!("speechSynthesis" in window) || !txt) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = "ar-SA";
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  window.cycleVoiceMode = function () {
    const prefs = getPrefs();
    const order = ["on_demand", "auto", "muted"];
    const nextMode = order[(order.indexOf(prefs.voiceMode) + 1) % order.length];
    setPrefs({ voiceMode: nextMode });
    syncPetChrome();
    const labels = { on_demand: "النطق عند الضغط على 🔊", auto: "النطق التلقائي مفعّل", muted: "الصوت مكتوم" };
    showToast(`🔈 ${labels[nextMode]}`);
  };

  window.selectPetPersona = function (key) {
    if (!PERSONAS[key]) return;
    setPrefs({ persona: key });
    syncPetChrome();
    setMoodExpression("happy", `أهلاً بك مع (${PERSONAS[key].name})! كيف أخدمك الآن؟`);
  };

  window.togglePetCollapsed = function (collapseToPill = null) {
    const prefs = getPrefs();
    const next = typeof collapseToPill === "boolean" ? collapseToPill : !prefs.collapsed;
    setPrefs({ collapsed: next, hidden: false });
    syncPetChrome();
  };

  window.togglePetHidden = function (hide) {
    setPrefs({ hidden: !!hide, collapsed: true });
    syncPetChrome();
  };

  function syncPetChrome() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const root = $("pet3DFloatingRoot");
    const pill = $("petSmartPillBtn");
    const drawer = $("pet3DDrawerPanel");
    const orbWrap = $("pet3DOrbWrap");
    const orb = $("pet3DOrbBtn");
    const restoreBtn = $("petRestoreHiddenBtn");
    const vBtn = $("petVoiceModeBtn");

    if (root) root.style.display = prefs.hidden ? "none" : "block";
    if (restoreBtn) restoreBtn.style.display = prefs.hidden ? "inline-flex" : "none";
    if (pill) pill.style.display = (!prefs.hidden && prefs.collapsed) ? "inline-flex" : "none";
    if (orbWrap) orbWrap.style.display = (!prefs.hidden && !prefs.collapsed) ? "flex" : "none";
    if (drawer) drawer.style.display = (!prefs.hidden && !prefs.collapsed) ? "block" : "none";

    if (orb) {
      orb.style.borderColor = p.accent;
      orb.style.boxShadow = `0 10px 22px rgba(0,0,0,0.45), 0 0 14px ${p.accent}55, inset 0 2px 5px rgba(255,255,255,0.4)`;
    }
    setTxt("petActiveName", p.name);
    if (vBtn) {
      const icons = { on_demand: "🔊 عند الطلب", auto: "🗣️ تلقائي", muted: "🔇 مكتوم" };
      vBtn.textContent = icons[prefs.voiceMode] || "🔊";
    }
    document.querySelectorAll(".pet-persona-btn").forEach(btn => {
      const active = btn.dataset.persona === prefs.persona;
      btn.classList.toggle("active", active);
    });
  }

  // [إجابات فورية من بيانات المتجر الحية]
  function answerLiveStoreQuestion(qNorm) {
    if (/مفتوح|دوام|اوقات|ساعات|مسكر|يفتح/.test(qNorm)) {
      const openNow = typeof isGlobalStoreOpenNow === "function" ? isGlobalStoreOpenNow() : true;
      const wh = workHoursSettings || {};
      const hoursTxt = wh.enabled ? `مواعيد الدوام من ${wh.open || "08:00"} إلى ${wh.close || "23:00"}` : "المتجر متاح للطلب حالياً";
      return openNow
        ? `نعم، المتجر مفتوح الآن وفرع (${getBranchName(activeBranchId)}) جاهز لاستقبال طلبك! ${hoursTxt}.`
        : `المتجر مغلق حالياً، ${hoursTxt}.`;
    }
    return null;
  }

  // [خطة بديلة محلية فورية عند الضغط أو بطء الشبكة]
  function localFallbackMatch(promptTxt) {
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();
    const tokens = norm.split(/[^a-z0-9\u0600-\u06FF]+/).filter(w => w.length >= 2);
    const matches = [];

    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p) return;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      if (st <= 0) return;
      const pNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      if (tokens.some(t => pNorm.includes(t))) {
        let qty = 1;
        if (/كيلوين|2\s*كيلو|اثنين/.test(norm)) qty = Math.min(2, st);
        else if (/3\s*كيلو|ثلاث/.test(norm)) qty = Math.min(3, st);
        matches.push({
          id: pid,
          name: p.name,
          qty,
          unitPrice: getUnitSYP(pid),
          lineTotal: getUnitSYP(pid) * qty,
          thumb: getThumb(pid),
          reason: "مطابقة سريعة من مخزون الفرع"
        });
      }
    });
    return matches.slice(0, 5);
  }

  function buildCatalogSubset(promptTxt) {
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
        words.forEach(w => {
          if (pNorm.includes(w)) score += 12;
          else if (cNorm.includes(w)) score += 5;
        });
        return {
          id: pid,
          name: p.name || "",
          category: p.category || "",
          stock: st,
          priceSYP: getUnitSYP(pid),
          unit: p.unitType || "قطعة",
          _score: score
        };
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score)
      .slice(0, 60)
      .map(({ _score, ...x }) => x);
  }

  // [تعبئة الميزانية الذكية مباشرة من الأصناف المتوفرة]
  window.runSmartBudgetBasket = function (budgetAmount) {
    const budget = Math.max(50, parseInt(budgetAmount) || 0);
    sessionContext.lastBudget = budget;
    const availList = Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const price = getUnitSYP(pid);
        if (st <= 0 || price <= 0 || price > budget) return null;
        return { pid, name: p.name, price, maxQty: st, thumb: getThumb(pid) };
      })
      .filter(Boolean)
      .sort((a, b) => a.price - b.price);

    let running = 0;
    const picked = [];
    for (const item of availList) {
      if (running + item.price <= budget && picked.length < 5) {
        picked.push({
          id: item.pid,
          name: item.name,
          qty: 1,
          unitPrice: item.price,
          lineTotal: item.price,
          thumb: item.thumb,
          reason: `ضمن ميزانية ${budget.toLocaleString()} ل.س`
        });
        running += item.price;
      }
    }

    if (!picked.length) {
      setMoodExpression("helpful", `بميزانية ${budget.toLocaleString()} ل.س، جرّب تصفح الأصناف الاقتصادية أو زيادة المبلغ قليلاً.`);
      return;
    }
    sessionContext.lastItems = picked;
    renderInteractiveProposalCard(picked, `سلة مقترحة ضمن ميزانية ${budget.toLocaleString()} ل.س (المجموع: ${running.toLocaleString()} ل.س):`);
    setMoodExpression("excited", `رتبتلك سلة بـ ${running.toLocaleString()} ل.س من أصل ${budget.toLocaleString()} ل.س! عدّل اللي بدك إياه قبل الإضافة.`);
  };

  function renderInteractiveProposalCard(items, headingText) {
    window._petProposalItems = items;
    const rows = items.map((it, i) => `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:5px 7px; margin-bottom:4px;">
        <label style="display:flex; align-items:center; gap:6px; flex:1; margin:0; cursor:pointer;">
          <input type="checkbox" class="pet-prop-cb" data-idx="${i}" checked style="width:15px; height:15px;">
          <img src="${esc(it.thumb)}" onerror="this.src='store-icon.png'" style="width:32px; height:32px; border-radius:5px; object-fit:cover;">
          <div style="text-align:right;">
            <div style="font-size:11px; font-weight:bold;">${esc(it.name)}</div>
            <div style="font-size:10px; color:var(--gray-text);">${it.qty} × ${it.unitPrice.toLocaleString()} = <b style="color:var(--gold-color);">${it.lineTotal.toLocaleString()} ل.س</b></div>
            <div style="font-size:9px; color:#00b0ff;">سبب الاقتراح: ${esc(it.reason || "متوفر ومناسب لطلبك")}</div>
          </div>
        </label>
      </div>
    `).join("");

    const html = `
      <div style="background:rgba(212,175,55,0.08); border:1px solid var(--gold-color); border-radius:8px; padding:7px; margin-top:6px;">
        <div style="font-size:11px; font-weight:bold; color:var(--gold-color); margin-bottom:5px;">${esc(headingText)}</div>
        ${rows}
        <button type="button" onclick="applyPetProposalToCart()" class="btn" style="margin-top:5px; padding:6px; font-size:11px; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">✅ إضافة العناصر المحددة للسلة</button>
      </div>`;

    const ex = $("petDrawerExtra");
    if (ex) ex.innerHTML = html;
    const inlineEx = $("petInlineProposalBox");
    if (inlineEx) inlineEx.innerHTML = html;
  }

  window.applyPetProposalToCart = function () {
    const items = window._petProposalItems || [];
    const cbs = document.querySelectorAll(".pet-prop-cb");
    let added = 0;
    cbs.forEach(cb => {
      if (!cb.checked) return;
      const it = items[parseInt(cb.getAttribute("data-idx"))];
      if (!it) return;
      changeQty(it.id, it.qty);
      added++;
    });
    if (added > 0) {
      showToast(`🐾 تمت إضافة ${added} أصناف إلى السلة!`);
      setMoodExpression("excited", "تمت الإضافة بنجاح! بدك نكمل ولا نروح للسلة؟");
    }
  };

  // [المعالج الرئيسي للطلبات والأسئلة والوصفات والذاكرة السياقية]
  window.runAIShoppingAssistant = async function (overridePrompt = null, fromVoice = false) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    if (!promptTxt) {
      setMoodExpression("curious", "اكتب طلبك أو اسألني، أو اختر ميزانية أو وصفة جاهزة.");
      return;
    }

    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    // إجابة فورية للأسئلة الحية عن الدوام
    const liveAns = answerLiveStoreQuestion(norm);
    if (liveAns) {
      setMoodExpression("helpful", liveAns, "", liveAns.slice(0, 36));
      setTxt("aiShoppingStatusText", `💡 ${liveAns}`);
      speakText(liveAns);
      return;
    }

    // ميزانية مباشرة إذا ذكر رقماً مع كلمة ميزانية أو معي
    const budgetMatch = norm.match(/(?:ميزاني|معي|بـ|ب)\s*(\d{2,7})/);
    if (budgetMatch && /ميزاني|معي|اساسي|سله/.test(norm)) {
      window.runSmartBudgetBasket(parseInt(budgetMatch[1]));
      return;
    }

    const sendBtn = $("aiShoppingSendBtn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "⏳..."; }
    setMoodExpression("thinking", "عم فتش الرفوف وأرتبلك الأنسب...", "", "جاري التفكير...");
    setTxt("aiShoppingStatusText", "🤖 جاري التحليل...");

    const timeInfo = getTimeOfDayGreeting();
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";

    try {
      if (navigator.onLine === false || !workerUrl) {
        throw new Error("OFFLINE_OR_NO_WORKER");
      }

      const cacheKey = `${prefs.persona}::${activeBranchId}::${norm}::${JSON.stringify(sessionContext.lastItems.map(x => x.id))}`;
      let data = getCache(cacheKey);

      if (!data) {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "companion_shop",
            prompt: promptTxt,
            catalog: buildCatalogSubset(promptTxt),
            currentCart: Object.values(cart || {}).map(c => ({ id: c.id, name: c.name, qty: c.qty })),
            storeMeta: {
              personaStyle: persona.styleHint,
              timePeriod: timeInfo,
              sessionLastItems: sessionContext.lastItems.slice(0, 5),
              branchName: typeof getBranchName === "function" ? getBranchName(activeBranchId) : "الرئيسي"
            }
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "BUSY");
        data = json.data || {};
        setCache(cacheKey, data);
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const mapped = rawItems.map(it => {
        const pid = String(it?.id || "").trim();
        const baseId = pid.replace(/_PKG$/, "");
        const pObj = products?.[baseId] || specialOffers?.[pid];
        if (!pObj) return null;
        const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : (parseInt(pObj.stock) || 0);
        if (avail <= 0) return null;
        const qty = Math.min(Math.max(1, parseInt(it?.qty) || 1), avail);
        const unitPrice = getUnitSYP(pid);
        return {
          id: pid,
          name: pid.endsWith("_PKG") ? `طرد ${pObj.name}` : pObj.name,
          qty,
          unitPrice,
          lineTotal: unitPrice * qty,
          thumb: getThumb(pid),
          reason: it?.reason || "متوفر ومطابق لطلبك"
        };
      }).filter(Boolean);

      const isRecipeOrBundle = /وصف|طبخه|سهره|مته|فطور|مناسب/.test(norm) || fromVoice;
      let extraHtml = "";

      if (mapped.length > 0 && isRecipeOrBundle) {
        sessionContext.lastItems = mapped;
        renderInteractiveProposalCard(mapped, "اختر المواد التي تريد إضافتها للسلة (يمكنك إلغاء أي مادة متوفرة لديك):");
      } else if (mapped.length > 0) {
        sessionContext.lastItems = mapped;
        let added = 0;
        mapped.forEach(m => {
          const cur = cart[m.id] ? (parseInt(cart[m.id].qty) || 0) : 0;
          const maxSt = typeof getProductStockForBranch === "function"
            ? getProductStockForBranch(products[m.id.replace(/_PKG$/, "")] || specialOffers[m.id] || {}, activeBranchId)
            : 99;
          const canAdd = Math.max(0, maxSt - cur);
          const toAdd = Math.min(m.qty, canAdd);
          if (toAdd > 0) { changeQty(m.id, toAdd); added += toAdd; }
        });
        if (added > 0) showToast(`🐾 تمت إضافة ${added} مواد إلى سلتك!`);
        extraHtml = mapped.map(m => `
          <div style="display:inline-flex; align-items:center; gap:5px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:4px 6px; margin:3px 3px 0 0; font-size:10px;">
            <img src="${esc(m.thumb)}" onerror="this.src='store-icon.png'" style="width:24px; height:24px; border-radius:4px; object-fit:cover;">
            <span><b>${esc(m.name)}</b> ×${m.qty}</span>
          </div>`).join("");
      }

      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        extraHtml += data.alternatives.map(alt => {
          const p = products?.[alt.suggestedId];
          if (!p) return "";
          return `<div style="display:inline-flex; align-items:center; gap:5px; background:var(--card-bg); border:1px solid #ff9800; border-radius:6px; padding:4px 7px; margin:4px 3px 0 0; font-size:10px;">
            <img src="${esc(getThumb(alt.suggestedId))}" onerror="this.src='store-icon.png'" style="width:24px; height:24px; border-radius:4px; object-fit:cover;">
            <span>بديل متوفر: <b>${esc(p.name)}</b> (${getUnitSYP(alt.suggestedId).toLocaleString()} ل.س)</span>
            <button type="button" onclick="changeQty('${esc(alt.suggestedId)}', 1); showToast('✅ أُضيف البديل');" class="btn" style="width:auto; padding:2px 6px; font-size:9px; background:#ff9800; color:#000;">➕</button>
          </div>`;
        }).filter(Boolean).join("");
      }

      const replyMsg = data.reply || data.answerNote || "تفضّل، شو بتحب نضيف أو نرتب اليوم؟";
      setMoodExpression(data.petMood || "happy", replyMsg, extraHtml, replyMsg.slice(0, 38));
      setTxt("aiShoppingStatusText", `🐾 ${persona.name}: ${replyMsg}`);
      if (fromVoice) speakText(replyMsg);
    } catch (_) {
      // خطة بديلة محلية فورية دون إزعاج الزبون برسائل خطأ تقنية
      const fallback = localFallbackMatch(promptTxt);
      if (fallback.length > 0) {
        let added = 0;
        fallback.forEach(f => {
          const cur = cart[f.id] ? (parseInt(cart[f.id].qty) || 0) : 0;
          const maxSt = typeof getProductStockForBranch === "function" ? getProductStockForBranch(products[f.id], activeBranchId) : 99;
          const addN = Math.min(f.qty, Math.max(0, maxSt - cur));
          if (addN > 0) { changeQty(f.id, addN); added += addN; }
        });
        const msg = added > 0
          ? `الضغط عالي شوي حالياً، فرتبتلك الطلب مباشرة من المخزون (${added} مواد)!`
          : `الطلب موجود مسبقاً أو الكمية محدودة بالفرع حالياً.`;
        setMoodExpression("helpful", msg, "", msg.slice(0, 38));
        setTxt("aiShoppingStatusText", `🐾 ${msg}`);
      } else {
        const calmMsg = "صار ضغط لحظي بسيط، تقدر تبحث مباشرة من شريط البحث أو تجرب مرة ثانية بعد شوي.";
        setMoodExpression("helpful", calmMsg, "", "جرّب البحث السريع");
        setTxt("aiShoppingStatusText", `🐾 ${calmMsg}`);
      }
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "✨ تعبئة"; }
    }
  };

  // [إدخال صوتي مع مؤشر إنصات وتعديل سريع]
  window.startVoiceShoppingInput = function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("⚠️ المتصفح لا يدعم الإدخال الصوتي، اكتب طلبك مباشرة.");

    if (activeRecognition) {
      try { activeRecognition.stop(); } catch (_) {}
    }

    const rec = new SR();
    activeRecognition = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setMoodExpression("listening", "عم أسمعك... احكي طلبك بوضوح 🎤", `
      <div style="display:flex; align-items:center; gap:6px; background:rgba(0,176,255,0.12); border:1px solid #00b0ff; border-radius:6px; padding:6px; margin-top:4px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e676; animation:pulse 1s infinite;"></span>
        <span style="font-size:10px; color:#00b0ff; font-weight:bold;">جاري الإنصات للصوت...</span>
      </div>`, "🎙️ جاري الإنصات...");

    rec.onresult = ev => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) return;
      pendingVoiceText = heard;
      setVal("aiShoppingPromptInput", heard);
      setMoodExpression("helpful", `سمعت: "${heard}" — هل ننفّذه الآن أم تعدّله؟`, `
        <div style="background:var(--card-bg); border:1px solid var(--gold-color); border-radius:6px; padding:6px; margin-top:4px;">
          <input type="text" id="voiceConfirmEditInput" class="form-control" value="${esc(heard)}" style="padding:5px; font-size:11px; margin-bottom:5px;">
          <div style="display:flex; gap:5px;">
            <button type="button" onclick="confirmVoiceDraftNow()" class="btn" style="flex:1; padding:4px; font-size:10px; background:#00e676; color:#000;">✅ تأكيد وإضافة</button>
            <button type="button" onclick="pendingVoiceText=''; setMoodExpression('happy','تم إلغاء المسودة الصوتية.');" class="btn btn-danger" style="width:auto; padding:4px 8px; font-size:10px;">إلغاء</button>
          </div>
        </div>`);
    };

    rec.onerror = () => {
      setMoodExpression("helpful", "ما التقيت صوت واضح، اكتب طلبك أو جرّب مرة ثانية.");
    };
    rec.start();
  };

  window.confirmVoiceDraftNow = function () {
    const val = String($("voiceConfirmEditInput")?.value || pendingVoiceText || "").trim();
    pendingVoiceText = "";
    if (!val) return;
    setVal("aiShoppingPromptInput", val);
    runAIShoppingAssistant(val, true);
  };

  // [سلة العادة حسب التكرار]
  window.fillHabitCartAI = function () {
    if (!currentUser?.phone) return alert("⚠️ يرجى تسجيل الدخول أولاً لعرض سلة العادة.");
    const orders = Object.values(completedOrdersHistory || {})
      .filter(o => o.customerPhone === currentUser.phone)
      .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""))
      .slice(0, 10);

    if (!orders.length) {
      setMoodExpression("helpful", "لسا ما عندي سجل طلبات كافٍ، ومع الوقت رح أرتبلك سلة العادة تلقائياً!");
      return;
    }

    const freq = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        if (String(it.id || "").startsWith("OFFER_")) return;
        const baseId = it.origId || String(it.id || "").replace(/_PKG$/, "");
        freq[baseId] = (freq[baseId] || 0) + 1;
      });
    });

    const picks = Object.keys(freq)
      .filter(pid => products?.[pid] && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 5)
      .map(pid => ({
        id: pid,
        name: products[pid].name,
        qty: 1,
        unitPrice: getUnitSYP(pid),
        lineTotal: getUnitSYP(pid),
        thumb: getThumb(pid),
        reason: `تكرر في طلباتك (${freq[pid]} مرات)`
      }));

    if (!picks.length) {
      setMoodExpression("helpful", "أصنافك المعتادة غير متوفرة حالياً في هذا الفرع.");
      return;
    }
    renderInteractiveProposalCard(picks, "🔄 سلة العادة الذكية (بحسب تكرار مشترياتك):");
    setMoodExpression("happy", "جهزتلك الأصناف اللي بتطلبها أكثر شي، اختار منها اللي بدك إياه!");
  };

  // [مقارنة سريعة بين المفرد والطرد / العرض]
  function renderPackComparisonBar() {
    const assistBox = $("aiSmartAssistantBox");
    if (!assistBox) return;
    let bar = $("petPackCompareBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "petPackCompareBar";
      bar.style.cssText = "margin-top:6px;";
      assistBox.appendChild(bar);
    }

    const deals = [];
    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p || !p.hasPackage || !p.pkgCount || !p.pkgPriceUSD) return;
      const diff = (calcSYP(p.priceUSD || 0) * parseInt(p.pkgCount)) - calcSYP(p.pkgPriceUSD || 0);
      if (diff > 0) deals.push({ pid, name: p.name, pkgPrice: calcSYP(p.pkgPriceUSD || 0), diff, thumb: getThumb(pid) });
    });

    if (!deals.length) { bar.innerHTML = ""; return; }
    const top = deals[0];
    bar.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.4); border-radius:7px; padding:5px 8px; font-size:10px;">
      <div style="display:flex; align-items:center; gap:6px;">
        <img src="${esc(top.thumb)}" onerror="this.src='store-icon.png'" style="width:28px; height:28px; border-radius:5px; object-fit:cover;">
        <span>وفر <b>${top.diff.toLocaleString()} ل.س</b> بشراء طرد <b>${esc(top.name)}</b> (${top.pkgPrice.toLocaleString()} ل.س)</span>
      </div>
      <button type="button" onclick="changeQty('${top.pid}_PKG', 1)" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:var(--gold-color); color:#000;">أضف الطرد</button>
    </div>`;
  }

  // [ملخص فاتورة ودّي ومفهوم داخل السلة]
  function renderFriendlyCartSummary() {
    const submitBtn = $("submitOrderUnifiedBtn");
    if (!submitBtn || !submitBtn.parentNode) return;
    let card = $("petFriendlyCartSummary");
    if (!card) {
      card = document.createElement("div");
      card.id = "petFriendlyCartSummary";
      card.style.cssText = "background:rgba(0,230,118,0.08); border:1px solid rgba(0,230,118,0.4); border-radius:8px; padding:7px 9px; margin-bottom:8px; font-size:11px;";
      submitBtn.parentNode.insertBefore(card, submitBtn);
    }
    const count = Object.values(cart || {}).reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
    const fee = $("modalDeliveryFee")?.textContent || "0";
    const pts = $("modalCartPoints")?.textContent || "0";
    const total = $("modalCartTotal")?.textContent || "0";
    card.innerHTML = `<div style="font-weight:bold; color:#00e676; margin-bottom:2px;">🐾 ملخص بندق قبل الإرسال:</div>
      <div>معك <b>${count}</b> مواد، التوصيل <b>${esc(fee)} ل.س</b>، ربحك <b>+${esc(pts)} نقطة</b>، والمجموع النهائي: <b style="color:var(--gold-color);">${esc(total)} ل.س</b>.</div>`;
  }

  // [صور مصغرة في توصيات السلة]
  window.renderSmartCartRecommendations = function () {
    const box = $("aiCartRecommendationsBox");
    if (!box) return;
    const cartKeys = Object.keys(cart || {});
    if (!cartKeys.length) { box.style.display = "none"; box.innerHTML = ""; return; }

    const inCartBase = new Set(cartKeys.map(k => cart[k]?.origId || String(k).replace(/_PKG$/, "")));
    const cats = new Set(cartKeys.map(k => cart[k]?.category).filter(Boolean));
    const co = {};

    Object.values(completedOrdersHistory || {}).forEach(ord => {
      const ids = Array.from(new Set((ord?.items || []).filter(i => !String(i.id || "").startsWith("OFFER_")).map(i => i.origId || String(i.id || "").replace(/_PKG$/, ""))));
      if (ids.some(id => inCartBase.has(id))) {
        ids.forEach(id => { if (!inCartBase.has(id)) co[id] = (co[id] || 0) + 1; });
      }
    });

    const picks = Object.keys(products || {})
      .filter(pid => !inCartBase.has(pid) && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .map(pid => ({ pid, p: products[pid], score: (co[pid] || 0) * 5 + (cats.has(products[pid].category) ? 2 : 0) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (!picks.length) { box.style.display = "none"; box.innerHTML = ""; return; }

    box.style.display = "block";
    box.innerHTML = `<div style="background:rgba(0,176,255,0.06); border:1px dashed #00b0ff; border-radius:8px; padding:7px;">
      <div style="font-size:11px; font-weight:bold; color:#00b0ff; margin-bottom:6px;">🐾 مقترحات مصورة تكمل سلتك:</div>
      <div style="display:flex; gap:6px; overflow-x:auto;">` +
      picks.map(({ pid, p }) => `
        <div style="min-width:112px; background:var(--bg-color); border:1px solid var(--gold-color); border-radius:7px; padding:6px; text-align:center;">
          <img src="${esc(getThumb(pid))}" onerror="this.src='store-icon.png'" style="width:48px; height:48px; border-radius:6px; object-fit:cover; margin:0 auto 4px auto; display:block;">
          <div style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(p.name)}</div>
          <div style="font-size:10px; color:var(--success-color); font-weight:bold; margin:2px 0;">${getUnitSYP(pid).toLocaleString()} ل.س</div>
          <button type="button" onclick="changeQty('${pid}', 1)" class="btn" style="padding:3px 6px; font-size:10px;">➕ أضف</button>
        </div>`).join("") +
      `</div></div>`;
  };

  // [أدوات الإدارة: فواتير الموردين، تذكير الديون، الملخص اليومي]
  window.runSupplierInvoiceOCR = async function () {
    const file = $("aiSupplierInvoiceFile")?.files?.[0];
    const outBox = $("aiSupplierInvoiceResult");
    if (!file || !outBox) return;
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    outBox.innerHTML = `<div style="color:#00b0ff; font-size:11px;">⏳ جاري قراءة الفاتورة...</div>`;
    try {
      const b64 = await fileToBase64Clean(file);
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "supplier_invoice_ocr", imageBase64: b64, imageMimeType: file.type || "image/jpeg" })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل القراءة");
      const items = Array.isArray(json.data?.items) ? json.data.items : [];
      window._lastParsedSupplierItems = items;
      outBox.innerHTML = items.length ? `<table class="tbl-clean"><thead><tr><th style="text-align:right;">الصنف</th><th>الكمية</th><th>التكلفة</th><th>إضافة</th></tr></thead><tbody>` +
        items.map((it, idx) => `<tr><td style="text-align:right;">${esc(it.name)}</td><td>${parseInt(it.qty) || 1}</td><td>${(Number(it.unitCost) || 0).toLocaleString()}</td><td><button type="button" onclick="applyParsedInvoiceItemToForm(${idx})" class="btn" style="padding:2px 6px; font-size:10px; width:auto;">⬇️</button></td></tr>`).join("") +
        `</tbody></table>` : `<div style="color:#ff9800; font-size:11px;">⚠️ لم تظهر أصناف واضحة.</div>`;
    } catch (err) {
      outBox.innerHTML = `<div style="color:var(--danger-color); font-size:11px;">❌ ${esc(err.message)}</div>`;
    }
  };

  window.applyParsedInvoiceItemToForm = function (idx) {
    const it = (window._lastParsedSupplierItems || [])[idx];
    if (!it) return;
    setVal("prodName", it.name || "");
    setVal("prodStock", parseInt(it.qty) || 1);
    if (it.unitCost > 0) {
      setVal("prodCostSYP", Math.round(it.unitCost));
      if (typeof updateLiveUSD === "function") updateLiveUSD("prodCostSYP", "prodCostUSDPreview", "prodCostUSD");
    }
    showToast(`✅ تمت تعبئة (${it.name})`);
  };

  window.generateSmartDebtReminderWhatsApp = async function () {
    const phone = $("adminDebtCustomerSelect")?.value;
    if (!phone || !users?.[phone]) return alert("⚠️ اختر زبون الآجل أولاً.");
    const u = users[phone];
    const balUSD = parseFloat(u.debtBalanceUSD) || 0;
    if (balUSD <= 0) return alert("✅ لا يوجد رصيد مستحق على هذا الزبون.");
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "debt_reminder",
          debtInfo: { customerName: u.name, amount: `${balUSD.toFixed(2)} $ (${calcSYP(balUSD).toLocaleString()} ل.س)`, daysOverdue: 7 }
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل توليد الرسالة");
      const msg = json.data?.message || `مرحباً ${u.name}، تذكير ودي من متجر معاذ برصيدكم المستحق (${balUSD.toFixed(2)} $).`;
      window.open(`https://wa.me/${formatWhatsAppPhone(phone)}?text=${encodeURIComponent(msg)}`, "_blank");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  window.runDailyBriefAI = async function () {
    const box = $("aiDailyBriefOutput");
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    if (box) box.innerHTML = `<div style="color:#00b0ff; font-size:11px; margin-top:6px;">⏳ جاري التحليل...</div>`;
    const snap = window.latestStatsSnapshot || {};
    const lowItems = Object.values(products || {}).filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.alertLimit) || 2)).slice(0, 10).map(p => p.name);
    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "daily_brief", stats: { totalSalesSYP: snap.totS || 0, netProfitSYP: snap.netP || 0, lowStockItems: lowItems } })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل التحليل");
      const d = json.data || {};
      const acts = (d.actions || []).map(a => `<li>${esc(a)}</li>`).join("");
      if (box) box.innerHTML = `<div class="adm-card" style="border-color:#00e676; margin-top:8px; font-size:11px;"><b style="color:#00e676;">🤖 ملخص اليوم:</b><p style="margin:4px 0;">${esc(d.summary || "")}</p><ul style="margin:0; padding-right:16px;">${acts}</ul></div>`;
    } catch (err) {
      if (box) box.innerHTML = `<div style="color:var(--danger-color); font-size:11px; margin-top:6px;">❌ ${esc(err.message)}</div>`;
    }
  };

  // [تركيب الزر العائم ثلاثي الأبعاد والبطاقة المدمجة وأدوات الإدارة]
  function attachDrag(el, root) {
    if (!el || !root || el.dataset.dragBound) return;
    el.dataset.dragBound = "1";
    let down = false, moved = false, sx = 0, sy = 0, r0 = 14, b0 = 86;

    const start = e => {
      const pt = e.touches ? e.touches[0] : e;
      down = true; moved = false; sx = pt.clientX; sy = pt.clientY;
      r0 = parseInt(root.style.right || "14", 10);
      b0 = parseInt(root.style.bottom || "86", 10);
    };
    const move = e => {
      if (!down) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - sx, dy = pt.clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      root.style.right = Math.max(8, Math.min(window.innerWidth - 66, r0 - dx)) + "px";
      root.style.bottom = Math.max(74, Math.min(window.innerHeight - 90, b0 - dy)) + "px";
    };
    const end = () => {
      if (!down) return;
      down = false;
      if (!moved) window.togglePetCollapsed(true);
    };

    el.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
    el.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
  }

  function mountAllUXFeatures() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const tInfo = getTimeOfDayGreeting();

    // 1. بطاقة الصديق المدمجة داخل صندوق المساعد
    const assistBox = $("aiSmartAssistantBox");
    if (assistBox && !$("petInlineBanner")) {
      const banner = document.createElement("div");
      banner.id = "petInlineBanner";
      banner.style.cssText = "background:rgba(0,176,255,0.08); border:1px solid var(--border-color); border-radius:8px; padding:7px 9px; margin-bottom:7px; font-size:11px;";
      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <div style="display:flex; align-items:center; gap:7px;">
            <span id="petInlineFace" style="font-size:20px;">${p.baseIcon}</span>
            <span id="petInlineBubble">مساء الخير! ${esc(tInfo.tip)} 🐾</span>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="speakText($('petInlineBubble')?.textContent || '', true)" class="btn" style="width:auto; padding:2px 6px; font-size:10px; background:rgba(0,176,255,0.2); color:#00b0ff;">🔊</button>
            <button id="petRestoreHiddenBtn" type="button" onclick="togglePetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:2px 7px; font-size:10px; font-weight:bold; cursor:pointer;">3D إظهار</button>
          </div>
        </div>
        <div id="petInlineProposalBox"></div>`;
      assistBox.insertBefore(banner, assistBox.firstChild);
    }

    // 2. أزرار الميزانية والوصفات والعادة والدوام
    if (assistBox && !$("petQuickActionsRow")) {
      const row = document.createElement("div");
      row.id = "petQuickActionsRow";
      row.style.cssText = "display:flex; gap:5px; flex-wrap:wrap; margin-top:6px;";
      row.innerHTML = `
        <button type="button" onclick="fillHabitCartAI()" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color);">🔄 سلة العادة</button>
        <button type="button" onclick="runSmartBudgetBasket(500)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,230,118,0.15); color:#00e676; border:1px solid #00e676;">💰 ميزانية 500</button>
        <button type="button" onclick="runAIShoppingAssistant('جهز لي أغراض متة وسهرة متوفرة', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,176,255,0.15); color:#00b0ff; border:1px solid #00b0ff;">🧉 أغراض متة</button>
        <button type="button" onclick="runAIShoppingAssistant('هل المتجر مفتوح الآن؟', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:var(--card-bg); color:var(--text-color); border:1px solid var(--border-color);">⏰ الدوام الآن؟</button>
      `;
      assistBox.appendChild(row);
    }

    // 3. الزر العائم ثلاثي الأبعاد + الكبسولة القابلة للطي
    if (!$("pet3DFloatingRoot")) {
      const styleEl = document.createElement("style");
      styleEl.id = "pet3DCss";
      styleEl.textContent = `
        @keyframes petOrbBob3D {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        #pet3DOrbBtn {
          width: 52px; height: 52px; border-radius: 50%;
          border: 2px solid ${p.accent};
          background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32), var(--card-bg) 65%);
          font-size: 25px; display: flex; align-items: center; justify-content: center;
          cursor: grab; animation: petOrbBob3D 2.7s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleEl);

      const root = document.createElement("div");
      root.id = "pet3DFloatingRoot";
      root.style.cssText = "position:fixed; bottom:86px; right:14px; z-index:98;";
      root.innerHTML = `
        <div id="pet3DDrawerPanel" style="display:none; width:276px; max-width:calc(100vw - 28px); background:var(--card-bg); border:1px solid var(--gold-color); border-radius:12px; padding:9px; margin-bottom:8px; box-shadow:0 12px 26px rgba(0,0,0,0.55);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:6px; flex-wrap:wrap;">
            <b style="font-size:11px; color:var(--gold-color);"><span id="petActiveName">${esc(p.name)}</span></b>
            <div style="display:flex; gap:3px;">
              <button id="petVoiceModeBtn" type="button" onclick="cycleVoiceMode()" style="background:rgba(0,176,255,0.15); border:1px solid #00b0ff; color:#00b0ff; border-radius:6px; font-size:9px; padding:2px 5px; cursor:pointer;">🔊</button>
              <button type="button" onclick="togglePetCollapsed(true)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-color); border-radius:6px; font-size:9px; padding:2px 6px; cursor:pointer;">طي</button>
              <button type="button" onclick="togglePetHidden(true)" style="background:transparent; border:1px solid var(--border-color); color:var(--gray-text); border-radius:6px; font-size:9px; padding:2px 5px; cursor:pointer;">إخفاء</button>
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-bottom:6px;">
            <button type="button" data-persona="buddy" onclick="selectPetPersona('buddy')" class="cat-btn pet-persona-btn" style="padding:3px 7px; font-size:10px;">🐱 ودود</button>
            <button type="button" data-persona="pro" onclick="selectPetPersona('pro')" class="cat-btn pet-persona-btn" style="padding:3px 7px; font-size:10px;">🦅 سريع</button>
            <button type="button" data-persona="saver" onclick="selectPetPersona('saver')" class="cat-btn pet-persona-btn" style="padding:3px 7px; font-size:10px;">🦊 توفير</button>
          </div>
          <div id="petDrawerBubble" style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; padding:6px 8px; font-size:11px; margin-bottom:6px;">
            أهلاً بك! اختر أسلوبك أو اكتب طلبك، وأنا أرتبلك السلة فوراً.
          </div>
          <div style="display:flex; gap:4px;">
            <input type="text" id="petDrawerInput" class="form-control" style="padding:6px; font-size:11px; flex:1;" placeholder="اطلب أو اسأل..." onkeydown="if(event.key==='Enter'){ setVal('aiShoppingPromptInput', this.value); runAIShoppingAssistant(); }">
            <button type="button" onclick="setVal('aiShoppingPromptInput', $('petDrawerInput')?.value || ''); runAIShoppingAssistant();" class="btn" style="width:auto; padding:6px 9px; font-size:11px; background:var(--gold-color); color:#000;">➤</button>
          </div>
          <div id="petDrawerExtra" style="margin-top:6px; max-height:145px; overflow-y:auto;"></div>
        </div>

        <button id="petSmartPillBtn" type="button" onclick="togglePetCollapsed(false)" style="display:none; align-items:center; gap:6px; background:var(--card-bg); color:var(--text-color); border:1.5px solid ${p.accent}; border-radius:20px; padding:6px 11px; font-size:11px; font-weight:bold; cursor:pointer; box-shadow:0 6px 18px rgba(0,0,0,0.45);">
          <span id="petPillFace" style="font-size:16px;">${p.baseIcon}</span>
          <span id="petPillText">مساعدك الذكي</span>
        </button>

        <div id="pet3DOrbWrap" style="display:flex; justify-content:flex-end;">
          <button id="pet3DOrbBtn" type="button" aria-label="المرافق ثلاثي الأبعاد">${p.baseIcon}</button>
        </div>
      `;
      document.body.appendChild(root);
      attachDrag($("pet3DOrbBtn"), root);
    }

    // 4. أدوات الإدارة
    const prodTab = $("admTab4Products");
    if (prodTab && !$("aiSupplierInvoiceCard")) {
      const card = document.createElement("div");
      card.id = "aiSupplierInvoiceCard";
      card.className = "adm-sec";
      card.style.borderColor = "#00b0ff";
      card.innerHTML = `<div class="adm-sec-title"><span style="color:#00b0ff;">📸 قراءة فاتورة مورد بالكاميرا</span></div><input type="file" id="aiSupplierInvoiceFile" accept="image/*" class="form-control" style="margin-bottom:6px;" onchange="runSupplierInvoiceOCR()"><div id="aiSupplierInvoiceResult"></div>`;
      prodTab.insertBefore(card, prodTab.firstChild);
    }

    const debtSum = $("adminDebtCustomerSummary");
    if (debtSum && !$("aiDebtReminderBtn")) {
      const btn = document.createElement("button");
      btn.id = "aiDebtReminderBtn";
      btn.type = "button";
      btn.className = "btn";
      btn.style.cssText = "margin-top:8px; background:linear-gradient(45deg,#25D366,#00b0ff); color:#000; font-size:11px; padding:6px;";
      btn.textContent = "🤖 توليد رسالة تذكير دين مهذبة وإرسالها واتساب";
      btn.onclick = window.generateSmartDebtReminderWhatsApp;
      debtSum.appendChild(btn);
    }

    const statsTab = $("admTab1Stats");
    if (statsTab && !$("aiDailyBriefBtn")) {
      const wrap = document.createElement("div");
      wrap.className = "adm-sec";
      wrap.style.borderColor = "#00e676";
      wrap.innerHTML = `<button id="aiDailyBriefBtn" type="button" onclick="runDailyBriefAI()" class="btn" style="background:linear-gradient(45deg,#00b0ff,#00e676); color:#000; font-size:12px; font-weight:bold;">🤖 تحليل نهاية اليوم الذكي</button><div id="aiDailyBriefOutput"></div>`;
      statsTab.insertBefore(wrap, statsTab.firstChild);
    }

    renderPackComparisonBar();
    syncPetChrome();
  }

  const _origRenderStore = window.renderStore;
  window.renderStore = function () {
    if (typeof _origRenderStore === "function") _origRenderStore();
    mountAllUXFeatures();
  };

  const _origRenderCart = window.renderCartModalItems;
  window.renderCartModalItems = function () {
    if (typeof _origRenderCart === "function") _origRenderCart();
    renderFriendlyCartSummary();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAllUXFeatures);
  } else {
    mountAllUXFeatures();
  }
})();

// ============================================================================
// محرك المرافق ثلاثي الأبعاد والمحادثة الصوتية لمتجر معاذ (v33)
// - بدون أي تدخل للذكاء الاصطناعي في الدفع أو فحص الإشعارات
// - يجمع: محادثة صوتية حية + التصاق بالحواف + حفظ الموقع + استجابة لمسية
//   + اختفاء أثناء التمرير + إمالة 3D + شارة عدّاد + تكيّف نهاري/ليلي
// ============================================================================

(function () {
  const PREFS_KEY = "moaath_pet_v33_prefs";
  const POS_KEY = "moaath_pet_v33_pos";
  const CACHE_KEY = "moaath_pet_v33_cache";
  const CACHE_TTL = 2 * 60 * 60 * 1000;

  const PERSONAS = {
    buddy: { id: "buddy", name: "بندق الودود", baseIcon: "🐱", accent: "#00b0ff", styleHint: "لهجة محلية ودودة ومرحّة وقصيرة كصديق للزبون." },
    pro: { id: "pro", name: "صقر السريع", baseIcon: "🦅", accent: "#00e676", styleHint: "أسلوب عملي ومباشر وسريع في الأرقام والكميات والأسعار." },
    saver: { id: "saver", name: "ثعلب التوفير", baseIcon: "🦊", accent: "#D4AF37", styleHint: "يركّز على التوفير والطرود والعروض وتوزيع الميزانية." }
  };

  let sessionContext = { lastItems: [], lastBudget: null };
  let voiceLoopActive = false;
  let recInstance = null;
  let scrollHideTimer = null;

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
        collapsed: d.collapsed === undefined ? true : !!d.collapsed,
        voiceMode: ["auto", "on_demand", "muted"].includes(d.voiceMode) ? d.voiceMode : "auto",
        pinned: !!d.pinned
      };
    } catch (_) {
      return { persona: "buddy", hidden: false, collapsed: true, voiceMode: "auto", pinned: false };
    }
  }

  function setPrefs(patch) {
    const next = { ...getPrefs(), ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
  }

  function getSavedPos() {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) || "{}");
      return {
        right: typeof p.right === "number" ? p.right : 14,
        bottom: typeof p.bottom === "number" ? p.bottom : 86
      };
    } catch (_) {
      return { right: 14, bottom: 86 };
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

  function setBadgeCount(num) {
    const b = $("petBadgeCount");
    if (!b) return;
    if (num > 0) {
      b.style.display = "inline-flex";
      b.textContent = String(num);
    } else {
      b.style.display = "none";
      b.textContent = "0";
    }
  }

  function setExpression(mood = "happy", text = "", extraHtml = "", pillHint = "") {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const faces = { happy: p.baseIcon, excited: "🤩", thinking: "🤔", listening: "🎙️", helpful: "💡" };
    const face = faces[mood] || p.baseIcon;
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

  function speakReply(txt, force = false) {
    const prefs = getPrefs();
    if (prefs.voiceMode === "muted" && !force) return;
    if (prefs.voiceMode === "on_demand" && !force) return;
    try {
      if (!("speechSynthesis" in window) || !txt) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = "ar-SA";
      u.rate = 1.03;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  window.cycleVoiceMode = function () {
    haptic(12);
    const prefs = getPrefs();
    const seq = ["auto", "on_demand", "muted"];
    const next = seq[(seq.indexOf(prefs.voiceMode) + 1) % seq.length];
    setPrefs({ voiceMode: next });
    syncOrbVisuals();
    const msg = { auto: "🗣️ النطق التلقائي مفعّل", on_demand: "🔊 النطق عند الطلب", muted: "🔇 الصوت مكتوم" }[next];
    showToast(msg);
  };

  window.selectPetPersona = function (key) {
    if (!PERSONAS[key]) return;
    haptic(15);
    setPrefs({ persona: key });
    syncOrbVisuals();
    setExpression("happy", `أهلاً بك مع (${PERSONAS[key].name})! اطلب أو تحدّث معي.`);
  };

  window.togglePetCollapsed = function (collapseToPill = null) {
    haptic(15);
    const prefs = getPrefs();
    const next = typeof collapseToPill === "boolean" ? collapseToPill : !prefs.collapsed;
    setPrefs({ collapsed: next, hidden: false });
    if (!next) setBadgeCount(0);
    syncOrbVisuals();
  };

  window.togglePetHidden = function (hide) {
    haptic(15);
    stopVoiceChat();
    setPrefs({ hidden: !!hide, collapsed: true });
    syncOrbVisuals();
  };

  window.togglePetPin = function () {
    haptic(15);
    const prefs = getPrefs();
    const next = !prefs.pinned;
    setPrefs({ pinned: next });
    syncOrbVisuals();
    showToast(next ? "📌 تم تثبيت مكان الزر" : "🔓 تم تحرير سحب الزر");
  };

  function syncOrbVisuals() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const isLight = document.body.classList.contains("light-mode");
    const pos = getSavedPos();

    const root = $("pet3DFloatingRoot");
    const pill = $("petSmartPillBtn");
    const drawer = $("pet3DDrawerPanel");
    const orbWrap = $("pet3DOrbWrap");
    const orb = $("pet3DOrbBtn");
    const restoreBtn = $("petRestoreHiddenBtn");
    const vBtn = $("petVoiceModeBtn");
    const pinBtn = $("petPinBtn");

    if (root) {
      root.style.display = prefs.hidden ? "none" : "block";
      root.style.right = pos.right + "px";
      root.style.bottom = pos.bottom + "px";
    }
    if (restoreBtn) restoreBtn.style.display = prefs.hidden ? "inline-flex" : "none";
    if (pill) pill.style.display = (!prefs.hidden && prefs.collapsed) ? "inline-flex" : "none";
    if (orbWrap) orbWrap.style.display = (!prefs.hidden && !prefs.collapsed) ? "flex" : "none";
    if (drawer) drawer.style.display = (!prefs.hidden && !prefs.collapsed) ? "block" : "none";

    if (orb) {
      orb.style.borderColor = p.accent;
      orb.style.background = isLight
        ? `radial-gradient(circle at 30% 25%, #ffffff, #e8ecf2 72%)`
        : `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.34), var(--card-bg) 65%)`;
      orb.style.boxShadow = isLight
        ? `0 8px 18px rgba(0,0,0,0.18), 0 0 12px ${p.accent}44`
        : `0 10px 22px rgba(0,0,0,0.48), 0 0 15px ${p.accent}55, inset 0 2px 5px rgba(255,255,255,0.35)`;
    }

    setTxt("petActiveName", p.name);
    if (vBtn) vBtn.textContent = { auto: "🗣️", on_demand: "🔊", muted: "🔇" }[prefs.voiceMode] || "🔊";
    if (pinBtn) pinBtn.textContent = prefs.pinned ? "📌" : "📍";

    document.querySelectorAll(".pet-persona-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.persona === prefs.persona);
    });
  }

  function answerLiveQuestion(qNorm) {
    if (/مفتوح|دوام|اوقات|ساعات|مسكر|يفتح/.test(qNorm)) {
      const openNow = typeof isGlobalStoreOpenNow === "function" ? isGlobalStoreOpenNow() : true;
      const wh = workHoursSettings || {};
      const hTxt = wh.enabled ? `مواعيد الدوام من ${wh.open || "08:00"} إلى ${wh.close || "23:00"}` : "المتجر متاح للطلب حالياً";
      return openNow ? `نعم، المتجر مفتوح الآن وفرع (${getBranchName(activeBranchId)}) جاهز! ${hTxt}.` : `المتجر مغلق حالياً، ${hTxt}.`;
    }
    return null;
  }

  function localFallback(promptTxt) {
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();
    const tokens = norm.split(/[^a-z0-9\u0600-\u06FF]+/).filter(w => w.length >= 2);
    const out = [];
    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p) return;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      if (st <= 0) return;
      const pNorm = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      if (tokens.some(t => pNorm.includes(t))) {
        let qty = 1;
        if (/كيلوين|2\s*كيلو|اثنين/.test(norm)) qty = Math.min(2, st);
        out.push({ id: pid, name: p.name, qty, unitPrice: getUnitSYP(pid), lineTotal: getUnitSYP(pid) * qty, thumb: getThumb(pid), reason: "مطابقة سريعة من المخزون" });
      }
    });
    return out.slice(0, 5);
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
        words.forEach(w => { if (pNorm.includes(w)) score += 12; else if (cNorm.includes(w)) score += 5; });
        return { id: pid, name: p.name || "", category: p.category || "", stock: st, priceSYP: getUnitSYP(pid), unit: p.unitType || "قطعة", _score: score };
      })
      .filter(Boolean).sort((a, b) => b._score - a._score).slice(0, 60).map(({ _score, ...r }) => r);
  }

  window.runSmartBudgetBasket = function (budgetAmount) {
    haptic(15);
    const budget = Math.max(50, parseInt(budgetAmount) || 0);
    sessionContext.lastBudget = budget;
    const avail = Object.keys(products || {})
      .map(pid => {
        const p = products[pid];
        if (!p) return null;
        const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
        const price = getUnitSYP(pid);
        if (st <= 0 || price <= 0 || price > budget) return null;
        return { pid, name: p.name, price, thumb: getThumb(pid) };
      })
      .filter(Boolean).sort((a, b) => a.price - b.price);

    let sum = 0;
    const picked = [];
    for (const it of avail) {
      if (sum + it.price <= budget && picked.length < 5) {
        picked.push({ id: it.pid, name: it.name, qty: 1, unitPrice: it.price, lineTotal: it.price, thumb: it.thumb, reason: `ضمن ميزانية ${budget.toLocaleString()} ل.س` });
        sum += it.price;
      }
    }
    if (!picked.length) {
      setExpression("helpful", `بميزانية ${budget.toLocaleString()} ل.س، جرّب تصفح الأصناف المتوفرة أو زيادة المبلغ.`);
      return;
    }
    sessionContext.lastItems = picked;
    setBadgeCount(picked.length);
    renderProposalBox(picked, `ميزانية ${budget.toLocaleString()} ل.س — المجموع: ${sum.toLocaleString()} ل.س:`);
    setExpression("excited", `رتبتلك سلة بـ ${sum.toLocaleString()} ل.س! اختر اللي بدك إياه.`);
  };

  function renderProposalBox(items, title) {
    window._petProposal = items;
    const html = `
      <div style="background:rgba(212,175,55,0.08); border:1px solid var(--gold-color); border-radius:8px; padding:7px; margin-top:6px;">
        <div style="font-size:11px; font-weight:bold; color:var(--gold-color); margin-bottom:5px;">${esc(title)}</div>
        ${items.map((it, i) => `
          <div style="display:flex; align-items:center; gap:6px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:5px 7px; margin-bottom:4px;">
            <input type="checkbox" class="pet-prop-cb" data-idx="${i}" checked style="width:15px; height:15px;">
            <img src="${esc(it.thumb)}" onerror="this.src='store-icon.png'" style="width:30px; height:30px; border-radius:5px; object-fit:cover;">
            <div style="text-align:right; flex:1;">
              <div style="font-size:11px; font-weight:bold;">${esc(it.name)}</div>
              <div style="font-size:10px; color:var(--gray-text);">${it.qty} × ${it.unitPrice.toLocaleString()} = <b style="color:var(--gold-color);">${it.lineTotal.toLocaleString()} ل.س</b></div>
              <div style="font-size:9px; color:#00b0ff;">${esc(it.reason || "متوفر")}</div>
            </div>
          </div>`).join("")}
        <button type="button" onclick="confirmPetProposal()" class="btn" style="margin-top:5px; padding:6px; font-size:11px; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">✅ إضافة المحدد للسلة</button>
      </div>`;
    if ($("petDrawerExtra")) $("petDrawerExtra").innerHTML = html;
    if ($("petInlineProposalBox")) $("petInlineProposalBox").innerHTML = html;
  }

  window.confirmPetProposal = function () {
    haptic([15, 40, 15]);
    const list = window._petProposal || [];
    let added = 0;
    document.querySelectorAll(".pet-prop-cb").forEach(cb => {
      if (!cb.checked) return;
      const it = list[parseInt(cb.getAttribute("data-idx"))];
      if (!it) return;
      changeQty(it.id, it.qty);
      added++;
    });
    if (added > 0) {
      setBadgeCount(0);
      showToast(`🐾 تمت إضافة ${added} مواد للسلة!`);
      const doneMsg = "تمت الإضافة للسلة، بدك شي تاني؟";
      setExpression("excited", doneMsg);
      speakReply(doneMsg);
    }
  };

  window.runAIShoppingAssistant = async function (overridePrompt = null, fromVoice = false) {
    const promptTxt = String(overridePrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    if (!promptTxt) return setExpression("curious", "احكي أو اكتب شو بدك، أو اختر ميزانية أو وصفة.");

    const prefs = getPrefs();
    const persona = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const norm = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();

    const liveAns = answerLiveQuestion(norm);
    if (liveAns) {
      setExpression("helpful", liveAns, "", liveAns.slice(0, 36));
      setTxt("aiShoppingStatusText", `💡 ${liveAns}`);
      speakReply(liveAns, fromVoice);
      return;
    }

    const bMatch = norm.match(/(?:ميزاني|معي|بـ|ب)\s*(\d{2,7})/);
    if (bMatch && /ميزاني|معي|اساسي|سله/.test(norm)) {
      window.runSmartBudgetBasket(parseInt(bMatch[1]));
      return;
    }

    const sendBtn = $("aiShoppingSendBtn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "⏳..."; }
    setExpression("thinking", "عم فتش الرفوف وأرتبلك...", "", "جاري التفكير...");
    setTxt("aiShoppingStatusText", "🤖 جاري التحليل...");

    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";

    try {
      if (navigator.onLine === false || !workerUrl) throw new Error("LOCAL");
      const cacheKey = `${prefs.persona}::${activeBranchId}::${norm}::${sessionContext.lastItems.map(x => x.id).join(",")}`;
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
              sessionLastItems: sessionContext.lastItems.slice(0, 5),
              branchName: typeof getBranchName === "function" ? getBranchName(activeBranchId) : "الرئيسي"
            }
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error("BUSY");
        data = json.data || {};
        setCache(cacheKey, data);
      }

      const mapped = (Array.isArray(data.items) ? data.items : []).map(it => {
        const pid = String(it?.id || "").trim();
        const baseId = pid.replace(/_PKG$/, "");
        const pObj = products?.[baseId] || specialOffers?.[pid];
        if (!pObj) return null;
        const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : (parseInt(pObj.stock) || 0);
        if (avail <= 0) return null;
        const qty = Math.min(Math.max(1, parseInt(it?.qty) || 1), avail);
        const unitPrice = getUnitSYP(pid);
        return { id: pid, name: pid.endsWith("_PKG") ? `طرد ${pObj.name}` : pObj.name, qty, unitPrice, lineTotal: unitPrice * qty, thumb: getThumb(pid), reason: it?.reason || "متوفر" };
      }).filter(Boolean);

      let extraHtml = "";
      if (mapped.length > 0 && /وصف|طبخه|سهره|مته|فطور|مناسب/.test(norm)) {
        sessionContext.lastItems = mapped;
        setBadgeCount(mapped.length);
        renderProposalBox(mapped, "اختر المواد التي تريد إضافتها للسلة:");
      } else if (mapped.length > 0) {
        sessionContext.lastItems = mapped;
        let added = 0;
        mapped.forEach(m => {
          const cur = cart[m.id] ? (parseInt(cart[m.id].qty) || 0) : 0;
          const maxSt = typeof getProductStockForBranch === "function" ? getProductStockForBranch(products[m.id.replace(/_PKG$/, "")] || specialOffers[m.id] || {}, activeBranchId) : 99;
          const canAdd = Math.max(0, maxSt - cur);
          const toAdd = Math.min(m.qty, canAdd);
          if (toAdd > 0) { changeQty(m.id, toAdd); added += toAdd; }
        });
        if (added > 0) { haptic([15, 30, 15]); showToast(`🐾 تمت إضافة ${added} مواد للسلة!`); }
        extraHtml = mapped.map(m => `<div style="display:inline-flex; align-items:center; gap:5px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:4px 6px; margin:3px 3px 0 0; font-size:10px;"><img src="${esc(m.thumb)}" onerror="this.src='store-icon.png'" style="width:24px; height:24px; border-radius:4px; object-fit:cover;"><span><b>${esc(m.name)}</b> ×${m.qty}</span></div>`).join("");
      }

      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        setBadgeCount(data.alternatives.length);
        extraHtml += data.alternatives.map(alt => {
          const p = products?.[alt.suggestedId];
          if (!p) return "";
          return `<div style="display:inline-flex; align-items:center; gap:5px; background:var(--card-bg); border:1px solid #ff9800; border-radius:6px; padding:4px 7px; margin:4px 3px 0 0; font-size:10px;"><img src="${esc(getThumb(alt.suggestedId))}" onerror="this.src='store-icon.png'" style="width:24px; height:24px; border-radius:4px; object-fit:cover;"><span>بديل: <b>${esc(p.name)}</b> (${getUnitSYP(alt.suggestedId).toLocaleString()} ل.س)</span><button type="button" onclick="changeQty('${esc(alt.suggestedId)}', 1); showToast('✅ أُضيف البديل');" class="btn" style="width:auto; padding:2px 6px; font-size:9px; background:#ff9800; color:#000;">➕</button></div>`;
        }).filter(Boolean).join("");
      }

      const reply = data.reply || data.answerNote || "تفضّل، شو بتحب نضيف؟";
      setExpression(data.petMood || "happy", reply, extraHtml, reply.slice(0, 36));
      setTxt("aiShoppingStatusText", `🐾 ${persona.name}: ${reply}`);
      speakReply(reply, fromVoice);
    } catch (_) {
      const fb = localFallback(promptTxt);
      if (fb.length > 0) {
        let added = 0;
        fb.forEach(f => {
          const cur = cart[f.id] ? (parseInt(cart[f.id].qty) || 0) : 0;
          const maxSt = typeof getProductStockForBranch === "function" ? getProductStockForBranch(products[f.id], activeBranchId) : 99;
          const addN = Math.min(f.qty, Math.max(0, maxSt - cur));
          if (addN > 0) { changeQty(f.id, addN); added += addN; }
        });
        const msg = added > 0 ? `رتبتلك الطلب مباشرة من المخزون (${added} مواد)!` : `الطلب موجود أو الكمية محدودة بالفرع.`;
        setExpression("helpful", msg, "", msg.slice(0, 36));
        setTxt("aiShoppingStatusText", `🐾 ${msg}`);
        speakReply(msg, fromVoice);
      } else {
        const calm = "صار ضغط لحظي بسيط، جرّب البحث المباشر أو أعد المحاولة بعد قليل.";
        setExpression("helpful", calm, "", "جرّب البحث السريع");
        setTxt("aiShoppingStatusText", `🐾 ${calm}`);
      }
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "✨ تعبئة"; }
    }
  };

  // [المحادثة الصوتية مع المرافق في الزر العائم]
  window.stopVoiceChat = function () {
    voiceLoopActive = false;
    if (recInstance) {
      try { recInstance.stop(); } catch (_) {}
      recInstance = null;
    }
    const btn = $("petLiveVoiceChatBtn");
    if (btn) btn.textContent = "🎤 محادثة صوتية";
  };

  window.startVoiceChatWithPet = function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("⚠️ المتصفح لا يدعم المحادثة الصوتية، يمكنك الكتابة مباشرة.");

    if (voiceLoopActive) {
      window.stopVoiceChat();
      setExpression("happy", "أوقفت المحادثة الصوتية، أنا هنا متى ما احتجتني.");
      return;
    }

    haptic(20);
    voiceLoopActive = true;
    const btn = $("petLiveVoiceChatBtn");
    if (btn) btn.textContent = "⏹️ إيقاف الصوت";

    const rec = new SR();
    recInstance = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setExpression("listening", "عم أسمعك... احكي طلبك أو سؤالك 🎙️", `
      <div style="display:flex; align-items:center; gap:6px; background:rgba(0,230,118,0.12); border:1px solid #00e676; border-radius:6px; padding:5px 7px; margin-top:4px; font-size:10px; color:#00e676; font-weight:bold;">
        <span style="width:8px; height:8px; border-radius:50%; background:#00e676; display:inline-block; animation:pulse 1s infinite;"></span>
        <span>المحادثة الصوتية نشطة — تحدّث الآن</span>
      </div>`, "🎙️ جاري الإنصات...");

    rec.onresult = ev => {
      const spoken = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      voiceLoopActive = false;
      if (btn) btn.textContent = "🎤 محادثة صوتية";
      if (!spoken) return;
      setVal("aiShoppingPromptInput", spoken);
      setVal("petDrawerInput", spoken);
      runAIShoppingAssistant(spoken, true);
    };

    rec.onerror = () => {
      voiceLoopActive = false;
      if (btn) btn.textContent = "🎤 محادثة صوتية";
      setExpression("helpful", "ما سمعتك واضح، اضغط محادثة صوتية وأعد المحاولة.");
    };

    rec.onend = () => {
      if (voiceLoopActive) {
        voiceLoopActive = false;
        if (btn) btn.textContent = "🎤 محادثة صوتية";
      }
    };

    rec.start();
  };

  window.startVoiceShoppingInput = window.startVoiceChatWithPet;

  window.fillHabitCartAI = function () {
    if (!currentUser?.phone) return alert("⚠️ يرجى تسجيل الدخول أولاً لعرض سلة العادة.");
    const orders = Object.values(completedOrdersHistory || {})
      .filter(o => o.customerPhone === currentUser.phone)
      .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || "")).slice(0, 10);
    if (!orders.length) return setExpression("helpful", "لسا ما عندي سجل طلبات كافٍ لترتيب سلة العادة.");

    const freq = {};
    orders.forEach(o => (o.items || []).forEach(it => {
      if (String(it.id || "").startsWith("OFFER_")) return;
      const baseId = it.origId || String(it.id || "").replace(/_PKG$/, "");
      freq[baseId] = (freq[baseId] || 0) + 1;
    }));

    const picks = Object.keys(freq)
      .filter(pid => products?.[pid] && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .sort((a, b) => freq[b] - freq[a]).slice(0, 5)
      .map(pid => ({ id: pid, name: products[pid].name, qty: 1, unitPrice: getUnitSYP(pid), lineTotal: getUnitSYP(pid), thumb: getThumb(pid), reason: `متكرر (${freq[pid]} مرات)` }));

    if (!picks.length) return setExpression("helpful", "أصنافك المعتادة غير متوفرة حالياً في هذا الفرع.");
    setBadgeCount(picks.length);
    renderProposalBox(picks, "🔄 سلة العادة الذكية:");
    setExpression("happy", "جهزتلك الأصناف اللي بتطلبها أكثر شي!");
  };

  function renderPackBar() {
    const assistBox = $("aiSmartAssistantBox");
    if (!assistBox) return;
    let bar = $("petPackBar");
    if (!bar) { bar = document.createElement("div"); bar.id = "petPackBar"; bar.style.marginTop = "6px"; assistBox.appendChild(bar); }
    const deals = [];
    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p || !p.hasPackage || !p.pkgCount || !p.pkgPriceUSD) return;
      const diff = (calcSYP(p.priceUSD || 0) * parseInt(p.pkgCount)) - calcSYP(p.pkgPriceUSD || 0);
      if (diff > 0) deals.push({ pid, name: p.name, pkgPrice: calcSYP(p.pkgPriceUSD || 0), diff, thumb: getThumb(pid) });
    });
    if (!deals.length) { bar.innerHTML = ""; return; }
    const t = deals[0];
    bar.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.4); border-radius:7px; padding:5px 8px; font-size:10px;"><div style="display:flex; align-items:center; gap:6px;"><img src="${esc(t.thumb)}" onerror="this.src='store-icon.png'" style="width:26px; height:26px; border-radius:4px; object-fit:cover;"><span>وفر <b>${t.diff.toLocaleString()} ل.س</b> بطرد <b>${esc(t.name)}</b> (${t.pkgPrice.toLocaleString()} ل.س)</span></div><button type="button" onclick="changeQty('${t.pid}_PKG', 1)" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:var(--gold-color); color:#000;">أضف الطرد</button></div>`;
  }

  function renderFriendlySummary() {
    const btn = $("submitOrderUnifiedBtn");
    if (!btn || !btn.parentNode) return;
    let card = $("petCartSummary");
    if (!card) { card = document.createElement("div"); card.id = "petCartSummary"; card.style.cssText = "background:rgba(0,230,118,0.08); border:1px solid rgba(0,230,118,0.4); border-radius:8px; padding:7px 9px; margin-bottom:8px; font-size:11px;"; btn.parentNode.insertBefore(card, btn); }
    const cnt = Object.values(cart || {}).reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
    card.innerHTML = `<div style="font-weight:bold; color:#00e676; margin-bottom:2px;">🐾 ملخص المرافق قبل الإرسال:</div><div>معك <b>${cnt}</b> مواد، التوصيل <b>${esc($("modalDeliveryFee")?.textContent || "0")} ل.س</b>، النقاط <b>+${esc($("modalCartPoints")?.textContent || "0")}</b>، والمجموع: <b style="color:var(--gold-color);">${esc($("modalCartTotal")?.textContent || "0")} ل.س</b>.</div>`;
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

  // [إمالة ثلاثية الأبعاد + التصاق مغناطيسي بالحواف + اختفاء أثناء التمرير]
  function bindOrbInteractions(orb, root) {
    if (!orb || !root || orb.dataset.v33Bound) return;
    orb.dataset.v33Bound = "1";
    let dragging = false, moved = false, sx = 0, sy = 0, r0 = 14, b0 = 86;

    const onStart = e => {
      const prefs = getPrefs();
      const pt = e.touches ? e.touches[0] : e;
      dragging = !prefs.pinned;
      moved = false;
      sx = pt.clientX; sy = pt.clientY;
      r0 = parseInt(root.style.right || "14", 10);
      b0 = parseInt(root.style.bottom || "86", 10);
      orb.style.transform = "scale(1.06) rotateX(10deg) rotateY(-8deg)";
      haptic(10);
    };

    const onMove = e => {
      const pt = e.touches ? e.touches[0] : e;
      if (!dragging) return;
      const dx = pt.clientX - sx, dy = pt.clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      const maxR = Math.max(8, window.innerWidth - 66);
      const maxB = Math.max(82, window.innerHeight - 95);
      const nr = Math.max(8, Math.min(maxR, r0 - dx));
      const nb = Math.max(82, Math.min(maxB, b0 - dy));
      root.style.right = nr + "px";
      root.style.bottom = nb + "px";
      orb.style.transform = `scale(1.05) rotateX(${Math.max(-14, Math.min(14, -dy * 0.25))}deg) rotateY(${Math.max(-14, Math.min(14, dx * 0.25))}deg)`;
    };

    const onEnd = () => {
      orb.style.transform = "";
      if (!dragging) {
        window.togglePetCollapsed(false);
        return;
      }
      dragging = false;
      if (!moved) {
        window.togglePetCollapsed(false);
        return;
      }
      // التصاق مغناطيسي ناعم لأقرب حافة يمنى أو يسرى
      const curR = parseInt(root.style.right || "14", 10);
      const curB = parseInt(root.style.bottom || "86", 10);
      const midX = window.innerWidth / 2;
      const orbCenterFromLeft = window.innerWidth - curR - 26;
      const snapRight = orbCenterFromLeft >= midX ? 12 : Math.max(12, window.innerWidth - 66);
      root.style.transition = "right 0.22s ease, bottom 0.22s ease";
      root.style.right = snapRight + "px";
      setTimeout(() => { root.style.transition = ""; }, 240);
      savePos(snapRight, curB);
      haptic(12);
    };

    orb.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", moveWrap(onMove), { passive: true });
    window.addEventListener("touchend", onEnd);
    orb.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    window.addEventListener("scroll", () => {
      const prefs = getPrefs();
      if (prefs.hidden || !prefs.collapsed) return;
      root.style.opacity = "0.45";
      clearTimeout(scrollHideTimer);
      scrollHideTimer = setTimeout(() => { root.style.opacity = "1"; }, 550);
    }, { passive: true });
  }

  function moveWrap(fn) { return e => fn(e); }

  function mountV33() {
    const prefs = getPrefs();
    const p = PERSONAS[prefs.persona] || PERSONAS.buddy;
    const assistBox = $("aiSmartAssistantBox");

    if (assistBox && !$("petInlineBox")) {
      const el = document.createElement("div");
      el.id = "petInlineBox";
      el.style.cssText = "background:rgba(0,176,255,0.08); border:1px solid var(--border-color); border-radius:8px; padding:7px 9px; margin-bottom:7px; font-size:11px;";
      el.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; gap:6px;"><div style="display:flex; align-items:center; gap:7px;"><span id="petInlineFace" style="font-size:20px;">${p.baseIcon}</span><span id="petInlineBubble">أهلاً بك! تحدّث أو اكتب طلبك وسأرتبه فوراً 🐾</span></div><div style="display:flex; gap:4px;"><button type="button" onclick="speakReply($('petInlineBubble')?.textContent || '', true)" class="btn" style="width:auto; padding:2px 6px; font-size:10px; background:rgba(0,176,255,0.2); color:#00b0ff;">🔊</button><button id="petRestoreHiddenBtn" type="button" onclick="togglePetHidden(false)" style="display:none; align-items:center; gap:3px; background:var(--gold-color); color:#000; border:none; border-radius:6px; padding:2px 7px; font-size:10px; font-weight:bold; cursor:pointer;">إظهار 3D</button></div></div><div id="petInlineProposalBox"></div>`;
      assistBox.insertBefore(el, assistBox.firstChild);
    }

    if (assistBox && !$("petQuickRow")) {
      const row = document.createElement("div");
      row.id = "petQuickRow";
      row.style.cssText = "display:flex; gap:5px; flex-wrap:wrap; margin-top:6px;";
      row.innerHTML = `
        <button type="button" onclick="fillHabitCartAI()" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color);">🔄 سلة العادة</button>
        <button type="button" onclick="runSmartBudgetBasket(500)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,230,118,0.15); color:#00e676; border:1px solid #00e676;">💰 ميزانية 500</button>
        <button type="button" onclick="runAIShoppingAssistant('جهز لي أغراض متة وسهرة متوفرة', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,176,255,0.15); color:#00b0ff; border:1px solid #00b0ff;">🧉 أغراض متة</button>
        <button type="button" onclick="runAIShoppingAssistant('هل المتجر مفتوح الآن؟', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:var(--card-bg); color:var(--text-color); border:1px solid var(--border-color);">⏰ الدوام الآن؟</button>`;
      assistBox.appendChild(row);
    }

    if (!$("pet3DFloatingRoot")) {
      const css = document.createElement("style");
      css.id = "pet3DCssV33";
      css.textContent = `
        @keyframes petBreath3D { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        #pet3DOrbBtn { width: 52px; height: 52px; border-radius: 50%; border: 2px solid ${p.accent}; font-size: 25px; display: flex; align-items: center; justify-content: center; cursor: grab; animation: petBreath3D 3s ease-in-out infinite; perspective: 500px; }
        #petBadgeCount { position: absolute; top: -4px; left: -4px; min-width: 18px; height: 18px; border-radius: 9px; background: #ff4444; color: #fff; font-size: 10px; font-weight: bold; display: none; align-items: center; justify-content: center; padding: 0 4px; }`;
      document.head.appendChild(css);

      const root = document.createElement("div");
      root.id = "pet3DFloatingRoot";
      root.style.cssText = "position:fixed; bottom:86px; right:14px; z-index:98; transition:opacity 0.2s ease;";
      root.innerHTML = `
        <div id="pet3DDrawerPanel" style="display:none; width:282px; max-width:calc(100vw - 24px); background:var(--card-bg); border:1px solid var(--gold-color); border-radius:12px; padding:9px; margin-bottom:8px; box-shadow:0 12px 26px rgba(0,0,0,0.55);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:6px; flex-wrap:wrap;">
            <b style="font-size:11px; color:var(--gold-color);"><span id="petActiveName">${esc(p.name)}</span></b>
            <div style="display:flex; gap:3px;">
              <button id="petVoiceModeBtn" type="button" onclick="cycleVoiceMode()" style="background:rgba(0,176,255,0.15); border:1px solid #00b0ff; color:#00b0ff; border-radius:6px; font-size:9px; padding:2px 5px; cursor:pointer;">🗣️</button>
              <button id="petPinBtn" type="button" onclick="togglePetPin()" style="background:transparent; border:1px solid var(--border-color); color:var(--text-color); border-radius:6px; font-size:9px; padding:2px 5px; cursor:pointer;" title="تثبيت/تحرير المكان">📍</button>
              <button type="button" onclick="togglePetCollapsed(true)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-color); border-radius:6px; font-size:9px; padding:2px 6px; cursor:pointer;">طي</button>
              <button type="button" onclick="togglePetHidden(true)" style="background:transparent; border:1px solid var(--border-color); color:var(--gray-text); border-radius:6px; font-size:9px; padding:2px 5px; cursor:pointer;">إخفاء</button>
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-bottom:6px;">
            <button type="button" data-persona="buddy" onclick="selectPetPersona('buddy')" class="cat-btn pet-persona-btn" style="padding:3px 7px; font-size:10px;">🐱 ودود</button>
            <button type="button" data-persona="pro" onclick="selectPetPersona('pro')" class="cat-btn pet-persona-btn" style="padding:3px 7px; font-size:10px;">🦅 سريع</button>
            <button type="button" data-persona="saver" onclick="selectPetPersona('saver')" class="cat-btn pet-persona-btn" style="padding:3px 7px; font-size:10px;">🦊 توفير</button>
          </div>
          <div id="petDrawerBubble" style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; padding:6px 8px; font-size:11px; margin-bottom:6px;">أهلاً بك! تحدّث معي صوتياً أو اكتب طلبك وسأرتبه فوراً.</div>
          <div style="display:flex; gap:4px; margin-bottom:5px;">
            <button id="petLiveVoiceChatBtn" type="button" onclick="startVoiceChatWithPet()" class="btn" style="flex:1; padding:5px 7px; font-size:10px; background:rgba(0,230,118,0.18); color:#00e676; border:1px solid #00e676;">🎤 محادثة صوتية</button>
            <button type="button" onclick="fillHabitCartAI()" class="btn" style="width:auto; padding:5px 7px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color);">🔄 عادتي</button>
          </div>
          <div style="display:flex; gap:4px;">
            <input type="text" id="petDrawerInput" class="form-control" style="padding:6px; font-size:11px; flex:1;" placeholder="اكتب طلبك أو سؤالك..." onkeydown="if(event.key==='Enter'){ setVal('aiShoppingPromptInput', this.value); runAIShoppingAssistant(); }">
            <button type="button" onclick="setVal('aiShoppingPromptInput', $('petDrawerInput')?.value || ''); runAIShoppingAssistant();" class="btn" style="width:auto; padding:6px 9px; font-size:11px; background:var(--gold-color); color:#000;">➤</button>
          </div>
          <div id="petDrawerExtra" style="margin-top:6px; max-height:145px; overflow-y:auto;"></div>
        </div>

        <button id="petSmartPillBtn" type="button" onclick="togglePetCollapsed(false)" style="display:none; align-items:center; gap:6px; background:var(--card-bg); color:var(--text-color); border:1.5px solid ${p.accent}; border-radius:20px; padding:6px 11px; font-size:11px; font-weight:bold; cursor:pointer; box-shadow:0 6px 18px rgba(0,0,0,0.45);">
          <span id="petPillFace" style="font-size:16px;">${p.baseIcon}</span>
          <span id="petPillText">تحدّث معي</span>
        </button>

        <div id="pet3DOrbWrap" style="position:relative; display:flex; justify-content:flex-end;">
          <span id="petBadgeCount">0</span>
          <button id="pet3DOrbBtn" type="button" aria-label="المرافق ثلاثي الأبعاد">${p.baseIcon}</button>
        </div>`;
      document.body.appendChild(root);
      bindOrbInteractions($("pet3DOrbBtn"), root);
    }

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

    renderPackBar();
    syncOrbVisuals();
  }

  const _origStore = window.renderStore;
  window.renderStore = function () { if (typeof _origStore === "function") _origStore(); mountV33(); };

  const _origCart = window.renderCartModalItems;
  window.renderCartModalItems = function () { if (typeof _origCart === "function") _origCart(); renderFriendlySummary(); };

  const _origTheme = window.toggleTheme;
  window.toggleTheme = function () { if (typeof _origTheme === "function") _origTheme(); setTimeout(syncOrbVisuals, 60); };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountV33);
  else mountV33();
})();

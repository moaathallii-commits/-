// ============================================================================
// محرك تجربة الزبون بالذكاء الاصطناعي لمتجر معاذ (v30 - Companion & UX)
// - إلغاء الذكاء الاصطناعي من الدفع وفحص شام كاش بالكامل
// - مرافق أليف ناطق (صديق للزبون ومسوق للمتجر مع إمكانية الإخفاء والنطق)
// - صور مصغرة للمنتجات في التوصيات والمعاينات والبدائل
// ============================================================================

(function () {
  const AI_CACHE_KEY = "moaath_ux_cache_v30";
  const AI_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
  let petHidden = localStorage.getItem("moaath_pet_hidden") === "1";
  let pendingVoiceDraft = null;

  // إلغاء أي فحص ذكاء اصطناعي لإشعارات شام كاش
  window.analyzeShamCashReceiptOCR = function () {
    const outBox = $("shamCashOcrResult");
    if (outBox) outBox.innerHTML = "";
  };

  function getProductThumb(id) {
    const baseId = String(id || "").replace(/_PKG$/, "");
    const p = products?.[baseId] || specialOffers?.[id] || {};
    if (String(id || "").endsWith("_PKG") && (p.pkgThumb || p.pkgImage)) {
      return p.pkgThumb || p.pkgImage;
    }
    return (typeof getLockedHighResImage === "function" && getLockedHighResImage(baseId)) || p.thumb || p.image || "store-icon.png";
  }

  function getEffectiveUnitPriceSYP(id) {
    const isW = currentUser?.userType === "wholesale";
    if (String(id || "").startsWith("OFFER_")) {
      const so = specialOffers?.[id];
      if (!so) return 0;
      const usd = (isW && so.wholesaleUSD > 0) ? so.wholesaleUSD : (so.newPriceUSD || 0);
      return calcSYP(usd);
    }
    if (String(id || "").endsWith("_PKG")) {
      const baseId = String(id).replace(/_PKG$/, "");
      const p = products?.[baseId];
      return p ? calcSYP(p.pkgPriceUSD || 0) : 0;
    }
    const p = products?.[id];
    if (!p) return 0;
    const usd = (isW && p.wholesaleUSD > 0) ? p.wholesaleUSD : (p.priceUSD || 0);
    return calcSYP(usd);
  }

  function getAICache(key) {
    try {
      const store = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}");
      const item = store[key];
      if (item && Date.now() - item.time < AI_CACHE_TTL_MS) return item.data;
    } catch (_) {}
    return null;
  }

  function setAICache(key, data) {
    try {
      const store = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}");
      const keys = Object.keys(store);
      if (keys.length > 35) delete store[keys[0]];
      store[key] = { time: Date.now(), data };
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  // [1] فلترة ذكية للكتالوج وتصحيح الأخطاء واللهجات محلياً
  function buildSmartCatalogForPrompt(promptTxt) {
    const normPrompt = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();
    const words = normPrompt.split(/[^a-z0-9\u0600-\u06FF]+/).filter(w => w.length >= 2);
    const list = Object.keys(products || {}).map(pid => {
      const p = products[pid];
      if (!p) return null;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      const normN = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      const normC = (typeof normalizeArabic === "function" ? normalizeArabic(p.category || "") : (p.category || "")).toLowerCase();

      let score = 0;
      words.forEach(w => {
        if (normN.includes(w)) score += 12;
        else if (normC.includes(w)) score += 5;
      });
      if (st > 0) score += 2;

      return {
        id: pid,
        name: p.name || "",
        category: p.category || "",
        stock: st,
        priceSYP: getEffectiveUnitPriceSYP(pid),
        unit: p.unitType || "قطعة",
        hasPkg: !!p.hasPackage,
        pkgCount: p.pkgCount || 0,
        pkgPriceSYP: p.hasPackage ? calcSYP(p.pkgPriceUSD || 0) : 0,
        _score: score
      };
    }).filter(Boolean);

    list.sort((a, b) => b._score - a._score);
    return list.slice(0, 65).map(({ _score, ...rest }) => rest);
  }

  // [10] صور مصغرة في التوصيات الذكية داخل السلة
  window.renderSmartCartRecommendations = function () {
    const box = $("aiCartRecommendationsBox");
    if (!box) return;
    const cartKeys = Object.keys(cart || {});
    if (!cartKeys.length) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    const cartBaseIds = new Set(cartKeys.map(k => cart[k]?.origId || String(k).replace(/_PKG$/, "")));
    const cartCats = new Set(cartKeys.map(k => cart[k]?.category).filter(Boolean));
    const coScores = {};
    const freq = {};

    Object.values(completedOrdersHistory || {}).forEach(ord => {
      const ids = Array.from(new Set(
        (ord?.items || [])
          .filter(it => !String(it.id || "").startsWith("OFFER_"))
          .map(it => it.origId || String(it.id || "").replace(/_PKG$/, ""))
      ));
      ids.forEach(id => { freq[id] = (freq[id] || 0) + 1; });
      if (ids.some(id => cartBaseIds.has(id))) {
        ids.forEach(id => {
          if (!cartBaseIds.has(id)) coScores[id] = (coScores[id] || 0) + 3;
        });
      }
    });

    const picks = Object.keys(products || {})
      .filter(pid => !cartBaseIds.has(pid) && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .map(pid => {
        const p = products[pid];
        let score = (coScores[pid] || 0) * 10 + (freq[pid] || 0);
        if (cartCats.has(p.category)) score += 2;
        return { pid, p, score, isCo: (coScores[pid] || 0) > 0 };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (!picks.length) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    const cards = picks.map(({ pid, p, isCo }) => {
      const img = getProductThumb(pid);
      const price = getEffectiveUnitPriceSYP(pid).toLocaleString();
      return `<div style="min-width:118px; max-width:128px; flex-shrink:0; background:var(--bg-color); border:1px solid var(--gold-color); border-radius:8px; padding:6px; text-align:center; display:flex; flex-direction:column; justify-content:space-between; gap:4px;">
        <img src="${esc(img)}" onerror="this.src='store-icon.png'" style="width:52px; height:52px; object-fit:cover; border-radius:6px; margin:0 auto; border:1px solid var(--border-color);">
        <div style="font-size:9px; color:#00b0ff; font-weight:bold;">${isCo ? "يناسب سلتك" : "الأكثر طلباً"}</div>
        <div style="font-size:10px; font-weight:bold; color:var(--text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(p.name)}">${esc(p.name)}</div>
        <div style="font-size:10px; color:var(--success-color); font-weight:bold;">${price} ل.س</div>
        <button type="button" onclick="changeQty('${pid}', 1)" class="btn" style="padding:3px 6px; font-size:10px; background:linear-gradient(45deg,#D4AF37,#00e676); color:#000;">➕ أضف</button>
      </div>`;
    }).join("");

    box.style.display = "block";
    box.innerHTML = `<div style="background:rgba(0,176,255,0.06); border:1px dashed #00b0ff; border-radius:8px; padding:7px;">
      <div style="font-size:11px; font-weight:bold; color:#00b0ff; margin-bottom:6px;">🐾 اقتراحات بندق المصورة لسلتك:</div>
      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:2px;">${cards}</div>
    </div>`;
  };

  // [11] نطق الردود بلطف عند الطلب أو عند الإدخال الصوتي
  function speakCompanionText(txt) {
    try {
      if (!("speechSynthesis" in window) || !txt) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(txt);
      utter.lang = "ar-SA";
      utter.rate = 1.02;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  function updatePetCompanionUI(mood = "happy", message = "", extraHtml = "") {
    const moodEmoji = { happy: "🐱", excited: "😺", helpful: "🐾", curious: "😸" }[mood] || "🐱";
    setTxt("petAvatarEmoji", moodEmoji);
    if (message) setTxt("petSpeechBubble", message);
    const extraEl = $("petCompanionExtra");
    if (extraEl) extraEl.innerHTML = extraHtml;
  }

  // [2, 3, 4, 8, 9] معالجة طلب الزبون أو سؤاله أو ميزانيته أو وصفته مع معاينة واضحة
  window.runAIShoppingAssistant = async function (customPrompt = null, autoSpeak = false) {
    const promptTxt = String(customPrompt ?? ($("aiShoppingPromptInput")?.value || "")).trim();
    if (!promptTxt) {
      updatePetCompanionUI("curious", "أنا بندق! اكتب شو بدك أو اسألني عن الأسعار والدوام أو حدد ميزانيتك.");
      return;
    }
    if (navigator.onLine === false) {
      updatePetCompanionUI("curious", "يبدو أن الاتصال بالإنترنت مقطوع حالياً، جرّب تصفح الأصناف مباشرة.");
      return;
    }

    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) {
      return alert("⚠️ يرجى ضبط رابط وسيط الذكاء الاصطناعي في تبويب الإعدادات والنظام.");
    }

    const sendBtn = $("aiShoppingSendBtn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "⏳..."; }
    updatePetCompanionUI("curious", "لحظة... عم فتش الرفوف وأحسبلك الأنسب 🐾");
    setTxt("aiShoppingStatusText", "🤖 جاري التحليل...");

    const storeMeta = {
      isStoreOpen: typeof isGlobalStoreOpenNow === "function" ? isGlobalStoreOpenNow() : true,
      hours: workHoursSettings,
      branchName: typeof getBranchName === "function" ? getBranchName(activeBranchId) : "الرئيسي",
      userType: currentUser?.userType || "retail"
    };

    const cacheKey = `${activeBranchId}::${currentUser?.userType || "retail"}::${normalizeArabic(promptTxt).toLowerCase()}`;
    let data = getAICache(cacheKey);

    try {
      if (!data) {
        const smartCatalog = buildSmartCatalogForPrompt(promptTxt);
        const currentCartArr = Object.values(cart || {}).map(c => ({ id: c.id, name: c.name, qty: c.qty }));
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "companion_shop",
            prompt: promptTxt,
            catalog: smartCatalog,
            currentCart: currentCartArr,
            storeMeta
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "تعذر الحصول على رد");
        data = json.data || {};
        setAICache(cacheKey, data);
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const validSuggestions = rawItems
        .map(it => {
          const pid = String(it?.id || "").trim();
          const baseId = pid.replace(/_PKG$/, "");
          const pObj = products?.[baseId] || specialOffers?.[pid];
          if (!pObj) return null;
          const avail = typeof getProductStockForBranch === "function" ? getProductStockForBranch(pObj, activeBranchId) : (parseInt(pObj.stock) || 0);
          if (avail <= 0) return null;
          const qty = Math.min(Math.max(1, parseInt(it?.qty) || 1), avail);
          const unitPrice = getEffectiveUnitPriceSYP(pid);
          return {
            id: pid,
            name: pid.endsWith("_PKG") ? `طرد ${pObj.name}` : pObj.name,
            qty,
            unitPrice,
            lineTotal: unitPrice * qty,
            thumb: getProductThumb(pid)
          };
        })
        .filter(Boolean);

      // إذا كان الطلب إضافة مباشرة قصيرة نضيفه فوراً، وإذا كان ميزانية أو وصفة أو صوتاً نعرض بطاقة تأكيد قابلة للتعديل
      const isBudgetOrRecipe = /ميزاني|فلوس|معي|وصف|طبخه|سهره|مته|فطور/i.test(normalizeArabic(promptTxt));

      if (validSuggestions.length > 0 && !isBudgetOrRecipe && !pendingVoiceDraft) {
        let addedCount = 0;
        validSuggestions.forEach(s => {
          const cur = cart[s.id] ? (parseInt(cart[s.id].qty) || 0) : 0;
          const maxSt = typeof getProductStockForBranch === "function"
            ? getProductStockForBranch(products[s.id.replace(/_PKG$/, "")] || specialOffers[s.id] || {}, activeBranchId)
            : 99;
          const canAdd = Math.max(0, maxSt - cur);
          const toAdd = Math.min(s.qty, canAdd);
          if (toAdd > 0) { changeQty(s.id, toAdd); addedCount += toAdd; }
        });
        if (addedCount > 0) showToast(`🐾 أضاف بندق ${addedCount} مواد إلى سلتك!`);
      }

      const replyText = data.reply || data.answerNote || "تفضّل، شو بتحب نضيف أو نرتب اليوم؟";
      const noteText = data.answerNote && data.answerNote !== replyText ? `<div style="color:#00e676; font-weight:bold; margin-bottom:4px;">💡 ${esc(data.answerNote)}</div>` : "";

      let previewHtml = noteText;
      if (validSuggestions.length > 0 && (isBudgetOrRecipe || pendingVoiceDraft)) {
        const sumSYP = validSuggestions.reduce((a, b) => a + b.lineTotal, 0);
        const rows = validSuggestions.map((s, idx) => `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:5px 7px; margin-bottom:4px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; flex:1; margin:0;">
              <input type="checkbox" class="ai-draft-cb" data-idx="${idx}" checked style="width:15px; height:15px;">
              <img src="${esc(s.thumb)}" onerror="this.src='store-icon.png'" style="width:32px; height:32px; border-radius:5px; object-fit:cover;">
              <div>
                <div style="font-size:11px; font-weight:bold;">${esc(s.name)}</div>
                <div style="font-size:10px; color:var(--gray-text);">${s.qty} × ${s.unitPrice.toLocaleString()} = <b style="color:var(--gold-color);">${s.lineTotal.toLocaleString()} ل.س</b></div>
              </div>
            </label>
          </div>
        `).join("");

        window._latestAIProposal = validSuggestions;
        previewHtml += `
          <div style="background:rgba(212,175,55,0.08); border:1px solid var(--gold-color); border-radius:8px; padding:7px; margin-top:6px;">
            <div style="font-size:11px; font-weight:bold; color:var(--gold-color); margin-bottom:5px;">🛒 القائمة المقترحة (المجموع: ${sumSYP.toLocaleString()} ل.س) — اختر ما يناسبك:</div>
            ${rows}
            <button type="button" onclick="confirmAIProposalToCart()" class="btn" style="margin-top:5px; padding:6px; font-size:11px; background:linear-gradient(45deg,#00e676,#00b0ff); color:#000;">✅ إضافة المحدد إلى السلة</button>
          </div>`;
      }

      // [4] بدائل مصورة عند نفاد الصنف
      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        const altCards = data.alternatives.map(alt => {
          const p = products?.[alt.suggestedId];
          if (!p) return "";
          const img = getProductThumb(alt.suggestedId);
          const price = getEffectiveUnitPriceSYP(alt.suggestedId).toLocaleString();
          return `<div style="display:inline-flex; align-items:center; gap:6px; background:var(--card-bg); border:1px solid #ff9800; border-radius:8px; padding:5px 8px; margin:4px 4px 0 0;">
            <img src="${esc(img)}" onerror="this.src='store-icon.png'" style="width:32px; height:32px; border-radius:5px; object-fit:cover;">
            <div style="font-size:10px; text-align:right;">
              <div><b>${esc(p.name)}</b> (${price} ل.س)</div>
              <small style="color:var(--gray-text);">${esc(alt.reason || "بديل متوفر")}</small>
            </div>
            <button type="button" onclick="changeQty('${esc(alt.suggestedId)}', 1); showToast('✅ تمت إضافة البديل');" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:#ff9800; color:#000;">➕</button>
          </div>`;
        }).filter(Boolean).join("");
        if (altCards) previewHtml += `<div style="margin-top:6px;">${altCards}</div>`;
      }

      pendingVoiceDraft = null;
      updatePetCompanionUI(data.petMood || "happy", replyText, previewHtml);
      setTxt("aiShoppingStatusText", `🐾 بندق: ${replyText}`);
      if (autoSpeak) speakCompanionText(replyText);
    } catch (err) {
      pendingVoiceDraft = null;
      updatePetCompanionUI("curious", "صار عندي خربطة بسيطة بالاتصال، جرّب مرة ثانية بعد شوي 🐾");
      setTxt("aiShoppingStatusText", `❌ ${err.message}`);
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "✨ تعبئة"; }
    }
  };

  window.confirmAIProposalToCart = function () {
    const list = window._latestAIProposal || [];
    const cbs = document.querySelectorAll(".ai-draft-cb");
    let added = 0;
    cbs.forEach(cb => {
      if (!cb.checked) return;
      const idx = parseInt(cb.getAttribute("data-idx"));
      const item = list[idx];
      if (!item) return;
      changeQty(item.id, item.qty);
      added++;
    });
    if (added > 0) {
      showToast(`✅ تمت إضافة ${added} أصناف إلى سلتك!`);
      updatePetCompanionUI("excited", "يا سلام! صارت السلة أحلى، بدك شي تاني قبل ما نكمل؟ 🐾");
    }
  };

  // [9] تحسين الإدخال الصوتي مع تأكيد بصري ونطق
  window.startVoiceShoppingInput = function () {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return alert("⚠️ التعرف الصوتي غير مدعوم في هذا المتصفح، اكتب طلبك مباشرة.");
    const rec = new SpeechRec();
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    updatePetCompanionUI("curious", "عم أسمعك... احكي شو بدك 🎤");
    setTxt("aiShoppingStatusText", "🎤 جاري الاستماع...");
    rec.onresult = ev => {
      const spoken = ev?.results?.[0]?.[0]?.transcript || "";
      if (spoken) {
        pendingVoiceDraft = spoken;
        setVal("aiShoppingPromptInput", spoken);
        runAIShoppingAssistant(spoken, true);
      }
    };
    rec.onerror = () => {
      updatePetCompanionUI("curious", "ما سمعتك واضح، جرّب تكتب طلبك أو تحكي مرة تانية.");
      setTxt("aiShoppingStatusText", "⚠️ تعذر التقاط الصوت.");
    };
    rec.start();
  };

  // [5] سلة العادة الذكية حسب تكرار الشراء مع صور مصغرة
  window.fillHabitCartAI = function () {
    if (!currentUser?.phone) return alert("⚠️ يرجى تسجيل الدخول أولاً لعرض سلة العادة.");
    const myOrds = Object.values(completedOrdersHistory || {})
      .filter(o => o.customerPhone === currentUser.phone)
      .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""))
      .slice(0, 8);

    if (!myOrds.length) {
      updatePetCompanionUI("helpful", "لسا ما عندك طلبات سابقة كافية، بس رح أتعلم عاداتك من أول طلباتك!");
      return;
    }

    const counts = {};
    myOrds.forEach(o => {
      (o.items || []).forEach(it => {
        if (String(it.id || "").startsWith("OFFER_")) return;
        const baseId = it.origId || String(it.id || "").replace(/_PKG$/, "");
        counts[baseId] = (counts[baseId] || 0) + 1;
      });
    });

    const regularIds = Object.keys(counts)
      .filter(pid => products?.[pid] && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 5);

    if (!regularIds.length) {
      updatePetCompanionUI("curious", "الأصناف اللي بتطلبها عادةً غير متوفرة حالياً بهذا الفرع.");
      return;
    }

    let added = 0;
    regularIds.forEach(pid => {
      if (!cart[pid]) { changeQty(pid, 1); added++; }
    });
    const msg = added > 0 ? `رتبتلك ${added} أصناف من مشترياتك المعتادة بالسلة 🐾` : "أغراضك المعتادة موجودة بالسلة مسبقاً!";
    updatePetCompanionUI("happy", msg);
    showToast(`🔄 ${msg}`);
  };

  // [6] مقارن سريع بين المفرد والطرد / العرض الخاص
  function renderPackVsSingleHint() {
    const assistBox = $("aiSmartAssistantBox");
    if (!assistBox) return;
    let hintBox = $("aiPackCompareHint");
    if (!hintBox) {
      hintBox = document.createElement("div");
      hintBox.id = "aiPackCompareHint";
      hintBox.style.cssText = "margin-top:6px; font-size:10px;";
      assistBox.appendChild(hintBox);
    }

    const hints = [];
    Object.keys(products || {}).forEach(pid => {
      const p = products[pid];
      if (!p || !p.hasPackage || !p.pkgCount || !p.pkgPriceUSD) return;
      const singleSYP = calcSYP(p.priceUSD || 0);
      const pkgTotalSYP = calcSYP(p.pkgPriceUSD || 0);
      const singlesCostForPkg = singleSYP * parseInt(p.pkgCount);
      const diff = singlesCostForPkg - pkgTotalSYP;
      if (diff > 0) {
        hints.push({ pid, name: p.name, pkgCount: p.pkgCount, pkgTotalSYP, diff, thumb: getProductThumb(pid) });
      }
    });

    if (!hints.length) { hintBox.innerHTML = ""; return; }
    const h = hints[0];
    hintBox.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.35); border-radius:6px; padding:5px 8px;">
      <div style="display:flex; align-items:center; gap:6px;">
        <img src="${esc(h.thumb)}" onerror="this.src='store-icon.png'" style="width:28px; height:28px; border-radius:4px; object-fit:cover;">
        <span>💡 <b>وفر مع بندق:</b> طرد (${esc(h.name)}) بـ <b>${h.pkgTotalSYP.toLocaleString()} ل.س</b> يوفر عليك <b>${h.diff.toLocaleString()} ل.س</b> مقارنة بالمفرد.</span>
      </div>
      <button type="button" onclick="changeQty('${h.pid}_PKG', 1)" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:var(--gold-color); color:#000;">أضف الطرد</button>
    </div>`;
  }

  // [7] ملخص فاتورة ودّي ومفهوم قبل الإرسال النهائي داخل السلة
  function renderFriendlyOrderSummary() {
    const cartModalContent = document.querySelector("#cartModal .modal-content");
    if (!cartModalContent) return;
    let sumCard = $("aiFriendlyOrderSummaryCard");
    if (!sumCard) {
      sumCard = document.createElement("div");
      sumCard.id = "aiFriendlyOrderSummaryCard";
      sumCard.style.cssText = "background:rgba(0,230,118,0.07); border:1px solid rgba(0,230,118,0.4); border-radius:8px; padding:7px 9px; margin-bottom:8px; font-size:11px;";
      const submitBtn = $("submitOrderUnifiedBtn");
      if (submitBtn && submitBtn.parentNode) submitBtn.parentNode.insertBefore(sumCard, submitBtn);
    }

    const totalTxt = $("modalCartTotal")?.textContent || "0";
    const feeTxt = $("modalDeliveryFee")?.textContent || "0";
    const ptsTxt = $("modalCartPoints")?.textContent || "0";
    const itemsCount = Object.values(cart || {}).reduce((a, b) => a + (parseInt(b.qty) || 0), 0);

    sumCard.innerHTML = `
      <div style="font-weight:bold; color:#00e676; margin-bottom:3px;">🐾 ملخص بندق الودّي قبل الإرسال:</div>
      <div style="color:var(--text-color); line-height:1.5;">
        معك <b>${itemsCount}</b> مواد، التوصيل <b>${esc(feeTxt)} ل.س</b>، وربحك <b>+${esc(ptsTxt)} نقطة</b>. الإجمالي النهائي: <b style="color:var(--gold-color);">${esc(totalTxt)} ل.س</b>.
      </div>`;
  }

  // [4 إضافي] مساعدة ذكية للعنوان ونقطة التسليم في نافذة الملف الشخصي
  window.assistAddressWithAI = async function () {
    const rawAddr = ($("regAddress")?.value || "").trim();
    if (!rawAddr) return alert("⚠️ اكتب وصفاً مبدئياً لمكانك أولاً (مثلاً: قرب الجامع أو الحي الشمالي).");
    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");

    showToast("⏳ جاري تنسيق العنوان للسائق...");
    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "address_helper",
          prompt: rawAddr,
          storeMeta: { regions: Object.keys(deliveryFees || {}) }
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "تعذر تنسيق العنوان");
      const d = json.data || {};
      if (d.formattedAddress) setVal("regAddress", d.formattedAddress);
      if (d.suggestedRegion && deliveryFees?.[d.suggestedRegion] && $("regRegion")) {
        setVal("regRegion", d.suggestedRegion);
      }
      showToast("✅ تم تنسيق العنوان بوضوح للسائق!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // أدوات الإدارة (فواتير الموردين، تذكير الديون، الملخص اليومي)
  window.runSupplierInvoiceOCR = async function () {
    const file = $("aiSupplierInvoiceFile")?.files?.[0];
    const outBox = $("aiSupplierInvoiceResult");
    if (!file || !outBox) return;
    const workerUrl = getEffectiveAIWorkerUrl();
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
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل قراءة الفاتورة");
      const items = Array.isArray(json.data?.items) ? json.data.items : [];
      window._lastParsedSupplierItems = items;
      if (!items.length) { outBox.innerHTML = `<div style="color:#ff9800; font-size:11px;">⚠️ لم تظهر أصناف واضحة.</div>`; return; }
      outBox.innerHTML = `<table class="tbl-clean"><thead><tr><th style="text-align:right;">الصنف</th><th>الكمية</th><th>التكلفة</th><th>إضافة</th></tr></thead><tbody>` +
        items.map((it, idx) => `<tr><td style="text-align:right;">${esc(it.name)}</td><td>${parseInt(it.qty) || 1}</td><td>${(Number(it.unitCost) || 0).toLocaleString()}</td><td><button type="button" onclick="applyParsedInvoiceItemToForm(${idx})" class="btn" style="padding:2px 6px; font-size:10px; width:auto;">⬇️</button></td></tr>`).join("") +
        `</tbody></table>`;
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
    const workerUrl = getEffectiveAIWorkerUrl();
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
    const workerUrl = getEffectiveAIWorkerUrl();
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

  window.togglePetCompanionVisibility = function () {
    petHidden = !petHidden;
    localStorage.setItem("moaath_pet_hidden", petHidden ? "1" : "0");
    const card = $("petCompanionCard");
    const showBtn = $("petShowMiniBtn");
    if (card) card.style.display = petHidden ? "none" : "block";
    if (showBtn) showBtn.style.display = petHidden ? "inline-flex" : "none";
  };

  function injectUXCompanionUI() {
    const assistBox = $("aiSmartAssistantBox");
    if (assistBox && !$("petCompanionCard")) {
      const wrap = document.createElement("div");
      wrap.innerHTML = `
        <button id="petShowMiniBtn" type="button" onclick="togglePetCompanionVisibility()" style="display:${petHidden ? "inline-flex" : "none"}; align-items:center; gap:5px; background:var(--card-bg); color:var(--gold-color); border:1px solid var(--gold-color); border-radius:14px; padding:4px 10px; font-size:10px; font-weight:bold; cursor:pointer; margin-bottom:6px;">
          🐱 إظهار صديق المتجر (بندق)
        </button>
        <div id="petCompanionCard" style="display:${petHidden ? "none" : "block"}; background:linear-gradient(135deg,rgba(212,175,55,0.12),rgba(0,176,255,0.08)); border:1px solid var(--gold-color); border-radius:10px; padding:8px 10px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span id="petAvatarEmoji" style="font-size:24px; line-height:1;">🐱</span>
              <div>
                <div style="font-size:11px; font-weight:bold; color:var(--gold-color);">بندق — صديقك في متجر معاذ</div>
                <div id="petSpeechBubble" style="font-size:11px; color:var(--text-color);">أهلاً بك! اسألني عن الأسعار، قولي ميزانيتك، أو اطلب أغراض وصفتك 🐾</div>
              </div>
            </div>
            <div style="display:flex; gap:4px;">
              <button type="button" onclick="speakCompanionText($('petSpeechBubble')?.textContent || '')" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:rgba(0,176,255,0.2); color:#00b0ff;" title="استمع لرد بندق">🔊</button>
              <button type="button" onclick="togglePetCompanionVisibility()" class="btn" style="width:auto; padding:3px 7px; font-size:10px; background:transparent; color:var(--gray-text); border:1px solid var(--border-color);" title="إخفاء">✕</button>
            </div>
          </div>
          <div id="petCompanionExtra" style="margin-top:4px; font-size:10px;"></div>
        </div>`;
      assistBox.insertBefore(wrap, assistBox.firstChild);
    }

    if (assistBox && !$("aiQuickChipsBar")) {
      const chips = document.createElement("div");
      chips.id = "aiQuickChipsBar";
      chips.style.cssText = "display:flex; gap:5px; flex-wrap:wrap; margin-top:6px;";
      chips.innerHTML = `
        <button type="button" onclick="fillHabitCartAI()" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color);">🔄 سلة العادة</button>
        <button type="button" onclick="runAIShoppingAssistant('معي 500 ل.س، اقترح لي سلة أساسيات متوفرة', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,230,118,0.15); color:#00e676; border:1px solid #00e676;">💰 ميزانية 500 ل.س</button>
        <button type="button" onclick="runAIShoppingAssistant('جهز لي أغراض متة وسهرة متوفرة', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,176,255,0.15); color:#00b0ff; border:1px solid #00b0ff;">🧉 أغراض متة وسهرة</button>
        <button type="button" onclick="runAIShoppingAssistant('هل المتجر مفتوح الآن وما هي مواعيد الدوام؟', false)" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:var(--card-bg); color:var(--text-color); border:1px solid var(--border-color);">⏰ الدوام الآن؟</button>
      `;
      assistBox.appendChild(chips);
    }

    const addrInput = $("regAddress");
    if (addrInput && addrInput.parentNode && !$("aiAddressHelperBtn")) {
      const btn = document.createElement("button");
      btn.id = "aiAddressHelperBtn";
      btn.type = "button";
      btn.className = "btn";
      btn.style.cssText = "margin-top:5px; width:auto; padding:4px 9px; font-size:10px; background:rgba(0,176,255,0.16); color:#00b0ff; border:1px solid #00b0ff;";
      btn.textContent = "📍 تنسيق العنوان بوضوح للسائق";
      btn.onclick = window.assistAddressWithAI;
      addrInput.parentNode.appendChild(btn);
    }

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

    renderPackVsSingleHint();
  }

  const _origRenderCartModalItems = window.renderCartModalItems;
  window.renderCartModalItems = function () {
    if (typeof _origRenderCartModalItems === "function") _origRenderCartModalItems();
    renderFriendlyOrderSummary();
  };

  const _origRenderStore = window.renderStore;
  window.renderStore = function () {
    if (typeof _origRenderStore === "function") _origRenderStore();
    injectUXCompanionUI();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUXCompanionUI);
  } else {
    injectUXCompanionUI();
  }
})();

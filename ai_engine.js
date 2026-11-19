// ============================================================================
// محرك الذكاء الاصطناعي المستقل لمتجر معاذ (v29 AI Cloud)
// يغطي التحسينات الـ 10 بالكامل دون تعديل الكود الأساسي في index.html
// ============================================================================

(function () {
  const AI_CACHE_KEY = "moaath_ai_cache_v29";
  const AI_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // ساعتان للطلبات المتكررة

  // --- [تحسين 9] الذاكرة المؤقتة للطلبات المتكررة ---
  function getAICache(key) {
    try {
      const store = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}");
      const entry = store[key];
      if (entry && Date.now() - entry.time < AI_CACHE_TTL_MS) return entry.data;
    } catch (_) {}
    return null;
  }

  function setAICache(key, data) {
    try {
      const store = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}");
      const keys = Object.keys(store);
      if (keys.length > 40) delete store[keys[0]];
      store[key] = { time: Date.now(), data };
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  // --- [تحسين 1] فلترة الكتالوج ذكياً لتجاوز قيد الـ 120 صنفاً ---
  function buildSmartFilteredCatalog(promptTxt) {
    const normPrompt = (typeof normalizeArabic === "function" ? normalizeArabic(promptTxt) : promptTxt).toLowerCase();
    const tokens = normPrompt.split(/\s+/).filter(w => w.length >= 2);
    const allIds = Object.keys(window.products || {});

    const scored = allIds.map(pid => {
      const p = products[pid];
      if (!p) return null;
      const st = typeof getProductStockForBranch === "function" ? getProductStockForBranch(p, activeBranchId) : (parseInt(p.stock) || 0);
      const normName = (typeof normalizeArabic === "function" ? normalizeArabic(p.name || "") : (p.name || "")).toLowerCase();
      const normCat = (typeof normalizeArabic === "function" ? normalizeArabic(p.category || "") : (p.category || "")).toLowerCase();

      let score = 0;
      tokens.forEach(t => {
        if (normName.includes(t)) score += 10;
        else if (normCat.includes(t)) score += 4;
      });
      if (st > 0) score += 1;

      return {
        id: pid,
        name: p.name || "",
        category: p.category || "",
        stock: st,
        priceSYP: typeof calcSYP === "function" ? calcSYP(p.priceUSD || 0) : 0,
        unit: p.unitType || "قطعة",
        _score: score
      };
    }).filter(Boolean);

    // نأخذ أعلى 60 صنفاً صلة بالطلب (بما فيها غير المتوفرة لاقتراح البدائل)
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 60).map(({ _score, ...item }) => item);
  }

  // --- [تحسين 4 و 5 و 7 و 9] ترقية مساعد التسوق الذكي (إضافة/تعديل/حذف + بدائل + وصفات + كاش) ---
  window.runAIShoppingAssistant = async function () {
    const promptTxt = ($("aiShoppingPromptInput")?.value || "").trim();
    if (!promptTxt) return alert("⚠️ اكتب أو تحدّث بما تريد إضافته أو تعديله في السلة.");
    if (navigator.onLine === false) return alert("⚠️ المساعد الذكي يتطلب اتصالاً بالإنترنت.");

    const workerUrl = typeof getEffectiveAIWorkerUrl === "function" ? getEffectiveAIWorkerUrl() : "";
    if (!workerUrl) return alert("⚠️ يرجى ضبط رابط وسيط الذكاء الاصطناعي في تبويب الإعدادات والنظام.");

    const sendBtn = $("aiShoppingSendBtn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "⏳..."; }
    setTxt("aiShoppingStatusText", "🤖 جاري تحليل طلبك ومطابقته مع المخزون...");

    const currentCartArr = Object.values(cart || {}).map(c => ({ id: c.id, name: c.name, qty: c.qty }));
    const cacheKey = `${activeBranchId}::${normalizeArabic(promptTxt).toLowerCase()}`;

    try {
      let data = null;
      const isSimpleAdd = currentCartArr.length === 0 && !/احذف|شيل|بدل|غير|عدل|وصفه|طبخه|ميزانيه/i.test(normalizeArabic(promptTxt));

      if (isSimpleAdd) {
        data = getAICache(cacheKey);
      }

      if (!data) {
        const smartCatalog = buildSmartFilteredCatalog(promptTxt);
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "cart_assistant",
            prompt: promptTxt,
            catalog: smartCatalog,
            currentCart: currentCartArr
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل استجابة المساعد الذكي");
        data = json.data || {};
        if (isSimpleAdd && (data.items?.length || data.actions?.length)) {
          setAICache(cacheKey, data);
        }
      }

      let changesCount = 0;
      const actions = Array.isArray(data.actions) && data.actions.length
        ? data.actions
        : (Array.isArray(data.items) ? data.items.map(i => ({ type: "add", id: i.id, qty: i.qty })) : []);

      actions.forEach(act => {
        const pid = String(act?.id || "").trim();
        const qty = Math.max(1, parseInt(act?.qty) || 1);
        if (!pid || !products[pid]) return;

        const avail = getProductStockForBranch(products[pid], activeBranchId);
        const curQty = cart[pid] ? (parseInt(cart[pid].qty) || 0) : 0;

        if (act.type === "remove") {
          if (curQty > 0) { changeQty(pid, -curQty); changesCount++; }
        } else if (act.type === "set") {
          const target = Math.min(qty, avail);
          if (target !== curQty) { changeQty(pid, target - curQty); changesCount++; }
        } else {
          const maxAdd = Math.max(0, avail - curQty);
          const actualAdd = Math.min(qty, maxAdd);
          if (actualAdd > 0) { changeQty(pid, actualAdd); changesCount++; }
        }
      });

      const statusEl = $("aiShoppingStatusText");
      const replyMsg = data.reply || (changesCount > 0 ? `تم تحديث السلة بنجاح (${changesCount} عمليات).` : "لم يتم العثور على أصناف مطابقة متوفرة حالياً.");
      let html = `<div>✅ ${esc(replyMsg)}</div>`;

      // عرض البدائل المقترحة عند نفاد الصنف
      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        const altBtns = data.alternatives.map(alt => {
          const p = products[alt.suggestedId];
          if (!p) return "";
          const price = calcSYP(p.priceUSD || 0).toLocaleString();
          return `<button type="button" onclick="changeQty('${esc(alt.suggestedId)}', 1); showToast('✅ تمت إضافة البديل للسلة');" class="btn" style="width:auto; padding:3px 8px; font-size:10px; margin:3px 2px 0 0; background:#ff9800; color:#000;">➕ بديل: ${esc(p.name)} (${price} ل.س)</button>`;
        }).filter(Boolean).join("");
        if (altBtns) html += `<div style="margin-top:4px;">${altBtns}</div>`;
      }

      if (statusEl) statusEl.innerHTML = html;
      if (changesCount > 0) showToast("🤖 تم تحديث سلتك عبر المساعد الذكي!");
    } catch (err) {
      setTxt("aiShoppingStatusText", `❌ خطأ: ${err.message}`);
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "✨ تعبئة"; }
    }
  };

  // --- [تحسين 6] زر "سلة العادة" (آخر 5 طلبات للزبون) ---
  window.fillHabitCartAI = function () {
    if (!currentUser?.phone) return alert("⚠️ يرجى تسجيل الدخول أولاً لاستخدام سلة العادة.");
    const myOrds = Object.values(completedOrdersHistory || {})
      .filter(o => o.customerPhone === currentUser.phone)
      .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""))
      .slice(0, 5);

    if (!myOrds.length) return showToast("ℹ️ لا توجد طلبات سابقة كافية لحساب سلتك المعتادة بعد.", true);

    const freq = {};
    myOrds.forEach(o => {
      (o.items || []).forEach(it => {
        if (String(it.id || "").startsWith("OFFER_")) return;
        const baseId = it.origId || String(it.id || "").replace(/_PKG$/, "");
        freq[baseId] = (freq[baseId] || 0) + 1;
      });
    });

    const topIds = Object.keys(freq)
      .filter(pid => products[pid] && getProductStockForBranch(products[pid], activeBranchId) > 0)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 6);

    if (!topIds.length) return showToast("⚠️ الأصناف المعتادة غير متوفرة حالياً في هذا الفرع.", true);

    let added = 0;
    topIds.forEach(pid => {
      if (!cart[pid]) { changeQty(pid, 1); added++; }
    });
    showToast(added > 0 ? `🔄 تمت إضافة ${added} أصناف من مشترياتك المعتادة للسلة!` : "✅ أصنافك المعتادة موجودة بالفعل في السلة.");
  };

  // --- [تحسين 2] تعزيز كشف تكرار إشعارات شام كاش عبر جميع الجداول ---
  const origShamCashOCR = window.analyzeShamCashReceiptOCR;
  window.analyzeShamCashReceiptOCR = async function () {
    if (typeof origShamCashOCR === "function") {
      await origShamCashOCR();
    }
    const txRef = window.latestShamCashOcrMeta?.txRef;
    if (!txRef) return;
    const matchRef = o => String(o?.shamCashTxRef || "").includes(txRef) || String(o?.notes || "").includes(txRef);
    const dupInReadyOrDispatched =
      Object.values(window.readyOrders || {}).some(matchRef) ||
      Object.values(window.dispatchedOrders || {}).some(matchRef);

    if (dupInReadyOrDispatched && $("shamCashOcrResult")) {
      $("shamCashOcrResult").innerHTML = `<div style="background:rgba(255,68,68,0.18); border:1px solid #ff4444; color:#ff4444; padding:6px; border-radius:6px; font-weight:bold;">🚨 تحذير أمني: رقم العملية (${esc(txRef)}) مستخدم مسبقاً في فاتورة قيد التجهيز أو التوصيل!</div>` + $("shamCashOcrResult").innerHTML;
    }
  };

  // --- [تحسين 3] قارئ فواتير الموردين الورقية بالكاميرا (OCR) ---
  window.runSupplierInvoiceOCR = async function () {
    const file = $("aiSupplierInvoiceFile")?.files?.[0];
    const outBox = $("aiSupplierInvoiceResult");
    if (!file || !outBox) return;
    const workerUrl = getEffectiveAIWorkerUrl();
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");

    outBox.innerHTML = `<div style="color:#00b0ff; font-size:11px;">⏳ جاري قراءة الفاتورة واستخراج الأصناف والأسعار...</div>`;
    try {
      const b64 = await fileToBase64Clean(file);
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "supplier_invoice_ocr", imageBase64: b64, imageMimeType: file.type || "image/jpeg" })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل قراءة الفاتورة");

      const d = json.data || {};
      const items = Array.isArray(d.items) ? d.items : [];
      if (!items.length) {
        outBox.innerHTML = `<div style="color:#ff9800; font-size:11px;">⚠️ لم يتم استخراج أصناف واضحة من الصورة، جرّب تصويرها بإضاءة أوضح.</div>`;
        return;
      }

      window._lastParsedSupplierItems = items;
      const rows = items.map((it, idx) => `
        <tr>
          <td style="text-align:right;">${esc(it.name)}</td>
          <td>${parseInt(it.qty) || 1}</td>
          <td>${(Number(it.unitCost) || 0).toLocaleString()}</td>
          <td><button type="button" onclick="applyParsedInvoiceItemToForm(${idx})" class="btn" style="padding:2px 6px; font-size:10px; width:auto;">⬇️ تعبئة</button></td>
        </tr>`).join("");

      outBox.innerHTML = `
        <div style="font-size:11px; color:var(--success-color); margin-bottom:5px;">✅ المورد: <b>${esc(d.supplierName || "غير محدد")}</b> | الإجمالي: <b>${(Number(d.totalAmount) || 0).toLocaleString()}</b></div>
        <div style="overflow-x:auto;"><table class="tbl-clean"><thead><tr><th style="text-align:right;">الصنف</th><th>الكمية</th><th>التكلفة</th><th>إجراء</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    } catch (err) {
      outBox.innerHTML = `<div style="color:var(--danger-color); font-size:11px;">❌ خطأ: ${esc(err.message)}</div>`;
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
    showToast(`✅ تم تعبئة (${it.name}) في نموذج الإضافة بنجاح!`);
  };

  // --- [تحسين 8] مولد رسالة تذكير الديون عبر واتساب ---
  window.generateSmartDebtReminderWhatsApp = async function () {
    const phone = $("adminDebtCustomerSelect")?.value;
    if (!phone || !users[phone]) return alert("⚠️ اختر زبون الآجل أولاً.");
    const u = users[phone];
    const balUSD = parseFloat(u.debtBalanceUSD) || 0;
    if (balUSD <= 0) return alert("✅ لا يوجد رصيد مستحق على هذا الزبون.");

    const workerUrl = getEffectiveAIWorkerUrl();
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");

    showToast("⏳ جاري صياغة رسالة تذكير مهذبة بالذكاء الاصطناعي...");
    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "debt_reminder",
          debtInfo: {
            customerName: u.name,
            amount: `${balUSD.toFixed(2)} $ (ما يعادل ${calcSYP(balUSD).toLocaleString()} ل.س)`,
            currency: "",
            daysOverdue: 7
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل توليد الرسالة");
      const msg = json.data?.message || `مرحباً ${u.name}، تذكير ودي من متجر معاذ برصيدكم المستحق (${balUSD.toFixed(2)} $).`;
      window.open(`https://wa.me/${formatWhatsAppPhone(phone)}?text=${encodeURIComponent(msg)}`, "_blank");
    } catch (err) {
      alert("❌ تعذر توليد الرسالة: " + err.message);
    }
  };

  // --- [تحسين 10] الملخص اليومي الذكي لصاحب المتجر ---
  window.runDailyBriefAI = async function () {
    const box = $("aiDailyBriefOutput");
    const workerUrl = getEffectiveAIWorkerUrl();
    if (!workerUrl) return alert("⚠️ اضبط رابط Cloudflare Worker في الإعدادات أولاً.");
    if (box) box.innerHTML = `<div style="color:#00b0ff; font-size:11px; margin-top:6px;">⏳ جاري تحليل أرقام اليوم وتجهيز التوصيات...</div>`;

    const snap = window.latestStatsSnapshot || {};
    const outOfStockNames = Object.values(products || {}).filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.alertLimit) || 2)).slice(0, 10).map(p => p.name);

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "daily_brief",
          stats: {
            totalSalesSYP: snap.totS || 0,
            netProfitSYP: snap.netP || 0,
            debtCollectionsUSD: snap.debtCollectionsUSD || 0,
            lowStockItems: outOfStockNames
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "فشل تحليل التقرير");
      const d = json.data || {};
      const acts = (d.actions || []).map(a => `<li style="margin-bottom:3px;">${esc(a)}</li>`).join("");
      if (box) {
        box.innerHTML = `<div class="adm-card" style="border-color:#00e676; background:rgba(0,230,118,0.06); margin-top:8px; font-size:11px;">
          <b style="color:#00e676;">🤖 خلاصة اليوم الذكية:</b>
          <p style="margin:4px 0 6px 0;">${esc(d.summary || "")}</p>
          <ul style="margin:0; padding-right:16px;">${acts}</ul>
        </div>`;
      }
    } catch (err) {
      if (box) box.innerHTML = `<div style="color:var(--danger-color); font-size:11px; margin-top:6px;">❌ خطأ: ${esc(err.message)}</div>`;
    }
  };

  // --- حقن الأزرار والواجهات الجديدة تلقائياً عند تحميل الصفحة ---
  function injectAIEnhancementsUI() {
    // 1. أزرار سريعة داخل صندوق مساعد التسوق (سلة العادة + وصفة/ميزانية)
    const assistBox = $("aiSmartAssistantBox");
    if (assistBox && !$("aiQuickChipsBar")) {
      const chips = document.createElement("div");
      chips.id = "aiQuickChipsBar";
      chips.style.cssText = "display:flex; gap:5px; flex-wrap:wrap; margin-top:6px;";
      chips.innerHTML = `
        <button type="button" onclick="fillHabitCartAI()" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(212,175,55,0.18); color:var(--gold-color); border:1px solid var(--gold-color);">🔄 سلة العادة</button>
        <button type="button" onclick="setVal('aiShoppingPromptInput','جهز لي سلة فطور متوفرة بميزانية 500 ل.س'); runAIShoppingAssistant();" class="btn" style="width:auto; padding:3px 8px; font-size:10px; background:rgba(0,230,118,0.14); color:#00e676; border:1px solid #00e676;">🍳 سلة فطور بـ 500 ل.س</button>
      `;
      assistBox.appendChild(chips);
    }

    // 2. بطاقة تصوير فاتورة المورد بالكاميرا في تبويب البضائع
    const prodTab = $("admTab4Products");
    if (prodTab && !$("aiSupplierInvoiceCard")) {
      const card = document.createElement("div");
      card.id = "aiSupplierInvoiceCard";
      card.className = "adm-sec";
      card.style.borderColor = "#00b0ff";
      card.innerHTML = `
        <div class="adm-sec-title"><span style="color:#00b0ff;">📸 قراءة فاتورة مورد ورقية بالكاميرا (AI OCR)</span></div>
        <input type="file" id="aiSupplierInvoiceFile" accept="image/*" class="form-control" style="margin-bottom:6px;" onchange="runSupplierInvoiceOCR()">
        <div id="aiSupplierInvoiceResult"></div>
      `;
      prodTab.insertBefore(card, prodTab.firstChild);
    }

    // 3. زر توليد رسالة تذكير الديون في تبويب الزبائن والديون
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

    // 4. زر الملخص اليومي الذكي في تبويب الجرد
    const statsTab = $("admTab1Stats");
    if (statsTab && !$("aiDailyBriefBtn")) {
      const wrap = document.createElement("div");
      wrap.className = "adm-sec";
      wrap.style.borderColor = "#00e676";
      wrap.innerHTML = `
        <button id="aiDailyBriefBtn" type="button" onclick="runDailyBriefAI()" class="btn" style="background:linear-gradient(45deg,#00b0ff,#00e676); color:#000; font-size:12px; font-weight:bold;">🤖 تحليل نهاية اليوم الذكي (توصيات المشتريات والركود)</button>
        <div id="aiDailyBriefOutput"></div>
      `;
      statsTab.insertBefore(wrap, statsTab.firstChild);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectAIEnhancementsUI);
  } else {
    injectAIEnhancementsUI();
  }
})();

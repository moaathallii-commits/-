// ============================================================================
// وحدة حماية المخزن وتوليد مرادفات البحث (moaath_inventory_guard.js — v1.0)
// المرحلة 2:
// 1) منع تكرار اسم المنتج الحرفي ورفض تسجيله فوراً (مع استثناء التعديل على نفس الصنف)
// 2) توليد مرادفات البحث لكل منتج عبر «الحكيم التقني» (محلياً بـ 0 حصة + عبر worker.js)
// - متكاملة مع window.MoaathSystemRegistry و window.MoaathEventBus
// - عزل تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_INVENTORY_GUARD_V1__) return;
  window.__MOAATH_INVENTORY_GUARD_V1__ = true;

  const LOCAL_SYN_KEY = "moaath_store_local_synonyms";
  let saveLockUntil = 0;

  const escHtml = (s) =>
    typeof window.moaathEscapeHtml === "function"
      ? window.moaathEscapeHtml(s)
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

  function toWesternDigits(str) {
    return String(str || "")
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  }

  // تطبيع دقيق لاسم المنتج لكشف التكرار الحرفي حتى مع اختلاف الهمزات أو المسافات أو التاء المربوطة
  function normalizeProductKey(name) {
    return toWesternDigits(String(name || ""))
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0640]/g, "") // إزالة التشكيل والتطويل
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  }

  // 1) فحص التكرار الحرفي في المخزن
  function findDuplicateProduct(candidateName, excludeProductId = "") {
    const targetKey = normalizeProductKey(candidateName);
    if (!targetKey) return null;
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const excl = String(excludeProductId || "").trim();

    for (const pid of Object.keys(prods)) {
      if (excl && pid === excl) continue;
      const p = prods[pid];
      if (!p || !p.name) continue;
      if (normalizeProductKey(p.name) === targetKey) {
        return { id: pid, name: p.name, category: p.category || "" };
      }
    }
    return null;
  }

  // 2) قاموس مرادفات محلي سريع (0 حصة API) للسوق السوري
  const LOCAL_SYRIAN_SYNONYMS = [
    [/رز|ارز/, ["رز", "ارز", "أرز"]],
    [/بسكوت|بسكويت/, ["بسكوت", "بسكويت", "بسكوت شاي"]],
    [/مته|متة/, ["متة", "مته", "خارطة", "بيبوري"]],
    [/شوكولا|شكولا/, ["شوكولاتة", "شوكولاته", "شوكولا", "شكولاته"]],
    [/معكرون|مكرون/, ["معكرونة", "معكرونه", "مكرونة", "مكرونه", "سباغيتي"]],
    [/جلي/, ["سائل جلي", "دواء جلي", "صابون جلي", "جلي"]],
    [/طحين|دقيق/, ["طحين", "دقيق", "طحين ابيض"]],
    [/بندور|طماطم/, ["بندورة", "بندوره", "طماطم", "دبس بندورة", "معجون طماطم"]],
    [/شيبس|بطاطا/, ["شيبس", "تشيبس", "سناكس", "كناكر", "مقرمشات"]],
    [/محارم|مناديل/, ["محارم", "مناديل", "كلينكس", "ورق تواليت"]],
    [/غسيل|تايد|اومو/, ["مسحوق غسيل", "دواء غسيل", "صابون غسيل", "تايد"]],
    [/لبنه|لبنة/, ["لبنة", "لبنه", "لبن"]],
    [/حليب/, ["حليب", "حليب بودرة", "حليب سائل"]],
    [/قهوه|قهوة/, ["قهوة", "قهوه", "بن", "نسكافيه"]],
    [/شاي/, ["شاي", "شاي اسود", "شاي اخضر", "شاي ظرف"]],
    [/زيت/, ["زيت", "زيت نباتي", "زيت دوار الشمس", "زيت قلي"]],
    [/سمن/, ["سمن", "سمنة", "سمنه", "سمن نباتي"]],
    [/اندومي|نودلز/, ["اندومي", "أندومي", "نودلز", "شعيرية سريعة"]],
    [/بزر|موالح/, ["بزر", "بذر", "موالح", "نقارش", "تسالي"]],
    [/عصير/, ["عصير", "عصائر", "شراب", "مشروب"]]
  ];

  function buildLocalSynonyms(prodName, category = "") {
    const norm = normalizeProductKey(prodName);
    const out = new Set();
    if (prodName && prodName.trim()) out.add(prodName.trim());

    // توليد بدائل التاء المربوطة والهمزات تلقائياً
    const altH = String(prodName || "").replace(/ة/g, "ه").trim();
    const altT = String(prodName || "").replace(/ه\b/g, "ة").trim();
    const altA = String(prodName || "").replace(/[أإآ]/g, "ا").trim();
    [altH, altT, altA].forEach((v) => { if (v && v !== prodName) out.add(v); });

    LOCAL_SYRIAN_SYNONYMS.forEach(([rx, list]) => {
      if (rx.test(norm) || rx.test(normalizeProductKey(category))) {
        list.forEach((w) => out.add(w));
      }
    });

    return Array.from(out).slice(0, 8);
  }

  function resolveWorkerUrl() {
    try {
      if (typeof window.getEffectiveAIWorkerUrl === "function") {
        const u = String(window.getEffectiveAIWorkerUrl() || "").trim();
        if (u) return u;
      }
    } catch (_) {}
    return String(
      window.AI_WORKER_URL ||
      window.WORKER_URL ||
      localStorage.getItem("moaath_ai_worker_url") ||
      ""
    ).trim();
  }

  function saveProductSynonyms(pid, prodName, synonymsArr) {
    const cleanList = Array.from(
      new Set((synonymsArr || []).map((s) => String(s || "").trim()).filter((s) => s.length >= 2))
    ).slice(0, 10);
    if (!cleanList.length) return cleanList;

    // 1) الحفظ المحلي الفوري في localStorage ليعمل البحث بدون إنترنت
    try {
      const map = window.moaathSafeStorage
        ? window.moaathSafeStorage.getJSON(LOCAL_SYN_KEY, {})
        : JSON.parse(localStorage.getItem(LOCAL_SYN_KEY) || "{}");
      map["PROD_" + pid] = cleanList;
      if (window.moaathSafeStorage) window.moaathSafeStorage.setJSON(LOCAL_SYN_KEY, map);
      else localStorage.setItem(LOCAL_SYN_KEY, JSON.stringify(map));
    } catch (_) {}

    // 2) الحفظ السحابي في Firebase إذا كان متاحاً
    if (typeof window.db !== "undefined" && window.db && typeof window.db.ref === "function") {
      window.db.ref(`ai_brain/synonyms/PROD_${pid}`).set(cleanList).catch(() => {});
      if (pid && window.products && window.products[pid]) {
        window.db.ref(`products/${pid}/searchSynonyms`).set(cleanList).catch(() => {});
      }
    }

    if (window.MoaathEventBus) {
      window.MoaathEventBus.emit("inventory:synonymsUpdated", { pid, prodName, synonyms: cleanList });
    }
    return cleanList;
  }

  async function generateSynonymsForProduct(pid, prodName, category = "", useCloud = true) {
    const localSyns = buildLocalSynonyms(prodName, category);
    let merged = [...localSyns];

    const workerUrl = resolveWorkerUrl();
    if (useCloud && workerUrl && navigator.onLine !== false) {
      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "product_synonyms",
            productName: prodName,
            category
          })
        });
        const json = await res.json();
        if (res.ok && json?.ok && Array.isArray(json?.data?.synonyms)) {
          merged = [...json.data.synonyms, ...localSyns];
        }
      } catch (_) {}
    }

    return saveProductSynonyms(pid || ("TMP_" + Date.now()), prodName, merged);
  }

  // 3) توليد المرادفات لجميع المنتجات التي تفتقد لمرادفات بحث (دفعة منظمة)
  async function generateMissingSynonymsBatch(onProgress = null) {
    const prods = (typeof window.products === "object" && window.products) ? window.products : {};
    const localMap = window.moaathSafeStorage
      ? window.moaathSafeStorage.getJSON(LOCAL_SYN_KEY, {})
      : {};

    const targets = Object.keys(prods).filter((pid) => {
      const p = prods[pid];
      if (!p || !p.name) return false;
      const hasCloud = Array.isArray(p.searchSynonyms) && p.searchSynonyms.length >= 2;
      const hasLocal = Array.isArray(localMap["PROD_" + pid]) && localMap["PROD_" + pid].length >= 2;
      return !hasCloud && !hasLocal;
    });

    if (!targets.length) {
      if (typeof window.showToast === "function") {
        window.showToast("✅ جميع منتجات المخزن تملك مرادفات بحث جاهزة!");
      }
      return { processed: 0, total: 0 };
    }

    let processed = 0;
    for (const pid of targets) {
      const p = prods[pid];
      // نستخدم المحلي السريع أولاً، والسحابي لأول 10 منتجات فقط لحماية حصة API المجانية
      const allowCloud = processed < 10;
      await generateSynonymsForProduct(pid, p.name, p.category || "", allowCloud);
      processed++;
      if (typeof onProgress === "function") onProgress(processed, targets.length, p.name);
      if (allowCloud) await new Promise((r) => setTimeout(r, 900));
    }

    if (typeof window.showToast === "function") {
      window.showToast(`🧠 تم توليد وحفظ مرادفات البحث لـ ${processed} منتجاً بنجاح!`);
    }
    return { processed, total: targets.length };
  }

  // 4) ربط حارس منع التكرار المباشر بنموذج إضافة/تعديل المنتج في لوحة الإدارة
  function detectAdminProductInputs() {
    const adminModal = document.getElementById("adminModal") || document;
    const nameInput =
      document.getElementById("prodName") ||
      document.getElementById("admProdName") ||
      document.getElementById("productName") ||
      adminModal.querySelector("input[placeholder*='اسم الصنف'], input[placeholder*='اسم المنتج']");

    const editIdInput =
      document.getElementById("editProdId") ||
      document.getElementById("admProdEditId") ||
      document.getElementById("prodId") ||
      adminModal.querySelector("input[type='hidden'][id*='Prod'], input[type='hidden'][id*='prod']");

    const catInput =
      document.getElementById("prodCat") ||
      document.getElementById("admProdCat") ||
      document.getElementById("productCategory");

    return { nameInput, editIdInput, catInput };
  }

  function bindLiveDuplicateCheck() {
    const { nameInput, editIdInput, catInput } = detectAdminProductInputs();
    if (!nameInput || nameInput.dataset.dupGuardBound) return;
    nameInput.dataset.dupGuardBound = "1";

    let warnEl = document.getElementById("moaathDupProdWarn");
    if (!warnEl) {
      warnEl = document.createElement("div");
      warnEl.id = "moaathDupProdWarn";
      warnEl.style.cssText =
        "display:none; margin-top:4px; padding:5px 8px; border-radius:8px; font-size:10.5px; font-weight:800; " +
        "background:rgba(239,68,68,0.14); border:1px solid #ef4444; color:#fca5a5;";
      nameInput.parentNode.insertBefore(warnEl, nameInput.nextSibling);
    }

    // زر توليد مرادفات البحث الفوري بجانب حقل اسم المنتج
    if (!document.getElementById("moaathGenSingleSynBtn")) {
      const synBtn = document.createElement("button");
      synBtn.id = "moaathGenSingleSynBtn";
      synBtn.type = "button";
      synBtn.className = "btn";
      synBtn.style.cssText =
        "margin-top:5px; padding:4px 9px; font-size:10px; background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid #38bdf8;";
      synBtn.textContent = "🧠 توليد مرادفات البحث لهذا المنتج (الحكيم التقني)";
      synBtn.onclick = async () => {
        const nm = String(nameInput.value || "").trim();
        if (!nm) return window.showToast && window.showToast("⚠️ اكتب اسم المنتج أولاً.");
        synBtn.disabled = true;
        synBtn.textContent = "⏳ جاري توليد المرادفات...";
        const pid = String(editIdInput?.value || "").trim() || ("NEW_" + Date.now());
        const syns = await generateSynonymsForProduct(pid, nm, catInput?.value || "", true);
        synBtn.disabled = false;
        synBtn.textContent = "🧠 توليد مرادفات البحث لهذا المنتج (الحكيم التقني)";
        if (typeof window.showToast === "function") {
          window.showToast(`✅ تم حفظ ${syns.length} مرادفات: ${syns.slice(0, 4).join("، ")}`);
        }
      };
      warnEl.parentNode.insertBefore(synBtn, warnEl.nextSibling);
    }

    const checkNow = () => {
      const val = String(nameInput.value || "").trim();
      const exclId = String(editIdInput?.value || "").trim();
      const dup = findDuplicateProduct(val, exclId);
      if (dup) {
        warnEl.innerHTML = `⛔ اسم مكرر! المنتج «${escHtml(dup.name)}» مسجّل مسبقاً في المخزن وسيتم رفض حفظه.`;
        warnEl.style.display = "block";
        nameInput.style.borderColor = "#ef4444";
      } else {
        warnEl.style.display = "none";
        nameInput.style.borderColor = "";
      }
    };

    nameInput.addEventListener("input", checkNow);
    nameInput.addEventListener("blur", checkNow);
  }

  // 5) تغليف دوال حفظ المنتج لمنع التكرار الحرفي ومنع النقر المزدوج
  function wrapProductSaveFunction(fnName) {
    const orig = window[fnName];
    if (typeof orig !== "function" || orig.__moaathDupGuarded) return;
    const wrapped = function () {
      const now = Date.now();
      if (now < saveLockUntil) return;

      const { nameInput, editIdInput, catInput } = detectAdminProductInputs();
      if (nameInput) {
        const rawName = String(nameInput.value || "").trim();
        const exclId = String(editIdInput?.value || "").trim();
        const dup = findDuplicateProduct(rawName, exclId);
        if (dup) {
          const msg = `⛔ مرفوض: اسم المنتج «${dup.name}» مسجّل مسبقاً في المخزن! يرجى تعديل الاسم أو تحديث المنتج الموجود.`;
          if (typeof window.showToast === "function") window.showToast(msg, true);
          else alert(msg);
          nameInput.focus();
          return false;
        }
        // توليد مرادفات محلية فورية (0 حصة) بعد الحفظ
        if (rawName) {
          setTimeout(() => {
            generateSynonymsForProduct(exclId || ("AUTO_" + Date.now()), rawName, catInput?.value || "", false);
          }, 400);
        }
      }

      saveLockUntil = now + 1200;
      return orig.apply(this, arguments);
    };
    wrapped.__moaathDupGuarded = true;
    window[fnName] = wrapped;
  }

  // 6) حقن زر الدفعة الكاملة داخل تبويب الحكيم التقني أو التصدير
  function mountBatchSynonymsButton() {
    if (document.getElementById("moaathBatchSynonymsBtn")) return;
    const target =
      document.getElementById("admArchActionsRow") ||
      document.getElementById("admTab13Export") ||
      document.querySelector("#adminModal .modal-content");
    if (!target) return;

    const wrap = document.createElement("div");
    wrap.style.cssText =
      "margin:8px 0; padding:8px; border-radius:10px; background:rgba(56,189,248,0.08); border:1px dashed #38bdf8;";
    wrap.innerHTML = `
      <div style="font-size:11px; font-weight:800; color:#38bdf8; margin-bottom:5px;">🧠 الحكيم التقني — مرادفات البحث للمخزن</div>
      <button type="button" id="moaathBatchSynonymsBtn" class="btn" style="background:linear-gradient(45deg,#38bdf8,#00e676); color:#000; font-size:10.5px; padding:6px 10px;">
        ✨ فحص المخزن وتوليد مرادفات البحث لجميع المنتجات الناقصة
      </button>
      <div id="moaathBatchSynProgress" style="font-size:10px; color:var(--gray-text); margin-top:4px;"></div>
    `;
    target.insertBefore(wrap, target.firstChild);

    document.getElementById("moaathBatchSynonymsBtn").onclick = async function () {
      const btn = this;
      const prog = document.getElementById("moaathBatchSynProgress");
      btn.disabled = true;
      await generateMissingSynonymsBatch((done, total, lastName) => {
        if (prog) prog.textContent = `⏳ جاري التوليد (${done}/${total}): ${lastName}`;
      });
      btn.disabled = false;
      if (prog) prog.textContent = "✅ اكتمل فحص وتوليد مرادفات البحث للمخزن.";
    };
  }

  window.MoaathInventoryGuard = {
    version: "1.0",
    normalizeProductKey,
    findDuplicateProduct,
    buildLocalSynonyms,
    generateSynonymsForProduct,
    generateMissingSynonymsBatch
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("inventory_guard", "1.0");
  }

  function initGuard() {
    ["saveProduct", "addProduct", "submitProduct", "saveAdminProduct"].forEach(wrapProductSaveFunction);
    bindLiveDuplicateCheck();
    mountBatchSynonymsButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGuard);
  } else {
    initGuard();
  }
  setTimeout(initGuard, 1500);
})();

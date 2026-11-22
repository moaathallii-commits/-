// ============================================================================
// وحدة قدرات المساعدين الشخصيين والدردشة الصوتية الحرة (moaath_assistant_skills.js — v1.0)
// المرحلة 3:
// 1) أوامر التحكم المباشر في المتجر (إفراغ السلة بتأكيد لطيف، مراجعة السلة، فتح الأقسام،
//    تبديل الوضع الليلي/النهاري، فتح غرف VIP، العودة للأعلى) — 0 حصة API
// 2) الدردشة الصوتية الحرة المستمرة (Free Voice Chat) بالاستماع التلقائي المتبادل
// 3) التفاعل الودي والدردشة الحرة بألفة حسب شخصية المساعد واسم الزبون
// - متكاملة مع window.MoaathSystemRegistry و window.MoaathEventBus
// - عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_ASSISTANT_SKILLS_V1__) return;
  window.__MOAATH_ASSISTANT_SKILLS_V1__ = true;

  let pendingAction = null; // { type: "clear_cart", expiresAt }
  let freeVoiceActive = false;
  let freeVoiceRec = null;
  let freeVoiceRestartTimer = null;

  function toWesternDigits(str) {
    return String(str || "")
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  }

  function normAr(str) {
    return toWesternDigits(String(str || ""))
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\w\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getCustomerFirstName() {
    try {
      const raw = String(window.currentUser?.name || document.getElementById("customerNameInput")?.value || "").trim();
      if (!raw || raw === "زبون" || raw === "زائر") return "";
      return raw.split(/\s+/)[0].slice(0, 18);
    } catch (_) {
      return "";
    }
  }

  function getActivePersonaName() {
    try {
      const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      const id = prefs.persona || "buddy";
      const base = window.MoaathAIPersonas?.PERSONAS?.[id];
      const vip = window.MoaathVIPSystem?.personas?.[id];
      return (base || vip)?.name || "مساعد المتجر";
    } catch (_) {
      return "مساعد المتجر";
    }
  }

  function isFinancialText(norm) {
    return /دفع|تحويل|شام\s*كاش|شامكاش|ايصال|اشعار\s*دفع|تحقق\s*من\s*الدفع|رصيد\s*دفع/.test(norm);
  }

  function replyAndSpeak(text, toastIcon = "🧚") {
    const statusEl = document.getElementById("aiShoppingStatusText");
    if (statusEl) statusEl.textContent = `${toastIcon} ${text}`;

    const bubble = document.getElementById("petMiniBubble");
    if (bubble) {
      bubble.textContent = `${toastIcon} ${text}`;
      bubble.style.display = "block";
      clearTimeout(bubble._skillsTimer);
      bubble._skillsTimer = setTimeout(() => { bubble.style.display = "none"; }, 5000);
    }

    if (typeof window.showToast === "function") {
      window.showToast(`${toastIcon} ${text}`);
    }

    // نطق الرد عبر محرك الصوت المدمج أو Web Speech كبديل سريع
    try {
      if (typeof window.speechSynthesis !== "undefined") {
        const prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
        if (prefs.voiceEnabled !== false) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}]/gu, " ").trim());
          u.lang = "ar-SA";
          u.rate = 1.12;
          const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          const arV = voices.find((v) => /ar/i.test(v.lang || ""));
          if (arV) u.voice = arV;
          window.speechSynthesis.speak(u);
        }
      }
    } catch (_) {}
  }

  function getCartSummaryStats() {
    const cartObj = (typeof window.cart === "object" && window.cart) ? window.cart : {};
    const keys = Object.keys(cartObj).filter((k) => (parseInt(cartObj[k]?.qty, 10) || 0) > 0);
    const totalPieces = keys.reduce((acc, k) => acc + (parseInt(cartObj[k]?.qty, 10) || 0), 0);
    return { keys, totalPieces };
  }

  function executeClearCartNow() {
    const { keys } = getCartSummaryStats();
    if (!keys.length) {
      replyAndSpeak("سلتك فارغة أساساً يا غالي، جاهزين نبدأ تسوق جديد!", "🛒");
      return;
    }

    keys.forEach((k) => {
      const qty = parseInt(window.cart[k]?.qty, 10) || 0;
      if (qty > 0 && typeof window.changeQty === "function") {
        window.changeQty(k, -qty);
      } else if (window.cart && window.cart[k]) {
        delete window.cart[k];
      }
    });

    if (typeof window.renderCartModalItems === "function") {
      try { window.renderCartModalItems(); } catch (_) {}
    }
    if (window.MoaathEventBus) {
      window.MoaathEventBus.emit("cart:cleared", { clearedCount: keys.length });
    }
    replyAndSpeak("تم إفراغ السلة بالكامل على عيني! خبرني إذا حابب نبدأ طلب جديد.", "🧹");
  }

  // 1) معالج أوامر التحكم المباشر في المتجر (0 حصة API)
  function handleControlCommands(norm) {
    const now = Date.now();
    const cust = getCustomerFirstName();
    const nameSuffix = cust ? ` يا ${cust}` : "";

    // أ) تأكيد أو إلغاء أمر معلق (مثل تأكيد إفراغ السلة)
    if (pendingAction && pendingAction.expiresAt > now) {
      if (/^(نعم|ايه|ايوه|اكيد|موافق|تمام|افرغها|فرغها|امسحها|اوكي)$/.test(norm)) {
        const act = pendingAction.type;
        pendingAction = null;
        if (act === "clear_cart") {
          executeClearCartNow();
          return true;
        }
      }
      if (/^(لا|الغاء|الغي|تراجع|خليها|بلاش)$/.test(norm)) {
        pendingAction = null;
        replyAndSpeak(`تمام${nameSuffix}، خليتلك السلة مثل ما هي بدون أي تغيير.`, "👍");
        return true;
      }
    }

    // ب) أمر إفراغ السلة (مع طلب تأكيد لطيف لحماية الزبون)
    if (/(افرغ|فرغ|فضي|مسح|امسح|حذف|احذف|صفر).*(السله|سلتي|سله|المشتريات|الطلب)/.test(norm)) {
      const { totalPieces } = getCartSummaryStats();
      if (totalPieces === 0) {
        replyAndSpeak(`سلتك فاضية حالياً${nameSuffix}، ما فيها شي لنفرغه.`, "🛒");
        return true;
      }
      if (/(فورا|مباشره|اكيد|بدون تاكيد)/.test(norm)) {
        executeClearCartNow();
        return true;
      }
      pendingAction = { type: "clear_cart", expiresAt: now + 60 * 1000 };
      replyAndSpeak(`في بسلتك حالياً ${totalPieces} قطع${nameSuffix}، متأكد بدك أفرغها بالكامل؟ قل «نعم» للتأكيد أو «لا» للإلغاء.`, "⚠️");
      return true;
    }

    // ج) مراجعة السلة أو فتح السلة
    if (/(افتح|اعرض|ورجيني|شوف|كم\s*في).*(السله|سلتي|سله)/.test(norm)) {
      const { totalPieces } = getCartSummaryStats();
      const cartBtn = document.querySelector(".cart-bar button, #bottomCartBar button, button[onclick*='openCart']");
      if (cartBtn && /(افتح|اعرض|ورجيني)/.test(norm)) cartBtn.click();
      const msg = totalPieces > 0
        ? `في بسلتك حالياً ${totalPieces} قطع${nameSuffix}، فتحتلك السلة لتراجعها براحتك.`
        : `سلتك فاضية هلق${nameSuffix}، خبرني شو ناقصك لأضيفه فوراً!`;
      replyAndSpeak(msg, "🛒");
      return true;
    }

    // د) تبديل الوضع الليلي / النهاري
    if (/(الوضع|الثيم|اللون).*(ليلي|داكن|نهاري|فاتح|مضيء)|^(ليلي|نهاري|بدل الثيم)$/.test(norm)) {
      if (typeof window.toggleTheme === "function") {
        window.toggleTheme();
        replyAndSpeak(`بدّلتلك مظهر المتجر${nameSuffix}، إن شاء الله مريح لعينك!`, "🌓");
        return true;
      }
    }

    // هـ) فتح غرف VIP أو تغيير الشخصية
    if (/(افتح|اعرض).*(غرف|في اي بي|vip)/.test(norm)) {
      if (typeof window.openVIPShowcaseModal === "function") {
        window.openVIPShowcaseModal("all");
        replyAndSpeak(`فتحتلك غرف الشخصيات التفاعلية${nameSuffix}، استمتع بالأدوات!`, "👑");
        return true;
      }
    }
    if (/(غير|بدل|اختار).*(الشخصيه|الجنيه|المساعد)/.test(norm)) {
      if (typeof window.openFairyGalleryModal === "function") {
        window.openFairyGalleryModal();
        replyAndSpeak(`تفضل اختر الشخصية التي تحبها${nameSuffix}!`, "🧚");
        return true;
      }
    }

    // و) العودة لأعلى الصفحة
    if (/(اطلع|ارجع|اصعد).*(فوق|للاعلى|البدايه)/.test(norm)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      replyAndSpeak(`رجعتك لأعلى المتجر${nameSuffix}!`, "⬆️");
      return true;
    }

    // ز) إيقاف الدردشة الصوتية الحرة
    if (/(اوقف|وقف|سكر|انهي).*(الدردشه|الصوت|المحادثه|الاستماع)/.test(norm)) {
      if (freeVoiceActive) {
        stopFreeVoiceChat();
        return true;
      }
    }

    return false;
  }

  // 2) محرك التفاعل الودي والدردشة الحرة بألفة (0 حصة API)
  const WARM_CHAT_RULES = [
    {
      rx: /(مين\s*انت|شو\s*اسمك|عرفني\s*عن\s*نفسك|من\s*انت)/,
      reply: (name, pName) => `أنا ${pName}، رفيقك الذكي في متجر معاذ${name}! أساعدك بالتسوق والوصفات وحتى ندردش سوا.`
    },
    {
      rx: /(بحبك|احبك|انت\s*رائع|انت\s*ذكي|احلى\s*مساعد|يسعد\s*قلبك|الله\s*يسعدك)/,
      reply: (name) => `يا روحي الله يسعد قلبك${name}! كلامك الحلو بيعطيني طاقة إيجابية، دايماً بالخدمة.`
    },
    {
      rx: /(ملل|زهقان|ضجران|طفشان|سولف|دردش\s*معي|احكي\s*معي)/,
      reply: (name) => `ولا يهمك${name}، أنا معك! فينا نلعب لعبة سريعة بغرفة كابتن زين، أو نضبط سهرة متة وتسالي مع فادي، شو رأيك؟`
    },
    {
      rx: /(تعبان|متعب|مرهق|مضغوط|يوم\s*طويل)/,
      reply: (name) => `يعطيك ألف عافية${name}، سلامتك من التعب! خذ نفس عميق وكافئ حالك بكاسة شاي أو قهوة سخنة وشي حلو يروق بالك.`
    },
    {
      rx: /(شو\s*تنصحني|محتار|شو\s*اخد|شو\s*اطبخ\s*اليوم|جوعان|جعان)/,
      reply: (name) => `لا تحتار${name}! إذا جوعان بسرعة عندك معكرونة أو شكشوكة بـ 15 دقيقة، وإذا عبالك نقرشة خبرني بميزانيتك وأرتبلك أحلى تشكيلة!`
    },
    {
      rx: /(تصبح\s*على\s*خير|باي|مع\s*السلامه|سلامات|اشوفك\s*بعدين)/,
      reply: (name) => `وأنت بألف خير وسلامة${name}! متجر معاذ منوّر بوجودك دايماً، نلتقي على خير.`
    },
    {
      rx: /(نكته|ضحكني|طرفه)/,
      reply: (name) => `أحلى طرفة لعيونك${name}: واحد دخل يشتري كيس بزر واحد للسهرة... طلع من المتجر ومعه متة وشيبس وشوكولاتة ونسِي البزر!`
    }
  ];

  function handleWarmFriendlyChat(norm) {
    const cust = getCustomerFirstName();
    const nameSuffix = cust ? ` يا ${cust}` : "";
    const pName = getActivePersonaName();

    for (const rule of WARM_CHAT_RULES) {
      if (rule.rx.test(norm)) {
        replyAndSpeak(rule.reply(nameSuffix, pName), "💛");
        return true;
      }
    }
    return false;
  }

  // 3) وضع الدردشة الصوتية الحرة المستمرة (Free Voice Chat Mode)
  function updateFreeVoiceButtonUI() {
    const btn = document.getElementById("moaathFreeVoiceChatBtn");
    if (!btn) return;
    btn.textContent = freeVoiceActive ? "🔴 إيقاف الدردشة الصوتية" : "🎙️ دردشة صوتية حرة";
    btn.style.background = freeVoiceActive
      ? "rgba(239,68,68,0.22)"
      : "rgba(16,185,129,0.16)";
    btn.style.color = freeVoiceActive ? "#fca5a5" : "#10b981";
    btn.style.borderColor = freeVoiceActive ? "#ef4444" : "rgba(16,185,129,0.45)";
  }

  function stopFreeVoiceChat(silent = false) {
    freeVoiceActive = false;
    clearTimeout(freeVoiceRestartTimer);
    if (freeVoiceRec) {
      try { freeVoiceRec.onend = null; freeVoiceRec.stop(); } catch (_) {}
      freeVoiceRec = null;
    }
    updateFreeVoiceButtonUI();
    if (!silent) {
      replyAndSpeak("أوقفت الدردشة الصوتية الحرة، أنا هنا متى ما احتجتني!", "🎙️");
    }
  }

  function listenNextFreeVoiceTurn() {
    if (!freeVoiceActive) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      stopFreeVoiceChat(true);
      if (typeof window.showToast === "function") {
        window.showToast("⚠️ المتصفح لا يدعم الدردشة الصوتية، يمكنك الكتابة مباشرة.");
      }
      return;
    }

    if (freeVoiceRec) {
      try { freeVoiceRec.onend = null; freeVoiceRec.stop(); } catch (_) {}
    }

    const rec = new SR();
    freeVoiceRec = rec;
    rec.lang = "ar-SY";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (ev) => {
      const heard = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
      if (!heard) return;
      const inp = document.getElementById("aiShoppingPromptInput");
      if (inp) inp.value = heard;
      if (typeof window.runAIShoppingAssistant === "function") {
        window.runAIShoppingAssistant(heard);
      }
    };

    rec.onerror = (ev) => {
      if (ev && (ev.error === "not-allowed" || ev.error === "service-not-allowed")) {
        stopFreeVoiceChat(true);
        if (typeof window.showToast === "function") {
          window.showToast("⚠️ يرجى السماح بإذن الميكروفون لتفعيل الدردشة الصوتية الحرة.");
        }
      }
    };

    rec.onend = () => {
      if (!freeVoiceActive) return;
      // انتظار 2.2 ثانية بعد انتهاء الاستماع لإتاحة المجال لنطق الرد ثم استئناف الاستماع تلقائياً
      clearTimeout(freeVoiceRestartTimer);
      freeVoiceRestartTimer = setTimeout(() => {
        if (freeVoiceActive) listenNextFreeVoiceTurn();
      }, 2200);
    };

    try {
      rec.start();
    } catch (_) {
      stopFreeVoiceChat(true);
    }
  }

  window.toggleFreeVoiceChatMode = function () {
    if (freeVoiceActive) {
      stopFreeVoiceChat(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (typeof window.showToast === "function") {
        window.showToast("⚠️ الميكروفون غير مدعوم في هذا المتصفح.");
      }
      return;
    }
    freeVoiceActive = true;
    updateFreeVoiceButtonUI();
    const cust = getCustomerFirstName();
    replyAndSpeak(`الدردشة الصوتية الحرة شغالة الآن${cust ? " يا " + cust : ""}! احكي معي براحتك أو اطلب أي شي، وقل «أوقف الدردشة» وقت تخلص.`, "🎙️");
    clearTimeout(freeVoiceRestartTimer);
    freeVoiceRestartTimer = setTimeout(listenNextFreeVoiceTurn, 1800);
  };

  // 4) حقن زر الدردشة الصوتية الحرة واختصار إفراغ السلة داخل شريط الاختصارات في المساعد
  function mountSkillsUI() {
    const chips = document.getElementById("petQuickPromptChips");
    if (chips && !document.getElementById("moaathFreeVoiceChatBtn")) {
      const voiceChip = document.createElement("button");
      voiceChip.id = "moaathFreeVoiceChatBtn";
      voiceChip.type = "button";
      voiceChip.className = "fut-chip-btn";
      voiceChip.style.cssText = "border:1px solid rgba(16,185,129,0.45); background:rgba(16,185,129,0.16); color:#10b981;";
      voiceChip.textContent = "🎙️ دردشة صوتية حرة";
      voiceChip.onclick = window.toggleFreeVoiceChatMode;
      chips.insertBefore(voiceChip, chips.firstChild);
      updateFreeVoiceButtonUI();
    }
  }

  // 5) تغليف runAIShoppingAssistant بأمان لتمرير أوامر التحكم والدردشة الودية أولاً
  function hookShoppingAssistant() {
    const orig = window.runAIShoppingAssistant;
    if (typeof orig !== "function" || orig.__moaathSkillsHooked) return;

    const wrapped = async function (overridePrompt = null) {
      const promptTxt = String(
        overridePrompt ?? (document.getElementById("aiShoppingPromptInput")?.value || "")
      ).trim();

      if (promptTxt) {
        const norm = normAr(promptTxt);
        // احترام العزل المالي التام
        if (!isFinancialText(norm)) {
          if (handleControlCommands(norm)) {
            const inp = document.getElementById("aiShoppingPromptInput");
            if (inp) inp.value = "";
            return;
          }
          if (handleWarmFriendlyChat(norm)) {
            const inp = document.getElementById("aiShoppingPromptInput");
            if (inp) inp.value = "";
            return;
          }
        }
      }
      return orig.apply(this, arguments);
    };

    wrapped.__moaathSkillsHooked = true;
    window.runAIShoppingAssistant = wrapped;
  }

  window.MoaathAssistantSkills = {
    version: "1.0",
    toggleFreeVoiceChat: window.toggleFreeVoiceChatMode,
    stopFreeVoiceChat,
    handleControlCommands,
    handleWarmFriendlyChat
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("assistant_skills", "1.0");
  }

  function init() {
    hookShoppingAssistant();
    mountSkillsUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 1200);
})();

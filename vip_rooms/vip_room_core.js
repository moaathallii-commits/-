// ============================================================================
// نواة غرف عالم VIP لمتجر معاذ (vip_rooms/vip_room_core.js)
// - معمارية مستقلة قابلة للتوسع (Lazy Loading) بدون تعديل أرقام الإصدار يدوياً
// - واجهة تفاعلية ثلاثية الأبعاد بملء الشاشة (أسلوب توم المتكلم بهوية متجر معاذ)
// - مستخلص تفضيلات ذكي في الخلفية لتحسين تجربة التسوق دون إزعاج الزبون
// - عزل تام للمس والتمرير + حظر كامل لأي تدخل في الدفع أو شام كاش
// ============================================================================

(function () {
  if (window.MoaathVIPRooms && window.MoaathVIPRooms.__CORE_READY__) return;

  const INSIGHTS_KEY = "moaath_vip_customer_insights_v1";
  const HIST_KEY = "moaath_vip_room_anti_repeat_v1";
  const MANIFEST_URL = "vip_rooms/manifest.json";

  const registry = {};
  const loadedScripts = new Set();
  let manifestCache = null;
  let activeRoomId = null;
  let roomChatHistory = [];
  let activeRecognizer = null;
  let isVoiceMuted = false;

  const $id = (id) => document.getElementById(id);
  const escHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function normAr(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\w\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPaymentRestricted(text) {
    return /دفع|تحويل|شام\s*كاش|شامكاش|ايصال|اشعار\s*دفع|رصيد\s*دفع|حواله/.test(normAr(text));
  }

  // --------------------------------------------------------------------------
  // 1. إدارة الفهرس والتحميل الكسول بدون الحاجة لتحديث ?v= يدوياً
  // --------------------------------------------------------------------------
  async function loadManifest(forceFresh = false) {
    if (manifestCache && !forceFresh) return manifestCache;
    try {
      const res = await fetch(`${MANIFEST_URL}?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" });
      if (res.ok) {
        manifestCache = await res.json();
        return manifestCache;
      }
    } catch (_) {}
    return manifestCache || { buildId: "local", rooms: [] };
  }

  function loadRoomScript(roomMeta, buildId) {
    return new Promise((resolve, reject) => {
      if (registry[roomMeta.id]) return resolve(registry[roomMeta.id]);
      const src = `${roomMeta.file}?b=${encodeURIComponent(buildId || Date.now())}`;
      if (loadedScripts.has(roomMeta.id)) {
        return setTimeout(() => resolve(registry[roomMeta.id] || null), 200);
      }
      loadedScripts.add(roomMeta.id);
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(registry[roomMeta.id] || null);
      s.onerror = () => {
        loadedScripts.delete(roomMeta.id);
        reject(new Error(`تعذر تحميل ملف الغرفة: ${roomMeta.file}`));
      };
      document.head.appendChild(s);
    });
  }

  // --------------------------------------------------------------------------
  // 2. مستخلص تفضيلات الزبون في الخلفية (الهدف الخفي الآمن لتحسين التسوق)
  // --------------------------------------------------------------------------
  function getCustomerInsights() {
    try {
      const d = JSON.parse(localStorage.getItem(INSIGHTS_KEY) || "{}");
      return {
        favoriteTopics: Array.isArray(d.favoriteTopics) ? d.favoriteTopics : [],
        preferredCategories: Array.isArray(d.preferredCategories) ? d.preferredCategories : [],
        likesBulk: !!d.likesBulk,
        budgetSensitive: !!d.budgetSensitive,
        preferredVibe: d.preferredVibe || "friendly",
        sessionsCount: parseInt(d.sessionsCount, 10) || 0,
        lastRoom: d.lastRoom || "",
        updatedAt: d.updatedAt || 0
      };
    } catch (_) {
      return { favoriteTopics: [], preferredCategories: [], likesBulk: false, budgetSensitive: false, preferredVibe: "friendly", sessionsCount: 0, lastRoom: "", updatedAt: 0 };
    }
  }

  function saveCustomerInsights(patch) {
    const next = { ...getCustomerInsights(), ...patch, updatedAt: Date.now() };
    next.favoriteTopics = Array.from(new Set(next.favoriteTopics)).slice(-8);
    next.preferredCategories = Array.from(new Set(next.preferredCategories)).slice(-6);
    try { localStorage.setItem(INSIGHTS_KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function extractInsightsFromMessage(rawText, room) {
    const n = normAr(rawText);
    if (!n) return;
    const cur = getCustomerInsights();
    const topics = [...cur.favoriteTopics];
    const cats = [...cur.preferredCategories];
    let likesBulk = cur.likesBulk;
    let budgetSensitive = cur.budgetSensitive;
    let preferredVibe = cur.preferredVibe;

    if (/طرد|جمله|عائلي|كميه|توفير|كرتونه/.test(n)) likesBulk = true;
    if (/ارخص|اوفر|ميزانيه|غالي|سعر|توفير/.test(n)) budgetSensitive = true;
    if (/رياضه|تمرين|بروتين|عضل|جيم|وزن|دايت|لياقه/.test(n)) { topics.push("رياضة وصحة"); cats.push("مواد غذائية"); }
    if (/طبخ|وصفه|غداء|عشاء|حلى|كيك|حلويات/.test(n)) { topics.push("طبخ وحلويات"); cats.push("مواد غذائية"); }
    if (/سهره|مته|بزر|شيبس|قهوه|شاي|تسالي/.test(n)) { topics.push("سهرة وتسالي"); cats.push("مشروبات"); }
    if (/ملل|طفش|زهق|دردش|سولف|نكته|فزوره/.test(n)) preferredVibe = "playful";
    if (room && room.domainTag && !topics.includes(room.domainTag)) topics.push(room.domainTag);

    saveCustomerInsights({ favoriteTopics: topics, preferredCategories: cats, likesBulk, budgetSensitive, preferredVibe, lastRoom: room?.id || cur.lastRoom });
  }

  // --------------------------------------------------------------------------
  // 3. مانع التكرار لبنك الخبرة المحلي
  // --------------------------------------------------------------------------
  function pickNonRepeating(roomId, bucketKey, list) {
    if (!Array.isArray(list) || !list.length) return "";
    let hist = {};
    try { hist = JSON.parse(localStorage.getItem(HIST_KEY) || "{}"); } catch (_) {}
    const k = `${roomId}::${bucketKey}`;
    const recent = Array.isArray(hist[k]) ? hist[k] : [];
    const fresh = list.filter((x) => !recent.includes(typeof x === "string" ? x : x.text));
    const pool = fresh.length ? fresh : list;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const valStr = typeof picked === "string" ? picked : picked.text;
    recent.unshift(valStr);
    hist[k] = recent.slice(0, 15);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(hist)); } catch (_) {}
    return picked;
  }

  // --------------------------------------------------------------------------
  // 4. الصوت (متوافق مع ai_engine.js و Web Speech دون تداخل)
  // --------------------------------------------------------------------------
  function stopRoomVoice() {
    try { if (typeof window.__moaathStopAiEngineVoice === "function") window.__moaathStopAiEngineVoice(); } catch (_) {}
    try { if (typeof window.speechSynthesis !== "undefined") window.speechSynthesis.cancel(); } catch (_) {}
  }

  function speakInRoom(text, room) {
    if (isVoiceMuted || !text) return;
    stopRoomVoice();
    const clean = String(text).replace(/[\u{1F300}-\u{1FAFF}•*_#]/gu, " ").replace(/\s+/g, " ").trim();
    if (!clean) return;

    // استخدام محرك الصوت الرئيسي في المتجر إذا كان متاحاً ومضبوطاً على نفس الشخصية
    const avatarEl = $id("vipRoomAvatarWrap");
    if (avatarEl) avatarEl.classList.add("is-speaking");
    setTimeout(() => { if (avatarEl) avatarEl.classList.remove("is-speaking"); }, Math.min(7000, Math.max(1800, clean.length * 65)));

    if (typeof window.speechSynthesis !== "undefined") {
      try {
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = "ar-SY";
        u.rate = room?.voice?.rate || 1.15;
        u.pitch = room?.voice?.pitch || 0.92;
        const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        const arV = voices.find((v) => /ar/i.test(v.lang || ""));
        if (arV) u.voice = arV;
        u.onend = () => { if (avatarEl) avatarEl.classList.remove("is-speaking"); };
        window.speechSynthesis.speak(u);
      } catch (_) {}
    }
  }

  // --------------------------------------------------------------------------
  // 5. جسور التسوق الذكية (ربط الحوار بمنتجات متجر معاذ المتوفرة)
  // --------------------------------------------------------------------------
  function findStoreProductsForKeywords(keywords = []) {
    const prods = (typeof window.products === "object" && window.products) || (typeof products === "object" && products) || {};
    const kwNorms = keywords.map(normAr).filter((w) => w.length >= 2);
    const hits = [];
    Object.keys(prods).forEach((pid) => {
      const p = prods[pid];
      if (!p || !p.name) return;
      const st = typeof window.getProductStockForBranch === "function"
        ? window.getProductStockForBranch(p, typeof activeBranchId !== "undefined" ? activeBranchId : "main")
        : (parseInt(p.stock, 10) || 0);
      if (st <= 0) return;
      const pNorm = normAr(`${p.name} ${p.category || ""}`);
      if (kwNorms.some((k) => pNorm.includes(k))) {
        const priceSYP = typeof window.calcSYP === "function" ? window.calcSYP(p.priceUSD || 0) : 0;
        hits.push({ id: pid, name: p.name, priceSYP, thumb: p.thumb || p.image || "store-icon.png" });
      }
    });
    return hits.slice(0, 4);
  }

  function renderInlineProductStrip(items) {
    const strip = $id("vipRoomProductStrip");
    if (!strip) return;
    if (!Array.isArray(items) || !items.length) {
      strip.style.display = "none";
      strip.innerHTML = "";
      return;
    }
    strip.style.display = "flex";
    strip.innerHTML = items.map((it) => `
      <div class="vip-prod-pill">
        <img src="${escHtml(it.thumb)}" onerror="this.onerror=null;this.src='store-icon.png';" alt="${escHtml(it.name)}">
        <div class="vip-prod-meta">
          <div class="vip-prod-name">${escHtml(it.name)}</div>
          <div class="vip-prod-price">${(it.priceSYP || 0).toLocaleString()} ل.س</div>
        </div>
        <button type="button" class="vip-prod-add" onclick="if(typeof changeQty==='function'){changeQty('${it.id}',1); if(typeof showToast==='function') showToast('✅ تمت إضافة ${escHtml(it.name)} للسلة');}">➕</button>
      </div>
    `).join("");
  }

  // --------------------------------------------------------------------------
  // 6. بناء الواجهة ثلاثية الأبعاد بملء الشاشة (أسلوب توم المتكلم بهوية متجر معاذ)
  // --------------------------------------------------------------------------
  function injectStyles() {
    if ($id("moaathVipRoomStyles")) return;
    const st = document.createElement("style");
    st.id = "moaathVipRoomStyles";
    st.textContent = `
      #moaathVipRoomOverlay {
        position: fixed; inset: 0; z-index: 10055;
        display: none; flex-direction: column;
        background: radial-gradient(circle at 50% 28%, var(--vip-accent-soft, rgba(0,230,118,0.18)), #0f141e 68%, #070a10 100%);
        color: #f8fafc; font-family: Tahoma, 'Segoe UI', sans-serif;
        overscroll-behavior: contain; touch-action: manipulation;
        overflow: hidden;
      }
      .vip-room-top {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 14px; background: rgba(15, 20, 30, 0.78);
        border-bottom: 1px solid rgba(212, 175, 55, 0.35);
        backdrop-filter: blur(10px);
      }
      .vip-room-title-wrap { display: flex; flex-direction: column; gap: 2px; }
      .vip-room-name { font-size: 15px; font-weight: 900; color: #D4AF37; }
      .vip-room-role { font-size: 10px; color: #94a3b8; }
      .vip-room-top-btns { display: flex; gap: 6px; align-items: center; }
      .vip-icon-pill {
        background: rgba(255,255,255,0.08); color: #fff;
        border: 1px solid rgba(212,175,55,0.4); border-radius: 999px;
        padding: 6px 11px; font-size: 11px; font-weight: 700; cursor: pointer;
      }
      .vip-close-pill { background: rgba(239,68,68,0.2); border-color: #ef4444; color: #fecaca; }
      .vip-stage {
        flex: 1; position: relative; display: flex; flex-direction: column;
        align-items: center; justify-content: center; padding: 10px 14px;
        perspective: 900px; overflow: hidden;
      }
      .vip-speech-bubble {
        max-width: 92%; min-height: 44px; margin-bottom: 14px;
        background: rgba(15, 23, 42, 0.88); color: #f8fafc;
        border: 1.5px solid var(--vip-accent, #D4AF37); border-radius: 18px;
        padding: 10px 14px; font-size: 13px; line-height: 1.55; text-align: center;
        box-shadow: 0 10px 28px rgba(0,0,0,0.45);
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .vip-avatar-stage {
        position: relative; width: 220px; height: 220px;
        display: flex; align-items: center; justify-content: center;
        transform-style: preserve-3d; cursor: pointer;
        animation: vipFloat3D 3.2s ease-in-out infinite;
        transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .vip-avatar-stage.is-speaking { animation: vipSpeakPulse 0.45s ease-in-out infinite alternate; }
      .vip-avatar-stage.is-poked { transform: scale(1.12) rotateY(14deg) rotateX(-8deg) !important; }
      .vip-avatar-ring {
        position: absolute; inset: -10px; border-radius: 50%;
        border: 2px dashed var(--vip-accent, #00e676); opacity: 0.45;
        animation: vipSpinSlow 18s linear infinite; pointer-events: none;
      }
      .vip-avatar-img {
        width: 205px; height: 205px; border-radius: 50%; object-fit: cover;
        border: 3.5px solid #D4AF37;
        box-shadow: 0 18px 40px rgba(0,0,0,0.65), 0 0 32px var(--vip-accent-soft, rgba(0,230,118,0.35));
        user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-user-drag: none; pointer-events: none;
      }
      .vip-touch-hint {
        margin-top: 10px; font-size: 10px; color: #94a3b8;
        background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 999px;
      }
      .vip-prod-strip {
        display: none; gap: 8px; overflow-x: auto; width: 100%;
        padding: 6px 12px; box-sizing: border-box; scrollbar-width: none;
      }
      .vip-prod-pill {
        flex-shrink: 0; display: flex; align-items: center; gap: 7px;
        background: rgba(15, 23, 42, 0.92); border: 1px solid #D4AF37;
        border-radius: 12px; padding: 5px 8px; max-width: 210px;
      }
      .vip-prod-pill img { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; }
      .vip-prod-meta { min-width: 0; text-align: right; }
      .vip-prod-name { font-size: 10px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
      .vip-prod-price { font-size: 10px; color: #00e676; font-weight: 800; }
      .vip-prod-add {
        background: #D4AF37; color: #000; border: none; border-radius: 8px;
        width: 26px; height: 26px; font-weight: 900; cursor: pointer;
      }
      .vip-quick-bar {
        display: flex; gap: 6px; overflow-x: auto; padding: 6px 12px;
        scrollbar-width: none;
      }
      .vip-quick-chip {
        flex-shrink: 0; background: rgba(212,175,55,0.14); color: #fde68a;
        border: 1px solid rgba(212,175,55,0.45); border-radius: 999px;
        padding: 6px 12px; font-size: 11px; font-weight: 700; cursor: pointer;
      }
      .vip-input-bar {
        display: flex; gap: 6px; align-items: center;
        padding: 10px 12px 14px 12px; background: rgba(15, 20, 30, 0.95);
        border-top: 1px solid rgba(212, 175, 55, 0.35);
      }
      .vip-input-bar input {
        flex: 1; background: #0b101b; color: #fff;
        border: 1px solid rgba(212,175,55,0.45); border-radius: 999px;
        padding: 9px 14px; font-size: 12px; outline: none;
      }
      .vip-send-btn {
        background: linear-gradient(45deg, #D4AF37, #00e676); color: #000;
        border: none; border-radius: 999px; padding: 9px 14px;
        font-size: 12px; font-weight: 900; cursor: pointer;
      }
      .vip-mic-btn {
        background: rgba(0,230,118,0.18); color: #00e676;
        border: 1px solid #00e676; border-radius: 50%;
        width: 38px; height: 38px; font-size: 15px; cursor: pointer;
      }
      @keyframes vipFloat3D {
        0%, 100% { transform: translateY(0px) rotateY(-5deg); }
        50% { transform: translateY(-10px) rotateY(6deg); }
      }
      @keyframes vipSpeakPulse {
        0% { transform: scale(1.0) rotateY(-3deg); }
        100% { transform: scale(1.05) rotateY(3deg); }
      }
      @keyframes vipSpinSlow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(st);
  }

  function ensureOverlayDOM() {
    if ($id("moaathVipRoomOverlay")) return $id("moaathVipRoomOverlay");
    injectStyles();
    const ov = document.createElement("div");
    ov.id = "moaathVipRoomOverlay";
    ov.innerHTML = `
      <div class="vip-room-top">
        <div class="vip-room-title-wrap">
          <div id="vipRoomName" class="vip-room-name">غرفة VIP</div>
          <div id="vipRoomRole" class="vip-room-role">مساحة دردشة حرة وتطوير تجربة التسوق</div>
        </div>
        <div class="vip-room-top-btns">
          <button type="button" id="vipMuteBtn" class="vip-icon-pill" onclick="window.MoaathVIPRooms.toggleMute()">🔊 صوت</button>
          <button type="button" class="vip-icon-pill vip-close-pill" onclick="window.MoaathVIPRooms.close()">✕ خروج</button>
        </div>
      </div>
      <div class="vip-stage">
        <div id="vipRoomBubble" class="vip-speech-bubble">أهلاً بك في عالم VIP!</div>
        <div id="vipRoomAvatarWrap" class="vip-avatar-stage" role="button" aria-label="تفاعل مع الشخصية">
          <div class="vip-avatar-ring"></div>
          <img id="vipRoomAvatarImg" class="vip-avatar-img" src="store-icon.png" alt="شخصية VIP">
        </div>
        <div class="vip-touch-hint">👆 المس الشخصية للتفاعل المباشر أو تحدّث معها بحرية</div>
      </div>
      <div id="vipRoomProductStrip" class="vip-prod-strip"></div>
      <div id="vipRoomQuickBar" class="vip-quick-bar"></div>
      <div class="vip-input-bar">
        <button type="button" id="vipRoomMicBtn" class="vip-mic-btn" onclick="window.MoaathVIPRooms.startVoice()" title="تحدث بالصوت">🎙️</button>
        <input type="text" id="vipRoomTextInput" placeholder="دردش بحرية أو اسألني أي شيء..." onkeydown="if(event.key==='Enter') window.MoaathVIPRooms.sendMessage()">
        <button type="button" class="vip-send-btn" onclick="window.MoaathVIPRooms.sendMessage()">إرسال</button>
      </div>
    `;
    document.body.appendChild(ov);

    const avatarWrap = $id("vipRoomAvatarWrap");
    let vipHoldTimer = null;
    let vipHoldTriggered = false;
    avatarWrap.addEventListener("contextmenu", (e) => e.preventDefault());
    avatarWrap.addEventListener("touchstart", (e) => {
      vipHoldTriggered = false;
      clearTimeout(vipHoldTimer);
      vipHoldTimer = setTimeout(() => {
        vipHoldTriggered = true;
        startRoomVoiceInput();
      }, 450);
    }, { passive: true });
    avatarWrap.addEventListener("touchend", () => {
      clearTimeout(vipHoldTimer);
    });
    avatarWrap.addEventListener("click", (e) => {
      if (vipHoldTriggered) {
        vipHoldTriggered = false;
        return;
      }
      const rect = avatarWrap.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / Math.max(1, rect.height);
      const zone = relY < 0.45 ? "head" : "body";
      handleAvatarTouch(zone);
    });
    return ov;
  }

  function showRoomReply(text, room, suggestedProducts = null) {
    const b = $id("vipRoomBubble");
    if (b) {
      b.style.opacity = "0.6";
      setTimeout(() => {
        b.textContent = text;
        b.style.opacity = "1";
      }, 90);
    }
    if (suggestedProducts) renderInlineProductStrip(suggestedProducts);
    speakInRoom(text, room);
  }

  function handleAvatarTouch(zone

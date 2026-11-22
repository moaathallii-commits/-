/* ai_vip_personas.js — v4.3 (Full 8 VIP Personas + Showcase Modal + Prominent Entrance + System Registry) */
(function () {
  if (window.__MOAATH_AI_VIP_LOADED__) return;
  window.__MOAATH_AI_VIP_LOADED__ = true;

  var UNLOCK_KEY = "moaath_vip_unlocked_v4";

  var VIP_PERSONAS = {
    coach_sakhr: {
      id: "coach_sakhr",
      name: "كابتن صخر",
      role: "مدرب اللياقة والطاقة",
      gender: "male",
      toneTag: "حماسي وقوي",
      dialectMode: "shami_energetic",
      avatarUrl: "coach_sakhr.jpg",
      accent: "#10b981",
      voiceName: "Fenrir",
      speed: 1.1,
      pitchSemitones: -2.2,
      salesRole: "bundle_fitness",
      acoustic: { rate: 1.1, semi: -2.2, filterType: "lowshelf", freq: 380, gain: 5.0 },
      shortDesc: "يجهّز لك سلات البروتين الاقتصادي ووجبات الطاقة والنشاط اليومي.",
      greet: "وحش! التمرين ما بيكمل بدون تغذية صح. جهزتلك سلة البروتين والطاقة الكاملة، نعتمدها؟"
    },
    grand_chef: {
      id: "grand_chef",
      name: "الشيف الذهبي",
      role: "خبير الطبخ والوصفات",
      gender: "male",
      toneTag: "وقور وخبير",
      dialectMode: "shami_formal",
      avatarUrl: "grand_chef.jpg",
      accent: "#D4AF37",
      voiceName: "Charon",
      speed: 0.95,
      pitchSemitones: -1.8,
      salesRole: "upsell_feast",
      acoustic: { rate: 0.95, semi: -1.8, filterType: "lowshelf", freq: 440, gain: 4.2 },
      shortDesc: "يضبط لك مكونات طبخة اليوم والولائم من المتوفر في الفرع بدقة.",
      greet: "لوليمة تبيض الوجه، جودة المكونات هي السر. اخترتلك أفضل الموجود بالفرع لتطلع طبختك متكاملة."
    },
    princess_layla: {
      id: "princess_layla",
      name: "الأميرة ليلى",
      role: "خبيرة الضيافة والأناقة",
      gender: "female",
      toneTag: "راقية وهادئة",
      dialectMode: "shami_formal",
      avatarUrl: "princess_layla.jpg",
      accent: "#ec4899",
      voiceName: "Aoede",
      speed: 0.9,
      pitchSemitones: 1.2,
      salesRole: "hospitality_exp",
      acoustic: { rate: 0.9, semi: 1.2, filterType: "highshelf", freq: 2050, gain: 3.0 },
      shortDesc: "تنسّق لك ضيافة الطوارئ الأنيقة وركن القهوة والشاي المنزلي.",
      greet: "أهلاً بك. لضيافة أنيقة ومرتبة، نسقتلك القهوة والضيافة لتكون جاهزة بأبهى صورة."
    },
    butler_farid: {
      id: "butler_farid",
      name: "المساعد فريد",
      role: "خبير التوفير والميزانية",
      gender: "male",
      toneTag: "دقيق ومنظم",
      dialectMode: "formal_arabic",
      avatarUrl: "butler_farid.jpg",
      accent: "#38bdf8",
      voiceName: "Orus",
      speed: 1.0,
      pitchSemitones: -1.5,
      salesRole: "smart_savings",
      acoustic: { rate: 1.0, semi: -1.5, filterType: "peaking", freq: 950, gain: 3.2 },
      shortDesc: "يرصد لك أوفر الطرود والصفقات ويوازن سلتك الشهرية بأقل تكلفة.",
      greet: "حسبتلك السلة بدقة؛ لو بدلنا العبوة بالعائلية بتوفر أكثر وبتكفيك لفترة أطول. نعتمد التعديل؟"
    },
    friend_fadi: {
      id: "friend_fadi",
      name: "فادي المرح",
      role: "رفيق السهرة والمتة",
      gender: "male",
      toneTag: "مرح وودود",
      dialectMode: "shami_playful",
      avatarUrl: "friend_fadi.jpg",
      accent: "#f59e0b",
      voiceName: "Puck",
      speed: 1.02,
      pitchSemitones: 1.2,
      salesRole: "evening_gathering",
      acoustic: { rate: 1.02, semi: 1.2, filterType: "peaking", freq: 1650, gain: 3.8 },
      shortDesc: "يجهّز لك سلة السهرة والمتة والموالح والنقرشات بأجواء مرحة.",
      greet: "الجو جو متة ونقرشات يا معلم! جبتلك الموالح والبزر، شو نوع المتة يلي بتفضل؟"
    },
    anime_zain: {
      id: "anime_zain",
      name: "زين الأنمي",
      role: "بطل التركيز والإمداد",
      gender: "male",
      toneTag: "سريع وحماسي",
      dialectMode: "shami_energetic",
      avatarUrl: "anime_zain.jpg",
      accent: "#6366f1",
      voiceName: "Puck",
      speed: 1.18,
      pitchSemitones: 2.0,
      salesRole: "focus_supplies",
      acoustic: { rate: 1.18, semi: 2.0, filterType: "highshelf", freq: 2100, gain: 4.0 },
      shortDesc: "يرافقك في جلسات الدراسة والعمل ويجهز إمدادات الطاقة السريعة.",
      greet: "وضع التركيز شغال! إمدادات الطاقة والسناكات جاهزة للانطلاق.. نرسلها الآن؟"
    },
    anime_ryu: {
      id: "anime_ryu",
      name: "المحقق ريو",
      role: "رادار الندرة والصفقات",
      gender: "male",
      toneTag: "ذكي وتحليلي",
      dialectMode: "formal_arabic",
      avatarUrl: "anime_ryu.jpg",
      accent: "#0ea5e9",
      voiceName: "Charon",
      speed: 0.96,
      pitchSemitones: -1.5,
      salesRole: "scarcity_fomo",
      acoustic: { rate: 0.96, semi: -1.5, filterType: "peaking", freq: 880, gain: 3.2 },
      shortDesc: "يكتشف الأصناف النادرة التي أوشكت على النفاد ويقارن الأسعار بدقة.",
      greet: "انتبه.. قارنتلك الخيارات، هاد الصنف متوفر بكمية محدودة بالمستودع. القرار الذكي تحجزه هلق."
    },
    anime_ritaj: {
      id: "anime_ritaj",
      name: "ريتاج اللطيفة",
      role: "صانعة البهجة والحلويات",
      gender: "female",
      toneTag: "لطيفة ومشرقة",
      dialectMode: "shami_sweet",
      avatarUrl: "anime_ritaj.jpg",
      accent: "#f472b6",
      voiceName: "Kore",
      speed: 1.12,
      pitchSemitones: 2.6,
      salesRole: "self_reward",
      acoustic: { rate: 1.12, semi: 2.6, filterType: "highshelf", freq: 2400, gain: 4.5 },
      shortDesc: "تقترح عليك أشهى الحلويات الباردة السريعة ومكافآت تعديل المزاج.",
      greet: "تستاهل مكافأة حلوة اليوم! شو رأيك بحلى أو شوكولاتة تعدّل المزاج وتخلي يومك أحلى؟"
    }
  };

  window.VIP_PERSONAS = VIP_PERSONAS;

  function getSavedActivePersonaId() {
    try {
      var prefs = JSON.parse(localStorage.getItem("moaath_store_pet_prefs") || "{}");
      if (prefs && prefs.persona && VIP_PERSONAS[prefs.persona]) return prefs.persona;
    } catch (_) {}
    return "coach_sakhr";
  }

  function isPersonaUnlockedLifetime(personaId) {
    if (!personaId || !VIP_PERSONAS[personaId]) return false;
    try {
      var raw = localStorage.getItem(UNLOCK_KEY);
      if (!raw) return true;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.all === false && parsed[personaId] === false) return false;
    } catch (_) {}
    return true;
  }

  function escHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureVipStyles() {
    if (document.getElementById("moaathVipShowcaseCSS")) return;
    var st = document.createElement("style");
    st.id = "moaathVipShowcaseCSS";
    st.textContent = [
      "#moaathVipShowcaseModal { position: fixed; inset: 0; z-index: 10050; background: rgba(5, 8, 16, 0.84); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; padding: 12px; box-sizing: border-box; }",
      ".vip-modal-card { width: 100%; max-width: 460px; max-height: 86vh; overflow-y: auto; border-radius: 20px; border: 1.5px solid rgba(212, 175, 55, 0.65); background: linear-gradient(160deg, #131a29, #0b101b); color: #f8fafc; padding: 14px; box-shadow: 0 22px 54px rgba(0,0,0,0.75); box-sizing: border-box; }",
      "body.light-mode .vip-modal-card { background: linear-gradient(160deg, #ffffff, #f8fafc); color: #0f172a; }",
      ".vip-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(212, 175, 55, 0.25); padding-bottom: 9px; margin-bottom: 10px; }",
      ".vip-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }",
      ".vip-item-card { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 11px 8px; border-radius: 16px; border: 1.5px solid rgba(212, 175, 55, 0.28); background: rgba(255, 255, 255, 0.04); cursor: pointer; color: inherit; transition: transform 0.18s ease, border-color 0.2s ease; }",
      ".vip-item-card:hover, .vip-item-card.is-active { border-color: var(--vip-accent, #D4AF37); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.35); }",
      ".vip-avatar { width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 2px solid var(--vip-accent, #D4AF37); margin-bottom: 6px; }",
      ".vip-badge { position: absolute; top: 6px; left: 6px; background: #10b981; color: #000; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 999px; }",
      ".vip-name { font-size: 12px; font-weight: 900; color: var(--vip-accent, #D4AF37); margin-bottom: 2px; }",
      ".vip-role { font-size: 9.5px; opacity: 0.78; margin-bottom: 4px; }",
      ".vip-desc { font-size: 9.5px; line-height: 1.4; opacity: 0.9; }",
      "#moaathVipEntranceToast { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); z-index: 10060; background: linear-gradient(135deg, rgba(19, 26, 41, 0.96), rgba(11, 16, 27, 0.98)); color: #f8fafc; border: 1.5px solid #D4AF37; border-radius: 999px; padding: 7px 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 28px rgba(0,0,0,0.55); font-size: 11px; font-weight: 800; }"
    ].join(" ");
    document.head.appendChild(st);
  }

  window.closeVIPShowcaseModal = function () {
    var m = document.getElementById("moaathVipShowcaseModal");
    if (m) m.style.display = "none";
  };

  window.triggerVIPProminentEntrance = function (personaId) {
    var vp = VIP_PERSONAS[personaId];
    if (!vp) return;
    ensureVipStyles();
    var old = document.getElementById("moaathVipEntranceToast");
    if (old) old.remove();
    var toast = document.createElement("div");
    toast.id = "moaathVipEntranceToast";
    toast.style.borderColor = vp.accent || "#D4AF37";
    toast.innerHTML =
      '<img src="' + escHtml(vp.avatarUrl) + '" onerror="this.onerror=null;this.src=\'store-icon.png\';" style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:1.5px solid ' + escHtml(vp.accent || "#D4AF37") + ';">' +
      '<span>👑 ' + escHtml(vp.name) + ' — ' + escHtml(vp.role) + '</span>';
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  };

  window.openVIPShowcaseModal = function () {
    ensureVipStyles();
    var activeId = getSavedActivePersonaId();
    var modal = document.getElementById("moaathVipShowcaseModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moaathVipShowcaseModal";
      modal.addEventListener("click", function (e) {
        if (e.target === modal) window.closeVIPShowcaseModal();
      });
      document.body.appendChild(modal);
    }

    var cardsHtml = Object.keys(VIP_PERSONAS).map(function (key) {
      var vp = VIP_PERSONAS[key];
      var isAct = key === activeId;
      return (
        '<button type="button" class="vip-item-card' + (isAct ? " is-active" : "") + '" style="--vip-accent:' + escHtml(vp.accent) + ';" onclick="window.__selectVIPFromShowcase(\'' + escHtml(vp.id) + '\')">' +
          (isAct ? '<span class="vip-badge">✓ نشطة</span>' : '<span class="vip-badge" style="background:rgba(212,175,55,0.22);color:#D4AF37;">👑 VIP</span>') +
          '<img class="vip-avatar" src="' + escHtml(vp.avatarUrl) + '" onerror="this.onerror=null;this.src=\'store-icon.png\';" alt="' + escHtml(vp.name) + '">' +
          '<div class="vip-name">' + escHtml(vp.name) + '</div>' +
          '<div class="vip-role">' + escHtml(vp.role) + '</div>' +
          '<div class="vip-desc">' + escHtml(vp.shortDesc) + '</div>' +
        '</button>'
      );
    }).join("");

    modal.innerHTML =
      '<div class="vip-modal-card">' +
        '<div class="vip-modal-head">' +
          '<div>' +
            '<div style="font-size:14px;font-weight:900;color:#D4AF37;">👑 غرف وشخصيات VIP المميزة</div>' +
            '<div style="font-size:10px;opacity:0.75;margin-top:2px;">اختر شخصيتك المفضلة للتفعيل الفوري بالصوت البشري</div>' +
          '</div>' +
          '<button type="button" onclick="window.closeVIPShowcaseModal()" class="btn btn-danger" style="width:auto;padding:4px 10px;font-size:11px;">✕</button>' +
        '</div>' +
        '<div class="vip-grid">' + cardsHtml + '</div>' +
      '</div>';

    modal.style.display = "flex";
  };

  window.__selectVIPFromShowcase = function (key) {
    window.closeVIPShowcaseModal();
    if (window.MoaathVIPSystem) window.MoaathVIPSystem.activePersonaId = key;
    if (typeof window.selectPetPersona === "function") {
      window.selectPetPersona(key);
    }
    if (typeof window.triggerVIPProminentEntrance === "function") {
      window.triggerVIPProminentEntrance(key);
    }
  };

  window.MoaathVIPSystem = {
    version: "4.1",
    personas: VIP_PERSONAS,
    activePersonaId: getSavedActivePersonaId(),
    isPersonaUnlockedLifetime: isPersonaUnlockedLifetime,
    openShowcase: window.openVIPShowcaseModal
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("ai_vip", "4.1");
  }
})();

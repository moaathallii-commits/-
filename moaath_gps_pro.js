// ============================================================================
// نظام الـ GPS الاحترافي ونطاق القرى والتوصيل بدون إنترنت (moaath_gps_pro.js — v1.0)
// - يتكامل تلقائياً مع نظام نقاط التوزيع الحالي في المتجر (المسافة الحقيقية + المتبقية)
// - يضيف «نطاق التغطية حول النقطة (متر)» في لوحة الإدارة لكل نقطة/قرية
// - يحدد أقرب قرية مخدومة ويسجلها تلقائياً في الطلب: «📍 من قرية: ...»
// - جدار جغرافي (Geofence): يمنع التوصيل خارج جميع الحدود مع خيار «الاستلام من المتجر مجاناً»
// - حارس دقة الـ GPS (أفضل قراءة خلال 3.5 ثوانٍ + تنبيه عند ضعف الدقة > 60م)
// - حفظ موقع البيت الدائم (🏠) + خانة «أقرب علامة مميزة» بسطر واحد
// - تجهيز روابط التوصيل بدون إنترنت (geo:lat,lng + Google Maps + الإحداثيات) لعامل التوصيل
// - يعمل محلياً بـ 0 حصة API مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_GPS_PRO_V1__) return;
  window.__MOAATH_GPS_PRO_V1__ = true;

  const SAVED_HOME_KEY = "moaath_gps_saved_home_v1";
  const POINT_RADII_KEY = "moaath_gps_point_radii_v1";
  const LANDMARK_KEY = "moaath_gps_last_landmark_v1";
  const DEMAND_LOG_KEY = "moaath_gps_outside_demand_v1";

  let lastEvalState = null; // { lat, lng, accuracy, status: 'in'|'out', village, pointName, distToCenterM, totalRoadM, pickupOverride }
  let pickupOverrideActive = false;

  const escHtml = (s) =>
    typeof window.moaathEscapeHtml === "function"
      ? window.moaathEscapeHtml(s)
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

  function readJSON(key, fallback) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.getJSON(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    if (window.moaathSafeStorage) return window.moaathSafeStorage.setJSON(key, val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  function vibrate(p = 15) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {}
  }

  // معادلة Haversine لحساب المسافة الدقيقة بالمتر بين إحداثيين
  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // ==========================================================================
  // 1) قراءة إعدادات المتجر ونقاط التوزيع الحالية بمرونة كاملة
  // ==========================================================================
  function getPointRadiiMap() {
    return readJSON(POINT_RADII_KEY, {});
  }

  function savePointRadius(pointKey, radiusMeters) {
    const r = parseInt(radiusMeters, 10);
    if (!pointKey || !r || r < 50) return;
    const map = getPointRadiiMap();
    map[String(pointKey).trim()] = r;
    writeJSON(POINT_RADII_KEY, map);
    // مزامنة اختيارية مع Firebase إن كانت متاحة
    try {
      if (window.db && typeof window.db.ref === "function") {
        window.db.ref("gpsPointRadii/" + encodeURIComponent(String(pointKey).trim()).replace(/\./g, "_")).set(r);
      }
    } catch (_) {}
  }

  function pullRadiiFromFirebase() {
    try {
      if (window.db && typeof window.db.ref === "function") {
        window.db.ref("gpsPointRadii").once("value", (snap) => {
          const val = snap && snap.val ? snap.val() : null;
          if (!val || typeof val !== "object") return;
          const map = getPointRadiiMap();
          Object.keys(val).forEach((k) => {
            const decoded = decodeURIComponent(k);
            if (parseInt(val[k], 10) >= 50) map[decoded] = parseInt(val[k], 10);
          });
          writeJSON(POINT_RADII_KEY, map);
        });
      }
    } catch (_) {}
  }

  function getStoreGpsConfig() {
    const cfg = window.gpsSettings || window.storeSettings?.gps || window.settings?.gps || window.storeConfig?.gps || {};
    const storeLat = parseFloat(cfg.storeLat || cfg.lat || window.storeLat || document.getElementById("gpsStoreLat")?.value || 0);
    const storeLng = parseFloat(cfg.storeLng || cfg.lng || window.storeLng || document.getElementById("gpsStoreLng")?.value || 0);

    // نطاق القرية المحلية (الطبقة 2) والحد الأقصى العام (الطبقة 3)
    const localVillageRadius =
      parseInt(cfg.tier2Max || cfg.localRadius || cfg.villageRadius || document.getElementById("gpsTier2Max")?.value || 1500, 10) || 1500;
    const globalMaxRadius =
      parseInt(cfg.maxDistance || cfg.tier3Max || cfg.maxRadius || document.getElementById("gpsMaxDistance")?.value || 0, 10) || 0;

    // اسم القرية الرئيسية للفرع النشط
    const branchName = String(
      window.activeBranchName ||
      document.querySelector(".store-header, header")?.textContent?.match(/مخزن\s+([^\s()]+)/)?.[1] ||
      "العوينة"
    ).trim();

    // تجميع نقاط التوزيع من أي مصدر معتمد في المتجر
    const rawPoints =
      window.deliveryPoints ||
      cfg.distributionPoints ||
      cfg.points ||
      window.distributionPoints ||
      window.settings?.distributionPoints ||
      [];

    const radiiMap = getPointRadiiMap();
    const pointsArr = Array.isArray(rawPoints)
      ? rawPoints
      : (rawPoints && typeof rawPoints === "object" ? Object.values(rawPoints) : []);

    const normalizedPoints = pointsArr
      .filter((pt) => pt && parseFloat(pt.lat) && parseFloat(pt.lng))
      .map((pt) => {
        const name = String(pt.name || pt.pointName || pt.title || "نقطة توزيع").trim();
        const village = String(pt.village || pt.region || pt.area || name).trim();
        const roadDistM = parseInt(pt.realDistance || pt.roadDistance || pt.distance || 0, 10) || 0;
        const customR =
          parseInt(pt.maxRadius || pt.radius || radiiMap[name] || radiiMap[village] || 0, 10) ||
          1500; // افتراضي 1500 متر حول مركز كل قرية إن لم يُحدد يدوياً
        return {
          name,
          village,
          lat: parseFloat(pt.lat),
          lng: parseFloat(pt.lng),
          roadDistM,
          maxRadiusM: customR
        };
      });

    return {
      storeLat,
      storeLng,
      branchName,
      localVillageRadius,
      globalMaxRadius,
      points: normalizedPoints
    };
  }

  // ==========================================================================
  // 2) تقييم الموقع ضد القرية المحلية ونقاط التوزيع (Geofencing Engine)
  // ==========================================================================
  function evaluateCoordinates(lat, lng, accuracy = 20) {
    const cfg = getStoreGpsConfig();
    const candidates = [];

    // 1) فحص مركز المتجر (القرية المحلية)
    if (cfg.storeLat && cfg.storeLng) {
      const dStore = haversineMeters(lat, lng, cfg.storeLat, cfg.storeLng);
      candidates.push({
        isLocalStore: true,
        village: cfg.branchName,
        pointName: "مركز المتجر",
        distToNodeM: dStore,
        totalRoadM: dStore,
        maxRadiusM: cfg.localVillageRadius,
        inside: dStore <= cfg.localVillageRadius
      });
    }

    // 2) فحص جميع نقاط التوزيع (مراكز القرى)
    cfg.points.forEach((pt) => {
      const dNode = haversineMeters(lat, lng, pt.lat, pt.lng);
      const totalRoad = pt.roadDistM > 0 ? (pt.roadDistM + dNode) : dNode;
      candidates.push({
        isLocalStore: false,
        village: pt.village,
        pointName: pt.name,
        distToNodeM: dNode,
        totalRoadM: totalRoad,
        maxRadiusM: pt.maxRadiusM,
        inside: dNode <= pt.maxRadiusM
      });
    });

    // إذا لم تكن إحداثيات المتجر أو النقاط مضبوطة بعد، نعتبره داخل القرية الافتراضية دون تعطيل الطلب
    if (!candidates.length) {
      return {
        lat, lng, accuracy: Math.round(accuracy || 0),
        status: "in",
        village: cfg.branchName,
        pointName: "",
        distToNodeM: 0,
        totalRoadM: 0,
        nearestVillage: cfg.branchName,
        nearestDistM: 0
      };
    }

    // نبحث عن أقرب نقطة يقع الزبون داخل حدّها الأقصى
    const insideMatches = candidates
      .filter((c) => c.inside)
      .sort((a, b) => a.distToNodeM - b.distToNodeM);

    // التحقق أيضاً من الحد الأقصى العام للتوصيل إن كان مضبوطاً
    const bestInside = insideMatches.find((c) => !cfg.globalMaxRadius || c.totalRoadM <= cfg.globalMaxRadius);

    if (bestInside) {
      return {
        lat, lng, accuracy: Math.round(accuracy || 0),
        status: "in",
        village: bestInside.village,
        pointName: bestInside.isLocalStore ? "" : bestInside.pointName,
        distToNodeM: bestInside.distToNodeM,
        totalRoadM: bestInside.totalRoadM,
        nearestVillage: bestInside.village,
        nearestDistM: bestInside.distToNodeM
      };
    }

    // خارج جميع الحدود — نعيد أقرب قرية مخدومة لإعلام الزبون بوضوح
    const nearest = candidates.sort((a, b) => a.distToNodeM - b.distToNodeM)[0];
    return {
      lat, lng, accuracy: Math.round(accuracy || 0),
      status: "out",
      village: "",
      pointName: "",
      distToNodeM: nearest.distToNodeM,
      totalRoadM: nearest.totalRoadM,
      nearestVillage: nearest.village,
      nearestDistM: nearest.distToNodeM
    };
  }

  // ==========================================================================
  // 3) التقاط أفضل إشارة GPS (Best-of-3 Lock) + حارس الدقة
  // ==========================================================================
  function captureBestGpsPosition(onDone) {
    if (!navigator.geolocation) {
      if (typeof window.showToast === "function") window.showToast("⚠️ جهازك لا يدعم تحديد الموقع GPS.");
      return;
    }

    let bestPos = null;
    let finished = false;
    let watchId = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (watchId !== null) {
        try { navigator.geolocation.clearWatch(watchId); } catch (_) {}
      }
      if (bestPos) {
        onDone(bestPos.coords.latitude, bestPos.coords.longitude, bestPos.coords.accuracy);
      } else {
        if (typeof window.showToast === "function") window.showToast("⚠️ تعذّر التقاط موقعك، تأكد من تفعيل GPS واقترب من النافذة.");
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
          bestPos = pos;
        }
        // إذا وصلت الدقة لأقل من 20 متراً، نعتمدها فوراً دون انتظار
        if (pos.coords.accuracy <= 20) finish();
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );

    setTimeout(finish, 3500);
  }

  function applyCoordinatesToStore(lat, lng, accuracy, fromSavedHome = false) {
    pickupOverrideActive = false;
    lastEvalState = evaluateCoordinates(lat, lng, accuracy);

    // مزامنة الإحداثيات مع متغيرات المتجر الأصلية ليواصل حساب الأجرة بسلاسة
    window.customerLat = lat;
    window.customerLng = lng;
    window.userLat = lat;
    window.userLng = lng;
    window.moaathDetectedVillage = lastEvalState.village || "";
    window.moaathGpsProState = lastEvalState;

    if (typeof window.updateDeliveryFeeByGPS === "function") {
      try { window.updateDeliveryFeeByGPS(lat, lng); } catch (_) {}
    }

    renderCartGpsProPanel();
    syncSubmitButtonGuard();

    if (fromSavedHome && typeof window.showToast === "function") {
      window.showToast(`🏠 تم اعتماد موقع بيتك المحفوظ (${lastEvalState.village || "الموقع المحدد"}).`);
    }
  }

  // ==========================================================================
  // 4) واجهة الـ GPS المطوّرة داخل سلة المشتريات (#cartModal)
  // ==========================================================================
  function renderCartGpsProPanel() {
    const cartModal = document.getElementById("cartModal");
    if (!cartModal) return;
    const modalContent = cartModal.querySelector(".modal-content");
    if (!modalContent) return;

    let panel = document.getElementById("moaathGpsProPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "moaathGpsProPanel";
      panel.style.cssText =
        "margin:7px 0; padding:9px 10px; border-radius:13px; border:1px solid rgba(56,189,248,0.42); " +
        "background:rgba(56,189,248,0.08); font-size:10.5px; text-align:right; direction:rtl;";
      const payWrap = document.getElementById("moaathPaymentPillsWrap") || document.getElementById("cartPaymentMethod");
      if (payWrap && payWrap.parentNode) payWrap.parentNode.insertBefore(panel, payWrap);
      else modalContent.appendChild(panel);
    }

    const savedHome = readJSON(SAVED_HOME_KEY, null);
    const savedLandmark = readJSON(LANDMARK_KEY, "");
    const st = lastEvalState;

    let statusHTML = "";
    if (!st) {
      statusHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <span style="color:#38bdf8; font-weight:800;">📡 حدّد موقعك لتسجيل قريتك وتجهيز التوصيل أوفلاين</span>
          <button type="button" onclick="window.MoaathGpsPro.detectNow()" class="btn" style="width:auto; padding:4px 9px; font-size:10px; background:#38bdf8; color:#000; font-weight:900;">📍 تحديد دقيق</button>
        </div>
      `;
    } else if (st.status === "in") {
      const accWarn = st.accuracy > 60
        ? `<div style="margin-top:4px; color:#f59e0b; font-size:9.5px;">⚠️ دقة الإشارة متوسطة (±${st.accuracy}م) — يُفضل الاقتراب من النافذة أو كتابة علامة مميزة.</div>`
        : `<span style="color:#10b981; font-size:9.5px;">(دقة ممتازة ±${st.accuracy || 15}م)</span>`;
      const ptText = st.pointName ? ` • أقرب نقطة: <b>${escHtml(st.pointName)}</b>` : "";

      statusHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:4px;">
          <b style="color:#10b981; font-size:11.5px;">📍 من قرية: ${escHtml(st.village)}</b>
          ${accWarn.startsWith("<span") ? accWarn : ""}
        </div>
        <div style="font-size:10px; color:var(--gray-text); margin-bottom:5px;">
          المسافة المقدّرة: <b>${st.totalRoadM >= 1000 ? (st.totalRoadM / 1000).toFixed(2) + " كم" : st.totalRoadM + " متر"}</b>${ptText}
        </div>
        ${accWarn.startsWith("<div") ? accWarn : ""}
      `;
    } else {
      const distKm = (st.nearestDistM / 1000).toFixed(1);
      statusHTML = `
        <div style="background:rgba(239,68,68,0.14); border:1px solid #ef4444; border-radius:10px; padding:8px; margin-bottom:6px;">
          <b style="color:#fca5a5; font-size:11.5px; display:block; margin-bottom:3px;">🚫 عذراً، التوصيل غير متاح بعد لمنطقتك</b>
          <div style="font-size:10px; color:var(--text-color); line-height:1.5;">
            موقعك الحالي خارج حدود التغطية (أقرب قرية مخدومة هي <b>${escHtml(st.nearestVillage)}</b> وتبعد حوالي ${distKm} كم).
          </div>
          <div style="display:flex; gap:5px; margin-top:7px; flex-wrap:wrap;">
            <button type="button" onclick="window.MoaathGpsPro.enablePickupOverride()" class="btn" style="flex:1; padding:5px 8px; font-size:10px; background:${pickupOverrideActive ? "#10b981" : "rgba(16,185,129,0.2)"}; color:${pickupOverrideActive ? "#000" : "#10b981"}; border:1px solid #10b981;">
              ${pickupOverrideActive ? "✅ تم اختيار الاستلام من المتجر" : "🏬 سأستلم من المتجر مجاناً"}
            </button>
            <button type="button" onclick="window.MoaathGpsPro.requestCoverage()" class="btn" style="flex:1; padding:5px 8px; font-size:10px; background:rgba(212,175,55,0.16); color:#D4AF37; border:1px solid #D4AF37;">🔔 اطلب فتح قريتي</button>
          </div>
        </div>
      `;
    }

    panel.innerHTML = `
      ${statusHTML}
      <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:6px;">
        <button type="button" onclick="window.MoaathGpsPro.detectNow()" class="btn" style="flex:1; padding:4px 7px; font-size:9.5px; background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid rgba(56,189,248,0.4);">🔄 تحديث دقيق</button>
        ${savedHome ? `<button type="button" onclick="window.MoaathGpsPro.useSavedHome()" class="btn" style="flex:1; padding:4px 7px; font-size:9.5px; background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4);">🏠 بيتي المحفوظ</button>` : ""}
        ${st && st.status === "in" ? `<button type="button" onclick="window.MoaathGpsPro.saveAsHome()" class="btn" style="flex:1; padding:4px 7px; font-size:9.5px; background:rgba(212,175,55,0.14); color:#D4AF37; border:1px solid rgba(212,175,55,0.4);">💾 حفظ بيتي</button>` : ""}
      </div>
      <div style="margin-top:6px;">
        <input id="moaathGpsLandmarkInput" type="text" value="${escHtml(savedLandmark)}" placeholder="🏠 أقرب علامة مميزة لعامل التوصيل (مثال: بجانب الجامع / بيت أبو...)" class="form-control" style="width:100%; padding:5px 8px; font-size:10px; border-radius:9px;">
      </div>
    `;

    const lmInp = document.getElementById("moaathGpsLandmarkInput");
    if (lmInp) {
      lmInp.addEventListener("input", () => writeJSON(LANDMARK_KEY, lmInp.value.trim()));
    }
  }

  function syncSubmitButtonGuard() {
    const submitBtn = document.getElementById("submitOrderUnifiedBtn");
    if (!submitBtn) return;
    const isBlocked = !!(lastEvalState && lastEvalState.status === "out" && !pickupOverrideActive);
    submitBtn.style.opacity = isBlocked ? "0.45" : "1";
    submitBtn.dataset.gpsBlocked = isBlocked ? "1" : "0";
  }

  // ==========================================================================
  // 5) حقن بيانات القرية + روابط الأوفلاين لعامل التوصيل تلقائياً في الطلب
  // ==========================================================================
  function buildOfflineDeliveryFooter() {
    if (!lastEvalState) return "";
    const lm = String(document.getElementById("moaathGpsLandmarkInput")?.value || readJSON(LANDMARK_KEY, "") || "").trim();
    const lines = [];
    if (pickupOverrideActive) {
      lines.push("🏬 طريقة الاستلام: استلام شخصي من المتجر (مجاناً)");
    } else if (lastEvalState.village) {
      lines.push(`📍 من قرية: ${lastEvalState.village}${lastEvalState.pointName ? " (" + lastEvalState.pointName + ")" : ""}`);
    }
    if (lm) lines.push(`🏠 علامة مميزة: ${lm}`);
    if (lastEvalState.lat && lastEvalState.lng && !pickupOverrideActive) {
      const latF = Number(lastEvalState.lat).toFixed(6);
      const lngF = Number(lastEvalState.lng).toFixed(6);
      lines.push(`🛰️ إحداثيات (تعمل أوفلاين): ${latF},${lngF}`);
      lines.push(`🗺️ خرائط جوجل (أونلاين/أوفلاين): https://maps.google.com/?q=${latF},${lngF}`);
      lines.push(`🧭 رابط أوفلاين مباشر: geo:${latF},${lngF}?q=${latF},${lngF}`);
    }
    return lines.join("\n");
  }

  function hookOrderSubmissionAndWhatsApp() {
    // منع الإرسال إذا كان الزبون خارج جميع الحدود ولم يختر الاستلام من المتجر
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("#submitOrderUnifiedBtn") : null;
      if (!btn) return;
      if (lastEvalState && lastEvalState.status === "out" && !pickupOverrideActive) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (typeof window.showToast === "function") {
          window.showToast("🚫 عذراً، التوصيل غير متاح لمنطقتك بعد. يمكنك اختيار «الاستلام من المتجر مجاناً».");
        }
        return;
      }

      // حقن اسم القرية والعلامة المميزة وروابط الأوفلاين في حقل الملاحظات قبل إرسال الطلب مباشرة
      const footer = buildOfflineDeliveryFooter();
      if (footer) {
        const notesInp = document.querySelector("#cartModal input[placeholder*='ملاحظات'], #cartModal textarea[placeholder*='ملاحظات']");
        if (notesInp && !String(notesInp.value || "").includes("من قرية:") && !String(notesInp.value || "").includes("استلام شخصي")) {
          notesInp.value = (notesInp.value ? notesInp.value.trim() + "\n" : "") + footer;
        }
      }
    }, true);
  }

  // ==========================================================================
  // 6) إضافة حقل «نطاق التغطية حول النقطة (متر)» داخل لوحة الإدارة (#adminModal)
  // ==========================================================================
  function injectAdminPointRadiusField() {
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;
    if (document.getElementById("moaathAdminPointMaxRadius")) return;

    // البحث عن زر "+ إضافة نقطة توزيع" داخل الإعدادات
    const addPointBtn = Array.from(adminModal.querySelectorAll("button")).find((b) =>
      /إضافة\s*نقطة\s*توزيع/.test(b.textContent || "")
    );
    if (!addPointBtn || !addPointBtn.parentNode) return;

    const wrap = document.createElement("div");
    wrap.style.cssText = "grid-column: 1 / -1; margin: 5px 0; display:flex; align-items:center; gap:6px;";
    wrap.innerHTML = `
      <input id="moaathAdminPointMaxRadius" type="number" min="100" step="100" value="1500"
        placeholder="الحد الأقصى للتغطية حول هذه النقطة/القرية (متر)" class="form-control"
        style="flex:1; padding:7px 9px; font-size:11px; border:1px solid #38bdf8;">
      <span style="font-size:10px; color:#38bdf8; white-space:nowrap;">🎯 حد القرية (متر)</span>
    `;
    addPointBtn.parentNode.insertBefore(wrap, addPointBtn);

    addPointBtn.addEventListener("click", () => {
      const rVal = parseInt(document.getElementById("moaathAdminPointMaxRadius")?.value || "1500", 10);
      const container = addPointBtn.closest("div")?.parentElement || adminModal;
      const villageInp = container.querySelector("input[placeholder*='القرية']");
      const nameInp = container.querySelector("input[placeholder*='اسم النقطة']");
      const keyName = String(nameInp?.value || villageInp?.value || "").trim();
      const keyVillage = String(villageInp?.value || "").trim();
      if (keyName) savePointRadius(keyName, rVal);
      if (keyVillage) savePointRadius(keyVillage, rVal);
    }, true);
  }

  // ==========================================================================
  // 7) الواجهة البرمجية العامة والتشغيل التلقائي
  // ==========================================================================
  window.MoaathGpsPro = {
    version: "1.0",
    evaluateCoordinates,
    getOfflineFooter: buildOfflineDeliveryFooter,
    detectNow() {
      if (typeof window.showToast === "function") window.showToast("🛰️ جاري التقاط أدق إشارة GPS (3 ثوانٍ)...");
      captureBestGpsPosition((lat, lng, acc) => {
        applyCoordinatesToStore(lat, lng, acc, false);
        vibrate(15);
      });
    },
    saveAsHome() {
      if (!lastEvalState || !lastEvalState.lat) return;
      writeJSON(SAVED_HOME_KEY, {
        lat: lastEvalState.lat,
        lng: lastEvalState.lng,
        village: lastEvalState.village,
        savedAt: new Date().toLocaleDateString("ar-SY")
      });
      vibrate([15, 25, 15]);
      if (typeof window.showToast === "function") window.showToast("🏠 تم حفظ موقع بيتك الدائم للطلبات القادمة!");
      renderCartGpsProPanel();
    },
    useSavedHome() {
      const h = readJSON(SAVED_HOME_KEY, null);
      if (!h || !h.lat || !h.lng) return;
      applyCoordinatesToStore(h.lat, h.lng, 15, true);
    },
    enablePickupOverride() {
      pickupOverrideActive = !pickupOverrideActive;
      renderCartGpsProPanel();
      syncSubmitButtonGuard();
      vibrate(12);
    },
    requestCoverage() {
      if (!lastEvalState) return;
      const log = readJSON(DEMAND_LOG_KEY, []);
      log.unshift({ lat: lastEvalState.lat, lng: lastEvalState.lng, date: new Date().toLocaleDateString("ar-SY") });
      writeJSON(DEMAND_LOG_KEY, log.slice(0, 20));
      try {
        if (window.db && typeof window.db.ref === "function") {
          window.db.ref("gpsCoverageRequests").push({
            lat: lastEvalState.lat,
            lng: lastEvalState.lng,
            userName: window.currentUser?.name || "زائر",
            createdAt: Date.now()
          });
        }
      } catch (_) {}
      if (typeof window.showToast === "function") window.showToast("🔔 تم تسجيل طلبك لفتح التوصيل في منطقتك، شكراً لك!");
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("gps_pro", "1.0");
  }

  function hookCartModal() {
    if (typeof window.renderCartModalItems === "function" && !window.renderCartModalItems.__moaathGpsProHooked) {
      const orig = window.renderCartModalItems;
      const wrapped = function () {
        const res = orig.apply(this, arguments);
        // إذا كانت إحداثيات الزبون محددة مسبقاً من النظام الأصلي نقيمها فوراً
        const existingLat = parseFloat(window.customerLat || window.userLat || 0);
        const existingLng = parseFloat(window.customerLng || window.userLng || 0);
        if (!lastEvalState && existingLat && existingLng) {
          lastEvalState = evaluateCoordinates(existingLat, existingLng, 25);
        }
        setTimeout(() => {
          renderCartGpsProPanel();
          syncSubmitButtonGuard();
        }, 45);
        return res;
      };
      wrapped.__moaathGpsProHooked = true;
      window.renderCartModalItems = wrapped;
    }
  }

  function init() {
    pullRadiiFromFirebase();
    hookOrderSubmissionAndWhatsApp();
    hookCartModal();
    injectAdminPointRadiusField();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 1100);
  setInterval(injectAdminPointRadiusField, 1500);
})();

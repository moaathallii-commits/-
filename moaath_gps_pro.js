// ============================================================================
// نظام الـ GPS الاحترافي متعدد المخازن ونطاق القرى والتوصيل بدون إنترنت
// (moaath_gps_pro.js — v1.1 Multi-Branch Edition)
// - فلترة نقاط التوزيع حسب المخزن النشط (activeBranchId) بدقة
// - قراءة إحداثيات ونطاق كل مخزن على حدة (دعم تعدد المخازن/الفروع)
// - تنبيه ذكي للزبون إذا كان هناك مخزن آخر أقرب لموقعه أو يغطي منطقته + زر تبديل سريع
// - حفظ نطاق التغطية (maxRadius) لكل نقطة مرتبطاً بمعرّف المخزن (localStorage + Firebase)
// - جدار جغرافي (Geofence): يمنع التوصيل خارج الحدود مع خيار الاستلام من المتجر مجاناً
// - حارس دقة الـ GPS (أفضل قراءة خلال 3.5 ثوانٍ + تنبيه عند ضعف الدقة > 60م)
// - حفظ موقع البيت الدائم (🏠) + خانة «أقرب علامة مميزة» + روابط الأوفلاين (geo:) لعامل التوصيل
// - يعمل محلياً بـ 0 حصة API مع عزل أمني تام عن الدفع وشام كاش
// ============================================================================
(function () {
  if (window.__MOAATH_GPS_PRO_V11__) return;
  window.__MOAATH_GPS_PRO_V11__ = true;
  window.__MOAATH_GPS_PRO_V1__ = true;

  const SAVED_HOME_KEY = "moaath_gps_saved_home_v1";
  const POINT_RADII_KEY = "moaath_gps_point_radii_v2";
  const LEGACY_RADII_KEY = "moaath_gps_point_radii_v1";
  const LANDMARK_KEY = "moaath_gps_last_landmark_v1";
  const DEMAND_LOG_KEY = "moaath_gps_outside_demand_v1";

  let lastEvalState = null;
  let pickupOverrideActive = false;
  let lastObservedBranchId = null;

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

  function normKey(s) {
    return String(s || "").trim().toLowerCase();
  }

  function getActiveBranchId() {
    return String(
      window.activeBranchId ||
      window.currentBranchId ||
      localStorage.getItem("moaath_active_branch_id") ||
      "main"
    ).trim();
  }

  // ==========================================================================
  // 1) إدارة حدود التغطية (maxRadius) المرتبطة بمعرّف المخزن
  // ==========================================================================
  function getPointRadiiMap() {
    const v2 = readJSON(POINT_RADII_KEY, null);
    if (v2 && typeof v2 === "object") return v2;
    const legacy = readJSON(LEGACY_RADII_KEY, {});
    return (legacy && typeof legacy === "object") ? legacy : {};
  }

  function makeBranchPointKey(branchId, pointKey) {
    return `${String(branchId || "main").trim()}::${String(pointKey || "").trim()}`;
  }

  function lookupPointRadius(radiiMap, branchId, name, village) {
    const keys = [
      makeBranchPointKey(branchId, name),
      makeBranchPointKey(branchId, village),
      String(name || "").trim(),
      String(village || "").trim()
    ];
    for (const k of keys) {
      if (k && parseInt(radiiMap[k], 10) >= 50) return parseInt(radiiMap[k], 10);
    }
    return 1500; // افتراضي 1500 متر حول النقطة/القرية
  }

  function savePointRadius(branchId, pointKey, radiusMeters) {
    const r = parseInt(radiusMeters, 10);
    if (!pointKey || !r || r < 50) return;
    const bId = String(branchId || getActiveBranchId()).trim();
    const map = getPointRadiiMap();
    const composite = makeBranchPointKey(bId, pointKey);
    map[composite] = r;
    writeJSON(POINT_RADII_KEY, map);

    try {
      if (window.db && typeof window.db.ref === "function") {
        const safeKey = encodeURIComponent(composite).replace(/\./g, "_");
        window.db.ref("gpsPointRadiiV2/" + safeKey).set(r);
      }
    } catch (_) {}
  }

  function pullRadiiFromFirebase() {
    try {
      if (window.db && typeof window.db.ref === "function") {
        window.db.ref("gpsPointRadiiV2").once("value", (snap) => {
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

  // ==========================================================================
  // 2) قراءة جميع المخازن (الفروع) ونقاط التوزيع وفلترتها حسب المخزن
  // ==========================================================================
  function getRawDistributionPoints() {
    const cfg = window.gpsSettings || window.storeSettings?.gps || window.settings?.gps || window.storeConfig?.gps || {};
    const raw =
      window.deliveryPoints ||
      cfg.distributionPoints ||
      cfg.points ||
      window.distributionPoints ||
      window.settings?.distributionPoints ||
      [];
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") return Object.values(raw);
    return [];
  }

  function getAllBranchesList() {
    const cfg = window.gpsSettings || window.storeSettings?.gps || window.settings?.gps || window.storeConfig?.gps || {};
    const defaultLat = parseFloat(cfg.storeLat || cfg.lat || window.storeLat || document.getElementById("gpsStoreLat")?.value || 0);
    const defaultLng = parseFloat(cfg.storeLng || cfg.lng || window.storeLng || document.getElementById("gpsStoreLng")?.value || 0);
    const defaultLocalRadius =
      parseInt(cfg.tier2Max || cfg.localRadius || cfg.villageRadius || document.getElementById("gpsTier2Max")?.value || 1500, 10) || 1500;
    const globalMaxRadius =
      parseInt(cfg.maxDistance || cfg.tier3Max || cfg.maxRadius || document.getElementById("gpsMaxDistance")?.value || 0, 10) || 0;

    const rawBranches =
      window.branches ||
      window.storeBranches ||
      window.warehouses ||
      window.settings?.branches ||
      cfg.branches ||
      null;

    const list = [];
    if (rawBranches && typeof rawBranches === "object") {
      const entries = Array.isArray(rawBranches)
        ? rawBranches.map((b, idx) => [String(b?.id || b?.branchId || (idx === 0 ? "main" : "b_" + idx)), b])
        : Object.entries(rawBranches);

      entries.forEach(([key, b]) => {
        if (!b || typeof b !== "object") return;
        const id = String(b.id || b.branchId || key || "main").trim();
        const name = String(b.name || b.branchName || b.title || (id === "main" ? "مخزن العوينة" : id)).trim();
        const village = String(b.village || b.region || name.replace(/^مخزن\s+/, "").replace(/\s*\(.*?\)\s*/g, "")).trim() || name;
        const lat = parseFloat(b.lat || b.storeLat || b.gps?.lat || b.gps?.storeLat || (id === "main" ? defaultLat : 0));
        const lng = parseFloat(b.lng || b.storeLng || b.gps?.lng || b.gps?.storeLng || (id === "main" ? defaultLng : 0));
        const localRadius = parseInt(b.localRadius || b.tier2Max || b.gps?.tier2Max || defaultLocalRadius, 10) || defaultLocalRadius;
        const maxRadius = parseInt(b.maxDistance || b.gps?.maxDistance || globalMaxRadius, 10) || globalMaxRadius;
        list.push({ id, name, village, lat, lng, localRadius, maxRadius });
      });
    }

    // التأكد من وجود المخزن النشط في القائمة دائماً
    const activeId = getActiveBranchId();
    if (!list.some((b) => b.id === activeId)) {
      const activeName = String(
        window.activeBranchName ||
        document.querySelector(".store-header, header")?.textContent?.match(/مخزن\s+([^\s()]+)/)?.[0] ||
        "مخزن العوينة"
      ).trim();
      const activeVillage = activeName.replace(/^مخزن\s+/, "").trim() || "العوينة";
      list.unshift({
        id: activeId,
        name: activeName,
        village: activeVillage,
        lat: defaultLat,
        lng: defaultLng,
        localRadius: defaultLocalRadius,
        maxRadius: globalMaxRadius
      });
    }

    return list;
  }

  function pointBelongsToBranch(pt, branch) {
    if (!pt || !branch) return false;
    const ptBranchId = String(pt.branchId || pt.warehouseId || pt.branch || "").trim();
    // إذا كانت النقطة غير مربوطة بمخزن صريح (نقاط قديمة)، تُنسب للمخزن الرئيسي main
    if (!ptBranchId) return branch.id === "main";
    if (normKey(ptBranchId) === normKey(branch.id)) return true;
    if (normKey(ptBranchId) === normKey(branch.name)) return true;
    if (normKey(ptBranchId).includes(normKey(branch.village)) && branch.village.length >= 3) return true;
    return false;
  }

  function getPointsForBranch(branch) {
    const radiiMap = getPointRadiiMap();
    return getRawDistributionPoints()
      .filter((pt) => pt && parseFloat(pt.lat) && parseFloat(pt.lng) && pointBelongsToBranch(pt, branch))
      .map((pt) => {
        const name = String(pt.name || pt.pointName || pt.title || "نقطة توزيع").trim();
        const village = String(pt.village || pt.region || pt.area || name).trim();
        const roadDistM = parseInt(pt.realDistance || pt.roadDistance || pt.distance || 0, 10) || 0;
        const customR =
          parseInt(pt.maxRadius || pt.radius || 0, 10) ||
          lookupPointRadius(radiiMap, branch.id, name, village);
        return {
          branchId: branch.id,
          name,
          village,
          lat: parseFloat(pt.lat),
          lng: parseFloat(pt.lng),
          roadDistM,
          maxRadiusM: customR
        };
      });
  }

  // ==========================================================================
  // 3) تقييم الموقع ضد المخزن النشط + فحص وجود مخزن آخر أقرب للزبون
  // ==========================================================================
  function evaluateForSingleBranch(lat, lng, branch) {
    const candidates = [];
    if (branch.lat && branch.lng) {
      const dStore = haversineMeters(lat, lng, branch.lat, branch.lng);
      candidates.push({
        isLocalStore: true,
        village: branch.village,
        pointName: "مركز المخزن",
        distToNodeM: dStore,
        totalRoadM: dStore,
        maxRadiusM: branch.localRadius,
        inside: dStore <= branch.localRadius
      });
    }

    const pts = getPointsForBranch(branch);
    pts.forEach((pt) => {
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

    if (!candidates.length) {
      return {
        branch,
        configured: false,
        status: "in",
        village: branch.village,
        pointName: "",
        distToNodeM: 0,
        totalRoadM: 0,
        nearestVillage: branch.village,
        nearestDistM: 0
      };
    }

    const insideMatches = candidates
      .filter((c) => c.inside)
      .sort((a, b) => a.distToNodeM - b.distToNodeM);

    const bestInside = insideMatches.find((c) => !branch.maxRadius || c.totalRoadM <= branch.maxRadius);
    if (bestInside) {
      return {
        branch,
        configured: true,
        status: "in",
        village: bestInside.village,
        pointName: bestInside.isLocalStore ? "" : bestInside.pointName,
        distToNodeM: bestInside.distToNodeM,
        totalRoadM: bestInside.totalRoadM,
        nearestVillage: bestInside.village,
        nearestDistM: bestInside.distToNodeM
      };
    }

    const nearest = candidates.sort((a, b) => a.distToNodeM - b.distToNodeM)[0];
    return {
      branch,
      configured: true,
      status: "out",
      village: "",
      pointName: "",
      distToNodeM: nearest.distToNodeM,
      totalRoadM: nearest.totalRoadM,
      nearestVillage: nearest.village,
      nearestDistM: nearest.distToNodeM
    };
  }

  function evaluateCoordinates(lat, lng, accuracy = 20) {
    const activeId = getActiveBranchId();
    const allBranches = getAllBranchesList();
    const activeBranch = allBranches.find((b) => b.id === activeId) || allBranches[0];

    const currentRes = evaluateForSingleBranch(lat, lng, activeBranch);

    // فحص المخازن الأخرى: هل يوجد مخزن آخر يغطي الزبون أو أقرب إليه بشكل ملحوظ؟
    let betterBranchSuggestion = null;
    const otherBranches = allBranches.filter((b) => b.id !== activeBranch.id);

    if (otherBranches.length > 0) {
      const otherEvals = otherBranches
        .map((b) => evaluateForSingleBranch(lat, lng, b))
        .filter((ev) => ev.configured && ev.status === "in")
        .sort((a, b) => a.totalRoadM - b.totalRoadM);

      if (otherEvals.length > 0) {
        const bestOther = otherEvals[0];
        // نقترح المخزن الآخر إذا كان المخزن الحالي خارج التغطية، أو إذا كان المخزن الآخر أقرب بـ 400 متر على الأقل
        if (currentRes.status === "out" || (bestOther.totalRoadM + 400 < currentRes.totalRoadM)) {
          betterBranchSuggestion = {
            branchId: bestOther.branch.id,
            branchName: bestOther.branch.name,
            village: bestOther.village,
            totalRoadM: bestOther.totalRoadM,
            reason: currentRes.status === "out" ? "covers_area" : "closer"
          };
        }
      }
    }

    return {
      lat,
      lng,
      accuracy: Math.round(accuracy || 0),
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      status: currentRes.status,
      village: currentRes.village,
      pointName: currentRes.pointName,
      distToNodeM: currentRes.distToNodeM,
      totalRoadM: currentRes.totalRoadM,
      nearestVillage: currentRes.nearestVillage,
      nearestDistM: currentRes.nearestDistM,
      betterBranch: betterBranchSuggestion
    };
  }

  // ==========================================================================
  // 4) التقاط أفضل إشارة GPS (Best-of-3 Lock) + تبديل المخزن
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
      } else if (typeof window.showToast === "function") {
        window.showToast("⚠️ تعذّر التقاط موقعك، تأكد من تفعيل GPS واقترب من النافذة.");
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) bestPos = pos;
        if (pos.coords.accuracy <= 20) finish();
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );

    setTimeout(finish, 3500);
  }

  function applyCoordinatesToStore(lat, lng, accuracy, fromSavedHome = false) {
    pickupOverrideActive = false;
    lastObservedBranchId = getActiveBranchId();
    lastEvalState = evaluateCoordinates(lat, lng, accuracy);

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

  function switchToSuggestedBranch(targetBranchId, targetBranchName) {
    if (!targetBranchId) return;
    let switched = false;

    if (typeof window.switchBranch === "function") {
      window.switchBranch(targetBranchId);
      switched = true;
    } else if (typeof window.selectBranch === "function") {
      window.selectBranch(targetBranchId);
      switched = true;
    } else if (typeof window.changeActiveBranch === "function") {
      window.changeActiveBranch(targetBranchId);
      switched = true;
    } else {
      const sel = document.querySelector("#branchSelector, #storeBranchSelect, select[id*='branch'], select[id*='Branch']");
      if (sel) {
        sel.value = targetBranchId;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        switched = true;
      } else {
        window.activeBranchId = targetBranchId;
        try { localStorage.setItem("moaath_active_branch_id", targetBranchId); } catch (_) {}
        switched = true;
      }
    }

    if (switched && lastEvalState && lastEvalState.lat && lastEvalState.lng) {
      setTimeout(() => {
        applyCoordinatesToStore(lastEvalState.lat, lastEvalState.lng, lastEvalState.accuracy || 20, false);
        if (typeof window.showToast === "function") {
          window.showToast(`🏬 تم التحويل إلى «${targetBranchName || targetBranchId}» وتحديث نطاق التوصيل!`);
        }
      }, 250);
    }
  }

  // ==========================================================================
  // 5) واجهة الـ GPS المطوّرة داخل سلة المشتريات (#cartModal)
  // ==========================================================================
  function renderCartGpsProPanel() {
    const cartModal = document.getElementById("cartModal");
    if (!cartModal) return;
    const modalContent = cartModal.querySelector(".modal-content");
    if (!modalContent) return;

    // إعادة التقييم تلقائياً إذا تغيّر المخزن النشط
    const curBId = getActiveBranchId();
    if (lastEvalState && lastObservedBranchId && lastObservedBranchId !== curBId) {
      lastObservedBranchId = curBId;
      lastEvalState = evaluateCoordinates(lastEvalState.lat, lastEvalState.lng, lastEvalState.accuracy);
    }

    const activeEl = document.activeElement;
    if (activeEl && activeEl.id === "moaathGpsLandmarkInput") return;
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

    // بطاقة اقتراح المخزن الأقرب (إن وجد مخزن آخر أقرب أو يغطي المنطقة)
    let closerBranchBanner = "";
    if (st && st.betterBranch) {
      const bb = st.betterBranch;
      const distTxt = bb.totalRoadM >= 1000 ? (bb.totalRoadM / 1000).toFixed(1) + " كم" : bb.totalRoadM + " متر";
      const headline = bb.reason === "covers_area"
        ? `✨ خبر سار! «${escHtml(bb.branchName)}» يغطي منطقتك (${escHtml(bb.village)})`
        : `⚡ «${escHtml(bb.branchName)}» أقرب لموقعك (${distTxt}) — توصيل أسرع وأوفر!`;

      closerBranchBanner = `
        <div style="background:rgba(212,175,55,0.14); border:1px solid #D4AF37; border-radius:10px; padding:7px 8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <div style="font-size:10px; color:#fde68a; line-height:1.45;"><b>${headline}</b></div>
          <button type="button" onclick="window.MoaathGpsPro.switchBranch('${escHtml(bb.branchId)}', '${escHtml(bb.branchName)}')" class="btn" style="width:auto; flex-shrink:0; padding:4px 8px; font-size:9.5px; background:#D4AF37; color:#000; font-weight:900;">التحويل له</button>
        </div>
      `;
    }

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
        : `<span style="color:#10b981; font-size:9.5px;">(دقة ±${st.accuracy || 15}م)</span>`;
      const ptText = st.pointName ? ` • أقرب نقطة: <b>${escHtml(st.pointName)}</b>` : "";

      statusHTML = `
        ${closerBranchBanner}
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:4px;">
          <b style="color:#10b981; font-size:11.5px;">📍 من قرية: ${escHtml(st.village)}</b>
          ${accWarn.startsWith("<span") ? accWarn : ""}
        </div>
        <div style="font-size:10px; color:var(--gray-text); margin-bottom:5px;">
          المخزن: <b>${escHtml(st.branchName)}</b> • المسافة: <b>${st.totalRoadM >= 1000 ? (st.totalRoadM / 1000).toFixed(2) + " كم" : st.totalRoadM + " متر"}</b>${ptText}
        </div>
        ${accWarn.startsWith("<div") ? accWarn : ""}
      `;
    } else {
      const distKm = (st.nearestDistM / 1000).toFixed(1);
      statusHTML = `
        ${closerBranchBanner}
        <div style="background:rgba(239,68,68,0.14); border:1px solid #ef4444; border-radius:10px; padding:8px; margin-bottom:6px;">
          <b style="color:#fca5a5; font-size:11.5px; display:block; margin-bottom:3px;">🚫 عذراً، التوصيل غير متاح بعد لمنطقتك من «${escHtml(st.branchName)}»</b>
          <div style="font-size:10px; color:var(--text-color); line-height:1.5;">
            موقعك الحالي خارج حدود تغطية هذا المخزن (أقرب قرية مخدومة هي <b>${escHtml(st.nearestVillage)}</b> وتبعد حوالي ${distKm} كم).
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
    if (lmInp && !lmInp.dataset.gpsFocusStable) {
      lmInp.dataset.gpsFocusStable = "1";
      lmInp.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); });
      lmInp.addEventListener("touchstart", (ev) => { ev.stopPropagation(); }, { passive: true });
      lmInp.addEventListener("input", () => writeJSON(LANDMARK_KEY, lmInp.value));
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
  // 6) حقن بيانات القرية والمخزن وروابط الأوفلاين في الطلب تلقائياً
  // ==========================================================================
  function buildOfflineDeliveryFooter() {
    if (!lastEvalState) return "";
    const lm = String(document.getElementById("moaathGpsLandmarkInput")?.value || readJSON(LANDMARK_KEY, "") || "").trim();
    const lines = [];
    if (pickupOverrideActive) {
      lines.push(`🏬 استلام شخصي من: ${lastEvalState.branchName || "المتجر"} (مجاناً)`);
    } else if (lastEvalState.village) {
      lines.push(`📍 من قرية: ${lastEvalState.village}${lastEvalState.pointName ? " (" + lastEvalState.pointName + ")" : ""} | المخزن: ${lastEvalState.branchName}`);
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
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("#submitOrderUnifiedBtn") : null;
      if (!btn) return;
      if (lastEvalState && lastEvalState.status === "out" && !pickupOverrideActive) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (typeof window.showToast === "function") {
          window.showToast("🚫 التوصيل غير متاح لمنطقتك من هذا المخزن. يمكنك التحويل للمخزن الأقرب أو اختيار الاستلام من المتجر.");
        }
        return;
      }

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
  // 7) إضافة حقل «🎯 حد القرية (متر)» في الإدارة مربوطاً بالمخزن المختار
  // ==========================================================================
  function injectAdminPointRadiusField() {
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;
    if (document.getElementById("moaathAdminPointMaxRadius")) return;

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
      const branchSel = container.querySelector("select");
      const targetBranchId = String(branchSel?.value || getActiveBranchId()).trim();
      const villageInp = container.querySelector("input[placeholder*='القرية']");
      const nameInp = container.querySelector("input[placeholder*='اسم النقطة']");
      const keyName = String(nameInp?.value || villageInp?.value || "").trim();
      const keyVillage = String(villageInp?.value || "").trim();
      if (keyName) savePointRadius(targetBranchId, keyName, rVal);
      if (keyVillage) savePointRadius(targetBranchId, keyVillage, rVal);
    }, true);
  }

  // ==========================================================================
  // 8) الواجهة البرمجية العامة والتشغيل التلقائي
  // ==========================================================================
  window.MoaathGpsPro = {
    version: "1.1",
    evaluateCoordinates,
    getAllBranches: getAllBranchesList,
    getOfflineFooter: buildOfflineDeliveryFooter,
    switchBranch: switchToSuggestedBranch,
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
        branchId: lastEvalState.branchId,
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
      log.unshift({ lat: lastEvalState.lat, lng: lastEvalState.lng, branchId: lastEvalState.branchId, date: new Date().toLocaleDateString("ar-SY") });
      writeJSON(DEMAND_LOG_KEY, log.slice(0, 20));
      try {
        if (window.db && typeof window.db.ref === "function") {
          window.db.ref("gpsCoverageRequests").push({
            lat: lastEvalState.lat,
            lng: lastEvalState.lng,
            branchId: lastEvalState.branchId,
            userName: window.currentUser?.name || "زائر",
            createdAt: Date.now()
          });
        }
      } catch (_) {}
      if (typeof window.showToast === "function") window.showToast("🔔 تم تسجيل طلبك لفتح التوصيل في منطقتك، شكراً لك!");
    }
  };

  if (window.MoaathSystemRegistry && typeof window.MoaathSystemRegistry.register === "function") {
    window.MoaathSystemRegistry.register("gps_pro", "1.1");
  }

  function hookCartModal() {
    if (typeof window.renderCartModalItems === "function" && !window.renderCartModalItems.__moaathGpsProHooked) {
      const orig = window.renderCartModalItems;
      const wrapped = function () {
        const res = orig.apply(this, arguments);
        const existingLat = parseFloat(window.customerLat || window.userLat || 0);
        const existingLng = parseFloat(window.customerLng || window.userLng || 0);
        if (existingLat && existingLng) {
          if (!lastEvalState || lastObservedBranchId !== getActiveBranchId()) {
            lastObservedBranchId = getActiveBranchId();
            lastEvalState = evaluateCoordinates(existingLat, existingLng, 25);
          }
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

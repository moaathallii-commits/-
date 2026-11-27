/**
 * ============================================================================
 * جسر الربط بين «متجر معاذ» و«عالم تحديات معاذ (Moaath Arena)»
 * الملف: moaath_arena_bridge.js
 * - يعتمد الاقتصاد الموحد (1 ل.س = 1 عملة معاذ، ومرجع الصرف 150 ل.س = 1 دولار)
 * - يدعم توليد معرف الربط الفوري (MTH-XXXX-XXXX) والتحويل من محفظة المتجر
 * - يوفّر لوحة تحكم إدارة عالم التحديات + نظام أحداث الإدارة الـ 25
 * ============================================================================
 */
(function () {
  const ARENA_WORKER_URL = "https://moaath-arena-worker.moaathallii.workers.dev";
  const ARENA_APP_URL = "https://moaathallii-commits.github.io/moaath-arena/";
  const STORE_APP_URL = "https://moaathallii-commits.github.io/-/";

  const ADMIN_EVENT_OCCASIONS_25 = [
    { id: "occ_01_grand_opening", name: "الافتتاح الرسمي لعالم تحديات معاذ", kind: "highest_score" },
    { id: "occ_02_ramadan_nights", name: "ليالي رمضان المبارك", kind: "cumulative_score" },
    { id: "occ_03_eid_fitr", name: "مهرجان عيد الفطر السعيد", kind: "highest_score" },
    { id: "occ_04_eid_adha", name: "مهرجان عيد الأضحى المبارك", kind: "pvp_wins" },
    { id: "occ_05_hijri_new_year", name: "رأس السنة الهجرية", kind: "bosses_defeated" },
    { id: "occ_06_gregorian_new_year", name: "رأس السنة الميلادية", kind: "highest_score" },
    { id: "occ_07_school_season", name: "انطلاق الموسم الدراسي الجديد", kind: "cumulative_score" },
    { id: "occ_08_exams_focus", name: "تحدي التركيز والسرعة (موسم الاختبارات)", kind: "highest_score" },
    { id: "occ_09_spring_fest", name: "مهرجان الربيع الذهبي", kind: "bosses_defeated" },
    { id: "occ_10_summer_arena", name: "بطولة الصيف الكبرى", kind: "pvp_wins" },
    { id: "occ_11_national_day", name: "اليوم الوطني / يوم التأسيس", kind: "highest_score" },
    { id: "occ_12_store_anniversary", name: "ذكرى تأسيس متجر معاذ", kind: "cumulative_score" },
    { id: "occ_13_record_breakers", name: "أسبوع كاسري الأرقام القياسية", kind: "highest_score" },
    { id: "occ_14_combo_masters", name: "بطولة أسياد الكومبو", kind: "highest_score" },
    { id: "occ_15_bounty_hunters", name: "سباق صيّادي الجماجم والمكافآت", kind: "pvp_wins" },
    { id: "occ_16_boss_slayers", name: "تحدي قاهرة الزعماء", kind: "bosses_defeated" },
    { id: "occ_17_overdrive_week", name: "أسبوع السرعة القصوى", kind: "highest_score" },
    { id: "occ_18_titans_clash", name: "صراع العمالقة (مبالغ التحدي الكبرى)", kind: "pvp_wins" },
    { id: "occ_19_rising_stars", name: "تحدي النجوم الصاعدة", kind: "cumulative_score" },
    { id: "occ_20_weekend_royale", name: "نهاية الأسبوع الملكية", kind: "highest_score" },
    { id: "occ_21_crowning_night", name: "ليلة التتويج الكبرى", kind: "highest_score" },
    { id: "occ_22_friends_cup", name: "كأس الأصدقاء والتحديات", kind: "pvp_wins" },
    { id: "occ_23_double_rewards_fest", name: "مهرجان الجوائز والمكافآت", kind: "cumulative_score" },
    { id: "occ_24_throne_guardians", name: "بطولة حراس العرش", kind: "bosses_defeated" },
    { id: "occ_25_season_finale", name: "الحدث الختامي للموسم", kind: "highest_score" }
  ];

  async function getStoreIdToken() {
    if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
      return await window.firebase.auth().currentUser.getIdToken(false);
    }
    return localStorage.getItem("moaath_store_id_token") || "";
  }

  async function callBridgeApi(path, body = {}) {
    const token = await getStoreIdToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${ARENA_WORKER_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.code || "تعذر إتمام الطلب مع خادم التحديات.");
    }
    return data;
  }

  const MoaathArenaBridge = {
    workerUrl: ARENA_WORKER_URL,
    arenaUrl: ARENA_APP_URL,
    storeUrl: STORE_APP_URL,
    occasions25: ADMIN_EVENT_OCCASIONS_25,

    async getStoreInfo() {
      return await callBridgeApi("/bridge/store-info", {});
    },

    async generateBindKey() {
      return await callBridgeApi("/bridge/generate-bind-key", {});
    },

    async openArenaWithBindKey() {
      const info = await this.generateBindKey();
      const targetUrl = `${this.arenaUrl}?bind=${encodeURIComponent(info.bindKey)}`;
      window.open(targetUrl, "_blank");
      return info;
    },

    async transferStoreToArena(sypAmount) {
      const cleanSyp = Math.floor(Number(sypAmount || 0));
      if (!cleanSyp || cleanSyp <= 0) {
        throw new Error("يرجى إدخال مبلغ صحيح بالليرة السورية.");
      }
      const idempotencyKey = `br_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      return await callBridgeApi("/bridge/store-to-arena", {
        sypAmount: cleanSyp,
        idempotencyKey
      });
    },

    async getAdminDashboard() {
      return await callBridgeApi("/admin/dashboard", {});
    },

    async updateAdminConfig(configPayload) {
      return await callBridgeApi("/admin/config", configPayload || {});
    },

    async getAdminEventStatus() {
      return await callBridgeApi("/event/status", {});
    },

    async saveAdminEventConfig(eventPayload) {
      return await callBridgeApi("/admin/event/config", eventPayload || {});
    },

    async settleAdminEvent() {
      return await callBridgeApi("/admin/event/settle", {});
    },

    async resolveCashout(txId, action) {
      return await callBridgeApi("/admin/cashout/resolve", { txId, action });
    },

    async resolveTopup(txId, action) {
      return await callBridgeApi("/admin/topup/resolve", { txId, action });
    },

    async unfreezePlayer(phone) {
      return await callBridgeApi("/admin/player/unfreeze", { phone });
    }
  };

  window.MoaathArenaBridge = MoaathArenaBridge;
})();

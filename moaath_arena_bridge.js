/**
 * ============================================================================
 * جسر الربط بين «متجر معاذ» و«عالم تحديات معاذ (Moaath Arena)»
 * الملف: moaath_arena_bridge.js (v2 - مدمج بالكامل داخل تبويبات #adminModal)
 * - يعتمد الاقتصاد الموحد (1 ل.س = 1 عملة معاذ، ومرجع الصرف 150 ل.س = 1 دولار)
 * - يدعم توليد معرف الربط الفوري (MTH-XXXX-XXXX) والتحويل من محفظة المتجر
 * - يوفّر لوحة تحكم إدارة عالم التحديات مدمجة داخل #adminModal + نافذة الزبون openCustomerModal
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

  const EVENT_KIND_LABELS = {
    highest_score: "أعلى نتيجة في جولة واحدة",
    cumulative_score: "مجموع النقاط التراكمي",
    pvp_wins: "عدد انتصارات PvP",
    bosses_defeated: "عدد الزعماء المهزومين"
  };

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

  function escHtml(val) {
    return String(val === undefined || val === null ? "" : val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectEmbeddedStyles() {
    if (document.getElementById("moaathArenaAdminEmbedStyles")) return;
    const st = document.createElement("style");
    st.id = "moaathArenaAdminEmbedStyles";
    st.textContent = `
      .ma-adm-wrap {
        direction: rtl;
        text-align: right;
        background: linear-gradient(160deg, #0f172a 0%, #070d19 100%);
        border: 1.5px solid rgba(250, 204, 21, 0.45);
        border-radius: 14px;
        padding: 12px;
        margin: 6px 0;
        color: #f8fafc;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        font-family: Tahoma, system-ui, -apple-system, sans-serif;
      }
      .ma-adm-hdr {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding-bottom: 10px;
        margin-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .ma-adm-title {
        color: #fde047;
        font-weight: 900;
        font-size: 0.98rem;
        margin: 0;
      }
      .ma-adm-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 12px;
      }
      .ma-adm-tab {
        padding: 8px 4px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: #0b1222;
        color: #cbd5e1;
        font-size: 0.72rem;
        font-weight: 800;
        cursor: pointer;
      }
      .ma-adm-tab.active {
        background: linear-gradient(135deg, #fde047, #d97706);
        color: #111827;
        border-color: #fef08a;
      }
      .ma-adm-box {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 10px;
      }
      .ma-adm-box h4 {
        color: #7dd3fc;
        font-size: 0.84rem;
        margin: 0 0 8px;
      }
      .ma-adm-grid2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .ma-adm-stat {
        background: #070c18;
        border: 1px solid rgba(250, 204, 21, 0.28);
        border-radius: 10px;
        padding: 8px;
        text-align: center;
      }
      .ma-adm-stat small {
        display: block;
        color: #94a3b8;
        font-size: 0.68rem;
      }
      .ma-adm-stat strong {
        color: #4ade80;
        font-size: 0.92rem;
      }
      .ma-adm-field {
        margin-bottom: 8px;
      }
      .ma-adm-field label {
        display: block;
        font-size: 0.72rem;
        color: #cbd5e1;
        margin-bottom: 3px;
        font-weight: 700;
      }
      .ma-adm-field input,
      .ma-adm-field select,
      .ma-adm-field textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(212, 175, 55, 0.4);
        background: #070c18;
        color: #fff;
        font-size: 0.8rem;
      }
      .ma-adm-check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.76rem;
        color: #e2e8f0;
        margin: 6px 0;
        cursor: pointer;
      }
      .ma-adm-check input {
        width: auto;
        margin: 0;
      }
      .ma-adm-btn {
        padding: 8px 10px;
        border-radius: 9px;
        border: none;
        font-weight: 900;
        font-size: 0.78rem;
        cursor: pointer;
      }
      .ma-adm-btn-gold {
        background: linear-gradient(135deg, #fde047, #d97706);
        color: #111827;
        width: 100%;
      }
      .ma-adm-btn-green {
        background: #16a34a;
        color: #fff;
      }
      .ma-adm-btn-red {
        background: #dc2626;
        color: #fff;
      }
      .ma-adm-btn-outline {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(250, 204, 21, 0.45);
        color: #fde047;
      }
      .ma-adm-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
      }
      .ma-adm-row:first-of-type {
        border-top: none;
      }
      .ma-adm-msg {
        padding: 8px 10px;
        border-radius: 9px;
        font-size: 0.76rem;
        font-weight: 800;
        margin-bottom: 10px;
      }
      .ma-adm-msg.ok {
        background: rgba(34, 197, 94, 0.16);
        border: 1px solid #22c55e;
        color: #86efac;
      }
      .ma-adm-msg.err {
        background: rgba(239, 68, 68, 0.16);
        border: 1px solid #ef4444;
        color: #fca5a5;
      }
      .ma-adm-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(st);
  }

  function resolveAdminTabContainer(targetOrId) {
    if (targetOrId && typeof targetOrId === "object" && targetOrId.nodeType === 1) {
      return targetOrId;
    }
    if (typeof targetOrId === "string" && targetOrId.trim()) {
      const byId = document.getElementById(targetOrId.trim()) || document.querySelector(targetOrId.trim());
      if (byId) return byId;
    }

    // الاندماج المباشر داخل #adminModal .modal-content كتبويب إداري أصلي (.admin-tab)
    const adminModal = document.getElementById("adminModal");
    const adminContent = adminModal ? adminModal.querySelector(".modal-content") : null;
    if (adminContent) {
      // إخفاء جميع التبويبات الإدارية الأخرى
      adminContent.querySelectorAll(".admin-tab").forEach((t) => {
        t.style.display = "none";
      });
      // تحديث حالة الأزرار النشطة في شريط التبويبات
      const catsBar = adminContent.querySelector(".categories");
      if (catsBar) {
        catsBar.querySelectorAll(".cat-btn").forEach((b) => {
          const isArenaBtn = (b.getAttribute("onclick") || "").includes("openAdminModal");
          b.classList.toggle("active", isArenaBtn);
        });
      }
      let pane = document.getElementById("admTabArenaBridge");
      if (!pane) {
        pane = document.createElement("div");
        pane.id = "admTabArenaBridge";
        pane.className = "admin-tab";
        adminContent.appendChild(pane);
      }
      pane.style.display = "block";
      return pane;
    }

    // بديل احتياطي في حال استدعيت خارج #adminModal
    let fallback = document.getElementById("moaathArenaEmbeddedHost");
    if (!fallback) {
      fallback = document.createElement("div");
      fallback.id = "moaathArenaEmbeddedHost";
      fallback.style.maxWidth = "680px";
      fallback.style.margin = "10px auto";
      fallback.style.padding = "0 10px";
      document.body.insertBefore(fallback, document.body.firstChild);
    }
    return fallback;
  }

  const MoaathArenaBridge = {
    workerUrl: ARENA_WORKER_URL,
    arenaUrl: ARENA_APP_URL,
    storeUrl: STORE_APP_URL,
    occasions25: ADMIN_EVENT_OCCASIONS_25,
    _activeSubTab: "overview",

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
    },

    // نافذة الزبون عند الضغط على زر "🏆 عالم التحديات" في الشريط العلوي
    async openCustomerModal() {
      injectEmbeddedStyles();
      let ov = document.getElementById("moaathArenaCustomerModal");
      if (!ov) {
        ov = document.createElement("div");
        ov.id = "moaathArenaCustomerModal";
        ov.className = "modal-overlay";
        ov.style.zIndex = "10030";
        document.body.appendChild(ov);
      }
      ov.style.display = "flex";
      ov.innerHTML = `
        <div class="modal-content" style="max-width:420px; border-color:#fde047;">
          <div class="ma-adm-hdr">
            <h3 class="ma-adm-title">🏆 عالم تحديات معاذ</h3>
            <button type="button" class="ma-adm-btn ma-adm-btn-outline" id="maCustCloseBtn">✕</button>
          </div>
          <div id="maCustBanner" class="ma-adm-msg ma-adm-hidden"></div>
          <p style="font-size:0.78rem; color:#cbd5e1; margin:0 0 10px;">
            اربط حسابك في متجر معاذ مباشرة بعالم التحديات أو حوّل من محفظتك المسبقة (1 ل.س = 1 عملة).
          </p>
          <button type="button" class="ma-adm-btn ma-adm-btn-gold" id="maCustOpenArenaBtn" style="margin-bottom:10px;">
            🚀 توليد معرف الربط والدخول لعالم التحديات
          </button>
          <div class="ma-adm-box">
            <h4>💳 تحويل من محفظة المتجر إلى عملات التحدي</h4>
            <div class="ma-adm-field">
              <label>المبلغ بالليرة السورية (ل.س)</label>
              <input type="number" id="maCustTransferSyp" min="100" value="1000" />
            </div>
            <button type="button" class="ma-adm-btn ma-adm-btn-green" id="maCustTransferBtn" style="width:100%;">
              تحويل الآن
            </button>
          </div>
        </div>
      `;

      ov.querySelector("#maCustCloseBtn")?.addEventListener("click", () => {
        ov.style.display = "none";
      });
      ov.querySelector("#maCustOpenArenaBtn")?.addEventListener("click", async () => {
        try {
          await this.openArenaWithBindKey();
        } catch (e) {
          this._setBanner(ov, e.message, true);
        }
      });
      ov.querySelector("#maCustTransferBtn")?.addEventListener("click", async () => {
        const syp = Number(ov.querySelector("#maCustTransferSyp")?.value || 0);
        try {
          const res = await this.transferStoreToArena(syp);
          this._setBanner(ov, res.message || "تم التحويل بنجاح.");
        } catch (e) {
          this._setBanner(ov, e.message, true);
        }
      });
    },

    _setBanner(host, text, isError = false) {
      const el = host.querySelector("#maAdmBanner") || host.querySelector("#maCustBanner");
      if (!el) return;
      if (!text) {
        el.className = "ma-adm-msg ma-adm-hidden";
        el.textContent = "";
        return;
      }
      el.className = `ma-adm-msg ${isError ? "err" : "ok"}`;
      el.textContent = text;
    },

    _switchSubTab(host, tabName) {
      this._activeSubTab = tabName;
      host.querySelectorAll(".ma-adm-tab").forEach((b) => {
        b.classList.toggle("active", b.dataset.subtab === tabName);
      });
      ["overview", "requests", "events", "settings"].forEach((t) => {
        const pane = host.querySelector(`#maAdmPane_${t}`);
        if (pane) pane.classList.toggle("ma-adm-hidden", t !== tabName);
      });
    },

    async openAdminModal(targetContainer = null) {
      injectEmbeddedStyles();
      const host = resolveAdminTabContainer(targetContainer);
      host.style.display = "block";

      host.innerHTML = `
        <div class="ma-adm-wrap">
          <div class="ma-adm-hdr">
            <h3 class="ma-adm-title">🛡️ لوحة إدارة عالم تحديات معاذ</h3>
            <button type="button" class="ma-adm-btn ma-adm-btn-outline" id="maAdmRefreshBtn">🔄 تحديث</button>
          </div>
          <div style="text-align:center; padding:18px; color:#7dd3fc; font-weight:800;">
            ⏳ جاري تحميل بيانات الساحة والمحفظة الموحدة...
          </div>
        </div>
      `;

      host.querySelector("#maAdmRefreshBtn")?.addEventListener("click", () => {
        this.openAdminModal(host);
      });

      let dash;
      let evData = null;
      try {
        dash = await this.getAdminDashboard();
        try {
          evData = await this.getAdminEventStatus();
        } catch (_) {
          evData = null;
        }
      } catch (err) {
        host.innerHTML = `
          <div class="ma-adm-wrap">
            <div class="ma-adm-hdr">
              <h3 class="ma-adm-title">🛡️ لوحة إدارة عالم تحديات معاذ</h3>
              <button type="button" class="ma-adm-btn ma-adm-btn-outline" id="maAdmRetryBtn">إعادة المحاولة</button>
            </div>
            <div class="ma-adm-msg err">⚠️ ${escHtml(err.message || "تعذر فتح لوحة الإدارة.")}</div>
            <div style="font-size:0.74rem; color:#94a3b8;">
              تأكد من تسجيل الدخول في المتجر بحساب الإدارة (0965461504@moaath.store) واستقرار الاتصال.
            </div>
          </div>
        `;
        host.querySelector("#maAdmRetryBtn")?.addEventListener("click", () => this.openAdminModal(host));
        return;
      }

      const cfg = dash.config || {};
      const profit = dash.adminProfit || {};
      const pendingCashouts = Array.isArray(dash.pendingCashouts) ? dash.pendingCashouts : [];
      const pendingTopups = Array.isArray(dash.pendingTopups) ? dash.pendingTopups : [];
      const frozenPlayers = Array.isArray(dash.frozenPlayers) ? dash.frozenPlayers : [];
      const recentAlerts = Array.isArray(dash.recentAlerts) ? dash.recentAlerts : [];
      const activeEv = (evData && evData.event) || {};

      const occasionsOptions = ADMIN_EVENT_OCCASIONS_25.map((o, idx) => {
        const num = idx + 1;
        const selected = Number(activeEv.eventNumber || 1) === num ? "selected" : "";
        return `<option value="${num}" data-kind="${escHtml(o.kind)}" data-name="${escHtml(o.name)}" ${selected}>#${num} - ${escHtml(o.name)} (${escHtml(EVENT_KIND_LABELS[o.kind] || o.kind)})</option>`;
      }).join("");

      const topupsHtml = pendingTopups.length
        ? pendingTopups
            .map(
              (t) => `
              <div class="ma-adm-row">
                <div>
                  <strong style="color:#fde047;">${escHtml(t.displayName || t.phone)}</strong> (${escHtml(t.phone)})<br/>
                  <span style="color:#4ade80;">المبلغ: ${Number(t.sypAmount || t.pts || 0).toLocaleString()} ل.س</span>
                  <small style="color:#94a3b8;"> • ${escHtml(t.txId)}</small>
                </div>
                <div style="display:flex; gap:5px;">
                  <button type="button" class="ma-adm-btn ma-adm-btn-green" data-topup-act="approve" data-tx="${escHtml(t.txId)}">قبول</button>
                  <button type="button" class="ma-adm-btn ma-adm-btn-red" data-topup-act="reject" data-tx="${escHtml(t.txId)}">رفض</button>
                </div>
              </div>`
            )
            .join("")
        : `<div style="font-size:0.75rem; color:#94a3b8;">لا توجد طلبات شحن معلقة حالياً.</div>`;

      const cashoutsHtml = pendingCashouts.length
        ? pendingCashouts
            .map(
              (c) => `
              <div class="ma-adm-row">
                <div>
                  <strong style="color:#fde047;">${escHtml(c.displayName || c.phone)}</strong> (${escHtml(c.phone)})<br/>
                  <span style="color:#38bdf8;">${Number(c.sypAmount || c.pts || 0).toLocaleString()} ل.س</span>
                  <small style="color:#cbd5e1;"> • ${c.method === "shamcash" ? "شام كاش: " + escHtml(c.shamCashId || "-") : "محفظة المتجر"}</small>
                </div>
                <div style="display:flex; gap:5px;">
                  <button type="button" class="ma-adm-btn ma-adm-btn-green" data-cash-act="approve" data-tx="${escHtml(c.txId)}">اعتماد</button>
                  <button type="button" class="ma-adm-btn ma-adm-btn-red" data-cash-act="reject" data-tx="${escHtml(c.txId)}">رفض</button>
                </div>
              </div>`
            )
            .join("")
        : `<div style="font-size:0.75rem; color:#94a3b8;">لا توجد طلبات سحب بانتظار التدقيق.</div>`;

      const frozenHtml = frozenPlayers.length
        ? frozenPlayers
            .map(
              (fp) => `
              <div class="ma-adm-row">
                <div>
                  <strong style="color:#fca5a5;">${escHtml(fp.displayName || fp.phone)}</strong> (${escHtml(fp.phone)})<br/>
                  <small style="color:#94a3b8;">الرصيد: ${Number(fp.points || 0).toLocaleString()} • تنبيهات: ${Number(fp.flags || 0)}</small>
                </div>
                <button type="button" class="ma-adm-btn ma-adm-btn-outline" data-unfreeze="${escHtml(fp.phone)}">فك التجميد</button>
              </div>`
            )
            .join("")
        : `<div style="font-size:0.75rem; color:#94a3b8;">لا توجد حسابات مجمدة حالياً.</div>`;

      const alertsHtml = recentAlerts.slice(0, 6).length
        ? recentAlerts
            .slice(0, 6)
            .map(
              (a) => `
              <div class="ma-adm-row">
                <div>
                  <strong style="color:#fde047;">${escHtml(a.reason || a.code || "تنبيه أمني")}</strong>
                  <small style="color:#94a3b8;"> • ${escHtml(a.phone || "-")}</small>
                </div>
              </div>`
            )
            .join("")
        : `<div style="font-size:0.75rem; color:#94a3b8;">السجل الأمني نظيف.</div>`;

      host.innerHTML = `
        <div class="ma-adm-wrap">
          <div class="ma-adm-hdr">
            <h3 class="ma-adm-title">🛡️ لوحة إدارة عالم تحديات معاذ</h3>
            <button type="button" class="ma-adm-btn ma-adm-btn-outline" id="maAdmRefreshBtn">🔄 تحديث</button>
          </div>

          <div id="maAdmBanner" class="ma-adm-msg ma-adm-hidden"></div>

          <div class="ma-adm-tabs">
            <button type="button" class="ma-adm-tab" data-subtab="overview">📊 الملخص</button>
            <button type="button" class="ma-adm-tab" data-subtab="requests">💳 الطلبات (${pendingTopups.length + pendingCashouts.length})</button>
            <button type="button" class="ma-adm-tab" data-subtab="events">🎪 الأحداث (25)</button>
            <button type="button" class="ma-adm-tab" data-subtab="settings">⚙️ الإعدادات</button>
          </div>

          <div id="maAdmPane_overview">
            <div class="ma-adm-grid2" style="margin-bottom:10px;">
              <div class="ma-adm-stat">
                <small>إجمالي إيرادات الإدارة</small>
                <strong>${Number(profit.totalPts || 0).toLocaleString()} عملة</strong>
              </div>
              <div class="ma-adm-stat">
                <small>المعادل بالليرة / الدولار</small>
                <strong>${Number(profit.totalSyp || 0).toLocaleString()} ل.س ($${Number(profit.totalUsd || 0)})</strong>
              </div>
              <div class="ma-adm-stat">
                <small>عمولات الإحالة المدفوعة</small>
                <strong style="color:#38bdf8;">${Number(profit.referralPaidPts || 0).toLocaleString()} عملة</strong>
              </div>
              <div class="ma-adm-stat">
                <small>التعزيز الديناميكي الحالي</small>
                <strong style="color:#fde047;">+${Number(cfg.recordDynamicBoostPct || 0)}%</strong>
              </div>
            </div>

            <div class="ma-adm-box">
              <h4>🔒 الحسابات المجمدة (${frozenPlayers.length})</h4>
              ${frozenHtml}
            </div>

            <div class="ma-adm-box">
              <h4>🚨 آخر التنبيهات الأمنية</h4>
              ${alertsHtml}
            </div>
          </div>

          <div id="maAdmPane_requests" class="ma-adm-hidden">
            <div class="ma-adm-box">
              <h4>📥 طلبات شحن شام كاش المعلقة (${pendingTopups.length})</h4>
              ${topupsHtml}
            </div>
            <div class="ma-adm-box">
              <h4>📤 طلبات السحب بانتظار المراجعة (${pendingCashouts.length})</h4>
              ${cashoutsHtml}
            </div>
          </div>

          <div id="maAdmPane_events" class="ma-adm-hidden">
            <div class="ma-adm-box">
              <h4>🎪 إعداد وتفعيل حدث إداري (من أصل 25 مناسبة)</h4>
              <label class="ma-adm-check">
                <input type="checkbox" id="maEvtEnabled" ${activeEv.enabled ? "checked" : ""} />
                <span>تفعيل الحدث الإداري حالياً في تبويب «الأحداث»</span>
              </label>
              <div class="ma-adm-field">
                <label>اختر المناسبة (1 إلى 25)</label>
                <select id="maEvtSelect">${occasionsOptions}</select>
              </div>
              <div class="ma-adm-field">
                <label>عنوان الحدث الظاهر للاعبين</label>
                <input type="text" id="maEvtTitle" value="${escHtml(activeEv.title || ADMIN_EVENT_OCCASIONS_25[0].name)}" />
              </div>
              <div class="ma-adm-grid2">
                <div class="ma-adm-field">
                  <label>الجائزة الثابتة (عملة / ل.س)</label>
                  <input type="number" id="maEvtReward" min="50" value="${Number(activeEv.fixedRewardPts || 1000)}" />
                </div>
                <div class="ma-adm-field">
                  <label>مدة الحدث (بالساعات)</label>
                  <input type="number" id="maEvtHours" min="1" max="720" value="168" />
                </div>
              </div>
              <div class="ma-adm-field">
                <label>شروط الفوز المفصلة</label>
                <textarea id="maEvtRules" rows="2">${escHtml(activeEv.rulesText || "حقق أعلى إنجاز وفق نوع التحدي المحدد قبل انتهاء مدة الحدث.")}</textarea>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <button type="button" class="ma-adm-btn ma-adm-btn-gold" id="maEvtSaveBtn">💾 حفظ وتفعيل الحدث</button>
                <button type="button" class="ma-adm-btn ma-adm-btn-green" id="maEvtSettleBtn">🏆 تصفية وتوزيع الجائزة</button>
              </div>
            </div>
          </div>

          <div id="maAdmPane_settings" class="ma-adm-hidden">
            <div class="ma-adm-box">
              <h4>⚙️ إعدادات الاقتصاد وشام كاش والطوارئ</h4>
              <label class="ma-adm-check">
                <input type="checkbox" id="maCfgKillSwitch" ${cfg.killSwitch ? "checked" : ""} />
                <span style="color:#fca5a5;">وضع الصيانة الطارئ (إيقاف اللعب مؤقتاً)</span>
              </label>
              <label class="ma-adm-check">
                <input type="checkbox" id="maCfgShamTopup" ${cfg.shamCashTopupEnabled ? "checked" : ""} />
                <span>تفعيل الشحن المباشر عبر شام كاش</span>
              </label>
              <label class="ma-adm-check">
                <input type="checkbox" id="maCfgShamCashout" ${cfg.shamCashCashoutEnabled ? "checked" : ""} />
                <span>تفعيل السحب المباشر عبر شام كاش</span>
              </label>
              <div class="ma-adm-field">
                <label>معرّف شام كاش الإدارة</label>
                <input type="text" id="maCfgAdminSham" value="${escHtml(cfg.adminShamCashId || "")}" placeholder="أدخل معرف شام كاش الإدارة" />
              </div>
              <div class="ma-adm-grid2">
                <div class="ma-adm-field">
                  <label>رسم كسر الرقم (عملة)</label>
                  <input type="number" id="maCfgRecFee" min="1" value="${Number(cfg.recordEntryCostPts || 10)}" />
                </div>
                <div class="ma-adm-field">
                  <label>الحد الأدنى للسحب (عملة)</label>
                  <input type="number" id="maCfgMinCashout" min="10" value="${Number(cfg.minCashoutPts || 100)}" />
                </div>
                <div class="ma-adm-field">
                  <label>الحد الأدنى للشحن (ل.س)</label>
                  <input type="number" id="maCfgMinTopup" min="10" value="${Number(cfg.minTopupSYP || 100)}" />
                </div>
                <div class="ma-adm-field">
                  <label>سعر صرف الدولار (ل.س)</label>
                  <input type="number" id="maCfgUsdRate" min="100" value="${Number(cfg.usdToSypRate || 150)}" />
                </div>
              </div>
              <button type="button" class="ma-adm-btn ma-adm-btn-gold" id="maCfgSaveBtn">💾 حفظ الإعدادات</button>
            </div>
          </div>
        </div>
      `;

      this._switchSubTab(host, this._activeSubTab || "overview");

      host.querySelector("#maAdmRefreshBtn")?.addEventListener("click", () => {
        this.openAdminModal(host);
      });

      host.querySelectorAll(".ma-adm-tab").forEach((btn) => {
        btn.addEventListener("click", () => this._switchSubTab(host, btn.dataset.subtab));
      });

      host.querySelectorAll("[data-topup-act]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const res = await this.resolveTopup(btn.dataset.tx, btn.dataset.topupAct);
            this._setBanner(host, res.message || "تم تنفيذ العملية بنجاح.");
            setTimeout(() => this.openAdminModal(host), 700);
          } catch (e) {
            this._setBanner(host, e.message, true);
            btn.disabled = false;
          }
        });
      });

      host.querySelectorAll("[data-cash-act]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const res = await this.resolveCashout(btn.dataset.tx, btn.dataset.cashAct);
            this._setBanner(host, res.message || "تم تحديث طلب السحب.");
            setTimeout(() => this.openAdminModal(host), 700);
          } catch (e) {
            this._setBanner(host, e.message, true);
            btn.disabled = false;
          }
        });
      });

      host.querySelectorAll("[data-unfreeze]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const res = await this.unfreezePlayer(btn.dataset.unfreeze);
            this._setBanner(host, res.message || "تم فك تجميد الحساب.");
            setTimeout(() => this.openAdminModal(host), 700);
          } catch (e) {
            this._setBanner(host, e.message, true);
            btn.disabled = false;
          }
        });
      });

      const evtSel = host.querySelector("#maEvtSelect");
      evtSel?.addEventListener("change", () => {
        const opt = evtSel.options[evtSel.selectedIndex];
        const titleInp = host.querySelector("#maEvtTitle");
        if (opt && titleInp) titleInp.value = opt.dataset.name || "";
      });

      host.querySelector("#maEvtSaveBtn")?.addEventListener("click", async () => {
        const sel = host.querySelector("#maEvtSelect");
        const opt = sel.options[sel.selectedIndex];
        const eventNumber = Number(sel.value || 1);
        const kind = (opt && opt.dataset.kind) || "highest_score";
        const hours = Math.max(1, Number(host.querySelector("#maEvtHours")?.value || 168));
        try {
          const res = await this.saveAdminEventConfig({
            enabled: Boolean(host.querySelector("#maEvtEnabled")?.checked),
            eventNumber,
            occasionId: ADMIN_EVENT_OCCASIONS_25[eventNumber - 1]?.id || "occ_01_grand_opening",
            title: host.querySelector("#maEvtTitle")?.value.trim(),
            kind,
            fixedRewardPts: Math.max(10, Number(host.querySelector("#maEvtReward")?.value || 1000)),
            rulesText: host.querySelector("#maEvtRules")?.value.trim(),
            endAt: Date.now() + hours * 3600000
          });
          this._setBanner(host, res.message || "تم حفظ إعدادات الحدث بنجاح.");
        } catch (e) {
          this._setBanner(host, e.message, true);
        }
      });

      host.querySelector("#maEvtSettleBtn")?.addEventListener("click", async () => {
        try {
          const res = await this.settleAdminEvent();
          this._setBanner(host, res.message || "تمت تصفية الحدث وتوزيع الجوائز.");
        } catch (e) {
          this._setBanner(host, e.message, true);
        }
      });

      host.querySelector("#maCfgSaveBtn")?.addEventListener("click", async () => {
        try {
          const res = await this.updateAdminConfig({
            killSwitch: Boolean(host.querySelector("#maCfgKillSwitch")?.checked),
            shamCashTopupEnabled: Boolean(host.querySelector("#maCfgShamTopup")?.checked),
            shamCashCashoutEnabled: Boolean(host.querySelector("#maCfgShamCashout")?.checked),
            adminShamCashId: host.querySelector("#maCfgAdminSham")?.value.trim(),
            recordEntryCostPts: Number(host.querySelector("#maCfgRecFee")?.value || 10),
            minCashoutPts: Number(host.querySelector("#maCfgMinCashout")?.value || 100),
            minTopupSYP: Number(host.querySelector("#maCfgMinTopup")?.value || 100),
            usdToSypRate: Number(host.querySelector("#maCfgUsdRate")?.value || 150)
          });
          this._setBanner(host, res.message || "تم حفظ الإعدادات بنجاح.");
        } catch (e) {
          this._setBanner(host, e.message, true);
        }
      });
    }
  };

  window.MoaathArenaBridge = MoaathArenaBridge;
})();

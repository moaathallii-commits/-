/**
 * وحدة الجسر الآمن بين «متجر معاذ» و«عالم التحديات والمسابقات» (v2.0 — الدفع بالليرة السورية + التحكم بأسعار الإطارات الـ 15)
 * المسار في مستودع متجر معاذ: moaath_arena_bridge.js (في الجذر الرئيسي بجانب index.html)
 * - الدفع والشحن بالليرة السورية (ل.س) مع حاسبة عملات حيّة وأزرار شحن سريعة
 * - تمرير معرّف الربط تلقائياً (?bind=...) عند فتح عالم التحديات
 * - لوحة إدارة مقسمة إلى 4 تبويبات (الاقتصاد والليرة، البطولات الأسبوعية، أسعار الإطارات الـ 15، السحب والأمان)
 * - عزل تام (0% ذكاء اصطناعي في المال أو النقاط أو التحويلات)
 */

(function () {
  if (window.__MOAATH_ARENA_BRIDGE_V20__) return;
  window.__MOAATH_ARENA_BRIDGE_V20__ = true;

  const ARENA_WORKER_URL = 'https://moaath-arena-worker.moaathallii.workers.dev';
  const ARENA_APP_URL = 'https://moaathallii-commits.github.io/moaath-arena/';

  const esc = (s) =>
    typeof window.moaathEscapeHtml === 'function'
      ? window.moaathEscapeHtml(s)
      : String(s ?? '').replace(/[&<>"']/g, (c) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

  function injectStyles() {
    if (document.getElementById('moaath-arena-bridge-css')) return;
    const style = document.createElement('style');
    style.id = 'moaath-arena-bridge-css';
    style.textContent = `
      .mab-backdrop {
        position: fixed; inset: 0; background: rgba(7, 12, 24, 0.9);
        backdrop-filter: blur(6px);
        z-index: 2000000 !important; display: flex; justify-content: center; align-items: center;
        padding: 14px; direction: rtl; font-family: system-ui, -apple-system, Tahoma, sans-serif;
      }
      .mab-modal {
        background: linear-gradient(165deg, #162238, #0d1526); color: #f8fafc;
        width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto;
        border-radius: 20px; border: 1.5px solid rgba(212, 175, 55, 0.55); padding: 18px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.65);
      }
      .mab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .mab-title { color: #f3d576; font-size: 1.08rem; font-weight: 900; }
      .mab-close { background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; font-size: 1rem; cursor: pointer; }
      .mab-box { background: rgba(7, 12, 24, 0.78); border: 1px solid rgba(203, 213, 225, 0.14); border-radius: 14px; padding: 12px; margin-bottom: 10px; }
      .mab-banner {
        background: linear-gradient(135deg, rgba(212,175,55,0.22), rgba(56,189,248,0.14));
        border: 1px solid rgba(243,213,118,0.55); border-radius: 12px; padding: 10px;
        text-align: center; margin-bottom: 10px; font-size: 0.84rem;
      }
      .mab-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 12px; }
      .mab-tab {
        padding: 8px 4px; border-radius: 10px; border: 1px solid rgba(212,175,55,0.3);
        background: #0b1120; color: #cbd5e1; font-size: 0.73rem; font-weight: 800; cursor: pointer;
      }
      .mab-tab.active { background: linear-gradient(135deg, #f3d576, #d4af37); color: #0b1120; border-color: #f3d576; }
      .mab-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 8px 0; }
      .mab-preset {
        padding: 7px 4px; border-radius: 8px; border: 1px solid rgba(56,189,248,0.45);
        background: rgba(56,189,248,0.12); color: #7dd3fc; font-size: 0.75rem; font-weight: 800; cursor: pointer;
      }
      .mab-preset:active { transform: scale(0.95); }
      .mab-key { font-family: monospace; font-size: 1.2rem; letter-spacing: 2px; color: #4ade80; text-align: center; padding: 10px; background: #0f172a; border-radius: 10px; margin: 8px 0; border: 1px dashed #d4af37; user-select: all; }
      .mab-btn { width: 100%; padding: 11px; border-radius: 11px; border: none; font-weight: 800; font-size: 0.9rem; cursor: pointer; margin-top: 7px; }
      .mab-btn-gold { background: linear-gradient(135deg, #f3d576, #d4af37); color: #0b1120; }
      .mab-btn-blue { background: linear-gradient(135deg, #2563eb, #0284c7); color: #fff; }
      .mab-btn-green { background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; }
      .mab-btn-red { background: #dc2626; color: #fff; }
      .mab-btn-outline { background: transparent; border: 1px solid #64748b; color: #cbd5e1; }
      .mab-input { width: 100%; padding: 9px; border-radius: 9px; border: 1px solid rgba(212,175,55,0.45); background: #0f172a; color: #fff; text-align: center; margin: 4px 0; box-sizing: border-box; font-size: 0.9rem; }
      .mab-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.84rem; margin: 6px 0; }
      .mab-small { font-size: 0.78rem; color: #cbd5e1; line-height: 1.5; }
      .mab-calc { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.45); color: #4ade80; border-radius: 10px; padding: 8px; text-align: center; font-weight: 800; font-size: 0.86rem; margin-top: 6px; }
    `;
    document.head.appendChild(style);
  }

  function resolveStoreSession() {
    let u = window.currentUser || null;
    if (!u || !u.phone) {
      try {
        const cached = JSON.parse(localStorage.getItem('moaath_user') || 'null');
        if (cached && cached.phone) u = cached;
      } catch (_) {}
    }
    return {
      u,
      phone: u?.phone ? String(u.phone).trim() : '',
      userName: u?.name ? String(u.name).trim() : ''
    };
  }

  async function getAuthContext() {
    let idToken = '';
    try {
      if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        idToken = await firebase.auth().currentUser.getIdToken(false);
      } else if (window.auth && window.auth.currentUser && typeof window.auth.currentUser.getIdToken === 'function') {
        idToken = await window.auth.currentUser.getIdToken(false);
      }
    } catch (_) {}

    const sess = resolveStoreSession();
    if (!idToken && !sess.phone) {
      throw new Error('يرجى تسجيل الدخول بحسابك (رقم الهاتف) في متجر معاذ أولاً.');
    }
    return { idToken, phone: sess.phone, userName: sess.userName };
  }

  async function workerRequest(path, body = {}) {
    const ctx = await getAuthContext();
    const headers = { 'Content-Type': 'application/json' };
    if (ctx.idToken) headers['Authorization'] = `Bearer ${ctx.idToken}`;

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 9500) : null;

    try {
      const res = await fetch(`${ARENA_WORKER_URL}${path}`, {
        method: 'POST',
        headers,
        signal: ctrl ? ctrl.signal : undefined,
        body: JSON.stringify({
          ...body,
          bridgePhone: body.bridgePhone || ctx.phone || undefined,
          bridgeUserName: body.bridgeUserName || ctx.userName || undefined
        })
      });
      if (timer) clearTimeout(timer);
      const rawText = await res.text();
      let data = {};
      try { data = JSON.parse(rawText); } catch (_) { data = { message: rawText }; }
      if (!res.ok) throw new Error(data.message || data.error || `خطأ من الخادم (${res.status})`);
      return data;
    } catch (err) {
      if (timer) clearTimeout(timer);
      const msg = String(err?.message || err || '');
      if (err?.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بخادم عالم التحديات.');
      if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) throw new Error('تعذر الوصول إلى خادم عالم التحديات. تحقق من الإنترنت.');
      throw new Error(msg);
    }
  }

  function closeModal() {
    const el = document.getElementById('mab-modal-root');
    if (el) el.remove();
    document.documentElement.classList.remove('moaath-modal-locked');
    document.body.classList.remove('moaath-modal-locked');
  }

  function createModal(title, innerHTML) {
    injectStyles();
    closeModal();
    document.documentElement.classList.add('moaath-modal-locked');
    document.body.classList.add('moaath-modal-locked');

    const root = document.createElement('div');
    root.id = 'mab-modal-root';
    root.className = 'mab-backdrop';
    root.addEventListener('click', (e) => { if (e.target === root) closeModal(); });
    root.innerHTML = `
      <div class="mab-modal">
        <div class="mab-header">
          <div class="mab-title">${esc(title)}</div>
          <button type="button" class="mab-close" onclick="window.MoaathArenaBridge.close()">✕</button>
        </div>
        ${innerHTML}
      </div>
    `;
    document.body.appendChild(root);
  }

  let latestBuyRateSYP = 150;
  let latestGeneratedKey = '';
  let adminDashboardCache = null;
  let adminActiveTab = 'eco';

  function updateSypCalc() {
    const syp = Number(document.getElementById('mabSypInput')?.value || 0);
    const coins = latestBuyRateSYP > 0 ? Math.floor(syp / latestBuyRateSYP) : 0;
    const calcEl = document.getElementById('mabSypCalc');
    if (calcEl) {
      calcEl.textContent = coins > 0
        ? `✨ ستحصل فوراً على: ${coins.toLocaleString()} عملة معاذ`
        : 'أدخل مبلغاً بالليرة السورية لحساب العملات';
    }
  }

  function formatDatetimeLocal(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  window.MoaathArenaBridge = {
    close: closeModal,
    updateSypCalc,

    setSypPreset(val) {
      const inp = document.getElementById('mabSypInput');
      if (inp) { inp.value = val; updateSypCalc(); }
    },

    async openCustomerModal() {
      const sess = resolveStoreSession();
      latestGeneratedKey = '';
      const acctLine = sess.phone
        ? `👤 <b>${esc(sess.userName || 'زبون')}</b> (${esc(sess.phone)})`
        : `<span style="color:#fbbf24;">⚠️ سجّل دخولك في متجر معاذ أولاً.</span>`;

      createModal('🏆 عالم تحديات معاذ', `
        <div class="mab-small" style="margin-bottom:8px; display:flex; justify-content:space-between; padding:7px 10px; background:rgba(255,255,255,0.04); border-radius:10px;">
          <span>${acctLine}</span>
          <span id="mabStoreSypBal" style="color:#4ade80; font-weight:800;">جاري التحميل...</span>
        </div>

        <div id="mabWeeklyTeaser" class="mab-banner">
          🔥 الجوائز الأسبوعية المتاحة في الساحة: <b id="mabPoolVal">...</b> عملة
        </div>

        <div class="mab-box">
          <div style="font-weight:800; color:#f3d576; margin-bottom:4px;">1. ربط جهازك والدخول السريع</div>
          <p class="mab-small">ولّد معرفك السري ثم اضغط «فتح التطبيق» للدخول التلقائي دون نسخ ولصق.</p>
          <div id="mabKeyBox" class="mab-key" style="display:none;"></div>
          <button type="button" class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.generateKey()">🔑 توليد معرف الربط السري</button>
          <button type="button" id="mabCopyBtn" class="mab-btn mab-btn-outline" style="display:none;" onclick="window.MoaathArenaBridge.copyKey()">📋 نسخ المعرف يدوياً</button>
        </div>

        <div class="mab-box">
          <div class="mab-row" style="margin-top:0;">
            <strong style="color:#f3d576;">2. شحن العملات بالليرة السورية (ل.س)</strong>
            <small id="mabRateLabel" style="color:#7dd3fc;">1 عملة = 150 ل.س</small>
          </div>
          <p class="mab-small">حوّل مباشرة من رصيد محفظتك في متجر معاذ إلى عملات معاذ فوراً وبأمان تام.</p>
          <div class="mab-presets">
            <button type="button" class="mab-preset" onclick="window.MoaathArenaBridge.setSypPreset(5000)">5,000</button>
            <button type="button" class="mab-preset" onclick="window.MoaathArenaBridge.setSypPreset(10000)">10,000</button>
            <button type="button" class="mab-preset" onclick="window.MoaathArenaBridge.setSypPreset(25000)">25,000</button>
            <button type="button" class="mab-preset" onclick="window.MoaathArenaBridge.setSypPreset(50000)">50,000</button>
          </div>
          <input type="number" id="mabSypInput" class="mab-input" value="15000" min="500" step="500" placeholder="أدخل المبلغ بالليرة السورية (ل.س)" oninput="window.MoaathArenaBridge.updateSypCalc()" />
          <div id="mabSypCalc" class="mab-calc">✨ ستحصل فوراً على: 100 عملة معاذ</div>
          <button type="button" class="mab-btn mab-btn-green" onclick="window.MoaathArenaBridge.buyCoinsSYP()">💸 تحويل إلى عملات العالم</button>
        </div>

        <button type="button" id="mabOpenArenaBtn" class="mab-btn mab-btn-blue" onclick="window.MoaathArenaBridge.openArenaApp()">🚀 فتح تطبيق عالم التحديات</button>
      `);

      try {
        const info = await workerRequest('/bridge/store-info');
        if (info && info.ok) {
          latestBuyRateSYP = Number(info.buyRateSYP || 150);
          const balEl = document.getElementById('mabStoreSypBal');
          if (balEl) balEl.textContent = `رصيدك: ${Number(info.availableSyp || 0).toLocaleString()} ل.س`;
          const rateEl = document.getElementById('mabRateLabel');
          if (rateEl) rateEl.textContent = `1 عملة = ${latestBuyRateSYP.toLocaleString()} ل.س`;
          const poolEl = document.getElementById('mabPoolVal');
          if (poolEl) poolEl.textContent = Number(info.totalWeeklyPool || 0).toLocaleString();
          updateSypCalc();
        }
      } catch (_) {}
    },

    openArenaApp() {
      const targetUrl = latestGeneratedKey
        ? `${ARENA_APP_URL}?bind=${encodeURIComponent(latestGeneratedKey)}`
        : ARENA_APP_URL;
      window.open(targetUrl, '_blank');
    },

    async generateKey() {
      const box = document.getElementById('mabKeyBox');
      const copyBtn = document.getElementById('mabCopyBtn');
      const openBtn = document.getElementById('mabOpenArenaBtn');
      try {
        const res = await workerRequest('/bridge/generate-bind-key');
        if (box && res.bindKey) {
          latestGeneratedKey = String(res.bindKey);
          box.textContent = latestGeneratedKey;
          box.style.display = 'block';
          if (copyBtn) copyBtn.style.display = 'block';
          if (openBtn) openBtn.textContent = '🚀 فتح عالم التحديات والدخول التلقائي الآن';
        }
      } catch (err) {
        alert(err.message);
      }
    },

    copyKey() {
      const key = document.getElementById('mabKeyBox')?.textContent?.trim() || '';
      if (!key) return;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(key).then(() => alert('تم نسخ المعرف السري!'));
      }
    },

    async buyCoinsSYP() {
      const syp = Math.floor(Number(document.getElementById('mabSypInput')?.value || 0));
      if (!syp || syp < latestBuyRateSYP) return alert(`أقل مبلغ شحن هو ${latestBuyRateSYP} ل.س.`);
      const expectedCoins = Math.floor(syp / latestBuyRateSYP);
      if (!confirm(`هل تؤكد خصم ${syp.toLocaleString()} ل.س من محفظتك في متجر معاذ وشحن ${expectedCoins} عملة في عالم التحديات؟`)) return;
      try {
        const idempotencyKey = `topup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const res = await workerRequest('/bridge/store-to-arena', { sypAmount: syp, idempotencyKey });
        alert(`✅ ${res.message}\nرصيدك الجديد في العالم: ${res.newArenaBalance} عملة`);
        this.openCustomerModal();
      } catch (err) {
        alert(err.message);
      }
    },

    switchAdminTab(tab) {
      adminActiveTab = tab;
      this.renderAdminView();
    },

    async openAdminModal() {
      createModal('🛡️ إدارة عالم التحديات', `<p class="mab-small" style="text-align:center;">جاري تحميل بيانات السحابة...</p>`);
      try {
        adminDashboardCache = await workerRequest('/admin/dashboard');
        this.renderAdminView();
      } catch (err) {
        alert(err.message);
        closeModal();
      }
    },

    renderAdminView() {
      const data = adminDashboardCache;
      if (!data) return;
      const cfg = data.config || {};
      const pendingList = Array.isArray(data.pendingCashouts) ? data.pendingCashouts : [];
      const frozenList = Array.isArray(data.frozenPlayers) ? data.frozenPlayers : [];
      const frames = Array.isArray(data.framesCatalog) ? data.framesCatalog : [];
      const wk = data.weeklyTournaments || {};
      const sypRate = Number(cfg.usdToSypRate || 15000);

      let bodyHtml = '';
      if (adminActiveTab === 'eco') {
        const cashout100Syp = Math.round(100 * Number(cfg.coinToUsdRate || 0.01) * sypRate);
        bodyHtml = `
          <div class="mab-box">
            <div class="mab-row">
              <strong>⚙️ وضع الصيانة (زر الطوارئ)</strong>
              <input type="checkbox" id="mabKillSwitch" ${cfg.killSwitch ? 'checked' : ''} style="width:20px;height:20px;" />
            </div>
            <div class="mab-row"><span>سعر شراء العملة (ل.س):</span><input id="mabBuyRateSYP" class="mab-input" style="width:110px;" type="number" value="${esc(cfg.buyRateSYP ?? 150)}" /></div>
            <div class="mab-row"><span>سعر صرف الدولار (ل.س):</span><input id="mabUsdToSyp" class="mab-input" style="width:110px;" type="number" value="${esc(sypRate)}" /></div>
            <div class="mab-row"><span>سعر سحب العملة ($):</span><input id="mabUsdRate" class="mab-input" style="width:110px;" type="number" step="0.001" value="${esc(cfg.coinToUsdRate ?? 0.01)}" /></div>
            <div class="mab-small" style="color:#4ade80; text-align:center; margin:4px 0;">معاينة: سحب 100 عملة = ${cashout100Syp.toLocaleString()} ل.س</div>
            <div class="mab-row"><span>نقاط ترحيبية للجدد:</span><input id="mabWelcomePts" class="mab-input" style="width:110px;" type="number" value="${esc(cfg.welcomePoints ?? 0)}" /></div>
            <div class="mab-row"><span>الحد الأدنى للسحب (عملة):</span><input id="mabMinCashout" class="mab-input" style="width:110px;" type="number" value="${esc(cfg.minCashoutPts ?? 100)}" /></div>
            <div class="mab-row"><span>رسم كسر الرقم (عملة • 80% جائزة / 20% إدارة):</span><input id="mabRecordEntryCost" class="mab-input" style="width:90px;" type="number" min="1" value="${esc(cfg.recordEntryCostPts ?? 10)}" /></div>
            <div class="mab-row"><span>عمولة PvP (%):</span><input id="mabPvpEdge" class="mab-input" style="width:110px;" type="number" value="${esc(cfg.pvpHouseEdgePct ?? 10)}" /></div>
            <button type="button" class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.saveAdminConfig()">💾 حفظ إعدادات الاقتصاد والليرة</button>
          </div>
        `;
      } else if (adminActiveTab === 'weekly') {
        const wkSummaryHtml = Object.values(wk).map((w) => `
          <div class="mab-row" style="border-top:1px solid rgba(255,255,255,0.08); padding-top:5px;">
            <span>${esc(w.title)}</span>
            <span style="color:#facc15;">وعاء: ${w.poolPts} • عمولة 10%: ${w.adminShare}</span>
          </div>
        `).join('');
        const now = Date.now();
        bodyHtml = `
          <div class="mab-box">
            <div style="font-weight:800; color:#f3d576; margin-bottom:4px;">📊 ملخص الأوعية الأسبوعية</div>
            ${wkSummaryHtml}
          </div>
          <div class="mab-box">
            <div style="font-weight:800; color:#f3d576; margin-bottom:6px;">🏆 ضبط بطولة لعبة محددة</div>
            <select id="mabWkGame" class="mab-input">
              <option value="tower_match">🏰 برج التحدي اللانهائي</option>
              <option value="hill_drive">🚗 قيادة التلال 2D</option>
              <option value="cyber_shooter">🔫 ميجا شوتر 2D</option>
            </select>
            <div class="mab-row"><span>رسم الدخول (عملة):</span><input id="mabWkFee" class="mab-input" style="width:95px;" type="number" min="1" value="10" /></div>
            <div class="mab-presets" style="grid-template-columns:repeat(2,1fr);">
              <button type="button" class="mab-preset" onclick="window.MoaathArenaBridge.quickSetWeek(7)">📅 أسبوع من الآن</button>
              <button type="button" class="mab-preset" onclick="window.MoaathArenaBridge.quickSetWeek(3)">⚡ 3 أيام من الآن</button>
            </div>
            <div class="mab-row"><span>البدء:</span><input id="mabWkStart" class="mab-input" style="width:185px;" type="datetime-local" value="${formatDatetimeLocal(now)}" /></div>
            <div class="mab-row"><span>الانتهاء:</span><input id="mabWkEnd" class="mab-input" style="width:185px;" type="datetime-local" value="${formatDatetimeLocal(now + 7 * 86400000)}" /></div>
            <button type="button" class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.saveWeeklyConfig(true)">🚀 بدء دورة أسبوعية جديدة</button>
            <button type="button" class="mab-btn mab-btn-outline" onclick="window.MoaathArenaBridge.saveWeeklyConfig(false)">💾 تعديل التواريخ/الرسم</button>
            <button type="button" class="mab-btn mab-btn-green" onclick="window.MoaathArenaBridge.settleWeeklyNow()">💰 إغلاق وتوزيع جوائز اللعبة الآن</button>
          </div>
        `;
      } else if (adminActiveTab === 'frames') {
        const opts = frames.map((f) => `<option value="${esc(f.id)}">Lv.${f.level} — ${esc(f.name)} (${f.price} عملة / ${f.reqXp} XP)</option>`).join('');
        const f0 = frames[0] || { price: 15, reqXp: 50 };
        bodyHtml = `
          <div class="mab-box">
            <div style="font-weight:800; color:#f3d576; margin-bottom:6px;">🖼️ التحكم بأسعار الإطارات الـ 15</div>
            <p class="mab-small">اختر أي إطار لتعديل سعره بالعملات أو حد الـ XP المطلوب لفتحه مجاناً (ضع 0 لإلغاء إحدى الطريقتين).</p>
            <select id="mabFrameSel" class="mab-input" onchange="window.MoaathArenaBridge.onFrameSelectChange()">${opts}</select>
            <div class="mab-row"><span>السعر (عملات معاذ):</span><input id="mabFramePrice" class="mab-input" style="width:110px;" type="number" min="0" value="${f0.price}" /></div>
            <div class="mab-row"><span>الفتح المجاني (XP):</span><input id="mabFrameXp" class="mab-input" style="width:110px;" type="number" min="0" value="${f0.reqXp}" /></div>
            <button type="button" class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.saveFramePrice()">💾 حفظ تسعيرة الإطار</button>
          </div>
        `;
      } else {
        const cashoutsHtml = pendingList.length === 0
          ? '<p class="mab-small">لا توجد طلبات سحب معلقة حالياً.</p>'
          : pendingList.map((c) => {
              const ready = Date.now() >= Number(c.releaseAt || 0);
              const sypVal = Math.round(Number(c.usdAmount || 0) * sypRate);
              return `
                <div style="border-top:1px solid rgba(255,255,255,0.1); padding:8px 0;">
                  <div class="mab-row"><strong>${esc(c.phone)}</strong><span style="color:#4ade80;">${esc(c.pts)} عملة (${sypVal.toLocaleString()} ل.س)</span></div>
                  <div class="mab-small">المعادل: ${esc(c.usdAmount)}$ • تدقيق الساعة: ${ready ? '✅ جاهز' : '⏳ قيد الانتظار'}</div>
                  <div class="mab-row" style="margin-top:6px;">
                    <button type="button" class="mab-btn mab-btn-green" style="margin:0;padding:7px;" onclick="window.MoaathArenaBridge.resolveCashout('${esc(c.txId)}','approve')">اعتماد للمتجر</button>
                    <button type="button" class="mab-btn mab-btn-red" style="margin:0;padding:7px;" onclick="window.MoaathArenaBridge.resolveCashout('${esc(c.txId)}','reject')">رفض وإرجاع</button>
                  </div>
                </div>
              `;
            }).join('');

        const frozenHtml = frozenList.length === 0
          ? '<p class="mab-small">لا توجد حسابات مجمدة.</p>'
          : frozenList.map((p) => `
              <div class="mab-row" style="border-top:1px solid rgba(255,255,255,0.1); padding:6px 0;">
                <span>${esc(p.displayName)} (${esc(p.phone)}) — مخالفات: ${esc(p.flags)}</span>
                <button type="button" class="mab-btn mab-btn-outline" style="width:auto;margin:0;padding:5px 10px;" onclick="window.MoaathArenaBridge.unfreeze('${esc(p.phone)}')">فك التجميد</button>
              </div>
            `).join('');

        bodyHtml = `
          <div class="mab-box">
            <div style="font-weight:800; color:#f3d576; margin-bottom:6px;">💰 طلبات السحب المعلقة (${pendingList.length})</div>
            ${cashoutsHtml}
          </div>
          <div class="mab-box">
            <div style="font-weight:800; color:#f87171; margin-bottom:6px;">🚨 الحسابات المجمدة (${frozenList.length})</div>
            ${frozenHtml}
          </div>
        `;
      }

      createModal('🛡️ إدارة عالم التحديات (ل.س)', `
        <div class="mab-tabs">
          <button type="button" class="mab-tab ${adminActiveTab === 'eco' ? 'active' : ''}" onclick="window.MoaathArenaBridge.switchAdminTab('eco')">💰 الليرة</button>
          <button type="button" class="mab-tab ${adminActiveTab === 'weekly' ? 'active' : ''}" onclick="window.MoaathArenaBridge.switchAdminTab('weekly')">🏆 البطولات</button>
          <button type="button" class="mab-tab ${adminActiveTab === 'frames' ? 'active' : ''}" onclick="window.MoaathArenaBridge.switchAdminTab('frames')">🖼️ الإطارات</button>
          <button type="button" class="mab-tab ${adminActiveTab === 'sec' ? 'active' : ''}" onclick="window.MoaathArenaBridge.switchAdminTab('sec')">💸 السحب (${pendingList.length})</button>
        </div>
        ${bodyHtml}
      `);
    },

    quickSetWeek(days) {
      const now = Date.now();
      const s = document.getElementById('mabWkStart');
      const e = document.getElementById('mabWkEnd');
      if (s) s.value = formatDatetimeLocal(now);
      if (e) e.value = formatDatetimeLocal(now + days * 86400000);
    },

    onFrameSelectChange() {
      const id = document.getElementById('mabFrameSel')?.value;
      const f = (adminDashboardCache?.framesCatalog || []).find((x) => x.id === id);
      if (!f) return;
      const pEl = document.getElementById('mabFramePrice');
      const xEl = document.getElementById('mabFrameXp');
      if (pEl) pEl.value = f.price;
      if (xEl) xEl.value = f.reqXp;
    },

    async saveFramePrice() {
      const frameId = document.getElementById('mabFrameSel')?.value;
      const price = Number(document.getElementById('mabFramePrice')?.value || 0);
      const reqXp = Number(document.getElementById('mabFrameXp')?.value || 0);
      try {
        const res = await workerRequest('/admin/frames/config', { frameId, price, reqXp });
        alert(res.message || 'تم الحفظ.');
        this.openAdminModal();
      } catch (err) { alert(err.message); }
    },

    async saveAdminConfig() {
      try {
        const res = await workerRequest('/admin/config', {
          killSwitch: !!document.getElementById('mabKillSwitch')?.checked,
          buyRateSYP: Number(document.getElementById('mabBuyRateSYP')?.value),
          usdToSypRate: Number(document.getElementById('mabUsdToSyp')?.value),
          coinToUsdRate: Number(document.getElementById('mabUsdRate')?.value),
          welcomePoints: Number(document.getElementById('mabWelcomePts')?.value),
          minCashoutPts: Number(document.getElementById('mabMinCashout')?.value),
          pvpHouseEdgePct: Number(document.getElementById('mabPvpEdge')?.value),
          recordEntryCostPts: Number(document.getElementById('mabRecordEntryCost')?.value || 10)
        });
        alert(res.message || 'تم حفظ الإعدادات.');
        this.openAdminModal();
      } catch (err) { alert(err.message); }
    },

    async resolveCashout(txId, action) {
      if (!confirm(action === 'approve' ? 'تأكيد اعتماد السحب وإضافة الرصيد لمحفظة الزبون في المتجر؟' : 'تأكيد رفض السحب وإعادة النقاط للعالم؟')) return;
      try {
        const res = await workerRequest('/admin/cashout/resolve', { txId, action });
        alert(res.message || 'تم التنفيذ.');
        this.openAdminModal();
      } catch (err) { alert(err.message); }
    },

    async saveWeeklyConfig(resetCycle) {
      const gameId = document.getElementById('mabWkGame')?.value || 'tower_match';
      const entryFeePts = Number(document.getElementById('mabWkFee')?.value || 10);
      const sVal = document.getElementById('mabWkStart')?.value;
      const eVal = document.getElementById('mabWkEnd')?.value;
      const startAt = sVal ? new Date(sVal).getTime() : Date.now();
      const endAt = eVal ? new Date(eVal).getTime() : (startAt + 7 * 86400000);
      if (resetCycle && !confirm('هل تؤكد بدء دورة أسبوعية جديدة وتصفير لوحة هذه اللعبة؟')) return;
      try {
        const res = await workerRequest('/admin/weekly/config', { gameId, entryFeePts, startAt, endAt, resetCycle });
        alert(res.message || 'تم الحفظ.');
        this.openAdminModal();
      } catch (err) { alert(err.message); }
    },

    async settleWeeklyNow() {
      const gameId = document.getElementById('mabWkGame')?.value || 'tower_match';
      if (!confirm('تأكيد إغلاق الدورة الحالية وتوزيع الجوائز آلياً على المراكز 1 إلى 7؟')) return;
      try {
        const res = await workerRequest('/admin/weekly/settle', { gameId });
        alert(res.message || 'تم التوزيع.');
        this.openAdminModal();
      } catch (err) { alert(err.message); }
    },

    async unfreeze(phone) {
      try {
        const res = await workerRequest('/admin/player/unfreeze', { phone });
        alert(res.message || 'تم فك التجميد.');
        this.openAdminModal();
      } catch (err) { alert(err.message); }
    }
  };
})();

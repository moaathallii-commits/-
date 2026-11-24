/**
 * وحدة الجسر الآمن بين «متجر معاذ» و«عالم التحديات والمسابقات» (نسخة مستقبلية 2300)
 * المسار في مستودع متجر معاذ: moaath_arena_bridge.js
 * - إدخال شحن العملات بالليرة السورية (ل.س) مع معاينة فورية للعملات المتوقعة.
 * - إلغاء زر فتح عالم التحدي من النافذة.
 * - السياسة الأمنية: 0% تدخل للذكاء الاصطناعي في المال أو التحويلات.
 */

(function () {
  const ARENA_WORKER_URL = 'https://moaath-arena-worker.moaathallii.workers.dev';
  const DEFAULT_BUY_RATE_SYP = 150;     // قيمة العملة الواحدة بالليرة السورية (قابلة للتعديل من الإدارة)
  const DEFAULT_USD_TO_SYP = 15000;     // مرجع التحويل للمحفظة الدولية بالدولار

  function injectStyles() {
    if (document.getElementById('moaath-arena-bridge-css')) return;
    const style = document.createElement('style');
    style.id = 'moaath-arena-bridge-css';
    style.textContent = `
      @keyframes mabScan {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(220%); }
      }
      @keyframes mabPulse {
        0%, 100% { box-shadow: 0 0 12px rgba(212, 175, 55, 0.25), inset 0 0 10px rgba(37, 99, 235, 0.15); }
        50% { box-shadow: 0 0 22px rgba(56, 189, 248, 0.4), inset 0 0 14px rgba(212, 175, 55, 0.25); }
      }
      .mab-backdrop {
        position: fixed; inset: 0;
        background: radial-gradient(circle at top, rgba(29, 78, 216, 0.24), rgba(6, 11, 23, 0.94));
        backdrop-filter: blur(8px);
        z-index: 99999; display: flex; justify-content: center; align-items: center;
        padding: 14px; direction: rtl; font-family: system-ui, -apple-system, sans-serif;
      }
      .mab-modal {
        position: relative; overflow: hidden;
        background: linear-gradient(165deg, #0f1c36 0%, #091120 65%, #111827 100%);
        color: #f8fafc; width: 100%; max-width: 450px;
        max-height: 92vh; overflow-y: auto; border-radius: 22px;
        border: 1px solid rgba(212, 175, 55, 0.55); padding: 20px;
        animation: mabPulse 4s infinite ease-in-out;
      }
      .mab-modal::before {
        content: ""; position: absolute; top: 0; left: 0; width: 45%; height: 2px;
        background: linear-gradient(90deg, transparent, #38bdf8, #f3d576, transparent);
        animation: mabScan 3.5s infinite linear; pointer-events: none;
      }
      .mab-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 12px; padding-bottom: 10px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      }
      .mab-title-wrap { display: flex; flex-direction: column; gap: 2px; }
      .mab-title { color: #f3d576; font-size: 1.12rem; font-weight: 900; letter-spacing: 0.3px; }
      .mab-sub { color: #7dd3fc; font-size: 0.72rem; font-weight: 700; }
      .mab-close {
        background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(203, 213, 225, 0.25);
        color: #e2e8f0; width: 34px; height: 34px; border-radius: 50%;
        font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      .mab-hud-bar {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        margin-bottom: 12px;
      }
      .mab-hud-chip {
        background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(125, 211, 252, 0.22);
        border-radius: 12px; padding: 8px 6px; text-align: center;
      }
      .mab-hud-label { font-size: 0.68rem; color: #94a3b8; display: block; }
      .mab-hud-val { font-size: 0.82rem; font-weight: 800; color: #f3d576; margin-top: 2px; display: block; }
      .mab-box {
        position: relative;
        background: rgba(11, 18, 34, 0.88);
        border: 1px solid rgba(125, 211, 252, 0.2);
        border-radius: 16px; padding: 14px; margin-bottom: 12px;
      }
      .mab-box-gold { border-color: rgba(212, 175, 55, 0.45); }
      .mab-step-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .mab-step-title { font-weight: 800; color: #f3d576; font-size: 0.95rem; }
      .mab-tag {
        font-size: 0.68rem; padding: 2px 8px; border-radius: 999px; font-weight: 800;
        background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35);
      }
      .mab-tag-gold {
        background: rgba(212, 175, 55, 0.16); color: #f3d576; border-color: rgba(212, 175, 55, 0.45);
      }
      .mab-key {
        font-family: monospace; font-size: 1.28rem; letter-spacing: 2px;
        color: #4ade80; text-align: center; padding: 11px;
        background: #060b16; border-radius: 10px; margin: 8px 0;
        border: 1px dashed rgba(212, 175, 55, 0.75);
      }
      .mab-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 8px 0; }
      .mab-preset-btn {
        background: #0f172a; border: 1px solid rgba(148, 163, 184, 0.28);
        color: #e2e8f0; border-radius: 9px; padding: 7px 4px;
        font-size: 0.78rem; font-weight: 700; cursor: pointer;
      }
      .mab-preset-btn:hover, .mab-preset-btn.active {
        border-color: #f3d576; background: rgba(212, 175, 55, 0.18); color: #f3d576;
      }
      .mab-preview {
        display: flex; justify-content: space-between; align-items: center;
        background: rgba(22, 163, 74, 0.12); border: 1px solid rgba(74, 222, 128, 0.35);
        border-radius: 10px; padding: 8px 12px; margin: 6px 0; font-size: 0.85rem;
      }
      .mab-btn {
        width: 100%; padding: 12px; border-radius: 12px; border: none;
        font-weight: 800; font-size: 0.94rem; cursor: pointer; margin-top: 8px;
        transition: transform 0.12s ease, filter 0.15s ease;
      }
      .mab-btn:active { transform: scale(0.98); }
      .mab-btn-gold { background: linear-gradient(135deg, #f3d576, #d4af37 55%, #a17412); color: #060b16; }
      .mab-btn-green { background: linear-gradient(135deg, #22c55e, #15803d); color: #ffffff; }
      .mab-btn-red { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #ffffff; }
      .mab-btn-outline { background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(203, 213, 225, 0.35); color: #e2e8f0; }
      .mab-input {
        width: 100%; padding: 11px; border-radius: 10px;
        border: 1px solid rgba(212, 175, 55, 0.45); background: #060b16;
        color: #fff; text-align: center; font-size: 1rem; font-weight: 700; margin: 6px 0;
      }
      .mab-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.88rem; margin: 6px 0; }
      .mab-small { font-size: 0.8rem; color: #cbd5e1; line-height: 1.55; }
      .mab-footer-note {
        text-align: center; font-size: 0.72rem; color: #94a3b8; margin-top: 6px;
        padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.14);
      }
    `;
    document.head.appendChild(style);
  }

  function getCurrentStoreUserInfo() {
    let email = '';
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
      email = firebase.auth().currentUser.email || '';
    } else if (window.auth && window.auth.currentUser) {
      email = window.auth.currentUser.email || '';
    }
    const phone = email.includes('@') ? email.split('@')[0] : 'غير مسجل';
    return { email, phone };
  }

  async function getFirebaseIdToken() {
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
      return firebase.auth().currentUser.getIdToken(true);
    }
    if (window.auth && window.auth.currentUser && typeof window.auth.currentUser.getIdToken === 'function') {
      return window.auth.currentUser.getIdToken(true);
    }
    throw new Error('يرجى تسجيل الدخول في متجر معاذ أولاً.');
  }

  async function workerRequest(path, body = {}) {
    const idToken = await getFirebaseIdToken();
    const res = await fetch(`${ARENA_WORKER_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `خطأ (${data.code || res.status})`);
    return data;
  }

  function closeModal() {
    const el = document.getElementById('mab-modal-root');
    if (el) el.remove();
  }

  function createModal(title, subtitle, innerHTML) {
    injectStyles();
    closeModal();
    const root = document.createElement('div');
    root.id = 'mab-modal-root';
    root.className = 'mab-backdrop';
    root.innerHTML = `
      <div class="mab-modal">
        <div class="mab-header">
          <div class="mab-title-wrap">
            <div class="mab-title">${title}</div>
            <div class="mab-sub">${subtitle}</div>
          </div>
          <button class="mab-close" onclick="window.MoaathArenaBridge.close()">✕</button>
        </div>
        ${innerHTML}
        <div class="mab-footer-note">
          ⚡ جسر محمي حتمياً • 0% تدخل للذكاء الاصطناعي في المال أو التحويلات
        </div>
      </div>
    `;
    document.body.appendChild(root);
  }

  window.MoaathArenaBridge = {
    close: closeModal,
    buyRateSYP: DEFAULT_BUY_RATE_SYP,

    // ==================================================
    // 1. نافذة عالم التحديات المستقبلية (إدخال ل.س + بدون زر فتح التطبيق)
    // ==================================================
    openCustomerModal() {
      const userInfo = getCurrentStoreUserInfo();
      createModal(
        '⚡ بوابة عالم التحديات • 2300',
        'نظام ربط وشحن فوري مشفر مع متجر معاذ',
        `
        <div class="mab-hud-bar">
          <div class="mab-hud-chip">
            <span class="mab-hud-label">الهوية الرقمية</span>
            <span class="mab-hud-val">${userInfo.phone}</span>
          </div>
          <div class="mab-hud-chip">
            <span class="mab-hud-label">قفل الجهاز</span>
            <span class="mab-hud-val" style="color:#4ade80;">حساب واحد</span>
          </div>
          <div class="mab-hud-chip">
            <span class="mab-hud-label">عملة الشحن</span>
            <span class="mab-hud-val">ل.س SYP</span>
          </div>
        </div>

        <div class="mab-box mab-box-gold">
          <div class="mab-step-head">
            <span class="mab-step-title">1. مفتاح التفعيل المشفر (مرة واحدة)</span>
            <span class="mab-tag mab-tag-gold">SSO KEY</span>
          </div>
          <p class="mab-small">ولّد مفتاح الربط السري الخاص بحسابك وانسخه لتفعيل جهازك داخل عالم التحديات.</p>
          <div id="mabKeyBox" class="mab-key" style="display:none;"></div>
          <div id="mabExpiryHint" class="mab-small" style="display:none; color:#7dd3fc; text-align:center;">صالح للاستخدام لمرة واحدة على جهازك</div>
          <button class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.generateKey()">🔑 توليد مفتاح الربط السري</button>
          <button id="mabCopyBtn" class="mab-btn mab-btn-outline" style="display:none;" onclick="window.MoaathArenaBridge.copyKey()">📋 نسخ المفتاح</button>
        </div>

        <div class="mab-box">
          <div class="mab-step-head">
            <span class="mab-step-title">2. شحن عملات معاذ (بالليرة السورية)</span>
            <span class="mab-tag">SYP → COINS</span>
          </div>
          <p class="mab-small">أدخل المبلغ بالليرة السورية ليُخصم من رصيدك في المتجر ويُحوّل فوراً إلى عملات داخل العالم.</p>

          <div class="mab-presets">
            <button type="button" class="mab-preset-btn" onclick="window.MoaathArenaBridge.setSypPreset(1500, this)">1,500 ل.س</button>
            <button type="button" class="mab-preset-btn active" onclick="window.MoaathArenaBridge.setSypPreset(3000, this)">3,000 ل.س</button>
            <button type="button" class="mab-preset-btn" onclick="window.MoaathArenaBridge.setSypPreset(7500, this)">7,500 ل.س</button>
            <button type="button" class="mab-preset-btn" onclick="window.MoaathArenaBridge.setSypPreset(15000, this)">15,000 ل.س</button>
          </div>

          <input
            type="number"
            id="mabSypInput"
            class="mab-input"
            value="3000"
            min="100"
            step="100"
            placeholder="أدخل المبلغ بالليرة السورية (ل.س)"
            oninput="window.MoaathArenaBridge.updateCoinPreview()"
          />

          <div class="mab-preview">
            <span class="mab-small" style="color:#bbf7d0;">العملات المتوقعة:</span>
            <strong id="mabCoinPreview" style="color:#4ade80; font-size:0.95rem;">20 عملة معاذ</strong>
          </div>

          <button class="mab-btn mab-btn-green" onclick="window.MoaathArenaBridge.buyCoins()">⚡ تنفيذ الشحن بالليرة السورية</button>
        </div>
      `
      );
      this.updateCoinPreview();
    },

    setSypPreset(amount, btnEl) {
      const inp = document.getElementById('mabSypInput');
      if (inp) {
        inp.value = amount;
        document.querySelectorAll('.mab-preset-btn').forEach((b) => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        this.updateCoinPreview();
      }
    },

    updateCoinPreview() {
      const inp = document.getElementById('mabSypInput');
      const prev = document.getElementById('mabCoinPreview');
      if (!inp || !prev) return;
      const syp = Math.max(0, Number(inp.value || 0));
      const rate = Math.max(1, Number(this.buyRateSYP || DEFAULT_BUY_RATE_SYP));
      const coins = Math.floor(syp / rate);
      prev.textContent = `${coins.toLocaleString('ar-SY')} عملة معاذ`;
    },

    async generateKey() {
      try {
        const res = await workerRequest('/bridge/generate-bind-key');
        const box = document.getElementById('mabKeyBox');
        const copyBtn = document.getElementById('mabCopyBtn');
        const expHint = document.getElementById('mabExpiryHint');
        box.textContent = res.bindKey;
        box.style.display = 'block';
        copyBtn.style.display = 'block';
        if (expHint) expHint.style.display = 'block';
      } catch (err) {
        alert(err.message);
      }
    },

    copyKey() {
      const key = document.getElementById('mabKeyBox').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(key).then(() => alert('تم نسخ المفتاح السري! ألصقه في تطبيق عالم التحديات.'));
      }
    },

    async buyCoins() {
      const syp = Number(document.getElementById('mabSypInput').value);
      if (!syp || syp <= 0) return alert('أدخل مبلغاً صحيحاً بالليرة السورية.');
      if (!confirm(`تأكيد خصم ${syp.toLocaleString('ar-SY')} ل.س من رصيدك وشحنها إلى عملات في عالم التحديات؟`)) return;
      try {
        const idempotencyKey = `topup_syp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const res = await workerRequest('/bridge/store-to-arena', { sypAmount: syp, idempotencyKey });
        alert(res.message);
      } catch (err) {
        alert(err.message);
      }
    },

    // ==================================================
    // 2. لوحة إدارة عالم التحديات (مدمجة في لوحة إدارة المتجر)
    // ==================================================
    async openAdminModal() {
      createModal('🛡️ مركز قيادة عالم التحديات', 'إدارة الاقتصاد والرقابة الفورية', `<p class="mab-small" style="text-align:center;">جاري تحميل بيانات السحابة...</p>`);
      try {
        const data = await workerRequest('/admin/dashboard');
        const cfg = data.config;
        const rateSyp = Number(cfg.usdToSypRate || cfg.sypPerUsd || DEFAULT_USD_TO_SYP);
        const coinBuySyp = Number(cfg.buyRateSYP || Math.max(1, Math.round(Number(cfg.coinToUsdRate || 0.01) * rateSyp)));
        this.buyRateSYP = coinBuySyp;

        const cashoutsHtml = data.pendingCashouts.length === 0
          ? '<p class="mab-small">لا توجد طلبات سحب معلقة حالياً.</p>'
          : data.pendingCashouts.map((c) => {
              const ready = Date.now() >= Number(c.releaseAt || 0);
              return `
                <div style="border-top:1px solid rgba(255,255,255,0.1); padding:8px 0;">
                  <div class="mab-row"><strong>${c.phone}</strong><span style="color:#4ade80;">${c.pts} عملة (${c.usdAmount}$)</span></div>
                  <div class="mab-small">حالة تدقيق الساعة: ${ready ? '✅ اكتملت الساعة (جاهز)' : '⏳ قيد الانتظار'}</div>
                  <div class="mab-row" style="margin-top:6px;">
                    <button class="mab-btn mab-btn-green" style="margin:0;padding:7px;" onclick="window.MoaathArenaBridge.resolveCashout('${c.txId}','approve')">اعتماد للمتجر</button>
                    <button class="mab-btn mab-btn-red" style="margin:0;padding:7px;" onclick="window.MoaathArenaBridge.resolveCashout('${c.txId}','reject')">رفض وإرجاع</button>
                  </div>
                </div>
              `;
            }).join('');

        const frozenHtml = data.frozenPlayers.length === 0
          ? '<p class="mab-small">لا توجد حسابات مجمدة.</p>'
          : data.frozenPlayers.map((p) => `
              <div class="mab-row" style="border-top:1px solid rgba(255,255,255,0.1); padding:6px 0;">
                <span>${p.displayName} (${p.phone}) - مخالفات: ${p.flags}</span>
                <button class="mab-btn mab-btn-outline" style="width:auto;margin:0;padding:5px 10px;" onclick="window.MoaathArenaBridge.unfreeze('${p.phone}')">فك التجميد</button>
              </div>
            `).join('');

        createModal('🛡️ مركز قيادة عالم التحديات', 'إدارة الاقتصاد والرقابة الفورية', `
          <div class="mab-box">
            <div class="mab-row">
              <strong>⚙️ وضع الصيانة (زر الطوارئ)</strong>
              <input type="checkbox" id="mabKillSwitch" ${cfg.killSwitch ? 'checked' : ''} style="width:20px;height:20px;" />
            </div>
            <div class="mab-row"><span>نقاط ترحيبية للجدد:</span><input id="mabWelcomePts" class="mab-input" style="width:105px;" type="number" value="${cfg.welcomePoints}" /></div>
            <div class="mab-row"><span>الحد الأدنى للسحب:</span><input id="mabMinCashout" class="mab-input" style="width:105px;" type="number" value="${cfg.minCashoutPts}" /></div>
            <div class="mab-row"><span>عمولة PvP (%):</span><input id="mabPvpEdge" class="mab-input" style="width:105px;" type="number" value="${cfg.pvpHouseEdgePct}" /></div>
            <div class="mab-row"><span>سعر العملة (ل.س):</span><input id="mabBuyRateSyp" class="mab-input" style="width:105px;" type="number" value="${coinBuySyp}" /></div>
            <div class="mab-row"><span>مرجع الدولار (ل.س):</span><input id="mabUsdToSyp" class="mab-input" style="width:105px;" type="number" value="${rateSyp}" /></div>
            <button class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.saveAdminConfig()">💾 حفظ الإعدادات</button>
          </div>

          <div class="mab-box">
            <div style="font-weight:700; color:#f3d576; margin-bottom:6px;">💰 طلبات السحب المعلقة (${data.pendingCashouts.length})</div>
            ${cashoutsHtml}
          </div>

          <div class="mab-box">
            <div style="font-weight:700; color:#f87171; margin-bottom:6px;">🚨 الحسابات المجمدة (${data.frozenPlayers.length})</div>
            ${frozenHtml}
          </div>
        `);
      } catch (err) {
        alert(err.message);
        closeModal();
      }
    },

    async saveAdminConfig() {
      try {
        const buyRateSYP = Math.max(1, Number(document.getElementById('mabBuyRateSyp').value));
        const usdToSypRate = Math.max(1, Number(document.getElementById('mabUsdToSyp').value));
        const coinToUsdRate = Number((buyRateSYP / usdToSypRate).toFixed(6));
        this.buyRateSYP = buyRateSYP;

        const res = await workerRequest('/admin/config', {
          killSwitch: document.getElementById('mabKillSwitch').checked,
          welcomePoints: Number(document.getElementById('mabWelcomePts').value),
          minCashoutPts: Number(document.getElementById('mabMinCashout').value),
          pvpHouseEdgePct: Number(document.getElementById('mabPvpEdge').value),
          buyRateSYP,
          usdToSypRate,
          coinToUsdRate
        });
        alert(res.message);
      } catch (err) {
        alert(err.message);
      }
    },

    async resolveCashout(txId, action) {
      if (!confirm(action === 'approve' ? 'تأكيد اعتماد السحب وإضافة الدولار لمحفظة الزبون في المتجر؟' : 'تأكيد رفض السحب وإعادة النقاط للعالم؟')) return;
      try {
        const res = await workerRequest('/admin/cashout/resolve', { txId, action });
        alert(res.message);
        this.openAdminModal();
      } catch (err) {
        alert(err.message);
      }
    },

    async unfreeze(phone) {
      try {
        const res = await workerRequest('/admin/player/unfreeze', { phone });
        alert(res.message);
        this.openAdminModal();
      } catch (err) {
        alert(err.message);
      }
    }
  };
})();

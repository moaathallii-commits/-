/**
 * وحدة الجسر الآمن بين «متجر معاذ» و«عالم التحديات والمسابقات»
 * المسار في مستودع متجر معاذ: moaath_arena_bridge.js
 * المزايا:
 * 1. للزبون: توليد معرف الربط السري (MTH-XXXX-XXXX)، شحن عملات العالم من المحفظة مسبقة الدفع، وفتح تطبيق العالم المستقل.
 * 2. للإدارة (0965461504): لوحة تحكم مدمجة لإدارة زر الطوارئ، الإعدادات، اعتماد السحوبات بعد تدقيق الساعة، وفك تجميد الحسابات.
 * السياسة الأمنية: 0% تدخل للذكاء الاصطناعي في المال أو التحويلات.
 */

(function () {
  const ARENA_WORKER_URL = 'https://moaath-arena-worker.moaathallii.workers.dev';
  const ARENA_APP_URL = 'https://moaathallii-commits.github.io/moaath-arena/';

  function injectStyles() {
    if (document.getElementById('moaath-arena-bridge-css')) return;
    const style = document.createElement('style');
    style.id = 'moaath-arena-bridge-css';
    style.textContent = `
      .mab-backdrop {
        position: fixed; inset: 0; background: rgba(11, 17, 32, 0.88);
        z-index: 99999; display: flex; justify-content: center; align-items: center;
        padding: 16px; direction: rtl; font-family: system-ui, -apple-system, sans-serif;
      }
      .mab-modal {
        background: #151f32; color: #f8fafc; width: 100%; max-width: 440px;
        max-height: 90vh; overflow-y: auto; border-radius: 18px;
        border: 1px solid rgba(212, 175, 55, 0.45); padding: 20px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      }
      .mab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .mab-title { color: #f3d576; font-size: 1.1rem; font-weight: 800; }
      .mab-close { background: none; border: none; color: #cbd5e1; font-size: 1.4rem; cursor: pointer; }
      .mab-box { background: #0b1120; border: 1px solid rgba(203, 213, 225, 0.15); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
      .mab-key { font-family: monospace; font-size: 1.3rem; letter-spacing: 2px; color: #4ade80; text-align: center; padding: 10px; background: #0f172a; border-radius: 8px; margin: 8px 0; border: 1px dashed #d4af37; }
      .mab-btn { width: 100%; padding: 12px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 8px; }
      .mab-btn-gold { background: linear-gradient(135deg, #d4af37, #b48a1e); color: #0b1120; }
      .mab-btn-blue { background: #2563eb; color: #fff; }
      .mab-btn-green { background: #16a34a; color: #fff; }
      .mab-btn-red { background: #dc2626; color: #fff; }
      .mab-btn-outline { background: transparent; border: 1px solid #cbd5e1; color: #cbd5e1; }
      .mab-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.4); background: #0f172a; color: #fff; text-align: center; margin: 6px 0; }
      .mab-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.88rem; margin: 6px 0; }
      .mab-small { font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; }
    `;
    document.head.appendChild(style);
  }

  async function getFirebaseIdToken() {
    // يدعم Firebase Compat (v8) و Modular إذا كان auth متاحاً في window
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

  function createModal(title, innerHTML) {
    injectStyles();
    closeModal();
    const root = document.createElement('div');
    root.id = 'mab-modal-root';
    root.className = 'mab-backdrop';
    root.innerHTML = `
      <div class="mab-modal">
        <div class="mab-header">
          <div class="mab-title">${title}</div>
          <button class="mab-close" onclick="window.MoaathArenaBridge.close()">✕</button>
        </div>
        ${innerHTML}
      </div>
    `;
    document.body.appendChild(root);
  }

  window.MoaathArenaBridge = {
    close: closeModal,

    // ==================================================
    // 1. نافذة الزبون (توليد معرف الربط + شحن النقاط + فتح العالم)
    // ==================================================
    openCustomerModal() {
      createModal('🏆 عالم تحديات معاذ', `
        <div class="mab-box">
          <div style="font-weight:700; color:#f3d576; margin-bottom:4px;">1. ربط جهازك لأول مرة</div>
          <p class="mab-small">ولّد معرفك السري الخاص وانسخه لتسجيل الدخول في تطبيق «عالم التحديات» المستقل.</p>
          <div id="mabKeyBox" class="mab-key" style="display:none;"></div>
          <button class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.generateKey()">🔑 توليد معرف اللاعب السري</button>
          <button id="mabCopyBtn" class="mab-btn mab-btn-outline" style="display:none;" onclick="window.MoaathArenaBridge.copyKey()">📋 نسخ المعرف</button>
        </div>

        <div class="mab-box">
          <div style="font-weight:700; color:#f3d576; margin-bottom:4px;">2. شحن عملات معاذ (من محفظة المتجر)</div>
          <p class="mab-small">حوّل من رصيدك مسبق الدفع ($) إلى عملات داخل عالم التحديات فوراً وبأمان تام.</p>
          <input type="number" id="mabUsdInput" class="mab-input" value="1" min="0.5" step="0.5" placeholder="المبلغ بالدولار ($)" />
          <button class="mab-btn mab-btn-green" onclick="window.MoaathArenaBridge.buyCoins()">💸 تحويل إلى عملات العالم</button>
        </div>

        <button class="mab-btn mab-btn-blue" onclick="window.open('${ARENA_APP_URL}', '_blank')">🚀 فتح تطبيق عالم التحديات</button>
      `);
    },

    async generateKey() {
      try {
        const res = await workerRequest('/bridge/generate-bind-key');
        const box = document.getElementById('mabKeyBox');
        const copyBtn = document.getElementById('mabCopyBtn');
        box.textContent = res.bindKey;
        box.style.display = 'block';
        copyBtn.style.display = 'block';
      } catch (err) {
        alert(err.message);
      }
    },

    copyKey() {
      const key = document.getElementById('mabKeyBox').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(key).then(() => alert('تم نسخ المعرف السري! ألصقه الآن في تطبيق عالم التحديات.'));
      }
    },

    async buyCoins() {
      const usd = Number(document.getElementById('mabUsdInput').value);
      if (!usd || usd <= 0) return alert('أدخل مبلغاً صحيحاً بالدولار.');
      if (!confirm(`هل تؤكد خصم ${usd}$ من محفظتك مسبقة الدفع وشحنها كعملات في عالم التحديات؟`)) return;
      try {
        const idempotencyKey = `topup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const res = await workerRequest('/bridge/store-to-arena', { usdAmount: usd, idempotencyKey });
        alert(res.message);
      } catch (err) {
        alert(err.message);
      }
    },

    // ==================================================
    // 2. لوحة إدارة عالم التحديات (مدمجة داخل لوحة إدارة متجر معاذ)
    // ==================================================
    async openAdminModal() {
      createModal('🛡️ إدارة عالم التحديات', `<p class="mab-small" style="text-align:center;">جاري تحميل بيانات السحابة...</p>`);
      try {
        const data = await workerRequest('/admin/dashboard');
        const cfg = data.config;

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

        createModal('🛡️ إدارة عالم التحديات', `
          <div class="mab-box">
            <div class="mab-row">
              <strong>⚙️ وضع الصيانة (زر الطوارئ)</strong>
              <input type="checkbox" id="mabKillSwitch" ${cfg.killSwitch ? 'checked' : ''} style="width:20px;height:20px;" />
            </div>
            <div class="mab-row"><span>نقاط ترحيبية للجدد:</span><input id="mabWelcomePts" class="mab-input" style="width:90px;" type="number" value="${cfg.welcomePoints}" /></div>
            <div class="mab-row"><span>الحد الأدنى للسحب:</span><input id="mabMinCashout" class="mab-input" style="width:90px;" type="number" value="${cfg.minCashoutPts}" /></div>
            <div class="mab-row"><span>عمولة PvP (%):</span><input id="mabPvpEdge" class="mab-input" style="width:90px;" type="number" value="${cfg.pvpHouseEdgePct}" /></div>
            <div class="mab-row"><span>سعر العملة بالدولار:</span><input id="mabUsdRate" class="mab-input" style="width:90px;" type="number" step="0.001" value="${cfg.coinToUsdRate}" /></div>
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
        const res = await workerRequest('/admin/config', {
          killSwitch: document.getElementById('mabKillSwitch').checked,
          welcomePoints: Number(document.getElementById('mabWelcomePts').value),
          minCashoutPts: Number(document.getElementById('mabMinCashout').value),
          pvpHouseEdgePct: Number(document.getElementById('mabPvpEdge').value),
          coinToUsdRate: Number(document.getElementById('mabUsdRate').value)
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

/**
 * وحدة الجسر الآمن بين «متجر معاذ» و«عالم التحديات والمسابقات» (v1.2)
 * المسار في مستودع متجر معاذ: moaath_arena_bridge.js
 * - يعالج خطأ Failed to fetch عند الاتصال بـ Cloudflare Worker بتشخيص واضح + بديل آمن لتوليد معرف الربط محلياً عند تعذر الوصول للـ Worker
 * - يحافظ على عزل الذكاء الاصطناعي تماماً عن المال وشام كاش
 */

(function () {
  if (window.__MOAATH_ARENA_BRIDGE_V12__) return;
  window.__MOAATH_ARENA_BRIDGE_V12__ = true;

  const ARENA_WORKER_URL = 'https://moaath-arena-worker.moaathallii.workers.dev';
  const ARENA_APP_URL = 'https://moaathallii-commits.github.io/moaath-arena/';

  const esc = (s) =>
    typeof window.moaathEscapeHtml === 'function'
      ? window.moaathEscapeHtml(s)
      : String(s ?? '').replace(/[&<>"']/g, (c) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[c]));

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
      .mab-key { font-family: monospace; font-size: 1.25rem; letter-spacing: 2px; color: #4ade80; text-align: center; padding: 10px; background: #0f172a; border-radius: 8px; margin: 8px 0; border: 1px dashed #d4af37; user-select: all; }
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

  function resolveStoreSession() {
    let u = window.currentUser || null;
    if (!u || !u.phone) {
      try {
        const cached = JSON.parse(localStorage.getItem('moaath_user') || 'null');
        if (cached && cached.phone) u = cached;
      } catch (_) {}
    }
    const phone = u?.phone ? String(u.phone).trim() : '';
    const userName = u?.name ? String(u.name).trim() : '';
    return { u, phone, userName };
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

    return {
      idToken,
      phone: sess.phone,
      userName: sess.userName
    };
  }

  function buildDeterministicBindKey(phone) {
    const cleanPhone = String(phone || '0000000000').replace(/[^0-9]/g, '').slice(-10).padStart(10, '0');
    const part1 = cleanPhone.slice(-4).toUpperCase();
    const sum = cleanPhone.split('').reduce((acc, ch, idx) => acc + (parseInt(ch, 10) || 0) * (idx + 3), 19);
    const part2 = String((sum * 73) % 8999 + 1000);
    return `MTH-${part1}-${part2}`;
  }

  async function workerRequest(path, body = {}) {
    const ctx = await getAuthContext();
    const headers = { 'Content-Type': 'application/json' };
    if (ctx.idToken) headers['Authorization'] = `Bearer ${ctx.idToken}`;

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 9000) : null;

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

      if (!res.ok) {
        throw new Error(data.message || data.error || `خطأ من الخادم (${res.status})`);
      }
      return data;
    } catch (err) {
      if (timer) clearTimeout(timer);
      const msg = String(err?.message || err || '');
      if (err?.name === 'AbortError') {
        throw new Error('انتهت مهلة الاتصال بخادم عالم التحديات (Timeout). تحقق من الشبكة أو حالة Worker.');
      }
      if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
        throw new Error('تعذر الوصول إلى خادم عالم التحديات (Failed to fetch). قد يكون الخادم متوقفاً مؤقتاً أو محجوباً على الشبكة.');
      }
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
    root.addEventListener('click', (e) => {
      if (e.target === root) closeModal();
    });
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

  window.MoaathArenaBridge = {
    close: closeModal,

    openCustomerModal() {
      const sess = resolveStoreSession();
      const acctLine = sess.phone
        ? `الحساب الحالي: <b>${esc(sess.userName || 'زبون')}</b> (${esc(sess.phone)})`
        : `<span style="color:#fbbf24;">⚠️ لم يتم رصد رقم هاتف مسجل بعد — سجّل دخولك في المتجر أولاً.</span>`;

      createModal('🏆 عالم تحديات معاذ', `
        <div class="mab-small" style="margin-bottom:10px; padding:7px 10px; background:rgba(255,255,255,0.04); border-radius:8px;">${acctLine}</div>
        <div class="mab-box">
          <div style="font-weight:700; color:#f3d576; margin-bottom:4px;">1. ربط جهازك لأول مرة</div>
          <p class="mab-small">ولّد معرفك السري الخاص وانسخه لتسجيل الدخول في تطبيق «عالم التحديات» المستقل.</p>
          <div id="mabKeyBox" class="mab-key" style="display:none;"></div>
          <div id="mabKeyNote" class="mab-small" style="display:none; color:#93c5fd; margin-top:4px;"></div>
          <button type="button" class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.generateKey()">🔑 توليد معرف اللاعب السري</button>
          <button type="button" id="mabCopyBtn" class="mab-btn mab-btn-outline" style="display:none;" onclick="window.MoaathArenaBridge.copyKey()">📋 نسخ المعرف</button>
        </div>

        <div class="mab-box">
          <div style="font-weight:700; color:#f3d576; margin-bottom:4px;">2. شحن عملات معاذ (من محفظة المتجر)</div>
          <p class="mab-small">حوّل من رصيدك مسبق الدفع ($) إلى عملات داخل عالم التحديات فوراً وبأمان تام.</p>
          <input type="number" id="mabUsdInput" class="mab-input" value="1" min="0.5" step="0.5" placeholder="المبلغ بالدولار ($)" />
          <button type="button" class="mab-btn mab-btn-green" onclick="window.MoaathArenaBridge.buyCoins()">💸 تحويل إلى عملات العالم</button>
        </div>

        <button type="button" class="mab-btn mab-btn-blue" onclick="window.open('${ARENA_APP_URL}', '_blank')">🚀 فتح تطبيق عالم التحديات</button>
      `);
    },

    async generateKey() {
      const box = document.getElementById('mabKeyBox');
      const copyBtn = document.getElementById('mabCopyBtn');
      const noteEl = document.getElementById('mabKeyNote');
      try {
        const res = await workerRequest('/bridge/generate-bind-key');
        if (box && res.bindKey) {
          box.textContent = String(res.bindKey);
          box.style.display = 'block';
        }
        if (noteEl) {
          noteEl.textContent = '✅ تم التوليد والمزامنة مع خادم العالم بنجاح.';
          noteEl.style.display = 'block';
        }
        if (copyBtn) copyBtn.style.display = 'block';
      } catch (err) {
        const sess = resolveStoreSession();
        if (sess.phone && box) {
          const localKey = buildDeterministicBindKey(sess.phone);
          try { localStorage.setItem('moaath_arena_local_bind_key', localKey); } catch (_) {}
          box.textContent = localKey;
          box.style.display = 'block';
          if (copyBtn) copyBtn.style.display = 'block';
          if (noteEl) {
            noteEl.textContent = `⚠️ تعذر الاتصال بالخادم (${err.message}). تم توليد معرف محلي مرتبط برقمك (${sess.phone})؛ تأكد من نشر moaath-arena-worker على Cloudflare.`;
            noteEl.style.display = 'block';
          }
          return;
        }
        alert(err.message);
      }
    },

    copyKey() {
      const box = document.getElementById('mabKeyBox');
      const key = box ? box.textContent.trim() : '';
      if (!key) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(key).then(() => alert('تم نسخ المعرف السري! ألصقه الآن في تطبيق عالم التحديات.'));
      }
    },

    async buyCoins() {
      const usd = Number(document.getElementById('mabUsdInput')?.value);
      if (!usd || usd <= 0) return alert('أدخل مبلغاً صحيحاً بالدولار.');
      if (!confirm(`هل تؤكد خصم ${usd}$ من محفظتك مسبقة الدفع وشحنها كعملات في عالم التحديات؟`)) return;
      try {
        const idempotencyKey = `topup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const res = await workerRequest('/bridge/store-to-arena', { usdAmount: usd, idempotencyKey });
        alert(res.message || 'تم الشحن بنجاح.');
      } catch (err) {
        alert(err.message);
      }
    },

    async openAdminModal() {
      createModal('🛡️ إدارة عالم التحديات', `<p class="mab-small" style="text-align:center;">جاري تحميل بيانات السحابة...</p>`);
      try {
        const data = await workerRequest('/admin/dashboard');
        const cfg = data.config || {};
        const pendingList = Array.isArray(data.pendingCashouts) ? data.pendingCashouts : [];
        const frozenList = Array.isArray(data.frozenPlayers) ? data.frozenPlayers : [];

        const cashoutsHtml = pendingList.length === 0
          ? '<p class="mab-small">لا توجد طلبات سحب معلقة حالياً.</p>'
          : pendingList.map((c) => {
              const ready = Date.now() >= Number(c.releaseAt || 0);
              return `
                <div style="border-top:1px solid rgba(255,255,255,0.1); padding:8px 0;">
                  <div class="mab-row"><strong>${esc(c.phone)}</strong><span style="color:#4ade80;">${esc(c.pts)} عملة (${esc(c.usdAmount)}$)</span></div>
                  <div class="mab-small">حالة تدقيق الساعة: ${ready ? '✅ اكتملت الساعة (جاهز)' : '⏳ قيد الانتظار'}</div>
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
                <span>${esc(p.displayName)} (${esc(p.phone)}) - مخالفات: ${esc(p.flags)}</span>
                <button type="button" class="mab-btn mab-btn-outline" style="width:auto;margin:0;padding:5px 10px;" onclick="window.MoaathArenaBridge.unfreeze('${esc(p.phone)}')">فك التجميد</button>
              </div>
            `).join('');

        createModal('🛡️ إدارة عالم التحديات', `
          <div class="mab-box">
            <div class="mab-row">
              <strong>⚙️ وضع الصيانة (زر الطوارئ)</strong>
              <input type="checkbox" id="mabKillSwitch" ${cfg.killSwitch ? 'checked' : ''} style="width:20px;height:20px;" />
            </div>
            <div class="mab-row"><span>نقاط ترحيبية للجدد:</span><input id="mabWelcomePts" class="mab-input" style="width:90px;" type="number" value="${esc(cfg.welcomePoints ?? 0)}" /></div>
            <div class="mab-row"><span>الحد الأدنى للسحب:</span><input id="mabMinCashout" class="mab-input" style="width:90px;" type="number" value="${esc(cfg.minCashoutPts ?? 0)}" /></div>
            <div class="mab-row"><span>عمولة PvP (%):</span><input id="mabPvpEdge" class="mab-input" style="width:90px;" type="number" value="${esc(cfg.pvpHouseEdgePct ?? 0)}" /></div>
            <div class="mab-row"><span>سعر العملة بالدولار:</span><input id="mabUsdRate" class="mab-input" style="width:90px;" type="number" step="0.001" value="${esc(cfg.coinToUsdRate ?? 0)}" /></div>
            <button type="button" class="mab-btn mab-btn-gold" onclick="window.MoaathArenaBridge.saveAdminConfig()">💾 حفظ الإعدادات</button>
          </div>

          <div class="mab-box">
            <div style="font-weight:700; color:#f3d576; margin-bottom:6px;">💰 طلبات السحب المعلقة (${pendingList.length})</div>
            ${cashoutsHtml}
          </div>

          <div class="mab-box">
            <div style="font-weight:700; color:#f87171; margin-bottom:6px;">🚨 الحسابات المجمدة (${frozenList.length})</div>
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
          killSwitch: !!document.getElementById('mabKillSwitch')?.checked,
          welcomePoints: Number(document.getElementById('mabWelcomePts')?.value),
          minCashoutPts: Number(document.getElementById('mabMinCashout')?.value),
          pvpHouseEdgePct: Number(document.getElementById('mabPvpEdge')?.value),
          coinToUsdRate: Number(document.getElementById('mabUsdRate')?.value)
        });
        alert(res.message || 'تم حفظ الإعدادات.');
      } catch (err) {
        alert(err.message);
      }
    },

    async resolveCashout(txId, action) {
      if (!confirm(action === 'approve' ? 'تأكيد اعتماد السحب وإضافة الدولار لمحفظة الزبون في المتجر؟' : 'تأكيد رفض السحب وإعادة النقاط للعالم؟')) return;
      try {
        const res = await workerRequest('/admin/cashout/resolve', { txId, action });
        alert(res.message || 'تم تنفيذ الإجراء.');
        this.openAdminModal();
      } catch (err) {
        alert(err.message);
      }
    },

    async unfreeze(phone) {
      try {
        const res = await workerRequest('/admin/player/unfreeze', { phone });
        alert(res.message || 'تم فك التجميد.');
        this.openAdminModal();
      } catch (err) {
        alert(err.message);
      }
    }
  };
})();

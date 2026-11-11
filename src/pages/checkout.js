import { mountLayout, VND, esc, $, $$, toast } from '../layout.js';
import { occasions, slots, templateComparison } from '../lib/catalogue.js';
import { getState, update, log, modeLabel } from '../lib/store.js';
import { subtotal } from '../lib/engine.js';
import { solarToLunar } from '../lib/lunar.js';
import { orderSummary } from '../components.js';

mountLayout('shop');

let done = null;
let score = 5;
let savedToCalendar = false;

const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function field(id, label, type, value, extra = '') {
  return `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${extra}><span class="err" id="e-${id}"></span>${id === 'date' ? '<span class="muted" id="dateLunarHint" style="font-size:12.5px;margin-top:2px"></span>' : ''}</div>`;
}

function formView() {
  const s = getState();
  const d = s.delivery;
  const prof = s.profile || {};

  if (!s.cart.length) {
    return `<div class="panel">
      <h2>Checkout</h2>
      <div class="empty">Giỏ hàng trống. <a href="mua-le.html" class="link-green">Bắt đầu chuẩn bị →</a></div>
    </div>`;
  }

  return `<div class="panel">
    <span class="kicker">Checkout</span>
    <h2 style="margin-top:8px">Thông tin nhận hàng</h2>
    <div class="panel-intro">Đơn hàng thử nghiệm cho dự án E-Business — không thu tiền thật.</div>

    <form id="f" novalidate>
      <div class="field-row">
        ${field('name', 'Họ và tên', 'text', d.name || prof.displayName || '', 'autocomplete="name"')}
        ${field('phone', 'Số điện thoại', 'tel', d.phone || '0912345678', 'autocomplete="tel" placeholder="09xxxxxxxx"')}
      </div>
      ${field('address', 'Địa chỉ nhận hàng', 'text', d.address || prof.defaultDistrict || '', 'autocomplete="street-address"')}
      <div class="field-row">
        ${field('date', 'Ngày nhận', 'date', d.date || today(), `min="${today()}"`)}
        <div class="field">
          <label for="slot">Khung giờ</label>
          <select id="slot">
            ${slots.map((t) => `<option value="${esc(t)}" ${d.slot === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="note">Ghi chú</label>
        <textarea id="note" placeholder="Ví dụ: gọi trước khi giao">${esc(d.note)}</textarea>
      </div>

      <div class="footer-actions">
        <a class="btn ghost" href="gio-hang.html">Quay lại</a>
        <button class="btn" type="submit">Xác nhận đơn hàng</button>
      </div>
    </form>
  </div>`;
}

function validate() {
  const v = Object.fromEntries(['name', 'phone', 'address', 'date', 'note'].map((k) => [k, $('#' + k).value.trim()]));
  v.slot = $('#slot').value;
  const err = {};
  if (v.name.length < 2) err.name = 'Vui lòng nhập họ tên.';
  if (!/^(0|\+84)\d{9}$/.test(v.phone.replace(/[\s.-]/g, ''))) err.phone = 'Số điện thoại chưa hợp lệ.';
  if (v.address.length < 5) err.address = 'Vui lòng nhập địa chỉ.';
  if (!v.date) err.date = 'Vui lòng chọn ngày nhận.';
  else if (v.date < today()) err.date = 'Ngày nhận không hợp lệ.';
  return { v, err };
}

function successView() {
  const o = done;
  return `<div class="panel" style="max-width:620px;margin:0 auto;text-align:center">
    <div style="font-size:48px">✅</div>
    <span class="kicker">Đặt hàng thử thành công</span>
    <h2 style="margin-top:10px">Đơn hàng của bạn đã được ghi nhận</h2>
    <p class="muted">Mã đơn: <strong>${esc(o.id)}</strong> · Không phát sinh thanh toán thật.</p>

    <div class="card" style="margin:18px auto;text-align:left">
      <div class="summary-line"><span>Dịp lễ</span><strong>${esc(o.label)}</strong></div>
      <div class="summary-line"><span>Số món đặt mua</span><strong>${o.items.reduce((a, b) => a + b.qty, 0)} món</strong></div>
      <div class="summary-line"><span>Tổng tiền</span><strong class="price">${VND(o.total)}</strong></div>
      <div class="summary-line"><span>Khung giờ giao</span><strong>${esc(o.delivery.date)} · ${esc(o.delivery.slot)}</strong></div>
    </div>

    <div style="text-align:left;margin:18px 0">
      <h3 style="font-size:15px;margin-bottom:6px">Trải nghiệm chuẩn bị có dễ dàng không? (1–5)</h3>
      <div class="score" role="group" aria-label="Điểm dễ dùng 1 đến 5">
        ${[1, 2, 3, 4, 5]
          .map((n) => `<button type="button" data-score="${n}" class="${score === n ? 'on' : ''}">${n}</button>`)
          .join('')}
      </div>
      <div class="field" style="margin-top:10px">
        <input id="fb" type="text" maxlength="300" placeholder="Góp ý ngắn (tùy chọn)...">
      </div>
      <div class="inline-actions">
        <button type="button" class="btn small secondary" id="sendFb">Gửi góp ý</button>
        <button type="button" class="btn small ghost" id="btnSaveCal" ${savedToCalendar ? 'disabled' : ''}>
          ${savedToCalendar ? '✓ Đã lưu vào Lịch gia đình' : '📅 Lưu dịp này vào Lịch gia đình'}
        </button>
        <span id="fbOk" class="muted" style="font-size:13px"></span>
      </div>
    </div>

    <div class="inline-actions" style="justify-content:center;margin-top:20px">
      <a class="btn" href="index.html">Về trang chủ</a>
      <a class="btn secondary" href="tai-khoan.html">Xem đơn đã đặt</a>
    </div>
  </div>`;
}

function render() {
  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap ${done ? '' : 'shop-layout'}"><div>${done ? successView() : formView()}</div>${done ? '' : orderSummary({ cta: false })}</div></section>`;

  if (done) {
    $$('[data-score]').forEach((b) =>
      b.addEventListener('click', () => {
        score = Number(b.dataset.score);
        const t = $('#fb')?.value;
        render();
        if ($('#fb')) $('#fb').value = t || '';
      })
    );

    $('#sendFb')?.addEventListener('click', () => {
      const comment = ($('#fb')?.value || '').trim().slice(0, 300);
      update((s) => ({
        feedback: [
          { id: 'fb_' + Date.now(), orderId: done.id, score, comment, ts: new Date().toISOString() },
          ...s.feedback,
        ],
      }));
      log('ease_score', { score, orderId: done.id });
      $('#sendFb').disabled = true;
      $('#fbOk').textContent = 'Cảm ơn bạn!';
    });

    $('#btnSaveCal')?.addEventListener('click', () => {
      const [yy, mm, dd] = (done.delivery.date || today()).split('-').map(Number);
      const lun = solarToLunar(dd || 15, mm || 8, yy || 2026);
      const newEv = {
        id: 'ev_' + Date.now(),
        name: `${occasions[done.occasion]?.shortName || 'Dịp lễ'} gia đình`,
        calendar: 'lunar',
        day: lun.day,
        month: lun.month,
        leap: lun.leap,
        remind: 7,
        occasion: done.occasion,
        lastOrderId: done.id,
        createdAt: new Date().toISOString(),
      };
      update((s) => ({ events: [newEv, ...s.events] }));
      savedToCalendar = true;
      toast('Đã lưu vào Lịch gia đình');
      render();
    });
    return;
  }

  const f = $('#f');
  if (!f) return;

  const updateLunarDateHint = () => {
    const el = $('#date');
    const hint = $('#dateLunarHint');
    if (!el || !hint) return;
    const v = el.value;
    if (!v) { hint.textContent = ''; return; }
    const [y, m, d] = v.split('-').map(Number);
    if (!y) return;
    const lun = solarToLunar(d, m, y);
    hint.textContent = `📅 Tức ngày ${lun.day}/${lun.month}${lun.leap ? ' (nhuận)' : ''}/${lun.year} Âm lịch`;
  };
  $('#date')?.addEventListener('change', updateLunarDateHint);
  $('#date')?.addEventListener('input', updateLunarDateHint);
  updateLunarDateHint();

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const { v, err } = validate();
    ['name', 'phone', 'address', 'date'].forEach((k) => {
      $('#e-' + k).textContent = err[k] || '';
    });
    if (Object.keys(err).length) {
      $('#' + Object.keys(err)[0]).focus();
      return;
    }

    const s = getState();
    const cmp = templateComparison(s.occasion, s.mode, s.inventory);
    const durationMs = Math.max(12000, Date.now() - (s.startedAt || Date.now() - 85000));

    done = {
      id: 'KT-' + Date.now().toString().slice(-6),
      ts: new Date().toISOString(),
      occasion: s.occasion,
      mode: s.mode,
      label: modeLabel(),
      inventory: [...s.inventory],
      items: s.cart.map((c) => ({ ...c })),
      total: subtotal(s.cart),
      savedAmount: cmp.ownedSavings,
      budget: s.budget,
      timeOnTaskMs: durationMs,
      delivery: v,
    };

    update({
      history: [done, ...s.history].slice(0, 50),
      cart: [],
      recSig: '',
      delivery: v,
      profile: {
        ...s.profile,
        displayName: v.name,
        defaultDistrict: v.address,
        defaultSlot: v.slot,
      },
    });
    log('test_order_completed', { id: done.id, total: done.total });
    render();
    window.scrollTo({ top: 0 });
  });
}

render();

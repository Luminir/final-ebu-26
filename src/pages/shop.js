import { mountLayout, VND, esc, $, $$, qs, toast } from '../layout.js';
import {
  occasions,
  modes,
  products,
  inventoryItems,
  dryHouseholdItems,
  slots,
  productById,
} from '../lib/catalogue.js';
import { getState, update, ensureRecommendation, log } from '../lib/store.js';
import { setQty, budgetStatus } from '../lib/engine.js';
import { orderSummary, ownedList } from '../components.js';

mountLayout('shop');

let step = Math.min(4, Math.max(1, Number(qs('step')) || 1));
const labels = ['Dịp lễ', 'Đồ đã có', 'Phần còn thiếu', 'Giao hàng'];

const renderSteps = (cur) =>
  `<div class="stepbar" aria-label="Các bước chuẩn bị">${labels
    .map(
      (t, i) =>
        `<button type="button" class="stepchip ${i + 1 < cur ? 'done' : ''} ${i + 1 === cur ? 'active' : ''}" data-goto-step="${i + 1}">${i + 1}. ${t}</button>`
    )
    .join('')}</div>`;

const minDate = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function step1(s) {
  return `<div class="panel">
    ${renderSteps(1)}
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap">
      <h2>Chuẩn bị cho dịp nào?</h2>
      <a href="ai-goi-y.html" class="link-green" style="font-size:13.5px">✨ Nhập nhanh bằng AI →</a>
    </div>
    <div class="panel-intro">Chọn dịp lễ và mức chuẩn bị để bắt đầu.</div>

    <div class="card-grid">
      ${Object.entries(occasions)
        .map(
          ([id, o]) => `
        <button type="button" class="card occasion-card ${s.occasion === id ? 'active' : ''}" data-occ="${id}">
          <div>
            <div class="icon">${o.emoji}</div>
            <h3>${esc(o.shortName || o.name)}</h3>
            <p>${esc(o.desc)}</p>
          </div>
        </button>`
        )
        .join('')}
    </div>

    <div class="mode-row">
      ${Object.entries(modes)
        .map(
          ([id, m]) => `
        <button type="button" class="mode-card ${s.mode === id ? 'active' : ''}" data-mode="${id}">
          <b>${m.no}</b>
          <h3>${esc(m.short || m.name)}</h3>
          <p>${esc(m.desc)}</p>
        </button>`
        )
        .join('')}
    </div>

    <div class="field" style="margin-top:18px;max-width:300px;margin-bottom:0">
      <label for="budget">Ngân sách dự kiến (đ)</label>
      <input id="budget" type="number" min="0" step="10000" value="${s.budget || ''}" placeholder="400000">
    </div>

    <div class="footer-actions">
      <span></span>
      <button type="button" class="btn" id="next">Tiếp tục</button>
    </div>
  </div>`;
}

function step2(s) {
  return `<div class="panel">
    ${renderSteps(2)}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div>
        <h2>Nhà mình đã có gì?</h2>
        <div class="panel-intro" style="margin-bottom:12px">Tick những món nhà đã có sẵn. Hệ thống chỉ gợi ý phần còn thiếu.</div>
      </div>
      <button type="button" class="btn small ghost" id="btnCheckDry">Chọn nhanh: Nhang, Nến, Gạo, Muối</button>
    </div>

    <div class="check-grid">
      ${inventoryItems
        .map(productById)
        .filter(Boolean)
        .map(
          (p) => `
        <label class="check-item ${s.inventory.includes(p.id) ? 'checked' : ''}">
          <input type="checkbox" data-own="${p.id}" ${s.inventory.includes(p.id) ? 'checked' : ''}>
          <span class="emoji">${p.emoji}</span>
          <div class="check-item-text">
            <strong>${esc(p.name)}</strong>
            <div class="muted" style="font-size:12.5px">${esc(p.unit)}</div>
          </div>
        </label>`
        )
        .join('')}
    </div>

    <div class="note" style="margin-top:16px">
      Đã có: <strong>${esc(ownedList())}</strong>
    </div>

    <div class="footer-actions">
      <button type="button" class="btn ghost" id="back">Quay lại</button>
      <button type="button" class="btn" id="next">Xem gợi ý</button>
    </div>
  </div>`;
}

function step3(s) {
  const b = budgetStatus(s.cart, s.budget);
  const addable = products.filter((p) => !s.cart.find((x) => x.id === p.id)).slice(0, 8);
  const occName = occasions[s.occasion]?.shortName || occasions[s.occasion]?.name;
  const modeName = modes[s.mode]?.name;

  return `<div class="panel">
    ${renderSteps(3)}
    <h2>${esc(occName)} · ${esc(modeName)}</h2>
    <div class="panel-intro">Điều chỉnh danh sách, thêm bớt món và theo dõi tổng tiền theo thời gian thực.</div>

    ${
      s.inventory.length
        ? `<div class="note" style="margin-top:0">Đã bỏ qua vì nhà đã có: <strong>${esc(ownedList())}</strong></div>`
        : ''
    }

    ${
      s.cart.length
        ? `<div class="product-list">${s.cart.map((it) => row(it)).join('')}</div>`
        : `<div class="empty">Chưa có sản phẩm nào trong giỏ. Bạn có thể thêm từ danh mục bên dưới.</div>`
    }

    <div class="inline-actions" style="margin-top:16px">
      ${addable
        .map(
          (p) =>
            `<button type="button" class="btn small ghost" data-add="${p.id}">+ ${esc(p.name)}</button>`
        )
        .join('')}
    </div>

    ${
      b.over
        ? `<div class="warn" role="alert">
            Tổng hiện tại đang vượt ngân sách ${VND(b.diff)}. Bạn có thể giảm số lượng hoặc bỏ bớt món.
          </div>`
        : ''
    }

    <div class="footer-actions">
      <button type="button" class="btn ghost" id="back">Quay lại</button>
      <button type="button" class="btn" id="next">Chọn giao hàng</button>
    </div>
  </div>`;
}

function row(it) {
  const p = productById(it.id);
  return `<div class="product-row">
    <a href="#" data-quick-view="${p.id}" class="ico" style="background:${p.tone}">${p.emoji}</a>
    <div>
      <strong><a href="#" data-quick-view="${p.id}">${esc(p.name)}</a></strong>
      <small>${esc(p.tag)} · ${VND(p.price)}/${esc(p.unit)}</small>
      <div class="qty">
        <button type="button" data-qty="${p.id}" data-d="-1" aria-label="Giảm ${esc(p.name)}">−</button>
        <span>${it.qty}</span>
        <button type="button" data-qty="${p.id}" data-d="1" aria-label="Tăng ${esc(p.name)}">+</button>
      </div>
    </div>
    <div class="price-col">
      <div class="price">${VND(p.price * it.qty)}</div>
      <button type="button" class="link" data-rm="${p.id}">Bỏ món</button>
    </div>
  </div>`;
}

function step4(s) {
  const d = s.delivery;
  return `<div class="panel">
    ${renderSteps(4)}
    <h2>Giao hàng</h2>
    <div class="panel-intro">Chọn ngày nhận và khung giờ giao dự kiến.</div>

    <div class="field-row">
      <div class="field">
        <label for="date">Ngày nhận</label>
        <input id="date" type="date" min="${minDate()}" value="${esc(d.date || minDate())}">
      </div>
      <div class="field">
        <label for="slot">Khung giờ</label>
        <select id="slot">
          ${slots.map((t) => `<option value="${esc(t)}" ${d.slot === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="footer-actions">
      <button type="button" class="btn ghost" id="back">Quay lại</button>
      <a class="btn" href="thanh-toan.html">Đến checkout</a>
    </div>
  </div>`;
}

function render() {
  const s = getState();
  if (step === 2) log('checklist_viewed', { occasion: s.occasion });
  const views = [step1, step2, step3, step4];
  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap shop-layout"><div>${views[step - 1](s)}</div>${orderSummary()}</div></section>`;
  bind();
}

function go(n) {
  if (n < step) {
    update((s) => ({ backtrackCount: (s.backtrackCount || 0) + 1 }));
  }
  step = n;
  history.replaceState(null, '', `?step=${n}`);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bind() {
  $$('[data-goto-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = Number(b.dataset.gotoStep);
      if (target === 3) ensureRecommendation();
      go(target);
    })
  );

  $$('[data-occ]').forEach((b) =>
    b.addEventListener('click', () => {
      update({ occasion: b.dataset.occ });
      log('occasion_selected', { occasion: b.dataset.occ });
      render();
    })
  );
  $$('[data-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      update({ mode: b.dataset.mode });
      render();
    })
  );
  $('#budget')?.addEventListener('change', (e) => {
    update({ budget: Math.max(0, Number(e.target.value) || 0) });
    render();
  });

  $$('[data-own]').forEach((c) =>
    c.addEventListener('change', () => {
      const id = c.dataset.own;
      const inv = getState().inventory;
      update({ inventory: c.checked ? [...new Set([...inv, id])] : inv.filter((x) => x !== id) });
      render();
      $(`[data-own="${id}"]`)?.focus();
    })
  );
  $('#btnCheckDry')?.addEventListener('click', () => {
    const inv = getState().inventory;
    update({ inventory: [...new Set([...inv, ...dryHouseholdItems])] });
    toast('Đã chọn Nhang, Nến, Gạo, Muối, Trà');
    render();
  });

  $$('[data-qty]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.qty;
      const cur = getState().cart.find((x) => x.id === id)?.qty || 0;
      update({ cart: setQty(getState().cart, id, cur + Number(b.dataset.d)) });
      render();
    })
  );
  $$('[data-rm]').forEach((b) =>
    b.addEventListener('click', () => {
      update({ cart: setQty(getState().cart, b.dataset.rm, 0) });
      render();
    })
  );
  $$('[data-add]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.add;
      const cur = getState().cart.find((x) => x.id === id)?.qty || 0;
      update({ cart: setQty(getState().cart, id, cur + 1) });
      log('item_added', { id });
      render();
    })
  );

  $('#date')?.addEventListener('change', (e) => {
    update((s) => ({ delivery: { ...s.delivery, date: e.target.value } }));
    render();
  });
  $('#slot')?.addEventListener('change', (e) => {
    update((s) => ({ delivery: { ...s.delivery, slot: e.target.value } }));
    render();
  });

  $('#back')?.addEventListener('click', () => go(step - 1));
  $('#next')?.addEventListener('click', () => {
    if (step === 1) {
      log('flow_start', { mode: getState().mode });
      return go(2);
    }
    if (step === 2) {
      log('checklist_completed', { ownedCount: getState().inventory.length });
      ensureRecommendation();
      return go(3);
    }
    if (step === 3) {
      if (!getState().delivery.date) {
        update((s) => ({ delivery: { ...s.delivery, date: minDate() } }));
      }
      return go(4);
    }
  });
}

if (step === 3) ensureRecommendation();
render();
